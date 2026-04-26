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
// Press-hold behaviour (sticky): long-press opens the menu and LEAVES it open after release.
// Tap an option to select. Tap outside (or press Escape) to dismiss. Short-tap (release before
// the long-press threshold) starts voice recording, unchanged.
function HeroAffordance({ state = 'idle', onChange, onPick, seedTranscript = '', onTranscriptConsumed }) {
  // state: 'idle' | 'listening' | 'processing' | 'expanded' | 'chat'
  const holdTimer = React.useRef(null);
  const openedByHold = React.useRef(false);
  // Stamps the pointerdown that triggered the long-press, so the document-level
  // dismiss listener can ignore the very same pointerdown that just opened the menu.
  const openingPointerId = React.useRef(null);
  const containerRef = React.useRef(null);
  const [hovered, setHovered] = React.useState(false);

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

  const onMicPointerDown = (e) => {
    if (isProcessing) return;
    // If the menu is already open and the user presses the mic, treat the
    // press as "dismiss the menu". The pendingTap branch on pointerup still
    // fires `onChange('listening')` for an in-menu short-tap, which transitions
    // out of 'expanded' — consistent toggle behavior.
    openedByHold.current = false;
    openingPointerId.current = null;
    clearTimeout(holdTimer.current);
    holdTimer.current = setTimeout(() => {
      openedByHold.current = true;
      openingPointerId.current = e.pointerId != null ? e.pointerId : 'synthetic';
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
      // Sticky open: release does NOT close the menu. The user dismisses by
      // tapping an option (handled by the menu items' onClick), tapping outside
      // (handled by the document-level pointerdown effect below), or pressing
      // Escape (handled by the keydown effect below).
      openedByHold.current = false;
      return;
    }

    if (pendingTap) {
      // Short tap — start voice.
      onChange && onChange('listening');
    }
  };

  const onMicPointerCancel = () => {
    // Cancel the pending long-press timer if the gesture was aborted before
    // the menu opened. Once the menu IS open (sticky), don't auto-dismiss on
    // cancel — that would defeat the sticky semantics on touch devices that
    // synthesize a cancel after the system pointer-capture timeout.
    clearTimeout(holdTimer.current);
    holdTimer.current = null;
    openedByHold.current = false;
  };

  // Sticky-menu dismissal: outside-tap + Escape. Both run only while the
  // menu is in the 'expanded' state, attaching listeners on enter and
  // tearing them down on exit. The outside-tap listener has to defer one
  // tick so the very pointerdown that opened the menu doesn't immediately
  // close it — we stamp the opening pointer's id and ignore the matching
  // pointerdown event.
  React.useEffect(() => {
    if (!isExpanded) return;
    const openingId = openingPointerId.current;
    const onDocPointerDown = (e) => {
      // Skip the synthetic/duplicate pointerdown that just opened the menu.
      if (openingId != null && e.pointerId === openingId) {
        openingPointerId.current = null;
        return;
      }
      const node = containerRef.current;
      if (node && node.contains(e.target)) return;
      onChange && onChange('idle');
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onChange && onChange('idle');
      }
    };
    document.addEventListener('pointerdown', onDocPointerDown, true);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onDocPointerDown, true);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isExpanded, onChange]);

  if (isListening) {
    return <HeroListening onDone={(transcript) => {
      // Empty transcript = X-close (no routing); non-empty = Stop (route to chat with seed).
      if (!onChange) return;
      if (transcript && transcript.trim()) onChange('chat', { transcript });
      else onChange('idle');
    }} />;
  }
  if (isChat) {
    return <HeroChat
      seedTranscript={seedTranscript}
      onTranscriptConsumed={onTranscriptConsumed}
      onDone={() => onChange && onChange('idle')}
      onMic={() => onChange && onChange('listening')}
    />;
  }

  return (
    <>
      {/* Sticky-open scrim — tells the user "this menu is held open, tap anywhere
          to dismiss". Only visible while expanded. The brief 320ms hold-to-open
          window has no scrim (the menu isn't visible yet during the hold), which
          gives the visual distinction CR-07 asks for: held = invisible timer,
          sticky = scrim + menu. */}
      {isExpanded && (
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, zIndex: 39,
          background: 'rgba(31,27,21,0.18)',
          animation: `intentlyScrimIn 160ms ${T.motion.Standard} both`,
          pointerEvents: 'none',
        }} />
      )}
      <div ref={containerRef} aria-hidden={false} style={{
        position: 'absolute', right: 20, bottom: 24, zIndex: 40,
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10,
        pointerEvents: 'auto',
      }}>
      {/* Expanded menu stack — sticky open. Each item is a real clickable
          target; tap selects + dismisses (activate transitions out of 'expanded'). */}
      {isExpanded && (
        <div role="menu" aria-label="Hero quick actions" style={{
          display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8,
          }}>
          {items.map((it, i) => {
            const IC = it.icon;
            return (
              <button
                key={it.key}
                role="menuitem"
                data-hero-menu-item={it.key}
                onClick={() => activate(it.key)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 10,
                  height: 44, padding: '0 16px 0 14px',
                  background: T.color.SecondarySurface,
                  border: `1px solid ${T.color.EdgeLine}`,
                  borderRadius: 999,
                  boxShadow: T.shadow.Raised,
                  fontFamily: T.font.UI, fontSize: 15, fontWeight: 500,
                  color: T.color.PrimaryText,
                  cursor: 'pointer',
                  animation: `intentlyMenuItemIn 160ms ${T.motion.Spring} ${i * 40}ms both`,
                  transition: `background 120ms ${T.motion.Standard}, transform 120ms ${T.motion.Spring}, box-shadow 120ms ${T.motion.Standard}`,
                  userSelect: 'none',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = T.color.PrimaryText;
                  e.currentTarget.style.color = T.color.InverseText;
                  e.currentTarget.style.borderColor = T.color.PrimaryText;
                  e.currentTarget.style.transform = 'scale(1.04)';
                  const ic = e.currentTarget.querySelector('svg');
                  if (ic) ic.style.color = T.color.InverseText;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = T.color.SecondarySurface;
                  e.currentTarget.style.color = T.color.PrimaryText;
                  e.currentTarget.style.borderColor = T.color.EdgeLine;
                  e.currentTarget.style.transform = 'scale(1)';
                  const ic = e.currentTarget.querySelector('svg');
                  if (ic) ic.style.color = T.color.SupportingText;
                }}
              >
                <IC size={16} color={T.color.SupportingText} />
                {it.label}
              </button>
            );
          })}
        </div>
      )}
      {/* The disc */}
      <button
        aria-label={isProcessing ? 'Agent working' : (isExpanded ? 'Close menu' : 'Start voice — hold for options')}
        aria-expanded={isExpanded}
        aria-haspopup="menu"
        onPointerDown={onMicPointerDown}
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
          transition: `transform 160ms ${T.motion.Standard}, background 240ms ${T.motion.Standard}, box-shadow 200ms ${T.motion.Standard}`,
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
    </>
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
// Wired to the live Web Speech API via window.useVoiceInput (web/lib/voice.js).
function HeroListening({ onDone }) {
  const { state, start, stop } = useVoiceInput();
  const stopRequested = React.useRef(false);
  const closeRequested = React.useRef(false);

  // Auto-start the mic when the listening surface mounts.
  React.useEffect(() => { start(); }, [start]);

  // Derive what to display from the voice-state machine.
  const t =
    state.kind === 'listening' ? state.interim :
    state.kind === 'stopped'   ? state.transcript : '';
  const placeholder =
    state.kind === 'unsupported' ? "Voice isn't supported here. Try Chrome."
    : state.kind === 'error'     ? state.message
    : "I'm listening.";
  const isListening = state.kind === 'listening';

  // Stop button — wait for the recognizer to flush the final transcript
  // (state.kind transitions to 'stopped' or 'idle'), then route it onward.
  const handleStop = React.useCallback(() => {
    stopRequested.current = true;
    stop();
  }, [stop]);

  // Close (X) button — abort and exit without routing the transcript.
  const handleClose = React.useCallback(() => {
    closeRequested.current = true;
    stop();
    if (onDone) onDone('');
  }, [stop, onDone]);

  // Watch for the recognizer reaching a terminal state after Stop was pressed,
  // then forward the captured transcript to the parent (which decides routing).
  React.useEffect(() => {
    if (!stopRequested.current || closeRequested.current) return;
    if (state.kind === 'stopped' || state.kind === 'idle') {
      const transcript = state.kind === 'stopped' ? state.transcript : '';
      stopRequested.current = false;
      if (onDone) onDone(transcript);
    }
  }, [state, onDone]);

  return (
    <div style={{
      position: 'absolute', inset: 0, background: T.color.PrimarySurface,
      zIndex: 50, display: 'flex', flexDirection: 'column',
      }}>
      <div style={{ flex: '0 0 auto', paddingTop: 60, paddingInline: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={handleClose} aria-label="Close voice" style={{
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
          {t || placeholder}
          {isListening && t && <span style={{
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
        <button onClick={handleStop} aria-label="Stop and send" style={{
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
function HeroChat({ onDone, onMic, seedTranscript = '', onTranscriptConsumed }) {
  const [draft, setDraft] = React.useState('');
  const [thread, setThread] = React.useState([]);
  const [pending, setPending] = React.useState(false);
  const scrollRef = React.useRef(null);
  const seededRef = React.useRef(false);

  // Build a chat-mode input for callMaProxy. Wraps the user's question with a
  // short instruction so the daily-brief agent (which has full user context)
  // responds conversationally instead of drafting a plan. Includes a few
  // recent turns so it feels like a real thread, not single-shot prompts.
  const buildChatInput = React.useCallback((userText, history) => {
    const recent = (history || []).slice(-6).map((m) => {
      const role = m.kind === 'user' ? 'User' : (m.kind === 'agent' ? 'You' : null);
      return role ? `${role}: ${m.t}` : null;
    }).filter(Boolean).join('\n');
    return [
      "The user is chatting with you outside the brief / review flow — this is an ad-hoc conversation, not a planning session.",
      "Respond naturally in 1-3 sentences. Speak directly to them. Use what you know about their goals/projects/today's plan when it's relevant; otherwise just answer the question.",
      "Do not generate a daily plan, do not emit a JSON tail, do not propose a brief. Just talk.",
      '',
      recent ? `Recent conversation:\n${recent}\n` : '',
      `User just said: "${userText}"`,
    ].filter(Boolean).join('\n');
  }, []);

  // Send a user utterance: classify-as-reminder first (cheap edge function),
  // then if not a reminder, fan out to a real LLM turn via daily-brief in
  // chat mode. Appends both turns to the thread; falls back to a generic
  // acknowledgement only if BOTH the classify call AND the LLM call fail.
  const sendUtterance = React.useCallback(async (text) => {
    const trimmed = (text || '').trim();
    if (!trimmed) return;
    setThread((prev) => [...prev, { kind: 'user', t: trimmed }]);
    setPending(true);
    try {
      const cls = window.classifyTranscript ? await window.classifyTranscript(trimmed) : null;
      if (cls && cls.classified === true && cls.reminder) {
        const when = cls.reminder.remind_on || 'soon';
        setThread((prev) => [...prev, { kind: 'agent', t: `Got it. I'll surface "${cls.reminder.text}" on ${when}.` }]);
      } else if (window.callMaProxy) {
        // Live LLM turn. Single-turn for now — recent-thread history can be
        // added via a session id once the proxy + agent support persistence.
        const input = buildChatInput(trimmed, []);
        try {
          const r = await window.callMaProxy({ skill: 'daily-brief', input });
          let reply = (r && r.finalText) || '';
          // Strip any JSON tail that the brief agent might still emit (it's
          // contract-bound to the brief Output shape, even when prompted to chat).
          reply = reply.replace(/```json[\s\S]*?```\s*$/, '').trim();
          if (!reply) reply = "I'm here. Say more?";
          setThread((prev) => [...prev, { kind: 'agent', t: reply }]);
        } catch (e) {
          setThread((prev) => [...prev, { kind: 'agent', t: "I couldn't reach the model just now. Try again in a moment." }]);
        }
      } else {
        setThread((prev) => [...prev, { kind: 'agent', t: "I'm here in chat-only mode (the model proxy isn't loaded). Try again from a deployed build." }]);
      }
    } finally {
      setPending(false);
    }
  }, [buildChatInput]);

  // Seed the thread from a voice capture the user just finished, exactly once.
  React.useEffect(() => {
    if (seededRef.current) return;
    if (!seedTranscript || !seedTranscript.trim()) return;
    seededRef.current = true;
    sendUtterance(seedTranscript);
    if (onTranscriptConsumed) onTranscriptConsumed();
  }, [seedTranscript, sendUtterance, onTranscriptConsumed]);

  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [thread, pending]);

  const submitDraft = () => {
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    sendUtterance(text);
  };
  const onComposerKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitDraft(); }
  };
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
        {/* Thinking bubble — visible while we wait on classify + LLM. Same agent-bubble */}
        {/* alignment / shape, but content is three dots staggered on the existing */}
        {/* `intentlyPulse` keyframe (defined in web/index.html) so chat shares one */}
        {/* "agent is working" motion vocabulary with HeroAffordance / HeroListening. */}
        {pending && (
          <div key="thinking" aria-live="polite" aria-label="Agent is thinking" style={{ alignSelf: 'flex-start', maxWidth: '88%' }}>
            <div style={{
              padding: '11px 14px', borderRadius: 18, borderTopLeftRadius: 6,
              background: T.color.SecondarySurface, border: `1px solid ${T.color.EdgeLine}`,
              display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 22,
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: 999, background: T.color.SupportingText,
                animation: 'intentlyPulse 1.2s ease-in-out infinite', animationDelay: '0s',
              }} />
              <span style={{
                width: 6, height: 6, borderRadius: 999, background: T.color.SupportingText,
                animation: 'intentlyPulse 1.2s ease-in-out infinite', animationDelay: '0.2s',
              }} />
              <span style={{
                width: 6, height: 6, borderRadius: 999, background: T.color.SupportingText,
                animation: 'intentlyPulse 1.2s ease-in-out infinite', animationDelay: '0.4s',
              }} />
            </div>
          </div>
        )}
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
            onKeyDown={onComposerKey}
            placeholder={pending ? "Thinking…" : "Say more, or ask a question…"}
            disabled={pending}
            style={{
              flex: 1, border: 'none', background: 'transparent', outline: 'none',
              fontFamily: T.font.Reading, fontSize: 15, color: T.color.PrimaryText,
              opacity: pending ? 0.6 : 1,
            }}
          />
          {draft.trim() ? (
            <button onClick={submitDraft} disabled={pending} aria-label="Send" style={{
              width: 36, height: 36, borderRadius: 999, border: 'none',
              background: T.color.PrimaryText, color: T.color.InverseText,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              cursor: pending ? 'default' : 'pointer', opacity: pending ? 0.5 : 1,
            }}>
              <Icon.Check size={16} color={T.color.InverseText} stroke={2.4} />
            </button>
          ) : (
            <button onClick={onMic} aria-label="Voice" style={{
              width: 36, height: 36, borderRadius: 999, border: 'none',
              background: T.color.PrimaryText, color: T.color.InverseText,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}>
              <Icon.Mic size={16} color={T.color.InverseText} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { HeroAffordance, HeroListening, HeroChat, VoiceWaveform, ProcessingArc });
