# Acceptance Criteria — Update Tracker

**Flow:** Update Tracker — Universal Logger (project progress logging + Command Center sync)
**Demo position:** Non-demo skill (checked but not one of the three submission-critical flows; `update-tracker` appears in the AI Eval Batch Steward brief as scored-but-not-demo-weighted).
**Spec source:** `docs/product/requirements/life-ops-plugin-spec.md` — "Update Tracker (Universal Logger)" section (line 662).

---

*Derived from spec on 2026-04-22 via /derive-criteria. Behavior fields copy spec language verbatim and do not change during build. Status/Last checked update as verification lands.*

---

### CR-update-tracker-01: Reads the Ops Plan to find projects and their trackers

**Behavior:** Step 1 — read the Command Center. The Ops Plan lists every active project, its status, next action, and which tracker file it points to. `update-tracker` reads the Ops Plan to identify candidate projects before matching the user's input.

**Verification:** TBD — unit test on the Ops Plan reader; fixture-based test confirming the agent's project list matches the Ops Plan tables.

**Demo blocker:** no

**Status:** unknown

**Last checked:** 2026-04-24

---

### CR-update-tracker-02: Matches user utterance to a project, asks when ambiguous

**Behavior:** Step 2 — figure out what was worked on. Match what the user said ("update tracker", "log this", "I worked on X") to projects in the Command Center. If ambiguous, ask.

**Verification:** TBD — E2E test with clear-match and ambiguous inputs; verifies the ambiguous path surfaces a disambiguation prompt instead of writing.

**Demo blocker:** no

**Status:** unknown

**Last checked:** 2026-04-24

---

### CR-update-tracker-03: Updates the relevant tracker(s) within the existing layout

**Behavior:** Step 3 — update the relevant tracker(s): check off completed items, update status text if a phase changed, add completion dates, note new blockers or cleared blockers. **Do NOT reorganize the tracker — update within the existing layout.**

**Verification:** TBD — before/after fixture test on a canonical Tracker.md; diff verifies only the expected fields changed and layout is preserved.

**Demo blocker:** no

**Status:** unknown

**Last checked:** 2026-04-24

---

### CR-update-tracker-04: Syncs the Command Center dashboard line for the updated project

**Behavior:** Step 4 — sync the Command Center. Update the corresponding line in the Ops Plan dashboard: status indicator (🔴🟡🟢⚪) if the project's state changed, "Status" text, "Next Action", and "Last updated" date.

**Verification:** TBD — before/after fixture test on Ops Plan; confirms the matching row is updated and other rows unchanged.

**Demo blocker:** no

**Status:** unknown

**Last checked:** 2026-04-24

---

### CR-update-tracker-05: Confirms the update conversationally and briefly

**Behavior:** Step 5 — confirm. A brief, conversational confirmation of what was updated.

**Verification:** TBD — AI eval rubric scoring tone (brief, conversational) and content accuracy (names the updated project + the fields changed).

**Demo blocker:** no

**Status:** unknown

**Last checked:** 2026-04-24

---

### CR-update-tracker-06: Scope discipline — updates only, no project work or planning

**Behavior:** **Important:** This skill only updates trackers and the Command Center. It doesn't do project work or planning.

**Verification:** TBD — AI eval rubric with held-out inputs that invite the agent to plan or advise; verifies the agent declines and returns to its update scope.

**Demo blocker:** no

**Status:** unknown

**Last checked:** 2026-04-24
