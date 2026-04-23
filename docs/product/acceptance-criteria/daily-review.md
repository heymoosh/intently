# Acceptance Criteria — Daily Review

**Flow:** Daily Review (end-of-day reflection managed agent + mobile rendering)
**Demo position:** Closes the day in the demo arc.
**Spec source:** `docs/product/requirements/life-ops-plugin-spec.md` — "Daily review" section.

---

*Scaffolded structure. Criteria fill in during build sessions; Spec Conformance Steward surfaces unknowns and gaps.*

---

### CR-daily-review-01: Review captures today's actual events, not a generic template

**Behavior:** The review reflects on what actually happened today (from calendar, email, voice memos, in-app captures), not a templated end-of-day prompt. If nothing notable happened, says so honestly.

**Verification:** E2E test against a fixture day; AI eval rubric scoring faithfulness.

**Demo blocker:** yes

**Status:** unknown

**Last checked:** 2026-04-22

---

### CR-daily-review-02: Review updates persistent state coherently

**Behavior:** Tracker entries get updated based on what happened (project state changed, new task added, person preference learned). Updates respect the Document Taxonomy (state in trackers, reasoning in strategy docs, content in references).

**Verification:** Agent Memory Steward audit pass after a review run; spot-check that taxonomy is respected.

**Demo blocker:** yes

**Status:** unknown

**Last checked:** 2026-04-22

---

### CR-daily-review-03: Review notices recurring patterns

**Behavior:** When the same theme appears across multiple days (per Demo Script: "third time in two weeks you've noticed the boundary thing"), the review surfaces it. Doesn't invent patterns when none exist.

**Verification:** AI eval rubric scoring synthesis on multi-day fixtures.

**Demo blocker:** yes

**Status:** unknown

**Last checked:** 2026-04-22

---

### CR-daily-review-04: Review tone is reflective, not performative

**Behavior:** Reads as insight from a thoughtful observer, not as a productivity-app summary. Allows for ambivalence ("today was uneven"). Doesn't congratulate the user for completing tasks.

**Verification:** AI eval rubric scoring tone.

**Demo blocker:** yes

**Status:** unknown

**Last checked:** 2026-04-22

---

### CR-daily-review-05: Review surfaces tomorrow shaping signal

**Behavior:** Review ends with at least one suggestion for shaping tomorrow ("tomorrow is lighter; protect the morning for X"). Suggestion is grounded in observed state, not generic advice.

**Verification:** AI eval rubric; manual review against held-out fixtures.

**Demo blocker:** yes

**Status:** unknown

**Last checked:** 2026-04-22

---

*Add criteria as the flow takes shape.*
