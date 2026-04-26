-- 0011_life_areas.sql — third entity tier for ongoing life-areas (health, family, etc.)

create table public.life_areas (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  slug        text,                            -- per agent-memory.md stable IDs (life-area.<slug>)
  name        text not null,
  description text,
  glyph       text,                            -- icon identifier, matches projects.glyph pattern
  palette     text,                            -- color identifier, matches projects.palette
  position    integer not null default 0,
  goal_id     uuid references public.goals(id) on delete set null,  -- soft link, nullable
  archived_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create unique index life_areas_user_slug_idx on public.life_areas(user_id, slug) where slug is not null;
create index life_areas_user_idx on public.life_areas(user_id, archived_at);

alter table public.life_areas enable row level security;
create policy "life_areas owner read" on public.life_areas for select using (user_id = auth.uid());
create policy "life_areas owner write" on public.life_areas for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Extend observations.subject_kind to include 'area' for promotion path (a)
alter table public.observations drop constraint if exists observations_subject_kind_check;
alter table public.observations
  add constraint observations_subject_kind_check
  check (subject_kind is null or subject_kind in ('user', 'project', 'goal', 'task', 'area'));

-- Add area_id to entries for write-time routing path (c) — soft FK, nullable
alter table public.entries add column if not exists area_id uuid references public.life_areas(id) on delete set null;
create index if not exists entries_user_area_idx on public.entries(user_id, area_id) where area_id is not null;

-- Add area_id to projects for project → area linkage (path b spin-off relationship)
alter table public.projects add column if not exists area_id uuid references public.life_areas(id) on delete set null;
create index if not exists projects_user_area_idx on public.projects(user_id, area_id) where area_id is not null;

-- updated_at trigger (match existing patterns in migrations)
create or replace function public.life_areas_updated_at() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end;
$$;
create trigger life_areas_updated_at_trg before update on public.life_areas
  for each row execute function public.life_areas_updated_at();
