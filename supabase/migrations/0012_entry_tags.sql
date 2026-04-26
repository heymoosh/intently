-- 0012_entry_tags.sql — structured tag column on entries for capture-time signal tagging
--
-- Adds:
--   entries.tags text[]         — array of signal tags (e.g. ['ant', 'brag'])
--   entries.tag_confidence jsonb — per-tag classifier confidence scores
--
-- Also scaffolds user_signals table for V1.1 user-custom signal tags.
-- Full UX for adding custom signals is V1.2; this migration creates the
-- schema only so the read interface can be wired immediately.
--
-- Signal taxonomy canonical source: docs/product/signals.md
-- V1 canonical tags: brag, grow, self, ant, ideas, gtj, bet

alter table public.entries
  add column if not exists tags text[] not null default '{}',
  add column if not exists tag_confidence jsonb not null default '{}'::jsonb;

-- GIN index for array containment queries: WHERE 'ant' = ANY(tags)
create index if not exists entries_tags_gin on public.entries using gin (tags);
-- B-tree index on user_id for user-scoped tag queries (planner combines with entries_tags_gin)
-- Note: composite GIN on (user_id, tags) is not valid — uuid has no GIN operator class.
create index if not exists entries_user_id_idx on public.entries (user_id);

-- V1.1 user_signals scaffold — schema only, full UX deferred to V1.2
-- TODO(V1.2): build the UX surface for adding/editing user custom signals
create table if not exists public.user_signals (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  tag         text not null,              -- the signal tag without the hash (e.g. 'maker')
  description text,                       -- what the agent should listen for
  framework   text,                       -- optional framework citation
  enabled     boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create unique index if not exists user_signals_user_tag_idx on public.user_signals(user_id, tag);

alter table public.user_signals enable row level security;
create policy "user_signals owner all" on public.user_signals for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
