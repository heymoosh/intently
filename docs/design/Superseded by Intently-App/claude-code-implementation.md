# Claude Code — Design Ingestion Instructions

**Purpose:** how Claude Code (in implementation sessions) takes the artifacts produced by Claude Design and turns them into shipping Expo / React Native code. Companion to `claude-design-brief.md` (the outbound brief) and `claude-design-workflow.md` (the handoff workflow).

**When to read this:** at the start of any session that implements UI. The rules here override generic "build it however" instincts.

**Prerequisite:** the stack is scaffolded (Expo + TypeScript per ADR 0003) and Claude Design has returned tokens + mockups. If either is missing, stop and surface that — do not guess.

---

## Folder layout (authoritative)

Design artifacts live in the repo. Do not keep them in external tools.

```
docs/design/
  claude-design-brief.md         # outbound brief to Claude Design
  claude-design-workflow.md      # the workflow rationale
  claude-code-implementation.md  # THIS FILE
  references/                    # reference imagery fed to Claude Design
  tokens/                        # raw token spec returned by Claude Design
    tokens.source.ts             # as-delivered, don't edit
    tokens.source.md             # Claude Design's write-up on type/spacing/motion
  mockups/                       # PNG exports from Claude Design
    hero/                        # Daily Brief hero composition
    shell/                       # three-screen shell (light + dark)
    cards/                       # 4 card types, default + updated states
    voice/                       # voice capture affordance (3 states)
```

Implementation lives in the app, not in `docs/`:

```
src/
  theme/
    tokens.ts                    # imports + re-exports from tokens.source.ts
    theme.ts                     # Tamagui or NativeWind theme config built from tokens
    useTheme.ts                  # hook for consumer components
  components/
    primitives/                  # Surface, Text, Pressable wrappers that consume tokens
    cards/                       # TrackerCard, PlanCard, JournalCard, ConfirmationCard
    voice/                       # VoiceCapture (idle/listening/processing)
  screens/
    PastScreen.tsx
    PresentScreen.tsx
    FutureScreen.tsx
  navigation/
    SwipeShell.tsx               # custom horizontal pager with circular wrap
```

## Styling layer — pick one before you write a component

The design brief specified a *themeable tokens* approach and left the library open. Pick one now and record the choice in an ADR (`docs/decisions/0004-styling-layer.md`):

- **Tamagui** — native theme token support, compile-time optimization, explicit variants. Best fit for the future reskin goal. Sharper learning curve; heavier dependency.
- **NativeWind + tokens abstraction** — Tailwind-in-RN, fastest to adopt, large community. Theme-switching is possible but requires discipline to funnel every class through a tokens layer.

**Default recommendation for the hackathon:** NativeWind + a strict `tokens.ts` + `useTheme` hook. It's faster to ship in 4 days and the reskin requirement is still achievable if every component reads colors/spacing from the theme hook — never from a literal Tailwind class. If you prefer Tamagui, accept a half-day to a day of setup + learning cost.

**Rule regardless of choice:** no component in `src/components/` may contain a literal color, hex code, pixel value, or font size. Every visual value flows from `useTheme()`. If you find yourself typing `#` into a component file, stop and add a token.

## Ingestion order (do not skip steps)

1. **Commit `tokens.source.ts`** to `docs/design/tokens/` exactly as delivered. Do not edit.
2. **Create `src/theme/tokens.ts`** that re-exports the source. This indirection lets us evolve the app-side shape without losing the original spec.
3. **Build the theme layer** (`src/theme/theme.ts` + `useTheme`). Light + dark. Verify you can swap themes by changing a single variable.
4. **Build primitive wrappers** (`Surface`, `Text`, `Pressable`) that read from tokens. Every downstream component uses these, never raw RN primitives for styling.
5. **Build cards** in this order: `ConfirmationCard` → `TrackerCard` → `PlanCard` → `JournalCard`. Confirmation is first because it's the trust surface and the hardest to get right.
6. **Build the voice capture component** next. All three states. The idle→listening transition is the single most-noticed animation in the app.
7. **Build the three screens** as static compositions of cards + content slots. No navigation yet.
8. **Build the swipe shell last.** It's a custom horizontal pager with circular wrap (center→left→further-left→center). This is not a library drop-in; it's Reanimated + Gesture Handler. Budget a half-day minimum.

Do not build agent-integration wiring (managed agent calls, Markdown rendering of state files) in the same session as UI. Those are separate concerns — build UI against mock data first.

## Matching mockups — how Claude Code verifies its own output

For each screen and component:

1. Open the mockup PNG in `docs/design/mockups/`.
2. Run the app on the iOS Simulator (or Expo Go).
3. Screenshot the running app.
4. Put the two images side by side. Differences in spacing, hierarchy, weight, or color are defects.

This is a manual visual diff, not automated visual regression. For a 4-day build this is correct — don't set up Storybook + Chromatic. Do set aside 15 minutes per component for the side-by-side pass.

When the mockup and the build diverge, the **mockup wins** unless there's a stack reason it can't. If a stack reason forces a divergence (e.g., a shadow treatment that Reanimated can't cheaply animate), record it in `docs/design/deviations.md` with a one-line why, and move on.

## Rules for Claude Code (explicit overrides for generic instincts)

- **Never hardcode visual values.** Colors, spacing, radii, font sizes, weights, shadows, motion timings — all come from tokens.
- **Never rename tokens.** The semantic names are the reskin hook. If a token name feels awkward, that's fine — it still gets used as-is.
- **Never invent components the mockups don't show.** If a screen needs something Claude Design didn't deliver, stop and ask, or file a gap in `docs/design/gaps.md` and use the closest delivered primitive as a placeholder.
- **Never substitute a different icon set.** The brief specifies Lucide via `lucide-react-native`. If Claude Design called out a specific icon, use that exact icon.
- **Never add micro-interactions not in the spec.** No "delightful bounces" on tap, no shimmer placeholders, no easter eggs. Calm surface. The motion spec in `tokens.source.md` is the complete motion budget.
- **Never ship a component that only works in light mode.** Both themes, both orientations (where the app supports them), both notched and non-notched.
- **Never use `SafeAreaView` ad-hoc.** Wire safe-area handling once in the shell; components shouldn't care.
- **Always prefer editing existing files** to creating new ones, consistent with repo norms.

## When Claude Design didn't cover something

This will happen — the brief was scoped to MVP. When you hit a gap:

1. Check `docs/design/mockups/` and `docs/design/tokens/` for the closest analog.
2. Compose the needed element from existing primitives using only existing tokens.
3. Do **not** add a new token to fill the gap. Reuse an existing semantic token even if the fit is imperfect.
4. Log the gap in `docs/design/gaps.md` with: what was missing, what you used instead, what needs to be revisited.
5. Escalate to the user if the gap blocks the demo flows (Daily Brief / Daily Review / Weekly Review).

The anti-pattern: "I'll just design this myself really quick." Don't. The reason we ran a design pass is so the aesthetic converges. One bespoke component that was designed in-session will stand out from everything else.

## Theme-swap sanity check (the reskin hook)

After the app runs end-to-end, do a 30-minute reskin test:

1. Duplicate `src/theme/theme.ts` as `theme.fantasy.ts`.
2. Rewrite only the token *values* — parchment surfaces, scroll-styled cards, quest-marker accents. Do not touch any component file.
3. Swap the theme export.
4. Run the app.

If anything breaks or fails to reskin, a component is reading a raw value instead of a token. Find it and fix it. Do this once before the hackathon submission even if the fantasy theme will never ship — it's the cheapest way to prove the architecture holds.

## What to commit and when

- Design artifacts (`docs/design/**`): committed the moment they arrive from Claude Design.
- `tokens.source.*`: never edited after commit.
- `src/theme/**`: committed after the theme layer builds and renders in both modes.
- Components: committed per-component as they pass the side-by-side mockup check.
- `docs/design/deviations.md` and `docs/design/gaps.md`: updated in the same commit as the code that created the deviation or gap.

## Definition of done (for a UI session)

A UI implementation session is done when:

1. Every committed component reads visual values from tokens only.
2. The side-by-side mockup check has passed for every delivered component.
3. Both light and dark modes render without layout breakage.
4. The theme-swap sanity check passes (for the session's scope).
5. Deviations and gaps are logged.
6. `.claude/session-handoff.md` is updated with what's built, what's left, and any open design questions for the next session.
