# Managed Agents — Demo Workflow & Mental Model

Captured from Anthropic webinar demo, 2026-04-23. This is a concrete operating workflow for how to build an app that integrates Managed Agents, using Claude Code as the implementation assistant.

---

## The two-layer mental model

```
Claude Code          =  the carpenter building your app
Managed Agents platform  =  the engine your app talks to
```

These are separate tools with separate jobs:

- **Claude Code** reads your spec and writes the backend code that creates sessions, uploads files, sends messages, streams events, and downloads artifacts.
- **Managed Agents platform** is the runtime that actually runs the agent in a hosted container. The console lets you inspect agent configs, sessions, and events — but you never have to use the console; everything is also accessible by API.

You switch between these two screens for different reasons:
- Claude Code screen: *how am I building the integration?*
- Managed Agents console: *what is that integration connecting into, and how do I debug it?*

---

## What to prepare before you start building

The demo shows that good prep is most of the work. Set these up before Claude Code writes a single line of integration code:

| What | Why |
|---|---|
| **UI components** (pre-built) | Claude Code writes the wiring, not the layout |
| **Backend function stubs** (unimplemented) | Gives Claude Code named targets to fill in |
| **`spec.md`** | Tells Claude Code exactly what the app should do; the single source of truth for the session |
| **Agent config** (model, name, system prompt, tools) | Create once, reference by ID forever |
| **Environment config** (network rules, packages) | Set the sandbox up once; don't redecide it per session |
| **Data / assets** (e.g. datasets, zip files) | Download ahead of time; don't let the demo depend on external fetches |

---

## The agent config

Create the agent resource once in the Managed Agents console or via API. It defines:

- **Model** — e.g. `claude-opus-4-7`
- **System prompt** — the agent's standing instructions
- **Tools** — which built-in tools are enabled, and any custom tools (e.g. a render-map tool that the UI knows how to display)
- **Always-allow rules** — which tools auto-execute without human confirmation

### The always-allow decision

The demo configured bash and file-read as **always allowed** (no approval click). This was a deliberate choice, not a default:

- The data was **publicly available** (city bike share dataset)
- The sandbox had **no sensitive content**
- The task was **analysis-only** (bash/file ops/charting = low risk)

**For Intently:** apply the same reasoning per-tool. Safe reads (file ops, calendar reads, web fetch) can auto-allow. Destructive or sensitive actions (deleting data, sending messages, writing to production) should require `user.tool_confirmation`.

---

## The environment config

The environment is the container the agent runs in. Configure it once:

- **Network access** — unrestricted for demo; restrict in production to only what the agent needs
- **Packages** — pre-install everything the agent needs (Python data-analysis libraries, zip handling, etc.)
- **Storage** — what files are pre-mounted or available

The environment is reusable. One environment per use case (e.g. one for data analysis, one for life ops tasks).

---

## What Claude Code writes against your spec

When given `spec.md` and the correct skill (`/claude-api managed-agents-onboard` or automatic activation), Claude Code generates backend code that:

1. **Creates or reuses an agent** by ID (create once, reuse forever)
2. **Creates or reuses an environment** by ID
3. **Creates a session** referencing agent + environment for each task run
4. **Uploads files** to the session (user uploads, datasets, etc.)
5. **Sends a `user.message` event** with the task prompt
6. **Streams events** back into the UI (agent messages, tool use, status transitions)
7. **Downloads/renders files** that Claude generated (charts, reports, output files)
8. **Handles `session.status_idle`** as the completion signal
9. **Handles `session.error` and `session.status_terminated`** as failure paths

---

## The flow from user action to rendered output

```
User submits task in mobile UI
        ↓
Backend: POST /v1/sessions  (create session for this run)
        ↓
Backend: POST /v1/sessions/{id}/events  (send user.message)
        ↓
Backend opens SSE stream: GET /v1/sessions/{id}/stream
        ↓
Events arrive:
  session.status_running     → show "agent is working" indicator
  agent.tool_use             → optionally show which tool is running
  agent.message              → stream text into UI
  agent.custom_tool_use      → trigger custom UI render (e.g. map)
  session.status_idle        → agent finished; hide indicator; show output
  session.error              → show error state; offer retry
        ↓
If agent wrote output files:
  Backend: GET /v1/files/{id}  (download)
  Frontend: render (chart, report, etc.)
```

---

## The custom tool pattern

If you need the agent to trigger something in your UI (e.g. render a map, play audio, update a component), define a **custom tool** on the agent:

1. Agent emits `agent.custom_tool_use` with the tool name and input
2. Your backend receives this event in the stream
3. Your backend handles it locally (no round-trip to Anthropic) and sends `user.custom_tool_result` back
4. Agent continues

This is how the demo rendered a map: the agent called a `render_map` custom tool; the backend told the frontend to render it; the frontend showed the map; the backend told the agent it was done.

---

## What the Managed Agents console is for

- **Inspect agent configs** — see exactly what model, prompt, and tools your API calls are using
- **Browse sessions** — list prior runs, inspect event logs
- **Debug event streams** — see what events fired and in what order
- **Edit agent configs during development** — change system prompt, add tools, flip always-allow settings without redeploying code

In production, you'll do most of this via API. The console is a development and debugging surface.

---

## Key constraints to keep in mind

| Constraint | Detail |
|---|---|
| API key required | No OAuth yet for developer APIs |
| No built-in cron | You fire sessions from your own backend scheduler |
| Multi-agent | Research preview only — do not design around it |
| Outcomes | Research preview — use prompt-based DoD instead (`docs/process/definition-of-done.md`) |
| Memory tool | Available end of day 2026-04-23; client-side storage, you control the backend |
| Idle sessions | Free; can sit idle for weeks/months; resume by sending a new event |
| Managed Agents is first-party only | Not on Bedrock, Vertex, or Azure Foundry |

---

## The claude-api skill

The `claude-api` skill is **bundled with Claude Code** and covers both the Messages API and Managed Agents. It activates automatically when your project imports an Anthropic SDK. You can also invoke it manually:

```
/claude-api managed-agents-onboard
```

This runs an interview that walks through agent setup, sessions, tools, and emits runnable starter code for your language. Use this at the start of any Managed Agents integration work.
