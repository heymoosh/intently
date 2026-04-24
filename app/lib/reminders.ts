// Fetches due reminders from the Supabase /reminders/due endpoint (built by
// the parallel reminders-backend agent; see supabase/functions/reminders/).
// Used to inject "due reminders" context into the daily-brief agent's input
// so the brief can surface commitments the user made in prior sessions.
//
// Graceful fallback: if the endpoint isn't deployed yet or returns an error,
// we return an empty list — the brief still runs against the rest of its
// context, just without the memory-moment beat.

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;

export type DueReminder = {
  id: string;
  text: string;
  remind_on: string;
  status: 'pending' | 'surfaced' | 'done' | 'dismissed';
};

export async function fetchDueReminders(date: Date = new Date()): Promise<DueReminder[]> {
  if (!SUPABASE_URL) return [];
  const iso = date.toISOString().slice(0, 10);
  const endpoint = `${SUPABASE_URL.replace(/\/+$/, '')}/functions/v1/reminders/due?date=${iso}`;
  try {
    const res = await fetch(endpoint, { method: 'GET' });
    if (!res.ok) return [];
    const body = (await res.json()) as { reminders?: DueReminder[] };
    return body.reminders ?? [];
  } catch {
    return [];
  }
}

// Format the reminders as a "Due reminders" section to append to the brief's
// input payload. Agent reads this alongside calendar/journal/yesterday's log
// and decides how to surface it (usually opens with or weaves into pacing).
export function formatRemindersForInput(reminders: DueReminder[]): string {
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
