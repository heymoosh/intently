# Agent Memory Stack — Strategy

**Type:** Strategy doc — the why, the architecture, the plan.
**Created:** 2026-04-14
**Hackathon scope note (2026-04-22):** This doc captures the full cross-agent memory stack vision (spanning Hermes, OpenClaw, Cyrano, the Life Ops Plugin, etc.). **For the Intently hackathon build (Apr 21–26), the scope is narrower:**
- **Honcho is deferred.** Its license is a poor fit for the hackathon's open-source requirement, and working around it is too painful for a 4-day build. Personalization-by-peer is a post-launch concern.
- **Obsidian is not the end-user source of truth.** Markdown files remain the state model, but they live in Intently's per-user cloud store, not an Obsidian vault. The app ships its own lightweight Markdown renderer/editor. See `docs/design/app-experience.md`.
- **Hindsight stays in scope** as the structured project/task/decision memory layer. Integration path (MCP tool, HTTP service, or deferred) is a Thursday/Session-2 decision.
- **OpenClaw, Hermes, Cyrano, Discord routing** are all out of scope for Intently. The Managed Agents execution backbone replaces that orchestration layer for this product.

The rest of this document describes the wider ecosystem. Read it as the north-star architecture; apply only the subset above during hackathon week.

---

## Why This Project Exists

Muxin is building a web of agents (Hermes, OpenClaw, Cyrano, Nick Fury, the Life Ops Plugin, the Job Search Agent, etc.). Every one of them needs to answer the same two questions:

1. *What is the current state of this project/task/decision?* (project memory)
2. *Who is this person and how do they like to work?* (people memory)

Without a shared memory layer, each agent reinvents its own context, duplicates knowledge, and drifts. The fix is a thin, shared stack:

- **Obsidian markdown + spreadsheets** = source of truth (what humans edit)
- **Hindsight** = structured project/task/decision memory (queryable by ID)
- **Honcho** = peer/personalization memory (keyed by `peer_id`)
- **Optional tiny DB** (SQLite or `TASKS.csv`) = indexed view over tasks for fast queries and easier sync

All agents read and write through stable IDs that exist in every layer — so updates *refine* the same object instead of creating duplicates.

---

## Core Principles

1. **Obsidian is the source of truth.** Hindsight and Honcho are fast, smart views over markdown — not replacements for it. If we lose both, the vault still tells the story.
2. **Stable IDs everywhere.** `project.app`, `task.app.001`, `dec.app.001`, `user.muxin`, `agent.hermes`. IDs appear in file frontmatter, DB rows, Hindsight metadata, and Honcho messages. Shared IDs are what let us stitch everything together.
3. **DB is optional, not load-bearing.** A small SQLite or CSV layer makes sync and dashboards easier, but the system still works without it.
4. **Separation of memory kinds.** Hindsight handles project/task/decision structure. Honcho handles people/preferences. Don't smush them.
5. **Write once, reference many.** Strategic reasoning lives in one file (Strategy.md / Decisions.md). Trackers and DB rows link to it by ID, not by copying.

---

## End-to-End Flow

The target orchestration, per Perplexity's sketch:

```
User → OpenClaw → Hermes → Hindsight + Honcho → Hermes → OpenClaw → User
```

1. **User → OpenClaw.** Message arrives from Telegram/Slack/chat. OpenClaw applies routing + security/policy and selects a Hermes profile (`hermes.life`, `hermes.builder`, etc.).
2. **OpenClaw → Hermes.** OpenClaw forwards the request with minimal metadata (project_id, task_id, channel).
3. **Hermes orchestrates.** Reads Obsidian / CSV / DB as needed. Calls Hindsight for project/task/decision context. Calls Honcho for `peer_id="muxin"` personalization.
4. **Hindsight + Honcho respond.** Hindsight returns the relevant tasks/decisions/recent events for the project. Honcho returns peer preferences and behavioral bias.
5. **Hermes generates plan / takes actions.** Produces the answer, updates markdown/DB, emits a new event back to Hindsight (`task.app.001 → in_progress`).
6. **Hermes → OpenClaw → User.** Response returns through OpenClaw, which logs and delivers it to the right channel.

---

## Architecture Layers

**Layer 1 — Truth (Obsidian + spreadsheets).** Human-editable markdown with stable IDs in frontmatter. Hand-maintained, version-controlled, searchable by humans.

**Layer 2 — Indexed view (optional DB).** A small `TASKS.csv` or SQLite with one row per `task_id` / `decision_id`. Gives fast local queries (status counts, filters, dashboards) and a clean feed for Hindsight upserts.

**Layer 3 — Smart memory.**
- *Hindsight* — ingests projects, tasks, decisions, events. Builds an internal graph keyed by `project_id`, `task_id`, `decision_id`, `peer_id`. Queryable by ID or semantic search.
- *Honcho* — ingests messages/events tagged with `peer_id`. Builds peer profiles and biases agent behavior per person.

**Layer 4 — Orchestration (Hermes + OpenClaw).** Hermes is the brain/worker. OpenClaw is the router/gatekeeper. Neither stores long-term memory — they *use* the layers below.

---

## Sync Pipeline (Described, Not Coded)

The sync job's job — in words, not scripts:

- Read markdown files with stable frontmatter IDs, plus `TASKS.csv` if it exists
- For each row/file, compute a content hash and compare to `last_hash` stored alongside the row
- If changed, emit an upsert event into Hindsight using the stable ID as the upsert key
- For messages/conversations, emit into Honcho with `peer_id` + optional `task_id`/`project_id` metadata
- Log every sync run so we can see drift and catch failures

Deliberately not specified here: language, libraries, schedule. Those come after architecture is locked.

---

## Open Questions (to scope in later phases)

**Resolved 2026-04-14:**
- ~~DB or no DB?~~ → **CSV.** `mdtable2csv` for markdown → CSV conversion. Helper tool with JSON interface as the only writer.
- ~~One schema or two?~~ → **One.** This schema is the umbrella; Life Ops schema.md is a subset.

**Still open** (research captured in [Research — Perplexity Responses.md](Research%20%E2%80%94%20Perplexity%20Responses.md) where noted):
- **Which ID format?** Dotted lowercase (`project.app`, `task.app.001`) vs. UUID-backed with slug. Leaning dotted. Revisit if we ever multi-user. *(not yet researched)*
- **Where does the sync script live?** Vault skill? Standalone repo? Part of Hermes build? Muxin leans Python repo for determinism — CSV must be clean, no GenAI hallucination risk. *(Phase 5; not yet researched)*
- **Hermes ↔ coding-tool boundary.** For "fix bugs overnight" / "deploy PRD overnight" scenarios: does Hermes spawn Claude Code as a sub-agent? What bounds its authority? How does Hermes discover the codebase + relevant project files from a user prompt? What's the review gate before a deploy? *(Phase 3; not yet researched)*
- **OpenClaw + Bitwarden pattern.** Muxin's preference: OC knows UUID but can't read; Hermes has read access. Perplexity confirms this is achievable as an architectural guideline, not a built-in OC mode — enforced by wiring (keep Bitwarden integration out of OC, give it to Hermes only). *(Phase 3; research captured)*
- **Discord structure.** Perplexity sketch: server = `Muxin Mission Control`; channels per agent (`#life`, `#build`, `#research`, `#system-log`); threads per topic inside each. *(Phase 3; research captured)*
- **Hindsight ingestion cadence.** Perplexity recommends batched 10–15 min with row-hash filtering; tighten later if needed. *(Phase 5; research captured)*
- **Honcho peer hierarchy + tier model.** Muxin wants profiles for clients, loved ones, collaborators, acquaintances — weighted by attention. But people migrate tiers, which breaks `client.jane` style IDs. Leaning: peer_id is stable identity (`person.jane-doe`); tier is mutable metadata on the profile. Connects to ID format question. *(Phase 4; not yet researched)*

---

## Expanded Scope Additions (2026-04-14)

Three additions beyond the original Perplexity sketch:

**1. Honcho as client-memory layer, not just user-memory.**
Each client (`client.acme`, `client.itochu`, `client.mitsui`) gets a peer profile. Honcho ingests meeting transcripts, key emails, tagged events ("rejected proposal X," "loved format Y"). Over time Honcho builds per-client context: pronunciations, relationship history, communication preferences ("decks over docs," "bottom line first"), sensitivities (risk-averse, price-sensitive), social context. Any agent can call `honcho_context(peer_id='client.acme')` before drafting an email, prepping a meeting, or summarizing status — so the agent behaves like it *remembers the human*, not just the project ID.

**2. OpenClaw is governance + phone, not just routing.**
OpenClaw's value is twofold: (a) phone-first command interface via Discord — solves the "Cowork can't run from phone" gap; (b) agent governance layer — decides which agents get which tools in which contexts. Think of it as the policy engine above Hermes. Hermes does the work; OC decides whether Hermes is allowed to.

**3. Bitwarden Secrets Manager as the only secrets store.**
No passwords, tokens, API keys, or UUIDs live in agent memory, markdown, CSVs, Hindsight, or Honcho. Ever. OpenClaw may know *where* a secret lives (e.g., "Bitwarden vault reference") but cannot read it. Hermes holds the read capability. This is a hard rule, not a convention.

---

## New Scenario: Code-Build Flow ("deploy PRD overnight")

*Sketched, not specced. Full design is Phase 3.*

User via Discord: *"Hey OpenClaw, there's a PRD I wrote in Obsidian — get Hermes on it and get it deployed overnight."*

Rough flow:

1. **Discord → OpenClaw.** OC authenticates Muxin, applies policy (is overnight autonomous deploy allowed? which repos?).
2. **OpenClaw → Hermes (builder profile).** Passes PRD path, permissions envelope, Bitwarden references for any needed credentials.
3. **Hermes reads the PRD** from Obsidian, calls Hindsight for related project/task context, calls Honcho for Muxin's build preferences.
4. **Hermes spawns a coding sub-agent** (Claude Code, Aider, or similar) with a scoped work directory, tool list, and the PRD as the spec.
5. **Sub-agent does the work.** Hermes supervises, emits events into Hindsight (`log.project.2026-04-14a: build started`, `…tests passing`, `…PR opened`).
6. **Gate before deploy.** Either a policy gate in OC ("require Muxin approval before prod deploy") or a scheduled morning review.
7. **Hermes → OpenClaw → Discord.** Morning summary: what was built, what's in staging, what needs review.

**How this uses the memory stack:**
- The PRD file has a stable `project_id` and the work generates `task_id`s that get written to the project's `TASKS.csv`.
- Every sub-agent action becomes an `events` row → Hindsight event.
- Honcho returns Muxin's preferences (e.g., "always open a PR, never push to main directly").
- Bitwarden provides deploy credentials to Hermes, never touches OC or sub-agents' context.

**What we need to figure out in Phase 3:** the policy envelope format, the sub-agent spawning contract, the approval gate mechanism, and how Hermes actually writes the supervision events back to the vault.

---

## Phases

This is a multi-phase project. Each phase should run in its own chat thread to avoid context overrun.

- **Phase 0 — Architecture on paper.** ← *we are here.* Files exist, decisions locked.
- **Phase 1 — Schema unification + vault audit.** Merge Life Ops schema into this umbrella. Audit this project. Retrofit one real project with IDs.
- **Phase 2 — CSV tooling + guardrails.** Helper tool JSON interface (described), validator behavior, `mdtable2csv` integration plan.
- **Phase 3 — Orchestration layer design.** Discord + OpenClaw + Hermes specs. Bitwarden pattern. Code-build flow spec. Gates and policies.
- **Phase 4 — Honcho client management.** Per-client peer profiles, ingestion sources, call patterns.
- **Phase 5 — Build handoff.** Hand specs to Claude Code for implementation.

The Tracker is the single continuity doc between phases.

---

## Scope Boundaries

**In scope:** Schema, ID conventions, Obsidian mapping, ingestion behavior for Hindsight and Honcho, end-to-end orchestration flow, sync pipeline at a behavioral level.

**Out of scope (for now):** Writing any actual sync code, implementing Hindsight/Honcho clients, building Hermes/OpenClaw, UI/dashboards, multi-user scenarios beyond Muxin + agents.
