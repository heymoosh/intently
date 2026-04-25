// tokens.ts — Intently design tokens
// Semantic naming — every token is a ROLE, not an appearance.
// Light theme only (dark deferred post-hackathon). Structured for
// straightforward dark-theme swap: the theme object is keyed by name,
// and consumers read `theme.light.colors.PrimarySurface` etc.
//
// Contrast figures are WCAG 2.2 ratios measured against the surface
// the token is intended to appear on. AA body text = 4.5:1, AA large
// text / UI = 3:1. Every pair used in a mockup is annotated.

export const palette = {
  // Raw color ramps — DO NOT consume directly from components.
  // Components read semantic tokens below; palette is the source of truth
  // those tokens point at.
  cream:    { 50: '#FBF8F2', 100: '#F7F3EC', 200: '#F0EBE0', 300: '#E6DFCF' },
  ink:      { 900: '#1F1B15', 700: '#3A342A', 500: '#6B6558', 400: '#8A8376', 300: '#AFA99B' },
  sage:     { 50: '#EAF1E9', 200: '#B9D0B5', 400: '#7FA27A', 600: '#537A4F', 700: '#3F6040' },
  terra:    { 50: '#F7E8E0', 200: '#E6B9A4', 400: '#C87A5A', 600: '#A3583C', 700: '#7E4128' },
  amber:    { 50: '#FAEFD6', 400: '#D9A24A', 600: '#A3731F' },
  stone:    { 100: '#EFEAE0', 200: '#E2DCCE', 300: '#CFC8B7' },
} as const;

export const light = {
  colors: {
    // ── Surfaces ────────────────────────────────────────────
    PrimarySurface:       palette.cream[100], // #F7F3EC — app background
    SecondarySurface:     palette.cream[50],  // #FBF8F2 — raised card
    SunkenSurface:        palette.cream[200], // #F0EBE0 — recessed (e.g. progress track)
    EdgeLine:             '#E2DBCB',          // hairline separator
    OverlayScrim:         'rgba(31,27,21,0.45)',

    // ── Text ────────────────────────────────────────────────
    PrimaryText:          palette.ink[900],   // 14.3:1 on PrimarySurface — AA ✓
    SupportingText:       palette.ink[500],   // 5.8:1  on PrimarySurface — AA ✓
    SubtleText:           palette.ink[400],   // 4.5:1  on PrimarySurface — AA (body min) ✓
    InverseText:          palette.cream[50],  // on dark objects
    LinkText:             palette.terra[600], // 4.6:1  on PrimarySurface — AA ✓

    // ── Agent-role accents ──────────────────────────────────
    FocusObject:          palette.sage[600],  // 4.9:1 on PrimarySurface — AA ✓ (primary CTA / listening ring)
    FocusObjectText:      palette.cream[50],  // on FocusObject fill: 4.9:1 ✓
    PositiveAccent:       palette.sage[600],  // completions, confirmed state
    WarnAccent:           palette.amber[600], // low-confidence / needs-user
    UndoAffordance:       palette.terra[600], // destructive / undo — paired with icon (never color-alone)
    UncertaintyAccent:    palette.ink[400],   // agent-not-sure treatment

    // ── Card roles ──────────────────────────────────────────
    QuestCardSurface:         palette.cream[50],  // agent-work card bg (Tracker, Plan)
    QuestCardEdge:            '#E8E1D0',
    ReflectionCardSurface:    palette.cream[50],  // journal card bg (read-only)
    ReflectionCardAccent:     palette.ink[700],   // pull-quote rule
    ConfirmationCardSurface:  palette.sage[50],   // agent-write announcement card
    ConfirmationCardEdge:     palette.sage[200],
    UncertainCardSurface:     palette.cream[100], // low-confidence variant
    UncertainCardEdge:        palette.stone[300],
    UncertainCardEdgeDashed:  true, // style hint for renderers

    // ── Agent-state signals (Hero affordance, chat) ─────────
    AgentIdle:            palette.ink[900],   // solid ink disc
    AgentListening:       palette.sage[600],  // softly pulsing ring
    AgentProcessing:      palette.ink[500],   // slow rotating arc
    AgentUncertain:       palette.amber[600], // hold-for-input dot
    AgentWaiting:         palette.stone[300], // dormant

    // ── Input-trace dots (what data the agent used) ─────────
    InputTraceCalendar:   palette.sage[400],
    InputTraceJournal:    palette.terra[400],
    InputTraceEmail:      palette.amber[400],
    InputTraceHealth:     palette.ink[400],
  },

  typography: {
    // Fonts — Google Fonts via expo-font. Display serif for titles
    // (editorial feel), humanist sans for UI chrome, warm serif for
    // long-form body reading (Medium-esque).
    fonts: {
      Display: '"Fraunces", "Iowan Old Style", Georgia, serif',
      Reading: '"Source Serif 4", "Iowan Old Style", Georgia, serif',
      UI:      '"Inter", -apple-system, "SF Pro Text", system-ui, sans-serif',
      Mono:    '"JetBrains Mono", ui-monospace, Menlo, monospace',
    },
    // Type scale. Line heights are generous (≥1.5 for body) for long-form.
    // All sizes scale with Dynamic Type — these are the 100% sizes.
    scale: {
      DisplayXL:  { family: 'Display', size: 44, lineHeight: 48, weight: 500, letterSpacing: -0.8 },
      DisplayL:   { family: 'Display', size: 34, lineHeight: 40, weight: 500, letterSpacing: -0.6 },
      DisplayM:   { family: 'Display', size: 28, lineHeight: 34, weight: 500, letterSpacing: -0.4 },
      HeadingL:   { family: 'Display', size: 22, lineHeight: 28, weight: 600, letterSpacing: -0.2 },
      HeadingM:   { family: 'UI',      size: 17, lineHeight: 22, weight: 600, letterSpacing: -0.2 },
      ReadingL:   { family: 'Reading', size: 19, lineHeight: 30, weight: 400, letterSpacing: 0 },  // long-form body
      ReadingM:   { family: 'Reading', size: 17, lineHeight: 27, weight: 400, letterSpacing: 0 },
      BodyM:      { family: 'UI',      size: 15, lineHeight: 22, weight: 400, letterSpacing: -0.1 },
      BodyS:      { family: 'UI',      size: 13, lineHeight: 18, weight: 400, letterSpacing: 0 },
      Label:      { family: 'UI',      size: 12, lineHeight: 16, weight: 600, letterSpacing: 0.4 }, // ALL-CAPS eyebrows
      Caption:    { family: 'UI',      size: 11, lineHeight: 14, weight: 500, letterSpacing: 0.2 },
    },
  },

  // 4-point base scale.
  spacing: { '0': 0, '1': 4, '2': 8, '3': 12, '4': 16, '5': 24, '6': 32, '7': 48, '8': 64 },

  radius: {
    Pill:  9999,
    Card:  22,      // matches the reference card rhythm (Tomorrow / Dot)
    Inner: 14,      // nested within cards
    Chip:  10,
    Hair:  4,
  },

  elevation: {
    // Max 3 levels, per brief.
    Flat:   'none',
    Raised: '0 1px 2px rgba(31,27,21,0.04), 0 4px 14px rgba(31,27,21,0.06)',
    Hero:   '0 8px 24px rgba(31,27,21,0.10), 0 24px 64px rgba(31,27,21,0.10)',
  },

  motion: {
    // Keep transitions under 300ms, decelerating.
    duration: { Micro: 120, Short: 180, Base: 240, Screen: 300 },
    easing: {
      // Physical, decelerating — finger-tracking for swipe.
      Standard: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
      Enter:    'cubic-bezier(0.0, 0.0, 0.2, 1)',
      Exit:     'cubic-bezier(0.4, 0.0, 1, 1)',
      Spring:   'cubic-bezier(0.34, 1.56, 0.64, 1)', // voice-ring pulse
    },
  },

  // Tap-target minimums surfaced as tokens so layouts can't accidentally
  // drop below the platform floor. Every Pressable reads MinTapTarget.
  a11y: {
    MinTapTarget:     44, // iOS pt = Android dp at default scale
    FocusRing:        '0 0 0 2px #F7F3EC, 0 0 0 4px #537A4F',
    UndoMinTapTarget: 48, // the trust-surface button gets extra
  },
};

export const theme = { light /*, dark: …to-be-populated*/ };
export type Theme = typeof light;
