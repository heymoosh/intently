// Pure helpers for rendering agent output as a card. No React, no DOM —
// the JSX components consume kindMetaFor / formatGeneratedAt / labelForInputTrace
// directly off window.
//
// Ported from app/lib/agent-output.ts (TypeScript types stripped).

const KIND_META = {
  brief:   { label: 'Brief',   glyph: '🌅', tintKey: 'brief' },
  journal: { label: 'Journal', glyph: '✏️', tintKey: 'journal' },
  chat:    { label: 'Chat',    glyph: '💬', tintKey: 'chat' },
  review:  { label: 'Review',  glyph: '🌙', tintKey: 'review' },
};

function kindMetaFor(kind) {
  return KIND_META[kind];
}

function formatGeneratedAt(iso, now = new Date()) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return `Generated ${iso}`;

  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();

  const hh = d.getHours();
  const mm = d.getMinutes();
  const ampm = hh < 12 ? 'AM' : 'PM';
  const hh12 = ((hh + 11) % 12) + 1;
  const time = `${hh12}:${mm.toString().padStart(2, '0')} ${ampm}`;

  if (sameDay) return `Generated ${time}`;

  const month = d.toLocaleString('en-US', { month: 'short' });
  return `Generated ${time} · ${month} ${d.getDate()}`;
}

function labelForInputTrace(trace) {
  switch (trace) {
    case 'calendar': return 'Calendar';
    case 'journal':  return 'Journal';
    case 'email':    return 'Email';
    case 'health':   return 'Health';
    default:         return trace;
  }
}

// Split prose into paragraphs. The agent prompt asks for "≤3 short paragraphs."
// Most clients render \n\n as paragraph break; some emit single \n. Try both.
function splitParagraphs(text) {
  if (!text || typeof text !== 'string') return [];
  const trimmed = text.trim();
  if (!trimmed) return [];
  const byDouble = trimmed.split(/\n\s*\n+/).map(s => s.trim()).filter(Boolean);
  if (byDouble.length >= 2) return byDouble;
  const bySingle = trimmed.split(/\n+/).map(s => s.trim()).filter(Boolean);
  if (bySingle.length >= 2) return bySingle;
  return [trimmed];
}

// Parse the daily-review prompt's deterministic 3-paragraph shape:
//   para 1 → what got done (journal-worthy quote)
//   para 2 → friction (a sentence of reflection)
//   para 3 → seed for tomorrow
// Returns null when the response is too short / shaped wrong to map cleanly,
// so the consumer can fall back to the static demo copy.
function parseReviewProse(text) {
  const paras = splitParagraphs(text);
  if (paras.length < 2) return null;
  const journal  = paras[0];
  const friction = paras[1];
  const tomorrow = paras[2] || '';
  return { journal, friction, tomorrow };
}

// Parse the daily-brief prompt's 3-paragraph shape into a pacing pair:
//   pacing.title ← first sentence of paragraph 1 (felt-sense opener)
//   pacing.body  ← remainder
// Title length guarded so the italic quote slot doesn't overflow.
function parseBriefProse(text, opts = {}) {
  const titleMax = opts.titleMax || 90;
  const paras = splitParagraphs(text);
  if (!paras.length) return null;
  const first = paras[0];
  const sentenceMatch = first.match(/^[^.!?]+[.!?]/);
  let title = sentenceMatch ? sentenceMatch[0].trim() : first;
  if (title.length > titleMax) return null;
  const restOfFirst = first.slice(title.length).trim();
  const body = [restOfFirst, ...paras.slice(1)].filter(Boolean).join(' ').trim();
  if (!body) return null;
  return { pacing: { title, body } };
}

// Parse the agent's daily-review response (prose + optional JSON tail per
// `agents/daily-review/SKILL.md` Output contract).
// Returns { journalText, friction[], tomorrow[], calendar[], proseBody } or
// the parseReviewProse fallback shape ({ journal, friction, tomorrow }).
function parseAgentReview(text) {
  if (!text || typeof text !== 'string') return null;
  const trimmed = text.trim();
  const jsonMatch = trimmed.match(/```json\s*([\s\S]*?)\s*```\s*$/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1]);
      return {
        journalText: parsed.journal_text || '',
        friction: Array.isArray(parsed.friction) ? parsed.friction : [],
        tomorrow: Array.isArray(parsed.tomorrow) ? parsed.tomorrow : [],
        calendar: Array.isArray(parsed.calendar) ? parsed.calendar : [],
        proseBody: trimmed.replace(/```json[\s\S]*$/, '').trim(),
      };
    } catch {
      // fall through to prose
    }
  }
  return parseReviewProse(trimmed);
}

Object.assign(window, {
  kindMetaFor, formatGeneratedAt, labelForInputTrace,
  parseReviewProse, parseBriefProse, parseAgentReview,
});
