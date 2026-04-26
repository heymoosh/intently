---
name: setup
description: "First-run onboarding. Captures long-term goals, active projects, this-week outcome, and preferences. Runs once per user on account creation; re-runnable to refresh. Never invoked by schedule — always user-initiated."
status: active
---

> **Note:** The deployed agent (`intently-setup`) runs the `system` prompt embedded in `ma-agent-config.json`, not this file. This SKILL.md is the human-authored source-of-truth for behavior intent; edits here do **not** propagate until re-provisioned via `scripts/provision-ma-agents.ts`.

# Setup — First-Run Onboarding

## Memory protocol (Layer 3 — MA memory store)

**At session start:** List `/mnt/memory/` with the file tool. Read `/mnt/memory/onboarding-state.md` if present — resume from the last completed phase rather than restarting (e.g. "user named goals but left before projects").

**At session end:** Write `/mnt/memory/onboarding-state.md` with the current phase + what was entered. Once `first_run_complete` is `true`, write `status: complete` — the file persists but the agent skips the resume check on future re-runs.

A ~10 minute conversation that leaves the user with a working Life Ops system. Four phases: goals, active projects, this-week outcome, and preferences.

## What this skill is responsible for (by end of conversation)

- **Phase 1 — Goals.** 3–5 long-term goal areas in the user's words. Agent enriches each with a `monthly_slice` (concrete this-month direction) and a `glyph` icon. Written to `goals` table.
- **Phase 2 — Active projects.** 0–N active projects, each linked to a goal (optional FK). Written to `projects` table. Skippable.
- **Phase 3 — This-week outcome.** One specific thing the user wants to have moved forward by Sunday. Written to `life_ops_config.config.this_week_outcome`.
- **Phase 4 — Preferences.** `focus_area`, `work_hours` (start/end), `blockers`, `energy_pattern`. Defaults pre-filled; user adjusts or skips. Written to `life_ops_config.config`.
- **Phase 5 — Journal seed (optional).** "Anything on your mind right now?" Written to `entries` as `kind='journal'` if user says yes.

At the end, `life_ops_config.config.first_run_complete` is set to `true`.

## What this skill is NOT responsible for

- Calendar / email OAuth — handled by the OAuth handoff; setup skips entirely.
- Health tracking — `health_file_enabled: false` default, deferred post-V1.
- Vault discovery / legacy file seeding — not applicable to new users.

## Agent role

The agent is called **once**, after Phase 1 goal titles are collected. It returns a structured JSON response enriching each goal with `monthly_slice` + `glyph`. Phases 2–5 are handled entirely by the UI forms writing directly via `entities.js`.

## Phase 1 — Goals

Prompt the user:

> "What are the 2–5 areas of life that are most load-bearing for you right now? Things like career, health, relationships, a creative project, a financial goal. Don't plan — just name what actually matters."

For each goal, capture:
- `title` — 1–5 words, the user's language
- `rationale` — optional, 1–2 sentences they volunteer

Agent enrichment (structured JSON output per goal, indexed by `goal_index`):
- `monthly_slice` — 1–2 sentences: what would concrete progress on this area look like *this month*? Ground in what the user just said; do not invent ambitions they didn't express.
- `glyph` — one of the app glyph names (`leaf`, `star`, `flame`, `bolt`, `heart`, `shield`, `anchor`, `compass`, `mountain`, `sun`). Pick the one that best matches the goal's texture.

Return format:
```json
{
  "slices": [
    { "goal_index": 0, "monthly_slice": "...", "glyph": "leaf" },
    { "goal_index": 1, "monthly_slice": "...", "glyph": "star" }
  ]
}
```

## Phase 2 — Active projects (UI form, no agent call)

Prompt:

> "What are you actively working on right now — things you've touched in the last two weeks? Name them and pick which goal each serves. You can skip this."

For each project:
- `title` — name
- `goal_id` — the goal it serves (optional FK from Phase 1 results)

Skippable: if user has nothing active yet or wants to add later, move to Phase 3.

## Phase 3 — This-week outcome (UI form, no agent call)

Single question:

> "If this week goes well, what's the one thing you'll have moved forward by Sunday?"

Captures one string written to `life_ops_config.config.this_week_outcome`.

## Phase 4 — Preferences (UI form, no agent call)

Defaults pre-filled so the user can just confirm and continue:

| Field | Default |
|---|---|
| `focus_area` | *(from Phase 1 goal[0] title)* |
| `work_hours.start` | `09:00` |
| `work_hours.end` | `18:00` |
| `blockers` | *(empty array)* |
| `energy_pattern` | `unset` |
| `daily_brief_time` | `07:00` |
| `weekly_review_day` | `Sunday` |

## Phase 5 — Journal seed (optional)

After Phase 4 confirm, prompt once:

> "Want to drop a quick note about why you're starting Intently right now? Totally optional."

If yes: write to `entries` via `insertJournalEntry`. If no: skip silently.

## Completion

Set `life_ops_config.config.first_run_complete = true` on final save.

## Important notes

- Never paraphrase goals in agent output. Monthly slices ground in the user's stated words.
- If the user abandons mid-setup, whatever phases completed are persisted; `first_run_complete` stays `false`.
- `clearAllUserData()` is called before Phase 1 writes to remove any prior seed data.
