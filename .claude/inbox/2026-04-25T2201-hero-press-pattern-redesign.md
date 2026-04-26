---
captured: 2026-04-25T22:01:00-05:00
session: chat/0425-210554
source: discussion
---

# Hero affordance — replace press-hold-release-to-select with tap-to-open + tap-to-select

No handoff drafted — small, scoped UX redesign decision. `/groom` should route to TRACKER § Next with inline AC, OR fold into a "hero affordance v2" thread if grooming sees a larger pattern.

## One-line intent

Muxin: *"tapping to hold the hero button and then releasing to be able to select. If they tap to hold just open the menu, then let them just tap on whatever it is that they want to select. They shouldn't have to scroll through something and then release to select it."*

Change the long-press hero menu interaction model:
- **Today:** press-and-hold the mic to open the radial menu, drag finger over option, release while over option to select it.
- **Target:** tap-and-release on the mic opens the menu (sticky). User then taps a separate option to select it. Or taps anywhere outside to dismiss. Standard menu pattern.

## Why this is in the inbox

The press-hold-release-to-select pattern has known UX downsides on web: users have to fight motor control to make a selection while keeping the press active, scroll-while-pressed is jittery on touchpads, accidental release loses the selection. The original prototype animation looked elegant for screenshots but doesn't survive contact with real users on real devices.

Standard menu pattern (sticky open, separate tap to select, tap-out to dismiss) is universally understood, more accessible, and works identically across mouse, touch, and keyboard.

## Surface area

- `web/intently-hero.jsx` — state machine: `'idle' | 'listening' | 'processing' | 'expanded' | 'chat'`. The `'expanded'` state is the long-press menu. Re-spec:
  - Short-tap (current): start voice recording (open `'listening'`). **Keep this.**
  - Long-press OR a dedicated affordance (current is long-press): open menu (sticky). **Change semantics:** menu stays open until user taps an option or taps outside.
  - Currently `onPointerUp` decides between short-tap and long-press based on duration. New flow keeps the duration check but on long-press → open menu and DO NOT close on `onPointerUp`. Close on next tap.
- `web/intently-screens-prototype.jsx:559-564` — the `'processing'` timer/dispatch may need adjusting.

## Suggested AC (inline, if grooming routes to § Next)

- [ ] Long-press the hero opens the radial/grid quick-action menu and **keeps it open** after the press is released.
- [ ] Tapping any option in the open menu selects it (and dismisses the menu).
- [ ] Tapping outside the menu (anywhere on the phone frame) dismisses the menu without selection.
- [ ] Pressing Escape (when keyboard is available) dismisses the menu.
- [ ] Short-tap behavior is unchanged: starts voice recording.
- [ ] Visual feedback for "menu is sticky open" is clearly different from "menu is being held" (e.g. dim scrim behind menu when sticky, no scrim during the brief hold-to-open animation).

## Open questions for grooming

1. Should there be an explicit dedicated "open menu" affordance (small chevron, plus icon, etc.) in addition to long-press? Long-press alone is undiscoverable. *Suggest: yes — a tiny chevron disclosure on the mic button that taps directly into the open-menu state, while preserving long-press for power users.*
2. The current "expanded" state animations were authored for the press-hold model. They may need re-timing for the sticky model. *Decide during execution.*

## Cross-reference

Folds into the `wiring-audit` handoff's interaction inventory under the row "Hero (idle) — Long press → Open quick-action menu." Wiring is correct (UI state); the **interaction model itself** is being changed.
