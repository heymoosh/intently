# Session Prompt — Design Fidelity Pass

**Goal:** bring the Expo Web app's UI/UX into alignment with the canonical design handoff. Current build is functionally wired (live MA, voice input, reminders, all three skills, 3-tense swipe) but the visual language and navigation chrome drift from spec. Your job is to close that gap — button placement, navigation pattern, screen structure, typography/spacing application of tokens — without breaking any of the functional wiring below.

## Read first (in order)

1. **`docs/design/Intently - App/README-design-handoff.md`** — the canonical spec. Start here. The TL;DR, product model (§1), data model (§2), screen map (§3), state machines (§4), file map (§5), key flows (§6), design system (§7), scope (§8).
2. **Any supplementary guide** Muxin drops into `docs/design/Intently - App/` — check for new files like `README-supplement*.md` or `design-fidelity-notes*.md`. These extend or override the main handoff.
3. **`docs/design/Intently - App/intently-*.jsx`** — the visual prototype. `intently-shell.jsx`, `intently-screens.jsx`, `intently-cards.jsx`, `intently-hero.jsx`, `intently-journal.jsx`, `intently-projects.jsx` are the ones to mine for pattern reference.
4. **`app/App.tsx`** — current state. Read what's there before changing anything.
5. **`CLAUDE.md`** — house rules. "Act, don't ask" is the default; branch-first for tracked file edits.

## What's functional — DO NOT BREAK

- **Live MA for daily-brief** via `app/lib/ma-client.ts` → `callMaProxy` → Supabase `ma-proxy` edge function. `handleGenerateLiveBrief` in App.tsx; fixture at `app/fixtures/daily-brief-seed.ts`.
- **Daily-review + weekly-review wiring** (fixtures + handlers + `AgentOutputCard` render). Agent configs in `agents/*/ma-agent-config.json`. MA console creation is user-only; once secrets are set, triggers work end-to-end.
- **Voice input hero** — `app/components/VoiceModal.tsx` + `app/lib/voice.ts`. Web Speech API with TextInput fallback; POSTs to the reminders classify-and-store endpoint.
- **Reminders backend** — `supabase/functions/reminders/`, migration `0003_reminders.sql`, seeds in `supabase/seeds/reminders.sql`. Schema + endpoint are stable.
- **21-slot infinite swipe rotation** — `CYCLES = 7` + `SCREENS_PER_CYCLE = 3` logic in App.tsx. Don't replace with a clone-wrap approach; the current pattern is empirically proven on react-native-web.
- **Design tokens** — `app/lib/tokens.ts`. Add new tokens by extension only; don't rename existing keys (AgentOutputCard and others reference them).
- **Agent output card** — `app/components/AgentOutputCard.tsx` with `kind: 'brief' | 'journal' | 'chat' | 'review'` and `inputTraces` chips. Keep this component; it's the "agent did something" visual.
- **Phase driven Present** — `phase: 'morning' | 'planned' | 'evening'` state. The dev-toggle UI may be relocated/restyled or moved to a URL query param; the **underlying phase state must remain** because it drives what CTA shows when.

## What's wrong and needs a design-fidelity pass

From Muxin's direct eyeball of the current build (2026-04-24 build-day):

1. **Swipe feel** — on react-native-web, `pagingEnabled` on horizontal `ScrollView` doesn't snap cleanly; it drags like a pan/whiteboard. Fix with CSS scroll-snap (`scrollSnapType: 'x mandatory'` on container, `scrollSnapAlign: 'start'` on each slot). May have been partially addressed in a prior pass — verify on current code.
2. **PhaseToggle reads as primary top nav.** Currently a pill row with Morning / Planned / Evening — too prominent. Per spec there's no tense label chrome at all; the tense dots-nav (← · · · →) lives at the **bottom**. The phase switch is a dev-only affordance — tuck it, hide behind a dev flag, or drive from URL query param (`?phase=evening`). Not a top nav element.
3. **Past screen layout is wrong per §3.1.** Should be default Week view: 7-day strip, Weekly Review summary + outcomes list + key moments, with Day view chronologically listing Entries (brief → journal → chat → review) for the tapped day. Year/Month zoom levels are in scope for MVP per §8 but can stay as a stretch — Week view is the bar.
4. **Future is too sparse.** Three goal cards are there, but no Projects band, no painterly atmosphere, no "Name a new goal" ghost button. §3.3 spells it out.
5. **Hero affordance is a plain emoji button.** Size, position, visual weight, states (idle / listening / processing / expanded) — all need polish. Full press-and-hold radial menu is in scope per §8; at minimum the idle disc + listening takeover should read as the spec describes.
6. **TenseNav (bottom arrow-dot pattern)** — not implemented. Three dots + left/right arrows at the bottom per §1.1. No text labels for tenses in production chrome.
7. **Typography** — Fraunces italic display + Source Serif 4 reading + Inter UI are all loaded but not consistently applied. Screen titles should be 44px italic Fraunces (§7.1). Current titles look too close to UI weight.
8. **Confirmation card pattern** — the agent-did-something atomic unit (§1.3). `AgentOutputCard` is the bones; the spec calls for sage surface, cream serif, undo pill action. Harmonize.

## Priority order (do in this order; skip later items if time runs short)

1. Read the spec + supplementary guide (if any).
2. Fix **swipe snap** and **PhaseToggle demotion** — these are the most viscerally wrong current-state issues. Small changes, big polish return.
3. **Bottom TenseNav** (arrow-dot pattern) — pervasive visual chrome per spec.
4. **Hero affordance polish** — at minimum correct position, size, idle/listening visual states. Full state machine is stretch.
5. **Past → Week view** restructure: 7-day strip, weekly-review summary, outcomes, key moments.
6. **Future → add Projects band + "Name a new goal"**.
7. **Typography pass** — apply Fraunces italic / Source Serif / Inter per §7.1 wherever text is used.
8. **Present phase polish** — morning sunrise CTA + evening midnight CTA visual weight per §7.2.
9. **Year/Month/Day zoom views on Past** if time.
10. **Press-and-hold radial hero menu** if time.

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
