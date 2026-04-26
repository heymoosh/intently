# 0010 — Graph-DB strategy: Postgres-native graph-friendly schema (Option C)

**Status:** Accepted
**Date:** 2026-04-26
**Related:** migration `0009_graph_schema.sql`, handoff `.claude/handoffs/agent-noticing-layer.md`, inbox `2026-04-26T0150-graph-db-decision-revisit.md`, `docs/architecture/agent-memory.md`

## Context

Muxin's design requirement (from the 01:50 conversation): every task is a first-class node in a graph. Tasks relate to projects, goals, users, and other tasks. The user node connects to preferences, insights, and journal patterns. We needed the data model to reflect that shape from the start — not as a JSONB blob, not as loosely typed rows.

Three options were on the table:

- **Option A — Apache AGE** (graph extension inside Postgres, adds Cypher query language + property-graph model on top of Supabase)
- **Option B — External graph DB** (Neo4j / Memgraph managed cloud)
- **Option C — Postgres-native with graph-friendly schema** (first-class task rows, explicit FK edges, graph traversal via recursive CTEs)

The decision was also gated on a new constraint from Muxin's morning audit (Correction 3 in `2026-04-26T0820-architecture-audit-and-corrections.md`): the graph-DB choice must achieve `agent-memory.md`'s stable-ID goal. `projects.slug` already exists; `tasks.slug` is added in this migration.

## Decision

**Option C — Postgres-native, additive.** Migrate `projects.todos` JSONB into a first-class `public.tasks` table with explicit FK columns for relationships. Add a `task_relationships` join table for depends-on / blocks / related-to edges. Add `public.observations` for the noticing layer's promotion pipeline.

This migration is additive: `projects.todos` is preserved so existing writers keep working. A future migration drops the JSONB column once all writers are ported.

## Why not Option A (Apache AGE)

Three reasons:

1. **Supabase tier availability.** Apache AGE is not a standard Supabase extension. Like `pg_net`, it requires explicit enablement per project tier. A dead sub-agent was dispatched to verify availability; it timed out before confirming. Rather than block the migration on availability research, we land Option C — which is a clean starting point for migration to AGE if it becomes available.
2. **Community maturity.** AGE was released in 2020. Its production track record at scale is thinner than alternatives. For a single-user product in the dogfood phase, the upside of Cypher query syntax doesn't outweigh the operational uncertainty of a young extension.
3. **Migration path is preserved.** Option C's schema is property-graph-shaped. If Supabase enables AGE, the move is: dump `tasks` + `task_relationships` → load into an AGE graph. Nothing in Option C forecloses that migration.

## Why not Option B (Neo4j / Memgraph)

1. **Cost.** Managed Neo4j starts at $65–$100/mo minimum. Unnecessary at single-user scale.
2. **Operational complexity.** Two databases = two auth surfaces, two backup stories, a sync pipeline between Postgres (transactional source of truth) and the graph DB (relationship index). Two query languages (SQL + Cypher). None of this complexity pays off at V1.
3. **Migration path preserved here too.** Option C's schema is a valid ETL source for any external graph DB. When multi-user scale demands it, the move is: export rows → load graph DB → point graph queries at it.

## Architecture-doc alignment (agent-memory.md Correction 3)

`agent-memory.md § Stable IDs` specifies IDs of the form `project.<slug>`, `task.<project-slug>.<seq>`, etc. This migration satisfies that requirement:

- `projects.slug` (already present, `0001_initial_schema.sql`, `unique (user_id, slug)`) — unchanged.
- `tasks.slug` (added in `0009_graph_schema.sql`) — nullable text column, partial unique index `unique (project_id, slug) where slug is not null`. Populated by the application layer, not the DB, so backfilled rows from JSONB don't require a slug immediately.

UUIDs remain the primary keys (FK references, RLS predicates). Slugs are the human-readable / URL / hierarchical-traversal layer alongside them — additive, not a replacement.

## Migration paths forward

| Path | Trigger | Effort |
|---|---|---|
| Option C → Apache AGE | Supabase enables AGE on our project tier | Dump `tasks` + `task_relationships` → load AGE graph. Coexist until all query paths migrate. |
| Option C → External graph DB (Neo4j/Memgraph) | Multi-user scale; graph query performance becomes a bottleneck | Export rows → load external graph. Postgres remains transactional source of truth; graph DB becomes a read layer. |
| Option C → Hindsight Layer 2 | Hindsight integration work activates (see `agent-memory.md § Layer 2`) | Dump rows → reformat IDs (use `slug`-based IDs) → load to Hindsight. No Postgres-specific features lock us in; slug columns make the ID reformat straightforward. |

No migration path requires schema changes in Option C itself. The schema is forward-compatible.

## Why both `depends_on` and `blocks` as separate relationship types

Option C stores both directions as distinct rows in `task_relationships` rather than deriving one from the other. Rationale: agents and UI traversals run in both directions ("what is this task waiting on?" vs "what is this task holding up?"). Storing both directly means each direction is a single-table scan — no UNION, no self-join. Storage cost is two rows per bidirectional pair, which is negligible.

## Consequences

- `projects.todos` JSONB is preserved. Existing writers (`web/lib/entities.js` addProjectTodo / toggleProjectTodo) keep working. A follow-up migration (tracked in TRACKER) ports those writers to `public.tasks` and drops the column.
- Graph traversal is via recursive CTEs, not a purpose-built graph engine. For multi-hop traversals over large graphs, performance will degrade. Acceptable at single-user V1 scale; graph-engine option is available when needed.
- `observations` table is stub-level infrastructure for the noticing layer. The promotion logic (MA memory as working tier → Supabase `observations` as long-term tier) is described in `agent-memory.md § Layer 3` and the `agent-noticing-layer.md` handoff. This ADR covers the schema landing; the behavior work is separate.
- Slug assignment is the app layer's responsibility. DB only enforces uniqueness. The first migration that writes tasks should also assign slugs.
