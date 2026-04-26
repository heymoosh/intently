// sync-email — Supabase Edge Function (Deno runtime).
//
// Pulls top-50 flagged Gmail messages and upserts into public.email_flags.
// Idempotent on (user_id, source='gmail', external_id=gmail_message_id).
//
// V1 "flagged" semantics — captured from the handoff §3:
//   - Starred messages, OR
//   - Messages where user is direct recipient AND last 7 days AND no reply
//     from the user yet (`-from:me to:me newer_than:7d`)
//   We OR these via a top-level Gmail `q=` query.
//
// PII discipline — load-bearing for the AC:
//   We persist sender, subject, received_at, urgency flags. We do NOT
//   persist message bodies. The message body is never fetched (we use
//   format=metadata when getting per-message details).
//
// Endpoint:
//   POST /functions/v1/sync-email
//        Authenticated. Reads the user's google_gmail refresh token from
//        Vault, exchanges for access_token, calls Gmail API, upserts rows.
//
// Required Supabase secrets: same as sync-calendar.

// deno-lint-ignore-file no-explicit-any

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GMAIL_BASE = 'https://gmail.googleapis.com/gmail/v1';

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

// Gmail search query for "flagged":
//   is:starred — anything the user explicitly starred
//   OR (to:me + newer_than:7d + -from:me) — incoming-and-unanswered last week
// LIMIT 50 (handoff requirement).
const GMAIL_FLAGGED_QUERY = '(is:starred) OR (to:me newer_than:7d -from:me)';
const GMAIL_MAX_RESULTS = 50;

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
    return decrypted;
  }
}

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

// ---------- gmail fetch ----------

type GmailListItem = { id: string; threadId: string };

async function listFlaggedMessageIds(accessToken: string): Promise<GmailListItem[]> {
  const url = new URL(`${GMAIL_BASE}/users/me/messages`);
  url.searchParams.set('q', GMAIL_FLAGGED_QUERY);
  url.searchParams.set('maxResults', String(GMAIL_MAX_RESULTS));

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const detail = await safeReadBody(res);
    throw new Error(`gmail list ${res.status}: ${JSON.stringify(detail)}`);
  }
  const data = (await res.json()) as { messages?: GmailListItem[] };
  return data.messages ?? [];
}

type GmailHeader = { name: string; value: string };

type GmailMessageMetadata = {
  id: string;
  labelIds?: string[];
  internalDate?: string; // ms since epoch as string
  payload?: { headers?: GmailHeader[] };
};

async function fetchMessageMetadata(
  accessToken: string,
  id: string,
): Promise<GmailMessageMetadata> {
  // format=metadata + metadataHeaders=From,Subject,Date is the minimum that
  // returns what we need without ever touching the body. PII guarantee
  // depends on this exact call shape.
  const url = new URL(`${GMAIL_BASE}/users/me/messages/${encodeURIComponent(id)}`);
  url.searchParams.set('format', 'metadata');
  url.searchParams.append('metadataHeaders', 'From');
  url.searchParams.append('metadataHeaders', 'Subject');
  url.searchParams.append('metadataHeaders', 'Date');

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const detail = await safeReadBody(res);
    throw new Error(`gmail get ${id} ${res.status}: ${JSON.stringify(detail)}`);
  }
  return (await res.json()) as GmailMessageMetadata;
}

// ---------- supabase upsert ----------

type EmailRow = {
  user_id: string;
  sender: string;
  subject: string;
  received_at: string;
  is_urgent: boolean;
  awaiting_reply: boolean;
  source: 'gmail';
  external_id: string;
};

function headerValue(headers: GmailHeader[] | undefined, name: string): string | null {
  if (!headers) return null;
  const found = headers.find((h) => h.name?.toLowerCase() === name.toLowerCase());
  return found?.value ?? null;
}

function metadataToRow(meta: GmailMessageMetadata, userId: string): EmailRow | null {
  if (!meta.id) return null;
  const headers = meta.payload?.headers;
  const from = headerValue(headers, 'From') || '(unknown sender)';
  const subject = headerValue(headers, 'Subject') || '(no subject)';
  const dateMs = Number(meta.internalDate || '0');
  const receivedAt = new Date(dateMs > 0 ? dateMs : Date.now());

  // Urgency heuristic: starred OR labeled IMPORTANT.
  const labels = new Set(meta.labelIds ?? []);
  const isStarred = labels.has('STARRED');
  const isImportant = labels.has('IMPORTANT');
  const isUrgent = isStarred || isImportant;
  // Awaiting reply: matched the to:me + -from:me + 7d branch. We can't
  // distinguish list-membership cleanly here, so we approximate: any non-
  // starred message we caught was matched by the to:me/-from:me branch.
  const awaitingReply = !isStarred;

  return {
    user_id: userId,
    sender: from.slice(0, 200),
    subject: subject.slice(0, 300),
    received_at: receivedAt.toISOString(),
    is_urgent: isUrgent,
    awaiting_reply: awaitingReply,
    source: 'gmail',
    external_id: meta.id,
  };
}

async function upsertEmailRows(
  supabaseUrl: string,
  anonKey: string,
  userJwt: string,
  rows: EmailRow[],
): Promise<number> {
  if (rows.length === 0) return 0;
  const res = await fetch(
    `${supabaseUrl}/rest/v1/email_flags?on_conflict=user_id,source,external_id`,
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
    throw new Error(`email_flags upsert ${res.status}: ${JSON.stringify(detail)}`);
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
  url.searchParams.set('provider', 'eq.google_gmail');
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
    `${supabaseUrl}/rest/v1/oauth_connections?provider=eq.google_gmail`,
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
    console.warn('[sync-email] last_synced_at patch failed (continuing):', res.status, detail);
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
    console.error('[sync-email] missing env:', missing.join(', '));
    return errResp(500, 'server misconfigured', missing);
  }

  const userJwt = extractBearerToken(req);
  if (!userJwt) return errResp(401, 'missing Authorization Bearer token');
  const userId = parseSubFromJwt(userJwt);
  if (!userId) return errResp(401, 'jwt missing sub');

  try {
    const vaultSecretId = await getVaultSecretId(supabaseUrl, anonKey, userJwt);
    if (!vaultSecretId) {
      return errResp(409, 'no google_gmail connection — connect first via oauth-google/start');
    }
    const refreshToken = await readRefreshTokenFromVault(supabaseUrl, serviceRoleKey, vaultSecretId);
    if (!refreshToken) return errResp(500, 'vault secret missing refresh_token');

    const accessToken = await refreshAccessToken(clientId, clientSecret, refreshToken);

    // List flagged ids.
    const ids = await listFlaggedMessageIds(accessToken);

    // Fetch metadata for each (capped at 50). Sequential to keep it simple
    // and stay well under Gmail rate quotas; can parallelize later.
    const rows: EmailRow[] = [];
    for (const item of ids) {
      try {
        const meta = await fetchMessageMetadata(accessToken, item.id);
        const row = metadataToRow(meta, userId);
        if (row) rows.push(row);
      } catch (err) {
        // Skip individual failures rather than aborting the whole sync.
        console.warn(`[sync-email] skipped ${item.id}:`, err instanceof Error ? err.message : err);
      }
    }

    const upsertedCount = await upsertEmailRows(supabaseUrl, anonKey, userJwt, rows);
    await markLastSyncedAt(supabaseUrl, anonKey, userJwt);

    return json({
      synced: true,
      requested: ids.length,
      upserted: upsertedCount,
    });
  } catch (err) {
    console.error('[sync-email] error:', err);
    return errResp(502, 'sync failed', err instanceof Error ? err.message : String(err));
  }
});
