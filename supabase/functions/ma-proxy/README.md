# ma-proxy — Managed Agents proxy (Edge Function)

Supabase Edge Function that lets the Intently web client (Expo Web) invoke Managed Agents without shipping the Anthropic API key to the browser.

## Why this layer exists

Intently is pivoting to a mobile-responsive web app for the hackathon demo. Anything the browser loads — including environment variables prefixed `EXPO_PUBLIC_` — is visible to every site visitor. An API key in that bundle can be scraped in seconds and billed until revocation. This function is the thin server-side shim that holds the key: the browser calls `ma-proxy`, `ma-proxy` calls Anthropic, and the browser only ever sees the agent output. No key ever crosses the network to an untrusted client.

## Request / response

```
POST /functions/v1/ma-proxy
Content-Type: application/json

{
  "skill": "daily-brief",               // required; maps to an MA agent ID
  "input": "Good morning — brief me.",  // required; string or JSON object
  "sessionId": "sess_..."               // optional; resumes an existing session
}
```

Response on success (`session.status_idle` received):

```json
{
  "sessionId": "sess_...",
  "finalText": "Here is your morning brief...",
  "status": "idle"
}
```

Response on upstream failure, passthrough status code (`502`, `401`, etc.) with:

```json
{ "error": { "message": "...", "detail": { ... } } }
```

## V1 tradeoff — non-streaming

The function opens the upstream Server-Sent Events stream server-side, accumulates `agent.message` text blocks, and returns one JSON response when it sees `session.status_idle` / `session.error` / `session.status_terminated`. True SSE passthrough to the browser is deferred until post-hackathon — see the top comment in `index.ts` for the rationale. Events forwarded by the demo UX today are only the final agent output; live token streaming is a polish item, not a demo gate.

## Deploy

From the repo root:

```bash
supabase functions deploy ma-proxy
```

Shared-infra write (Muxin-only per `CLAUDE.md` § Non-functional requirements).

## Set secrets

`ma-proxy` reads everything it needs from Supabase secrets. Set them before the first call:

```bash
# Anthropic API key — pulled from Bitwarden Secrets Manager, never committed.
supabase secrets set ANTHROPIC_API_KEY=<value-from-bitwarden>

# Per-skill agent IDs (one per MVP skill). Create the agents once via the
# Managed Agents console or API, then set:
supabase secrets set MA_AGENT_ID_DAILY_BRIEF=<agent-id>
supabase secrets set MA_AGENT_ID_DAILY_REVIEW=<agent-id>
supabase secrets set MA_AGENT_ID_WEEKLY_REVIEW=<agent-id>
supabase secrets set MA_AGENT_ID_UPDATE_TRACKER=<agent-id>
supabase secrets set MA_AGENT_ID_SETUP=<agent-id>

# REQUIRED: shared environment ID (one per use case). Anthropic MA rejects
# create-session with `environment_id: Field required` if this is unset.
# Create an Environment in console.anthropic.com → Environments, then:
supabase secrets set MA_ENVIRONMENT_ID=<env-id>
```

**Never** commit these values anywhere. Bitwarden is the storage of truth (`CLAUDE.md` § Non-functional requirements).

## Smoke test (after deploy)

```bash
curl -X POST \
  "https://<project-ref>.supabase.co/functions/v1/ma-proxy" \
  -H "Content-Type: application/json" \
  -d '{"skill":"daily-brief","input":"smoke test"}'
```

A 200 with a `finalText` payload means the full round-trip (create session → user.message → stream → idle) is working.

## CORS

Currently `Access-Control-Allow-Origin: *` for hackathon iteration speed. Lock down to the actual deployed web origin (Vercel / Netlify URL) post-hackathon. Marked with a `TODO` in `index.ts`.

## Related docs

- `docs/architecture/managed-agents-event-topology.md` — event-stream contract the proxy consumes
- `docs/architecture/managed-agents-demo-workflow.md` — 3-call sequence (create → send → stream) the proxy implements
- `docs/architecture/managed-agents-tool-use-scheduling.md` — agent / tools config
- `app/lib/agent-runner.ts` — native-mobile direct-SDK path that this proxy replaces for web
