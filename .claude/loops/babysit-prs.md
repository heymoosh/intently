---
name: Babysit PRs
type: loop
invocation: /loop 15m <paste prompt at bottom of this file>
priority: P1
owner: user
model: Opus 4.7
effort: high
---

# Babysit PRs

## Purpose

Close the gap between what `auto-merge-safe.yml` can do deterministically and what requires model judgment. The workflow handles 90% of PR lifecycle (classify, merge-on-green). This loop handles the other 10%: merge conflicts, stalled PRs, rebase chains, and flagging PRs that genuinely need the user's eyes.

## What auto-merge-safe.yml already does (don't duplicate)

- Classifies each `auto/*` and `feat/track-*` PR by changed files.
- Mechanical path → merge on `security.yml` green.
- Docs/config path → flip ready + add `needs-user-review` label.
- Code path → merge on `security.yml` AND `ci.yml` both green.
- Respects `needs-user-review` label as an escape hatch.

**If a PR is moving through that pipeline normally, do nothing.** The loop is for the stuck cases.

## What this loop handles

1. **Merge conflicts on stacked track branches.** When branch A merges to main, branch B (stacked on A) now conflicts with origin/main. The loop rebases B onto origin/main; if the rebase is clean, force-push (with-lease) to the branch; if it conflicts, inspect.
2. **Conflict resolution by intent.** Both branches touched same lines → read both sides → resolve in this order:
   - **Mechanical (no intent overlap):** rename, reorder, whitespace, additive-non-overlap (e.g. branch A added a test, branch B renamed a variable that appears in the same hunk). Resolve automatically.
   - **Intent supersession (newer decision wins):** both branches edited the same idea and one is clearly fresher (e.g. two updates to the same TRACKER row, two edits to the same CLAUDE.md rule, two competing decisions in a handoff). Take the version on the newer commit and auto-resolve. Note the supersession in the resolution comment.
   - **Genuinely ambiguous:** both branches encode parallel decisions where neither obviously supersedes the other, OR the change is to behavior-bearing code where "newer" doesn't imply "better." Add `needs-user-review` label with a specific question in a PR comment.
3. **Stalled PRs.** No commits on the branch for >2h AND `security.yml`/`ci.yml` haven't been run (or keep failing with the same error). Comment once with what's blocking.
4. **Missing checks.** Branch pushed but a workflow never triggered. Re-trigger via `workflow_dispatch`.
5. **Cleanup.** After a `feat/track-*` PR is merged and its branch deleted remotely, remove the local worktree at `~/wt/<slug>` if it's clean (no uncommitted changes, no unpushed commits).

## What this loop MUST NOT do

- Merge anything that's in the workflow's "I'd auto-merge this" path — let the workflow do it. Race conditions create duplicate commits.
- Push to `main` or any non-`auto/*` / non-`feat/track-*` branch.
- Remove `needs-user-review` label once added. Only the user takes that off.
- Rebase a PR whose author is the user (i.e. not `auto/*` or `feat/track-*`). Their feat branches are theirs to manage.
- **Originate** edits to `TRACKER.md`, `CLAUDE.md`, or `.claude/handoffs/*` — those are owned by other routines or interactive Claude sessions. Resolving a merge conflict in those files during a rebase is allowed and follows the conflict-resolution rules above (mechanical → auto, newer-supersedes → auto, ambiguous → `needs-user-review`).
- Force-push without `--force-with-lease` — never overwrite unseen upstream commits.

## Model + effort

Opus 4.7, high. Conflict resolution needs semantic judgment. Sonnet at medium under-resolves and either over-flags (noise) or auto-commits wrong merges (silent regression). Opus xhigh is overkill — these are single-PR decisions, not architecture.

Drop to Sonnet 4.6 medium once: (a) conflict rate is measurably low on stacked tracks, and (b) we observe Sonnet handling the existing conflict patterns correctly via offline dry-runs.

## Cadence

`/loop 15m` during 07:30–22:30 local. Fast enough to feel responsive when a merge lands and downstream needs rebase; slow enough that cost stays low when nothing's moving.

Overnight: not needed. The overnight build loop produces new stacked PRs but they don't conflict with each other at creation time. Conflicts emerge when humans merge, which happens during the day.

## Loop iteration shape

Each iteration:

```
1. LIST: gh pr list --state open --json number,headRefName,labels,mergeable,mergeStateStatus,author
     filter to branches matching auto/* or feat/track-*
     skip PRs with needs-user-review label

2. FOR EACH PR:
   a. If mergeable (clean, all checks passing): log "workflow will handle", skip
   b. If CONFLICTING:
        fetch origin
        try rebase onto origin/main (or onto the PR's base branch if stacked)
        if clean: force-push-with-lease, comment "rebased onto $base"
        if conflict: analyze hunks
          MECHANICAL (rename/reorder/whitespace/additive-non-overlap): resolve, force-push, comment
          NEWER-SUPERSEDES (same idea, one is clearly fresher): take newer, force-push, comment notes the supersession
          AMBIGUOUS (parallel decisions OR behavior-bearing code): add needs-user-review label + comment with specific question
   c. If CHECKS_FAILING with same error as last run:
        check last commit SHA equals last iteration's recorded SHA for this PR
        if yes, and commit is >2h old: add needs-user-review label + comment
   d. If CHECKS_MISSING (no run for either security.yml or ci.yml on head SHA):
        re-trigger via workflow_dispatch

3. CLEANUP: any feat/track-* branch that's merged remotely:
     if worktree exists at ~/wt/<slug> and is clean:
         git worktree remove ~/wt/<slug>

4. REPORT: write routine-output/babysit-prs-<YYYY-MM-DD>-<HHMM>.md with:
     - PRs acted on (PR# + action taken)
     - PRs flagged for review (PR# + question)
     - Worktrees cleaned up
     - Any unexpected errors
     If the iteration was a no-op, write nothing (silent success).
```

## Stop conditions (per iteration, not per run)

- No open `auto/*` or `feat/track-*` PRs.
- 3 consecutive fires with nothing to do → back off to 30m for the next run (self-tuning cost).
- Current hour is outside 07:30–22:30 local → exit silently.

## Reporting

Each non-trivial iteration writes `routine-output/babysit-prs-<date>-<time>.md` in the schema above. On silent-success iterations, write nothing. The release-readiness-steward consumes these alongside other routine outputs.

Do NOT edit `TRACKER.md` directly — write a routine-output report and let release-readiness synthesize it into the morning go/no-go.

## Launch

**Manual (this session):**

```
/loop 15m Read .claude/loops/babysit-prs.md and execute ONE iteration per the brief. Use Opus 4.7 at high effort. This loop may fire whether or not there is work; a no-op iteration should exit silently and write nothing. Honor all hard-stops in the brief, especially: do NOT merge anything auto-merge-safe.yml would merge (race conditions); do NOT push to main/feat/*/non-auto branches; do NOT remove needs-user-review labels; do NOT force-push without --force-with-lease; do NOT edit TRACKER.md, CLAUDE.md, or any file under .claude/handoffs/.
```

**Recurring (via launchd, after first manual run proves clean):**

Add a `babysit-prs` case to `~/.intently/bin/intently-routine.sh` using `ALLOWED_BASE,$ALLOWED_AUTOFIX` allowlist, and a launchd plist firing every 15 min in the existing loop window.

## Follow-up after first flight

If the first few iterations complete cleanly (write nothing when there's nothing to do, correctly resolve one test conflict, correctly flag one semantic conflict):

- Promote to launchd-scheduled via the wrapper.
- Consider dropping to Sonnet 4.6 medium if the observed conflict patterns are purely mechanical.
- Tune cadence (lengthen if too chatty, shorten if merges take too long to propagate).
