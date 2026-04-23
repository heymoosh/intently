# GitHub Actions Workflows

CI for Intently. Three workflows targeted; `release-gate.yml` added in the final 2 days only.

| Workflow | Status | Notes |
|---|---|---|
| `security.yml` | Wired (Apr 22) | Deterministic checks: gitleaks secrets scan + `deps-audit` (npm audit). Stack-agnostic. |
| `docs-check.yml` | Wired (Apr 22) | Deterministic doc-hygiene: enforces CLAUDE.md 100-line hard cap (soft target 75). Stack-agnostic. |
| `ci.yml` | Pending | Lint, typecheck, unit/E2E tests, build. Wired Thursday Apr 23 after stack decision. |
| `evals.yml` | Pending | Triggers AI Eval Batch Steward. Wired Friday Apr 24 once datasets exist. |
| `release-gate.yml` | Deferred to Apr 25 | Aggregates ci/security/evals + steward release-readiness summary. |

## Why some workflows are stack-dependent

`ci.yml` needs to know what to run — `npm test`, `pytest`, `cargo test`, etc. The stack is a Thursday Apr 23 decision, gated on the Michael Cohen managed-agents session. Wiring `ci.yml` before then means rewriting it; wait.

`evals.yml` triggers a Managed Agent that reads `evals/datasets/`, `evals/rubrics/`, `evals/baselines/`. Until at least one skill has an authored dataset, the workflow has nothing useful to run. Wire it once `daily-brief/` dataset exists (Friday Apr 24 per implementation order).

### Jobs inside `security.yml`

- `secrets-scan` — runs gitleaks on every push/PR/nightly. Fails on any committed secret.
- `deps-audit` — runs `npm audit --audit-level=high` in `app/` on every PR + nightly. Catches known-CVE dependencies deterministically. Threshold is `high` (not `moderate`) because 12 pre-existing moderate vulns inside Expo's internal tree cannot be resolved without a major breaking change; raise to `moderate` once those are cleared upstream.

## Why `security.yml` lands now

Secrets scanning (gitleaks/trufflehog) and dependency vulnerability scanning are stack-agnostic. They protect against the highest-priority risk in the threat model (secret leak via committed code) and there's no reason to wait.

## Why `docs-check.yml` lands now

Same reasoning as `security.yml`: stack-agnostic, deterministic, cheap. Enforces the CLAUDE.md size cap (see the top-of-file "House rule" note in `CLAUDE.md`) so the anchor doc doesn't drift into a restated-everything compendium. Paired with `.githooks/pre-commit` for local enforcement; CI catches hook bypasses.
