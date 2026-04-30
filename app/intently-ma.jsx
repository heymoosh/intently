// intently-ma.jsx — Managed Agents proxy client.
//
// Talks to the deployed `ma-proxy` Supabase Edge Function which shields the
// Anthropic API key and orchestrates the MA session (POST /v1/sessions →
// POST /events → GET /events/stream, collected to idle, returned as one shot).
//
// We only need the proxy URL — `verify_jwt = false` for ma-proxy, so the
// browser can fetch it directly without an Authorization header.

const MA_PROXY_URL = 'https://cjlktjrossrzmswrayfz.supabase.co/functions/v1/ma-proxy';

// Build the markdown-shaped input that the V1 deployment expects. Per
// `agents/daily-brief/ma-agent-config.json`, the agent has no file tools — all
// context is passed in the user message as markdown. We assemble it from the
// persisted store + a few first-class fields. Sections the agent is missing
// are simply omitted; it handles "(missing)" gracefully via its first-run
// branch.
// Merge seed goals (the three persona-defining ones rendered on Future) with
// any user-added goals from the store. The agent should see the full world,
// not just incremental adds.
function getCombinedGoals(state) {
  const seed = (typeof window !== 'undefined' && Array.isArray(window.SEED_GOALS) ? window.SEED_GOALS : [])
    .map((g) => ({ text: g.t, monthlySlice: g.month, source: 'seed' }));
  const added = ((state && state.goals) || []).map((g) => ({ text: g.text, monthlySlice: '', source: 'user-added' }));
  return [...seed, ...added];
}

// PROJECT_DATA lives on window after intently-projects.jsx loads. Combine with
// user-added projects from the store.
function getCombinedProjects(state) {
  const seed = (typeof window !== 'undefined' && Array.isArray(window.PROJECT_DATA) ? window.PROJECT_DATA : [])
    .map((p) => {
      const status = (p.done >= p.count) ? '🟢 Healthy'
                  : (p.done > 0) ? '🟡 In Progress'
                  : '⚪ Not Started';
      const tracker = Array.isArray(p.tracker) ? p.tracker.map((t) => `  - [${t.status === 'done' ? 'x' : ' '}] ${t.t}${t.by ? ` (by ${t.by})` : ''}`).join('\n') : '';
      return { name: p.name || p.id, blurb: p.blurb || '', status, tracker, source: 'seed' };
    });
  const added = ((state && state.projects) || []).map((p) => ({ name: p.text, blurb: '', status: '⚪ Not Started', tracker: '', source: 'user-added' }));
  return [...seed, ...added];
}

function buildBriefInput(state) {
  const today = new Date();
  const fmt = (d) => d.toISOString().slice(0, 10);

  // Yesterday's entries (anything dated before today).
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const journal = (state && state.journal && state.journal.today) || [];
  const yesterday = journal.filter((e) => e.at && new Date(e.at).getTime() < startOfToday);
  const todayEntries = journal.filter((e) => e.at && new Date(e.at).getTime() >= startOfToday);

  // Goals + projects merged from seed + user-added.
  const goals = getCombinedGoals(state);
  const projects = getCombinedProjects(state);

  const parts = [];
  parts.push(`# life-ops-config.md`);
  parts.push(`first_run_complete: ${yesterday.length > 0 ? 'true' : 'false'}`);
  parts.push(`reflection_filename: Reflection.md`);
  parts.push(`day_structure: morning P1, afternoon P2, evening P3`);
  parts.push(`weekly_review_day: Sunday`);
  parts.push(`calendar_mcp: not_connected`);
  parts.push(`email_mcp: not_connected`);
  parts.push(`health_file_enabled: false`);
  parts.push('');

  parts.push(`# Goals.md`);
  if (goals.length === 0) {
    parts.push(`(no long-term goals captured yet)`);
  } else {
    goals.forEach((g) => parts.push(`- ${g.text}`));
  }
  parts.push('');

  parts.push(`# Monthly Goals.md`);
  parts.push(`This month's priorities (refreshed monthly):`);
  goals.forEach((g) => {
    if (g.monthlySlice) parts.push(`- **${g.text}** — ${g.monthlySlice}`);
    else parts.push(`- **${g.text}**`);
  });
  parts.push('');

  parts.push(`# Weekly Goals.md`);
  parts.push(`Week of ${fmt(today)}.`);
  if (todayEntries.length === 0 && yesterday.length === 0) {
    parts.push(`(no journal entries this week yet — week is still forming around the goals above)`);
  }
  parts.push('');

  parts.push(`# Daily Log.md`);
  if (yesterday.length === 0) {
    parts.push(`(no prior entries — fresh start)`);
  } else {
    const grouped = new Map();
    yesterday.forEach((e) => {
      const day = fmt(new Date(e.at));
      if (!grouped.has(day)) grouped.set(day, []);
      grouped.get(day).push(e);
    });
    [...grouped.entries()].sort().reverse().forEach(([day, items]) => {
      parts.push(`## ${day}`);
      items.forEach((e) => parts.push(`- (${e.kind}) ${e.text}`));
      parts.push('');
    });
  }
  parts.push('');

  parts.push(`# Ops Plan.md — Project Dashboard`);
  if (projects.length === 0) {
    parts.push(`(no projects yet)`);
  } else {
    projects.forEach((p) => {
      parts.push(`## ${p.name} — ${p.status}`);
      if (p.blurb) parts.push(p.blurb);
      if (p.tracker) {
        parts.push(`Open todos:`);
        parts.push(p.tracker);
      }
      parts.push('');
    });
  }
  parts.push('');

  return parts.join('\n');
}

// Build whisper input — one short prompt for a one-sentence radar pulse.
// Reuses the same context shape as daily-brief but adds an aggressive terseness
// constraint. The dedicated `morning-whisper` agent (Haiku, separate system
// prompt) will hold this naturally; the fallback through daily-brief needs the
// constraint pushed hard because that agent is trained to write full briefs.
function buildWhisperInput(state) {
  const briefContext = buildBriefInput(state);
  return briefContext + `

# CRITICAL OUTPUT INSTRUCTION (overrides default behavior)

Reply with **a single short sentence — under 20 words.** This is a phone notification, not a brief. Pick the one thing on the user's radar that, if missed, would matter most today. Stop after the sentence.

Hard rules:
- One sentence. Stop.
- Under 20 words.
- No structure, no bullets, no JSON, no greeting.
- If nothing is genuinely radar-worthy, say "Nothing pressing — just keep moving." (5 words.)

Examples of correct length:
- "Pitch dry-run with Anya at 3pm — that's the one."
- "April closes today and the visa checklist hasn't moved in two weeks."
- "Three days deep — today's a good day to ease off."
- "Nothing pressing — just keep moving."

Examples of WRONG length (too long, do NOT do this):
- "April ends today and none of this month's stated priorities appear anywhere on your Ops Plan, so before pitch-deck or job-hunt work eats the day, the real question is whether you're consciously letting April close on them or pulling one back onto the board now."

Now reply with the one sentence.`;
}

// Speak a string via the browser's SpeechSynthesis API. Picks a "warm" voice
// when one is available — Samantha / Karen / Daniel etc. on Apple devices.
// Returns a stop() function. Free, no extra LLM cost.
function speak(text) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return () => {};
  const utter = new SpeechSynthesisUtterance(text);
  // Prefer warm-sounding voices when available.
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(v => /samantha|karen|moira|tessa|fiona/i.test(v.name))
                 || voices.find(v => v.lang?.startsWith('en') && v.localService);
  if (preferred) utter.voice = preferred;
  utter.rate = 0.95;
  utter.pitch = 1.0;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
  return () => window.speechSynthesis.cancel();
}

// Build review input — today's entries are the source-of-truth for "what got
// done." `daily-review` skill expects today's chat history + Daily Log entry.
function buildReviewInput(state) {
  const today = new Date();
  const fmt = (d) => d.toISOString().slice(0, 10);
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

  const journal = (state && state.journal && state.journal.today) || [];
  const todayEntries = journal.filter((e) => e.at && new Date(e.at).getTime() >= startOfToday);
  const planMorning = (state && state.plan && state.plan.Morning) || [];
  const planAfternoon = (state && state.plan && state.plan.Afternoon) || [];
  const planEvening = (state && state.plan && state.plan.Evening) || [];

  const parts = [];
  parts.push(`# life-ops-config.md`);
  parts.push(`first_run_complete: false`);
  parts.push(`reflection_filename: Reflection.md`);
  parts.push('');

  parts.push(`# Daily Log.md`);
  parts.push(`## ${fmt(today)} — today's plan`);
  if (planMorning.length) parts.push(`### Morning (P1)`);
  planMorning.forEach((p) => parts.push(`- ${p.text}`));
  if (planAfternoon.length) parts.push(`### Afternoon (P2)`);
  planAfternoon.forEach((p) => parts.push(`- ${p.text}`));
  if (planEvening.length) parts.push(`### Evening (P3)`);
  planEvening.forEach((p) => parts.push(`- ${p.text}`));
  parts.push('');

  parts.push(`# today's chat history`);
  if (todayEntries.length === 0) {
    parts.push(`(no journal entries today)`);
  } else {
    todayEntries.forEach((e) => {
      const time = new Date(e.at).toTimeString().slice(0, 5);
      parts.push(`- ${time} (${e.kind}, ${e.source}): ${e.text}`);
    });
  }

  return parts.join('\n');
}

// Extract the trailing fenced ```json block from the agent's prose output.
// Returns { prose, json } where prose has the JSON block stripped, and json
// is the parsed object (or null on parse failure).
function parseAgentOutput(finalText) {
  if (!finalText) return { prose: '', json: null };
  const m = finalText.match(/```json\s*([\s\S]*?)\s*```\s*$/);
  if (!m) return { prose: finalText, json: null };
  let parsed = null;
  try { parsed = JSON.parse(m[1]); } catch {}
  const prose = finalText.slice(0, m.index).trim();
  return { prose, json: parsed };
}

// Call ma-proxy. Returns { sessionId, finalText, prose, json, status, error }.
async function callManagedAgent(skill, input, opts = {}) {
  const body = { skill, input };
  if (opts.sessionId) body.sessionId = opts.sessionId;

  const res = await fetch(MA_PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  let payload;
  try { payload = await res.json(); }
  catch { return { error: { message: 'proxy returned non-JSON', status: res.status }, status: 'error' }; }

  if (!res.ok) {
    return { error: payload?.error || { message: `proxy ${res.status}` }, status: 'error' };
  }

  const { prose, json } = parseAgentOutput(payload.finalText || '');
  return {
    sessionId: payload.sessionId,
    finalText: payload.finalText || '',
    prose,
    json,
    status: payload.status || 'idle',
    error: payload.error,
  };
}

// ─── Personality narration ────────────────────────────────────────────
// Klei-style waiting copy: rotating beats that read like Maya's own
// margin-notes while the agent thinks. Replaces a generic "thinking…"
// indicator. Beats are tagged by phase so the surface can reach for
// "still drafting" copy after ~20s instead of looping the early ones.
//
// Pick beats deterministically per (skill + day) so the user doesn't see the
// same line twice in two different sessions on the same day, but also doesn't
// feel random — the agent has a personality, not a random number generator.
const NARRATION_BEATS = {
  brief: {
    early: [
      "reading yesterday's log",
      'checking what April was for',
      "pulling this week's outcomes",
      "scanning what's still on the board",
      'taking a beat to read between the lines',
      'remembering where we left off',
    ],
    middle: [
      'calibrating pacing',
      'choosing what actually deserves the morning',
      "weighing what's load-bearing today",
      "noting which threads are still open",
      'looking for the one thing under everything else',
    ],
    late: [
      'picking my words',
      'drafting',
      'one more pass',
      'almost there — tightening',
    ],
  },
  review: {
    early: [
      'rereading the day',
      'finding the shape of what just happened',
      'looking for the through-line',
      'noting what got moved, what got dropped',
    ],
    middle: [
      'choosing the highlight',
      'sitting with what was hard',
      'naming the one move that mattered',
    ],
    late: [
      'writing it down',
      'tightening the recap',
      'almost there',
    ],
  },
  default: {
    early: ['thinking', 'reading the room'],
    middle: ['working through it'],
    late: ['drafting'],
  },
};

// Pick a narration beat based on elapsed milliseconds since the call started.
// Rotates within a phase so the user sees movement.
function pickBeat(skillKind, elapsedMs) {
  const set = NARRATION_BEATS[skillKind] || NARRATION_BEATS.default;
  let pool;
  if (elapsedMs < 8000) pool = set.early;
  else if (elapsedMs < 25000) pool = set.middle;
  else pool = set.late;
  // Rotate every 3.5s within the phase.
  const idx = Math.floor(elapsedMs / 3500) % pool.length;
  return pool[idx];
}

Object.assign(window, { MA_PROXY_URL, callManagedAgent, buildBriefInput, buildReviewInput, buildWhisperInput, parseAgentOutput, pickBeat, NARRATION_BEATS, speak });
