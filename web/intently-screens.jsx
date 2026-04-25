// intently-screens.jsx — v2: image-forward, Pinterest/Tomorrow rhythm.

function ScreenHeader({ tense, title, caption }) {
  return (
    <div style={{ padding: '14px 24px 16px' }}>
      <div style={{
        fontFamily: T.font.UI, fontSize: 11, fontWeight: 700, letterSpacing: 1.4,
        textTransform: 'uppercase', color: T.color.SupportingText, marginBottom: 4,
      }}>{tense}</div>
      <div style={{
        fontFamily: T.font.Display, fontSize: 32, fontWeight: 500, lineHeight: '38px',
        color: T.color.PrimaryText, letterSpacing: -0.6, fontStyle: 'italic',
      }}>{title}</div>
      {caption && (
        <div style={{
          fontFamily: T.font.Reading, fontSize: 15, lineHeight: '22px',
          color: T.color.SupportingText, marginTop: 8, maxWidth: 320,
        }}>{caption}</div>
      )}
    </div>
  );
}

function HorizontalRail({ items, renderItem, pad = 24, gap = 14 }) {
  return (
    <div style={{
      display: 'flex', gap, overflowX: 'auto', overflowY: 'hidden',
      paddingTop: 0, paddingBottom: 10,
      paddingLeft: pad, paddingRight: pad,
      scrollSnapType: 'x mandatory', scrollPaddingLeft: pad,
      WebkitOverflowScrolling: 'touch',
    }}>
      {items.map((it, i) => (
        <div key={i} style={{
          scrollSnapAlign: 'start', flex: '0 0 auto',
          marginLeft: i === 0 ? 0 : 0, // explicit: first card relies on container paddingLeft
        }}>
          {renderItem(it, i)}
        </div>
      ))}
    </div>
  );
}

// ─── PAST SCREEN ─── big journal tiles, each with a painterly panel
function PastScreen() {
  const recent = [
    { date: 'Yesterday',   tag: 'Evening review', quote: "Slept through the night for the first time in a week.", mood: 'dusk',   tint: T.color.TintLilac },
    { date: 'Sunday walk', tag: 'Journal',        quote: "I don't want to manage, I want to build.",              mood: 'forest', tint: T.color.TintMint },
    { date: 'Week 17',     tag: 'Weekly review',  quote: "Shipped 2 of 3 goals. Stop saying yes to calls.",       mood: 'rain',   tint: T.color.TintPeachSoft },
  ];
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      <DotGridBackdrop />
      <div style={{ position: 'relative' }}>
        <ScreenHeader tense="Past" title="What happened." caption="Your reviews and journal, in your own voice." />
      </div>
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 140, position: 'relative' }}>
        <HorizontalRail items={recent} renderItem={(it) => (
          <div style={{
            width: 240, height: 300, borderRadius: T.radius.Card, overflow: 'hidden',
            background: it.tint, boxShadow: T.shadow.Raised, position: 'relative',
            display: 'flex', flexDirection: 'column',
          }}>
            <LandscapePanel mood={it.mood} style={{ height: 130, flexShrink: 0 }} />
            <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{
                fontFamily: T.font.UI, fontSize: 10, fontWeight: 700, letterSpacing: 0.8,
                textTransform: 'uppercase', color: T.color.TintMoss, opacity: 0.75,
              }}>{it.tag} · {it.date}</div>
              <div style={{
                fontFamily: T.font.Display, fontSize: 18, lineHeight: '22px', fontStyle: 'italic',
                fontWeight: 500, color: T.color.PrimaryText, marginTop: 6, letterSpacing: -0.2,
              }}>"{it.quote}"</div>
              <div style={{ flex: 1 }} />
              <div style={{
                fontFamily: T.font.UI, fontSize: 12, fontWeight: 700, color: T.color.TintClay,
                display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 8,
              }}>Read <Icon.Chev size={12} color={T.color.TintClay} /></div>
            </div>
          </div>
        )} />

        <div style={{
          fontFamily: T.font.UI, fontSize: 11, fontWeight: 700, letterSpacing: 1.2,
          textTransform: 'uppercase', color: T.color.SupportingText,
          padding: '28px 24px 10px',
        }}>Earlier</div>

        <div style={{ padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { d: 'Apr 18', t: "Finally named what's blocking the hire.", tint: T.color.TintPeachSoft },
            { d: 'Apr 15', t: "First investor call. Didn't stumble on the data slide.", tint: T.color.TintMint },
            { d: 'Apr 12', t: "Quiet morning. Re-read the mission doc.", tint: T.color.TintLilac },
            { d: 'Apr 08', t: "Week 16 review — okay week, not great.", tint: T.color.TintCream },
          ].map((r, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: 12, minHeight: 64,
              background: T.color.SecondarySurface, borderRadius: 16,
              border: `1px solid ${T.color.EdgeLine}`,
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                background: r.tint, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: T.font.UI, fontSize: 11, fontWeight: 700,
                color: T.color.TintMoss, letterSpacing: 0.4,
              }}>{r.d.split(' ')[1]}</div>
              <div style={{
                fontFamily: T.font.Reading, fontSize: 16, lineHeight: '22px',
                color: T.color.PrimaryText, flex: 1,
              }}>{r.t}</div>
              <Icon.Chev size={14} color={T.color.SubtleText} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── PRESENT SCREEN ─── three phases: morning pre-brief · planned · evening.
// NO chat on this screen; chat lives behind the mic (hero affordance).
// Daily log shape lifted from user's actual workflow: Pacing → Flags → time-of-day → Parked.

const PLAN_DATA = {
  pacing: {
    title: 'Demo day — hackathon first, honor WIP commitment.',
    body: "Three intense days stacked. The real discipline today is stopping — not overworking. Hard stop by 10pm is the deliverable tonight.",
  },
  flags: [
    { k: 'urgent',   t: "WIP AI Weekly demo — 2pm CST. Confirm it's on Work Calendar." },
    { k: 'followup', t: 'Dr. Ramesh follow-up — window closes Thursday.' },
    { k: 'parked',   t: 'Civic AI Campaign 1 (May 2) — not this week.' },
  ],
  bands: [
    { when: 'Morning', items: [
      { g: 'target',      t: 'Hackathon build — light touch. One trial run for the demo.' },
      { g: 'message',     t: '11:00 AM CST — AMA with Thariq (Anthropic). Show up. Ask one question.' },
    ]},
    { when: 'Afternoon', items: [
      { g: 'presentation', t: '2:00 PM CST — WIP AI Weekly demo. Walk in present.' },
      { g: 'users',        t: '4:00 PM CST — Office hours (Discord). Drop in if energy allows.' },
      { g: 'target',       t: 'Hackathon build continues in pockets.' },
    ]},
    { when: 'Evening', items: [
      { g: 'footprints', t: 'Movement — light, not a workout.' },
      { g: 'utensils',   t: 'Japanese.' },
      { g: 'moon',       t: '10pm hard stop. No late-night threads.' },
    ]},
  ],
  parked: [
    'No LinkedIn narrative pass.',
    'No Civic AI posts.',
    'No new company deep-dives.',
  ],
};

const FLAG_META = {
  urgent:   { tint: T.color.TintClay,       glyph: 'flame',     label: 'Urgent'    },
  followup: { tint: T.color.TintLilac,      glyph: 'phone',     label: 'Follow-up' },
  parked:   { tint: T.color.SupportingText, glyph: 'leaf',      label: 'Parked'    },
};

function PresentScreen({ phase = 'planned' }) {
  if (phase === 'morning') return <PresentMorning />;
  if (phase === 'evening') return <PresentPlan withChecks phase="evening" />;
  return <PresentPlan phase="planned" />;
}

// ─── A. morning pre-brief ───────────────────────────────────────
// Sparse. Quiet. Big CTA to launch the daily brief conversation (handled by hero affordance).
function PresentMorning() {
  const yesterday = {
    quote: 'Shipped the slide. Walked after dinner.',
    glyph: 'pen',
    pal: ['#CFC9EB','#8E8FC6','#F0B98C','#2B2118'],
  };
  const weekGoals = [
    'Data slide shipped in pitch deck',
    'Anya call list reviewed + 3 intros',
    'Ops role reframe — written v2',
  ];
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      <div style={{ padding: '14px 24px 10px' }}>
        <div style={{
          fontFamily: T.font.UI, fontSize: 11, fontWeight: 700, letterSpacing: 1.4,
          textTransform: 'uppercase', color: T.color.SupportingText, marginBottom: 4,
          display: 'inline-flex', alignItems: 'center', gap: 6,
        }}>
          <Icon.Sun size={12} color={T.color.SupportingText} />
          Thursday · Daily brief
        </div>
        <div style={{
          fontFamily: T.font.Display, fontSize: 32, fontWeight: 500, lineHeight: '38px',
          color: T.color.PrimaryText, letterSpacing: -0.6, fontStyle: 'italic',
        }}>Good morning, Sam.</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px 240px', display: 'flex', flexDirection: 'column', gap: 22 }}>
        {/* Yesterday — one painterly highlight */}
        <div>
          <div style={{ fontFamily: T.font.UI, fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: T.color.SupportingText, marginBottom: 8 }}>Yesterday</div>
          <div style={{ borderRadius: 16, overflow: 'hidden', boxShadow: T.shadow.Raised }}>
            <PainterlyBlock palette={yesterday.pal} seed={7} style={{ padding: 22, color: '#FBF6EA', minHeight: 130, display: 'flex', alignItems: 'flex-end', gap: 12 }}>
              <div style={{ flex: 1, fontFamily: T.font.Display, fontSize: 22, lineHeight: '28px', fontStyle: 'italic', fontWeight: 500, letterSpacing: -0.3, color: '#FBF6EA' }}>&ldquo;{yesterday.quote}&rdquo;</div>
              <span style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(251,246,234,0.22)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Glyph name={yesterday.glyph} size={24} color="#FBF6EA" stroke={2} />
              </span>
            </PainterlyBlock>
          </div>
        </div>

        {/* This week's goals — quiet list */}
        <div>
          <div style={{ fontFamily: T.font.UI, fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: T.color.SupportingText, marginBottom: 8 }}>This week</div>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 0 }}>
            {weekGoals.map((g, i) => (
              <li key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 0',
                borderBottom: i < weekGoals.length - 1 ? `1px solid ${T.color.EdgeLine}` : 'none',
              }}>
                <span style={{ width: 5, height: 5, borderRadius: 999, background: T.color.PrimaryText, marginTop: 10, flexShrink: 0 }} />
                <span style={{ flex: 1, fontFamily: T.font.Reading, fontSize: 16, lineHeight: '24px', color: T.color.PrimaryText }}>{g}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Big CTA — start daily brief. Sits in the middle of the bottom third,
          so it's the clear focal point of the pre-brief morning. */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 180, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
        <button style={{
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

// ─── B. planned (post-brief) ─── C. evening (with checkmarks) ───
function PresentPlan({ phase, withChecks = false }) {
  const isEvening = phase === 'evening';
  const done = { 'Hackathon build — light touch. One trial run for the demo.': true, '11:00 AM CST — AMA with Thariq (Anthropic). Show up. Ask one question.': true, '2:00 PM CST — WIP AI Weekly demo. Walk in present.': true, 'Movement — light, not a workout.': true };
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      <div style={{ padding: '14px 24px 6px' }}>
        <div style={{
          fontFamily: T.font.UI, fontSize: 11, fontWeight: 700, letterSpacing: 1.4,
          textTransform: 'uppercase', color: T.color.SupportingText, marginBottom: 4,
          display: 'inline-flex', alignItems: 'center', gap: 6,
        }}>
          {isEvening
            ? <Icon.Moon size={12} color={T.color.SupportingText} />
            : <Icon.Sun size={12} color={T.color.SupportingText} />}
          {isEvening ? 'Thursday · Today, in review' : "Thursday · Today's plan"}
        </div>
        <div style={{
          fontFamily: T.font.Display, fontSize: 28, fontWeight: 500, lineHeight: '32px',
          color: T.color.PrimaryText, letterSpacing: -0.5, fontStyle: 'italic',
          marginTop: 2,
        }}>{isEvening ? 'How the day landed.' : PLAN_DATA.pacing.title}</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 20px 160px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Pacing narrative */}
        {!isEvening && (
          <div style={{ fontFamily: T.font.Reading, fontSize: 15, lineHeight: '23px', color: T.color.SupportingText, fontStyle: 'italic' }}>{PLAN_DATA.pacing.body}</div>
        )}

        {/* Flags */}
        {!isEvening && (
          <div>
            <div style={{ fontFamily: T.font.UI, fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: T.color.SupportingText, marginBottom: 8 }}>Flags</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {PLAN_DATA.flags.map((f, i) => {
                const m = FLAG_META[f.k];
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                    background: `${m.tint}22`, border: `1px solid ${m.tint}55`, borderRadius: 10,
                  }}>
                    <Glyph name={m.glyph} size={16} color={m.tint} stroke={1.9} />
                    <span style={{ fontFamily: T.font.UI, fontSize: 10, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', color: m.tint, flexShrink: 0 }}>{m.label}</span>
                    <span style={{ flex: 1, fontFamily: T.font.Reading, fontSize: 13, lineHeight: '18px', color: T.color.PrimaryText }}>{f.t}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Time-of-day bands */}
        {PLAN_DATA.bands.map((b, bi) => (
          <div key={bi}>
            <div style={{ fontFamily: T.font.UI, fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: T.color.SupportingText, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ flex: '0 0 auto' }}>{b.when}</span>
              <span style={{ flex: 1, height: 1, background: T.color.EdgeLine }} />
            </div>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {b.items.map((it, i) => {
                const isDone = withChecks && done[it.t];
                return (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <span style={{
                      width: 28, height: 28, borderRadius: 8,
                      background: isDone ? T.color.TintSage : T.color.SecondarySurface,
                      border: `1px solid ${isDone ? T.color.TintSageDeep : T.color.EdgeLine}`,
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      {isDone
                        ? <Icon.Check size={14} color={T.color.TintMoss} />
                        : <Glyph name={it.g} size={16} color={T.color.PrimaryText} stroke={1.75} />}
                    </span>
                    <span style={{
                      flex: 1, fontFamily: T.font.Reading, fontSize: 15, lineHeight: '22px',
                      color: T.color.PrimaryText, paddingTop: 4,
                      textDecoration: isDone ? 'line-through' : 'none',
                      opacity: isDone ? 0.55 : 1,
                    }}>{it.t}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        {/* Consciously parked */}
        <div>
          <div style={{ fontFamily: T.font.UI, fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: T.color.SupportingText, marginBottom: 10 }}>Consciously parked today</div>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {PLAN_DATA.parked.map((p, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: T.font.Reading, fontSize: 14, lineHeight: '20px', color: T.color.SubtleText, fontStyle: 'italic' }}>
                <span style={{ width: 16, height: 1, background: T.color.EdgeLine, flexShrink: 0 }} />
                {p}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Evening CTA — start daily review */}
      {isEvening && (
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 78, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
          <button style={{
            pointerEvents: 'auto',
            display: 'inline-flex', alignItems: 'center', gap: 10, padding: '16px 26px',
            background: 'linear-gradient(135deg, #2A2348 0%, #3D3565 55%, #5A4E7E 100%)',
            color: '#FBF6EA',
            border: 'none', borderRadius: 999, cursor: 'pointer',
            fontFamily: T.font.UI, fontSize: 15, fontWeight: 600, letterSpacing: 0.2,
            boxShadow: '0 8px 26px rgba(28,22,56,0.38), inset 0 1px 0 rgba(251,246,234,0.15)',
          }}>
            <Icon.Moon size={16} color="#FBF6EA" />
            Start your daily review
          </button>
        </div>
      )}
    </div>
  );
}


// ─── FUTURE SCREEN ─── Goals only. Quiet typographic cards, one per long-term vision.
// Lead with the vision line; a hairline divider; then one sentence about what THIS MONTH
// is for. Projects band sits underneath.
function FutureScreen({ onOpenProject, scroll = 'top' }) {
  const scrollRef = React.useRef(null);
  React.useEffect(() => {
    if (scroll === 'projects' && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [scroll]);
  const goals = [
    {
      t: 'Move to Japan.',
      month: 'April: finish the visa checklist and book the scouting trip for June.',
      glyph: 'plane',
      pal: ['#F5EBCF', '#CFC9EB', '#F0B98C', '#E6DFF5'],
    },
    {
      t: 'Start a side hustle that pays my rent.',
      month: 'April: ship the landing page and get 10 waitlist signups from real conversations.',
      glyph: 'leaf',
      pal: ['#E8EDE3', '#B8D0BE', '#F1DE8A', '#E8A25E'],
    },
    {
      t: 'Be someone I would want to work with.',
      month: 'April: one 1:1 a week, and say the hard thing out loud when it matters.',
      glyph: 'handshake',
      pal: ['#F5EBCF', '#F0B98C', '#E6DFF5', '#F1DE8A'],
    },
  ];
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      <ScreenHeader tense="Future" title="What this month is for." caption="Three long-term visions. Each one gets a monthly slice — then the agent cascades it into weekly and daily moves on Present." />
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '4px 20px 140px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {goals.map((g, i) => (
          <div key={i} style={{ borderRadius: T.radius.Card, boxShadow: T.shadow.Raised, flexShrink: 0 }}>
            <PainterlyBlock palette={g.pal} seed={i + 3} style={{ padding: '22px 24px 22px', minHeight: 210, position: 'relative', borderRadius: T.radius.Card, overflow: 'hidden' }}>
              {/* Oversize atmospheric glyph — sits in the corner as background texture */}
              <div style={{ position: 'absolute', right: -18, bottom: -24, opacity: 0.20, pointerEvents: 'none', lineHeight: 0 }}>
                <Glyph name={g.glyph} size={150} color={T.color.PrimaryText} stroke={1.4} />
              </div>
              <div style={{ position: 'relative' }}>
                <div style={{
                  fontFamily: T.font.Display, fontSize: 28, lineHeight: '32px', fontStyle: 'italic',
                  fontWeight: 500, color: T.color.PrimaryText, letterSpacing: -0.5,
                  textWrap: 'pretty', maxWidth: '88%',
                }}>{g.t}</div>
                <div style={{
                  marginTop: 18, marginBottom: 14,
                  height: 1, background: 'rgba(31,27,21,0.22)',
                }} />
                <div style={{
                  fontFamily: T.font.Reading, fontSize: 15, lineHeight: '23px',
                  color: T.color.PrimaryText, opacity: 0.86, maxWidth: '88%',
                }}>
                  <span style={{
                    fontFamily: T.font.UI, fontSize: 10, fontWeight: 700, letterSpacing: 1.2,
                    textTransform: 'uppercase', color: T.color.PrimaryText, opacity: 0.6,
                    marginRight: 8,
                  }}>April</span>
                  {g.month.replace(/^April:\s*/, '')}
                </div>
              </div>
            </PainterlyBlock>
          </div>
        ))}
        <button style={{
          marginTop: 4, minHeight: 52, borderRadius: 16,
          background: 'transparent', border: `1.5px dashed ${T.color.EdgeLine}`,
          fontFamily: T.font.UI, fontSize: 14, fontWeight: 600,
          color: T.color.SupportingText, cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <Icon.Sparkles size={14} color={T.color.SupportingText} />
          Name a new goal
        </button>
        {typeof ProjectsBand === 'function' && <ProjectsBand onOpen={onOpenProject} />}
      </div>
    </div>
  );
}

Object.assign(window, { PastScreen, PresentScreen, FutureScreen, ScreenHeader });
