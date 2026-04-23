---
name: Eval Spot-Check
type: loop
invocation: auto-scheduled via launchd every 60 min during 07:30–22:30 local, gated on agents/*/SKILL.md mtime within the last 60 min
priority: P0 (MVP-10 #7)
owner: muxin
---

# Eval Spot-Check

## Purpose

Catches prompt regressions inside the session, before the nightly AI Eval Batch Steward would catch them. Specifically scoped to the AI feature being modified *right now* — not the full batch.

## Cadence

`/loop 60m <prompt below>`

**Only enable when actively editing prompts, tool definitions, or model selection.** Off otherwise. This loop is the most expensive in the MVP-7; leaving it running while you're working on UI or build config is wasted tokens.

## Loop prompt

```
Identify which AI feature is being actively modified in this session
(check git status + recent edits). Run the small eval pack for that
feature only:

- Pull the corresponding dataset from evals/datasets/<feature>/
- Pull the rubric from evals/rubrics/<feature>/
- Pull the baseline from evals/baselines/<feature>/

Score: relevance, faithfulness, safety, consistency, latency, cost.

If everything is at or above baseline, output nothing.

If any axis dropped:
- Report the drop magnitude per axis
- Identify whether the drop is in the tail (worst examples) or the median
- If a regression is severe and the cause is clear from the most recent
  prompt edit, propose a revert or refinement
- Otherwise surface the drop with example failures

Do not run the full batch (that's the nightly steward's job). Do not
update the baseline (that's a deliberate human decision after a
considered improvement).
```

## Stack-dependent behavior

Until eval datasets, rubrics, and baselines exist, this loop has nothing to run. Order of authoring (per implementation order in the operating manual): `daily-brief` first (Friday Apr 24), then `daily-review` and `weekly-review` (Saturday Apr 25).

## Edge cases

- **No active AI feature in the session.** If the session is touching non-AI code, the loop should detect that and stay silent. Don't run evals for the sake of running evals.
- **Multiple features being edited.** Run the spot-check for each, but bound total runs per tick to keep token cost predictable.
- **Baseline drift through accepted changes.** If a prompt edit intentionally improves a feature, the baseline should be updated as part of that PR — manually, not by this loop.

## Notes

- This is the most expensive loop in the MVP-7. Treat enabling it as a deliberate session-mode toggle, not an always-on background task.
- Pairs with the AI Eval Batch Steward (nightly): the loop catches same-session regressions, the steward catches the bigger picture across all features.
- Token cost discipline: if running a single feature's spot-check exceeds ~$0.50/run, scope down the dataset to a smaller "smoke test" subset and reserve the full dataset for the nightly steward.
