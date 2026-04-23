-- 0002_schedules.sql — pg_cron-based skill dispatcher.
--
-- Schedules a minute-granularity tick that decides which scheduled skills
-- (daily-brief, daily-review, weekly-review) should fire for which users, based
-- on each user's life_ops_config.config JSONB and profiles.timezone.
--
-- V1 dispatches to public.cron_log only (no real agent invocation). The real
-- agent trigger lands once Supabase Edge Functions + Managed Agents SDK
-- invocation are scaffolded (TRACKER Next #3/#4, blocked on Google auth setup
-- + Thursday 2026-04-23 managed-agents session).
--
-- NOT YET APPLIED to the remote. Run `supabase db push` (manual; the overnight
-- build loop is forbidden from pushing to remote DB) after the session reviews
-- this migration.

set search_path = public;

-- Extension -------------------------------------------------------------------
-- pg_cron is available on Supabase paid tier and recent free tier. If
-- `create extension` fails in CI/db push, enable it via Database → Extensions
-- in the Supabase dashboard first, then re-run the migration.

create extension if not exists pg_cron;

-- cron_log --------------------------------------------------------------------
-- Every dispatcher tick that would fire a skill logs a row here. V1 keeps
-- `dispatched = false` since the real agent call is not wired yet. Morning
-- review can see fire decisions without having wired the agent path.

create table if not exists public.cron_log (
  id          bigserial primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  skill       text not null,
  fired_at    timestamptz not null default now(),
  dispatched  boolean not null default false,
  metadata    jsonb not null default '{}'::jsonb
);

create index if not exists cron_log_user_fired_idx
  on public.cron_log (user_id, fired_at desc);

alter table public.cron_log enable row level security;

create policy cron_log_owner on public.cron_log
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Day-of-week helper ----------------------------------------------------------
-- Accepts 'mon' | 'monday' | '1' etc. Returns true iff matches given ISO DoW
-- (Monday=1 … Sunday=7).

create or replace function public.dow_match(p_config text, p_isodow int)
returns boolean
language plpgsql
immutable
as $$
declare
  v_norm text := lower(trim(p_config));
begin
  if v_norm in ('1','mon','monday')    then return p_isodow = 1; end if;
  if v_norm in ('2','tue','tuesday')   then return p_isodow = 2; end if;
  if v_norm in ('3','wed','wednesday') then return p_isodow = 3; end if;
  if v_norm in ('4','thu','thursday')  then return p_isodow = 4; end if;
  if v_norm in ('5','fri','friday')    then return p_isodow = 5; end if;
  if v_norm in ('6','sat','saturday')  then return p_isodow = 6; end if;
  if v_norm in ('7','sun','sunday')    then return p_isodow = 7; end if;
  return false;
end;
$$;

-- should_fire -----------------------------------------------------------------
-- Decision helper: at `p_now` (default now()), should `p_skill` fire for
-- `p_user_id`? Reads profile timezone + life_ops_config.config JSONB and
-- matches on user-local HH:MM (and weekday for weekly-review).

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

    else
      return false;
  end case;
end;
$$;

-- tick_skills -----------------------------------------------------------------
-- Dispatcher entry point, called every minute by pg_cron. For each user ×
-- supported skill, log a fire decision to cron_log. Real agent invocation
-- (HTTP call to the Managed-Agents-invoking Edge Function) replaces the
-- insert-only behavior in the next migration.

create or replace function public.tick_skills()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_skill   text;
begin
  for v_user_id in select id from public.profiles loop
    foreach v_skill in array array['daily-brief', 'daily-review', 'weekly-review'] loop
      if public.should_fire(v_user_id, v_skill) then
        insert into public.cron_log (user_id, skill, dispatched, metadata)
        values (
          v_user_id,
          v_skill,
          false,
          jsonb_build_object(
            'reason', 'v1-scaffold-only',
            'fired_at_utc', now()
          )
        );
      end if;
    end loop;
  end loop;
end;
$$;

-- Schedule --------------------------------------------------------------------
-- Minute-granularity global tick. The per-user decision lives in tick_skills.
-- Unschedule any prior version of this job before re-scheduling so a replay of
-- this migration in a fresh environment doesn't fail on a duplicate job name.

do $schedule$
begin
  perform cron.unschedule('intently-tick-skills')
    where exists (
      select 1 from cron.job where jobname = 'intently-tick-skills'
    );
exception
  when undefined_function or undefined_table then
    -- pg_cron not loaded in this environment; scheduling step will error
    -- below with a clearer message.
    null;
end;
$schedule$;

select cron.schedule(
  'intently-tick-skills',
  '* * * * *',
  $tick$ select public.tick_skills(); $tick$
);
