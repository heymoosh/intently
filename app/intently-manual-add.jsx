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
// Persists to localStorage so additions survive reloads.
const MANUAL_ADDS_STORAGE_KEY = 'intently:manual-adds:v1';
const EMPTY_MANUAL_ADDS = {
  plan: { Morning: [], Afternoon: [], Evening: [] },
  journal: { today: [] },
  goals: [],
  projects: [],
  adminReminders: [],
  projectTodos: {},
};

function loadManualAdds() {
  try {
    const raw = localStorage.getItem(MANUAL_ADDS_STORAGE_KEY);
    if (!raw) return EMPTY_MANUAL_ADDS;
    const parsed = JSON.parse(raw);
    return { ...EMPTY_MANUAL_ADDS, ...parsed,
      plan: { ...EMPTY_MANUAL_ADDS.plan, ...(parsed.plan || {}) },
      journal: { ...EMPTY_MANUAL_ADDS.journal, ...(parsed.journal || {}) },
      projectTodos: { ...(parsed.projectTodos || {}) },
    };
  } catch {
    return EMPTY_MANUAL_ADDS;
  }
}

// Pick a glyph from the canonical ~40-glyph set based on simple keyword cues.
function pickGlyphFor(text, kind) {
  const t = (text || '').toLowerCase();
  if (kind === 'brief') return 'sun';
  if (kind === 'review') return 'moon';
  if (/walk|run|gym|workout|stretch|yoga|move/.test(t)) return 'heart';
  if (/eat|coffee|tea|lunch|dinner|breakfast/.test(t)) return 'utensils';
  if (/call|meeting|sync|standup|chat with/.test(t)) return 'phone';
  if (/write|essay|draft|note|journal/.test(t)) return 'pen';
  if (/read|book|article|paper/.test(t)) return 'book';
  if (/code|build|ship|deploy|debug|fix/.test(t)) return 'rocket';
  if (/sleep|rest|nap/.test(t)) return 'moon';
  if (/think|reflect|consider/.test(t)) return 'sparkles';
  return 'pen';
}

// Wrap a raw text into a typed Entry-shaped record (per HANDOFF §2.3, simplified).
// Keeps `text` and `id` for legacy reads; adds {at, kind, source, glyph}.
function makeEntry(text, { kind = 'journal', source = 'manual', extra = {} } = {}) {
  return {
    id: `e-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    at: new Date().toISOString(),
    text,
    kind,
    source,
    glyph: pickGlyphFor(text, kind),
    ...extra,
  };
}

function useManualAdds() {
  const [state, setState] = React.useState(loadManualAdds);
  React.useEffect(() => {
    try { localStorage.setItem(MANUAL_ADDS_STORAGE_KEY, JSON.stringify(state)); } catch {}
  }, [state]);

  return {
    state,
    addPlanItem: (band, text, opts = {}) =>
      setState((s) => ({
        ...s,
        plan: { ...s.plan, [band]: [...s.plan[band], makeEntry(text, { kind: 'plan', source: opts.source || 'manual', extra: { band } })] },
      })),
    addJournal: (dayId, text, opts = {}) =>
      setState((s) => ({
        ...s,
        journal: { ...s.journal, [dayId]: [...(s.journal[dayId] || []), makeEntry(text, { kind: opts.kind || 'journal', source: opts.source || 'manual' })] },
      })),
    addGoal: (text) =>
      setState((s) => ({ ...s, goals: [...s.goals, { text, id: `g-${Date.now()}` }] })),
    addProject: (text) =>
      setState((s) => ({ ...s, projects: [...s.projects, { text, id: `pr-${Date.now()}` }] })),
    addAdminReminder: (text) =>
      setState((s) => ({
        ...s,
        adminReminders: [...s.adminReminders, { text, id: `r-${Date.now()}`, done: false }],
      })),
    toggleAdminReminder: (id) =>
      setState((s) => ({
        ...s,
        adminReminders: s.adminReminders.map((r) => (r.id === id ? { ...r, done: !r.done } : r)),
      })),
    addProjectTodo: (projectId, text) =>
      setState((s) => ({
        ...s,
        projectTodos: {
          ...s.projectTodos,
          [projectId]: [...(s.projectTodos[projectId] || []), { text, id: `pt-${Date.now()}`, done: false }],
        },
      })),
    toggleProjectTodo: (projectId, id) =>
      setState((s) => ({
        ...s,
        projectTodos: {
          ...s.projectTodos,
          [projectId]: (s.projectTodos[projectId] || []).map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
        },
      })),

    // Idempotent: replace today's existing journal entry of the given kind
    // (e.g. one brief per day, one review per day). If none exists, append.
    replaceTodayKindEntry: (kind, text, opts = {}) =>
      setState((s) => {
        const today = (s.journal && s.journal.today) || [];
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const startMs = startOfToday.getTime();
        const newEntry = makeEntry(text, { kind, source: opts.source || 'agent', extra: opts.extra || {} });
        let replaced = false;
        const next = today.map((e) => {
          if (replaced) return e;
          if (e.kind !== kind) return e;
          if (!e.at) return e;
          if (new Date(e.at).getTime() < startMs) return e;
          replaced = true;
          return newEntry;
        });
        if (!replaced) next.push(newEntry);
        return { ...s, journal: { ...s.journal, today: next } };
      }),

    // Replace today's plan items (those whose `at` is today) with the bands
    // emitted by the agent. Older plan items (yesterday's leftovers) untouched.
    // Accepts the daily-brief schema: bands[].items[].text (or legacy .t).
    replaceTodaysPlanFromBands: (bands, opts = {}) =>
      setState((s) => {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const startMs = startOfToday.getTime();

        const filterToday = (arr) => (arr || []).filter((e) => {
          if (!e.at) return true; // older shape — keep
          return new Date(e.at).getTime() < startMs;
        });

        const nextPlan = {
          Morning: filterToday(s.plan?.Morning),
          Afternoon: filterToday(s.plan?.Afternoon),
          Evening: filterToday(s.plan?.Evening),
        };

        (Array.isArray(bands) ? bands : []).forEach((band) => {
          // Capitalize the band name to match our store keys.
          const when = (band.when || '').charAt(0).toUpperCase() + (band.when || '').slice(1).toLowerCase();
          if (!nextPlan[when]) return;
          (band.items || []).forEach((it) => {
            const text = it.text || it.t;
            if (!text) return;
            nextPlan[when].push(
              makeEntry(text, {
                kind: 'plan',
                source: opts.source || 'agent',
                extra: { band: when, tier: it.tier, duration_min: it.duration_min },
              })
            );
          });
        });

        return { ...s, plan: nextPlan };
      }),
  };
}

function resetManualAdds() {
  try { localStorage.removeItem(MANUAL_ADDS_STORAGE_KEY); } catch {}
}

Object.assign(window, { AddRow, InlineAdd, AddZone, useManualAdds, resetManualAdds, MANUAL_ADDS_STORAGE_KEY, makeEntry, pickGlyphFor });
