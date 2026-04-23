# Evals

Held-out evaluation pack for Intently's AI features. Read by the AI Eval Batch Steward (nightly + on AI commit) and the Eval Spot-Check loop (during prompt-edit sessions).

```
evals/
├── datasets/    # input cases per skill
├── rubrics/     # scoring criteria per skill
├── baselines/   # last accepted scores per skill
└── reports/     # steward output, dated
```

## Per-folder convention

### datasets/

One subfolder per skill (`daily-brief/`, `daily-review/`, `weekly-review/`, etc.). Each contains held-out cases as JSON or YAML — input fixtures plus the expected behavior or reference output.

Authoring order (per implementation order in the operating manual): `daily-brief/` first (Friday Apr 24), then `daily-review/` and `weekly-review/` (Saturday Apr 25). Other skills land post-hackathon.

### rubrics/

One subfolder per skill mirroring `datasets/`. Each contains the scoring rubric the steward applies — per-axis criteria for relevance, faithfulness, safety, consistency, latency, and cost. Rubrics are short and concrete; vague rubrics produce noisy scores.

### baselines/

One file per skill (e.g. `daily-brief.json`) holding the last accepted scores. Updated only by deliberate human decision after reviewing a steward report — not automatically by the loop or the steward.

### reports/

Steward output. Filename: `<YYYY-MM-DD>.md` for nightly batches, plus `<YYYY-MM-DD>-<commit-sha>.md` for on-commit runs. Append-only; never overwritten.

## Initial datasets

To be authored from real Muxin Life Ops content (with consent — the user is the builder). Use synthetic fixtures only when the real data has privacy weight that doesn't suit committing to a public repo.
