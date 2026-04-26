# Intently Tracker

**Purpose:** First doc a new session reads to resume. Hot state only — what's in flight, what's blocked, what just moved. For durable strategy + milestones, read `launch-plan.md` at repo root. For per-project depth, read the relevant `.claude/handoffs/<slug>.md`. Cap 100 lines.

**Doc hierarchy:** `launch-plan.md` (strategy, slow) → `TRACKER.md` (queue, hot) → `.claude/inbox/` (un-groomed captures) → `.claude/handoffs/<slug>.md` (project depth, persistent) → `docs/product/acceptance-criteria/` (done-definition, per skill).

## Current state — pointers per topic

| Topic | Current truth | Notes |
|---|---|---|
| **UX / interaction model** | `docs/design/Intently - App/HANDOFF.md` + the prototype JSX in that folder | Replaces vision.md + app-experience.md framing for current product behavior. |
| **Agent behavior (per skill)** | `agents/<skill>/SKILL.md` + `agents/<skill>/ma-agent-config.json` | Each agent's prompt is its own truth. Don't re-derive from old spec docs. |
| **Stack** | ADR 0004 (web-only pivot, supersedes 0003) | Plain React 18 + Babel-standalone + Supabase + Managed Agents. `app/` (Expo + RN-Web) kept as historical reference. |
| **Secrets store** | ADR 0005 (Supabase env). BWS deferred until multi-user / scale. | "No secrets in git" universal (CLAUDE.md). |
| **Active decisions** | `docs/decisions/` — newest active ADR per topic | Superseded ADRs get a `> SUPERSEDED by ADR-NNNN` header. |
| **Routine + loop pack** | `docs/Claude Code Repo-Ready Blueprint.md` | Drift-check loop spec: `.claude/loops/decision-drift-check.md`. |
| **Session handoff process** | `docs/process/session-handoff.md` + `.claude/handoffs/<slug>.md` per project | Slash command: `/handoff`. |
| **Editing + branching workflow** | `CONTRIBUTING.md` § Editing workflow | When to commit on `main` vs. spin up a worktree, never-`git-checkout`-in-primary rule. |
| **Parallel-session coordination** | `.claude/commands/start-work.md` § step 7 — per-worktree `.claude/wt-intent.md` (gitignored) | Sibling sessions declare a one-sentence intent + `ref:` pointing at a TRACKER row. |

**Original-intent docs (archived, bannered in-file, not current truth):** `docs/product/vision.md`, `docs/product/requirements/life-ops-plugin-spec.md`, `docs/design/app-experience.md`, `docs/architecture/agent-memory.md`, `docs/architecture/data-model.md`.

## Status

**Phase:** Post-cognition. The deployed app satisfies the original UX vision end-to-end.
**Status:** 🟢 `intently-eta.vercel.app` live with voice→chat, brief/review wired to live agent reading goals/projects/journal/calendar/email/reminders/yesterday's-review, weekly+monthly review UI, setup flow for new users, AddZones persisting, read-on-mount hydration, input traces, Undo on writes. Cross-day continuity verified.
**Last:** 13 PRs (#136–#152) closed the real-app shell + the 11-item cognition backlog from `.claude/handoffs/real-app-cognition.md` (10 shipped, #24 declined with documented math).
**Next:** Post-launch backlog (no urgent work in flight). See § Post-launch backlog below.
**Last updated:** 2026-04-26 (post-cognition session close).

## Active handoffs

Project briefs at `.claude/handoffs/<slug>.md` — persist across sessions; never auto-deleted.

- **`real-app-cognition`** — 11-item cognition backlog. **10/11 shipped** (#145, #147, #148, #150, #151), **#24 declined** (#152) with math: total request prefix ~3.4K tokens, below Opus 4.7's 4K cache minimum. Doc preserved with re-revisit triggers.
- **`entries-architecture`** — parked. Reconcile new design folder against current code. Worktree at `~/worktrees/intently/entries-architecture` is parked. **Deferred post-launch.** See § Critical items below.
- **`overnight-build-loops`** — active. Robustness rewrite for the overnight build loop (no iter cap, safe-task gate, hourly inline `/babysit-prs`, terminal-only summary, launchd-not-caffeinate).
- **`critical-flow-check`** — active (routine disabled on launchd). Re-enablement gated on real verification infra (E2E + AI eval rubric) and a rewritten report-only brief.
- **`agent-noticing-layer`** → `.claude/handoffs/agent-noticing-layer.md` — promoted from product-gaps thesis. V1.1 post-hackathon, not active yet.
- **`capture-groom-execute`** — Phase 1 shipped in #149 (inbox + capture skill). Phase 2 pending: `/groom`, `/work-next`, session-precheck integration, drift-check extension. Items queued in `.claude/inbox/`.
- **`steward-redesign`**, **`ma-agents-complete`**, **`decision-drift-check`** — all shipped earlier; docs preserved for pattern review.

## Critical items (post-launch reconciliation)

These were deferred during the cognition push and remain valid:

1. **Design folder reconciliation.** The 2026-04-24 design-folder replacement (`docs/design/Intently - App/`) was never formally reconciled against the entries-architecture session prompt. The cognition-layer work bypassed this via "ship the prototype directly" (ADR 0004). Reconcile now that the dust has settled.
2. **Reminders intent reconciliation.** Muxin's intent: reminders as "track this and surface in daily briefing," not narrow date-anchored. Current shipped flow is still date-anchored (classify rejects undated input). Confirm whether the new design folder's model differs and update.
3. **Worktree at `~/worktrees/intently/entries-architecture`** — decide: continue, destroy + recreate, or skip after reconciliation.

## Post-launch backlog (engineering)

| Item | Effort | Notes |
|---|---|---|
| Real OAuth (Google calendar / email / Slack) | ~multi-day | `calendar_events` + `email_flags` tables already exist (0006). OAuth wiring writes into the same shape the assembler reads. |
| Multi-user auth (replace anonymous sign-in) | ~multi-day | ADR 0002 pins V1 single-user. RLS policies are correct as-is for owner-only. |
| Toggle persistence for `done` flags | ~half-day | Now technically possible since real DB UUIDs are in state post-#143. Wire `toggleAdminReminder` / `toggleProjectTodo` to existing entities helpers. |
| Visual polish | ~variable | PainterlyBlock variants, Collage backdrops, gradient CTAs — all retrofittable per design folder. |
| Phase out `app/` (Expo + RN-Web) | ~half-day | Kept as historical reference per ADR 0004; remove when confident no one's pulling from it. |

## Follow-ups (manual or flight-test)

- **(Optional)** Re-provision live `weekly-review` agent so its system prompt includes the Output contract durably (currently the assembler inlines it per call): `cd app && bws run -- npx tsx ../scripts/provision-ma-agents.ts --skill weekly-review --update-existing`.
- **Apply pg_cron migration** (`supabase/migrations/0002_schedules.sql`). Needs `supabase db push` — user-only.
- **Stewards leave working-tree mods uncommitted.** Release-readiness + spec-conformance stewards edit tracked files overnight without committing. Design fix: auto-commit to `auto/steward/*` branches + draft PR.
- **Post-first-live-run baseline floor.** Run daily-brief against `evals/datasets/daily-brief/cases.json` once, raise per-axis `minScores` in `evals/baselines/daily-brief.json` from 0 to observed floor.
- **Wire `decision-drift-check` to launchd.** Spec at `.claude/loops/decision-drift-check.md`. Add `com.intently.decision-drift.plist` matching the existing pack, daily evening.
- **Drop `docs/product-gaps-2026-04-25.md` content into `.claude/inbox/`** once the capture/groom/execute system lands on the active branch (parallel session shipped it 2026-04-25).
- **Stale `session-handoff.md` reference sweep.** Doc-only, no runtime effect. Stale pointers in `docs/Claude Code Repo-Ready Blueprint.md` (4 spots), `docs/design/claude-code-implementation.md`, `docs/process/acceptance-criteria.md`, `docs/process/session-prompt-seed-data-v1.md`.
- **Post-merge hook refusing commits on `main`** — prevent recurrence of the accidental direct-to-main commit pattern.
- **Fix `--clean` squash-merge false-positive** in `scripts/intently-track.sh`. Replace `git cherry` with `git diff --quiet main HEAD`.

## Lost files (user-only decision)

- **Demo video work** force-removed 2026-04-25 from `.claude/worktrees/video-demo/`. Hours of script + assets + visuals; never in git history; Time Machine not enabled. Decide: low-level disk recovery (Disk Drill / PhotoRec — needs stopping disk writes) or accept loss + reconstruct.

## MA API schema — empirical corrections

- `POST /v1/sessions` body uses `agent` (no `_id` suffix) and `environment_id` (WITH `_id`). Inconsistent but empirical.
- `environment_id` is **required**, not optional.
- `POST /v1/sessions/{id}/events` body: `{events: [{type, content: [{type:'text', text}]}]}`. Events wrap in array.
- Stream path is `/v1/sessions/{id}/events/stream`.
- `agents.update` requires `version` field from list response (optimistic concurrency lock). Fixed in #142.

## Locked decisions

- Stack (ADR 0004, supersedes 0003): Plain React 18 + Babel-standalone + Supabase + Managed Agents · Bitwarden Secrets Manager. Web-only.
- Managed Agents = runtime, not state (ADR 0001). State of truth = Supabase rows (post-cognition; was Markdown).
- V1 single-user (anonymous Supabase auth); per-user isolation deferred.
- CLAUDE.md: "Autonomy default — act, don't ask" (PR #71).
- Screen-semantic mapping: Present = today's brief + plan. Past = completed reviews. Future = goals + monthly slice.
- Cognition input cap ~3.4K tokens at our scale; below Opus 4.7's 4K cache minimum (decision recorded in real-app-cognition handoff).

## How to resume

Read in order: `launch-plan.md`, this file, `CLAUDE.md`. If Critical items has entries, walk through with user first. Update Status + prepend dated Log entry at end of any non-trivial session.

## Log

- **2026-04-26 — cognition layer + real-app shell.** 13 PRs (#136–#152). Closed the 11-item cognition backlog from `.claude/handoffs/real-app-cognition.md` plus the 9-item real-app shell backlog. Live deployed prototype now satisfies the original UX vision end-to-end (voice/brief/review/weekly/monthly/setup/persistence/hydration/traces/undo, all with cross-day cognition).
- **2026-04-25 evening — web/ live-wiring sprint.** 5 PRs (#111–#115) wired voice + brief/review against the inherited prototype.
- **2026-04-25 — MA agents complete + editing-workflow revision.** All 6 agents provisioned. Anthropic key consolidated/rotated twice.
- **2026-04-24 — web pivot + live MA end-to-end.** 12 PRs. Expo Web → Vercel deploy → first live Opus 4.7 brief.
- **2026-04-23 — parallel-tracks workflow + infra.** ~27 PRs. Agent-runner base, evals, design tokens, seed data.
- **2026-04-22 — Supabase schema + Expo scaffold + ADRs 0001/0002/0003.**
