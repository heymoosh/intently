# Parallel Tracks Workflow

**What it is:** a system for running several Claude Code sessions in parallel, each on its own bounded task, with git + PR + merge mechanics automated. User opens new terminals, names tasks, and reviews only what's flagged — no manual worktree/branch/PR management.

**When to use it:** multi-hour work where serialization (one session → merge → next session) is too slow. Not needed for single-task sessions.

## Three pieces

1. **`scripts/intently-track.sh`** — one command that spawns a worktree + branch + Claude session for a named task.
2. **`.github/workflows/ci.yml` + updated `auto-merge-safe.yml`** — deterministic gates that auto-merge PRs on green checks.
3. **`.claude/loops/babysit-prs.md`** — a recurring Claude loop that handles the cases workflows can't (rebase chains, merge conflicts, stalled PRs, semantic escalation).

## The flow

### Starting a track

```bash
intently-track daily-brief-impl "Wire the daily-brief agent to call the real Managed Agents SDK, replacing the stub executor."
```

- Creates `~/wt/daily-brief-impl`
- Branches `feat/track-daily-brief-impl` from fresh `origin/main`
- cds in and launches Claude with the prompt

Claude works, commits, pushes. A PR opens (either Claude opens it, or you push and open it).

### What happens to the PR

- **`security.yml`** runs → gitleaks check. Always runs.
- **`ci.yml`** runs → `npm run typecheck && npm run test:unit` in `app/`. Runs on PRs touching code.
- **`auto-merge-safe.yml`** fires after either workflow completes:
  - **Mechanical files only** (`routine-output/`, `TRACKER.md`) → auto-merge on security green.
  - **Docs/config only** (`docs/**`, `CLAUDE.md`, etc.) → flip ready-for-review, add `needs-user-review` label.
  - **Any code** (`agents/**`, `app/**`, `supabase/**`, `tests/**`, `evals/{datasets,rubrics,baselines,runner}/**`, `scripts/**`, `.githooks/**`, `.github/workflows/**`) → auto-merge only when BOTH security AND ci are green.
- **Any PR labeled `needs-user-review`** → skipped entirely by the workflow. Only the user removes that label.

### What the babysit-prs loop does

Every 15 min (during 07:30–22:30 local), the loop:

- Rebases stacked `feat/track-*` branches onto `origin/main` after an upstream merge.
- Resolves mechanical merge conflicts (whitespace, rename, reorder, additive non-overlap) and force-pushes with lease.
- Flags semantic conflicts (intent divergence) by adding `needs-user-review` with a specific question in a comment.
- Comments once on PRs whose CI keeps failing with the same error for >2h.
- Removes worktrees at `~/wt/<slug>` once the corresponding PR is merged and the worktree is clean.
- Writes a report to `.claude/routine-output/babysit-prs-<date>-<time>.md` when it acts.

### Cleanup

When a `feat/track-*` PR merges:
- The branch is auto-deleted (via `gh pr merge --delete-branch`).
- The worktree is removed by babysit-prs if clean.
- If the worktree has uncommitted changes when the PR merges (rare — you committed and pushed, right?), babysit leaves the worktree alone. Run `intently-track --clean <slug>` when you're done.

## Escape hatches

### Stop auto-merge for a specific PR

Add the `needs-user-review` label:

```bash
gh pr edit <PR#> --add-label needs-user-review
```

The workflow and the babysit loop both respect it. Only you can remove it.

### Stop auto-merge for a whole track

Don't push. No push = no PR trigger = no merge.

### Stop the babysit loop

Running as a session-only `/loop`: close the Claude Code session that started it.

Running inline as part of the overnight build loop (current default per `.claude/handoffs/overnight-build-loops.md`): stop the overnight build loop. There is no standalone launchd schedule — the prior promotion to `~/Library/LaunchAgents/com.intently.babysit-prs.plist` was decommissioned 2026-04-25 per ADR 0007 (60+ no-op invocations/day; inline-hourly inside the overnight loop is sufficient).

## Setup (one-time)

```bash
# Make the track script executable (run from the repo root).
chmod +x scripts/intently-track.sh

# Optional: symlink into a PATH directory so you can type `intently-track` directly.
ln -s "$(pwd)/scripts/intently-track.sh" /usr/local/bin/intently-track
```

(After merge. Until then, call via the full path.)

## What this doesn't solve

- **Breaking schema changes across tracks.** If track A renames a Supabase column and track B queries it, they'll conflict regardless. The babysit loop will flag, not resolve.
- **UI taste calls.** Design judgment (does this color work?) still needs the user's eyes. That's why `docs/**` changes require review.
- **Architectural decisions.** New public APIs, breaking refactors, new dependencies — the babysit loop should be tuned to add `needs-user-review` on these heuristically.

## Limits

- **Max sensible concurrent tracks: 3–4.** More and the merge queue gets tangled; you lose mental model of what's in flight.
- **CI wall-clock: ~45s.** Install + typecheck + tests. If this grows, `gh pr merge --auto` gets slower to land. If it grows past 5 min, promote Build Watchdog to cache/parallelize.
- **Daytime only.** Overnight work runs via the overnight-build-loop (serial, single-branch stack). Don't run parallel tracks overnight — they accumulate merge conflicts you can't triage until morning.

## Follow-ups after first use

- If babysit consistently runs no-op (no conflicts, nothing stuck): see ADR 0007 — that was the observed behavior and the standalone schedule was decommissioned in favor of inline-hourly invocation by the overnight build loop.
- If babysit over-flags (adds `needs-user-review` on obvious merges): tighten the "semantic vs mechanical" heuristic in the brief.
- If `ci.yml` runs too slow: cache `node_modules` more aggressively (already caching npm); consider splitting typecheck + tests into parallel jobs.
