-- 0007_dispatch_via_pg_net.sql — wire pg_cron tick to actually invoke agents.
--
-- SUPERSEDED 2026-04-26: the ALTER DATABASE manual followups below DO NOT
-- WORK on Supabase hosted Postgres (postgres role is not a true superuser
-- for custom GUCs). Migration 0009 switches tick_skills to read from
-- Supabase Vault. Apply 0009 + run vault.create_secret per its header.
--
-- 0002_schedules.sql scaffolded the dispatcher (cron_log + should_fire +
-- tick_skills) but stopped at a "would-have-fired" log row. This migration
-- closes the loop: tick_skills now POSTs to a Supabase Edge Function
-- (`dispatch-skill`) via pg_net for each fire decision, idempotently, with
-- the cron_log id so the function can mark the row dispatched/failed.
--
-- Architecture (per .claude/handoffs/scheduled-agent-dispatch.md):
--   pg_cron (every minute) → tick_skills() → for each (user × skill) hit:
--     1. INSERT cron_log ... ON CONFLICT (user_id, skill, date_local) DO NOTHING
--        — single source of "this user×skill already fired today" truth.
--     2. If new row inserted: net.http_post → /functions/v1/dispatch-skill
--        with {cron_log_id, user_id, skill, fired_at}.
--     3. The Edge Function does context assembly + ma-proxy call, writes
--        the entries row (kind='brief'|'review', source='agent-scheduled'),
--        and updates cron_log.dispatched / cron_log.metadata.error.
--
-- Why pg_net + Edge Function (not external scheduler / not direct upstream
-- call from Postgres): Supabase-native, single secret store, reuses ma-proxy.
--
-- Manual follow-ups (PR description spells these out):
--   • supabase db push                           (apply this migration)
--   • Enable pg_net in Studio → Database → Extensions
--   • supabase functions deploy dispatch-skill
--   • ALTER DATABASE postgres SET app.settings.dispatch_skill_url = '...'
--   • ALTER DATABASE postgres SET app.settings.dispatch_skill_auth = 'Bearer <service-role>'
-- (`supabase secrets set` only sets Edge-Function env vars; it does NOT
--  expose values to in-database functions, which is what tick_skills runs as.)

set search_path = public;

-- pg_net ----------------------------------------------------------------------
-- Available on Supabase paid tier and recent free tier. If `create extension`
-- fails, enable via Studio → Database → Extensions first, then re-apply.
create extension if not exists pg_net;

-- entries.source — add 'agent-scheduled' -------------------------------------
-- 0004_entities.sql constrains source to ('voice','text','agent'). Scheduled
-- fires need a fourth value so the UI / observability can distinguish them
-- from user-clicked fires (kind='agent') and manual journal entries.
--
-- Postgres CHECK constraints aren't ALTER-able in place; drop + add. The drop
-- is safe because no rows currently violate the new constraint (it's a strict
-- superset of the old one).

alter table public.entries drop constraint if exists entries_source_check;
alter table public.entries
  add constraint entries_source_check
  check (source in ('voice', 'text', 'agent', 'agent-scheduled'));

-- cron_log idempotency -------------------------------------------------------
-- Add `date_local date` so we have a stable per-day key for unique-on-conflict.
-- The column is computed in tick_skills using the user's profiles.timezone
-- (same logic should_fire uses for the HH:MM match), then carried in the row.
-- A unique index on (user_id, skill, date_local) gives us one fire per user
-- per skill per local day — even if cron retries within the same minute.

alter table public.cron_log add column if not exists date_local date;

-- Backfill existing rows with the UTC date of fired_at. Pre-existing rows are
-- v1-scaffold rows; their exact date_local doesn't matter for going-forward
-- idempotency, just that the column is non-null where the unique index applies.
update public.cron_log
   set date_local = (fired_at at time zone 'UTC')::date
 where date_local is null;

-- Now lock the column non-null and create the unique index.
alter table public.cron_log alter column date_local set not null;

create unique index if not exists cron_log_user_skill_date_local_uniq
  on public.cron_log (user_id, skill, date_local);

-- should_fire — extend with monthly-review -----------------------------------
-- 0002 covered daily-brief, daily-review, weekly-review. The handoff scopes
-- four skills; this fills in monthly. Config keys read from life_ops_config:
--   monthly_review_time      — 'HH:MM' user-local
--   monthly_review_day       — '1'..'31', defaults to '1' (1st of month).
-- User-facing config UI for these is a separate handoff item — for now
-- defaulting an absent monthly_review_day to '1' lets the path be testable
-- by setting just the time.

create or replace function public.should_fire(
  p_user_id uuid,
  p_skill   text,
  p_now     timestamptz default now()
) returns boolean
language plpgsql
stable
as $$
declare
  v_tz         text;
  v_config     jsonb;
  v_local      timestamp;
  v_local_hm   text;
  v_local_dow  int;
  v_local_dom  int;
  v_cfg_time   text;
  v_cfg_day    text;
begin
  select p.timezone, c.config
    into v_tz, v_config
    from public.profiles p
    left join public.life_ops_config c on c.user_id = p.id
   where p.id = p_user_id;

  if v_tz is null or v_config is null then
    return false;
  end if;

  v_local := p_now at time zone v_tz;
  v_local_hm := to_char(v_local, 'HH24:MI');
  v_local_dow := extract(isodow from v_local)::int;
  v_local_dom := extract(day from v_local)::int;

  case p_skill
    when 'daily-brief' then
      v_cfg_time := v_config ->> 'daily_brief_time';
      return v_cfg_time is not null and v_cfg_time = v_local_hm;

    when 'daily-review' then
      v_cfg_time := v_config ->> 'daily_review_time';
      return v_cfg_time is not null and v_cfg_time = v_local_hm;

    when 'weekly-review' then
      v_cfg_time := v_config ->> 'weekly_review_time';
      v_cfg_day  := v_config ->> 'weekly_review_day';
      return v_cfg_time is not null
         and v_cfg_day is not null
         and v_cfg_time = v_local_hm
         and public.dow_match(v_cfg_day, v_local_dow);

    when 'monthly-review' then
      v_cfg_time := v_config ->> 'monthly_review_time';
      v_cfg_day  := coalesce(v_config ->> 'monthly_review_day', '1');
      return v_cfg_time is not null
         and v_cfg_time = v_local_hm
         and v_cfg_day ~ '^[0-9]+$'
         and v_cfg_day::int = v_local_dom;

    else
      return false;
  end case;
end;
$$;

-- tick_skills — actually invoke ----------------------------------------------
-- Replaces the v1-scaffold-only behavior. For every (user × skill) hit:
--   1. INSERT cron_log row (with date_local) using ON CONFLICT DO NOTHING on
--      the idempotency key. If a row already exists (cron retried within the
--      same local-day for the same user×skill), DO NOTHING and skip.
--   2. If we got a fresh id back: read app.settings.dispatch_skill_url and
--      dispatch_skill_auth, then net.http_post with the cron_log_id payload.
--   3. If the URL setting is missing, log to cron_log.metadata and skip the
--      http call — the migration applies cleanly even before the operator
--      runs the ALTER DATABASE step.
--
-- 0002 declared tick_skills() with no args. We're switching to a defaulted
-- p_now so test-harnesses can time-travel; CREATE OR REPLACE can't change
-- the argument list, so DROP first. The pg_cron schedule still calls
-- `public.tick_skills();` (no args), which resolves via the default value.

drop function if exists public.tick_skills();
drop function if exists public.tick_skills(timestamptz);

create or replace function public.tick_skills(p_now timestamptz default now())
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id     uuid;
  v_skill       text;
  v_tz          text;
  v_local_date  date;
  v_log_id      bigint;
  v_url         text;
  v_auth        text;
  v_request_id  bigint;
begin
  -- App-settings reads are wrapped in the `, true` form so a missing setting
  -- returns NULL instead of raising. The dispatch path skips when URL is null.
  v_url  := nullif(current_setting('app.settings.dispatch_skill_url', true), '');
  v_auth := nullif(current_setting('app.settings.dispatch_skill_auth', true), '');

  for v_user_id, v_tz in
    select p.id, p.timezone
      from public.profiles p
     where p.timezone is not null
  loop
    v_local_date := (p_now at time zone v_tz)::date;

    foreach v_skill in array array['daily-brief', 'daily-review', 'weekly-review', 'monthly-review'] loop
      if not public.should_fire(v_user_id, v_skill, p_now) then
        continue;
      end if;

      -- Idempotency gate: insert-or-skip on the unique key. If another tick
      -- (or a retry within the same minute) already inserted this row, we
      -- won't get an id back and we skip the dispatch.
      insert into public.cron_log (user_id, skill, fired_at, date_local, dispatched, metadata)
      values (
        v_user_id,
        v_skill,
        p_now,
        v_local_date,
        false,
        jsonb_build_object('phase', 'queued')
      )
      on conflict (user_id, skill, date_local) do nothing
      returning id into v_log_id;

      if v_log_id is null then
        continue;
      end if;

      -- Operator hasn't set the URL yet — record so we know why nothing fired.
      if v_url is null then
        update public.cron_log
           set metadata = metadata
                 || jsonb_build_object(
                      'phase', 'skipped',
                      'reason', 'app.settings.dispatch_skill_url not set'
                    )
         where id = v_log_id;
        continue;
      end if;

      -- Fire the HTTP call. pg_net is async — the request id lands in
      -- net._http_response when the response comes back. The Edge Function
      -- is responsible for the durable cron_log update; we record the
      -- pg_net request id here for debugging.
      begin
        select net.http_post(
          url     := v_url,
          headers := jsonb_build_object(
            'Content-Type',  'application/json',
            'Authorization', coalesce(v_auth, '')
          ),
          body    := jsonb_build_object(
            'cron_log_id', v_log_id,
            'user_id',     v_user_id,
            'skill',       v_skill,
            'fired_at',    p_now
          )
        )
        into v_request_id;

        update public.cron_log
           set metadata = metadata
                 || jsonb_build_object(
                      'phase', 'dispatched',
                      'pg_net_request_id', v_request_id
                    )
         where id = v_log_id;
      exception when others then
        update public.cron_log
           set metadata = metadata
                 || jsonb_build_object(
                      'phase', 'http_error',
                      'error', SQLERRM
                    )
         where id = v_log_id;
      end;
    end loop;
  end loop;
end;
$$;

-- The cron schedule from 0002 still calls `public.tick_skills()` (no args).
-- The new tick_skills has a default-arg now() so that signature still works.
