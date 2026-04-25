-- 0006_calendar_email.sql — connector ingestion shapes (calendar + email).
--
-- Purpose: stub the data shapes the daily-brief context assembler will read
-- BEFORE real OAuth lands. So the brief can include calendar/email context
-- via Sam's seed data now, and real connectors just write into the same
-- tables later.
--
-- Both tables are owner-only RLS, mirror existing pattern from 0001/0003/0004/0005.
-- Single-user V1 (Muxin / Sam dogfood); multi-user RLS already correct as-is.

set search_path = public;

-- 1. calendar_events ---------------------------------------------------------
-- One row per event the brief should know about. `source` discriminates:
--   'seed'   — Sam-seed dummy events (current path)
--   'gcal'   — Google Calendar via OAuth (future)
--   'manual' — user-entered (future)
-- The assembler reads today's events; older events stay around for week/month
-- views.

create table public.calendar_events (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  starts_at       timestamptz not null,
  ends_at         timestamptz,
  title           text not null,
  location        text,
  attendees       jsonb not null default '[]'::jsonb,
  source          text not null default 'manual'
                    check (source in ('seed', 'gcal', 'outlook', 'manual')),
  external_id     text,
  created_at      timestamptz not null default now()
);

create index calendar_events_user_starts_idx
  on public.calendar_events (user_id, starts_at desc);

-- 2. email_flags -------------------------------------------------------------
-- Sparse table — only emails the brief should surface (urgent, awaiting reply,
-- deadline-attached). Most inbox content stays out. `is_urgent` is the
-- assembler's filter. `source` discriminates connector vs seed.

create table public.email_flags (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  sender          text not null,
  subject         text not null,
  received_at     timestamptz not null default now(),
  is_urgent       boolean not null default false,
  awaiting_reply  boolean not null default false,
  source          text not null default 'manual'
                    check (source in ('seed', 'gmail', 'outlook', 'manual')),
  external_id     text,
  created_at      timestamptz not null default now()
);

create index email_flags_user_urgent_idx
  on public.email_flags (user_id, is_urgent, received_at desc);

-- Row-level security ---------------------------------------------------------

alter table public.calendar_events enable row level security;
alter table public.email_flags     enable row level security;

create policy calendar_events_owner on public.calendar_events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy email_flags_owner on public.email_flags
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
