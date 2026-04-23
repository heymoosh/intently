---
name: daily-review
description: "Scheduled end-of-day review. Wraps today's log, reconciles with chat history, syncs project trackers, and presents the day as a narrative reflection. Fires on daily_review_time from config. Not user-invoked."
status: hackathon-mvp
---

# Daily Review

End-of-day review. The administrative steps below need to run, but **the output to the user must lead with the day, not the checklist.** See "How to present this" before writing any final response.

## How to present this (READ THIS FIRST)

Lead with the day, not the admin work. Log updates, tracker syncs, chat reconciliation — all necessary, none of them what the user wants to hear first. Open with two beats, in this order:

**1. "Hey — congrats."** Then a one-line frame for what today was supposed to be: the plan going in, the central question, the stakes. Pull this from the morning's anchor or the Daily Log entry header.

**2. "Here's what you actually did."** A *narrative* read of the day — not a bulleted list. Group by what mattered most, not by project. Name the meaningful decisions, the tensions surfaced, the things the user heard that were hard to hear, the moments they course-corrected in real time. Honor what they did NOT do when it was the right call (paused work, rested, removed a commitment). End with an honest read of the day's shape — turning point, grind, recovery, pivot.

**Voice:** warm, specific, evidence-grounded. No hype. No "great job!" platitudes. The compliment is in the *specificity* — naming what they actually did and why it mattered. Reference real names, numbers, quotes where they exist. Match the care of a thoughtful friend who was paying attention all day.

**Length:** narrative is the main event. Usually 4–8 short paragraphs. Take the room it needs; don't pad.

Only AFTER the narrative, mention administrative work briefly — one short paragraph or a few lines at the end: "Log updated, yesterday trimmed, [N] open threads flagged for tomorrow." Admin is footer, not headline.

If the run is fully autonomous (user not present), still write the narrative — it goes into the output and they'll read it later. Format doesn't change because they're asleep.

**Never lead with the administrative checklist.** Treating the day as a task list is the failure mode this section exists to prevent.

---

## 1. Wrap today

Read `Daily Log.md`. Find today's entry. Add or update the `Done:` section with what's captured.

**One-liner rule for Done items:** every entry is a single line — project label, essential fact. No sub-bullets, no parenthetical explanations. If it doesn't fit on one line, cut until it does. The log is a signal, not a report.

Good: `- Website — editorial pass, 5 edits rewritten.`
Too much: `- Website — full editorial pass. Evaluated each section line-by-line. Five edits: (1)...`

## 2. Reconcile with today's chat history

The single biggest source of tracker drift is work that happened in chat with the agent today but never landed in the Daily Log or a tracker. Pull today's chat history for this user from the conversations store (Supabase), scan for:

- Decisions the user named out loud.
- Completed work ("I finished X", "shipped Y", "merged Z").
- Open threads ("still figuring out A", "blocked on B").
- Cross-project context that belongs in a specific tracker.

Compare against today's `Done:` section:

- Anything in chat that's NOT already in `Done:` → add it (one line, project-prefixed, same one-liner rule as step 1).
- Anything in chat that contradicts `Done:` → trust the chat (it's what actually happened).

Then ask a SHORT, ANCHORED residual question — not open-ended:

> "I caught this from our chats today: [1-line summary]. All of that's now in the log. Anything you did today *outside our conversations* — DMs, decisions, conversations with other people, work in another tab — that I should also capture?"

If they name anything, add it to `Done:`.

## 3. Trim past entries

Strip every Daily Log entry older than today to `Done:`-only. Already-trimmed entries are left alone. This handles missed-day bloat in one pass.

## 4. Sync Command Center

Read `Ops Plan.md`.

**Read only the trackers that today's `Done:` items reference.** Most days that's 1–2, not all of them. Use the Projects section in `life-ops-config.md` to map project labels to `Projects/[Name]/Tracker.md` paths. If today's Done touched no project trackers, skip tracker reads entirely.

Before writing to any tracker, apply the sorting rule from `docs/architecture/document-taxonomy.md`: trackers hold live state only, not research or rationale. If a Done item is research/strategy/rationale, route it to the right reference doc and leave a one-line pointer in the tracker.

Update the Project Dashboard rows for the trackers you actually touched: status indicators, Next Action, Status text, Last Updated date.

## 5. Present the day (the narrative)

Now write the narrative reflection per the "How to present this" section at the top. Steps 1–4 earn the right to write this honestly — but the user-facing output leads here.

## 5a. Surface recurring patterns (multi-day)

Before closing the narrative, scan the prior 7–14 days of `Daily Log.md` entries (and the journal file if available) for themes that appear across multiple days. Surface any pattern that has shown up **two or more times** — name it concretely and note how many times it appeared. If no repeating pattern is supportable from the data, do not invent one.

This is the "noticing" beat that turns daily review into compound insight. Examples: "Third time this week you paused work to handle an unexpected request — worth naming." "Four of the last seven days had an energy dip after 3 pm." Deliver it as a brief observation inside the narrative, not as a separate section.

## 5b. Shape tomorrow

After the narrative, include **one grounded suggestion for shaping tomorrow**. Pull from:
- Tomorrow's calendar (if `calendar_mcp: connected`, call `read_calendar(user_id, range=tomorrow)`)
- The Ops Plan's Time-Sensitive section
- The pacing signal from step 2 of daily-brief logic (today was intense → suggest a lighter tomorrow)

Anchor the suggestion in observed state, not generic advice. Examples: "Tomorrow's calendar is clear until noon — protect that block for [P1 project]." "You've been sprinting three days; tomorrow is a good day to let the afternoon breathe." One sentence or two, no more.

## 6. Prompt for reflections

After the narrative, ask:

> "Anything land for you today?"

If the user shares something, append to the journal file (filename from `reflection_filename` in config) at the top of the current year's section. Use the user's own words. Lightest edits only — never paraphrase, never reframe.

## Important notes

- Daily Log contains the CURRENT WEEK only. Don't worry about older entries — they're in `Past/[Year] Archive.md`.
- Keep the wrap-up conversational and concise.
- Step 2 chat reconciliation is what keeps trackers from drifting. Don't skip it.
- If the user engages in conversation during the review (asks questions, vents about the day), be present for that — don't rush through the steps.
- **Never lead the output with the administrative checklist.** Lead with the narrative.

## First-run handling

If `first_run_complete: false`: skip step 2 (no chat history yet) and skip step 3 (no past entries). Keep the narrative and reflection prompt — those work from day one.
