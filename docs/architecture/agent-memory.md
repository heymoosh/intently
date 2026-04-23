# Agent Memory — Intently (hackathon scope)

**Type:** Architecture doc — the memory and state model the V1 agents read and write.
**Scope:** Hackathon build only (Apr 21–26, 2026). Cross-agent ecosystem vision is in `docs/backlog/agent-memory-full-vision.md`.

---

## What the agents need to remember

Every skill in Intently's V1 is a managed agent that plans-and-acts on behalf of the user. To stay coherent run-to-run, the agents need answers to two questions:

1. **What's the current state of the user's work?** — goals, weekly plan, today's log, project trackers, journal entries.
2. **What happened since last time?** — what the user told the agent, what the agent wrote, what changed.

The V1 stack answers both with two layers.

---

## Layer 1 — Markdown files (state of truth)

Every durable piece of state is a Markdown file with a well-defined shape. File shapes are defined in `docs/architecture/data-model.md` and follow the Life Ops spec (`docs/product/requirements/life-ops-plugin-spec.md`).

Files live in Intently's per-user cloud store — **Supabase** (Postgres + Storage + Auth). See ADR 0002. Files do not live in Obsidian, on the user's device, or inside any Anthropic-hosted store. No integrations with external note apps (Obsidian, Notion) in V1 — all data stays in Intently's store. Future sync-to-Obsidian or sync-to-Notion is a V2 concern; the architecture doesn't foreclose it because Markdown is already our canonical format.

The V1 file set (hackathon demo scope):
- `life-ops-config.md` — one per user.
- `Goals.md`, `Weekly Goals.md`, `Daily Log.md`, `<Reflection>.md`, `Ops Plan.md`.
- `Projects/[Name]/Tracker.md` and `Projects/[Name]/Strategy.md` per detected project.

Files are agent-written more than user-written. Users read the rendered view. Users who want to power-edit can open the raw Markdown.

---

### Stable IDs (future-proofing)

Every durable object carries a stable ID that survives storage migrations:

- Project: `project.<slug>` (e.g., `project.app`)
- Task: `task.<project-slug>.<seq>` (e.g., `task.app.001`)
- Decision: `dec.<project-slug>.<seq>`
- Event / log entry: `log.<project-slug>.<date><letter>`
- User (peer): `user.<slug>` (e.g., `user.muxin`)
- Topic: `topic.<date-started>-<slug>` (e.g., `topic.2026-04-22-hiring-thoughts`) — clusters chat turns about the same subject across sessions when it hasn't crystallized into a project yet. The agent links new mentions to an existing topic if the match is strong, and can propose promoting a topic to a full project (with Tracker + Strategy) when enough signal has accumulated.

IDs appear in file frontmatter and in any structured row representing the same object. If the store backend changes (Supabase → self-hosted Postgres, adding SQLite for offline, etc.), rows re-point by ID; nothing else breaks. The full cross-agent ID scheme lives in `docs/backlog/agent-memory-full-schema.md`; V1 only commits to this core subset.

---

## Layer 2 — Structured task memory (Hindsight)

Hindsight holds query-by-ID state for projects, tasks, decisions, and events. It's used when a flat Markdown read is too expensive or when an agent needs to answer "what's the current status of `task.app.042`?" without loading the whole tracker.

V1 scope for Hindsight:
- Ingest on write — every time a skill updates a tracker, it also upserts the affected rows into Hindsight.
- Query by ID on read — skills that need specific task/decision state call Hindsight rather than re-reading the full file.
- Markdown remains authoritative. If Hindsight and the Markdown disagree, the Markdown wins and the row is re-upserted.

Integration path (MCP tool, HTTP service, or deferred entirely for V1) is a Thursday Session 2 decision. If integration cost is too high for the 4-day build, Hindsight is deferred in favor of flat Markdown reads.

---

## Layer 3 — Managed-Agent Memory (if approved)

Anthropic's Managed Agents "Memory" feature (limited research preview; waitlist submitted 2026-04-22) provides agent-side persistent context across runs.

When approved, Intently uses it as a **cache** over Layers 1 and 2 — fast recall of "what did I tell the user yesterday" and "what did the user prefer the last time we ran weekly-review." It is never the authoritative state store. See `docs/decisions/0001-managed-agents-as-runtime.md`.

If Memory is not approved before demo day: the agents run without it. They re-read Layer 1 on every invocation. Latency is higher; correctness is unchanged.

---

## External data sources (calendar, email)

Some skills benefit from reading the user's calendar and email (daily-brief surfaces today's meetings and urgent email flags; nothing else in V1). V1 accesses these via **direct OAuth + provider APIs**, not via MCP:

- User logs into Google Workspace (OAuth) from the Intently app during setup or later.
- OAuth tokens are stored in Bitwarden Secrets Manager per the secrets rule — never in app memory, markdown, or Supabase rows.
- Backend exposes tools like `read_calendar(user_id, range)` and `read_emails(user_id, filter)` to managed agents via standard tool-use.
- Backend tool implementations call Google Calendar API and Gmail API, return structured data to the agent.

**V1 providers:** Google Calendar, Gmail. Nothing else. Microsoft/Outlook, iCloud, Calendly, Notion calendars, etc. are V2.

**V2 direction:** migrate to MCP servers as the ecosystem matures. The agent-side tool interface (`read_calendar`, `read_emails`) stays stable; only the implementation behind those tools swaps from direct-API to MCP client calls.

**Graceful degradation:** every skill that reads calendar or email must handle the "not connected" case by skipping the step and noting it in the output. Never error on a missing integration.

---

## Portability

Stated as an architectural commitment in `docs/decisions/0001-managed-agents-as-runtime.md`. Summary: Markdown-files-in-Intently-cloud-store is portable across any agent runtime. Tool schemas are standard JSON Schema. The orchestration graph lives in this repo. The only Anthropic-specific thing is the SDK call that invokes an agent run.

---

## Out of scope (V1)

- Honcho or any peer-personalization layer.
- Cross-agent orchestration beyond Intently's own skills.
- Shared journal contract with external agents (GTJ skill, Job Search Agent, etc.) — V1 owns the journal exclusively.
- Multi-user isolation — V1 is single-user (Muxin dogfoods). Per-user isolation hardens when multi-user lands.

The full north-star memory vision (OpenClaw, Hermes, Cyrano, Discord routing, Bitwarden integration as an access boundary, cross-agent object IDs) lives in `docs/backlog/agent-memory-full-vision.md`. That is not a V1 deliverable and should not shape V1 implementation decisions.
