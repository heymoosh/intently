  # Track B — demo seed data (new seed/ at repo root, docs classification → your review)
./scripts/intently-track.sh seed-data-v1 "$(cat docs/process/session-prompt-seed-data-v1.md)"

  # Track C — npm audit in CI (.github/workflows/security.yml, merges on green CI)
./scripts/intently-track.sh npm-audit-ci "$(cat docs/process/session-prompt-npm-audit-ci.md)"

  # Track D — app README (app/README.md new file, code path → merges on green CI)
./scripts/intently-track.sh app-readme "$(cat docs/process/session-prompt-app-readme.md)"

  # Track E — Claude-as-judge eval scorer (evals/runner/scorers/, merges on green CI)
./scripts/intently-track.sh claude-judge-scorer "$(cat docs/process/session-prompt-claude-judge-scorer.md)"








# Commands to type manually

Reference for the two user-facing automation entry points. Everything else is either a git operation you already know or a slash command documented elsewhere.

---



Clean up stale work trees on command.


intently-track <slug> "prompt"

Start a new parallel-work track. Opens a fresh Claude Code session inside a dedicated git worktree.


/babysit-prs

Start the PR babysit loop in the current Claude session. Closes if session exits, runs every 15 mins.



---

## intently-track <slug> "prompt"

```bash
# From the repo root:
./scripts/intently-track.sh daily-brief-impl "Wire the daily-brief agent to the Managed Agents SDK, replacing the stub executor."

# Or, if you've symlinked it into PATH (optional):
intently-track daily-brief-impl "..."
```

**What happens:**

1. Worktree created at `~/worktrees/intently/<slug>`.
2. Branch `feat/track-<slug>` cut from a fresh `origin/main`.
3. `cd` into the worktree and launch `claude`.
4. **If you passed an initial prompt**, the script appends a standard handoff suffix telling Claude to commit, push, and open a draft PR when done. Auto-merge-safe.yml then takes over: merges on green CI + security, deletes the branch.
5. **If you passed no prompt**, Claude launches interactively without the handoff suffix. You drive; open the PR yourself when ready.

**Runs once per invocation.** Launches one Claude session in one worktree and returns control. The session runs until Claude exits (task complete, or you exit manually).

**Slug rules:** lowercase ASCII, digits, hyphen. Must start with a letter. Example: `daily-brief-impl`, `seed-data-v1`.

**Subcommands:**

```bash
intently-track --list                # show active track worktrees
intently-track --clean <slug>        # remove a worktree (only if work is in main or fully pushed)
intently-track --help                # show usage
```

**Caveat:** max sensible concurrent tracks is 3–4. More than that, the merge queue gets tangled and you lose mental model of what's in flight.

---

## `/babysit-prs`

Start the PR babysit loop in the current Claude session.

```
/babysit-prs
```

That's it. The slash command expands to a `/loop 15m <standard prompt>` invocation — the "standard prompt" is the per-iteration instruction that tells Claude to read `.claude/loops/babysit-prs.md` and execute one iteration of its brief. You don't have to find or paste anything.

**What it does each fire:**

- Queries every open `auto/*` and `feat/track-*` PR on GitHub (not just PRs from your current session — it sees everything).
- If a PR has merge conflicts, tries rebasing onto main. Clean rebase → force-push-with-lease. Conflict → adds `needs-user-review` label with a specific question.
- Nudges stalled PRs (no activity >2h with same CI failure).
- Cleans up merged worktrees at `~/worktrees/intently/<slug>`.
- Writes a report to `routine-output/babysit-prs-<date>-<time>.md` when it acts; silent on no-op iterations.

**Session-scoped.** The loop stops when the Claude session that started it closes. Launch it again in any session when you want it back. Not promoted to launchd — only runs when you're actively doing parallel-track work.

**Run it in one session at a time.** One loop covers every in-flight track, regardless of which session you started each track from. Running it in multiple sessions just duplicates work.

---

## Stopping loops

| Loop | Stop it by |
|---|---|
| `/loop …` started with `/babysit-prs` | Close the Claude session that started it. |
| `/loop 1h …` overnight-build-loop | Close the Claude session. Or `CronDelete <job-id>` from inside the session (the `/loop` skill prints the id on start). |
| launchd routines (spec-conformance, privacy, etc.) | `launchctl unload ~/Library/LaunchAgents/com.intently.<name>.plist` — persists across reboots. |

---

## Escape hatches for individual PRs

```bash
# Stop auto-merge on one PR:
gh pr edit <PR#> --add-label needs-user-review

# Remove the label when you're ready for it to auto-merge again (label add is one-way on the bot side — only you take it off):
gh pr edit <PR#> --remove-label needs-user-review

# Force a stuck workflow to re-run:
gh workflow run ci.yml --ref <branch>
```

---

## Daily check-ins (no manual commands required — these run on launchd)

| Routine | Time | What it does |
|---|---|---|
| `release-readiness-steward` | 03:00 daily | Synthesizes overnight findings into a morning go/no-go; prepends to TRACKER.md Status. |
| `session-handoff-steward` | 22:45 daily | Overwrites `.claude/session-handoff.md` with end-of-day summary. |
| `spec-conformance-steward` | 02:13 daily | Audits acceptance criteria vs spec; writes to `routine-output/`. |
| `privacy-steward` | 02:19 daily | Audits for secret / data-path regressions; auto-fixes LOW/MEDIUM. |
| `agent-memory-steward` | 02:25 every 2 days | Cross-skill memory audit (Opus 4.7). |
| `ai-eval-batch-steward` | 02:07 daily | Runs held-out eval pack; regressions flagged. |

If any of these stop producing output in `routine-output/`, check `~/.intently/logs/<name>.log`.
