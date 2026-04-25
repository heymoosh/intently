#!/usr/bin/env bash
# wt-intent — enforce per-worktree intent declaration before substantive edits.
#
# Companion to session-locks.sh. Where session-locks blocks when a sibling
# Claude session shares this checkout, wt-intent blocks when the current
# worktree hasn't declared what it's working on (no .claude/wt-intent.md).
#
# Subcommand (reads hook event JSON from stdin):
#   block-if-missing  — PreToolUse hook for Edit/Write/MultiEdit/NotebookEdit.
#                       Exits 2 with a stderr message asking Claude to write
#                       the intent file first if all of:
#                         (a) target file is inside REPO_ROOT,
#                         (b) current branch is chat/* or feat/track-*,
#                         (c) target file isn't .claude/wt-intent.md itself
#                             (escape hatch — Claude must be able to write it).
#                         (d) .claude/wt-intent.md is missing.
#
# Scope reasoning:
#   - Edits outside the repo (~/.bashrc, /tmp/) can't drift project intent.
#   - The primary checkout on main doesn't have a worktree-specific intent;
#     intent applies to chat/* / feat/track-* branches where work happens.
#   - The intent file itself must be writable so Claude can declare intent
#     and unblock the original write on retry.
#
# Fail-open: missing jq, missing stdin, unparseable paths, or missing git
# all exit 0 so a broken hook never locks the user out of editing entirely.
# Format spec: see .claude/commands/start-work.md § step 7.

set +e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
INTENT_FILE_REL=".claude/wt-intent.md"
INTENT_FILE="$REPO_ROOT/$INTENT_FILE_REL"

read_tool_file_path() {
  local input="$1"
  [ -z "$input" ] && return 0
  command -v jq >/dev/null 2>&1 || return 0
  echo "$input" | jq -r '.tool_input.file_path // .tool_input.notebook_path // empty' 2>/dev/null
}

# 0 = inside REPO_ROOT, 1 = outside. Empty paths return 1 → fail open.
path_in_repo() {
  local p="$1"
  [ -z "$p" ] && return 1
  case "$p" in
    /*) ;;
    *) p="$SELF_CWD/$p" ;;
  esac
  case "$p" in
    "$REPO_ROOT"|"$REPO_ROOT"/*) return 0 ;;
    *) return 1 ;;
  esac
}

# 0 = the target IS the intent file itself, 1 = something else.
path_is_intent_file() {
  local p="$1"
  [ -z "$p" ] && return 1
  case "$p" in
    /*) ;;
    *) p="$SELF_CWD/$p" ;;
  esac
  [ "$p" = "$INTENT_FILE" ]
}

current_branch() {
  command -v git >/dev/null 2>&1 || { echo ""; return; }
  git -C "$REPO_ROOT" rev-parse --abbrev-ref HEAD 2>/dev/null
}

HOOK_INPUT=""
if [ ! -t 0 ]; then
  HOOK_INPUT="$(cat 2>/dev/null)"
fi
SELF_CWD="$(pwd -P 2>/dev/null)"

cmd="${1:-}"

case "$cmd" in
  block-if-missing)
    target_path="$(read_tool_file_path "$HOOK_INPUT")"
    # (a) outside repo? fail open.
    path_in_repo "$target_path" || exit 0
    # (c) editing the intent file itself? always allow.
    path_is_intent_file "$target_path" && exit 0
    # (b) on a non-chat/non-track branch? not in scope (e.g. main).
    branch="$(current_branch)"
    case "$branch" in
      chat/*|feat/track-*) ;;
      *) exit 0 ;;
    esac
    # (d) intent file present? allow.
    [ -f "$INTENT_FILE" ] && exit 0
    {
      echo "[wt-intent] BLOCKED — this worktree has no $INTENT_FILE_REL."
      echo ""
      echo "Branch: $branch (chat/* or feat/track-* requires a declared intent)"
      echo ""
      echo "Write $INTENT_FILE_REL first, then retry this edit. Format:"
      echo ""
      echo "  slug: <kebab-case>"
      echo "  declared_at: <ISO 8601 timestamp>"
      echo "  branch: $branch"
      echo "  ref: TRACKER § <section> — <row name>"
      echo ""
      echo "  <one sentence — what this worktree is doing>"
      echo ""
      echo "Rules: ref must point at a TRACKER row (add one first if none fits)."
      echo "See .claude/commands/start-work.md § step 7."
    } >&2
    exit 2
    ;;

  *)
    echo "Usage: $(basename "$0") {block-if-missing}" >&2
    exit 2
    ;;
esac

exit 0
