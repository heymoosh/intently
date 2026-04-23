---
name: AI Eval Batch Steward
type: routine
execution: Claude Managed Agent
trigger: Nightly (cron) + on commit touching prompts/tools/model config
priority: P0 (MVP-10 #1)
owner: muxin
---

# AI Eval Batch Steward

## Purpose

Every Intently skill (`daily-brief`, `daily-review`, `weekly-review`, `monthly-review`, `update-tracker`) is a managed agent doing judgment work. Eval drift between prompt edits is the single biggest demo risk. This routine is the safety net that catches it.

## Inputs

- `evals/datasets/` — held-out cases per skill (input + expected behavior)
- `evals/rubrics/` — scoring rubrics per skill (per-axis criteria)
- `evals/baselines/` — last accepted scores per skill
- Current prompts, tool config, and model selection (read from the live skill definitions)

## Output

- `evals/reports/<YYYY-MM-DD>.md` — full report
- GitHub issue if regression found and cause unclear
- Draft PR if regression found and cause is high-confidence

## System prompt

```
You are running the Intently AI eval batch.

Tasks:
1. Run the full eval batch across daily-brief, daily-review, weekly-review,
   monthly-review, and update-tracker.
2. For each skill, score: relevance, faithfulness, safety, consistency,
   latency, cost-per-successful-result.
3. Compare scores to the stored baseline in evals/baselines/.
4. Flag meaningful regressions (>10% drop on any axis) and meaningful wins.
5. Group failures by failure mode, not by example. A failure mode is "agent
   hallucinated a calendar event" — not "test case 17 failed."
6. Recommend per skill: keep current setup, roll back to prior baseline, or
   iterate further. Be explicit about which.
7. If a regression is severe and the cause is clear, draft a PR with the fix.
   Otherwise open an issue with the failure cluster and suggested next step.

Demo flow weighting: daily-brief, daily-review, and weekly-review are the
three submission-critical flows. Weight regressions there as demo blockers.
monthly-review and update-tracker are checked but not demo-critical.

Output format:
- Skill scorecard (per skill, per axis, vs baseline)
- Failure clusters
- Recommendation per skill
- Demo blocker assessment (must list any blockers explicitly)
```

## Edge cases

- **Empty baseline.** First run after a new skill ships: no baseline to compare against. Establish a baseline from this run and note that future runs are now comparing against it.
- **Empty dataset.** If a skill has no eval dataset yet, skip it and note the gap in the report. Do not fail the batch.
- **Cost spike with no quality change.** Latency or cost regressions without quality change still get flagged but not as demo blockers. Worth a follow-up issue.

## Notes

- Token cost: this is the heaviest routine in the pack. Keep it nightly, not more frequent. The Eval Spot-Check loop covers same-session checks during prompt edits.
- The first dataset to author is `evals/datasets/daily-brief/` since that's the demo opener.
