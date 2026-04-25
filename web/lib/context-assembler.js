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

// Public: assemble the markdown context for a daily brief. The brief flow's
// per-turn user input (the "what's alive?" / "what to park?" answers) gets
// appended below this; the agent sees user state THEN today's conversation.
async function assembleBriefContext(userAnswers = []) {
  const state = await _gatherUserState();
  if (!state) return userAnswers.join('\n\n');

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

  return sections.join('\n');
}

// Public: assemble the markdown context for an evening review.
async function assembleReviewContext(userAnswers = [], autoCheckedItems = []) {
  const state = await _gatherUserState();
  if (!state) return userAnswers.join('\n\n');

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

  return sections.join('\n');
}

Object.assign(window, { assembleBriefContext, assembleReviewContext });
