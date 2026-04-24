// reminders — Supabase Edge Function (Deno runtime).
//
// Purpose: take a voice transcript ("remind me to call the dentist Tuesday"),
// classify it into {text, remind_on} via Anthropic Haiku, and insert into
// public.reminders. Also exposes a /due read endpoint used by daily-brief
// input assembly to pull pending reminders.
//
// V1 single-user shortcut:
//   Writes use SUPABASE_SERVICE_ROLE_KEY (auto-injected by Supabase) to
//   bypass RLS, and attribute every row to the first user in auth.users
//   (matching supabase/seeds/reminders.sql). This is a hackathon-only
//   pattern — before multi-user, swap to JWT passthrough + row-level RLS
//   policies that are already in place from migration 0003.
//
// Endpoints:
//   POST /functions/v1/reminders/classify-and-store   body: {transcript: string}
//   GET  /functions/v1/reminders/due?date=YYYY-MM-DD
//
// CORS: mirrors ma-proxy (Access-Control-Allow-Origin: *). Lock down
// post-hackathon.

// deno-lint-ignore-file no-explicit-any

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

// ---------- PostgREST (service-role fetch; bypasses RLS) ----------

function supabaseHeaders(serviceKey: string): Record<string, string> {
  return {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
  };
}

async function firstUserId(supabaseUrl: string, serviceKey: string): Promise<string | null> {
  // auth.users is only reachable with the service role. We pick the earliest
  // signup as the V1 owner (single-user dogfood). Matches seed behavior.
  const res = await fetch(
    `${supabaseUrl}/auth/v1/admin/users?page=1&per_page=1`,
    { method: 'GET', headers: supabaseHeaders(serviceKey) },
  );
  if (!res.ok) return null;
  const data = (await res.json()) as any;
  const users = Array.isArray(data?.users) ? data.users : [];
  // Admin API returns newest first; sort ascending by created_at to match
  // seed's "first user" semantics.
  users.sort((a: any, b: any) =>
    (a?.created_at ?? '').localeCompare(b?.created_at ?? ''),
  );
  return users[0]?.id ?? null;
}

async function insertReminder(
  supabaseUrl: string,
  serviceKey: string,
  userId: string,
  text: string,
  remindOn: string,
): Promise<Record<string, unknown>> {
  const res = await fetch(`${supabaseUrl}/rest/v1/reminders`, {
    method: 'POST',
    headers: {
      ...supabaseHeaders(serviceKey),
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
  serviceKey: string,
  date: string,
): Promise<unknown[]> {
  // Pending + remind_on <= date. PostgREST filters: status=eq.pending, remind_on=lte.<date>.
  const url = new URL(`${supabaseUrl}/rest/v1/reminders`);
  url.searchParams.set('status', 'eq.pending');
  url.searchParams.set('remind_on', `lte.${date}`);
  url.searchParams.set('select', 'id,text,remind_on,status,created_at');
  url.searchParams.set('order', 'remind_on.asc');

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: supabaseHeaders(serviceKey),
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

function todayIsoDate(): string {
  // Server-local (UTC on Supabase Edge). Good enough for V1; post-hackathon
  // we resolve against the user's profile timezone.
  return new Date().toISOString().slice(0, 10);
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
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceKey) {
    console.error('[reminders] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing (should be auto-injected)');
    return errResp(500, 'server misconfigured: missing Supabase env');
  }

  // GET /reminders/due?date=YYYY-MM-DD ----------------------------------------
  if (req.method === 'GET' && pathname.endsWith('/due')) {
    const date = searchParams.get('date') ?? todayIsoDate();
    if (!isValidIsoDate(date)) {
      return errResp(400, 'date query param must be YYYY-MM-DD');
    }
    try {
      const rows = await fetchDueReminders(supabaseUrl, serviceKey, date);
      return json({ date, reminders: rows });
    } catch (err) {
      console.error('[reminders] /due error', err);
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

    try {
      const today = todayIsoDate();
      const result = await classifyTranscript(anthropicKey, transcript, today);
      if (!result.classified) {
        return json({ classified: false, reason: result.reason });
      }

      const userId = await firstUserId(supabaseUrl, serviceKey);
      if (!userId) {
        return errResp(500, 'no users in auth.users — cannot attribute reminder');
      }

      const reminder = await insertReminder(
        supabaseUrl,
        serviceKey,
        userId,
        result.text,
        result.remind_on,
      );
      return json({ classified: true, reminder });
    } catch (err) {
      console.error('[reminders] classify-and-store error', err);
      return errResp(502, 'classify-and-store failed', err instanceof Error ? err.message : String(err));
    }
  }

  return errResp(
    404,
    'not found — try POST /reminders/classify-and-store or GET /reminders/due?date=YYYY-MM-DD',
  );
});
