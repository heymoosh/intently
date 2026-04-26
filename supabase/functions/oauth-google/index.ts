// oauth-google — Supabase Edge Function (Deno runtime).
//
// Three-endpoint façade for the Google OAuth dance + per-user refresh-token
// custody. Mirrors the path-routing pattern in `supabase/functions/reminders/`.
//
// Endpoints:
//   GET  /functions/v1/oauth-google/start?provider=google_calendar|google_gmail
//        Authenticated. Builds Google's consent URL (with state= encoding the
//        user_id + csrf_nonce + provider) and 302-redirects the browser to it.
//
//   GET  /functions/v1/oauth-google/callback?code=...&state=...
//        Public (Google calls it from its consent screen). Exchanges the code
//        for {refresh_token, access_token}; stores refresh_token in Supabase
//        Vault; upserts a row in `oauth_connections`; redirects the browser
//        back to the app at `?connected=<provider>`.
//
//   POST /functions/v1/oauth-google/disconnect
//        Authenticated. Body: { provider: 'google_calendar' | 'google_gmail' }.
//        Revokes the token at Google, deletes the Vault secret, deletes the
//        user's calendar_events / email_flags rows for that provider, removes
//        the oauth_connections row.
//
// Refresh-token storage:
//   `vault.create_secret(token, name)` returns a uuid; we stash that uuid in
//   `oauth_connections.vault_secret_id`. The vault schema is reachable from
//   the service-role key only, NOT from the publishable (anon) key — that's
//   the encryption boundary.
//
// State parameter design:
//   `state = base64url(JSON.stringify({user_id, nonce, provider, returnTo}))`
//   We HMAC-sign with `OAUTH_STATE_SIGNING_KEY` to prevent forgery (any user
//   could otherwise spoof state= and connect a token to a different user_id).
//   Format: `<base64url(payload)>.<base64url(hmacSha256(payload, key))>`.
//
// CORS: mirrors ma-proxy. /callback is a top-level navigation (no CORS
// preflight); /start and /disconnect are XHRs from the SPA so they need it.
//
// Required Supabase secrets (set via `supabase secrets set ...`):
//   GOOGLE_OAUTH_CLIENT_ID         — from Google Cloud OAuth 2.0 Web client
//   GOOGLE_OAUTH_CLIENT_SECRET     — same
//   GOOGLE_OAUTH_REDIRECT_URI      — must match the URI registered with
//                                    Google. Defaults to the deployed
//                                    function path if unset.
//   OAUTH_STATE_SIGNING_KEY        — random 32+ byte string. Used to HMAC
//                                    the state= parameter. Generate with
//                                    `openssl rand -base64 48`.
//   OAUTH_APP_RETURN_URL           — base URL of the deployed web app
//                                    (e.g. https://intently.vercel.app).
//                                    Defaults to localhost for local dev.
//   SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY — auto-injected.

// deno-lint-ignore-file no-explicit-any

const GOOGLE_AUTH_BASE = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_REVOKE_URL = 'https://oauth2.googleapis.com/revoke';

const SCOPES_BY_PROVIDER: Record<string, string[]> = {
  google_calendar: ['https://www.googleapis.com/auth/calendar.readonly'],
  // gmail.readonly (not metadata) — metadata scope cannot satisfy `q=` queries
  // for starred / has-attachment filters, which sync-email needs. PII guard
  // is server-side: we only persist sender/subject/received_at + flags, never
  // bodies. Documented in the handoff Acceptance Criteria.
  google_gmail: ['https://www.googleapis.com/auth/gmail.readonly'],
};

const VALID_PROVIDERS = Object.keys(SCOPES_BY_PROVIDER);

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

// ---------- env resolution ----------

type Env = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  signingKey: string;
  appReturnUrl: string;
  supabaseUrl: string;
  anonKey: string;
  serviceRoleKey: string;
};

function readEnv(): { ok: true; env: Env } | { ok: false; missing: string[] } {
  const clientId = Deno.env.get('GOOGLE_OAUTH_CLIENT_ID') || '';
  const clientSecret = Deno.env.get('GOOGLE_OAUTH_CLIENT_SECRET') || '';
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const signingKey = Deno.env.get('OAUTH_STATE_SIGNING_KEY') || '';
  // Default redirect URI to the canonical Edge Function /callback path. If
  // someone deploys behind a custom domain they can override this secret.
  const redirectUri =
    Deno.env.get('GOOGLE_OAUTH_REDIRECT_URI') ||
    (supabaseUrl ? `${supabaseUrl}/functions/v1/oauth-google/callback` : '');
  // Default the app-return URL to localhost for local dev. Production must
  // set OAUTH_APP_RETURN_URL to the deployed app origin.
  const appReturnUrl = Deno.env.get('OAUTH_APP_RETURN_URL') || 'http://localhost:8000';

  const missing: string[] = [];
  if (!clientId) missing.push('GOOGLE_OAUTH_CLIENT_ID');
  if (!clientSecret) missing.push('GOOGLE_OAUTH_CLIENT_SECRET');
  if (!supabaseUrl) missing.push('SUPABASE_URL');
  if (!anonKey) missing.push('SUPABASE_ANON_KEY');
  if (!serviceRoleKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  if (!signingKey) missing.push('OAUTH_STATE_SIGNING_KEY');
  if (!redirectUri) missing.push('GOOGLE_OAUTH_REDIRECT_URI (or SUPABASE_URL)');
  if (missing.length > 0) return { ok: false, missing };

  return {
    ok: true,
    env: {
      clientId,
      clientSecret,
      redirectUri,
      signingKey,
      appReturnUrl,
      supabaseUrl,
      anonKey,
      serviceRoleKey,
    },
  };
}

// ---------- state signing ----------

function base64UrlEncode(bytes: Uint8Array): string {
  let s = btoa(String.fromCharCode(...bytes));
  return s.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
  const raw = atob(padded);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

async function hmacSha256(key: string, message: string): Promise<Uint8Array> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(message));
  return new Uint8Array(sig);
}

type StatePayload = {
  user_id: string;
  provider: string;
  nonce: string;
  return_to: string;
  // Issued-at — short window; reject if older than 10 minutes.
  iat: number;
};

async function signState(payload: StatePayload, signingKey: string): Promise<string> {
  const enc = new TextEncoder();
  const payloadB64 = base64UrlEncode(enc.encode(JSON.stringify(payload)));
  const sig = await hmacSha256(signingKey, payloadB64);
  return `${payloadB64}.${base64UrlEncode(sig)}`;
}

async function verifyState(
  state: string,
  signingKey: string,
): Promise<StatePayload | null> {
  const parts = state.split('.');
  if (parts.length !== 2) return null;
  const [payloadB64, sigB64] = parts;
  const expected = await hmacSha256(signingKey, payloadB64);
  const provided = base64UrlDecode(sigB64);
  // Constant-time-ish comparison.
  if (expected.length !== provided.length) return null;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected[i] ^ provided[i];
  if (diff !== 0) return null;
  try {
    const dec = new TextDecoder().decode(base64UrlDecode(payloadB64));
    const parsed = JSON.parse(dec) as StatePayload;
    // 10-minute window.
    const ageSec = Math.floor(Date.now() / 1000) - (parsed.iat ?? 0);
    if (ageSec < 0 || ageSec > 600) return null;
    if (typeof parsed.user_id !== 'string' || !parsed.user_id) return null;
    if (!VALID_PROVIDERS.includes(parsed.provider)) return null;
    return parsed;
  } catch {
    return null;
  }
}

// ---------- auth helpers (mirror of reminders/index.ts) ----------

function extractBearerToken(req: Request): string | null {
  const header = req.headers.get('Authorization') || req.headers.get('authorization');
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  if (!match) return null;
  const token = match[1].trim();
  return token.length > 0 ? token : null;
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

// ---------- vault helpers (service-role only) ----------
//
// Vault is a privileged Supabase schema. PostgREST exposes it only when
// `Accept-Profile: vault` (read) / `Content-Profile: vault` (write) headers
// are set AND the request carries the service-role key. The publishable
// (anon) key cannot reach vault.* — that's the encryption boundary.
// We call SECURITY DEFINER passthroughs in `public` (defined in migration
// 0007: create_secret_passthrough / read_secret_passthrough /
// delete_secret_passthrough) — keeps the Edge Function portable across
// Supabase project tiers without needing PostgREST's `Accept-Profile: vault`
// configuration. The passthroughs are granted to service_role only.

async function vaultCreateSecret(
  env: Env,
  secret: string,
  name: string,
): Promise<string> {
  const res = await fetch(`${env.supabaseUrl}/rest/v1/rpc/create_secret_passthrough`, {
    method: 'POST',
    headers: {
      apikey: env.serviceRoleKey,
      Authorization: `Bearer ${env.serviceRoleKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ secret, name }),
  });
  if (!res.ok) {
    const detail = await safeReadBody(res);
    throw new Error(`vault create ${res.status}: ${JSON.stringify(detail)}`);
  }
  return (await res.json()) as string;
}

async function vaultReadSecret(env: Env, secretId: string): Promise<string | null> {
  const res = await fetch(`${env.supabaseUrl}/rest/v1/rpc/read_secret_passthrough`, {
    method: 'POST',
    headers: {
      apikey: env.serviceRoleKey,
      Authorization: `Bearer ${env.serviceRoleKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ secret_id: secretId }),
  });
  if (!res.ok) {
    const detail = await safeReadBody(res);
    console.warn('[oauth-google] vault read failed:', res.status, detail);
    return null;
  }
  return ((await res.json()) as string | null) ?? null;
}

async function vaultDeleteSecret(env: Env, secretId: string): Promise<void> {
  const res = await fetch(`${env.supabaseUrl}/rest/v1/rpc/delete_secret_passthrough`, {
    method: 'POST',
    headers: {
      apikey: env.serviceRoleKey,
      Authorization: `Bearer ${env.serviceRoleKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ secret_id: secretId }),
  });
  if (!res.ok && res.status !== 404) {
    const detail = await safeReadBody(res);
    console.warn('[oauth-google] vault delete failed (continuing):', res.status, detail);
  }
}

// ---------- oauth_connections accessors ----------
//
// NOTE: the create/upsert path is inlined into the /callback handler because
// the callback uses the service-role key (no user JWT in flight at that
// point — the user is mid-redirect, not making an authenticated XHR).
// Read/delete paths use the user JWT and are factored out below.

async function getOauthConnection(
  env: Env,
  userJwt: string,
  provider: string,
): Promise<{ id: string; vault_secret_id: string | null } | null> {
  const url = new URL(`${env.supabaseUrl}/rest/v1/oauth_connections`);
  url.searchParams.set('provider', `eq.${provider}`);
  url.searchParams.set('select', 'id,vault_secret_id');
  url.searchParams.set('limit', '1');
  const res = await fetch(url.toString(), {
    headers: {
      apikey: env.anonKey,
      Authorization: `Bearer ${userJwt}`,
    },
  });
  if (!res.ok) {
    const detail = await safeReadBody(res);
    throw new Error(`oauth_connections select ${res.status}: ${JSON.stringify(detail)}`);
  }
  const rows = (await res.json()) as any[];
  return rows[0] ?? null;
}

async function deleteOauthConnection(
  env: Env,
  userJwt: string,
  provider: string,
): Promise<void> {
  const res = await fetch(
    `${env.supabaseUrl}/rest/v1/oauth_connections?provider=eq.${encodeURIComponent(provider)}`,
    {
      method: 'DELETE',
      headers: {
        apikey: env.anonKey,
        Authorization: `Bearer ${userJwt}`,
      },
    },
  );
  if (!res.ok && res.status !== 404) {
    const detail = await safeReadBody(res);
    throw new Error(`oauth_connections delete ${res.status}: ${JSON.stringify(detail)}`);
  }
}

// Delete the user's calendar / email rows for a provider on disconnect.
async function deleteProviderRows(
  env: Env,
  userJwt: string,
  provider: string,
): Promise<void> {
  const targets =
    provider === 'google_calendar'
      ? [{ table: 'calendar_events', source: 'gcal' }]
      : provider === 'google_gmail'
        ? [{ table: 'email_flags', source: 'gmail' }]
        : [];
  for (const { table, source } of targets) {
    const res = await fetch(
      `${env.supabaseUrl}/rest/v1/${table}?source=eq.${source}`,
      {
        method: 'DELETE',
        headers: {
          apikey: env.anonKey,
          Authorization: `Bearer ${userJwt}`,
        },
      },
    );
    if (!res.ok && res.status !== 404) {
      const detail = await safeReadBody(res);
      console.warn(
        `[oauth-google] delete ${table} (${source}) failed ${res.status}:`,
        detail,
      );
    }
  }
}

// ---------- google token exchange ----------

type GoogleTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
};

async function exchangeCodeForTokens(
  env: Env,
  code: string,
): Promise<GoogleTokenResponse> {
  const body = new URLSearchParams({
    code,
    client_id: env.clientId,
    client_secret: env.clientSecret,
    redirect_uri: env.redirectUri,
    grant_type: 'authorization_code',
  });
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  if (!res.ok) {
    const detail = await safeReadBody(res);
    throw new Error(`google token exchange ${res.status}: ${JSON.stringify(detail)}`);
  }
  return (await res.json()) as GoogleTokenResponse;
}

async function revokeGoogleToken(token: string): Promise<void> {
  // Google's revoke endpoint accepts either access_token or refresh_token.
  const res = await fetch(GOOGLE_REVOKE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ token }).toString(),
  });
  // Google returns 200 on success; 400 if the token is already invalid.
  // Either is fine for our purpose (we want it gone).
  if (!res.ok && res.status !== 400) {
    const detail = await safeReadBody(res);
    console.warn('[oauth-google] revoke non-2xx (continuing):', res.status, detail);
  }
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

function buildAuthUrl(env: Env, provider: string, state: string): string {
  const scopes = SCOPES_BY_PROVIDER[provider];
  const url = new URL(GOOGLE_AUTH_BASE);
  url.searchParams.set('client_id', env.clientId);
  url.searchParams.set('redirect_uri', env.redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', scopes.join(' '));
  // `access_type=offline` + `prompt=consent` together are what Google needs
  // to actually return a refresh_token. Without prompt=consent the second
  // connect for the same user returns access_token only.
  url.searchParams.set('access_type', 'offline');
  url.searchParams.set('prompt', 'consent');
  url.searchParams.set('include_granted_scopes', 'true');
  url.searchParams.set('state', state);
  return url.toString();
}

function randomNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

// ---------- handler ----------

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const envRes = readEnv();
  if (envRes.ok === false) {
    console.error('[oauth-google] missing env:', envRes.missing.join(', '));
    return errResp(500, 'server misconfigured: missing env', envRes.missing);
  }
  const env = envRes.env;

  const url = new URL(req.url);
  const path = url.pathname;

  // GET /oauth-google/start ---------------------------------------------------
  if (req.method === 'GET' && path.endsWith('/start')) {
    const userJwt = extractBearerToken(req);
    if (!userJwt) return errResp(401, 'missing Authorization Bearer token');
    const userId = parseSubFromJwt(userJwt);
    if (!userId) return errResp(401, 'jwt missing sub');

    const provider = url.searchParams.get('provider') || '';
    if (!VALID_PROVIDERS.includes(provider)) {
      return errResp(400, 'invalid provider', { valid: VALID_PROVIDERS });
    }
    const returnTo = url.searchParams.get('return_to') || env.appReturnUrl;

    const payload: StatePayload = {
      user_id: userId,
      provider,
      nonce: randomNonce(),
      return_to: returnTo,
      iat: Math.floor(Date.now() / 1000),
    };
    const state = await signState(payload, env.signingKey);
    const authUrl = buildAuthUrl(env, provider, state);

    // Return JSON (front-end opens in popup or redirects). Don't 302 here —
    // the SPA may want to control how the redirect happens.
    return json({ authUrl });
  }

  // GET /oauth-google/callback -----------------------------------------------
  // Public — Google calls this after the user grants consent. No bearer
  // token; user identity comes from the signed `state` parameter.
  if (req.method === 'GET' && path.endsWith('/callback')) {
    const code = url.searchParams.get('code');
    const stateParam = url.searchParams.get('state');
    const errorParam = url.searchParams.get('error');

    if (errorParam) {
      // User denied consent or something else upstream. Redirect back to the
      // app with an error flag so the UI can show a graceful message.
      return Response.redirect(
        `${env.appReturnUrl}?oauth_error=${encodeURIComponent(errorParam)}`,
        302,
      );
    }
    if (!code || !stateParam) {
      return errResp(400, 'callback missing code or state');
    }

    const state = await verifyState(stateParam, env.signingKey);
    if (!state) return errResp(400, 'invalid or expired state');

    let tokens: GoogleTokenResponse;
    try {
      tokens = await exchangeCodeForTokens(env, code);
    } catch (err) {
      console.error('[oauth-google] token exchange failed:', err);
      return errResp(502, 'google token exchange failed', err instanceof Error ? err.message : String(err));
    }

    if (!tokens.refresh_token) {
      // Google omits refresh_token if the user already granted consent and
      // didn't see the consent screen. We force prompt=consent above to
      // avoid this; if it still happens, surface a clear error.
      return errResp(
        500,
        'Google did not return a refresh_token. Re-authorize from a fresh consent screen.',
      );
    }

    // Store refresh_token in Vault. We persist as JSON to leave room for
    // future fields (id_token, etc.) without a schema migration.
    const tokenJson = JSON.stringify({
      refresh_token: tokens.refresh_token,
      scope: tokens.scope,
      token_type: tokens.token_type,
      stored_at: new Date().toISOString(),
    });
    let vaultSecretId: string;
    try {
      vaultSecretId = await vaultCreateSecret(
        env,
        tokenJson,
        `oauth:${state.provider}:${state.user_id}`,
      );
    } catch (err) {
      console.error('[oauth-google] vault store failed:', err);
      return errResp(500, 'failed to store refresh token', err instanceof Error ? err.message : String(err));
    }

    // Upsert oauth_connections row. We need a JWT for the user to satisfy
    // RLS. The callback doesn't have one, so we use the service-role key
    // here and pass user_id explicitly. Mirrors the pattern in
    // reminders/index.ts: service-role bypasses RLS, but we tightly scope
    // the columns we write.
    try {
      const body = {
        user_id: state.user_id,
        provider: state.provider,
        vault_secret_id: vaultSecretId,
        scopes: SCOPES_BY_PROVIDER[state.provider],
        connected_at: new Date().toISOString(),
        revoked_at: null,
      };
      const res = await fetch(`${env.supabaseUrl}/rest/v1/oauth_connections`, {
        method: 'POST',
        headers: {
          apikey: env.serviceRoleKey,
          Authorization: `Bearer ${env.serviceRoleKey}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates,return=representation',
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const detail = await safeReadBody(res);
        // Best-effort: try to delete the orphaned vault secret.
        await vaultDeleteSecret(env, vaultSecretId);
        throw new Error(`oauth_connections upsert ${res.status}: ${JSON.stringify(detail)}`);
      }
    } catch (err) {
      console.error('[oauth-google] connection upsert failed:', err);
      return errResp(500, 'failed to record connection', err instanceof Error ? err.message : String(err));
    }

    // Fetch Google userinfo to populate the profiles row (display_name).
    // Non-fatal: a failed userinfo fetch should not block the connect flow.
    try {
      const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      if (userinfoRes.ok) {
        const userinfo = (await userinfoRes.json()) as { name?: string; email?: string };
        // Upsert (merge-duplicates) so the row is created for anon users too.
        await fetch(`${env.supabaseUrl}/rest/v1/profiles`, {
          method: 'POST',
          headers: {
            apikey: env.serviceRoleKey,
            Authorization: `Bearer ${env.serviceRoleKey}`,
            'Content-Type': 'application/json',
            Prefer: 'resolution=merge-duplicates,return=minimal',
          },
          body: JSON.stringify({
            id: state.user_id,
            display_name: userinfo.name || null,
          }),
        });
      }
    } catch (err) {
      console.warn('[oauth-google] userinfo/profile upsert failed (non-fatal):', err);
    }

    // Redirect back to the app. The UI then fires sync-calendar / sync-email
    // to backfill — see web/intently-extras.jsx OAuthFlow rewrite.
    const returnUrl = new URL(state.return_to);
    returnUrl.searchParams.set('connected', state.provider);
    return Response.redirect(returnUrl.toString(), 302);
  }

  // POST /oauth-google/disconnect --------------------------------------------
  if (req.method === 'POST' && path.endsWith('/disconnect')) {
    const userJwt = extractBearerToken(req);
    if (!userJwt) return errResp(401, 'missing Authorization Bearer token');
    const userId = parseSubFromJwt(userJwt);
    if (!userId) return errResp(401, 'jwt missing sub');

    let raw: any;
    try {
      raw = await req.json();
    } catch {
      return errResp(400, 'invalid JSON body');
    }
    const provider = raw?.provider;
    if (!VALID_PROVIDERS.includes(provider)) {
      return errResp(400, 'body.provider must be a valid provider', { valid: VALID_PROVIDERS });
    }

    // 1. Look up the connection (RLS-scoped via the user JWT).
    const conn = await getOauthConnection(env, userJwt, provider);

    // 2. Best-effort: revoke the refresh token at Google.
    if (conn?.vault_secret_id) {
      try {
        const decrypted = await vaultReadSecret(env, conn.vault_secret_id);
        if (decrypted) {
          try {
            const parsed = JSON.parse(decrypted);
            if (parsed?.refresh_token) await revokeGoogleToken(parsed.refresh_token);
          } catch {
            // Not JSON — pass the raw string as the token (legacy / fallback).
            await revokeGoogleToken(decrypted);
          }
        }
      } catch (err) {
        console.warn('[oauth-google] revoke step failed (continuing):', err);
      }
      // 3. Delete the vault secret regardless of revoke success.
      await vaultDeleteSecret(env, conn.vault_secret_id);
    }

    // 4. Delete provider rows from calendar_events / email_flags.
    await deleteProviderRows(env, userJwt, provider);

    // 5. Delete the oauth_connections row.
    await deleteOauthConnection(env, userJwt, provider);

    return json({ disconnected: true, provider });
  }

  return errResp(
    404,
    'not found — try GET /oauth-google/start, GET /oauth-google/callback, or POST /oauth-google/disconnect',
  );
});
