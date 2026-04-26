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

async function _userId() {
  // window.getCurrentUserId() is async (kicks off anonymous sign-in on first
  // call, then returns the cached auth.uid()). All entity helpers await it
  // before stamping user_id on writes / filtering on reads.
  return await window.getCurrentUserId();
}

function _throw(label, error) {
  // Re-throw so call-sites get a stack pointing at their own code, not deep
  // inside supabase-js. Preserve the original via .cause for debugging.
  const e = new Error(`${label}: ${error.message || error}`);
  e.cause = error;
  throw e;
}

// ─── Demo-mode guard ────────────────────────────────────────────────────────
// When window.INTENTLY_DEMO is true, all reads return SAM_* fixtures and all
// writes are no-ops that return a fake-but-valid response. Nothing touches
// Supabase in demo mode — no new auth session, no DB rows.

function _isDemo() {
  return !!window.INTENTLY_DEMO;
}

// Fake-id generator for no-op writes so callers that read back .id don't crash.
function _fakeId() {
  return 'demo-' + Math.random().toString(36).slice(2, 10);
}

// ─── Goals ──────────────────────────────────────────────────────────────────

async function insertGoal(title) {
  if (_isDemo()) return { id: _fakeId(), title, user_id: 'demo' };
  const { data, error } = await _client()
    .from('goals')
    .insert({ user_id: (await _userId()), title })
    .select()
    .single();
  if (error) _throw('insertGoal', error);
  return data;
}

async function listGoals() {
  if (_isDemo()) {
    return (window.SAM_GOALS || []).map((g, i) => ({
      id: 'demo-goal-' + i,
      user_id: 'demo',
      title: g.title,
      monthly_slice: g.monthly_slice || null,
      glyph: g.glyph || null,
      palette: g.palette || null,
      position: g.position != null ? g.position : i,
      archived_at: null,
    }));
  }
  const { data, error } = await _client()
    .from('goals')
    .select('*')
    .eq('user_id', (await _userId()))
    .is('archived_at', null)
    .order('position', { ascending: true, nullsFirst: false });
  if (error) _throw('listGoals', error);
  return data || [];
}

// ─── Projects ───────────────────────────────────────────────────────────────

async function insertProject(title, goalId) {
  if (_isDemo()) return { id: _fakeId(), title, goal_id: goalId || null, user_id: 'demo', status: 'active', todos: [] };
  const row = { user_id: (await _userId()), title };
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
  if (_isDemo()) {
    return (window.SAM_PROJECTS || []).map((p, i) => ({
      id: 'demo-proj-' + i,
      user_id: 'demo',
      title: p.title,
      goal_id: p.goal_index != null ? 'demo-goal-' + p.goal_index : null,
      body_markdown: p.body_markdown || '',
      todos: (p.todos || []).map((t, ti) => ({
        id: 'demo-todo-' + i + '-' + ti,
        text: t.text,
        done: !!t.done,
      })),
      status: p.status || 'active',
      is_admin: !!p.is_admin,
      updated_at: new Date().toISOString(),
    }));
  }
  const { data, error } = await _client()
    .from('projects')
    .select('*')
    .eq('user_id', (await _userId()))
    .eq('status', 'active')
    .order('updated_at', { ascending: false });
  if (error) _throw('listProjects', error);
  return data || [];
}

async function addProjectTodo(projectId, text) {
  if (_isDemo()) return { id: projectId, todos: [{ id: _fakeId(), text, done: false }] };
  // Read-modify-write the JSONB column. Single-user V1 so the read/write race
  // is fine; multi-writer would need a server-side append (RPC or trigger).
  const sb = _client();
  const { data: row, error: readErr } = await sb
    .from('projects')
    .select('todos')
    .eq('id', projectId)
    .eq('user_id', (await _userId()))
    .single();
  if (readErr) _throw('addProjectTodo (read)', readErr);

  const todos = Array.isArray(row && row.todos) ? row.todos.slice() : [];
  const todo = { id: crypto.randomUUID(), text, done: false };
  todos.push(todo);

  const { data, error: writeErr } = await sb
    .from('projects')
    .update({ todos })
    .eq('id', projectId)
    .eq('user_id', (await _userId()))
    .select()
    .single();
  if (writeErr) _throw('addProjectTodo (write)', writeErr);
  return data;
}

async function toggleProjectTodo(projectId, todoId) {
  if (_isDemo()) return { id: projectId };
  const sb = _client();
  const { data: row, error: readErr } = await sb
    .from('projects')
    .select('todos')
    .eq('id', projectId)
    .eq('user_id', (await _userId()))
    .single();
  if (readErr) _throw('toggleProjectTodo (read)', readErr);

  const todos = (Array.isArray(row && row.todos) ? row.todos : []).map((t) =>
    t && t.id === todoId ? Object.assign({}, t, { done: !t.done }) : t,
  );

  const { data, error: writeErr } = await sb
    .from('projects')
    .update({ todos })
    .eq('id', projectId)
    .eq('user_id', (await _userId()))
    .select()
    .single();
  if (writeErr) _throw('toggleProjectTodo (write)', writeErr);
  return data;
}

// ─── Plan items ─────────────────────────────────────────────────────────────

async function insertPlanItem(date, band, text, tier, durationMin) {
  if (_isDemo()) return { id: _fakeId(), date, band, text, tier: tier || null, duration_min: durationMin || null, user_id: 'demo' };
  const row = { user_id: (await _userId()), date, band, text };
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
  if (_isDemo()) {
    return (window.SAM_TODAY_PLAN || []).map((p, i) => ({
      id: 'demo-plan-' + i,
      user_id: 'demo',
      date,
      band: p.band,
      text: p.text,
      tier: p.tier || null,
      position: i,
    }));
  }
  const { data, error } = await _client()
    .from('plan_items')
    .select('*')
    .eq('user_id', (await _userId()))
    .eq('date', date)
    .order('position', { ascending: true, nullsFirst: false });
  if (error) _throw('listPlanItems', error);
  return data || [];
}

// ─── Journal entries (kind='journal' on the entries table) ─────────────────

async function insertJournalEntry(text, date) {
  if (_isDemo()) return { id: _fakeId(), kind: 'journal', body_markdown: text, at: date || new Date().toISOString(), user_id: 'demo' };
  // Omit `at` when not provided so the column default (now()) fires. Passing
  // null would override the default with null and violate not-null.
  const row = {
    user_id: (await _userId()),
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
  if (_isDemo()) {
    const today = new Date();
    const entries = (window.SAM_JOURNAL || []).map((j, i) => {
      const at = new Date(today);
      at.setDate(at.getDate() - (j.days_ago || 0));
      return {
        id: 'demo-journal-' + i,
        user_id: 'demo',
        kind: 'journal',
        body_markdown: j.body_markdown,
        glyph: j.glyph || null,
        mood: j.mood || null,
        at: at.toISOString(),
        source: 'text',
      };
    });
    // Already newest-first (days_ago ascending order in SAM_JOURNAL).
    const limit = opts && typeof opts.limit === 'number' ? opts.limit : null;
    return limit ? entries.slice(0, limit) : entries;
  }
  const limit = opts && typeof opts.limit === 'number' ? opts.limit : null;
  let q = _client()
    .from('entries')
    .select('*')
    .eq('user_id', (await _userId()))
    .eq('kind', 'journal')
    .order('at', { ascending: false });
  if (limit !== null) q = q.limit(limit);
  const { data, error } = await q;
  if (error) _throw('listJournalEntries', error);
  return data || [];
}

async function updateJournalEntry(id, text) {
  if (_isDemo()) return { id, body_markdown: text, user_id: 'demo' };
  const { data, error } = await _client()
    .from('entries')
    .update({ body_markdown: text })
    .eq('id', id)
    .eq('user_id', (await _userId()))
    .select()
    .single();
  if (error) _throw('updateJournalEntry', error);
  return data;
}

// ─── Life ops config ─────────────────────────────────────────────────────────

async function updateLifeOpsConfig(patch) {
  if (_isDemo()) return { config: patch, user_id: 'demo' };
  // Upsert a row for this user, merging `patch` into the existing JSONB config.
  // Supabase does not natively deep-merge JSONB on upsert, so we read-merge-write.
  // Single-user V1: read/write race is acceptable.
  const sb = _client();
  const uid = await _userId();

  // Fetch existing config (may not exist yet for brand-new users).
  const { data: existing, error: readErr } = await sb
    .from('life_ops_config')
    .select('config')
    .eq('user_id', uid)
    .maybeSingle();
  if (readErr) _throw('updateLifeOpsConfig (read)', readErr);

  const merged = Object.assign({}, (existing && existing.config) || {}, patch);

  const { data, error } = await sb
    .from('life_ops_config')
    .upsert({ user_id: uid, config: merged }, { onConflict: 'user_id' })
    .select()
    .single();
  if (error) _throw('updateLifeOpsConfig (write)', error);
  return data;
}

async function getLifeOpsConfig() {
  if (_isDemo()) return {};
  const { data, error } = await _client()
    .from('life_ops_config')
    .select('config')
    .eq('user_id', (await _userId()))
    .maybeSingle();
  if (error) _throw('getLifeOpsConfig', error);
  return (data && data.config) || {};
}

// ─── Admin reminders (uses the existing public.reminders table) ─────────────

async function insertAdminReminder(text, remindOn) {
  if (_isDemo()) return { id: _fakeId(), text, remind_on: remindOn || new Date().toISOString().slice(0, 10), status: 'pending', user_id: 'demo' };
  // remind_on is NOT NULL on the table. Default to today (YYYY-MM-DD) when
  // the caller doesn't provide a date — admin items captured ad-hoc surface
  // immediately rather than disappearing into the future.
  const date = remindOn || new Date().toISOString().slice(0, 10);
  const { data, error } = await _client()
    .from('reminders')
    .insert({
      user_id: (await _userId()),
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
  if (_isDemo()) {
    const today = new Date();
    return (window.SAM_REMINDERS || []).map((r, i) => {
      const due = new Date(today);
      due.setDate(due.getDate() + (r.remind_in_days || 0));
      return {
        id: 'demo-rem-' + i,
        user_id: 'demo',
        text: r.text,
        remind_on: due.toISOString().slice(0, 10),
        status: 'pending',
      };
    });
  }
  const { data, error } = await _client()
    .from('reminders')
    .select('*')
    .eq('user_id', (await _userId()))
    .eq('status', 'pending')
    .order('remind_on', { ascending: true });
  if (error) _throw('listAdminReminders', error);
  return data || [];
}

async function markAdminReminderDone(id) {
  if (_isDemo()) return { id, status: 'done', user_id: 'demo' };
  const { data, error } = await _client()
    .from('reminders')
    .update({ status: 'done' })
    .eq('id', id)
    .eq('user_id', (await _userId()))
    .select()
    .single();
  if (error) _throw('markAdminReminderDone', error);
  return data;
}

// ─── Observations (noticing layer) ──────────────────────────────────────────
// Helpers for the `public.observations` table (schema: 0009_graph_schema.sql).
// Called by the noticing MA agent when a pattern crosses the 3/48h threshold.

async function insertObservation({ patternText, subjectKind, subjectId, timesObserved, metadata }) {
  if (_isDemo()) return { id: _fakeId(), pattern_text: patternText, user_id: 'demo' };
  const uid = await _userId();
  const row = {
    user_id: uid,
    pattern_text: patternText,
    times_observed: timesObserved != null ? timesObserved : 1,
    metadata: metadata || {},
  };
  if (subjectKind !== undefined && subjectKind !== null) row.subject_kind = subjectKind;
  if (subjectId !== undefined && subjectId !== null) row.subject_id = subjectId;
  const { data, error } = await _client()
    .from('observations')
    .insert(row)
    .select()
    .single();
  if (error) _throw('insertObservation', error);
  return data;
}

async function incrementObservation(observationId) {
  if (_isDemo()) return { id: observationId, times_observed: 1, user_id: 'demo' };
  // Increments times_observed by 1 and stamps last_observed_at = now().
  // Uses a Postgres RPC call-style update via raw SQL through supabase-js
  // (no RPC function needed — supabase-js can run the arithmetic on the column).
  const uid = await _userId();
  const { data, error } = await _client()
    .from('observations')
    .update({ last_observed_at: new Date().toISOString() })
    .eq('id', observationId)
    .eq('user_id', uid)
    .select('times_observed')
    .single();
  if (error) _throw('incrementObservation (read)', error);

  // Increment times_observed now that we have the current value.
  const { data: updated, error: updateErr } = await _client()
    .from('observations')
    .update({ times_observed: data.times_observed + 1, last_observed_at: new Date().toISOString() })
    .eq('id', observationId)
    .eq('user_id', uid)
    .select()
    .single();
  if (updateErr) _throw('incrementObservation (write)', updateErr);
  return updated;
}

async function listRecentObservations({ sinceHours } = {}) {
  if (_isDemo()) return [];
  // Returns unpromoted observations for the current user within the look-back
  // window (default: 48 hours). Ordered newest-first.
  const hours = sinceHours != null ? sinceHours : 48;
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  const { data, error } = await _client()
    .from('observations')
    .select('*')
    .eq('user_id', (await _userId()))
    .is('promoted_at', null)
    .gte('last_observed_at', since)
    .order('last_observed_at', { ascending: false });
  if (error) _throw('listRecentObservations', error);
  return data || [];
}

// ─── Entries with tags (capture-time signal tagging) ────────────────────────
// insertEntryWithTags writes an entry row with the tags[] and tag_confidence
// columns populated. Both channels:
//   - body_markdown gets inline token appended (e.g. " #ant") for human-readable tags
//   - tags[] column gets structured array for SQL queries ("show me #ant entries")
//
// tags: string[] — tag names without # prefix (e.g. ['ant'])
// tag_confidence: object — { ant: 0.92, ... } per-tag confidence scores

async function insertEntryWithTags({ kind, body_markdown, tags, tag_confidence, source, at } = {}) {
  if (_isDemo()) return { id: _fakeId(), kind: kind || 'journal', body_markdown, tags: tags || [], user_id: 'demo' };
  const uid = await _userId();
  const normalizedTags = Array.isArray(tags) ? tags : [];
  const normalizedConf = tag_confidence && typeof tag_confidence === 'object' ? tag_confidence : {};

  // Append inline markdown tokens to body for human-readable tags.
  // e.g. "I'm such an idiot" → "I'm such an idiot #ant"
  let bodyWithTags = (body_markdown || '').trim();
  if (normalizedTags.length > 0) {
    const inlineTokens = normalizedTags.map((t) => `#${t}`).join(' ');
    bodyWithTags = bodyWithTags + ' ' + inlineTokens;
  }

  const row = {
    user_id: uid,
    kind: kind || 'journal',
    body_markdown: bodyWithTags,
    tags: normalizedTags,
    tag_confidence: normalizedConf,
    source: source || 'text',
  };
  if (at !== undefined && at !== null) {
    row.at = at instanceof Date ? at.toISOString() : at;
  }

  const { data, error } = await _client()
    .from('entries')
    .insert(row)
    .select()
    .single();
  if (error) _throw('insertEntryWithTags', error);
  return data;
}

// listEntriesByTag — query helper for "show me my #brag entries".
// Uses the structured tags column: WHERE 'brag' = ANY(tags)
// Optional `since` is an ISO timestamp to bound the lookback window.
async function listEntriesByTag(tag, since) {
  if (_isDemo()) return [];
  let q = _client()
    .from('entries')
    .select('*')
    .eq('user_id', (await _userId()))
    .contains('tags', [tag])
    .order('at', { ascending: false });
  if (since) {
    q = q.gte('at', since instanceof Date ? since.toISOString() : since);
  }
  const { data, error } = await q;
  if (error) _throw('listEntriesByTag', error);
  return data || [];
}

// ─── User signals (V1.1 scaffold — read interface only) ─────────────────────
// Full UX for adding / editing user custom signals is V1.2.
// TODO(V1.2): build signal management UX surface

async function listUserSignals() {
  if (_isDemo()) return [];
  const { data, error } = await _client()
    .from('user_signals')
    .select('*')
    .eq('user_id', (await _userId()))
    .eq('enabled', true)
    .order('created_at', { ascending: true });
  if (error) _throw('listUserSignals', error);
  return data || [];
}

// V1.1 scaffold — for admin/power-user use; full UX in V1.2
async function insertUserSignal({ tag, description, framework } = {}) {
  if (_isDemo()) return { id: _fakeId(), tag, user_id: 'demo' };
  const { data, error } = await _client()
    .from('user_signals')
    .insert({
      user_id: (await _userId()),
      tag,
      description: description || null,
      framework: framework || null,
      enabled: true,
    })
    .select()
    .single();
  if (error) _throw('insertUserSignal', error);
  return data;
}

// V1.1 scaffold — soft-delete by setting enabled=false
async function archiveUserSignal(id) {
  if (_isDemo()) return { id, enabled: false, user_id: 'demo' };
  const { data, error } = await _client()
    .from('user_signals')
    .update({ enabled: false })
    .eq('id', id)
    .eq('user_id', (await _userId()))
    .select()
    .single();
  if (error) _throw('archiveUserSignal', error);
  return data;
}

// ─── Setup draft (mid-flow persistence) ─────────────────────────────────────
// Uses the existing life_ops_config.config JSONB column — no new table.
// `setup_draft` key holds in-progress setup state so users can resume after
// a hard refresh mid-setup.

async function getSetupDraft() {
  const config = await getLifeOpsConfig();
  return (config && config.setup_draft) || null;
}

async function saveSetupDraftPhase({ phase, data }) {
  if (_isDemo()) return { config: { setup_draft: { phase } }, user_id: 'demo' };
  // Merge new phase data into setup_draft, preserving any previously saved phases.
  const sb = _client();
  const uid = await _userId();

  // Read current config to get existing setup_draft (if any).
  const { data: existing, error: readErr } = await sb
    .from('life_ops_config')
    .select('config')
    .eq('user_id', uid)
    .maybeSingle();
  if (readErr) _throw('saveSetupDraftPhase (read)', readErr);

  const currentConfig = (existing && existing.config) || {};
  const currentDraft = (currentConfig && currentConfig.setup_draft) || {};

  // Build merged draft: preserve prior phase data, update the phase marker.
  const mergedDraft = Object.assign({}, currentDraft, data, {
    phase,
    started_at: currentDraft.started_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  const newConfig = Object.assign({}, currentConfig, { setup_draft: mergedDraft });

  const { data: result, error } = await sb
    .from('life_ops_config')
    .upsert({ user_id: uid, config: newConfig }, { onConflict: 'user_id' })
    .select()
    .single();
  if (error) _throw('saveSetupDraftPhase (write)', error);
  return result;
}

async function clearSetupDraft() {
  if (_isDemo()) return null;
  const sb = _client();
  const uid = await _userId();

  // Read current config so we can remove just the setup_draft key.
  const { data: existing, error: readErr } = await sb
    .from('life_ops_config')
    .select('config')
    .eq('user_id', uid)
    .maybeSingle();
  if (readErr) _throw('clearSetupDraft (read)', readErr);

  if (!existing || !existing.config || !existing.config.setup_draft) {
    return null; // Nothing to clear.
  }

  const newConfig = Object.assign({}, existing.config);
  delete newConfig.setup_draft;

  const { data, error } = await sb
    .from('life_ops_config')
    .upsert({ user_id: uid, config: newConfig }, { onConflict: 'user_id' })
    .select()
    .single();
  if (error) _throw('clearSetupDraft (write)', error);
  return data;
}

// ─── OAuth Connections ──────────────────────────────────────────────────────

async function listOauthConnections() {
  if (_isDemo()) return [];
  const { data } = await _client()
    .from('oauth_connections')
    .select('provider')
    .eq('user_id', (await _userId()));
  return data || [];
}

// ─── Life Areas ─────────────────────────────────────────────────────────────

async function insertLifeArea({ name, description, glyph, palette, goal_id, slug } = {}) {
  if (_isDemo()) return { id: _fakeId(), name, user_id: 'demo' };
  const row = { user_id: (await _userId()), name };
  if (description != null) row.description = description;
  if (glyph != null) row.glyph = glyph;
  if (palette != null) row.palette = palette;
  if (goal_id != null) row.goal_id = goal_id;
  if (slug != null) row.slug = slug;
  const { data, error } = await _client()
    .from('life_areas')
    .insert(row)
    .select()
    .single();
  if (error) _throw('insertLifeArea', error);
  return data;
}

async function listLifeAreas({ archived = false } = {}) {
  if (_isDemo()) {
    return (window.SAM_LIFE_AREAS || []).map((a, i) => ({
      id: 'demo-area-' + i,
      user_id: 'demo',
      name: a.name,
      glyph: a.glyph || null,
      description: a.description || null,
      position: a.position != null ? a.position : i + 1,
      archived_at: null,
    }));
  }
  let q = _client()
    .from('life_areas')
    .select('*')
    .eq('user_id', (await _userId()))
    .order('position', { ascending: true, nullsFirst: false });
  if (!archived) {
    q = q.is('archived_at', null);
  }
  const { data, error } = await q;
  if (error) _throw('listLifeAreas', error);
  return data || [];
}

async function archiveLifeArea(id) {
  if (_isDemo()) return { id, archived_at: new Date().toISOString(), user_id: 'demo' };
  const { data, error } = await _client()
    .from('life_areas')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', (await _userId()))
    .select()
    .single();
  if (error) _throw('archiveLifeArea', error);
  return data;
}

async function getLifeArea(id) {
  if (_isDemo()) {
    return (window.SAM_LIFE_AREAS || []).map((a, i) => ({
      id: 'demo-area-' + i,
      user_id: 'demo',
      name: a.name,
      glyph: a.glyph || null,
      description: a.description || null,
      position: a.position != null ? a.position : i + 1,
      archived_at: null,
    })).find((a) => a.id === id) || null;
  }
  const { data, error } = await _client()
    .from('life_areas')
    .select('*')
    .eq('id', id)
    .eq('user_id', (await _userId()))
    .single();
  if (error) _throw('getLifeArea', error);
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
  updateJournalEntry,
  listJournalEntries,
  updateLifeOpsConfig,
  getLifeOpsConfig,
  insertAdminReminder,
  listAdminReminders,
  markAdminReminderDone,
  // noticing layer
  insertObservation,
  incrementObservation,
  listRecentObservations,
  // capture-time signal tagging (V1.1)
  insertEntryWithTags,
  listEntriesByTag,
  listUserSignals,
  insertUserSignal,
  archiveUserSignal,
  // life areas
  insertLifeArea,
  listLifeAreas,
  archiveLifeArea,
  getLifeArea,
  // oauth connections
  listOauthConnections,
  // setup draft persistence
  getSetupDraft,
  saveSetupDraftPhase,
  clearSetupDraft,
});
