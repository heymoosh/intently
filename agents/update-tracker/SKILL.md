---
name: update-tracker
description: "Universal project tracker updater. Invoked whenever the user finishes a work session and wants to log what happened, or says things like 'update tracker', 'log this', 'I just worked on X', 'mark that done', 'here's where I landed', 'oh I finished [anything]'. One skill for updating any tracker — the user never has to remember which project it belongs to."
status: hackathon-mvp
---

# Update Tracker — Universal Project Progress Logger

Your job: figure out which project was worked on, update the right tracker, and sync the change into the Command Center dashboard. The user should never need to remember which tracker to open — this skill does that mapping.

## 1. Read the Command Center

Read `Ops Plan.md`. This is the master dashboard. Every active project has a row with status, next action, and its Tracker Path column. Read `life-ops-config.md` Projects section for the definitive project-name → tracker + strategy path mapping (that's the lookup table; Ops Plan shows state).

## 2. Figure out what was worked on

Look at what the user said. They might:

- Name the project explicitly ("I worked on the website today").
- Describe what they did without naming it ("I finished the positioning decision").
- Reference an artifact that maps to a project ("the working doc is done").
- Mention multiple projects ("I did positioning in the morning and content in the afternoon").

Match their description to the Projects listed in `life-ops-config.md`. If ambiguous, ask:

> "Sounds like that might be [project A] or [project B] — which one?"

Most of the time context makes it obvious. Don't over-ask.

## 3. Sort before writing — taxonomy check

Before writing anything, apply the rule from `docs/architecture/document-taxonomy.md`:

- **State** (where are we, what's next) → tracker. 1–3 sentences max per entry.
- **Reasoning** (why, how, plan) → strategy doc.
- **Content** (creative direction, research, sourced data, concepts) → reference doc (user-owned).

If the user's input is a mix, split it — substance goes to the right doc, tracker gets a one-line pointer. The test: if a tracker entry would still be useful in 3 months, it doesn't belong there.

## 4. Read and update the tracker

For each project identified: resolve its tracker path from `life-ops-config.md` Projects section. Read the tracker. Update:

- Check off completed items (`- [ ]` → `- [x]` with a brief completion note).
- Update the Status block (Phase, Status indicator, Last, Next) if a phase or status changed.
- Append to the Log section (newest at top) with today's date heading.
- Note new blockers. If a blocker cleared, note what unblocked it.
- Preserve the tracker's existing structure — never reorganize.

**What goes in the log:** one-line state entries per the one-liner rule — project-relevant fact, no sub-bullets, no multi-sentence write-ups.

## 5. Sync the Command Center

Update the project's row in `Ops Plan.md` Project Dashboard:

- Status indicator (🔴 / 🟡 / 🟢 / ⚪) if state changed.
- Status text to reflect the new state.
- Next Action to reflect what comes next (pull from the tracker's Status: Next field).
- Last Updated date.

Update `Last synced:` at the top of `Ops Plan.md` with today's date and this skill name.

## 6. Strategy sync check

Read the project's Strategy.md (path from `life-ops-config.md`). Check whether the tracker still aligns with current strategy. Look for:

- Tracker tasks referencing a direction the strategy has moved away from.
- Strategy priorities with no corresponding tracker tasks.
- Status or phase labels contradicting the strategy's current state.
- Tracker next-steps that the strategy has deprioritized or dropped.

**If you find drift:** don't silently fix it. Surface as a question, not a correction:

> "I noticed the tracker still has tasks for [old direction], but your strategy doc shows you pivoted to [new direction]. Want me to update the tracker to reflect that?"

If the user confirms, update. If unsure, leave and note it for next session.

If no Strategy.md exists or it's empty, skip this step for that project — don't block on a missing file.

## 7. Confirm

Brief conversational confirmation:

> "Got it — marked positioning done in the tracker, Ops Plan now shows the website project as 🟢 ready to ship."

If the sync check found issues, mention them here — as a question, not a lecture. Keep it short.

## Important notes

- **This skill updates trackers, syncs the Command Center, checks strategy alignment.** It does not do project work, research, or planning.
- **Preserve tracker structure.** Update within the existing format — don't restructure sections.
- **When in doubt, ask.** A wrong update is worse than a quick clarifying question.
- **Multiple projects in one session are fine.** Update all affected trackers and Command Center rows.
- **Never paraphrase the user's description of what was done.** Light edits for grammar; otherwise their words.

## First-run handling

If `first_run_complete: false` and no projects exist yet in `life-ops-config.md`, respond: "No projects set up yet — want to run setup to capture what you're working on?" Do not attempt to update anything.
