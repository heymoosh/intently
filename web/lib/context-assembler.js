// Context assembler — reads the user's persisted state (goals, projects,
// recent entries, yesterday's review, due reminders, today's plan, today's
// calendar, urgent emails) and formats them into markdown the daily-brief /
// daily-review agent consumes as input.
//
// Why this exists: agents/daily-brief/ma-agent-config.json's V1 banner says
// "treat the input as if you had already executed every 'read X' step." Until
// real file/MCP tooling lands, the assembler IS those reads — runs in the
// browser, hits Supabase, formats the result, hands the markdown string to
// callMaProxy.
//
// Token policy (from .claude/handoffs/real-app-cognition.md):
//   - Active goals: top 3 (data model caps at 3 anyway)
//   - Recent entries: last 14 days, but the *transmitted* slice is much smaller
//   - Reminders: due in next 7 days OR already overdue
//   - Today's plan_items / calendar / urgent emails: all (small)
//
// Compression strategy (review-as-summary):
//   - When a `kind='review'` entry exists within the last 2 days, treat IT as
//     the compression of recent days — skip raw journals entirely. The review's
//     `journal_text` field IS the summary of what mattered.
//   - Otherwise include up to 3 raw journals (most recent first).
//   - Same pattern applies to weekly-review when wired (Task #18): when this
//     week's WeeklyReview exists, brief reads its outcomes summary, not 14
//     days of entries.
//
// Cost target (V1 single-brief input): ~1.2-1.8K tokens with review-as-summary
// active, ~2K without. Steady-state ~$0.005/brief.
//
// Future optimization (Task #24 — Anthropic prompt caching):
//   ma-proxy passes cache_control: ephemeral on the stable context blocks
//   (goals + projects + monthly slice). 5-minute server-side TTL cuts cost
//   ~70-80% at steady state. Not done in this PR — needs ma-proxy edits.
//
// Anti-pattern guard: this module never asks the user for input that already
// exists in the DB. If the assembler can't find a fact, the brief proceeds
// without it; the agent's prompt knows how to say "no calendar connected" etc.

const _DAY_MS = 24 * 60 * 60 * 1000;

// Format a Date as "YYYY-MM-DD" in local time.
function _isoDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Format "Apr 23" / "Mon Apr 21" relative-friendly date.
function _shortDate(d) {
  const dayName = d.toLocaleString('en-US', { weekday: 'short' });
  const month = d.toLocaleString('en-US', { month: 'short' });
  return `${dayName} ${month} ${d.getDate()}`;
}

// Parse the JSON tail off a review entry (matches the agent's Output contract).
function _parseReviewTail(bodyMarkdown) {
  if (!bodyMarkdown) return null;
  const match = bodyMarkdown.match(/```json\s*([\s\S]*?)\s*```\s*$/);
  if (!match) return null;
  try { return JSON.parse(match[1]); } catch { return null; }
}

// Strip the JSON tail off a review entry's prose body.
function _stripJsonTail(bodyMarkdown) {
  if (!bodyMarkdown) return '';
  return bodyMarkdown.replace(/```json[\s\S]*$/, '').trim();
}

// Read everything the brief / review needs in parallel. Single chokepoint —
// callers don't make extra DB round-trips.
async function _gatherUserState() {
  const sb = window.getSupabaseClient ? window.getSupabaseClient() : null;
  if (!sb) return null;
  const userId = await window.getCurrentUserId();
  const today = new Date();
  const todayStr = _isoDate(today);

  // 14-day window for entries; 7-day forward window for reminders.
  const entriesSince = new Date(today.getTime() - 14 * _DAY_MS).toISOString();
  const remindersUntil = _isoDate(new Date(today.getTime() + 7 * _DAY_MS));

  const [goals, projects, recentEntries, todayPlan, dueReminders, todayCal, urgentEmails] = await Promise.all([
    // Top 3 active goals
    sb.from('goals').select('*')
      .eq('user_id', userId).is('archived_at', null)
      .order('position', { ascending: true, nullsFirst: false })
      .limit(3)
      .then((r) => r.data || []),
    // Active projects
    sb.from('projects').select('*')
      .eq('user_id', userId).eq('status', 'active')
      .order('updated_at', { ascending: false })
      .then((r) => r.data || []),
    // Last 14 days of entries (journal/chat/review)
    sb.from('entries').select('*')
      .eq('user_id', userId).gte('at', entriesSince)
      .order('at', { ascending: false })
      .then((r) => r.data || []),
    // Today's plan items
    sb.from('plan_items').select('*')
      .eq('user_id', userId).eq('date', todayStr)
      .order('position', { ascending: true, nullsFirst: false })
      .then((r) => r.data || []),
    // Reminders due in the next 7 days OR overdue
    sb.from('reminders').select('*')
      .eq('user_id', userId).eq('status', 'pending').lte('remind_on', remindersUntil)
      .order('remind_on', { ascending: true })
      .then((r) => r.data || []),
    // Today's calendar (skip if table missing)
    sb.from('calendar_events').select('*')
      .eq('user_id', userId)
      .gte('starts_at', new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString())
      .lt('starts_at', new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString())
      .order('starts_at', { ascending: true })
      .then((r) => r.data || []).catch(() => []),
    // Urgent or awaiting-reply emails (skip if table missing)
    sb.from('email_flags').select('*')
      .eq('user_id', userId).or('is_urgent.eq.true,awaiting_reply.eq.true')
      .order('received_at', { ascending: false })
      .limit(8)
      .then((r) => r.data || []).catch(() => []),
  ]);

  return {
    today,
    todayStr,
    goals,
    projects,
    recentEntries,
    todayPlan,
    dueReminders,
    todayCal,
    urgentEmails,
  };
}

// Format the markdown sections common to both brief and review.
function _formatGoals(goals) {
  if (goals.length === 0) return '## Active goals\nNo goals set yet.\n';
  const lines = goals.map((g, i) => {
    const slice = g.monthly_slice ? `\n  - This month: ${g.monthly_slice}` : '';
    return `${i + 1}. **${g.title}**${slice}`;
  });
  return `## Active goals\n${lines.join('\n')}\n`;
}

function _formatProjects(projects) {
  const active = projects.filter((p) => !p.is_admin);
  if (active.length === 0) return '';
  const lines = active.map((p) => {
    const todos = Array.isArray(p.todos) ? p.todos : [];
    const open = todos.filter((t) => !t.done).slice(0, 3);
    const todoLine = open.length
      ? `\n  Open: ${open.map((t) => t.text).join(' · ')}`
      : '';
    return `- **${p.title}** (${p.status})${todoLine}`;
  });
  return `## Active projects\n${lines.join('\n')}\n`;
}

function _formatYesterdayReview(entries) {
  // Find most recent review entry within the window
  const review = entries.find((e) => e.kind === 'review');
  if (!review) return '';
  const tail = _parseReviewTail(review.body_markdown);
  const prose = _stripJsonTail(review.body_markdown);
  const at = new Date(review.at);
  const lines = [`## Yesterday's review (${_shortDate(at)})`];
  if (prose) lines.push(prose);
  if (tail) {
    if (tail.friction && tail.friction.length) {
      lines.push('', '**Friction noted:**');
      tail.friction.forEach((f) => lines.push(`- ${f.text || f}`));
    }
    if (tail.tomorrow && tail.tomorrow.length) {
      lines.push('', '**Committed to today:**');
      tail.tomorrow.forEach((t) => lines.push(`- ${t.text || t}${t.tier ? ` (${t.tier})` : ''}`));
    }
  }
  return lines.join('\n') + '\n';
}

// Compression-aware journal section. If a review entry exists within the last
// 2 days, that review IS the summary — skip the raw journals to save tokens.
// Otherwise include up to `limit` most recent journal entries.
function _formatRecentJournal(entries, limit = 3, hasRecentReview = false) {
  if (hasRecentReview) return '';
  const journal = entries.filter((e) => e.kind === 'journal').slice(0, limit);
  if (journal.length === 0) return '';
  const lines = journal.map((e) => {
    const at = new Date(e.at);
    return `- **${_shortDate(at)}**: ${e.body_markdown}`;
  });
  return `## Recent journal entries\n${lines.join('\n')}\n`;
}

// Detect if there's a review entry within the last 2 days (used to short-
// circuit raw-journal transmission per the review-as-summary policy).
function _hasRecentReview(entries) {
  const cutoff = Date.now() - 2 * _DAY_MS;
  return entries.some((e) => e.kind === 'review' && new Date(e.at).getTime() >= cutoff);
}

function _formatTodayPlan(planItems) {
  if (planItems.length === 0) return '';
  const byBand = { morning: [], afternoon: [], evening: [] };
  planItems.forEach((p) => { if (byBand[p.band]) byBand[p.band].push(p); });
  const lines = ['## Today\'s plan (already laid out)'];
  for (const band of ['morning', 'afternoon', 'evening']) {
    if (byBand[band].length === 0) continue;
    lines.push(`**${band.charAt(0).toUpperCase() + band.slice(1)}:**`);
    byBand[band].forEach((p) => lines.push(`- ${p.text}${p.tier ? ` (${p.tier})` : ''}${p.done ? ' ✓' : ''}`));
  }
  return lines.join('\n') + '\n';
}

function _formatReminders(reminders) {
  if (reminders.length === 0) return '';
  const lines = reminders.map((r) => `- ${r.text} (due ${r.remind_on})`);
  return `## Due reminders (from prior captures)\n${lines.join('\n')}\n`;
}

function _formatCalendar(events) {
  if (events.length === 0) return '## Today\'s calendar\nNo calendar events.\n';
  const lines = events.map((e) => {
    const start = new Date(e.starts_at);
    const time = start.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit' });
    return `- ${time}: ${e.title}`;
  });
  return `## Today's calendar\n${lines.join('\n')}\n`;
}

function _formatEmails(emails) {
  if (emails.length === 0) return '';
  const lines = emails.map((e) => {
    const tags = [];
    if (e.is_urgent) tags.push('urgent');
    if (e.awaiting_reply) tags.push('awaiting reply');
    const tagStr = tags.length ? ` (${tags.join(', ')})` : '';
    return `- ${e.sender}: "${e.subject}"${tagStr}`;
  });
  return `## Email flags\n${lines.join('\n')}\n`;
}

// Build the "what did the assembler actually consult" list — used by the
// confirm cards' InputTrace UI to surface ethical-AI explain-before-you-act.
function _buildConsulted(state, opts = {}) {
  const consulted = [];
  if (state.goals && state.goals.length > 0) consulted.push('goals');
  if (state.projects && state.projects.filter((p) => !p.is_admin).length > 0) consulted.push('projects');
  if (opts.hasYesterdayReview) consulted.push('yesterday-review');
  if (opts.hasRecentJournal) consulted.push('journal');
  if (state.todayPlan && state.todayPlan.length > 0) consulted.push('plan');
  if (state.dueReminders && state.dueReminders.length > 0) consulted.push('reminders');
  if (state.todayCal && state.todayCal.length > 0) consulted.push('calendar');
  if (state.urgentEmails && state.urgentEmails.length > 0) consulted.push('email');
  return consulted;
}

// Detect: is there a yesterday-or-recent review entry? (Used both for trace
// + for the review-as-summary compression branch in the journal section.)
function _hasYesterdayReviewEntry(entries) {
  return entries.some((e) => e.kind === 'review');
}

function _hasJournalEntry(entries) {
  return entries.some((e) => e.kind === 'journal');
}

// Public: assemble the markdown context for a daily brief. The brief flow's
// per-turn user input (the "what's alive?" / "what to park?" answers) gets
// appended below this; the agent sees user state THEN today's conversation.
//
// Returns { input: string, consulted: string[] } so the calling UI can render
// an InputTrace ("consulted: goals, journal, calendar, email…") on the confirm
// card per ethical-AI design principle "explain before you act."
async function assembleBriefContext(userAnswers = []) {
  const state = await _gatherUserState();
  if (!state) return { input: userAnswers.join('\n\n'), consulted: [] };

  const hasReview = _hasRecentReview(state.recentEntries);
  const sections = [
    `# Morning brief context for ${_shortDate(state.today)}`,
    '',
    _formatGoals(state.goals),
    _formatProjects(state.projects),
    _formatYesterdayReview(state.recentEntries),
    _formatRecentJournal(state.recentEntries, 3, hasReview),
    _formatReminders(state.dueReminders),
    _formatCalendar(state.todayCal),
    _formatEmails(state.urgentEmails),
  ].filter(Boolean);

  if (userAnswers.length > 0) {
    sections.push('## What the user just told you in this brief conversation');
    userAnswers.forEach((a, i) => sections.push(`${i + 1}. ${a}`));
    sections.push('');
  }

  sections.push(
    '## Your task',
    'Generate a personal daily brief in plain prose (no markdown headers, no bullets — just sentences). Open with a felt-sense observation tying together what they said today and where they\'re at this week. Reference at least one concrete thing from yesterday\'s review or recent journal — show that you remember. Name one thing that\'s actually at stake today given the active goals, projects, and calendar. End with a single grounding action they can take in the next hour. Keep it under 3 short paragraphs. Speak directly to them ("you"), not about them.',
    '',
    'Then append the structured JSON tail per your output contract (pacing / flags / bands / parked / today_one_line / carrying_into_tomorrow).',
  );

  const consulted = _buildConsulted(state, {
    hasYesterdayReview: _hasYesterdayReviewEntry(state.recentEntries),
    hasRecentJournal: !hasReview && _hasJournalEntry(state.recentEntries),
  });

  return { input: sections.join('\n'), consulted };
}

// Public: assemble the markdown context for an evening review.
async function assembleReviewContext(userAnswers = [], autoCheckedItems = []) {
  const state = await _gatherUserState();
  if (!state) return { input: userAnswers.join('\n\n'), consulted: [] };

  const hasReview = _hasRecentReview(state.recentEntries);
  const sections = [
    `# Evening review context for ${_shortDate(state.today)}`,
    '',
    _formatGoals(state.goals),
    _formatProjects(state.projects),
    _formatTodayPlan(state.todayPlan),
    _formatRecentJournal(state.recentEntries, 2, hasReview),
    _formatReminders(state.dueReminders),
  ].filter(Boolean);

  if (autoCheckedItems.length > 0) {
    sections.push('## Items the system inferred you completed today');
    autoCheckedItems.forEach((it) => sections.push(`- ${it}`));
    sections.push('');
  }

  if (userAnswers.length > 0) {
    sections.push('## What the user just told you in this review conversation');
    userAnswers.forEach((a, i) => sections.push(`${i + 1}. ${a}`));
    sections.push('');
  }

  sections.push(
    '## Your task',
    'Generate a short evening review in plain prose (no markdown headers, no bullets — just sentences). Acknowledge what they got right today specifically (reference today\'s plan items they completed, projects they moved). Reflect briefly on the friction without lecturing. Plant a single seed for tomorrow that connects to today\'s work AND the active monthly priority. Keep it under 3 short paragraphs. Speak directly to them ("you"), not about them. Tone: warm, plainspoken, end-of-day.',
    '',
    'Then append the structured JSON tail per your output contract (journal_text / friction / tomorrow / calendar).',
  );

  const consulted = _buildConsulted(state, {
    hasYesterdayReview: false, // review flow doesn't lean on yesterday's review
    hasRecentJournal: !hasReview && _hasJournalEntry(state.recentEntries),
  });

  return { input: sections.join('\n'), consulted };
}

// ─── Weekly review context ─────────────────────────────────────────────────

// ISO week id like "2026-W17". Used as a link id on weekly review entries
// so the assembler can detect "this week's WeeklyReview exists" vs not.
function _isoWeekId(d = new Date()) {
  const target = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = (target.getUTCDay() + 6) % 7; // mon=0
  target.setUTCDate(target.getUTCDate() - dayNum + 3); // shift to Thursday
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(((target - firstThursday) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
  return `${target.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

// Read the week-scoped state the weekly-review agent needs.
async function _gatherWeekState() {
  const sb = window.getSupabaseClient ? window.getSupabaseClient() : null;
  if (!sb) return null;
  const userId = await window.getCurrentUserId();
  const today = new Date();
  // Start of week = Monday 00:00 (matches ISO week)
  const dow = (today.getDay() + 6) % 7; // mon=0
  const weekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - dow);
  const weekStartIso = weekStart.toISOString();

  const [goals, projects, weekEntries, weekPlanItems] = await Promise.all([
    sb.from('goals').select('*').eq('user_id', userId).is('archived_at', null)
      .order('position', { ascending: true, nullsFirst: false }).limit(3)
      .then((r) => r.data || []),
    sb.from('projects').select('*').eq('user_id', userId).eq('status', 'active')
      .order('updated_at', { ascending: false }).then((r) => r.data || []),
    sb.from('entries').select('*').eq('user_id', userId).gte('at', weekStartIso)
      .order('at', { ascending: true }).then((r) => r.data || []),
    sb.from('plan_items').select('*').eq('user_id', userId)
      .gte('date', weekStart.toISOString().slice(0, 10))
      .order('date', { ascending: true }).then((r) => r.data || []),
  ]);

  return { today, weekStart, goals, projects, weekEntries, weekPlanItems };
}

// Format the week's outcomes from plan_items + reviews + journals — what the
// agent should treat as "this week's done". Mirrors the daily auto-check
// pattern but week-scoped.
function _formatWeekOutcomes(weekEntries, weekPlanItems) {
  const lines = [];
  if (weekPlanItems.length > 0) {
    lines.push('### Plan items this week');
    weekPlanItems.forEach((p) => lines.push(`- ${p.date}: ${p.text}${p.tier ? ` (${p.tier})` : ''}`));
    lines.push('');
  }
  const reviews = weekEntries.filter((e) => e.kind === 'review');
  if (reviews.length > 0) {
    lines.push('### Daily reviews this week');
    reviews.forEach((r) => {
      const at = new Date(r.at);
      const day = at.toLocaleString('en-US', { weekday: 'short' });
      const prose = (r.body_markdown || '').replace(/```json[\s\S]*$/, '').trim();
      lines.push(`- **${day}**: ${prose}`);
    });
    lines.push('');
  }
  const journals = weekEntries.filter((e) => e.kind === 'journal').slice(0, 6);
  if (journals.length > 0) {
    lines.push('### Journal entries this week');
    journals.forEach((j) => {
      const at = new Date(j.at);
      const day = at.toLocaleString('en-US', { weekday: 'short' });
      lines.push(`- **${day}**: ${j.body_markdown}`);
    });
    lines.push('');
  }
  return lines.length > 0 ? lines.join('\n') : '';
}

// Public: assemble context for a weekly review.
async function assembleWeeklyReviewContext(userAnswers = []) {
  const state = await _gatherWeekState();
  if (!state) return { input: userAnswers.join('\n\n'), consulted: [] };

  const sections = [
    `# Weekly review context for ${_isoWeekId(state.today)} (week of ${state.weekStart.toLocaleString('en-US', { month: 'short', day: 'numeric' })})`,
    '',
    _formatGoals(state.goals),
    _formatProjects(state.projects),
    _formatWeekOutcomes(state.weekEntries, state.weekPlanItems),
  ].filter(Boolean);

  if (userAnswers.length > 0) {
    sections.push("## What the user just told you in this weekly review");
    userAnswers.forEach((a, i) => sections.push(`${i + 1}. ${a}`));
    sections.push('');
  }

  sections.push(
    '## Your task',
    'Generate a weekly review in plain prose (≤4 short paragraphs). Open by naming what actually landed this week (cite specific plan items / reviews / journal moments — show you remember). Reflect on the through-line: was the week serving the active monthly priorities, or drifting? Name one pattern worth carrying forward, one worth dropping. End with 2–4 outcome-directions for next week, each connected to an active goal/monthly slice. Speak directly to them ("you"). Tone: warm, end-of-week, perspective-taking.',
    '',
    'Then append a structured JSON tail per the weekly-review output contract:',
    '```json',
    '{',
    '  "summary": "one-line week summary",',
    '  "outcomes": [{"text": "...", "status": "done|doing|todo"}],',
    '  "key_moments": [{"glyph": "rocket|leaf|moon|...", "text": "..."}],',
    '  "next_week_directions": [{"text": "...", "serves_goal_index": 0}]',
    '}',
    '```',
  );

  const consulted = [];
  if (state.goals.length) consulted.push('goals');
  if (state.projects.filter(p => !p.is_admin).length) consulted.push('projects');
  if (state.weekPlanItems.length) consulted.push('plan');
  if (state.weekEntries.some(e => e.kind === 'review')) consulted.push('yesterday-review');
  if (state.weekEntries.some(e => e.kind === 'journal')) consulted.push('journal');

  return { input: sections.join('\n'), consulted, weekId: _isoWeekId(state.today) };
}

// Map a consulted-key to a chip-label (mirrors labelForInputTrace from
// agent-output.js but covers the keys our assembler emits).
function labelForConsulted(key) {
  const map = {
    goals: 'Goals',
    projects: 'Projects',
    'yesterday-review': "Yesterday's review",
    journal: 'Journal',
    plan: "Today's plan",
    reminders: 'Reminders',
    calendar: 'Calendar',
    email: 'Email',
  };
  return map[key] || key;
}

// ─── Monthly goal slice refresh context ─────────────────────────────────────

async function _gatherMonthState() {
  const sb = window.getSupabaseClient ? window.getSupabaseClient() : null;
  if (!sb) return null;
  const userId = await window.getCurrentUserId();
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();

  const [goals, projects, monthEntries] = await Promise.all([
    sb.from('goals').select('*').eq('user_id', userId).is('archived_at', null)
      .order('position', { ascending: true, nullsFirst: false }).limit(3)
      .then((r) => r.data || []),
    sb.from('projects').select('*').eq('user_id', userId).eq('status', 'active')
      .order('updated_at', { ascending: false }).then((r) => r.data || []),
    sb.from('entries').select('*').eq('user_id', userId).gte('at', monthStart)
      .order('at', { ascending: false }).then((r) => r.data || []),
  ]);

  return { today, goals, projects, monthEntries };
}

async function assembleMonthlyRefreshContext() {
  const state = await _gatherMonthState();
  if (!state) return { input: '', consulted: [] };

  const monthName = state.today.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const nextMonthName = new Date(state.today.getFullYear(), state.today.getMonth() + 1, 1)
    .toLocaleString('en-US', { month: 'long', year: 'numeric' });

  const goalsBlock = state.goals.length === 0
    ? '## Active goals\nNo goals set yet.\n'
    : '## Active goals (with current monthly slice)\n' + state.goals.map((g, i) =>
        `${i + 1}. **${g.title}**\n   - ${monthName} slice: ${g.monthly_slice || '(not set)'}`
      ).join('\n') + '\n';

  // Compress: weekly-review entries are summaries; daily reviews + journals are signal.
  const weeklyReviews = state.monthEntries.filter((e) => e.kind === 'review' && e.links && e.links.scope === 'week');
  const dailyReviews = state.monthEntries.filter((e) => e.kind === 'review' && (!e.links || e.links.scope !== 'week'));
  const journals = state.monthEntries.filter((e) => e.kind === 'journal');

  const monthBlock = ['## What landed this month'];
  if (weeklyReviews.length > 0) {
    monthBlock.push('### Weekly reviews this month');
    weeklyReviews.forEach((r) => {
      const at = new Date(r.at);
      const weekLabel = (r.links && r.links.week_id) || at.toLocaleString('en-US', { month: 'short', day: 'numeric' });
      const prose = (r.body_markdown || '').replace(/```json[\s\S]*$/, '').trim();
      monthBlock.push(`- **${weekLabel}**: ${prose.slice(0, 400)}`);
    });
  }
  if (weeklyReviews.length === 0 && dailyReviews.length > 0) {
    monthBlock.push('### Daily reviews (no weekly summaries this month)');
    dailyReviews.slice(0, 6).forEach((r) => {
      const at = new Date(r.at);
      const day = at.toLocaleString('en-US', { month: 'short', day: 'numeric' });
      const prose = (r.body_markdown || '').replace(/```json[\s\S]*$/, '').trim();
      monthBlock.push(`- **${day}**: ${prose.slice(0, 200)}`);
    });
  }
  if (journals.length > 0 && weeklyReviews.length === 0) {
    monthBlock.push('### Journal entries');
    journals.slice(0, 4).forEach((j) => {
      const at = new Date(j.at);
      const day = at.toLocaleString('en-US', { month: 'short', day: 'numeric' });
      monthBlock.push(`- **${day}**: ${(j.body_markdown || '').slice(0, 160)}`);
    });
  }

  const sections = [
    `# Monthly goal slice refresh — moving from ${monthName} to ${nextMonthName}`,
    '',
    goalsBlock,
    monthBlock.length > 1 ? monthBlock.join('\n') + '\n' : '',
    '## Your task',
    `Draft a fresh ${nextMonthName} monthly_slice for EACH of the user's ${state.goals.length} active goals. Each slice is one sentence — concrete, scoped to next month, building on what landed this month (cite specific moments). Frame as the user's own voice; they'll edit before accepting.`,
    '',
    'Output ONLY a fenced JSON block of this shape:',
    '```json',
    '{',
    `  "month": "${nextMonthName}",`,
    '  "slices": [',
    '    { "goal_index": 0, "monthly_slice": "..." },',
    '    { "goal_index": 1, "monthly_slice": "..." },',
    '    { "goal_index": 2, "monthly_slice": "..." }',
    '  ]',
    '}',
    '```',
    '',
    'No prose before or after the JSON. Order matches the goals list above.',
  ].filter(Boolean);

  const consulted = [];
  if (state.goals.length) consulted.push('goals');
  if (state.projects.filter(p => !p.is_admin).length) consulted.push('projects');
  if (weeklyReviews.length || dailyReviews.length) consulted.push('yesterday-review');
  if (journals.length) consulted.push('journal');

  return { input: sections.join('\n'), consulted, goals: state.goals, nextMonthName };
}

function parseMonthlyRefreshResponse(text) {
  if (!text || typeof text !== 'string') return null;
  const trimmed = text.trim();
  const jsonMatch = trimmed.match(/```json\s*([\s\S]*?)\s*```/);
  const raw = jsonMatch ? jsonMatch[1] : trimmed;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.slices)) return null;
    return parsed;
  } catch {
    return null;
  }
}

// ─── Setup (first-run onboarding) ───────────────────────────────────────────

// The setup agent only needs the user's 3 goal titles. It enriches each with
// a monthly_slice + glyph for the current month. No DB reads — this fires
// before the user has any data. Returns just {input}.
function assembleSetupContext(goalTitles) {
  const today = new Date();
  const monthName = today.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const titles = (goalTitles || []).filter((t) => t && t.trim());

  const sections = [
    `# First-run setup — ${monthName}`,
    '',
    "## What the user just told you",
    "These are the 3 long-term goals they want to build the system around:",
    ...titles.map((t, i) => `${i + 1}. ${t.trim()}`),
    '',
    '## Your task',
    `For EACH of the ${titles.length} goals above, draft a single-sentence ${monthName} monthly_slice — concrete, specific to ${monthName}, and pickable as one clear thing to serve this month. Pick a glyph from the canonical set.`,
    '',
    'Output ONLY a fenced JSON block of this shape:',
    '```json',
    '{',
    `  "month": "${monthName}",`,
    '  "slices": [',
    '    { "goal_index": 0, "title": "...", "monthly_slice": "...", "glyph": "rocket|leaf|moon|pen|footprints|message|mountain|handshake|sparkles|target|book|heart" },',
    '    { "goal_index": 1, "title": "...", "monthly_slice": "...", "glyph": "..." },',
    '    { "goal_index": 2, "title": "...", "monthly_slice": "...", "glyph": "..." }',
    '  ]',
    '}',
    '```',
    '',
    "title in the response should match the user's input exactly. No prose before or after the JSON. Order matches the goals list above.",
  ];

  return { input: sections.join('\n') };
}

// Strict JSON-only parse for the setup response.
function parseSetupResponse(text) {
  if (!text || typeof text !== 'string') return null;
  const trimmed = text.trim();
  const jsonMatch = trimmed.match(/```json\s*([\s\S]*?)\s*```/);
  const raw = jsonMatch ? jsonMatch[1] : trimmed;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.slices)) return null;
    return parsed;
  } catch {
    return null;
  }
}

Object.assign(window, {
  assembleBriefContext, assembleReviewContext, assembleWeeklyReviewContext,
  assembleMonthlyRefreshContext, parseMonthlyRefreshResponse,
  assembleSetupContext, parseSetupResponse,
  labelForConsulted,
});
