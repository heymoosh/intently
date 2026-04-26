---
captured: 2026-04-26T08:20:00-05:00
session: chat/0425-210554
source: discussion
amends: agent-noticing-layer briefing + chat-as-top-level-orchestrator + graph-db-decision-revisit
---

# Architecture audit + corrections from Muxin's morning review

Muxin pushed back at 08:20 with three concerns, all rooted in: "Are we actually following our own architecture docs (`docs/architecture/{document-taxonomy,data-model,agent-memory}.md`)?" Audit findings + corrections below.

## Audit findings

### Goals achieved
- ✅ Per-user isolated state store (RLS on every Supabase table)
- ✅ Query-by-ID (every row has UUID, indexed)
- ✅ Portability (plain Postgres SQL — migrates to anywhere)
- ✅ Single-source-of-truth for identity (PR #174 made seed write to profiles)

### Real deviations from `agent-memory.md`
- ⚠️ **Stable slug-based IDs not adopted.** Doc specified `project.<slug>`, `task.<project-slug>.<seq>`, etc. ("IDs survive storage migrations"). We use `gen_random_uuid()`. UUIDs achieve the migration-stability property; they lose the human-readable / URL / hierarchical-traversal properties. **Fixable** with a `slug` column alongside UUIDs.
- ⚠️ **Hindsight as Layer 2 — deferred.** We use Supabase rows directly. Architecture allows migration: dump → reformat IDs → load to Hindsight. No code path locks us to Supabase-specific features.
- ⚠️ **MA Memory as Layer 3 (cache over Layers 1+2) — NOT IMPLEMENTED.** Agents re-read Supabase on every invocation. This matches the doc's "if Memory not approved" fallback path. The doc explicitly said: *"When approved, Intently uses it as a cache over Layers 1 and 2 — fast recall of 'what did I tell the user yesterday' and 'what did the user prefer the last time we ran weekly-review.' It is never the authoritative state store."*
- ⚠️ **BWS deferred** per ADR 0005 → Supabase Vault for OAuth (locked in PR #170). Architecturally consistent with the "until multi-user / scale" trigger.

## Correction 1 — Chat as top-level orchestrator: SIMPLIFY (use Managed Agent infra)

Muxin's clarification at 08:20: *"You're using an LLM in the background. Make it an orchestrator-level LLM. Turn it into a managed agent. Let it figure things out... It should have access to any other sub-agents. We don't have to code it specifically. It's supposed to be open-ended. Whatever the managed agent inherits from being a managed agent that's running Opus should still be the same. I think a lot of these open questions are needless."*

**Supersedes** the open-questions list in `2026-04-26T0140-chat-as-top-level-orchestrator.md`. Most of those questions are non-questions if we use the Managed Agent abstraction:

| Question I raised | What MA infrastructure handles |
|---|---|
| Sub-agent registry | Tool-use — list other skills as tools the chat agent can call. |
| Decomposition logic | The agent reasons across multi-action utterances natively. |
| Failure handling | MA tool-use error handling. |
| State across turns | MA Memory (Layer 3 from agent-memory.md) when approved. Falls back to per-turn context if not. |
| Token budget | Default tier (Sonnet first, escalate if needed); start cheap, MA handles cost-vs-capability tradeoffs. |
| Capture-routing model | Same agent, same prompt — MA decides what to call. |

**Locked design:**
- New skill: `agents/chat/` with SKILL.md + ma-agent-config.json
- System prompt: "You're Intently's user-facing assistant. The user expects you to handle anything. You have access to these skills as tools: [daily-brief, daily-review, weekly-review, monthly-review, setup, update-tracker, reminders-classifier]. Read the user's intent. Route to the right skill (one or many). Stay tonally calm."
- Default model: **Sonnet 4.6** (escalate to Opus if MA's reasoning loop ever stalls — measure first, decide later)
- MA Memory: ON when approved, fallback to stateless if not
- Tool list = the existing skills, exposed via ma-proxy. NEW: chat skill itself exposed as a tool too? No — chat doesn't call itself, it IS the entrypoint.

**Implementation scope shrinks dramatically.** From "design pass needed" to "write a tight system prompt + add chat to ma-proxy SKILL_ENV + replace HeroChat's daily-brief fallback with the new chat skill." Half-day work. Sub-agent dispatch eligible.

## Correction 2 — Agent noticing layer: USE MA MEMORY (per agent-memory.md Layer 3)

Muxin's clarification: *"Are we using the Managed agents built in memory? That was one of the things that we had already discussed and agreed on."*

`agent-memory.md` Layer 3 was the locked plan. The noticing layer's "promotion pipeline" is exactly the use case the doc described.

**Updated noticing-layer architecture (supersedes briefing's pgvector-only framing):**

- **Working tier (MA Memory):** the agent observes patterns over time — "user mentioned 'apartment move' three times in journal" — and accumulates these as soft observations in MA-managed memory. Per-agent, per-user.
- **Long-term tier (Supabase `observations` table):** when MA memory's accumulated count crosses the promotion threshold (hand-tuned: 3 obs / ≥48h), the agent writes a durable row to `observations`. This is the promotion event.
- **First-class promotion (Supabase `projects`/`goals` rows):** when an `observation` row's relevance score / recurrence count crosses a higher threshold, the agent proposes promoting it to a real project / goal / pattern. User confirms.

**Test approach:**
- Integration test: simulate 3 observations of the same pattern → verify promotion fires → verify Supabase `observations` row exists.
- The cognition-verification-harness handoff (separate work) is the natural home for this test.
- Manual acceptance: agent surfaces "I noticed you've talked about X three times this week — should I track it?" The user says yes → real `projects` row appears.

**Implication:** noticing layer's "capture-routing" workstream COLLAPSES into the chat agent (per Correction 1 — chat IS the router). Workstreams 2 (clustering) and 3 (memory promotion) remain. Both depend on MA memory being approved.

**Action item — confirm MA memory access:** the agent-memory.md doc says "limited research preview, waitlist submitted 2026-04-22." Status today unknown to the orchestrator. Muxin should check before dispatching noticing-layer work. If approved → build per Correction 2 above. If not → Supabase `observations` table acts as both working and long-term tier (with promotion = `promoted_at` flag flip), and we wait for MA memory approval to retrofit the working tier.

## Correction 3 — Graph DB decision: gated on AGE research + architecture-doc alignment

`2026-04-26T0150-graph-db-decision-revisit.md` is still open. Plus Muxin's new constraint: the graph-DB strategy must consider whether we're achieving `agent-memory.md`'s stable-IDs goal. Implication: whichever graph-DB option lands (AGE / Postgres-native / external), it must adopt slug-based IDs alongside UUIDs.

**Action:** re-launching the AGE sub-agent (which died with stream timeout). New brief includes the architecture-doc alignment requirement.

## Out of scope for this capture

- The actual implementation work (sub-agent dispatches handle).
- Re-writing the architecture docs themselves — they're explicitly historical reference; if we deviate, an ADR captures the decision.
