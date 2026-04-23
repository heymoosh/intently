# Deferred Features

Single source of truth for features that are spec'd or designed but deliberately out of hackathon scope. Routines and loops that check for "missing" items must consult this file and skip anything listed here.

**Updating:** deferring a new item is a Locked Decision. Add it below and mirror the decision in `TRACKER.md` "Locked decisions" list. Un-deferring is a spec-level change — remove the item here, then author its criterion via `/derive-criteria <skill>` (for skills) or update the relevant acceptance-criteria file (for UI features).

---

## Deferred Skills

Skills defined in `docs/product/requirements/life-ops-plugin-spec.md` that are deliberately not in scope for V1.

**Rule:** if a skill appears here, `spec-conformance-steward`, `criteria-sync-loop`, and any future skill-iterating routine must exclude it from "missing criteria" findings. They may still flag the skill if it unexpectedly *appears* in code (`agents/<skill>/`) — that's a genuine scope-creep signal.

| Feature | Why deferred | Backlog priority |
|---|---|---|
| `daily-triage` | Pre-briefing inbox-sort skill. Spec'd but not a demo flow; backlogged per TRACKER.md locked decisions. | Med |
| `monthly-review` | Deferred; `weekly-review` covers the demo arc. AI Eval Batch Steward still weight-1 on `monthly-review` if eval dataset exists, otherwise skipped. | Med |
| `project-continue` | Generic project-re-orient skill. Post-V1. | Low |
| `session-digest` | Sub-agent for transcript summarization. Post-V1. | Low |
| `vault-drift-check` | Weekly maintenance scan for broken file references. Post-V1. | Low |
| `notes-action-sync` | Scans meeting-series notes for action items. Post-V1; requires `meeting_series: true` frontmatter convention. | Low |
| Honcho, OpenClaw, Hermes, Cyrano | Cross-agent ecosystem integrations. Not a skill but excluded from "missing" checks. | Low |
| Discord routing | External surface integration. Not a skill but excluded from "missing" checks. | Low |

---

## Deferred UI Features

UI features from `docs/design/app-experience.md` that are out of hackathon scope.

| Feature | Why deferred | Backlog priority |
|---|---|---|
| Gamification layer (streaks, points, gardens, map areas) | Rewards progress without distraction; sits on Past screen. Not required for demo; premature for a 4-day build. | Low |
| Somatic embodiment exercises | Guided breath, grounding prompts, 2-minute resets; sits on Present screen. Stretch goal at most for hackathon. | Low |
| Kanban and Gantt visualizations | Project tracker detail views; hackathon ships flat to-do checklists only. | Med |
| Theme reskinning (default / clean workbench / fantasy adventure) | Covered in `docs/product/Intently Game Reskinning.md`. Component architecture should use semantic tokens so a future reskin is cheap. | Low |
| RTL / East Asian layout flip | Time-flows-the-way-the-user-reads principle; requires a future setting. | Low |
| Game reskinning, gamification add-ons | Post-launch reskins and engagement features permanently excluded (see ethical AI principles). | Low |
