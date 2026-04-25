// intently-glyphs.jsx — 40 Lucide-sourced daily-mark glyphs.
// Agent picks one per day from this palette. Fallback: 'circle-dot'.
// Two render modes: 'full' (Day/Month/Week) and 'mini' (Year, lighter stroke, thinner).

const GlyphPaths = {
  // Time / energy
  sunrise: 'M12 2v6 M4.93 10.93l1.41 1.41 M2 18h2 M20 18h2 M17.66 12.34l1.41-1.41 M22 22H2 M8 18a4 4 0 0 1 8 0 M16 5l-4 4-4-4',
  sun: 'M12 2v2 M12 20v2 M4.93 4.93l1.41 1.41 M17.66 17.66l1.41 1.41 M2 12h2 M20 12h2 M4.93 19.07l1.41-1.41 M17.66 6.34l1.41-1.41 M_circle_8',
  sunset: 'M12 10v-8 M4.93 10.93l1.41 1.41 M2 18h2 M20 18h2 M17.66 12.34l1.41-1.41 M22 22H2 M8 18a4 4 0 0 1 8 0 M16 5l-4 4-4-4',
  moon: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z',
  bed: 'M2 4v16 M2 8h18a2 2 0 0 1 2 2v10 M2 17h20 M6 8v9 M_circle_6_10_2',
  coffee: 'M17 8h1a4 4 0 1 1 0 8h-1 M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4z M6 2v2 M10 2v2 M14 2v2',
  alarm: 'M_circle_12_13_8 M12 9v4l2 2 M5 3L2 6 M22 6l-3-3 M6.38 18.7L4 21 M17.64 18.67L20 21',
  // Work / making
  pen: 'M12 20h9 M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z',
  keyboard: 'M_rect_2_4_20_16_2 M6 8h.01 M10 8h.01 M14 8h.01 M18 8h.01 M6 12h.01 M10 12h.01 M14 12h.01 M18 12h.01 M7 16h10',
  lightbulb: 'M15 14c.2-1 .7-1.7 1.5-2.5C17.7 10.2 18 9 18 7.5c0-3.5-3-6-6-6S6 4 6 7.5c0 1.5.3 2.7 1.5 4 .8.8 1.3 1.5 1.5 2.5 M9 18h6 M10 22h4',
  rocket: 'M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0 M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5',
  target: 'M_circle_12_12_10 M_circle_12_12_6 M_circle_12_12_2',
  hammer: 'm15 12-8.5 8.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L12 9 M17.64 15 22 10.64 M20.91 11.7l-1.25-1.25c-.6-.6-.93-1.4-.93-2.25v-.86L16.01 4.6a5.56 5.56 0 0 0-3.94-1.64H9l.92.82A6.18 6.18 0 0 1 12 8.4v1.56l2 2h2.47l2.26 1.91',
  presentation: 'M2 3h20 M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3 M7 21l5-5 5 5 M12 16v5',
  // Movement
  footprints: 'M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0 M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 1 0 4 0 M16 17h4 M4 13h4',
  bike: 'M_circle_18.5_17.5_3.5 M_circle_5.5_17.5_3.5 M_circle_15_5_1 M12 17.5V14l-3-3 4-3 2 3h2',
  plane: 'M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z',
  mountain: 'm8 3 4 8 5-5 5 15H2L8 3z',
  trees: 'M10 10v.2A3 3 0 0 1 8.9 16H5a3 3 0 0 1-1-5.8V10a3 3 0 0 1 6 0 M7 16v6 M13 19h6 M16 22V6.5a1.5 1.5 0 0 1 3 0V17 M17.66 7 20 9.34M19.66 12 22 14.34',
  waves: 'M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1',
  // People
  users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M_circle_9_7_4 M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75',
  message: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
  phone: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z',
  heart: 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z',
  handshake: 'm11 17 2 2a1 1 0 1 0 3-3 M14 14l2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4 M21 3 19 5 M9 12h.01 M3 20l3-3',
  cake: 'M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8 M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1 M2 21h20 M7 8v2 M12 8v2 M17 8v2 M7 4h.01 M12 4h.01 M17 4h.01',
  // Weather / state
  flame: 'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z',
  wind: 'M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2 M9.6 4.6A2 2 0 1 1 11 8H2 M12.6 19.4A2 2 0 1 0 14 16H2',
  rain: 'M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242 M16 14v6 M8 14v6 M12 16v6',
  snow: 'M2 12h20 M12 2v20 M20 16l-4-4 4-4 M4 8l4 4-4 4 M16 4l-4 4-4-4 M8 20l4-4 4 4',
  leaf: 'M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19.2 2.3c1 3.2.5 7.3-2 9.5-1.44 1.25-3.2 2-5 2 M2 21c0-3 1.85-5.36 5.08-6',
  // Consumption
  book: 'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z',
  music: 'M9 18V5l12-2v13 M_circle_6_18_3 M_circle_18_16_3',
  film: 'M_rect_2_2_20_20_2 M7 2v20 M17 2v20 M2 12h20 M2 7h5 M2 17h5 M17 17h5 M17 7h5',
  utensils: 'M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2 M7 2v20 M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7',
  wine: 'M8 22h8 M7 10h10 M12 15v7 M8 2h8a4 4 0 0 1 4 4v1a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V6a4 4 0 0 1 4-4z',
  // Reflection
  compass: 'M_circle_12_12_10 M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36z',
  camera: 'M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z M_circle_12_13_4',
  sparkles: 'M12 3l1.8 4.6L18 9.4l-4.2 1.8L12 16l-1.8-4.8L6 9.4l4.2-1.8L12 3z M19 15l.6 1.5L21 17l-1.4.5L19 19l-.6-1.5L17 17l1.4-.5z',
  feather: 'M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z M16 8 2 22 M17.5 15H9',
  map: 'm3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3z M9 3v15 M15 6v15',
  // Fallback (used if agent returns unknown key)
  dot: 'M_circle_12_12_1.5',
};

// Render a glyph — expands custom "M_circle_cx_cy_r" and "M_rect_x_y_w_h_r" tokens
// so we can keep the dataset as a simple string map but still draw circles/rects via svg.
function Glyph({ name, size = 20, color = 'currentColor', stroke = 1.75, fill = 'none' }) {
  const raw = GlyphPaths[name] || GlyphPaths.dot;
  // Split path into tokens; custom tokens start with M_
  const tokens = raw.split(' M').map((seg, i) => (i === 0 ? seg : 'M' + seg));
  const shapes = tokens.map((t, i) => {
    if (t.startsWith('M_circle_')) {
      const parts = t.replace('M_circle_', '').split('_').map(Number);
      const [cx = 12, cy = 12, r = 8] = parts;
      return <circle key={i} cx={cx} cy={cy} r={r} />;
    }
    if (t.startsWith('M_rect_')) {
      const [x, y, w, h, rx] = t.replace('M_rect_', '').split('_').map(Number);
      return <rect key={i} x={x} y={y} width={w} height={h} rx={rx || 0} />;
    }
    return <path key={i} d={t} />;
  });
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      {shapes}
    </svg>
  );
}

const GLYPH_NAMES = Object.keys(GlyphPaths).filter(n => n !== 'dot');

Object.assign(window, { Glyph, GLYPH_NAMES });
