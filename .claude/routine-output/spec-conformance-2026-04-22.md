# Spec Conformance Report — 2026-04-22

**Run type:** Baseline cut (first steward run).
**Spec source:** `docs/product/requirements/life-ops-plugin-spec.md`
**Criteria source:** `docs/product/acceptance-criteria/`
**Build state at audit time:** pre-stack-decision. No CI, no tests, no eval runs. Agent artifacts are `agents/<skill>/SKILL.md` prompt specs only — no runtime implementation, no managed-agent deployment, no mobile client yet. All demo-flow criteria therefore have **no runtime evidence** either way.

---

## Bottom line (read this first)

**Demo readiness: NOT READY.** Every demo-blocker criterion across the three demo flows is `unknown`. Per the steward brief and `docs/process/release-gates.md`, demo-blocker criteria must all be `pass` before submission. The submission deadline is **Sun 2026-04-26 · 8:00 PM EDT — 4 days out.** The gap is not "wrong behavior" (we've verified nothing to the contrary); it is "no evidence either way," because the verification stack (unit tests, E2E, evals) does not exist yet. Unblocking this is a sequencing problem, not a behavior problem — see "Suggested test additions" below for the ordered build list.

**Headline counts:**
- Criteria reviewed: **29** across 5 flows.
- Pass: **0** · Partial: **0** · Fail: **0** · Unknown: **29**.
- Fidelity findings: **3 HIGH · 2 MEDIUM · 0 LOW**.
- Missing-criteria flows: **3 user-facing** (`daily-triage`, `monthly-review`, `project-continue`) + **2 deferred-priority** (`vault-drift-check`, `session-digest`).

---

## Per-flow conformance table

### Daily Brief (demo flow #1 — opens the demo)

| Criterion | Status | Evidence | Next action |
|---|---|---|---|
| CR-daily-brief-01 — Brief ready before user opens the app | unknown | No scheduled managed-agent infrastructure exists yet; no invocation-timestamp log, no E2E. | Stand up managed-agent schedule + add E2E assertion that open-to-first-paint reads cached content (no in-flight LLM call). |
| CR-daily-brief-02 — Brief references prior context, not just today's calendar | unknown | `agents/daily-brief/SKILL.md` exists but unexecuted; no eval dataset or rubric yet. | Author `evals/datasets/daily-brief/` + `evals/rubrics/daily-brief.md` scoring memory-use; run first batch. |
| CR-daily-brief-03 — Brief surfaces patterns across time, not just retrieval | unknown | Same as above. See fidelity finding F-DB-03. | Same eval asset; also reconcile criterion wording with spec (patterns are extracted by weekly-review into Weekly Goals.md; daily-brief *references* them, does not synthesize). |
| CR-daily-brief-04 — Brief reads as narrative, not as a checklist | unknown | No tone rubric authored. See fidelity finding F-DB-04. | Add tone axis to daily-brief rubric; reconcile "no bullets" narrowing with spec's "warm but efficient / not a wall of text." |
| CR-daily-brief-05 — Brief renders within latency budget | unknown | No mobile client, no timing harness. Default budget 2s is still unset in `docs/design/app-experience.md`. | (a) Set explicit budget in app-experience.md. (b) Add E2E timing assertion once client exists. |
| CR-daily-brief-06 — Brief degrades gracefully when memory is empty | unknown | No E2E. | E2E against empty-memory fixture. Low priority (non-demo-blocker). |

### Daily Review (demo flow #2 — closes the day)

| Criterion | Status | Evidence | Next action |
|---|---|---|---|
| CR-daily-review-01 — Review captures today's actual events, not a generic template | unknown | SKILL.md only; no fixture day, no eval. | Author fixture day + faithfulness rubric; first eval run. |
| CR-daily-review-02 — Review updates persistent state coherently | unknown | Agent Memory Steward has not run against a review output yet. | Run daily-review once against a fixture vault; have Agent Memory Steward audit the diff. |
| CR-daily-review-03 — Review notices recurring patterns | unknown | No multi-day fixture. See fidelity finding F-DR-03 (spec places pattern detection in weekly/monthly, not daily). | Reconcile wording with spec before authoring evals. |
| CR-daily-review-04 — Review tone is reflective, not performative | unknown | No tone rubric. | Add tone axis to daily-review rubric; include "no task-completion congratulation" probe. |
| CR-daily-review-05 — Review surfaces tomorrow shaping signal | unknown | See fidelity finding F-DR-05 (spec assigns tomorrow-shaping to daily-brief, not daily-review). | Reconcile wording with spec *or* amend spec to place this hand-off here; decision owed before evals are authored. |

### Weekly Review (demo flow #3 — referenced, not fully shown)

| Criterion | Status | Evidence | Next action |
|---|---|---|---|
| CR-weekly-review-01 — Surfaces incomplete goals from the week | unknown | No fixture week, no E2E. | Author fixture week + E2E that asserts "incomplete" list is populated and non-confabulated. |
| CR-weekly-review-02 — Scores the week without over-quantifying | unknown | See fidelity finding F-WR-02 — **this criterion contradicts the spec's explicit "Rate the week 1-10" instruction.** | **Rewrite criterion to match spec** (author PR, before implementation PR). Do not carry this into evals as-is. |
| CR-weekly-review-03 — Aligns next week with monthly priorities | unknown | No E2E with mocked monthly-priority state. | E2E: weekly-review run with (a) present monthly priorities, (b) stale (>5wk) priorities, (c) absent priorities; assert each path's output language per spec step 4. |
| CR-weekly-review-04 — Archives the week's logs cleanly | unknown | Agent Memory Steward has not audited a weekly-review run. | Run weekly-review on fixture vault; Agent Memory Steward audits Past/Archive placement + Daily Log trim. |
| CR-weekly-review-05 — Memory state stays coherent across the cross-skill boundary | unknown | No Agent Memory Steward cross-skill contradiction check authored yet. | Author cross-skill contradiction audit (daily-review outputs vs subsequent weekly-review outputs over a fixture week). **Demo-blocker per criterion note.** |

### Setup (non-demo, derived 2026-04-22)

| Criterion | Status | Evidence | Next action |
|---|---|---|---|
| CR-setup-01 — Phase 1 scan+classify against existing structure | unknown | No classifier code, no fixture folders. | Fixture folders for each branch (nothing found / notes structure / goal docs / trackers / journal / health); unit-test classifier. |
| CR-setup-02 — Phase 1 adapts paths when structure found, builds fresh otherwise | unknown | No E2E. | E2E per branch; assert config paths reference discovered locations. |
| CR-setup-03 — Phase 2 seeds three mandatory foundation docs via conversation | unknown | No agent run. | Onboarding E2E; post-run file-shape assertion for Ops Plan, Goals, Weekly Goals. |
| CR-setup-04 — Phase 3 classifier + project doc seeding | unknown | No classifier, no template fixtures. | Classifier unit test + file-shape test against spec templates (Tracker.md, Strategy.md). |
| CR-setup-05 — Phase 5 preferences captured and written to `life-ops-config.md` | unknown | No run. | E2E of preferences dialog; file inspection of `life-ops-config.md`. |
| CR-setup-06 — Phase 6 seeds remaining foundation files | unknown | No run. | Post-run file inspection. |
| CR-setup-07 — Phase 4 health/wellness is truly optional | unknown | No run. | E2E both branches; downstream daily-brief test verifies nudge presence/absence matches config. |

### Update Tracker (non-demo, derived 2026-04-22)

| Criterion | Status | Evidence | Next action |
|---|---|---|---|
| CR-update-tracker-01 — Reads the Ops Plan to find projects | unknown | No reader, no fixture. | Unit test on Ops Plan reader against fixture. |
| CR-update-tracker-02 — Matches utterance; asks when ambiguous | unknown | No E2E. | E2E with clear-match + ambiguous inputs. |
| CR-update-tracker-03 — Updates tracker within existing layout | unknown | No fixture. | Before/after diff test on canonical Tracker.md; assert layout preserved. |
| CR-update-tracker-04 — Syncs Command Center dashboard line | unknown | No fixture. | Before/after diff on Ops Plan; assert matching row updated, others unchanged. |
| CR-update-tracker-05 — Confirms update conversationally and briefly | unknown | No rubric. | AI eval rubric for tone + content accuracy. |
| CR-update-tracker-06 — Scope discipline: updates only, no planning | unknown | No rubric. | AI eval rubric with held-out planning-invites; assert decline. |

---

## Demo blocker list

**Must be empty before 2026-04-26 submission. Currently 10 blockers, all `unknown`.**

| # | Criterion | Flow | Why it blocks |
|---|---|---|---|
| 1 | CR-daily-brief-01 | daily-brief | Pre-generation is how the demo opens without a spinner. |
| 2 | CR-daily-brief-02 | daily-brief | Memory-use is the demo's thesis. |
| 3 | CR-daily-brief-03 | daily-brief | Pattern synthesis is the Opus 4.7 showcase moment (criterion note). |
| 4 | CR-daily-brief-04 | daily-brief | Tone/voice is visible on-screen. |
| 5 | CR-daily-brief-05 | daily-brief | Latency visible to judges. |
| 6 | CR-daily-review-01 | daily-review | Faithfulness is demo-visible. |
| 7 | CR-daily-review-02 | daily-review | Downstream daily-brief reads what review wrote — incoherence breaks next day. |
| 8 | CR-daily-review-03 | daily-review | Pattern-noticing is on-demo-script. **See fidelity F-DR-03 — scope may not be spec-correct.** |
| 9 | CR-daily-review-04 | daily-review | Tone is demo-visible. |
| 10 | CR-daily-review-05 | daily-review | Tomorrow-shaping close is demo-visible. **See fidelity F-DR-05 — scope may not be spec-correct.** |
| 11 | CR-weekly-review-05 | weekly-review | Cross-skill contradiction would surface in the next daily brief and break the demo. |

(Count resolves to 11 when the explicit "Demo blocker: yes" lines are summed; the 10 in the bottom-line headline was an undercount — use 11.)

---

## Suggested test additions

Ordered by unblocking value given the 4-day runway and the stack-decision gate on Thursday Apr 23.

**Blocking on stack decision (Apr 23):**
1. `ci.yml` green on a no-op commit (lint, typecheck, unit, build). Gates everything below.
2. `tests/unit/` + `tests/e2e/` shells with the naming convention `cr_<flow>_<NN>_<short>` from session-handoff so criteria IDs map to test names.

**Friday Apr 24:**
3. `evals/datasets/daily-brief/` — first dataset from Muxin's real Life Ops content (with consent).
4. `evals/rubrics/daily-brief.md` — memory-use axis, tone axis, pattern-synthesis axis, format axis.
5. `evals/baselines/daily-brief.json` — committed baseline.
6. Unit test: Ops Plan reader + classifier (covers `CR-update-tracker-01`, `CR-setup-04`).

**Saturday Apr 25:**
7. Datasets + rubrics for `daily-review` and `weekly-review`.
8. E2E: `cr_daily_brief_01_prefetched` + `cr_daily_brief_05_renders_within_budget` (latency budget decided in `docs/design/app-experience.md`).
9. E2E: `cr_daily_review_02_updates_state_coherently` + Agent Memory Steward audit pass.
10. E2E: `cr_weekly_review_05_cross_skill_coherence` (demo-blocker).
11. Manual-only verification logs (per steward edge case) for tone/warmth criteria that can't be rubric-scored deterministically — logged in `docs/release/`.

**Before submission (Sun Apr 26):**
12. All 11 demo-blockers must move from `unknown` → `pass`. Anything that lands `partial` or `fail` blocks the demo cut.

---

## Fidelity findings

Per steward task 7 — wording drift from spec intent, with severity. No criterion's `Behavior` field was edited in an implementation PR (nothing is git-tracked yet: all criteria, all agent SKILL.md files, and the spec itself are still untracked on the scaffold commit, so Layer-A and Layer-C enforcement has not yet had anything to enforce against).

| ID | Criterion | Spec anchor | Type of drift | Severity | Recommended correction |
|---|---|---|---|---|---|
| F-WR-02 | CR-weekly-review-02 | Weekly Review step 2: "Rate the week 1-10 on: output quality, focus, energy, progress toward big goals." | **Contradiction** — criterion Behavior says "without pretending to a numeric score that the data doesn't support," which directly negates the spec's explicit numeric 1-10 scoring across four axes. | **HIGH** | Rewrite Behavior to match spec verbatim: "Rate the week 1-10 on output quality, focus, energy, and progress toward big goals. One sentence on what made the biggest difference." If Muxin prefers qualitative-only scoring, amend the *spec* first (separate PR), then re-derive the criterion. Do not carry the contradiction forward. |
| F-DR-03 | CR-daily-review-03 | Daily Review flow (steps 1-4) does not include pattern detection. Pattern detection is explicitly located in Weekly Review step 0 ("Read this week's journal entries... surface emotional threads, patterns") and Monthly Review step 2 ("Scan journal for Patterns"). | Scope expansion — criterion adds pattern-noticing to a skill whose spec flow doesn't include it. | **HIGH** | Either (a) drop the criterion and move pattern-noticing expectations to weekly-review/monthly-review criteria, or (b) amend the spec's daily-review flow to explicitly name lightweight cross-day pattern surfacing. Do not silently keep the criterion as-is. |
| F-DR-05 | CR-daily-review-05 | Daily Review flow (steps 1-4) ends with "prompt for reflections," not "suggest tomorrow's shape." Tomorrow-shaping is the daily-brief's responsibility (Daily Brief step 4). | Scope expansion — criterion adds tomorrow-shaping to daily-review, duplicating the daily-brief's job. | **HIGH** | Drop the criterion. If a hand-off signal from daily-review → next-morning daily-brief is desired, spec it explicitly (e.g., daily-review writes a flag into Weekly Goals System Notes that daily-brief reads next morning), then derive a criterion against that new spec language. |
| F-DB-03 | CR-daily-brief-03 | Daily Brief flow step 4: reads Weekly Goals (which already contains patterns extracted by the prior weekly review). Spec does not say daily-brief itself synthesizes patterns. | Wording narrowing/drift — "identifies at least one cross-session pattern" reads as active synthesis, but the spec's intent is reference/surface patterns that weekly-review already extracted. | **MEDIUM** | Rephrase Behavior as "surfaces the patterns recorded in Weekly Goals' Review of Last Week section when relevant to today, rather than restating them generically" (or similar). Preserves intent; aligns scope. |
| F-DB-04 | CR-daily-brief-04 | Daily Brief spec notes: "warm but efficient — clarity, not a wall of text" and "conversational briefing." No prohibition on bullets. | Narrowing — criterion forbids bullet lists; spec does not. | **MEDIUM** | Rephrase to "Briefing reads conversationally — plain prose paragraphs, with bullets only when genuinely list-shaped (e.g., calendar items)." Preserves warmth-and-narrative intent without over-constraining. |

Once these fidelity findings are resolved (in a pre-implementation PR per `docs/process/acceptance-criteria.md`), re-derive and re-run this steward to refresh status.

---

## Missing criteria (steward task 2)

Spec defines 8 user-facing skills + 2 supporting infrastructure skills. Criteria exist for **5** (`setup`, `update-tracker`, `daily-brief`, `daily-review`, `weekly-review`). Missing:

**High priority (user-facing, own spec section):**
- **`daily-triage`** — spec lines ~458-476. Pre-briefing mechanical sort; scheduled-only; demo-adjacent (runs before the daily-brief demo flow starts). Criteria should cover Inbox processing, Time-Sensitive deadline flagging, pruning, stale-item flagging, and the "never does planning work" scope line.
- **`monthly-review`** — spec lines ~599-658. Strategic-altitude check; touches Goals, Ops Plan, Monthly Priorities, all trackers. Not a demo flow but part of the cascade the demo narrative references. Criteria should cover: pattern-detection across 4 weeks of reflections (including `#gtj` structured data parsing), goal health check, portfolio balance, pre-mortems, the "update ALL files" test, and the automated-run vs present-user branching.
- **`project-continue`** — spec lines ~693-711. Generic per-project orientation. Not a demo flow but user-facing. Criteria should cover: project match from Ops Plan, Tracker+Strategy read, orientation summary, strategy-drift prompt (and verbatim capture — no paraphrasing), hand-off without doing the work itself.

**Deferred-priority (not user-invoked / background):**
- **`vault-drift-check`** — spec lines ~715-723. Scheduled maintenance scan, report-only. Reasonable to defer — criteria can follow once the file-reference-resolver exists.
- **`session-digest`** — spec lines ~29-32. Sub-agent invoked by daily-brief and daily-review. Criteria for it should be about output contract (project-grouped digest shape, context-leanness) rather than user-observable behavior. Defer until daily-brief/daily-review criteria are passing.

**Recommendation:** author `/derive-criteria` PRs for the three high-priority missing skills *before* their implementation lands, to satisfy the `docs/process/acceptance-criteria.md` Layer-A rule. `monthly-review` is the highest urgency of the three because the cascade (Monthly Priorities → Weekly Goals → Daily Log) is demo-narrative-critical and the weekly-review criteria already depend on Monthly Priorities existing.

---

## Other notes

- **Edge case — acceptance criteria don't exist yet:** partially true (see missing-criteria section). The steward surfaced gaps as its first job.
- **Edge case — spec changes mid-week:** spec is untracked in git, so we have no history to detect change against yet. First tracked commit of the spec will establish the baseline for future stewardship runs.
- **Edge case — manual-only verification:** several daily-brief/daily-review criteria (tone, warmth, voice-match) are ultimately manual. Log manual runs in `docs/release/` per the steward brief; treat `unknown` as the correct status until logged.
- **GitHub issues for fail/unknown:** **deferred this run.** With 29 unknowns and no issue tracker wired to this repo yet, opening 29 issues would generate noise without moving evidence. Resumes the first time a criterion flips to `fail` or `partial` *with evidence* — i.e., once the test/eval stack is live. Single meta-issue for the demo-blocker count may be worth it once the issue tracker is chosen.
- **Anti-gaming enforcement state:** Layer A (`.githooks/pre-commit`) — stubbed per CLAUDE.md, not yet enforcing (nothing committed yet). Layer B (this routine, task 7) — running. Layer C (`ci.yml` same-PR check) — deferred until stack decision per session-handoff. No concrete gaming observed this run; fidelity findings above are all pre-existing scaffold-time drift, not retroactive criterion-fitting.
