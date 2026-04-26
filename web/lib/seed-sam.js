// Idempotent seed loader for Sam's life into the current user's Supabase rows.
//
// On first call (per browser session): if the user has zero goals, inserts
// Sam's full seed (goals, projects, today's plan, recent journal entries,
// yesterday's review, pending reminders, today's calendar events, urgent emails).
//
// Idempotency: keyed on listGoals().length === 0. If the user has goals, this
// is a no-op. So the loader can safely run on every app load.
//
// Returns a summary { inserted: { goals, projects, ... }, skipped: bool }.

async function seedSamIfEmpty() {
  if (!window.listGoals || !window.getSupabaseClient || !window.getCurrentUserId) {
    return { skipped: true, reason: 'entities lib not loaded' };
  }
  if (!window.SAM_GOALS) {
    return { skipped: true, reason: 'sam-seed-data not loaded' };
  }

  const existing = await window.listGoals().catch(() => []);
  if (existing.length > 0) {
    return { skipped: true, reason: 'user already has goals' };
  }

  const sb = window.getSupabaseClient();
  const userId = await window.getCurrentUserId();
  const summary = { inserted: {}, skipped: false };

  // 0. Profile — upsert display_name + timezone for Sam so Avatar, Profile
  // sheet, and journal byline show "Sam Tanaka" instead of "?" / "—".
  // The auth trigger already inserted the row with id only; we just UPDATE.
  // profiles has no email column (migration 0001). Non-fatal: warn + continue.
  const { error: profileErr } = await sb.from('profiles').upsert({
    id: userId,
    display_name: 'Sam Tanaka',
    timezone: 'America/Chicago',
  }, { onConflict: 'id' });
  if (profileErr) {
    console.warn('[seed-sam] profile upsert skipped:', profileErr.message);
  } else {
    summary.inserted.profile = 1;
  }

  // 1. Goals — insert and capture returned ids so projects can FK them.
  const goalRows = window.SAM_GOALS.map((g, i) => ({
    user_id: userId,
    title: g.title,
    monthly_slice: g.monthly_slice,
    glyph: g.glyph,
    palette: g.palette,
    position: g.position != null ? g.position : i,
  }));
  const { data: insertedGoals, error: goalsErr } = await sb
    .from('goals').insert(goalRows).select();
  if (goalsErr) throw new Error(`seed goals: ${goalsErr.message}`);
  summary.inserted.goals = insertedGoals.length;

  // 2. Projects — resolve goal_index → goal_id, attach JSONB todos with new ids.
  const projectRows = window.SAM_PROJECTS.map((p) => ({
    user_id: userId,
    goal_id: p.goal_index != null ? insertedGoals[p.goal_index].id : null,
    title: p.title,
    body_markdown: p.body_markdown || '',
    todos: (p.todos || []).map((t) => ({
      id: crypto.randomUUID(),
      text: t.text,
      done: !!t.done,
    })),
    status: p.status || 'active',
    is_admin: !!p.is_admin,
  }));
  const { data: insertedProjects, error: projectsErr } = await sb
    .from('projects').insert(projectRows).select();
  if (projectsErr) throw new Error(`seed projects: ${projectsErr.message}`);
  summary.inserted.projects = insertedProjects.length;

  // 3. Recent journal entries — entries table with kind='journal'.
  const today = new Date();
  const journalRows = window.SAM_JOURNAL.map((j) => {
    const at = new Date(today);
    at.setDate(at.getDate() - (j.days_ago || 0));
    return {
      user_id: userId,
      at: at.toISOString(),
      kind: 'journal',
      body_markdown: j.body_markdown,
      glyph: j.glyph,
      mood: j.mood,
      source: 'text',
    };
  });
  const { data: insertedJournal, error: journalErr } = await sb
    .from('entries').insert(journalRows).select();
  if (journalErr) throw new Error(`seed journal: ${journalErr.message}`);
  summary.inserted.journal = insertedJournal.length;

  // 4. Yesterday's review entry — entries table with kind='review'.
  // Stash the structured json_tail in body_markdown as a fenced JSON block so
  // the assembler / future review-render can parse it.
  const reviewAt = new Date(today);
  reviewAt.setDate(reviewAt.getDate() - (window.SAM_YESTERDAY_REVIEW.days_ago || 1));
  reviewAt.setHours(21, 0, 0, 0); // ~9pm yesterday
  const reviewBody = [
    window.SAM_YESTERDAY_REVIEW.body_markdown,
    '',
    '```json',
    JSON.stringify(window.SAM_YESTERDAY_REVIEW.json_tail, null, 2),
    '```',
  ].join('\n');
  const { error: reviewErr } = await sb.from('entries').insert([{
    user_id: userId,
    at: reviewAt.toISOString(),
    kind: 'review',
    body_markdown: reviewBody,
    glyph: window.SAM_YESTERDAY_REVIEW.glyph,
    mood: window.SAM_YESTERDAY_REVIEW.mood,
    source: 'agent',
  }]);
  if (reviewErr) throw new Error(`seed review: ${reviewErr.message}`);
  summary.inserted.review = 1;

  // 4a. Today's daily brief — entries kind='brief' at ~7am today. Carries
  // the agent prose plus a JSON tail per the daily-brief Output contract.
  if (window.SAM_TODAY_BRIEF) {
    const briefAt = new Date(today);
    briefAt.setHours(window.SAM_TODAY_BRIEF.hour || 7, 14, 0, 0);
    const briefBody = [
      window.SAM_TODAY_BRIEF.body_markdown,
      '',
      '```json',
      JSON.stringify(window.SAM_TODAY_BRIEF.json_tail, null, 2),
      '```',
    ].join('\n');
    const { error: briefErr } = await sb.from('entries').insert([{
      user_id: userId,
      at: briefAt.toISOString(),
      kind: 'brief',
      body_markdown: briefBody,
      glyph: window.SAM_TODAY_BRIEF.glyph,
      mood: window.SAM_TODAY_BRIEF.mood,
      source: 'agent',
    }]);
    if (briefErr) console.warn('[seed-sam] today brief skipped:', briefErr.message);
    else summary.inserted.brief = 1;
  }

  // 4b. Last week's review — entries kind='review' with links.scope='week'.
  // Anchored to the prior Sunday so the assembler's weekly window finds it
  // and Past→Week's "This week's outcomes" + Present morning's "This week"
  // bullets have content on first load.
  if (window.SAM_WEEKLY_REVIEW) {
    const weeklyAt = new Date(today);
    while (weeklyAt.getDay() !== 0) weeklyAt.setDate(weeklyAt.getDate() - 1);
    weeklyAt.setHours(20, 0, 0, 0);
    const weeklyBody = [
      window.SAM_WEEKLY_REVIEW.body_markdown,
      '',
      '```json',
      JSON.stringify(window.SAM_WEEKLY_REVIEW.json_tail, null, 2),
      '```',
    ].join('\n');
    const { error: weeklyErr } = await sb.from('entries').insert([{
      user_id: userId,
      at: weeklyAt.toISOString(),
      kind: 'review',
      body_markdown: weeklyBody,
      glyph: window.SAM_WEEKLY_REVIEW.glyph,
      mood: window.SAM_WEEKLY_REVIEW.mood,
      source: 'agent',
      links: { scope: 'week' },
    }]);
    if (weeklyErr) console.warn('[seed-sam] weekly review skipped:', weeklyErr.message);
    else summary.inserted.weekly_review = 1;
  }

  // 5. Today's plan items — plan_items table.
  const todayDateStr = today.toISOString().slice(0, 10);
  const planRows = window.SAM_TODAY_PLAN.map((p, i) => ({
    user_id: userId,
    date: todayDateStr,
    band: p.band,
    text: p.text,
    tier: p.tier,
    position: i,
  }));
  const { error: planErr } = await sb.from('plan_items').insert(planRows);
  if (planErr) throw new Error(`seed plan: ${planErr.message}`);
  summary.inserted.plan_items = planRows.length;

  // 6. Pending reminders — reminders table.
  const reminderRows = window.SAM_REMINDERS.map((r) => {
    const due = new Date(today);
    due.setDate(due.getDate() + (r.remind_in_days || 0));
    return {
      user_id: userId,
      text: r.text,
      remind_on: due.toISOString().slice(0, 10),
      status: 'pending',
    };
  });
  const { error: remindersErr } = await sb.from('reminders').insert(reminderRows);
  if (remindersErr) throw new Error(`seed reminders: ${remindersErr.message}`);
  summary.inserted.reminders = reminderRows.length;

  // 7. Today's calendar events — calendar_events table (from 0006).
  // Skip cleanly if migration 0006 not applied yet.
  const calRows = window.SAM_CALENDAR_TODAY.map((c) => {
    const start = new Date(today.getTime() + (c.hours_from_now || 0) * 3600_000);
    const end = c.duration_min
      ? new Date(start.getTime() + c.duration_min * 60_000)
      : null;
    return {
      user_id: userId,
      starts_at: start.toISOString(),
      ends_at: end ? end.toISOString() : null,
      title: c.title,
      source: c.source || 'seed',
    };
  });
  const { error: calErr } = await sb.from('calendar_events').insert(calRows);
  if (calErr) {
    console.warn('[seed-sam] calendar_events skipped (table missing? apply migration 0006):', calErr.message);
  } else {
    summary.inserted.calendar_events = calRows.length;
  }

  // 8. Email flags — email_flags table (from 0006).
  const emailRows = window.SAM_EMAIL_FLAGS.map((e) => ({
    user_id: userId,
    sender: e.sender,
    subject: e.subject,
    received_at: new Date(today.getTime() - (e.hours_ago || 0) * 3600_000).toISOString(),
    is_urgent: !!e.is_urgent,
    awaiting_reply: !!e.awaiting_reply,
    source: 'seed',
  }));
  const { error: emailErr } = await sb.from('email_flags').insert(emailRows);
  if (emailErr) {
    console.warn('[seed-sam] email_flags skipped (table missing? apply migration 0006):', emailErr.message);
  } else {
    summary.inserted.email_flags = emailRows.length;
  }

  return summary;
}

// Independent gate for calendar_events + email_flags. Runs even when the
// goals seed has already happened — covers the case where migration 0006
// was applied AFTER the user was first seeded (the happy path during this
// project's rollout). Idempotent: only seeds if the user has no calendar
// rows AND no email rows.
async function seedSamCalendarEmailIfEmpty() {
  if (!window.getSupabaseClient || !window.getCurrentUserId) {
    return { skipped: true, reason: 'libs not loaded' };
  }
  if (!window.SAM_CALENDAR_TODAY || !window.SAM_EMAIL_FLAGS) {
    return { skipped: true, reason: 'sam-seed-data not loaded' };
  }
  const sb = window.getSupabaseClient();
  const userId = await window.getCurrentUserId();
  const today = new Date();
  const summary = { inserted: {}, skipped: false };

  const { data: existingCal, error: calCheckErr } = await sb
    .from('calendar_events').select('id').eq('user_id', userId).limit(1);
  if (calCheckErr) {
    return { skipped: true, reason: `calendar_events table missing: ${calCheckErr.message}` };
  }
  if (existingCal.length === 0) {
    const calRows = window.SAM_CALENDAR_TODAY.map((c) => {
      const start = new Date(today.getTime() + (c.hours_from_now || 0) * 3600_000);
      const end = c.duration_min
        ? new Date(start.getTime() + c.duration_min * 60_000)
        : null;
      return {
        user_id: userId,
        starts_at: start.toISOString(),
        ends_at: end ? end.toISOString() : null,
        title: c.title,
        source: c.source || 'seed',
      };
    });
    const { error } = await sb.from('calendar_events').insert(calRows);
    if (!error) summary.inserted.calendar_events = calRows.length;
  }

  const { data: existingEmail } = await sb
    .from('email_flags').select('id').eq('user_id', userId).limit(1);
  if (existingEmail && existingEmail.length === 0) {
    const emailRows = window.SAM_EMAIL_FLAGS.map((e) => ({
      user_id: userId,
      sender: e.sender,
      subject: e.subject,
      received_at: new Date(today.getTime() - (e.hours_ago || 0) * 3600_000).toISOString(),
      is_urgent: !!e.is_urgent,
      awaiting_reply: !!e.awaiting_reply,
      source: 'seed',
    }));
    const { error } = await sb.from('email_flags').insert(emailRows);
    if (!error) summary.inserted.email_flags = emailRows.length;
  }

  return summary;
}

// Wipe all of the current user's seeded data — used when re-seeding cleanly
// or resetting demo state. Only deletes the current user's rows (RLS enforces).
async function clearAllUserData() {
  if (!window.getSupabaseClient || !window.getCurrentUserId) return;
  const sb = window.getSupabaseClient();
  // Order matters: rows with FKs first.
  await sb.from('plan_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await sb.from('entries').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await sb.from('reminders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  // calendar_events / email_flags may not exist if 0006 not applied.
  await sb.from('calendar_events').delete().neq('id', '00000000-0000-0000-0000-000000000000').then(() => {}, () => {});
  await sb.from('email_flags').delete().neq('id', '00000000-0000-0000-0000-000000000000').then(() => {}, () => {});
  await sb.from('projects').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await sb.from('goals').delete().neq('id', '00000000-0000-0000-0000-000000000000');
}

Object.assign(window, { seedSamIfEmpty, seedSamCalendarEmailIfEmpty, clearAllUserData });
