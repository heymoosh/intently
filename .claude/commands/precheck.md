The user invoked `/precheck` to inspect working-tree drift before or during a session. Run the precheck script with `--force` so it runs even in contexts where the `SessionStart` hook gates would normally skip it (worktrees, batch mode, bypass env var).

## Steps

1. **Run** `bash scripts/session-precheck.sh --force`. The script emits a drift report (or nothing, if clean).

2. **If the report is empty**, confirm "clean — on main, synced, no drift." Done.

3. **If the report lists drift**, surface it to the user in plain language (don't parrot the raw report — summarize what matters). Offer to walk through the fix playbook:

   | Drift | Action |
   |---|---|
   | In-progress merge/rebase/cherry-pick/bisect | **Do not auto-fix.** Explain what's in progress; user must handle. |
   | On non-main branch | Offer (a) switch to main (stash first if dirty), (b) stay + bypass. Default: switch. |
   | Uncommitted tracked-file changes | Classify: steward-driven (TRACKER, acceptance-criteria) vs user work. Offer (a) commit to chat branch + PR, (b) stash, (c) discard (require explicit typed confirmation). |
   | Behind `origin/main` | Safe to auto-pull (fast-forward only). Confirm once, then run. |
   | Local `main` ahead of `origin/main` (unpushed) | Show log; offer push or investigate first. |
   | `[gone]` stale branches | Safe to batch `git branch -D`. Confirm once, then run. |
   | Stashes | List; offer `stash show` / `stash drop` / keep. |

4. **Ask per item** before executing. Do not batch-execute without confirmation.

5. **After all fixes**, re-run `bash scripts/session-precheck.sh --force` to confirm clean, then tell the user they're safe to start real work.

## Rules

- Never use destructive git (`reset --hard`, `clean -f`, `branch -D` on unmerged branches) without an explicit typed confirmation that names what is being destroyed.
- Never push to `main` directly — `main` is protected; any commit must route via a `chat/*` or `auto/*` branch + PR per CLAUDE.md § "Branch and PR standards".
- If a fix introduces a new chat branch (e.g. for uncommitted changes), follow the normal flow: commit → push → `gh pr create` → wait for user to merge → sync.
