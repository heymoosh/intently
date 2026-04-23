---
name: weekly-review
description: "Scheduled weekly review. Reads the past week's journal and logs, scores the week, archives, checks against Monthly Goals, plans next week, runs pre-mortems, and fully rewrites Weekly Goals. Fires on weekly_review_day + weekly_review_time from config. Not user-invoked."
status: hackathon-mvp
---

# Weekly Review

The compounding engine. This is a conversation, not a report — pause and wait for the user's input at each step.

## 0. Read the past week's journal

Read the journal file (filename from `reflection_filename` in config). Pull entries from the past 7 days — both freeform reflections and any `#gtj` structured entries. Surface emotional threads, patterns, and insights before any tactical step.

These extracted patterns will be written into the "Review of Last Week → Reflection patterns" section of the new `Weekly Goals.md` at step 8. **The journal stays pure; Weekly Goals carries the operational load.**

## 1. Surface incomplete goals — collaboratively

Read the current `Weekly Goals.md`. Compare Outcome-Directions to what actually got done (from `Daily Log.md` past 7 days).

Surface *what* didn't happen. **Do NOT infer *why*.** You may offer relevant observations from the week's data — journal entries, calendar density, notable patterns in the daily logs — for the user to consider, but frame them as offerings, not conclusions ("I noticed X — does that resonate?" not "these slipped because of X"). Ask the user to walk through reasons together. The reasons are often more nuanced than notes reveal. This section is a conversation, not a report.

## 2. Score the week

Assign a 1–10 score on: output quality, focus, energy, progress toward big goals. Record these in the "Review of Last Week" section of Weekly Goals.md — downstream agents read this as system signal.

Present the week qualitatively to the user (e.g., "productive but scattered", "recovery mode", "steady"). Do not lead with the numeric score. Surface the number only if the user explicitly asks for it.

One sentence on what made the biggest difference — positive or negative.

## 3. Archive and sync

- Trim all past Daily Log entries to Done-only (skip any already trimmed).
- Move the prior week (Sunday–Saturday of the just-completed week) out of `Daily Log.md` and prepend it to `Past/[Year] Archive.md`.
- Full tracker sync: read every active project's Tracker.md (paths from `life-ops-config.md` Projects section). Reconcile against the Ops Plan dashboard — status indicators, Next Action, Last Updated. This is the equivalent of running update-tracker across all projects at once.

Before writing to any tracker, apply the sorting rule from `docs/architecture/document-taxonomy.md`: trackers hold live state only.

## 4. Check against Monthly Goals

Read `Monthly Goals.md`. Before proposing next week's plan, check: does the proposed week serve at least one of the month's priorities? If not, name the gap:

> "Next week's plan serves priorities #1 and #2. Priority #3 hasn't had a dedicated nudge — worth adding something?"

Awareness, not guilt.

**If Monthly Goals are stale** (more than 5 weeks since `set_on`, or file missing), flag it:

> "Monthly Goals are stale — the next monthly review should refresh them."

Do not refuse to run; stale goals are better than none.

## 5. Plan next week

Based on the Command Center, Monthly Goals, and what actually happened this week, propose a concrete focus for next week. What are the 1–2 things that matter most? Connect them to Monthly Goals priorities where possible.

These become the Outcome-Directions in the new `Weekly Goals.md`.

## 6. Pre-mortem next week's risks

What's most likely to derail the plan? Name it specifically, with evidence, and suggest a mitigation. Goes into the Pre-Mortems & Risk Flags section of the new Weekly Goals.

## 7. Strategy check (light touch)

Ask:

> "Any of your project strategies feel off? Anything you've learned this week that changes how you're approaching something?"

If yes, prompt to update the relevant `Projects/[Name]/Strategy.md`. Use the user's words — never paraphrase. If no, move on. Strategy docs are lazy-loaded — don't read them unless this question opens that door.

## 8. Write the full Weekly Goals file

This is the critical output step. Fully rewrite `Weekly Goals.md` for next week with these sections (see `data-model.md` for exact format):

- **Review of Last Week:** scores, biggest positive, biggest drag, monthly priority check, reflection patterns (from step 0), last week's Done summary.
- **This Week's Outcome-Directions:** 3–5 outcomes, each with Why now, Known paths, Done when, and "Serves monthly priority: #N" or "no — here's why that's OK".
- **Pre-Mortems & Risk Flags:** from step 6.
- **Recurring Commitments:** standing meetings, health routines.
- **Not This Week:** explicit deferrals — protects focus.
- **System Notes:** operational flags for daily-brief and daily-review — tracker sync issues, format changes, queued fixes.

**Personal extensions pattern:** if the existing file has sections marked `<!-- personal: not managed by Life Ops plugin -->`, extract them before rewriting and re-append at the bottom in their original order. Never clobber.

The previous week's full operating context is replaced. Only last week's Done summary carries forward.

## 9. Prompt for reflections

Ask:

> "Anything worth capturing this week? A decision, a learning, something to remember?"

If shared, append to the journal file at the top of the current year's section. User's own words, lightest edits only. **This goes to the journal, NOT into Weekly Goals.** Weekly Goals is operational; the journal is personal.

## The weekly handoff

If this run fires on the configured `weekly_review_day` at or before `weekly_review_time`: proceed normally. Daily-brief will wait for you to complete before writing today's new entry (see `daily-brief/SKILL.md` → weekly handoff).

If this runs off-schedule (user-triggered on a different day): still proceed, but archive the week as of the last Saturday — don't retroactively redefine the week boundary.

## Important notes

- Every step is a conversation if the user is present. Present research, then listen.
- Strategy docs are NOT in the default read set (step 7 lazy-loads them on user signal). Avoid context bloat.
- Never write Financial Zone or any domain-specific check — those are user personal extensions, not plugin behavior.
- Set `first_run_complete: true` at the end of the first successful weekly-review.

## First-run handling

If `first_run_complete: false`: this is the first weekly-review.

- Skip step 0 (no prior-week journal entries).
- Skip step 1 (no prior-week goals to compare against).
- Skip step 2 (no full week of data to score).
- Step 3: no archive needed if there's less than a full week in Daily Log.
- Steps 4–8 run normally. The Review-of-Last-Week sections in the new Weekly Goals carry the marker `[first run — no prior week]`.
- At step 9, AFTER everything else completes successfully, flip `first_run_complete: true` in config.

From the second weekly-review onward, all steps run normally.
