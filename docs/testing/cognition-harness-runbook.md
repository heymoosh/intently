# Cognition Harness — Runbook (V1.0)

## What each piece does

| File | Purpose |
|------|---------|
| `evals/runner/spawn-anon-user.ts` | Creates a fresh Supabase anon user via service-role admin API, seeds DB from a JSON fixture, returns a `cleanup()` function that deletes the user + all cascade data |
| `evals/runner/judge.ts` | Haiku-backed soft assertion: takes `{ output, rubric }`, returns `{ pass: boolean, rationale: string }` |
| `evals/runner/run-case.ts` | Orchestrator: loads an eval case, spawns a user, calls ma-proxy, scores each rubric via judge, prints pass/fail, cleans up |
| `evals/datasets/cognition/daily-brief.json` | Eval cases for the daily-brief skill (V1.0: one case — empty-user graceful state) |
| `evals/datasets/cognition-fixtures/empty-user.json` | Fixture: completely fresh user — no goals, no projects, no entries |

## Running a single eval locally

From repo root (not `app/`):

```bash
cd app
ANTHROPIC_API_KEY=<key> \
SUPABASE_URL=<project-url> \
SUPABASE_SERVICE_ROLE_KEY=<service-role-key> \
  npx tsx ../evals/runner/run-case.ts \
    --skill daily-brief \
    --case "fresh user with no goals — graceful empty state"
```

Exits 0 on all rubrics passing, 1 on any failure.

## Interpreting pass/fail

Each rubric is a plain-English requirement. The Haiku judge reads the full agent output against it and returns:
- `PASS` + rationale — agent satisfied the rubric
- `FAIL` + rationale — agent violated or missed the rubric

A run is considered green when all rubrics pass. Individual rubric failures indicate specific cognition gaps (e.g. name hallucination, missing JSON tail, fabricated history).

## Required env vars

| Var | Where to find it |
|-----|-----------------|
| `ANTHROPIC_API_KEY` | Bitwarden Secrets / `.env.local` |
| `SUPABASE_URL` | Supabase dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase dashboard → Settings → API (service_role key) |

## What is deferred to V1.1

- **Time-travel** — synthetic `now` parameter threaded into `tick_skills()` / `dispatch-skill` for multi-day journey simulation
- **CI workflow** — `.github/workflows/cognition-verify.yml` on PRs touching `agents/`, assembler, or Edge Functions
- **Multi-skill coverage** — daily-review, weekly-review, monthly-review eval cases
- **Snapshot diffing** — detect regressions vs. a blessed prior output
- **Cost gating** — per-run token budget; fail if judge calls exceed threshold
- **Full context assembly in harness** — V1.0 uses a minimal stub context; V1.1 wires through `assembleBriefInput()` server-side for end-to-end context fidelity
- **Non-empty fixture cases** — seeded user with goals/projects, mid-week state, prior review entries

## Architecture note

V1.0 calls `ma-proxy` directly with a stub minimal context block (not the full assembler output). This isolates the **agent behavior** test (does the agent handle empty state gracefully?) from the assembler integration. V1.1 will thread the real assembler for full stack tests.
