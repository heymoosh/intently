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

  # Check whether the branch's work is in main by any route — regular merge,
  # rebase, or squash merge. `git cherry main HEAD` marks each commit with
  # `+` (not in main) or `-` (patch-equivalent commit exists in main). A
  # squash-merged branch has all `-` lines. A non-merged branch has at least
  # one `+` line.
  local unmerged
  unmerged=$(git -C "$wt" cherry main HEAD 2>/dev/null | grep -c '^+' || true)
  if [ "$unmerged" -gt 0 ]; then
    # Work not yet in main. Only allow removal if everything is pushed —
    # otherwise we'd lose commits.
    local upstream_tip local_tip
    upstream_tip=$(git -C "$wt" rev-parse --verify '@{u}' 2>/dev/null || echo '')
    local_tip=$(git -C "$wt" rev-parse HEAD)
    if [ -z "$upstream_tip" ] || [ "$upstream_tip" != "$local_tip" ]; then
      echo "${C_ERR}error:${C_RESET} worktree $wt has $unmerged commit(s) not in main and not pushed to origin." >&2
      echo "Push first, then re-run --clean. Or discard the branch with: git -C $REPO_ROOT worktree remove --force $wt" >&2
      exit 1
    fi
    # Pushed but not merged — a valid in-flight state (PR still open).
    # Warn but proceed.
    echo "${C_WARN}warning:${C_RESET} branch is pushed but not yet merged. Removing worktree anyway."
  fi

  git -C "$REPO_ROOT" worktree remove "$wt"
  echo "${C_OK}removed${C_RESET} $wt"
}

preflight_warn_main_state() {
  # Before creating a worktree, surface conditions in the main repo that might
  # surprise the user. Warn-only — does not block. User can Ctrl-C if needed.
  #
  #   1. Uncommitted changes in the main working tree (staged or unstaged):
  #      those changes won't propagate to the new worktree (which branches
  #      from origin/main). If the user expected the track to see that work,
  #      this is a footgun.
  #   2. Local branch commits not on origin/main: same problem — the new
  #      track starts from origin/main, not the user's local tip.
  #   3. origin/main ahead of local: informational only — the new track WILL
  #      pick up the latest (post-fetch), but the user may want to pull main
  #      after the track to stay in sync.

  local warned=0

  local dirty
  dirty=$(git -C "$REPO_ROOT" status --porcelain --untracked-files=no 2>/dev/null || true)
  if [ -n "$dirty" ]; then
    echo "${C_WARN}warning:${C_RESET} main worktree has uncommitted changes. These will NOT appear in the track's worktree:" >&2
    echo "$dirty" | head -8 | sed 's/^/  /' >&2
    local dcount
    dcount=$(echo "$dirty" | wc -l | tr -d ' ')
    if [ "$dcount" -gt 8 ]; then
      echo "  ... ($((dcount - 8)) more)" >&2
    fi
    warned=1
  fi

  # Refresh origin/main so the ahead/behind counts are accurate. Silent on
  # network error — the worktree-create step that follows will retry.
  git -C "$REPO_ROOT" fetch origin main --quiet 2>/dev/null || true

  local behind_origin ahead_origin
  behind_origin=$(git -C "$REPO_ROOT" rev-list --count HEAD..origin/main 2>/dev/null || echo 0)
  ahead_origin=$(git -C "$REPO_ROOT" rev-list --count origin/main..HEAD 2>/dev/null || echo 0)

  if [ "$ahead_origin" -gt 0 ]; then
    local current_branch
    current_branch=$(git -C "$REPO_ROOT" branch --show-current 2>/dev/null || echo '(detached)')
    echo "${C_WARN}warning:${C_RESET} current branch ${current_branch} is ahead of origin/main by ${ahead_origin} commit(s). New tracks branch from origin/main; those commits will NOT be included." >&2
    warned=1
  fi

  if [ "$behind_origin" -gt 0 ]; then
    echo "${C_DIM}note:${C_RESET} origin/main is ahead of local by ${behind_origin} commit(s). The new track will use the latest origin/main."
  fi

  if [ "$warned" -eq 1 ]; then
    echo ""
    echo "${C_DIM}Continuing in 2s. Ctrl-C to abort.${C_RESET}"
    sleep 2
  fi
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
    preflight_warn_main_state
    echo "${C_DIM}creating worktree from origin/main...${C_RESET}"

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
    # Append a standard handoff instruction so the track session ends with a
    # PR ready for auto-merge-safe.yml to pick up. Without this, sessions push
    # a branch but never open a PR, and the auto-merge pipeline has nothing to
    # act on.
    local handoff
    handoff='

When the task above is complete and you are ready to hand off:
  1. Commit your work on this branch.
  2. Push to origin.
  3. Open a draft PR with:
       gh pr create --draft --base main --title "<short title>" --body "<description>"
     Auto-merge-safe.yml will flip it to ready and merge it once the security
     and ci checks pass on the PR head commit.

If you hit a blocker or cannot finish the full task, push what you have and
still open the draft PR, with a body that describes what landed and what is
left. That keeps the work reviewable and a future session can pick it up.

Do not add the needs-user-review label unless you want to stop the automatic
merge — e.g., you made a judgment call that should get human eyes before
landing.'
    claude "${initial_prompt}${handoff}"
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
