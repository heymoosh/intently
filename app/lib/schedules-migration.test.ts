import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

// These are structural parse-tests, not a DB roundtrip. They catch regressions
// in what the migration *declares* without requiring a live Postgres (the
// overnight build loop is forbidden from `supabase db push`). A real DB test
// lands once a CI Postgres service is wired.

const MIGRATION_PATH = join(process.cwd(), '..', 'supabase', 'migrations', '0002_schedules.sql');

async function loadMigration(): Promise<string> {
  return readFile(MIGRATION_PATH, 'utf8');
}

test('migration file exists at the expected path', async () => {
  const sql = await loadMigration();
  assert.ok(sql.length > 0, 'migration should be non-empty');
});

test('migration enables pg_cron extension (idempotent)', async () => {
  const sql = await loadMigration();
  assert.match(sql, /create extension if not exists pg_cron/i);
});

test('migration creates cron_log table with required columns', async () => {
  const sql = await loadMigration();
  assert.match(sql, /create table if not exists public\.cron_log/i);
  for (const col of ['user_id', 'skill', 'fired_at', 'dispatched', 'metadata']) {
    assert.match(sql, new RegExp(`\\b${col}\\b`), `cron_log missing column ${col}`);
  }
});

test('cron_log has RLS enabled with an owner-only policy', async () => {
  const sql = await loadMigration();
  assert.match(sql, /alter table public\.cron_log enable row level security/i);
  assert.match(sql, /create policy cron_log_owner/i);
  assert.match(sql, /auth\.uid\(\) = user_id/);
});

test('migration defines dow_match helper covering all 7 days', async () => {
  const sql = await loadMigration();
  assert.match(sql, /create or replace function public\.dow_match/i);
  for (const day of ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']) {
    assert.match(sql, new RegExp(day, 'i'), `dow_match missing ${day}`);
  }
});

test('migration defines should_fire reading config + timezone', async () => {
  const sql = await loadMigration();
  assert.match(sql, /create or replace function public\.should_fire/i);
  // Must join profiles (timezone) and life_ops_config (config JSONB).
  assert.match(sql, /profiles/i);
  assert.match(sql, /life_ops_config/i);
  // Must read the four config keys from the brief.
  for (const key of [
    'daily_brief_time',
    'daily_review_time',
    'weekly_review_time',
    'weekly_review_day',
  ]) {
    assert.match(sql, new RegExp(key), `should_fire missing config key ${key}`);
  }
});

test('should_fire checks each MVP skill by name', async () => {
  const sql = await loadMigration();
  for (const skill of ['daily-brief', 'daily-review', 'weekly-review']) {
    assert.match(sql, new RegExp(`'${skill}'`), `should_fire missing skill branch ${skill}`);
  }
});

test('migration defines tick_skills dispatcher as security definer', async () => {
  const sql = await loadMigration();
  assert.match(sql, /create or replace function public\.tick_skills/i);
  assert.match(sql, /security definer/i);
  assert.match(sql, /insert into public\.cron_log/i);
});

test('migration schedules the intently-tick-skills job every minute', async () => {
  const sql = await loadMigration();
  assert.match(sql, /cron\.schedule\([^)]*intently-tick-skills/i);
  assert.match(sql, /'\* \* \* \* \*'/);
});

test('migration guards against duplicate scheduling on replay', async () => {
  const sql = await loadMigration();
  assert.match(sql, /cron\.unschedule\('intently-tick-skills'\)/i);
});

test('migration does not reference Google OAuth, Bitwarden, or secret literals', async () => {
  const sql = await loadMigration();
  // Hard-stop rules from the overnight build loop brief: the migration must
  // not pull in anything that requires real creds or the secrets vault.
  for (const forbidden of ['oauth', 'bitwarden', 'access_token', 'refresh_token', 'client_secret']) {
    assert.doesNotMatch(
      sql,
      new RegExp(forbidden, 'i'),
      `migration must not reference "${forbidden}"`
    );
  }
});
