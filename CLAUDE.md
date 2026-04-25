# CLAUDE.md — Intently

Stable context for every Claude session in this repo. If guidance drifts from reality, fix this file first. Verification structure (routines/loops/what-checks-what) lives in `docs/Claude Code Repo-Ready Blueprint.md`.

**House rule:** pointers > content. CLAUDE.md is capped at 100 lines (soft target 75). Enforced by `.githooks/pre-commit` and `.github/workflows/docs-check.yml`. If a rule belongs in another doc, link it — don't restate it.

**Response style:** concise, to the point, layman's terms. When explaining technical details, lead with a 1-line primer of the concept — Muxin is learning.

**Autonomy default: act, don't ask.** Execute by default. Pause and confirm ONLY when (a) the user would need to paste a secret / API key / ID into chat, (b) the action is destructive and hard to reverse (rm -rf, disk wipe, force-push main, db drop, delete prod resources), or (c) the move is obviously dumb / severe and a reasonable engineer would pause. Otherwise: run the command, merge the PR, deploy, commit, iterate on errors empirically. Don't stall with "should I…?" unless (a)–(c) applies. Shared-infra writes the user has already authorized mid-session (e.g. supabase deploy after they said "run the commands") count as pre-authorized — keep moving.

**Manual work → TRACKER.md.** Whenever a task has a step Claude can't do automatically (user-only credentials, console actions Claude can't reach, decisions only the user can make), add a bullet to `TRACKER.md` § Follow-ups in the same turn. Otherwise the user won't know it exists.

**Spec intent > spec letter.** When a doc is pointed at as authoritative ("per spec," "per the handoff," "TRACKER says to…," "the design doc"), read the doc AND ask for Muxin's intent in his own words — then state back one sentence of what you'll build. If his description disagrees with the doc, his current intent wins; docs capture past decisions, intent is current. Applies to new product behavior; skip for bug fixes / refactors / explicit inline instructions. Reason: reading docs cold produces literal implementations that miss the beat the user wanted to land (see the `reminders` narrow-vs-capture misread from 2026-04-24).

## Product intent

Intently is a **web app** (mobile-first responsive — renders well on phone screens AND desktop) that turns recurring life operations (daily triage, morning briefing, weekly review, meal planning, monthly review) into an agent-native experience. Scheduled managed agents do the work; the UI reflects state, triggers runs, and renders output. Distribution = a shareable URL (`intently-eta.vercel.app`); iOS/Android deployment deferred indefinitely (per ADR 0004).

Primary journeys (also the demo flows and Spec Conformance Steward targets): **daily brief**, **daily review**, **weekly review**. Full behavior lives in `docs/product/requirements/life-ops-plugin-spec.md`; MVP cut in `TRACKER.md` § Locked decisions.

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

**Hard rule: Bitwarden Secrets Manager only** — no `.env` commits, no hardcoded literals, no exceptions. V1 is single-user (Muxin dogfoods); per-user isolation deferred. Perf / a11y / observability are UX signals during sprint, not release gates. Details: `docs/security/`.

## Release gates

Full checklist and enforcement: `docs/process/release-gates.md`. `release-gate.yml` enforces in CI (deferred to Apr 25); Release-Readiness Steward produces the plain-English summary.

## Acceptance criteria

Criteria are **immutable during build** — only `Status` and `Last checked` may change; if code can't satisfy a criterion, mark it `fail`/`partial`, never rewrite. Derive criteria from the spec in a separate PR before implementation. Full process + enforcement: `docs/process/acceptance-criteria.md`.

## Branch and PR standards

See `CONTRIBUTING.md`. PR-Readiness loop verifies diff readiness on demand.

**Chat-driven edits — branch first.** Any conversation ask that touches a tracked file requires creating a `chat/<slug>` branch BEFORE writing. Never accumulate uncommitted changes on `main` — they won't propagate to `intently-track` worktrees and drift compounds. Pre-commit hook enforces at git level; this rule exists so Claude routes correctly first time.

## Test scope ceiling (hackathon)

Unit (agent memory + deterministic logic) + E2E (three demo flows). **Skip integration tests for MVP.** Cap exists so coverage doesn't grow into time we don't have.

## Doc upkeep

Implementation changes → `docs/architecture/`, `docs/decisions/` (ADRs for non-obvious calls), `evals/reports/`, `.claude/handoffs/<slug>.md` for the active project. CLAUDE.md updates only when guidance drifts from reality — any routine that spots drift proposes the fix.

## Routine and loop pack

7 routines + 4 loops auto-run via launchd. Full list, schedules, models, and the `docs/Claude Code Repo-Ready Blueprint.md` structural authority live in that blueprint — read it when reasoning about a specific routine. **Invariant:** auto-fix routines push only to `auto/*` branches and open draft PRs — never commit to `main`.

## Session handoff

`TRACKER.md` is the canonical first-read on resume — hot queue, critical items, what's in flight. **At session start, if `TRACKER.md` has items under "Critical items awaiting review," walk through those with Muxin before substantive work.**

**Project depth lives in `.claude/handoffs/<slug>.md`** — one file per project (not per session), persistent across sessions, never auto-deleted. Triad: `launch-plan.md` (slow strategy) → `TRACKER.md` (hot queue) → `.claude/handoffs/<slug>.md` (project depth). Convention: `docs/process/session-handoff.md`. Slash command: `/handoff`.

**Propose `/handoff` at kickoff** — when conversation has produced (a) a stated goal, (b) at least one non-trivial decision with rationale, AND (c) work that's plausibly multi-session or multi-file. Skip for quick fixes, single-PR work, exploratory chats. **Update inline** as decisions land mid-session; **re-distill** via `/handoff` at session-end (the "clean happy-path" pass that strips exploratory noise). **Continue, don't duplicate** — if a slug already exists in `.claude/handoffs/`, update it.

**Drift check.** A `SessionStart` hook runs `scripts/session-precheck.sh` and may inject a `[session-precheck]` report into context. If present, surface it and offer to walk the fix playbook (`/precheck`) before substantive work.
