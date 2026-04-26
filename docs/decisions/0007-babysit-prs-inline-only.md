# ADR 0007 — `babysit-prs` runs inline-only, no standalone schedule

## Status

Accepted (2026-04-25). Supersedes the standalone-launchd promotion described in `.claude/loops/babysit-prs.md` § Launch.

## Context

`babysit-prs` was promoted to a standalone launchd schedule firing every 15 min during 07:30–22:30 local. Its job: rebase stacked `feat/track-*` branches, resolve mechanical merge conflicts, flag semantic ones, clean up worktrees post-merge.

By 2026-04-25 the launchd plist (`~/Library/LaunchAgents/com.intently.babysit-prs.plist`) had fired roughly 60+ times across the day. Inspection of `~/.intently/logs/babysit-prs.log` shows **every single iteration was a no-op**: "No open `auto/*` or `feat/track-*` PRs … exiting silently per the brief."

Cause:
- `feat/track-*` branches are produced by the overnight build loop (`scripts/intently-track.sh`), which is dormant during normal solo-developer daytime work.
- Daytime work is on `chat/*`, `feat/*` (non-track), and `worktree-agent-*` branches — explicitly out of `babysit-prs` scope.
- The `overnight-build-loops` handoff (also 2026-04-25) already specifies that `/babysit-prs` should fire **inline hourly during the overnight build loop**, not on its own 15-min schedule (cheaper, less noisy).

So the standalone schedule is architecturally redundant: the inline-hourly invocation owned by the overnight loop covers the only window where `feat/track-*` branches exist.

The inbox capture `.claude/inbox/2026-04-25T1900-babysit-prs-watchdog-issues.md` (commit `0df181f`) flagged "babysit-prs … have issues" without specifying. Diagnosis: not "broken" in the error sense — firing cleanly, exiting cleanly. The "issue" is **pure waste**: 60+ Opus 4.7 high-effort invocations/day with zero work to do.

## Decision

**`babysit-prs` runs inline-only, invoked by the overnight build loop. The standalone launchd schedule is decommissioned.** The slash command (`.claude/commands/babysit-prs.md`) and spec (`.claude/loops/babysit-prs.md`) are preserved — the overnight-build-loops handoff invokes both.

Concretely:
- **Out of repo:** `launchctl unload ~/Library/LaunchAgents/com.intently.babysit-prs.plist`, `rm` that plist, remove the `babysit-prs)` case from `~/.intently/bin/intently-routine.sh`. (User-only action — wrapper script and `~/Library/LaunchAgents/` are not tracked in git.)
- **In repo:** TRACKER § Next #7 closes referencing this ADR + PR; `docs/process/parallel-tracks.md` § "Stop the babysit loop" updated; `.claude/loops/babysit-prs.md` § Launch flagged that the launchd promotion is reverted; `.claude/handoffs/overnight-build-loops.md` reaffirms the inline-hourly cadence as the only invocation path.

## Alternatives considered

1. **Keep the standalone schedule, lengthen cadence.** Rejected: even at 1× per hour the loop has nothing to do during the day. The architectural fix (inline-hourly inside overnight build loop) already exists.
2. **Full removal — delete spec + slash command + plist.** Rejected: the overnight-build-loops handoff actively plans to invoke `/babysit-prs` inline. Deleting the spec and slash command would break that plan. Decommission only the standalone schedule.
3. **Move to a much sparser cron (e.g., once/hour during overnight only).** Rejected: redundant with the overnight build loop's inline-hourly invocation. Two separate scheduled wake-ups for the same purpose.

## Consequences

- Cost waste eliminated (60+ Opus-4.7-high no-ops/day → 0).
- The capability to rebase / resolve / clean up `feat/track-*` PRs is preserved via `/babysit-prs` inline invocation during overnight build loops.
- If `feat/track-*` workflow is ever resurrected for daytime use, re-promoting to a standalone launchd schedule is a reversible, one-file change (recreate plist, add wrapper case).
- The `~/Library/LaunchAgents/` plist removal is user-only (out-of-repo action). This is documented as a manual follow-up.

## References

- Inbox capture: `git show 0df181f:.claude/inbox/2026-04-25T1900-babysit-prs-watchdog-issues.md`
- Sibling diagnosis (build-watchdog half): PR #159, AC `docs/product/acceptance-criteria/build-watchdog-teeth.md`
- AC for this decision: `docs/product/acceptance-criteria/babysit-prs-diagnosis.md`
- Architectural successor: `.claude/handoffs/overnight-build-loops.md` § "Decisions made" — `/babysit-prs` hourly inline.
