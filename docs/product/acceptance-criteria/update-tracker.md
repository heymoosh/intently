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

---

## Post-cognition supabase wiring (2026-04-25)

**Context:** The CR-update-tracker-01 through ~CR-13 above were derived from the spec on 2026-04-22 when the state-of-truth was Markdown files (`Ops Plan.md`, `Tracker.md`, etc.). Post-cognition push (#136–#152), state-of-truth moved to Supabase rows per ADR 0001. The agent's prompt and behavior expectations are being re-anchored on Supabase. The original CRs above remain valid in *intent* but their *verification* needs to be re-stated against the Supabase model.

The CRs below add the wiring requirements to make `update-tracker` operational against Supabase. They DO NOT supersede the original CRs; they extend them.

**Source capture:** `git show 0df181f:.claude/inbox/2026-04-25T2134-update-tracker-wiring.md`.
**Decision locked 2026-04-25:** option 1 (re-prompt to read/write Supabase) over option 2 (bridge via fake Markdown). Reason: no real benefit to Markdown-reading exists post-cognition; bridge would have the agent emit text claiming it updated files that don't exist.

### CR-update-tracker-supabase-wiring-01: Agent prompt rewritten for Supabase

**Behavior:** `agents/update-tracker/SKILL.md` and `agents/update-tracker/ma-agent-config.json` are rewritten so the agent reads/writes Supabase tables instead of Markdown vault files. The agent's instructions reference `goals`, `projects` (with `todos` JSONB), `entries`, `plan_items` — not `Ops Plan.md`, `Tracker.md`, `Strategy.md`, `life-ops-config.md`.

**Verification:** Read the new prompt; confirm zero references to Markdown vault files. Confirm structured tool-use or output format that maps to Supabase row operations.

**Demo blocker:** no

### CR-update-tracker-supabase-wiring-02: Re-provisioned in MA console

**Behavior:** `scripts/provision-ma-agents.ts --skill update-tracker --update-existing` runs successfully. The deployed MA agent reflects the new prompt.

**Verification:** Re-run after the rewrite; confirm the deployed agent's `version` field bumps. Confirm a smoke call returns Supabase-shaped intent.

**Demo blocker:** no

### CR-update-tracker-supabase-wiring-03: At least one UI surface invokes the agent

**Behavior:** A UI surface in `web/` invokes `update-tracker` via `callMaProxy({ skill: 'update-tracker', input: ... })`. Suggested options (decide during execution):
- Voice-classifier branch in `web/lib/reminders.js`'s `classifyTranscript` that adds an `update_tracker` intent when the transcript matches "I finished / worked on / shipped" patterns
- Dedicated affordance on the project sheet ("Log work")
- Embedded in the chat thread when matching utterances appear

**Verification:** From the deployed app, trigger the wired surface with a representative input; confirm `callMaProxy` is invoked with `skill: 'update-tracker'` (network tab); confirm the agent response is rendered.

**Demo blocker:** no

### CR-update-tracker-supabase-wiring-04: Writes verifiably land in correct Supabase rows

**Behavior:** After a successful `update-tracker` invocation, the affected DB rows reflect the change. E.g., a "I finished the auth migration" utterance updates `projects.todos[i].done = true` for the matching todo, OR appends to `entries` with `kind='update'` (depending on how the agent's prompt specifies the write).

**Verification:** Inspect `projects.todos` / `entries` / `goals` rows in Supabase Studio after a smoke invocation; confirm the row reflects the agent's stated action.

**Demo blocker:** no

### CR-update-tracker-supabase-wiring-05: Eval cases authored

**Behavior:** `evals/datasets/update-tracker/cases.json` exists with at least one positive case (clear project-completion utterance → expected DB write) and one negative case (ambiguous/non-update utterance → no write expected).

**Verification:** File exists; eval run against deployed agent passes both cases.

**Demo blocker:** no

### Sub-agent contract

When dispatched, your final response MUST include CR-supabase-wiring-01 through 05 above with ✅/❌ + one-line evidence per criterion. If any criterion is ❌, surface the blocker — do NOT declare done. The orchestrator will verify against the actual diff + agent re-provisioning before merging. **Special:** CR-03 requires a UI design choice (voice-classifier branch vs dedicated affordance vs chat-embed) — make the call during implementation, document the choice in the PR description.
