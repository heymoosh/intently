// intently-manual-add.jsx — the "Add manually" affordance.
//
// Principle: this is NOT the hero. The hero is for voice/chat with the agent.
// Manual entry is a quick, direct-manipulation path that commits straight to
// storage with no agent round-trip, no confirmation card, no classification.
//
// Two pieces:
//   <AddRow label onClick />            — the "+ Add …" affordance (dashed ghost row)
//   <InlineAdd placeholder onCommit onCancel />  — the one-line input that replaces the AddRow when active
//
// And a tiny store hook useManualAdds() so added items persist for the session.
//
// Every Add takes ONE text field. That's it. AI can enrich later.

// ─── AddRow ─── the "+ Add a plan item" row. Dashed ghost; sage ink on hover.
function AddRow({ label = 'Add manually', onClick, compact = false, style }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: '100%',
        minHeight: compact ? 40 : 48,
        padding: compact ? '8px 12px' : '10px 14px',
        borderRadius: compact ? 10 : 12,
        background: hover ? 'rgba(95,138,114,0.06)' : 'transparent',
        border: `1.25px dashed ${hover ? T.color.FocusObject : T.color.EdgeLine}`,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        cursor: 'pointer',
        fontFamily: T.font.UI,
        fontSize: compact ? 13 : 14,
        fontWeight: 600,
        letterSpacing: 0.1,
        color: hover ? T.color.FocusObject : T.color.SupportingText,
        transition: `all 140ms ${T.motion.Standard}`,
        textAlign: 'left',
        ...style,
      }}
    >
      <span
        aria-hidden
        style={{
          width: compact ? 18 : 20,
          height: compact ? 18 : 20,
          borderRadius: 999,
          background: hover ? T.color.FocusObject : 'transparent',
          border: `1.25px solid ${hover ? T.color.FocusObject : T.color.SubtleText}`,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: hover ? T.color.InverseText : T.color.SubtleText,
          fontFamily: T.font.UI,
          fontSize: compact ? 14 : 16,
          fontWeight: 400,
          lineHeight: 1,
          flexShrink: 0,
          transition: `all 140ms ${T.motion.Standard}`,
        }}
      >
        +
      </span>
      {label}
    </button>
  );
}

// ─── InlineAdd ─── the one-line input. Commits on Enter; cancels on Esc or
// blur-with-empty. Blur-with-text also commits (forgive-and-keep).
//
// Optional `rightSlot` for a time chip (reminders). Optional `helper` for a
// hint line below the input.
function InlineAdd({
  placeholder = 'Type and press Enter…',
  onCommit,
  onCancel,
  autoFocus = true,
  compact = false,
  tint,
  helper,
  rightSlot,
}) {
  const [val, setVal] = React.useState('');
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (autoFocus && ref.current) ref.current.focus();
  }, [autoFocus]);

  const commit = () => {
    const v = val.trim();
    if (v) {
      onCommit && onCommit(v);
      setVal('');
    } else {
      onCancel && onCancel();
    }
  };

  const bg = tint ? `${tint}22` : T.color.SecondarySurface;
  const border = tint ? `${tint}88` : T.color.FocusObject;

  return (
    <div
      style={{
        borderRadius: compact ? 10 : 12,
        background: bg,
        border: `1.5px solid ${border}`,
        padding: compact ? '6px 10px 6px 12px' : '8px 10px 8px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        boxShadow: '0 0 0 4px rgba(95,138,114,0.08)',
        transition: `all 160ms ${T.motion.Standard}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          aria-hidden
          style={{
            width: compact ? 18 : 20,
            height: compact ? 18 : 20,
            borderRadius: 999,
            background: T.color.FocusObject,
            color: T.color.InverseText,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: T.font.UI,
            fontSize: compact ? 13 : 14,
            fontWeight: 500,
            lineHeight: 1,
            flexShrink: 0,
          }}
        >
          +
        </span>
        <input
          ref={ref}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commit();
            } else if (e.key === 'Escape') {
              e.preventDefault();
              setVal('');
              onCancel && onCancel();
            }
          }}
          onBlur={commit}
          placeholder={placeholder}
          style={{
            flex: 1,
            minHeight: compact ? 28 : 32,
            border: 'none',
            background: 'transparent',
            outline: 'none',
            fontFamily: T.font.Reading,
            fontSize: compact ? 14 : 15,
            lineHeight: compact ? '20px' : '22px',
            color: T.color.PrimaryText,
          }}
        />
        {rightSlot}
        <button
          onMouseDown={(e) => e.preventDefault() /* keep focus; we commit via click */}
          onClick={commit}
          aria-label="Save"
          style={{
            width: compact ? 28 : 32,
            height: compact ? 28 : 32,
            borderRadius: 999,
            background: val.trim() ? T.color.PrimaryText : T.color.SunkenSurface,
            color: val.trim() ? T.color.InverseText : T.color.SubtleText,
            border: 'none',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: `all 120ms ${T.motion.Standard}`,
          }}
        >
          <Icon.Check size={compact ? 13 : 14} color={val.trim() ? T.color.InverseText : T.color.SubtleText} stroke={2.5} />
        </button>
      </div>
      {helper && (
        <div
          style={{
            fontFamily: T.font.UI,
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: 0.4,
            color: T.color.SubtleText,
            paddingLeft: compact ? 26 : 28,
            textTransform: 'uppercase',
          }}
        >
          {helper}
        </div>
      )}
    </div>
  );
}

// ─── AddZone ─── convenience: toggles between AddRow and InlineAdd.
function AddZone({ addLabel, placeholder, onCommit, helper, compact, tint, rightSlot }) {
  const [open, setOpen] = React.useState(false);
  if (open) {
    return (
      <InlineAdd
        placeholder={placeholder}
        helper={helper}
        compact={compact}
        tint={tint}
        rightSlot={rightSlot}
        onCommit={(v) => {
          onCommit && onCommit(v);
          setOpen(false);
        }}
        onCancel={() => setOpen(false)}
      />
    );
  }
  return <AddRow label={addLabel} onClick={() => setOpen(true)} compact={compact} />;
}

// ─── useManualAdds ─── tiny state bag the prototype threads through.
//
// State stays in-memory for instant UI feedback. Each add ALSO fires the
// matching window.entities.* helper as fire-and-forget so rows persist to
// Supabase. Errors log to console — UI never blocks on the network.
//
// Toggles (adminReminder.done, projectTodo.done) currently stay in-memory:
// the optimistic local IDs (`r-...`, `pt-...`) don't map to DB UUIDs in this
// session. Real toggle-persistence needs (a) the insert helper to return the
// row id and (b) read-on-mount to hydrate from Supabase so the local id maps
// to a real one. Flagged as a follow-up after the read-on-mount lands.
function useManualAdds() {
  const [state, setState] = React.useState({
    // Present-plan additions, keyed by band name ('Morning' | 'Afternoon' | 'Evening')
    plan: { Morning: [], Afternoon: [], Evening: [] },
    // Journal additions keyed by day id. Day id = 'today' for Present's inline journal + Past→Day
    journal: { today: [] },
    // Goals (top-level) & projects (on Future)
    goals: [],
    projects: [],
    // Admin reminders — the default catch-all for 1-off misc stuff.
    // When the user adds a reminder from a project detail, it goes on that project's todos instead.
    adminReminders: [],
    // Per-project added todos, keyed by project id
    projectTodos: {},
  });

  // Fire-and-forget persistence: never blocks UI, never throws to React.
  // Logs the failure so devtools surfaces it; the in-memory item stays visible.
  const _persist = (label, fn) => {
    if (typeof fn !== 'function') return;
    Promise.resolve()
      .then(() => fn())
      .catch((e) => console.warn(`[entities] ${label} failed:`, e && e.message ? e.message : e));
  };
  const _today = () => new Date().toISOString().slice(0, 10);

  return {
    state,
    addPlanItem: (band, text) => {
      setState((s) => ({
        ...s,
        plan: { ...s.plan, [band]: [...s.plan[band], { text, id: `p-${Date.now()}` }] },
      }));
      _persist('insertPlanItem', () =>
        window.insertPlanItem && window.insertPlanItem(_today(), band.toLowerCase(), text),
      );
    },
    addJournal: (dayId, text) => {
      setState((s) => ({
        ...s,
        journal: { ...s.journal, [dayId]: [...(s.journal[dayId] || []), { text, id: `j-${Date.now()}`, at: new Date() }] },
      }));
      // 'today' maps to undefined so the column default (now()) fires; future
      // day ids could pass an ISO date if the prototype ever wires past-day adds.
      const at = dayId === 'today' ? undefined : dayId;
      _persist('insertJournalEntry', () =>
        window.insertJournalEntry && window.insertJournalEntry(text, at),
      );
    },
    addGoal: (text) => {
      setState((s) => ({ ...s, goals: [...s.goals, { text, id: `g-${Date.now()}` }] }));
      _persist('insertGoal', () => window.insertGoal && window.insertGoal(text));
    },
    addProject: (text) => {
      setState((s) => ({ ...s, projects: [...s.projects, { text, id: `pr-${Date.now()}` }] }));
      _persist('insertProject', () => window.insertProject && window.insertProject(text));
    },
    addAdminReminder: (text) => {
      setState((s) => ({
        ...s,
        adminReminders: [...s.adminReminders, { text, id: `r-${Date.now()}`, done: false }],
      }));
      _persist('insertAdminReminder', () =>
        window.insertAdminReminder && window.insertAdminReminder(text),
      );
    },
    toggleAdminReminder: (id) =>
      // In-memory only — see header comment.
      setState((s) => ({
        ...s,
        adminReminders: s.adminReminders.map((r) => (r.id === id ? { ...r, done: !r.done } : r)),
      })),
    addProjectTodo: (projectId, text) => {
      setState((s) => ({
        ...s,
        projectTodos: {
          ...s.projectTodos,
          [projectId]: [...(s.projectTodos[projectId] || []), { text, id: `pt-${Date.now()}`, done: false }],
        },
      }));
      // Only persist when projectId looks like a real DB UUID; the prototype's
      // PROJECT_DATA fixtures use string keys like 'demo-pitch' that won't satisfy
      // the foreign-key constraint on projects.id. Skip cleanly in that case.
      if (typeof projectId === 'string' && /^[0-9a-f]{8}-/.test(projectId)) {
        _persist('addProjectTodo', () =>
          window.addProjectTodo && window.addProjectTodo(projectId, text),
        );
      }
    },
    toggleProjectTodo: (projectId, id) =>
      // In-memory only — see header comment.
      setState((s) => ({
        ...s,
        projectTodos: {
          ...s.projectTodos,
          [projectId]: (s.projectTodos[projectId] || []).map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
        },
      })),
  };
}

Object.assign(window, { AddRow, InlineAdd, AddZone, useManualAdds });
