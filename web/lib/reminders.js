// Frontend caller for the reminders Edge Function. Two responsibilities:
//
// 1. fetchDueReminders — pulls pending reminders for the daily-brief input
//    assembly so the brief can surface commitments the user made earlier.
//
// 2. classifyTranscript — sends a chat/voice transcript to classify-and-store
//    so the agent can decide reminder-vs-conversation and persist if so.
//
// Both attach the current Supabase session JWT as `Authorization: Bearer
// <token>` so the Edge Function can write/read as the actual user (RLS
// scopes everything to auth.uid() = user_id, see migration 0003). Without
// the JWT the Edge Function 401s — there is no service-role fallback.
//
// classifyTranscript also forwards the user's local-today (YYYY-MM-DD) so
// "tomorrow" / "Tuesday" resolve relative to the user's timezone, not UTC.

// Resolve the current session token. Returns the JWT string, or null if
// there's no session yet (caller should bail gracefully). On normal flows
// `ensureAuthSession()` from web/lib/supabase.js fires anonymous sign-in at
// app boot, so this should almost always return a token.
async function getSessionAccessToken() {
  if (typeof window === 'undefined' || typeof window.getSupabaseClient !== 'function') return null;
  try {
    const client = window.getSupabaseClient();
    const { data } = await client.auth.getSession();
    return (data && data.session && data.session.access_token) || null;
  } catch {
    return null;
  }
}

// User-local YYYY-MM-DD via en-CA, which formats dates as ISO regardless of
// locale. This is what the Edge Function expects in the optional `today`
// field.
function localTodayIso() {
  return new Date().toLocaleDateString('en-CA');
}

async function fetchDueReminders(date = new Date()) {
  const supabaseUrl = window.INTENTLY_CONFIG && window.INTENTLY_CONFIG.supabaseUrl;
  if (!supabaseUrl) return [];
  const token = await getSessionAccessToken();
  if (!token) return [];
  const iso = date.toLocaleDateString('en-CA');
  const endpoint = `${supabaseUrl.replace(/\/+$/, '')}/functions/v1/reminders/due?date=${iso}`;
  try {
    const res = await fetch(endpoint, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];
    const body = await res.json();
    return (body && body.reminders) || [];
  } catch {
    return [];
  }
}

// Format reminders as a "Due reminders" section to append to brief input.
function formatRemindersForInput(reminders) {
  if (reminders.length === 0) return '';
  const lines = reminders.map((r) => `- ${r.text} (due ${r.remind_on})`);
  return [
    '',
    '## Due reminders (from prior sessions)',
    'The user set these as explicit commitments. Surface ones that land naturally in the day\'s shape — don\'t just list them.',
    ...lines,
    '',
  ].join('\n');
}

// Send a captured voice/text transcript to the classify-and-store Edge Function.
// The agent decides reminder-vs-conversation and persists if applicable.
// Returns { classified: boolean, reminder?: object, reason?: string }
// or null on transport / auth failure (caller renders a generic acknowledgment).
async function classifyTranscript(transcript) {
  const supabaseUrl = window.INTENTLY_CONFIG && window.INTENTLY_CONFIG.supabaseUrl;
  if (!supabaseUrl || !transcript || !transcript.trim()) return null;
  const token = await getSessionAccessToken();
  if (!token) return null;
  const endpoint = `${supabaseUrl.replace(/\/+$/, '')}/functions/v1/reminders/classify-and-store`;
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ transcript, today: localTodayIso() }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

Object.assign(window, { fetchDueReminders, formatRemindersForInput, classifyTranscript });
