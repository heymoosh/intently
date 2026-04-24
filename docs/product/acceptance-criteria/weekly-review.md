# Acceptance Criteria — Weekly Review

**Flow:** Weekly Review (scheduled weekly reflection managed agent)
**Demo position:** Referenced but not necessarily fully shown in the 3-min demo arc — included for narrative completeness.
**Spec source:** `docs/product/requirements/life-ops-plugin-spec.md` — "Weekly review" section.

---

*Scaffolded structure. Criteria fill in during build sessions; Spec Conformance Steward surfaces unknowns and gaps.*

---

### CR-weekly-review-01: Surfaces incomplete goals without asserting cause

**Behavior:** Identifies goals that were stated at the start of the week (or carried in from monthly priorities) and reports which were completed and which slipped. Does NOT infer *why*; asks the user to walk through reasons together. May offer observations from the week's data (journal entries, calendar density, notable patterns in daily logs) as context for the user to consider — framed as offerings ("I noticed X — does that resonate?"), not as conclusions about cause.

**Verification:**
- E2E test against a fixture week: agent reports completed/slipped without asserting causes
- AI eval rubric: any data-derived observations are framed as questions or offerings, not as claims of causation
- Manual review for conversational tone

**Demo blocker:** no (referenced but not demo-shown)

**Status:** unknown

**Last checked:** 2026-04-24

---

### CR-weekly-review-02: Scores the week (qualitative surface, quantitative system signal)

**Behavior:** Presents the week to the user qualitatively (e.g., "productive but scattered", "recovery mode", "steady") as the default surface — does not lead with a numeric score. Internally records a 1-10 score on output quality, focus, energy, and progress-toward-big-goals in Weekly Goals.md "Review of Last Week" section for downstream agents (daily-brief, monthly-review) to consume as system signal. Surfaces the numeric score to the user only if asked.

**Verification:**
- AI eval rubric: conversational output is qualitative, not numeric-first
- Post-run inspection of `Weekly Goals.md`: all four 1-10 scores present in the "Review of Last Week" section
- AI eval probe: when asked "what's my score?", the agent returns the numeric values

**Demo blocker:** no

**Status:** unknown

**Last checked:** 2026-04-24

---

### CR-weekly-review-03: Aligns next week with monthly priorities

**Behavior:** Suggests next week's shape with reference to the active monthly priorities, not in isolation. If monthly priorities are absent, says so.

**Verification:** E2E test with mocked monthly priority state.

**Demo blocker:** no

**Status:** unknown

**Last checked:** 2026-04-24

---

### CR-weekly-review-04: Archives the week's logs cleanly

**Behavior:** Daily logs from the week are moved to or referenced from the appropriate archive location (per Document Taxonomy). Trackers are trimmed of week-specific narrative that's now in the archive.

**Verification:** Agent Memory Steward audit after a review run.

**Demo blocker:** no

**Status:** unknown

**Last checked:** 2026-04-24

---

### CR-weekly-review-05: Memory state stays coherent across the cross-skill boundary

**Behavior:** What weekly-review writes to memory does not contradict what daily-review wrote during the week. Goal status, project state, and active priorities reconcile cleanly.

**Verification:** Agent Memory Steward cross-skill contradiction check.

**Demo blocker:** yes (a contradiction here would show up in the next daily brief, breaking the demo)

**Status:** unknown

**Last checked:** 2026-04-24

---

*Add criteria as the flow takes shape.*
