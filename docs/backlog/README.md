# Backlog

**Not loaded by hackathon agents.** Anything in this folder is deferred — captured so it isn't forgotten, but excluded from the hackathon doc tree so it doesn't pollute context windows or mislead future contributors about what ships.

## What lives here

- North-star architecture content that describes systems outside Intently (Hermes, OpenClaw, Cyrano, Discord routing, cross-agent ecosystems).
- Post-launch product features (gamification, theme reskinning, kanban/Gantt, somatic exercises, multi-user, Honcho-backed personalization).
- Schemas and data contracts that apply to Intently's longer-term architecture but not the V1 build.

## What does NOT live here

- Anything currently being built.
- Anything a hackathon-week agent needs to read to make correct decisions.
- Open questions — those belong in the relevant active doc or in an ADR.

## Promotion rules

A backlog doc becomes "active" when the feature it describes enters a sprint. Move it out of `docs/backlog/` and into the appropriate folder (`architecture/`, `design/`, `product/`) at that point, not before.
