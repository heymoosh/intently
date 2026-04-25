// intently-hero-affordance.jsx — The persistent voice/chat/quick-action control.
// Four states: Idle, Listening (full-screen takeover), Processing, Expanded.

function VoiceWaveform({ color = '#FBF8F2', amplitude = 1 }) {
  // Animated wave using CSS keyframes — purely decorative; the text
  // transcription is the accessible live region.
  const bars = 18;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, height: 48 }}>
      {Array.from({ length: bars }).map((_, i) => {
        const mid = (bars - 1) / 2;
        const dist = Math.abs(i - mid) / mid;
        const h = (8 + (1 - dist) * 32) * amplitude;
        return (
          <span key={i} style={{
            width: 4, height: h, borderRadius: 2, background: color,
            opacity: 0.85 - dist * 0.35,
            animation: `intentlyWave 1.2s ${i * 60}ms ease-in-out infinite alternate`,
          }} />
        );
      })}
    </div>
  );
}

// Tap = voice; press-and-hold = menu. Always bottom-right.
// Press-hold behaviour: hold to open menu, drag up to a button, RELEASE over it to activate.
// If you release still over the mic → plain tap → listening.
function HeroAffordance({ state = 'idle', onChange, onPick }) {
  // state: 'idle' | 'listening' | 'processing' | 'expanded'
  const holdTimer = React.useRef(null);
  const openedByHold = React.useRef(false);
  const activeKey = React.useRef(null);
  const [hovered, setHovered] = React.useState(false);
  const [activeHover, setActiveHover] = React.useState(null);

  const isListening = state === 'listening';
  const isProcessing = state === 'processing';
  const isExpanded = state === 'expanded';
  const isChat = state === 'chat';

  // Ordered top→bottom per brief. Reset (somatic) hidden for hackathon.
  // 'Jump to chat' removed — Type instead already opens the chat thread,
  // so it was redundant. The third slot is held for the somatic-reset
  // affordance once it's spec'd.
  const items = [
    { key: 'journal', label: 'New journal entry', icon: Icon.Feather },
    { key: 'text',    label: 'Type instead',      icon: Icon.Keyboard },
  ];

  const activate = (key) => {
    if (!onChange) return;
    // Give the host first right of refusal — it can route to a dedicated screen
    // (e.g. 'journal' → journal composer) instead of the default chat handoff.
    if (onPick && onPick(key)) return;
    if (key === 'text' || key === 'chat') onChange('chat');
    else onChange('idle');
  };

  // Hit-testing during hold: pointermove fires while the mic retains capture.
  const handlePointerMove = (e) => {
    if (!isExpanded && !openedByHold.current) return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const btn = el && el.closest && el.closest('[data-hero-menu-item]');
    const key = btn ? btn.getAttribute('data-hero-menu-item') : null;
    if (key !== activeKey.current) {
      activeKey.current = key;
      setActiveHover(key);
    }
  };

  const onMicPointerDown = (e) => {
    if (isProcessing) return;
    e.currentTarget.setPointerCapture && e.currentTarget.setPointerCapture(e.pointerId);
    openedByHold.current = false;
    activeKey.current = null;
    setActiveHover(null);
    clearTimeout(holdTimer.current);
    holdTimer.current = setTimeout(() => {
      openedByHold.current = true;
      holdTimer.current = null;
      onChange && onChange('expanded');
    }, 320);
  };

  const onMicPointerUp = () => {
    const wasHold = openedByHold.current;
    const pendingTap = holdTimer.current != null;
    clearTimeout(holdTimer.current);
    holdTimer.current = null;

    if (wasHold) {
      // Released during hold — activate whichever item the finger is over, if any.
      const key = activeKey.current;
      openedByHold.current = false;
      activeKey.current = null;
      setActiveHover(null);
      if (key) {
        activate(key);
      } else {
        // Released over empty space / over the mic → dismiss menu.
        onChange && onChange('idle');
      }
      return;
    }

    if (pendingTap) {
      // Short tap — start voice.
      onChange && onChange('listening');
    }
  };

  const onMicPointerCancel = () => {
    clearTimeout(holdTimer.current);
    holdTimer.current = null;
    openedByHold.current = false;
    activeKey.current = null;
    setActiveHover(null);
    if (isExpanded) onChange && onChange('idle');
  };

  if (isListening) {
    return <HeroListening onDone={() => onChange && onChange('chat')} />;
  }
  if (isChat) {
    return <HeroChat onDone={() => onChange && onChange('idle')} onMic={() => onChange && onChange('listening')} />;
  }

  return (
    <div aria-hidden={false} style={{
      position: 'absolute', right: 20, bottom: 24, zIndex: 40,
      display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10,
      pointerEvents: 'auto',
    }}>
      {/* Expanded menu stack — buttons are *targets* during the held gesture, not clickable on their own. */}
      {isExpanded && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8,
          }}>
          {items.map((it, i) => {
            const IC = it.icon;
            const isActive = activeHover === it.key;
            return (
              <div
                key={it.key}
                data-hero-menu-item={it.key}
                onClick={() => activate(it.key)}  // fallback for mouse users who click
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 10,
                  height: 44, padding: '0 16px 0 14px',
                  background: isActive ? T.color.PrimaryText : T.color.SecondarySurface,
                  border: `1px solid ${isActive ? T.color.PrimaryText : T.color.EdgeLine}`,
                  borderRadius: 999,
                  boxShadow: isActive
                    ? '0 10px 24px rgba(31,27,21,0.22), 0 0 0 4px rgba(83,122,79,0.18)'
                    : T.shadow.Raised,
                  fontFamily: T.font.UI, fontSize: 15, fontWeight: 500,
                  color: isActive ? T.color.InverseText : T.color.PrimaryText,
                  cursor: 'pointer',
                  animationDelay: `${i * 40}ms`,
                  transform: isActive ? 'scale(1.04)' : 'scale(1)',
                  transition: `background 120ms ${T.motion.Standard}, transform 120ms ${T.motion.Spring}, box-shadow 120ms ${T.motion.Standard}`,
                  userSelect: 'none', touchAction: 'none',
                }}
              >
                <IC size={16} color={isActive ? T.color.InverseText : T.color.SupportingText} />
                {it.label}
              </div>
            );
          })}
        </div>
      )}
      {/* The disc */}
      <button
        aria-label={isProcessing ? 'Agent working' : 'Start voice — hold for options'}
        onPointerDown={onMicPointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={onMicPointerUp}
        onPointerCancel={onMicPointerCancel}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width: 64, height: 64, borderRadius: 999,
          background: isProcessing ? T.color.SunkenSurface : T.color.PrimaryText,
          border: isExpanded ? `2px solid ${T.color.FocusObject}` : 'none',
          boxShadow: isExpanded
            ? '0 0 0 6px rgba(83,122,79,0.15), 0 10px 28px rgba(31,27,21,0.18)'
            : '0 8px 22px rgba(31,27,21,0.22), 0 2px 6px rgba(31,27,21,0.08)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', position: 'relative', overflow: 'hidden',
          transition: `transform 160ms ${T.motion.Standard}, background 240ms ${T.motion.Standard}`,
          transform: hovered ? 'scale(1.04)' : 'scale(1)',
          touchAction: 'none', userSelect: 'none',
        }}
      >
        {isProcessing ? (
          <ProcessingArc />
        ) : (
          <Icon.Mic size={26} color={T.color.InverseText} stroke={2} />
        )}
        {/* Subtle breathing ring — idle only, signals "alive but not demanding" */}
        {state === 'idle' && (
          <span style={{
            position: 'absolute', inset: -6, borderRadius: 999,
            border: `1px solid ${T.color.FocusObject}`,
            opacity: 0.18,
            animation: 'intentlyBreath 3.6s ease-in-out infinite',
            pointerEvents: 'none',
          }} />
        )}
      </button>
    </div>
  );
}

function ProcessingArc() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" style={{ animation: 'intentlySpin 1.4s linear infinite' }}>
      <circle cx="15" cy="15" r="11" stroke={T.color.EdgeLine} strokeWidth="2.5" fill="none" />
      <path d="M15 4 A11 11 0 0 1 26 15" stroke={T.color.FocusObject} strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

// Full-screen takeover — "big empty space feels like an invitation to fill it."
function HeroListening({ onDone }) {
  const [t, setT] = React.useState('');
  const full = "I'm moving the Thursday pitch review to Friday morning — Anya's out Thursday afternoon and I want a clear head for it.";
  React.useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      i += 2;
      setT(full.slice(0, i));
      if (i >= full.length) clearInterval(id);
    }, 45);
    return () => clearInterval(id);
  }, []);
  return (
    <div style={{
      position: 'absolute', inset: 0, background: T.color.PrimarySurface,
      zIndex: 50, display: 'flex', flexDirection: 'column',
      }}>
      <div style={{ flex: '0 0 auto', paddingTop: 60, paddingInline: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={onDone} aria-label="Close voice" style={{
          width: 44, height: 44, borderRadius: 999, background: 'transparent',
          border: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: T.color.SupportingText, margin: -8,
        }}>
          <Icon.X size={22} color={T.color.SupportingText} />
        </button>
        <div style={{
          fontFamily: T.font.UI, fontSize: 12, fontWeight: 600, letterSpacing: 0.8,
          textTransform: 'uppercase', color: T.color.SupportingText,
          display: 'inline-flex', alignItems: 'center', gap: 6,
        }}>
          <span style={{
            width: 8, height: 8, borderRadius: 999, background: T.color.FocusObject,
            animation: 'intentlyPulse 1.4s ease-in-out infinite',
          }} />
          Listening
        </div>
        <div style={{ width: 44, height: 44 }} />
      </div>
      {/* Big empty space with the transcript softly rendered — Gemini-esque invitation */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '0 28px',
      }}>
        <div style={{
          fontFamily: T.font.Display, fontSize: 30, lineHeight: '42px', fontWeight: 400,
          color: t ? T.color.PrimaryText : T.color.SubtleText,
          letterSpacing: -0.3, fontStyle: t ? 'normal' : 'italic',
          minHeight: 168,
        }}>
          {t || "I'm listening."}
          {t && t.length < full.length && <span style={{
            display: 'inline-block', width: 2, height: 28, background: T.color.FocusObject,
            verticalAlign: -4, marginLeft: 3, animation: 'intentlyPulse 1s step-end infinite',
          }} />}
        </div>
      </div>
      {/* Bottom: waveform + stop. Equal-status text input sits left. */}
      <div style={{
        padding: '0 24px 36px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: 16,
      }}>
        <button aria-label="Type instead" style={{
          width: 48, height: 48, borderRadius: 999,
          background: T.color.SecondarySurface, border: `1px solid ${T.color.EdgeLine}`,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: T.color.SupportingText,
        }}>
          <Icon.Keyboard size={20} color={T.color.SupportingText} />
        </button>
        <div style={{
          flex: 1, height: 64, borderRadius: 32,
          background: T.color.SecondarySurface, border: `1px solid ${T.color.EdgeLine}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <VoiceWaveform color={T.color.FocusObject} amplitude={0.85} />
        </div>
        <button onClick={onDone} aria-label="Stop and send" style={{
          width: 64, height: 64, borderRadius: 999,
          background: T.color.FocusObject, border: 'none',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: T.color.InverseText,
          boxShadow: '0 0 0 6px rgba(83,122,79,0.18), 0 8px 22px rgba(31,27,21,0.2)',
        }}>
          <span style={{ width: 22, height: 22, background: T.color.InverseText, borderRadius: 4 }} />
        </button>
      </div>
    </div>
  );
}

// ─── HERO CHAT ─── full-screen chat surface.
// Mixed text/voice input; inline confirmation cards with Undo for agent actions;
// quiet back-and-forth with the agent after a brief or a voice capture.
function HeroChat({ onDone, onMic }) {
  const [draft, setDraft] = React.useState('');
  const scrollRef = React.useRef(null);
  // Thread seeded from the voice capture the user just finished.
  const thread = [
    { kind: 'user', t: "I'm moving the Thursday pitch review to Friday morning — Anya's out Thursday afternoon and I want a clear head for it." },
    { kind: 'agent', t: 'Done. I moved it to Friday 9:30, kept the 45-min block, and sent the update to Anya and Raf.' },
    { kind: 'action', icon: 'calendar', title: 'Pitch review → Fri Apr 25, 9:30 AM', meta: 'Work Calendar · 2 guests notified' },
    { kind: 'agent', t: "Raf's reply came back: he can't do Friday morning. Want me to ask him for a Friday-afternoon slot, or keep the meeting with just Anya?" },
    { kind: 'user', t: 'Just Anya is fine. Send Raf the deck and ask for async notes.' },
    { kind: 'agent', t: 'Drafted this for Raf — say the word and I send it.' },
    { kind: 'action', icon: 'mail', title: 'Draft: "Deck for async review"', meta: 'To: Raf · Subject + 2-paragraph body ready', draft: true },
  ];
  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, []);
  return (
    <div style={{
      position: 'absolute', inset: 0, background: T.color.PrimarySurface,
      zIndex: 50, display: 'flex', flexDirection: 'column',
      }}>
      {/* Header */}
      <div style={{ flex: '0 0 auto', paddingTop: 60, padding: '60px 20px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={onDone} aria-label="Close chat" style={{
          width: 44, height: 44, borderRadius: 999, background: 'transparent',
          border: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: T.color.SupportingText, margin: -8,
        }}>
          <Icon.X size={22} color={T.color.SupportingText} />
        </button>
        <div style={{
          fontFamily: T.font.UI, fontSize: 12, fontWeight: 700, letterSpacing: 0.8,
          textTransform: 'uppercase', color: T.color.SupportingText,
        }}>Chat</div>
        <div style={{ width: 44, height: 44 }} />
      </div>

      {/* Thread */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '8px 20px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {thread.map((m, i) => {
          if (m.kind === 'user') {
            return (
              <div key={i} style={{ alignSelf: 'flex-end', maxWidth: '82%' }}>
                <div style={{
                  padding: '11px 14px', borderRadius: 18, borderTopRightRadius: 6,
                  background: T.color.PrimaryText, color: T.color.InverseText,
                  fontFamily: T.font.Reading, fontSize: 15, lineHeight: '22px',
                }}>{m.t}</div>
              </div>
            );
          }
          if (m.kind === 'agent') {
            return (
              <div key={i} style={{ alignSelf: 'flex-start', maxWidth: '88%' }}>
                <div style={{
                  padding: '11px 14px', borderRadius: 18, borderTopLeftRadius: 6,
                  background: T.color.SecondarySurface, border: `1px solid ${T.color.EdgeLine}`,
                  color: T.color.PrimaryText,
                  fontFamily: T.font.Reading, fontSize: 15, lineHeight: '22px',
                }}>{m.t}</div>
              </div>
            );
          }
          // kind === 'action' — inline confirmation card with Undo / Send
          const IC = Icon[m.icon === 'mail' ? 'Mail' : 'Calendar'] || Icon.Sparkles;
          return (
            <div key={i} style={{ alignSelf: 'flex-start', maxWidth: '92%', width: '92%' }}>
              <div style={{
                padding: 14, borderRadius: 14,
                background: T.color.SecondarySurface, border: `1px dashed ${T.color.EdgeLine}`,
                display: 'flex', flexDirection: 'column', gap: 10,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: m.draft ? T.color.TintLilac + '33' : T.color.TintSage,
                    border: `1px solid ${m.draft ? T.color.TintLilac : T.color.TintSageDeep}`,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <IC size={16} color={m.draft ? T.color.TintLilac : T.color.TintMoss} />
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: T.font.UI, fontSize: 13, fontWeight: 600, color: T.color.PrimaryText }}>{m.title}</div>
                    <div style={{ fontFamily: T.font.UI, fontSize: 11, color: T.color.SupportingText, marginTop: 2 }}>{m.meta}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  {m.draft ? (
                    <>
                      <button style={{
                        height: 32, padding: '0 12px', borderRadius: 999,
                        background: 'transparent', border: `1px solid ${T.color.EdgeLine}`,
                        fontFamily: T.font.UI, fontSize: 12, fontWeight: 600, color: T.color.SupportingText, cursor: 'pointer',
                      }}>Edit</button>
                      <button style={{
                        height: 32, padding: '0 14px', borderRadius: 999,
                        background: T.color.PrimaryText, color: T.color.InverseText, border: 'none',
                        fontFamily: T.font.UI, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                      }}>
                        <Icon.Check size={12} color={T.color.InverseText} />
                        Send
                      </button>
                    </>
                  ) : (
                    <button style={{
                      height: 32, padding: '0 12px', borderRadius: 999,
                      background: 'transparent', border: `1px solid ${T.color.EdgeLine}`,
                      fontFamily: T.font.UI, fontSize: 12, fontWeight: 600, color: T.color.SupportingText, cursor: 'pointer',
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                    }}>
                      <Icon.Undo size={12} color={T.color.SupportingText} />
                      Undo
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Composer — equal-status voice + type */}
      <div style={{
        padding: '10px 16px 24px', display: 'flex', alignItems: 'center', gap: 10,
        borderTop: `1px solid ${T.color.EdgeLine}`, background: T.color.PrimarySurface,
      }}>
        <div style={{
          flex: 1, minHeight: 48, borderRadius: 24,
          background: T.color.SecondarySurface, border: `1px solid ${T.color.EdgeLine}`,
          display: 'flex', alignItems: 'center', padding: '6px 6px 6px 16px', gap: 8,
        }}>
          <input
            value={draft} onChange={e => setDraft(e.target.value)}
            placeholder="Say more, or ask a question…"
            style={{
              flex: 1, border: 'none', background: 'transparent', outline: 'none',
              fontFamily: T.font.Reading, fontSize: 15, color: T.color.PrimaryText,
            }}
          />
          <button onClick={onMic} aria-label="Voice" style={{
            width: 36, height: 36, borderRadius: 999, border: 'none',
            background: T.color.PrimaryText, color: T.color.InverseText,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}>
            <Icon.Mic size={16} color={T.color.InverseText} />
          </button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { HeroAffordance, HeroListening, HeroChat, VoiceWaveform, ProcessingArc });
