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

Object.assign(window, { kindMetaFor, formatGeneratedAt, labelForInputTrace });
