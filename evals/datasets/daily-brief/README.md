# Daily Brief — eval dataset

Held-out fixtures that exercise the [`daily-brief`](../../../agents/daily-brief/SKILL.md) skill against realistic inputs. Authored by hand; not generated.

## Layout

```
daily-brief/
├── README.md               ← this file
├── scenario-01.md          ← first fixture: a synthetic user's state on a mid-sprint weekday
└── expected-output.md      ← the style and content the brief should produce for scenario-01
```

Later fixtures follow the same shape (`scenario-02.md` + `expected-output-02.md`, etc.). This first case is authored to exercise the **cascade** (Goals → Monthly → Weekly → Daily Log), **sprint/rest pacing**, and **where you left off yesterday** — the three mechanics most likely to regress as the skill evolves.

## Conventions

- **User name:** the scenarios use a synthetic persona ("Sam") — never Muxin's real content, never real names.
- **Dates:** scenarios pin a specific weekday and month so pacing logic is unambiguous. `scenario-01.md` is a **Thursday, mid-sprint week**.
- **Content shape:** each scenario file lists the files the agent should treat as already-read, in cascade order. This mirrors what the production skill sees at runtime.
- **Calendar / email:** represented as inline blocks under explicit headings so it's obvious what's feed data vs. note data. Scenarios can mark integrations as `not_connected` to exercise the graceful-fallback path.
- **Expected output is reference, not ground truth.** It documents the acceptable shape (structure, ordering, tone) — the rubric (iter 5) is what actually scores a run.

## Not yet wired

The eval runner (`evals/runner/`) currently loads datasets from `cases.json`. This dataset ships as markdown only; a follow-up iteration compiles the markdown into a runner-loadable `cases.json` once the rubric (iter 5) lands and the execute/score pair is sketched.

Morning task for whoever merges this: if you want this dataset runnable end-to-end, add a `cases.json` with one case whose `input` is a reference to `scenario-01.md` and whose `expected` references `expected-output.md`.
