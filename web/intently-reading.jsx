// intently-reading.jsx
// Reading-mode overlay for any logged Entry — journal, chat thread, or review.
// Painterly banner header, narrow column, generous leading. Edit on journals;
// "continue thread" on chat/review; read-only by default.
//
// Mounts as a full-screen overlay inside the Phone frame (absolute-positioned
// child of <Phone />, like JournalComposer). Slides up from below.

(function () {
  const T = window.T;
  const { LandscapePanel } = window;
  const { Icon } = window;

  // ─── Header chrome shared across all variants ──────────────────
  function ReadingHeader({ banner, eyebrow, onClose, onMore, onEdit }) {
    return (
      <div style={{ position: 'relative', height: 280 }}>
        {banner}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(43,33,24,0.20) 0%, rgba(43,33,24,0) 35%, rgba(43,33,24,0) 65%, rgba(43,33,24,0.30) 100%)',
        }} />
        <div style={{
          position: 'absolute', top: 16, left: 20, right: 20,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#FBF6EA',
        }}>
          <button onClick={onClose} style={{
            background: 'rgba(47,38,27,0.32)', border: 'none', borderRadius: 999,
            width: 36, height: 36, display: 'inline-flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FBF6EA" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6"/>
            </svg>
          </button>
          <div style={{
            fontFamily: T.font.UI, fontSize: 11, fontWeight: 700,
            letterSpacing: 1.2, textTransform: 'uppercase', opacity: 0.92,
          }}>{eyebrow}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {onEdit && (
              <button onClick={onEdit} style={{
                background: 'rgba(47,38,27,0.32)', border: 'none', borderRadius: 999,
                width: 36, height: 36, display: 'inline-flex', alignItems: 'center',
                justifyContent: 'center', cursor: 'pointer',
              }} aria-label="Edit">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FBF6EA" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4Z"/>
                </svg>
              </button>
            )}
            <button onClick={onMore} style={{
              background: 'rgba(47,38,27,0.32)', border: 'none', borderRadius: 999,
              width: 36, height: 36, display: 'inline-flex', alignItems: 'center',
              justifyContent: 'center', cursor: 'pointer',
            }} aria-label="More">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#FBF6EA">
                <circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Journal reading mode ──────────────────────────────────────
  function JournalReader({ entry, onClose }) {
    return (
      <>
        <ReadingHeader
          banner={<LandscapePanel mood={entry.mood || 'dusk'} style={{ height: 280 }} />}
          eyebrow={`Journal · ${entry.dayLabel || 'Today'}`}
          onClose={onClose}
          // eslint-disable-next-line no-empty-function -- TODO: see .claude/handoffs/new-user-ux-and-auth.md (edit-button + brief-can't-open AC bullets)
          onEdit={() => {}}
          // eslint-disable-next-line no-empty-function -- TODO: see .claude/handoffs/new-user-ux-and-auth.md (avatar component + edit-button AC bullets)
          onMore={() => {}}
        />
        <div style={{
          padding: '28px 36px 140px', marginTop: -32,
          background: T.color.SecondarySurface,
          borderTopLeftRadius: 24, borderTopRightRadius: 24,
          position: 'relative',
        }}>
          <div style={{
            fontFamily: T.font.UI, fontSize: 11, fontWeight: 700, letterSpacing: 1.4,
            textTransform: 'uppercase', color: T.color.TintClay, marginBottom: 6,
          }}>{entry.eyebrow || `${entry.dayLabel || 'Today'} · ${entry.readMin || 2} min read`}</div>
          <div style={{
            fontFamily: T.font.Display, fontSize: 32, lineHeight: '38px',
            fontStyle: 'italic', fontWeight: 500, letterSpacing: -0.6,
            color: T.color.PrimaryText, textWrap: 'pretty',
          }}>{entry.title}</div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, margin: '14px 0 22px',
            fontFamily: T.font.UI, fontSize: 12, color: T.color.SupportingText,
          }}>
            <span style={{
              width: 28, height: 28, borderRadius: 999, background: T.color.TintSage,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              color: '#FBF6EA', fontFamily: T.font.Display, fontWeight: 600, fontSize: 13,
            }}>S</span>
            Sam · {entry.dateLabel || 'Today'}
          </div>
          {entry.body.map((block, i) => {
            if (block.kind === 'quote') {
              return (
                <blockquote key={i} style={{
                  margin: '20px -4px', paddingLeft: 16,
                  borderLeft: `3px solid ${T.color.TintClay}`,
                  fontFamily: T.font.Display, fontSize: 22, fontStyle: 'italic',
                  lineHeight: '30px', color: T.color.TintMoss,
                }}>{block.text}</blockquote>
              );
            }
            if (block.kind === 'p-drop') {
              return (
                <p key={i} style={{
                  fontFamily: T.font.Reading, fontSize: 19, lineHeight: '32px',
                  color: T.color.PrimaryText, margin: '0 0 18px',
                }}>
                  <span style={{
                    fontFamily: T.font.Display, fontSize: 64, lineHeight: '52px',
                    fontWeight: 500, float: 'left', marginRight: 10, marginTop: 6,
                    color: T.color.TintClay, fontStyle: 'italic',
                  }}>{block.text.charAt(0)}</span>
                  {block.text.slice(1)}
                </p>
              );
            }
            return (
              <p key={i} style={{
                fontFamily: T.font.Reading, fontSize: 19, lineHeight: '32px',
                color: T.color.PrimaryText, margin: '0 0 18px',
              }}>{block.text}</p>
            );
          })}
        </div>
      </>
    );
  }

  // ─── Chat thread reading mode ──────────────────────────────────
  function ChatReader({ entry, onClose }) {
    return (
      <>
        <ReadingHeader
          banner={<LandscapePanel mood="rain" style={{ height: 220 }} />}
          eyebrow={`Chat · ${entry.dayLabel || 'Today'}`}
          onClose={onClose}
          // eslint-disable-next-line no-empty-function -- TODO: see .claude/handoffs/new-user-ux-and-auth.md (avatar component + reading-mode menu AC bullets)
          onMore={() => {}}
        />
        <div style={{
          padding: '24px 28px 140px', marginTop: -32,
          background: T.color.SecondarySurface,
          borderTopLeftRadius: 24, borderTopRightRadius: 24,
          position: 'relative',
        }}>
          <div style={{
            fontFamily: T.font.UI, fontSize: 11, fontWeight: 700, letterSpacing: 1.4,
            textTransform: 'uppercase', color: T.color.TintClay, marginBottom: 6,
          }}>{entry.timeLabel || '14:50'} · {entry.messages.length} messages</div>
          <div style={{
            fontFamily: T.font.Display, fontSize: 28, lineHeight: '34px',
            fontStyle: 'italic', fontWeight: 500, letterSpacing: -0.5,
            color: T.color.PrimaryText, marginBottom: 4, textWrap: 'pretty',
          }}>{entry.title}</div>
          {entry.summary && (
            <div style={{
              fontFamily: T.font.Reading, fontSize: 14, lineHeight: '21px',
              fontStyle: 'italic', color: T.color.SupportingText,
              margin: '6px 0 22px',
            }}>{entry.summary}</div>
          )}

          {/* transcript */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {entry.messages.map((m, i) => (
              <div key={i} style={{
                display: 'flex', flexDirection: 'column',
                alignItems: m.from === 'user' ? 'flex-end' : 'flex-start',
              }}>
                <div style={{
                  fontFamily: T.font.UI, fontSize: 10, fontWeight: 700,
                  letterSpacing: 0.8, textTransform: 'uppercase',
                  color: T.color.SupportingText, marginBottom: 4,
                  display: 'flex', gap: 8, alignItems: 'baseline',
                }}>
                  <span>{m.from === 'user' ? 'You' : 'Intently'}</span>
                  {m.t && <span style={{ fontFamily: T.font.Mono, fontWeight: 400, opacity: 0.7 }}>{m.t}</span>}
                </div>
                <div style={{
                  maxWidth: '86%',
                  padding: '12px 16px',
                  borderRadius: 14,
                  background: m.from === 'user' ? T.color.TintMint + '55' : T.color.PrimarySurface,
                  border: m.from === 'user' ? 'none' : `1px solid ${T.color.EdgeLine}`,
                  fontFamily: T.font.Reading, fontSize: 15, lineHeight: '23px',
                  color: T.color.PrimaryText,
                  textWrap: 'pretty',
                }}>{m.text}</div>
              </div>
            ))}
          </div>

          {/* read-only notice — chat is in the past */}
          <div style={{
            marginTop: 28, padding: '14px 16px',
            background: T.color.PrimarySurface,
            border: `1px dashed ${T.color.EdgeLine}`,
            borderRadius: 12, textAlign: 'center',
          }}>
            <div style={{
              fontFamily: T.font.Reading, fontSize: 13, lineHeight: '19px',
              color: T.color.SupportingText, fontStyle: 'italic',
            }}>This thread closed at {entry.timeLabel}. Tap below to pick it back up.</div>
            <button style={{
              marginTop: 10, padding: '8px 18px',
              background: T.color.TintMoss, color: '#FBF6EA',
              border: 'none', borderRadius: 999, cursor: 'pointer',
              fontFamily: T.font.UI, fontSize: 13, fontWeight: 600,
            }}>Continue thread</button>
          </div>
        </div>
      </>
    );
  }

  // ─── Review reading mode ───────────────────────────────────────
  function ReviewReader({ entry, onClose }) {
    return (
      <>
        <ReadingHeader
          banner={<div style={{
            height: 240, position: 'relative', overflow: 'hidden',
            background: 'linear-gradient(180deg, #2A2348 0%, #4B3D6E 50%, #8B6B8E 100%)',
          }}>
            <div className="intently-sun" style={{
              width: 140, height: 140, top: 30, right: 40,
              background: '#F5E8C8', opacity: 0.55,
            }} />
            <svg viewBox="0 0 400 120" preserveAspectRatio="none" style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, width: '100%', height: '40%',
            }}>
              <path d="M0 120 L0 70 Q120 50 240 60 T400 55 L400 120 Z" fill="#1F1B33" opacity="0.6" />
              <path d="M0 120 L0 95 Q140 82 260 90 T400 86 L400 120 Z" fill="#0F0D1F" opacity="0.7" />
            </svg>
            <div className="intently-grain" />
          </div>}
          eyebrow={`Review · ${entry.dayLabel || 'Today'}`}
          onClose={onClose}
          // eslint-disable-next-line no-empty-function -- TODO: see .claude/handoffs/new-user-ux-and-auth.md (avatar component + reading-mode menu AC bullets)
          onMore={() => {}}
        />
        <div style={{
          padding: '24px 28px 140px', marginTop: -32,
          background: T.color.SecondarySurface,
          borderTopLeftRadius: 24, borderTopRightRadius: 24,
          position: 'relative',
        }}>
          <div style={{
            fontFamily: T.font.UI, fontSize: 11, fontWeight: 700, letterSpacing: 1.4,
            textTransform: 'uppercase', color: T.color.TintClay, marginBottom: 6,
          }}>{entry.timeLabel || '21:06'} · End of day</div>
          <div style={{
            fontFamily: T.font.Display, fontSize: 28, lineHeight: '34px',
            fontStyle: 'italic', fontWeight: 500, letterSpacing: -0.5,
            color: T.color.PrimaryText, marginBottom: 18, textWrap: 'pretty',
          }}>{entry.title || 'How the day landed.'}</div>

          {/* The same stacked card the user saw at end-of-day, but on light surface */}
          <div style={{
            background: '#2A2348',
            borderRadius: 16, padding: '20px 22px',
            color: '#FBF6EA',
            boxShadow: '0 12px 28px rgba(42,35,72,0.32)',
          }}>
            <div style={{ fontFamily: T.font.UI, fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(251,246,234,0.65)', marginBottom: 10 }}>What landed</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
              <div>
                <div style={{ fontFamily: T.font.UI, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(251,246,234,0.55)', marginBottom: 2 }}>Highlight</div>
                <div style={{ fontFamily: T.font.Display, fontSize: 17, lineHeight: '23px', fontStyle: 'italic', color: '#FBF6EA', letterSpacing: -0.2 }}>"{entry.highlight}"</div>
              </div>
              <div>
                <div style={{ fontFamily: T.font.UI, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(251,246,234,0.55)', marginBottom: 2 }}>Friction</div>
                <div style={{ fontFamily: T.font.Reading, fontSize: 14, lineHeight: '20px', color: '#FBF6EA', opacity: 0.85 }}>{entry.friction}</div>
              </div>
            </div>
            <div style={{
              background: 'rgba(245,235,207,0.12)',
              border: `1px solid rgba(245,235,207,0.28)`,
              borderRadius: 12, padding: '14px 14px 12px',
            }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontFamily: T.font.UI, fontSize: 10, fontWeight: 700, letterSpacing: 1.2,
                textTransform: 'uppercase', color: '#F5EBCF', marginBottom: 8,
              }}>
                <Icon.Sun size={12} color="#F5EBCF" />
                Carried into tomorrow
              </div>
              <div style={{
                fontFamily: T.font.Display, fontSize: 17, lineHeight: '23px',
                fontStyle: 'italic', color: '#FBF6EA', letterSpacing: -0.2, marginBottom: 12,
              }}>"{entry.tomorrow}"</div>
              <div style={{ height: 1, background: 'rgba(245,235,207,0.16)', marginBottom: 10 }} />
              <div style={{
                fontFamily: T.font.UI, fontSize: 10, letterSpacing: 1,
                textTransform: 'uppercase', color: 'rgba(245,235,207,0.55)', marginBottom: 6,
              }}>What was on the calendar</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {(entry.calendar || []).map((c, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: 10, alignItems: 'baseline',
                    fontFamily: T.font.Reading, fontSize: 13, lineHeight: '18px',
                    color: 'rgba(251,246,234,0.86)',
                  }}>
                    <span style={{ fontFamily: T.font.Mono, fontSize: 10, color: 'rgba(245,235,207,0.7)', minWidth: 56 }}>{c.t}</span>
                    <span>{c.body}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Continue thread */}
          <div style={{ marginTop: 22, textAlign: 'center' }}>
            <button style={{
              padding: '10px 22px',
              background: T.color.TintMoss, color: '#FBF6EA',
              border: 'none', borderRadius: 999, cursor: 'pointer',
              fontFamily: T.font.UI, fontSize: 13, fontWeight: 600,
            }}>Continue this conversation</button>
          </div>
        </div>
      </>
    );
  }

  // ─── Wrapping overlay — slides up, dim background ──────────────
  function ReadingMode({ entry, onClose }) {
    React.useEffect(() => {
      const onKey = (e) => { if (e.key === 'Escape') onClose && onClose(); };
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    let body = null;
    if (!entry) return null;
    if (entry.kind === 'journal') body = <JournalReader entry={entry} onClose={onClose} />;
    else if (entry.kind === 'chat') body = <ChatReader entry={entry} onClose={onClose} />;
    else if (entry.kind === 'review') body = <ReviewReader entry={entry} onClose={onClose} />;
    else return null;

    return (
      <div style={{
        position: 'absolute', inset: 0, background: T.color.SecondarySurface,
        zIndex: 90, overflow: 'auto',
        animation: 'reading-up 280ms cubic-bezier(0.2, 0.7, 0.2, 1)',
      }}>
        <style>{`
          @keyframes reading-up {
            from { transform: translateY(28px); opacity: 0; }
            to   { transform: translateY(0);    opacity: 1; }
          }
        `}</style>
        {body}
      </div>
    );
  }

  Object.assign(window, { ReadingMode });
})();
