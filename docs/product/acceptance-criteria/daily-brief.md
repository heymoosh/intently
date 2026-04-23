# Acceptance Criteria — Daily Brief

**Flow:** Daily Brief (morning orientation managed agent + mobile rendering)
**Demo position:** Opens the demo (per `docs/design/app-experience.md` and Demo Script).
**Spec source:** `docs/product/requirements/life-ops-plugin-spec.md` — "Daily brief" section.

---

*This file is the scaffolded structure. Criteria are filled in during build sessions as the flow takes shape; the Spec Conformance Steward will surface unknowns and gaps.*

---

### CR-daily-brief-01: Brief is ready before user opens the app

**Behavior:** The morning brief has been produced by a scheduled managed agent before the user opens the app at their typical morning time. The user does not wait for generation on first open.

**Verification:** TBD — likely a managed-agent invocation timestamp check + an E2E test that opens the app and confirms cached content renders without an in-flight call.

**Demo blocker:** yes

**Status:** unknown

**Last checked:** 2026-04-22

---

### CR-daily-brief-02: Brief references prior context, not just today's calendar

**Behavior:** The brief includes references to prior interactions (yesterday's debrief, recent calls, earlier tracker state) — not just today's calendar entries. This is the "memory working" signal that the demo is built around.

**Verification:** AI eval rubric scoring relevance and memory-use; manual demo runs.

**Demo blocker:** yes

**Status:** unknown

**Last checked:** 2026-04-22

---

### CR-daily-brief-03: Brief surfaces patterns across time, not just retrieval

**Behavior:** Surfaces patterns and themes already extracted by the weekly review into `Weekly Goals.md` — does not independently detect or synthesize cross-session patterns. When the "Review of Last Week" section of Weekly Goals.md contains pattern observations, the brief surfaces them as context for the day. If that section is absent, no pattern comment is made.

**Verification:** AI eval rubric confirms the brief surfaces content already present in Weekly Goals.md rather than synthesizing its own cross-session patterns; manual review against held-out cases verifies no independently invented patterns.

**Demo blocker:** yes (this is the Opus 4.7 showcase moment)

**Status:** unknown

**Last checked:** 2026-04-22

---

### CR-daily-brief-04: Brief reads as narrative, not as a checklist

**Behavior:** Output is paragraphs, not bullet lists. Tone matches Muxin's voice (direct, low-formality). No bureaucratic templating.

**Verification:** AI eval rubric scoring tone/format; manual review.

**Demo blocker:** yes

**Status:** unknown

**Last checked:** 2026-04-22

---

### CR-daily-brief-05: Brief renders within latency budget

**Behavior:** From app open to brief fully rendered: under the budget defined in `docs/design/app-experience.md`. (If unset, default budget is 2 seconds since the brief is pre-generated.)

**Verification:** E2E test with timing assertion.

**Demo blocker:** yes

**Status:** unknown

**Last checked:** 2026-04-22

---

### CR-daily-brief-06: Brief degrades gracefully when memory is empty

**Behavior:** First-ever brief (no prior context) renders coherently rather than failing or producing a confusing empty-state. Acknowledges the cold start without being apologetic.

**Verification:** E2E test with empty memory state.

**Demo blocker:** no (won't surface in the demo, but matters for new users post-launch)

**Status:** unknown

**Last checked:** 2026-04-22

---

*Add criteria as the flow takes shape. Each new criterion follows the structure in `README.md`.*
