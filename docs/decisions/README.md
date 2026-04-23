# Decisions

Architecture Decision Records (ADRs) for Intently. One file per non-obvious call.

## When to write an ADR

Write one when you're making a decision that:
- Has a real alternative that was considered and rejected
- Is hard to reverse later (e.g., schema choice, vendor lock-in, license selection)
- Future-you will not remember the reasoning for in 3 months

Don't write one for routine implementation details, naming choices, or anything that can be changed in an afternoon.

## Format

Filename: `NNNN-short-slug.md` (e.g., `0001-managed-agents-as-execution-backbone.md`).

```markdown
# NNNN — Title in active voice

**Status:** Proposed | Accepted | Superseded by NNNN
**Date:** YYYY-MM-DD
**Decider:** muxin

## Context

What's the situation that forced a decision?

## Decision

The choice made, in one or two sentences.

## Alternatives considered

What else was on the table and why each was rejected.

## Consequences

What gets easier? What gets harder? What does this lock us into?
```

## Existing decisions worth backfilling

These are already-made decisions that don't yet have ADRs. Backfill when there's time (low priority — the reasoning is captured in `Hackathon Restrictions.md` and `agent-memory.md`):

- MIT license over AGPL/Apache-2.0
- Honcho deferred to post-launch
- Hindsight in for V1
- Managed Agents as execution backbone
- Bitwarden Secrets Manager as the only secrets store
- Single-user V1 (multi-user post-hackathon)
