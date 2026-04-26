-- 0010_dispatch_via_vault.sql — switch tick_skills() to read dispatch URL/auth
-- from Supabase Vault instead of custom GUCs (app.settings.*).
--
-- Why this exists:
--   Migration 0007 instructed operators to run:
--     ALTER DATABASE postgres SET app.settings.dispatch_skill_url = '...';
--     ALTER DATABASE postgres SET app.settings.dispatch_skill_auth = '...';
--   These commands FAIL on Supabase hosted Postgres because the `postgres` role
--   is not a true superuser there — it cannot register custom GUCs. Error:
--     "permission denied to set parameter app.settings.dispatch_skill_url"
--   This migration switches tick_skills() to read the same two values from
--   vault.decrypted_secrets, which IS accessible to the postgres role.
--
-- Manual follow-ups REPLACING the ALTER DATABASE commands from 0007:
--   Run these once in the Supabase SQL Editor after applying this migration:
--
--   select vault.create_secret(
--     'https://cjlktjrossrzmswrayfz.supabase.co/functions/v1/dispatch-skill',
--     'dispatch_skill_url'
--   );
--   select vault.create_secret('Bearer <service-role-key>', 'dispatch_skill_auth');
--
--   To update an existing secret:
--     select vault.update_secret(id, 'new-value')
--     from vault.decrypted_secrets where name = 'dispatch_skill_url';

set search_path = public;

-- Ensure Supabase Vault extension is enabled (idempotent).
create extension if not exists supabase_vault;

-- tick_skills — read URL/auth from Vault instead of GUC ------------------
-- Body is identical to 0007 EXCEPT the two v_url/v_auth assignment lines at
-- the top of the function body now SELECT from vault.decrypted_secrets.
-- All other logic (idempotency, pg_net call, error handling) is unchanged.

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
  -- Read dispatch URL and auth from Supabase Vault (replaces GUC approach from
  -- 0007 which required ALTER DATABASE — not allowed for postgres role on hosted
  -- Supabase). vault.decrypted_secrets is accessible to the postgres role.
  select decrypted_secret into v_url
    from vault.decrypted_secrets where name = 'dispatch_skill_url';
  select decrypted_secret into v_auth
    from vault.decrypted_secrets where name = 'dispatch_skill_auth';
  v_url  := nullif(v_url, '');
  v_auth := nullif(v_auth, '');

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
                      'reason', 'dispatch_skill_url not set in vault'
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
