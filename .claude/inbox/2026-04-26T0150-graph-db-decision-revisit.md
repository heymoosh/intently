---
captured: 2026-04-26T01:50:00-05:00
session: chat/0425-210554
source: discussion
amends: .claude/inbox/2026-04-26T0140-architectural-decisions-locked.md (Decision 2 — pgvector locked → REVISIT)
---

# Graph DB decision — Muxin pushed back on pgvector-only; revisit before any noticing-layer work activates

In the 01:50 conversation, Muxin re-engaged with Decision 2 from the previous architectural-decisions capture. **Pgvector-only is no longer locked.** Re-deciding required.

## Muxin's reasoning (verbatim)

> "I'm still unsure if we should ship without a graph database, because I expect that as projects get added and the complexity of the data evolves, we're going to want to keep track of every single task as an entity in the graph database. The details around a task, like who's assigned to do it, what it's related to (which project it's related to), and all those things, will need to be attached to the task as if the task is its own central node.
>
> We also want a user node for all the things we know about the user. To me, it just seems more intuitive and easier to have the database set up from the get-go to track it in that way. I'm not saying that everything needs to be a graph database, but around tasks, which can relate to goals and projects and a whole bunch of other things, and around the user, which can relate to their preferences or insights and all this other stuff, I think that those two things, those two categories of information, really need to be in a graph database."

## Three options to choose from (orchestrator surfaced)

### Option A — Apache AGE (graph extension inside Postgres)
- Adds the Cypher query language + property-graph data model on top of Postgres
- Single DB, single auth, single backup
- Trade-offs: younger than Neo4j (2020 release), smaller community, may or may not be available on Supabase's tier (needs verification — like `pg_net`, requires enabling)
- **Cleanest "I want graph data model" move without paying multi-vendor cost**

### Option B — Real graph DB (Neo4j or Memgraph)
- Best graph performance + maturity
- Cost: $65–$100/mo minimum for managed cloud
- Operational complexity: sync between Postgres (transactional source of truth) and graph DB (relationship index). Two query languages, two auth surfaces, two backup stories.
- Overkill at single-user; right call at scale

### Option C — Postgres native with graph-friendly schema
- Each task is a row with FK columns expressing its relationships (`task.assignee_id`, `task.project_id`, `task.depends_on` JSONB array of task ids)
- Graph traversal via recursive CTEs
- Zero new infra; data shaped graph-friendly so migration to A or B is straightforward later
- Trade-off: queries get verbose for multi-hop; slower than purpose-built graph engine

## Recommended path

**Option A (Apache AGE) if available on Supabase; Option C otherwise.**

Either way, an ADR captures the migration path so the choice is reversible without a redesign.

## Action — sub-agent for daytime dispatch

Spec for a `graph-db-availability-check` sub-agent (do NOT dispatch overnight; needs Muxin's confirmation on which option to lock):

1. Test `CREATE EXTENSION IF NOT EXISTS age;` against Supabase's project tier (write the migration but DON'T apply — surface what would happen).
2. If available → propose schema sketch:
   - Task nodes (with all relevant attributes from current `projects.todos` JSONB + new ones)
   - User nodes (with `profiles` data + `life_ops_config` data + future preferences/insights)
   - Edge types: `BELONGS_TO` (task→project), `SERVES` (project→goal), `OWNED_BY` (any→user), `DEPENDS_ON` (task→task), etc.
   - Migration plan: how the existing `projects.todos` JSONB gets unflattened into individual task rows
3. If NOT available → fall back to Option C with a graph-ready schema for migration later.
4. Either way, draft an ADR (`docs/decisions/000X-graph-db-strategy.md`) capturing the choice + the migration path.

## Out of scope for this capture

- Embedding store decision is unaffected — pgvector is still the right call for entries' semantic similarity (which is a different question from "is data graph-shaped?"). Pgvector handles "find similar entries" via embeddings; graph DB handles "what connects to what" via traversal. They coexist.
- The agent-noticing-layer's clustering workstream (Decision 3 — batch via pg_cron) is unaffected.
- The capture-routing decision (Decision 5 — chat IS the router) is unaffected.

## Cross-references

- This SUPERSEDES Decision 2 in `2026-04-26T0140-architectural-decisions-locked.md` ("Vector store: pgvector locked"). Pgvector for embeddings still good; graph DB for task/user nodes is now an OPEN decision.
- Folds into the agent-noticing-layer activation work (which is gated on this decision + the others).
- Worth flagging in `launch-plan.md` § Locked decisions when grooming runs.
