# Deferred Skills

**Purpose:** single source of truth for skills that are defined in `docs/product/requirements/life-ops-plugin-spec.md` but are deliberately not in scope for V1. Routines and loops that iterate over skills read this file and **skip** anything listed here — prevents token waste on nightly "missing criterion" noise for features we've already agreed not to build.

**Rule:** if a skill appears here, `spec-conformance-steward`, `criteria-sync-loop`, and any future skill-iterating routine must exclude it from "missing criteria" findings. They may still flag the skill if it unexpectedly *appears* in code (`agents/<skill>/`) — that's a genuine scope-creep signal.

**Updating:** deferring a new skill is a Locked Decision. Add the skill below and mirror the decision in `TRACKER.md` "Locked decisions" list. Un-deferring is a spec-level change — remove the skill here, then author its criterion via `/derive-criteria <skill>`.

## Deferred for V1 (hackathon scope)

- `daily-triage` — Pre-briefing inbox-sort skill. Spec'd but not a demo flow; backlogged per TRACKER.md locked decisions.
- `monthly-review` — Deferred; `weekly-review` covers the demo arc. AI Eval Batch Steward still weight-1 on `monthly-review` if eval dataset exists, otherwise skipped.
- `project-continue` — Generic project-re-orient skill. Post-V1.
- `session-digest` — Post-V1.
- `vault-drift-check` — Post-V1.
- `notes-action-sync` — Post-V1.

## Not a skill but deferred (for completeness — don't flag these as missing)

- Honcho, OpenClaw, Hermes, Cyrano — cross-agent ecosystem.
- Discord routing — external surface.
- Game reskinning, gamification, somatic exercises, kanban/Gantt — post-launch reskins / features.

## Active (do flag if missing)

The routines should expect criteria files for: `daily-brief`, `daily-review`, `weekly-review`, `setup`, `update-tracker`. Any commit adding a new skill folder under `agents/` must land its criterion first (enforced by `.githooks/pre-commit`).

## Related

- `docs/product/requirements/life-ops-plugin-spec.md` — the spec (includes deferred skills; this file is the in/out filter).
- `TRACKER.md` "Locked decisions" section — mirrors the deferral list.
- `docs/backlog/` — long-form notes on why things are deferred.
