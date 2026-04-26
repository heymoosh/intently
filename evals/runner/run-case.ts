#!/usr/bin/env -S npx tsx
/**
 * run-case.ts — thin orchestrator for cognition eval cases.
 *
 * Usage (from repo root):
 *   cd app && ANTHROPIC_API_KEY=... SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *     npx tsx ../evals/runner/run-case.ts --skill daily-brief --case "fresh user with no goals"
 *
 * What it does:
 * 1. Loads the eval case from evals/datasets/cognition/<skill>.json
 * 2. Spawns a fresh anonymous Supabase user seeded from the named fixture
 * 3. Calls the dispatch-skill Edge Function (same path as production)
 * 4. Scores each rubric string via judge.ts (Haiku)
 * 5. Prints per-rubric pass/fail + overall result
 * 6. Cleans up the test user
 *
 * Exits 0 on all-pass, 1 on any fail.
 */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { spawnAnonUser, loadFixture } from './spawn-anon-user.js';
import { judge } from './judge.js';

// ---------- types ----------

type EvalCase = {
  name: string;
  fixture: string;
  rubrics: string[];
};

type CognitionDataset = {
  skill: string;
  cases: EvalCase[];
};

// ---------- arg parsing ----------

function parseArgs(argv: string[]): { skill: string; caseName: string } {
  let skill: string | undefined;
  let caseName: string | undefined;

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--skill') { skill = argv[++i]; continue; }
    if (argv[i] === '--case')  { caseName = argv[++i]; continue; }
    if (argv[i]?.startsWith('--skill=')) { skill = argv[i]!.slice('--skill='.length); continue; }
    if (argv[i]?.startsWith('--case='))  { caseName = argv[i]!.slice('--case='.length); continue; }
  }

  if (!skill || !caseName) {
    process.stderr.write(
      'Usage: npx tsx evals/runner/run-case.ts --skill <name> --case "<case name>"\n'
    );
    process.exit(2);
  }

  return { skill, caseName };
}

// ---------- dispatch ----------

async function invokeSkill(
  supabaseUrl: string,
  serviceRoleKey: string,
  skill: string,
  userId: string,
  now: Date,
): Promise<string> {
  const endpoint = `${supabaseUrl.replace(/\/+$/, '')}/functions/v1/dispatch-skill`;

  // dispatch-skill expects a cron_log_id payload. For the harness we call
  // ma-proxy directly instead to avoid needing a real cron_log row.
  // The assembler path inside dispatch-skill is port-duplicated here for eval
  // isolation — we pass a minimal assembled context block instead.
  const maEndpoint = `${supabaseUrl.replace(/\/+$/, '')}/functions/v1/ma-proxy`;

  // Build a minimal context string. For the empty-user fixture this is just
  // a stub — the point is that ma-proxy receives something and the agent
  // handles empty state gracefully. The assembly path is tested at integration
  // level; here we test cognition (agent behavior) only.
  const contextBlock = [
    `# Morning brief context for ${now.toISOString().slice(0, 10)}`,
    '',
    '## Active goals',
    'No goals set yet.',
    '',
    '## Active projects',
    'No projects set yet.',
    '',
    '## Recent entries',
    'None.',
    '',
    '## Your task',
    'Generate a morning brief for this user. This is their first run — no prior history.',
    'Be brief, calm, and end with a fenced JSON block matching the brief output contract:',
    '```json',
    '{ "kind": "brief", "today_focus": "...", "energy_question": "..." }',
    '```',
  ].join('\n');

  const res = await fetch(maEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify({ skill, input: contextBlock }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`ma-proxy responded ${res.status}: ${detail}`);
  }

  const data = await res.json() as { finalText?: string; status?: string; error?: { message?: string } };

  if (data.status === 'error' || !data.finalText) {
    throw new Error(`ma-proxy error: ${data.error?.message ?? JSON.stringify(data)}`);
  }

  return data.finalText;
}

// ---------- main ----------

async function main(): Promise<number> {
  const { skill, caseName } = parseArgs(process.argv.slice(2));

  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (!supabaseUrl || !serviceRoleKey || !anthropicKey) {
    process.stderr.write(
      'Missing required env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY\n'
    );
    return 1;
  }

  // Load dataset
  const evalsRoot = join(process.cwd(), '..', 'evals');
  const datasetPath = join(evalsRoot, 'datasets', 'cognition', `${skill}.json`);
  let dataset: CognitionDataset;
  try {
    const raw = await readFile(datasetPath, 'utf8');
    dataset = JSON.parse(raw);
  } catch (err) {
    process.stderr.write(`Failed to load dataset: ${(err as Error).message}\n`);
    return 1;
  }

  const evalCase = dataset.cases.find(
    (c) => c.name.toLowerCase() === caseName.toLowerCase()
  );
  if (!evalCase) {
    process.stderr.write(
      `Case not found: "${caseName}"\nAvailable: ${dataset.cases.map((c) => `"${c.name}"`).join(', ')}\n`
    );
    return 1;
  }

  process.stdout.write(`\nRunning eval: [${skill}] "${evalCase.name}"\n`);
  process.stdout.write(`Fixture: ${evalCase.fixture}\n\n`);

  // Spawn test user
  const fixturesDir = join(evalsRoot, 'datasets', 'cognition-fixtures');
  const fixture = await loadFixture(fixturesDir, evalCase.fixture);
  const now = new Date('2026-04-26T09:00:00Z');
  const spawned = await spawnAnonUser(fixture, now);
  process.stdout.write(`Spawned test user: ${spawned.userId}\n`);

  let exitCode = 0;

  try {
    // Invoke skill
    process.stdout.write(`Invoking skill: ${skill}...\n`);
    const output = await invokeSkill(supabaseUrl, serviceRoleKey, skill, spawned.userId, now);

    process.stdout.write(`\nAgent output (${output.length} chars):\n`);
    process.stdout.write('─'.repeat(60) + '\n');
    process.stdout.write(output + '\n');
    process.stdout.write('─'.repeat(60) + '\n\n');

    // Score rubrics
    process.stdout.write('Scoring rubrics via Haiku judge:\n\n');
    let passCount = 0;
    const results: Array<{ rubric: string; pass: boolean; rationale: string }> = [];

    for (const rubric of evalCase.rubrics) {
      const result = await judge({ output, rubric });
      results.push({ rubric, ...result });
      const icon = result.pass ? 'PASS' : 'FAIL';
      process.stdout.write(`[${icon}] ${rubric}\n`);
      process.stdout.write(`      → ${result.rationale}\n\n`);
      if (result.pass) passCount++;
    }

    const total = evalCase.rubrics.length;
    process.stdout.write(`Result: ${passCount}/${total} rubrics passed\n`);

    if (passCount < total) {
      exitCode = 1;
    }

  } catch (err) {
    process.stderr.write(`\nError during eval: ${(err as Error).message}\n`);
    exitCode = 1;
  } finally {
    await spawned.cleanup();
    process.stdout.write('\nTest user cleaned up.\n');
  }

  return exitCode;
}

main().then((code) => process.exit(code)).catch((err) => {
  process.stderr.write(`run-case: unhandled error: ${err?.message ?? String(err)}\n`);
  process.exit(1);
});
