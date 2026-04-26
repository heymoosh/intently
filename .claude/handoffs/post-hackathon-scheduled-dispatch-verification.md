---
status: in-progress
opened: 2026-04-26
session: chat/0425-210554
---

# Post-hackathon scheduled-dispatch verification

## Goal

Verify scheduled-dispatch infrastructure works end-to-end in production (pg_cron → tick_skills → vault → pg_net → dispatch-skill Edge Function → ma-proxy → MA agent → entries row). Ship 10 PRs of fixes/builds completed; verification path remaining.

## Shipped this morning (PRs #175–#186 except #177, #184)

- #175: graph schema + slug-based stable IDs + ADR 0010
- #176: Supabase Vault for dispatch URL/auth
- #178: setup expansion (4-phase intake)
- #179: chat as top-level Managed Agent (routing entrypoint)
- #180: scheduled-dispatch test harness + runbook
- #181: full-page journal editor
- #182: noticing-layer V1 + 0009 migration collision fix
- #183: typecheck fix (excluded scripts/ from app tsconfig)
- #185: replaced 7 hardcoded Sam fixtures with live data
- #186: MA memory enable across user-facing skills (re-land of #184 which wedged)

## Manual followups status

**CONFIRMED COMPLETE:**

- `supabase db push` — applied 0001–0010 migrations (after fixing migration version collision: relabeled vault row from 0009→0010 in `supabase_migrations.schema_migrations` so 0009_graph_schema could land)
- `vault.create_secret` for `dispatch_skill_url` + `dispatch_skill_auth`

**PENDING (awaiting user action OR autonomous via MCPs):**

- `supabase functions deploy dispatch-skill`
- `npx tsx scripts/provision-ma-agents.ts --all --update-existing --write-secrets --env-file ../.env` (must run from `app/` directory). Provisions all 8 MA agents: chat, daily-brief, daily-review, weekly-review, monthly-review, noticing, setup, update-tracker.
- `node scripts/test-scheduled-dispatch.ts <user-id>` — verifies all 4 time-bound skills (daily-brief, daily-review, weekly-review, monthly-review) + config-change pickup. Runbook: `docs/testing/scheduled-dispatch-runbook.md`. Find user-id via SQL in Supabase Studio (most-recent `last_sign_in_at` in `auth.users`, or whichever has the most rows in `public.goals`).

## MCP install plan

**To-install:**

- Supabase MCP (`@supabase/mcp-server-supabase`) — install with:
  ```
  claude mcp add supabase -- npx -y @supabase/mcp-server-supabase@latest --access-token=$SUPABASE_ACCESS_TOKEN --project-ref=cjlktjrossrzmswrayfz
  ```
  Token stored in `.env` and `.envrc` (gitignored). Read-write recommended (opt-in via `--read-only=false` if needed).
- Sentry MCP — pending observability wiring (sub-agent dispatch needed: browser SDK in `web/index.html` + Deno SDK in Edge Functions). Capture in inbox if not already.

**Already loaded:**

- `mcp__playwright__*` — browser automation, screenshots, console capture
- `mcp__vercel__*` — deployment status, runtime logs, build logs

## Open architectural items (low urgency, not blocking)

- "Intently as MCP server" — captured in `.claude/inbox/2026-04-26T1530-intently-as-mcp-server.md`. V2+ deferred.
- MA Memory full integration — V1 enabled in #186; needs smoke test once provisioning runs.
- Noticing-layer scheduled invocation (V1 is on-demand only) — V2.

## Resume instructions

For a fresh Claude Code session:

1. Read this handoff + check `git log origin/main -10` for the morning's commits.
2. Confirm with user which of the 3 pending steps (functions deploy / provision / test) are now complete.
3. If Supabase MCP is loaded (`mcp__supabase__*` tools available), run the test harness directly via MCP-driven SQL operations. Otherwise, run as bash commands.
4. After verification passes, dispatch Sentry observability sub-agent.
