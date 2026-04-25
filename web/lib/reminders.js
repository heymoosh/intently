// Fetches due reminders from the Supabase /reminders/due endpoint. Used to
// inject "due reminders" context into the daily-brief agent's input so the
// brief can surface commitments the user made in prior sessions.
//
// Ported from app/lib/reminders.ts. Differences:
//   - process.env.EXPO_PUBLIC_SUPABASE_URL → window.INTENTLY_CONFIG.supabaseUrl
//   - TypeScript types stripped
//   - Exports attached to window for cross-script access
//
// Graceful fallback: if the endpoint isn't deployed yet or returns an error,
// fetchDueReminders returns []. The brief still runs, just without the
// memory-moment beat.

async function fetchDueReminders(date = new Date()) {
  const supabaseUrl = window.INTENTLY_CONFIG && window.INTENTLY_CONFIG.supabaseUrl;
  if (!supabaseUrl) return [];
  const iso = date.toISOString().slice(0, 10);
  const endpoint = `${supabaseUrl.replace(/\/+$/, '')}/functions/v1/reminders/due?date=${iso}`;
  try {
    const res = await fetch(endpoint, { method: 'GET' });
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
// Returns { kind: 'reminder' | 'conversation' | 'noop', message?: string, reminder?: object }
// or null on transport failure (caller renders a generic acknowledgment).
async function classifyTranscript(transcript) {
  const supabaseUrl = window.INTENTLY_CONFIG && window.INTENTLY_CONFIG.supabaseUrl;
  if (!supabaseUrl || !transcript || !transcript.trim()) return null;
  const endpoint = `${supabaseUrl.replace(/\/+$/, '')}/functions/v1/reminders/classify-and-store`;
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

Object.assign(window, { fetchDueReminders, formatRemindersForInput, classifyTranscript });
