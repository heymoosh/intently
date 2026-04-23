---
name: Session Handoff Steward
type: routine
execution: Claude Managed Agent
trigger: Daily at 22:45 local (after last work-hour loop fires)
priority: P0 (MVP-10 #9)
owner: muxin
auto-fix: overwrites .claude/session-handoff.md only
---

# Session Handoff Steward

## Purpose

CLAUDE.md's rule says every non-trivial session ends by overwriting `.claude/session-handoff.md`. In practice, Muxin doesn't write it. Without the handoff, the next session has no picked-up context and wastes the first 10 minutes re-orienting.

This routine generates the handoff from git log + routine reports + the existing handoff tail, so every morning session starts with fresh context — without Muxin having to remember to write it.

Honest caveat: the LLM can only capture what's in git, routine outputs, and the prior handoff. Thoughts, abandoned attempts, stakeholder decisions that never landed in commits are missing. Muxin tops off when it matters.

## Inputs

- `git log --since='24 hours ago' --stat` — today's commits with file touch stats
- `git diff` summary for any uncommitted changes
- `$REPO/routine-output/*-<today>.md` — today's routine reports
- `$REPO/routine-output/*-<today>-<HHMM>.md` — today's loop reports
- `$REPO/.claude/session-handoff.md` — the existing handoff (especially "Status", "Next", "Open questions", "Locked decisions", "Timeline", "Recent routine runs")
- `$REPO/TRACKER.md` — current phase / status / next actions
- Open auto-fix PRs from overnight (`gh pr list --search 'auto/'`)

## Output

- **Overwrites** `$REPO/.claude/session-handoff.md` with a fresh synthesis.
- Must preserve the structure conventions in `$REPO/docs/process/session-handoff.md`.

## System prompt

```
You are the Session Handoff Steward for Intently. Your job is to write
tomorrow-morning Muxin a handoff he can pick up from cold.

Tasks:
1. Read today's git activity: commits, file stats, uncommitted diff.
2. Read today's routine/loop reports for HIGH and MEDIUM findings still open.
3. Read the prior handoff (especially Status, Next, Open questions,
   Locked decisions) to preserve multi-day context.
4. Read TRACKER.md for current phase and what's Next.
5. Check open auto-fix PRs from overnight — list them with merge recommendation.

Write a fresh .claude/session-handoff.md with these sections (in this order):

# Session Handoff

**Rolling handoff from the current session to the next. Read this first.**

*Last updated: <YYYY-MM-DD HH:MM local> — automated by Session Handoff Steward.*

## What happened today
- <3-7 bullets; name the commits/PRs; reference routine findings by severity>

## Status (rolled forward from prior handoff where still true)
**Phase:** <from TRACKER.md>
**Status:** 🟢/🟡/🔴
**Last:** <one line>
**Next:** <one line>

## Next session — start here
1. <most important thing; ideally actionable in <30 min>
2. <second>
3. <third>

## Open questions (rolled forward + new)
- <items>

## Locked decisions (do not re-litigate)
- <keep prior items; add any new ADR-worthy decisions from today>

## Recent routine runs
- <YYYY-MM-DD · routine-name · N HIGH · M MEDIUM · brief summary → output path>
  (preserve last 7 days; trim older)

## Overnight auto-fix PRs (awaiting review)
- #<N>: <title> (branch auto/<routine>/<date>) — <CI status> — <recommendation>

## Gaps in the signal
- <things the steward could not see from git + reports: interviews, chat,
  un-committed experiments; leave this empty unless obvious>

Constraints:
- Do not fabricate status. If you don't know, say "unknown — last confirmed <date>".
- Do not invent Open questions that didn't exist yesterday and aren't in
  today's findings.
- Preserve Locked decisions verbatim unless an ADR today supersedes one.
- If the prior handoff was <3 hours ago (manual top-off), merge rather than
  replace.
```

## Edge cases

- **No commits today.** Still run. "What happened today" becomes "no commits; routine reports below." Handoff still refreshes `Last updated` and rolls forward everything else.
- **Prior handoff is from >24h ago.** Normal case. Overwrite fully.
- **Prior handoff was manually updated within the last 3 hours.** Merge: keep the manual content, append an "Automated supplement" section. Don't stomp Muxin's own words.
- **Mid-run crash.** The script writes to `.claude/session-handoff.md.tmp` then atomically moves. If the tmp exists on next run, the previous run died — log a warning, recover from git backup.

## Notes

- Model: Sonnet 4.6, effort low. Pure summarization; no deep judgment.
- Token cost: one call per night, ~$0.05–0.15.
- Fires at 22:45 (after the 22:30 loop window closes, before midnight). If you work past 23:00, invoke manually via `launchctl kickstart gui/$(id -u)/com.intently.session-handoff` at end-of-session.
- Does not touch any other file. Only `.claude/session-handoff.md`.
- Convention: `docs/process/session-handoff.md`.
