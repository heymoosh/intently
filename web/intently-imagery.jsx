// intently-imagery.jsx — painterly placeholders + collage props.
// Imagery is a first-class design element. These are CSS/SVG-only, no
// external assets — they read as "a real image goes here" without
// pretending to be one.

// Subtle paper-noise filter used across textured surfaces.
if (typeof document !== 'undefined' && !document.getElementById('intently-noise')) {
  const s = document.createElement('style');
  s.id = 'intently-noise';
  s.textContent = `
    @keyframes intentlyDrift { from { background-position: 0 0; } to { background-position: 120px 80px; } }
    .intently-grain { position: absolute; inset: 0; pointer-events: none; opacity: 0.55; mix-blend-mode: multiply;
      background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.17  0 0 0 0 0.13  0 0 0 0 0.09  0 0 0 0.08 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
    }
    .intently-sun { position: absolute; pointer-events: none; border-radius: 9999px;
      filter: blur(28px); mix-blend-mode: screen; }
  `;
  document.head.appendChild(s);
}

// Painterly block — a textured color "painting" that reads like an oil/
// gouache panel. Used as card backgrounds and hero imagery.
function PainterlyBlock({ palette = ['#8CB39A', '#5F8A72', '#C66B3F', '#F1DE8A'], style = {}, children, seed = 1 }) {
  // deterministic blob positions
  const blobs = [
    { c: palette[1], x: 20, y: 80, r: 70, o: 0.85 },
    { c: palette[2], x: 80, y: 30, r: 55, o: 0.7 },
    { c: palette[3], x: 65, y: 85, r: 45, o: 0.75 },
    { c: palette[1], x: 10, y: 15, r: 40, o: 0.5 },
  ];
  return (
    <div style={{
      position: 'relative', overflow: 'hidden',
      background: palette[0],
      ...style,
    }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <defs>
          <filter id={`bl-${seed}`}><feGaussianBlur stdDeviation="6" /></filter>
        </defs>
        <g filter={`url(#bl-${seed})`}>
          {blobs.map((b, i) => (
            <ellipse key={i} cx={b.x} cy={b.y} rx={b.r} ry={b.r * 0.7} fill={b.c} opacity={b.o} />
          ))}
        </g>
      </svg>
      <div className="intently-grain" />
      {children && <div style={{ position: 'relative', zIndex: 2, height: '100%' }}>{children}</div>}
    </div>
  );
}

// Collage — a set of rotated rectangles, Pinterest-style, with one colored
// "photo" and a couple of prop shapes. Still reads as placeholder.
function Collage({ palette, size = 140, labels = [], style = {} }) {
  const [A, B, C, D] = palette;
  return (
    <div style={{
      position: 'relative', width: size, height: size,
      ...style,
    }}>
      {/* prop circle (yarn-ball feel) */}
      <div style={{
        position: 'absolute', left: -12, bottom: -6, width: size * 0.42, height: size * 0.42,
        borderRadius: '50%', background: D,
        boxShadow: `inset -6px -8px 0 rgba(0,0,0,0.08)`,
      }} />
      {/* back photo */}
      <div style={{
        position: 'absolute', right: 4, top: 4, width: size * 0.6, height: size * 0.78,
        background: B, borderRadius: 6, transform: 'rotate(6deg)',
        boxShadow: '0 6px 14px rgba(0,0,0,0.12)',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${B} 40%, ${C} 100%)` }} />
      </div>
      {/* front photo */}
      <div style={{
        position: 'absolute', left: 8, bottom: 16, width: size * 0.55, height: size * 0.72,
        background: C, borderRadius: 6, transform: 'rotate(-4deg)',
        boxShadow: '0 8px 18px rgba(0,0,0,0.18)',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(200deg, ${C} 30%, ${A} 100%)` }} />
        <div className="intently-grain" />
      </div>
      {/* scissor-ish triangle */}
      <div style={{
        position: 'absolute', right: -10, bottom: -2,
        width: 0, height: 0,
        borderLeft: `${size * 0.12}px solid transparent`,
        borderRight: `${size * 0.12}px solid transparent`,
        borderBottom: `${size * 0.22}px solid ${A}`,
        transform: 'rotate(28deg)', opacity: 0.85,
      }} />
    </div>
  );
}

// Morning-light hero image — a painterly sunrise. Used on the Daily Brief
// hero moment.
function MorningLight({ style = {} }) {
  return (
    <div style={{
      position: 'relative', overflow: 'hidden',
      background: `linear-gradient(180deg, #F3D7A2 0%, #EFB88F 45%, #C66B3F 100%)`,
      ...style,
    }}>
      {/* soft sun */}
      <div className="intently-sun" style={{
        width: 180, height: 180, top: -40, right: -40,
        background: '#F5E8C8',
      }} />
      <div className="intently-sun" style={{
        width: 260, height: 260, bottom: -130, left: -80,
        background: 'rgba(255,224,175,0.6)',
      }} />
      {/* horizon */}
      <svg viewBox="0 0 400 120" preserveAspectRatio="none" style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, width: '100%', height: '40%',
      }}>
        <path d="M0 120 L0 60 Q100 40 200 55 T400 50 L400 120 Z" fill="#5F4A35" opacity="0.55" />
        <path d="M0 120 L0 88 Q140 74 260 84 T400 80 L400 120 Z" fill="#2B2118" opacity="0.6" />
      </svg>
      <div className="intently-grain" />
    </div>
  );
}

// A "journal entry" photo panel — vertical painterly landscape.
function LandscapePanel({ mood = 'dusk', style = {} }) {
  const palettes = {
    dusk:   ['#8E8FC6', '#CFC9EB', '#F0B98C', '#2B2118'],
    forest: ['#5F8A72', '#3A4E3A', '#F1DE8A', '#2B2118'],
    rain:   ['#8EA6B4', '#5E7684', '#CFC9EB', '#2B2118'],
  }[mood] || ['#8E8FC6', '#CFC9EB', '#F0B98C', '#2B2118'];
  return (
    <div style={{
      position: 'relative', overflow: 'hidden',
      background: `linear-gradient(180deg, ${palettes[1]} 0%, ${palettes[0]} 55%, ${palettes[2]} 100%)`,
      ...style,
    }}>
      <div className="intently-sun" style={{
        width: 120, height: 120, top: 24, right: 30, background: palettes[2], opacity: 0.9,
      }} />
      <svg viewBox="0 0 300 200" preserveAspectRatio="none" style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, width: '100%', height: '55%',
      }}>
        <path d="M0 200 L0 110 Q60 80 120 100 T240 90 T300 100 L300 200 Z" fill={palettes[3]} opacity="0.7" />
        <path d="M0 200 L0 150 Q80 130 160 145 T300 140 L300 200 Z" fill={palettes[3]} opacity="0.9" />
      </svg>
      <div className="intently-grain" />
    </div>
  );
}

// Simple flat-color "photo" tile — for thumbnails in rails.
function ColorTile({ palette = ['#8CB39A', '#5F8A72'], icon, style = {} }) {
  return (
    <div style={{
      position: 'relative', overflow: 'hidden',
      background: `linear-gradient(135deg, ${palette[0]} 0%, ${palette[1]} 100%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#FBF6EA',
      ...style,
    }}>
      {icon}
      <div className="intently-grain" />
    </div>
  );
}

// Dot grid — Pinterest-style "canvas" background under a card.
function DotGridBackdrop({ style = {} }) {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      backgroundImage: `radial-gradient(circle, rgba(43,33,24,0.16) 1px, transparent 1.3px)`,
      backgroundSize: '14px 14px',
      ...style,
    }} />
  );
}

Object.assign(window, { PainterlyBlock, Collage, MorningLight, LandscapePanel, ColorTile, DotGridBackdrop });
