# 0008 — Scheduled agent dispatch uses pg_cron + pg_net + Edge Function

**Status:** Accepted
**Date:** 2026-04-25
**Decider:** muxin

## Context

`0002_schedules.sql` set up a per-minute pg_cron tick that decides which scheduled skills should fire for which users (`should_fire`, `tick_skills`, `cron_log`). It stopped at logging the decision — it never invoked the agent. The MA prize narrative ("hand off meaningful, long-running tasks") is not realized until the user wakes up to a brief that fired without their tap.

We need a transport from "Postgres decided this user×skill should fire at 09:00 CT" to "the agent ran, output landed in `entries`, the user sees it when they open the app." Three plausible shapes:

1. **pg_cron + pg_net + Edge Function** — Postgres calls out to a Supabase Edge Function which assembles context and invokes ma-proxy.
2. **External scheduler** (Vercel cron, GitHub Actions cron, etc.) — Edge Function polls `cron_log` or computes `should_fire` itself, dispatches.
3. **Postgres calls Anthropic directly via pg_net** — skip the Edge Function layer.

## Decision

We use **pg_cron + pg_net + a `dispatch-skill` Supabase Edge Function**.

`tick_skills()` runs every minute, decides who should fire, inserts a `cron_log` row idempotently (unique on `user_id, skill, date_local`), then `net.http_post`s the Edge Function with `{cron_log_id, user_id, skill, fired_at}`. The Edge Function authenticates as service-role, assembles context server-side, calls ma-proxy, writes the `entries` row, and stamps `cron_log.dispatched / metadata`.

## Alternatives considered

**External scheduler** — adds a second platform (Vercel cron / GH Actions) for one job. Schedule logic ends up duplicated (Postgres knows about user timezones; the external scheduler doesn't). Rejected: we already have pg_cron running.

**Postgres calls Anthropic directly via pg_net** — would need the Anthropic SDK's session/SSE protocol implemented in plpgsql, which is impractical. ma-proxy is the canonical place for upstream Anthropic plumbing; bypassing it duplicates the SSE collector. Rejected: keep ma-proxy as the single chokepoint.

## Consequences

**Easier:**
- Single platform (Supabase) for scheduling + execution.
- Edge Function reuses ma-proxy; no parallel upstream-Anthropic plumbing.
- Idempotency naturally lives at the cron_log row (unique constraint), and the Edge Function is one-shot per cron_log_id.

**Harder:**
- Two manual-config-only steps land alongside this work:
  - `pg_net` extension must be enabled in the Supabase project (Studio → Database → Extensions).
  - The dispatch URL + service-role auth header must be set as Postgres database settings (`ALTER DATABASE ... SET app.settings.dispatch_skill_url = ...`). `supabase secrets set` does NOT expose values to in-database functions — it only sets Edge Function env vars. This is a gotcha worth flagging.
- pg_net is async and best-effort. We don't get a sync return; the Edge Function is responsible for the durable cron_log update. If the Edge Function is unreachable, the cron_log row stays at `phase=dispatched` — a follow-up tick won't retry the same `(user_id, skill, date_local)` because of the unique constraint.

**Locked-in:**
- Once a user has cron_log rows, the unique key on `(user_id, skill, date_local)` is permanent. Schema changes that re-key idempotency need a migration plan.
- `entries.source = 'agent-scheduled'` is the discriminator for scheduled vs. user-clicked agent fires. Adding source values is a CHECK-constraint replacement (see migration 0007).

## Manual follow-ups (one-time, post-merge)

> **Note:** Steps 4–5 below were the original 0007 instructions. They fail on Supabase hosted Postgres — the `postgres` role cannot register custom GUCs. Migration 0009 replaces them with Vault. See § Followup: Vault, not GUC below.

```
1. supabase db push                                    # apply 0007 + 0009
2. Studio → Database → Extensions → enable pg_net
3. supabase functions deploy dispatch-skill
4. ~~ALTER DATABASE postgres SET app.settings.dispatch_skill_url = '...'~~   # BLOCKED — see 0009
5. ~~ALTER DATABASE postgres SET app.settings.dispatch_skill_auth = '...'~~  # BLOCKED — see 0009
```

After applying 0009, run these in Supabase SQL Editor instead of the `ALTER DATABASE` commands:

```sql
select vault.create_secret('https://cjlktjrossrzmswrayfz.supabase.co/functions/v1/dispatch-skill', 'dispatch_skill_url');
select vault.create_secret('Bearer <service-role-key-from-supabase-dashboard>', 'dispatch_skill_auth');
```

After the vault secrets are set, the next minute tick that hits a user×skill in their local time will fire the agent.

## Followup: Vault, not GUC (2026-04-26)

The `ALTER DATABASE postgres SET app.settings.*` commands from this ADR's original manual follow-ups fail on Supabase hosted Postgres with:

```
permission denied to set parameter "app.settings.dispatch_skill_url"
```

Root cause: Supabase's `postgres` role is not a true superuser and cannot register custom GUC namespaces. Migration **0009** (`0009_dispatch_via_vault.sql`) supersedes 0007's GUC approach by switching `tick_skills()` to read `dispatch_skill_url` and `dispatch_skill_auth` from `vault.decrypted_secrets`, which is accessible to the `postgres` role.

The architecture decision (pg_cron + pg_net + Edge Function) is unchanged. Only the secret delivery mechanism changes: Supabase Vault instead of database-level GUCs.
