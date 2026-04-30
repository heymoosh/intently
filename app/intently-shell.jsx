// intently-shell.jsx — Three-screen horizontal swipe shell + dot indicator.

function SwipeShell({ children, index, onIndex }) {
  // children is an array of 3 nodes. Horizontally stacked; translate with
  // transition for snap, pointer drag for physical follow-the-finger motion.
  const [drag, setDrag] = React.useState(0);
  const [dragging, setDragging] = React.useState(false);
  const startX = React.useRef(0);
  const W = 390; // phone viewport width

  const onDown = (e) => {
    startX.current = e.clientX;
    setDragging(true);
  };
  const onMove = (e) => {
    if (!dragging) return;
    let dx = e.clientX - startX.current;
    // rubberband at edges
    if ((index === 0 && dx > 0) || (index === 2 && dx < 0)) dx *= 0.35;
    setDrag(dx);
  };
  const onUp = () => {
    if (!dragging) return;
    setDragging(false);
    const threshold = W * 0.18;
    let next = index;
    if (drag < -threshold && index < 2) next = index + 1;
    else if (drag > threshold && index > 0) next = index - 1;
    setDrag(0);
    onIndex(next);
  };

  const x = -index * W + drag;

  return (
    <div
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      style={{
        position: 'absolute', inset: 0, overflow: 'hidden',
        touchAction: 'pan-y', userSelect: 'none',
      }}
    >
      <div style={{
        display: 'flex', width: W * 3, height: '100%',
        transform: `translate3d(${x}px,0,0)`,
        transition: dragging ? 'none' : `transform 320ms ${T.motion.Standard}`,
      }}>
        {children.map((c, i) => (
          <div key={i} style={{ width: W, height: '100%', flex: '0 0 auto' }}>{c}</div>
        ))}
      </div>
    </div>
  );
}

function SwipeDots({ index, onIndex }) {
  const labels = ['Past', 'Present', 'Future'];
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, top: 52, display: 'flex',
      justifyContent: 'center', gap: 18, zIndex: 6, pointerEvents: 'auto',
    }}>
      {labels.map((l, i) => (
        <button key={l} onClick={() => onIndex(i)} aria-label={l} style={{
          display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
          gap: 4, background: 'transparent', border: 'none', cursor: 'pointer',
          padding: 4, minWidth: 44, minHeight: 28,
        }}>
          <span style={{
            width: i === index ? 20 : 6, height: 6, borderRadius: 999,
            background: i === index ? T.color.PrimaryText : T.color.Stone300,
            transition: `all 240ms ${T.motion.Standard}`,
          }} />
          <span style={{
            fontFamily: T.font.UI, fontSize: 10, fontWeight: 600, letterSpacing: 0.6,
            textTransform: 'uppercase',
            color: i === index ? T.color.PrimaryText : T.color.SubtleText,
            opacity: i === index ? 1 : 0.7,
          }}>{l}</span>
        </button>
      ))}
    </div>
  );
}

Object.assign(window, { SwipeShell, SwipeDots });
