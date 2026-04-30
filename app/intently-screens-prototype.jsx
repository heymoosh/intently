// intently-screens-prototype.jsx — Prototype versions of the Present/Future/Past screens
// with manual-add affordances wired in. These DO NOT replace the production screens —
// the Design System canvas still uses the originals.
//
// Manual-add rule: all + affordances here commit straight to local state, no agent,
// no confirmation card, no classification. That's the whole point.

// ─── Present: Planned phase with + Add a plan item at the end of each band.
// Also adds a "Journal something now" add-zone at the bottom (journal entries
// are shown in Past→Day, but users can seed them from Present).
function PresentPlanProto({ phase = 'planned', adds, onAddPlan, onAddJournal }) {
  const isEvening = phase === 'evening';
  const done = {
    'Hackathon build — light touch. One trial run for the demo.': true,
    '11:00 AM CST — AMA with Thariq (Anthropic). Show up. Ask one question.': true,
    '2:00 PM CST — WIP AI Weekly demo. Walk in present.': true,
    'Movement — light, not a workout.': true,
  };

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
        {!isEvening && (
          <div style={{ fontFamily: T.font.Reading, fontSize: 15, lineHeight: '23px', color: T.color.SupportingText, fontStyle: 'italic' }}>{PLAN_DATA.pacing.body}</div>
        )}

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

        {/* Time-of-day bands — each gets a trailing + Add */}
        {PLAN_DATA.bands.map((b, bi) => {
          const added = (adds && adds.plan && adds.plan[b.when]) || [];
          return (
            <div key={bi}>
              <div style={{ fontFamily: T.font.UI, fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: T.color.SupportingText, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ flex: '0 0 auto' }}>{b.when}</span>
                <span style={{ flex: 1, height: 1, background: T.color.EdgeLine }} />
              </div>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {b.items.map((it, i) => {
                  const isDone = isEvening && done[it.t];
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
                {added.map((it) => (
                  <li key={it.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <span style={{
                      width: 28, height: 28, borderRadius: 8,
                      background: T.color.SecondarySurface,
                      border: `1.5px solid ${T.color.FocusObject}55`,
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <Icon.Pencil size={14} color={T.color.FocusObject} />
                    </span>
                    <span style={{
                      flex: 1, fontFamily: T.font.Reading, fontSize: 15, lineHeight: '22px',
                      color: T.color.PrimaryText, paddingTop: 4,
                    }}>{it.text}</span>
                  </li>
                ))}
                <li style={{ marginTop: 4, marginLeft: 40 }}>
                  <AddZone
                    addLabel={`Add to ${b.when.toLowerCase()}`}
                    placeholder={`Something you'll do this ${b.when.toLowerCase()}…`}
                    helper="Saves to your plan · no AI"
                    compact
                    onCommit={(v) => onAddPlan && onAddPlan(b.when, v)}
                  />
                </li>
              </ul>
            </div>
          );
        })}

        {/* Manual journal from Present — seeds Past→Day */}
        <div>
          <div style={{ fontFamily: T.font.UI, fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: T.color.SupportingText, marginBottom: 10 }}>Journal</div>
          <AddZone
            addLabel="Add a journal entry"
            placeholder="A thought, right now…"
            helper="Saves to today in Past · no AI"
            onCommit={(v) => onAddJournal && onAddJournal('today', v)}
          />
          {(adds && adds.journal && adds.journal.today || []).slice().reverse().map((j) => (
            <div key={j.id} style={{
              marginTop: 8, padding: '10px 12px',
              background: T.color.TintLilac + '22',
              border: `1px solid ${T.color.TintLilac}55`,
              borderRadius: 10,
              fontFamily: T.font.Reading, fontSize: 14, lineHeight: '20px', color: T.color.PrimaryText,
              fontStyle: 'italic',
            }}>"{j.text}"</div>
          ))}
        </div>

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

// ─── Future — goals + projects band + "Admin" admin-reminders band at top.
// Adds: "Name a new goal" (already existed as ghost), "+ Add a project" on band,
// and a new "Admin" list with quick-add reminder.
// Seed goals — the persona's three top-level goals. Promoted to a module-level
// constant so the agent input builders (intently-ma.jsx) can include them in
// the markdown context. Without this, the agent saw an empty world and reported
// "no goals wired in" even though the user can clearly see them on Future.
const SEED_GOALS = [
  { t: 'Move to Japan.', month: 'April: finish the visa checklist and book the scouting trip for June.', glyph: 'plane', pal: ['#F5EBCF', '#CFC9EB', '#F0B98C', '#E6DFF5'] },
  { t: 'Start a side hustle that pays my rent.', month: 'April: ship the landing page and get 10 waitlist signups from real conversations.', glyph: 'leaf', pal: ['#E8EDE3', '#B8D0BE', '#F1DE8A', '#E8A25E'] },
  { t: 'Be someone I would want to work with.', month: 'April: one 1:1 a week, and say the hard thing out loud when it matters.', glyph: 'handshake', pal: ['#F5EBCF', '#F0B98C', '#E6DFF5', '#F1DE8A'] },
];

function FutureScreenProto({ adds, onOpenProject, onAddGoal, onAddProject, onAddAdminReminder, onToggleAdminReminder }) {
  const goals = SEED_GOALS;
  const addedGoals = (adds && adds.goals) || [];
  const addedProjects = (adds && adds.projects) || [];
  const admin = (adds && adds.adminReminders) || [];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      <ScreenHeader tense="Future" title="What this month is for." caption="Three long-term visions. Each one gets a monthly slice — then the agent cascades it into weekly and daily moves on Present." />
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 20px 140px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {goals.map((g, i) => (
          <div key={i} style={{ borderRadius: T.radius.Card, boxShadow: T.shadow.Raised, flexShrink: 0 }}>
            <PainterlyBlock palette={g.pal} seed={i + 3} style={{ padding: '22px 24px 22px', minHeight: 210, position: 'relative', borderRadius: T.radius.Card, overflow: 'hidden' }}>
              <div style={{ position: 'absolute', right: -18, bottom: -24, opacity: 0.20, pointerEvents: 'none', lineHeight: 0 }}>
                <Glyph name={g.glyph} size={150} color={T.color.PrimaryText} stroke={1.4} />
              </div>
              <div style={{ position: 'relative' }}>
                <div style={{ fontFamily: T.font.Display, fontSize: 28, lineHeight: '32px', fontStyle: 'italic', fontWeight: 500, color: T.color.PrimaryText, letterSpacing: -0.5, textWrap: 'pretty', maxWidth: '88%' }}>{g.t}</div>
                <div style={{ marginTop: 18, marginBottom: 14, height: 1, background: 'rgba(31,27,21,0.22)' }} />
                <div style={{ fontFamily: T.font.Reading, fontSize: 15, lineHeight: '23px', color: T.color.PrimaryText, opacity: 0.86, maxWidth: '88%' }}>
                  <span style={{ fontFamily: T.font.UI, fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: T.color.PrimaryText, opacity: 0.6, marginRight: 8 }}>April</span>
                  {g.month.replace(/^April:\s*/, '')}
                </div>
              </div>
            </PainterlyBlock>
          </div>
        ))}

        {/* Just-added goals — simple tan cards, waiting for AI to enrich */}
        {addedGoals.map((g) => (
          <div key={g.id} style={{
            borderRadius: T.radius.Card, padding: '20px 22px', minHeight: 110,
            background: T.color.SecondarySurface,
            border: `1.5px dashed ${T.color.FocusObject}66`,
            position: 'relative',
          }}>
            <div style={{ fontFamily: T.font.UI, fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: T.color.FocusObject, marginBottom: 8 }}>Just added · tap the mic to flesh it out</div>
            <div style={{ fontFamily: T.font.Display, fontSize: 22, lineHeight: '28px', fontStyle: 'italic', fontWeight: 500, color: T.color.PrimaryText, letterSpacing: -0.3 }}>{g.text}</div>
          </div>
        ))}

        <AddZone
          addLabel="Add a goal"
          placeholder="Name a long-term vision…"
          helper="Just a one-liner · AI can help you flesh it out later"
          onCommit={(v) => onAddGoal && onAddGoal(v)}
        />

        {/* Projects band */}
        <div style={{ marginTop: 26 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontFamily: T.font.UI, fontSize: 10, fontWeight: 700, letterSpacing: 1.4, textTransform: 'uppercase', color: T.color.SupportingText }}>Projects</div>
            <div style={{ fontFamily: T.font.UI, fontSize: 11, color: T.color.SubtleText }}>{PROJECT_DATA.length + addedProjects.length} active</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {PROJECT_DATA.map(p => <ProjectCard key={p.id} p={p} onOpen={() => onOpenProject && onOpenProject(p)} />)}
            {addedProjects.map((p) => (
              <div key={p.id} style={{
                position: 'relative', background: T.color.SecondarySurface,
                border: `1.5px dashed ${T.color.FocusObject}66`,
                borderRadius: 14, padding: 14, minHeight: 110,
                display: 'flex', flexDirection: 'column', gap: 6,
              }}>
                <div style={{ fontFamily: T.font.UI, fontSize: 9, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', color: T.color.FocusObject }}>Just added</div>
                <div style={{ fontFamily: T.font.Display, fontSize: 15, lineHeight: '20px', fontStyle: 'italic', fontWeight: 500, color: T.color.PrimaryText, letterSpacing: -0.2 }}>{p.text}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10 }}>
            <AddZone
              addLabel="Add a project"
              placeholder="Name something you're working on…"
              helper="Just a one-liner · AI can help you flesh it out later"
              compact
              onCommit={(v) => onAddProject && onAddProject(v)}
            />
          </div>
        </div>

        {/* Admin band — the catch-all for 1-off reminders not tied to a project */}
        <div style={{ marginTop: 26 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontFamily: T.font.UI, fontSize: 10, fontWeight: 700, letterSpacing: 1.4, textTransform: 'uppercase', color: T.color.SupportingText }}>Admin · misc reminders</div>
            <div style={{ fontFamily: T.font.UI, fontSize: 11, color: T.color.SubtleText }}>{admin.filter(a => !a.done).length} open</div>
          </div>
          <div style={{
            background: T.color.SecondarySurface,
            border: `1px solid ${T.color.EdgeLine}`,
            borderRadius: 14, padding: 10, display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            {admin.length === 0 && (
              <div style={{ padding: '6px 4px', fontFamily: T.font.Reading, fontSize: 13, lineHeight: '18px', color: T.color.SubtleText, fontStyle: 'italic' }}>
                Nothing here yet. Things like "renew passport" or "call the vet" — stuff that isn't tied to a project.
              </div>
            )}
            {admin.map((r) => (
              <button key={r.id} onClick={() => onToggleAdminReminder && onToggleAdminReminder(r.id)} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '8px 4px',
                background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
              }}>
                <span style={{
                  width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                  background: r.done ? T.color.TintSage : 'transparent',
                  border: `1.5px solid ${r.done ? T.color.TintSageDeep : T.color.SubtleText}`,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {r.done && <Icon.Check size={12} color={T.color.TintMoss} stroke={2.5} />}
                </span>
                <span style={{
                  flex: 1, fontFamily: T.font.Reading, fontSize: 14, lineHeight: '20px',
                  color: T.color.PrimaryText,
                  textDecoration: r.done ? 'line-through' : 'none',
                  opacity: r.done ? 0.5 : 1,
                }}>{r.text}</span>
              </button>
            ))}
            <AddZone
              addLabel="Add a reminder"
              placeholder="e.g. renew passport"
              helper="Saves to Admin · no AI"
              compact
              onCommit={(v) => onAddAdminReminder && onAddAdminReminder(v)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Project detail with a working + Add todo on the tracker.
function ProjectDetailProto({ p, adds, onBack, onAddProjectTodo, onToggleProjectTodo }) {
  const addedTodos = (adds && adds.projectTodos && adds.projectTodos[p.id]) || [];
  return (
    <div style={{ height: '100%', background: T.color.SecondarySurface, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
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
                padding: '12px 14px',
                borderBottom: `1px solid ${T.color.EdgeLine}`,
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
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { PresentPlanProto, FutureScreenProto, ProjectDetailProto, SEED_GOALS });
