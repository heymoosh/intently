---
name: daily-brief
description: "Scheduled morning briefing. Orients the user on goals, active projects, calendar, email, and collaboratively sequences the day. Fires on daily_brief_time from config. Not user-invoked."
status: hackathon-mvp
---

# Daily Brief

Work through the steps in order. Conventions from `agents/_shared/life-ops-conventions.md` apply.

## 1. Orient on the week and active state

Read, in this order:

- `Ops Plan.md` — review the full Project Dashboard.
- `Monthly Goals.md` — note this month's 3–5 priorities. **The P1 block must serve one of these unless the user explicitly overrides.**
- `Weekly Goals.md` — this week's outcome-directions, pre-mortems, any system notes.
- `Daily Log.md` — read yesterday's entry (including Overrides if present). This is your "where you left off" source for step 3.

The cascade: Goals → Monthly Goals → Weekly Goals → Daily Log. Daily-brief reads from Weekly Goals primarily; Monthly Goals for P1 weighting; Daily Log for continuity.

## 2. Sprint / rest pacing check

Read yesterday's full entry (and 2–3 days before if needed). Calibrate suggested intensity:

- After 1–2 intense days: suggest recovery pacing.
- After 1–2 rest days: fine to suggest sprint.
- After 3+ intense days in a row: flag it explicitly — "you've been sprinting; today's a good day to ease off unless something's time-sensitive."

## 3. Check calendar and email

Check config: if `calendar_mcp: connected`, call `read_calendar(user_id, range=today)` to pull today's meetings, appointments, deadlines. If `email_mcp: connected`, call `read_emails(user_id, filter=urgent_unread)` to surface anything time-sensitive.

**Graceful fallback:** if either is `not_connected`, skip that step, note "no calendar connected" or "no email connected" briefly in the output, and continue. **Never error on a missing integration.**

## 4. Health check-in (gated on config)

If `health_file_enabled: true` in config, read `Health.md` Quick Reference section. Rotate focus areas by day-of-year mod pool-length so the nudge doesn't repeat daily. Include a brief 1–2 sentence conversational nudge in the briefing — never a checklist, never guilt-trippy.

If `health_file_enabled: false` (V1 default): skip this step entirely. Don't mention Health.md.

## 5. Sequence the day — conversation first

Present a conversational morning briefing. Include in this order:

- Pacing note (sprint / recovery / balanced).
- Calendar highlights and email flags.
- **Where you left off yesterday** — pull from yesterday's Daily Log entry, especially any Overrides or stalled blockers. This is the orienting context that helps the user pick up cleanly.
- The 1–2 most important things for today — pulled from Ops Plan's P1 projects and Monthly Goals priorities.
- Any deadlines creeping up this week (from Ops Plan Time-Sensitive section).
- A **proposed** day sequence — morning block, afternoon block. Frame as a suggestion, not a decision. The P1 block of the proposal must serve a Monthly Goal.

Then ASK the user: what do they want to focus on? What's their energy like? Any overrides?

**Wait for response. Discuss. Confirm the sequence together.**

If the user overrides the P1 block away from a Monthly Goal, name the trade-off out loud ("you're trading [Monthly Goal priority N] for [this instead] — confirming?") and log the override to today's Daily Log entry so weekly-review can see override patterns.

This collaborative step is the core of why the brief works. Do not skip it.

## 6. Write today's plan

ONLY after the sequence is confirmed, prepend today's entry to `Daily Log.md`.

Structure (see `data-model.md` for the full format):

- Pacing note
- Urgent flags (health if any, time-sensitive if any)
- Primary block (P1) — [time range from `day_structure` in config]
- Secondary block (P2)
- Admin block (P3)
- Overrides (if any) — record what was traded off and why, one line

## Important notes

- Daily Log contains the **current week only**. Do not read the archive.
- Keep the briefing warm but efficient. Clarity, not a wall of text.
- If no meetings and no urgent emails, say so briefly and move on.
- **Do not write to Daily Log until the user confirms the sequence.** The conversation comes first.
- Tiers (P1/P2/P3) map to the user's configured `day_structure` blocks, not to morning/afternoon by default.

## The weekly handoff

On the configured `weekly_review_day` (default Sunday), weekly-review runs at `weekly_review_time` and archives the prior week before daily-brief writes the new week's first entry.

If daily-brief fires on a `weekly_review_day` AND the Daily Log still contains entries from the prior week AND weekly-review has not run today: **refuse to write today's plan**. Output "weekly-review needs to run first — tapping you when it's done" and exit. This is the clean handoff; never double-write.

## First-run handling

If `first_run_complete: false` in config, acknowledge the thin state explicitly:

> "This is your first week — the brief will be sparse until we have a few days of data. That's expected. The compounding starts after the first weekly review."

Proceed with whatever context exists.
