#!/usr/bin/env bash
# session-sync-tracker — keep TRACKER.md current with origin/main at session start.
#
# Wired as a SessionStart hook in .claude/settings.json (matcher: "startup"),
# running before session-precheck. Unlike precheck, this script DOES run in
# worktrees — that's the whole point: a chat worktree spawned yesterday will
# have a stale TRACKER if a sibling merged a TRACKER update since.
#
# Behavior:
#   - On main → skip. Pulling is the natural fix; precheck handles that case.
#   - TRACKER.md has uncommitted edits → flag, no-op (don't clobber user work).
#   - working-tree TRACKER == origin/main:TRACKER → silent, already in sync.
#   - else → overwrite working-tree TRACKER from origin/main. Loud message so
#     the user/Claude knows to commit if they want the update on this branch.
#
# Fail-open on every infra error (no remote, offline, missing file, etc.).
# Never blocks; always exits 0.

set +e

FORCE=0
[ "${1:-}" = "--force" ] && FORCE=1

git rev-parse --git-dir >/dev/null 2>&1 || exit 0

# Batch mode skip (launchd routines hit this).
if [ $FORCE -eq 0 ] && [ ! -t 0 ] && [ ! -t 1 ]; then exit 0; fi

# Explicit automation bypass.
if [ $FORCE -eq 0 ] && [ "${INTENTLY_AUTOMATION:-0}" = "1" ]; then exit 0; fi

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"
[ -z "$REPO_ROOT" ] && exit 0
TRACKER="$REPO_ROOT/TRACKER.md"
[ -f "$TRACKER" ] || exit 0

# Skip on main — `git pull` is the right fix there, and precheck already
# nags about it when the working tree falls behind origin/main.
BRANCH="$(git -C "$REPO_ROOT" branch --show-current 2>/dev/null)"
[ "$BRANCH" = "main" ] && exit 0

# Fetch origin/main quietly; fail-open if offline or remote is wrong.
git -C "$REPO_ROOT" fetch origin main --quiet 2>/dev/null || exit 0

# Don't clobber uncommitted user edits to TRACKER.md.
if ! git -C "$REPO_ROOT" diff --quiet -- TRACKER.md 2>/dev/null \
  || ! git -C "$REPO_ROOT" diff --quiet --cached -- TRACKER.md 2>/dev/null; then
  {
    echo "[tracker-sync] local TRACKER.md has uncommitted edits — not syncing from origin/main."
    echo "  Resolve manually: commit your edits, then re-sync via 'git checkout origin/main -- TRACKER.md'."
  } | tee /dev/stderr
  exit 0
fi

LOCAL_HASH="$(git -C "$REPO_ROOT" hash-object -- "$TRACKER" 2>/dev/null)"
REMOTE_HASH="$(git -C "$REPO_ROOT" rev-parse origin/main:TRACKER.md 2>/dev/null)"

if [ -z "$LOCAL_HASH" ] || [ -z "$REMOTE_HASH" ]; then
  exit 0
fi

if [ "$LOCAL_HASH" = "$REMOTE_HASH" ]; then
  # Already in sync — silent.
  exit 0
fi

# Overwrite working tree from origin/main.
git -C "$REPO_ROOT" show "origin/main:TRACKER.md" > "$TRACKER"

REMOTE_SHA="$(git -C "$REPO_ROOT" rev-parse --short origin/main 2>/dev/null)"
{
  echo "[tracker-sync] TRACKER.md updated to origin/main @ ${REMOTE_SHA}."
  echo "  Working tree now reflects latest TRACKER from main."
  echo "  Commit on this branch ('${BRANCH}') if you want to keep the update;"
  echo "  otherwise it will be discarded when the branch is rebased onto main."
} | tee /dev/stderr

exit 0
