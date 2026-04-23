---
name: Criteria Sync Loop
type: loop
invocation: auto-scheduled via launchd every 2 hours during 07:30-22:30 local
priority: P0 (MVP-10 #10)
owner: muxin
auto-fix: report-only (criteria files are immutable during build — CLAUDE.md § Acceptance criteria authoring rule)
---

# Criteria Sync Loop

## Purpose

The Spec Conformance Steward's task 7 (fidelity audit) catches criterion↔spec drift at 02:13 nightly. That's a 24-hour window in which a spec edit or an agent-code edit can silently diverge from its criterion. On an active hackathon day with multiple spec touches and skill edits, 24h is too long — by morning the drift has compounded.

This loop runs every 2 hours during work hours (07:30–22:30 local) and does the same fidelity audit, faster and narrower. Silent when no drift.

The loop cannot fix drift (that would be gaming — only the spec can initiate re-derivation per the authoring rule). Its job is to flag fast so Muxin can kick off the proper spec-edit → criterion-re-derive PR workflow.

## Cadence

Every 2 hours during work hours (07:30–22:30 local), via launchd (`StartInterval 7200` + time-window gate in the wrapper). 8 fires per work day.

Off-hours: silent. Nightly Spec Conformance Steward covers that window.

## Inputs

- `$REPO/docs/product/acceptance-criteria/*.md` — every criterion file
- `$REPO/docs/product/requirements/life-ops-plugin-spec.md` — the spec
- `git log --since='<last run>'` — criteria + spec + agents/ commits since the prior run
- Previous loop report if any: `$REPO/routine-output/criteria-sync-*.md`

## Output

- If drift found: `$REPO/routine-output/criteria-sync-<YYYY-MM-DD>-<HHMM>.md`
- If clean: a one-line note in the log, no output file. Silent loops are correct loops.

## Loop prompt

```
Run the Criteria Sync fidelity audit.

Tasks:
1. For each file in docs/product/acceptance-criteria/ (excluding README.md):
   - Find the spec section referenced by the file's "Spec source" frontmatter.
   - Compare each criterion's Behavior field to the spec section's language.
   - Flag narrowing (criterion now asks less than the spec), drift (criterion
     asks something different), or staleness (spec changed since the
     criterion was authored).
2. Check git log for commits in the last 2h that touched BOTH a criterion
   file and an agents/ path in the same commit. That is a HIGH finding
   regardless of content — the authoring rule forbids it.
3. Compare behavior fields against the most recent agents/<skill>/SKILL.md.
   If the SKILL.md has explicit contracts that don't match the criterion,
   flag as MEDIUM — the criterion may need re-derivation once the spec
   catches up.

Severity:
- HIGH: criterion edited in same commit as implementation; criterion
  narrowed relative to spec; spec has moved and criterion hasn't.
- MEDIUM: SKILL.md contract no longer matches criterion; wording drift
  without clear narrowing.
- LOW: typo or formatting drift.

If no findings, write a one-line note to $LOG (the wrapper handles this)
and exit 0 without writing an output file.

If findings:
- Write to routine-output/criteria-sync-<date>-<hhmm>.md.
- Do NOT edit any criterion file. Do NOT open a PR. Surface findings only.
- For HIGH findings, also suggest the spec update needed + the re-derivation
  command (/derive-criteria <skill>).
```

## Edge cases

- **Spec not touched, no agents/ activity.** Exit silently.
- **A criterion is intentionally broader than the spec.** Rare. Should be flagged as MEDIUM; Muxin confirms or corrects. Not HIGH because not obviously gaming.
- **A criterion with no matching spec section.** HIGH — criterion orphaned. Recommend deriving a spec section first.
- **New skill added to `agents/` with no criterion file.** Pre-commit hook should have caught this. If it's there anyway, HIGH + recommend running `/derive-criteria <skill>`. EXCEPTION: if the skill is listed in `docs/backlog/deferred-features.md` (§ Deferred Skills), the finding flips to "unexpected active scope for deferred skill" — recommend either un-deferring (spec edit) or removing the folder.

## Notes

- Model: Sonnet 4.6, effort medium. Fidelity comparison with some judgment.
- Token cost: ~$0.05–0.15 per run. 8 fires × ~$0.10 = ~$0.80/day.
- Pairs with Spec Conformance Steward's task 7 — same check, faster cadence.
- Cannot auto-fix. Findings are report-only by design. See `docs/process/acceptance-criteria.md`.
