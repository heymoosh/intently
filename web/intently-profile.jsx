// intently-profile.jsx — Profile sheet (settings hub).
//
// Reached via the avatar button in the bottom-left. Standard structure:
//   • Header: avatar + name/email + edit row
//   • Account
//   • Connections      ← opens ConnectionsPage as a sub-page
//   • Preferences
//   • Help & support
//   • Sign out
//
// Each non-Connections row opens a placeholder sub-page so the structure
// is real but content is intentionally minimal. The whole thing is a
// full-bleed overlay inside the Phone frame, like ConnectionsPage.

// ─── ROW PRIMITIVES ──────────────────────────────────────────────────
function SettingRow({ icon, label, sub, onClick, danger, last }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 14,
      width: '100%', padding: '14px 14px',
      background: 'transparent', border: 'none',
      borderBottom: last ? 'none' : `1px solid ${T.color.EdgeLine}`,
      cursor: 'pointer', textAlign: 'left',
      minHeight: 56,
    }}>
      <span style={{
        width: 36, height: 36, borderRadius: 10,
        background: danger ? '#F2D7CB' : T.color.PrimarySurface,
        border: `1px solid ${T.color.EdgeLine}`,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        color: danger ? '#A8421C' : T.color.PrimaryText,
      }}>
        {icon}
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{
          display: 'block',
          fontFamily: T.font.UI, fontSize: 14, fontWeight: 600,
          color: danger ? '#A8421C' : T.color.PrimaryText,
        }}>{label}</span>
        {sub && (
          <span style={{
            display: 'block', marginTop: 2,
            fontFamily: T.font.Reading, fontSize: 12, lineHeight: '16px',
            color: T.color.SupportingText,
          }}>{sub}</span>
        )}
      </span>
      {!danger && (
        <span style={{ flexShrink: 0, color: T.color.SubtleText }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 18 6-6-6-6"/>
          </svg>
        </span>
      )}
    </button>
  );
}

function SettingGroup({ children }) {
  return (
    <div style={{
      background: T.color.SecondarySurface,
      border: `1px solid ${T.color.EdgeLine}`,
      borderRadius: 14,
      overflow: 'hidden',
      marginBottom: 18,
    }}>{children}</div>
  );
}

// ─── PROFILE SHEET ───────────────────────────────────────────────────
function ProfileSheet({ connectedCount, onClose, onOpenConnections, onOpenAccount, onOpenPreferences, onOpenHelp, onOpenAgentActivity, onSignOut, onStartSetup }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 70,
      background: T.color.PrimarySurface,
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Top bar */}
      <div style={{
        flexShrink: 0,
        padding: '14px 18px 10px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <button onClick={onClose} aria-label="Close" style={{
          width: 36, height: 36, borderRadius: 999,
          background: 'transparent', border: 'none', cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon.X size={20} color={T.color.PrimaryText} />
        </button>
        <div style={{ fontFamily: T.font.UI, fontSize: 11, fontWeight: 700, letterSpacing: 1.4, textTransform: 'uppercase', color: T.color.SupportingText }}>Profile</div>
        <span style={{ width: 36 }} />
      </div>

      {/* Hero: avatar + name */}
      <div style={{
        flexShrink: 0,
        padding: '14px 24px 22px',
        display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: 999,
          background: 'linear-gradient(135deg, #E8A25E 0%, #C66B3F 100%)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          color: '#FBF6EA',
          fontFamily: T.font.Display, fontSize: 28, fontWeight: 600, fontStyle: 'italic',
          letterSpacing: -0.4,
          boxShadow: '0 6px 16px rgba(31,27,21,0.16)',
          flexShrink: 0,
        }}>S</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: T.font.Display, fontSize: 22, lineHeight: '26px',
            fontStyle: 'italic', fontWeight: 500, color: T.color.PrimaryText,
            letterSpacing: -0.3,
          }}>Sam Tanaka</div>
          <div style={{
            fontFamily: T.font.UI, fontSize: 13, color: T.color.SupportingText,
            marginTop: 2,
          }}>sam@intently.app</div>
        </div>
      </div>

      {/* Settings rows */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 80px' }}>
        <SettingGroup>
          <SettingRow
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.color.PrimaryText} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
            label="Account"
            sub="Name, email, password, plan"
            onClick={onOpenAccount}
          />
          <SettingRow
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.color.PrimaryText} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>}
            label="Connections"
            sub={connectedCount > 0 ? `${connectedCount} connected — calendars, mail, notes` : 'Calendars, mail, notes — make the agent sharper'}
            onClick={onOpenConnections}
          />
          <SettingRow
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.color.PrimaryText} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>}
            label="Preferences"
            sub="Voice, notifications, day rhythm"
            onClick={onOpenPreferences}
          />
          <SettingRow
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.color.PrimaryText} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
            label="Agent activity"
            sub="When the agent ran while you were away"
            onClick={onOpenAgentActivity}
            last
          />
        </SettingGroup>

        <SettingGroup>
          <SettingRow
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.color.PrimaryText} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>}
            label="Help & support"
            sub="Guides, contact, what's new"
            onClick={onOpenHelp}
            last
          />
        </SettingGroup>

        {onStartSetup && (
          <SettingGroup>
            <SettingRow
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.color.PrimaryText} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg>}
              label="Set up Intently as me"
              sub="Wipes seed data, captures your own goals"
              onClick={onStartSetup}
              last
            />
          </SettingGroup>
        )}

        <SettingGroup>
          <SettingRow
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>}
            label="Sign out"
            onClick={onSignOut}
            danger
            last
          />
        </SettingGroup>

        <div style={{
          marginTop: 6,
          textAlign: 'center',
          fontFamily: T.font.UI, fontSize: 11, color: T.color.SubtleText,
          letterSpacing: 0.2,
        }}>Intently · v0.4 · made quietly</div>
      </div>
    </div>
  );
}

// ─── PLACEHOLDER SUB-PAGES ───────────────────────────────────────────
// Account, Preferences, Help — minimal but real. Reachable from ProfileSheet.

function SettingsSubPage({ title, eyebrow, onBack, children }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 71,
      background: T.color.PrimarySurface,
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{
        flexShrink: 0,
        padding: '14px 18px 10px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <button onClick={onBack} aria-label="Back" style={{
          width: 36, height: 36, borderRadius: 999,
          background: 'transparent', border: 'none', cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon.ArrowLeft size={20} color={T.color.PrimaryText} />
        </button>
        <div style={{ fontFamily: T.font.UI, fontSize: 11, fontWeight: 700, letterSpacing: 1.4, textTransform: 'uppercase', color: T.color.SupportingText }}>{eyebrow}</div>
        <span style={{ width: 36 }} />
      </div>

      <div style={{ flexShrink: 0, padding: '14px 24px 18px' }}>
        <div style={{
          fontFamily: T.font.Display, fontSize: 32, lineHeight: '38px',
          fontStyle: 'italic', fontWeight: 500, color: T.color.PrimaryText, letterSpacing: -0.6,
        }}>{title}</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 80px' }}>
        {children}
      </div>
    </div>
  );
}

// StaticRow — non-interactive label + right-aligned value. The value text
// (e.g. "Change", "Download", "·", or a static address) is **presentational
// only** until a real destination lands — see interaction-inventory Gap #6.
// Styling deliberately uses `SupportingText` (muted) and never adds underline
// / cursor:pointer so the row doesn't read as tappable. If a row needs to
// become interactive, swap to `<button>`/`<a>` rather than wrapping this.
function StaticRow({ label, value, last, href }) {
  // When `href` is provided, render the value as a real link (e.g. mailto:)
  // so a tap does something. Visual treatment matches the static value to
  // avoid implying additional affordance.
  const ValueEl = href ? 'a' : 'span';
  const valueStyle = {
    fontFamily: T.font.UI, fontSize: 13, color: T.color.SupportingText, textAlign: 'right',
    textDecoration: 'none',
  };
  const valueProps = href ? { href, style: valueStyle } : { style: valueStyle };
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 16px',
      borderBottom: last ? 'none' : `1px solid ${T.color.EdgeLine}`,
      minHeight: 52,
      gap: 12,
    }}>
      <span style={{ fontFamily: T.font.UI, fontSize: 14, fontWeight: 500, color: T.color.PrimaryText }}>{label}</span>
      <ValueEl {...valueProps}>{value}</ValueEl>
    </div>
  );
}

// Persisted preferences. Single object keyed by `intently:prefs`. Update with
// setPref(key, value); read with getPref(key, fallback). Reads run synchronously
// from localStorage so consumers can decide what to render in their first paint.
const _PREFS_KEY = 'intently:prefs';
function getAllPrefs() {
  try {
    const raw = localStorage.getItem(_PREFS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) { return {}; }
}
function getPref(key, fallback) {
  const all = getAllPrefs();
  return (key in all) ? all[key] : fallback;
}
function setPref(key, value) {
  try {
    const all = getAllPrefs();
    all[key] = value;
    localStorage.setItem(_PREFS_KEY, JSON.stringify(all));
  } catch (e) {}
}
Object.assign(window, { getPref, setPref, getAllPrefs });

const _DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// SelectRow — tap to cycle through options. For the small option sets here
// (week-day pickers) cycling is faster than opening a sheet/select.
function SelectRow({ label, sub, prefKey, options, defaultValue, last }) {
  const [value, setValue] = React.useState(() => getPref(prefKey, defaultValue));
  const cycle = () => {
    const i = options.indexOf(value);
    const next = options[(i + 1) % options.length];
    setValue(next);
    setPref(prefKey, next);
  };
  return (
    <button onClick={cycle} style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      width: '100%', padding: '14px 16px',
      borderBottom: last ? 'none' : `1px solid ${T.color.EdgeLine}`,
      minHeight: 52, gap: 12,
      background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
    }}>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontFamily: T.font.UI, fontSize: 14, fontWeight: 500, color: T.color.PrimaryText }}>{label}</span>
        {sub && <span style={{ display: 'block', marginTop: 2, fontFamily: T.font.Reading, fontSize: 12, color: T.color.SupportingText }}>{sub}</span>}
      </span>
      <span style={{ fontFamily: T.font.UI, fontSize: 13, color: T.color.SupportingText, textAlign: 'right' }}>{value}</span>
    </button>
  );
}

// ToggleRow — same persistence pattern as SelectRow (getPref/setPref against
// localStorage `intently:prefs`). Each instance MUST pass a stable `prefKey`
// string (declared at call sites, not derived from labels) so that copy edits
// to `label` don't orphan saved values. See Pref keys block above PreferencesPage.
function ToggleRow({ label, sub, prefKey, defaultOn = false, last }) {
  const [on, setOn] = React.useState(() => getPref(prefKey, defaultOn));
  const toggle = () => {
    setOn(prev => {
      const next = !prev;
      setPref(prefKey, next);
      return next;
    });
  };
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '14px 16px',
      borderBottom: last ? 'none' : `1px solid ${T.color.EdgeLine}`,
      minHeight: 52,
    }}>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontFamily: T.font.UI, fontSize: 14, fontWeight: 500, color: T.color.PrimaryText }}>{label}</span>
        {sub && <span style={{ display: 'block', marginTop: 2, fontFamily: T.font.Reading, fontSize: 12, color: T.color.SupportingText }}>{sub}</span>}
      </span>
      <button onClick={toggle} aria-pressed={on} style={{
        width: 44, height: 26, borderRadius: 999,
        background: on ? T.color.PrimaryText : T.color.Stone300,
        border: 'none', cursor: 'pointer', flexShrink: 0,
        position: 'relative', padding: 0,
        transition: 'background 180ms ease',
      }}>
        <span style={{
          position: 'absolute', top: 3, left: on ? 21 : 3,
          width: 20, height: 20, borderRadius: 999,
          background: '#FBF6EA',
          boxShadow: '0 2px 4px rgba(31,27,21,0.2)',
          transition: 'left 180ms ease',
        }} />
      </button>
    </div>
  );
}

function AccountPage({ onBack }) {
  return (
    <SettingsSubPage title="Account." eyebrow="Profile · Account" onBack={onBack}>
      <div style={{
        background: T.color.SecondarySurface,
        border: `1px solid ${T.color.EdgeLine}`,
        borderRadius: 14, overflow: 'hidden', marginBottom: 18,
      }}>
        <StaticRow label="Name" value="Sam Tanaka" />
        <StaticRow label="Email" value="sam@intently.app" />
        <StaticRow label="Password" value="Change" />
        <StaticRow label="Plan" value="Quiet · monthly" last />
      </div>

      <div style={{
        background: T.color.SecondarySurface,
        border: `1px solid ${T.color.EdgeLine}`,
        borderRadius: 14, overflow: 'hidden', marginBottom: 18,
      }}>
        <StaticRow label="Export your journal" value="Download" />
        <StaticRow label="Delete account" value="·" last />
      </div>

      <div style={{
        fontFamily: T.font.Reading, fontSize: 13, lineHeight: '19px',
        color: T.color.SupportingText, fontStyle: 'italic',
        textAlign: 'center', padding: '0 20px',
      }}>
        Your journal belongs to you. Export anytime, in markdown.
      </div>
    </SettingsSubPage>
  );
}

function PreferencesPage({ onBack }) {
  return (
    <SettingsSubPage title="Preferences." eyebrow="Profile · Preferences" onBack={onBack}>
      <div style={{
        fontFamily: T.font.UI, fontSize: 10, fontWeight: 700, letterSpacing: 1.2,
        textTransform: 'uppercase', color: T.color.SupportingText,
        padding: '0 4px 8px',
      }}>Voice & chat</div>
      <div style={{
        background: T.color.SecondarySurface,
        border: `1px solid ${T.color.EdgeLine}`,
        borderRadius: 14, overflow: 'hidden', marginBottom: 22,
      }}>
        <ToggleRow prefKey="alwaysConfirm" label="Always confirm before saving" sub="Show the confirmation card after every voice utterance" defaultOn />
        <ToggleRow prefKey="holdToTalk" label="Hold to talk" sub="Press and hold the mic instead of tap-to-toggle" />
        <ToggleRow prefKey="readAloud" label="Read replies aloud" sub="Agent speaks its responses back to you" last />
      </div>

      <div style={{
        fontFamily: T.font.UI, fontSize: 10, fontWeight: 700, letterSpacing: 1.2,
        textTransform: 'uppercase', color: T.color.SupportingText,
        padding: '0 4px 8px',
      }}>Day rhythm</div>
      <div style={{
        background: T.color.SecondarySurface,
        border: `1px solid ${T.color.EdgeLine}`,
        borderRadius: 14, overflow: 'hidden', marginBottom: 22,
      }}>
        <StaticRow label="Brief time" value="7:00 AM" />
        <StaticRow label="Review window" value="After 8:00 PM" />
        <SelectRow label="Week start" prefKey="weekStart" defaultValue="Monday" options={_DAYS} />
        <SelectRow label="Weekly review day" sub="When the weekly review CTA appears" prefKey="weeklyReviewDay" defaultValue="Sunday" options={_DAYS} last />
      </div>

      <div style={{
        fontFamily: T.font.UI, fontSize: 10, fontWeight: 700, letterSpacing: 1.2,
        textTransform: 'uppercase', color: T.color.SupportingText,
        padding: '0 4px 8px',
      }}>Notifications</div>
      <div style={{
        background: T.color.SecondarySurface,
        border: `1px solid ${T.color.EdgeLine}`,
        borderRadius: 14, overflow: 'hidden',
      }}>
        <ToggleRow prefKey="briefReminder" label="Brief reminder" defaultOn />
        <ToggleRow prefKey="reviewNudge" label="Review nudge" sub="If you haven't logged a review by 10pm" defaultOn last />
      </div>
    </SettingsSubPage>
  );
}

function HelpPage({ onBack }) {
  const Item = ({ title, body, last }) => (
    <div style={{
      padding: '14px 16px',
      borderBottom: last ? 'none' : `1px solid ${T.color.EdgeLine}`,
    }}>
      <div style={{ fontFamily: T.font.UI, fontSize: 14, fontWeight: 600, color: T.color.PrimaryText, marginBottom: 4 }}>{title}</div>
      <div style={{ fontFamily: T.font.Reading, fontSize: 13, lineHeight: '19px', color: T.color.SupportingText }}>{body}</div>
    </div>
  );
  return (
    <SettingsSubPage title="Help & support." eyebrow="Profile · Help" onBack={onBack}>
      <div style={{
        background: T.color.SecondarySurface,
        border: `1px solid ${T.color.EdgeLine}`,
        borderRadius: 14, overflow: 'hidden', marginBottom: 18,
      }}>
        <Item title="How the day works" body="Brief in the morning. Review at night. The agent drafts; you confirm. Everything you say becomes a typed entry — nothing is saved without your nod." />
        <Item title="What about reminders?" body="Reminders go in projects, not the agent. Use the inline + on Future or inside a project. Things like 'renew passport' live in the Admin list." />
        <Item title="Voice or text?" body="Both. The hero opens to voice by default, but you can switch to chat at any time. Same agent, same confirmation flow." last />
      </div>

      <div style={{
        background: T.color.SecondarySurface,
        border: `1px solid ${T.color.EdgeLine}`,
        borderRadius: 14, overflow: 'hidden', marginBottom: 18,
      }}>
        <StaticRow label="Contact support" value="hi@intently.app" href="mailto:hi@intently.app" />
        <StaticRow label="What's new" value="Apr 2026" last />
      </div>

      <div style={{
        fontFamily: T.font.Reading, fontSize: 13, lineHeight: '19px',
        color: T.color.SupportingText, fontStyle: 'italic',
        textAlign: 'center', padding: '0 20px',
      }}>
        We read every message. Real humans, not bots.
      </div>
    </SettingsSubPage>
  );
}

// AgentActivityPage — the read-only "the agent ran while you were away" view.
//
// Reads the last 20 cron_log rows for the current user (RLS scopes the query
// by auth.uid() = user_id, see 0002_schedules.sql). Each row shows skill,
// fired_at relative time, and a small badge: dispatched / failed / queued.
// Failure rows expand to show metadata.error so the user knows what missed.
//
// Why surface this in Profile (not in the daily-brief feed):
//   • Most fires are silent successes — surfacing them inline is noise.
//   • The user looks here when something feels off ("did the brief fire?").
//   • Read-only is the right scope for V1; retry/cancel actions land later.
function AgentActivityPage({ onBack }) {
  const [rows, setRows] = React.useState(null); // null = loading, [] = empty
  const [err, setErr] = React.useState(null);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const sb = window.getSupabaseClient ? window.getSupabaseClient() : null;
        if (!sb) {
          if (alive) { setRows([]); setErr('Supabase client not available.'); }
          return;
        }
        const userId = await window.getCurrentUserId();
        const { data, error } = await sb
          .from('cron_log')
          .select('id, skill, fired_at, dispatched, metadata')
          .eq('user_id', userId)
          .order('fired_at', { ascending: false })
          .limit(20);
        if (!alive) return;
        if (error) { setRows([]); setErr(error.message); return; }
        setRows(data || []);
      } catch (e) {
        if (alive) { setRows([]); setErr(e && e.message ? e.message : String(e)); }
      }
    })();
    return () => { alive = false; };
  }, []);

  const fmtRel = (iso) => {
    const then = new Date(iso).getTime();
    const now = Date.now();
    const diff = Math.max(0, now - then);
    if (diff < 60_000) return 'just now';
    if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}h ago`;
    const d = new Date(iso);
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  const skillLabel = (s) => ({
    'daily-brief': 'Morning brief',
    'daily-review': 'Evening review',
    'weekly-review': 'Weekly review',
    'monthly-review': 'Monthly review',
  }[s] || s);

  const StatusBadge = ({ row }) => {
    const phase = (row.metadata && row.metadata.phase) || (row.dispatched ? 'completed' : 'queued');
    const isError = phase === 'failed' || phase === 'http_error';
    const colorMap = {
      completed: { bg: '#D7E5D2', fg: '#3F6133' },
      dispatched: { bg: '#E5DFC9', fg: '#6B5E2C' },
      queued: { bg: '#E5DFC9', fg: '#6B5E2C' },
      skipped: { bg: '#E5DFC9', fg: '#6B5E2C' },
      failed: { bg: '#F2D7CB', fg: '#A8421C' },
      http_error: { bg: '#F2D7CB', fg: '#A8421C' },
    };
    const c = colorMap[phase] || colorMap.queued;
    return (
      <span style={{
        fontFamily: T.font.UI, fontSize: 11, fontWeight: 600,
        color: c.fg, background: c.bg,
        padding: '3px 8px', borderRadius: 999, letterSpacing: 0.3,
        textTransform: 'uppercase',
      }}>
        {isError ? 'failed' : phase}
      </span>
    );
  };

  return (
    <SettingsSubPage title="Agent activity." eyebrow="Profile · Agent activity" onBack={onBack}>
      {rows === null && (
        <div style={{ padding: '20px 16px', fontFamily: T.font.UI, fontSize: 13, color: T.color.SupportingText }}>
          Loading…
        </div>
      )}
      {rows && rows.length === 0 && (
        <div style={{
          padding: '20px 16px',
          fontFamily: T.font.Reading, fontSize: 13, lineHeight: '19px',
          color: T.color.SupportingText, fontStyle: 'italic',
          textAlign: 'center',
        }}>
          {err ? `Couldn't load activity: ${err}` : 'No scheduled fires yet. Set your daily-brief time in Preferences and the agent will start running automatically.'}
        </div>
      )}
      {rows && rows.length > 0 && (
        <div style={{
          background: T.color.SecondarySurface,
          border: `1px solid ${T.color.EdgeLine}`,
          borderRadius: 14, overflow: 'hidden', marginBottom: 18,
        }}>
          {rows.map((r, i) => {
            const errMsg = r.metadata && (r.metadata.error || r.metadata.reason);
            const isLast = i === rows.length - 1;
            return (
              <div key={r.id} style={{
                padding: '14px 16px',
                borderBottom: isLast ? 'none' : `1px solid ${T.color.EdgeLine}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <span style={{
                    fontFamily: T.font.UI, fontSize: 14, fontWeight: 600,
                    color: T.color.PrimaryText,
                  }}>{skillLabel(r.skill)}</span>
                  <StatusBadge row={r} />
                </div>
                <div style={{
                  marginTop: 4,
                  fontFamily: T.font.UI, fontSize: 12,
                  color: T.color.SupportingText,
                }}>
                  {fmtRel(r.fired_at)}
                </div>
                {errMsg && (
                  <div style={{
                    marginTop: 6,
                    fontFamily: T.font.Reading, fontSize: 12, lineHeight: '17px',
                    color: T.color.SupportingText, fontStyle: 'italic',
                  }}>
                    {errMsg}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div style={{
        fontFamily: T.font.Reading, fontSize: 13, lineHeight: '19px',
        color: T.color.SupportingText, fontStyle: 'italic',
        textAlign: 'center', padding: '0 20px',
      }}>
        The agent fires automatically at the times you set. If something missed, the row above will tell you why.
      </div>
    </SettingsSubPage>
  );
}

Object.assign(window, { ProfileSheet, AccountPage, PreferencesPage, HelpPage, AgentActivityPage });
