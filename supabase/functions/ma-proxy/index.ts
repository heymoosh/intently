// ma-proxy — Supabase Edge Function (Deno runtime).
//
// Purpose: shield the Anthropic API key from the browser. The Intently web
// client (Expo Web) cannot hold `ANTHROPIC_API_KEY` — any visitor could scrape
// the bundle. This function accepts skill+input from the web client, runs a
// Managed Agents session server-side, and returns the final agent output.
//
// V1 tradeoff — non-streaming (accumulate-then-return).
//   The task spec permits either SSE passthrough or one-shot idle payload.
//   We pick one-shot for V1 because:
//     1. Deno `ReadableStream` SSE plumbing + upstream error passthrough is
//        fiddly; bugs here block the demo.
//     2. The demo UX only needs the final agent output card; mid-run deltas
//        are a nice-to-have, not a gate.
//     3. Server opens an upstream SSE connection, collects `agent.message`
//        text blocks, terminates on `session.status_idle` / `session.error` /
//        `session.status_terminated`, and returns a single JSON response.
//   Post-hackathon: swap in true SSE passthrough for live-streamed tokens
//   (see `docs/architecture/managed-agents-event-topology.md` for events).
//
// CORS: `Access-Control-Allow-Origin: *` for hackathon simplicity. TODO: lock
// down post-hackathon to the actual deployed origin (Vercel / Netlify URL).
//
// Upstream call sequence (per `docs/architecture/managed-agents-demo-workflow.md`):
//   1. POST   https://api.anthropic.com/v1/sessions                  — create session (skipped if sessionId provided)
//   2. POST   https://api.anthropic.com/v1/sessions/{id}/events      — send user.message
//   3. GET    https://api.anthropic.com/v1/sessions/{id}/stream      — open SSE, collect events until idle
//
// NOTE: the exact SSE transport path (`/stream` vs events returned on the
// initial POST) is what the repo doc captures from the webinar. If the
// published Anthropic docs diverge at deploy time, trust the published docs
// and update the STREAM_PATH constant below.

// deno-lint-ignore-file no-explicit-any

// Sentry error monitoring — no-op when SENTRY_DSN is unset.
import * as Sentry from 'https://esm.sh/@sentry/deno@8';

const _sentryDsn = Deno.env.get('SENTRY_DSN_EDGE');
if (_sentryDsn) {
  Sentry.init({
    dsn: _sentryDsn,
    // V1: errors only — no performance or replay.
    tracesSampleRate: 0,
  });
}

const ANTHROPIC_API_BASE = 'https://api.anthropic.com';
const ANTHROPIC_BETA = 'managed-agents-2026-04-01';
// Paths verified against anthropics/skills/managed-agents-events.md (2026-04-24).
// The repo webinar note said `/stream`; the actual path is `/events/stream`.
const STREAM_PATH = (sessionId: string) => `/v1/sessions/${sessionId}/events/stream`;
const EVENTS_PATH = (sessionId: string) => `/v1/sessions/${sessionId}/events`;
const SESSIONS_PATH = '/v1/sessions';

// Skill → agent ID env var. Each Managed Agent is created once in the console
// (or via one-off script) and the resulting agent_id is stored as a Supabase
// secret. Mapping here keeps the web client's `skill` string load-bearing
// without leaking agent IDs to the browser.
//
// TODO: populate these env vars after agent resources are created. Until then,
// unmapped skills return 400 with a clear error.
const SKILL_ENV: Record<string, string> = {
  'daily-brief': 'MA_AGENT_ID_DAILY_BRIEF',
  'daily-review': 'MA_AGENT_ID_DAILY_REVIEW',
  'weekly-review': 'MA_AGENT_ID_WEEKLY_REVIEW',
  'monthly-review': 'MA_AGENT_ID_MONTHLY_REVIEW',
  'update-tracker': 'MA_AGENT_ID_UPDATE_TRACKER',
  setup: 'MA_AGENT_ID_SETUP',
};

// Required shared environment ID. Per the demo workflow doc, one environment
// per use case. Anthropic API empirically requires it on create-session — a
// missing value returns `environment_id: Field required`. Set via:
//   supabase secrets set MA_ENVIRONMENT_ID=<env-id-from-console>
const ENV_ID_VAR = 'MA_ENVIRONMENT_ID';

type ProxyRequest = {
  skill: string;
  input: string | Record<string, unknown>;
  sessionId?: string;
};

type ProxyResponse = {
  sessionId: string;
  finalText: string;
  status: 'idle' | 'error' | 'terminated';
  error?: { message: string; detail?: unknown };
};

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

function json(body: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
      ...extraHeaders,
    },
  });
}

function errResp(status: number, message: string, detail?: unknown) {
  return json({ error: { message, detail } }, status);
}

function anthropicHeaders(apiKey: string): Record<string, string> {
  return {
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
    'anthropic-beta': ANTHROPIC_BETA,
    'Content-Type': 'application/json',
  };
}

// ---------- upstream calls ----------

async function createSession(apiKey: string, agentId: string, environmentId: string) {
  // Anthropic MA `POST /v1/sessions` field names (empirical, 2026-04-24):
  //   - `agent`        — identifier WITHOUT _id suffix
  //   - `environment_id` — identifier WITH _id suffix, AND required
  // Both were wrong in our first inference. First smoke test returned:
  //   `agent_id: Extra inputs are not permitted. Did you mean 'agent'?`
  // Second smoke test returned:
  //   `environment_id: Field required`
  // So the API is internally inconsistent on naming. Trust empirical.
  const body: Record<string, unknown> = {
    agent: agentId,
    environment_id: environmentId,
  };

  const res = await fetch(`${ANTHROPIC_API_BASE}${SESSIONS_PATH}`, {
    method: 'POST',
    headers: anthropicHeaders(apiKey),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await safeReadBody(res);
    throw new UpstreamError(res.status, 'failed to create session', detail);
  }

  const data = (await res.json()) as { id?: string; session_id?: string };
  const id = data.id ?? data.session_id;
  if (!id) {
    throw new UpstreamError(502, 'create-session response missing id', data);
  }
  return id;
}

async function sendUserMessage(
  apiKey: string,
  sessionId: string,
  input: string | Record<string, unknown>,
) {
  // Per event-topology doc: `user.message` takes the same content blocks as
  // the Messages API. For V1 we accept plain text; an object input is passed
  // through as a JSON-stringified text block so callers can stuff structured
  // context without waiting on a multi-block contract.
  const text = typeof input === 'string' ? input : JSON.stringify(input);

  // Verified schema (anthropics/skills repo, 2026-04-24): events are submitted
  // as a batch array, and `user.message` uses a flat `text` field — NOT the
  // content-blocks grammar of the Messages API. Empirical trial before this
  // rejected both `content` at root and `message: {content: [...]}` wrapping.
  const res = await fetch(`${ANTHROPIC_API_BASE}${EVENTS_PATH(sessionId)}`, {
    method: 'POST',
    headers: anthropicHeaders(apiKey),
    body: JSON.stringify({
      events: [
        {
          type: 'user.message',
          content: [{ type: 'text', text }],
        },
      ],
    }),
  });

  if (!res.ok) {
    const detail = await safeReadBody(res);
    throw new UpstreamError(res.status, 'failed to send user.message', detail);
  }
}

type CollectedOutput = {
  finalText: string;
  status: 'idle' | 'error' | 'terminated';
  errorDetail?: unknown;
};

async function collectUntilIdle(apiKey: string, sessionId: string): Promise<CollectedOutput> {
  const res = await fetch(`${ANTHROPIC_API_BASE}${STREAM_PATH(sessionId)}`, {
    method: 'GET',
    headers: {
      ...anthropicHeaders(apiKey),
      Accept: 'text/event-stream',
    },
  });

  if (!res.ok || !res.body) {
    const detail = await safeReadBody(res);
    throw new UpstreamError(res.status || 502, 'failed to open event stream', detail);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  const textChunks: string[] = [];
  let finalStatus: CollectedOutput['status'] | null = null;
  let errorDetail: unknown = undefined;

  // Parse SSE frames: blank-line-separated records, each line prefixed with
  // `data:` / `event:`. We only care about the JSON payload on `data:` lines.
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let sep: number;
    while ((sep = buffer.indexOf('\n\n')) !== -1) {
      const frame = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);

      const dataLines = frame
        .split('\n')
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.slice(5).trim());
      if (dataLines.length === 0) continue;

      const payloadStr = dataLines.join('\n');
      if (!payloadStr || payloadStr === '[DONE]') continue;

      let evt: any;
      try {
        evt = JSON.parse(payloadStr);
      } catch {
        // Skip malformed frame; don't crash the collector.
        continue;
      }

      const type: string | undefined = evt?.type;
      if (!type) continue;

      if (type === 'agent.message') {
        // Content is an array of blocks (text / tool_use / ...); collect text.
        const blocks = Array.isArray(evt.content)
          ? evt.content
          : Array.isArray(evt.message?.content)
          ? evt.message.content
          : [];
        for (const b of blocks) {
          if (b?.type === 'text' && typeof b.text === 'string') {
            textChunks.push(b.text);
          }
        }
      } else if (type === 'session.status_idle') {
        finalStatus = 'idle';
        break;
      } else if (type === 'session.error') {
        finalStatus = 'error';
        errorDetail = evt.error ?? evt;
        break;
      } else if (type === 'session.status_terminated') {
        finalStatus = 'terminated';
        break;
      }
      // Other events (span.*, agent.tool_use, session.status_running,
      // agent.thread_context_compacted, etc.) are ignored in V1. Post-hackathon
      // SSE passthrough will forward them all.
    }

    if (finalStatus !== null) break;
  }

  try {
    await reader.cancel();
  } catch {
    // ignore
  }

  return {
    finalText: textChunks.join(''),
    status: finalStatus ?? 'terminated',
    errorDetail,
  };
}

// ---------- helpers ----------

class UpstreamError extends Error {
  status: number;
  detail: unknown;
  constructor(status: number, message: string, detail: unknown) {
    super(message);
    this.status = status;
    this.detail = detail;
  }
}

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

function parseProxyRequest(raw: unknown): ProxyRequest | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.skill !== 'string' || r.skill.length === 0) return null;
  if (typeof r.input !== 'string' && (typeof r.input !== 'object' || r.input === null)) {
    return null;
  }
  if (r.sessionId !== undefined && typeof r.sessionId !== 'string') return null;
  return {
    skill: r.skill,
    input: r.input as string | Record<string, unknown>,
    sessionId: r.sessionId as string | undefined,
  };
}

// ---------- handler ----------

Deno.serve(async (req: Request) => {
  // CORS preflight.
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return errResp(405, 'method not allowed; use POST');
  }

  // Parse request body.
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return errResp(400, 'invalid JSON body');
  }
  const parsed = parseProxyRequest(raw);
  if (!parsed) {
    return errResp(
      400,
      'invalid body — expected { skill: string, input: string | object, sessionId?: string }',
    );
  }

  // Resolve API key (never from request body / never from env vars that
  // could leak into the client bundle).
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) {
    console.error('[ma-proxy] ANTHROPIC_API_KEY not set — run `supabase secrets set`');
    return errResp(500, 'server misconfigured: missing ANTHROPIC_API_KEY');
  }

  // Resolve skill → agent ID (unless caller passed a sessionId to resume).
  let agentId: string | null = null;
  if (!parsed.sessionId) {
    const envVar = SKILL_ENV[parsed.skill];
    if (!envVar) {
      return errResp(400, `unknown skill: ${parsed.skill}`, { knownSkills: Object.keys(SKILL_ENV) });
    }
    agentId = Deno.env.get(envVar) ?? null;
    if (!agentId) {
      console.error(`[ma-proxy] ${envVar} not set — run \`supabase secrets set ${envVar}=...\``);
      return errResp(500, `server misconfigured: missing ${envVar}`);
    }
  }

  // environment_id is required by the Anthropic MA API (empirical 2026-04-24).
  // Fail fast with a clear error if the secret isn't set — better than a
  // cryptic upstream 400.
  const environmentId = Deno.env.get(ENV_ID_VAR) ?? null;
  if (!parsed.sessionId && !environmentId) {
    console.error(`[ma-proxy] ${ENV_ID_VAR} not set — run \`supabase secrets set ${ENV_ID_VAR}=...\``);
    return errResp(
      500,
      `server misconfigured: missing ${ENV_ID_VAR} (required by Anthropic MA API)`,
    );
  }

  // Orchestrate: create (or resume) session, send user.message, collect until idle.
  try {
    const sessionId = parsed.sessionId
      ? parsed.sessionId
      : await createSession(apiKey, agentId!, environmentId!);

    await sendUserMessage(apiKey, sessionId, parsed.input);

    const collected = await collectUntilIdle(apiKey, sessionId);

    const body: ProxyResponse = {
      sessionId,
      finalText: collected.finalText,
      status: collected.status,
    };
    if (collected.status !== 'idle') {
      body.error = {
        message: `session ended with status ${collected.status}`,
        detail: collected.errorDetail,
      };
    }
    return json(body, collected.status === 'idle' ? 200 : 502);
  } catch (err) {
    if (err instanceof UpstreamError) {
      console.error('[ma-proxy] upstream error', err.status, err.message, err.detail);
      // Passthrough upstream 4xx/5xx; clamp to 5xx if we somehow got a 2xx/3xx.
      const status = err.status >= 400 && err.status < 600 ? err.status : 502;
      // Report 5xx upstream errors to Sentry (4xx are caller mistakes, not bugs).
      if (status >= 500 && _sentryDsn) {
        Sentry.captureException(err);
        await Sentry.flush(2000);
      }
      return errResp(status, err.message, err.detail);
    }
    console.error('[ma-proxy] unhandled error', err);
    if (_sentryDsn) {
      Sentry.captureException(err);
      await Sentry.flush(2000);
    }
    return errResp(500, 'internal error', err instanceof Error ? err.message : String(err));
  }
});
