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

The web prototype (`web/*.jsx`, JSX-via-Babel-standalone, no bundler) is the
deploy surface. ESLint config at `eslint.config.mjs` covers it; `npm run lint`
runs `eslint web/**/*.jsx --max-warnings=0`. The lint catches stub handlers
(`onClick={() => {}}`, `onEdit={() => {}}`), undefined JSX components
(`react/jsx-no-undef`), and dead destructures (`no-unused-vars`).

Out of scope for this loop:
- `app/` (Expo + RN-Web, historical reference per ADR 0004) — not linted.
- `supabase/functions/*.ts` (Deno runtime) — not linted; separate effort if needed.
- TypeScript typecheck of `web/*.jsx` — files are JSX-via-Babel, no `tsc` coverage.
- Unit tests — `tests/` is README-only; `npm test` is not wired.

When you add new cross-file globals via `Object.assign(window, { … })`, also
add them to `PROTOTYPE_GLOBALS` in `eslint.config.mjs`, otherwise
`react/jsx-no-undef` will flag every consumer site.

### Zero-coverage self-check (deferred)

The loop should ideally fail loud (`ZERO-COVERAGE WARNING`) if the lint
matches zero files — that's the failure mode that put the watchdog to sleep
in the first place. Implementing this requires modifying the launchd-invoked
shell wrapper (not just this Markdown spec). **Follow-up:** add a
`scripts/build-watchdog.sh` that wraps `npm run lint` and asserts ESLint
reports `>=1` file processed (`eslint --print-config web/intently-reading.jsx`
exits 0) before declaring "OK shell green".

## Edge cases

- **Pre-commit hook redundancy.** If a pre-commit hook already runs lint+typecheck, this loop should still run because pre-commit only fires on commit, not on edit. The loop catches errors between commits.
- **Long-running test suites.** If a full unit run takes >60s, scope the loop to changed files only. Full suite runs at commit time via CI.
- **Network-dependent builds.** If the build needs a network call, cache aggressively and run offline-first when possible.

## Notes

- Token cost: cheap if the loop is silent, expensive if it's chatty. The "output nothing on green" rule is load-bearing.
- This is the only MVP loop with no AI judgment in the happy path — it's mostly running deterministic commands. The Claude part is the failure-clustering and root-cause guess.
