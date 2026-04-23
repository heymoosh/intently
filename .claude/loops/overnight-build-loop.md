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

## Tonight's scope (2026-04-22 → 23)

Priority order. Skip any item whose preconditions aren't met.

1. **Skill loader** (`app/lib/skill-loader.ts` + unit tests). Concatenates `agents/_shared/life-ops-conventions.md` + `agents/<skill>/SKILL.md` → one agent definition string. Pure function, fully testable without network. TRACKER Next #1.
2. **Tool scaffolds with mocks** — `read_calendar`, `read_emails`, `read_file`, `write_file`. Function signatures, input/output types, fake implementations returning fixture data, unit tests proving the contract. **No real Google API or Supabase wiring.** TRACKER Next #3 (partial — real wiring is blocked on OAuth).
3. **`pg_cron` migration draft** — `supabase/migrations/0002_schedules.sql` stub with the schedule row inserts for `daily_brief_time`, `daily_review_time`, `weekly_review_day`/`weekly_review_time`. Config-table reads only; no backend function wiring. TRACKER Next #4 (partial).
4. **Eval harness scaffold** — `evals/runner/` directory with a minimal runner that reads a dataset + rubric + baseline and reports pass/fail. No real evals; just the shape.
5. **Skill loader hardening** — edge cases: missing SKILL.md, malformed frontmatter, unknown skill name, shared file too large.
6. **Free slot** — next unblocked TRACKER item or a quality improvement (e.g., test coverage gaps from iterations 1–5).

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
