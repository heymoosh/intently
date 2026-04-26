// Shared user-profile context for the web prototype.
//
// All identity surfaces (avatar, greeting, byline) read from a single
// source: the `profiles` row keyed on auth.uid(). The row is populated by
// the `handle_new_auth_user` trigger in migration 0001 — we still defend
// against a missing row in case the trigger hasn't run for older anon
// sessions.
//
// Three exports on window:
//   • getCurrentProfile()            async — fetch + cache the profile shape.
//   • useUserProfile()               React hook — returns { displayName, initial, email, ready }.
//   • _resetUserProfileCache()       test/dev — clear the cache (e.g. after sign-out).
//
// Returned shape is intentionally minimal:
//   {
//     displayName: string | null,    // profiles.display_name, may be null/empty
//     email:       string | null,    // auth.user.email, null for anon users
//     initial:     string,            // first letter for avatars; '?' fallback
//   }
//
// Fallback chain for `initial`:
//   1. First non-whitespace char of displayName (uppercased)
//   2. First non-whitespace char of email (uppercased)
//   3. '?' — anon user with no display_name and no email
//
// Greetings should treat null/empty displayName by dropping the name
// entirely ("Good morning." not "Good morning, ."). See call sites for the
// pattern. Bylines fall back to "—".

let _profileCache = null;
let _profilePromise = null;

function _initialFrom(displayName, email) {
  const _firstChar = (s) => {
    if (!s) return null;
    const t = String(s).trim();
    return t ? t.charAt(0).toUpperCase() : null;
  };
  return _firstChar(displayName) || _firstChar(email) || '?';
}

async function getCurrentProfile() {
  if (_profileCache) return _profileCache;
  if (_profilePromise) return _profilePromise;

  _profilePromise = (async () => {
    if (!window.getSupabaseClient || !window.ensureAuthSession) {
      // libs not loaded yet — return an anonymous-empty shape so first paint
      // doesn't crash. Caller will re-resolve after libs come up.
      return { displayName: null, email: null, initial: '?' };
    }
    try {
      const user = await window.ensureAuthSession();
      const sb = window.getSupabaseClient();
      const { data, error } = await sb
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .maybeSingle();
      if (error) {
        console.warn('[user-profile] fetch failed:', error.message);
      }
      const displayName = (data && data.display_name) || null;
      const email = user.email || null;
      const profile = {
        displayName,
        email,
        initial: _initialFrom(displayName, email),
      };
      _profileCache = profile;
      return profile;
    } catch (err) {
      console.warn('[user-profile] error:', err && err.message);
      return { displayName: null, email: null, initial: '?' };
    } finally {
      _profilePromise = null;
    }
  })();

  return _profilePromise;
}

// React hook — returns the profile + a `ready` flag. While loading,
// `displayName` is null and `initial` is '?'. Components should treat
// these as the empty state (drop the name from greetings, show '?' in
// the avatar) so first paint is stable.
function useUserProfile() {
  const initial = _profileCache || { displayName: null, email: null, initial: '?' };
  const [profile, setProfile] = React.useState({ ...initial, ready: !!_profileCache });
  React.useEffect(() => {
    let cancelled = false;
    getCurrentProfile().then((p) => {
      if (!cancelled) setProfile({ ...p, ready: true });
    });
    return () => { cancelled = true; };
  }, []);
  return profile;
}

function _resetUserProfileCache() {
  _profileCache = null;
  _profilePromise = null;
}

Object.assign(window, {
  getCurrentProfile,
  useUserProfile,
  _resetUserProfileCache,
});
