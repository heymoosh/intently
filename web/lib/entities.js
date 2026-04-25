// CRUD helpers for the V1 entity tables — goals, projects (+ JSONB todos),
// plan_items, journal entries (in `entries`), and admin reminders.
//
// Each helper grabs the singleton client + the V1 user_id internally and
// stamps user_id on writes / filters by it on reads (defence-in-depth: RLS
// already enforces this, but the explicit filter hits the user_id-prefixed
// indexes and keeps the lib robust if RLS is ever relaxed).
//
// Errors bubble — no swallowing. Callers in the prototype decide whether to
// surface or retry. Returning rows is up to the caller; helpers return what
// the supabase-js client returns (data) so callers can read back ids etc.
//
// All functions are plain JS (no import/export, no JSX) so Babel-standalone
// can serve this file as `<script type="text/babel">` without compilation.

// ─── Internal helpers ───────────────────────────────────────────────────────

function _client() {
  return window.getSupabaseClient();
}

function _userId() {
  return window.getCurrentUserId();
}

function _throw(label, error) {
  // Re-throw so call-sites get a stack pointing at their own code, not deep
  // inside supabase-js. Preserve the original via .cause for debugging.
  const e = new Error(`${label}: ${error.message || error}`);
  e.cause = error;
  throw e;
}

// ─── Goals ──────────────────────────────────────────────────────────────────

async function insertGoal(title) {
  const { data, error } = await _client()
    .from('goals')
    .insert({ user_id: _userId(), title })
    .select()
    .single();
  if (error) _throw('insertGoal', error);
  return data;
}

async function listGoals() {
  const { data, error } = await _client()
    .from('goals')
    .select('*')
    .eq('user_id', _userId())
    .is('archived_at', null)
    .order('position', { ascending: true, nullsFirst: false });
  if (error) _throw('listGoals', error);
  return data || [];
}

// ─── Projects ───────────────────────────────────────────────────────────────

async function insertProject(title, goalId) {
  const row = { user_id: _userId(), title };
  if (goalId !== undefined && goalId !== null) row.goal_id = goalId;
  const { data, error } = await _client()
    .from('projects')
    .insert(row)
    .select()
    .single();
  if (error) _throw('insertProject', error);
  return data;
}

async function listProjects() {
  const { data, error } = await _client()
    .from('projects')
    .select('*')
    .eq('user_id', _userId())
    .eq('status', 'active')
    .order('updated_at', { ascending: false });
  if (error) _throw('listProjects', error);
  return data || [];
}

async function addProjectTodo(projectId, text) {
  // Read-modify-write the JSONB column. Single-user V1 so the read/write race
  // is fine; multi-writer would need a server-side append (RPC or trigger).
  const sb = _client();
  const { data: row, error: readErr } = await sb
    .from('projects')
    .select('todos')
    .eq('id', projectId)
    .eq('user_id', _userId())
    .single();
  if (readErr) _throw('addProjectTodo (read)', readErr);

  const todos = Array.isArray(row && row.todos) ? row.todos.slice() : [];
  const todo = { id: crypto.randomUUID(), text, done: false };
  todos.push(todo);

  const { data, error: writeErr } = await sb
    .from('projects')
    .update({ todos })
    .eq('id', projectId)
    .eq('user_id', _userId())
    .select()
    .single();
  if (writeErr) _throw('addProjectTodo (write)', writeErr);
  return data;
}

async function toggleProjectTodo(projectId, todoId) {
  const sb = _client();
  const { data: row, error: readErr } = await sb
    .from('projects')
    .select('todos')
    .eq('id', projectId)
    .eq('user_id', _userId())
    .single();
  if (readErr) _throw('toggleProjectTodo (read)', readErr);

  const todos = (Array.isArray(row && row.todos) ? row.todos : []).map((t) =>
    t && t.id === todoId ? Object.assign({}, t, { done: !t.done }) : t,
  );

  const { data, error: writeErr } = await sb
    .from('projects')
    .update({ todos })
    .eq('id', projectId)
    .eq('user_id', _userId())
    .select()
    .single();
  if (writeErr) _throw('toggleProjectTodo (write)', writeErr);
  return data;
}

// ─── Plan items ─────────────────────────────────────────────────────────────

async function insertPlanItem(date, band, text, tier, durationMin) {
  const row = { user_id: _userId(), date, band, text };
  if (tier !== undefined && tier !== null) row.tier = tier;
  if (durationMin !== undefined && durationMin !== null) row.duration_min = durationMin;

  const { data, error } = await _client()
    .from('plan_items')
    .insert(row)
    .select()
    .single();
  if (error) _throw('insertPlanItem', error);
  return data;
}

async function listPlanItems(date) {
  const { data, error } = await _client()
    .from('plan_items')
    .select('*')
    .eq('user_id', _userId())
    .eq('date', date)
    .order('position', { ascending: true, nullsFirst: false });
  if (error) _throw('listPlanItems', error);
  return data || [];
}

// ─── Journal entries (kind='journal' on the entries table) ─────────────────

async function insertJournalEntry(text, date) {
  // Omit `at` when not provided so the column default (now()) fires. Passing
  // null would override the default with null and violate not-null.
  const row = {
    user_id: _userId(),
    kind: 'journal',
    body_markdown: text,
    source: 'text',
  };
  if (date !== undefined && date !== null) {
    row.at = date instanceof Date ? date.toISOString() : date;
  }

  const { data, error } = await _client()
    .from('entries')
    .insert(row)
    .select()
    .single();
  if (error) _throw('insertJournalEntry', error);
  return data;
}

async function listJournalEntries(opts) {
  const limit = opts && typeof opts.limit === 'number' ? opts.limit : null;
  let q = _client()
    .from('entries')
    .select('*')
    .eq('user_id', _userId())
    .eq('kind', 'journal')
    .order('at', { ascending: false });
  if (limit !== null) q = q.limit(limit);
  const { data, error } = await q;
  if (error) _throw('listJournalEntries', error);
  return data || [];
}

// ─── Admin reminders (uses the existing public.reminders table) ─────────────

async function insertAdminReminder(text, remindOn) {
  // remind_on is NOT NULL on the table. Default to today (YYYY-MM-DD) when
  // the caller doesn't provide a date — admin items captured ad-hoc surface
  // immediately rather than disappearing into the future.
  const date = remindOn || new Date().toISOString().slice(0, 10);
  const { data, error } = await _client()
    .from('reminders')
    .insert({
      user_id: _userId(),
      text,
      remind_on: date,
      status: 'pending',
    })
    .select()
    .single();
  if (error) _throw('insertAdminReminder', error);
  return data;
}

async function listAdminReminders() {
  const { data, error } = await _client()
    .from('reminders')
    .select('*')
    .eq('user_id', _userId())
    .eq('status', 'pending')
    .order('remind_on', { ascending: true });
  if (error) _throw('listAdminReminders', error);
  return data || [];
}

async function markAdminReminderDone(id) {
  const { data, error } = await _client()
    .from('reminders')
    .update({ status: 'done' })
    .eq('id', id)
    .eq('user_id', _userId())
    .select()
    .single();
  if (error) _throw('markAdminReminderDone', error);
  return data;
}

Object.assign(window, {
  insertGoal,
  listGoals,
  insertProject,
  listProjects,
  addProjectTodo,
  toggleProjectTodo,
  insertPlanItem,
  listPlanItems,
  insertJournalEntry,
  listJournalEntries,
  insertAdminReminder,
  listAdminReminders,
  markAdminReminderDone,
});
