---
captured: 2026-04-26T15:30:00-05:00
session: chat/0425-210554
source: discussion
---

# Should Intently expose itself as an MCP server?

Muxin asked at 15:30 while planning Claude Code MCP installs: "Wouldn't that be worth having in our app, because then people can just connect whatever they want to it, right?"

This is a different layer than Claude Code MCP installs (Supabase, Playwright, Vercel — what I use). Intently-as-MCP-server means: external MCP clients (Claude Desktop, other tools) can call Intently's skills.

## What it would unlock

- **Claude Desktop user types "what's on my plate today"** → Claude Desktop's chat → MCP call → Intently's chat skill (or daily-brief) → response shown back in Claude Desktop. The user never opens the Intently web app.
- **Cross-app composition.** A Linear MCP + Intently MCP loaded into the same client could let the user say "create a Linear ticket for each of today's plan items" and have it just happen.
- **Bring-your-own-frontend.** Power users could build their own UIs against Intently's MCP surface without needing the prototype's HTML.

## Architectural shape

Intently's skills are already accessible via `ma-proxy` (the Edge Function that routes skill name → MA agent). Exposing them as MCP would mean:

- A new endpoint (could be another Edge Function, or a Node service) that speaks MCP protocol over stdio/SSE/WebSocket.
- The endpoint translates MCP tool calls → ma-proxy invocations.
- Auth: every MCP request must carry the user's identity (probably via a per-user MCP token issued from the Intently account).
- Tools list: each skill becomes a tool (`tool: daily_brief`, `tool: update_tracker`, etc.) with a JSON schema for input.

## Trade-offs

- **Pros:** real interop with the broader MCP ecosystem; multi-frontend support; future-proof against the "everything is an agent client" trend.
- **Cons:** another auth surface to maintain; another deploy target; doubles the API attack surface; requires MCP protocol implementation (or a server framework).
- **V1 audience question:** Muxin is currently the only user. Until there's demand for cross-app composition, this is overhead.

## Lean

**Defer to V2+.** Capture the design intent now (this file). Re-engage when:
- More than one user; OR
- A specific cross-app use case lands (e.g. wanting to call Intently from Claude Desktop daily); OR
- The MCP ecosystem produces a clear server framework that makes this trivial (current frameworks are early).

Until then, the web app + ma-proxy + Edge Functions are the user-facing surface. No urgency.

## Cross-references

- The Claude Code MCP installs (Supabase, Playwright already loaded) are a separate concern — they're tools for ME during dev, not user-facing.
- Linear / Notion as MCP clients of Intently is the same direction (their MCP server connects to ours), separate dispatch.
