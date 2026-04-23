# Doc Map — Dependency Review Guide

When a doc changes, review the downstream docs listed here before committing any implementation.

---

## life-ops-plugin-spec.md

**When it changes** → review before merging any implementation in the same sprint.

| Downstream | What to check |
|---|---|
| `docs/product/acceptance-criteria/*.md` | Re-derive any criterion whose spec anchor changed (`/derive-criteria <skill>`). |
| `agents/*/SKILL.md` | Confirm skill flow still matches the updated spec section. |
| `evals/rubrics/` | Confirm rubric scoring still aligns with the updated expected behavior. |
| `docs/backlog/deferred-features.md` | If a deferred skill is being un-deferred, remove it here and author criteria. |

---

## app-experience.md

**When it changes** → review before shipping any mobile UI component.

| Downstream | What to check |
|---|---|
| Mobile UI components (`app/`) | Confirm swipe layout, card types, and interaction model still match the doc. |
| E2E test criteria in `docs/product/acceptance-criteria/` | Confirm demo-flow end-to-end steps still match the described interaction model. |

---

## docs/backlog/deferred-features.md

**When it changes** → update acceptance-criteria files and routine prompts.

| Downstream | What to check |
|---|---|
| `docs/product/acceptance-criteria/` | Criteria for newly un-deferred items must exist (status `unknown` until authored). Criteria for newly deferred items should be marked `deferred`, not `fail`. |
| `.claude/routines/spec-conformance-steward.md` | Steward task 2 reads this file to skip deferred skills — confirm the pointer is current. |
| `.claude/loops/criteria-sync-loop.md` | Loop edge-case rule reads this file — confirm the pointer is current. |

---

## docs/product/vision.md

**When it changes** → no automated downstream, but review CLAUDE.md "Product intent" section for drift.

---

## launch-plan.md

**When it changes** → the hot queue (`TRACKER.md`) must be re-reviewed. Launch plan defines the milestones; TRACKER's "Next (in order)" is the week-to-week tactical list that rolls up to those milestones. If a milestone shifts, date changes, or the MVP demo bar moves, TRACKER may need re-prioritization.

| Downstream | What to check |
|---|---|
| `TRACKER.md` | Confirm "Next (in order)" items still ladder up to the updated milestones. Re-sync the "Today's Go/No-Go" if demo bar changed. |
| `docs/hackathon/Submission Tracker.md` | If the 3 mandatory deliverables list changed (should be rare — those are hackathon rules), confirm submission tracker reflects the updated list. |

---

_Last updated: 2026-04-23_
