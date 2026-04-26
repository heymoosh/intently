// intently-cards.jsx — v2: image-forward, block-color cards.
// Tomorrow's sage + white-serif rhythm; Pinterest's collage + pastel rhythm.

function InputTrace({ items, onInspect, onDark }) {
  const textCol = onDark ? 'rgba(251,246,234,0.9)' : T.color.SupportingText;
  const edgeCol = onDark ? 'rgba(251,246,234,0.35)' : T.color.EdgeLine;
  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center',
      marginTop: 12, paddingTop: 12, borderTop: `1px dashed ${edgeCol}`,
    }}>
      <span style={{
        fontFamily: T.font.UI, fontSize: 11, fontWeight: 600, letterSpacing: 0.6,
        textTransform: 'uppercase', color: textCol, opacity: 0.85, marginRight: 2,
      }}>Used</span>
      {items.map((it, i) => {
        const IconComp = it.icon;
        return (
          <button key={i} onClick={onInspect} style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: onDark ? 'rgba(251,246,234,0.14)' : 'transparent',
            border: `1px solid ${edgeCol}`,
            borderRadius: 999, padding: '3px 9px 3px 7px', cursor: 'pointer',
            fontFamily: T.font.UI, fontSize: 11, fontWeight: 500,
            color: textCol,
          }}>
            <span style={{
              width: 14, height: 14, borderRadius: 999, background: it.dot,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              color: '#FBF6EA',
            }}><IconComp size={9} color="#FBF6EA" /></span>
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

function ConfidenceDot({ level, onDark }) {
  const map = {
    high:    { bg: T.color.TintSageDeep, label: 'Confident' },
    low:     { bg: T.color.WarnAccent, label: 'Not sure' },
    working: { bg: T.color.UncertaintyAccent, label: 'Working' },
  };
  const { bg, label } = map[level] || map.high;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontFamily: T.font.UI, fontSize: 11, fontWeight: 500,
      color: onDark ? 'rgba(251,246,234,0.85)' : T.color.SupportingText,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: bg }} />
      {label}
    </span>
  );
}

// ─── Tracker Card ─── painterly block background with ring progress
function TrackerCard({ project, status, pct, delta, updated, subline, paletteKey = 'sage' }) {
  const palettes = {
    sage:   ['#8CB39A', '#5F8A72', '#C66B3F', '#F1DE8A'],
    dusk:   ['#8E8FC6', '#6D6EAE', '#F0B98C', '#CFC9EB'],
    clay:   ['#E0A57A', '#B56A3F', '#F1DE8A', '#8CB39A'],
  };
  const pal = palettes[paletteKey];
  const ink = '#FBF6EA';
  return (
    <div style={{
      borderRadius: T.radius.Card, overflow: 'hidden',
      boxShadow: T.shadow.Raised, position: 'relative', color: ink,
    }}>
      <PainterlyBlock palette={pal} seed={pal[0].length} style={{ padding: 22 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: T.font.UI, fontSize: 11, fontWeight: 600, letterSpacing: 0.8,
              textTransform: 'uppercase', color: ink, opacity: 0.85,
            }}>{status}</div>
            <div style={{
              fontFamily: T.font.Display, fontSize: 30, lineHeight: '34px', fontWeight: 500,
              color: ink, letterSpacing: -0.6, marginTop: 6,
              fontStyle: 'italic',
            }}>{project}</div>
            {subline && (
              <div style={{
                fontFamily: T.font.Reading, fontSize: 14, lineHeight: '20px',
                color: ink, opacity: 0.85, marginTop: 6, maxWidth: 220,
              }}>{subline}</div>
            )}
          </div>
          {/* Ring progress */}
          <RingProgress pct={pct} color={ink} track="rgba(251,246,234,0.25)" delta={delta} />
        </div>
        <div style={{
          marginTop: 16, paddingTop: 12,
          borderTop: '1px solid rgba(251,246,234,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontFamily: T.font.UI, fontSize: 12, color: ink, opacity: 0.88,
        }}>
          <span>{updated}</span>
          {delta != null && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Icon.Sparkles size={12} color={ink} /> +{delta}% agent logged
            </span>
          )}
        </div>
      </PainterlyBlock>
    </div>
  );
}

function RingProgress({ pct, color, track, delta }) {
  const R = 32, C = 2 * Math.PI * R;
  const dash = (pct / 100) * C;
  return (
    <div style={{ position: 'relative', width: 84, height: 84, flexShrink: 0 }}>
      <svg width="84" height="84" viewBox="0 0 84 84">
        <circle cx="42" cy="42" r={R} fill="none" stroke={track} strokeWidth="6" />
        <circle
          cx="42" cy="42" r={R}
          fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={`${dash} ${C}`}
          transform="rotate(-90 42 42)"
          style={{ transition: `stroke-dasharray 900ms ${T.motion.Standard}` }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: T.font.Display, fontSize: 22, fontWeight: 600, color,
      }}>{pct}%</div>
    </div>
  );
}

// ─── Plan Card ─── butter yellow block, time blocks as colored chips
function PlanCard({ expanded: expandedInitial = false, blocks }) {
  const [expanded, setExpanded] = React.useState(expandedInitial);
  return (
    <div style={{
      background: T.color.TintButter, borderRadius: T.radius.Card,
      padding: 22, boxShadow: T.shadow.Raised, position: 'relative', overflow: 'hidden',
      color: T.color.TintMoss,
    }}>
      <div className="intently-grain" style={{ opacity: 0.3 }} />
      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <div style={{
              fontFamily: T.font.UI, fontSize: 11, fontWeight: 600, letterSpacing: 0.8,
              textTransform: 'uppercase', color: T.color.TintMoss, opacity: 0.75,
            }}>Today · Tuesday</div>
            <div style={{
              fontFamily: T.font.Display, fontSize: 30, lineHeight: '34px', fontWeight: 500,
              color: T.color.TintMoss, letterSpacing: -0.5, marginTop: 4, fontStyle: 'italic',
            }}>A quiet day.</div>
          </div>
          <button onClick={() => setExpanded(e => !e)} style={{
            background: 'rgba(58,78,58,0.12)', border: 'none', borderRadius: 999,
            padding: '6px 14px', cursor: 'pointer', minHeight: 44,
            fontFamily: T.font.UI, fontSize: 12, fontWeight: 600, color: T.color.TintMoss,
          }}>{expanded ? 'Less' : 'More'}</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {blocks.map((b, i) => {
            const tints = [T.color.TintSage, T.color.TintPeach, T.color.TintLilac];
            const bg = tints[i % tints.length];
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'stretch', gap: 12, borderRadius: 14,
                background: 'rgba(251,246,234,0.55)', padding: 12,
              }}>
                <div style={{
                  width: 44, flexShrink: 0, borderRadius: 10,
                  background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: T.font.UI, fontSize: 11, fontWeight: 700, letterSpacing: 0.4,
                  color: T.color.TintMoss, textTransform: 'uppercase',
                  writingMode: 'vertical-rl', transform: 'rotate(180deg)', padding: '6px 0',
                }}>{b.label}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: T.font.UI, fontSize: 11, fontWeight: 700, letterSpacing: 0.4, color: T.color.TintMoss, opacity: 0.7 }}>{b.time}</div>
                  <div style={{
                    fontFamily: T.font.Display, fontSize: 18, lineHeight: '22px', fontWeight: 500,
                    color: T.color.TintMoss, letterSpacing: -0.2, marginTop: 2,
                  }}>{b.title}</div>
                  {expanded && b.detail && (
                    <div style={{ fontFamily: T.font.Reading, fontSize: 14, lineHeight: '20px', color: T.color.TintMoss, opacity: 0.85, marginTop: 4 }}>{b.detail}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Journal Card ─── lilac block with landscape image panel and big pull-quote
function JournalCard({ date, body, pullQuote, mood = 'dusk' }) {
  return (
    <div style={{
      borderRadius: T.radius.Card, overflow: 'hidden',
      boxShadow: T.shadow.Raised, position: 'relative',
      background: T.color.TintLilac,
    }}>
      <LandscapePanel mood={mood} style={{ height: 160 }} />
      <div style={{ padding: 22, position: 'relative' }}>
        <div style={{
          fontFamily: T.font.UI, fontSize: 11, fontWeight: 600, letterSpacing: 0.8,
          textTransform: 'uppercase', color: T.color.TintMoss, opacity: 0.75, marginBottom: 8,
        }}>{date} · journal</div>
        {pullQuote && (
          <div style={{
            fontFamily: T.font.Display, fontSize: 26, lineHeight: '32px', fontWeight: 400,
            color: T.color.PrimaryText, letterSpacing: -0.3, fontStyle: 'italic',
            margin: '2px 0 12px',
          }}>"{pullQuote}"</div>
        )}
        <div style={{
          fontFamily: T.font.Reading, fontSize: 16, lineHeight: '24px', fontWeight: 400,
          color: T.color.PrimaryText, opacity: 0.85,
        }}>{body}</div>
      </div>
    </div>
  );
}

// ─── Confirmation Card ─── butter background, big serif action, peach Undo
function ConfirmationCard({ action, because, inputs, time, confidence = 'high', onUndo, undone, heroImage = true }) {
  const isLow = confidence === 'low';
  const bg = isLow ? T.color.UncertainCardSurface : T.color.ConfirmationCardSurface;
  const ink = T.color.PrimaryText;
  return (
    <div style={{
      borderRadius: T.radius.Card, overflow: 'hidden',
      boxShadow: T.shadow.Raised, position: 'relative', background: bg,
      border: isLow ? `1.5px dashed ${T.color.TintClay}` : 'none',
    }}>
      <div className="intently-grain" style={{ opacity: 0.35 }} />
      {heroImage && !isLow && (
        <div style={{ height: 96, position: 'relative' }}>
          <PainterlyBlock palette={['#8CB39A', '#5F8A72', '#F1DE8A', '#C66B3F']} seed={7} style={{ width: '100%', height: '100%' }} />
          {/* semi-transparent label ribbon */}
          <div style={{
            position: 'absolute', left: 16, top: 14, display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(251,246,234,0.88)', borderRadius: 999, padding: '6px 12px 6px 8px',
          }}>
            <span style={{
              width: 18, height: 18, borderRadius: 999, background: T.color.TintSageDeep,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}><Icon.Check size={11} color="#FBF6EA" stroke={3} /></span>
            <span style={{
              fontFamily: T.font.UI, fontSize: 11, fontWeight: 700, letterSpacing: 0.6,
              textTransform: 'uppercase', color: T.color.TintMoss,
            }}>I did this · 7 min ago</span>
          </div>
        </div>
      )}
      <div style={{ padding: 22, position: 'relative' }}>
        {(isLow || !heroImage) && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                width: 18, height: 18, borderRadius: 999,
                background: isLow ? T.color.WarnAccent : T.color.TintSageDeep,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {isLow
                  ? <span style={{ color: '#FBF6EA', fontFamily: T.font.UI, fontSize: 11, fontWeight: 700 }}>?</span>
                  : <Icon.Check size={11} color="#FBF6EA" stroke={3} />}
              </span>
              <span style={{
                fontFamily: T.font.UI, fontSize: 11, fontWeight: 700, letterSpacing: 0.6,
                textTransform: 'uppercase', color: T.color.SupportingText,
              }}>{isLow ? 'Asking · needs a nod' : 'I did this'}</span>
            </div>
            <ConfidenceDot level={isLow ? 'low' : 'high'} />
          </div>
        )}
        <div style={{
          fontFamily: T.font.Display, fontSize: 26, lineHeight: '32px', fontWeight: 500,
          color: ink, letterSpacing: -0.3,
          fontStyle: isLow ? 'italic' : 'normal',
        }}>
          {isLow && <span style={{ color: T.color.TintClay }}>I'm not sure, but — </span>}
          {action}
        </div>
        {because && (
          <div style={{
            fontFamily: T.font.Reading, fontSize: 15, lineHeight: '23px',
            color: T.color.SupportingText, marginTop: 10,
          }}>{because}</div>
        )}
        {inputs && <InputTrace items={inputs} />}
        <button onClick={onUndo} disabled={undone} style={{
          marginTop: 14, width: '100%', minHeight: 52, borderRadius: 999,
          background: undone ? 'rgba(198,107,63,0.15)' : T.color.TintPeach,
          border: `1.5px solid ${T.color.TintClay}`,
          color: T.color.TintClay,
          cursor: undone ? 'default' : 'pointer',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          fontFamily: T.font.UI, fontSize: 16, fontWeight: 700, letterSpacing: -0.1,
        }}>
          <Icon.Undo size={18} color={T.color.TintClay} />
          {undone ? 'Undone — I\u2019ll weight that signal lower' : 'Undo'}
        </button>
        {!undone && (
          <div style={{
            fontFamily: T.font.UI, fontSize: 11, color: T.color.SubtleText,
            textAlign: 'center', marginTop: 8,
          }}>{time}</div>
        )}
      </div>
    </div>
  );
}

// ─── Feature Card ─── giant full-bleed image + headline (Tomorrow-style).
// Used for the Daily Brief "hero" moment at the top of Present.
function FeatureCard({ eyebrow, headline, body, cta, palette, children, compact = false }) {
  return (
    <div style={{
      borderRadius: T.radius.Card, overflow: 'hidden',
      boxShadow: T.shadow.Raised, position: 'relative',
      color: '#FBF6EA',
    }}>
      <PainterlyBlock palette={palette} seed={palette[0].length + 3} style={{ minHeight: compact ? 180 : 260, padding: compact ? 22 : 28 }}>
        {eyebrow && (
          <div style={{
            fontFamily: T.font.UI, fontSize: 11, fontWeight: 700, letterSpacing: 1.2,
            textTransform: 'uppercase', color: '#FBF6EA', opacity: 0.85,
          }}>{eyebrow}</div>
        )}
        <div style={{
          fontFamily: T.font.Display, fontSize: compact ? 36 : 46, lineHeight: compact ? '42px' : '52px',
          fontWeight: 500, letterSpacing: -0.9, marginTop: 8, fontStyle: 'italic',
          color: '#FBF6EA', maxWidth: 340,
        }}>{headline}</div>
        {body && (
          <div style={{
            fontFamily: T.font.Reading, fontSize: 16, lineHeight: '24px',
            color: '#FBF6EA', opacity: 0.9, marginTop: 12, maxWidth: 320,
          }}>{body}</div>
        )}
        {children}
        {cta && (
          <button style={{
            marginTop: 18, minHeight: 48, padding: '0 22px', borderRadius: 999,
            background: T.color.TintPeachSoft, border: 'none',
            color: T.color.TintClay, cursor: 'pointer',
            fontFamily: T.font.UI, fontSize: 15, fontWeight: 700,
          }}>{cta}</button>
        )}
      </PainterlyBlock>
    </div>
  );
}

// ─── AVATAR ──────────────────────────────────────────────────────────
// Single avatar component for every identity surface (home-screen profile
// button, profile-sheet hero, journal/chat byline). Reads displayName +
// initial from `useUserProfile()` so the source of truth is one place;
// surfaces don't pass display strings around individually.
//
// Variants (`variant`):
//   • 'button' — round, gradient background, used as a tap target
//   • 'hero'   — large (64px), gradient, used in profile sheet hero
//   • 'inline' — small (28px), flat tinted background, used in bylines
// `size` overrides default px size; pass when a variant default is wrong
// for the slot. `onClick` (optional) makes the avatar a button rather
// than a div. `style` merges in for absolute-position overrides on the
// home-screen button.
function Avatar({ variant = 'button', size, onClick, ariaLabel, style }) {
  const profile = window.useUserProfile ? window.useUserProfile() : { initial: '?' };
  const initial = profile.initial || '?';

  const defaults = {
    button: {
      size: 44,
      background: 'linear-gradient(135deg, #E8A25E 0%, #C66B3F 100%)',
      color: '#FBF6EA',
      fontFamily: T.font.Display,
      fontSize: 18,
      fontWeight: 600,
      fontStyle: 'italic',
      letterSpacing: -0.3,
      shadow: '0 8px 24px rgba(31,27,21,0.18), 0 0 0 1px rgba(31,27,21,0.06)',
    },
    hero: {
      size: 64,
      background: 'linear-gradient(135deg, #E8A25E 0%, #C66B3F 100%)',
      color: '#FBF6EA',
      fontFamily: T.font.Display,
      fontSize: 28,
      fontWeight: 600,
      fontStyle: 'italic',
      letterSpacing: -0.4,
      shadow: '0 6px 16px rgba(31,27,21,0.16)',
    },
    inline: {
      size: 28,
      background: T.color.TintSage,
      color: '#FBF6EA',
      fontFamily: T.font.Display,
      fontSize: 13,
      fontWeight: 600,
      fontStyle: 'normal',
      letterSpacing: 0,
      shadow: 'none',
    },
  };
  const v = defaults[variant] || defaults.button;
  const px = size || v.size;
  const baseStyle = {
    width: px, height: px, borderRadius: 999,
    background: v.background,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    color: v.color,
    fontFamily: v.fontFamily, fontSize: v.fontSize, fontWeight: v.fontWeight,
    fontStyle: v.fontStyle, letterSpacing: v.letterSpacing,
    boxShadow: v.shadow,
    flexShrink: 0,
    ...(style || {}),
  };

  if (onClick) {
    return (
      <button
        onClick={onClick}
        aria-label={ariaLabel || 'Profile'}
        style={{ ...baseStyle, border: 'none', cursor: 'pointer' }}
      >{initial}</button>
    );
  }
  return <span style={baseStyle}>{initial}</span>;
}

Object.assign(window, { TrackerCard, PlanCard, JournalCard, ConfirmationCard, FeatureCard, RingProgress, InputTrace, ConfidenceDot, Avatar });
