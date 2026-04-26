// Web client for the ma-proxy Supabase Edge Function. The Edge Function holds
// the Anthropic API key server-side; this wrapper just POSTs JSON and surfaces
// the response. See supabase/functions/ma-proxy/README.md.
//
// Ported from app/lib/ma-client.ts. Differences:
//   - process.env.EXPO_PUBLIC_SUPABASE_URL → window.INTENTLY_CONFIG.supabaseUrl
//   - TypeScript types stripped
//   - Exports attached to window for cross-script access

class MaProxyError extends Error {
  constructor(status, detail, message) {
    super(message);
    this.name = 'MaProxyError';
    this.status = status;
    this.detail = detail;
  }
}

// Demo-mode canned responses — returned when window.INTENTLY_DEMO is true.
// No network calls; ~1200ms artificial delay so the typing animation has
// something to render. All strings are Sam-flavored (hackathon day 4).
async function __demoCannedResponse({ skill, input } = {}) {
  await new Promise(function(r) { setTimeout(r, 1200); });

  if (skill === 'daily-brief') {
    const brief = window.SAM_TODAY_BRIEF;
    if (!brief) {
      return { finalText: 'Morning, Sam. Today\'s brief is ready — seed data is the AM block, single focus, no Slack until 11.' };
    }
    return {
      finalText: brief.body_markdown + '\n\n```json\n' + JSON.stringify(brief.json_tail, null, 2) + '\n```',
    };
  }

  if (skill === 'daily-review') {
    return {
      finalText: 'Demo day landed. The walkthrough recorded clean and the seed data PR went out — both anchors held. Pacing felt good in the AM, scattered briefly mid-afternoon when I peeked at email; old pattern. Tomorrow: ship the wiring, single focus AM block, no Slack until 11.\n\n```json\n' + JSON.stringify({
        journal_text: 'Demo day landed. Walkthrough recorded clean; seed data PR shipped.',
        friction: [{ text: 'Peeked at email mid-afternoon — scattered focus for ~30 min.' }],
        tomorrow: [
          { text: 'Ship the wiring (agent runner → Supabase)', tier: 'P1' },
          { text: 'Single focus AM block, no Slack until 11', tier: 'P1' },
        ],
        calendar: [{ text: 'No hard meetings in the AM — protect the block.' }],
      }, null, 2) + '\n```',
    };
  }

  if (skill === 'weekly-review') {
    const weekly = window.SAM_WEEKLY_REVIEW;
    if (!weekly) {
      return { finalText: 'Week closed. AM blocks held when single-focus; afternoons drifted when I mixed spec and code. Next week: ship the wiring, hold 3x strength.' };
    }
    return {
      finalText: weekly.body_markdown + '\n\n```json\n' + JSON.stringify(weekly.json_tail, null, 2) + '\n```',
    };
  }

  if (skill === 'monthly-review') {
    return {
      finalText: 'April delivered the V1 ship. Hackathon hit on time. The thing that surprised me most: the agent layer actually felt useful by day 4 — not a demo trick, a real loop. Carrying into May: get to 10 real users, hold the 3x strength habit through the launch crunch. The pattern to watch: single-focus AM blocks work; mixed-mode sessions don\'t. That\'s the operating rule now.',
    };
  }

  if (skill === 'setup') {
    return { finalText: 'Setup complete. Welcome to Intently — your goals, projects, and rhythm are saved.' };
  }

  if (skill === 'chat') {
    var text = (input && (input.message || input.transcript || (typeof input === 'string' ? input : ''))) || '';
    var hash = text.split('').reduce(function(acc, c) { return acc + c.charCodeAt(0); }, 0);
    var replies = [
      'Got it — I\'ll keep that in your context.',
      'Noted. That\'ll surface in tomorrow\'s brief if it stays relevant.',
      'Caught it. You can come back to it any time.',
    ];
    return { finalText: replies[hash % replies.length] };
  }

  return { finalText: 'Got it — added to your context.' };
}

async function callMaProxy(req) {
  if (window.INTENTLY_DEMO) {
    return await __demoCannedResponse(req);
  }

  const supabaseUrl = window.INTENTLY_CONFIG && window.INTENTLY_CONFIG.supabaseUrl;
  if (!supabaseUrl) {
    throw new MaProxyError(
      0,
      null,
      'INTENTLY_CONFIG.supabaseUrl missing — cannot reach ma-proxy.',
    );
  }

  const endpoint = `${supabaseUrl.replace(/\/+$/, '')}/functions/v1/ma-proxy`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message = (body && body.error && body.error.message) || `ma-proxy responded ${res.status}`;
    const detail = (body && body.error && body.error.detail) || null;
    throw new MaProxyError(res.status, detail, message);
  }

  return await res.json();
}

// Wrap the proxy's finalText payload as an AgentOutput ready for AgentOutputCard.
function toAgentOutput(finalText, meta) {
  return {
    kind: meta.kind,
    title: meta.title,
    inputTraces: meta.inputTraces,
    body: finalText,
    generatedAt: new Date().toISOString(),
  };
}

Object.assign(window, { callMaProxy, toAgentOutput, MaProxyError });
