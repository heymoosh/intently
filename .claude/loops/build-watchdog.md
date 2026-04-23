---
name: Build Watchdog
type: loop
invocation: auto-scheduled via launchd every 30 min during 07:30–22:30 local
priority: P0 (MVP-10 #5)
owner: muxin
---

# Build Watchdog

## Purpose

Fast local feedback while editing. Catches the cheap stuff (lint errors, type errors, broken imports, failing unit tests) within 30 minutes of introducing them, instead of overnight when context is gone.

## Cadence

`/loop 30m <prompt below>`

Run only during active coding sessions. Stop the loop when you're not editing — it has nothing useful to do.

## Loop prompt

```
Run lint, typecheck, unit tests, and build. Use the exact commands from
CLAUDE.md.

If everything passes and nothing has changed since the last run, output
nothing. Tight loops are silent loops.

If something fails:
1. Group errors by likely root cause, not by raw output. "Three test
   failures all from the same broken import" is one cluster, not three.
2. Identify the smallest safe fix for each cluster.
3. If confidence is high (typo, obvious import path, missing await),
   apply the fix.
4. If confidence is low, summarize the failure and what would need to
   be checked to fix it.

If commands or setup assumptions changed (new dep installed, new lint
rule, build command changed), update CLAUDE.md to match.

Do not propose refactors. Do not add tests beyond what's needed to fix
a failure. Stay scoped to making the build green.
```

## Stack-dependent behavior

Until the stack is chosen (post-Thursday Apr 23), this loop has no commands to run. Either:
- Skip the loop until `ci.yml` and CLAUDE.md required-commands section are wired, or
- Run with a degenerate brief: "Verify all markdown files in docs/ have valid frontmatter and parse cleanly. Output nothing if all pass."

## Edge cases

- **Pre-commit hook redundancy.** If a pre-commit hook already runs lint+typecheck, this loop should still run because pre-commit only fires on commit, not on edit. The loop catches errors between commits.
- **Long-running test suites.** If a full unit run takes >60s, scope the loop to changed files only. Full suite runs at commit time via CI.
- **Network-dependent builds.** If the build needs a network call, cache aggressively and run offline-first when possible.

## Notes

- Token cost: cheap if the loop is silent, expensive if it's chatty. The "output nothing on green" rule is load-bearing.
- This is the only MVP loop with no AI judgment in the happy path — it's mostly running deterministic commands. The Claude part is the failure-clustering and root-cause guess.
