-- 0004_entities.sql — DB-as-source-of-truth entity tables.
--
-- Architecture shift: prior migrations modelled markdown_files as the state of
-- truth and projects/events as derived mirrors. The new model treats typed DB
-- rows as authoritative; markdown is now a render-on-demand view (see
-- app/lib/render/). Goal / Project / Entry are the three core entities.
--
-- Project todos live as a JSONB column on projects (matches HANDOFF §2.2
-- Project { todos [] }). The existing public.reminders table is a separate
-- pathway (AI capture w/ time-sensitivity) and is intentionally NOT touched.
--
-- Single-user V1 (Muxin dogfoods); RLS owner-only mirrors 0001.

set search_path = public;

-- 0. Replace the legacy projects mirror -------------------------------------
-- 0001 created public.projects as a *mirror* of Ops Plan rows derived from
-- markdown. No app code references it (verified pre-write). The new shape
-- below is conceptually different (authoritative entity, not a cache), so
-- the cleanest path is drop-and-replace. CASCADE covers the old table's
-- index (projects_user_tier_idx) and policy (projects_owner).

drop table if exists public.projects cascade;

-- 1. goals --------------------------------------------------------------------
-- Long-term visions. UI shows 3 active per user (positions 0/1/2). Archived
-- goals stay around for history; archived_at is null = active.

create table public.goals (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  title           text not null,
  monthly_slice   text,
  glyph           text,
  palette         text[],
  position        int,
  created_at      timestamptz not null default now(),
  archived_at     timestamptz
);

create index goals_user_archived_idx
  on public.goals (user_id, archived_at);

create index goals_user_position_idx
  on public.goals (user_id, position);

-- 2. projects (new shape) -----------------------------------------------------
-- Mid-scale work bodies. goal_id null = Admin or freestanding. Exactly one
-- is_admin=true per user (the catch-all bucket for un-rolled-up todos).

create table public.projects (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  goal_id         uuid references public.goals(id) on delete set null,
  title           text not null,
  body_markdown   text not null default '',
  todos           jsonb not null default '[]'::jsonb,
  status          text not null default 'active'
                    check (status in ('active', 'parked', 'done')),
  is_admin        boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index projects_user_status_idx
  on public.projects (user_id, status);

create index projects_user_goal_idx
  on public.projects (user_id, goal_id);

create index projects_user_admin_idx
  on public.projects (user_id, is_admin) where is_admin = true;

-- Only one admin project per user.
create unique index projects_user_admin_unique
  on public.projects (user_id) where is_admin = true;

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

-- 3. entries ------------------------------------------------------------------
-- Every typed user utterance. kind partitions read paths (daily-brief reads
-- 'brief'/'review'/'journal'); links is the soft graph back to projects/goals
-- and to a parent entry if one exists.

create table public.entries (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  at              timestamptz not null default now(),
  kind            text not null
                    check (kind in ('brief', 'journal', 'chat', 'review')),
  title           text,
  body_markdown   text not null,
  glyph           text,
  mood            text
                    check (mood in ('dawn','morning','midday','dusk','night','rain','forest')),
  source          text not null
                    check (source in ('voice', 'text', 'agent')),
  links           jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now()
);

create index entries_user_at_idx
  on public.entries (user_id, at desc);

create index entries_user_kind_at_idx
  on public.entries (user_id, kind, at desc);

-- Row-level security ----------------------------------------------------------

alter table public.goals    enable row level security;
alter table public.projects enable row level security;
alter table public.entries  enable row level security;

create policy goals_owner on public.goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy projects_owner on public.projects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy entries_owner on public.entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
