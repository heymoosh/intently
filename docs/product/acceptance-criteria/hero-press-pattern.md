# Acceptance Criteria — Hero press-pattern redesign

**Topic:** Replace the hero affordance's press-hold-release-to-select pattern with tap-to-open + tap-to-select.
**Source capture:** `git show 0df181f:.claude/inbox/2026-04-25T2201-hero-press-pattern-redesign.md`.

## Goal

Long-press the hero mic to open the quick-action menu in a sticky state. The menu stays open after the press is released. Tap an option to select. Tap outside to dismiss. Short-tap (under the long-press threshold) still starts voice recording.

## Background

Today's pattern (`web/intently-hero.jsx`): user long-presses the mic, menu appears, user must keep pressing while moving finger to an option, then release while over the option to select. Known UX downsides: motor-control fight, jittery scroll-while-pressed on touchpads, accidental release loses the selection.

Standard menu pattern (sticky-open + tap-out-to-dismiss + tap-to-select) is universally understood, more accessible, and works identically across mouse, touch, and keyboard.

## Acceptance criteria

- [ ] **CR-01** Long-press on the hero mic (duration ≥ existing threshold) opens the radial/grid quick-action menu in a **sticky** state — releasing the press does NOT close the menu.
- [ ] **CR-02** Tapping any option in the open menu selects that option (fires the option's existing handler) AND dismisses the menu.
- [ ] **CR-03** Tapping anywhere outside the menu (within the phone frame) dismisses the menu without selecting anything.
- [ ] **CR-04** Pressing `Escape` (when keyboard is available) dismisses the menu.
- [ ] **CR-05** Short-tap (release before the long-press threshold) starts voice recording — unchanged behavior. No regression.
- [ ] **CR-06** No regression to chat opening. Whatever path opened chat before still opens chat.
- [ ] **CR-07** Visual feedback distinguishes "menu is sticky open" from "menu is being held" (e.g., dim scrim behind menu when sticky; no scrim during the brief hold-to-open animation, or different opacity). Document the choice.
- [ ] **CR-08** The existing "expanded" state animation timings are re-tuned (or kept) so the visible effect on long-press → menu-open feels coherent with the new sticky semantics. No abrupt animation cuts.
- [ ] **CR-09** No `() => {}` stub handlers introduced (would be caught by build-watchdog teeth, but call out here for extra safety).

## Verification methods

| CR | How to verify |
|---|---|
| CR-01 | Manual: long-press the mic, release, confirm menu stays visible. |
| CR-02 | Manual: long-press → release → tap an option → option's effect fires AND menu closes. |
| CR-03 | Manual: long-press → release → tap outside menu (e.g., near the chat header). Menu closes without firing any option. |
| CR-04 | Manual: long-press → release → press Escape. Menu closes. |
| CR-05 | Manual: short-tap the mic. Voice recording starts. |
| CR-06 | Manual: trigger the existing chat-open path (whatever it is — short-tap then send, or text quick-action). Chat opens. |
| CR-07 | Read the diff; confirm visual treatment for sticky-open vs holding states is implemented. |
| CR-08 | Manual: visually inspect the long-press → menu-open transition. No jarring cuts. |
| CR-09 | `npm run lint` (assuming build-watchdog teeth has shipped) passes; spot-check the diff for any new empty handlers. |

## Open question (optional, decide during execution)

Should there be a small chevron disclosure on the mic button that taps directly into the open-menu state (alongside long-press)? Long-press alone is undiscoverable.
- Lean: yes, add the chevron. Low cost, big discoverability win.
- If implementing: add CR-10 to confirm the chevron tap opens the menu identically to long-press → release.

## Out of scope

- New menu options or changing what the existing options do.
- Revamping the visual style of the menu beyond the sticky-vs-held distinction.
- Voice recording flow changes.

## Sub-agent contract

When dispatched, your final response MUST include the AC checklist above with ✅/❌ + one-line evidence per criterion. If any criterion is ❌, surface the blocker — do NOT declare done. The orchestrator will verify against the actual diff before merging.
