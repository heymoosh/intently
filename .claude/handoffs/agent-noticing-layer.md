# Agent noticing layer — multi-modal capture, topic clustering, memory promotion

Persistent project handoff for the cross-cutting "agent should do the noticing" architectural arc identified 2026-04-25.

## Why

**Thesis (verbatim from source doc):** *"The agent should do the noticing. The user throws things in; the system organizes. That's the actual product differentiator vs. every other productivity app, where the user has to tell the system where things go."*

What's built: surfaces (capture button, projects table, two memory layers).
What's missing: the noticing layer underneath. The user is still the router.

This is the core of the pitch missing — not a polish gap.

## What — three workstreams, same architectural pattern

All three are "the agent re-reads recent state at some cadence and proposes structure." Same shape, different scopes.

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

- **Built:** schema separates the two layers
- **Missing:** `times_observed` counters, promotion logic, agent pass that asks "has this pattern recurred enough to durabilize?"
- Already noted as V1.1 post-hackathon in TRACKER

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

## Related

- Memory: `project-inbox-capture-gap.md` — capture→route→surface loop is broken; demo narrative risk if not resolved
- Memory: `project-memory-tiers.md` — two-tier brain spec, implementation absent
- TRACKER § Critical items awaiting review #1–2 (entries-architecture reconciliation + reminders intent reconciliation) — both feed this handoff's design space; reconcile before activating

## Open decisions (deferred to activation; will spawn their own ADRs)

- **Embedding store:** pgvector (already on Supabase) vs. external (Pinecone, Turbopuffer)
- **Topic-clustering cadence:** per-write trigger vs. periodic batch (every N captures, every N hours)
- **Promotion threshold:** how many `times_observed` before promotion? Hand-tuned or learned?
- **Capture-routing model:** extend the existing Haiku classifier to N destinations, or move to a richer model? Same model for all three workstreams or per-workstream?

Don't decide these now. They land when the work activates.
