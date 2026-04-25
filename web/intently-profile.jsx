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
function ProfileSheet({ connectedCount, onClose, onOpenConnections, onOpenAccount, onOpenPreferences, onOpenHelp, onSignOut }) {
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
        }}>M</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: T.font.Display, fontSize: 22, lineHeight: '26px',
            fontStyle: 'italic', fontWeight: 500, color: T.color.PrimaryText,
            letterSpacing: -0.3,
          }}>Maya Tanaka</div>
          <div style={{
            fontFamily: T.font.UI, fontSize: 13, color: T.color.SupportingText,
            marginTop: 2,
          }}>maya@intently.app</div>
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

function StaticRow({ label, value, last }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 16px',
      borderBottom: last ? 'none' : `1px solid ${T.color.EdgeLine}`,
      minHeight: 52,
      gap: 12,
    }}>
      <span style={{ fontFamily: T.font.UI, fontSize: 14, fontWeight: 500, color: T.color.PrimaryText }}>{label}</span>
      <span style={{ fontFamily: T.font.UI, fontSize: 13, color: T.color.SupportingText, textAlign: 'right' }}>{value}</span>
    </div>
  );
}

function ToggleRow({ label, sub, defaultOn = false, last }) {
  const [on, setOn] = React.useState(defaultOn);
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
      <button onClick={() => setOn(o => !o)} aria-pressed={on} style={{
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
        <StaticRow label="Name" value="Maya Tanaka" />
        <StaticRow label="Email" value="maya@intently.app" />
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
        <ToggleRow label="Always confirm before saving" sub="Show the confirmation card after every voice utterance" defaultOn />
        <ToggleRow label="Hold to talk" sub="Press and hold the mic instead of tap-to-toggle" />
        <ToggleRow label="Read replies aloud" sub="Agent speaks its responses back to you" last />
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
        <StaticRow label="Week start" value="Monday" last />
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
        <ToggleRow label="Brief reminder" defaultOn />
        <ToggleRow label="Review nudge" sub="If you haven't logged a review by 10pm" defaultOn />
        <ToggleRow label="Weekly summary email" sub="Sundays at 6pm" last />
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
        <StaticRow label="Contact support" value="hi@intently.app" />
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

Object.assign(window, { ProfileSheet, AccountPage, PreferencesPage, HelpPage });
