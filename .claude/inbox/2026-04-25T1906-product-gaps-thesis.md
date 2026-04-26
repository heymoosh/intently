---
captured: 2026-04-25T19:06:58-04:00
session: chat/0425-171303
source: explicit
origin: parallel session at chat/0425-182455 (worktree wt/0425-182455)
resolved: 2026-04-25T19:15 — promoted to handoff at .claude/handoffs/agent-noticing-layer.md
---

# Product Gaps — agent-should-do-the-noticing thesis (2026-04-25)

Pointer to a self-contained gaps doc written in a parallel Claude session: `docs/product-gaps-2026-04-25.md` (currently lives at `/Users/Muxin/wt/0425-182455/docs/product-gaps-2026-04-25.md`; will land at `docs/product-gaps-2026-04-25.md` on main once that branch merges).

**Thesis (verbatim):** *"The agent should do the noticing. The user throws things in; the system organizes. That's the actual product differentiator vs. every other productivity app, where the user has to tell the system where things go."*

**Three gaps named — all same shape, surfaces without the intelligence behind them:**

1. **Multi-modal hero capture with intelligent routing.** Built: unified surface (mic + menu + chat) + Haiku binary `reminder` / `not-reminder` classifier. Missing: multi-destination routing (project? goal? thread?). `WIRING-POINTS.md` flags as blocking + undecided.
2. **Topic clustering → auto-project assembly.** Built: `projects` table with `goal_id`. Missing: `project_id` FK on entries/reminders, embeddings/vectors, similarity logic, agent pass that detects recurrence + auto-creates projects.
3. **Memory tiering with promotion pipeline.** Built: schema separates MA memory (working) from Supabase (long-term). Missing: `times_observed` counters, promotion logic, agent pass that decides "has this pattern recurred enough to durabilize?" Tagged V1.1 post-hackathon in TRACKER.

**Cross-cutting insight:** all three are the same architectural pattern — the agent re-reads recent state at some cadence and proposes structure. Capture routing = one input → where does it go. Topic clustering = many inputs → what pattern is forming. Memory promotion = many patterns → which deserve durable storage. Same shape, different scopes.

**Existing memories already pointing at this:**
- `project-inbox-capture-gap.md` (capture→route→surface loop broken; demo risk)
- `project-memory-tiers.md` (two-tier brain spec; implementation absent)
