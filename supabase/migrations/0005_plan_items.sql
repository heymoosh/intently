-- 0005_plan_items.sql — today-shaped plan rows surfaced on the Present screen.
--
-- Why a dedicated table (not a JSONB on entries): the plan view filters by
-- (user_id, date) hundreds of times more than it filters anything else, and
-- the band/tier facets are load-bearing for the morning brief and the evening
-- review. Typed columns + a (user_id, date desc) index gives the cheap, exact
-- query we need. JSONB-on-entries would force a scan-and-parse on every read.
--
-- band: which third of the day this item lives in. Constrained to the three
--   prototype-canonical labels so the UI can group without normalisation.
-- tier: P1/P2/P3 priority, optional. The brief assigns one when it generates
--   the plan; user-added items can leave it null.
-- duration_min: optional pacing hint. Not enforced; the agent uses it to size
--   the day, the user can ignore it.
-- position: stable in-band ordering. The brief writes 0-indexed positions when
--   it generates the plan; manual adds append (max + 1).
--
-- Single-user V1 (Muxin dogfoods); RLS owner-only mirrors 0001/0003/0004.

set search_path = public;

-- plan_items ------------------------------------------------------------------

create table public.plan_items (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  date            date not null,
  band            text not null
                    check (band in ('morning', 'afternoon', 'evening')),
  tier            text
                    check (tier in ('P1', 'P2', 'P3')),
  text            text not null,
  duration_min    int,
  done            boolean not null default false,
  position        int,
  created_at      timestamptz not null default now()
);

-- "today's plan" and "this week's plan" both filter by (user_id, date). desc
-- on date keeps the latest day at the front of paginated reads.
create index plan_items_user_date_idx
  on public.plan_items (user_id, date desc);

-- Row-level security ----------------------------------------------------------

alter table public.plan_items enable row level security;

create policy plan_items_owner on public.plan_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
