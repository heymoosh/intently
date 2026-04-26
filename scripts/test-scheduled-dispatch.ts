// scripts/test-scheduled-dispatch.ts — End-to-end harness for Intently's
// scheduled-dispatch path.
//
// Tests the full production chain:
//   pg_cron tick → tick_skills() → vault read → pg_net POST → dispatch-skill
//   Edge Function → ma-proxy → entries row + cron_log update
//
// Run from the app/ directory so @supabase/supabase-js resolves:
//   cd app && tsx ../scripts/test-scheduled-dispatch.ts <user_id>
//
// Required env vars:
//   SUPABASE_URL              — https://cjlktjrossrzmswrayfz.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY — service-role key (NOT anon key — needs RLS bypass)
//   TEST_USER_ID              — optional; overridden by positional CLI arg
//
// To find your user_id:
//   select id, email, created_at from auth.users order by created_at limit 5;
//   (run in Supabase SQL Editor)

import { createClient } from '@supabase/supabase-js';

// ---------- types ----------

interface SkillConfig {
  skill: string;
  timeField: string;
  dayField?: string;
  entryKind: 'brief' | 'review';
  // For weekly-review: day-of-week ISO (1=Mon…7=Sun)
  // For monthly-review: day-of-month number
  dayValue?: number;
}

interface SkillResult {
  skill: string;
  targetTime: string;
  firedAt: string | null;
  dispatched: boolean | null;
  entriesRow: boolean;
  result: 'PASS' | 'FAIL';
  detail: string;
}

// ---------- constants ----------

const POLL_INTERVAL_MS = 20_000;
const SKILL_TIMEOUT_MS = 5 * 60_000;   // 5 min per skill after target time
const ENTRY_WAIT_MS   = 60_000;        // 60 s for entries row after cron_log appears
const TARGET_LEAD_MS  = 120_000;       // aim at least 2 min ahead of now

// ---------- helpers ----------

function bail(msg: string): never {
  console.error(`\n[FATAL] ${msg}\n`);
  process.exit(1);
}

/** Round a Date up to the next minute boundary. */
function nextMinuteBoundary(d: Date): Date {
  const ms = d.getTime();
  const remainder = ms % 60_000;
  if (remainder === 0) return new Date(ms);
  return new Date(ms + (60_000 - remainder));
}

/** Format a Date as HH:MM in a given IANA timezone. */
function toHHMM(d: Date, tz: string): string {
  return d.toLocaleString('en-US', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).replace(' ', '').replace(' ', ''); // strip NNBSP artifacts
}

/** ISO day-of-week (1=Mon … 7=Sun) in a given timezone. */
function localIsoDow(d: Date, tz: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    weekday: 'short',
  }).formatToParts(d);
  const day = parts.find(p => p.type === 'weekday')?.value;
  const map: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
  return map[day ?? 'Mon'] ?? 1;
}

/** Day-of-month in a given timezone. */
function localDom(d: Date, tz: string): number {
  return parseInt(
    new Intl.DateTimeFormat('en-US', { timeZone: tz, day: 'numeric' }).format(d),
    10,
  );
}

/** Local date string (YYYY-MM-DD) in a given timezone. */
function localDateStr(d: Date, tz: string): string {
  // Supabase date columns use ISO format
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(d);
}

/** Sleep for `ms` milliseconds. */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Print a divider line. */
function divider(label?: string) {
  const line = '─'.repeat(60);
  if (label) console.log(`\n${line}\n  ${label}\n${line}`);
  else        console.log(line);
}

// ---------- main ----------

async function main() {
  // ── Credentials ────────────────────────────────────────────────────────────
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    bail(
      'Missing required env vars.\n' +
      '  export SUPABASE_URL=https://cjlktjrossrzmswrayfz.supabase.co\n' +
      '  export SUPABASE_SERVICE_ROLE_KEY=<service-role-key>\n' +
      'Get the service-role key from Supabase → Settings → API → service_role secret.\n' +
      'Never commit it. Never paste it into chat.',
    );
  }

  // ── User ID ─────────────────────────────────────────────────────────────────
  const userId: string = process.argv[2] || process.env.TEST_USER_ID || '';
  if (!userId || !/^[0-9a-f-]{36}$/.test(userId)) {
    bail(
      'Missing or invalid user_id.\n' +
      'Usage: cd app && tsx ../scripts/test-scheduled-dispatch.ts <user_id>\n' +
      'Or:    TEST_USER_ID=<uuid> tsx ../scripts/test-scheduled-dispatch.ts\n' +
      'Find yours: select id, email from auth.users order by created_at limit 5;',
    );
  }

  const sb = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log('\n=== Intently scheduled-dispatch E2E harness ===');
  console.log(`Supabase: ${supabaseUrl}`);
  console.log(`User:     ${userId}`);
  console.log(`Time:     ${new Date().toISOString()}\n`);

  // ── Read timezone ────────────────────────────────────────────────────────────
  const { data: profile, error: profileErr } = await sb
    .from('profiles')
    .select('timezone')
    .eq('id', userId)
    .single();

  if (profileErr || !profile?.timezone) {
    bail(`Could not read profiles.timezone for user ${userId}: ${profileErr?.message ?? 'not found'}`);
  }
  const tz = profile.timezone as string;
  console.log(`Timezone: ${tz}`);

  // ── Save current life_ops_config ─────────────────────────────────────────────
  const { data: savedConfig, error: configReadErr } = await sb
    .from('life_ops_config')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (configReadErr) {
    bail(`Could not read life_ops_config: ${configReadErr.message}`);
  }

  const savedConfigRow = savedConfig ?? null;
  const savedConfigJson = savedConfigRow ? (savedConfigRow.config ?? {}) : {};
  console.log(`life_ops_config saved (${savedConfigRow ? 'exists' : 'no existing row — will create + delete'}).`);

  // ── Compute skill configs for today ─────────────────────────────────────────
  // Target: next whole minute at least TARGET_LEAD_MS away.
  // We compute one shared target and then use T+2, T+4, T+6, T+8 to prevent
  // all four from colliding (should_fire is per-skill so this is safe).
  // However, since each skill test takes up to 5min, we sequence them and
  // re-compute the target for each one just before we set the config.

  const results: SkillResult[] = [];

  const SKILLS: SkillConfig[] = [
    { skill: 'daily-brief',    timeField: 'daily_brief_time',    entryKind: 'brief'  },
    { skill: 'daily-review',   timeField: 'daily_review_time',   entryKind: 'review' },
    {
      skill: 'weekly-review',
      timeField: 'weekly_review_time',
      dayField: 'weekly_review_day',
      entryKind: 'review',
    },
    {
      skill: 'monthly-review',
      timeField: 'monthly_review_time',
      dayField: 'monthly_review_day',
      entryKind: 'review',
    },
  ];

  // Restore helper — called in finally block.
  async function restoreConfig() {
    try {
      if (savedConfigRow) {
        const { error } = await sb
          .from('life_ops_config')
          .update({ config: savedConfigJson })
          .eq('user_id', userId);
        if (error) {
          console.error(`[RESTORE] Failed to restore config: ${error.message}`);
        } else {
          console.log('\n[RESTORE] life_ops_config RESTORED to original state.');
        }
      } else {
        // We may have created a row — delete it.
        const { error } = await sb
          .from('life_ops_config')
          .delete()
          .eq('user_id', userId);
        if (error) {
          console.error(`[RESTORE] Failed to delete test config row: ${error.message}`);
        } else {
          console.log('\n[RESTORE] life_ops_config test row DELETED (was not present before test).');
        }
      }
    } catch (e) {
      console.error(`[RESTORE] Unexpected error during restore: ${e}`);
    }
  }

  // ── Per-skill test runner ────────────────────────────────────────────────────
  async function runSkillTest(sc: SkillConfig): Promise<SkillResult> {
    divider(`Testing: ${sc.skill}`);

    const now = Date.now();
    const targetDate = nextMinuteBoundary(new Date(now + TARGET_LEAD_MS));
    const targetHHMM = toHHMM(targetDate, tz);
    const localDate = localDateStr(targetDate, tz);

    console.log(`Target fire time: ${targetHHMM} (${tz})  local date: ${localDate}`);
    console.log(`Absolute target:  ${targetDate.toISOString()}`);

    // Build a config that ONLY has this skill's time set to the target.
    // All other skill times are set to '00:00' (won't fire unless it happens
    // to be midnight, which is acceptable) to prevent cross-skill misfires.
    const testConfig: Record<string, string | number> = {
      daily_brief_time:    '00:00',
      daily_review_time:   '00:00',
      weekly_review_time:  '00:00',
      monthly_review_time: '00:00',
    };

    testConfig[sc.timeField] = targetHHMM;

    if (sc.skill === 'weekly-review') {
      const dow = localIsoDow(targetDate, tz);
      testConfig['weekly_review_day'] = String(dow);
      console.log(`weekly_review_day set to: ${dow} (ISO dow of target date)`);
    }

    if (sc.skill === 'monthly-review') {
      const dom = localDom(targetDate, tz);
      testConfig['monthly_review_day'] = String(dom);
      console.log(`monthly_review_day set to: ${dom} (day-of-month of target date)`);
    }

    // Pre-clean any leftover cron_log row for this skill + today so the test
    // doesn't hit the idempotency gate immediately.
    const { error: preCleanErr } = await sb
      .from('cron_log')
      .delete()
      .eq('user_id', userId)
      .eq('skill', sc.skill)
      .eq('date_local', localDate);

    if (preCleanErr) {
      console.warn(`[WARN] pre-clean cron_log failed: ${preCleanErr.message}`);
    } else {
      console.log(`Pre-cleaned cron_log for ${sc.skill} / ${localDate}.`);
    }

    // Write test config.
    if (savedConfigRow) {
      const { error } = await sb
        .from('life_ops_config')
        .update({ config: testConfig })
        .eq('user_id', userId);
      if (error) {
        return { skill: sc.skill, targetTime: targetHHMM, firedAt: null, dispatched: null, entriesRow: false, result: 'FAIL', detail: `config write failed: ${error.message}` };
      }
    } else {
      const { error } = await sb
        .from('life_ops_config')
        .insert({ user_id: userId, config: testConfig });
      if (error) {
        return { skill: sc.skill, targetTime: targetHHMM, firedAt: null, dispatched: null, entriesRow: false, result: 'FAIL', detail: `config insert failed: ${error.message}` };
      }
    }
    console.log(`Config written: ${JSON.stringify(testConfig)}`);

    // Wait until just after target time.
    const waitMs = targetDate.getTime() - Date.now() + 5_000; // +5s margin
    if (waitMs > 0) {
      console.log(`Waiting ${Math.ceil(waitMs / 1000)}s for target time…`);
      await sleep(waitMs);
    }

    // Poll cron_log for up to SKILL_TIMEOUT_MS.
    console.log(`Polling cron_log (every ${POLL_INTERVAL_MS / 1000}s, up to ${SKILL_TIMEOUT_MS / 60_000}min)…`);
    const pollDeadline = Date.now() + SKILL_TIMEOUT_MS;
    let cronRow: Record<string, unknown> | null = null;

    while (Date.now() < pollDeadline) {
      const { data, error } = await sb
        .from('cron_log')
        .select('*')
        .eq('user_id', userId)
        .eq('skill', sc.skill)
        .eq('date_local', localDate)
        .maybeSingle();

      if (error) {
        console.warn(`  poll error: ${error.message}`);
      } else if (data) {
        cronRow = data as Record<string, unknown>;
        console.log(`  cron_log row found: ${JSON.stringify(cronRow)}`);
        break;
      } else {
        process.stdout.write('.');
      }
      await sleep(POLL_INTERVAL_MS);
    }
    process.stdout.write('\n');

    if (!cronRow) {
      return {
        skill: sc.skill,
        targetTime: targetHHMM,
        firedAt: null,
        dispatched: null,
        entriesRow: false,
        result: 'FAIL',
        detail: `no cron_log row after ${SKILL_TIMEOUT_MS / 60_000}min — pg_cron not running OR should_fire returned false`,
      };
    }

    const firedAt = cronRow.fired_at as string | null;
    const dispatched = cronRow.dispatched as boolean | null;
    const meta = cronRow.metadata as Record<string, unknown> | null;

    if (meta?.error || meta?.phase === 'failed') {
      return {
        skill: sc.skill,
        targetTime: targetHHMM,
        firedAt: firedAt ?? '(none)',
        dispatched: dispatched ?? false,
        entriesRow: false,
        result: 'FAIL',
        detail: `cron_log.metadata: ${JSON.stringify(meta)}`,
      };
    }

    if (meta?.phase === 'skipped') {
      return {
        skill: sc.skill,
        targetTime: targetHHMM,
        firedAt: firedAt ?? '(none)',
        dispatched: false,
        entriesRow: false,
        result: 'FAIL',
        detail: `cron_log skipped — ${meta.reason ?? 'no reason'} — vault secret dispatch_skill_url not set`,
      };
    }

    if (!dispatched) {
      return {
        skill: sc.skill,
        targetTime: targetHHMM,
        firedAt: firedAt ?? '(none)',
        dispatched: false,
        entriesRow: false,
        result: 'FAIL',
        detail: `cron_log.dispatched=false, metadata=${JSON.stringify(meta)}`,
      };
    }

    // Poll entries table for up to ENTRY_WAIT_MS.
    console.log(`cron_log dispatched=true. Polling entries (up to ${ENTRY_WAIT_MS / 1000}s)…`);
    const entryDeadline = Date.now() + ENTRY_WAIT_MS;
    let entryFound = false;

    while (Date.now() < entryDeadline) {
      const { data: entryRows, error: entryErr } = await sb
        .from('entries')
        .select('id, kind, source, at')
        .eq('user_id', userId)
        .eq('source', 'agent-scheduled')
        .eq('kind', sc.entryKind)
        .gte('at', new Date(targetDate.getTime() - 60_000).toISOString())  // within 1min before target
        .order('at', { ascending: false })
        .limit(1);

      if (entryErr) {
        console.warn(`  entries poll error: ${entryErr.message}`);
      } else if (entryRows && entryRows.length > 0) {
        console.log(`  entries row found: ${JSON.stringify(entryRows[0])}`);
        entryFound = true;
        break;
      } else {
        process.stdout.write('.');
      }
      await sleep(5_000);
    }
    process.stdout.write('\n');

    if (!entryFound) {
      return {
        skill: sc.skill,
        targetTime: targetHHMM,
        firedAt: firedAt ?? '(none)',
        dispatched: true,
        entriesRow: false,
        result: 'FAIL',
        detail: `dispatched=true but no entries row (source=agent-scheduled, kind=${sc.entryKind}) within ${ENTRY_WAIT_MS / 1000}s — dispatch-skill may have failed after setting dispatched; check Edge Function logs`,
      };
    }

    // Cleanup: delete cron_log row so re-runs work.
    await sb.from('cron_log')
      .delete()
      .eq('user_id', userId)
      .eq('skill', sc.skill)
      .eq('date_local', localDate);
    console.log(`Cleaned up cron_log row for ${sc.skill}/${localDate}.`);

    return {
      skill: sc.skill,
      targetTime: targetHHMM,
      firedAt: firedAt ?? '(none)',
      dispatched: true,
      entriesRow: true,
      result: 'PASS',
      detail: 'ok',
    };
  }

  // ── Config-change pickup test ────────────────────────────────────────────────
  //
  // Sets daily_brief_time = T+2min, waits 60s (one cron tick passes without a
  // match), then changes it to T+4min (which is still in the future).
  // Verifies: cron_log row arrives at T+4min, NOT T+2min.
  //
  // This MUST run before the regular daily-brief test (which also uses
  // daily_brief_time) AND needs a clean cron_log for daily-brief/today.
  // We run it AFTER all four skill tests — which each pre-clean their slot —
  // so this test gets a fresh daily_brief slot regardless.
  async function runConfigChangeTest(): Promise<SkillResult> {
    divider('Config-change pickup test (daily-brief)');

    const now = new Date();
    const localDate = localDateStr(now, tz);

    // Pre-clean daily-brief cron_log.
    await sb.from('cron_log')
      .delete()
      .eq('user_id', userId)
      .eq('skill', 'daily-brief')
      .eq('date_local', localDate);

    // Compute T+2 and T+4 (both rounded to minute boundaries).
    const t2 = nextMinuteBoundary(new Date(now.getTime() + TARGET_LEAD_MS));
    const t4 = nextMinuteBoundary(new Date(now.getTime() + TARGET_LEAD_MS + 120_000));
    const t2hhmm = toHHMM(t2, tz);
    const t4hhmm = toHHMM(t4, tz);

    console.log(`T+2 (initial):  ${t2hhmm} (${t2.toISOString()})`);
    console.log(`T+4 (override): ${t4hhmm} (${t4.toISOString()})`);

    const baseConfig: Record<string, string> = {
      daily_brief_time:    t2hhmm,
      daily_review_time:   '00:00',
      weekly_review_time:  '00:00',
      monthly_review_time: '00:00',
    };

    // Write T+2 config.
    if (savedConfigRow) {
      await sb.from('life_ops_config').update({ config: baseConfig }).eq('user_id', userId);
    } else {
      await sb.from('life_ops_config').insert({ user_id: userId, config: baseConfig });
    }
    console.log(`Set daily_brief_time = ${t2hhmm}. Waiting 65s before override…`);
    await sleep(65_000);

    // Override to T+4 before T+2 fires (if T+2 is still ~55s away this is safe).
    const newConfig = { ...baseConfig, daily_brief_time: t4hhmm };
    if (savedConfigRow) {
      await sb.from('life_ops_config').update({ config: newConfig }).eq('user_id', userId);
    } else {
      await sb.from('life_ops_config').update({ config: newConfig }).eq('user_id', userId);
    }
    console.log(`Overrode daily_brief_time → ${t4hhmm}. Now polling for cron_log at T+4…`);

    // Poll until T+4 + 5min timeout.
    const deadline = t4.getTime() + SKILL_TIMEOUT_MS;

    // Wait for T+4 first.
    const waitMs = t4.getTime() - Date.now() + 5_000;
    if (waitMs > 0) {
      console.log(`Waiting ${Math.ceil(waitMs / 1000)}s for T+4…`);
      await sleep(waitMs);
    }

    const pollDeadline = Math.min(deadline, t4.getTime() + SKILL_TIMEOUT_MS);
    let cronRow: Record<string, unknown> | null = null;

    while (Date.now() < pollDeadline) {
      const { data, error } = await sb
        .from('cron_log')
        .select('*')
        .eq('user_id', userId)
        .eq('skill', 'daily-brief')
        .eq('date_local', localDate)
        .maybeSingle();

      if (error) {
        console.warn(`  poll error: ${error.message}`);
      } else if (data) {
        cronRow = data as Record<string, unknown>;
        console.log(`  cron_log row found: ${JSON.stringify(cronRow)}`);
        break;
      } else {
        process.stdout.write('.');
      }
      await sleep(POLL_INTERVAL_MS);
    }
    process.stdout.write('\n');

    // Clean up regardless.
    await sb.from('cron_log').delete().eq('user_id', userId).eq('skill', 'daily-brief').eq('date_local', localDate);

    if (!cronRow) {
      return {
        skill: 'config-change (daily-brief)',
        targetTime: t4hhmm,
        firedAt: null,
        dispatched: null,
        entriesRow: false,
        result: 'FAIL',
        detail: `no cron_log row at T+4 (${t4hhmm}) — should_fire not picking up changed config`,
      };
    }

    const firedAtTs = cronRow.fired_at as string | null;
    if (!firedAtTs) {
      return {
        skill: 'config-change (daily-brief)',
        targetTime: t4hhmm,
        firedAt: null,
        dispatched: null,
        entriesRow: false,
        result: 'FAIL',
        detail: 'cron_log row found but fired_at is null',
      };
    }

    // Verify it fired at T+4, not T+2.
    const firedDate = new Date(firedAtTs);
    const firedHHMM = toHHMM(firedDate, tz);

    if (firedHHMM === t2hhmm) {
      return {
        skill: 'config-change (daily-brief)',
        targetTime: t4hhmm,
        firedAt: firedHHMM,
        dispatched: cronRow.dispatched as boolean ?? null,
        entriesRow: false,
        result: 'FAIL',
        detail: `fired at T+2 (${t2hhmm}) — config change NOT picked up; should_fire may be caching config`,
      };
    }

    return {
      skill: 'config-change (daily-brief)',
      targetTime: t4hhmm,
      firedAt: firedHHMM,
      dispatched: cronRow.dispatched as boolean ?? null,
      entriesRow: false,   // not testing entries for this variant
      result: 'PASS',
      detail: `fired at T+4 (${firedHHMM}), not T+2 (${t2hhmm}) — config change picked up correctly`,
    };
  }

  // ── Execute all tests ────────────────────────────────────────────────────────
  try {
    for (const sc of SKILLS) {
      const r = await runSkillTest(sc);
      results.push(r);
      console.log(`\n${sc.skill}: ${r.result} — ${r.detail}`);
    }

    // Config-change test runs last (uses daily-brief slot, which was cleaned up above).
    const ccResult = await runConfigChangeTest();
    results.push(ccResult);
    console.log(`\nconfig-change: ${ccResult.result} — ${ccResult.detail}`);
  } finally {
    await restoreConfig();
  }

  // ── Summary table ────────────────────────────────────────────────────────────
  divider('Summary');
  const COL = [32, 8, 10, 12, 12, 12, 6];
  const header = ['skill', 'target', 'fired_at', 'dispatched', 'entries_row', 'result', 'detail'];

  function padR(s: string, n: number) { return s.padEnd(n).slice(0, n); }
  function row(vals: string[]) { return vals.map((v, i) => padR(v, COL[i] ?? 10)).join('  '); }

  console.log(row(header));
  console.log('─'.repeat(COL.reduce((a, b) => a + b + 2, 0)));

  for (const r of results) {
    console.log(row([
      r.skill,
      r.targetTime,
      r.firedAt ?? '-',
      String(r.dispatched ?? '-'),
      String(r.entriesRow),
      r.result,
      r.detail.slice(0, 60),
    ]));
  }

  const anyFail = results.some(r => r.result === 'FAIL');
  console.log(`\nOverall: ${anyFail ? 'FAIL' : 'PASS'} (${results.filter(r => r.result === 'PASS').length}/${results.length} passed)`);

  if (anyFail) {
    console.log('\nFailed tests:');
    results.filter(r => r.result === 'FAIL').forEach(r => {
      console.log(`  ${r.skill}: ${r.detail}`);
    });
  }

  process.exit(anyFail ? 1 : 0);
}

main().catch(err => {
  console.error('[UNHANDLED]', err);
  process.exit(1);
});
