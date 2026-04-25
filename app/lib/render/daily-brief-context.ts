// renderDailyBriefContext — DB rows → markdown context for the daily-brief
// agent. Pure function; the caller passes in a SupabaseClient (real or mocked
// in tests) and a "today" Date so renders are deterministic and time-zone-safe
// at the boundary instead of leaking new Date() into the body.
//
// Output shape mirrors app/fixtures/daily-brief-seed.ts → DAILY_BRIEF_DEMO_INPUT
// so the agent reads the same structure whether context is rendered live from
// the DB or piped from the demo fixture.
//
// "Yesterday's Daily Log" pulls the most recent brief/review AND the most
// recent journal, both bounded to yesterday — section header is yesterday-
// scoped, so older entries leaking in would mis-name the section.

import type { SupabaseClient } from '@supabase/supabase-js';

const USER_DISPLAY_NAME = 'Sam'; // user-name lookup is post-V1; matches demo persona.

type GoalRow = {
  title: string;
  monthly_slice: string | null;
  position: number | null;
};

type EntryRow = {
  kind: 'brief' | 'journal' | 'chat' | 'review';
  title: string | null;
  body_markdown: string;
  at: string;
};

type Todo = {
  id?: string;
  text: string;
  done: boolean;
  created_at?: string;
};

type ProjectRow = {
  title: string;
  status: 'active' | 'parked' | 'done';
  is_admin: boolean;
  todos: Todo[];
};

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

export async function renderDailyBriefContext(
  supabase: SupabaseClient,
  userId: string,
  today: Date
): Promise<string> {
  const todayStart = startOfLocalDay(today);
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const todayStartIso = todayStart.toISOString();
  const yesterdayStartIso = yesterdayStart.toISOString();

  const [goalsRes, yLogRes, yJournalRes, projectsRes] = await Promise.all([
    supabase
      .from('goals')
      .select('title, monthly_slice, position')
      .eq('user_id', userId)
      .is('archived_at', null)
      .order('position', { ascending: true }),
    supabase
      .from('entries')
      .select('kind, title, body_markdown, at')
      .eq('user_id', userId)
      .in('kind', ['brief', 'review'])
      .gte('at', yesterdayStartIso)
      .lt('at', todayStartIso)
      .order('at', { ascending: false })
      .limit(1),
    supabase
      .from('entries')
      .select('kind, title, body_markdown, at')
      .eq('user_id', userId)
      .eq('kind', 'journal')
      .gte('at', yesterdayStartIso)
      .lt('at', todayStartIso)
      .order('at', { ascending: false })
      .limit(1),
    supabase
      .from('projects')
      .select('title, status, is_admin, todos')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('is_admin', { ascending: true })
      .order('title', { ascending: true }),
  ]);

  const goals = (goalsRes.data ?? []) as GoalRow[];
  const yLog = (yLogRes.data ?? []) as EntryRow[];
  const yJournal = (yJournalRes.data ?? []) as EntryRow[];
  const projects = (projectsRes.data ?? []) as ProjectRow[];

  const dateStr = formatLocalDate(today);
  const weekday = WEEKDAYS[today.getDay()];

  const out: string[] = [];
  out.push(`Today: ${dateStr} (${weekday})`);
  out.push(`User: ${USER_DISPLAY_NAME}`);
  out.push('');

  out.push('## Weekly Goals (current week)');
  if (goals.length === 0) {
    out.push('- (none)');
  } else {
    for (const g of goals) {
      const slice = g.monthly_slice?.trim() || g.title;
      out.push(`- ${slice}`);
    }
  }
  out.push('');

  out.push("## Yesterday's Daily Log");
  if (yLog.length === 0 && yJournal.length === 0) {
    out.push('- (none)');
  } else {
    if (yLog[0]) {
      const e = yLog[0];
      out.push(`- ${labelForEntry(e)}: ${e.body_markdown.trim()}`);
    }
    if (yJournal[0]) {
      const e = yJournal[0];
      out.push(`- Journal: "${e.body_markdown.trim()}"`);
    }
  }
  out.push('');

  out.push("## Today's Calendar");
  out.push('- not_connected');
  out.push('');

  out.push('## Email');
  out.push('- not_connected');
  out.push('');

  out.push('## Recent project state');
  if (projects.length === 0) {
    out.push('- (none)');
  } else {
    for (const p of projects) {
      const recentDone = recentDoneTodos(p.todos ?? [], 2);
      const tail = recentDone.length > 0
        ? ` — recently done: ${recentDone.map((t) => t.text).join('; ')}`
        : '';
      out.push(`- ${p.title} (${p.status})${tail}`);
    }
  }

  return out.join('\n');
}

function labelForEntry(e: EntryRow): string {
  if (e.kind === 'review') return 'Review';
  if (e.kind === 'brief') return 'Brief';
  return e.kind;
}

function recentDoneTodos(todos: Todo[], n: number): Todo[] {
  return todos
    .filter((t) => t && t.done === true)
    .sort((a, b) => {
      const at = a.created_at ?? '';
      const bt = b.created_at ?? '';
      if (at === bt) return 0;
      return at < bt ? 1 : -1;
    })
    .slice(0, n);
}
