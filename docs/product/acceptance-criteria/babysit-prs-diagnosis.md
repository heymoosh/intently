# Acceptance Criteria — Babysit-prs diagnosis + decision

**Topic:** Diagnose what the 1900 inbox flagged about babysit-prs ("have issues") and decide fix-or-remove.
**Source capture:** `git show 0df181f:.claude/inbox/2026-04-25T1900-babysit-prs-watchdog-issues.md`. The build-watchdog half of that inbox was diagnosed and routed to its own AC (`build-watchdog-teeth.md`); this AC handles the babysit-prs half.

## Goal

A clear written answer to: "What's wrong with babysit-prs, and is it worth fixing?" Either a fix lands, or the loop is removed cleanly.

## Background

The 2026-04-25 1900 capture noted that "babysit-prs and build-watchdog have issues" but the underlying issues were not diagnosed in that session. CronList + TaskList were both empty at the time. Build-watchdog's diagnosis was completed in this session (see `build-watchdog-teeth.md`); babysit-prs remains undiagnosed.

`.claude/loops/babysit-prs.md` exists. `launchctl list` showed `com.intently.babysit-prs` loaded. Whether it actually does useful work, on what cadence, against what — unknown.

## Acceptance criteria

### Diagnosis

- [ ] **CR-01** Read `.claude/loops/babysit-prs.md`; document the loop's stated purpose and intended cadence in the PR description.
- [ ] **CR-02** Inspect `~/.intently/logs/babysit-prs*.log` (and any equivalent paths). Document the actual run history: when has it run, what did it do, what errors are present.
- [ ] **CR-03** Inspect `launchctl list | grep babysit-prs` and the relevant `.plist` file at `.claude/launchd/plists/com.intently.babysit-prs.plist`. Document configured schedule, last exit code, last invocation time.
- [ ] **CR-04** Identify specific symptoms that match what 1900 flagged. Document them.

### Decision

- [ ] **CR-05** Choose one path: **fix** or **remove**. Document the rationale. Either path requires AC for the chosen path:
  - **If fix:** sub-AC enumerates what the fix is, what verifies it works, what the loop now does that it didn't before. May require a new AC file or expansion of this one.
  - **If remove:** sub-AC enumerates what gets removed (`.claude/loops/babysit-prs.md`, `.plist`, log paths, references in `TRACKER.md` / `CLAUDE.md` / `launch-plan.md` / handoffs / sibling specs). Removal is clean — no orphan references.

### Cleanup either way

- [ ] **CR-06** TRACKER § Next #7 entry is updated with the decision + outcome reference.
- [ ] **CR-07** `1900` inbox capture (already deleted in groom commit) is referenced in this PR's body so the audit trail closes cleanly.

## Verification methods

| CR | How to verify |
|---|---|
| CR-01 | PR description includes a quoted summary of the loop's purpose and cadence per the spec doc. |
| CR-02 | PR description includes a `tail -30` (or similar) excerpt of the actual log. |
| CR-03 | PR description includes the `launchctl list` line for babysit-prs and the `.plist` schedule fields (Hour, Minute, etc.). |
| CR-04 | PR description names specific symptoms — not just "it has issues." |
| CR-05 | PR includes the decision + rationale in the description. The diff matches the path. |
| CR-06 | TRACKER § Next #7 reflects the resolution. |
| CR-07 | PR body references the 1900 capture by commit hash + path. |

## Out of scope

- Build-watchdog work (separate AC at `build-watchdog-teeth.md`).
- Adding new background loops.

## Sub-agent contract

When dispatched, your final response MUST include the AC checklist above with ✅/❌ + one-line evidence per criterion. If any criterion is ❌, surface the blocker — do NOT declare done. The orchestrator will verify against the actual diff before merging.

**Note:** this is a diagnose-then-decide task. The "code change" may be small (just docs + maybe deleting some files) but the *thinking* recorded in the PR description is the durable artifact. Lean toward more written context, not less.
