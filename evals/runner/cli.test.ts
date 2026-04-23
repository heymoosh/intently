import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  parseArgs,
  runCli,
  stubExecutor,
  stubScorer,
  CliUsageError,
} from './cli';

// ---------- parseArgs ----------

test('parseArgs requires --skill', () => {
  assert.throws(() => parseArgs([]), CliUsageError);
});

test('parseArgs accepts --skill and defaults evalsRoot to <cwd>/evals', () => {
  const args = parseArgs(['--skill', 'daily-brief']);
  assert.equal(args.skill, 'daily-brief');
  assert.ok(args.evalsRoot.endsWith('/evals'));
  assert.equal(args.prettyPrint, false);
  assert.equal(args.out, undefined);
});

test('parseArgs handles --skill=value form', () => {
  const args = parseArgs(['--skill=weekly-review', '--evals-root=/tmp/evals', '--pretty']);
  assert.equal(args.skill, 'weekly-review');
  assert.equal(args.evalsRoot, '/tmp/evals');
  assert.equal(args.prettyPrint, true);
});

test('parseArgs rejects unknown flags with usage text', () => {
  assert.throws(
    () => parseArgs(['--skill', 'daily-brief', '--something-else']),
    (err: unknown) => err instanceof CliUsageError && err.message.includes('Unknown argument'),
  );
});

test('parseArgs rejects a flag followed by another flag', () => {
  assert.throws(
    () => parseArgs(['--skill', '--pretty']),
    (err: unknown) => err instanceof CliUsageError && err.message.includes('--skill'),
  );
});

test('parseArgs --help surfaces as a usage error (caller decides exit code)', () => {
  assert.throws(
    () => parseArgs(['--help']),
    (err: unknown) => err instanceof CliUsageError && err.message.includes('Usage:'),
  );
});

test('parseArgs accepts --scorer claude and --scorer=stub', () => {
  const a = parseArgs(['--skill', 'daily-brief', '--scorer', 'claude']);
  assert.equal(a.scorer, 'claude');
  const b = parseArgs(['--skill', 'daily-brief', '--scorer=stub']);
  assert.equal(b.scorer, 'stub');
});

test('parseArgs rejects unknown --scorer value', () => {
  assert.throws(
    () => parseArgs(['--skill', 'daily-brief', '--scorer', 'gpt']),
    (err: unknown) => err instanceof CliUsageError && err.message.includes('"stub" or "claude"'),
  );
});

// ---------- runCli ----------

type EvalRoot = { root: string; cleanup: () => Promise<void> };

async function makeEvalRoot(skill: string, opts: {
  cases: Array<{ id: string; input: unknown; expected?: unknown }>;
  minScores?: Record<string, number>;
}): Promise<EvalRoot> {
  const root = await mkdtemp(join(tmpdir(), 'intently-eval-cli-'));
  await mkdir(join(root, 'datasets', skill), { recursive: true });
  await mkdir(join(root, 'rubrics', skill), { recursive: true });
  await mkdir(join(root, 'baselines'), { recursive: true });

  await writeFile(
    join(root, 'datasets', skill, 'cases.json'),
    JSON.stringify({ skill, cases: opts.cases }),
  );
  await writeFile(
    join(root, 'rubrics', skill, 'rubric.json'),
    JSON.stringify({
      skill,
      axes: [
        { name: 'relevance', description: 'matches user intent' },
      ],
    }),
  );
  await writeFile(
    join(root, 'baselines', `${skill}.json`),
    JSON.stringify({
      skill,
      minScores: opts.minScores ?? { relevance: 0.5 },
      updatedAt: '2026-04-23T00:00:00Z',
    }),
  );

  return { root, cleanup: () => rm(root, { recursive: true, force: true }) };
}

test('runCli: all cases pass when stub executor echoes a matching expected', async () => {
  const { root, cleanup } = await makeEvalRoot('daily-brief', {
    cases: [
      { id: 'c1', input: 'hello', expected: 'hello' },
      { id: 'c2', input: { x: 1 }, expected: { x: 1 } },
    ],
  });
  try {
    const { report, exitCode } = await runCli(
      { skill: 'daily-brief', evalsRoot: root, prettyPrint: false },
    );
    assert.equal(report.passCount, 2);
    assert.equal(report.failCount, 0);
    assert.equal(exitCode, 0);
  } finally {
    await cleanup();
  }
});

test('runCli: exits 1 when any case fails baseline', async () => {
  const { root, cleanup } = await makeEvalRoot('daily-brief', {
    cases: [
      { id: 'c1', input: 'hello', expected: 'hello' },
      { id: 'c2', input: 'a', expected: 'b' }, // stub scorer → 0
    ],
  });
  try {
    const { report, exitCode } = await runCli(
      { skill: 'daily-brief', evalsRoot: root, prettyPrint: false },
    );
    assert.equal(report.passCount, 1);
    assert.equal(report.failCount, 1);
    assert.equal(exitCode, 1);
  } finally {
    await cleanup();
  }
});

test('runCli writes report to --out when provided, skipping stdout', async () => {
  const { root, cleanup } = await makeEvalRoot('daily-brief', {
    cases: [{ id: 'c1', input: 'x', expected: 'x' }],
  });
  try {
    const outPath = join(root, 'out.json');
    const { exitCode, stdout } = await runCli(
      { skill: 'daily-brief', evalsRoot: root, out: outPath, prettyPrint: true },
    );
    assert.equal(exitCode, 0);
    const onDisk = await readFile(outPath, 'utf8');
    assert.equal(onDisk, stdout);
    const parsed = JSON.parse(onDisk);
    assert.equal(parsed.skill, 'daily-brief');
    assert.equal(parsed.passCount, 1);
    // pretty-print → indentation present
    assert.ok(onDisk.includes('\n  '));
  } finally {
    await cleanup();
  }
});

test('runCli accepts injected executeFn and scoreFn overrides', async () => {
  const { root, cleanup } = await makeEvalRoot('daily-brief', {
    cases: [{ id: 'c1', input: 1, expected: 2 }],
  });
  try {
    let calledExecute = 0;
    let calledScore = 0;
    const { report, exitCode } = await runCli(
      { skill: 'daily-brief', evalsRoot: root, prettyPrint: false },
      {
        executeFn: async () => {
          calledExecute++;
          return 'overridden';
        },
        scoreFn: async ({ rubric }) => {
          calledScore++;
          const scores: Record<string, number> = {};
          for (const a of rubric.axes) scores[a.name] = 1;
          return scores;
        },
      },
    );
    assert.equal(calledExecute, 1);
    assert.equal(calledScore, 1);
    assert.equal(report.passCount, 1);
    assert.equal(exitCode, 0);
  } finally {
    await cleanup();
  }
});

// ---------- stub executor / scorer ----------

test('stubExecutor echoes input under a tagged envelope', async () => {
  const out = (await stubExecutor('hello', 'case-1')) as Record<string, unknown>;
  assert.equal(out.kind, 'stub');
  assert.equal(out.caseId, 'case-1');
  assert.equal(out.input, 'hello');
  assert.match(String(out.note), /no real executor/i);
});

test('stubScorer returns 1.0 on every axis when output.input deep-equals expected', async () => {
  const scores = await stubScorer({
    input: 'x',
    output: { kind: 'stub', caseId: 'c1', input: 'x' },
    expected: 'x',
    rubric: {
      skill: 'daily-brief',
      axes: [
        { name: 'relevance', description: '' },
        { name: 'latency', description: '' },
      ],
    },
    caseId: 'c1',
  });
  assert.equal(scores.relevance, 1);
  assert.equal(scores.latency, 1);
});

test('stubScorer returns 0 on every axis when output and expected diverge', async () => {
  const scores = await stubScorer({
    input: 'x',
    output: { kind: 'stub', caseId: 'c1', input: 'x' },
    expected: 'y',
    rubric: {
      skill: 'daily-brief',
      axes: [{ name: 'relevance', description: '' }],
    },
    caseId: 'c1',
  });
  assert.equal(scores.relevance, 0);
});
