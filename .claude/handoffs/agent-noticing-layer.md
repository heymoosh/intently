# Agent noticing layer — multi-modal capture, topic clustering, memory promotion

Persistent project handoff for the cross-cutting "agent should do the noticing" architectural arc identified 2026-04-25.

## Why

**Thesis (verbatim from source doc):** *"The agent should do the noticing. The user throws things in; the system organizes. That's the actual product differentiator vs. every other productivity app, where the user has to tell the system where things go."*

What's built: surfaces (capture button, projects table, two memory layers).
What's missing: the noticing layer underneath. The user is still the router.

This is the core of the pitch missing — not a polish gap.

## What — four workstreams, same architectural pattern

All four are "the agent re-reads recent state at some cadence and proposes structure." Same shape, different scopes.

### 1. Multi-modal hero capture with intelligent routing

Hero is the one place to drop journal / agent talk / agent chat / reminder. Agent figures out where it belongs (project? goal? thread?).

- **Built:** unified surface (mic + menu + chat) + Haiku binary `reminder` / `not-reminder` classifier
- **Missing:** multi-destination routing
- **Tracked at:** `web/WIRING-POINTS.md` (flagged blocking + undecided as of 2026-04-25 smoke)

### 2. Topic clustering → auto-project assembly

Over time, agent notices recurring topics and assembles them into a project (using existing project schema: Tracker, Strategy, todos, goal linkage). Project emerges from noticing; user doesn't declare it.

- **Built:** `projects` table with `goal_id` cascade (goal→project linkage works)
- **Missing:** `project_id` FK on entries/reminders, embeddings / vector columns, similarity logic, recurrence-detection agent pass, auto-project-creation pathway

### 3. Memory tiering with promotion pipeline

Two-tier brain — MA memory (working, soft patterns the agent observes) + Supabase (long-term, durable, explicit user commitments). Promotion when a soft pattern repeats enough; the agent decides what's worth keeping.

- **Built:** schema separates the two layers — `public.observations` table is the long-term durable tier (migration `0009_graph_schema.sql`; see ADR `docs/decisions/0010-graph-db-strategy.md` for why Postgres-native was chosen over Apache AGE / Neo4j)
- **Missing:** `times_observed` counters, promotion logic, agent pass that asks "has this pattern recurred enough to durabilize?"
- Already noted as V1.1 post-hackathon in TRACKER

### 4. Life-area promotion (V1.1)

Third entity tier alongside goals + projects: an "ongoing-area" for persistent topics that are neither goals (no target outcome) nor projects (no start/end). Health, family, fitness, finances — these stay active indefinitely.

- **Built:** `public.life_areas` table (migration `0011_life_areas.sql`): `id`, `user_id`, `slug`, `name`, `description`, `glyph`, `palette`, `position`, `goal_id` (soft FK), `archived_at`. RLS owner-only. `entries.area_id` and `projects.area_id` FKs for write-time routing (path c) and project→area linkage (path b).
- **Agent wiring:** `agents/noticing/SKILL.md` updated — area-shaped patterns get `subject_kind='area'`; noticing agent distinguishes area-shaped (no end state) vs project-shaped (has target) observations. `agents/update-tracker/SKILL.md` updated — `create_life_area` and `attach_entry_to_area` tools added to the output contract; input now includes `active_life_areas`.
- **UI:** Future view (`web/index.html` `FutureScreenProtoTappable`) mixes goals + areas in the same card column. Combined 3-card cap with "Show more (N)" expand. Reuses the goal `PainterlyBlock` + `Glyph` treatment with "Life area" label.
- **Entity helpers:** `web/lib/entities.js` — `insertLifeArea`, `listLifeAreas`, `archiveLifeArea`, `getLifeArea`.
- **Evals:** `evals/datasets/life-areas/cases.json` — 5 cases covering health→area promotion, explicit create-area command, project→area lineage, area vs project distinction, and no-areas graceful fallback.
- **V1 promotion paths implemented (schema + agent spec):**
  - (a) observation → life-area creation (noticing proposes "Create Health area" when `subject_kind='area'`)
  - (b) life-area → project spin-off (`projects.area_id` FK, project links back to area)
  - (c) entries → area write-time routing (`entries.area_id` FK, update-tracker stamps it)
- **V1.2 deferred:** production-grade promotion threshold tuning (the 3/48h dial for area vs. project proposals).

## Cross-cutting insight (the load-bearing decision)

The three are NOT separate features — they're the same architectural pattern at different scopes:

- **Capture routing** = one input → where does it go
- **Topic clustering** = many inputs → what pattern is forming
- **Memory promotion** = many patterns → which deserve durable storage

**Implication:** build the agent re-read + propose-structure primitive *once*; reuse across the three. Don't design three separate ML systems. This is the framing decision worth preserving — easy to lose if the gaps get worked as separate tickets.

## Doc lineage

- **Source artifact:** `docs/product-gaps-2026-04-25.md` (written in parallel worktree `wt/0425-182455` 2026-04-25; pending merge to main at handoff-creation time)
- **This handoff supersedes the source.** When the parallel branch merges, decide: banner the source doc as "see `.claude/handoffs/agent-noticing-layer.md`" and keep as a historical reference, or delete entirely. Either works — this handoff carries the load-bearing content.
- **Captured into inbox at:** `.claude/inbox/2026-04-25T1906-product-gaps-thesis.md` (resolved by this handoff; first /groom session can drop the inbox file)

## Status

**V1.1 post-hackathon — not active.**

Hackathon submission (2026-04-26 8 PM EDT deadline) ships without the noticing layer. This handoff exists to preserve the architectural framing so post-hackathon work doesn't re-litigate the decision to treat the three gaps as one arc.

## Workstream 4: Capture-time signal tagging (V1.1 — shipped)

Implemented in PR `feat/capture-time-signal-tagging`.

**What was built:**
- **Schema:** `supabase/migrations/0011_entry_tags.sql` — `entries.tags text[]` + `entries.tag_confidence jsonb` columns + GIN indexes. `user_signals` table scaffold (V1.1 schema only; full UX is V1.2).
- **Classifier:** `supabase/functions/reminders/index.ts` route `POST /classify-and-tag`. Chained: Haiku reminder check → if not reminder, Haiku signal classifier using `CANONICAL_SIGNALS` constant (7 tags from `docs/product/signals.md`) + per-user `user_signals` rows. V1 picks single strongest tag per utterance.
- **UX:** `web/intently-hero.jsx` `sendUtterance` calls `classifyAndTag()` (in `web/lib/reminders.js`). ≥0.8 confidence → silent auto-tag (inline `#tag` in body + structured `tags[]`). <0.8 → `SignalConfirmCard` in thread ("Tag as #ant? Yes / No"). "Different tag" deferred to V1.2.
- **Entities:** `web/lib/entities.js` — `insertEntryWithTags`, `listEntriesByTag`, `listUserSignals`, `insertUserSignal`, `archiveUserSignal`.
- **Evals:** `evals/datasets/capture-time-tagging/cases.json` — 5 cases.

**Cross-cutting canonical rule:** `CANONICAL_SIGNALS` in `reminders/index.ts` is derived from `docs/product/signals.md`. Do not embed the tag list inline elsewhere.

## Signal taxonomy dependency

The V1 canonical signal set: `#brag`, `#grow`, `#self`, `#ant`, `#ideas`, `#gtj`, `#bet`. Canonical source: `docs/product/signals.md` — the doc that hoists the reflection-tag taxonomy out of individual skill files and gives framework provenance for each type. Any capture-routing or capture-tagging logic built under this arc must reference `docs/product/signals.md`, never embed the tag list inline.

## Related

- Memory: `project-inbox-capture-gap.md` — capture→route→surface loop is broken; demo narrative risk if not resolved
- Memory: `project-memory-tiers.md` — two-tier brain spec, implementation absent
- TRACKER § Critical items awaiting review #1–2 (entries-architecture reconciliation + reminders intent reconciliation) — both feed this handoff's design space; reconcile before activating
- ADR: `docs/decisions/0010-graph-db-strategy.md` — why the `observations` table (workstream 3's durable tier) is Postgres-native; migration path to AGE / external graph DB preserved

## Open decisions (deferred to activation; will spawn their own ADRs)

- **Embedding store:** pgvector (already on Supabase) vs. external (Pinecone, Turbopuffer)
- **Topic-clustering cadence:** per-write trigger vs. periodic batch (every N captures, every N hours)
- **Promotion threshold:** how many `times_observed` before promotion? Hand-tuned or learned?
- **Capture-routing model:** extend the existing Haiku classifier to N destinations, or move to a richer model? Same model for all three workstreams or per-workstream?

Don't decide these now. They land when the work activates.
