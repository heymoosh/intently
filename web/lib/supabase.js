// Singleton Supabase client for the web prototype. Wraps the UMD bundle
// loaded in index.html (`<script src=".../@supabase/supabase-js@2"></script>`)
// which exposes `window.supabase = { createClient, ... }`.
//
// Reads URL + anon key from window.INTENTLY_CONFIG (set inline in index.html).
// Anon key is RLS-gated and intentionally safe to commit; the service-role key
// stays in BWS / Supabase env.
//
// Lazy: the client is created on first getSupabaseClient() call so the rest of
// the prototype keeps loading even if the UMD script blocks or fails. Failure
// surfaces at call-time, not at script-load time.
//
// Ported in spirit from app/lib/supabase.ts. Differences:
//   - process.env.* → window.INTENTLY_CONFIG.*
//   - TypeScript stripped
//   - Singleton instead of module-level export
//   - Exports attached to window for cross-script access

let _client = null;

function getSupabaseClient() {
  if (_client) return _client;

  const cfg = window.INTENTLY_CONFIG || {};
  const url = cfg.supabaseUrl;
  const anonKey = cfg.supabaseAnonKey;

  if (!url || !anonKey) {
    throw new Error(
      'INTENTLY_CONFIG.supabaseUrl / supabaseAnonKey missing — cannot create Supabase client.',
    );
  }

  const sb = window.supabase;
  if (!sb || typeof sb.createClient !== 'function') {
    throw new Error(
      'window.supabase.createClient not found — is the @supabase/supabase-js UMD bundle loaded?',
    );
  }

  _client = sb.createClient(url, anonKey, {
    auth: {
      // No auth flow yet (V1 single-user). Mirrors app/lib/supabase.ts.
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  return _client;
}

// V1 single-user per ADR 0002 — Muxin dogfoods alone, no auth wired yet, so
// every row gets stamped with this hardcoded UUID. Replace with the real
// auth.uid() lookup once the auth flow lands.
const V1_USER_ID = '00000000-0000-0000-0000-000000000000';

function getCurrentUserId() {
  return V1_USER_ID;
}

Object.assign(window, { getSupabaseClient, getCurrentUserId });
