// intently-projects.jsx — Projects surface on the Future screen.
// Simple card grid → tap → detail sheet with markdown description + tracker table.

const PROJECT_DATA = [
  {
    id: 'jobhunt',
    name: 'Job Hunt — Ops role',
    blurb: 'Reframing what I want. No applications until v2 is written.',
    tint: T.color.TintClay,
    glyph: 'compass',
    count: 6,
    done: 2,
    markdown: [
      { kind: 'h1', text: 'Job Hunt — Ops role' },
      { kind: 'eyebrow', text: 'Intent' },
      { kind: 'p', text: 'Find an operator role with a small, serious team where the work is real and the judgment bar is high. Not optimizing for title; optimizing for the next three years of learning.' },
      { kind: 'eyebrow', text: 'Pre-mortem' },
      { kind: 'p', text: 'The thing that would make this fail: applying before the pitch for myself is written. I\'d get offers that round-trip me back to where I started.' },
      { kind: 'eyebrow', text: 'Shape of the week' },
      { kind: 'p', text: 'Morning: write. Afternoon: reach out to two people who know me. Evening: read one company deeply — not a list of twenty.' },
    ],
    tracker: [
      { t: 'Write the v2 pitch for myself',          by: 'Fri',   status: 'doing' },
      { t: 'List of 10 companies — real fits only',  by: 'Sun',   status: 'todo'  },
      { t: 'Reach out to Anya',                       by: 'Apr 22', status: 'done' },
      { t: 'Reach out to Jordan',                     by: 'Apr 24', status: 'done' },
      { t: 'Portfolio case study: the migration',     by: 'May 1',  status: 'todo' },
      { t: 'Mock interview with M',                   by: 'May 5',  status: 'todo' },
    ],
  },
  {
    id: 'pitch',
    name: 'Pitch deck v3',
    blurb: 'Rewriting the data slide. The one where Anya pushed back.',
    tint: T.color.TintLilac,
    glyph: 'presentation',
    count: 4,
    done: 2,
    markdown: [
      { kind: 'h1', text: 'Pitch deck v3' },
      { kind: 'eyebrow', text: 'The shape' },
      { kind: 'p', text: 'Three beats: what we learned, what it implies, what we\'re doing. Cut the defensive framing. The numbers can carry themselves.' },
    ],
    tracker: [
      { t: 'Rewrite the data slide',   by: 'Thu',   status: 'done'  },
      { t: 'Replace stock hero photo', by: 'Fri',   status: 'doing' },
      { t: 'Dry run with M',           by: 'Sat',   status: 'todo'  },
      { t: 'Send to Anya',             by: 'Tue',   status: 'todo'  },
    ],
  },
  {
    id: 'move',
    name: 'Apartment move',
    blurb: 'Lease signed. Boxes in the corner. Not yet real.',
    tint: T.color.TintMoss,
    glyph: 'map',
    count: 5,
    done: 1,
    markdown: [
      { kind: 'h1', text: 'Apartment move' },
      { kind: 'eyebrow', text: 'Status' },
      { kind: 'p', text: 'Lease signed for May 15. Everything else still fog.' },
    ],
    tracker: [
      { t: 'Lease signed',          by: 'Apr 10', status: 'done'  },
      { t: 'Movers booked',         by: 'May 1',  status: 'todo'  },
      { t: 'Utilities transferred', by: 'May 10', status: 'todo'  },
      { t: 'Boxes from storage',    by: 'May 3',  status: 'todo'  },
      { t: 'Change of address',     by: 'May 15', status: 'todo'  },
    ],
  },
  {
    id: 'book',
    name: 'The essay on attention',
    blurb: 'Draft 2 sitting since February. Return to it in May.',
    tint: T.color.TintButter,
    glyph: 'book',
    count: 3,
    done: 1,
    markdown: [
      { kind: 'h1', text: 'The essay on attention' },
      { kind: 'p', text: 'Held in the drawer on purpose. Picking it up in May with fresh eyes.' },
    ],
    tracker: [
      { t: 'Reread draft 2',    by: 'May 2',  status: 'todo' },
      { t: 'Cut the middle',    by: 'May 9',  status: 'todo' },
      { t: 'Send to two readers', by: 'May 16', status: 'done' },
    ],
  },
];

function ProjectCard({ p, onOpen }) {
  const pct = Math.round((p.done / p.count) * 100);
  return (
    <button onClick={onOpen} style={{
      position: 'relative', textAlign: 'left', border: 'none', cursor: 'pointer',
      background: T.color.SecondarySurface, borderRadius: 14, padding: 14,
      boxShadow: T.shadow.Raised, overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: p.tint }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10, marginTop: 2 }}>
        <span style={{ width: 32, height: 32, borderRadius: 9, background: `${p.tint}44`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Glyph name={p.glyph} size={18} color={T.color.PrimaryText} stroke={1.75} />
        </span>
        <div style={{ fontFamily: T.font.UI, fontSize: 10, fontWeight: 700, letterSpacing: 0.6, color: T.color.SubtleText, marginLeft: 'auto', textTransform: 'uppercase' }}>{p.done}/{p.count}</div>
      </div>
      <div style={{ fontFamily: T.font.Display, fontSize: 16, lineHeight: '20px', fontStyle: 'italic', fontWeight: 500, color: T.color.PrimaryText, letterSpacing: -0.2, marginBottom: 4 }}>{p.name}</div>
      <div style={{ fontFamily: T.font.Reading, fontSize: 12, lineHeight: '17px', color: T.color.SupportingText }}>{p.blurb}</div>
      <div style={{ marginTop: 10, height: 3, background: T.color.EdgeLine, borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: p.tint }} />
      </div>
    </button>
  );
}

function ProjectDetail({ p, onBack }) {
  return (
    <div style={{ height: '100%', background: T.color.SecondarySurface, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Cover */}
      <div style={{ position: 'relative', padding: '14px 18px 22px', background: p.tint, overflow: 'hidden' }}>
        <div className="intently-grain" style={{ opacity: 0.25 }} />
        <button onClick={onBack} style={{
          position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 4,
          fontFamily: T.font.UI, fontSize: 12, fontWeight: 600, color: T.color.TintMoss,
          background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', marginBottom: 8,
        }}>← Projects</button>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: T.font.UI, fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: T.color.TintMoss, opacity: 0.8 }}>Project</div>
            <div style={{ fontFamily: T.font.Display, fontSize: 26, lineHeight: '30px', fontStyle: 'italic', fontWeight: 500, color: T.color.TintMoss, letterSpacing: -0.4, marginTop: 2 }}>{p.name}</div>
          </div>
          <span style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(43,33,24,0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Glyph name={p.glyph} size={26} color={T.color.TintMoss} stroke={1.75} />
          </span>
        </div>
      </div>

      {/* Body — markdown + tracker */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px 140px' }}>
        {p.markdown.map((b, i) => {
          if (b.kind === 'h1') return null;
          if (b.kind === 'eyebrow') return (
            <div key={i} style={{ fontFamily: T.font.UI, fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: T.color.SupportingText, marginTop: i > 0 ? 18 : 0, marginBottom: 6 }}>{b.text}</div>
          );
          return <p key={i} style={{ fontFamily: T.font.Reading, fontSize: 15, lineHeight: '23px', color: T.color.PrimaryText, margin: '0 0 10px' }}>{b.text}</p>;
        })}

        <div style={{ marginTop: 22 }}>
          <div style={{ fontFamily: T.font.UI, fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: T.color.SupportingText, marginBottom: 10 }}>Tracker</div>
          <div style={{ background: T.color.PrimarySurface, border: `1px solid ${T.color.EdgeLine}`, borderRadius: 12, overflow: 'hidden' }}>
            {p.tracker.map((r, i) => {
              const dot = { done: T.color.TintSageDeep, doing: T.color.TintDusk, todo: T.color.SubtleText }[r.status];
              return (
                <div key={i} style={{
                  display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'center',
                  padding: '12px 14px',
                  borderBottom: i < p.tracker.length - 1 ? `1px solid ${T.color.EdgeLine}` : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <span style={{ width: 7, height: 7, borderRadius: 999, background: dot, flexShrink: 0 }} />
                    <span style={{ fontFamily: T.font.Reading, fontSize: 14, lineHeight: '18px', color: T.color.PrimaryText, textDecoration: r.status === 'done' ? 'line-through' : 'none', opacity: r.status === 'done' ? 0.6 : 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.t}</span>
                  </div>
                  <span style={{ fontFamily: T.font.Mono, fontSize: 11, color: T.color.SupportingText, flexShrink: 0 }}>{r.by}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// A compact Projects band to insert below the Goals chapter covers on FutureScreen
function ProjectsBand({ onOpen }) {
  return (
    <div style={{ padding: '0 20px', marginTop: 26 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ fontFamily: T.font.UI, fontSize: 10, fontWeight: 700, letterSpacing: 1.4, textTransform: 'uppercase', color: T.color.SupportingText }}>Projects</div>
        <div style={{ fontFamily: T.font.UI, fontSize: 11, color: T.color.SubtleText }}>{PROJECT_DATA.length} active</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {PROJECT_DATA.map(p => <ProjectCard key={p.id} p={p} onOpen={() => onOpen && onOpen(p)} />)}
      </div>
    </div>
  );
}

Object.assign(window, { PROJECT_DATA, ProjectCard, ProjectDetail, ProjectsBand });
