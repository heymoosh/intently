// eslint.config.mjs — flat config (ESLint 9.x).
//
// Scope: web/*.jsx only (the deployed prototype, loaded via <script type="text/babel">).
// We don't lint app/ (Expo/TS, historical reference per ADR 0004) or supabase/functions/
// (TypeScript on Deno runtime; separate effort if needed).
//
// Why flat config: cleaner globals-per-glob expression than .eslintrc + overrides;
// works well with our no-bundler setup. Sourced as `script` (not `module`) because
// the prototype files are IIFEs, not ES modules, and they cross-reference via window.*.
//
// Stub-handler detection: `no-empty-function` flags `() => {}` and `function() {}`
// patterns. That's the load-bearing rule for catching `onClick={() => {}}` /
// `onEdit={() => {}}` shipping by accident. We do NOT enable a separate
// JSX-handler rule because no-empty-function already covers the case at the
// expression level, before JSX-prop binding is even relevant.
//
// `no-undef` is OFF for web/*.jsx — the files use heavy globals (T, Icon, Glyph,
// LandscapePanel, etc.) by design; declaring every one is whack-a-mole. The
// load-bearing check for "did you reference an undefined component?" is
// `react/jsx-no-undef` which is still on, with cross-file components published
// via `Object.assign(window, …)` declared as globals below.
//
// `react/jsx-uses-vars` is enabled so JSX usage counts as "use" for
// no-unused-vars (otherwise component definitions used only as <JSX/> are
// flagged as dead).

import react from 'eslint-plugin-react';
import globals from 'globals';

// Cross-file globals published via `Object.assign(window, …)` from sibling
// .jsx / lib .js files. ESLint sourceType:'script' has no module graph, so
// we list the publish surface explicitly. Discover via:
//   grep -rn "Object.assign(window" web/
//
// If you add a new component to a published list, add it here too — the
// build-watchdog will flag the missing global on the next iteration.
const PROTOTYPE_GLOBALS = {
  // intently-tokens.jsx
  T: 'readonly', Icon: 'readonly',
  // intently-glyphs.jsx
  Glyph: 'readonly', GLYPH_NAMES: 'readonly',
  // intently-imagery.jsx
  PainterlyBlock: 'readonly', Collage: 'readonly', MorningLight: 'readonly',
  LandscapePanel: 'readonly', ColorTile: 'readonly', DotGridBackdrop: 'readonly',
  // intently-cards.jsx
  TrackerCard: 'readonly', PlanCard: 'readonly', JournalCard: 'readonly',
  ConfirmationCard: 'readonly', FeatureCard: 'readonly', RingProgress: 'readonly',
  InputTrace: 'readonly', ConfidenceDot: 'readonly', Avatar: 'readonly',
  // intently-hero.jsx
  HeroAffordance: 'readonly', HeroListening: 'readonly', HeroChat: 'readonly',
  VoiceWaveform: 'readonly', ProcessingArc: 'readonly',
  // intently-journal.jsx
  PastJournal: 'readonly', YearView: 'readonly', MonthView: 'readonly',
  WeekView: 'readonly', DayView: 'readonly', JournalHeader: 'readonly',
  TenseNav: 'readonly', TenseNavArrows: 'readonly',
  // intently-projects.jsx
  PROJECT_DATA: 'readonly', ProjectCard: 'readonly', ProjectDetail: 'readonly',
  ProjectsBand: 'readonly',
  // intently-screens.jsx
  PastScreen: 'readonly', PresentScreen: 'readonly', FutureScreen: 'readonly',
  ScreenHeader: 'readonly',
  // intently-shell.jsx
  SwipeShell: 'readonly', SwipeDots: 'readonly',
  // intently-manual-add.jsx
  AddRow: 'readonly', InlineAdd: 'readonly', AddZone: 'readonly',
  useManualAdds: 'readonly',
  // intently-screens-prototype.jsx
  PresentPlanProto: 'readonly', FutureScreenProto: 'readonly',
  ProjectDetailProto: 'readonly',
  // intently-flows.jsx
  parseAgentPlan: 'readonly', GOAL_DATA: 'readonly', PROJECT_EXTRAS: 'readonly',
  GoalDetail: 'readonly', ProjectDetailV2: 'readonly',
  BriefFlow: 'readonly', ReviewFlow: 'readonly', WeeklyReviewFlow: 'readonly',
  MonthlyRefreshFlow: 'readonly', SetupFlow: 'readonly',
  PresentEmpty: 'readonly', PresentClosed: 'readonly', UndoToast: 'readonly',
  usePopulate: 'readonly', MOCK_PLAN: 'readonly', PLAN_DATA: 'readonly',
  showUndoToast: 'readonly', FLAG_META: 'readonly',
  // intently-extras.jsx
  JournalComposer: 'readonly', ConnectionsPage: 'readonly', OAuthFlow: 'readonly',
  ProfileButton: 'readonly', OnboardingConnectCard: 'readonly',
  INTEGRATIONS: 'readonly', useConnections: 'readonly',
  formatLastSync: 'readonly',
  // intently-profile.jsx
  ProfileSheet: 'readonly', AccountPage: 'readonly', PreferencesPage: 'readonly',
  HelpPage: 'readonly',
  getPref: 'readonly', setPref: 'readonly', getAllPrefs: 'readonly',
  // intently-reading.jsx
  ReadingMode: 'readonly',
  // ios-frame.jsx
  IOSDevice: 'readonly', IOSStatusBar: 'readonly', IOSNavBar: 'readonly',
  IOSGlassPill: 'readonly', IOSList: 'readonly', IOSListRow: 'readonly',
  IOSKeyboard: 'readonly',
  // design-canvas.jsx
  DesignCanvas: 'readonly', DCSection: 'readonly', DCArtboard: 'readonly',
  DCPostIt: 'readonly',
  // ─── lib/*.js — wired runtime helpers ──────────────────────────────────────
  // lib/agent-output.js
  kindMetaFor: 'readonly', formatGeneratedAt: 'readonly',
  labelForInputTrace: 'readonly',
  parseReviewProse: 'readonly', parseBriefProse: 'readonly',
  parseAgentReview: 'readonly', parseAgentWeeklyReview: 'readonly',
  // lib/context-assembler.js
  assembleBriefContext: 'readonly', assembleReviewContext: 'readonly',
  assembleWeeklyReviewContext: 'readonly',
  assembleMonthlyRefreshContext: 'readonly',
  parseMonthlyRefreshResponse: 'readonly',
  assembleSetupContext: 'readonly', parseSetupResponse: 'readonly',
  labelForConsulted: 'readonly',
  // lib/entities.js
  insertGoal: 'readonly', listGoals: 'readonly',
  insertProject: 'readonly', listProjects: 'readonly',
  addProjectTodo: 'readonly', toggleProjectTodo: 'readonly',
  insertPlanItem: 'readonly', listPlanItems: 'readonly',
  insertJournalEntry: 'readonly', updateJournalEntry: 'readonly',
  listJournalEntries: 'readonly',
  insertAdminReminder: 'readonly', listAdminReminders: 'readonly',
  // lib/user-profile.js
  getCurrentProfile: 'readonly', useUserProfile: 'readonly',
  // lib/ma-client.js
  callMaProxy: 'readonly', toAgentOutput: 'readonly', MaProxyError: 'readonly',
  // lib/reminders.js
  fetchDueReminders: 'readonly', formatRemindersForInput: 'readonly',
  classifyTranscript: 'readonly',
  // lib/seed-sam-data.js
  SAM_GOALS: 'readonly', SAM_PROJECTS: 'readonly', SAM_JOURNAL: 'readonly',
  SAM_YESTERDAY_REVIEW: 'readonly', SAM_TODAY_BRIEF: 'readonly',
  SAM_WEEKLY_REVIEW: 'readonly', SAM_TODAY_PLAN: 'readonly',
  SAM_REMINDERS: 'readonly', SAM_CALENDAR_TODAY: 'readonly',
  SAM_EMAIL_FLAGS: 'readonly',
  // lib/seed-sam.js
  seedSamIfEmpty: 'readonly', seedSamCalendarEmailIfEmpty: 'readonly',
  clearAllUserData: 'readonly',
  // lib/supabase.js
  getSupabaseClient: 'readonly', getCurrentUserId: 'readonly',
  ensureAuthSession: 'readonly',
  // lib/voice.js
  useVoiceInput: 'readonly',
  // index.html runtime config
  INTENTLY_CONFIG: 'readonly', INTENTLY_DEV: 'readonly',
  INTENTLY_DEMO: 'readonly',
  INTENTLY_FORCE_STATE: 'readonly',
  // CDN-loaded (via <script>)
  React: 'readonly', ReactDOM: 'readonly', supabase: 'readonly', Babel: 'readonly',
};

export default [
  {
    files: ['web/**/*.jsx'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'script',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        ...PROTOTYPE_GLOBALS,
      },
    },
    plugins: {
      react,
    },
    settings: {
      react: { version: '18.3' },
    },
    rules: {
      // Flags `() => {}` and `function() {}` — catches stub handlers like
      // `onClick={() => {}}` shipping by accident. THIS IS THE LOAD-BEARING
      // RULE for build-watchdog teeth.
      'no-empty-function': 'error',
      // Catches references to undefined JSX components — would have flagged
      // the missing-Avatar component before it shipped.
      'react/jsx-no-undef': 'error',
      // Tells `no-unused-vars` that <JSX usage/> counts as use. Without this,
      // every component used only via JSX is flagged as dead.
      'react/jsx-uses-vars': 'error',
      'react/jsx-uses-react': 'error',
      // Catches dead state/imports. `args: 'none'` because handler signatures
      // routinely accept event args they don't use; `caughtErrors: 'none'`
      // because `} catch (e) { /* swallow */ }` is an idiomatic silent-fail
      // pattern in this prototype — we don't want every catch flagged.
      'no-unused-vars': ['error', { args: 'none', caughtErrors: 'none' }],
      // OFF: the prototype files use heavy window.* globals; rely on
      // react/jsx-no-undef for component-level safety. The PROTOTYPE_GLOBALS
      // table above declares the cross-file publish surface.
      'no-undef': 'off',
    },
  },
];
