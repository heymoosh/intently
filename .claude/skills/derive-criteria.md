---
name: derive-criteria
description: Generate docs/product/acceptance-criteria/<skill>.md from the Life Ops spec before any implementation code is written. Invoke at the start of a new skill build. Prevents retroactive criterion-fitting. Usage - /derive-criteria daily-brief
---

# /derive-criteria `<skill>`

**Purpose:** produce the acceptance-criteria file for a new skill, derived verbatim from `docs/product/requirements/life-ops-plugin-spec.md`, before any implementation code is written. Enforces the anti-gaming rule in `docs/process/acceptance-criteria.md` (pointer: CLAUDE.md § "Acceptance criteria authoring rule").

**When to use:**
- Starting work on a skill that has no criterion file (e.g., `monthly-review`, `update-tracker`, a post-hackathon new skill).
- Invoked first, before any `agents/<skill>/` code lands.

**When NOT to use:**
- The criterion file already exists with content. Editing an existing criterion's `Behavior` field during build is forbidden — see `docs/process/acceptance-criteria.md` § "Edits during build." If the criterion is wrong, the spec must be updated first in a separate PR.
- As a post-hoc step after implementation already exists. That is exactly the gaming pattern this skill exists to prevent.

## Steps

1. **Parse argument.** `$ARGUMENTS` is the skill name in kebab-case (e.g., `monthly-review`). If missing or malformed, STOP and tell the user to re-invoke with the skill name.

2. **Check for existing file.** If `docs/product/acceptance-criteria/<skill>.md` exists and is non-empty (contains any `### CR-` lines), STOP. Output:
   > "A criterion file for `<skill>` already exists at `docs/product/acceptance-criteria/<skill>.md`. Editing the `Behavior` field of existing criteria during build is forbidden (see `docs/process/acceptance-criteria.md` § 'Edits during build'). If the criterion is wrong, update the spec first in a separate PR, then re-derive."

3. **Read the spec.** Open `docs/product/requirements/life-ops-plugin-spec.md`. Find the section that defines `<skill>`. If no section exists, STOP and tell the user the spec must be authored first — criteria cannot be derived from an absent source.

4. **Extract testable behaviors.** Read the spec section and identify 4–6 distinct testable behaviors that together express what the skill must do. Each behavior must:
   - Be directly stated (or directly implied) by spec language. Do not extrapolate.
   - Be independently verifiable (a single test, a single manual check, a single inspection).
   - Copy spec language verbatim where possible. Paraphrasing introduces drift.

5. **Check the template.** Read `docs/product/acceptance-criteria/daily-brief.md` to see the exact scaffold shape currently in use. Mirror it.

6. **Generate the criterion file** at `docs/product/acceptance-criteria/<skill>.md` with this structure:

   ```markdown
   # Acceptance Criteria — <Skill Display Name>

   **Flow:** <one-line description pulled from spec>
   **Demo position:** <if one of daily-brief/daily-review/weekly-review, note position in demo; otherwise "Non-demo skill">
   **Spec source:** `docs/product/requirements/life-ops-plugin-spec.md` — "<exact section heading>" section.

   ---

   *Derived from spec on <YYYY-MM-DD> via /derive-criteria. Behavior fields copy spec language verbatim and do not change during build. Status/Last checked update as verification lands.*

   ---

   ### CR-<skill>-01: <short imperative title>

   **Behavior:** <verbatim or near-verbatim spec language describing what must happen>

   **Verification:** TBD — <one-line note on what kind of evidence would satisfy this: E2E test, managed-agent invocation check, manual inspection, etc.>

   **Demo blocker:** <yes if demo-critical flow, no otherwise>

   **Status:** unknown

   **Last checked:** never

   ---

   <... repeat for each criterion ...>
   ```

7. **Report back.** Output:
   - Path to the written file.
   - Number of criteria generated.
   - Any spec ambiguities you flagged as `TBD` in Verification (so the user can address them when authoring tests).
   - Reminder: commit this file in its own PR before starting implementation.

## Constraints

- **Never fabricate behaviors the spec doesn't state.** If the spec is thin, the criterion file is thin. Thin is better than invented.
- **Never fill in `Verification`.** That's a test-authoring decision made later; leaving it `TBD` is correct.
- **Never set `Status: pass` or `partial`.** Criteria start `unknown`. Status is updated only after verification runs.
- **Never combine this with an implementation edit in the same commit.** The whole point is separation.
- **Never run this to "refresh" existing criteria.** If existing criteria need updating, that's a spec change → separate PR → re-derive, not a quiet rewrite.

## Related

- `docs/process/acceptance-criteria.md` — the governing policy (pointer in CLAUDE.md § "Acceptance criteria authoring rule").
- `.claude/routines/spec-conformance-steward.md` task 7 — nightly fidelity audit that flags drift between criteria and spec.
- `.githooks/pre-commit` — local backstop that blocks committing implementation code without a criterion file.
