# Claude Design Brief — Intently

**Purpose:** the prompt + context to hand to Claude Design (Opus 4.7) so it produces a design system we can translate into Expo / React Native. Companion to `claude-design-workflow.md` (which explains the *why*); this file is the actual brief.

**How to use this file:**
1. Gather 3–5 reference images (see "Reference imagery" section) and save them to `docs/design/references/` in this repo.
2. Open Claude Design.
3. Paste everything below the `---PASTE BELOW---` line.
4. Attach the reference images.
5. Iterate. Save resulting mockups to `docs/design/mockups/` and the token spec to `docs/design/tokens/`.

**What comes back:** rendered mockups (PNGs), a token spec, and likely an HTML/React-web preview. Treat the HTML as a screenshot source, not code — see `claude-design-workflow.md`.

---PASTE BELOW---

# Intently — Design System Brief

You are helping design a mobile-first iOS + Android app called **Intently**. This brief gives you everything you need to produce the design system. Do not invent details the brief doesn't cover — ask clarifying questions.

## What Intently is

Intently is the productivity app for people who hate productivity apps. Users tell the AI things out loud; the AI organizes, reorganizes, and keeps track. The app surfaces visual anchors (checklists, trackers, timelines) but those are *read-outs of what the AI already knows* — never data-entry forms the user grinds through.

Two positioning pillars:
1. **"The one thing you should never have to do again is use the finicky UI of a productivity app to keep track of something."** Voice-first input, structured cards as output.
2. **"Intentional, not busy."** The app absorbs chaos so the user stays at the altitude of their own life. It does not add notifications, badges, or dopamine loops. It is a calm surface.

The three daily / weekly rituals it runs for the user:
- **Daily Brief** (morning) — today's orientation: goals, calendar, email, recent project state.
- **Daily Review** (evening) — wraps the day as a narrative reflection; updates trackers.
- **Weekly Review** — surfaces incomplete goals, scores the week, aligns next week.

## Who uses it

Non-technical adults who want agency over their lives but have been burned by every habit tracker, journaling app, and second-brain system. They are tired of *maintaining the tool*. They want to talk to something and have it handle the rest. Think "ambitious but exhausted" — knowledge workers, founders, parents, people in the middle of a life transition.

## The interaction model

- **Voice-first input.** The primary affordance is a large voice-capture button. Text input is available but secondary.
- **Cards over bubbles.** When the agent reports work, it renders a **card** that shows the change — not a paragraph that describes it.
- **Undo everywhere.** Every agent-originated write gets an inline `[Undo]` affordance. Users must trust the system to trust the system.
- **Direct manipulation.** A drag, a tap, or a spoken sentence beats a form field. Forms are a last resort.

## Layout — three-screen swipe shell

Three durable surfaces, arranged horizontally. No tab bar, no hamburger menu. Swipe left/right between them; center is default.

| Screen | Tense | Content |
|---|---|---|
| **Left — Past** | What happened | Journal entries, past daily/weekly reviews |
| **Center — Present** | Right now | Morning briefing, end-of-day review, live chat with the agent |
| **Right — Future** | What's coming | Goals, project trackers, today's to-dos |

Design principle: after one session, the user should know where everything is — forever. Three is the limit.

## What you are producing (MVP scope)

Deliver these artifacts. Do not expand scope without asking.

### 1. Token set (semantic, not appearance-named — see rules below)

- **Color tokens** in light + dark modes.
- **Typography tokens** — type scale (display / heading / body / caption), line heights, weights. System-available or Google-Fonts-via-Expo fonts only. No licensed/exotic typefaces.
- **Spacing tokens** — a single spacing scale (e.g., 4/8/12/16/24/32/48).
- **Radius tokens** — corner radii.
- **Elevation / shadow tokens** — the (max 3) shadow levels you propose.
- **Motion tokens** — timing + easing curves for standard transitions.

Deliver as a `tokens.ts`-style spec (TypeScript object literal) we can drop into our Expo / React Native codebase. Do not use Tailwind class strings as the source of truth.

### 2. Three-screen shell mockups

- Each screen at rest, in both light and dark mode.
- Clearly show the swipe affordance / progress indicator (a dot indicator or minimal chevron is fine — do not invent elaborate custom UI for this).

### 3. Four card types

Each card type needs a mockup in **default** state and at least one **agent-updated** state (the moment the agent modifies it), in both light and dark mode.

- **Tracker Card** — project name, status indicator, progress bar that animates from e.g. 40% → 50% when agent logs progress. Show before / after.
- **Plan Card** — today's time blocks (morning / afternoon / evening), tappable to expand. Show collapsed + expanded.
- **Journal Card** — the user's own reflection, timestamped, in their voice. Read-only chrome.
- **Confirmation Card** — "I did X. [Undo]" — the card format announcing agent-originated writes. This is the most important card; it is the trust surface. Make it impossible to miss the `[Undo]` affordance without it being garish.

### 4. Hero affordance (unified voice + chat + quick actions)

The single highest-stakes component. One persistent control, bottom-right, visible on all three screens. This replaces a separate voice button and chat button — it is the same button.

**Interaction model:**
- **Tap** → enters voice capture mode (primary path — voice-first input).
- **Press-and-hold** → radial/expanding menu of 2–3 secondary actions (e.g. "somatic reset", "today's log", "open chat as text"). Default action (tap) is always "start voice."
- Menu closes if the user lifts without selecting; tapping outside also dismisses.

**States to mock up:**
- **Idle** (inviting, not anxious — the user should want to press it; bottom-right on all three screens).
- **Listening / voice mode** (full-screen takeover when tapped — lots of empty space, optional live-transcribed text, obvious way to stop. Reference: Google Gemini voice mode — "empty space feels like an invitation to fill it").
- **Processing** (calm — the user waits without confusion; in-place, not a new screen).
- **Expanded** (press-and-hold menu open — 2–3 radial or stacked options with labels).

### 5. One "hero moment" composition

One full-screen composition of the **Daily Brief** opening experience — the user opens the app in the morning and the agent has already prepared their day. This is the image we will use in the demo video and App Store screenshots. Make it the most striking single frame in the set.

## Semantic token naming — mandatory rule

This is the single rule you **must** follow. We will reskin this app in the future (a "fantasy adventure" theme with quests, scrolls, a map metaphor). The semantic names are what lets the reskin become a token swap instead of a rewrite.

**Name tokens by purpose, not appearance.**

| Do | Don't |
|---|---|
| `PrimarySurface` | `offWhite`, `bg1` |
| `FocusObject` | `blueButton`, `ctaPrimary` |
| `QuestCard` (agent-work card) | `cardBlue`, `trackerBg` |
| `ReflectionCard` (journal) | `cardWarm` |
| `ConfirmationBanner` | `greenToast` |
| `UndoAffordance` | `redLink` |
| `SupportingText` | `grayMd` |
| `PrimaryText` | `black90` |
| `PositiveAccent` | `green500` |
| `WarnAccent` | `amber500` |

You may propose additional semantic tokens, but every token name must read as a *role in the system*, not a *visual attribute*. If you can't name it without referencing a color or a specific component style, the abstraction is wrong.

## Aesthetic direction — the anti-brief

We are explicitly rejecting the following. If your output drifts toward any of these, revise before showing us.

**Aesthetics to avoid:**
- Anthropic orange, Claude branding, or any obvious "this was designed by an AI" palette.
- Blurry purple-pink-blue "AI aesthetic" gradients.
- Generic rounded-corner SaaS card stacks (Notion / Linear / Slack pastiche).
- "Glassmorphism" or heavy backdrop blur as the primary visual device.
- High-contrast dopamine-loop UI (streaks, badges, points visible on the main surfaces — those elements are out-of-scope for now).

**Patterns to avoid:**
- Generic Material-style floating action buttons with a "+" icon, drop-shadow, and gradient fill. **Carveout:** the single Hero affordance (see section 4) is allowed and expected — one persistent bottom-right control for voice/chat/quick-actions. This is the *only* persistent floating control; no other screen gets a FAB.
- Hamburger menus or bottom tab bars (the three-screen swipe replaces them).
- Standard chat bubbles with tails — we use cards.
- Settings-heavy chrome on main surfaces. Settings live behind a single minimal entry.

**Web-only patterns to avoid** (we're building React Native):
- Hover states as the primary interaction signal.
- CSS grid layouts that don't map to flex.
- Right-click / cursor-dependent affordances.
- Scroll-linked parallax effects that rely on mouse wheel.

**Scope discipline:**
- No gamification (streaks, points, gardens, map unlocking) — that's a post-launch reskin.
- No somatic exercises, breath work, or meditation UI — post-launch.
- No kanban or Gantt views — flat checklists only for now.

## Ethical AI design principles

Intently is an agent that reads private life data (journal, calendar, email, health) and takes actions on the user's behalf. The UI is the trust surface. These principles must show up as visible design decisions in your mockups and tokens — not copy hidden at the bottom of a screen.

**Source:** see `docs/design/ethical-ai-design.md` for full rationale (course notes on human-centered ML, data privacy, ethics in AI).

- **The agent explains before it acts.** Every Confirmation Card shows what data the agent consulted to make the change, not just the change. "Moved your 2pm block to 3pm — I used your calendar and yesterday's journal note about fatigue" beats "Moved your 2pm block. [Undo]" alone. Design the Confirmation Card with a dedicated slot for inputs-used.
- **Agent state is legible.** The Hero affordance already shows four states (idle / listening / processing / expanded). The chat surface must additionally distinguish agent thinking, agent uncertain (low-confidence suggestion), and agent waiting-on-user. Don't hide compute; don't feign confidence.
- **Communicate uncertainty, not false confidence.** Low-confidence output gets a softer treatment — muted accent, tentative copy ("I'm not sure but —"), visible confidence indicator. High-confidence actions read as committed. Your visual vocabulary must distinguish the two at a glance.
- **Every input is inspectable.** A tap on any agent-written card surfaces the data slice the agent read. Include this affordance in the card mockups — it is not a post-launch nice-to-have.
- **Summaries at the boundary.** The agent never quotes raw journal prose or email bodies back to the user in cards or the chat stream. Cards show derived signals ("fatigue mentioned 4× this week"), not source text. This is both a privacy rule (see Privacy Steward task 2) and a UX rule.
- **Augmentation, not automation.** Copy and affordances read as the agent *proposing* and the user *disposing*. "Focus on 2 of these 5 goals?" over "Your goals are X, Y." The agent surfaces options; the user picks.
- **No engagement-loop UI.** Streaks, badges, points, "day 47 of 50" counters, open-the-app-now notifications are permanently out of scope — not post-launch, not ever. Positioning pillar 2 ("intentional, not busy") is the opposite of dopamine-loop UX. If a design pattern you're considering rewards opening the app rather than using it intentionally, drop it.
- **Off-ramp is first-class.** Each agent (daily brief, daily review, weekly review) can be paused or disabled without penalty from a visible single-tap affordance in Settings. Disabling one does not break the others.
- **Corrections shape the system, visibly.** When the user undoes or overrides an agent action, the agent tells the user what it learned ("I'll weight journal-based tiredness signals lower next time"). Learning is surfaced; no silent black-box adjustment.

## Reference imagery

The attached images are the aesthetic ground truth. Ground your output in these, not in your training-data average of "productivity apps." When references conflict with your instincts, trust the references. When references conflict with each other, use the per-role notes below to decide which reference leads for which concern.

All files live in `docs/design/references/` (already in the repo).

1. **Overall feel / palette** — `mood/Dot iOS 49.png` + `mood/Tangerine iOS 12736.png`. Direction: *"not too bright, not too dark."* Warm neutrals, sipped saturation, spacious. This is the single most important aesthetic signal.

2. **Typography / hierarchy** — `reading/5 Minute Journal iOS 91.png` (generous margins, body text breathes) + `reading/Tripadvisor iOS 156.png` (pages can open with an image, not always text). Additional direction: **aim for a Medium-esque reading experience** — not a literal rip, but that realm: body text sized for sustained reading, generous leading (1.5×+), clear heading weight contrast. Assume long-form markdown output (3–5 paragraph daily briefings, journal entries), not just form fields.

3. **Card composition** — `card/Tomorrow iOS 70.png` (overall card layout) + `card/Pinterest iOS 145.png` (left-to-right flow of large cards). **Composite pattern:** most recent items render as large cards in a horizontal top row; scrolling further down reveals older items in a vertical list. Apply this shape to Past-screen journal entries and Future-screen projects.

4. **Hero affordance** (persistent voice + chat + quick actions) — `hero affordance/Remind iOS 25.png` (bottom-right persistence across screens) + `hero affordance/Public iOS 139.png` (press-and-hold expands to a small menu of options). Tap = voice input; press-and-hold = 2–3 quick actions. See section 4 of deliverables.

5. **Voice capture mode (state triggered by tapping the Hero affordance)** — `voice affordance/Google Gemini iOS 38.png`. Direction: *"big empty space feels like an invitation to fill it."* When the user taps into voice mode, the screen opens up — minimal chrome, lots of room. Optional live transcription is fine but not required.

6. **Motion / transition** — *no reference provided; deferred.* Use Reanimated defaults + the motion tokens you propose. Keep transitions under 300ms, decelerating easing. The swipe between the three screens should feel physical (content tracks the finger).

## Stack constraints (so your output can actually ship)

- **Runtime:** React Native on Expo. All patterns must be expressible with standard RN primitives (`View`, `Text`, `Pressable`, `ScrollView`, `FlatList`) + Reanimated for motion. Do not design anything that requires web-only CSS.
- **Styling layer:** we are using a themeable tokens approach (Tamagui or NativeWind + tokens abstraction). The `tokens.ts` you deliver should be platform-neutral — a plain TypeScript object literal with semantic keys.
- **Icons:** we use **Lucide** (via `lucide-react-native`). Don't invent bespoke icons. Call out which Lucide icon to use for each role.
- **Fonts:** system fonts or Google Fonts via `expo-font` only.
- **Platforms:** iOS + Android at launch. Designs must work on notched and non-notched screens; assume safe-area insets.

## Accessibility requirements (mandatory)

Mobile accessibility is baked into the token set and mockups from day one — not a polish pass. Every token and mockup you produce must satisfy the rules below. Violations of any rule are a failure of the brief, same as missing a deliverable.

**Source:** see `docs/design/mobile-app-accessibility-design.md` for full rationale and citations.

**Perceivable:**
- Text contrast meets WCAG 2.2 AA: 4.5:1 for body text, 3:1 for large text and UI, in both light and dark modes. Note the contrast-verified value for every color pair in `tokens.ts`.
- Never rely on color alone for meaning (status, errors, required fields). Pair color with an icon, label, or textual cue.
- Text scales to 200% without truncation or horizontal scroll. Typography tokens must assume Dynamic Type / system font scaling is on.
- Every meaningful icon has a text label or accessibility companion string noted in the spec. Decorative icons are marked decorative.

**Operable:**
- Tap target minimum **44×44 pt iOS / 48×48 dp Android** on every interactive element. The Confirmation Card's `[Undo]` affordance clears this with margin.
- No gesture-only actions. Drag, multi-finger gestures, and content-swipes always have a tap/button alternative. The three-screen swipe is navigation; card actions do not require gestures.
- Thumb-zone placement for frequent actions (voice capture, Undo, primary confirmations): lower half of the screen, reachable one-handed on a 6.7" phone.
- Focus indicator is visible, non-color-only, lands on a logical first element on screen open, and returns sensibly after dialogs close.

**Understandable:**
- Plain-language labels. "Save changes" over "Commit." Error states explain what happened and how to recover.
- Reading order for screen readers matches visual order. Cards group heading → state → body → actions semantically, not as a flat list of views.
- Dynamic content (agent-updated cards, toasts, errors) announces to assistive tech. A Tracker Card going 40% → 50% emits a screen-reader update, not just a visual animation — show this in the spec.

**Robust:**
- Use native RN primitives (`Pressable`, `Text`, `View`, `ScrollView`, `FlatList`) with platform accessibility traits. Custom controls must declare roles, states, and labels explicitly.
- The voice-capture affordance has a text-input **equal-status** alternative. Voice-first is not voice-only.
- Mockups render correctly at small-screen (iPhone SE) and large-screen (Pixel 7 Pro / iPhone 15 Pro Max) sizes and in both orientations.

**Verification the design must satisfy:**
- Every interactive mockup element has an accessibility label noted in the spec.
- The Daily Brief hero moment and the Confirmation Card are annotated with VoiceOver/TalkBack walkthrough notes.
- All three demo flows (daily brief / daily review / weekly review) can be completed end-to-end using only VoiceOver + large text on iOS and TalkBack + large text on Android.

## Output format

**Scope for this round: light mode only.** Dark mode is deferred post-hackathon. Do not produce dark variants. The token spec should be structured so a dark theme can be swapped in later (theme object keyed by name), but only populate the light theme for now.

Deliver in this order:

1. **Hero moment mockup** first (Daily Brief opening, full screen). This establishes the aesthetic. Pause after this one for user feedback before generating the rest.
2. **Token spec** (`tokens.ts` TypeScript object literal, light theme populated).
3. **Three-screen shell mockups** (Past / Present / Future, each at rest).
4. **Four card types** (Tracker / Plan / Journal / Confirmation) — default state for all four; agent-updated state for the Tracker Card and Confirmation Card only (those two are the trust-surface pair).
5. **Hero affordance** — four states: Idle, Listening / voice mode (full-screen), Processing, Expanded (press-and-hold menu).
6. **Type pairing, spacing logic, and motion timing** write-up — one short page explaining how the tokens hang together, so Claude Code can fill gaps without redesigning the system.

If you need to cut anything for scope, cut the four-cards-in-two-states matrix first (default states for all four are required; updated states can be one-per-card instead of all four). Do not cut the Hero moment, the Hero affordance states, or the token spec.

## Success criteria

You have succeeded when:
- A mobile engineer could implement the three screens, four cards, and voice affordance from your mockups + tokens without needing to make visual-design decisions of their own.
- The aesthetic is clearly downstream of the reference images, not of generic SaaS patterns.
- Every token name passes the "could this token be used in a fantasy-adventure reskin?" test. (If a token is named `blueBg`, no. If it's named `PrimarySurface`, yes.)
- The Confirmation Card's `[Undo]` affordance is the most findable element on its card, without being aesthetically loud.

Ask clarifying questions before producing output if anything above is ambiguous.
