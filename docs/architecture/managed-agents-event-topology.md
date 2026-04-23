# Managed Agents — Event Topology

Reference captured from Anthropic webinar, 2026-04-23. Beta header: `managed-agents-2026-04-01`.

**Big picture:** the event stream is everything happening between your app, the agent, tools, and the session runtime. It is designed to let you build your own product UI and logic on top of the managed agent runtime.

---

## User events
Events sent **into** a session from your application or user.

| Category | Event type | Available now? |
|---|---|---|
| Messages (text, images, documents — same content blocks as Messages API) | `user.message` | Yes |
| Interrupts (halt agent mid-run, e.g. user presses stop) | `user.interrupt` | Yes |
| Custom tool results (your backend returns tool output) | `user.custom_tool_result` | Yes |
| Tool confirmations / permission responses (approve or reject before execution) | `user.tool_confirmation` | Yes |
| Outcomes (success rubric — Claude self-checks and retries until rubric is met) | `user.define_outcome` | **Research preview — not public yet** |

> **Outcomes:** you send Claude a rubric defining what success looks like; it checks itself against it and corrects if needed. Essentially a testing vector — but the rubric is text, and it can tell Claude to use URLs/APIs/tools to verify success externally. You don't hard-code the verification logic. Waitlisted; no firm public date.

---

## Agent events
Events emitted **by Claude** during execution.

| Category | Event type | Available now? |
|---|---|---|
| Messages (text output / replies) | `agent.message` | Yes |
| Context compacted notification (not silent) | `agent.thread_context_compacted` | Yes |
| Native tool use (bash, file read/write, glob, web search, web fetch) | `agent.tool_use` | Yes |
| Native tool result | `agent.tool_result` | Yes |
| MCP tool use | `agent.mcp_tool_use` | Yes |
| MCP tool result | `agent.mcp_tool_result` | Yes |
| Custom tool use (your defined tools) | `agent.custom_tool_use` | Yes |
| Multiagent: message sent to another agent | `agent.thread_message_sent` | **Research preview — not production-ready** |
| Multiagent: message received from another agent | `agent.thread_message_received` | **Research preview — not production-ready** |

> **Multi-agent note:** private research preview. Do not design V1 around it. See "Skills vs sub-agents" section below.

---

## Session events
Lifecycle and state events for the **session runtime**.

| Category | Event type | Available now? |
|---|---|---|
| Status: running (Claude responding, container provisioning, tool use) | `session.status_running` | Yes |
| Status: idle (nothing happening — agent finished) | `session.status_idle` | Yes |
| Status: rescheduled (system retrying/recovering on your behalf) | `session.status_rescheduled` | Yes |
| Status: terminated (session ended / deleted) | `session.status_terminated` | Yes |
| Error (richer error detail for app-level handling) | `session.error` | Yes |
| Outcome processing (Claude running self-verification against rubric) | `session.outcome_evaluated` | **Research preview — tied to outcomes** |
| Thread created (multi-agent coordination) | `session.thread_created` | **Research preview — tied to multi-agent** |
| Thread idle (multi-agent coordination) | `session.thread_idle` | **Research preview — tied to multi-agent** |

---

## Span events
Fine-grained **instrumentation and timing markers** for building live UIs and observability.

| Category | Event type | Available now? |
|---|---|---|
| Model request start (inference begins) | `span.model_request_start` | Yes |
| Model request end (inference ends) | `span.model_request_end` | Yes |
| Outcome evaluation start | `span.outcome_evaluation_start` | **Research preview — tied to outcomes** |
| Outcome evaluation ongoing | `span.outcome_evaluation_ongoing` | **Research preview — tied to outcomes** |
| Outcome evaluation end | `span.outcome_evaluation_end` | **Research preview — tied to outcomes** |

---

## What's available now vs preview — summary

**Available now (use these):**
- User messages (text, images, documents), interrupts, custom tool results, permission confirmations
- Agent messages, context-compaction notices
- Native tool use/results (bash, file ops, web search/fetch)
- MCP tool use/results, custom tool use
- Session status events (idle, running, rescheduled, terminated), session errors
- Basic span timing (model request start/end)

**Research preview / not public yet (do not rely on for hackathon):**
- Outcomes (`user.define_outcome`, `session.outcome_evaluated`, all outcome-related spans)
- Multi-agent coordination (`agent.thread_*`, `session.thread_*`)

---

## FAQ from webinar audience — 2026-04-23

### Long-running agents / context management
Anthropic currently handles context automatically up to ~1M token window. When it gets long, they compact it (triggering `agent.thread_context_compacted`). They are working on better strategies beyond simple compaction but did not describe exact internals. Sessions can sit idle for **weeks or months** — no charge for idle time.

### Programmatic control
Full CRUD on agents, environments, and sessions via API and SDK. You do not need the console UI at all. The console is just a visual debugging surface.

### Webhook-style / trigger-based wakeup
Sessions can be resumed at any time by sending a new event (idle sessions persist indefinitely). True **webhook-driven wakeup** (e.g. resuming a session from a Twilio event) is being actively explored but not yet first-class. For now: your backend receives the webhook, looks up the session ID, sends a `user.message` event.

### Authentication
**API key required.** OAuth for developer APIs is not yet enabled. Feedback on OAuth demand is welcome to Anthropic.

### Using outside the console
Yes — the demo app makes direct API calls via the Anthropic SDK. No console required. The console is optional tooling for inspection/debugging.

### Data retention for sensitive content
- **File uploads into the sandbox:** persist until explicitly deleted via the Files API.
- **Image content blocks in messages:** processed by Claude, not stored as files on Anthropic's end.
- Full retention policy is in the Anthropic docs.

### Can one managed agent control other agents?
Not first-class yet (safety/security concerns). Possible in principle by giving an agent tools that map to the agent CRUD APIs — Anthropic has done this internally. Proceed with caution; this is not a recommended pattern today.

### Skills vs sub-agents
These are not in conflict. The recommended pattern is: **build skills, give them to a single managed agent.** You usually do not need a separate sub-agent for every task. One agent with the right skills > multiple agents with narrow roles. This directly applies to Intently V1 — one agent per Life Ops skill run, no sub-agents.

### Security / UX balance
Anthropic's recommendation: use **credential isolation** (Claude never sees raw secrets; credentials flow through their vault/proxy) and **permission policies** (auto-allow safe read/search tools; require human confirmation for destructive actions). The agent's power comes from real access — but you control the guardrails per tool.

---

## Notes for Intently V1

- **Completion signal:** `session.status_idle` = agent run finished → trigger mobile UI refresh.
- **Error handling:** `session.error` + `session.status_terminated` = two failure paths. Handle both.
- **Scheduling:** no built-in cron. Your Supabase backend fires `POST /v1/sessions` on schedule.
- **Memory tool:** available now (end of day 2026-04-23 per webinar). Client-side; you control storage. Namespace per-user in Supabase Storage. See `docs/architecture/agent-memory.md`.
- **MCP observability:** `agent.mcp_tool_use/result` makes Hindsight and calendar tool calls visible in the event stream — useful for debugging.
- **No multi-agent:** one session per Life Ops skill run. Build skills, not sub-agents.
- **No native outcomes:** use `docs/process/definition-of-done.md` as the prompt-based equivalent. Revisit when outcomes goes public.
- **Compaction awareness:** `agent.thread_context_compacted` can fire silently on long runs — handle gracefully in the mobile stream consumer.
- **claude-api skill:** bundled with Claude Code, activates automatically when working with Anthropic SDK code. Use `/claude-api managed-agents-onboard` to scaffold a new agent from scratch. Covers 7 languages for Managed Agents.
