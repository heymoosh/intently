// Singleton Supabase client for the web prototype. Wraps the UMD bundle
// loaded in index.html (`<script src=".../@supabase/supabase-js@2"></script>`)
// which exposes `window.supabase = { createClient, ... }`.
//
// Reads URL + publishable key from window.INTENTLY_CONFIG (set inline in
// index.html). Publishable key is RLS-gated and intentionally safe to commit;
// the secret key stays in BWS / Supabase env.
//
// Auth: V1 single-user (ADR 0002). On first client construction we kick off an
// anonymous sign-in so every browser session gets a stable auth.uid() that
// satisfies the owner-only RLS policies in 0001/0003/0004/0005. Anonymous users
// are persisted to localStorage (so refresh keeps the same uid + the same data),
// and each browser/device gets its own scoped data — no multi-device sync until
// real sign-in lands.
//
// Lazy: the client is created on first getSupabaseClient() call so the rest of
// the prototype keeps loading even if the UMD script blocks or fails. Failure
// surfaces at call-time, not at script-load time.

let _client = null;
let _authPromise = null;

function getSupabaseClient() {
  if (_client) return _client;

  const cfg = window.INTENTLY_CONFIG || {};
  const url = cfg.supabaseUrl;
  // Accept either name during the anon→publishable transition window.
  const apiKey = cfg.supabasePublishableKey || cfg.supabaseAnonKey;

  if (!url || !apiKey) {
    throw new Error(
      'INTENTLY_CONFIG.supabaseUrl / supabasePublishableKey missing — cannot create Supabase client.',
    );
  }

  const sb = window.supabase;
  if (!sb || typeof sb.createClient !== 'function') {
    throw new Error(
      'window.supabase.createClient not found — is the @supabase/supabase-js UMD bundle loaded?',
    );
  }

  _client = sb.createClient(url, apiKey, {
    auth: {
      // Persist the anonymous session so refresh keeps the same auth.uid()
      // (and therefore the same scoped data).
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      storageKey: 'intently-auth',
    },
  });
  return _client;
}

// Ensure there's a session (anonymous if no real sign-in). Idempotent —
// the same Promise is returned on concurrent calls.
async function ensureAuthSession() {
  if (_authPromise) return _authPromise;
  _authPromise = (async () => {
    const client = getSupabaseClient();
    const { data } = await client.auth.getSession();
    if (data && data.session && data.session.user) return data.session.user;
    const { data: signed, error } = await client.auth.signInAnonymously();
    if (error) {
      _authPromise = null; // allow retry
      throw error;
    }
    return signed.user;
  })();
  return _authPromise;
}

// Returns the current auth.uid(). Awaits anonymous sign-in on first call so
// inserts always include a user_id that matches RLS.
async function getCurrentUserId() {
  const user = await ensureAuthSession();
  return user.id;
}

Object.assign(window, { getSupabaseClient, getCurrentUserId, ensureAuthSession });
