# Scheduled-dispatch E2E runbook

Tests the full production chain:

```
pg_cron tick → tick_skills() → Vault read → pg_net POST
  → dispatch-skill Edge Function → ma-proxy → entries row + cron_log update
```

---

## Prerequisites

| Requirement | How to verify |
|---|---|
| Migration `0007_dispatch_via_pg_net.sql` applied | `select count(*) from cron_log;` returns without error |
| Migration `0010_dispatch_via_vault.sql` applied | `\df tick_skills` shows function; `select * from vault.decrypted_secrets where name like 'dispatch_%';` returns 2 rows |
| Vault secrets created | See SQL below |
| `dispatch-skill` Edge Function deployed | `supabase functions list` shows `dispatch-skill` |
| `ma-proxy` Edge Function deployed | `supabase functions list` shows `ma-proxy` |
| pg_cron enabled + running | `select * from cron.job where jobname = 'intently-tick-skills';` returns one row |
| pg_net extension enabled | `select * from pg_extension where extname = 'pg_net';` returns a row |
| Test user has `profiles.timezone` set | See SQL below |

### Create Vault secrets (run once in Supabase SQL Editor)

```sql
-- Create (if not yet present):
select vault.create_secret(
  'https://cjlktjrossrzmswrayfz.supabase.co/functions/v1/dispatch-skill',
  'dispatch_skill_url'
);
select vault.create_secret('Bearer <service-role-key>', 'dispatch_skill_auth');

-- Update existing secret:
select vault.update_secret(id, 'Bearer <new-value>')
from vault.decrypted_secrets
where name = 'dispatch_skill_auth';

-- Verify:
select name, length(decrypted_secret) as len
from vault.decrypted_secrets
where name in ('dispatch_skill_url', 'dispatch_skill_auth');
```

---

## Find your test user_id

Run in Supabase SQL Editor:

```sql
select
  u.id,
  u.email,
  p.timezone,
  c.config
from auth.users u
left join public.profiles p on p.id = u.id
left join public.life_ops_config c on c.user_id = u.id
order by u.created_at
limit 5;
```

Make sure the user has `profiles.timezone` set (not null). If it is null:

```sql
update public.profiles
set timezone = 'America/Chicago'
where id = '<your-user-id>';
```

---

## Run the test

```bash
# From repo root:
export SUPABASE_URL=https://cjlktjrossrzmswrayfz.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

cd app
tsx ../scripts/test-scheduled-dispatch.ts <user_id>
```

Or using the env var for user ID:

```bash
TEST_USER_ID=<uuid> tsx ../scripts/test-scheduled-dispatch.ts
```

The script runs 5 tests in sequence (4 skills + config-change pickup). Total
worst-case runtime: ~25 minutes. Each skill test sets the dispatch time 2
minutes ahead and polls for up to 5 minutes after that.

---

## Expected output

```
=== Intently scheduled-dispatch E2E harness ===
Supabase: https://cjlktjrossrzmswrayfz.supabase.co
User:     <uuid>
Time:     2026-04-26T…

Timezone: America/Chicago
life_ops_config saved (exists).

────────────────────────────────────────────────────
  Testing: daily-brief
────────────────────────────────────────────────────
Target fire time: 14:32 (America/Chicago)  local date: 2026-04-26
Pre-cleaned cron_log for daily-brief / 2026-04-26.
Config written: { "daily_brief_time": "14:32", … }
Waiting 110s for target time…
Polling cron_log (every 20s, up to 5min)…
  cron_log row found: { "id": 42, "dispatched": true, … }
cron_log dispatched=true. Polling entries (up to 60s)…
  entries row found: { "id": "…", "kind": "brief", "source": "agent-scheduled", … }
Cleaned up cron_log row for daily-brief/2026-04-26.

daily-brief: PASS — ok
…

[RESTORE] life_ops_config RESTORED to original state.

Summary
skill                             target    fired_at    dispatched  entries_row  result  detail
…
Overall: PASS (5/5 passed)
```

Exit code 0 = all pass, 1 = any fail.

---

## Failure interpretation

| Symptom | Likely cause | Fix |
|---|---|---|
| No `cron_log` row after 5 min | pg_cron not running, or `should_fire` returned false | Verify pg_cron job: `select * from cron.job where jobname = 'intently-tick-skills'`; verify `life_ops_config.config` has correct time + user timezone; run `select public.tick_skills()` manually to force a tick |
| `cron_log.metadata.phase = 'skipped'` + reason `dispatch_skill_url not set in vault` | Vault secret missing | Run `vault.create_secret(…, 'dispatch_skill_url')` per prerequisites |
| `cron_log.dispatched = false` + metadata `phase = 'http_error'` | pg_net call failed — URL wrong or function not deployed | Verify `dispatch-skill` is deployed; check `net._http_response` for error |
| `cron_log.dispatched = false` + metadata `phase = 'dispatched'` but `pg_net_request_id` present | pg_net sent the request but dispatch-skill returned error before updating `dispatched` | Check Edge Function logs in Supabase Dashboard → Edge Functions → dispatch-skill → Logs |
| `cron_log.dispatched = true` but no `entries` row | dispatch-skill called ma-proxy but agent failed, or entries insert failed | Check dispatch-skill logs; check `cron_log.metadata.phase` — if `'completed'` then entries insert passed, check `source='agent-scheduled'` filter; if `'failed'` then agent errored |
| Config-change test fires at T+2 not T+4 | `should_fire` or `tick_skills` is caching `life_ops_config` | The Postgres function should read live config each tick — check for a misconfigured prepared statement or stale plan; run `analyze public.life_ops_config` and retry |
| `TypeError: cannot read properties of undefined` at script start | `@supabase/supabase-js` not installed | Run `cd app && npm install` |

---

## Manual state cleanup

If the test crashed mid-run and left state behind:

```sql
-- Delete test cron_log rows for today:
delete from public.cron_log
where user_id = '<your-user-id>'
  and date_local = current_date;

-- Delete agent-scheduled entries created during the test:
delete from public.entries
where user_id = '<your-user-id>'
  and source = 'agent-scheduled'
  and at > now() - interval '2 hours';

-- Restore life_ops_config to known-good values (replace with your actual times):
update public.life_ops_config
set config = '{
  "daily_brief_time": "07:00",
  "daily_review_time": "21:00",
  "weekly_review_time": "09:00",
  "weekly_review_day": "7",
  "monthly_review_time": "10:00",
  "monthly_review_day": "1"
}'::jsonb
where user_id = '<your-user-id>';
```

---

## Re-running

The script pre-cleans `cron_log` rows for each skill before setting the time.
Each re-run is safe as long as the previous run completed (or you ran the
cleanup SQL above). The unique index `(user_id, skill, date_local)` means only
one fire per skill per local calendar day is possible; if you want to re-test
within the same day, run the delete SQL first.
