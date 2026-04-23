 # Agent Memory Stack — Schema

**Type:** Reference doc — the authoritative table definitions and ID contracts.
**Created:** 2026-04-14
**Starting point:** Perplexity's 5-table sketch (projects / tasks / decisions / events / peers).

This document defines the shape of every logical "object" the memory stack tracks, the fields each object carries, and the IDs that let Obsidian, the optional DB, Hindsight, and Honcho all talk about the same thing.

---

## ID Conventions

All IDs are TEXT, dotted lowercase, human-readable. Shared across Obsidian frontmatter, DB rows, Hindsight metadata, and Honcho message metadata.

| Object | ID Pattern | Example |
|---|---|---|
| Project | `project.<slug>` | `project.app` |
| Task | `task.<project-slug>.<seq>` | `task.app.001` |
| Decision | `dec.<project-slug>.<seq>` | `dec.app.001` |
| Event/log | `log.<project-slug>.<date><letter>` | `log.app.2026-04-14a` |
| Peer (human) | `user.<slug>` | `user.muxin` |
| Peer (agent) | `agent.<slug>` | `agent.hermes` |
| Peer (service) | `service.<slug>` | `service.granola` |

`<seq>` is zero-padded 3-digit. `<letter>` disambiguates multiple events on the same date.

---

## 1) `projects`

Minimal fields so Hindsight can anchor everything to a project.

| Field | Type | Notes |
|---|---|---|
| `project_id` | TEXT, PK | e.g. `project.app` |
| `name` | TEXT | Human-readable name |
| `status` | TEXT | `active` \| `paused` \| `done` |
| `owner_id` | TEXT | FK → peers, e.g. `user.muxin` |
| `created_at` | DATETIME | |
| `updated_at` | DATETIME | |
| `description` | TEXT | Short summary |

---

## 2) `tasks`

Main workhorse. Live task state.

| Field | Type | Notes |
|---|---|---|
| `task_id` | TEXT, PK | `task.app.001` |
| `project_id` | TEXT, FK | → projects |
| `title` | TEXT | |
| `assignee_id` | TEXT | FK → peers |
| `status` | TEXT | `todo` \| `in_progress` \| `blocked` \| `done` |
| `priority` | TEXT | `P1` \| `P2` \| `P3` \| `P4` |
| `kind` | TEXT | `design` \| `dev` \| `content` \| `ops` (extensible) |
| `context_files` | TEXT | Semicolon-separated Obsidian paths |
| `tags` | TEXT | Comma-separated |
| `created_at` | DATETIME | |
| `updated_at` | DATETIME | |
| `last_hash` | TEXT | Hash of serialized row for change detection |

Hindsight uses `task_id` as the upsert key; `project_id`, `assignee_id`, `status`, `priority` become metadata on any event about the task.

---

## 3) `decisions`

Durable reasoning artifacts.

| Field | Type | Notes |
|---|---|---|
| `decision_id` | TEXT, PK | `dec.app.001` |
| `project_id` | TEXT, FK | |
| `title` | TEXT | Short statement of the decision |
| `description` | TEXT | Optional detail/rationale |
| `author_id` | TEXT | FK → peers |
| `related_task_ids` | TEXT | Comma-separated task IDs |
| `created_at` | DATETIME | |
| `source_path` | TEXT | Obsidian anchor, e.g. `Projects/App/Decisions.md#dec.app.001` |

---

## 4) `events` (optional but Hindsight-friendly)

Timeline of what happened. One row per discrete event.

| Field | Type | Notes |
|---|---|---|
| `event_id` | TEXT, PK | `log.app.2026-04-14a` |
| `project_id` | TEXT | |
| `task_id` | TEXT, nullable | |
| `decision_id` | TEXT, nullable | |
| `actor_id` | TEXT | `user.muxin`, `agent.hermes`, etc. |
| `type` | TEXT | `status_change` \| `comment` \| `spec_update` \| `deployment` (extensible) |
| `summary` | TEXT | 1–2 sentence natural-language description |
| `created_at` | DATETIME | |
| `source_path` | TEXT | Obsidian log anchor |

Each row maps cleanly to one Hindsight "retain" memory event.

---

## 5) `peers`

The directory of humans, agents, and services the system knows about. Used by both Honcho (peer profiles) and Hindsight (actor metadata).

| Field | Type | Notes |
|---|---|---|
| `peer_id` | TEXT, PK | `user.muxin`, `agent.hermes` |
| `kind` | TEXT | `human` \| `agent` \| `service` |
| `name` | TEXT | |
| `email` | TEXT, optional | |
| `role` | TEXT | "PM", "Engineer", "AI agent", etc. |
| `notes_path` | TEXT | Obsidian file for that peer |

Honcho messages always carry `peer_id` for sender (and recipient if meaningful) plus optional `task_id` / `project_id` as metadata.

---

## How This Is Hindsight- and Honcho-Friendly

**Hindsight ingests:**
- `projects` rows (project facts)
- `tasks` rows (current task state)
- `decisions` and `events` rows (timeline)
- Internal graph keyed by `project_id`, `task_id`, `decision_id`, `peer_id`

**Honcho ingests:**
- Conversations/events with `peer_id` plus optional `task_id`/`project_id` metadata
- Builds peer profiles keyed by `peer_id`

Because every ID is shared across Obsidian files, the DB, Hindsight, and Honcho, agents can stitch everything together reliably. Updates *refine* existing objects instead of creating duplicates.

---

## Extensions (Candidates, Not Committed)

Extra columns we may want once we test this against real projects:

- `tasks.energy_required` — `low` / `medium` / `high` (matches Muxin's GTJ framing)
- `decisions.risk_level` — `low` / `medium` / `high`
- `events.confidence` — for agent-generated events, how sure the agent was
- `projects.health` — 🟢 / 🟡 / 🔴 for dashboard views

Don't add any of these until we've tried the base schema on one real project.

---

## Relationship to Life Ops Plugin schema.md

[Life Ops Plugin/schema.md](../Life%20Ops%20Plugin/schema.md) already defines file-level contracts for Tracker.md, Strategy.md, Goals.md, Ops Plan, etc. That schema is **file-shape**; this schema is **object-shape**. They're meant to be complementary:

- Life Ops schema says "every project has a `Tracker.md` with these sections."
- This schema says "every project has a `project_id` and tasks live in `tasks` with these fields."

Open question (tracked in Strategy.md): whether to unify them into one schema or keep them layered.
