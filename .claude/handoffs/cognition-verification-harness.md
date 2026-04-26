# Cognition verification harness — spawn-fresh-user, time-travel, assert

**Created:** 2026-04-25 (post-hackathon-submission discussion).
**Status:** Drafted, not groomed. Awaiting `/groom` to register in TRACKER.
**Source:** Conversation between Muxin and Claude on 2026-04-25 evening. Muxin: *"We need a real test with a user that can spawn a fresh anonymous user and time-travel the clock so it can fire off the reviews. Exactly, we need that so we can test that cognition layer."*

## Why

Today there is no automated end-to-end test of the day-over-day cognition loop. `tests/` is README-only. `evals/` exists for daily-brief but TRACKER follow-up flags that baselines were never run (`minScores` still 0). `critical-flow-check` is parked, gated on *"real verification infra (E2E + AI eval rubric)"* before re-enable.

What this means concretely: the entire premise of Intently — *the agent remembers what you did yesterday and brings it forward today* — is currently verified by Muxin manually clicking through the app. If a future change quietly breaks the assembler's read of yesterday's review, we won't know until the next demo. The cognition layer is the most valuable thing we built; it has the least guarantees.

The harness is the testbed that lets us iterate on cognition (and on every downstream feature: setup expansion, OAuth, scheduled dispatch) without burning a real day per iteration.

## What — the target experience

**Single command, single user-journey simulation.**

```bash
npm run verify:cognition           # full multi-day journey
npm run verify:cognition --day=1   # only day 1
npm run verify:cognition --skill=weekly-review
```

Under the hood, the harness:
1. Spins up an isolated Supabase test project (or schema, or RLS-scoped fake user).
2. Spawns a fresh anonymous user — no Sam seed.
3. Walks them through setup (programmatically — fake user inputs).
4. Time-travels the clock to a fixed start (`2026-04-26 06:00 America/Chicago`).
5. Fires daily-brief at 09:00. Asserts the entry was written and contains expected references (the agent's prompt produces text mentioning the user's goals + projects). Records the agent's actual output for eval rubric scoring.
6. Programmatically captures user activity through the day (a few journal entries, plan-item check-offs, an incoming reminder).
7. Time-travels to evening. Fires daily-review. Asserts the review references today's activity.
8. Time-travels to next morning. Fires daily-brief. **Asserts the new brief references yesterday's review** — the cognition beat.
9. Repeat for ~7 days. Fires weekly-review on the appropriate day. Asserts it references all 7 daily reviews.
10. Reports: per-day pass/fail, per-assertion pass/fail, eval-rubric score per agent output.

**For agent quality (the AI eval rubric):**
- Each agent output is scored by a separate Opus 4.7 invocation with a per-skill rubric (specificity, freshness-vs-staleness, tone-fit, hallucination-check). Existing `evals/rubrics/` provides the pattern.
- Per-axis floor scores live in `evals/baselines/<skill>.json`. CI fails on regression.

**For the cognition assertion specifically:**
- The brief-on-day-N is parsed for references to entities-from-day-(N-1). Heuristic: extract entity names + timestamps from the agent output, check intersection with what was in the user's state on day N-1. If intersection is empty for >2 consecutive days, fail loudly.

**Time-travel mechanism:**
- Server-side: pass an explicit `now` timestamp to all date-aware functions (assembler, schedule, agent prompts). Already partially possible — `should_fire(p_user_id, p_skill, p_now)` accepts `p_now`.
- Client-side: harness doesn't drive the UI; it calls the Edge Functions and Supabase directly with synthetic timestamps.
- For pg_cron-driven fires: we can either (a) shortcut around cron and call `tick_skills()` directly with synthetic `p_now`, or (b) keep cron live and just check `cron_log` after a real tick.

## Acceptance criteria

Drafted here per § AC location matrix (cross-cutting infra → handoff).

**Harness scaffolding:**
- [ ] `npm run verify:cognition` runs end-to-end without manual input. Exits 0 on pass, non-zero on fail.
- [ ] Outputs a structured JSON report at `tests/cognition/runs/<timestamp>.json` with per-day per-assertion results.
- [ ] Cleans up after itself: test user is deleted from Supabase, no test rows remain.
- [ ] Idempotent: running it twice in a row produces identical results modulo agent-output non-determinism.

**Per-day assertions:**
- [ ] Day 1 setup → goals/projects/plan/journal/preferences populated in DB. Each row's `user_id` matches the test user's anon uid.
- [ ] Day 1 09:00 daily-brief fires (manually invoked or via cron-shortcut). `entries` row exists with `kind='brief'`, `at` timestamp matches synthetic time.
- [ ] Day 1 brief output references >=1 of the goals + >=1 of the projects entered at setup.
- [ ] Day 1 evening daily-review fires after simulated user activity. `entries` row exists with `kind='review'`.
- [ ] Day 2 daily-brief references at least one element from yesterday's review (text-match heuristic on key phrases).
- [ ] Day N=7 weekly-review fires; references ≥3 of the 7 daily reviews.

**AI eval rubric:**
- [ ] Each agent output is scored against a per-skill rubric using `evals/rubrics/`. Baselines at `evals/baselines/<skill>.json` exist with non-zero `minScores`.
- [ ] CI integration: harness runs on `pull_request` against main; fails if any per-axis score regresses below baseline.

**CI integration:**
- [ ] `.github/workflows/cognition-verify.yml` runs the harness on a schedule (nightly) and on PRs that touch `agents/`, `web/lib/context-assembler.js`, or `supabase/functions/ma-proxy/`.
- [ ] Failures are surfaced in PR review comments with the structured JSON report.

**Observability:**
- [ ] Harness output during run is human-readable (not just JSON): "Day 1 ✅ setup OK · ✅ brief fired · ✅ brief mentions goal-1, project-2 · ❌ brief score below baseline (3.2 vs 3.8)".
- [ ] On failure, the relevant agent output, input traces, and rubric scores are dumped for debugging.

## Open questions for grooming

1. **Test isolation: separate Supabase project, separate schema, or RLS-scoped test users?** Separate project is cleanest but expensive. Schema-per-test-run is mid. RLS-scoped test users on the same DB is cheapest but risks leaking into prod tables. *Lean: schema-per-test-run (transactional, cleaned after).* 
2. **Time-travel for pg_cron:** Cron-shortcut (call `tick_skills(p_now=<synth>)` directly) is fast and deterministic, but skips testing the cron path itself. Real-cron with assertions on `cron_log` is more honest but slower. *Lean: cron-shortcut for assertion harness (most failures are downstream of cron); separate "cron-real-fire" test that runs real cron on a 1-minute granularity.*
3. **How non-deterministic is "the brief mentions yesterday's review"?** Agent outputs vary turn-to-turn. *Mitigation: assertion is "any of these 5 key phrases from yesterday's review appear in today's brief," not exact-match. Tune sensitivity over time.*
4. **Eval rubric authorship:** who writes the per-skill rubrics? They're load-bearing — bad rubrics → false negatives + false positives. *Suggested: derive from `agents/<skill>/SKILL.md` "what good looks like" + iterate.*

## Dependencies / sequencing

- **Most valuable BEFORE the other handoffs ship.** If we have the harness first, every change to setup, OAuth, scheduled-dispatch is verified end-to-end. Without it, those changes are hand-tested. *Strongly recommend: build harness first.*
- Light dependency on **scheduled-agent-dispatch** for the cron-shortcut tests, but the time-travel mechanism is independent — most cognition assertions can run without real cron.

## Files this work touches (rough)

- New: `tests/cognition/` directory with harness runner, fixtures, assertions
- New: `tests/cognition/harness.ts` — top-level orchestrator
- New: `tests/cognition/days/day-1.ts`, `day-2.ts`, ... — per-day journey
- New: `tests/cognition/assertions/` — pluggable assertion functions
- New: `tests/cognition/eval-runner.ts` — wraps `evals/rubrics/` for in-harness scoring
- New: `evals/baselines/<skill>.json` — non-zero `minScores`
- New: `.github/workflows/cognition-verify.yml`
- Possibly: `supabase/functions/ma-proxy/` — accept a synthetic-`now` parameter for harness use (gated by service-role auth so prod can't pass it)
- New ADR: `docs/decisions/000X-cognition-verification-harness-architecture.md`

## Estimate

Multi-day, multi-session. The scaffolding is one big lift (~2 days), then the per-skill assertions + rubrics accrete over a week. Worth doing in two PRs: (1) skeleton + day-1 assertions; (2) full multi-day + weekly + CI.
