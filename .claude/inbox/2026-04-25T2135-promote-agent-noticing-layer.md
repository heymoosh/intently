---
captured: 2026-04-25T21:35:00-05:00
session: chat/0425-210554
source: discussion
handoff: .claude/handoffs/agent-noticing-layer.md
---

# Promote agent-noticing-layer from V1.1-deferred to active

**Handoff already exists at `.claude/handoffs/agent-noticing-layer.md`** (preserved from earlier; previously marked "V1.1 post-hackathon, not active yet" in TRACKER). `/groom` should re-classify: move TRACKER § Active handoffs row from "deferred V1.1" framing to active. Don't re-write the handoff — Muxin confirmed in this session he wants what's already there. Verify the handoff still matches intent before promoting; amend only if it's stale.

## One-line intent

Promote the noticing layer back into active work per Muxin: *"We also need the agent that pulls signal from chat and voice. All the things that I had asked for earlier in this thread, I want to make sure we include."*

## Why this is in the inbox

It was explicitly deferred to V1.1 post-hackathon. The hackathon submission shipped. Time to re-classify.

## What grooming should verify

1. Read the existing `.claude/handoffs/agent-noticing-layer.md` and confirm its V1.1 framing matches current intent OR is stale and needs updating.
2. Update its TRACKER § Active handoffs row from the current deferred-V1.1 phrasing to active-with-target-dates.
3. Sequence-check against the other 4 handoffs captured this session — noticing-layer is closest in spirit to `cognition-verification-harness` (both about "what does the agent observe / verify") but the noticing layer is build-the-feature, harness is verify-the-feature. They can ship in either order.

## Substance from this session's discussion

Muxin's framing: *"We mentioned things like auto sort and auto review."* The noticing layer is the **auto-sort** half — it pulls signal from chat/voice as the user uses the app, classifies intent (reminder vs journal vs project-update vs goal-shift), routes to the right table without asking. Auto-review is the scheduled-dispatch handoff. Both together = the *agent-native* feel that distinguishes Intently from a passive logger.

No new substance to add to the existing handoff — just a status flip from deferred to active.
