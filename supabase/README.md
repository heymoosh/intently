# Supabase (Intently V1)

Database and (later) Edge Functions for Intently. State-of-truth is Markdown in `public.markdown_files`; structured tables exist for query-by-id without parsing markdown. See `docs/architecture/agent-memory.md` and ADR 0002.

## Layout

```
supabase/
  migrations/
    0001_initial_schema.sql   -- 6 tables + RLS + auth.users signup trigger
  README.md
```

Edge Functions (`read_calendar`, `read_emails`, `read_file`, `write_file`) and `pg_cron` schedules are separate TRACKER items — not in this scaffold.

## Prereqs

- Supabase CLI installed (`brew install supabase/tap/supabase`).
- A Supabase project created in the dashboard (free tier is fine for V1).
- The project ref (e.g. `abcdefghijk`) and database password on hand.

## First-time init

From the repo root:

```bash
supabase init                       # creates config.toml if absent
supabase link --project-ref <ref>   # prompts for DB password
supabase db push                    # applies migrations/ in order
```

Alternative path if you'd rather run the SQL directly:

```bash
psql "$SUPABASE_DB_URL" -f supabase/migrations/0001_initial_schema.sql
```

`SUPABASE_DB_URL` is the connection string from dashboard → Settings → Database. Store it in Bitwarden Secrets Manager (hard rule from CLAUDE.md), not in `.env`.

## What 0001 creates

| Table | Purpose | Notes |
|---|---|---|
| `profiles` | Per-user app fields alongside `auth.users` | Auto-populated on signup via trigger. `timezone` is needed before `pg_cron` can schedule user-local times. `google_oauth_ref` holds a Bitwarden ref, never the token. |
| `life_ops_config` | One JSONB blob per user | Holds the full config from `docs/architecture/data-model.md` § `life-ops-config.md`. JSONB so individual fields can change without migrations. |
| `markdown_files` | State of truth | `(user_id, path)` unique — upsert by path is the write pattern. |
| `conversations` | Multi-turn skill history | `turns` is a JSONB array. If per-turn querying or embeddings become a need, migrate to a child `conversation_turns` table. |
| `projects` | Mirror of Ops Plan project rows | Lets `update-tracker` and the mobile app resolve projects without parsing Ops Plan.md. Authoritative copy is still the markdown. |
| `events` | Ops Plan "Time-Sensitive" items | V1 scope only. NOT the agent-run log from `docs/backlog/agent-memory-full-schema.md`. |

RLS is enabled on every table with a single `for all using (auth.uid() = user_id)` policy per table (owner-only). Multi-user isolation is deferred per CLAUDE.md; the policies are in place now so flipping on multi-user later is a test pass, not a schema change.

## Known gaps to resolve post-Thursday (2026-04-23 Michael Cohen session)

The schema is intentionally minimal so learnings from that session land as ALTERs rather than rewrites. Likely touch-points:

- **`conversations` ↔ agent runs.** If managed-agent runs expose an ID we want to pin turns to, add `agent_run_id text` (nullable) to `conversations`.
- **Secrets pattern.** `vault_ids` vs Bitwarden — if managed agents require session credentials via a different path, `profiles.google_oauth_ref` may move or split.
- **`pg_cron` scheduling.** Once the exact pattern is confirmed, schedule rows get added in `0002_pg_cron_schedules.sql` (references `profiles.timezone` to convert user-local times to UTC).

## Seeding

Demo seed data (TRACKER item 7) is not in this migration. It will land as a separate `seed.sql` or a scripted loader so production doesn't get accidentally seeded.

## Rollback

Supabase migrations are forward-only in this project. To drop the V1 schema entirely:

```sql
drop trigger if exists on_auth_user_created on auth.users;
drop table if exists public.events, public.projects, public.conversations,
                     public.markdown_files, public.life_ops_config, public.profiles cascade;
drop function if exists public.handle_new_auth_user(), public.set_updated_at();
```

Only run that on a dev project. Production rollback during the hackathon is "restore from Supabase's PITR backup," not a drop.
