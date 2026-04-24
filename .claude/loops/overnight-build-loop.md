---
name: Overnight Build Loop
type: loop
invocation: /loop 1h <paste prompt at bottom of this file>
priority: P1 (experimental; first run 2026-04-22→23)
owner: muxin
model: Opus 4.7
effort: high
---

# Overnight Build Loop

## Purpose

Bounded, unsupervised implementation work while Muxin sleeps. Picks the highest-priority *unblocked* item from TRACKER.md "Next", ships it on an `auto/build-loop/*` branch as a draft PR, repeats. Morning review is a sequence of PR merges, not from-zero work.

## Model + effort

- **Default:** Opus 4.7, high.
- **Rationale:** Per `When to use opus 4.6, 4.7, and sonnet 4.6.md`, tool-using agentic coding defaults to Opus 4.7 xhigh — but each iteration here is bounded implementation (skill loader, tool scaffolds, migration SQL), not multi-file architectural work. High is appropriate; xhigh is the escalation lever.
- **Escalate to xhigh** if: the scope for a given night includes system design, 10-30 file refactor, or deep cross-cutting debug.
- **Drop to Sonnet 4.6 medium** if: the scope is purely high-volume repetitive edits (codemods, batch tests).
- **Re-check each time this loop is scheduled:** consult `/Users/Muxin/Documents/Personal Obsidian/Projects/Opus 4-7 Hackathon/Claude Code Practices/When to use opus 4.6, 4.7, and sonnet 4.6.md` before configuring.

## Tonight's scope — where to read it

Scope is dynamic and authored by the **Scope Overnight Steward** (21:00 daily launchd routine, `.claude/routines/scope-overnight-steward.md`).

**Read scope from:** `routine-output/scope-overnight-<YYYY-MM-DD>.md` where `<YYYY-MM-DD>` is today's date (the day the loop starts, before midnight).

Before the first iteration:

1. Open `routine-output/scope-overnight-<today>.md`.
2. If it does not exist, the Scope Overnight Steward did not fire (or was skipped). Exit immediately with a failure note at `routine-output/build-loop-<today>-00.md` explaining: "No scope file found. Overnight scope routine must fire before the build loop runs."
3. Read the iteration chain. Each iteration in the chain gets one loop iteration in order. The scope file's iteration numbers map 1:1 to the loop iteration numbers.
4. If an iteration has `status: approved` or `status: edited` annotations Muxin added after the 21:00 routine fired, honor them. If an iteration is marked `status: skipped` by Muxin, skip it and move to the next.
5. If the scope file flags fewer than 3 READY iterations at the top, log the warning but proceed — Muxin may have approved a short night.

**Fallback (pre-routine night, e.g. 2026-04-23 before the steward's first fire):** a one-off scope file may be hand-authored by Claude or Muxin during the evening session. Same file path, same schema. The loop treats hand-authored and routine-authored files identically.

## Hard stops

The loop **must not**:

- Touch Google APIs, OAuth flow, or anything needing real credentials.
- Interact with Bitwarden or read/write secrets files.
- Run `supabase db push` against the remote.
- Run EAS builds or anything that spends quota.
- Push to `main`, `feat/*`, or any non-`auto/*` branch.
- Merge any PR (all PRs open as `--draft`).
- Edit `TRACKER.md`, `CLAUDE.md`, or `.claude/session-handoff.md` — those are owned by other routines.
- Add dependencies without checking `app/package.json` first; prefer using what's already installed.

If an iteration hits any of the above, skip the item, write a note to `routine-output/`, move to the next.

## Branching strategy

- **Base:** current HEAD of the starting branch (whatever Muxin was on).
- **Branch name:** `auto/build-loop/2026-04-23-NN-<slug>` where NN is the iteration number zero-padded and slug describes the item (e.g. `01-skill-loader`, `02-tool-scaffolds`).
- **Stacked:** iteration N+1 branches from iteration N's branch, not from base. Morning review is a sequential merge chain.

## Per-iteration definition of done

All six must succeed or the iteration rolls back:

1. Code files written.
2. Unit tests written (Jest or equivalent; if no test infra is wired yet, create the minimum harness inline and note it in the PR body).
3. `npx tsc --noEmit` passes in `app/` (for TypeScript iterations).
4. `git add <specific files>` — never `git add .` or `git add -A`.
5. `git commit` with conventional message (e.g., `feat(skill-loader): concat shared + per-skill prompt into agent definition`).
6. `git push -u origin auto/build-loop/2026-04-23-NN-<slug>` and `gh pr create --draft --base <previous-branch-or-main> --title "..." --body "..."`.

On any step failing:
- Attempt one fix.
- If still failing, roll back the branch (`git reset --hard <base>` on the auto branch only) and write a failure note to `routine-output/build-loop-2026-04-23-<iter>.md` explaining root cause. Abandon the iteration, move to the next.

## Reporting

Each iteration writes `routine-output/build-loop-2026-04-23-<iter>.md`:

```
# Iteration <N> — <slug>

**Started:** <ISO timestamp>
**Ended:** <ISO timestamp>
**Status:** shipped | failed | skipped
**PR:** <url, if shipped>
**Base branch:** <branch name>

## What shipped
- files changed
- test coverage added

## Blockers surfaced
- things a human needs to decide / provide
```

Do not edit `TRACKER.md`. The release-readiness-steward at 03:00 (or 07:00) reads all `routine-output/*-2026-04-23.md` files and prepends a go/no-go block to TRACKER.md Status.

## Stop conditions

Exit immediately if any of:

- 6 iterations completed.
- No unblocked items remain in the scope list above.
- 3 consecutive iterations failed.
- Current time is past 05:30 local (leave runway before release-readiness runs at 07:00).
- A hard-stop rule would be violated by the only remaining candidate item.

## Post-loop

On exit, write `routine-output/build-loop-2026-04-23-summary.md` with:
- How many iterations shipped vs failed.
- List of open draft PRs by URL.
- What the next session should pick up first.
- Whether this loop's first flight suggests making it recurring (see TRACKER follow-up item).

## Follow-up after first flight

If tonight's run ships ≥3 clean PRs, consider:
- Adding a `build-loop` case to `~/.intently/bin/intently-routine.sh` (matching the existing routine pattern — model, effort, allowlist, output path).
- Adding a launchd plist firing at 23:30 daily with a 6-iteration cap.
- Re-evaluating model/effort per the guide each time the scope changes.
