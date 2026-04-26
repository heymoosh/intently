---
captured: 2026-04-25T21:34:00-05:00
session: chat/0425-210554
source: discussion
---

# Wire update-tracker into the UI — and reconcile its markdown-vault plumbing with Supabase state-of-truth

No handoff drafted yet — `/groom` should decide if this needs a handoff (it might, given the reconciliation question) or if it's small enough to land as a § Next item with inline AC.

## One-line intent

`update-tracker` is provisioned in MA console and reachable via `ma-proxy` (mapped to `MA_AGENT_ID_UPDATE_TRACKER`), but **never invoked from any UI surface**. Muxin: *"We need the update-tracker, because we now have projects in our design, and I want to keep them."* Wire it.

## Why this is in the inbox

It's a real gap — 1 of 6 provisioned agents has no caller. Discovered this session while auditing what the deployed app actually exercises.

## update-tracker scope — confirmed universal

Muxin asked me to double-check whether update-tracker is just for project trackers or for any tracker. **Confirmed: universal.** Per `agents/update-tracker/SKILL.md` description: *"Universal project tracker updater. Invoked whenever the user finishes a work session and wants to log what happened, or says things like 'update tracker', 'log this', 'I just worked on X', 'mark that done', 'here's where I landed', 'oh I finished [anything]'. One skill for updating any tracker — the user never has to remember which project it belongs to."* Step 2 (SKILL.md): user can name project explicitly, describe what they did without naming, reference an artifact that maps to a project, or mention multiple projects. The agent maps description → project via `life-ops-config.md` Projects section. So it handles miscellaneous to-dos via the project-mapping table.

## The reconciliation issue (load-bearing — flag for grooming)

The SKILL.md plumbing — and `ma-agent-config.json` system prompt by extension — references the **markdown vault**: `Ops Plan.md`, `life-ops-config.md`, per-project `Tracker.md`/`Strategy.md`. After the cognition push (#136–#152), state-of-truth moved from markdown to Supabase rows (`projects` table with JSONB `todos`, `goals`, `entries`, etc.). The agent's prompt assumes a vault that is no longer the source of truth.

Wiring it as-is would have it read/write the wrong place. Two options:

1. **Re-prompt update-tracker** to read/write Supabase tables instead of markdown files. Re-provision via `scripts/provision-ma-agents.ts --skill update-tracker --update-existing`. Cleaner but is a substantive prompt rewrite — needs eval coverage and acceptance check.
2. **Bridge in the UI caller** — caller passes the relevant Supabase rows as input context, agent operates on that synthetic "vault view," caller writes back. Lighter touch on the agent prompt, but the abstraction leaks (agent text refers to "Ops Plan.md" while we don't have that file).

*Lean: option 1.* But the question warrants the user's decision — surfaces in grooming.

## Suggested AC (inline, if grooming routes this to § Next)

- [ ] At least one UI surface invokes `update-tracker` via `callMaProxy({ skill: 'update-tracker', input: ... })`. Likely candidates: project sheet "I just did X" affordance, voice-input branch when transcript matches "I finished / worked on / shipped" patterns.
- [ ] The agent's prompt is reconciled with the Supabase state-of-truth (option 1 or 2 from above). Whichever path: the agent's writes land in the right place — verifiable by inspecting `projects.todos` / `entries` / `goals` rows after invocation.
- [ ] Eval case authored for at least one update-tracker invocation in `evals/datasets/update-tracker/cases.json` (currently doesn't exist).

## Open questions for grooming

1. UI surface: dedicated affordance? Voice-classifier branch? Embedded in chat thread? *Suggested: voice-classifier branch in `web/lib/reminders.js`'s `classifyTranscript` — adds an `update_tracker` intent alongside `reminder` and `journal`.*
2. Markdown-vault reconciliation: option 1 (re-prompt) vs. option 2 (bridge)? Decide before any execution.
3. Should "update-tracker" be re-named to reflect its universal scope, or is it fine because the user surface is voice/chat (they never say "update-tracker")?
