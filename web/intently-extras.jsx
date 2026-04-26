// intently-extras.jsx
// Three additions:
//   1. JournalComposer — minimal full-bleed overlay opened from hero radial.
//   2. ConnectionsPage + OAuthFlow + OnboardingConnectCard — reached via the
//      profile avatar in Present's top-left corner.
//   3. ProfileButton — small avatar tap-target.
//
// All integration logos are rendered as inline SVG mark-stand-ins. They're
// stylized monograms using each brand's primary hue, not the literal logo —
// good enough for prototype, swap for real assets in production.

// ─── JOURNAL COMPOSER ─────────────────────────────────────────────────
// Modes:
//   • Insert (default): blank textarea, on save calls onSave(text); host
//     inserts a new entries row.
//   • Edit:  pass `initialText` (the existing body_markdown) — textarea
//     prefills, on save the host updates the existing row (caller is
//     responsible for tracking which entryId to update).
// `mode` is presentational only ('Save' vs 'Save changes'); the actual
// insert-vs-update branching lives at the call site.
function JournalComposer({ onClose, onSave, initialText, mode = 'create' }) {
  const [text, setText] = React.useState(initialText || '');
  const taRef = React.useRef(null);
  const [now] = React.useState(() => new Date());

  React.useEffect(() => {
    if (taRef.current) {
      taRef.current.focus();
      // Place cursor at end when editing so the user can keep writing
      // without selecting the existing text.
      if (initialText) {
        const len = taRef.current.value.length;
        taRef.current.setSelectionRange(len, len);
      }
    }
  }, [initialText]);

  const dateLine = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const timeLine = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const canSave = text.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    onSave && onSave(text.trim());
  };

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 65,
      background: T.color.PrimarySurface,
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px 8px',
      }}>
        <button onClick={onClose} aria-label="Close" style={{
          width: 36, height: 36, borderRadius: 999,
          background: 'transparent', border: 'none', cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon.X size={20} color={T.color.PrimaryText} />
        </button>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontFamily: T.font.UI, fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: T.color.SupportingText }}>
            Journal entry
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={!canSave}
          style={{
            padding: '8px 16px',
            background: canSave ? T.color.PrimaryText : 'transparent',
            color: canSave ? '#FBF6EA' : T.color.SubtleText,
            border: canSave ? 'none' : `1px solid ${T.color.EdgeLine}`,
            borderRadius: 999,
            fontFamily: T.font.UI, fontSize: 13, fontWeight: 600,
            cursor: canSave ? 'pointer' : 'default',
            transition: 'background 160ms ease, color 160ms ease',
          }}
        >{mode === 'edit' ? 'Save changes' : 'Save'}</button>
      </div>

      {/* Date */}
      <div style={{ flexShrink: 0, padding: '4px 28px 18px' }}>
        <div style={{
          fontFamily: T.font.Display, fontSize: 28, lineHeight: '32px',
          fontStyle: 'italic', fontWeight: 500, color: T.color.PrimaryText,
          letterSpacing: -0.4,
        }}>{dateLine}</div>
        <div style={{
          fontFamily: T.font.UI, fontSize: 12, color: T.color.SupportingText,
          marginTop: 4, letterSpacing: 0.2,
        }}>{timeLine}</div>
      </div>

      {/* Text area */}
      <div style={{ flex: 1, padding: '0 28px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <textarea
          ref={taRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Just write."
          style={{
            flex: 1, width: '100%',
            border: 'none', outline: 'none', background: 'transparent',
            resize: 'none',
            fontFamily: T.font.Reading, fontSize: 17, lineHeight: '27px',
            color: T.color.PrimaryText,
            padding: 0, margin: 0,
          }}
        />
      </div>

      {/* Footer */}
      <div style={{
        flexShrink: 0,
        padding: '12px 28px 24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontFamily: T.font.UI, fontSize: 11, color: T.color.SubtleText,
      }}>
        <span>{wordCount} {wordCount === 1 ? 'word' : 'words'}</span>
        <span style={{ fontStyle: 'italic' }}>{mode === 'edit' ? 'Edits the saved entry' : "Saves to today's journal"}</span>
      </div>
    </div>
  );
}

// ─── INTEGRATION REGISTRY ────────────────────────────────────────────
// Each integration: id, name, group, visible (off by default), tagline,
// pulls (what the agent ingests), color, mark (compact SVG monogram),
// `provider` (mapping to the oauth-google provider key — only set for
// integrations that share the Google OAuth flow).
//
// MVP scope: Google only (gcal → google_calendar, gmail → google_gmail).
// All other entries are kept in the registry on purpose — Muxin wants the
// design preserved for later — but flipped to `visible: false` so they
// don't render in ConnectionsPage. Re-enable by setting `visible: true`.

// MarkBox — wraps a logo image in a uniform 38×38 rounded square. The `cream`
// flag draws a cream background behind logos that need contrast (dark/mono
// marks on dark surfaces). Most full-color logos render full-bleed transparent.
function MarkBox({ cream, padding = 0, children }) {
  return (
    <div style={{
      width: 38, height: 38, borderRadius: 10,
      background: cream ? '#FBF6EA' : 'transparent',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, overflow: 'hidden',
      padding,
    }}>{children}</div>
  );
}

// MarkImg — renders a logo at consistent size inside MarkBox.
function MarkImg({ src, alt, size = 32 }) {
  return (
    <img
      src={src}
      alt={alt}
      style={{ width: size, height: size, objectFit: 'contain', display: 'block' }}
      draggable={false}
    />
  );
}

const INTEGRATIONS = [
  {
    id: 'gcal', name: 'Google Calendar', group: 'Calendar', visible: true,
    provider: 'google_calendar',
    tagline: 'Today\'s events, attendees, and conflicts.',
    pulls: ['Event titles, times, attendees', 'Declined and rescheduled events'],
    Mark: () => <MarkBox><MarkImg src="assets/integrations/gcal.svg" alt="Google Calendar" size={38} /></MarkBox>,
  },
  {
    id: 'icloud', name: 'Apple Calendar', group: 'Calendar', visible: false,
    tagline: 'iCloud calendar — birthdays, family.',
    pulls: ['Event titles and times', 'Reminders flagged today'],
    Mark: () => (
      <MarkBox>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="#1F1B15">
          <path d="M17.05 12.04c-.03-2.94 2.4-4.36 2.51-4.43-1.37-2-3.5-2.27-4.26-2.3-1.81-.18-3.54 1.07-4.46 1.07-.93 0-2.35-1.04-3.86-1.01-1.99.03-3.82 1.16-4.84 2.93-2.06 3.58-.53 8.86 1.48 11.77.98 1.42 2.15 3.02 3.69 2.96 1.48-.06 2.04-.96 3.83-.96 1.78 0 2.29.96 3.86.93 1.59-.03 2.6-1.45 3.57-2.88 1.13-1.65 1.6-3.25 1.62-3.34-.04-.01-3.11-1.19-3.14-4.74zm-2.93-8.7c.81-1 1.36-2.39 1.21-3.78-1.17.05-2.59.79-3.43 1.78-.75.88-1.42 2.29-1.24 3.65 1.31.1 2.65-.66 3.46-1.65z"/>
        </svg>
      </MarkBox>
    ),
  },
  {
    id: 'outlook', name: 'Outlook · Microsoft 365', group: 'Calendar', visible: false,
    tagline: 'Work calendar and email in one.',
    pulls: ['Calendar events', 'Email threads marked Important'],
    Mark: () => <MarkBox><MarkImg src="assets/integrations/outlook.svg" alt="Outlook" size={32} /></MarkBox>,
  },
  {
    id: 'gmail', name: 'Gmail', group: 'Email', visible: true,
    provider: 'google_gmail',
    tagline: 'Open threads, reply pressure.',
    pulls: ['Threads waiting for your reply', 'Calendar invites in your inbox'],
    Mark: () => <MarkBox><MarkImg src="assets/integrations/gmail.svg" alt="Gmail" size={26} /></MarkBox>,
  },
  {
    id: 'slack', name: 'Slack', group: 'Communication', visible: false, optional: true,
    tagline: 'DM and mention pressure.',
    pulls: ['Direct messages awaiting reply', 'Channel mentions of your name'],
    Mark: () => <MarkBox><MarkImg src="assets/integrations/slack.svg" alt="Slack" size={26} /></MarkBox>,
  },
  {
    id: 'notion', name: 'Notion', group: 'Notes', visible: false, optional: true,
    tagline: 'Personal docs and project notes.',
    pulls: ['Pages tagged "todo" or "active"', 'Project status fields'],
    Mark: () => <MarkBox><MarkImg src="assets/integrations/notion.svg" alt="Notion" size={30} /></MarkBox>,
  },
  {
    id: 'github', name: 'GitHub', group: 'Code', visible: false, optional: true,
    tagline: 'Issues, PRs, and notifications.',
    pulls: ['Open PRs awaiting your review', 'Issues assigned to you'],
    Mark: () => <MarkBox><MarkImg src="assets/integrations/github.svg" alt="GitHub" size={30} /></MarkBox>,
  },
  // ── Hidden — registered but not shown in the page ──
  { id: 'discord',  name: 'Discord',         group: 'Communication', visible: false, tagline: 'Server activity and DMs.',     pulls: ['DMs', 'Mentions'],                       Mark: () => <MarkBox><MarkImg src="assets/integrations/discord.svg" alt="Discord" size={28} /></MarkBox> },
  { id: 'teams',    name: 'Microsoft Teams', group: 'Communication', visible: false, tagline: 'Work chat and meetings.',      pulls: ['Chats', 'Mentions', 'Meeting invites'], Mark: () => <MarkBox><MarkImg src="assets/integrations/teams.svg" alt="Microsoft Teams" size={28} /></MarkBox> },
  { id: 'ticktick', name: 'TickTick',        group: 'Tasks',         visible: false, tagline: 'Personal todos and habits.',   pulls: ['Today\'s tasks', 'Habit streaks'],      Mark: () => <MarkBox cream><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3DBD8B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></svg></MarkBox> },
  { id: 'obsidian', name: 'Obsidian',        group: 'Notes',         visible: false, tagline: 'Local markdown vault.',        pulls: ['Daily notes', 'Tagged pages'],          Mark: () => <MarkBox><MarkImg src="assets/integrations/obsidian.svg" alt="Obsidian" size={28} /></MarkBox> },
];

// ─── PROFILE BUTTON (bottom-left, persistent across all tenses) ────────
// Thin wrapper over <Avatar variant="button"> that adds the absolute
// positioning + dim transition the home screen needs.
function ProfileButton({ onClick, dim = false }) {
  return (
    <Avatar
      variant="button"
      onClick={onClick}
      ariaLabel="Open settings"
      style={{
        position: 'absolute', bottom: 22, left: 24,
        zIndex: 31,
        opacity: dim ? 0.3 : 1,
        transition: 'opacity 200ms ease',
      }}
    />
  );
}

// ─── OAUTH FLOW ───────────────────────────────────────────────────────
// Phases: 'consent' → 'auth' → 'success' | 'error'
//
// On 'consent' → user taps Allow:
//   1. POST {SUPABASE_URL}/functions/v1/oauth-google/start (with user JWT)
//   2. Receive { authUrl } — Google's consent screen URL
//   3. Open authUrl in a popup (preferred) or top-level redirect
//   4. The Edge Function /callback exchanges code → refresh_token → Vault →
//      oauth_connections row, then redirects back with `?connected=<provider>`
//   5. We poll the parent window (or watch the popup) for either:
//        - the popup posts a message back, or
//        - the popup closes and the URL has `?connected=...`
//   6. Once connected, kick sync-calendar / sync-email to backfill, then
//      flip phase to 'success'.
//
// Auth: oauth-google/start requires the browser's anon-session JWT (per
// reminders/index.ts pattern) — we read it from getSupabaseClient() and
// send as `Authorization: Bearer <token>`.
function OAuthFlow({ integration, onCancel, onConnected }) {
  const [phase, setPhase] = React.useState('consent');
  const [errorMsg, setErrorMsg] = React.useState(null);
  const popupRef = React.useRef(null);

  // Cleanup popup on unmount.
  React.useEffect(() => () => {
    if (popupRef.current && !popupRef.current.closed) {
      try { popupRef.current.close(); } catch (e) { /* ignore */ }
    }
  }, []);

  const startConnect = async () => {
    setPhase('auth');
    setErrorMsg(null);
    try {
      // Non-Google integrations: skip OAuth dance entirely. They're hidden
      // from ConnectionsPage anyway (visible:false), but guard here too in
      // case a future entry forgets to set `provider`.
      if (!integration.provider) {
        setPhase('success');
        setTimeout(() => onConnected && onConnected(integration.id), 600);
        return;
      }

      const cfg = window.INTENTLY_CONFIG || {};
      if (!cfg.supabaseUrl) throw new Error('SUPABASE_URL not configured');

      // Resolve the user's session JWT.
      const sb = window.getSupabaseClient && window.getSupabaseClient();
      if (!sb) throw new Error('supabase client unavailable');
      // Ensure the anonymous session exists before we ask for the access token.
      if (window.ensureAuthSession) await window.ensureAuthSession();
      const { data: sess } = await sb.auth.getSession();
      const accessToken = sess?.session?.access_token;
      if (!accessToken) throw new Error('no auth session — please reload');

      // Step 1: ask the Edge Function for the Google auth URL.
      const startUrl = new URL(`${cfg.supabaseUrl}/functions/v1/oauth-google/start`);
      startUrl.searchParams.set('provider', integration.provider);
      startUrl.searchParams.set('return_to', window.location.origin + window.location.pathname);
      const startRes = await fetch(startUrl.toString(), {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!startRes.ok) {
        const detail = await startRes.json().catch(() => ({}));
        throw new Error(detail?.error?.message || `start ${startRes.status}`);
      }
      const { authUrl } = await startRes.json();

      // Step 2: open Google's consent screen in a popup. If popups are
      // blocked, fall back to top-level navigation.
      const popup = window.open(authUrl, 'intently-oauth', 'width=520,height=640');
      popupRef.current = popup;
      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        // Popup blocked — top-level redirect (loses app state, but works).
        window.location.href = authUrl;
        return;
      }

      // Step 3: wait for the popup to come back to our origin with
      // ?connected=<provider>. Two signals; whichever wins resolves first:
      //   (a) postMessage from the popup (handleOauthReturn in index.html
      //       posts as soon as the redirected-back page loads — robust
      //       against the URL-strip race because it fires synchronously
      //       with the redirect-load).
      //   (b) URL-polling backstop, in case postMessage is blocked by some
      //       extension or the popup's IIFE ran before we could subscribe.
      const provider = integration.provider;
      const result = await new Promise((resolve, reject) => {
        const cleanup = () => {
          clearInterval(interval);
          window.removeEventListener('message', onMessage);
        };

        // (a) postMessage path.
        const onMessage = (ev) => {
          // Origin check: must come from the same app origin.
          if (ev.origin !== window.location.origin) return;
          const data = ev.data || {};
          if (data.type !== 'intently:oauth-callback') return;
          if (data.error) {
            cleanup();
            try { popup.close(); } catch (e) { /* ignore */ }
            reject(new Error(data.error));
            return;
          }
          if (data.provider === provider) {
            cleanup();
            try { popup.close(); } catch (e) { /* ignore */ }
            resolve(true);
          }
        };
        window.addEventListener('message', onMessage);

        // (b) URL-polling backstop. Reads popup.location.href once the
        // popup is back on our origin (cross-origin reads throw).
        const interval = setInterval(() => {
          if (!popup || popup.closed) {
            cleanup();
            // Popup closed without making it back to our origin — cancel.
            reject(new Error('connection cancelled'));
            return;
          }
          let href;
          try { href = popup.location.href; } catch { return; /* still on Google's origin */ }
          if (!href) return;
          try {
            const u = new URL(href);
            if (u.searchParams.get('connected') === provider) {
              cleanup();
              try { popup.close(); } catch (e) { /* ignore */ }
              resolve(true);
            } else if (u.searchParams.get('oauth_error')) {
              cleanup();
              try { popup.close(); } catch (e) { /* ignore */ }
              reject(new Error(u.searchParams.get('oauth_error') || 'oauth error'));
            }
          } catch { /* href not yet parseable; keep polling */ }
        }, 600);

        // Hard timeout — 5 min.
        setTimeout(() => {
          cleanup();
          reject(new Error('oauth timed out'));
        }, 5 * 60 * 1000);
      });
      if (!result) throw new Error('connection failed');

      // Step 4: kick the sync function to backfill. Sync errors don't fail
      // the connect — we surface them in console for now and still flip
      // to success (the row exists; sync can be retried).
      const syncFn = provider === 'google_calendar' ? 'sync-calendar' : 'sync-email';
      try {
        await fetch(`${cfg.supabaseUrl}/functions/v1/${syncFn}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` },
        });
      } catch (err) {
        console.warn(`[oauth] ${syncFn} backfill failed (continuing):`, err && err.message);
      }

      setPhase('success');
      setTimeout(() => onConnected && onConnected(integration.id), 700);
    } catch (err) {
      console.error('[oauth] connect failed:', err);
      setErrorMsg(err && err.message ? err.message : 'connection failed');
      setPhase('error');
    }
  };

  const M = integration.Mark;

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 75,
      background: 'rgba(31,27,21,0.55)',
      backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{
        width: '100%', maxWidth: 320,
        background: T.color.PrimarySurface,
        borderRadius: 18,
        boxShadow: '0 20px 60px rgba(31,27,21,0.32)',
        overflow: 'hidden',
      }}>
        {/* Header strip */}
        <div style={{
          padding: '18px 20px',
          background: T.color.SecondarySurface,
          borderBottom: `1px solid ${T.color.EdgeLine}`,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{
            width: 38, height: 38, borderRadius: 999,
            background: 'linear-gradient(135deg, #E8A25E 0%, #C66B3F 100%)',
            color: '#FBF6EA',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: T.font.Display, fontSize: 16, fontWeight: 600, fontStyle: 'italic',
          }}>I</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: T.font.UI, fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: T.color.SupportingText }}>Intently</div>
            <div style={{ fontFamily: T.font.UI, fontSize: 13, color: T.color.PrimaryText, marginTop: 2 }}>wants to connect to</div>
          </div>
        </div>

        {/* Animated connector */}
        <div style={{
          padding: '32px 20px 20px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <span style={{
              width: 56, height: 56, borderRadius: 14,
              background: 'linear-gradient(135deg, #E8A25E 0%, #C66B3F 100%)',
              color: '#FBF6EA',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: T.font.Display, fontSize: 26, fontWeight: 600, fontStyle: 'italic',
              boxShadow: '0 4px 14px rgba(198,107,63,0.32)',
            }}>I</span>

            <ConnectorDots phase={phase} />

            <span style={{
              transform: phase === 'success' ? 'scale(1.05)' : 'scale(1)',
              transition: 'transform 320ms cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}>
              <span style={{ display: 'block', filter: phase === 'success' ? 'none' : 'grayscale(0)' }}>
                <SizedMark Mark={M} size={56} />
              </span>
            </span>
          </div>

          <div style={{ textAlign: 'center', minHeight: 44 }}>
            <div style={{ fontFamily: T.font.Display, fontSize: 20, lineHeight: '24px', fontStyle: 'italic', fontWeight: 500, color: T.color.PrimaryText, letterSpacing: -0.3 }}>
              {phase === 'consent' && integration.name}
              {phase === 'auth'    && 'Connecting…'}
              {phase === 'success' && 'Connected'}
              {phase === 'error'   && 'Couldn’t connect'}
            </div>
            <div style={{ fontFamily: T.font.Reading, fontSize: 13, lineHeight: '19px', color: T.color.SupportingText, marginTop: 4 }}>
              {phase === 'consent' && integration.tagline}
              {phase === 'auth'    && 'Authorizing your account.'}
              {phase === 'success' && `Pulling in your ${integration.group.toLowerCase()} data.`}
              {phase === 'error'   && (errorMsg || 'Try again in a moment.')}
            </div>
          </div>
        </div>

        {/* What we read */}
        {phase === 'consent' && (
          <div style={{ padding: '0 20px 18px' }}>
            <div style={{
              padding: '12px 14px',
              background: T.color.SecondarySurface,
              border: `1px solid ${T.color.EdgeLine}`,
              borderRadius: 10,
            }}>
              <div style={{ fontFamily: T.font.UI, fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: T.color.SupportingText, marginBottom: 6 }}>The agent will read</div>
              {integration.pulls.map((p, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 8,
                  fontFamily: T.font.Reading, fontSize: 13, lineHeight: '19px', color: T.color.PrimaryText,
                  padding: '3px 0',
                }}>
                  <span style={{ width: 4, height: 4, borderRadius: 999, background: T.color.SubtleText, marginTop: 8, flexShrink: 0 }} />
                  {p}
                </div>
              ))}
            </div>
            <div style={{ fontFamily: T.font.UI, fontSize: 11, color: T.color.SubtleText, marginTop: 8, textAlign: 'center', fontStyle: 'italic' }}>
              Data stays on-device. Disconnect any time.
            </div>
          </div>
        )}

        {/* Buttons */}
        <div style={{ padding: '0 20px 20px', display: 'flex', gap: 8 }}>
          {phase === 'consent' && (
            <>
              <button onClick={onCancel} style={{
                flex: 1, padding: '12px 16px',
                background: 'transparent', border: `1px solid ${T.color.EdgeLine}`,
                borderRadius: 999, cursor: 'pointer',
                fontFamily: T.font.UI, fontSize: 14, fontWeight: 600, color: T.color.PrimaryText,
              }}>Cancel</button>
              <button onClick={startConnect} style={{
                flex: 2, padding: '12px 16px',
                background: T.color.PrimaryText, color: '#FBF6EA',
                border: 'none', borderRadius: 999, cursor: 'pointer',
                fontFamily: T.font.UI, fontSize: 14, fontWeight: 600,
              }}>Allow</button>
            </>
          )}
          {phase === 'error' && (
            <>
              <button onClick={onCancel} style={{
                flex: 1, padding: '12px 16px',
                background: 'transparent', border: `1px solid ${T.color.EdgeLine}`,
                borderRadius: 999, cursor: 'pointer',
                fontFamily: T.font.UI, fontSize: 14, fontWeight: 600, color: T.color.PrimaryText,
              }}>Close</button>
              <button onClick={startConnect} style={{
                flex: 2, padding: '12px 16px',
                background: T.color.PrimaryText, color: '#FBF6EA',
                border: 'none', borderRadius: 999, cursor: 'pointer',
                fontFamily: T.font.UI, fontSize: 14, fontWeight: 600,
              }}>Try again</button>
            </>
          )}
          {(phase === 'auth' || phase === 'success') && (
            <div style={{ flex: 1, height: 44 }} />
          )}
        </div>
      </div>
    </div>
  );
}

function SizedMark({ Mark, size }) {
  // Wrap a Mark element so it renders at a custom size.
  return (
    <span style={{
      display: 'inline-flex', width: size, height: size, borderRadius: 14,
      overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
    }}>
      <span style={{ transform: `scale(${size / 38})`, transformOrigin: 'center' }}>
        <Mark />
      </span>
    </span>
  );
}

function ConnectorDots({ phase }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: 6, height: 6, borderRadius: 999,
          background: phase === 'auth'    ? T.color.FocusObject
                    : phase === 'success' ? T.color.TintSageDeep
                    : T.color.SubtleText,
          opacity: phase === 'auth' ? 1 : 0.7,
          animation: phase === 'auth' ? `intentlyPulse 1s ${i * 0.18}s infinite ease-in-out` : 'none',
          transform: phase === 'success' ? 'scale(1.3)' : 'scale(1)',
          transition: 'transform 220ms ease, background 220ms ease',
        }} />
      ))}
    </div>
  );
}

// ─── CONNECTIONS PAGE ────────────────────────────────────────────────
function ConnectionsPage({ connected, onClose, onConnect, onDisconnect, onSync }) {
  // Group visible integrations
  const visible = INTEGRATIONS.filter(i => i.visible);
  const groups = {};
  visible.forEach(i => {
    if (!groups[i.group]) groups[i.group] = [];
    groups[i.group].push(i);
  });
  const groupOrder = ['Calendar', 'Email', 'Communication', 'Notes', 'Code'];

  const connectedCount = visible.filter(i => connected[i.id]).length;

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 70,
      background: T.color.PrimarySurface,
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        flexShrink: 0,
        padding: '14px 18px 12px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <button onClick={onClose} aria-label="Close" style={{
          width: 36, height: 36, borderRadius: 999,
          background: 'transparent', border: 'none', cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon.ArrowLeft size={20} color={T.color.PrimaryText} />
        </button>
        <div style={{ fontFamily: T.font.UI, fontSize: 11, fontWeight: 700, letterSpacing: 1.4, textTransform: 'uppercase', color: T.color.SupportingText }}>Settings</div>
        <span style={{ width: 36 }} />
      </div>

      {/* Title */}
      <div style={{ flexShrink: 0, padding: '4px 24px 18px' }}>
        <div style={{
          fontFamily: T.font.Display, fontSize: 36, lineHeight: '40px',
          fontStyle: 'italic', fontWeight: 500, color: T.color.PrimaryText, letterSpacing: -0.6,
        }}>Connections.</div>
        <div style={{
          marginTop: 6,
          fontFamily: T.font.Reading, fontSize: 14, lineHeight: '21px',
          color: T.color.SupportingText, maxWidth: 320,
        }}>
          The agent reads from these so it can speak about your day with context. {connectedCount} connected.
        </div>
      </div>

      {/* Groups */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 80px' }}>
        {groupOrder.filter(g => groups[g]).map(g => (
          <div key={g} style={{ marginBottom: 22 }}>
            <div style={{
              fontFamily: T.font.UI, fontSize: 10, fontWeight: 700, letterSpacing: 1.2,
              textTransform: 'uppercase', color: T.color.SupportingText,
              padding: '0 4px 8px',
            }}>{g}</div>
            <div style={{
              background: T.color.SecondarySurface,
              border: `1px solid ${T.color.EdgeLine}`,
              borderRadius: 14,
              overflow: 'hidden',
            }}>
              {groups[g].map((it, i) => (
                <IntegrationRow
                  key={it.id}
                  integration={it}
                  isConnected={!!connected[it.id]}
                  connection={connected[it.id]}
                  isLast={i === groups[g].length - 1}
                  onConnect={() => onConnect(it)}
                  onDisconnect={() => onDisconnect(it.id)}
                  onSync={onSync}
                />
              ))}
            </div>
          </div>
        ))}

        <div style={{
          marginTop: 8, padding: '14px 16px',
          background: T.color.TintLilac + '24',
          borderRadius: 12,
          fontFamily: T.font.Reading, fontSize: 13, lineHeight: '19px',
          color: T.color.SupportingText, fontStyle: 'italic',
          textAlign: 'center',
        }}>
          More integrations as we grow. The agent works without any of them — but it gets sharper with each one.
        </div>
      </div>
    </div>
  );
}

function IntegrationRow({ integration, isConnected, connection, isLast, onConnect, onDisconnect, onSync }) {
  const M = integration.Mark;
  const [syncing, setSyncing] = React.useState(false);
  const [syncStatus, setSyncStatus] = React.useState(null); // 'ok' | 'err' | null

  const handleSync = async () => {
    if (!integration.provider) return;
    setSyncing(true);
    setSyncStatus(null);
    try {
      const cfg = window.INTENTLY_CONFIG || {};
      if (!cfg.supabaseUrl) throw new Error('no supabaseUrl');
      const sb = window.getSupabaseClient && window.getSupabaseClient();
      if (!sb) throw new Error('no supabase client');
      const { data: sess } = await sb.auth.getSession();
      const accessToken = sess?.session?.access_token;
      if (!accessToken) throw new Error('no session');
      const syncFn = integration.provider === 'google_calendar' ? 'sync-calendar'
                   : integration.provider === 'google_gmail'    ? 'sync-email'
                   : null;
      if (!syncFn) throw new Error('no sync fn for provider');
      const res = await fetch(`${cfg.supabaseUrl}/functions/v1/${syncFn}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: '{}',
      });
      if (!res.ok) throw new Error(`${res.status}`);
      setSyncStatus('ok');
      if (onSync) onSync(integration.id);
    } catch (err) {
      console.warn('[IntegrationRow] sync failed:', err && err.message);
      setSyncStatus('err');
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncStatus(null), 3000);
    }
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '14px 14px',
      borderBottom: isLast ? 'none' : `1px solid ${T.color.EdgeLine}`,
    }}>
      <M />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontFamily: T.font.UI, fontSize: 14, fontWeight: 600, color: T.color.PrimaryText,
          }}>{integration.name}</span>
          {integration.optional && !isConnected && (
            <span style={{
              fontFamily: T.font.UI, fontSize: 9, fontWeight: 700, letterSpacing: 0.6,
              textTransform: 'uppercase', color: T.color.SubtleText,
              padding: '2px 6px', borderRadius: 4,
              background: T.color.PrimarySurface, border: `1px solid ${T.color.EdgeLine}`,
            }}>Optional</span>
          )}
        </div>
        <div style={{
          fontFamily: T.font.Reading, fontSize: 12, lineHeight: '17px',
          color: isConnected ? T.color.TintSageDeep : T.color.SupportingText,
          marginTop: 2,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          {isConnected && <span style={{ width: 6, height: 6, borderRadius: 999, background: T.color.TintSageDeep, flexShrink: 0 }} />}
          {isConnected
            ? (syncStatus === 'ok' ? 'Synced just now'
               : syncStatus === 'err' ? 'Sync failed — try again'
               : formatLastSync(connection))
            : integration.tagline}
        </div>
      </div>
      {/* Sync now button — only for connected Google providers */}
      {isConnected && integration.provider && (
        <button
          onClick={handleSync}
          disabled={syncing}
          aria-label="Sync now"
          style={{
            padding: '7px 10px',
            background: 'transparent',
            color: syncing ? T.color.SubtleText : T.color.SupportingText,
            border: `1px solid ${T.color.EdgeLine}`,
            borderRadius: 999, cursor: syncing ? 'default' : 'pointer',
            fontFamily: T.font.UI, fontSize: 12, fontWeight: 600, letterSpacing: 0.2,
            flexShrink: 0,
          }}
        >{syncing ? '…' : 'Sync'}</button>
      )}
      <button
        onClick={isConnected ? onDisconnect : onConnect}
        style={{
          padding: '7px 14px',
          background: isConnected ? 'transparent' : T.color.PrimaryText,
          color: isConnected ? T.color.SupportingText : '#FBF6EA',
          border: isConnected ? `1px solid ${T.color.EdgeLine}` : 'none',
          borderRadius: 999, cursor: 'pointer',
          fontFamily: T.font.UI, fontSize: 12, fontWeight: 600, letterSpacing: 0.2,
          flexShrink: 0,
        }}
      >{isConnected ? 'Disconnect' : 'Connect'}</button>
    </div>
  );
}

// ─── ONBOARDING CONNECT CARD ─────────────────────────────────────────
// Shown on Present once per session if no integrations connected. Dismissible.
function OnboardingConnectCard({ onOpen, onDismiss }) {
  return (
    <div style={{
      margin: '0 20px 14px',
      padding: '18px 18px 16px',
      background: 'linear-gradient(135deg, #FBF6EA 0%, #F5EBCF 100%)',
      border: `1px solid ${T.color.EdgeLine}`,
      borderRadius: 16,
      position: 'relative',
    }}>
      <button onClick={onDismiss} aria-label="Dismiss" style={{
        position: 'absolute', top: 10, right: 10,
        width: 24, height: 24, borderRadius: 999,
        background: 'rgba(31,27,21,0.06)', border: 'none', cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon.X size={12} color={T.color.SupportingText} />
      </button>
      <div style={{
        fontFamily: T.font.UI, fontSize: 10, fontWeight: 700, letterSpacing: 1.2,
        textTransform: 'uppercase', color: T.color.FocusObject, marginBottom: 6,
      }}>Make me sharper</div>
      <div style={{
        fontFamily: T.font.Display, fontSize: 18, lineHeight: '24px',
        fontStyle: 'italic', fontWeight: 500, color: T.color.PrimaryText, letterSpacing: -0.3,
        marginBottom: 4,
      }}>Connect a calendar.</div>
      <div style={{
        fontFamily: T.font.Reading, fontSize: 13, lineHeight: '19px',
        color: T.color.SupportingText, marginBottom: 12,
      }}>The brief and review get noticeably better when I can see what's on your day.</div>
      <button onClick={onOpen} style={{
        padding: '8px 16px',
        background: T.color.PrimaryText, color: '#FBF6EA',
        border: 'none', borderRadius: 999, cursor: 'pointer',
        fontFamily: T.font.UI, fontSize: 13, fontWeight: 600,
      }}>Connect</button>
    </div>
  );
}

// ─── CONNECTIONS HOOK ────────────────────────────────────────────────
// DB-backed: reads `oauth_connections` for the current user, keyed by
// integration id (gcal → google_calendar, gmail → google_gmail). Returns
// a `connected` map of {[id]: { last_synced_at }} so the UI can render
// "synced 4 min ago" from real data.
//
// `connect(id)` is now a no-op because the OAuthFlow component handles the
// real connect dance and writes the row server-side. After it succeeds, it
// calls `onConnected` which calls into here — we re-fetch to pick up the
// new row + last_synced_at. `disconnect(id)` calls the
// /functions/v1/oauth-google/disconnect endpoint.
function useConnections() {
  const [connected, setConnected] = React.useState({}); // {gcal: {last_synced_at: ...}}
  const [showOnboarding, setShowOnboarding] = React.useState(true);

  const idToProvider = React.useMemo(() => {
    const m = {};
    INTEGRATIONS.forEach(i => { if (i.provider) m[i.id] = i.provider; });
    return m;
  }, []);

  // Reverse: provider -> id (for mapping DB rows back to UI ids).
  const providerToId = React.useMemo(() => {
    const m = {};
    INTEGRATIONS.forEach(i => { if (i.provider) m[i.provider] = i.id; });
    return m;
  }, []);

  const refresh = React.useCallback(async () => {
    if (!window.getSupabaseClient) return;
    try {
      const sb = window.getSupabaseClient();
      // ensureAuthSession() makes sure RLS sees a uid().
      if (window.ensureAuthSession) await window.ensureAuthSession();
      const { data, error } = await sb.from('oauth_connections')
        .select('provider,last_synced_at,connected_at')
        .is('revoked_at', null);
      if (error) {
        console.warn('[useConnections] fetch failed:', error.message);
        return;
      }
      const map = {};
      (data || []).forEach(row => {
        const id = providerToId[row.provider];
        if (id) map[id] = { last_synced_at: row.last_synced_at, connected_at: row.connected_at };
      });
      setConnected(map);
    } catch (err) {
      console.warn('[useConnections] refresh error:', err && err.message);
    }
  }, [providerToId]);

  // Initial fetch.
  React.useEffect(() => { refresh(); }, [refresh]);

  // Re-fetch after the popup-callback redirect — index.html watches
  // ?connected= in the URL and dispatches an `intently:oauth-connected`
  // event so we can pick up the new row without a full reload.
  React.useEffect(() => {
    const handler = () => { refresh(); };
    window.addEventListener('intently:oauth-connected', handler);
    return () => window.removeEventListener('intently:oauth-connected', handler);
  }, [refresh]);

  const connect = React.useCallback((id) => {
    // The OAuthFlow already wrote the connection row server-side; re-fetch.
    refresh();
  }, [refresh]);

  const disconnect = React.useCallback(async (id) => {
    const provider = idToProvider[id];
    if (!provider) {
      // Non-Google integration — just remove locally for UI.
      setConnected(s => { const n = { ...s }; delete n[id]; return n; });
      return;
    }
    const cfg = window.INTENTLY_CONFIG || {};
    if (!cfg.supabaseUrl) return;
    try {
      const sb = window.getSupabaseClient && window.getSupabaseClient();
      if (!sb) return;
      const { data: sess } = await sb.auth.getSession();
      const accessToken = sess?.session?.access_token;
      if (!accessToken) return;
      await fetch(`${cfg.supabaseUrl}/functions/v1/oauth-google/disconnect`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ provider }),
      });
    } catch (err) {
      console.warn('[useConnections] disconnect failed:', err && err.message);
    } finally {
      // Optimistic local clear regardless of network outcome.
      setConnected(s => { const n = { ...s }; delete n[id]; return n; });
      // Re-sync from DB to capture the canonical state.
      refresh();
    }
  }, [idToProvider, refresh]);

  return {
    connected,
    showOnboarding,
    connect,
    disconnect,
    refresh,
    dismissOnboarding: () => setShowOnboarding(false),
  };
}

// Render a "synced 4 min ago" or "just connected" string from a connection
// row's last_synced_at. Returns "Connected" if no sync has happened yet.
function formatLastSync(connection) {
  if (!connection || typeof connection !== 'object') return 'Connected';
  const ts = connection.last_synced_at || connection.connected_at;
  if (!ts) return 'Connected';
  const diffMs = Date.now() - new Date(ts).getTime();
  if (Number.isNaN(diffMs) || diffMs < 0) return 'Connected';
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Connected · just synced';
  if (mins < 60) return `Connected · synced ${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Connected · synced ${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `Connected · synced ${days}d ago`;
}

Object.assign(window, {
  JournalComposer, ConnectionsPage, OAuthFlow, ProfileButton, OnboardingConnectCard,
  INTEGRATIONS, useConnections, formatLastSync,
});
