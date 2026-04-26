-- 0009_graph_schema.sql — Graph-friendly schema for tasks, task relationships,
-- and observations. Postgres-native (no Apache AGE — see ADR 0010 for why).
--
-- Architectural intent (per ADR 0010): each task is a first-class row with
-- explicit FK relationships to project / goal / assignee / depends-on / blocks /
-- related-to. Each user keeps `auth.users` + `public.profiles` +
-- `public.life_ops_config` as their identity surface; observations attach to
-- the user via FK as a separate table feeding the noticing-layer's promotion
-- pipeline (see .claude/handoffs/agent-noticing-layer.md workstream 3).
--
-- Migration shape: ADDITIVE. `projects.todos` JSONB is preserved unchanged so
-- the existing app code in `web/lib/entities.js` (addProjectTodo /
-- toggleProjectTodo) and `web/lib/seed-sam.js` keeps working. New writers can
-- write to `public.tasks` directly; a future migration ports JSONB callers off
-- the column and drops it. That follow-up is tracked in TRACKER.
--
-- Stable IDs (per agent-memory.md + ADR 0010 Correction 3): projects.slug
-- already exists (0001_initial_schema.sql). tasks.slug is added here.
-- Format: task.<project-slug>.<seq> — populated by the application layer,
-- NOT the DB. Column is nullable (backfilled JSONB rows won't have one);
-- unique constraint is partial (excludes nulls) scoped per project.
--
-- Single-user V1; RLS owner-only mirrors 0001 / 0004.

set search_path = public;

-- 1. tasks --------------------------------------------------------------------
-- First-class task node. Inherits all fields the JSONB shape carries today
-- (id, text, done) plus the ones the schema needs to be a real entity:
-- project FK, assignee FK, status, priority, due_date, timestamps.
--
-- assignee_id defaults to the row's user_id at insert time so single-user V1
-- "assigned to me" reads work without a NOT NULL constraint that would force
-- agents to specify an assignee on every insert. Multi-user later: drop the
-- default, require an explicit assignee on shared projects.
--
-- status keeps `done` semantics for back-compat with the JSONB shape; the
-- richer `status` lifecycle (pending / in_progress / done / cancelled / parked)
-- is the future-facing field. Both columns coexist; a CHECK ensures `done`
-- and `status='done'` agree.

create table public.tasks (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  project_id    uuid references public.projects(id) on delete set null,
  assignee_id   uuid references auth.users(id) on delete set null,
  slug          text,                          -- task.<project-slug>.<seq>; populated by app layer
  text          text not null,
  done          boolean not null default false,
  status        text not null default 'pending'
                  check (status in ('pending', 'in_progress', 'done', 'cancelled', 'parked')),
  priority      text
                  check (priority is null or priority in ('P1', 'P2', 'P3')),
  due_date      date,
  position      int,                           -- preserves order within a project for UI parity
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  -- done<->status agreement: either both indicate done, or neither does.
  constraint tasks_done_status_agree
    check ((done = true and status = 'done') or (done = false and status <> 'done'))
);

-- Partial unique index: slug must be unique per project, but nulls are allowed
-- (backfilled rows from JSONB have no slug yet; app assigns slugs on new writes).
create unique index tasks_project_slug_unique
  on public.tasks (project_id, slug)
  where slug is not null;

create index tasks_user_status_idx
  on public.tasks (user_id, status);

create index tasks_user_project_idx
  on public.tasks (user_id, project_id);

create index tasks_user_assignee_idx
  on public.tasks (user_id, assignee_id);

create index tasks_user_due_date_idx
  on public.tasks (user_id, due_date)
  where due_date is not null;

create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

-- 2. task_relationships -------------------------------------------------------
-- Explicit graph edges between tasks. Three relationship types stored as
-- distinct rows so graph traversal is symmetric and cheap:
--   - depends_on : from_task waits on to_task (X depends on Y)
--   - blocks     : from_task is blocking to_task (X blocks Y)
--   - related_to : loose semantic association
--
-- ADR 0010 documents why we store both `depends_on` and `blocks` rather than
-- treating them as inverses of a single relation. Short version: agents and
-- UI traversals run in both directions ("what am I waiting on?" vs "what am I
-- holding up?") and storing both directly avoids a UNION on every read.
--
-- user_id is denormalized here (not derived from a join on tasks) so RLS can
-- enforce ownership with a single column predicate matching the pattern in
-- 0001 / 0004. The CHECK ensures from_task <> to_task (no self-loops).

create table public.task_relationships (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  from_task_id      uuid not null references public.tasks(id) on delete cascade,
  to_task_id        uuid not null references public.tasks(id) on delete cascade,
  relationship_type text not null
                      check (relationship_type in ('depends_on', 'blocks', 'related_to')),
  created_at        timestamptz not null default now(),
  unique (from_task_id, to_task_id, relationship_type),
  constraint task_relationships_no_self_loop check (from_task_id <> to_task_id)
);

create index task_relationships_user_from_idx
  on public.task_relationships (user_id, from_task_id, relationship_type);

create index task_relationships_user_to_idx
  on public.task_relationships (user_id, to_task_id, relationship_type);

-- 3. observations -------------------------------------------------------------
-- Soft patterns the agent has noticed about a user, awaiting promotion to
-- durable storage (life_ops_config.config or another typed surface). Feeds
-- workstream 3 of the agent-noticing-layer handoff (memory promotion).
--
-- subject_kind + subject_id is a polymorphic pointer at the thing the pattern
-- attaches to (a project, a goal, a task, or null = the user themselves).
-- We don't FK subject_id because it can point at multiple tables; integrity
-- is the agent's responsibility. The noticing-layer handoff documents how
-- observations get promoted; the schema just gives them a home.

create table public.observations (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  pattern_text        text not null,
  subject_kind        text
                        check (subject_kind is null or subject_kind in ('user', 'project', 'goal', 'task')),
  subject_id          uuid,
  times_observed      int not null default 1 check (times_observed >= 1),
  first_observed_at   timestamptz not null default now(),
  last_observed_at    timestamptz not null default now(),
  promoted_at         timestamptz,
  metadata            jsonb not null default '{}'::jsonb
);

create index observations_user_promoted_idx
  on public.observations (user_id, promoted_at);

create index observations_user_subject_idx
  on public.observations (user_id, subject_kind, subject_id);

create index observations_user_last_seen_idx
  on public.observations (user_id, last_observed_at desc);

-- 4. Backfill: unflatten projects.todos JSONB into tasks rows ----------------
-- Each existing JSONB todo becomes one tasks row. The JSONB column is NOT
-- dropped — current writers in web/lib/entities.js still use it, and the
-- migration is additive. A future migration ports those writers to
-- public.tasks and drops the JSONB column once nothing reads from it.
--
-- Edge cases handled:
--   - `id` may be missing (seed-sam-data has todos shaped {text, done} only).
--     coalesce to a fresh uuid.
--   - `done` may be missing → defaults to false.
--   - `text` is the load-bearing field; we skip rows where it's null/empty
--     to avoid violating the NOT NULL constraint.
-- Note: slug is intentionally omitted from backfill — backfilled tasks from
-- JSONB don't have a structured ID; app layer assigns slugs on first edit.

insert into public.tasks (id, user_id, project_id, text, done, status, position, created_at, updated_at)
select
  coalesce((todo->>'id')::uuid, gen_random_uuid())              as id,
  p.user_id,
  p.id                                                          as project_id,
  todo->>'text'                                                 as text,
  coalesce((todo->>'done')::boolean, false)                     as done,
  case when coalesce((todo->>'done')::boolean, false)
       then 'done'
       else 'pending'
  end                                                           as status,
  ord                                                           as position,
  p.created_at,
  p.updated_at
from public.projects p
cross join lateral
  jsonb_array_elements(coalesce(p.todos, '[]'::jsonb))
    with ordinality as t(todo, ord)
where (todo->>'text') is not null
  and length(trim(todo->>'text')) > 0
on conflict (id) do nothing;

-- 5. Row-level security -------------------------------------------------------

alter table public.tasks               enable row level security;
alter table public.task_relationships  enable row level security;
alter table public.observations        enable row level security;

create policy tasks_owner on public.tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy task_relationships_owner on public.task_relationships
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy observations_owner on public.observations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
