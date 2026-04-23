# Acceptance Criteria

**Purpose:** per-flow criteria that the Spec Conformance Steward and the Critical Flow Check loop verify against.

**Source of truth they derive from:** `docs/product/requirements/life-ops-plugin-spec.md`. If the spec changes, criteria here must be re-derived. These files are not standalone — they are the *checkable* form of the spec.

## File-per-flow convention

One file per skill or major flow:

```
acceptance-criteria/
├── README.md                  # this file
├── daily-brief.md             # demo flow #1
├── daily-review.md            # demo flow #2
├── weekly-review.md           # demo flow #3
├── monthly-review.md          # supported, not demo-critical
└── update-tracker.md          # supported, not demo-critical
```

## Per-criterion structure

Every criterion has the same shape so the steward can parse it consistently:

```markdown
### CR-<flow>-<NN>: <short title>

**Behavior:** <one or two sentences describing the observable behavior>

**Verification:** <how this is checked — test name, manual procedure, or steward inspection>

**Demo blocker:** <yes | no>

**Status:** <pass | partial | fail | unknown>

**Last checked:** <YYYY-MM-DD or "never">

**Notes:** <optional — caveats, related criteria, known gaps>
```

`Status` and `Last checked` are updated by the Spec Conformance Steward, not by the spec author. Authors set everything else.

## Authoring guidance

- **One observable behavior per criterion.** "The brief loads" is too coarse. "The brief renders within 5 seconds of opening the app" is right-sized.
- **Verification must be concrete.** "Looks good" is not a verification. "E2E test `daily_brief_renders_within_budget` passes" is.
- **Mark demo blockers explicitly.** The three demo flows (daily-brief, daily-review, weekly-review) each need to identify which of their criteria are demo-blocking. Anything marked demo-blocker MUST be `pass` before submission.

## Cadence

Criteria are derived from the spec when:
- The spec changes
- A new flow ships
- A criterion turns out to be ambiguous in practice (the steward keeps marking it `unknown`)

Authoring happens during normal coding sessions, not on a schedule. The steward surfaces gaps; the human decides which to fill in.
