# Release gates

Authoritative checklist for what "done" means before a feature ships. Referenced from `CLAUDE.md`. Enforced by `release-gate.yml` (deferred to Apr 25) and summarized in plain English by the Release-Readiness Steward.

## Gate checklist

A feature is not done until all of the following are true:

- Build passes.
- Lint and typecheck pass.
- Required unit, integration, and E2E tests pass (see test scope ceiling in `CLAUDE.md`).
- Acceptance criteria are marked `pass` or deliberately deferred (process: `docs/process/acceptance-criteria.md`).
- OWASP scope has no open release blockers (`docs/security/asvs-scope.md`).
- Privacy review has no open release blockers (Privacy Steward report clean).
- AI eval thresholds pass for any changed AI feature (`evals/reports/`).
- Changelog, migration notes, and rollback notes exist when relevant.

## Enforcement

- **CI:** `release-gate.yml` aggregates the signals from `ci.yml`, `security.yml`, and `evals.yml` and fails the gate if any blocker is open. Status: deferred to Apr 25.
- **Steward:** Release-Readiness Steward reads the CI output plus steward reports and produces the go/no-go summary with rationale.
- **Local:** developers can run each underlying check (`lint`, `typecheck`, `test`, `build`, `evals`) from the commands listed in `package.json` scripts once the stack lands.

## Changing this list

Any change to the gate checklist is a release-process change, not a build-session change. It should land in its own PR with rationale in the PR description. If the change is large enough to be non-obvious, add an ADR under `docs/decisions/`.
