// dispatch-skill — Supabase Edge Function (Deno runtime).
//
// Purpose: invoked by Postgres `tick_skills()` (via pg_net) when a scheduled
// skill should fire for a user. Assembles the user's context server-side,
// calls ma-proxy (which holds the Anthropic API key), writes the agent's
// output to public.entries, and updates the originating cron_log row.
//
// Why a separate function from ma-proxy:
//   • ma-proxy is a thin upstream-Anthropic shim, called from the browser
//     with already-assembled context (the assembler runs in the browser).
//   • dispatch-skill runs server-side without any browser around — so it
//     must replicate the assembler's DB reads in Deno + service-role auth.
//   • Splitting keeps ma-proxy's contract simple (skill + input → finalText)
//     and lets dispatch-skill change without touching the browser flow.
//
// Auth model:
//   • Postgres tick_skills sends Authorization: Bearer <service_role JWT>
//     (stored in vault as `dispatch_skill_auth`, read via app.settings).
//   • This function decodes the JWT payload and checks role === 'service_role'.
//     Signature validation is handled by the gateway (verify_jwt: true in
//     config.toml). This avoids brittle strict-equality against the env-injected
//     SUPABASE_SERVICE_ROLE_KEY which can differ under Supabase key migration.
//   • DB writes use a service-role Supabase client — RLS-bypass is OK because
//     every write is scoped to the user_id from the verified payload.
//
// Idempotency:
//   • The cron_log row was already inserted by tick_skills with a unique
//     (user_id, skill, date_local) constraint. This function is one-shot
//     per cron_log_id; if it crashes mid-run, the cron_log row stays at
//     phase=dispatched but with no entries row — the next day's tick will
//     fire fresh, and the failed row stays as a tombstone in the activity log.

// deno-lint-ignore-file no-explicit-any

import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

// ---------- types ----------

type DispatchPayload = {
  cron_log_id: number;
  user_id: string;
  skill: string;
  fired_at: string;
};

type MaProxyResponse = {
  sessionId: string;
  finalText: string;
  status: 'idle' | 'error' | 'terminated';
  error?: { message: string; detail?: unknown };
};

// ---------- helpers ----------

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function errResp(status: number, message: string, detail?: unknown) {
  return json({ error: { message, detail } }, status);
}

function parsePayload(raw: unknown): DispatchPayload | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.cron_log_id !== 'number') return null;
  if (typeof r.user_id !== 'string' || !r.user_id) return null;
  if (typeof r.skill !== 'string' || !r.skill) return null;
  if (typeof r.fired_at !== 'string' || !r.fired_at) return null;
  return {
    cron_log_id: r.cron_log_id,
    user_id: r.user_id,
    skill: r.skill,
    fired_at: r.fired_at,
  };
}

// Format a Date as "Mon Apr 21" (mirrors browser assembler).
function shortDate(d: Date): string {
  const dayName = d.toLocaleString('en-US', { weekday: 'short' });
  const month = d.toLocaleString('en-US', { month: 'short' });
  return `${dayName} ${month} ${d.getDate()}`;
}

// Strip the trailing fenced JSON tail off a review body (mirrors browser).
function stripJsonTail(body: string | null | undefined): string {
  if (!body) return '';
  return body.replace(/```json[\s\S]*$/, '').trim();
}

// Map a skill → the entries row the agent's output should be written as.
//   daily-brief    → kind='brief',  links={ scope: 'day' }
//   daily-review   → kind='review', links={ scope: 'day' }
//   weekly-review  → kind='review', links={ scope: 'week', week_id: 'YYYY-Www' }
//   monthly-review → kind='review', links={ scope: 'month', month_id: 'YYYY-MM' }
//
// (Matches conventions assembled in web/lib/context-assembler.js — that file
// already reads `e.links.scope === 'week'` for monthly compression.)
function entryShapeForSkill(skill: string, fired: Date): { kind: string; links: Record<string, unknown>; title: string } {
  switch (skill) {
    case 'daily-brief':
      return { kind: 'brief', links: { scope: 'day' }, title: 'Morning brief' };
    case 'daily-review':
      return { kind: 'review', links: { scope: 'day' }, title: 'Evening review' };
    case 'weekly-review':
      return { kind: 'review', links: { scope: 'week', week_id: isoWeekId(fired) }, title: 'Weekly review' };
    case 'monthly-review':
      return {
        kind: 'review',
        links: { scope: 'month', month_id: `${fired.getUTCFullYear()}-${String(fired.getUTCMonth() + 1).padStart(2, '0')}` },
        title: 'Monthly review',
      };
    default:
      return { kind: 'brief', links: {}, title: skill };
  }
}

function isoWeekId(d: Date): string {
  const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(((target.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
  return `${target.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

// ---------- context assembly (server-side port of web/lib/context-assembler.js) ----------
//
// V1 keeps this lean — full feature parity with the browser assembler isn't
// the bar; the agent producing useful output from goals + projects + recent
// entries IS the bar. Calendar + email tables may not be populated until the
// OAuth handoff lands, so we read them defensively and skip on missing.

async function assembleBriefInput(sb: SupabaseClient, userId: string, today: Date): Promise<string> {
  const since14d = new Date(today.getTime() - 14 * 86400000).toISOString();
  const todayStr = today.toISOString().slice(0, 10);

  const [goalsR, projectsR, entriesR, planR, remindersR] = await Promise.all([
    sb.from('goals').select('*').eq('user_id', userId).is('archived_at', null)
      .order('position', { ascending: true, nullsFirst: false }).limit(3),
    sb.from('projects').select('*').eq('user_id', userId).eq('status', 'active')
      .order('updated_at', { ascending: false }),
    sb.from('entries').select('*').eq('user_id', userId).gte('at', since14d)
      .order('at', { ascending: false }),
    sb.from('plan_items').select('*').eq('user_id', userId).eq('date', todayStr)
      .order('position', { ascending: true, nullsFirst: false }),
    sb.from('reminders').select('*').eq('user_id', userId).eq('status', 'pending')
      .order('remind_on', { ascending: true }),
  ]);

  const goals = goalsR.data ?? [];
  const projects = (projectsR.data ?? []).filter((p: any) => !p.is_admin);
  const entries = entriesR.data ?? [];
  const plan = planR.data ?? [];
  const reminders = remindersR.data ?? [];

  const sections: string[] = [`# Morning brief context for ${shortDate(today)}`, ''];

  if (goals.length === 0) {
    sections.push('## Active goals\nNo goals set yet.\n');
  } else {
    sections.push('## Active goals');
    goals.forEach((g: any, i: number) => {
      const slice = g.monthly_slice ? `\n  - This month: ${g.monthly_slice}` : '';
      sections.push(`${i + 1}. **${g.title}**${slice}`);
    });
    sections.push('');
  }

  if (projects.length > 0) {
    sections.push('## Active projects');
    projects.forEach((p: any) => {
      const todos = Array.isArray(p.todos) ? p.todos : [];
      const open = todos.filter((t: any) => !t.done).slice(0, 3);
      const todoLine = open.length ? ` — Open: ${open.map((t: any) => t.text).join(' · ')}` : '';
      sections.push(`- **${p.title}** (${p.status})${todoLine}`);
    });
    sections.push('');
  }

  const recentReview = entries.find((e: any) => e.kind === 'review');
  if (recentReview) {
    const at = new Date(recentReview.at);
    sections.push(`## Yesterday's review (${shortDate(at)})`);
    sections.push(stripJsonTail(recentReview.body_markdown));
    sections.push('');
  } else {
    const journals = entries.filter((e: any) => e.kind === 'journal').slice(0, 3);
    if (journals.length > 0) {
      sections.push('## Recent journal entries');
      journals.forEach((e: any) => {
        const at = new Date(e.at);
        sections.push(`- **${shortDate(at)}**: ${e.body_markdown}`);
      });
      sections.push('');
    }
  }

  if (plan.length > 0) {
    sections.push("## Today's plan (already laid out)");
    plan.forEach((p: any) => sections.push(`- ${p.text}${p.tier ? ` (${p.tier})` : ''}${p.done ? ' ✓' : ''}`));
    sections.push('');
  }

  if (reminders.length > 0) {
    sections.push('## Due reminders');
    reminders.forEach((r: any) => sections.push(`- ${r.text} (due ${r.remind_on})`));
    sections.push('');
  }

  sections.push(
    '## Your task',
    'Generate a personal daily brief in plain prose (no markdown headers, no bullets — just sentences). Open with a felt-sense observation tying together what matters today and where they are this week. Reference at least one concrete thing from yesterday\'s review or recent journal — show that you remember. Name one thing actually at stake today given the active goals, projects, and plan. End with a single grounding action they can take in the next hour. Keep it under 3 short paragraphs. Speak directly to them ("you"), not about them.',
    '',
    'Then append the structured JSON tail per your output contract (pacing / flags / bands / parked / today_one_line / carrying_into_tomorrow).',
  );

  return sections.join('\n');
}

async function assembleReviewInput(sb: SupabaseClient, userId: string, today: Date): Promise<string> {
  const since14d = new Date(today.getTime() - 14 * 86400000).toISOString();
  const todayStr = today.toISOString().slice(0, 10);

  const [goalsR, projectsR, entriesR, planR] = await Promise.all([
    sb.from('goals').select('*').eq('user_id', userId).is('archived_at', null)
      .order('position', { ascending: true, nullsFirst: false }).limit(3),
    sb.from('projects').select('*').eq('user_id', userId).eq('status', 'active')
      .order('updated_at', { ascending: false }),
    sb.from('entries').select('*').eq('user_id', userId).gte('at', since14d)
      .order('at', { ascending: false }),
    sb.from('plan_items').select('*').eq('user_id', userId).eq('date', todayStr)
      .order('position', { ascending: true, nullsFirst: false }),
  ]);

  const goals = goalsR.data ?? [];
  const projects = (projectsR.data ?? []).filter((p: any) => !p.is_admin);
  const entries = entriesR.data ?? [];
  const plan = planR.data ?? [];

  const sections: string[] = [`# Evening review context for ${shortDate(today)}`, ''];

  if (goals.length > 0) {
    sections.push('## Active goals');
    goals.forEach((g: any, i: number) => sections.push(`${i + 1}. **${g.title}**${g.monthly_slice ? ` — ${g.monthly_slice}` : ''}`));
    sections.push('');
  }

  if (projects.length > 0) {
    sections.push('## Active projects');
    projects.forEach((p: any) => sections.push(`- **${p.title}** (${p.status})`));
    sections.push('');
  }

  if (plan.length > 0) {
    sections.push("## Today's plan");
    plan.forEach((p: any) => sections.push(`- ${p.text}${p.tier ? ` (${p.tier})` : ''}${p.done ? ' ✓' : ''}`));
    sections.push('');
  }

  const journals = entries.filter((e: any) => e.kind === 'journal').slice(0, 2);
  if (journals.length > 0) {
    sections.push('## Recent journal entries');
    journals.forEach((e: any) => {
      const at = new Date(e.at);
      sections.push(`- **${shortDate(at)}**: ${e.body_markdown}`);
    });
    sections.push('');
  }

  sections.push(
    '## Your task',
    'Generate a short evening review in plain prose (no markdown headers, no bullets — just sentences). Acknowledge what they got right today specifically (reference today\'s plan items they completed, projects they moved). Reflect briefly on the friction without lecturing. Plant a single seed for tomorrow that connects to today\'s work AND the active monthly priority. Keep it under 3 short paragraphs. Speak directly to them ("you"). Tone: warm, plainspoken, end-of-day.',
    '',
    'Then append the structured JSON tail per your output contract (journal_text / friction / tomorrow / calendar).',
  );

  return sections.join('\n');
}

async function assembleWeeklyInput(sb: SupabaseClient, userId: string, today: Date): Promise<string> {
  const dow = (today.getUTCDay() + 6) % 7;
  const weekStart = new Date(today.getTime() - dow * 86400000);
  weekStart.setUTCHours(0, 0, 0, 0);

  const [goalsR, projectsR, weekEntriesR, weekPlanR] = await Promise.all([
    sb.from('goals').select('*').eq('user_id', userId).is('archived_at', null)
      .order('position', { ascending: true, nullsFirst: false }).limit(3),
    sb.from('projects').select('*').eq('user_id', userId).eq('status', 'active')
      .order('updated_at', { ascending: false }),
    sb.from('entries').select('*').eq('user_id', userId).gte('at', weekStart.toISOString())
      .order('at', { ascending: true }),
    sb.from('plan_items').select('*').eq('user_id', userId)
      .gte('date', weekStart.toISOString().slice(0, 10))
      .order('date', { ascending: true }),
  ]);

  const goals = goalsR.data ?? [];
  const projects = (projectsR.data ?? []).filter((p: any) => !p.is_admin);
  const weekEntries = weekEntriesR.data ?? [];
  const weekPlan = weekPlanR.data ?? [];

  const sections: string[] = [`# Weekly review context for ${isoWeekId(today)}`, ''];

  if (goals.length > 0) {
    sections.push('## Active goals');
    goals.forEach((g: any, i: number) => sections.push(`${i + 1}. **${g.title}**${g.monthly_slice ? ` — ${g.monthly_slice}` : ''}`));
    sections.push('');
  }

  if (projects.length > 0) {
    sections.push('## Active projects');
    projects.forEach((p: any) => sections.push(`- **${p.title}** (${p.status})`));
    sections.push('');
  }

  if (weekPlan.length > 0) {
    sections.push('## Plan items this week');
    weekPlan.forEach((p: any) => sections.push(`- ${p.date}: ${p.text}${p.tier ? ` (${p.tier})` : ''}`));
    sections.push('');
  }

  const reviews = weekEntries.filter((e: any) => e.kind === 'review');
  if (reviews.length > 0) {
    sections.push('## Daily reviews this week');
    reviews.forEach((r: any) => {
      const at = new Date(r.at);
      const day = at.toLocaleString('en-US', { weekday: 'short' });
      sections.push(`- **${day}**: ${stripJsonTail(r.body_markdown)}`);
    });
    sections.push('');
  }

  sections.push(
    '## Your task',
    'Generate a weekly review in plain prose (≤4 short paragraphs). Open by naming what actually landed this week (cite specific plan items / reviews / journal moments). Reflect on the through-line: was the week serving the active monthly priorities, or drifting? Name one pattern worth carrying forward, one worth dropping. End with 2–4 outcome-directions for next week. Speak directly to them ("you").',
    '',
    'Then append a structured JSON tail per the weekly-review output contract.',
  );

  return sections.join('\n');
}

async function assembleMonthlyInput(sb: SupabaseClient, userId: string, today: Date): Promise<string> {
  const monthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1)).toISOString();

  const [goalsR, projectsR, monthEntriesR] = await Promise.all([
    sb.from('goals').select('*').eq('user_id', userId).is('archived_at', null)
      .order('position', { ascending: true, nullsFirst: false }).limit(3),
    sb.from('projects').select('*').eq('user_id', userId).eq('status', 'active')
      .order('updated_at', { ascending: false }),
    sb.from('entries').select('*').eq('user_id', userId).gte('at', monthStart)
      .order('at', { ascending: false }),
  ]);

  const goals = goalsR.data ?? [];
  const projects = (projectsR.data ?? []).filter((p: any) => !p.is_admin);
  const monthEntries = monthEntriesR.data ?? [];
  const monthName = today.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  const sections: string[] = [`# Monthly review context for ${monthName}`, ''];

  if (goals.length > 0) {
    sections.push('## Active goals');
    goals.forEach((g: any, i: number) => sections.push(`${i + 1}. **${g.title}**${g.monthly_slice ? ` — ${g.monthly_slice}` : ''}`));
    sections.push('');
  }

  if (projects.length > 0) {
    sections.push('## Active projects');
    projects.forEach((p: any) => sections.push(`- **${p.title}** (${p.status})`));
    sections.push('');
  }

  const weeklyReviews = monthEntries.filter((e: any) => e.kind === 'review' && e.links?.scope === 'week');
  if (weeklyReviews.length > 0) {
    sections.push('## Weekly reviews this month');
    weeklyReviews.forEach((r: any) => {
      const at = new Date(r.at);
      const label = r.links?.week_id || at.toLocaleString('en-US', { month: 'short', day: 'numeric' });
      sections.push(`- **${label}**: ${stripJsonTail(r.body_markdown).slice(0, 400)}`);
    });
    sections.push('');
  }

  sections.push(
    '## Your task',
    `Generate a monthly review in plain prose (≤4 short paragraphs). Reflect on what the user moved through ${monthName} relative to their goals and monthly slices. Name what served them, what didn't. Plant directional seeds for next month. Speak directly to them ("you"). Tone: warm, perspective-taking.`,
    '',
    'Then append a structured JSON tail summarizing the month.',
  );

  return sections.join('\n');
}

async function assembleInputForSkill(
  sb: SupabaseClient,
  skill: string,
  userId: string,
  firedAt: Date,
): Promise<string> {
  switch (skill) {
    case 'daily-brief':    return assembleBriefInput(sb, userId, firedAt);
    case 'daily-review':   return assembleReviewInput(sb, userId, firedAt);
    case 'weekly-review':  return assembleWeeklyInput(sb, userId, firedAt);
    case 'monthly-review': return assembleMonthlyInput(sb, userId, firedAt);
    default: throw new Error(`unsupported skill: ${skill}`);
  }
}

// ---------- ma-proxy call ----------

async function callMaProxy(supabaseUrl: string, serviceRoleKey: string, skill: string, input: string): Promise<MaProxyResponse> {
  const endpoint = `${supabaseUrl.replace(/\/+$/, '')}/functions/v1/ma-proxy`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Edge → Edge calls inside the same project still need an Authorization
      // header per Supabase function gateway. Service-role key is fine here.
      'Authorization': `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify({ skill, input }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`ma-proxy responded ${res.status}: ${detail}`);
  }
  return await res.json() as MaProxyResponse;
}

// ---------- handler ----------

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return errResp(405, 'method not allowed; use POST');
  }

  // Auth: verify the bearer token is a service_role JWT for this project.
  // `verify_jwt: true` in supabase/config.toml gates signature validation at the
  // Supabase function gateway — by the time we get here, the JWT is signed by
  // the project's secret. We decode the payload to check it's a service_role
  // token (not anon, not user). This avoids strict-equality against
  // SUPABASE_SERVICE_ROLE_KEY which can fail under key rotation / new-API-key migration.
  const authHeader = req.headers.get('Authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  if (!token) {
    return errResp(401, 'missing Authorization header');
  }
  let claims: { role?: string; ref?: string; exp?: number };
  try {
    // JWT format: header.payload.signature — we only need the payload (middle part)
    const payloadB64 = token.split('.')[1];
    if (!payloadB64) throw new Error('malformed JWT');
    // base64url → base64 → decode
    const padded = payloadB64.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(payloadB64.length / 4) * 4, '=');
    const jsonStr = atob(padded);
    claims = JSON.parse(jsonStr);
  } catch (_e) {
    return errResp(401, 'unauthorized — invalid JWT format');
  }
  if (claims.role !== 'service_role') {
    return errResp(401, `unauthorized — token role is "${claims.role}", expected service_role`);
  }
  // Optional sanity: expired check (gateway should already enforce, but cheap defense-in-depth)
  if (claims.exp && claims.exp * 1000 < Date.now()) {
    return errResp(401, 'unauthorized — token expired');
  }
  // We still need the service-role key for the Supabase client — read from env (must exist for DB writes)
  const expectedAuth = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!expectedAuth) {
    return errResp(500, 'server misconfigured: missing SUPABASE_SERVICE_ROLE_KEY');
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return errResp(400, 'invalid JSON body');
  }
  const payload = parsePayload(raw);
  if (!payload) {
    return errResp(400, 'invalid payload — expected {cron_log_id, user_id, skill, fired_at}');
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  if (!supabaseUrl) {
    return errResp(500, 'server misconfigured: missing SUPABASE_URL');
  }
  const sb = createClient(supabaseUrl, expectedAuth, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const firedAt = new Date(payload.fired_at);
  const shape = entryShapeForSkill(payload.skill, firedAt);

  // Try-catch around the whole pipeline so any failure marks the cron_log
  // row with the error and returns 5xx rather than orphaning the row.
  try {
    const input = await assembleInputForSkill(sb, payload.skill, payload.user_id, firedAt);
    const ma = await callMaProxy(supabaseUrl, expectedAuth, payload.skill, input);

    if (ma.status !== 'idle' || !ma.finalText) {
      throw new Error(`ma-proxy returned status=${ma.status}: ${ma.error?.message ?? '(no detail)'}`);
    }

    // Insert the entries row first so a successful entry persists even if
    // the cron_log update somehow fails after.
    const insRes = await sb.from('entries').insert({
      user_id:       payload.user_id,
      at:            firedAt.toISOString(),
      kind:          shape.kind,
      title:         shape.title,
      body_markdown: ma.finalText,
      source:        'agent-scheduled',
      links:         shape.links,
    }).select('id').single();

    if (insRes.error) throw new Error(`entries insert failed: ${insRes.error.message}`);

    const updRes = await sb.from('cron_log')
      .update({
        dispatched: true,
        metadata:   {
          phase: 'completed',
          entry_id: insRes.data?.id ?? null,
          ma_session_id: ma.sessionId,
        },
      })
      .eq('id', payload.cron_log_id);

    if (updRes.error) {
      console.error('[dispatch-skill] cron_log update failed', updRes.error);
      // Don't fail the whole call — the entry already landed.
    }

    return json({
      ok: true,
      cron_log_id: payload.cron_log_id,
      entry_id: insRes.data?.id ?? null,
      skill: payload.skill,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[dispatch-skill] dispatch failed', payload, message);

    // Best-effort: stamp the failure into cron_log.metadata. If even this
    // fails, the function still returns 5xx so the caller knows.
    await sb.from('cron_log')
      .update({
        dispatched: false,
        metadata: { phase: 'failed', error: message },
      })
      .eq('id', payload.cron_log_id);

    return errResp(500, 'dispatch failed', message);
  }
});
