// intently-flows.jsx — Start-of-day brief flow, end-of-day review flow,
// goal detail screen, enriched project detail, and the animated plan-populate.
//
// Flows are full-screen chat-style overlays over Present. Questions drive the
// conversation, user answers land as speech-bubble entries, a ConfirmationCard
// appears at the end, the user accepts, and the plan populates in Present with
// a staggered fade-in.

// ─── GOAL / PROJECT DOMAIN DATA ─────────────────────────────────────
// Seeded here alongside projects because each project's goal_id lives on the
// project object (see HANDOFF §1.4). In production this lives in the Goal/
// Project tables.
const GOAL_DATA = [
  {
    id: 'japan',
    title: 'Move to Japan.',
    created: 'Nov 2025',
    intention: "Not a vacation — a life. 1–2 year stint in Tokyo or Kyoto to let the work slow down and the language take root. Test the version of me that isn't optimizing for New York.",
    month: 'April: finish the visa checklist and book the scouting trip for June.',
    monthNarrative: 'You said April was the month for paperwork and a scouting date. Visa checklist is 80% — passport renewal is the one blocker. Scouting trip is booked for June 9–18. The side of this you keep dodging: telling your mother.',
    glyph: 'plane',
    pal: ['#F5EBCF', '#CFC9EB', '#F0B98C', '#E6DFF5'],
    milestones: [
      { text: 'Visa paperwork complete',        month: 'May', status: 'doing' },
      { text: 'Scouting trip — Tokyo & Kyoto',  month: 'Jun', status: 'todo'  },
      { text: 'Tokyo apartment signed',         month: 'Aug', status: 'todo'  },
      { text: 'Land in Tokyo',                  month: 'Sep', status: 'todo'  },
      { text: 'Conversational JLPT N4',         month: 'Mar \'27', status: 'todo' },
    ],
    projectIds: ['move', 'visa', 'japanese'],
    reflections: [
      { date: 'Apr 12', quote: "Quiet morning. Re-read the mission doc. I don't want the move to be a dodge — I want it to be an answer." },
      { date: 'Apr 06', quote: "Mom asked about Thanksgiving. I said 'let's see.' That's the part I need to get clean about." },
    ],
  },
  {
    id: 'hustle',
    title: 'Start a side hustle that pays my rent.',
    created: 'Jan 2026',
    intention: 'A small, real business — not a startup. Something I can run on weekends that covers $3k/mo within a year. Writing-adjacent; uses the taste I already have.',
    month: 'April: ship the landing page and get 10 waitlist signups from real conversations.',
    monthNarrative: 'Landing page shipped last Thursday. 4 signups so far, all from DMs. Pitch deck v3 is the real lever this month — once that lands with Anya the conversation shifts.',
    glyph: 'leaf',
    pal: ['#E8EDE3', '#B8D0BE', '#F1DE8A', '#E8A25E'],
    milestones: [
      { text: 'Landing page live',          month: 'Apr', status: 'done'  },
      { text: '10 real waitlist signups',   month: 'Apr', status: 'doing' },
      { text: 'First paying customer',      month: 'Jun', status: 'todo'  },
      { text: '$1k MRR',                    month: 'Sep', status: 'todo'  },
      { text: '$3k MRR — rent covered',     month: 'Mar \'27', status: 'todo' },
    ],
    projectIds: ['pitch', 'jobhunt'],
    reflections: [
      { date: 'Apr 15', quote: "First investor call. Didn't stumble on the data slide. I keep undervaluing the thing I've actually done." },
    ],
  },
  {
    id: 'growth',
    title: 'Be someone I would want to work with.',
    created: 'Jan 2026',
    intention: 'Hard to measure but easy to notice. Less defensiveness. More clarity in writing. Saying the hard thing in the room, not after.',
    month: 'April: one 1:1 a week, and say the hard thing out loud when it matters.',
    monthNarrative: '3 of 4 1:1s done this month. The hard-thing muscle is still twitchy — you said it in the Anya call and immediately wanted to walk it back.',
    glyph: 'handshake',
    pal: ['#F5EBCF', '#F0B98C', '#E6DFF5', '#F1DE8A'],
    milestones: [
      { text: 'Weekly 1:1 rhythm holds',    month: 'Apr', status: 'doing' },
      { text: 'Give 3 pieces of hard feedback', month: 'Jun', status: 'todo' },
      { text: 'Lead a cross-functional review', month: 'Sep', status: 'todo' },
    ],
    projectIds: ['book'],
    reflections: [
      { date: 'Apr 08', quote: "Week 16 review — okay week, not great. I coasted on two meetings I should have led." },
    ],
  },
];

// Extend PROJECT_DATA with goal_id + intention + impact + tight status.
// (In production these live on the Project model; seeded inline here.)
const PROJECT_EXTRAS = {
  move: {
    goalId: 'japan',
    intention: 'A top-floor 2-bed in Tokyo with a study, near a quiet line. Lease before September so the transition isn\'t rushed.',
    impact: 'Without a place, the move is theoretical. This is the project that turns the goal from idea into address.',
    status: 'Lease signed for May 15 (interim NYC). Tokyo search starts post-scouting-trip.',
  },
  visa: {
    goalId: 'japan',
    intention: 'HSP (Highly Skilled Professional) visa — points-based, fastest route. Paperwork volume is the real cost.',
    impact: 'Without the visa, no apartment, no bank account, no move. Everything downstream blocks on this.',
    status: 'Checklist 80% done. Passport renewal is the open blocker.',
  },
  japanese: {
    goalId: 'japan',
    intention: 'Conversational by landing — not fluent. Enough to order, ask directions, handle a landlord call.',
    impact: "Landing without it means living in the expat bubble. That defeats the point of the move.",
    status: '20 min/day with Pimsleur. N5 feels close; N4 is the real target.',
  },
  jobhunt: {
    goalId: 'hustle',
    intention: 'An operator role with a small, serious team. Not optimizing for title — for the next three years of learning.',
    impact: 'Bridges the gap between "quit NY job" and "side hustle covers rent." Gives the hustle room to breathe.',
    status: 'Writing the v2 pitch for myself. No applications until it\'s done.',
  },
  pitch: {
    goalId: 'hustle',
    intention: 'Three beats: what we learned, what it implies, what we\'re doing. No defensive framing — the numbers carry themselves.',
    impact: 'Once Anya signs off, the conversation shifts from "idea" to "who\'s in." This is the unlock.',
    status: 'Data slide rewritten. Dry run with M on Saturday.',
  },
  book: {
    goalId: 'growth',
    intention: 'Essay on attention — why we default to the performative version of work even when no one is watching.',
    impact: 'The piece of writing that makes the case for how I want to work. Held in the drawer on purpose.',
    status: 'Draft 2 done Feb 14. Resting. Picking it up in May.',
  },
};

// ─── GOAL DETAIL SCREEN ─────────────────────────────────────────────
function GoalDetail({ goal, onBack, onOpenProject }) {
  const projects = goal.projectIds
    .map(id => {
      const p = (typeof PROJECT_DATA !== 'undefined' && PROJECT_DATA.find(x => x.id === id)) || null;
      if (p) return p;
      // Fallback stub for visa/japanese (not in original PROJECT_DATA)
      const stubs = {
        visa:      { id: 'visa',     name: 'Visa paperwork',      blurb: 'HSP track. Passport renewal is the open blocker.',        tint: T.color.TintPeachSoft, glyph: 'alarm', count: 8, done: 6, tracker: [], markdown: [] },
        japanese:  { id: 'japanese', name: 'Japanese — N4 by landing', blurb: '20 min/day. N5 feels close. N4 is the real target.',     tint: T.color.TintButter,    glyph: 'book',  count: 4, done: 1, tracker: [], markdown: [] },
      };
      return stubs[id];
    })
    .filter(Boolean);

  return (
    <div style={{ height: '100%', background: T.color.PrimarySurface, display: 'flex', flexDirection: 'column', overflow: 'hidden', }}>
      {/* Painterly hero */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <PainterlyBlock palette={goal.pal} seed={11} style={{ padding: '18px 22px 28px', minHeight: 220, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: -24, bottom: -32, opacity: 0.22, pointerEvents: 'none', lineHeight: 0 }}>
            <Glyph name={goal.glyph} size={200} color={T.color.PrimaryText} stroke={1.3} />
          </div>
          <button onClick={onBack} aria-label="Back" style={{
            position: 'relative', zIndex: 2,
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontFamily: T.font.UI, fontSize: 12, fontWeight: 600, color: T.color.PrimaryText,
            background: 'rgba(251,246,234,0.55)', border: 'none', borderRadius: 999,
            padding: '6px 12px 6px 8px', cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(31,27,21,0.08)',
          }}>
            <Icon.ArrowLeft size={14} color={T.color.PrimaryText} />
            Future
          </button>
          <div style={{ position: 'relative', marginTop: 24 }}>
            <div style={{ fontFamily: T.font.UI, fontSize: 10, fontWeight: 700, letterSpacing: 1.4, textTransform: 'uppercase', color: T.color.PrimaryText, opacity: 0.65 }}>Goal · Started {goal.created}</div>
            <div style={{
              marginTop: 6, fontFamily: T.font.Display, fontSize: 32, lineHeight: '36px',
              fontStyle: 'italic', fontWeight: 500, color: T.color.PrimaryText, letterSpacing: -0.6,
              textWrap: 'pretty', maxWidth: '84%',
            }}>{goal.title}</div>
          </div>
        </PainterlyBlock>
      </div>

      {/* Scroll */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px 140px' }}>
        {/* Intention — the original why */}
        <Section label="Intention">
          <p style={readingP}>{goal.intention}</p>
        </Section>

        {/* This month — the agent's monthly review narrative */}
        <Section label="This month" sub="from your monthly review">
          <div style={{
            background: T.color.TintSage + '33',
            border: `1px solid ${T.color.TintSage}88`,
            borderRadius: 12, padding: '14px 16px',
          }}>
            <div style={{ fontFamily: T.font.UI, fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: T.color.TintSageDeep, marginBottom: 6 }}>April · focus</div>
            <div style={{ fontFamily: T.font.Reading, fontSize: 15, lineHeight: '23px', color: T.color.PrimaryText, fontStyle: 'italic', marginBottom: 10 }}>
              "{goal.month.replace(/^April:\s*/, '')}"
            </div>
            <div style={{ fontFamily: T.font.Reading, fontSize: 14, lineHeight: '22px', color: T.color.SupportingText }}>
              {goal.monthNarrative}
            </div>
          </div>
        </Section>

        {/* Milestones — target months, not dates */}
        <Section label="Milestones" sub="the higher-level beats">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {goal.milestones.map((m, i) => {
              const isLast = i === goal.milestones.length - 1;
              const dotColor = m.status === 'done' ? T.color.TintSageDeep
                             : m.status === 'doing' ? T.color.FocusObject
                             : T.color.SubtleText;
              return (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '28px 1fr auto', gap: 10, alignItems: 'start' }}>
                  {/* timeline column */}
                  <div style={{ position: 'relative', height: '100%', minHeight: 42 }}>
                    <span style={{
                      position: 'absolute', left: '50%', top: 10, transform: 'translateX(-50%)',
                      width: 11, height: 11, borderRadius: 999,
                      background: m.status === 'done' ? dotColor : T.color.PrimarySurface,
                      border: `2px solid ${dotColor}`, zIndex: 2,
                    }} />
                    {!isLast && (
                      <span style={{
                        position: 'absolute', left: '50%', top: 22, bottom: -4,
                        width: 2, marginLeft: -1,
                        background: `linear-gradient(${T.color.EdgeLine}, ${T.color.EdgeLine})`,
                      }} />
                    )}
                  </div>
                  <div style={{ paddingTop: 6, paddingBottom: 14 }}>
                    <div style={{
                      fontFamily: T.font.Reading, fontSize: 15, lineHeight: '22px',
                      color: T.color.PrimaryText,
                      textDecoration: m.status === 'done' ? 'line-through' : 'none',
                      opacity: m.status === 'done' ? 0.55 : 1,
                    }}>{m.text}</div>
                    {m.status === 'doing' && (
                      <div style={{ fontFamily: T.font.UI, fontSize: 10, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', color: T.color.FocusObject, marginTop: 2 }}>In motion</div>
                    )}
                  </div>
                  <div style={{ paddingTop: 6, fontFamily: T.font.Mono, fontSize: 11, color: T.color.SupportingText, whiteSpace: 'nowrap' }}>{m.month}</div>
                </div>
              );
            })}
          </div>
        </Section>

        {/* Projects under this goal */}
        <Section label="Projects" sub={`${projects.length} under this goal`}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {projects.map(p => <ProjectCard key={p.id} p={p} onOpen={() => onOpenProject && onOpenProject(p)} />)}
          </div>
        </Section>

        {/* Reflections — pulled journal quotes */}
        {goal.reflections && goal.reflections.length > 0 && (
          <Section label="Reflections" sub="pulled from your journal">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {goal.reflections.map((r, i) => (
                <div key={i} style={{
                  padding: '14px 16px',
                  background: T.color.TintLilac + '2a',
                  borderLeft: `3px solid ${T.color.TintLilac}`,
                  borderRadius: '0 10px 10px 0',
                }}>
                  <div style={{ fontFamily: T.font.UI, fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: T.color.SupportingText, marginBottom: 4 }}>{r.date}</div>
                  <div style={{ fontFamily: T.font.Reading, fontSize: 15, lineHeight: '23px', color: T.color.PrimaryText, fontStyle: 'italic' }}>"{r.quote}"</div>
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}

// Section — label + optional sub-caption + children
function Section({ label, sub, children }) {
  return (
    <div style={{ marginTop: 22 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ fontFamily: T.font.UI, fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: T.color.SupportingText }}>{label}</div>
        {sub && <div style={{ fontFamily: T.font.UI, fontSize: 11, color: T.color.SubtleText, fontStyle: 'italic' }}>{sub}</div>}
      </div>
      {children}
    </div>
  );
}
const readingP = { fontFamily: T.font.Reading, fontSize: 15, lineHeight: '24px', color: T.color.PrimaryText, margin: 0 };

// ─── ENRICHED PROJECT DETAIL ────────────────────────────────────────
// Replaces the old ProjectDetailProto. Adds goal-link chip, Intention,
// Impact, and a tight one-line Status. Also a proper X close button in
// the hero.
function ProjectDetailV2({ p, adds, onBack, onAddProjectTodo, onToggleProjectTodo, onOpenGoal }) {
  const extras = PROJECT_EXTRAS[p.id] || { goalId: null, intention: null, impact: null, status: null };
  const goal = extras.goalId && GOAL_DATA.find(g => g.id === extras.goalId);
  const addedTodos = (adds && adds.projectTodos && adds.projectTodos[p.id]) || [];

  // Derive a tight status — use the extras.status if present, otherwise fall back to first status-y paragraph from markdown.
  const statusText = extras.status
    || (p.markdown && p.markdown.find(b => b.kind === 'p' && /^(lease|draft|status|held)/i.test(b.text))?.text)
    || p.blurb;

  return (
    <div style={{ height: '100%', background: T.color.PrimarySurface, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Cover */}
      <div style={{ position: 'relative', padding: '14px 18px 20px', background: p.tint, overflow: 'hidden', flexShrink: 0 }}>
        <div className="intently-grain" style={{ opacity: 0.25 }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <button onClick={onBack} aria-label="Back" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontFamily: T.font.UI, fontSize: 12, fontWeight: 600, color: T.color.TintMoss,
            background: 'rgba(251,246,234,0.55)', border: 'none', borderRadius: 999,
            padding: '6px 12px 6px 8px', cursor: 'pointer',
          }}>
            <Icon.ArrowLeft size={14} color={T.color.TintMoss} />
            Back
          </button>
          <button onClick={onBack} aria-label="Close" style={{
            width: 32, height: 32, borderRadius: 999, background: 'rgba(251,246,234,0.55)',
            border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon.X size={16} color={T.color.TintMoss} />
          </button>
        </div>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', gap: 12, marginTop: 18 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: T.font.UI, fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: T.color.TintMoss, opacity: 0.8 }}>Project</div>
            <div style={{ fontFamily: T.font.Display, fontSize: 26, lineHeight: '30px', fontStyle: 'italic', fontWeight: 500, color: T.color.TintMoss, letterSpacing: -0.4, marginTop: 2 }}>{p.name}</div>
            {goal && (
              <button onClick={() => onOpenGoal && onOpenGoal(goal)} style={{
                marginTop: 10,
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontFamily: T.font.UI, fontSize: 11, fontWeight: 600,
                color: T.color.TintMoss,
                background: 'rgba(43,33,24,0.14)', border: 'none', borderRadius: 999,
                padding: '5px 10px 5px 8px', cursor: 'pointer',
              }}>
                <Icon.Flag size={11} color={T.color.TintMoss} />
                <span style={{ opacity: 0.75, fontWeight: 500 }}>under</span>
                <span style={{ fontStyle: 'italic', fontFamily: T.font.Display, fontSize: 13, lineHeight: 1 }}>{goal.title.replace(/\.$/, '')}</span>
              </button>
            )}
          </div>
          <span style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(43,33,24,0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Glyph name={p.glyph} size={26} color={T.color.TintMoss} stroke={1.75} />
          </span>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px 140px' }}>
        {extras.intention && (
          <Section label="Intention" sub="what this was when you started">
            <p style={readingP}>{extras.intention}</p>
          </Section>
        )}

        {extras.impact && (
          <Section label="Impact" sub="why it earns your time">
            <p style={readingP}>{extras.impact}</p>
          </Section>
        )}

        {statusText && (
          <Section label="Status" sub="where we're at now">
            <div style={{
              padding: '12px 14px', borderRadius: 10,
              background: T.color.SecondarySurface,
              border: `1px solid ${T.color.EdgeLine}`,
              fontFamily: T.font.Reading, fontSize: 14, lineHeight: '22px', color: T.color.PrimaryText,
            }}>{statusText}</div>
          </Section>
        )}

        {/* Tracker */}
        <Section label="Tracker">
          <div style={{ background: T.color.SecondarySurface, border: `1px solid ${T.color.EdgeLine}`, borderRadius: 12, overflow: 'hidden' }}>
            {p.tracker.map((r, i) => {
              const dot = { done: T.color.TintSageDeep, doing: T.color.TintDusk, todo: T.color.SubtleText }[r.status];
              return (
                <div key={i} style={{
                  display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'center',
                  padding: '12px 14px',
                  borderBottom: `1px solid ${T.color.EdgeLine}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <span style={{ width: 7, height: 7, borderRadius: 999, background: dot, flexShrink: 0 }} />
                    <span style={{ fontFamily: T.font.Reading, fontSize: 14, lineHeight: '18px', color: T.color.PrimaryText, textDecoration: r.status === 'done' ? 'line-through' : 'none', opacity: r.status === 'done' ? 0.6 : 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.t}</span>
                  </div>
                  <span style={{ fontFamily: T.font.Mono, fontSize: 11, color: T.color.SupportingText, flexShrink: 0 }}>{r.by}</span>
                </div>
              );
            })}
            {addedTodos.map((t) => (
              <div key={t.id} style={{
                display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'center',
                padding: '12px 14px', borderBottom: `1px solid ${T.color.EdgeLine}`,
                background: T.color.FocusObject + '08',
              }}>
                <button onClick={() => onToggleProjectTodo && onToggleProjectTodo(p.id, t.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 10, minWidth: 0,
                  background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0,
                }}>
                  <span style={{
                    width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                    background: t.done ? T.color.TintSage : 'transparent',
                    border: `1.5px solid ${t.done ? T.color.TintSageDeep : T.color.SubtleText}`,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {t.done && <Icon.Check size={10} color={T.color.TintMoss} stroke={2.5} />}
                  </span>
                  <span style={{
                    fontFamily: T.font.Reading, fontSize: 14, lineHeight: '18px',
                    color: T.color.PrimaryText, textDecoration: t.done ? 'line-through' : 'none',
                    opacity: t.done ? 0.5 : 1,
                  }}>{t.text}</span>
                </button>
                <span style={{ fontFamily: T.font.Mono, fontSize: 10, color: T.color.FocusObject, flexShrink: 0 }}>added</span>
              </div>
            ))}
            <div style={{ padding: 10 }}>
              <AddZone
                addLabel="Add a todo to this project"
                placeholder="e.g. email Jordan about the intro"
                helper="Saves to this project · no AI"
                compact
                onCommit={(v) => onAddProjectTodo && onAddProjectTodo(p.id, v)}
              />
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}

// ─── BRIEF FLOW ─────────────────────────────────────────────────────
// Guided conversation: agent asks → user answers → agent asks → ... → confirm
// This is intentionally distinct from free-form chat (hero 'chat' state).
// On accept, calls onComplete with the plan — the Present screen then animates
// the plan populating band-by-band.
const BRIEF_SCRIPT = [
  {
    agent: "Morning, Sam.",
    agentSub: "Yesterday you shipped the slide and walked after dinner. Today is Thursday, week 17 — three things on your weekly board still.",
    typing: 1800,
  },
  {
    agent: "What's alive for you today? Tell me in a sentence.",
    input: { placeholder: "e.g. the pitch dry-run, and the job-hunt pitch for myself" },
    userDefault: "The pitch dry-run with M, the job-hunt pitch draft, and I owe Jordan a reply.",
    typing: 1200,
  },
  {
    agent: "Good. Anything you're carrying that you want to park?",
    input: { placeholder: "Things you'll consciously not do today" },
    userDefault: "Not opening email before 10. Not rewriting the landing page copy again.",
    typing: 1200,
  },
  {
    agent: "Got it. Here's the shape of your day — check it, tweak it, accept.",
    typing: 1400,
    confirm: true,
  },
];

function BriefFlow({ onClose, onComplete }) {
  const [step, setStep] = React.useState(0);
  const [messages, setMessages] = React.useState([]);
  const [agentTyping, setAgentTyping] = React.useState(true);
  const [draft, setDraft] = React.useState('');
  const [liveBrief, setLiveBrief] = React.useState(null);   // live ma-proxy daily-brief response
  const [briefError, setBriefError] = React.useState(null); // set if the live call fails (demo still proceeds)
  const [briefLoading, setBriefLoading] = React.useState(false);
  const scrollRef = React.useRef(null);

  // Drive the script — when step changes, post agent turn, reveal input/confirm.
  // Steps that have neither `input` nor `confirm` are passive bubbles (e.g. the
  // opening greeting) and auto-advance after a short reading pause so the user
  // is never stuck without an affordance.
  React.useEffect(() => {
    const s = BRIEF_SCRIPT[step];
    if (!s) return;
    setAgentTyping(true);
    const typingTimer = setTimeout(() => {
      setMessages(m => [...m, { role: 'agent', text: s.agent, sub: s.agentSub }]);
      setAgentTyping(false);
    }, s.typing);
    let advanceTimer;
    if (!s.input && !s.confirm) {
      advanceTimer = setTimeout(() => setStep(step + 1), s.typing + 1400);
    }
    return () => {
      clearTimeout(typingTimer);
      if (advanceTimer) clearTimeout(advanceTimer);
    };
  }, [step]);

  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, agentTyping, liveBrief, briefError, briefLoading]);

  // When we reach the confirm step, fire the live daily-brief call in parallel
  // with the agent's typing animation. Use the user's actual answers as input.
  // Falls back gracefully if window.callMaProxy isn't loaded or the call fails —
  // the demo still proceeds with the scripted confirm card.
  React.useEffect(() => {
    const s = BRIEF_SCRIPT[step];
    if (!s || !s.confirm) return;
    if (!window.callMaProxy) return;
    if (liveBrief || briefError || briefLoading) return;

    const userAnswers = messages
      .filter(m => m.role === 'user')
      .map(m => m.text);
    const input = [
      "It's morning. The user just had this conversation:",
      ...userAnswers.map((a, i) => `Answer ${i + 1}: ${a}`),
      '',
      'Generate a personal daily brief in plain prose (no markdown headers, no bullets — just sentences). Open with a felt-sense observation about what they said. Name one thing that\'s actually at stake. End with a single grounding action they can take in the next hour. Keep it under 3 short paragraphs. Speak directly to them ("you"), not about them.',
    ].join('\n');

    setBriefLoading(true);
    window.callMaProxy({ skill: 'daily-brief', input })
      .then(r => {
        setLiveBrief((r && r.finalText) || '');
        setBriefLoading(false);
      })
      .catch(e => {
        setBriefError((e && e.message) || 'brief call failed');
        setBriefLoading(false);
      });
  }, [step, messages, liveBrief, briefError, briefLoading]);

  const s = BRIEF_SCRIPT[step];
  const showInput = s && s.input && !agentTyping;
  // Hold the confirm card until the live brief lands (or errors out) — the
  // agent's actual response is the headline beat; the card summarizes it.
  const liveBriefReady = liveBrief !== null || briefError !== null;
  const showConfirm = s && s.confirm && !agentTyping && liveBriefReady;
  const showBriefThinking = s && s.confirm && !agentTyping && briefLoading;

  const submit = (text) => {
    const t = (text && text.trim()) || (s.userDefault || '');
    if (!t) return;
    setMessages(m => [...m, { role: 'user', text: t }]);
    setDraft('');
    setTimeout(() => setStep(step + 1), 260);
  };

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 60,
      background: `linear-gradient(180deg, ${T.color.PrimarySurface} 0%, #F5EBD6 60%, #F0D9B5 100%)`,
      display: 'flex', flexDirection: 'column',
      }}>
      {/* Header */}
      <div style={{ flexShrink: 0, padding: '14px 18px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <Icon.Sun size={14} color={T.color.FocusObject} />
          <span style={{ fontFamily: T.font.UI, fontSize: 11, fontWeight: 700, letterSpacing: 1.4, textTransform: 'uppercase', color: T.color.FocusObject }}>Daily brief</span>
        </div>
        <button onClick={onClose} aria-label="Close" style={{
          width: 32, height: 32, borderRadius: 999, background: 'rgba(31,27,21,0.06)',
          border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon.X size={16} color={T.color.PrimaryText} />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '8px 20px 20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {messages.map((m, i) => (
            <ChatBubble key={i} role={m.role} text={m.text} sub={m.sub} />
          ))}
          {agentTyping && <AgentTyping />}
          {/* Live daily-brief from ma-proxy — appears before the confirm card */}
          {showBriefThinking && <AgentTyping />}
          {liveBrief && <ChatBubble role="agent" text={liveBrief} />}
          {briefError && <ChatBubble role="agent" text="(I couldn't reach the brief generator just now — here's your day shape anyway.)" />}
          {showConfirm && <BriefConfirmCard onAccept={() => onComplete && onComplete(MOCK_PLAN)} />}
        </div>
      </div>

      {/* Input area */}
      {showInput && (
        <div style={{ flexShrink: 0, padding: '10px 16px 20px', background: 'rgba(251,246,234,0.82)', backdropFilter: 'blur(12px)', borderTop: `1px solid ${T.color.EdgeLine}` }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: T.color.PrimarySurface, border: `1px solid ${T.color.EdgeLine}`,
            borderRadius: 999, padding: '8px 8px 8px 16px',
          }}>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit(draft || s.userDefault)}
              placeholder={s.input.placeholder}
              style={{
                flex: 1, border: 'none', outline: 'none', background: 'transparent',
                fontFamily: T.font.Reading, fontSize: 14, color: T.color.PrimaryText,
              }}
            />
            <button onClick={() => submit(draft || s.userDefault)} aria-label="Send" style={{
              width: 34, height: 34, borderRadius: 999,
              background: T.color.FocusObject, color: '#FBF6EA', border: 'none',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
              </svg>
            </button>
          </div>
          {s.userDefault && !draft && (
            <div style={{ marginTop: 6, fontFamily: T.font.UI, fontSize: 11, color: T.color.SubtleText, textAlign: 'center', fontStyle: 'italic' }}>
              tap send to use the suggested answer
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ChatBubble({ role, text, sub }) {
  const isUser = role === 'user';
  return (
    <div style={{
      display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start',
      }}>
      <div style={{
        maxWidth: '82%',
        padding: '10px 14px',
        borderRadius: isUser ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
        background: isUser ? T.color.FocusObject : 'rgba(251,246,234,0.9)',
        color: isUser ? '#FBF6EA' : T.color.PrimaryText,
        border: isUser ? 'none' : `1px solid ${T.color.EdgeLine}`,
        fontFamily: T.font.Reading, fontSize: 15, lineHeight: '22px',
        boxShadow: isUser ? '0 4px 14px rgba(198,107,63,0.28)' : '0 2px 8px rgba(31,27,21,0.05)',
      }}>
        <div>{text}</div>
        {sub && (
          <div style={{
            marginTop: 6,
            fontFamily: T.font.Reading, fontSize: 13, lineHeight: '19px',
            color: isUser ? 'rgba(251,246,234,0.82)' : T.color.SupportingText,
            fontStyle: 'italic',
          }}>{sub}</div>
        )}
      </div>
    </div>
  );
}

function AgentTyping() {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start', }}>
      <div style={{
        padding: '12px 16px', borderRadius: '4px 18px 18px 18px',
        background: 'rgba(251,246,234,0.9)', border: `1px solid ${T.color.EdgeLine}`,
        display: 'inline-flex', gap: 5, alignItems: 'center',
      }}>
        {[0, 1, 2].map(i => (
          <span key={i} style={{
            width: 6, height: 6, borderRadius: 999, background: T.color.SubtleText,
            animation: `intentlyPulse 1.4s ${i * 0.15}s infinite ease-in-out`,
          }} />
        ))}
      </div>
    </div>
  );
}

const MOCK_PLAN = {
  pacing: {
    title: 'Hold your ground on the pitch.',
    body: "You're running from Anya's pushback by over-polishing. Dry-run with M, ship the deck, then write the job pitch. In that order.",
  },
  flags: [
    { k: 'anchor', t: 'Dry-run the pitch deck with M at 3pm — don\'t reschedule again.' },
    { k: 'loose',  t: 'Jordan\'s reply has been open for 6 days. Send something even if imperfect.' },
  ],
  bands: [
    { when: 'Morning', items: [
      { g: 'pen', t: 'Write the v2 pitch for myself — 45 min, no edits.' },
      { g: 'keyboard', t: 'Reply to Jordan — short, honest.' },
    ]},
    { when: 'Afternoon', items: [
      { g: 'rocket', t: '3:00 PM — Pitch dry-run with M. Walk in present.' },
      { g: 'book', t: 'Read one of the three companies deeply.' },
    ]},
    { when: 'Evening', items: [
      { g: 'heart', t: 'Movement — light, not a workout.' },
      { g: 'sparkles', t: 'Not opening email before 10. Not rewriting landing copy again.' },
    ]},
  ],
  parked: [
    'Essay on attention (drawer until May)',
    'Instagram research rabbit hole',
  ],
};

function BriefConfirmCard({ onAccept }) {
  return (
    <div style={{ marginTop: 4 }}>
      <div style={{
        background: T.color.ConfirmationCardSurface,
        border: `1px solid ${T.color.EdgeLine}`,
        borderRadius: 14, padding: '16px 18px',
        boxShadow: '0 6px 20px rgba(31,27,21,0.08)',
      }}>
        <div style={{ fontFamily: T.font.UI, fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: T.color.SupportingText, marginBottom: 6 }}>I'll draft your day as</div>
        <div style={{ fontFamily: T.font.Display, fontSize: 22, lineHeight: '26px', fontStyle: 'italic', fontWeight: 500, color: T.color.PrimaryText, letterSpacing: -0.3, marginBottom: 12 }}>"{MOCK_PLAN.pacing.title}"</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
          {MOCK_PLAN.bands.map((b, i) => (
            <div key={i} style={{ fontFamily: T.font.Reading, fontSize: 13, lineHeight: '19px', color: T.color.SupportingText }}>
              <span style={{ fontFamily: T.font.UI, fontSize: 10, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', color: T.color.PrimaryText, marginRight: 8 }}>{b.when}</span>
              {b.items.length} items
            </div>
          ))}
        </div>
        <button onClick={onAccept} style={{
          width: '100%', padding: '12px 18px',
          background: T.color.PrimaryText, color: '#FBF6EA',
          border: 'none', borderRadius: 999, cursor: 'pointer',
          fontFamily: T.font.UI, fontSize: 14, fontWeight: 600, letterSpacing: 0.2,
        }}>
          Accept &amp; populate my day
        </button>
        <div style={{ marginTop: 8, fontFamily: T.font.UI, fontSize: 11, color: T.color.SubtleText, textAlign: 'center', fontStyle: 'italic' }}>
          or keep talking to tweak it
        </div>
      </div>
    </div>
  );
}

// ─── REVIEW FLOW ────────────────────────────────────────────────────
// Evening review. Agent auto-checks things it can infer done (with a check-in
// animation), asks 3 guided questions (highlight, friction, tomorrow seed),
// produces a journal + tomorrow's priorities, user accepts.

const REVIEW_SCRIPT = [
  {
    agent: "Let's close the day out.",
    agentSub: "I'll mark what I heard you do — protest anything I got wrong.",
    typing: 1200,
    autoCheck: true, // triggers the check animation for inferred-done items
  },
  {
    agent: "What's the one thing from today you want to remember?",
    input: { placeholder: "Say the thing." },
    userDefault: "The dry run actually went well. I walked in present. Anya will be fine.",
    typing: 1400,
  },
  {
    agent: "And the friction — what tripped you up?",
    input: { placeholder: "No need to be tidy about it." },
    userDefault: "I over-polished the data slide. Again. That's twice now.",
    typing: 1300,
  },
  {
    agent: "Okay. One thing to carry into tomorrow?",
    input: { placeholder: "Something light — a direction, not a to-do." },
    userDefault: "Write the job pitch before I open Slack.",
    typing: 1200,
  },
  {
    agent: "Good work today. Here's what I'll save.",
    typing: 1400,
    confirm: true,
  },
];

// Items the agent infers done from today's log + journal + manual checks.
const AUTO_CHECK_ITEMS = [
  'Hackathon build — light touch. One trial run for the demo.',
  '11:00 AM CST — AMA with Thariq (Anthropic). Show up. Ask one question.',
  '2:00 PM CST — WIP AI Weekly demo. Walk in present.',
  'Movement — light, not a workout.',
];

function ReviewFlow({ onClose, onComplete }) {
  const [step, setStep] = React.useState(0);
  const [messages, setMessages] = React.useState([]);
  const [agentTyping, setAgentTyping] = React.useState(true);
  const [draft, setDraft] = React.useState('');
  const [checkedIndex, setCheckedIndex] = React.useState(-1); // how many auto-check items have been "checked"
  const [liveReview, setLiveReview] = React.useState(null);   // live ma-proxy daily-review response
  const [reviewError, setReviewError] = React.useState(null); // set if the live call fails (demo still proceeds)
  const [reviewLoading, setReviewLoading] = React.useState(false);
  const scrollRef = React.useRef(null);

  React.useEffect(() => {
    const s = REVIEW_SCRIPT[step];
    if (!s) return;
    setAgentTyping(true);
    const t = setTimeout(() => {
      setMessages(m => [...m, { role: 'agent', text: s.agent, sub: s.agentSub }]);
      setAgentTyping(false);
      if (s.autoCheck) {
        setMessages(m => [...m, { role: 'checklist', items: AUTO_CHECK_ITEMS }]);
      }
    }, s.typing);
    return () => clearTimeout(t);
  }, [step]);

  // Drive the checklist animation after it appears — stagger check-ins
  React.useEffect(() => {
    const hasChecklist = messages.some(m => m.role === 'checklist');
    if (!hasChecklist || checkedIndex >= AUTO_CHECK_ITEMS.length - 1) return;
    const t = setTimeout(() => setCheckedIndex(i => i + 1), checkedIndex < 0 ? 500 : 420);
    return () => clearTimeout(t);
  }, [messages, checkedIndex]);

  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, agentTyping, checkedIndex, liveReview, reviewError, reviewLoading]);

  const s = REVIEW_SCRIPT[step];
  // For step 0 (autoCheck), auto-advance after the checklist animates in fully
  React.useEffect(() => {
    if (s && s.autoCheck && checkedIndex === AUTO_CHECK_ITEMS.length - 1) {
      const t = setTimeout(() => setStep(step + 1), 900);
      return () => clearTimeout(t);
    }
  }, [checkedIndex, s, step]);

  // When we reach the confirm step, fire the live daily-review call in parallel
  // with the agent's typing animation. Mirrors BriefFlow's pattern (slice 3).
  // Falls back gracefully if window.callMaProxy isn't loaded or the call fails.
  React.useEffect(() => {
    if (!s || !s.confirm) return;
    if (!window.callMaProxy) return;
    if (liveReview || reviewError || reviewLoading) return;

    const userAnswers = messages
      .filter(m => m.role === 'user')
      .map(m => m.text);
    const input = [
      "It's evening. The user just had this end-of-day reflection:",
      ...userAnswers.map((a, i) => `Answer ${i + 1}: ${a}`),
      '',
      "Auto-checked items the agent inferred done from today's logs:",
      ...AUTO_CHECK_ITEMS.map(it => `- ${it}`),
      '',
      'Generate a short evening review in plain prose (no markdown headers, no bullets — just sentences). Acknowledge what they got right today, reflect briefly on the friction without lecturing, and plant a single seed for tomorrow that connects to what they said. Keep it under 3 short paragraphs. Speak directly to them ("you"), not about them. Tone: warm, plainspoken, end-of-day.',
    ].join('\n');

    setReviewLoading(true);
    window.callMaProxy({ skill: 'daily-review', input })
      .then(r => {
        setLiveReview((r && r.finalText) || '');
        setReviewLoading(false);
      })
      .catch(e => {
        setReviewError((e && e.message) || 'review call failed');
        setReviewLoading(false);
      });
  }, [s, messages, liveReview, reviewError, reviewLoading]);

  const showInput = s && s.input && !agentTyping;
  // Hold the confirm card until the live review lands (or errors out).
  const liveReviewReady = liveReview !== null || reviewError !== null;
  const showConfirm = s && s.confirm && !agentTyping && liveReviewReady;
  const showReviewThinking = s && s.confirm && !agentTyping && reviewLoading;

  const submit = (text) => {
    const t = (text && text.trim()) || (s.userDefault || '');
    if (!t) return;
    setMessages(m => [...m, { role: 'user', text: t }]);
    setDraft('');
    setTimeout(() => setStep(step + 1), 260);
  };

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 60,
      background: `linear-gradient(180deg, #1F1B35 0%, #2E274A 50%, #46386A 100%)`,
      display: 'flex', flexDirection: 'column',
      color: '#FBF6EA',
    }}>
      {/* Header */}
      <div style={{ flexShrink: 0, padding: '14px 18px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <Icon.Moon size={14} color="#E6DFF5" />
          <span style={{ fontFamily: T.font.UI, fontSize: 11, fontWeight: 700, letterSpacing: 1.4, textTransform: 'uppercase', color: '#E6DFF5' }}>Daily review</span>
        </div>
        <button onClick={onClose} aria-label="Close" style={{
          width: 32, height: 32, borderRadius: 999, background: 'rgba(251,246,234,0.1)',
          border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon.X size={16} color="#FBF6EA" />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '8px 20px 20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {messages.map((m, i) => {
            if (m.role === 'checklist') {
              return <AutoCheckList key={i} items={m.items} checkedIndex={checkedIndex} />;
            }
            return <ChatBubbleDark key={i} role={m.role} text={m.text} sub={m.sub} />;
          })}
          {agentTyping && <AgentTypingDark />}
          {/* Live daily-review from ma-proxy — appears before the confirm card */}
          {showReviewThinking && <AgentTypingDark />}
          {liveReview && <ChatBubbleDark role="agent" text={liveReview} />}
          {reviewError && <ChatBubbleDark role="agent" text="(I couldn't reach the review generator just now — saving what you said anyway.)" />}
          {showConfirm && (() => {
            const parsed = liveReview ? (window.parseReviewProse && window.parseReviewProse(liveReview)) : null;
            return <ReviewConfirmCard parsed={parsed} onAccept={() => onComplete && onComplete(parsed)} />;
          })()}
        </div>
      </div>

      {showInput && (
        <div style={{ flexShrink: 0, padding: '10px 16px 20px', background: 'rgba(31,27,53,0.55)', backdropFilter: 'blur(12px)', borderTop: `1px solid rgba(251,246,234,0.12)` }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'rgba(251,246,234,0.08)', border: `1px solid rgba(251,246,234,0.16)`,
            borderRadius: 999, padding: '8px 8px 8px 16px',
          }}>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit(draft || s.userDefault)}
              placeholder={s.input.placeholder}
              style={{
                flex: 1, border: 'none', outline: 'none', background: 'transparent',
                fontFamily: T.font.Reading, fontSize: 14, color: '#FBF6EA',
              }}
            />
            <button onClick={() => submit(draft || s.userDefault)} aria-label="Send" style={{
              width: 34, height: 34, borderRadius: 999,
              background: '#E6DFF5', color: '#2A2348', border: 'none',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
              </svg>
            </button>
          </div>
          {s.userDefault && !draft && (
            <div style={{ marginTop: 6, fontFamily: T.font.UI, fontSize: 11, color: 'rgba(251,246,234,0.5)', textAlign: 'center', fontStyle: 'italic' }}>
              tap send to use the suggested answer
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ChatBubbleDark({ role, text, sub }) {
  const isUser = role === 'user';
  return (
    <div style={{
      display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start',
      }}>
      <div style={{
        maxWidth: '82%',
        padding: '10px 14px',
        borderRadius: isUser ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
        background: isUser ? '#E6DFF5' : 'rgba(251,246,234,0.08)',
        color: isUser ? '#2A2348' : '#FBF6EA',
        border: isUser ? 'none' : `1px solid rgba(251,246,234,0.14)`,
        fontFamily: T.font.Reading, fontSize: 15, lineHeight: '22px',
      }}>
        <div>{text}</div>
        {sub && (
          <div style={{
            marginTop: 6,
            fontFamily: T.font.Reading, fontSize: 13, lineHeight: '19px',
            color: isUser ? 'rgba(42,35,72,0.7)' : 'rgba(251,246,234,0.65)',
            fontStyle: 'italic',
          }}>{sub}</div>
        )}
      </div>
    </div>
  );
}

function AgentTypingDark() {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start', }}>
      <div style={{
        padding: '12px 16px', borderRadius: '4px 18px 18px 18px',
        background: 'rgba(251,246,234,0.08)', border: `1px solid rgba(251,246,234,0.14)`,
        display: 'inline-flex', gap: 5, alignItems: 'center',
      }}>
        {[0, 1, 2].map(i => (
          <span key={i} style={{
            width: 6, height: 6, borderRadius: 999, background: 'rgba(251,246,234,0.55)',
            animation: `intentlyPulse 1.4s ${i * 0.15}s infinite ease-in-out`,
          }} />
        ))}
      </div>
    </div>
  );
}

function AutoCheckList({ items, checkedIndex }) {
  return (
    <div style={{
      padding: '12px 14px',
      background: 'rgba(251,246,234,0.06)',
      border: `1px solid rgba(251,246,234,0.14)`,
      borderRadius: 14,
      }}>
      <div style={{ fontFamily: T.font.UI, fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(251,246,234,0.65)', marginBottom: 10 }}>What I saw you do</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((it, i) => {
          const checked = i <= checkedIndex;
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              opacity: checked ? 1 : 0.4,
              transition: 'opacity 320ms ease',
            }}>
              <span style={{
                width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                background: checked ? '#B8D0BE' : 'transparent',
                border: `1.5px solid ${checked ? '#B8D0BE' : 'rgba(251,246,234,0.4)'}`,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 300ms ease, border-color 300ms ease',
                transform: i === checkedIndex ? 'scale(1.15)' : 'scale(1)',
                boxShadow: i === checkedIndex ? '0 0 0 6px rgba(184,208,190,0.22)' : 'none',
              }}>
                {checked && <Icon.Check size={12} color="#2A2348" stroke={2.8} />}
              </span>
              <span style={{
                flex: 1, fontFamily: T.font.Reading, fontSize: 14, lineHeight: '20px',
                color: '#FBF6EA',
                textDecoration: checked ? 'line-through' : 'none',
                textDecorationColor: 'rgba(251,246,234,0.5)',
              }}>{it}</span>
            </div>
          );
        })}
      </div>
      {checkedIndex >= items.length - 1 && (
        <div style={{ marginTop: 10, fontFamily: T.font.UI, fontSize: 11, color: 'rgba(251,246,234,0.55)', fontStyle: 'italic' }}>
          Got these right? Otherwise just say "wait —"
        </div>
      )}
    </div>
  );
}

function ReviewConfirmCard({ parsed, onAccept }) {
  const journal  = (parsed && parsed.journal)  || 'The dry run actually went well. I walked in present.';
  const friction = (parsed && parsed.friction) || 'Over-polishing the data slide — twice this week.';
  const tomorrow = (parsed && parsed.tomorrow) || 'Write the job pitch before opening Slack.';
  return (
    <div style={{ marginTop: 4 }}>
      <div style={{
        background: 'rgba(251,246,234,0.08)',
        border: `1px solid rgba(251,246,234,0.18)`,
        borderRadius: 14, padding: '16px 18px',
        color: '#FBF6EA',
      }}>
        <div style={{ fontFamily: T.font.UI, fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(251,246,234,0.65)', marginBottom: 8 }}>I'll save this</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
          <div>
            <div style={{ fontFamily: T.font.UI, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(251,246,234,0.55)', marginBottom: 2 }}>Journal · today</div>
            <div style={{ fontFamily: T.font.Display, fontSize: 17, lineHeight: '23px', fontStyle: 'italic', color: '#FBF6EA', letterSpacing: -0.2 }}>
              {parsed ? journal : `"${journal}"`}
            </div>
          </div>
          <div>
            <div style={{ fontFamily: T.font.UI, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(251,246,234,0.55)', marginBottom: 2 }}>Friction</div>
            <div style={{ fontFamily: T.font.Reading, fontSize: 14, lineHeight: '20px', color: '#FBF6EA', opacity: 0.85 }}>
              {friction}
            </div>
          </div>
        </div>

        {/* Tomorrow — its own visual chip, the most important thing */}
        <div style={{
          background: 'rgba(245,235,207,0.12)',
          border: `1px solid rgba(245,235,207,0.28)`,
          borderRadius: 12,
          padding: '14px 14px 12px',
          marginBottom: 14,
          position: 'relative',
        }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontFamily: T.font.UI, fontSize: 10, fontWeight: 700, letterSpacing: 1.2,
            textTransform: 'uppercase', color: '#F5EBCF',
            marginBottom: 8,
          }}>
            <Icon.Sun size={12} color="#F5EBCF" />
            Carrying into tomorrow
          </div>
          <div style={{
            fontFamily: T.font.Display, fontSize: 17, lineHeight: '23px',
            fontStyle: 'italic', color: '#FBF6EA', letterSpacing: -0.2,
            marginBottom: 12,
          }}>
            {parsed ? tomorrow : `"${tomorrow}"`}
          </div>
          <div style={{ height: 1, background: 'rgba(245,235,207,0.16)', marginBottom: 10 }} />
          <div style={{
            fontFamily: T.font.UI, fontSize: 10, letterSpacing: 1,
            textTransform: 'uppercase', color: 'rgba(245,235,207,0.55)',
            marginBottom: 6,
          }}>What's on the calendar</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[
              { t: '9:30 AM', body: 'Anya — pitch follow-up' },
              { t: '12:00 PM', body: 'Lunch w/ Jordan (finally)' },
              { t: '4:00 PM', body: 'Hackathon retro' },
            ].map((e, i) => (
              <div key={i} style={{
                display: 'flex', gap: 10, alignItems: 'baseline',
                fontFamily: T.font.Reading, fontSize: 13, lineHeight: '18px',
                color: 'rgba(251,246,234,0.86)',
              }}>
                <span style={{ fontFamily: T.font.Mono, fontSize: 10, color: 'rgba(245,235,207,0.7)', minWidth: 56 }}>{e.t}</span>
                <span>{e.body}</span>
              </div>
            ))}
          </div>
        </div>
        <button onClick={onAccept} style={{
          width: '100%', padding: '12px 18px',
          background: '#E6DFF5', color: '#2A2348',
          border: 'none', borderRadius: 999, cursor: 'pointer',
          fontFamily: T.font.UI, fontSize: 14, fontWeight: 600, letterSpacing: 0.2,
        }}>
          Accept &amp; close the day
        </button>
      </div>
    </div>
  );
}

// ─── ANIMATED PLAN POPULATE ─────────────────────────────────────────
// After brief-accept, the planned-phase Present screen fades items in
// band-by-band. We expose a `populateIndex` state that maxes out at bands*items.
function usePopulate(bands, delayStart = 200, perItem = 90) {
  const [i, setI] = React.useState(0);
  const total = bands.reduce((acc, b) => acc + b.items.length, 0);
  React.useEffect(() => {
    if (i >= total) return;
    const t = setTimeout(() => setI(i + 1), i === 0 ? delayStart : perItem);
    return () => clearTimeout(t);
  }, [i, total]);
  return i;
}

// ─── EMPTY-PRESENT (pre-brief, start of day) ────────────────────────
function PresentEmpty({ onStartBrief }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      {/* Lock-screen-style ambient image — centered painterly dawn,
          partly transparent so it doesn't crowd the type or CTA. */}
      <div aria-hidden="true" style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 0,
      }}>
        <div style={{
          width: '100%', height: '62%',
          maskImage: 'radial-gradient(ellipse 65% 70% at 50% 50%, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 78%)',
          WebkitMaskImage: 'radial-gradient(ellipse 65% 70% at 50% 50%, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 78%)',
          opacity: 0.42,
        }}>
          <MorningLight style={{ width: '100%', height: '100%' }} />
        </div>
      </div>

      <div style={{ position: 'relative', zIndex: 1, padding: '14px 24px 10px' }}>
        <div style={{
          fontFamily: T.font.UI, fontSize: 11, fontWeight: 700, letterSpacing: 1.4,
          textTransform: 'uppercase', color: T.color.SupportingText, marginBottom: 4,
          display: 'inline-flex', alignItems: 'center', gap: 6,
        }}>
          <Icon.Sun size={12} color={T.color.SupportingText} />
          Thursday · Apr 23
        </div>
        <div style={{
          fontFamily: T.font.Display, fontSize: 32, fontWeight: 500, lineHeight: '38px',
          color: T.color.PrimaryText, letterSpacing: -0.6, fontStyle: 'italic',
        }}>Good morning, Sam.</div>
      </div>

      <div style={{ position: 'relative', zIndex: 1, flex: 1, overflowY: 'auto', padding: '20px 24px 240px', display: 'flex', flexDirection: 'column', gap: 28 }}>
        {/* Yesterday's one-line */}
        <div>
          <div style={{ fontFamily: T.font.UI, fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: T.color.SupportingText, marginBottom: 8 }}>Yesterday</div>
          <div style={{
            padding: '14px 16px', borderRadius: 12,
            background: T.color.TintLilac + '2a',
            borderLeft: `3px solid ${T.color.TintLilac}`,
            fontFamily: T.font.Display, fontSize: 17, lineHeight: '24px',
            fontStyle: 'italic', color: T.color.PrimaryText, letterSpacing: -0.2,
          }}>"Shipped the slide. Walked after dinner."</div>
        </div>

        {/* Empty-plan whisper */}
        <div style={{ textAlign: 'center', padding: '30px 20px' }}>
          <div style={{
            fontFamily: T.font.Display, fontSize: 22, lineHeight: '30px',
            fontStyle: 'italic', color: T.color.SubtleText, letterSpacing: -0.2,
            textWrap: 'pretty',
          }}>Today hasn't been drafted yet.</div>
          <div style={{
            marginTop: 8, fontFamily: T.font.Reading, fontSize: 14, lineHeight: '21px',
            color: T.color.SupportingText, maxWidth: 280, margin: '8px auto 0',
          }}>Start the brief — I'll ask you three things, then lay out your day.</div>
        </div>

        <div style={{ flex: 1 }} />
      </div>

      {/* Big CTA */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 180, display: 'flex', justifyContent: 'center', pointerEvents: 'none', zIndex: 2 }}>
        <button onClick={onStartBrief} style={{
          pointerEvents: 'auto',
          display: 'inline-flex', alignItems: 'center', gap: 10, padding: '18px 32px',
          background: 'linear-gradient(135deg, #C66B3F 0%, #E8A25E 55%, #F1DE8A 100%)',
          color: '#FBF6EA',
          border: 'none', borderRadius: 999, cursor: 'pointer',
          fontFamily: T.font.UI, fontSize: 16, fontWeight: 600, letterSpacing: 0.2,
          boxShadow: '0 10px 28px rgba(198,107,63,0.42), inset 0 1px 0 rgba(255,255,255,0.28)',
        }}>
          <Icon.Sun size={18} color="#FBF6EA" />
          Start your daily brief
        </button>
      </div>
    </div>
  );
}

// ─── END-OF-DAY (post-review) — simple closed-state ─────────────────
function PresentClosed({ onReopenReview, review }) {
  const oneLine  = (review && review.journal)  || 'The dry run actually went well. I walked in present.';
  const tomorrow = (review && review.tomorrow) || 'Write the job pitch before opening Slack.';
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      <div style={{ padding: '14px 24px 10px' }}>
        <div style={{
          fontFamily: T.font.UI, fontSize: 11, fontWeight: 700, letterSpacing: 1.4,
          textTransform: 'uppercase', color: T.color.SupportingText, marginBottom: 4,
          display: 'inline-flex', alignItems: 'center', gap: 6,
        }}>
          <Icon.Moon size={12} color={T.color.SupportingText} />
          Thursday · Closed
        </div>
        <div style={{
          fontFamily: T.font.Display, fontSize: 40, fontWeight: 500, lineHeight: '44px',
          color: T.color.PrimaryText, letterSpacing: -1, fontStyle: 'italic',
        }}>Day closed.</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px 240px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{
          padding: '16px 18px', borderRadius: 14,
          background: T.color.TintLilac + '2a',
          borderLeft: `3px solid ${T.color.TintLilac}`,
        }}>
          <div style={{ fontFamily: T.font.UI, fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: T.color.SupportingText, marginBottom: 6 }}>Today, in one line</div>
          <div style={{ fontFamily: T.font.Display, fontSize: 22, lineHeight: '29px', fontStyle: 'italic', color: T.color.PrimaryText, letterSpacing: -0.3 }}>"The dry run actually went well. I walked in present."</div>
        </div>
        <div style={{ padding: '14px 16px', borderRadius: 12, background: T.color.SecondarySurface, border: `1px solid ${T.color.EdgeLine}` }}>
          <div style={{ fontFamily: T.font.UI, fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: T.color.SupportingText, marginBottom: 4 }}>For tomorrow</div>
          <div style={{ fontFamily: T.font.Reading, fontSize: 15, lineHeight: '22px', color: T.color.PrimaryText }}>Write the job pitch before opening Slack.</div>
        </div>
        <div style={{ textAlign: 'center', padding: '20px 10px' }}>
          <div style={{ fontFamily: T.font.Reading, fontSize: 14, lineHeight: '20px', color: T.color.SubtleText, fontStyle: 'italic' }}>
            Saved to your journal. Tomorrow's brief is waiting.
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  GOAL_DATA, PROJECT_EXTRAS,
  GoalDetail, ProjectDetailV2,
  BriefFlow, ReviewFlow,
  PresentEmpty, PresentClosed,
  usePopulate, MOCK_PLAN,
});
