# Intently Hackathon Tracker

**Purpose:** First doc a new session reads to resume. Hot state only — what's in flight, what's blocked, what just moved. For durable strategy + milestones, read `launch-plan.md` at repo root. Schema per `docs/architecture/data-model.md`. Keep slim (cap 100 lines).

**Doc hierarchy:** `launch-plan.md` (strategy, slow) → `TRACKER.md` (queue, hot) → `docs/product/acceptance-criteria/` (done-definition, per skill).

## Status

**Phase:** Build — Friday complete. Live end-to-end demo working.
**Status:** 🟢 daily-brief runs live against Opus 4.7 via Supabase proxy. Web app at https://intently-eta.vercel.app. Infinite swipe rotation. Real synthesis on camera.
**Last:** Monster Friday. 12 PRs merged (#61–#72 + one direct-to-main slip — see Follow-ups). Web pivot, parallel tracks, live MA wiring, event schema corrections (3 empirical API fixes), CLAUDE.md autonomy rule. End of session: user confirmed rotation works.
**Next:** Saturday: daily-review wiring (stretch flow #2), video script + practice takes, decision on design scope. Sunday: record + submit.
**Last updated:** 2026-04-24 (end of Friday session).

### Go/No-Go (2026-04-24 EOD)

| Flow | Verdict | Note |
|---|---|---|
| Daily Brief | **🟢 SHIPPABLE** | Live MA call working end-to-end. Real Opus 4.7 output landed; synthesis beat confirmed (journal verbatim, calendar names, pacing tied to yesterday's fatigue). See screenshot archive in session notes. |
| Daily Review | **BLOCK** | Not wired. Agent not created in console. Wire identically to daily-brief once chosen. |
| Weekly Review | **SHIP WITH CAVEATS** | Static-analysis pass; no live run attempted. Stretch. |

## Critical items awaiting review

1. **Design scope decision — OPEN.** User feedback: current app does not match the design system in `docs/design/Intently - App/` (~3,400 lines JSX across 10 files). Friday polish kept tokens + added screen headers but didn't port layouts. **Options for Saturday:** (a) accept current state, focus on daily-review + video; (b) port 1–3 specific pieces (user names them: card style, hero, screen-header pattern, etc.); (c) full port — not feasible in remaining window. User will decide at start of next session.

## Follow-ups (pending manual or flight-test)

- **Create MA agents for remaining 4 skills** (daily-review, weekly-review, update-tracker, setup). Canonical JSON configs live at `agents/<skill>/ma-agent-config.json` (all 5 shipped in PR #69). Paste → Save → `supabase secrets set MA_AGENT_ID_<SKILL>=<id>`. Only `daily-brief` created Friday.
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

1. **[Sat AM] Resolve design scope decision** (Critical item #1). Either accept current state or name specific files to port.
2. **[Sat] Daily-review wiring.** Create MA agent from `agents/daily-review/ma-agent-config.json`; set `MA_AGENT_ID_DAILY_REVIEW` secret; add button to Past screen (or Present toggle); same fetch pattern as daily-brief.
3. **[Sat] Video script.** Draft the 3-min narrative: open on Present, tap Generate, read output, swipe to show rotation, voice-over on Managed Agents story.
4. **[Sat PM] Practice takes.** Record 2–3 cuts on phone browser.
5. **[Sun] Final recording + submission.** Verify README + LICENSE + THIRD_PARTY_LICENSES present. Submit via CV platform by 8:00 PM EDT.

## Stretch (skip if time-pressed)

- Weekly-review wiring (after daily-review works).
- Specific design ports from `docs/design/Intently - App/` per decision above.
- Google OAuth + real calendar/email wiring (seed data covers demo).

## Locked decisions

- MVP: 5 skills (setup, daily-brief, update-tracker, daily-review, weekly-review). Demo priority: daily-brief > daily-review > weekly-review.
- Stack (ADR 0003): Expo Web + TypeScript · Supabase (DB + Edge Functions) · Managed Agents · Bitwarden Secrets Manager.
- Managed Agents = runtime, not state (ADR 0001). State of truth = Markdown in Supabase.
- V1 single-user (Muxin dogfoods); per-user isolation deferred.
- Swipe: 21-slot repeat pattern (not clone-wrap). Infinite-feel rotation with no wrap handler complexity.
- CLAUDE.md: "Autonomy default — act, don't ask" (PR #71). Pause only for secrets-in-chat, destructive actions, or obviously dumb moves.

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
