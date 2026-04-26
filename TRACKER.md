# Intently Tracker

**Purpose:** First doc a new session reads to resume. Hot state only — what's in flight, what's blocked, what just moved. For durable strategy + milestones, read `launch-plan.md` at repo root. For per-project depth, read the relevant `.claude/handoffs/<slug>.md`. Cap 100 lines.

**Doc hierarchy:** `launch-plan.md` (strategy, slow) → `TRACKER.md` (queue, hot) → `.claude/inbox/` (un-groomed captures) → `.claude/handoffs/<slug>.md` (project depth, persistent) → `docs/product/acceptance-criteria/` (done-definition, per skill).

## Current state — pointers per topic

| Topic | Current truth | Notes |
|---|---|---|
| **UX / interaction model** | `docs/design/Intently - App/HANDOFF.md` + the prototype JSX in that folder | Replaces vision.md + app-experience.md framing. |
| **Agent behavior (per skill)** | `agents/<skill>/SKILL.md` + `agents/<skill>/ma-agent-config.json` | Each agent's prompt is its own truth. |
| **Stack** | ADR 0004 (web-only pivot, supersedes 0003) | Plain React 18 + Babel-standalone + Supabase + Managed Agents. `app/` (Expo + RN-Web) kept as historical reference. |
| **Secrets store** | ADR 0005 (Supabase env). BWS deferred until multi-user / scale. | "No secrets in git" universal (CLAUDE.md). |
| **Active decisions** | `docs/decisions/` — newest active ADR per topic | Superseded ADRs get a `> SUPERSEDED by ADR-NNNN` header. |
| **Routine + loop pack** | `docs/Claude Code Repo-Ready Blueprint.md` | Drift-check loop spec: `.claude/loops/decision-drift-check.md`. |
| **Session handoff process** | `docs/process/session-handoff.md` + `.claude/handoffs/<slug>.md` per project | Slash command: `/handoff`. |
| **Editing + branching workflow** | `CONTRIBUTING.md` § Editing workflow | Never-`git-checkout`-in-primary rule, worktree-when-sibling. |
| **Parallel-session coordination** | `.claude/commands/start-work.md` § step 7 — per-worktree `.claude/wt-intent.md` (gitignored) | Sibling sessions declare a one-sentence intent + `ref:` pointing at a TRACKER row. |

**Original-intent docs (archived, bannered in-file, not current truth):** `docs/product/vision.md`, `docs/product/requirements/life-ops-plugin-spec.md`, `docs/design/app-experience.md`, `docs/architecture/agent-memory.md`, `docs/architecture/data-model.md`.

## Status

**Phase:** Post-hackathon + post-functional-quality-pass — re-targeted at the **real working app** bar (per `launch-plan.md` rewrite). Hackathon "1 flow done well" framing is historical; current bar = every interactive element wired or explicitly deferred, every visible state has model + binding + reuse story, anon-first onboarding for real users with `linkIdentity()` upgrade, Sam embedded as the landing-page demo.
**Status:** 🟢 live. PR #157 just shipped a 20-story Playwright-walk functional-quality pass (11 bugs caught + fixed — see Log 2026-04-25). PR #158 (chat-reminder JWT passthrough + UTC fix) and PR #159 (build-watchdog ESLint teeth) opened as the post-groom execution wave.
**Last:** Capture + groom session 2026-04-25 evening — 6 new handoffs + 13 inbox items groomed; launch-plan rewritten; new-user-ux-and-auth handoff folded in identity-component + reading-mode amendments. PR #157 merged on main during the session.
**Next:** § Next queue below — top is Bug 3 (chat reminders → wrong user_id, silent data loss), which PR #158 fixes pending Edge Function deploy.
**Last updated:** 2026-04-25 (post-capture groom, post PR #157 merge).

## Active handoffs

Project briefs at `.claude/handoffs/<slug>.md` — persist across sessions; never auto-deleted.

- **`wiring-audit`** → `.claude/handoffs/wiring-audit.md` — exhaustive interaction inventory; first to execute (output sequences other handoffs). AC inside handoff.
- **`cognition-verification-harness`** → `.claude/handoffs/cognition-verification-harness.md` — spawn-fresh-anon-user + time-travel + assert; harness for cognition + AI eval rubric + CI. AC inside handoff.
- **`new-user-ux-and-auth`** → `.claude/handoffs/new-user-ux-and-auth.md` — anon-first + `linkIdentity()` upgrade + setup expansion (re-scope from 3-goals-only) + shared `<Avatar>` + reading-mode wiring fixes. AC inside handoff.
- **`sam-demo-on-landing-page`** → `.claude/handoffs/sam-demo-on-landing-page.md` — landing page with Sam's prototype embedded inline (option A: component embed, locked 2026-04-25). Sam-data-completeness depends on wiring-audit output. AC inside handoff.
- **`oauth-calendar-email`** → `.claude/handoffs/oauth-calendar-email.md` — real Google OAuth replacing the `setTimeout` mock; pulls into existing `calendar_events` + `email_flags` tables. AC inside handoff.
- **`scheduled-agent-dispatch`** → `.claude/handoffs/scheduled-agent-dispatch.md` — apply `0002_schedules.sql` + extend `tick_skills()` to actually invoke agents (currently V1-scaffold-only). Web push deferred. AC inside handoff.
- **`agent-noticing-layer`** → `.claude/handoffs/agent-noticing-layer.md` — **promoted from V1.1-deferred to active** 2026-04-25 per Muxin. Pulls signal from chat/voice; auto-routes (auto-sort half).
- **`real-app-cognition`** — 10/11 shipped (#145, #147, #148, #150, #151) + #24 declined (#152). Doc preserved with re-revisit triggers.
- **`entries-architecture`** — parked. Reconcile against new design folder; deferred post-launch. See § Critical items.
- **`overnight-build-loops`** — active. Robustness rewrite for the overnight loop (no iter cap, safe-task gate, hourly inline `/babysit-prs`).
- **`critical-flow-check`** — active (routine disabled). Re-enablement gated on `cognition-verification-harness` shipping.
- **`capture-groom-execute`** — three-mode workflow. Phase 1+2 shipped (#149, #154). Status: shipped.
- **`steward-redesign`**, **`ma-agents-complete`**, **`decision-drift-check`** — all shipped earlier; docs preserved for pattern review.

## Next (in priority order)

Top of queue — `/work-next` picks from the top. Items 1+2 are paired (run as parallel sub-agents — independent codebases, no merge collisions). All AC files live at `docs/product/acceptance-criteria/<topic>.md`.

1. **[PARALLEL] Chat reminder bugs — Bug 3 (wrong user_id, silent data loss) + Bug 2 (UTC date math).** JWT passthrough + client-supplied `today` parameter to `supabase/functions/reminders/index.ts`. Bundled in one PR (same Edge Function). AC: `docs/product/acceptance-criteria/chat-reminders-jwt-and-timezone.md`.
2. **[PARALLEL] Build-watchdog teeth.** ESLint config covering `web/*.jsx` with `no-empty-function` on handler props + `lint` script in `package.json`. Force-multiplier: every subsequent sub-agent's work is then validated at lint time. AC: `docs/product/acceptance-criteria/build-watchdog-teeth.md`.
3. **Wiring-audit pass 1.** Author `docs/product/interaction-inventory.md` — exhaustive enumeration of every interactive element with status/decision. AC inside `.claude/handoffs/wiring-audit.md`.
4. **Chat thinking indicator (Bug 1).** Insert "agent is thinking" bubble in chat thread while `pending===true`. AC: `docs/product/acceptance-criteria/chat-thinking-indicator.md`.
5. **Hero press-pattern redesign.** Long-press opens the menu sticky-style; tap-to-select instead of release-to-select. AC: `docs/product/acceptance-criteria/hero-press-pattern.md`.
6. **Update-tracker UI wiring (option 1 — re-prompt to Supabase, locked 2026-04-25).** Rewrite agent prompt for Supabase reads/writes; wire at least one UI surface; eval cases. AC: appended in `docs/product/acceptance-criteria/update-tracker.md` (CR-update-tracker-supabase-wiring-01..).
7. **Babysit-prs known issues.** ✅ Diagnosed 2026-04-25 — loop was firing cleanly but every iteration was a no-op (60+ Opus-4.7-high invocations/day, zero work) because `feat/track-*` branches only exist during overnight build loops. **Decision: decommission the standalone launchd schedule; keep spec + slash command for inline-hourly use by overnight-build-loops.** ADR 0007. Manual follow-up: `launchctl unload ~/Library/LaunchAgents/com.intently.babysit-prs.plist` + remove plist + remove `babysit-prs)` case from `~/.intently/bin/intently-routine.sh` (out-of-repo). AC: `docs/product/acceptance-criteria/babysit-prs-diagnosis.md`.
8. **Build dedicated `chat` MA skill agent.** HeroChat + per-turn flow acks currently piggyback on `daily-brief` (PR #157 swapped canned replies for live LLM via daily-brief). Purpose-built chat agent: own system prompt, no planning-pull. Spec: `agents/chat/SKILL.md` + `ma-agent-config.json` + add `chat` to SKILL_ENV in `supabase/functions/ma-proxy/index.ts` + provision via `scripts/provision-ma-agents.ts` + set `MA_AGENT_ID_CHAT` secret. AC at `docs/product/acceptance-criteria/chat.md` to be authored when this item starts (per matrix: touches MA skill → per-skill AC file).

## Critical items (post-launch reconciliation)

- **Post-hackathon scheduled-dispatch verification** (`.claude/handoffs/post-hackathon-scheduled-dispatch-verification.md`) — 10 PRs shipped (#175–#186 exc. #177, #184); functions deploy + agent provision + e2e test pending.

1. **Design folder reconciliation.** `docs/design/Intently - App/` was never formally reconciled against the entries-architecture session prompt; cognition layer bypassed via "ship the prototype directly" (ADR 0004). Reconcile now.
2. **Reminders intent reconciliation.** Muxin's intent: reminders as "track this and surface in daily briefing," not narrow date-anchored. Current classify rejects undated input. Confirm against new design folder + update.
3. **Worktree at `~/worktrees/intently/entries-architecture`** — decide: continue, destroy + recreate, or skip after reconciliation.

## Post-launch backlog (engineering)

| Item | Effort | Notes |
|---|---|---|
| Visual polish | ~variable | PainterlyBlock variants, Collage backdrops, gradient CTAs — retrofittable per design folder. |
| Phase out `app/` (Expo + RN-Web) | ~half-day | Kept as historical reference per ADR 0004; remove when no one's pulling from it. |

(Real OAuth, multi-user auth, toggle-done-flags promoted to § Active handoffs above.)

## Follow-ups (manual or flight-test)

- **(Optional)** Re-provision live `weekly-review` agent with Output contract durably in system prompt: `cd app && bws run -- npx tsx ../scripts/provision-ma-agents.ts --skill weekly-review --update-existing`.
- **Apply pg_cron migration** (`supabase/migrations/0002_schedules.sql`) — covered by `scheduled-agent-dispatch` handoff but the manual `supabase db push` is user-only.
- **Stewards leave working-tree mods uncommitted.** Auto-commit to `auto/steward/*` branches + draft PR.
- **Post-first-live-run baseline floor.** Folded into `cognition-verification-harness` AC.
- **Wire `decision-drift-check` to launchd.** Add `com.intently.decision-drift.plist` matching the existing pack, daily evening.
- **Stale `session-handoff.md` reference sweep.** Doc-only. Stale pointers in `docs/Claude Code Repo-Ready Blueprint.md`, `docs/design/claude-code-implementation.md`, `docs/process/acceptance-criteria.md`, `docs/process/session-prompt-seed-data-v1.md`.
- **Post-merge hook refusing commits on `main`** — prevent recurrence of accidental direct-to-main commits.
- **Decommission standalone `babysit-prs` launchd schedule** (per ADR 0007). User-only — wrapper script and `~/Library/LaunchAgents/` are out of repo. Steps: `launchctl unload ~/Library/LaunchAgents/com.intently.babysit-prs.plist && rm ~/Library/LaunchAgents/com.intently.babysit-prs.plist`; then delete the `babysit-prs)` case from `~/.intently/bin/intently-routine.sh` (lines around 148–158). Spec + slash command + inline-hourly use by overnight-build-loops are preserved.

PR #157 added three follow-ups that have been folded into handoffs/§ Next instead of duplicating here:
- *Build dedicated `chat` skill agent* → § Next #8 (with full spec preserved there).
- *Author rich `SAM_GOALS` content (intention prose, milestones, reflections)* → folded into `sam-demo-on-landing-page` handoff Sam-data-completeness AC.
- *Stand up Playwright regression suite* → folded into `cognition-verification-harness` handoff (Playwright walk is the cheaper pre-cursor; the harness is the fuller fresh-user + time-travel approach).
- **Fix `--clean` squash-merge false-positive** in `scripts/intently-track.sh`. Replace `git cherry` with `git diff --quiet main HEAD`.

## Lost files (user-only decision)

- **Demo video work** force-removed 2026-04-25 from `.claude/worktrees/video-demo/`. Decide: low-level disk recovery vs accept loss + reconstruct.

## MA API schema — empirical corrections

- `POST /v1/sessions` body: `agent` (no `_id`) + `environment_id` (with `_id`). `environment_id` required.
- `POST /v1/sessions/{id}/events`: `{events: [{type, content: [{type:'text', text}]}]}` (events wrap in array).
- Stream path: `/v1/sessions/{id}/events/stream`.
- `agents.update` requires `version` from list response (optimistic concurrency lock). Fixed in #142.

## Locked decisions

- Stack (ADR 0004): React 18 + Babel-standalone + Supabase + Managed Agents · BWS at scale. Web-only.
- Managed Agents = runtime, not state (ADR 0001). State of truth = Supabase rows.
- V1 single-user (anonymous Supabase auth + `linkIdentity()` upgrade per `new-user-ux-and-auth` handoff).
- CLAUDE.md: "Autonomy default — act, don't ask."
- Screen-semantic mapping: Present = today's brief + plan. Past = completed reviews. Future = goals + monthly slice.
- Cognition input cap ~3.4K tokens; below Opus 4.7's 4K cache minimum (real-app-cognition handoff #24).
- **Sam-as-embedded-demo** on landing page (option A: component embed). Locked 2026-04-25.
- **Real-working-app bar** supersedes hackathon "1 flow done well" framing. Per `launch-plan.md` rewrite 2026-04-25.

## How to resume

Read in order: `launch-plan.md`, this file, `CLAUDE.md`. If Critical items has entries, walk through with user first. Update Status + prepend dated Log entry at end of any non-trivial session.

## Log

- **2026-04-25 evening — capture + groom session.** Distilled post-hackathon roadmap into 6 new handoffs (`wiring-audit`, `cognition-verification-harness`, `new-user-ux-and-auth`, `sam-demo-on-landing-page`, `oauth-calendar-email`, `scheduled-agent-dispatch`) and 13 inbox items, then groomed all 13 to TRACKER. `agent-noticing-layer` promoted from V1.1-deferred to active. `launch-plan.md` rewritten to "real working app" bar. Inbox drained. § Next ordered with chat-reminder Bug 3 (silent data loss) at top. PR #158 (chat-reminders JWT/timezone fix) and PR #159 (build-watchdog ESLint teeth) opened as the parallel sub-agent execution wave.
- **2026-04-25 — functional-quality pass (PR #157, 7 commits).** (1) review-confirm crash fix (objects-as-React-children when agent emits structured `friction:[{text,tag}]`) + JSON-tail leak in chat bubbles; (2) brief plan now persists to `plan_items` on accept + adds SAM_TODAY_BRIEF + SAM_WEEKLY_REVIEW seeds for cross-day cognition on first load; (3) goals capped to top 3 by max(projects.updated_at) + dedupe Just-added vs DB-hydrated + expand toggle; (4) tense step-arrows lifted out of phone frame to `.tense-nav-outside` slot; (5) Weekly review CTA gated on configurable Profile pref (Sunday default) + dropped Weekly summary email toggle; (6) DB-aware GoalDetail/ProjectDetail + JSONB-todo toggle persistence (`toggleProjectTodo`, `markAdminReminderDone`); (7) per-turn LLM ack across BriefFlow/ReviewFlow/WeeklyReviewFlow + HeroChat routes non-reminder text to live LLM (was canned). Method: empirical 20-story Playwright walk on production caught bugs prior smoke missed.
- **2026-04-26 — cognition layer + real-app shell.** 13 PRs (#136–#152). Closed the 11-item cognition backlog from `.claude/handoffs/real-app-cognition.md` plus the 9-item real-app shell backlog. Live deployed prototype now satisfies the original UX vision end-to-end (voice/brief/review/weekly/monthly/setup/persistence/hydration/traces/undo, all with cross-day cognition).
- **2026-04-25 evening — web/ live-wiring sprint.** 5 PRs (#111–#115) wired voice + brief/review against the inherited prototype.
- **2026-04-25 — MA agents complete + editing-workflow revision.** All 6 agents provisioned. Anthropic key consolidated/rotated twice.
- **2026-04-24 — web pivot + live MA end-to-end.** 12 PRs. Expo Web → Vercel deploy → first live Opus 4.7 brief.
- **2026-04-23 — parallel-tracks workflow + infra.** ~27 PRs. Agent-runner base, evals, design tokens, seed data.
- **2026-04-22 — Supabase schema + Expo scaffold + ADRs 0001/0002/0003.**
