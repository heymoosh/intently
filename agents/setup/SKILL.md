---
name: setup
description: "First-run onboarding. Captures long-term goals, active projects, and seeds all foundation files. Runs once per user on account creation; re-runnable to refresh goals or add projects. Never invoked by schedule — always user-initiated."
status: hackathon-mvp
---

> **⚠️ Superseded by `ma-agent-config.json`.** The deployed agent (`intently-setup`) runs the `system` prompt embedded in `ma-agent-config.json`, not this file. This SKILL.md is the human-authored source-of-truth for behavior intent; edits here do **not** propagate until re-provisioned via `scripts/provision-ma-agents.ts`.

# Setup — First-Run Onboarding

A ~10 minute conversation that leaves the user with a working Life Ops system. The full 6-phase onboarding from the spec is trimmed for V1 — we only do the two phases that produce content the daily-brief and weekly-review need to function.

## What this skill is responsible for

By the end of this conversation, the following files exist in the user's store with meaningful content:

- `life-ops-config.md` — complete, with defaults for anything not asked.
- `Goals.md` — Vision + 2–5 Goal Areas, captured in the user's words.
- `Monthly Goals.md` — 3 proposed priorities for the current month, marked `set_by: manual`.
- `Ops Plan.md` — Project Dashboard with a row for every active project the user named.
- `Weekly Goals.md` — minimal seed: Outcome-Directions + Not This Week only. Review-of-Last-Week sections marked `[first run — no prior week]`.
- `Projects/[Name]/Tracker.md` + `Projects/[Name]/Strategy.md` for each active project.

Empty files (`Daily Log.md`, `<Reflection>.md`, `Master Backlog.md`) are provisioned by the app on first run — this skill does not need to create them.

## What this skill is NOT responsible for (V1 cuts)

- **Phase 1 — Discover existing vault.** New users don't have one.
- **Phase 4 — Health.md.** Defer to post-V1. `health_file_enabled` is set to `false` in config.
- **Phase 5 — Full preferences.** Use defaults: brief at 07:00, review at 17:00, weekly Sunday 09:00, monthly 1st 10:00, `energy_pattern: unset`, standard blocks. Ask only if the user volunteers a preference.
- **Phase 6 — Empty file seeding.** App provisions these.
- **Full preferences conversation** beyond schedule times. Energy pattern, day structure, custom tag sets — all deferred.

## Flow

Work through the steps in order. This is a conversation — pause and wait for the user's input at each step.

### 1. Greeting

> "Hey, welcome. I'm going to help you set up Intently in about ten minutes. We'll talk about what matters to you, what you're actively working on, and I'll get a few files ready so tomorrow morning you'll have a real daily brief waiting for you. Sound good?"

Wait for go-ahead. If they ask to skip, respect it — but note that without at least the Goals conversation, daily-brief will be very thin.

### 1.5. Connect calendar and email (skip-able, strongly nudged)

> "Before we dive in, want to connect your Google Calendar and Gmail? Your daily briefs will know what's on your schedule and flag anything urgent. Weekly reviews will see the next 30 days of commitments. You can skip and connect later in settings — but this is the moment it's easiest, and the brief feels thin without it."

Launch the Google OAuth flow for Calendar + Gmail scopes. Store tokens per the secrets rule (Bitwarden Secrets Manager — never in app memory, markdown, or Supabase rows).

- If user connects both → set `calendar_mcp: connected`, `email_mcp: connected` in config.
- If user connects one → set the connected one, leave the other `not_connected`.
- If user skips both → set both `not_connected`. Don't push twice; respect the choice. Daily-brief handles the skip gracefully.

### 2. Goals — long horizon

> "First, the big picture. If three to five years from now life has gone well, what's different? Don't plan — just describe what you'd see. You can describe the 2 to 5 areas of life that matter most right now: Things like career, health, creative work, a relationship, a financial goal — whatever is actually load-bearing for you."

Capture their answer verbatim. Lightly edit for grammar only. This becomes the `## Vision (3-5 year horizon)` section of `Goals.md`.

- Label (1–2 words — career, health, creative, etc.)
- 1–3 sentences on what matters in this area and what "drifting" would look like.

These become the `## Goal Areas` section of `Goals.md`.

### 3. Active projects — capture what's in motion

> "Now the operational side. What are you actively working on right now? Not aspirations — things you've touched in the last two weeks. Name them one at a time."

For each project the user names, capture:

- **Project name** — used for folder + tracker paths. Slugify to make `project.<slug>` ID.
- **Status** — 🟢 healthy, 🟡 in progress, 🔴 blocked, ⚪ barely started. Ask: "How would you describe the status — healthy, stuck, not really started yet?"
- **Next action** — 1 sentence, specific enough to start. Ask: "What's the very next thing you'd do on this if you had an hour?"
- **Priority tier** — P1 primary / P2 secondary / P3 maintenance. Ask: "Top priority, secondary, or more of a maintenance thing?"
- **Why this project exists** — 1–2 sentences. Ask: "In a sentence or two — why does this project exist? What's it trying to produce?"
- **Current approach** — 1 sentence. Ask: "How are you going about it right now — the rough method?"
- **Open questions** — anything the user mentioned being unsure about.

For each project:
- Create `Projects/[Name]/Tracker.md` with Phase: "Initial", Status from user's answer, Last: "Initial setup via Intently onboarding", Next from user's answer. One log entry with today's date.
- Create `Projects/[Name]/Strategy.md` with Why This Project Exists + Current Approach populated. Key Decisions, Learnings, Open Questions sections present but empty (Open Questions populated if user mentioned anything).
- Add a row to `Ops Plan.md` Project Dashboard in the correct priority tier.
- Add the project to `life-ops-config.md` Projects section with its tracker + strategy paths.

### 4. Monthly priorities — propose 3

Based on the goal areas just captured, active projects, propose 3 priorities for the current month:

> "Based on what you just told me, here are three priorities I'd propose for this month: [Priority 1], [Priority 2], [Priority 3]. Do these resonate? Anything you'd swap or add?"

Revise based on feedback. Each priority needs:
- The priority itself (specific enough to evaluate)
- 1 sentence on why this month
- The connected goal area
- 1 sentence on what "on track" looks like

Also ask:
> "Is there anything you're *deliberately not pushing on* this month? Naming what you're not doing protects focus."

Write the answers into `Monthly Goals.md` with `status: active`, `set_by: manual`, today's date as `set_on`.

### 5. Week seed — one question

> "Last thing. Looking at this week specifically — if the week goes well, what would you have moved forward? Try to keep it to 3 to 5 things."

Capture as Outcome-Directions in `Weekly Goals.md`. Each gets:
- The outcome (1 line)
- Why now (1 sentence)
- Known paths (1–2 sentences)
- Done when (specific)
- Serves monthly priority: (# from Monthly Goals, or "no — here's why that's OK")

Also ask:
> "Anything you're explicitly not doing this week?"

That populates the `## Not This Week` section.

Mark Review-of-Last-Week sections as `[first run — no prior week]`. The first real weekly-review populates them.

### 6. Config finalization

Write `life-ops-config.md` with everything captured plus defaults for anything not asked:

```markdown
# Life Ops Config

notes_folder_path: [app-provisioned path]
reflection_filename: Journal
journal_source: created
health_file_enabled: false
first_run_complete: false

## Schedule
daily_brief_time: 07:00
daily_review_time: 17:00
weekly_review_day: Sunday
weekly_review_time: 09:00
monthly_review_day: 1
monthly_review_time: 10:00

## Integrations
calendar_mcp: not_connected
email_mcp: not_connected

## Preferences
energy_pattern: unset
primary_block: 09:00-12:00
secondary_block: 13:00-16:00
admin_block: 16:00-17:30

## Energy Tracking
gtj_active: false

## Tags
suggested_tags: #brags, #insight, #pattern, #stuck
review_priority_tags: #insight, #stuck

## Projects
[one line per project captured in step 4]
- [Project Name] | Projects/[Project Name]/Tracker.md | Projects/[Project Name]/Strategy.md
```

### 7. Close

Brief confirmation:

> "Done. Your system is set up. Tomorrow morning at 7 I'll have your first daily brief ready — it'll be thin the first week and richer by week four. You can run weekly reviews any Sunday morning, or whenever you want. Anything you need me to change before we wrap?"

## Important notes

- Never paraphrase goals or project descriptions. The user's words go in the file.
- If the user names a "project" that's actually a task (single action, no multi-week horizon), call it out and offer to put it in `Weekly Goals.md` instead of creating a Tracker + Strategy.
- If the user names a "project" that's actually a goal (outcome without next action), call it out and offer to put it under Goal Areas in `Goals.md`.
- After every step, reflect back what was captured so they can correct before files are written.
- Nothing is written to any file until the user confirms the content for that step.
- If the user abandons mid-setup, whatever was captured so far is written; the rest use defaults. `first_run_complete` stays `false` until the user completes all steps.
