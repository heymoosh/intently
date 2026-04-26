# Product Gaps — 2026-04-25

Captured from chat session for later drop into the inbox feature (currently being built in a parallel Claude session). Self-contained on purpose so it reads cleanly out of context.

---

## The thesis

**The agent should do the noticing.** The user throws things in; the system organizes. That's the actual product differentiator vs. every other productivity app, where the user has to tell the system where things go.

What we have right now is the inverse: surfaces exist (capture button, projects table, two memory layers), but the **noticing layer** doesn't. The user is still the router.

This isn't a polish gap. It's the core of the pitch missing.

---

## Three gaps, same shape

All three are surfaces without the intelligence behind them.

### 1. Multi-modal hero capture with intelligent routing

**Intended:** Hero button is the one place to drop journal entries, talk to your agent, chat with your agent, write a reminder. The agent figures out where it belongs — is this a project? Related to something we've been talking about? Tied to a goal? Where's the home?

**Built:** Unified capture surface exists (mic + menu + chat). Voice transcripts route through a Haiku classifier that returns binary `reminder` / `not-reminder`. No multi-destination routing. `WIRING-POINTS.md` flags this as undecided and explicitly blocking.

### 2. Topic clustering → auto-project assembly

**Intended:** Over time, the agent notices you've talked about the same topic repeatedly. That recurrence is the signal to assemble those mentions into a project — using the same schema we already use for projects (Tracker, Strategy, todos, goal linkage). The project emerges from the noticing; the user doesn't have to declare it.

**Built:** `projects` table exists with `goal_id` cascade (goal→project linkage works). No `project_id` foreign key on entries / reminders. No embeddings, no vector columns, no similarity logic. No agent pass that detects recurring topics. No auto-project-creation pathway.

### 3. Memory tiering with promotion pipeline

**Intended:** Two-tier brain. Managed Agents memory = working brain — soft patterns the agent observes about the user, transient. Supabase = long-term, durable, explicit user commitments. **Promotion:** when a soft pattern repeats enough, it gets promoted from MA memory to durable Supabase storage. The agent decides what's worth keeping.

**Built:** Schema separates the two layers. Zero repetition counting. No `times_observed` columns. No promotion logic. No agent pass that asks "has this pattern recurred enough to make durable?" Tagged as V1.1 post-hackathon in TRACKER.

---

## Why these matter together

The three are the same architectural pattern: **the agent re-reads recent state at some cadence and proposes structure.** Capture routing is "given one new input, where does it go?" Topic clustering is "given many recent inputs, what pattern is forming?" Memory promotion is "given many observed patterns, which deserve to become durable?" Same shape, different scopes.

If any one of these worked end-to-end, Intently would feel different from a productivity app. None of them do yet.

---

## Related existing memory

- `project-inbox-capture-gap.md` — daily-triage deferred = capture→route→surface loop is broken; demo narrative risk if not resolved
- `project-memory-tiers.md` — two-tier brain analogy with promotion pipeline; spec exists, implementation doesn't
