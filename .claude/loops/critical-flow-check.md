---
name: Critical Flow Check
type: loop
invocation: auto-scheduled via launchd every 30 min during 07:30–22:30 local
priority: P0 (MVP-10 #6)
owner: muxin
---

# Critical Flow Check

## Purpose

Keeps the three demo flows healthy while you're working on anything else. The submission is judged on whether the demo holds up. If you spend a day refactoring agent memory and the morning brief silently broke, you find out at the next demo cut — too late.

## Cadence

`/loop 30m <prompt below>`

Run during active coding sessions when changes touch any of:
- Skill definitions (daily-brief, daily-review, weekly-review)
- Agent memory schema or storage
- Managed agent integration code
- The mobile UI rendering of these flows

Skip when working on isolated areas that can't affect the demo flows.

## Loop prompt

```
Re-verify the three demo flows against acceptance criteria in
docs/product/acceptance-criteria/:

1. Daily brief — morning orientation produces a coherent narrative,
   references prior context, surfaces patterns rather than raw retrieval.
2. Daily review — end-of-day reflection wraps the day, updates state,
   reads as insight rather than checklist.
3. Weekly review — surfaces incomplete goals, scores the week, aligns
   next week with monthly priorities.

For each flow, mark each acceptance criterion: pass, partial, fail, unknown.

If everything passes and nothing changed since last run, output nothing.

If any step regressed since the last run, identify:
- Which commit likely caused it (git log + diff)
- The smallest code or test change to restore it
- Whether the regression is a real behavior change or a test fragility issue

For real regressions, apply the fix if confidence is high. Otherwise
surface the regression with the diagnostic above.
```

## Stack-dependent behavior

Until the demo flows have running implementations, this loop runs against the spec only — comparing acceptance criteria to "does the code path exist that would satisfy this?" Useful for catching missing scaffolding early.

## Edge cases

- **Acceptance criteria not yet authored.** Run anyway and flag the gap. Drives the criteria-authoring work into the active session.
- **Flow runs as a managed agent (slow).** A managed agent invocation can take minutes. Don't run all three flows on every loop tick — rotate (one flow per tick) or run a fast surrogate (skill-internal unit test) per tick and the full flow before each demo cut.
- **Manual-only criteria.** Some criteria ("does the brief feel oriented?") need a human. Mark as `unknown` until a manual check is logged.

## Notes

- This loop and Spec Conformance Steward overlap deliberately. The loop is fast and scoped to the three demo flows; the steward is comprehensive and runs nightly. The loop catches regressions inside the session; the steward catches the broader picture overnight.
- If the loop fires too often without finding anything, drop to 60m. If it misses regressions, drop to 20m.
