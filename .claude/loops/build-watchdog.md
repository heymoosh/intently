---
name: Build Watchdog
type: loop
invocation: auto-scheduled via launchd every 30 min, 24/7 (per Muxin 2026-04-25 — was 07:30-22:30 originally)
priority: P0 (MVP-10 #5)
owner: muxin
---

# Build Watchdog

## Purpose

Fast local feedback while editing. Catches the cheap stuff (lint errors, type errors, broken imports, failing unit tests) within 30 minutes of introducing them, instead of overnight when context is gone.

## Cadence

Every 30 minutes, 24/7, via launchd (`StartInterval 1800` in `com.intently.build-watchdog.plist`). The wrapper script `~/.intently/bin/intently-routine.sh` (NOT tracked in repo — see follow-ups) runs `npm ci` + `npm run lint` + (optional) `tsc --noEmit` + `npm test --passWithNoTests` from `$REPO`. Silent on green; AI-led failure analysis on red.

Original 07:30-22:30 day-window framing was relaxed 2026-04-25 — overnight sub-agent execution wave benefits from continuous lint coverage so issues are caught between iterations, not at next-morning-batch.

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

## Current scope (2026-04-25)

ESLint covers `web/*.jsx` only (the deployed prototype). Config at repo-root `eslint.config.mjs` (PR #159). Rule choices documented in the config's leading comment.

Out of scope:
- `app/` (Expo + RN-Web, historical reference per ADR 0004) — separate config if/when revived.
- `supabase/functions/` (TypeScript on Deno runtime) — separate effort if needed.
- TypeScript typecheck — there is no `tsconfig.json` at root; the wrapper script skips `tsc` when missing. Add a config + `typecheck:web` script when JSDoc-typed JSX becomes a thing we care about.
- Test suite — `tests/` is README-only; the wrapper passes `--if-present` + `--passWithNoTests` so the absence is silent.

## Known follow-up (wrapper not versioned)

`~/.intently/bin/intently-routine.sh` is the script launchd invokes for every routine including this one. It's not tracked in the repo. Changes to it (e.g., the 24/7 schedule, the path-repointing from `app/` to repo root) are made on the local file and aren't visible to other developers or rebuildable from a fresh clone. Follow-up: move the wrapper into the repo (e.g., `scripts/intently-routine.sh`) and have the launchd plist invoke it from there.

## Edge cases

- **Pre-commit hook redundancy.** If a pre-commit hook already runs lint+typecheck, this loop should still run because pre-commit only fires on commit, not on edit. The loop catches errors between commits.
- **Long-running test suites.** If a full unit run takes >60s, scope the loop to changed files only. Full suite runs at commit time via CI.
- **Network-dependent builds.** If the build needs a network call, cache aggressively and run offline-first when possible.

## Notes

- Token cost: cheap if the loop is silent, expensive if it's chatty. The "output nothing on green" rule is load-bearing.
- This is the only MVP loop with no AI judgment in the happy path — it's mostly running deterministic commands. The Claude part is the failure-clustering and root-cause guess.
