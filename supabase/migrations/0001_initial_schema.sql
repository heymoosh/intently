-- Intently V1 initial schema.
-- Single-user for V1 (Muxin dogfoods); RLS everywhere so multi-user is a future flip, not a rewrite.
-- Markdown files in public.markdown_files are the state of truth (see docs/architecture/agent-memory.md).
-- Structured tables (projects, events, life_ops_config) are queryable mirrors/caches, not the source of truth.

set search_path = public;

-- Extensions ------------------------------------------------------------------

-- gen_random_uuid() is in pg_catalog on PG13+; pgcrypto included for belt-and-braces
-- if this file is ever replayed on a stripped image.
create extension if not exists pgcrypto;

-- Helper: updated_at trigger ---------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 1. profiles -----------------------------------------------------------------
-- App-specific fields alongside auth.users. One row per auth user.
-- timezone is required before pg_cron can schedule user-local daily_brief_time etc.

create table public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  display_name    text,
  timezone        text,                  -- IANA name, e.g. 'America/New_York'
  google_oauth_ref text,                 -- Bitwarden Secrets Manager ref; never the token itself
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create profile row on signup.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- 2. life_ops_config ----------------------------------------------------------
-- Single row per user. Stored as JSONB (not a column per field) so schedule,
-- integrations, preferences, suggested_tags, projects etc. from data-model.md
-- can all land here without schema churn each time we tune a field.

create table public.life_ops_config (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  config      jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

create trigger life_ops_config_set_updated_at
  before update on public.life_ops_config
  for each row execute function public.set_updated_at();

-- 3. markdown_files -----------------------------------------------------------
-- State of truth. (user_id, path) is unique so upsert-by-path is the write pattern.

create table public.markdown_files (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  path        text not null,             -- e.g. 'Goals.md', 'Projects/Intently/Tracker.md'
  content     text not null default '',
  updated_at  timestamptz not null default now(),
  unique (user_id, path)
);

create index markdown_files_user_updated_idx
  on public.markdown_files (user_id, updated_at desc);

create trigger markdown_files_set_updated_at
  before update on public.markdown_files
  for each row execute function public.set_updated_at();

-- 4. conversations ------------------------------------------------------------
-- Chat history for multi-turn skills (daily-review step 2 in particular).
-- turns is a JSONB array: [{role, content, ts, ...}]. For V1 that is enough.
-- If we ever need per-turn querying or vector search, we migrate to a child table.

create table public.conversations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  skill       text not null,             -- 'daily-brief' | 'daily-review' | 'weekly-review' | etc.
  started_at  timestamptz not null default now(),
  ended_at    timestamptz,
  turns       jsonb not null default '[]'::jsonb,
  metadata    jsonb not null default '{}'::jsonb
);

create index conversations_user_started_idx
  on public.conversations (user_id, started_at desc);

-- 5. projects -----------------------------------------------------------------
-- Mirror of Ops Plan project rows. The authoritative copy lives in the markdown
-- (Ops Plan.md + Projects/[Name]/Tracker.md). This table exists so update-tracker
-- can resolve "I worked on X" → Tracker.md path without parsing markdown every call,
-- and so the mobile app can render a project list without loading the whole Ops Plan.

create table public.projects (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  name            text not null,
  slug            text not null,         -- matches project.<slug> stable-id (agent-memory.md)
  tracker_path    text,                  -- e.g. 'Projects/Intently/Tracker.md'
  strategy_path   text,
  status          text,                  -- '🔴' | '🟡' | '🟢' | '⚪'
  priority_tier   text,                  -- 'P1' | 'P2' | 'P3'
  last_updated    timestamptz,
  metadata        jsonb not null default '{}'::jsonb,
  unique (user_id, slug)
);

create index projects_user_tier_idx
  on public.projects (user_id, priority_tier);

-- 6. events -------------------------------------------------------------------
-- V1 reading: the Ops Plan "Time-Sensitive" section mirror — the items daily-brief
-- surfaces when they fall within 7 days. Minimal shape; widen if Thursday's
-- managed-agents session or calendar caching needs force it.
-- NOT the agent-run log from docs/backlog/agent-memory-full-schema.md (that's V2+).

create table public.events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  due_date    date,
  source      text,                      -- 'manual' | 'calendar' | 'inferred'
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index events_user_due_idx
  on public.events (user_id, due_date);

-- Row-level security ----------------------------------------------------------
-- Enable on every user-scoped table, then one owner-only policy per table using
-- `for all` so select/insert/update/delete share a single predicate.

alter table public.profiles         enable row level security;
alter table public.life_ops_config  enable row level security;
alter table public.markdown_files   enable row level security;
alter table public.conversations    enable row level security;
alter table public.projects         enable row level security;
alter table public.events           enable row level security;

create policy profiles_owner on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy life_ops_config_owner on public.life_ops_config
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy markdown_files_owner on public.markdown_files
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy conversations_owner on public.conversations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy projects_owner on public.projects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy events_owner on public.events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
