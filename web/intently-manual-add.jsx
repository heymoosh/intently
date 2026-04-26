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
// On mount, hydrates from Supabase: pulls active goals, projects (+ JSONB todos),
// today's plan items + journal entries, and pending admin reminders. Items added
// optimistically during the load (temp ids prefixed `g-` `pr-` `j-` `p-` `r-`)
// are preserved alongside hydrated rows, so a fast typer doesn't lose work.
//
// Toggles (adminReminder.done, projectTodo.done) still stay in-memory in this
// pass — flagging that work for a follow-up since the in-memory state now has
// the real UUIDs needed to wire it.
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

  // Optimistic-id detector: items added in the current session that are pending
  // persistence have these prefixes. Hydrated rows use real UUIDs.
  const _isOptimistic = (id) => typeof id === 'string' && /^(g|pr|j|p|r|pt)-\d/.test(id);

  // Hydrate from Supabase once on mount. Each list fires in parallel; failures
  // fall back to an empty array so a single dead helper doesn't break the rest.
  // Before hydration, seed Sam's data if the user has no goals (idempotent).
  const hydratedRef = React.useRef(false);
  React.useEffect(() => {
    if (hydratedRef.current) return;
    if (!window.listGoals) return; // entities helpers not loaded — skip
    let cancelled = false;

    (async () => {
      // Sam-seed gate: only load Sam's demo data when the URL is opted in
      // via `?demo=1` (the same pattern the future landing-page embed uses)
      // OR when running in dev mode (`?dev=1` or localhost). Real-app
      // visitors land on a clean empty state — Sam is no longer the
      // unconditional first-load fixture.
      // See `.claude/handoffs/new-user-ux-and-auth.md` § Sam-seed gate.
      const seedAllowed = !!(window.INTENTLY_DEMO || window.INTENTLY_DEV);
      if (seedAllowed && window.seedSamIfEmpty) {
        try {
          const result = await window.seedSamIfEmpty();
          if (result && !result.skipped) {
            console.log('[seed-sam] seeded fresh user:', result.inserted);
          }
        } catch (e) {
          console.warn('[seed-sam] failed:', e && e.message ? e.message : e);
        }
      }
      // Independent gate for calendar/email — covers the case where 0006 was
      // applied AFTER the user was first seeded (calendar/email 404'd then).
      // Same demo/dev gate so real-app users don't get seed rows surprising
      // them once 0006 lands.
      if (seedAllowed && window.seedSamCalendarEmailIfEmpty) {
        try {
          const result = await window.seedSamCalendarEmailIfEmpty();
          if (result && !result.skipped && Object.keys(result.inserted).length > 0) {
            console.log('[seed-sam] backfilled calendar/email:', result.inserted);
          }
        } catch (e) {
          console.warn('[seed-sam] calendar/email backfill failed:', e && e.message ? e.message : e);
        }
      }

      const today = _today();
      const [goals, projects, journalEntries, planItems, reminders] = await Promise.all([
        window.listGoals().catch((e) => { console.warn('[entities] listGoals:', e.message); return []; }),
        window.listProjects().catch((e) => { console.warn('[entities] listProjects:', e.message); return []; }),
        window.listJournalEntries({ limit: 50 }).catch((e) => { console.warn('[entities] listJournalEntries:', e.message); return []; }),
        window.listPlanItems(today).catch((e) => { console.warn('[entities] listPlanItems:', e.message); return []; }),
        window.listAdminReminders().catch((e) => { console.warn('[entities] listAdminReminders:', e.message); return []; }),
      ]);

      if (cancelled) return;

      // Journal rows come back newest-first; flip to oldest-first so the JSX's
      // .slice().reverse() shows newest at the top of the inline list. Filter
      // to today only — the prototype's inline journal scope.
      const todayJournal = journalEntries
        .filter((e) => {
          try { return new Date(e.at).toISOString().slice(0, 10) === today; }
          catch { return false; }
        })
        .slice()
        .reverse();

      // projects.todos is JSONB — extract per-project. Hydrated todos already
      // have real UUIDs; preserve them.
      const hydratedProjectTodos = {};
      for (const p of projects) {
        if (Array.isArray(p.todos) && p.todos.length > 0) {
          hydratedProjectTodos[p.id] = p.todos.map((t) => ({
            text: t.text || '',
            id: t.id || `pt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            done: !!t.done,
          }));
        }
      }

      setState((s) => ({
        ...s,
        goals: [
          ...goals.map((g) => ({ text: g.title, id: g.id })),
          ...s.goals.filter((g) => _isOptimistic(g.id)),
        ],
        projects: [
          ...projects.map((p) => ({ text: p.title, id: p.id })),
          ...s.projects.filter((p) => _isOptimistic(p.id)),
        ],
        journal: {
          ...s.journal,
          today: [
            ...todayJournal.map((e) => ({ text: e.body_markdown, id: e.id, at: new Date(e.at) })),
            ...s.journal.today.filter((j) => _isOptimistic(j.id)),
          ],
        },
        plan: {
          Morning: [
            ...planItems.filter((p) => p.band === 'morning').map((p) => ({ text: p.text, id: p.id })),
            ...s.plan.Morning.filter((p) => _isOptimistic(p.id)),
          ],
          Afternoon: [
            ...planItems.filter((p) => p.band === 'afternoon').map((p) => ({ text: p.text, id: p.id })),
            ...s.plan.Afternoon.filter((p) => _isOptimistic(p.id)),
          ],
          Evening: [
            ...planItems.filter((p) => p.band === 'evening').map((p) => ({ text: p.text, id: p.id })),
            ...s.plan.Evening.filter((p) => _isOptimistic(p.id)),
          ],
        },
        adminReminders: [
          ...reminders.map((r) => ({ text: r.text, id: r.id, done: false })),
          ...s.adminReminders.filter((r) => _isOptimistic(r.id)),
        ],
        projectTodos: { ...hydratedProjectTodos, ...s.projectTodos },
      }));

      hydratedRef.current = true;
    })();

    return () => { cancelled = true; };
  }, []);

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
    toggleAdminReminder: (id) => {
      setState((s) => ({
        ...s,
        adminReminders: s.adminReminders.map((r) => (r.id === id ? { ...r, done: !r.done } : r)),
      }));
      // Persist to reminders table when this is a real DB UUID. Optimistic ids
      // (`r-*`) skip cleanly; they'll persist when the next add lands a UUID.
      if (typeof id === 'string' && /^[0-9a-f]{8}-/.test(id)) {
        _persist('markAdminReminderDone', () =>
          window.markAdminReminderDone && window.markAdminReminderDone(id),
        );
      }
    },
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
    toggleProjectTodo: (projectId, id) => {
      setState((s) => ({
        ...s,
        projectTodos: {
          ...s.projectTodos,
          [projectId]: (s.projectTodos[projectId] || []).map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
        },
      }));
      // Persist when projectId + todoId are both real DB UUIDs. Optimistic ids
      // skip cleanly until the next add returns a UUID.
      const looksUuid = (s) => typeof s === 'string' && /^[0-9a-f]{8}-/.test(s);
      if (looksUuid(projectId) && looksUuid(id)) {
        _persist('toggleProjectTodo', () =>
          window.toggleProjectTodo && window.toggleProjectTodo(projectId, id),
        );
      }
    },
  };
}

Object.assign(window, { AddRow, InlineAdd, AddZone, useManualAdds });
