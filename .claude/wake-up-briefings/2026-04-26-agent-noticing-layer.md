# Agent-noticing-layer — wake-up briefing

**Generated:** 2026-04-26 overnight by scope-scout sub-agent.
**Source handoff:** `.claude/handoffs/agent-noticing-layer.md`.
**Purpose:** When you wake up, read this instead of the full handoff to make the four open architectural decisions.

---

## TL;DR

The noticing layer is the architectural arc that turns Intently from "surfaces with empty intelligence behind them" into the actual product thesis: *the agent does the noticing; the user throws things in*. One pattern at three scopes — **one input → many inputs → many patterns**: capture-routing, topic-clustering, memory-promotion. The handoff was promoted from V1.1-deferred to active on 2026-04-25 but four architectural questions are deferred until activation. What's already built and reusable: a working Haiku binary classifier (`supabase/functions/reminders/index.ts` + `web/lib/reminders.js`), `entries`/`projects`/`goals` schema, and a soft graph via `entries.links` JSONB. The cognition input cap (~3.4K tokens, locked) is the discriminating constraint that shapes most of the open answers.

## The four locked-but-not-decided architectural questions

### 1. Embedding store: pgvector vs external (Pinecone/Turbopuffer/etc.)

- **Status quo / implicit default:** No vectors anywhere yet. `0001_initial_schema.sql` line 98 explicitly notes "if we ever need vector search, migrate to a child table." Stack is already Supabase Postgres.
- **pgvector pros:** zero new infra, zero new vendor, RLS reuses existing per-user policies, single `JOIN` to `entries`/`projects`, ADR-0001-compatible (state of truth stays in Supabase).
- **pgvector cons:** index types (HNSW/IVFFlat) need tuning at scale; Supabase free tier has CPU/memory ceilings.
- **External pros:** purpose-built ANN, scales past million-vector range without thinking.
- **External cons:** new vendor secret, new failure mode, RLS becomes a manual filter, splits state-of-truth across two stores (mild ADR-0001 friction).
- **Proposed default:** **pgvector.** Single user / hackathon scale, ADR 0001 alignment, no new vendor.
- **Cost (ballpark):** pgvector ~$0 incremental at current scale. Pinecone Starter ~$70/mo. Turbopuffer ~$0 at our volumes but adds a vendor.

### 2. Topic-clustering cadence: per-write trigger vs periodic batch

- **Status quo / implicit default:** Nothing scheduled today. `tick_skills()` exists in `0002_schedules.sql` but `scheduled-agent-dispatch` handoff still has it as scaffold-only.
- **Per-write pros:** cluster state always fresh; embeds at the moment of capture.
- **Per-write cons:** hits Anthropic on the user's hot path → latency on capture; with 3.4K cognition input cap, you can't read "all recent entries" anyway.
- **Batch pros:** debounces cost; matches how the daily-brief / weekly-review agents already work; cap-friendly (windowed read).
- **Batch cons:** clusters lag reality by one tick; adds infra dependency on pg_cron + `tick_skills()`.
- **Proposed default:** **periodic batch, hourly or daily.** Lines up with existing scheduled-agent infra; respects cognition input cap; embedding-on-write (cheap) can still be per-write while clustering is batch.
- **Implication for stack:** depends on `scheduled-agent-dispatch` shipping (currently in § Active handoffs — sub-agent is wiring this overnight). Per-write would skip that dependency but adds latency you'd then have to engineer around.

### 3. Promotion threshold: hand-tuned vs learned

- **Status quo / implicit default:** No `times_observed` column exists. `project-memory-tiers.md` describes the pipeline but no implementation.
- **Hand-tuned pros:** ship in hours, debuggable, one row in config.
- **Hand-tuned cons:** wrong number for users with different cadences.
- **Learned pros:** adapts per user.
- **Learned cons:** zero-data cold start; needs training-signal source we do not have; over-engineered for V1.
- **Proposed default:** **hand-tuned (start at 3 observations across ≥2 sessions, ≥48h apart).** Learning is post-V2 if/when there's enough signal.
- **What "promoted" looks like in DB terms:** add an `observations` table in Supabase (working-tier) with `times_observed`, `last_observed_at`, `promoted_at` columns. Promotion = setting `promoted_at` and writing the durable shape into the matching long-term table (e.g. `projects` or a new `patterns` table). MA memory becomes a *cache* over `observations`, which reconciles workstream 3 with ADR 0001 (see Risk flag #1).

### 4. Capture-routing model: extend Haiku binary vs richer model; same model across workstreams or per-workstream

- **Status quo:** `classifyTranscript` in `supabase/functions/reminders/index.ts` uses `claude-haiku-4-5-20251001` with a 15-line prompt returning binary `{classified, text, remind_on}`.
- **Extend Haiku pros:** prompt swap only; cheap; well-understood; fits cognition input cap easily.
- **Extend Haiku cons:** N-way classification with disambiguation may benefit from a stronger model when destinations grow.
- **Richer model pros:** higher accuracy on ambiguous "is this a project or a reflection" calls.
- **Richer model cons:** ~10–30× cost; latency on hot path; cap pressure if context grows.
- **Same-model-across-workstreams pros:** one prompt-engineering surface, one eval set.
- **Per-workstream pros:** topic-clustering and memory-promotion run as background passes (latency-tolerant) and could justify Sonnet; capture-routing must stay fast → Haiku.
- **Proposed default:** **extend the Haiku classifier for workstream 1; per-workstream models for 2 and 3 (Sonnet on background passes is fine).** Same prompt skeleton, different model bindings.
- **Token-cost implication (ballpark):** classifyTranscript today ~150 in / 100 out per call → cents/month at single-user. Adding 4–6 destination categories grows the prompt by ~50 tokens — still cents.

## What's overnight-friendly NOW (no decisions needed)

- **Workstream 1 (capture-routing):** build a labeled eval dataset (~20–30 transcripts → intended destination) under `evals/datasets/capture-routing/cases.json`. Independent of model choice — needed for *every* version of decision #4. Also: extract the routing prompt into a versioned file in the repo (currently inlined in `index.ts`), per ADR 0001 rule "prompts live in the repo as versioned files."
- **Workstream 2 (topic-clustering):** add `project_id uuid references public.projects(id)` FK on `entries` and `reminders`. The handoff lists this as missing; it's a mechanical migration independent of cadence and embedding-store decisions. The embedding *column* DOES depend on decision #1 (`vector(N)` for pgvector vs id-string for external) — defer that one.
- **Workstream 3 (memory-promotion):** create the `observations` table skeleton with `id, user_id, kind, content, times_observed int default 1, last_observed_at, promoted_at nullable` — this is the working-tier's structured shim and is needed regardless of how decision #3 lands. Skip the actual promotion logic.

## Recommended sequencing

If Muxin answers all four in the morning: **wiring-audit and chat-reminder bugs (already top of § Next) ship first**, since they're paired-parallel and don't depend on the noticing layer at all. Then activate noticing-layer work in this order: workstream 1 (capture-routing) first because it's smallest scope, has the existing classifier as a seed, and dogfoods the routing primitive. Workstream 3 (memory-promotion observations table) second — it's the substrate workstream 2 reads from. Workstream 2 (topic-clustering) last — it composes everything below it. Sub-agents to dispatch in parallel after the four answers: (a) extend `reminders` Edge Function to N-way routing with eval, (b) `project_id` FK migration + `observations` table migration, (c) prompt-extraction refactor.

## Risk flags

- **ADR 0001 vs workstream 3 (live conflict).** ADR 0001 says "MA = runtime, not state store." `project-memory-tiers.md` says "MA memory = working brain, durable-ish, with promotion semantics." Workstream 3 implicitly treats MA memory as a real store. Cleanest reconciliation: **MA memory is a cache over a Supabase `observations` table; promotion = flag flip in Supabase.** This needs Muxin's confirmation before workstream 3 activates.
- **Cognition input cap (3.4K, locked).** Bounds the noticing pass — kills "re-embed everything on every write," forces batched/windowed reads, keeps capture-routing on Haiku because richer-model + bigger context blows the cap.
- **Critical-items dependencies.** TRACKER § Critical items #1 (design folder reconciliation) and #2 (reminders intent reconciliation) are explicitly called out in the handoff as feeding noticing-layer design space. Reconcile before activating, not in parallel.
- **Privacy.** A noticing layer reads user state continuously and writes inferences. RLS on `observations` from day one (mirroring `entries_owner`). MA memory is per-agent-per-user already; verify that holds when promotion is added.
- **Cost.** Single-user / hackathon scale: pennies/month. Watch the moment workstream 2 lights up — embedding writes per entry × Sonnet cluster pass = the first non-trivial line item.

## Effort estimate

- **First PR after activation** (workstream 1: extend Haiku to N-way routing + eval dataset + prompt extraction): **~1.5 days.**
- **V1 of full noticing layer** (all three workstreams, hand-tuned thresholds, batch cadence on existing pg_cron): **~5–7 days** assuming the four decisions land Monday morning and the ADR-0001-vs-tiering reconciliation goes the "MA-as-cache" route.

---

*Briefing produced by scope-scout sub-agent (read-only analysis). When you're ready, answer the four questions above and the orchestrator will dispatch the appropriate work sub-agents per the recommended sequencing.*
