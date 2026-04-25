# `web/RN-PORTING-OBSTACLES.md` — RN-only surfaces vs plain-React equivalents

**Generated:** 2026-04-25 by overnight build loop iteration 2 (analysis-only).
**Source branch:** `auto/build-loop/2026-04-25-02-rn-porting-obstacles`.
**Purpose:** Saturday's wiring port uses this doc to know which RN code is already covered by the prototype (delete it) vs which functional behavior is missing from `web/` (add it during the port). Pairs with `web/PORTING.md` (lib inventory) and the forthcoming `web/WIRING-POINTS.md` (event wiring map).

## How to read this doc

- **Verdicts:**
  - `THROWAWAY` — the prototype JSX in `web/` already implements the same UX with the equivalent plain-React construct. Saturday session deletes the RN code; nothing needs porting because `web/` already covers it.
  - `SATURDAY-PORT-TASK` — the prototype is missing this behavior. The wiring port must add the equivalent functional logic (an event handler, a state hook, a fetch, etc.) into the prototype JSX before the RN file can be deleted.
  - `MIXED` — some uses of the construct are throwaway (style/layout duplicated in prototype); some are port-tasks (carry behavior the prototype lacks). The notes break down which-is-which.
- **`web/` already runs as plain React 18 + Babel-standalone in `index.html`.** No build step. JSX files attach exports to `window` via `Object.assign(window, {...})`. So when this doc says "the prototype's equivalent is `<div>`," that's literally what the file already contains; the RN port just deletes the wrapping `<View>` / `StyleSheet.create` glue.
- **Construct-by-construct catalog first; then per-component port notes; then App.tsx walkthrough; then a Saturday recommendations section at the end.**
- **All file:line citations are stable as of commit-time on this branch.** If `web/intently-flows.jsx` shifts, re-grep `^function `.

## Top-level findings

1. **Most RN constructs are pure THROWAWAY.** `<View>` → `<div>`, `<Text>` → `<span>`/`<div>`, `<Pressable>` → `<button>`, `StyleSheet.create` → inline `style={{}}`, `<ScrollView>` → `<div style={{ overflowY:'auto' }}>` are all already used by every prototype JSX file. The RN style is verbose; the DOM equivalent is what `web/` already runs.
2. **The bulk of SATURDAY-PORT-TASK work is in `App.tsx` (~200 lines of wiring, not visual).** The prototype has no agent-state hooks (`liveBrief` / `liveReview` / `liveWeekly`), no `runAgent` MA dispatch, no clock/URL phase derivation, no auto-fire-weekly latch on Past slot, no `derivePhase`-from-`?phase=` URL override. These are the load-bearing wiring beats from `App.tsx:299-734`. The prototype's `intently-shell.jsx` has a 3-screen swipe; `App.tsx` has a 21-slot infinite-rotation pager (`CYCLES * SCREENS_PER_CYCLE`) — the rotation behavior is a SATURDAY-PORT-TASK, not throwaway, since the prototype only does 3 slots.
3. **`VoiceModal.tsx` is the highest-leverage SATURDAY-PORT-TASK.** The prototype's `HeroAffordance` + `HeroListening` (`intently-hero.jsx:29-313`) renders the listening UI but doesn't wire `useVoiceInput` (Web Speech API) or `classifyTranscript` (Supabase POST). The hook itself (`app/lib/voice.ts`) is `light-touch` per PORTING.md; the obstacle is wiring it into the prototype's existing `HeroListening` shell rather than carrying `VoiceModal.tsx` forward as a new component.
4. **All four `BriefFlow` / `ReviewFlow` / `BriefConfirmCard` / `ReviewConfirmCard` are MIXED.** The prototype's `intently-flows.jsx:454-1027` already covers the script-walk + chat bubbles + typing dots + confirm-card pattern with the same scripted shape. **Throwaway:** the visual walk + state machine. **Port-task:** the `onAccept` callback wiring to `handleBriefAccept` / `handleReviewAccept` (which fire the MA call and pass user answers as the `Today (in your words)` block) — prototype's `onComplete` accepts a `MOCK_PLAN` instead of running an agent.
5. **`tokens.ts` is confirmed THROWAWAY (resolves PORTING.md OQ1).** `web/intently-tokens.jsx` ships every token field `tokens.ts` does, in browser-native shape: shadows are CSS strings (`T.shadow.Raised = '0 1px 2px rgba(...), 0 4px 14px rgba(...)'`), fonts are font-family strings (`T.font.Display = '"Fraunces", "Iowan Old Style", Georgia, serif'`), spacing is `T.space(n)` not `tokens.ts`'s nested `spacing['5']`. Token *names* differ slightly (`T.color.PrimarySurface` vs `t.colors.PrimarySurface` — capitalization + nested `colors`/`color` namespace) — Saturday must rewrite all `t.colors.X` references during the port, but the values are 1:1.
6. **`PainterlyBlock` and `MorningLight` are pure THROWAWAY.** `web/intently-imagery.jsx:23-128` has both with the same blob recipe (`intently-imagery.jsx:25-30` matches `app/components/painterly/PainterlyBlock.tsx:39-44` exactly), the same SVG horizon path, the same grain `<style>` injection. The RN version's `react-native-svg` + `Platform.OS === 'web'` checks are pure overhead the DOM version skips.

## OPEN QUESTIONS

1. **Pager rotation infinite-scroll vs 3-slot prototype.** `App.tsx:250-253` ships `CYCLES = 7, SCREENS_PER_CYCLE = 3, TOTAL_SLOTS = 21, INITIAL_SLOT = 10` — the user can swipe back/forward indefinitely through the rotation. The prototype's `SwipeShell` (`intently-shell.jsx:3-57`) only has 3 children with rubberband at edges. Saturday call: keep the simpler 3-slot prototype shell (and accept that "swipe past Future loops back" is a missing demo nuance), or port the 21-slot rotation into the prototype? Recommendation: keep the 3-slot prototype for the demo unless infinite rotation is on the demo storyboard. Either way, the keyboard arrow-key handler (`App.tsx:343-361`) is a SATURDAY-PORT-TASK regardless.
2. **`MorningLight` exists in both `web/` and `app/`, but `App.tsx` doesn't actually use it.** `App.tsx:22` imports `PainterlyBlock` only, not `MorningLight`. `MorningLight.tsx` is only referenced from imports we can't see (none, on grep). Confirm Saturday: is `MorningLight` dead code in `app/`? If yes, port it as a no-op THROWAWAY. If it's intended for the brief hero panel later, it's already in `intently-imagery.jsx:102-128` ready to import.
3. **`@ronradtke/react-native-markdown-display` has no obvious DOM equivalent in prototype.** The prototype's daily-brief / review JSX hard-codes the body shape (`intently-flows.jsx:608-635 MOCK_PLAN` is JS objects, rendered via plain JSX); it doesn't parse markdown. `App.tsx` and `AgentOutputCard.tsx` both render arbitrary `output.body` markdown via the `<Markdown>` component. **Decision needed:** Saturday must pick a markdown lib (e.g. `marked` UMD `<script>` + `dangerouslySetInnerHTML`, or `react-markdown` UMD if one exists) OR have the agent emit pre-rendered HTML / structured JSON instead of raw markdown. This is a **bonus SATURDAY-PORT-TASK** that PORTING.md didn't catch.
4. **`expo-google-fonts` package imports become Google Fonts `<link>` tags.** `App.tsx:1-4` loads four font families (`Fraunces`, `Inter`, `JetBrainsMono`, `SourceSerif4`) via `useFonts()` + the `@expo-google-fonts/*` packages — this is Expo's font-loading lifecycle. The prototype's `index.html` likely already has Google Fonts `<link>` tags (verify with `grep fonts.googleapis.com web/index.html`); if not, Saturday adds them. Either way, the `useFonts` hook + the `if (!fontsLoaded) return null;` gate (`App.tsx:257-265, 363`) are THROWAWAY — browsers swap fonts in via FOUT, no JS gating needed.
5. **`react-native-web`'s `backgroundImage` passthrough cast** (`App.tsx:232, 789`) becomes a non-issue in plain JSX — `style={{ backgroundImage: '...' }}` works directly. Throwaway.

## RN-only construct catalog

### `<View>` — generic container

**Where it appears:**
- All 9 component files + `App.tsx`. Roughly 80% of all RN JSX in the audit. Examples: `App.tsx:86, 100, 134, 157, 498, 520`; `BriefFlow.tsx:161, 196`; `GoalDetail.tsx:33, 39, 60, 89, 98`; `ReviewFlow.tsx:223, 244`; `VoiceModal.tsx:78, 89`; `JournalEditor.tsx:41, 64`; `ProjectCard.tsx:30, 31, 34, 43, 44`; `ProjectDetail.tsx:38, 40, 60, 79`; `AgentOutputCard.tsx:44, 52, 58, 65`; both painterly files (`PainterlyBlock.tsx:56, 60`; `MorningLight.tsx:21`).

**Plain-React equivalent the prototype uses:**
- `<div style={{...}}>` — every prototype file. `intently-flows.jsx:489` (`<div style={{ position: 'absolute', inset: 0, zIndex: 60, ...}}`); `intently-cards.jsx:7-11`; `intently-shell.jsx:36-45`.

**Verdict:** THROWAWAY (every use).

**Notes:** RN's `<View>` is just a styled `<div>` on web (react-native-web). The `StyleSheet.create` glue isn't necessary on the DOM; inline `style={{}}` works. RN's `pointerEvents="none"` becomes CSS `pointerEvents: 'none'`. RN's `accessibilityLabel` becomes `aria-label`.

---

### `<Text>` — text node

**Where it appears:**
- All 9 components + `App.tsx`. Examples: `App.tsx:88, 101, 137, 605`; `AgentOutputCard.tsx:59, 60, 87`; `BriefFlow.tsx:165, 173, 219, 241, 245, 282, 287`; `GoalDetail.tsx:46, 53, 56, 63, 70, 73`; `JournalEditor.tsx:44, 46, 60, 92`; `ProjectCard.tsx:35, 39, 40`; `ProjectDetail.tsx:46, 56, 63, 71, 73, 86`; `ReviewFlow.tsx:227, 235, 282, 286`; `VoiceModal.tsx:81, 83, 84, 91, 108`.

**Plain-React equivalent the prototype uses:**
- `<div>` for block-level text, `<span>` for inline. The prototype isn't strict about `<span>` vs `<div>` for text — it picks based on layout context. Examples: `intently-cards.jsx:13` (`<span style={{ fontFamily: T.font.UI, ...}}>Used</span>`); `intently-flows.jsx:498-499` (label inside header); `intently-projects.jsx:107` (`<div style={{ fontFamily: T.font.Display, ...}}>{p.name}</div>`).

**Verdict:** THROWAWAY (every use).

**Notes:** `<Text>` exists in RN because native iOS/Android need a different primitive than divs for text — the web doesn't. `<span>` and `<div>` carry the same visual weight when styled via `font-family` / `font-size` / `line-height`. `<Text numberOfLines={2}>` (used in `ProjectCard.tsx:40`, `ProjectDetail.tsx:72`) maps to CSS `display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;` — see `intently-journal.jsx:323-325` for the prototype's existing pattern.

---

### `<Pressable>` — tappable container

**Where it appears:**
- `App.tsx:135, 172, 180, 225, 583` (HeroButton, NewJournalEntryButton, LiveAgentTrigger pill, PhaseCta, goal card); `BriefFlow.tsx:167, 209, 291`; `GoalDetail.tsx:40`; `JournalEditor.tsx:43, 47, 114`; `ProjectCard.tsx:25`; `ProjectDetail.tsx:42, 50, 65`; `ReviewFlow.tsx:229, 274`; `VoiceModal.tsx:80, 101, 121, 131, 134, 162, 169, 178, 184, 199`.

**Plain-React equivalent the prototype uses:**
- `<button onClick={...} style={{...}}>` — `intently-flows.jsx:501-506` (close button); `intently-projects.jsx:95-99` (project card); `intently-shell.jsx:67-70` (swipe dot). Note `style={{ all: 'unset', ... }}` to strip browser button defaults — used in `intently-journal.jsx:274`.
- For tap-on-non-interactive-but-keyboard-accessible: `<div role="button" tabIndex={0} onClick={...} onKeyDown={...}>` (rare in this codebase; prototype uses `<button>` everywhere).

**Verdict:** THROWAWAY.

**Notes:** `accessibilityLabel="..."` → `aria-label="..."`. `hitSlop={12}` (used widely in BriefFlow / ReviewFlow close buttons) has no exact DOM equivalent — closest is `padding: 12px; margin: -12px;` to expand the touch target without affecting layout. RN's tap-feedback (slight dim on press) doesn't ship by default on `<button>` — Saturday can add `:active { opacity: 0.7 }` or skip it (prototype doesn't bother). RN's `disabled` prop becomes `disabled={...}` on `<button>` (HTML supports it natively).

---

### `<ScrollView>` — scrollable container

**Where it appears:**
- `App.tsx:158, 652-685` (vertical scroll inside each Screen, plus the **horizontal** swipe pager); `BriefFlow.tsx:177, 194`; `GoalDetail.tsx:60`; `ProjectDetail.tsx:83`; `ReviewFlow.tsx:239`. Also `App.tsx:266` (`useRef<ScrollView>`).

**Plain-React equivalent the prototype uses:**
- Vertical: `<div style={{ flex: 1, overflowY: 'auto', padding: '...' }}>` — `intently-flows.jsx:510-518`; `intently-journal.jsx:269`; `intently-projects.jsx:139`. The prototype reaches the scrollable node directly (`scrollRef.current.scrollTop = scrollRef.current.scrollHeight` in `intently-flows.jsx:474`).
- Horizontal swipe pager: `<div onPointerDown/Move/Up>` + `transform: translate3d` — `intently-shell.jsx:11-55`. **Different mechanism** from `App.tsx`'s react-native-web horizontal `<ScrollView pagingEnabled>` + scroll-snap-type CSS.

**Verdict:** MIXED.
- Throwaway: every vertical scroll use (the DOM has `overflow-y: auto` natively).
- SATURDAY-PORT-TASK: the **horizontal pager** behavior — `App.tsx` does `pagingEnabled` + native scroll-snap + 21 slots + `onMomentumScrollEnd` for weekly-auto-fire. The prototype's `SwipeShell` does pointer-drag + 3 slots + no momentum hook. Saturday must decide: use the prototype's pointer-drag (loses keyboard arrow-key nav unless re-added; loses momentum-scroll-end for `weeklyAutoFired`) or carry over `App.tsx`'s native horizontal scroll-snap (adapt to `<div style={{ display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory' }}>` with each child `scrollSnapAlign: 'start'`). Recommendation: native scroll-snap (it's how mobile Safari paginates already) + reattach the keyboard handler + reattach the weekly-auto-fire on `scroll` event.

**Notes:** RN's `scrollToEnd({ animated: true })` (used in `BriefFlow.tsx:126`, `ReviewFlow.tsx:188`) → `el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })` (or just `el.scrollTop = el.scrollHeight` as the prototype does at `intently-flows.jsx:474`). `contentContainerStyle` becomes a wrapper `<div>` with the padding/gap. RN's `getScrollableNode()` workaround in `App.tsx:329-334` to reach the underlying DOM disappears entirely on web — `scrollRef.current` IS the DOM node.

---

### `<TextInput>` — text entry

**Where it appears:**
- `BriefFlow.tsx:199-208`; `JournalEditor.tsx:79-88`; `ReviewFlow.tsx:264-273`; `VoiceModal.tsx:93-100, 190-197`.

**Plain-React equivalent the prototype uses:**
- Single-line: `<input value={...} onChange={(e) => setX(e.target.value)} />` — `intently-flows.jsx:528-537`, `intently-flows.jsx:813-822`.
- Multi-line: `<textarea value={...} onChange={...} />` (not used in prototype yet, but standard). The RN code uses `multiline` — port to `<textarea>`.

**Verdict:** THROWAWAY for the construct itself; **MIXED** for some props.
- `onChangeText={fn}` → `onChange={(e) => fn(e.target.value)}`. Throwaway.
- `placeholderTextColor` → CSS `::placeholder { color: ... }` (needs a stylesheet rule, not inline). Saturday adds one global `<style>` block.
- `onSubmitEditing` → `onKeyDown={(e) => e.key === 'Enter' && fn()}` — see `intently-flows.jsx:531`.
- `blurOnSubmit` — call `e.target.blur()` inside the keydown handler.
- `multiline` → switch element from `<input>` to `<textarea>`.
- `textAlignVertical="top"` — only meaningful for `<textarea>`; it's the default.
- `autoFocus` — same prop name, works on `<input>`/`<textarea>`.

**Notes:** RN auto-focus on `Modal` mount can race the modal animation; on web, `autoFocus` fires after mount synchronously. Generally simpler.

---

### `<Modal>` — full-screen / sheet overlay

**Where it appears:**
- `BriefFlow.tsx:155-160` (animationType="slide", transparent=false);
- `JournalEditor.tsx:35-40` (animationType="slide", presentationStyle="pageSheet");
- `ReviewFlow.tsx:217-222` (animationType="slide");
- `VoiceModal.tsx:77` (transparent, animationType="fade").

**Plain-React equivalent the prototype uses:**
- `<div style={{ position: 'absolute', inset: 0, zIndex: 60, ... }}>` — full-bleed overlay rendered conditionally. `intently-flows.jsx:489-494` (BriefFlow shell); `intently-hero.jsx:239-242` (HeroListening). No HTML `<dialog>` element used.
- For the scrim (VoiceModal's transparent fade): a wrapper `<div style={{ position: 'absolute', inset: 0, background: 'rgba(...)', display: 'flex', justifyContent: 'flex-end' }}>` with the sheet as a child (matches `VoiceModal.tsx`'s `styles.scrim` + `styles.sheet`).

**Verdict:** THROWAWAY.

**Notes:**
- RN-Web's `<Modal>` portals to `document.body`, which can fight scroll-snap (the conditional-mount comment in `App.tsx:696-699` flags this). Plain `<div>` mounted in the React tree avoids the issue entirely.
- RN's `animationType="slide"` doesn't translate automatically — the prototype skips animation or uses a CSS keyframe. Saturday: optional CSS `@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }` on the overlay if the slide-up beat matters for the demo.
- RN's `onRequestClose` (Android back-button) has no DOM equivalent; `Esc` key handler is the closest analog (the prototype doesn't currently wire one — minor SATURDAY-PORT-TASK if the user expects Esc to close the brief overlay).
- RN's `presentationStyle="pageSheet"` (iOS-only sheet) is irrelevant on web; just style the overlay as a sheet with rounded top corners (already what `VoiceModal.tsx:223-226` does).

---

### `<ActivityIndicator>` — loading spinner

**Where it appears:**
- `App.tsx:128, 237` (loading pill, PhaseCta loading);
- `BriefFlow.tsx:298` (accept-button drafting state);
- `VoiceModal.tsx:143` (saving state).

**Plain-React equivalent the prototype uses:**
- A CSS-keyframe-spinning SVG. Prototype's `ProcessingArc` (`intently-hero.jsx:216-223`) is the canonical example — animated circle with a stroked arc on top. CSS: `@keyframes intentlySpin { to { transform: rotate(360deg); } }` is already injected by the prototype.

**Verdict:** THROWAWAY (replace with `<ProcessingArc />` or a similar tiny spinner).

**Notes:** `ActivityIndicator size="small" color="..."` → `<ProcessingArc />` or any 16-20px spinning SVG. Prototype already has `intentlySpin` keyframe and `intentlyPulse` keyframe — reuse rather than add new ones.

---

### `StyleSheet.create({...})`

**Where it appears:**
- Every component file uses this for the styles dictionary at the bottom. Examples: `App.tsx:783-1082`; `BriefFlow.tsx:310-539`; `AgentOutputCard.tsx:97-201`; `ReviewFlow.tsx` (entire styles block); etc.

**Plain-React equivalent the prototype uses:**
- Inline `style={{}}` per element. The prototype DOES NOT define a `styles` dictionary — every visual rule lives next to the JSX it styles, which is verbose but matches the no-build-step posture. See any prototype file (e.g. `intently-flows.jsx:489-494`).
- For things shared across many elements, the prototype reaches for `T.color.X` / `T.font.X` token references (from `intently-tokens.jsx`), still inline.

**Verdict:** THROWAWAY (the `StyleSheet.create` wrapper is pure ceremony on web; react-native-web hashes the object and emits a className, but inline style objects work just as well for the prototype's scale).

**Notes:** `StyleSheet.hairlineWidth` (1px on web) → `1` (or `0.5` for retina; prototype uses `1`). `[styles.a, styles.b, conditionalStyle]` array syntax → `{ ...styleA, ...styleB, ...conditional }` spread. Saturday can either inline-style every element (matches prototype) or extract a shared `styles` object — pure JS, no `StyleSheet.create` needed.

---

### `Dimensions.get('window')` + `useWindowDimensions`

**Where it appears:**
- `App.tsx:9, 268, 316-319` — `Dimensions.get('window').width` for initial pager width; `Dimensions.addEventListener('change', ...)` for resize.

**Plain-React equivalent the prototype uses:**
- `window.innerWidth` for initial; `window.addEventListener('resize', ...)` in a `useEffect` for changes. Prototype's `intently-shell.jsx:9` hard-codes `W = 390` (phone viewport width per the iOS-frame mock); the iOS-frame wrapper sets the canvas width.

**Verdict:** MIXED.
- If Saturday keeps the phone-frame canvas (`web/ios-frame.jsx`), the pager width is fixed = throwaway.
- If Saturday wants the responsive pager that adapts to viewport (the way `App.tsx` does), `window.innerWidth` + `useEffect` resize listener is the SATURDAY-PORT-TASK. Two-line port.

---

### `Platform.OS === 'web'` / `Platform.select({...})`

**Where it appears:**
- `MorningLight.tsx:27, 45, 47, 64`; `PainterlyBlock.tsx:90`. No other components branch on Platform.

**Plain-React equivalent the prototype uses:**
- N/A — the prototype is web-only. The branches in the RN code that say "on web do X, on native do Y" simply collapse to "X" on the DOM port.

**Verdict:** THROWAWAY (always pick the web branch; delete the native fallback).

**Notes:** The two painterly files use `Platform.OS === 'web'` to gate `mixBlendMode` and the grain `<style>` tag; the prototype's `intently-imagery.jsx:7-19` injects the grain `<style>` unconditionally, and the painterly grain is part of the DOM `<div className="intently-grain" />` pattern.

---

### `react-native-svg` (`Svg`, `Defs`, `Filter`, `FeGaussianBlur`, `G`, `Ellipse`, `Path`)

**Where it appears:**
- `PainterlyBlock.tsx:15, 61-85` (blob filter + ellipses);
- `MorningLight.tsx:11, 72-89` (horizon paths).

**Plain-React equivalent the prototype uses:**
- Native `<svg>`, `<defs>`, `<filter>`, `<feGaussianBlur>`, `<g>`, `<ellipse>`, `<path>` JSX — JSX renders SVG as the corresponding XML. No library needed. The prototype's `intently-imagery.jsx:37-46` uses the exact same blob recipe inside a native `<svg>`. `intently-imagery.jsx:119-124` uses native `<svg>` + `<path>` for the horizon.

**Verdict:** THROWAWAY (every SVG use has a 1:1 lowercase-tag DOM equivalent).

**Notes:** RN-svg's `viewBox` prop is a string in `<svg>` (`"0 0 100 100"`). React's lowercase `<svg>` accepts the same prop. `react-native-svg`'s `<Filter id={...}>` becomes `<filter id={...}>` (lowercase `f`). `FeGaussianBlur stdDeviation="6"` becomes `<feGaussianBlur stdDeviation="6" />`. The icon SVGs in `intently-tokens.jsx:84-242` are all already in this lowercase native-JSX form.

---

### `expo-google-fonts/*` + `useFonts`

**Where it appears:**
- `App.tsx:1-4, 257-265, 363` — `useFonts({ Fraunces_500Medium, ... })`; gated render on `if (!fontsLoaded) return null;`.

**Plain-React equivalent the prototype uses:**
- `<link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@500;600&family=Inter:wght@400;500;600&family=Source+Serif+4&family=JetBrains+Mono&display=swap" rel="stylesheet">` in `index.html` `<head>`. CSS handles font swap (FOUT). No JS gating. Verify `web/index.html` has these `<link>` tags (lines 1-100 of `index.html`); if not, this is a 1-line SATURDAY-PORT-TASK to add the `<link>`.

**Verdict:** THROWAWAY (the React-side hook + gating).

**Notes:** Font *names* used in JSX change too: RN says `fontFamily: 'Fraunces_500Medium'` (the package's symbol); web says `fontFamily: '"Fraunces", "Iowan Old Style", Georgia, serif'`. The prototype's `T.font.Display` (`intently-tokens.jsx:62`) is already the web-native form. So `fontFamily: t.typography.fonts.Display` in RN code → `fontFamily: T.font.Display` in port — same shape, different namespace.

---

### `expo-status-bar` (`<StatusBar />`)

**Where it appears:**
- `App.tsx:5, 731` — `<StatusBar style="auto" />`.

**Plain-React equivalent:**
- Nothing — there is no status bar on the web. The browser chrome is the user's choice (PWA installed-app status bar can be controlled with `<meta name="theme-color">` in `<head>`).

**Verdict:** THROWAWAY (delete; optionally add `<meta name="theme-color" content="#F5EEE0">` to `index.html` for installed-PWA color match).

---

### `lucide-react-native` (`Handshake`, `Leaf`, `Rocket`)

**Where it appears:**
- `App.tsx:17, 67-71, 581, 597-601` — used as the oversize corner glyph on goal cards (`<Glyph size={150} color={...} strokeWidth={1.4} />`).

**Plain-React equivalent the prototype uses:**
- The prototype ships its own inline-SVG `Glyph` component (called `Glyph` in `intently-glyphs.jsx`) and an `Icon` namespace in `intently-tokens.jsx:82-242`. Lucide-style icons (1.75 stroke, rounded caps) — already includes most names. Prototype usage: `intently-projects.jsx:103` (`<Glyph name={p.glyph} size={18} color={...} stroke={1.75} />`), `intently-screens.jsx:208`.

**Verdict:** MIXED.
- Throwaway: the `lucide-react-native` import + the `GLYPH_BY_NAME` mapping in `App.tsx:67-71`.
- SATURDAY-PORT-TASK: confirm the prototype's `Glyph` registry includes `rocket`, `leaf`, `handshake` names (grep `intently-glyphs.jsx`). If any are missing, add them as inline `<svg>` definitions next to the existing entries (5 lines each). Lucide source SVGs are public.

---

### `@ronradtke/react-native-markdown-display` (`<Markdown>`)

**Where it appears:**
- `App.tsx:16, 161` (Screen-level markdown render);
- `AgentOutputCard.tsx:2, 77` (card body markdown);
- `JournalEditor.tsx:3, 94` (preview pane).

**Plain-React equivalent the prototype uses:**
- **None.** Prototype renders structured fixture data (`MOCK_PLAN.bands.map(...)` in `intently-flows.jsx:649-665`); it does not parse markdown.

**Verdict:** SATURDAY-PORT-TASK (genuinely missing functionality, not just a wrapper swap).

**Notes:** Saturday options (call this OQ3 above):
1. `marked` UMD (`<script src="https://unpkg.com/marked@latest/marked.min.js"></script>`) + `<div dangerouslySetInnerHTML={{ __html: marked.parse(output.body) }} />`. ~15 lines, works everywhere, sanitization risk negligible since `output.body` comes from our own MA proxy.
2. `react-markdown` UMD if available — heavier.
3. Have the agent emit structured JSON (`{ pacing: {...}, bands: [...] }`) instead of markdown. Bigger API contract change; defer.
Recommendation: option 1 for the demo. The markdown style block (`AgentOutputCard.tsx:204-224`) becomes a `<style>` with selector rules (`.agent-output-body p { font-family: ...; }`).

---

### `Animated.*` / `LayoutAnimation` / `react-native-reanimated`

**Where they appear:** None in the audited tree. `BriefFlow` and `ReviewFlow` use `setTimeout`-driven message reveals — already plain JS. The auto-check stagger in `ReviewFlow.tsx:164-172` is `setTimeout` + state, no `Animated`. Pure win — skip this section, no port work.

**Verdict:** N/A.

---

### `react-native-gesture-handler` / `react-native-safe-area-context` / `<KeyboardAvoidingView>` / `<SafeAreaView>` / `<FlatList>` / `<SectionList>` / `Linking.openURL` / `expo-blur` / `expo-haptics` / `expo-linear-gradient`

**Where they appear:** None in the audited tree. The grep for these came back empty across all 8 components + `App.tsx`. No port work needed.

**Verdict:** N/A.

**Notes:** `expo-linear-gradient` is *not* used; gradients in `App.tsx:222-223` use react-native-web's `backgroundImage` passthrough (string `'linear-gradient(...)'`). Throwaway — plain CSS `backgroundImage` works directly.

---

### `RN <Image>`

**Where it appears:** None — the audit found no `<Image>` usages. All visual texture comes from `PainterlyBlock` / `MorningLight` (SVG-based) or solid-color `<View>`s. No port work for image components.

**Verdict:** N/A.

---

## Per-component port notes

### `app/components/AgentOutputCard.tsx` (224 LOC)

**What it does:** Renders an agent's output as a card — kind-tinted surface, optional brief-hero painterly panel for `kind=brief`, markdown body, footer with `Generated 7:32 AM` timestamp + input-trace chips (calendar/journal/etc.).

**Prototype coverage:** Partial. `intently-cards.jsx:230-319 ConfirmationCard` is a kindred shape (eyebrow + title + body + meta + traces) but renders a confirmation action, not an agent output. `intently-journal.jsx:262-267` ships the same `kindMeta` map (`brief`/`journal`/`chat`/`review` → tint/glyph/label) and renders entries in a list (DayView).

**Verdict:** SATURDAY-PORT-TASK.

**Port shape:** Build a new `AgentOutputCard` JSX component in `web/`. Steal the `kindMeta` from `intently-journal.jsx:262-267`. Steal the painterly hero shape from `intently-screens.jsx:204-211 PresentMorning yesterday`. Body uses `marked` (per OQ3 above). Footer + traces are straightforward `<div style={{...}}>`. Estimated ~120 lines plain JSX. The `formatGeneratedAt` / `kindMetaFor` / `labelForInputTrace` helpers come from `app/lib/agent-output.ts` — port verbatim per PORTING.md.

---

### `app/components/BriefFlow.tsx` (539 LOC)

**What it does:** Modal overlay launched from morning sunrise CTA. 4-step scripted Q&A: greeting → "what's alive" input → "what to park" input → confirmation card with accept button. On accept fires `onAccept({ alive, park })` which `App.tsx` hands to `handleBriefAccept` → MA call.

**Prototype coverage:** **High.** `intently-flows.jsx:454-557 BriefFlow` is essentially identical: same script-step pattern, same chat bubbles, same typing dots, same confirm card, same scrolled overlay shell.

**Verdict:** MIXED.
- Throwaway: the entire component shell + scripted-step state machine + chat bubble + typing dot animation + confirm card visual.
- SATURDAY-PORT-TASK: `onAccept` wiring. Prototype's `BRIEF_SCRIPT` / `MOCK_PLAN` use placeholder content (`intently-flows.jsx:608-635`) — Saturday must:
  1. Replace prototype's script with the Sam-flavored hackathon-Friday script from `app/components/BriefFlow.tsx:41-67`.
  2. Wire the prototype's `onComplete` callback to call `runAgent('daily-brief', input, ...)` instead of returning `MOCK_PLAN` — the input string includes the `## Today (in your words)` block from `App.tsx:414-431`.
  3. Add `agentRunning` / `agentError` props so the confirm card shows the "Drafting your day…" loading state and inline error.

---

### `app/components/GoalDetail.tsx` (406 LOC)

**What it does:** Full-bleed drill-down screen for a single Goal — painterly hero with corner glyph + back chip; intention paragraph; this-month card; milestones timeline (status-colored dots, line connectors, line-through for done); projects 2-col grid (uses `<ProjectCard>`); reflections (lilac left-bordered pull quotes).

**Prototype coverage:** **High.** `intently-flows.jsx:120-262 GoalDetail` is the source `App.tsx`'s GoalDetail was ported from. Same five sections. Same painterly hero pattern.

**Verdict:** THROWAWAY (component-level — the prototype already implements it).

**Port shape:** No port. Saturday inherits the prototype's `GoalDetail`. Verify the prototype's `goalData` shape matches what the front-end navigates to (it pulls from `app/fixtures/goals-projects.ts` in `App.tsx`, and the prototype has its own goal fixture). One alignment task: ensure both fixture sets have the same `id`/`title`/`pal`/`milestones`/`reflections` keys, or unify on one.

---

### `app/components/JournalEditor.tsx` (206 LOC)

**What it does:** Modal sheet — toggle between Edit (TextInput) and Preview (markdown render) modes; Cancel + Save header; Save disabled when empty.

**Prototype coverage:** **None.** `intently-journal.jsx`'s `DayView` (`intently-journal.jsx:251-401`) is read-only — no editor.

**Verdict:** SATURDAY-PORT-TASK (entire component is missing from prototype).

**Port shape:** Build a new `JournalEditor` JSX in `web/`. Reuse the `createEditorState` / `toggleMode` / `setContent` / `isEmpty` reducer from `app/lib/journal-editor.ts` (PORTING.md says verbatim port). UI is straightforward: header + toggle chips + `<textarea>` for edit / marked-rendered `<div>` for preview / Save+Cancel buttons. ~120 lines. Note: `JournalEditor` is opened from `App.tsx`'s `journalOpen` state, set via the (unused on the morning of writing) `NewJournalEntryButton`. Confirm Saturday whether journal capture is in the demo storyboard before prioritizing.

---

### `app/components/ProjectCard.tsx` (117 LOC)

**What it does:** Compact card — tint stripe top, glyph chip + progress label, name (italic display), 2-line blurb, progress bar.

**Prototype coverage:** **High.** `intently-projects.jsx:92-114 ProjectCard` is essentially the same component, with the same tint/glyph/progress/name shape.

**Verdict:** THROWAWAY.

**Port shape:** No port. Saturday inherits the prototype's `ProjectCard` directly.

---

### `app/components/ProjectDetail.tsx` (371 LOC)

**What it does:** Full-bleed drill-down for a single Project — cover with tint, project name, "under <Goal>" link-chip back to GoalDetail, intention/impact/status sections, flat checklist tracker (status dots + deadlines).

**Prototype coverage:** **High.** `intently-projects.jsx:116-172 ProjectDetail` covers cover + markdown render + tracker table. The "under <Goal>" link-chip behavior is missing from prototype's version.

**Verdict:** MIXED.
- Throwaway: the cover, intention/impact/status sections, the tracker checklist visual.
- SATURDAY-PORT-TASK: the "under <Goal>" link-chip (`ProjectDetail.tsx:64-76`) — prototype has no goal-back-link affordance. Add a 10-line `<button onClick={() => onOpenGoal(goal)}>` to prototype's `ProjectDetail`.

---

### `app/components/ReviewFlow.tsx` (827 LOC)

**What it does:** Evening daily-review overlay. Same shell pattern as BriefFlow but darker palette (midnight gradient). Adds an `AutoCheckList` step (animated stagger of "what I saw you do" items checking in) before the 3-question Q&A. Same `onAccept` wiring contract.

**Prototype coverage:** **High.** `intently-flows.jsx:717-1027 ReviewFlow + AutoCheckList + ReviewConfirmCard` is the source. Same dark gradient. Same auto-check stagger. Same confirm card.

**Verdict:** MIXED (same pattern as BriefFlow above).
- Throwaway: shell + dark-bubble visuals + checklist animation + confirm card visual.
- SATURDAY-PORT-TASK: `onAccept` wiring (calls `runAgent('daily-review', ...)` with the `## Today (in your words)` block from user answers — `App.tsx:448-462`). Replace prototype's `AUTO_CHECK_ITEMS` with the Sam-flavored items from `ReviewFlow.tsx:92-98`. Replace `REVIEW_SCRIPT` defaults with Sam-flavored from `ReviewFlow.tsx:55-87`.

---

### `app/components/VoiceModal.tsx` (390 LOC)

**What it does:** Full-screen voice/chat takeover from the hero affordance. Five render branches: `unsupported` (text-only fallback), `idle` (start button + text input), `listening` (waveform + stop), `stopped` (transcript + try-again/save), `error` (message + retry). On save, calls `classifyTranscript(transcript, supabaseUrl)` → `reminders/classify-and-store` Edge Function → confirmation card.

**Prototype coverage:** **Visual yes, behavior no.** `intently-hero.jsx:226-313 HeroListening` covers the visual takeover (header, big transcript area, waveform footer, stop button) but uses a **fake** transcript that types itself out via `setInterval` (`intently-hero.jsx:229-237`). `HeroChat` (`intently-hero.jsx:319-470`) covers the post-listening chat surface but with a hardcoded `thread` array.

**Verdict:** SATURDAY-PORT-TASK (the highest-leverage port-task in the audit).

**Port shape:** Take prototype's `HeroListening` shell. Replace its `setInterval` fake transcript with the `useVoiceInput()` hook from `app/lib/voice.ts` (PORTING.md `light-touch`). Wire stop → call `classifyTranscript(transcript, window.INTENTLY_CONFIG.supabaseUrl)`. Add the unsupported / error / saving / saved render branches. Add the text-input fallback for browsers without speech recognition. Keep the prototype's existing aesthetic (it's prettier than the RN version's basic dot row + transcript box). Estimated 80-120 lines of additions to `intently-hero.jsx` (or a new `intently-voice.jsx`).

---

### `app/components/painterly/PainterlyBlock.tsx` (112 LOC)

**What it does:** Painterly background panel — flat color base + 4 SVG ellipse blobs + grain overlay (web only). Children render above.

**Prototype coverage:** **Total.** `web/intently-imagery.jsx:23-51 PainterlyBlock` is the source — same blob recipe, same SVG filter, same grain overlay. Verbatim equivalent.

**Verdict:** THROWAWAY.

---

### `app/components/painterly/MorningLight.tsx` (92 LOC)

**What it does:** Painterly sunrise panel — gradient sky, 2 sun discs, layered horizon SVG.

**Prototype coverage:** **Total.** `web/intently-imagery.jsx:102-128 MorningLight` is the source. Verbatim equivalent.

**Verdict:** THROWAWAY (and possibly dead code in `app/` — see OQ2).

---

## App.tsx audit (1082 LOC)

`App.tsx` is the biggest file and the densest mix of RN constructs + business wiring. Walking it section by section.

### Imports + types (`App.tsx:1-79`)

- **Throwaway:** lines 1-15 — all `expo-google-fonts/*`, `expo-status-bar`, `react-native` imports.
- **Throwaway:** line 16 — `@ronradtke/react-native-markdown-display` swapped for `marked` UMD (per OQ3).
- **Throwaway:** line 17 — `lucide-react-native` swapped for prototype's inline-SVG `Glyph` (per construct catalog).
- **Keep but adapt:** lines 18-31 — component imports become wired-into-prototype-JSX equivalents per Per-component notes above.
- **Keep:** lines 27-42 — lib imports per PORTING.md (`AgentOutput`, `callMaProxy`, fixtures, `fetchDueReminders`, `supabase`, `theme`).
- **Throwaway:** lines 67-71 — `GLYPH_BY_NAME` mapping (lucide adapter).
- **Keep:** lines 44-79 — TS type aliases (`ConnStatus`, `LiveState`, `PresentPhase`, `DetailView`). They're pure types; they vanish in plain JS or become JSDoc.

### Inline helper components (`App.tsx:83-243`)

- **Throwaway:** `ConnectionBanner` (`83-90`), `ScreenHeader` (`92-105`), `Screen` (`145-165`), `HeroButton` (`170-176`), `NewJournalEntryButton` (`178-184`), `LiveAgentTrigger` (`113-143`), `PhaseCta` (`207-243`). Every one is a thin styled wrapper — replace with prototype-equivalent inline JSX inside the screen JSX.
- **Keep behavior:** `formatDateHeader` (`107-111`) — pure JS date formatter. Lift verbatim.
- **Keep behavior:** `derivePhase` (`190-199`) — clock + URL `?phase=` override. Pure JS. Lift verbatim. **SATURDAY-PORT-TASK:** the prototype has no phase-derivation; the demo currently must be told phase manually. This is one of the load-bearing demo-recording features.

### `runAgent` + handle* dispatchers (`App.tsx:375-482`)

- **SATURDAY-PORT-TASK (highest priority):** `runAgent` (`375-401`), `handleGenerateLiveBrief` (`414-431`), `handleBriefAccept` (`437-441`), `handleGenerateLiveReview` (`448-462`), `handleReviewAccept` (`468-471`), `handleGenerateLiveWeekly` (`473-478`). These are the agent-invocation surface — pure JS, no RN — but the prototype has zero MA wiring. Lift verbatim into the prototype's top-level JSX (likely a new `intently-app.jsx` shell or extend `intently-shell.jsx`). The `liveBrief` / `liveReview` / `liveWeekly` `useState` hooks (`271-273`) come along.
- **SATURDAY-PORT-TASK:** the `formatRemindersForInput` + `fetchDueReminders` chain in `handleGenerateLiveBrief:415-420` — runs the memory loop (fetches due reminders before the brief MA call). Verbatim port from `app/lib/reminders.ts` per PORTING.md.

### Pager + screens (`App.tsx:484-685`)

- **THROWAWAY:** the visual JSX of `pastScreen` (`495-511`), `presentScreen` (`516-560`), `futureScreen` (`571-637`). Prototype has `PastScreen` / `PresentScreen` / `FutureScreen` in `intently-screens.jsx:46-454` — already covers these three layouts (different fixtures, but same shape). Saturday wires the live `briefOutput` / `reviewOutput` / `weeklyOutput` into the prototype screens via props, replacing the static seed data.
- **MIXED:** the `derivePhase` + `phase` state drives `PresentScreen` rendering — already in `intently-screens.jsx:164-168 PresentScreen({ phase })`. Throwaway: the React-side branch logic. Port-task: connect `setPhase` to `phase` so the URL override works in prototype.
- **SATURDAY-PORT-TASK:** the 21-slot rotation pager (`App.tsx:250-253, 652-685`) — prototype's `SwipeShell` only does 3 slots. See OQ1. Recommendation: keep prototype's 3-slot model for the demo unless infinite rotation is on the storyboard.
- **SATURDAY-PORT-TASK:** the `onMomentumScrollEnd` weekly-auto-fire (`665-674`). Prototype's `SwipeShell` doesn't expose a momentum-end event. Port: attach a `scroll` event listener; when scroll lands on Past slot AND `weeklyAutoFired.current === false`, call `handleGenerateLiveWeekly()`. ~10 lines.
- **SATURDAY-PORT-TASK:** the keyboard arrow-key handler (`343-361`). Prototype has none. Lift verbatim, swap `Dimensions` for `window.innerWidth`, swap `pager.current.getScrollableNode()` for `pagerRef.current`.

### Modal mounts at the bottom (`App.tsx:686-732`)

- **THROWAWAY:** `<HeroButton>` + `<VoiceModal>` + `<JournalEditor>` + `<BriefFlow>` + `<ReviewFlow>` + `<DetailOverlay>` + `<StatusBar>` JSX. Each becomes a conditionally-rendered `<div>` overlay in the prototype shell, with the same open/close state hooks.
- **Keep behavior:** the conditional-mount pattern (`briefFlowOpen ? <BriefFlow ... /> : null`) — same posture in plain JSX; the comment about "react-native-web's Modal portals" (`696-699`) becomes irrelevant since plain `<div>` doesn't portal.

### `DetailOverlay` (`App.tsx:738-779`)

- **THROWAWAY (component shell):** the `<View style={styles.detailOverlay}>` wrapper is a full-bleed `<div style={{ position: 'absolute', inset: 0, zIndex: 100, background: ... }}>` in plain JSX. Same pattern as the prototype's BriefFlow shell (`intently-flows.jsx:489-494`).
- **KEEP behavior:** the goal-vs-project switch (`749-779`) — pure JS state-machine routing.

### `styles` block (`App.tsx:783-1082`)

- **THROWAWAY:** every entry. Inline-style each element instead, or build a tiny shared styles object in plain JS. The token references (`t.colors.X`) all map 1:1 to prototype tokens (`T.color.X`) — the only mechanical change is the namespace + capitalization rewrite.

---

## Recommendations for Saturday

### Suggested deletion order (largest throwaway wins first)

1. **`PainterlyBlock.tsx` + `MorningLight.tsx`** (200 LOC). Both are duplicates of `intently-imagery.jsx`. Delete during rebase; replace `import PainterlyBlock from './components/painterly/PainterlyBlock'` with `const { PainterlyBlock } = window;` (or directly use the global `PainterlyBlock`).
2. **`StyleSheet.create` blocks across all 8 components + `App.tsx`** (~700 LOC of style declarations). Inline-style during port; no replacement needed. Tokens land via `T.color.X` etc.
3. **`AgentOutputCard.tsx` markdown style block + RN-specific layout glue** (~80 LOC). Replaced by the prototype's existing `kindMeta` + a marked-based body renderer.
4. **`GoalDetail.tsx` (406 LOC) + `ProjectCard.tsx` (117 LOC) + `ProjectDetail.tsx` (371 LOC, minus the goal-back-chip wiring)**. Inherit from prototype.
5. **`App.tsx` lines 1-243 + 783-1082** (~430 LOC of imports / inline helpers / styles). Inline helpers vanish; styles inline.

### Suggested port order (highest-impact functional gaps first)

1. **`runAgent` + the three `handleGenerateLive*` functions** (~80 LOC). This is the entire MA invocation surface. Without it, the demo is the prototype with a static `MOCK_PLAN`.
2. **`useVoiceInput` hook → wire into prototype's `HeroListening`** (~80 LOC). Voice is THE single interaction surface per BUILD-RULES.md. The prototype's listening UI is a prop without behavior; this turns it real.
3. **`derivePhase` + `?phase=` URL override + `liveBrief.kind` state branching** (~30 LOC). The morning/planned/evening phase machine is what makes the demo work without manual prop-toggling.
4. **`handleBriefAccept` / `handleReviewAccept` wiring through the prototype's BriefFlow / ReviewFlow `onComplete` callback** (~20 LOC of changes inside `intently-flows.jsx`).
5. **Markdown rendering decision (OQ3)** — pick `marked` UMD; add a `<script>` to `index.html`; replace `<Markdown>{output.body}</Markdown>` with `<div dangerouslySetInnerHTML={{ __html: marked.parse(output.body) }} />`.
6. **Keyboard arrow-key handler + weekly-auto-fire `scroll` listener** (~30 LOC). Demo polish; nice-to-have, not blocker.
7. **Goal-back-chip in prototype's `ProjectDetail`** (~10 LOC). Small wiring.
8. **`JournalEditor` build (only if journal capture is in demo storyboard)** (~120 LOC). Confirm priority before building.

### "Do not delete yet" cautions

- **`app/lib/agent-output.ts`, `app/lib/journal-editor.ts`, `app/lib/voice.ts`, `app/lib/ma-client.ts`, `app/lib/reminders.ts`, `app/lib/supabase.ts`** — per PORTING.md these are the browser-band lib files that DO get ported (verbatim or env-var-rename). Don't delete the `app/` files until their `web/` equivalents land.
- **`app/components/JournalEditor.tsx`** — keep until you've decided whether journal capture is in the demo. The `app/lib/journal-editor.ts` reducer it uses is referenced from the test suite too.
- **`app/components/BriefFlow.tsx` / `ReviewFlow.tsx`** — keep until the prototype's flows are wired with the Sam-flavored script + agent dispatch. The hardcoded scripts in these RN files are the canonical demo-script source. Once the prototype is live-wired, archive them.
- **`app/App.tsx`** — keep until ALL agent-wiring functions (`runAgent`, `handleGenerateLive*`, `derivePhase`, the auto-fire latch) are lifted into prototype JSX. This file is the spec document for the wiring.

---

## Summary table — what gets ported vs deleted

| Concern | Verdict | Source | Target in `web/` |
|---|---|---|---|
| `<View>` / `<Text>` / `<Pressable>` / `<ScrollView>` (vertical) / `<TextInput>` / `<Modal>` / `<ActivityIndicator>` / `StyleSheet.create` | THROWAWAY | All RN files | `<div>` / `<span>` / `<button>` / `overflow-y:auto` / `<input>`/`<textarea>` / fixed-position `<div>` overlay / `<ProcessingArc>` / inline `style={{}}` |
| `react-native-svg` | THROWAWAY | `PainterlyBlock`, `MorningLight` | Native lowercase `<svg>` JSX (already in prototype) |
| `Platform.OS === 'web'` branches | THROWAWAY | `PainterlyBlock`, `MorningLight` | Pick the web branch |
| `expo-google-fonts` + `useFonts` | THROWAWAY | `App.tsx` | Google Fonts `<link>` in `index.html` |
| `expo-status-bar` | THROWAWAY | `App.tsx` | Optional `<meta name="theme-color">` |
| `lucide-react-native` | MIXED (delete import + adapter; ensure `Glyph` registry covers needed names) | `App.tsx` | Prototype's `Glyph` / `Icon` |
| `tokens.ts` | THROWAWAY | All components | `intently-tokens.jsx` (`T.color`, `T.font`, `T.shadow`, `T.radius`, `T.space`) |
| `<Markdown>` (markdown render) | SATURDAY-PORT-TASK | `App.tsx`, `AgentOutputCard.tsx`, `JournalEditor.tsx` | `marked` UMD + `dangerouslySetInnerHTML` |
| `useVoiceInput` + `classifyTranscript` wiring | SATURDAY-PORT-TASK | `VoiceModal.tsx` | Wire into prototype's `HeroListening` |
| `runAgent` + 3 `handleGenerateLive*` | SATURDAY-PORT-TASK | `App.tsx` | Top-level prototype shell |
| `derivePhase` + URL override | SATURDAY-PORT-TASK | `App.tsx` | Top-level prototype shell |
| Pager keyboard nav + weekly-auto-fire latch | SATURDAY-PORT-TASK | `App.tsx` | New event handlers on prototype's `SwipeShell` (or replace with native scroll-snap) |
| `BriefFlow` / `ReviewFlow` `onAccept` wiring | SATURDAY-PORT-TASK (script + dispatch) | `BriefFlow.tsx`, `ReviewFlow.tsx` | Replace prototype's `MOCK_PLAN` with real MA call |
| `JournalEditor` (if needed for demo) | SATURDAY-PORT-TASK | `JournalEditor.tsx` | Build new JSX in `web/` |
| `AgentOutputCard` body | SATURDAY-PORT-TASK | `AgentOutputCard.tsx` | Build new JSX in `web/` (steal `kindMeta` from `intently-journal.jsx`) |
| `ProjectDetail` goal-back-chip | SATURDAY-PORT-TASK (small) | `ProjectDetail.tsx:64-76` | Add 10-line `<button>` to prototype's `ProjectDetail` |
| Everything else in `GoalDetail.tsx`, `ProjectCard.tsx`, `ProjectDetail.tsx` | THROWAWAY | RN files | Inherit from prototype |
| Painterly components | THROWAWAY | `painterly/*.tsx` | Use prototype's |
