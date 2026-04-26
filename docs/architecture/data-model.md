> **⚠ Original intent — implementation moved, contracts did not.** The architectural shape, schema-level contracts, and behavioral intent described here remain load-bearing. The "markdown-files-as-source-of-truth" implementation has been superseded by Supabase migrations (`supabase/migrations/0001-0010_*.sql`); markdown is now a render-on-demand view. **Read this doc for WHAT each entity is and WHY it exists; read the migrations for HOW it is currently stored.** Scope of supersession is locked in `docs/decisions/0011-scope-of-design-folder-supersession.md`.

# Life Ops Plugin — File Schema & Contracts

**Purpose:** This document defines the *shape* of every file the Life Ops plugin creates, reads, or writes. For each file type it specifies: required sections, format, which skills write to it, which skills read from it, first-run state, and missed-run behavior.

**Audience:** Skill developers building or modifying the plugin. This is the authoritative contract — if a skill's behavior disagrees with this document, fix the skill.

**Not in scope:** What files *exist* in a specific user's vault (that's routing, not schema). What's currently *in* a file (that's state, not schema). Personal extensions a user adds to their own vault (see "Personal Extensions" at the bottom).

---

## Global Conventions

These apply to every file in the plugin.

**Date format:** `YYYY-MM-DD` everywhere. No regional variants, no "April 8 2026" style.

**Log ordering:** Newest entry at the top. Every append-style file (Daily Log, Journal, Tracker log sections, Archive) prepends.

**Status indicators:** 🔴 Blocked · 🟡 In Progress · 🟢 Healthy · ⚪ Not Started. These are the only four. No custom variants.

**Priority tiers:** P1 = primary focus · P2 = secondary · P3 = maintenance / as-needed. No P0, no P4. **Tiers do NOT imply time-of-day.** When tier work actually happens is controlled by `day_structure` in `life-ops-config.md`, which maps each tier to the user's own energy pattern. Never hardcode "morning = P1."

**Path resolution:** All file paths are resolved relative to the notes folder root stored in `life-ops-config.md` under `notes_folder_path`. Skills never hard-code absolute paths.

**Reflection file naming:** The reflection file is user-named during setup (default: `Journal`). Throughout this schema it is referred to as `<Reflection>.md`. Every skill MUST read the actual filename from `life-ops-config.md` → `reflection_filename`. Skills never assume the file is called "Reflections.md" or "Journal.md" — they always dereference through config.

**Missing integration behavior:** If calendar or email MCPs are not connected, the skill skips that step, notes "no calendar connected" or "no email connected" in the output, and continues. Never errors on missing integrations.

---

## File Inventory

These are the files the plugin creates and manages:

| File | Category | Owner Skill | Cascade Layer |
|---|---|---|---|
| `life-ops-config.md` | Config | setup | — |
| `Goals.md` | Strategy | setup (seed) + monthly-review (update) | 1 (vision) |
| `Monthly Goals.md` | Strategy | monthly-review | 2 (monthly filter) |
| `Ops Plan.md` | Tracker | setup (seed) + daily-review + weekly-review + monthly-review + update-tracker | — (inventory, not cascade) |
| `Weekly Goals.md` | Tracker | weekly-review | 3 (weekly operating context) |
| `Daily Log.md` | Tracker | daily-brief + daily-review | 4 (daily plan) |
| `<Reflection>.md` | Log (journal) | daily-review + weekly-review + monthly-review (prompted) | — |
| `Health.md` | Reference (optional) | setup only | — |
| `Master Backlog.md` | Reference | user (manual) + monthly-review (prune/promote) | — |
| `Past/[Year] Archive.md` | Archive | weekly-review | — |
| `Projects/[Name]/Tracker.md` | Tracker | setup (seed) + update-tracker + daily-review + weekly-review + monthly-review | — |
| `Projects/[Name]/Strategy.md` | Strategy | setup (seed) + user (manual) + weekly-review (prompted) + monthly-review (prompted) | — |

The **cascade** is Goals → Monthly Goals → Weekly Goals → Daily Log. Ops Plan is *not* in the cascade — it's the operational inventory that sits alongside the cascade and gets held up against Monthly Goals during weekly reviews.

---

## `life-ops-config.md`

**Purpose:** The single source of truth for plugin configuration. Every skill reads this before doing anything else.

**Writers:** `setup` (on install and on re-run).
**Readers:** All skills.

**Required fields:**

```markdown
# Life Ops Config

notes_folder_path: [absolute or workspace-relative path to the notes folder root]
reflection_filename: [user-chosen name without .md extension — default: Journal]
journal_source: [created | adopted — tracks whether Life Ops created the journal or adopted an existing one (e.g., from GTJ/Job Search Agent)]
health_file_enabled: [true | false]

## Schedule
daily_brief_time: [HH:MM, 24h, default 07:00]
daily_review_time: [HH:MM, 24h, default 17:00]
weekly_review_day: [day name, default Sunday]
weekly_review_time: [HH:MM, 24h, default 09:00]
monthly_review_day: [1-28, default 1]
monthly_review_time: [HH:MM, 24h, default 10:00]

## Integrations
calendar_mcp: [connected | not_connected]
email_mcp: [connected | not_connected]

## Preferences
energy_pattern: [known | tracking | unset]
primary_block: [time range — e.g., 09:00-12:00]
secondary_block: [time range — e.g., 13:00-16:00]
admin_block: [time range — e.g., 16:00-17:30]

## Energy Tracking
gtj_active: [true | false — whether the user has active GTJ entries in the journal. Set to true when first #gtj entry is detected or written. Used by daily-review to decide whether to include the GTJ capture nudge.]

## Tags
suggested_tags: [comma-separated list — defaults: #brags, #insight, #pattern, #stuck]
review_priority_tags: [subset of suggested_tags that weekly/monthly review pulls to the top of pattern extraction]

## Projects
[List of detected projects with paths — one per line]
- Project Name | Projects/Project Name/Tracker.md | Projects/Project Name/Strategy.md
```

**Critical:** The Projects section is the mapping `update-tracker` uses to resolve "I worked on X" to the correct tracker file. Without this, update-tracker has no way to find trackers. Setup MUST populate this during Phase 3. It's also the mapping the generic `project-continue` skill uses to find Tracker + Strategy docs when the user says "continue [project name]."

**Energy pattern workflow:** Setup asks "do you know when in your day you do your best focused work?" Three paths:
- **known** — user answers, setup stores `primary_block`, `secondary_block`, `admin_block`, sets `energy_pattern: known`.
- **tracking (opt-in)** — user says they don't know and wants to figure it out. Setup sets `energy_pattern: tracking` and for the next 7 days, daily-brief asks "when do you want your P1 block today?" and daily-review asks "when did P1 actually happen and how did it feel?" After 7 entries, a lightweight synthesis proposes a pattern, user confirms, state flips to `known`.
- **unset** — user declines both. Setup stores sensible defaults (09:00-12:00 / 13:00-16:00 / 16:00-17:30), sets `energy_pattern: unset`. User can invoke the tracking loop manually any time by saying "let's figure out my energy pattern."

The tracking loop is never forced. It's available on-demand even after setup completes.

**First-run state:** Written by setup at the end of onboarding. Before setup runs, this file does not exist. Skills that run before setup has completed must fail gracefully with "Life Ops not yet configured — run setup first."

**Missed-run behavior:** N/A. This file is static until setup re-runs or the user edits it.

---

## `Goals.md`

**Purpose:** Long-term vision and annual milestones. The top of the cascade. Changes rarely.

**Writers:** `setup` seeds it. `monthly-review` updates it *only with explicit user agreement during an attended review*. An automated/unattended monthly review NEVER writes to Goals.md.
**Readers:** `monthly-review`.

**Not read by:** daily-brief, daily-review, weekly-review. The cascade principle is enforced here — lower layers never reach up past their immediate parent. Weekly review cares about Monthly Goals, not Goals.

**Required sections:**

```markdown
# Goals

## Vision (3-5 year horizon)
[Prose. What life looks like if things go well.]

## Annual Milestones — [Year]
- [Milestone 1]
- [Milestone 2]
...

## Goal Areas
### [Area name — e.g., Career, Health, Creative, Financial]
[1-3 sentences on what matters in this area and what "drifting" would look like.]
```

**First-run state:** Seeded by setup Phase 2 via the "what matters to you right now" conversation. Minimum viable seed is Vision + 2-5 Goal Areas. Annual Milestones can be empty and filled in by the first monthly review.

**Missed-run behavior:** If the monthly review skips a month, Goals.md is untouched. It's designed to be stable across missed runs.

---

## `Monthly Goals.md`

**Purpose:** The strategic *filter* for the current month. 3-5 priorities that answer "of everything I could work on, what actually matters most this month?" This is the file the weekly review holds up against Ops Plan to ask "does this week serve what matters?"

**Writers:** `monthly-review` (fully rewrites on the 1st of each month). An automated/unattended monthly review may write *proposed* monthly goals, but must mark them `status: proposed` and NOT overwrite the prior month's goals until the user confirms.
**Readers:** `weekly-review` (primary), `daily-brief` (for weighting — see note below).

**Daily brief weighting rule (resolved):** The daily brief assigns the P1 (primary) block to a Monthly Goal priority BY DEFAULT. That's the enforcement mechanism — primary focus always serves a monthly priority unless the user explicitly overrides. When the user overrides, the brief must name the trade-off out loud ("you're trading [monthly priority X] for [this instead] — confirming?") and log the override to the Daily Log entry so weekly-review can see override patterns across the week. P2 and P3 blocks are free to be anything. This replaces the earlier "weight monthly goals at 50%" framing with a rule the brief can actually enforce.

**Required sections:**

```markdown
# Monthly Goals — [Month Year]

**Status:** [active | proposed]
**Set on:** [YYYY-MM-DD]
**Set by:** [monthly-review-attended | monthly-review-unattended | manual]

## Priorities
1. [Priority — specific enough to evaluate]
   - Why this month: [1 sentence]
   - Connected goal area: [from Goals.md]
   - What "on track" looks like: [1 sentence]
2. ...
3. ...

## Deliberate Non-Priorities
[1-3 things the user is explicitly choosing NOT to push on this month. This protects focus.]

## Context
[1-2 sentences on what's happening this month — travel, constraints, opportunities from calendar. Informed by the monthly review's 30-day calendar scan.]
```

**First-run state:** Seeded by setup Phase 2 at the end of the goals conversation — setup proposes 3 priorities from the week-one discussion. These are marked `set_by: manual` until the first real monthly review.

**Missed-run behavior:** If no monthly review runs on the 1st, the prior month's Monthly Goals stays in place. The weekly review detects this by comparing `Set on` to today's date. If the goals are more than 5 weeks old, weekly review flags: "Monthly goals are stale — next monthly review should refresh them." It does NOT refuse to run — stale goals are better than no goals.

**Deliberate Non-Priorities is not optional.** Every monthly review must fill it in, even if it's just "nothing explicitly deprioritized this month." The act of naming what you're NOT doing is the filter.

---

## `Ops Plan.md`

**Purpose:** The operational inventory. Everything currently in motion across the user's life. This is the comprehensive view — the "is anything falling off?" file. It is NOT a priority filter; Monthly Goals is the filter.

**Writers:** `setup` seeds it. `update-tracker` updates individual project rows. `daily-review` syncs status/next-action fields from trackers. `weekly-review` does a full sync across all projects. `monthly-review` does a full sync and resets priority tiers if the portfolio shifted.
**Readers:** `daily-brief`, `daily-review`, `weekly-review`, `monthly-review`, `update-tracker`.

**Required sections:**

```markdown
# Ops Plan

**Last synced:** [YYYY-MM-DD by skill-name]

## Project Dashboard — P1 (Primary Focus)
| Project | Status | Next Action | Tracker Path | Last Updated |
|---|---|---|---|---|
| [name] | 🟡 | [action] | Projects/[name]/Tracker.md | YYYY-MM-DD |

## Project Dashboard — P2 (Secondary)
[same columns]

## Project Dashboard — P3 (Maintenance / As-Needed)
[same columns]

## Time-Sensitive
| Item | Due | Owner Skill | Source |
|---|---|---|---|
| [e.g., renew driver's license] | YYYY-MM-DD | daily-brief (surface) | manual |
```

**Critical columns:**

- **Tracker Path** — every project row MUST include the path to its tracker file. This is how `update-tracker` resolves user input to a specific file. Without this, update-tracker is guessing. If setup detects a project but the user hasn't accepted a tracker location, the row is created with Tracker Path empty and marked `⚪ Not Started` until resolved.
- **Last Updated** — used by weekly-review to detect stale rows.

**Time-Sensitive section ownership:**
- `daily-brief` reads it every morning and surfaces anything due within 7 days
- `weekly-review` prunes items whose due date has passed
- Users add items manually or via conversation with any skill
- If no items, section stays with just the header — never deleted

**First-run state:** Seeded by setup Phase 2 via the "what are you actively working on" conversation. Each item the user names becomes a row, classified into P1/P2/P3 based on the user's own ranking. Tracker Path is filled in during Phase 3 when Tracker.md files are created.

**Missed-run behavior:** If daily-review is skipped, Last Synced goes stale. Weekly review catches this and does a full sync regardless. The "Last synced" timestamp is how any skill detects drift.

**What Ops Plan does NOT contain:** Monthly Priorities (moved to Monthly Goals.md), long-term goals (Goals.md), strategic reasoning (project Strategy.md files).

---

## `Weekly Goals.md`

**Purpose:** The full operating context for the current week. Contains last week's review intelligence AND this week's outcome-directions. This is the single file the daily brief reads to know what the week is about.

**Writers:** `weekly-review` (fully rewrites every Sunday).
**Readers:** `daily-brief` (primary), `daily-review` (for comparing plan vs. done).

**Required sections:**

```markdown
# Weekly Goals — Week of [YYYY-MM-DD]

## Review of Last Week
**Scores (1-10):** Output [n] · Focus [n] · Energy [n] · Progress [n]
**Biggest positive:** [1 sentence]
**Biggest drag:** [1 sentence]
**Monthly priority check:** [which of this month's priorities actually got served last week, and which didn't]
**Reflection patterns:** [3-5 bullets extracted from last week's Journal entries]
**Last week's Done summary:** [1-line list of what got completed]

## This Week's Outcome-Directions
1. [Outcome — what will be true if the week goes well]
   - Why now: [1 sentence]
   - Known paths: [1-2 sentences — how you'd approach it]
   - Done when: [specific enough to evaluate]
   - Serves monthly priority: [# from Monthly Goals, or "no — here's why that's OK"]
2. ...
3-5 total.

## Pre-Mortems & Risk Flags
- [What's most likely to derail this week, with evidence and mitigation]

## Recurring Commitments
- [Standing meetings, health routines, etc.]

## Not This Week
- [Explicit list of things being deferred — protects focus]

## System Notes
[Operational flags for the daily briefing/review — tracker sync issues, format changes, queued fixes. Short.]
```

**First-run state:** Seeded by setup Phase 2 via the "what would you have moved forward this week" conversation. Setup writes a *minimal* Weekly Goals: Outcome-Directions and Not This Week only. Review of Last Week, Reflection patterns, and Last week's Done are left empty with the marker `[first run — no prior week]`. The first weekly review populates all sections normally.

**Missed-run behavior:** If the weekly review is skipped, the Weekly Goals file stays in place. Daily brief detects staleness via the "Week of" date. If the file is more than 10 days old, daily brief flags: "Weekly Goals is stale — run weekly review when you can" and proceeds with the old file anyway.

**Strict rule:** The "Review of Last Week" section is where operational intelligence from reflections lives. Reflections patterns are extracted here, not left buried in the Journal. The Journal stays pure (personal); Weekly Goals carries the operational load.

---

## `Daily Log.md`

**Purpose:** The current week's daily plans and done-summaries. Current week only — Sunday through Saturday. Past weeks are archived.

**Writers:** `daily-brief` (prepends AM plan after user confirmation), `daily-review` (appends PM Done section and trims older entries).
**Readers:** `daily-brief` (reads yesterday's entry), `daily-review` (reads today's entry), `weekly-review` (reads the full week before archiving).

**Required format — today's entry (full):**

```markdown
### YYYY-MM-DD — [Day of week]

**Urgent flags:** [health, time-sensitive, or none]

**Primary block (P1) — [time range from config]:**
- [primary focus work — MUST serve a Monthly Goal unless explicitly overridden]

**Secondary block (P2) — [time range from config]:**
- [secondary work]

**Admin block (P3) — [time range from config]:**
- [email, pending items, maintenance]

**Overrides (if any):**
- [if P1 was set to something other than a Monthly Goal, record what was traded off and why — one line]

**Done:**
- [populated by daily-review]
```

**Required format — trimmed prior-day entry:**

```markdown
### YYYY-MM-DD — [Day]
**Done:**
- [items]
```

**Trim rule (updated from spec):** The evening daily-review trims EVERY entry older than today to Done-only. Not just yesterday. This handles missed-day bloat — if the user skipped review for 2 days, the next daily-review cleans all backlogged full-entry days in one pass. Already-trimmed entries are left alone.

**Week boundary (the Sunday problem):** The week is Sunday 00:00 → Saturday 23:59. On Sundays, weekly-review runs at 09:00 and is responsible for archiving the *prior* week (Sun-Sat that just ended) before daily-brief runs on the new Sunday. If daily-brief runs before weekly-review on a Sunday (user triggers it manually), daily-brief detects "today is Sunday AND Daily Log contains entries from the prior week AND weekly-review hasn't run today" and refuses to write today's plan until weekly-review runs. This is the clean handoff.

**First-run state:** Created empty by setup Phase 6. First daily-brief writes the first entry.

**Missed-run behavior:** Handled by the trim rule above. No special first-time logic needed.

---

## `<Reflection>.md` (filename from config)

**Purpose:** The user's personal journal. Running log of reflections, insights, patterns, automatic thoughts, and structured energy tracking entries (GTJ). Stays pure — no operational content gets written here. The journal is the **shared contract** between Life Ops, the Good Time Journal skill, and the Job Search Agent — see "Shared Journal Contract" below.

**Writers:** `daily-review`, `weekly-review`, `monthly-review` — all prompt the user and append the user's own words if shared. Never paraphrase, never reframe. `good-time-journal` (if used) — writes structured `#gtj` entries with engagement/energy metadata.
**Readers:** `weekly-review` (reads past 7 days), `monthly-review` (reads past ~30 days). Both read ALL entry types — freeform reflections and `#gtj` entries.

**Not read by:** `daily-brief`. Daily brief gets everything it needs from Weekly Goals, which already contains the weekly review's extracted patterns.

**Required format — freeform reflections:**

```markdown
# [Year]

### YYYY-MM-DD
[User's words, lightly edited for spelling/grammar only]
Tags: [#self #grow #ant as applicable]
---

### YYYY-MM-DD
...
```

**Required format — GTJ entries (written by the Good Time Journal skill):**

```markdown
### YYYY-MM-DD

**[Activity description — one line] — [duration]** #gtj
Engagement: [Low | Medium | High | Flow] · Energy: [Draining | Neutral | Energizing]
Context: [1-line AEIOU insight — environment, interaction style, trigger, tools]
> [User's own words — follow-up response, unedited]
```

**Both formats coexist** under the same date headings. A single day can have freeform reflections and multiple GTJ entries. GTJ entries are identified by the `#gtj` tag and the structured `Engagement:` / `Energy:` fields. Skills that need only GTJ data filter by these markers; skills that need all journal content read everything.

**Energy Profile entry (reference artifact):**

When the GTJ skill completes a weekly synthesis (7+ days of data), it writes an Energy Profile entry tagged `#gtj #energy-profile`. This is a reference artifact summarizing the user's energy patterns, flow triggers, and work preferences. Monthly reviews cross-reference current patterns against the Energy Profile to detect drift.

**Tags (user-driven, not reserved):** Users define their own tag vocabulary. Setup proposes a starter set (`#brags`, `#insight`, `#pattern`, `#stuck`) stored in `life-ops-config.md` under `suggested_tags`, which the user can freely edit, rename, or delete. The plugin never hardcodes specific tag names.

**Reserved tag: `#gtj`** — Used exclusively by the Good Time Journal skill. Reviews recognize this tag and parse the structured fields for richer pattern detection. Users do not need to type this tag manually.

**How reviews use tags:** Weekly and monthly reviews read ALL entries in their window (tagged or not) — prose is never ignored. But entries containing a tag listed in `review_priority_tags` get **pulled to the top of the pattern-extraction pass** as signal amplification. `#gtj` entries additionally get their structured fields parsed for engagement/energy pattern analysis. Tags are a shortcut for "the user flagged this as important," not a filter. If the user sets no tags at all, reviews still work by reading prose only.

**Read-window parsing:** "Past 7 days" and "past 30 days" are determined by the `YYYY-MM-DD` date heading at the top of each entry. Entries without a parseable date heading are skipped during read with a warning logged. The plugin does not repair malformed entries.

**First-run state:** Created by setup Phase 6 with just the year heading. Empty until the first review prompts a reflection. **Exception:** If the GTJ skill created the journal before Life Ops was installed, the file may already contain `#gtj` entries. Setup discovers and adopts this file — see Shared Journal Contract below.

**Missed-run behavior:** If no reflection is captured for a window, weekly/monthly review notes "no reflections this week" and continues. Empty reflection history is a valid state, especially for new users.

**Retention:** The file grows forever by design. There is no archive/rollover. If the file grows past a performance-relevant size (>500KB), the weekly-review flags it and suggests the user manually split by year — the plugin does not auto-split because journal entries are too personal to touch without consent.

### Shared Journal Contract

The journal file is the shared contract between Life Ops, the Good Time Journal skill, and the Job Search Agent. **No plugin owns it exclusively.** Whichever plugin or skill creates it first establishes the file; the others discover and adopt it.

**Discovery rules for setup:**
1. Check if `life-ops-config.md` already has a `reflection_filename`. If yes, that file is the journal.
2. If no config exists, scan for existing journal files: look for files named Journal.md, Reflections.md, or any `.md` with dated entries (pattern: `### YYYY-MM-DD` followed by prose or `#gtj` structured entries). If found, confirm with the user and adopt.
3. If nothing found, create a new journal file using the user-chosen name.

**Why this matters:** A user may start with the Job Search Agent, do GTJ energy tracking, and create a journal file. When they later install Life Ops, the journal — with all its GTJ entries — is already there. Life Ops adopts it, and the review skills immediately have structured energy data to work with alongside freeform reflections. No migration step. No data loss.

---

## `Health.md` (optional)

**Purpose:** Reference file for health/wellness nudges in the daily briefing. Only exists if the user opts in during setup Phase 4.

**Writers:** `setup` only. The plugin does not update Health.md after initial setup. Users edit it manually.
**Readers:** `daily-brief` only.

**Required sections:**

```markdown
# Health

## Current Goals
- [Goal 1 — e.g., 7 hours sleep nightly]
- [Goal 2]

## Quick Reference (rotation pool)
- [Nudge topic 1 — e.g., hydration]
- [Nudge topic 2 — e.g., movement breaks]
- [Nudge topic 3]
```

**Rotation rule:** Daily brief rotates through the Quick Reference pool by day-of-year mod pool-length. This is deterministic (no state file needed) and ensures even coverage. If the pool has 4 items, item N is chosen where N = day_of_year % 4.

**First-run state:** Only created if user answers yes in Phase 4. Otherwise the file does not exist and `health_file_enabled: false` in config. Daily brief checks config first; if false, skips the health step entirely.

**Missed-run behavior:** N/A — this file is static.

---

## `Master Backlog.md`

**Purpose:** Parking lot for ideas, someday/maybe items, and projects not yet activated. Prevents "I don't want to forget this but I can't work on it now" anxiety.

**Writers:** The user (manually, any time). `monthly-review` prunes stale items and promotes items into active projects.
**Readers:** `monthly-review`.

**Not read by:** Any daily/weekly skill. Backlog is strategic context, not operational.

**Required format:**

```markdown
# Master Backlog

## Ideas
- [YYYY-MM-DD] [Idea or someday project]

## Parked Projects
- [YYYY-MM-DD] [Project name] — [1 sentence why it's parked] — [tracker path if it exists, otherwise "no tracker yet"]

## Dropped
- [YYYY-MM-DD] [Item] — [reason dropped]
```

**Promotion workflow:** When monthly-review promotes an item from Backlog to an active project, it:
1. Creates `Projects/[Name]/Tracker.md` and `Projects/[Name]/Strategy.md` using the templates below
2. Adds a row to Ops Plan with the new tracker path
3. Moves the backlog entry to a `## Promoted [Month Year]` section with the promotion date
4. Updates `life-ops-config.md` Projects section

Promotion never happens during daily or weekly reviews — it's a monthly-only operation to prevent impulsive project churn.

**Adding to backlog:** The plugin does not ship a dedicated "add to backlog" skill. Users add manually, or any skill can offer to append if the user says "park this" / "add this to the backlog" during a conversation. The spec intentionally keeps this low-friction and manual.

**First-run state:** Created by setup Phase 6 with just the three section headers. Empty.

**Missed-run behavior:** N/A — manual file.

---

## `Past/[Year] Archive.md`

**Purpose:** Where archived Daily Log weeks go. Organized by year, one file per year.

**Writers:** `weekly-review` prepends the just-archived week.
**Readers:** `monthly-review` (for "what actually got done last month").

**Required format:**

```markdown
# [Year] Archive

## Week of YYYY-MM-DD (prior Sun-Sat)
[The trimmed Daily Log entries for that week — Done-only format]

## Week of YYYY-MM-DD
...
```

**First-run state:** File created by weekly-review on its first run. Setup creates the `Past/` folder empty.

**Missed-run behavior:** If weekly review is skipped, archive doesn't get written that week. Next weekly review catches up by archiving however many weeks of Daily Log are present, in reverse chronological order (newest first, so the Week of headings end up in correct order after prepending).

---

## `Projects/[Name]/Tracker.md`

**Purpose:** Operational state for a single project. Status, next action, log of what happened.

**Writers:** `setup` seeds it. `update-tracker` is the primary writer. `daily-review`, `weekly-review`, `monthly-review` all update status/next-action during sync steps.
**Readers:** Every review skill that syncs Ops Plan. `update-tracker` when the user reports progress.

**Required sections:**

```markdown
# [Project Name] Tracker

## Status
**Phase:** [phase name]
**Status:** [🔴|🟡|🟢|⚪]
**Last:** [what happened most recently — 1 sentence]
**Next:** [next action — specific enough to start]
**Last updated:** YYYY-MM-DD

## Log
### YYYY-MM-DD
- [What was done or decided]
### YYYY-MM-DD
- [Older entries below]
```

**Critical rule:** The four Status fields (Phase, Status, Last, Next) are the only fields that update-tracker and the review skills touch. They NEVER reorganize the log section or modify anything below it. The log is user-owned after setup.

**First-run state:** Seeded by setup Phase 3 with Phase="Initial", Status=⚪ or 🟡 based on user's answer, Last="Initial setup via Life Ops onboarding", Next from the user's "what's the next thing" answer. Log has one entry: the setup date.

**Missed-run behavior:** Trackers don't have their own run cadence — they're updated reactively. If no skill touches a tracker, Last Updated goes stale and weekly-review flags it.

---

## `Projects/[Name]/Strategy.md`

**Purpose:** The why behind a project. Evolves with learnings. Separate from the tracker so status updates don't bury strategic reasoning.

**Writers:** `setup` seeds it. The user edits it directly. `weekly-review` and `monthly-review` prompt updates but do not write automatically — they ask, and only write if the user gives specific words.
**Readers:** `monthly-review` (full read). `weekly-review` ONLY reads the file when the user says "something feels off" during the light strategy check (lazy load — not included in the default read set).

**This resolves the weekly-review context-bloat issue:** strategy docs are NOT in weekly-review's default read set. They're lazy-loaded only when the user signals they want to discuss strategy.

**Strategy vs Tracker — the rule that removes the capture decision:**

- **Tracker = what happened + current live state.** Phase, Status, Last, Next, and a dated log of WHAT was done. Stays lean. No "why."
- **Strategy = the current understanding of the problem or goal.** Updates ONLY when that understanding shifts — new constraint, reframe, approach change.
- **update-tracker never writes to Strategy.md.** Ever. It logs to Tracker.md, period. Users never have to decide "tracker or strategy" in the moment of capture.
- **Strategy updates happen in two places:**
  1. **In-session via project-continue skills (primary path).** The generic `project-continue` skill (see below) loads Strategy.md into context at session start. If during the session the user says something that contradicts or extends the current strategy, the assistant MUST pause and ask: *"This sounds like it shifts [specific part of strategy]. Want to update the strategy doc?"* Only on explicit user yes does the file get edited.
  2. **Monthly-review safety net.** Reads all Strategy.md files for active projects and asks: *"Has your understanding of any of these projects shifted in the last month?"* Catches projects that haven't been touched via project-continue, and sessions where in-session drift wasn't flagged.
- **Cost:** A strategic insight captured in a tracker log will live as a dated bullet until it gets explicitly promoted. If the user references "why did I decide X" weeks later, they read the tracker log. That's acceptable — it matches how memory actually works.

---

## Generic `project-continue` Pattern

**Purpose:** A generic continuation skill that works for any project with a Tracker.md + Strategy.md. Triggered by "continue [project name]" or "where are we on [project]."

**Why this is viable now:** The schema enforces consistent file structure per project. Before the schema, every project had its own layout, which is why specialized project-continue skills had to be hand-built per project. With enforced structure, one skill can orient on any project.

**Behavior:**
1. Resolve project name to folder path via `life-ops-config.md` Projects mapping
2. Read `Projects/[Name]/Tracker.md` — Phase, Status, Last, Next
3. Read `Projects/[Name]/Strategy.md` — current understanding of problem/goal
4. Surface: where things stand, what's next, any blockers from Status = 🔴
5. Listen for strategy drift during the session and prompt updates per the rule above

**What it does NOT do:**
- Cross-project dependency detection (e.g., "Website is blocked on Film"). That's a weekly-review concern, not a continuation concern.
- Domain-specific autonomous prep work (scanning job boards, running company research, consulting playbooks). Those stay in specialized extension skills for projects where the domain prep is the actual value.

**Relationship to existing specialized skills:** The generic ships with the plugin. Users (and Muxin) can keep specialized project-continue skills alongside it for cases where domain prep pays for itself. The specialized ones become optional extensions, not required.

**Required sections:**

```markdown
# [Project Name] Strategy

## Why This Project Exists
[Captured from onboarding conversation. Short — 2-4 sentences.]

## Current Approach
[How you're going about it — methods, tools, principles.]

## Key Decisions
- [YYYY-MM-DD] [Decision and reasoning]

## Learnings
- [YYYY-MM-DD] [What was learned]

## Open Questions
- [Things the user is unsure about]
```

**First-run state:** Seeded sparse. "Why This Project Exists" populated from the onboarding answer. Current Approach may be one sentence or empty. Key Decisions, Learnings, Open Questions sections exist but are empty. This is the intentional state — strategy docs are meant to grow as the project runs, not to be perfect on day one.

**Missed-run behavior:** N/A — no automated writes.

---

## The Unattended Monthly Review Rule

**Problem:** The plugin spec said unattended monthly reviews should "set Monthly Priorities based on best judgment." That violates the conversational design principle — silently setting cascade-critical files is exactly the kind of invisible cognitive shift the system avoids.

**Schema rule:** An unattended monthly review may write a `Monthly Goals.md` with `status: proposed` — but it must NOT overwrite an existing `status: active` file. The proposed file is written to `Monthly Goals — Proposed.md` alongside the active file. On the user's next interaction with any Life Ops skill, they're prompted: "Your unattended monthly review proposed new goals on [date]. Review them now?" Only after explicit user confirmation does the proposed file become the active Monthly Goals.md.

**Unattended monthly review may still:** update Ops Plan dashboard, update trackers whose status shifted, scan reflections for patterns, write a full report. It just may not unilaterally change the filter layer of the cascade.

**Attended monthly reviews:** write Monthly Goals.md directly after user agreement during the conversation. No proposed step.

---

## First-Run Mode

Every skill must handle "this is my first week using the plugin" gracefully. The detection rule is uniform: check `life-ops-config.md` for a `first_run_complete: true` flag. Setup writes `first_run_complete: false` initially and flips it to `true` at the end of the first successful weekly review.

**While first_run_complete is false:**
- Daily brief acknowledges thin context: "Your briefs will get richer as you use the system. First week is habit-building."
- Daily review skips the "compare plan to done" step if there's no AM plan to compare against
- Weekly review uses the seed Weekly Goals format (no prior week to review) and populates the normal format for week 2 onward
- Monthly review refuses to run in first_run_complete=false state — there's no data. It notes "not enough data for monthly review yet" and schedules itself to try again next month.

---

## Personal Extensions Pattern

The plugin is a subset of what a sophisticated user might want. Users (including the builder) will add sections, files, and workflows that are personal and not part of the ship version.

**The rule:** A user's personal extensions go in one of two places:

1. **Additional sections within plugin files** — allowed, but must appear AFTER all plugin-required sections and be marked with an HTML comment `<!-- personal: not managed by Life Ops plugin -->`. Plugin skills preserve these sections during rewrites. For example, a user can add a `## Financial Zone` section to Weekly Goals.md and the weekly-review skill will leave it alone on rewrite (it only replaces plugin-managed sections).

2. **Entirely separate files** — allowed and unrestricted. The plugin never reads files it doesn't own. A user's `Health.md`, `Lost Woods Brand Architecture.md`, etc., are invisible to plugin skills unless the plugin file references them.

**Rewrite rule for plugin skills:** When a skill rewrites a file (e.g., weekly-review rewriting Weekly Goals.md), it:
1. Reads the current file
2. Extracts any sections marked `<!-- personal: not managed by Life Ops plugin -->`
3. Writes the new plugin-managed content
4. Re-appends the personal sections at the bottom in their original order

This is the pattern that lets Muxin's rich personal vault coexist with the clean plugin schema. Her vault will have personal extensions; a stranger's vault installing the plugin fresh will have none. Both work.

---

## What This Schema Does NOT Define

- The conversation scripts each skill uses (those live in each skill's SKILL.md)
- Trigger phrases for skills (those live in SKILL.md descriptions)
- The specific prompts used to extract reflection patterns (weekly-review implementation detail)
- How Ops Plan dashboard rows are sorted within a priority tier (implementation choice)
- Rendering of dates in briefing output (display concern, not schema)
- Any user's specific projects, goals, or file contents

If any of these ever feel like they need to be schema-level, it's a sign the implementation is leaking into the contract and should be pulled back into the skill.
