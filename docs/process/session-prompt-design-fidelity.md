# Session Prompt — Design Fidelity Pass

**Goal:** bring the Expo Web app's UI/UX into alignment with the canonical design handoff. Current build is functionally wired (live MA, voice input, reminders, all three skills, 3-tense swipe) but the visual language and navigation chrome drift from spec. Your job is to close that gap — button placement, navigation pattern, screen structure, typography/spacing application of tokens — without breaking any of the functional wiring below.

## Read first (in order)

1. **`docs/design/Intently - App/CLAUDE.md`** — design-owner's "start here" for this app. The five things that matter most. Read before any code.
2. **`docs/design/Intently - App/BUILD-RULES.md`** — **the non-negotiables and anti-patterns**. This is the sharpest doc in the folder — read it especially carefully if you catch yourself about to add a tab bar, a segmented control, a phase toggle, a "generate X" button, or any top-level chrome you don't see in the canvas's Three-tense system section. The previous session (this one) shipped code that violated several of these; see "What the previous session already fixed" below.
3. **`docs/design/Intently - App/HANDOFF.md`** — the full spec. Product model (§1), data model (§2), screen map (§3), state machines (§4), file map (§5), key flows (§6), design system (§7), scope (§8).
4. **`docs/design/Intently - App/intently-*.jsx`** — the visual prototype. `intently-shell.jsx`, `intently-screens.jsx`, `intently-cards.jsx`, `intently-hero.jsx`, `intently-journal.jsx`, `intently-projects.jsx`. The source of truth for patterns.
5. **`app/App.tsx`** — current state. Read what's there before changing anything.
6. **Root `CLAUDE.md`** — repo-wide house rules. "Act, don't ask" is the default; branch-first for tracked file edits.

## What's functional — DO NOT BREAK

- **Live MA for daily-brief** via `app/lib/ma-client.ts` → `callMaProxy` → Supabase `ma-proxy` edge function. `handleGenerateLiveBrief` in App.tsx; fixture at `app/fixtures/daily-brief-seed.ts`.
- **Daily-review + weekly-review wiring** (fixtures + handlers + `AgentOutputCard` render). Agent configs in `agents/*/ma-agent-config.json`. MA console creation is user-only; once secrets are set, triggers work end-to-end.
- **Voice input hero** — `app/components/VoiceModal.tsx` + `app/lib/voice.ts`. Web Speech API with TextInput fallback; POSTs to the reminders classify-and-store endpoint.
- **Reminders backend** — `supabase/functions/reminders/`, migration `0003_reminders.sql`, seeds in `supabase/seeds/reminders.sql`. Schema + endpoint are stable.
- **21-slot infinite swipe rotation** — `CYCLES = 7` + `SCREENS_PER_CYCLE = 3` logic in App.tsx. Don't replace with a clone-wrap approach; the current pattern is empirically proven on react-native-web.
- **Design tokens** — `app/lib/tokens.ts`. Add new tokens by extension only; don't rename existing keys (AgentOutputCard and others reference them).
- **Agent output card** — `app/components/AgentOutputCard.tsx` with `kind: 'brief' | 'journal' | 'chat' | 'review'` and `inputTraces` chips. Keep this component; it's the "agent did something" visual.
- **Phase driven Present** — `phase: 'morning' | 'planned' | 'evening'` state. The dev-toggle UI may be relocated/restyled or moved to a URL query param; the **underlying phase state must remain** because it drives what CTA shows when.

## What the previous session already fixed (as of commit before this prompt)

- **Swipe snap on web** — CSS scroll-snap (`scrollSnapType: 'x mandatory'` + `scrollSnapAlign: 'start'`) passed through to react-native-web so pages actually snap. Verify on current code before "fixing" again.
- **PhaseToggle removed entirely** — was a pill row reading as primary top nav. Replaced with `derivePhase()`: clock-driven, with URL override `?phase=morning|planned|evening` for demo recording. No user-facing phase switcher (per BUILD-RULES non-negotiable #2).
- **"Generate X" pills removed** — `LiveAgentTrigger` pills for weekly-review (Past) and brief (Present planned/evening) are gone per BUILD-RULES anti-pattern "A 'Generate brief' / 'Start review' button that isn't the hero." The `LiveAgentTrigger` component function still exists in `App.tsx` (safe to keep or remove); it's just not rendered on any screen.
- **"+ New journal entry" button removed** — journal entries go through hero per §1.3 / §6.2.
- **Emojis removed from labels** — `☀`, `🌙`, `✨`, `🗓` gone from copy. One remaining visual emoji: the `🎙` mic glyph on the hero button itself. That's icon-chrome (visual, not copy), a stopgap pending a proper Lucide/glyph component import. Replace with a real Mic glyph when you do the hero polish pass.

## What's wrong and still needs a design-fidelity pass

From HANDOFF spec + BUILD-RULES anti-patterns, remaining gaps:

1. **No phone frame.** Spec §5 + BUILD-RULES non-negotiable #5: "The app is one iPhone 16 Pro-sized surface. Design at 393×852. Use `<Phone>` from `intently-shell.jsx`." Current app renders full-width in browser. Port the `<Phone>` wrapper or build a simpler RN-Web equivalent that constrains width to 393px (or viewport if smaller) and applies the iPhone bezel visuals.
2. **No `TenseNav` at bottom.** Per §1.1 / BUILD-RULES non-negotiable #4: `← · · · →` — three dots for position, arrows to step, **no text labels** ("Past / Present / Future" labels are an anti-pattern). Must be persistent across all three tenses.
3. **Hero affordance state machine incomplete.** §1.2 / §4.1 spec out four visible states: idle / listening (fullscreen takeover) / processing / chat / expanded (radial quick-action menu). Current is a plain Pressable with an emoji. At minimum land: proper idle disc with a real Mic glyph, listening takeover styling. Full press-and-hold radial menu is stretch.
4. **Past screen structure.** §3.1 calls for zoomable Year/Month/Week/Day. Current only renders Week-ish — weekly-review summary + today's Entries chronologically. Need: 7-day strip header, key moments list, top-right zoom chip, tap-to-drill-one-level gesture. Full Year (365-tile grid) + Month (5×7 grid) + Day view are in MVP scope per §8. Minimum Viable: proper Week view with 7-day strip and key moments; Day view stubbed.
5. **Future screen missing Projects band.** §3.3: goals + "Name a new goal" ghost button + Projects band below (compact cards → ProjectDetail on tap). Current has goal cards but nothing else.
6. **Solid CTA buttons.** BUILD-RULES anti-pattern: "CTAs are painterly: sunrise gradient (morning) / midnight gradient (evening)." Current `PhaseCta` uses solid `PrimaryText` / `UndoAffordance`. Need painterly gradients — probably via the `PainterlyBlock` component from `intently-imagery.jsx` (port to RN Web if not already), or via a React Native `LinearGradient`.
7. **Typography inconsistent.** §7.1: screen titles 40–48px italic Fraunces. Current titles 32px via `screenHeaderTitle` style. Reading-mode bodies need 17–18px Source Serif at 30px line-height and ~42px side margins per §7.1. Consistent application across all screens.
8. **Painterly backgrounds missing.** Goal cards are flat tints. Per §3.3 + §7.4: painterly palettes with `PainterlyBlock` (4-stop palette, seed → deterministic blob SVGs). Port from `intently-imagery.jsx` to RN Web (or RN-equivalent). Apply to Future goal cards, Past key moments, Present yesterday-highlight.
9. **Glyph system missing.** ~40 Lucide-sourced glyphs per §7.5. Port from `intently-glyphs.jsx` (or install `lucide-react-native` and wire equivalent names). Day marks, entry tags, goal atmospheres all need these.
10. **Grain overlay missing.** `.intently-grain` CSS class defined in `intently-imagery.jsx` — dithered noise overlay 20–30% opacity inside painterly/tinted blocks. Port to RN Web.
11. **`AgentOutputCard` → `ConfirmationCard` harmony.** §1.3 calls out the `ConfirmationCard` (sage surface, cream serif, two pill actions including Undo) as the "agent did something" atomic unit. Current `AgentOutputCard` is adjacent but not identical. Either evolve `AgentOutputCard` to match the `ConfirmationCard` spec, or split the two components (confirmation for hero-originated commits, output for agent-originated brief/review drops).
12. **Entry store abstraction missing.** §9.4 "what to build next" step 1: one flat array of typed Entries. Every screen reads from it; every hero commit writes to it. Currently daily-brief/daily-review/weekly-review live as three separate `LiveState` slots. Post-skeleton this should consolidate so Past's Day view can render chronologically across entry kinds.

## Priority order (do in this order; skip later items if time runs short)

1. Read CLAUDE.md + BUILD-RULES.md + HANDOFF.md.
2. **Phone frame wrapper** — constrain the app to 393×852 with iPhone bezel. Everything else depends on this because layout/typography only reads right at phone dimensions.
3. **Bottom TenseNav** (`← · · · →`) — pervasive chrome per spec. No text tense labels.
4. **Painterly CTAs** — replace solid `PhaseCta` with sunrise/midnight gradients (port `PainterlyBlock` or use `LinearGradient`).
5. **Hero affordance polish** — idle disc with proper Mic glyph (install `lucide-react-native` if not already), correct size/position, listening takeover styling.
6. **Past → full Week view** — 7-day strip header, weekly-review summary + outcomes + key moments, top-right zoom chip, tap-to-drill-one-level.
7. **Future → Projects band + "Name a new goal"** ghost row.
8. **Glyph system** — install `lucide-react-native`, wire the ~40-glyph set per §7.5.
9. **Typography pass** — 44px italic Fraunces for screen titles; Source Serif 17–18px / 30px line-height for reading bodies.
10. **Painterly goal cards** on Future, painterly yesterday-highlight on Present morning.
11. **Grain overlay** — port `.intently-grain` to RN Web.
12. **`ConfirmationCard` unification** — align `AgentOutputCard` with the spec's `ConfirmationCard` pattern.
13. **Year/Month/Day zoom on Past** — if time.
14. **Press-and-hold radial hero menu** — if time.
15. **Entry store abstraction** — if time.

## Verification

After each meaningful change, run:
```
cd app && npm run typecheck && npm run test:unit
```
Both must pass. 108 unit tests currently — don't regress.

Start the dev server and eyeball each screen:
```
cd app && npm run web
# open http://localhost:8081
```

Test the end-to-end flows:
- Swipe Past ↔ Present ↔ Future — should snap, not drag.
- Present phase switch via URL `?phase=morning|planned|evening` (after demotion) — each phase renders correct CTA.
- Tap hero → voice modal opens → can speak or type → "Save as reminder" → backend returns confirmation.
- Present "Generate live brief" pill → agent call runs → output replaces seed.

## Commit discipline

- Branch-first per CLAUDE.md. You'll be on `feat/track-design-fidelity` from `intently-track`.
- Small, focused commits per item from the priority list. Conventional commit prefixes (`feat(ui):`, `fix(swipe):`, `refactor(past):`).
- Co-Authored-By line on each commit:
  ```
  Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
  ```
- Push regularly. The auto-merge workflow picks up `feat/track-*` once CI is green.

## What not to do

- Don't invent design — follow the spec. If spec is ambiguous, prefer §5.1 file-splitting rules (tokens never reach into components, screens don't know card internals, hero is peer-of-screens-not-child).
- Don't add new dependencies without flagging. The stack is fixed: Expo + RN Web + Fraunces/Source Serif/Inter via expo-google-fonts.
- Don't create new docs unless spec-required (ADRs, architecture entries). CLAUDE.md is explicit about this.
- Don't touch `supabase/`, `agents/`, or `evals/` directories — they're owned by other lanes.
- Don't "simplify" the 21-slot infinite swipe — it was empirically tuned and works.

## When done

- Commit and push.
- Update `TRACKER.md` with a dated log entry summarizing what landed.
- Open a PR if CI is green — title: `feat(ui): design fidelity pass per handoff spec`. Body: bulleted list of priority items completed.

Start by reading the spec. Then write a 5-line plan for what you'll tackle first. Then execute.
