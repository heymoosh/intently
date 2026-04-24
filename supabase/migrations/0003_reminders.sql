-- 0003_reminders.sql — user-captured reminders (voice → structured row).
--
-- Flow: the hero button on the mobile/web UI captures a voice transcript
-- like "remind me to schedule the dentist on Tuesday". An Edge Function
-- (supabase/functions/reminders) classifies the transcript into
-- (text, remind_on) via Anthropic Haiku and inserts a row here. The
-- daily-brief input assembly reads pending rows where remind_on <= today
-- and surfaces them, flipping status 'pending' → 'surfaced'.
--
-- Why Supabase, not the MA memory tool: committed dates are load-bearing
-- for "what should surface this morning" — a squishy memory blob is the
-- wrong shape. Explicit typed columns + an index on (status, remind_on)
-- give a cheap, exact due-date query.
--
-- Single-user V1 (Muxin dogfoods). RLS policies mirror 0001 so multi-user
-- is a future flip, not a rewrite.

set search_path = public;

-- reminders -------------------------------------------------------------------

create table public.reminders (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  text          text not null,
  remind_on     date not null,
  status        text not null default 'pending'
                  check (status in ('pending', 'surfaced', 'done', 'dismissed')),
  created_at    timestamptz not null default now(),
  surfaced_at   timestamptz
);

-- "due-this-week" and "what should surface today" queries both filter by
-- status first (usually 'pending') then by remind_on. Composite index on
-- (status, remind_on) covers both without needing a second index.
create index reminders_status_remind_on_idx
  on public.reminders (status, remind_on);

-- Per-user listing (for the upcoming reminders screen, post-hackathon).
create index reminders_user_remind_on_idx
  on public.reminders (user_id, remind_on);

-- Row-level security ----------------------------------------------------------

alter table public.reminders enable row level security;

create policy reminders_owner on public.reminders
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
