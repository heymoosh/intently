// reminders — Supabase Edge Function (Deno runtime).
//
// Purpose: take a voice transcript ("remind me to call the dentist Tuesday"),
// classify it into {text, remind_on} via Anthropic Haiku, and insert into
// public.reminders. Also exposes a /due read endpoint used by daily-brief
// input assembly to pull pending reminders.
//
// Auth model:
//   Both endpoints require an `Authorization: Bearer <user-jwt>` header. The
//   JWT is forwarded to PostgREST as the user, so RLS policies from migration
//   0003_reminders.sql (auth.uid() = user_id) attribute writes/reads to the
//   actual caller. The `apikey` header carries the project's publishable
//   (anon) key, NOT the service-role key — service-role bypasses RLS, which
//   is exactly the bug we just fixed (silent data loss into the wrong owner).
//
// Date handling:
//   /classify-and-store accepts an optional `today` field (YYYY-MM-DD) in the
//   request body so the frontend can supply user-local-today. Falls back to
//   server UTC only when the field is absent (graceful degradation for
//   non-frontend callers; not user-correct for any user west of UTC during
//   their evening hours).
//
// Endpoints:
//   POST /functions/v1/reminders/classify-and-store
//        body: { transcript: string, today?: "YYYY-MM-DD" }
//   GET  /functions/v1/reminders/due?date=YYYY-MM-DD
//
// CORS: mirrors ma-proxy (Access-Control-Allow-Origin: *). Lock down
// post-hackathon.

// deno-lint-ignore-file no-explicit-any

// Sentry error monitoring — no-op when SENTRY_DSN is unset.
import * as Sentry from 'https://esm.sh/@sentry/deno@8';

const _sentryDsn = Deno.env.get('SENTRY_DSN');
if (_sentryDsn) {
  Sentry.init({
    dsn: _sentryDsn,
    // V1: errors only — no performance or replay.
    tracesSampleRate: 0,
  });
}

const ANTHROPIC_API_BASE = 'https://api.anthropic.com';
const ANTHROPIC_MODEL = 'claude-haiku-4-5-20251001';

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

function errResp(status: number, message: string, detail?: unknown) {
  return json({ error: { message, detail } }, status);
}

// ---------- auth ----------

// Extract the Bearer token from the Authorization header. Returns the raw
// JWT string on success, null on missing/malformed. We don't crypto-verify
// here — PostgREST will reject invalid signatures downstream and the only
// thing the function needs to enforce is "the caller must be authenticated"
// (i.e., they cannot fall back to anonymous service-role writes).
function extractBearerToken(req: Request): string | null {
  const header = req.headers.get('Authorization') || req.headers.get('authorization');
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  if (!match) return null;
  const token = match[1].trim();
  return token.length > 0 ? token : null;
}

// ---------- classification ----------

type Classification =
  | { classified: true; text: string; remind_on: string }
  | { classified: false; reason: string };

// Tight prompt — 15-line cap (see task spec). Injects today's date so Claude
// can resolve "Tuesday" / "next week" / etc. Asks for strict JSON output.
function buildClassifyPrompt(transcript: string, today: string): string {
  return [
    `Today is ${today}. The user said: "${transcript}"`,
    '',
    'If this is a reminder with a clear action and a resolvable date, respond with JSON:',
    '{"classified": true, "text": "<short imperative>", "remind_on": "YYYY-MM-DD"}',
    '',
    'Otherwise respond with JSON:',
    '{"classified": false, "reason": "<one-line why not>"}',
    '',
    'Rules:',
    '- text should be a short imperative like "Call the dentist" — no leading "remind me to".',
    '- remind_on must be an ISO date (YYYY-MM-DD). Resolve relative dates against today.',
    '- If no date is given or implied, return classified: false.',
    '- Output ONLY the JSON object, no prose, no code fences.',
  ].join('\n');
}

async function classifyTranscript(
  apiKey: string,
  transcript: string,
  today: string,
): Promise<Classification> {
  const res = await fetch(`${ANTHROPIC_API_BASE}/v1/messages`, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 256,
      messages: [{ role: 'user', content: buildClassifyPrompt(transcript, today) }],
    }),
  });

  if (!res.ok) {
    const detail = await safeReadBody(res);
    throw new Error(`anthropic ${res.status}: ${JSON.stringify(detail)}`);
  }

  const data = (await res.json()) as any;
  const textBlock = Array.isArray(data?.content)
    ? data.content.find((b: any) => b?.type === 'text')
    : null;
  const raw = textBlock?.text ?? '';

  let parsed: any;
  try {
    // Strip accidental code fences just in case.
    const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '');
    parsed = JSON.parse(cleaned);
  } catch {
    return { classified: false, reason: 'model did not return valid JSON' };
  }

  if (parsed?.classified === true) {
    if (typeof parsed.text !== 'string' || typeof parsed.remind_on !== 'string') {
      return { classified: false, reason: 'model JSON missing text or remind_on' };
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(parsed.remind_on)) {
      return { classified: false, reason: 'remind_on not in YYYY-MM-DD format' };
    }
    return { classified: true, text: parsed.text, remind_on: parsed.remind_on };
  }

  return {
    classified: false,
    reason: typeof parsed?.reason === 'string' ? parsed.reason : 'not a reminder',
  };
}

// ---------- PostgREST (JWT-passthrough; RLS evaluates auth.uid()) ----------

// PostgREST requires BOTH headers:
//   - apikey: the project's publishable (anon) key — identifies the project
//   - Authorization: Bearer <user-jwt> — identifies the user, drives auth.uid()
// If apikey is the service-role key, RLS bypasses regardless of Authorization,
// which would silently re-introduce the bug. Always anon for apikey here.
function userScopedHeaders(anonKey: string, userJwt: string): Record<string, string> {
  return {
    apikey: anonKey,
    Authorization: `Bearer ${userJwt}`,
    'Content-Type': 'application/json',
  };
}

async function insertReminder(
  supabaseUrl: string,
  anonKey: string,
  userJwt: string,
  text: string,
  remindOn: string,
): Promise<Record<string, unknown>> {
  // No user_id in the body — RLS WITH CHECK (auth.uid() = user_id) is enforced
  // server-side; we let Postgres derive user_id from the JWT via a default or
  // we send it explicitly. Migration 0003 has user_id as NOT NULL with no
  // default, so we must send it. Pull it from the JWT payload.
  const userId = parseSubFromJwt(userJwt);
  if (!userId) {
    throw new Error('jwt payload missing sub (user id)');
  }

  const res = await fetch(`${supabaseUrl}/rest/v1/reminders`, {
    method: 'POST',
    headers: {
      ...userScopedHeaders(anonKey, userJwt),
      Prefer: 'return=representation',
    },
    body: JSON.stringify({ user_id: userId, text, remind_on: remindOn }),
  });
  if (!res.ok) {
    const detail = await safeReadBody(res);
    throw new Error(`postgrest insert ${res.status}: ${JSON.stringify(detail)}`);
  }
  const rows = (await res.json()) as any[];
  return rows?.[0] ?? {};
}

async function fetchDueReminders(
  supabaseUrl: string,
  anonKey: string,
  userJwt: string,
  date: string,
): Promise<unknown[]> {
  // Pending + remind_on <= date. PostgREST filters: status=eq.pending, remind_on=lte.<date>.
  // RLS scopes the result set to auth.uid() = user_id automatically.
  const url = new URL(`${supabaseUrl}/rest/v1/reminders`);
  url.searchParams.set('status', 'eq.pending');
  url.searchParams.set('remind_on', `lte.${date}`);
  url.searchParams.set('select', 'id,text,remind_on,status,created_at');
  url.searchParams.set('order', 'remind_on.asc');

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: userScopedHeaders(anonKey, userJwt),
  });
  if (!res.ok) {
    const detail = await safeReadBody(res);
    throw new Error(`postgrest select ${res.status}: ${JSON.stringify(detail)}`);
  }
  return (await res.json()) as unknown[];
}

// ---------- helpers ----------

async function safeReadBody(res: Response): Promise<unknown> {
  try {
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  } catch {
    return null;
  }
}

// Decode the JWT payload (no signature verification — PostgREST does that
// downstream) and return the `sub` claim, which Supabase populates with the
// user's auth.uid(). Returns null on any decode failure.
function parseSubFromJwt(jwt: string): string | null {
  try {
    const parts = jwt.split('.');
    if (parts.length !== 3) return null;
    // base64url → base64
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    const json = atob(padded);
    const payload = JSON.parse(json);
    return typeof payload?.sub === 'string' ? payload.sub : null;
  } catch {
    return null;
  }
}

// Server-local UTC date as YYYY-MM-DD. Used only as a fallback when the
// caller doesn't supply `today`. Implemented via Intl 'en-CA' (which formats
// as YYYY-MM-DD) rather than toISOString().slice(0, 10) so the entire
// reminders module is free of that off-by-one-prone idiom (see CR-09 in
// docs/product/acceptance-criteria/chat-reminders-jwt-and-timezone.md).
function todayIsoDate(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function isValidIsoDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

// ---------- handler ----------

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const { pathname, searchParams } = new URL(req.url);

  // Resolve shared env up front. Fail fast with a clear message.
  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!supabaseUrl || !anonKey) {
    console.error('[reminders] SUPABASE_URL or SUPABASE_ANON_KEY missing (should be auto-injected)');
    return errResp(500, 'server misconfigured: missing Supabase env');
  }

  // Both endpoints require an authenticated user. Reject early so callers
  // get a clear 401 instead of a confusing PostgREST RLS error.
  const userJwt = extractBearerToken(req);
  if (!userJwt) {
    return errResp(
      401,
      'missing or malformed Authorization header — expected `Authorization: Bearer <user-jwt>`',
    );
  }

  // GET /reminders/due?date=YYYY-MM-DD ----------------------------------------
  if (req.method === 'GET' && pathname.endsWith('/due')) {
    const date = searchParams.get('date') ?? todayIsoDate();
    if (!isValidIsoDate(date)) {
      return errResp(400, 'date query param must be YYYY-MM-DD');
    }
    try {
      const rows = await fetchDueReminders(supabaseUrl, anonKey, userJwt, date);
      return json({ date, reminders: rows });
    } catch (err) {
      console.error('[reminders] /due error', err);
      if (_sentryDsn) { Sentry.captureException(err); await Sentry.flush(2000); }
      return errResp(502, 'failed to read reminders', err instanceof Error ? err.message : String(err));
    }
  }

  // POST /reminders/classify-and-store ----------------------------------------
  if (req.method === 'POST' && pathname.endsWith('/classify-and-store')) {
    if (!anthropicKey) {
      console.error('[reminders] ANTHROPIC_API_KEY not set — run `supabase secrets set`');
      return errResp(500, 'server misconfigured: missing ANTHROPIC_API_KEY');
    }

    let raw: any;
    try {
      raw = await req.json();
    } catch {
      return errResp(400, 'invalid JSON body');
    }
    const transcript = raw?.transcript;
    if (typeof transcript !== 'string' || transcript.trim().length === 0) {
      return errResp(400, 'body must include non-empty { transcript: string }');
    }

    // Optional today (user-local YYYY-MM-DD). Falls back to server UTC.
    let today: string;
    if (typeof raw?.today === 'string' && raw.today.length > 0) {
      if (!isValidIsoDate(raw.today)) {
        return errResp(400, 'today must be YYYY-MM-DD');
      }
      today = raw.today;
    } else {
      today = todayIsoDate();
    }

    try {
      const result = await classifyTranscript(anthropicKey, transcript, today);
      if (!result.classified) {
        return json({ classified: false, reason: result.reason });
      }

      const reminder = await insertReminder(
        supabaseUrl,
        anonKey,
        userJwt,
        result.text,
        result.remind_on,
      );
      return json({ classified: true, reminder });
    } catch (err) {
      console.error('[reminders] classify-and-store error', err);
      if (_sentryDsn) { Sentry.captureException(err); await Sentry.flush(2000); }
      return errResp(502, 'classify-and-store failed', err instanceof Error ? err.message : String(err));
    }
  }

  return errResp(
    404,
    'not found — try POST /reminders/classify-and-store or GET /reminders/due?date=YYYY-MM-DD',
  );
});
