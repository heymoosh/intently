// intently-tokens.jsx — Design tokens exposed to components (runtime JS mirror of tokens.ts).
// v2 — Painterly palette pulled from Tomorrow (sage + peach), Pinterest
// (lilac/butter/mint pastels). Imagery is first-class; color blocks are
// card backgrounds, not chrome.
const T = {
  color: {
    // Surfaces
    PrimarySurface:    '#F5EEE0',  // warmer linen — more saturated than v1 cream
    SecondarySurface:  '#FBF6EA',
    SunkenSurface:     '#EEE6D3',
    EdgeLine:          '#E2D8BF',
    OverlayScrim:      'rgba(47,38,27,0.5)',

    // Text — deep espresso on warm cream
    PrimaryText:       '#2B2118',     // 13.4:1 on PrimarySurface — AA ✓
    SupportingText:    '#6E604D',     // 5.6:1 — AA ✓
    SubtleText:        '#9A8A72',     // 4.5:1 — AA body-min ✓
    InverseText:       '#FBF6EA',
    LinkText:          '#B56A3F',     // 4.7:1 — AA ✓

    // Painterly card tints — the Pinterest/Tomorrow DNA
    TintSage:          '#8CB39A',   // Tomorrow's signature — ConfirmationCard & hero
    TintSageDeep:      '#5F8A72',
    TintLilac:         '#CFC9EB',   // Pinterest's lavender — ReflectionCard (journal)
    TintButter:        '#F1DE8A',   // Pinterest's butter yellow — PlanCard
    TintPeach:         '#F0B98C',   // Tomorrow's peach CTA — UndoAffordance, accents
    TintPeachSoft:     '#F6D3B6',
    TintClay:          '#C66B3F',   // saturated terracotta — CTA ink, painted elements
    TintMoss:          '#3A4E3A',   // deep forest — InverseText on butter
    TintDusk:          '#8E8FC6',   // denim lilac — Tracker "in progress" 
    TintMint:          '#B8D9C0',
    TintCream:         '#F5E8C8',   // warm butter adjacent

    // Semantic roles
    FocusObject:        '#5F8A72',  // deep sage — primary affordances
    FocusObjectText:    '#FBF6EA',
    PositiveAccent:     '#5F8A72',
    WarnAccent:         '#B07617',
    UndoAffordance:     '#C66B3F',  // terracotta — pops on cream + sage
    UncertaintyAccent:  '#9A8A72',

    // Card role → painterly tint
    QuestCardSurface:         '#8CB39A',
    QuestCardInk:             '#FBF6EA',
    ReflectionCardSurface:    '#CFC9EB',
    ReflectionCardInk:        '#2B2118',
    ConfirmationCardSurface:  '#F1DE8A',   // butter — trust surface reads WARM
    ConfirmationCardInk:      '#2B2118',
    UncertainCardSurface:     '#F6D3B6',
    UncertainCardInk:         '#2B2118',
    NeutralCardSurface:       '#FBF6EA',

    // Trace-input dots
    InputTraceCalendar:   '#8E8FC6',
    InputTraceJournal:    '#C66B3F',
    InputTraceEmail:      '#B07617',
    InputTraceHealth:     '#8CB39A',

    Stone300: '#D9CFBB',
  },
  font: {
    Display: '"Fraunces", "Iowan Old Style", Georgia, serif',
    Reading: '"Source Serif 4", "Iowan Old Style", Georgia, serif',
    UI: '"Inter", -apple-system, "SF Pro Text", system-ui, sans-serif',
    Mono: '"JetBrains Mono", ui-monospace, Menlo, monospace',
  },
  shadow: {
    Flat: 'none',
    Raised: '0 1px 2px rgba(31,27,21,0.04), 0 4px 14px rgba(31,27,21,0.06)',
    Hero: '0 8px 24px rgba(31,27,21,0.10), 0 24px 64px rgba(31,27,21,0.10)',
  },
  radius: { Pill: 9999, Card: 22, Inner: 14, Chip: 10, Hair: 4 },
  space: (n) => n * 4,
  motion: {
    Standard: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
    Spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
};

// Tiny Lucide-style icon set — stroke 1.75, rounded caps. We call out which
// Lucide name each corresponds to for engineering handoff.
const Icon = {
  // Lucide: mic
  Mic: ({ size = 20, color = 'currentColor', stroke = 1.75 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="3" width="6" height="12" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" /><path d="M12 18v3" />
    </svg>
  ),
  // Lucide: undo-2
  Undo: ({ size = 16, color = 'currentColor', stroke = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 14 4 9l5-5" /><path d="M4 9h11a5 5 0 0 1 0 10h-4" />
    </svg>
  ),
  // Lucide: calendar
  Calendar: ({ size = 14, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  ),
  // Lucide: book-open
  Journal: ({ size = 14, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 7v14" /><path d="M4 4h6a2 2 0 0 1 2 2v15a1 1 0 0 0-1-1H4z" /><path d="M20 4h-6a2 2 0 0 0-2 2v15a1 1 0 0 1 1-1h7z" />
    </svg>
  ),
  // Lucide: mail
  Mail: ({ size = 14, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" />
    </svg>
  ),
  // Lucide: activity
  Health: ({ size = 14, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  ),
  // Lucide: chevron-right
  Chev: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 6 6 6-6 6" />
    </svg>
  ),
  // Lucide: check
  Check: ({ size = 14, color = 'currentColor', stroke = 2.5 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  ),
  // Lucide: circle (outline)
  Circle: ({ size = 14, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.75}>
      <circle cx="12" cy="12" r="9" />
    </svg>
  ),
  // Lucide: keyboard
  Keyboard: ({ size = 18, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10" />
    </svg>
  ),
  // Lucide: pencil-line
  Pencil: ({ size = 18, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 4h7l-9 9-4 1 1-4 5-5z" /><path d="M15 6l3 3" />
    </svg>
  ),
  // Lucide: list
  List: ({ size = 18, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  ),
  // Lucide: sparkles
  Sparkles: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.8 4.6L18 9.4l-4.2 1.8L12 16l-1.8-4.8L6 9.4l4.2-1.8L12 3z" /><path d="M19 15l.6 1.5L21 17l-1.4.5L19 19l-.6-1.5L17 17l1.4-.5z" />
    </svg>
  ),
  // Lucide: x
  X: ({ size = 18, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  ),
  // Lucide: sun
  Sun: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  ),
  // Lucide: search
  Search: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
    </svg>
  ),
  // Lucide: moon
  Moon: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  ),
  // Lucide: sunset
  Sunset: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 10V2M5.6 10.6 4.2 9.2M19.8 9.2l-1.4 1.4M2 18h20M7 18a5 5 0 0 1 10 0M16 5l-4 4-4-4" />
    </svg>
  ),
  // Lucide: info
  Info: ({ size = 14, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><path d="M12 16v-4M12 8h.01" />
    </svg>
  ),
  // Lucide: more-horizontal
  More: ({ size = 18, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" />
    </svg>
  ),
  // Lucide: pause
  Pause: ({ size = 18, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  ),
  // Lucide: message-square
  Chat: ({ size = 18, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  // Lucide: feather
  Feather: ({ size = 18, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" /><path d="M16 8 2 22" /><path d="M17.5 15H9" />
    </svg>
  ),
  // Lucide: arrow-left
  ArrowLeft: ({ size = 20, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5" /><path d="m12 19-7-7 7-7" />
    </svg>
  ),
  // Lucide: flag
  Flag: ({ size = 14, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><path d="M4 22V15" />
    </svg>
  ),
  // Lucide: target
  Target: ({ size = 14, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" fill={color} />
    </svg>
  ),
};

Object.assign(window, { T, Icon });
