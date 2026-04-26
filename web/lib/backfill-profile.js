// backfill-profile.js — run-once helper that patches profiles.display_name
// for users who connected Google before PR #205 deployed (the /callback
// handler didn't populate the profile row at that time).
//
// Called fire-and-forget on app mount (see index.html). Safe to call
// repeatedly — the Edge Function skips the backfill if display_name is
// already set.
//
// Flow:
//   1. Skip if demo mode.
//   2. Check if profile already has a display_name (client-side fast-exit).
//   3. Check if user has at least one google oauth_connection row.
//   4. POST /functions/v1/oauth-google/refresh-profile — Edge Function
//      exchanges the stored refresh_token for a fresh access_token, fetches
//      Google userinfo, and upserts profiles.display_name.
//   5. On success, bust the user-profile cache so useUserProfile() re-reads.

async function backfillProfileFromGoogleIfMissing() {
  try {
    if (window.INTENTLY_DEMO) return;
    if (!window.getSupabaseClient || !window.ensureAuthSession) return;

    const user = await window.ensureAuthSession();
    if (!user || !user.id) return;

    const sb = window.getSupabaseClient();

    // Fast-exit: profile already populated.
    const { data: profile } = await sb
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .maybeSingle();
    if (profile?.display_name) return;

    // Fast-exit: no google connection exists, nothing to backfill from.
    const { data: connections } = await sb
      .from('oauth_connections')
      .select('provider')
      .eq('user_id', user.id);
    const hasGoogle = Array.isArray(connections) && connections.some(
      (c) => c.provider === 'google_calendar' || c.provider === 'google_gmail',
    );
    if (!hasGoogle) return;

    // Call the Edge Function to fetch userinfo + upsert display_name.
    const { data: sessionData } = await sb.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    if (!accessToken) return;

    const supabaseUrl = (window.INTENTLY_CONFIG && window.INTENTLY_CONFIG.supabaseUrl) || '';
    if (!supabaseUrl) return;

    const res = await fetch(`${supabaseUrl}/functions/v1/oauth-google/refresh-profile`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.warn('[backfill-profile] refresh-profile failed:', res.status, body);
      return;
    }

    const result = await res.json().catch(() => ({}));
    if (result.ok && !result.skipped && result.name) {
      // Bust the profile cache so useUserProfile() reflects the new name on
      // the next render cycle.
      if (window._resetUserProfileCache) window._resetUserProfileCache();
      console.log('[backfill-profile] display_name backfilled:', result.name);
    }
  } catch (err) {
    // Non-fatal — never block app load.
    console.warn('[backfill-profile] error (non-fatal):', err && err.message);
  }
}

window.backfillProfileFromGoogleIfMissing = backfillProfileFromGoogleIfMissing;
