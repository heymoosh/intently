#!/usr/bin/env bash
# session-precheck — warn on drift before a Claude session starts.
#
# Wired as a SessionStart hook in .claude/settings.json (matcher: "startup").
# Also invokable manually via /precheck or `bash scripts/session-precheck.sh --force`.
#
# Behavior: never blocks (always exit 0). On drift, writes a report to both
# stdout (injected into Claude's context per Claude Code hook semantics) and
# stderr (visible in the user's terminal). Claude reacts to the report per
# the rule in CLAUDE.md § "Session handoff".

set +e  # fail-open on infrastructure errors — never block a session

FORCE=0
[ "${1:-}" = "--force" ] && FORCE=1

# ---------- gates (exit 0 silently, skipping checks) ----------

# Not a git repo or git broken.
git rev-parse --git-dir >/dev/null 2>&1 || exit 0

# Batch mode / no tty (routines via launchd hit this). Skip unless --force.
if [ $FORCE -eq 0 ] && [ ! -t 0 ] && [ ! -t 1 ]; then exit 0; fi

# Explicit bypass for interactive-but-I-know-what-I-am-doing.
if [ $FORCE -eq 0 ] && [ "${INTENTLY_AUTOMATION:-0}" = "1" ]; then exit 0; fi

# Worktree (intently-track spawns claude inside worktrees that are intentionally
# on feat/track-* with dirty trees).
GIT_DIR="$(git rev-parse --git-dir 2>/dev/null)"
GIT_COMMON="$(git rev-parse --git-common-dir 2>/dev/null)"
if [ -n "$GIT_DIR" ] && [ "$GIT_DIR" != "$GIT_COMMON" ]; then exit 0; fi

# Wrong repo — script must be under the repo we are pre-checking.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd 2>/dev/null)"
MAIN_REPO="$(cd "$SCRIPT_DIR/.." && pwd 2>/dev/null)"
CWD="$(pwd -P 2>/dev/null)"
if [ -n "$MAIN_REPO" ] && [ "$CWD" != "$MAIN_REPO" ]; then exit 0; fi

# ---------- drift checks ----------

FAILURES=()
WARNINGS=()

BRANCH="$(git branch --show-current 2>/dev/null)"
if [ -n "$BRANCH" ] && [ "$BRANCH" != "main" ]; then
  FAILURES+=("on branch '$BRANCH' (expected main)")
fi

# In-progress git operation.
if [ -f "$GIT_DIR/MERGE_HEAD" ] \
  || [ -d "$GIT_DIR/rebase-merge" ] \
  || [ -d "$GIT_DIR/rebase-apply" ] \
  || [ -f "$GIT_DIR/CHERRY_PICK_HEAD" ] \
  || [ -f "$GIT_DIR/BISECT_LOG" ]; then
  FAILURES+=("in-progress git operation detected (merge/rebase/cherry-pick/bisect) — do not auto-fix; user must handle")
fi

# Tracked-file modifications.
DIRTY="$(git status --porcelain 2>/dev/null | grep -v '^??' | head -30)"
if [ -n "$DIRTY" ]; then
  FAILURES+=("uncommitted changes to tracked files:")
  while IFS= read -r line; do FAILURES+=("    $line"); done <<< "$DIRTY"
fi

# Sync state with origin/main. Fail-open on network / missing remote.
git fetch origin main --quiet 2>/dev/null
BEHIND="$(git rev-list --count HEAD..origin/main 2>/dev/null)"
AHEAD="$(git rev-list --count origin/main..HEAD 2>/dev/null)"
if [ "${BEHIND:-0}" -gt 0 ]; then
  FAILURES+=("behind origin/main by ${BEHIND} commits — pull")
fi
if [ "$BRANCH" = "main" ] && [ "${AHEAD:-0}" -gt 0 ]; then
  FAILURES+=("local main ahead of origin/main by ${AHEAD} unpushed commits — review and push")
fi

# Stashes (warn-only).
STASH_COUNT="$(git stash list 2>/dev/null | wc -l | tr -d ' ')"
if [ "${STASH_COUNT:-0}" -gt 0 ]; then
  WARNINGS+=("${STASH_COUNT} stash(es) present — 'git stash list' to review")
fi

# Stale [gone] branches (warn-only).
STALE_COUNT="$(git for-each-ref --format '%(upstream:track)' refs/heads/ 2>/dev/null | grep -c '\[gone\]')"
if [ "${STALE_COUNT:-0}" -gt 0 ]; then
  WARNINGS+=("${STALE_COUNT} local branch(es) with gone remote — safe to 'git branch -D' after verifying")
fi

# Parallel git worktrees (warn-only). Shared files like TRACKER/handoffs/CLAUDE
# auto-merge cleanly when edits don't overlap, but a session that knows other
# tracks are active should spawn its own worktree per CONTRIBUTING.md
# (`git worktree add ~/wt/<slug> -b chat/<slug>`) rather than touch shared
# state from primary. Sibling-session detection inside the same checkout is
# handled separately by session-locks.sh check.
PARALLEL_WT=()
PRIMARY_PATH="$(git rev-parse --show-toplevel 2>/dev/null)"
while IFS= read -r wt; do
  [ -z "$wt" ] && continue
  if [ "$wt" != "$PRIMARY_PATH" ]; then
    PARALLEL_WT+=("$wt")
  fi
done < <(git worktree list --porcelain 2>/dev/null | awk '/^worktree /{print $2}')
if [ ${#PARALLEL_WT[@]} -gt 0 ]; then
  WARNINGS+=("${#PARALLEL_WT[@]} parallel worktree(s) active — touch TRACKER/handoffs/CLAUDE only inside your own worktree")
  for wt in "${PARALLEL_WT[@]}"; do WARNINGS+=("    $wt"); done
fi

# ---------- report ----------

if [ ${#FAILURES[@]} -eq 0 ] && [ ${#WARNINGS[@]} -eq 0 ]; then
  # All clear — silent so clean starts don't pollute context.
  exit 0
fi

# Build the report once; write to both streams.
{
  echo "[session-precheck]"
  for w in "${WARNINGS[@]}"; do echo "  warn: $w"; done
  for f in "${FAILURES[@]}"; do echo "  drift: $f"; done
  if [ ${#FAILURES[@]} -gt 0 ]; then
    echo ""
    echo "To clean up, ask Claude to 'fix drift' — it will walk each item with per-step confirmation."
    echo "To proceed anyway this session: INTENTLY_AUTOMATION=1 claude"
  fi
} | tee /dev/stderr

exit 0
