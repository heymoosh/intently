// update-tracker — voice-classifier branch + executor for the update-tracker
// Managed Agent. Three pieces:
//
// 1. looksLikeTrackerUpdate(transcript) — cheap regex test that decides whether
//    a chat utterance should be routed to update-tracker instead of the chat
//    fallback. Anchored on declarative completion forms ("I finished X",
//    "shipped Y", etc.) so casual mentions ("worked on it for a bit, what's
//    next?") fall through. False-positive cost > false-negative cost.
//
// 2. assembleUpdateTrackerInput(utterance) — pulls the user's active projects
//    (with todos) + active goals from Supabase and packages them with the
//    utterance + today's date as the agent's input payload. Mirrors the
//    daily-brief / review context-assembler pattern (markdown shell with
//    JSON-shaped data inside).
//
// 3. parseUpdateTrackerOutput(finalText) + applyUpdateTrackerUpdates(parsed) —
//    extract the JSON tail from the agent's response and apply each `updates[]`
//    entry to the right Supabase table. Returns counts so the caller can render
//    a confirmation. Errors bubble per the entities.js convention.
//
// Wired in: web/intently-hero.jsx → sendUtterance routes to tryUpdateTracker
// when looksLikeTrackerUpdate returns true (see CR-update-tracker-supabase-
// wiring-03 in docs/product/acceptance-criteria/update-tracker.md).

// ─── Intent detection ───────────────────────────────────────────────────────

// Anchored to declarative completion forms. Each pattern requires the verb at
// or near the start of the sentence and the verb framed as completed work, so
// "what should I work on next?" doesn't trigger but "I worked on the auth
// migration today" does.
//
// Tested mentally against:
//   ✓ "I finished the auth migration"
//   ✓ "Finished the auth migration"
//   ✓ "Shipped the polish PR"
//   ✓ "I worked on the website today"
//   ✓ "Just completed the design review"
//   ✓ "Wrapped up the positioning decision"
//   ✓ "Done with the seed data"
//   ✓ "Marked the auth migration done"
//   ✗ "What should I work on next?"        — interrogative, no verb-front match
//   ✗ "Worked on it for a bit, what's next?" — has the trigger but trailing
//                                              question makes it a chat turn;
//                                              we accept the false positive
//                                              here, the agent will redirect
//                                              with empty updates.
const TRACKER_PATTERNS = [
  // "I finished / I just finished / I've finished ..."
  /\b(?:i(?:'?ve|'?m| just| finally)?\s+)?finished\b/i,
  // "Finished / I finished" at sentence start
  /^\s*finished\b/i,
  // "Shipped / I shipped"
  /\b(?:i(?:'?ve| just| finally)?\s+)?shipped\b/i,
  // "Completed"
  /\b(?:i(?:'?ve| just)?\s+)?completed\b/i,
  // "Wrapped (up)"
  /\b(?:i(?:'?ve| just)?\s+)?wrapped(?:\s+up)?\b/i,
  // "Worked on" — declarative, not interrogative
  /\b(?:i(?:'?ve| just| spent .* )?\s+)?worked\s+on\b/i,
  // "Done with"
  /\bdone\s+with\b/i,
  // "Marked X done"
  /\bmarked\s+.+\s+done\b/i,
  // Explicit verbs from the SKILL description
  /\b(?:log\s+this|update\s+tracker)\b/i,
  // "I just X-ed it" — past-tense completion phrasing for the demo
  /\b(?:landed|merged|deployed|fixed|drafted)\b/i,
];

function looksLikeTrackerUpdate(transcript) {
  if (!transcript || typeof transcript !== 'string') return false;
  const t = transcript.trim();
  if (t.length === 0) return false;
  // Reject obvious questions / planning even when a trigger word slipped in.
  if (/^(?:what|when|how|why|should|can you|could you)\b/i.test(t)) return false;
  if (t.endsWith('?')) return false;
  return TRACKER_PATTERNS.some((re) => re.test(t));
}

// ─── Input assembly ─────────────────────────────────────────────────────────

// Pull active projects + goals and shape them into the JSON the agent expects.
// Returned as a markdown string (mirrors the `daily-brief` input convention so
// the proxy passes it through verbatim as a `user.message` text block).
async function assembleUpdateTrackerInput(utterance, source) {
  const [projects, goals] = await Promise.all([
    typeof window.listProjects === 'function' ? window.listProjects() : Promise.resolve([]),
    typeof window.listGoals === 'function' ? window.listGoals() : Promise.resolve([]),
  ]);

  // Slim the projects payload — only fields the agent needs to match against.
  const slimProjects = (projects || []).map((p) => ({
    id: p.id,
    title: p.title,
    status: p.status,
    todos: Array.isArray(p.todos) ? p.todos.map((t) => ({
      id: t.id,
      text: t.text,
      done: !!t.done,
    })) : [],
  }));
  const slimGoals = (goals || []).map((g) => ({ id: g.id, title: g.title }));

  const today = new Date().toLocaleDateString('en-CA');
  const sourceLabel = source === 'voice' ? 'voice' : 'text';

  return [
    `User said: "${utterance}"`,
    `Today: ${today}`,
    `Source: ${sourceLabel}`,
    '',
    'Active projects:',
    '```json',
    JSON.stringify(slimProjects, null, 2),
    '```',
    '',
    'Active goals:',
    '```json',
    JSON.stringify(slimGoals, null, 2),
    '```',
  ].join('\n');
}

// ─── Output parsing ─────────────────────────────────────────────────────────

// Extract the fenced ```json block at the end of the agent's response. The
// regex accepts trailing whitespace after the closing fence so a stray newline
// doesn't drop a valid block. Returns null on any structural mismatch — the
// caller falls back to a plain-text reply.
function parseUpdateTrackerOutput(finalText) {
  if (!finalText || typeof finalText !== 'string') return null;
  const match = finalText.match(/```json\s*([\s\S]*?)\s*```\s*$/);
  if (!match) return null;
  let parsed;
  try {
    parsed = JSON.parse(match[1]);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object') return null;
  const updates = Array.isArray(parsed.updates) ? parsed.updates : [];
  return {
    updates,
    matched_project: parsed.matched_project || null,
    ambiguous: parsed.ambiguous === true,
    confirmation: typeof parsed.confirmation === 'string' ? parsed.confirmation : '',
    raw: parsed,
  };
}

// ─── Update execution ───────────────────────────────────────────────────────

// Apply each update[] entry. Returns { applied: number, skipped: Array, errors: Array }.
// Per CLAUDE.md: errors bubble — but we collect them per-update so a single bad
// entry doesn't take down the rest of the batch. The caller decides what to
// show the user. Single-user V1 means the read-modify-write race on
// projects.todos is acceptable; toggleProjectTodo handles that path.
async function applyUpdateTrackerUpdates(parsed) {
  const result = { applied: 0, skipped: [], errors: [] };
  if (!parsed || !Array.isArray(parsed.updates) || parsed.updates.length === 0) {
    return result;
  }
  if (parsed.ambiguous) {
    // Ambiguous-but-with-updates is a contract violation; refuse to apply.
    parsed.updates.forEach((u) => result.skipped.push({ update: u, reason: 'ambiguous' }));
    return result;
  }

  const sb = window.getSupabaseClient ? window.getSupabaseClient() : null;
  if (!sb) {
    result.errors.push({ reason: 'supabase client not available' });
    return result;
  }
  const userId = typeof window.getCurrentUserId === 'function'
    ? await window.getCurrentUserId()
    : null;
  if (!userId) {
    result.errors.push({ reason: 'no authenticated user' });
    return result;
  }

  for (const u of parsed.updates) {
    try {
      if (!u || typeof u !== 'object') {
        result.skipped.push({ update: u, reason: 'not an object' });
        continue;
      }
      const { table, op } = u;

      // projects.update_todo — flip a single todo on the JSONB array.
      if (table === 'projects' && op === 'update_todo') {
        if (!u.project_id || !u.todo_id) {
          result.skipped.push({ update: u, reason: 'missing project_id or todo_id' });
          continue;
        }
        const { data: row, error: readErr } = await sb
          .from('projects')
          .select('todos')
          .eq('id', u.project_id)
          .eq('user_id', userId)
          .single();
        if (readErr) {
          result.errors.push({ update: u, reason: `read failed: ${readErr.message}` });
          continue;
        }
        const todos = Array.isArray(row && row.todos) ? row.todos : [];
        const idx = todos.findIndex((t) => t && t.id === u.todo_id);
        if (idx === -1) {
          result.skipped.push({ update: u, reason: 'todo_id not found' });
          continue;
        }
        const set = u.set && typeof u.set === 'object' ? u.set : { done: true };
        const nextTodos = todos.map((t, i) => (i === idx ? Object.assign({}, t, set) : t));
        const { error: writeErr } = await sb
          .from('projects')
          .update({ todos: nextTodos })
          .eq('id', u.project_id)
          .eq('user_id', userId);
        if (writeErr) {
          result.errors.push({ update: u, reason: `write failed: ${writeErr.message}` });
          continue;
        }
        result.applied += 1;
        continue;
      }

      // projects.update — set columns on the row directly. Whitelist columns
      // this skill is allowed to touch so a runaway prompt can't rewrite
      // body_markdown, etc.
      if (table === 'projects' && op === 'update') {
        if (!u.project_id || !u.set || typeof u.set !== 'object') {
          result.skipped.push({ update: u, reason: 'missing project_id or set' });
          continue;
        }
        const allowed = {};
        if (typeof u.set.status === 'string'
            && ['active', 'parked', 'done'].includes(u.set.status)) {
          allowed.status = u.set.status;
        }
        if (Object.keys(allowed).length === 0) {
          result.skipped.push({ update: u, reason: 'no allowed columns in set' });
          continue;
        }
        const { error } = await sb
          .from('projects')
          .update(allowed)
          .eq('id', u.project_id)
          .eq('user_id', userId);
        if (error) {
          result.errors.push({ update: u, reason: `write failed: ${error.message}` });
          continue;
        }
        result.applied += 1;
        continue;
      }

      // entries.insert — journal the user's words with a soft link.
      if (table === 'entries' && op === 'insert') {
        const data = u.data && typeof u.data === 'object' ? u.data : {};
        if (typeof data.body_markdown !== 'string' || data.body_markdown.length === 0) {
          result.skipped.push({ update: u, reason: 'missing body_markdown' });
          continue;
        }
        const kind = ['brief', 'journal', 'chat', 'review'].includes(data.kind)
          ? data.kind
          : 'journal';
        const source = ['voice', 'text', 'agent'].includes(data.source)
          ? data.source
          : 'voice';
        const links = data.links && typeof data.links === 'object' ? data.links : {};
        const row = {
          user_id: userId,
          kind,
          body_markdown: data.body_markdown,
          source,
          links,
        };
        const { error } = await sb.from('entries').insert(row);
        if (error) {
          result.errors.push({ update: u, reason: `write failed: ${error.message}` });
          continue;
        }
        result.applied += 1;
        continue;
      }

      // goals.update — rare; only column we permit is `archived_at`.
      if (table === 'goals' && op === 'update') {
        if (!u.goal_id || !u.set || typeof u.set !== 'object') {
          result.skipped.push({ update: u, reason: 'missing goal_id or set' });
          continue;
        }
        const allowed = {};
        if (u.set.archived_at === null || typeof u.set.archived_at === 'string') {
          allowed.archived_at = u.set.archived_at;
        }
        if (Object.keys(allowed).length === 0) {
          result.skipped.push({ update: u, reason: 'no allowed columns in set' });
          continue;
        }
        const { error } = await sb
          .from('goals')
          .update(allowed)
          .eq('id', u.goal_id)
          .eq('user_id', userId);
        if (error) {
          result.errors.push({ update: u, reason: `write failed: ${error.message}` });
          continue;
        }
        result.applied += 1;
        continue;
      }

      result.skipped.push({ update: u, reason: `unhandled table/op: ${table}/${op}` });
    } catch (e) {
      result.errors.push({ update: u, reason: e && e.message ? e.message : String(e) });
    }
  }

  return result;
}

// ─── End-to-end orchestrator ───────────────────────────────────────────────

// Public entry point used by the chat surface in intently-hero.jsx. Runs the
// full classify → assemble → callMaProxy → parse → apply pipeline. Returns:
//   { handled: false }                — utterance didn't match the trigger;
//                                       caller should fall through to chat
//   { handled: true, ok, reply, ... } — pipeline ran (success or failure).
//                                       `reply` is the conversational text to
//                                       append to the chat thread.
//
// On any pipeline failure (no proxy, agent error, parse failure), `ok: false`
// and `reply` is a generic fallback. We never fall back to the chat path once
// the trigger fired — that would double-bill the user for an LLM round-trip.
async function tryUpdateTracker(transcript, opts) {
  const source = opts && opts.source ? opts.source : 'voice';
  if (!looksLikeTrackerUpdate(transcript)) {
    return { handled: false };
  }
  if (typeof window.callMaProxy !== 'function') {
    return {
      handled: true,
      ok: false,
      reply: "I noticed you're logging work — but the agent proxy isn't loaded.",
      result: null,
    };
  }

  let input;
  try {
    input = await assembleUpdateTrackerInput(transcript, source);
  } catch (e) {
    return {
      handled: true,
      ok: false,
      reply: "I tried to pull your projects but couldn't reach the database. Try again in a moment.",
      result: null,
      error: e && e.message,
    };
  }

  let agentResp;
  try {
    agentResp = await window.callMaProxy({ skill: 'update-tracker', input });
  } catch (e) {
    return {
      handled: true,
      ok: false,
      reply: "I couldn't reach the model just now. Try again in a moment.",
      result: null,
      error: e && e.message,
    };
  }

  const finalText = (agentResp && agentResp.finalText) || '';
  const parsed = parseUpdateTrackerOutput(finalText);

  // Strip the JSON tail from the prose for the user-facing reply.
  const proseOnly = finalText.replace(/```json[\s\S]*?```\s*$/, '').trim();
  const fallbackReply = proseOnly || (parsed && parsed.confirmation) || "Got it.";

  if (!parsed) {
    return {
      handled: true,
      ok: false,
      reply: fallbackReply,
      result: null,
    };
  }

  if (parsed.ambiguous) {
    // Disambiguation question — no writes.
    return {
      handled: true,
      ok: true,
      reply: parsed.confirmation || fallbackReply,
      result: { applied: 0, skipped: [], errors: [], ambiguous: true },
      parsed,
    };
  }

  let applyResult = { applied: 0, skipped: [], errors: [] };
  try {
    applyResult = await applyUpdateTrackerUpdates(parsed);
  } catch (e) {
    return {
      handled: true,
      ok: false,
      reply: parsed.confirmation || fallbackReply,
      result: { applied: 0, skipped: [], errors: [{ reason: e && e.message }] },
      parsed,
    };
  }

  return {
    handled: true,
    ok: applyResult.errors.length === 0,
    reply: parsed.confirmation || fallbackReply,
    result: applyResult,
    parsed,
  };
}

Object.assign(window, {
  looksLikeTrackerUpdate,
  assembleUpdateTrackerInput,
  parseUpdateTrackerOutput,
  applyUpdateTrackerUpdates,
  tryUpdateTracker,
});
