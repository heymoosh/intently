# Release

Output reports from routines (Spec Conformance Steward, Privacy Steward, Agent Memory Steward, Release Readiness Steward) plus release-related docs (changelog, migration notes, demo cut notes).

## File patterns

```
release/
├── README.md                            # this file
├── spec-conformance-<YYYY-MM-DD>.md     # Spec Conformance Steward output
├── privacy-<YYYY-MM-DD>.md              # Privacy Steward output
├── memory-health-<YYYY-MM-DD>.md        # Agent Memory Steward output
├── release-readiness-<YYYY-MM-DD>.md    # Release Readiness Steward output (last 2 days)
├── demo-cut-<NN>-<YYYY-MM-DD>.md        # notes on each demo cut (cut #1, #2, final)
├── CHANGELOG.md                         # added when first release ships
└── release-checklist.md                 # added Apr 25 alongside release-gate workflow
```

## Append-only

Steward reports are append-only (one file per run, dated). Don't overwrite or trim them — they're the historical record of what was true on a given day, and they're the input for trend analysis (e.g., "is the privacy steward finding more or fewer issues over time?").

## Demo cut notes

For each demo cut leading to submission:

```markdown
# Demo Cut <NN> — <YYYY-MM-DD>

**Cut decision:** ship | hold | redo
**Decider:** muxin

## Pre-cut sweep results
- Spec conformance: <link to report> — blockers? Y/N
- Privacy: <link to report> — blockers? Y/N
- AI eval batch: <link to report> — regressions? Y/N
- Agent memory: <link to report> — drift? Y/N

## What's in this cut
<bulleted list of features/flows deemed demo-ready>

## Known caveats
<things that are imperfect but acceptable>

## Decision rationale
<why ship now vs hold>
```

## Pre-submission checklist

Authored Apr 25. Will mirror the release gates from the operating manual plus submission-specific requirements (3-min video, repo public, written summary, managed-agents writeup).
