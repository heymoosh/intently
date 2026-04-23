---
name: Spec Conformance Steward
type: routine
execution: Claude Managed Agent
trigger: Nightly (cron) + manual dispatch before any demo cut
priority: P0 (MVP-10 #2)
owner: muxin
---

# Spec Conformance Steward

## Purpose

The hackathon submission is judged on whether the build actually matches the dogfooded Life Ops system, not whether code exists. This routine is the answer to "did we ship what we said we'd ship." It compares acceptance criteria to actual app behavior and produces a per-flow conformance table.

## Inputs

- `docs/product/requirements/life-ops-plugin-spec.md` — source of truth for feature behavior
- `docs/product/acceptance-criteria/` — derived per-flow acceptance criteria (one file per skill)
- Current app state: passing tests, build artifacts, recent commits, screenshots if available
- Optional: live agent transcripts from manual demo runs

## Output

- `docs/release/spec-conformance-<YYYY-MM-DD>.md`
- GitHub issues for each acceptance criterion marked `fail` or `unknown`

## System prompt

```
You are auditing whether the Intently build matches the Life Ops Plugin Spec.

Tasks:
1. List every shipped feature or flow touched since the last conformance report
   (use git log + the previous report).
2. For each, find the corresponding acceptance criteria in
   docs/product/acceptance-criteria/. If none exists, that is itself a finding —
   record it as "criteria missing" and propose what they should be.
   EXCEPTION: before flagging "criteria missing," check
   docs/backlog/deferred-features.md (§ Deferred Skills). Any skill listed there is deliberately
   out of V1 scope; skip silently, do not record as a finding. (If a deferred
   skill unexpectedly appears under agents/<skill>/, that IS a finding —
   "unexpected active scope for deferred skill" — because it signals scope
   creep; recommend either un-deferring via spec edit or removing the folder.)
3. Mark each criterion: pass, partial, fail, unknown.
   - pass: behavior verified by test or by direct inspection
   - partial: some sub-criteria pass, others don't
   - fail: behavior verified to not match
   - unknown: no evidence either way
4. For unknowns, specify what evidence is missing (a test, a screenshot, a log,
   a manual check). Don't mark something pass on optimism.
5. Special attention: the three demo flows (daily brief, daily review, weekly
   review) must all be pass — anything less is a demo blocker.
6. Produce a gap report with concrete next actions. Each gap must have an
   owner-actionable next step ("write E2E test for X", "fix Y", "manually
   verify Z").
7. Fidelity audit (anti-gaming). For each criterion, compare the `Behavior`
   field to the spec section it references. Flag any criterion whose wording
   has narrowed or drifted from the spec's intent — especially criteria that
   look retrofitted to match observed implementation (e.g., spec asks for
   "brief references prior context and surfaces patterns" and the criterion
   has quietly become "brief includes at least one calendar item"). Also
   check git history: a criterion whose `Behavior` field was edited in the
   same PR as implementation is a HIGH finding. Severity:
   - HIGH: Behavior narrowed/drifted from spec; Behavior edited in an
     implementation PR; criterion appears post-hoc authored to match code.
   - MEDIUM: wording clarification that preserves intent but was edited
     during build.
   - LOW: typo or formatting fix.

Output format:
- Per-flow conformance table (flow | criterion | status | evidence | next action)
- Demo blocker list (must be empty before submission)
- Suggested test additions where evidence is missing
- Fidelity findings (criterion | spec anchor | type of drift | severity | recommended correction)
```

## Edge cases

- **Acceptance criteria don't exist yet.** Early in the week, `docs/product/acceptance-criteria/` may be sparse. The steward should still run — its first job is to surface "no criteria for this flow" as a finding, which prompts authoring.
- **Spec changes mid-week.** If `life-ops-plugin-spec.md` changes, re-derive criteria; don't grandfather old ones. The steward should call out any stale criteria.
- **Manual-only verification.** Some criteria can only be checked manually (e.g., "the morning brief feels oriented"). Mark these as `unknown` until a manual check is logged in `docs/release/`.

## Notes

- Demo flows priority: daily brief > daily review > weekly review (in that order, because that's the order they appear in the demo arc).
- This routine does not need to run in CI. It is a synthesis routine that reads from CI artifacts; running it on every push is wasteful.
