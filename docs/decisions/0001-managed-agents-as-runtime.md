# 0001 — Managed Agents is the execution runtime, not the state store

**Status:** Accepted
**Date:** 2026-04-22
**Decider:** muxin

## Context

Intently's execution backbone is Anthropic's Claude Managed Agents. The hackathon narrative leans hard on managed agents, and the Memory / Multiagent Orchestration / Outcomes features (currently limited research preview) are on the waitlist.

Post-hackathon, Intently may become a paid consumer app. Locking our architecture into Anthropic-specific primitives would make a future provider swap — or a shift to a self-hosted agent loop — expensive or infeasible. We need to use managed agents as hard as possible during the hackathon *without* coupling the app to them in ways we'd regret later.

## Decision

**Anthropic Managed Agents is the execution runtime. It is not the state store, not the schema owner, and not the orchestration graph owner.**

Concretely:

1. **State of truth** lives in Intently's own per-user data store — Markdown files and structured task state (Hindsight in V1; a Postgres/object-store pairing post-hackathon). Managed-Agents Memory, if and when approved, is used as a cache/working-context over this truth, never as authoritative storage.
2. **Tool schemas** are defined in standard JSON Schema. Tool implementations live in Intently's backend and are registered with the managed agent at runtime. Tools are callable by any provider that speaks JSON-Schema tool use.
3. **Orchestration graph** — the "what skill calls what, in what order, with what handoff" — is defined in Intently's code, not inside managed-agent orchestration primitives. Multiagent Orchestration (when approved) *runs* the graph; it doesn't *own* the graph's definition.
4. **Prompts** live in the Intently repo as versioned files, not embedded in agent configurations held by Anthropic.

## Alternatives considered

- **Self-host the agent loop from day one** (LangGraph, custom Python harness). Rejected for the hackathon: too much infrastructure work in 4 days, weakens the managed-agents submission narrative, burns time that should go into the demo flows.
- **Lean fully into managed-agent primitives** (state in Memory, orchestration via multi-agent handoff, tools defined inline). Rejected: vendor lock-in, rewrite cost if we later need to swap, and the consumer-app cost structure may eventually make self-hosting the loop cheaper.

## Consequences

**Easier:**
- Day-one execution in a 4-day hackathon.
- Strong "we used Anthropic's featured capability" narrative for the judging rubric.
- Future provider swap is SDK imports + a handful of call-site changes, not a rewrite.

**Harder:**
- We don't get the full convenience of managed state — we maintain our own per-user data store from day one.
- Tool schemas must stay in portable JSON Schema even if Anthropic offers a more ergonomic Anthropic-specific format.
- Orchestration logic in our code means we carry some complexity that managed-agent orchestration could have absorbed.

**Locked in:** nothing permanent. This is the whole point. If managed agents stops being the right fit, we change the runtime and keep the app.

**Enforcement:** violations of this principle (e.g., a skill that reads state directly from Managed-Agents Memory without a mirror write to the data store) should fail the Agent Memory Steward review.
