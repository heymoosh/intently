#!/usr/bin/env bash
# session-locks — track active Claude Code sessions via per-session lockfiles.
#
# Two sessions can collide silently when they run in the SAME checkout
# (e.g. two `claude` tabs in the repo, or `babysit-prs` looping while a
# foreground session is editing). git worktrees prevent this by construction
# but only if the user actually used one. This script adds an explicit
# liveness signal so we can warn when siblings are present in the same cwd.
#
# Subcommands (all read the hook event JSON from stdin):
#   ensure            — create or touch this session's lockfile (heartbeat)
#   remove            — delete this session's lockfile
#   check             — emit a [session-locks] warning if a sibling session
#                       exists in the SAME working directory; silent otherwise
#   block-if-sibling  — same detection as `check` but exits 2 with a stderr
#                       message so a PreToolUse hook can hard-block Edit/Write
#                       in the primary checkout when a sibling is active.
#                       Polite warnings get ignored; the block doesn't.
#
# Lockfile path:     <repo>/.claude/sessions/<session_id>.lock
# Lockfile contents: JSON { session_id, pid, cwd, started_at }
# Stale threshold:   45 min (UserPromptSubmit hook touches keep alive)
# Same-cwd filter:   siblings only count if their cwd matches this session's,
#                    so primary-vs-worktree pairs don't false-positive (those
#                    are already surfaced by session-precheck's worktree check).
#
# Fail-open for inspection commands (ensure/remove/check). The block command
# also fails open on missing jq / missing stdin so a broken hook doesn't lock
# the user out of editing entirely.

set +e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
LOCK_DIR="$REPO_ROOT/.claude/sessions"
# 45 min — long enough that a session typing every few minutes stays alive
# (UserPromptSubmit touches the file on each turn), short enough that a
# Ctrl-C'd session restarting within an hour doesn't false-positive itself.
STALE_SECS=$((45 * 60))

mkdir -p "$LOCK_DIR" 2>/dev/null

read_session_id() {
  local input="$1"
  [ -z "$input" ] && return 0
  command -v jq >/dev/null 2>&1 || return 0
  echo "$input" | jq -r '.session_id // empty' 2>/dev/null
}

mtime_of() {
  stat -f %m "$1" 2>/dev/null || stat -c %Y "$1" 2>/dev/null
}

cwd_of_lock() {
  command -v jq >/dev/null 2>&1 || { echo ""; return; }
  jq -r '.cwd // ""' "$1" 2>/dev/null
}

now() { date +%s; }

# Populate the global `siblings` array with "<short-sid> (last seen Ns ago)"
# entries for every other live lockfile in the same cwd. Skips self by SID
# and stale locks by mtime. Shared by `check` and `block-if-sibling`.
find_siblings() {
  siblings=()
  [ -d "$LOCK_DIR" ] || return 0
  local cutoff f sid m lock_cwd age short_sid
  cutoff=$(( $(now) - STALE_SECS ))
  for f in "$LOCK_DIR"/*.lock; do
    [ -e "$f" ] || continue
    sid="$(basename "$f" .lock)"
    [ -n "$SELF_SID" ] && [ "$sid" = "$SELF_SID" ] && continue
    m="$(mtime_of "$f")"
    [ -z "$m" ] && continue
    [ "$m" -le "$cutoff" ] && continue
    lock_cwd="$(cwd_of_lock "$f")"
    [ "$lock_cwd" = "$SELF_CWD" ] || continue
    age=$(( $(now) - m ))
    short_sid="$(echo "$sid" | cut -c1-8)"
    siblings+=("$short_sid (last seen ${age}s ago)")
  done
}

# Read stdin once up-front (Claude Code hook event JSON).
HOOK_INPUT=""
if [ ! -t 0 ]; then
  HOOK_INPUT="$(cat 2>/dev/null)"
fi
SELF_SID="$(read_session_id "$HOOK_INPUT")"
SELF_CWD="$(pwd -P 2>/dev/null)"

cmd="${1:-}"

case "$cmd" in
  ensure)
    [ -z "$SELF_SID" ] && exit 0
    # Reap stale lockfiles from crashed/killed sessions so the directory
    # doesn't accumulate dead entries that confuse manual inspection.
    cutoff=$(( $(now) - STALE_SECS ))
    if [ -d "$LOCK_DIR" ]; then
      for stale in "$LOCK_DIR"/*.lock; do
        [ -e "$stale" ] || continue
        m="$(mtime_of "$stale")"
        [ -n "$m" ] && [ "$m" -le "$cutoff" ] && rm -f "$stale"
      done
    fi
    f="$LOCK_DIR/$SELF_SID.lock"
    if [ -f "$f" ]; then
      touch "$f"
    else
      printf '{"session_id":"%s","pid":%d,"cwd":"%s","started_at":%d}\n' \
        "$SELF_SID" "$$" "$SELF_CWD" "$(now)" > "$f"
    fi
    ;;

  remove)
    [ -z "$SELF_SID" ] && exit 0
    rm -f "$LOCK_DIR/$SELF_SID.lock"
    ;;

  check)
    find_siblings
    [ ${#siblings[@]} -eq 0 ] && exit 0
    {
      echo "[session-locks]"
      echo "  warn: ${#siblings[@]} other Claude session(s) appear active in this same checkout ($SELF_CWD)"
      for s in "${siblings[@]}"; do echo "    $s"; done
      echo "  Risk: silent overwrites on TRACKER.md / .claude/handoffs/ / CLAUDE.md."
      echo "  Fix:  spawn a worktree per CONTRIBUTING.md →"
      echo "        git worktree add ~/wt/<slug> -b chat/<slug>"
    } | tee /dev/stderr
    ;;

  block-if-sibling)
    # Wired as a PreToolUse hook for Edit/Write tools. Exit 2 → Claude Code
    # blocks the tool call and feeds stderr back to the model so it adapts.
    find_siblings
    [ ${#siblings[@]} -eq 0 ] && exit 0
    {
      echo "[session-locks] BLOCKED — ${#siblings[@]} other Claude session(s) active in this checkout ($SELF_CWD):"
      for s in "${siblings[@]}"; do echo "  $s"; done
      echo ""
      echo "Edits in the primary checkout while a sibling is active can be silently overwritten"
      echo "if the other session switches branches. Spawn a worktree before retrying:"
      echo ""
      echo "  git worktree add ~/wt/<slug> -b chat/<slug> && cd ~/wt/<slug>"
      echo ""
      echo "Then resume work there. (See CONTRIBUTING.md § Editing workflow.)"
    } >&2
    exit 2
    ;;

  *)
    echo "Usage: $(basename "$0") {ensure|remove|check|block-if-sibling}" >&2
    exit 2
    ;;
esac

exit 0
