#!/usr/bin/env bash
# intently-track — spawn a parallel-work track.
#
# Usage:
#   intently-track <slug> ["initial prompt for Claude"]
#   intently-track --list                      # list active tracks
#   intently-track --clean <slug>              # remove a worktree (only if clean)
#   intently-track --help
#
# What it does:
#   1. Creates a git worktree at ~/worktrees/intently/<slug>
#   2. Branches feat/track-<slug> from origin/main (freshly fetched)
#   3. cds into the worktree and launches `claude`
#   4. On Claude exit, leaves the worktree intact so you can push/resume.
#
# Conventions the rest of the system relies on:
#   - Branch prefix feat/track-*  → auto-merge-safe.yml picks it up alongside auto/*
#   - Worktree path  ~/worktrees/intently/<slug>  → easy for other sessions to find
#   - No worktree ever lives inside the main repo directory (avoids nested .git issues)
#
# This script does NOT:
#   - Merge. The merge is handled by auto-merge-safe.yml + babysit-prs loop.
#   - Commit. Claude commits as work is done.
#   - Clean up automatically. Use `intently-track --clean <slug>` when done.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
WORKTREE_BASE="$HOME/worktrees/intently"

# Color helpers — only if stdout is a tty.
if [ -t 1 ]; then
  C_BOLD=$'\033[1m'; C_DIM=$'\033[2m'; C_OK=$'\033[32m'; C_WARN=$'\033[33m'; C_ERR=$'\033[31m'; C_RESET=$'\033[0m'
else
  C_BOLD=""; C_DIM=""; C_OK=""; C_WARN=""; C_ERR=""; C_RESET=""
fi

usage() {
  cat <<EOF
${C_BOLD}intently-track${C_RESET} — spawn a parallel-work track

  ${C_BOLD}intently-track${C_RESET} <slug> ["initial prompt"]
      Create worktree ~/worktrees/intently/<slug>, branch feat/track-<slug>
      off origin/main, cd in, and launch Claude Code there. If an initial
      prompt is given, it is passed to Claude as the first turn.

  ${C_BOLD}intently-track --list${C_RESET}
      Show active track worktrees.

  ${C_BOLD}intently-track --clean${C_RESET} <slug>
      Remove the worktree for <slug>. Refuses if the worktree has
      uncommitted changes or unpushed commits.

  ${C_BOLD}intently-track --help${C_RESET}
      This message.

Slug rules:
  lowercase ASCII, digits, hyphen; must start with a letter.
  Example: intently-track daily-brief-impl
EOF
}

validate_slug() {
  local s="$1"
  if ! echo "$s" | grep -qE '^[a-z][a-z0-9-]*$'; then
    echo "${C_ERR}error:${C_RESET} invalid slug \"$s\" (lowercase letters, digits, hyphen; must start with a letter)" >&2
    exit 2
  fi
}

cmd_list() {
  git -C "$REPO_ROOT" worktree list --porcelain | awk '
    /^worktree / { wt=$2; next }
    /^branch refs\/heads\// {
      br=substr($2, length("refs/heads/")+1)
      if (wt ~ /worktrees\/intently\//) {
        printf "  %-40s  %s\n", br, wt
      }
      wt=""
    }
  '
}

cmd_clean() {
  local slug="${1:-}"
  [ -z "$slug" ] && { usage; exit 2; }
  validate_slug "$slug"

  local wt="$WORKTREE_BASE/$slug"
  if [ ! -d "$wt" ]; then
    echo "${C_WARN}no worktree at $wt${C_RESET}"
    exit 0
  fi

  local dirty
  dirty=$(git -C "$wt" status --porcelain 2>/dev/null || true)
  if [ -n "$dirty" ]; then
    echo "${C_ERR}error:${C_RESET} worktree $wt has uncommitted changes:" >&2
    echo "$dirty" >&2
    exit 1
  fi

  local ahead
  ahead=$(git -C "$wt" rev-list --count '@{u}..HEAD' 2>/dev/null || echo 0)
  if [ "$ahead" -gt 0 ]; then
    echo "${C_ERR}error:${C_RESET} worktree $wt has $ahead unpushed commits. Push first, then re-run --clean." >&2
    exit 1
  fi

  git -C "$REPO_ROOT" worktree remove "$wt"
  echo "${C_OK}removed${C_RESET} $wt"
}

cmd_create() {
  local slug="$1"
  shift
  local initial_prompt="${*:-}"

  validate_slug "$slug"

  local wt="$WORKTREE_BASE/$slug"
  local br="feat/track-$slug"

  if [ -d "$wt" ]; then
    echo "${C_WARN}worktree already exists:${C_RESET} $wt"
    echo "${C_DIM}resuming in-place (no fetch, no rebase)${C_RESET}"
  else
    echo "${C_DIM}fetching origin/main...${C_RESET}"
    git -C "$REPO_ROOT" fetch origin main --quiet

    # If branch already exists (e.g. previous worktree was cleaned but branch
    # wasn't), check it out; otherwise create fresh from origin/main.
    if git -C "$REPO_ROOT" show-ref --verify --quiet "refs/heads/$br"; then
      echo "${C_DIM}branch $br exists; checking out into worktree${C_RESET}"
      git -C "$REPO_ROOT" worktree add "$wt" "$br"
    else
      git -C "$REPO_ROOT" worktree add "$wt" -b "$br" origin/main
    fi
  fi

  echo ""
  echo "${C_OK}track ready${C_RESET}"
  echo "  branch:   $br"
  echo "  path:     $wt"
  echo ""
  echo "${C_DIM}launching claude...${C_RESET}"

  cd "$wt"
  if [ -n "$initial_prompt" ]; then
    claude "$initial_prompt"
  else
    claude
  fi
}

# ---------- entry point ----------

case "${1:-}" in
  ""|-h|--help)
    usage
    ;;
  --list)
    cmd_list
    ;;
  --clean)
    shift
    cmd_clean "$@"
    ;;
  -*)
    echo "${C_ERR}error:${C_RESET} unknown flag $1" >&2
    usage
    exit 2
    ;;
  *)
    cmd_create "$@"
    ;;
esac
