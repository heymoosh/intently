// sync-calendar — Supabase Edge Function (Deno runtime).
//
// Pulls today + tomorrow events from the user's primary Google Calendar,
// upserts into public.calendar_events. Idempotent on
// (user_id, source='gcal', external_id=google_event_id).
//
// V1 scope:
//   - Primary calendar only (no shared / multi-calendar support).
//   - Read-only (no event mutations back to Google).
//   - Window: now → 24h ahead. Older or far-future events are out of scope
//     for the daily-brief context.
//   - Returns count of upserted rows for the UI to display.
//
// Endpoint:
//   POST /functions/v1/sync-calendar
//        Authenticated. No body required. Reads the user's connected
//        google_calendar refresh_token from Vault, exchanges for an
//        access_token, calls Google Calendar API, upserts rows.
//
// Required Supabase secrets:
//   GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET — for refresh exchange.
//   SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY — auto-injected.

// deno-lint-ignore-file no-explicit-any

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_CALENDAR_BASE = 'https://www.googleapis.com/calendar/v3';

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

// ---------- auth helpers ----------

function extractBearerToken(req: Request): string | null {
  const header = req.headers.get('Authorization') || req.headers.get('authorization');
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  if (!match) return null;
  return match[1].trim() || null;
}

function parseSubFromJwt(jwt: string): string | null {
  try {
    const parts = jwt.split('.');
    if (parts.length !== 3) return null;
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    const payload = JSON.parse(atob(padded));
    return typeof payload?.sub === 'string' ? payload.sub : null;
  } catch {
    return null;
  }
}

// ---------- vault read ----------

async function readRefreshTokenFromVault(
  supabaseUrl: string,
  serviceRoleKey: string,
  vaultSecretId: string,
): Promise<string | null> {
  // Use the SECURITY DEFINER passthrough from migration 0007 — keeps the
  // function portable across Supabase project tiers (no Accept-Profile:vault
  // dependency).
  const res = await fetch(`${supabaseUrl}/rest/v1/rpc/read_secret_passthrough`, {
    method: 'POST',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ secret_id: vaultSecretId }),
  });
  if (!res.ok) {
    const detail = await safeReadBody(res);
    throw new Error(`vault read ${res.status}: ${JSON.stringify(detail)}`);
  }
  const decrypted = (await res.json()) as string | null;
  if (!decrypted) return null;
  try {
    const parsed = JSON.parse(decrypted);
    return parsed?.refresh_token ?? null;
  } catch {
    return decrypted; // legacy plain string
  }
}

// ---------- google access-token exchange ----------

async function refreshAccessToken(
  clientId: string,
  clientSecret: string,
  refreshToken: string,
): Promise<string> {
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  if (!res.ok) {
    const detail = await safeReadBody(res);
    throw new Error(`google refresh ${res.status}: ${JSON.stringify(detail)}`);
  }
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

// ---------- google calendar fetch ----------

type GoogleEvent = {
  id: string;
  summary?: string;
  location?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  attendees?: Array<{ email?: string; displayName?: string; responseStatus?: string }>;
  status?: string;
};

async function fetchPrimaryCalendarEvents(
  accessToken: string,
  timeMin: Date,
  timeMax: Date,
): Promise<GoogleEvent[]> {
  const url = new URL(`${GOOGLE_CALENDAR_BASE}/calendars/primary/events`);
  url.searchParams.set('timeMin', timeMin.toISOString());
  url.searchParams.set('timeMax', timeMax.toISOString());
  url.searchParams.set('singleEvents', 'true');
  url.searchParams.set('orderBy', 'startTime');
  url.searchParams.set('maxResults', '50');

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const detail = await safeReadBody(res);
    throw new Error(`google calendar list ${res.status}: ${JSON.stringify(detail)}`);
  }
  const data = (await res.json()) as { items?: GoogleEvent[] };
  return data.items ?? [];
}

// ---------- supabase upsert ----------

type CalendarRow = {
  user_id: string;
  starts_at: string;
  ends_at: string | null;
  title: string;
  location: string | null;
  attendees: Array<{ email?: string; name?: string; status?: string }>;
  source: 'gcal';
  external_id: string;
};

function eventToRow(event: GoogleEvent, userId: string): CalendarRow | null {
  // Skip cancelled events.
  if (event.status === 'cancelled') return null;
  const startsRaw = event.start?.dateTime || event.start?.date;
  if (!startsRaw) return null;
  // For all-day events, .date is YYYY-MM-DD; coerce to ISO at midnight UTC.
  const starts = event.start?.dateTime
    ? new Date(event.start.dateTime)
    : new Date(`${event.start?.date}T00:00:00Z`);
  const endsRaw = event.end?.dateTime || event.end?.date;
  const ends = endsRaw
    ? event.end?.dateTime
      ? new Date(event.end.dateTime)
      : new Date(`${event.end?.date}T00:00:00Z`)
    : null;

  return {
    user_id: userId,
    starts_at: starts.toISOString(),
    ends_at: ends ? ends.toISOString() : null,
    title: event.summary || '(no title)',
    location: event.location || null,
    attendees: (event.attendees ?? []).map((a) => ({
      email: a.email,
      name: a.displayName,
      status: a.responseStatus,
    })),
    source: 'gcal',
    external_id: event.id,
  };
}

async function upsertCalendarRows(
  supabaseUrl: string,
  anonKey: string,
  userJwt: string,
  rows: CalendarRow[],
): Promise<number> {
  if (rows.length === 0) return 0;
  const res = await fetch(
    `${supabaseUrl}/rest/v1/calendar_events?on_conflict=user_id,source,external_id`,
    {
      method: 'POST',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${userJwt}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify(rows),
    },
  );
  if (!res.ok) {
    const detail = await safeReadBody(res);
    throw new Error(`calendar_events upsert ${res.status}: ${JSON.stringify(detail)}`);
  }
  const inserted = (await res.json()) as unknown[];
  return inserted.length;
}

async function getVaultSecretId(
  supabaseUrl: string,
  anonKey: string,
  userJwt: string,
): Promise<string | null> {
  const url = new URL(`${supabaseUrl}/rest/v1/oauth_connections`);
  url.searchParams.set('provider', 'eq.google_calendar');
  url.searchParams.set('select', 'vault_secret_id');
  url.searchParams.set('limit', '1');
  const res = await fetch(url.toString(), {
    headers: { apikey: anonKey, Authorization: `Bearer ${userJwt}` },
  });
  if (!res.ok) {
    const detail = await safeReadBody(res);
    throw new Error(`oauth_connections lookup ${res.status}: ${JSON.stringify(detail)}`);
  }
  const rows = (await res.json()) as any[];
  return rows[0]?.vault_secret_id ?? null;
}

async function markLastSyncedAt(
  supabaseUrl: string,
  anonKey: string,
  userJwt: string,
): Promise<void> {
  const res = await fetch(
    `${supabaseUrl}/rest/v1/oauth_connections?provider=eq.google_calendar`,
    {
      method: 'PATCH',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${userJwt}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ last_synced_at: new Date().toISOString() }),
    },
  );
  if (!res.ok) {
    const detail = await safeReadBody(res);
    console.warn('[sync-calendar] last_synced_at patch failed (continuing):', res.status, detail);
  }
}

// ---------- handler ----------

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') {
    return errResp(405, 'method not allowed; use POST');
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const clientId = Deno.env.get('GOOGLE_OAUTH_CLIENT_ID') || '';
  const clientSecret = Deno.env.get('GOOGLE_OAUTH_CLIENT_SECRET') || '';

  const missing: string[] = [];
  if (!supabaseUrl) missing.push('SUPABASE_URL');
  if (!anonKey) missing.push('SUPABASE_ANON_KEY');
  if (!serviceRoleKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  if (!clientId) missing.push('GOOGLE_OAUTH_CLIENT_ID');
  if (!clientSecret) missing.push('GOOGLE_OAUTH_CLIENT_SECRET');
  if (missing.length > 0) {
    console.error('[sync-calendar] missing env:', missing.join(', '));
    return errResp(500, 'server misconfigured', missing);
  }

  const userJwt = extractBearerToken(req);
  if (!userJwt) return errResp(401, 'missing Authorization Bearer token');
  const userId = parseSubFromJwt(userJwt);
  if (!userId) return errResp(401, 'jwt missing sub');

  try {
    // 1. Resolve the vault secret id for this user's google_calendar connection.
    const vaultSecretId = await getVaultSecretId(supabaseUrl, anonKey, userJwt);
    if (!vaultSecretId) {
      return errResp(409, 'no google_calendar connection — connect first via oauth-google/start');
    }

    // 2. Read the refresh token (service-role only; vault is privileged).
    const refreshToken = await readRefreshTokenFromVault(supabaseUrl, serviceRoleKey, vaultSecretId);
    if (!refreshToken) return errResp(500, 'vault secret missing refresh_token');

    // 3. Exchange for an access token.
    const accessToken = await refreshAccessToken(clientId, clientSecret, refreshToken);

    // 4. Window: now → 24h ahead. Roughly "today + tomorrow".
    const timeMin = new Date();
    const timeMax = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const events = await fetchPrimaryCalendarEvents(accessToken, timeMin, timeMax);

    // 5. Map and upsert.
    const rows = events
      .map((e) => eventToRow(e, userId))
      .filter((r): r is CalendarRow => r !== null);

    const upsertedCount = await upsertCalendarRows(supabaseUrl, anonKey, userJwt, rows);

    // 6. Update last_synced_at on the connection row.
    await markLastSyncedAt(supabaseUrl, anonKey, userJwt);

    return json({
      synced: true,
      upserted: upsertedCount,
      window: { from: timeMin.toISOString(), to: timeMax.toISOString() },
    });
  } catch (err) {
    console.error('[sync-calendar] error:', err);
    return errResp(502, 'sync failed', err instanceof Error ? err.message : String(err));
  }
});
