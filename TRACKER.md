# Intently Hackathon Tracker

**Purpose:** First doc a new session reads to resume. Hot state only — what's in flight, what's blocked, what just moved. For durable strategy + milestones, read `launch-plan.md` at repo root. Schema per `docs/architecture/data-model.md`. Keep slim (cap 100 lines).

**Doc hierarchy:** `launch-plan.md` (strategy, slow) → `TRACKER.md` (queue, hot) → `docs/product/acceptance-criteria/` (done-definition, per skill).

**Submission tracking** (video, artifacts, deadline): `docs/hackathon/Submission Tracker.md`.

## Status

**Phase:** Reconcile — design folder fully replaced 2026-04-24; entries-architecture plan needs sanity-check against new design before any build.
**Status:** 🟢 daily-brief + 4 MA agents (daily/weekly/monthly review + brief) live; reminders backend deployed; voice modal wired; UX skeleton committed. Web app at https://intently-eta.vercel.app.
**Last:** PR #75 (UX skeleton + voice + reminders + memory loop) and PR #76 (stranded build artifacts + entries session prompt) merged. Worktree `~/worktrees/intently/entries-architecture` exists but no work done in it yet — parked pending reconciliation.
**Next:** **Reconciliation pass first** (see Critical items below) → revised entries plan → only then kick off the entries-architecture worktree session for implementation.
**Last updated:** 2026-04-24 (planning-handoff session, pre-reconciliation).

### Go/No-Go (2026-04-24 EOD)

| Flow | Verdict | Note |
|---|---|---|
| Daily Brief | **🟢 SHIPPABLE** | Live MA call working end-to-end. Real Opus 4.7 output landed; synthesis beat confirmed (journal verbatim, calendar names, pacing tied to yesterday's fatigue). See screenshot archive in session notes. |
| Daily Review | **BLOCK** | Not wired. Agent not created in console. Wire identically to daily-brief once chosen. |
| Weekly Review | **SHIP WITH CAVEATS** | Static-analysis pass; no live run attempted. Stretch. |

## Critical items awaiting review

1. **Design folder was completely replaced 2026-04-24.** New version at `docs/design/Intently - App/` ships an interactive prototype + updated `CLAUDE.md`, `BUILD-RULES.md`, `HANDOFF.md`. Prior plans (including the entries-architecture session prompt at `docs/process/session-prompt-entries-architecture.md`) were written against the *old* version. **First action of next session:** read the new design folder end-to-end, apply the "Spec intent > spec letter" rule with Muxin (elicit intent in his own words), reconcile the entries-architecture plan against new content. The session prompt has a STOP banner at the top that walks through this protocol — follow it.

2. **Reminders intent reconciliation.** Muxin's stated intent (in his own words, captured in the entries-architecture session prompt): "*reminders was more like, 'keep track of this and surface it in daily briefing' not specifically 'you asked me to remind you to...' so that if i say, dropped in a 'hey add this somewhere' and leave a voice memo the agent's like 'cool got it' and it stashes it somewhere where it will pull it up again during our daily briefing... it tracks time sensitivity.*" Current shipped reminders flow is still narrow date-anchored (classify prompt rejects anything without a clear date). The reconciliation pass needs to confirm whether the new design folder has a different/better model for this — and whether "Entry as canonical, reminders as projection" still holds.

3. **Worktree at `~/worktrees/intently/entries-architecture` is parked.** It was created via `intently-track entries-architecture` but no Claude session has done work in it. After reconciliation, decide: continue in that worktree, destroy + recreate fresh, or skip the worktree pattern entirely if the new plan doesn't fit it. Don't run `claude` in it until the reconciliation is done; otherwise that session starts building from a stale plan.

## Follow-ups (pending manual or flight-test)

- **[Design] Session Handoff Steward redesign — per-session, not nightly.** Current state: runs once at 22:45 nightly, overwrites a single `.claude/session-handoff.md`. New design (per Muxin 2026-04-24):
  - **Trigger:** every session on exit (Stop hook / manual `/handoff` command / `SessionEnd` hook in `.claude/settings.json`), not a single daily launchd fire.
  - **Output:** one file per session at `.claude/session-handoffs/<timestamp>-<slug>.md`. Captures deep context: goals, decisions made, learnings, process details, *how* TRACKER queue items actually got done.
  - **TRACKER pointer:** TRACKER.md gets an "Active session docs" list linking to in-flight session-handoff files. TRACKER stays the hot queue ("things we gotta do"); session-handoff holds the implementation depth ("how we actually do them").
  - **Lifecycle:** delete the session-handoff file when (a) the work it covers is completed, or (b) Muxin exits the session and confirms close-out. Avoids `.claude/session-handoffs/` becoming a graveyard.
  - **Doc hierarchy update:** explicitly: `launch-plan.md` = high-level milestones (slow, "what does shipped mean"); `TRACKER.md` = live hot queue ("what we gotta do"); `.claude/session-handoffs/<slug>.md` = per-session implementation depth ("how we do it"). Update CLAUDE.md and TRACKER's own header to reflect this triad once built.
  - **Implementation work:** update `.claude/routines/session-handoff-steward.md` brief; change/disable the daily launchd job for it; build the per-session trigger (Stop hook is most natural fit); build cleanup logic that prompts for delete-on-close.
- **[BLOCKING today] Create MA agents for daily-review + weekly-review in console.** Configs at `agents/daily-review/ma-agent-config.json`, `agents/weekly-review/ma-agent-config.json`. Paste → Save → copy ID → `supabase secrets set MA_AGENT_ID_DAILY_REVIEW=<id>` and `MA_AGENT_ID_WEEKLY_REVIEW=<id>`. User-only (Claude can't reach MA console).
- **update-tracker + setup MA agents** — deferred. update-tracker = small confirmation-card surface only, setup = seed-data-covered for demo. Create if time permits.
- **Accidental direct-to-main commit `5b95d51`** (swipe fix). Branch-first rule violated because `gh pr merge --delete-branch` dropped me back to main and next commit went there. Change is correct + deployed, left in place. Consider adding a post-merge hook that refuses commits on main to prevent recurrence.
- **Apply pg_cron migration** (`supabase/migrations/0002_schedules.sql`). Needs `supabase db push` — user-only.
- **Fix `--clean` squash-merge false-positive** in `scripts/intently-track.sh`. Replace `git cherry` with `git diff --quiet main HEAD`. ~2-line fix.
- **Stewards leave working-tree mods uncommitted.** Release-readiness + spec-conformance stewards edit tracked files overnight without committing. Design fix: auto-commit to `auto/steward/*` branches + draft PR.
- **Post-first-live-run baseline floor.** Run daily-brief against `evals/datasets/daily-brief/cases.json` once, raise per-axis `minScores` in `evals/baselines/daily-brief.json` from 0 to observed floor, flip `axisStatus` from `unknown` to `baselined`.

## MA API schema — empirical corrections (captured for posterity)

Three bugs found during Friday's first live smoke tests. Fixes shipped in #68, #70, #71. Documented here so the next session doesn't re-derive.

- `POST /v1/sessions` body uses `agent` (no `_id` suffix) and `environment_id` (WITH `_id`). Inconsistent but empirical.
- `environment_id` is **required**, not optional — fail-fast added to ma-proxy with clear error.
- `POST /v1/sessions/{id}/events` body: `{events: [{type, content: [{type:'text', text}]}]}`. Events wrap in array; inner event uses Messages-API content-blocks grammar.
- Stream path is `/v1/sessions/{id}/events/stream` — webinar notes had `/stream` (wrong).

## Next (in order — start here)

1. **[BLOCKING] Read the new `docs/design/Intently - App/` folder end-to-end** — `CLAUDE.md`, `BUILD-RULES.md`, `HANDOFF.md`, plus the interactive prototype files. Take notes on anything that diverges from current shipped behavior or from the entries-architecture plan.

2. **[BLOCKING] Apply "Spec intent > spec letter" with Muxin.** Per the rule in root `CLAUDE.md`: ask Muxin in his own words how Entry + capture/reminders should *feel* — what's the user beat. State back one sentence, get confirmation. The reminders narrow-vs-capture misread came from skipping this step; don't repeat it.

3. **[BLOCKING] Reconcile** — does the new design content support "Entry as canonical, reminders as projection"? Two tables vs one? Hero-mediated capture? Update or supersede `docs/process/session-prompt-entries-architecture.md` with the revised plan. The STOP banner at the top of that prompt walks through the reconciliation protocol.

4. **Then** — kick off (or resume in) the `~/worktrees/intently/entries-architecture` worktree with the revised plan. If the worktree's branching point is now stale relative to a revised plan, destroy + recreate.

5. **Other in-flight items** (do after reconciliation lands):
   - Design-fidelity pass per `docs/process/session-prompt-design-fidelity.md` (phone frame, TenseNav, painterly CTAs, hero state machine, typography).
   - Video script + practice takes.
   - Final recording + submission (Sunday 8 PM EDT).

## Stretch (skip if time-pressed)

- update-tracker + setup MA agents created in console.
- Visual polish pass beyond tokens (PainterlyBlock, LandscapePanel, painterly palettes).
- Google OAuth + real calendar/email wiring (seed data covers demo).

## Locked decisions

- MVP: 5 skills (setup, daily-brief, update-tracker, daily-review, weekly-review). Demo priority: daily-brief > daily-review > weekly-review.
- Stack (ADR 0003): Expo Web + TypeScript · Supabase (DB + Edge Functions) · Managed Agents · Bitwarden Secrets Manager.
- Managed Agents = runtime, not state (ADR 0001). State of truth = Markdown in Supabase.
- V1 single-user (Muxin dogfoods); per-user isolation deferred.
- Swipe: 21-slot repeat pattern (not clone-wrap). Infinite-feel rotation with no wrap handler complexity.
- CLAUDE.md: "Autonomy default — act, don't ask" (PR #71). Pause only for secrets-in-chat, destructive actions, or obviously dumb moves.
- **Screen-semantic mapping (structural).** Present = today's brief + plan. Past = completed reviews (daily-review output lands here). Future = goals + weekly slice (weekly-review output lands here). Enables the "swipe-to-see-yesterday's-review" demo beat.
- **Design cosmetics deferred.** PainterlyBlock, LandscapePanel, DotGridBackdrop, italic display-font headers, journal zoom, hero affordance voice modal — all retrofittable, not blocking. Tokens already wired.

## Timeline

- Hackathon: 2026-04-21 → 2026-04-26 (submit 2026-04-26, 8:00 PM EDT).
- Today: 2026-04-24 (Friday end-of-session).
- Days remaining: 2.

## Session handoff (2026-04-24)

**Live URL:** https://intently-eta.vercel.app (hard refresh to see latest).
**Supabase project:** `cjlktjrossrzmswrayfz`. ma-proxy deployed with `--no-verify-jwt`. Secrets set: `ANTHROPIC_API_KEY`, `MA_AGENT_ID_DAILY_BRIEF`, `MA_ENVIRONMENT_ID`.
**MA console:** `intently-daily-brief` agent active (ID: `agent_011CaNxuATigtyixKPxypG6S`), Opus 4.7.
**Demo surface:** Present screen renders seed by default; tap "✨ Generate live brief" pill → real agent output replaces seed. Swipe infinitely in either direction through [Past, Present, Future] cycles.

## How to resume

Read in order: `launch-plan.md`, this file, `CLAUDE.md`. If Critical items has entries, walk through with user first. Update Status + prepend dated Log entry at end of any non-trivial session.

## Log

### 2026-04-24 (web pivot + live MA end-to-end)
12 PRs merged. Went from "seed-data mobile app" to "live Opus 4.7 on a public URL running real daily-brief synthesis against seed context" in one session. Key arcs:
- **Pivot:** Expo Web target was already scaffolded. PagerView was the only blocker. Swap → export → Vercel deploy. Live URL inside an hour.
- **Parallel tracks:** 3 background agents shipped evals (#63), ma-proxy (#62), submission deliverables (#65) while main session did the pivot. Agent-driven fan-out (isolation: worktree) is now a proven pattern — complementary to user-driven `intently-track`.
- **MA setup:** User created daily-brief agent in console (config from PR #69). Required 3 empirical API fixes before first 200 response. See schema notes above.
- **Live demo confirmed:** Opus 4.7 produced a brief that quotes yesterday's journal verbatim, names calendar events, calls out the right pacing, ties P1 to the weekly goal. That's the demo beat.
- **UX:** Default-to-Present fix, infinite swipe rotation (21-slot repeat after clone-wrap failed on web), scroll-down bugfix, live-brief trigger pill, screen headers. Polish kept minimal per scope call.
- **CLAUDE.md:** Added "Autonomy default — act, don't ask" house rule (#71).

### 2026-04-23 (parallel-tracks + infra + MC session)
~27 PRs. Parallel-tracks workflow, agent-runner base, judge-scorer, design tokens, seed data, branch-first rule, launch-plan, MC session architecture docs, npm audit CI, markdown-it vuln cleared.

### 2026-04-22
Supabase schema, Expo app scaffold, ADRs 0001/0002/0003, skills adapted, MA waitlist submitted.
