// tokens.ts — Intently design tokens (React Native)
// Source: docs/design/Intently - App/tokens.ts
// Translations applied: CSS box-shadow → RN shadow props, web font stacks →
// expo-google-fonts constants, typography scale family+weight → fontFamily,
// a11y.FocusRing CSS string → FocusBorder style object.

export const palette = {
  cream:    { 50: '#FBF8F2', 100: '#F7F3EC', 200: '#F0EBE0', 300: '#E6DFCF' },
  ink:      { 900: '#1F1B15', 700: '#3A342A', 500: '#6B6558', 400: '#8A8376', 300: '#AFA99B' },
  sage:     { 50: '#EAF1E9', 200: '#B9D0B5', 400: '#7FA27A', 600: '#537A4F', 700: '#3F6040' },
  terra:    { 50: '#F7E8E0', 200: '#E6B9A4', 400: '#C87A5A', 600: '#A3583C', 700: '#7E4128' },
  amber:    { 50: '#FAEFD6', 400: '#D9A24A', 600: '#A3731F' },
  stone:    { 100: '#EFEAE0', 200: '#E2DCCE', 300: '#CFC8B7' },
};

export const light = {
  colors: {
    // Surfaces
    PrimarySurface:       palette.cream[100],
    SecondarySurface:     palette.cream[50],
    SunkenSurface:        palette.cream[200],
    EdgeLine:             '#E2DBCB',
    OverlayScrim:         'rgba(31,27,21,0.45)',

    // Text
    PrimaryText:          palette.ink[900],
    SupportingText:       palette.ink[500],
    SubtleText:           palette.ink[400],
    InverseText:          palette.cream[50],
    LinkText:             palette.terra[600],

    // Agent-role accents
    FocusObject:          palette.sage[600],
    FocusObjectText:      palette.cream[50],
    PositiveAccent:       palette.sage[600],
    WarnAccent:           palette.amber[600],
    UndoAffordance:       palette.terra[600],
    UncertaintyAccent:    palette.ink[400],

    // Card roles
    QuestCardSurface:          palette.cream[50],
    QuestCardEdge:             '#E8E1D0',
    ReflectionCardSurface:     palette.cream[50],
    ReflectionCardAccent:      palette.ink[700],
    ConfirmationCardSurface:   palette.sage[50],
    ConfirmationCardEdge:      palette.sage[200],
    UncertainCardSurface:      palette.cream[100],
    UncertainCardEdge:         palette.stone[300],
    UncertainCardEdgeDashed:   true,

    // Agent-state signals
    AgentIdle:            palette.ink[900],
    AgentListening:       palette.sage[600],
    AgentProcessing:      palette.ink[500],
    AgentUncertain:       palette.amber[600],
    AgentWaiting:         palette.stone[300],

    // Input-trace dots
    InputTraceCalendar:   palette.sage[400],
    InputTraceJournal:    palette.terra[400],
    InputTraceEmail:      palette.amber[400],
    InputTraceHealth:     palette.ink[400],
  },

  typography: {
    fonts: {
      // Google Fonts loaded via @expo-google-fonts; strings are the package constants.
      Display:     'Fraunces_500Medium',
      DisplayBold: 'Fraunces_600SemiBold',
      Reading:     'SourceSerif4_400Regular',
      UI:          'Inter_400Regular',
      UIMedium:    'Inter_500Medium',
      UISemi:      'Inter_600SemiBold',
      Mono:        'JetBrainsMono_400Regular',
      // OS fallbacks for when the Google font fails to load.
      FallbackSerif: 'Georgia',
      FallbackSans:  'System',
      FallbackMono:  'Menlo',
    },
    scale: {
      DisplayXL: { fontFamily: 'Fraunces_500Medium',       fontSize: 44, lineHeight: 48, letterSpacing: -0.8 },
      DisplayL:  { fontFamily: 'Fraunces_500Medium',       fontSize: 34, lineHeight: 40, letterSpacing: -0.6 },
      DisplayM:  { fontFamily: 'Fraunces_500Medium',       fontSize: 28, lineHeight: 34, letterSpacing: -0.4 },
      HeadingL:  { fontFamily: 'Fraunces_600SemiBold',     fontSize: 22, lineHeight: 28, letterSpacing: -0.2 },
      HeadingM:  { fontFamily: 'Inter_600SemiBold',        fontSize: 17, lineHeight: 22, letterSpacing: -0.2 },
      ReadingL:  { fontFamily: 'SourceSerif4_400Regular',  fontSize: 19, lineHeight: 30, letterSpacing: 0 },
      ReadingM:  { fontFamily: 'SourceSerif4_400Regular',  fontSize: 17, lineHeight: 27, letterSpacing: 0 },
      BodyM:     { fontFamily: 'Inter_400Regular',         fontSize: 15, lineHeight: 22, letterSpacing: -0.1 },
      BodyS:     { fontFamily: 'Inter_400Regular',         fontSize: 13, lineHeight: 18, letterSpacing: 0 },
      Label:     { fontFamily: 'Inter_600SemiBold',        fontSize: 12, lineHeight: 16, letterSpacing: 0.4 },
      Caption:   { fontFamily: 'Inter_500Medium',          fontSize: 11, lineHeight: 14, letterSpacing: 0.2 },
    },
  },

  spacing: { '0': 0, '1': 4, '2': 8, '3': 12, '4': 16, '5': 24, '6': 32, '7': 48, '8': 64 },

  radius: {
    Pill:  9999,
    Card:  22,
    Inner: 14,
    Chip:  10,
    Hair:  4,
  },

  elevation: {
    Flat: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    Raised: {
      shadowColor: '#1F1B15',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 14,
      elevation: 3,
    },
    Hero: {
      shadowColor: '#1F1B15',
      shadowOffset: { width: 0, height: 24 },
      shadowOpacity: 0.10,
      shadowRadius: 64,
      elevation: 10,
    },
  },

  motion: {
    duration: { Micro: 120, Short: 180, Base: 240, Screen: 300 },
    easing: {
      Standard: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
      Enter:    'cubic-bezier(0.0, 0.0, 0.2, 1)',
      Exit:     'cubic-bezier(0.4, 0.0, 1, 1)',
      Spring:   'cubic-bezier(0.34, 1.56, 0.64, 1)',
    },
  },

  a11y: {
    MinTapTarget:     44,
    UndoMinTapTarget: 48,
    FocusBorder: {
      borderColor: '#537A4F',
      borderWidth: 2,
      borderRadius: 4,
      gap: 2,
    },
  },
};

export const theme = { light };
export type Theme = typeof light;
