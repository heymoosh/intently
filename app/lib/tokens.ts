/**
 * Semantic design tokens. Placeholder values — final palette, type, and
 * spacing come from Claude Design (see docs/design/claude-design-brief.md).
 *
 * Rule: name by role, not appearance. No `bgGray`, `blueButton`. If a name
 * references a color or a specific component style, the abstraction is wrong.
 *
 * Structure is theme-keyed so dark mode can be swapped in later without a
 * rewrite. Only `light` is populated for v1 (hackathon scope).
 */

type ColorTheme = {
  PrimarySurface: string;
  SecondarySurface: string;
  PrimaryText: string;
  SupportingText: string;
  MutedText: string;
  FocusObject: string;
  FocusObjectText: string;
  QuestCard: string;
  QuestCardBorder: string;
  ReflectionCard: string;
  ReflectionCardBorder: string;
  ConfirmationBanner: string;
  ConfirmationBannerText: string;
  WarningBanner: string;
  WarningBannerText: string;
  UndoAffordance: string;
  PositiveAccent: string;
  WarnAccent: string;
  Divider: string;
  Scrim: string;
};

const lightColors: ColorTheme = {
  PrimarySurface: '#FAF7F2',
  SecondarySurface: '#F1ECE3',
  PrimaryText: '#1F1B16',
  SupportingText: '#5C564E',
  MutedText: '#8A8279',
  FocusObject: '#2B2A27',
  FocusObjectText: '#FAF7F2',
  QuestCard: '#FFFFFF',
  QuestCardBorder: '#E8E2D6',
  ReflectionCard: '#F6F1E7',
  ReflectionCardBorder: '#E2DBCB',
  ConfirmationBanner: '#E7EFE4',
  ConfirmationBannerText: '#2E3A2A',
  WarningBanner: '#F7EEDB',
  WarningBannerText: '#5E4A1C',
  UndoAffordance: '#8A4B2A',
  PositiveAccent: '#5A7A56',
  WarnAccent: '#B98A3B',
  Divider: '#ECE6D9',
  Scrim: 'rgba(31, 27, 22, 0.48)',
};

export const colors = {
  light: lightColors,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  pill: 999,
} as const;

export const typography = {
  display: { fontSize: 32, lineHeight: 40, fontWeight: '600' as const },
  heading: { fontSize: 22, lineHeight: 30, fontWeight: '600' as const },
  subheading: { fontSize: 18, lineHeight: 26, fontWeight: '500' as const },
  body: { fontSize: 17, lineHeight: 28, fontWeight: '400' as const },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' as const },
  mono: { fontSize: 13, lineHeight: 18, fontFamily: 'Menlo', fontWeight: '400' as const },
};

export const elevation = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  raised: {
    shadowColor: '#1F1B16',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  floating: {
    shadowColor: '#1F1B16',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 8,
  },
} as const;

export const motion = {
  quick: { duration: 150, easing: 'ease-out' as const },
  standard: { duration: 220, easing: 'ease-out' as const },
  deliberate: { duration: 280, easing: 'ease-out' as const },
};

export const theme = {
  colors: lightColors,
  spacing,
  radius,
  typography,
  elevation,
  motion,
};

export type Theme = typeof theme;
