# Acceptance Criteria — Chat thinking indicator (Bug 1)

**Topic:** Visible "agent is responding" indicator in the chat thread while waiting on the agent reply.
**Source capture:** `git show 0df181f:.claude/inbox/2026-04-25T2300-chat-reminder-path-bugs.md` (Bug 1 section).

## Goal

When the user sends a chat message and the agent is processing the response, a visible indicator appears in the chat thread (not just the input placeholder). The user clearly perceives that the agent is working, even on slow connections.

## Background

`HeroChat` in `web/intently-hero.jsx` has a `pending` state, but the only visual feedback is the chat composer's placeholder text changing from "Say more, or ask a question…" to "Thinking…" (line 540) and the send button slightly dimming (line 553). The chat thread itself shows nothing during the network round-trip to the classify-and-store Edge Function (1–3 seconds). Users reasonably assume the chat is broken.

The hero affordance state machine has a `'processing'` state with a real `ProcessingArc` ring (`intently-hero.jsx:208-223`) — used today only for voice-recording → transcript handoff. Reuse the same animation primitive for chat-thread pending so hero and chat share one "agent is working" vocabulary.

## Acceptance criteria

- [ ] **CR-01** While `pending === true` in `HeroChat`, a placeholder "agent is thinking" bubble is rendered in the thread, visually consistent with regular agent message bubbles (same alignment, similar shape) but distinguishable (animated, no text content).
- [ ] **CR-02** The bubble appears within ~100ms of the user's message being sent (no perceptible blank gap between user-bubble and thinking-bubble).
- [ ] **CR-03** The bubble is removed when the agent reply lands. There is no double-bubble flash (user does not briefly see both the thinking-bubble and the new agent-reply-bubble at the same time).
- [ ] **CR-04** The animation reuses the prototype's existing motion vocabulary. Acceptable choices:
  - The `intentlyPulse` keyframe from `index.html`
  - The `intentlyBreath` keyframe
  - The `ProcessingArc` ring from `intently-hero.jsx:208-223` (small inline variant)
  - A horizontal three-dot loader using the same color/timing tokens
  - Document the choice in a one-line comment in the diff.
- [ ] **CR-05** The indicator works on a throttled connection. With Chrome DevTools Network throttling = "Slow 3G," the indicator is continuously visible for the entire round-trip.
- [ ] **CR-06** Error handling: if the classify-and-store fetch fails (network error, 4xx/5xx), the thinking bubble is removed, AND the existing fallback agent reply ("Got it — I'll keep that in mind.") is appended. No orphaned thinking bubble.
- [ ] **CR-07** No regression to the existing `pending` UI on the input — placeholder still says "Thinking…", send button still dims. (We're adding to it, not replacing.)

## Verification methods

| CR | How to verify |
|---|---|
| CR-01 | Read the diff of `intently-hero.jsx`; confirm `HeroChat`'s thread state includes a placeholder entry while `pending`. Confirm visual styling is consistent with agent bubbles. |
| CR-02 | Manual: open chat, send a message, observe — gap between user-bubble appearing and thinking-bubble appearing should be imperceptible. |
| CR-03 | Manual: send a message with normal connection. The transition from thinking-bubble to agent-reply-bubble should not cause both to be visible simultaneously. |
| CR-04 | Read the diff; confirm the chosen animation references an existing keyframe/component, not a new one. |
| CR-05 | Open DevTools → Network tab → set throttling to "Slow 3G". Send a chat message. Indicator should be visible the entire wait. |
| CR-06 | Force a fetch failure (DevTools Network tab → block the classify-and-store URL). Send a message. Confirm the thinking bubble clears and the fallback reply appears. |
| CR-07 | Same chat send: confirm input placeholder still changes to "Thinking…" and send button still dims while pending. |

## Out of scope

- Changes to the chat composer's input field (placeholder, button, etc.) — those already work.
- Changes to the classify-and-store Edge Function — covered by `chat-reminders-jwt-and-timezone.md`.
- Streaming agent responses (token-by-token) — separate, larger feature.
- Persistent chat history across sessions — separate.

## Sub-agent contract

When dispatched, your final response MUST include the AC checklist above with ✅/❌ + one-line evidence per criterion. If any criterion is ❌, surface the blocker — do NOT declare done. The orchestrator will verify against the actual diff before merging.
