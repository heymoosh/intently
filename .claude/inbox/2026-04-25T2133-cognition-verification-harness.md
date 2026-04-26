---
captured: 2026-04-25T21:33:00-05:00
session: chat/0425-210554
source: discussion
handoff: .claude/handoffs/cognition-verification-harness.md
---

# Cognition verification harness — spawn-fresh-user, time-travel, assert

**Handoff already drafted at `.claude/handoffs/cognition-verification-harness.md`.** `/groom` should add a TRACKER § Active handoffs row pointing at it, register AC inside the handoff, update this `resolved:` field, then delete this file.

## One-line intent

Build the testbed Muxin specifically asked for: *"a real test with a user that can spawn a fresh anonymous user and time-travel the clock so it can fire off the reviews. Exactly, we need that so we can test that cognition layer."* `npm run verify:cognition` walks a synthetic user through 7 days of brief → review → next-day-brief, asserts cross-day cognition holds, scores each agent output against a rubric.

## Why this is in the inbox

The cognition layer (post-#136–#152) is the most valuable thing we built and the least guaranteed. `tests/` is empty, eval baselines are 0, `critical-flow-check` is parked on exactly this gap. Promoting from "TRACKER follow-up: post-first-live-run baseline floor" + "critical-flow-check re-enablement gated on real verification infra" into a unified handoff because both parked items resolve via the same testbed.

## Substance

Spawn fresh anon user → programmatic setup → time-travel clock → fire daily-brief at synthetic 09:00 → assert entry written + references goals/projects → simulate day's activity → fire daily-review → assert it references today's activity → time-travel to next morning → fire daily-brief → **assert it references yesterday's review (the cognition assertion)** → repeat for 7 days → fire weekly-review → assert references multi-day sweep.

Each agent output also AI-eval-scored against per-skill rubric in `evals/rubrics/` with non-zero baselines in `evals/baselines/`. CI integration: nightly + PR-gated on changes to `agents/`, `context-assembler.js`, `ma-proxy/`.

Time-travel mechanism: pass explicit `now` to all date-aware code paths. `should_fire(p_user_id, p_skill, p_now)` already accepts it; same posture for assembler + agent prompts.

**Recommend executing this handoff FIRST** — every other handoff (setup expansion, OAuth, scheduled dispatch) gets verified end-to-end by this harness. Without it, all those changes are hand-tested.

See handoff for full AC, test-isolation tradeoffs, rubric authorship questions.
