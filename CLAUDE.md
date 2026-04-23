# CLAUDE.md — Intently

Stable context for every Claude session in this repo. If guidance drifts from reality, fix this file first. Verification structure (routines/loops/what-checks-what) lives in `docs/Claude Code Repo-Ready Blueprint.md`.

**House rule:** pointers > content. CLAUDE.md is capped at 100 lines (soft target 75). Enforced by `.githooks/pre-commit` and `.github/workflows/docs-check.yml`. If a rule belongs in another doc, link it — don't restate it.

## Product intent

Intently is a mobile app that turns recurring life operations (daily triage, morning briefing, weekly review, meal planning, monthly review) into an agent-native experience. Scheduled managed agents do the work; the mobile UI reflects state, triggers runs, and renders output.

Primary journeys (also the demo flows and Spec Conformance Steward targets): **daily brief**, **daily review**, **weekly review**. Full behavior lives in `docs/product/requirements/life-ops-plugin-spec.md`; MVP cut in `.claude/session-handoff.md`.

## Architecture source of truth

- **Vision:** `docs/product/vision.md`.
- **Product spec:** `docs/product/requirements/life-ops-plugin-spec.md`.
- **UX:** `docs/design/app-experience.md`.
- **Agent memory (V1):** `docs/architecture/agent-memory.md`.
- **Data model:** `docs/architecture/data-model.md`.
- **Agent skills:** `agents/` (per-skill folders; `agents/_shared/life-ops-conventions.md` is prepended to every skill prompt).
- **Document taxonomy:** `docs/architecture/document-taxonomy.md`.
- **Decisions (ADRs):** `docs/decisions/` — start with `0001-managed-agents-as-runtime.md`.
- **Backlog (deferred, not loaded by V1 agents):** `docs/backlog/`.

Execution rule: scheduled or cross-step stateful → Managed Agent. One-shot transformation → plain API call. See ADR 0001.

## Required commands

**TBD** until the Session 2 stack decision (Thursday Apr 23). Once the stack lands, the canonical commands live in `package.json` scripts (or stack equivalent): `install`, `lint`, `typecheck`, `test:unit`, `test:e2e`, `build`, `eval`. `ci.yml` and the Build Watchdog loop are gated on this being filled.

## Non-functional requirements

- **Security:** scope in `docs/security/asvs-scope.md`; threat model in `docs/security/threat-model.md`; builder rules in `docs/security/privacy-policy-for-builders.md`. **Hard rule: Bitwarden Secrets Manager is the only allowed secrets store. No `.env` commits, no hardcoded literals, no exceptions.**
- **Privacy:** Privacy Steward on every push + pre-release. **V1 is single-user (Muxin dogfoods); per-user isolation checks deferred until multi-user lands.**
- **Performance / accessibility:** treated as UX signal during the sprint, not release gates.
- **Observability:** TBD — defined in Session 4.

## Release gates

Full checklist and enforcement: `docs/process/release-gates.md`. `release-gate.yml` enforces in CI (deferred to Apr 25); Release-Readiness Steward produces the plain-English summary.

## Acceptance criteria authoring rule

Full process: `docs/process/acceptance-criteria.md`. Short form:

- Criteria derive from `docs/product/requirements/life-ops-plugin-spec.md` at authoring time, in their own PR, **before** implementation for the same skill.
- During build, only `Status` and `Last checked` may change. If implementation can't satisfy a criterion, mark it `fail`/`partial` — **do not rewrite the criterion to match what was built.**
- Enforcement: `.githooks/pre-commit` (Layer A), Thursday CI gate (Layer C), Spec Conformance Steward task 7 (Layer B).

## Branch and PR standards

See `CONTRIBUTING.md`. PR-Readiness loop verifies diff readiness on demand.

## Test scope ceiling (hackathon)

- **Unit:** agent memory schema + deterministic business logic.
- **E2E:** the three demo flows (daily brief, daily review, weekly review).
- **Integration:** skip for MVP.

Cap exists so the Test Gap Steward doesn't grow coverage into time we don't have.

## What Claude updates as implementation evolves

- `docs/architecture/` — architecture notes and caveats.
- `docs/decisions/` — ADRs for non-obvious calls.
- `CHANGELOG.md` (to be created) — fragments on meaningful changes.
- `evals/reports/` — eval run outputs; migration + rollback notes beside any schema change.
- `.claude/session-handoff.md` — rolling handoff (convention: `docs/process/session-handoff.md`).

CLAUDE.md is updated when guidance drifts from reality. Any routine/loop that spots drift proposes the fix.

## Routine and loop pack (MVP-7)

Structural authority: `docs/Claude Code Repo-Ready Blueprint.md`. Everything outside the MVP-7 is in the manual's "Add if pain" appendix and stays off until a specific pain materializes.

- `.claude/routines/ai-eval-batch-steward.md` — nightly + on AI commit.
- `.claude/routines/spec-conformance-steward.md` — nightly + pre-demo.
- `.claude/routines/privacy-steward.md` — every push + pre-release.
- `.claude/routines/agent-memory-steward.md` — every 2 days + pre-release.
- `.claude/loops/build-watchdog.md` — `/loop 30m`.
- `.claude/loops/critical-flow-check.md` — `/loop 30m`.
- `.claude/loops/eval-spot-check.md` — `/loop 60m`, only when editing AI behavior.

Plus the deterministic gitleaks push gate in `.github/workflows/security.yml`.

**Cost discipline:** a loop producing nothing actionable 3 sessions running gets demoted or killed; a routine whose report goes unread for a week gets paused.

## Session handoff

Convention: `docs/process/session-handoff.md`. The rolling file is `.claude/session-handoff.md` and is the first thing the next session reads.
