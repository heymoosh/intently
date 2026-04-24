// Types + pure helpers for rendering agent output as a card. React-free so
// the logic can be unit-tested against node:test. The React component in
// app/components/AgentOutputCard.tsx consumes these.

export type AgentOutputKind = 'brief' | 'journal' | 'chat' | 'review';

export type InputTraceKind = 'calendar' | 'journal' | 'email' | 'health';

export type AgentOutput = {
  kind: AgentOutputKind;
  title: string;
  body: string;        // markdown
  generatedAt: string; // ISO 8601
  inputTraces?: InputTraceKind[];
};

export type KindMeta = {
  label: string;
  glyph: string;
  tintKey: 'brief' | 'journal' | 'chat' | 'review';
};

// Meta mirrors intently-journal.jsx kindMeta; glyphs are emoji stubs until
// the design-system glyph set lands in RN. tintKey is consumed by the card
// component to look up the concrete color token.
const KIND_META: Record<AgentOutputKind, KindMeta> = {
  brief:   { label: 'Brief',   glyph: '🌅', tintKey: 'brief' },
  journal: { label: 'Journal', glyph: '✏️', tintKey: 'journal' },
  chat:    { label: 'Chat',    glyph: '💬', tintKey: 'chat' },
  review:  { label: 'Review',  glyph: '🌙', tintKey: 'review' },
};

export function kindMetaFor(kind: AgentOutputKind): KindMeta {
  return KIND_META[kind];
}

// Render an ISO timestamp as "Generated 7:32 AM · Apr 24". Falls back to the
// raw string if parsing fails — agent output should still render even if the
// timestamp format changes upstream.
export function formatGeneratedAt(iso: string, now: Date = new Date()): string {
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

// Short human label for input traces, used as a chip on the card footer.
export function labelForInputTrace(trace: InputTraceKind): string {
  switch (trace) {
    case 'calendar': return 'Calendar';
    case 'journal':  return 'Journal';
    case 'email':    return 'Email';
    case 'health':   return 'Health';
  }
}
