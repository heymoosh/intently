import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  runEval,
  loadDataset,
  loadRubric,
  loadBaseline,
} from './runner';
import {
  Dataset,
  Rubric,
  Baseline,
  EvalError,
  ExecuteFn,
  ScoreFn,
} from './types';

const baseRubric: Rubric = {
  skill: 'daily-brief',
  axes: [
    { name: 'relevance', description: 'matches user intent' },
    { name: 'latency', description: 'ms elapsed', scale: { min: 0, max: 1 } },
  ],
};

const baseBaseline: Baseline = {
  skill: 'daily-brief',
  minScores: { relevance: 0.7, latency: 0.5 },
  updatedAt: '2026-04-23T00:00:00Z',
};

const twoCaseDataset: Dataset = {
  skill: 'daily-brief',
  cases: [
    { id: 'case-01', input: { date: '2026-04-23' }, expected: 'a brief' },
    { id: 'case-02', input: { date: '2026-04-24' }, expected: 'another brief' },
  ],
};

const echoExecute: ExecuteFn = async (input) => input;

const fixedScore = (scores: Record<string, number>): ScoreFn =>
  async () => scores;

test('runEval reports all cases passing when scores clear baseline', async () => {
  const report = await runEval({
    dataset: twoCaseDataset,
    rubric: baseRubric,
    baseline: baseBaseline,
    executeFn: echoExecute,
    scoreFn: fixedScore({ relevance: 0.9, latency: 0.8 }),
    now: new Date('2026-04-23T01:00:00Z'),
  });

  assert.equal(report.skill, 'daily-brief');
  assert.equal(report.ranAt, '2026-04-23T01:00:00.000Z');
  assert.equal(report.passCount, 2);
  assert.equal(report.failCount, 0);
  assert.equal(report.regressions.length, 0);
  for (const c of report.cases) {
    assert.ok(c.pass);
    assert.equal(typeof c.executionMs, 'number');
  }
});

test('runEval flags a case that misses one axis baseline', async () => {
  const report = await runEval({
    dataset: twoCaseDataset,
    rubric: baseRubric,
    baseline: baseBaseline,
    executeFn: echoExecute,
    scoreFn: fixedScore({ relevance: 0.4, latency: 0.9 }),
  });

  assert.equal(report.passCount, 0);
  assert.equal(report.failCount, 2);
  // Both cases miss the relevance axis; latency passes. 2 cases × 1 axis = 2 regressions.
  assert.equal(report.regressions.length, 2);
  for (const r of report.regressions) {
    assert.equal(r.axis, 'relevance');
    assert.equal(r.baselineMin, 0.7);
    assert.equal(r.observed, 0.4);
  }
});

test('runEval treats missing axis score as a failure', async () => {
  const report = await runEval({
    dataset: twoCaseDataset,
    rubric: baseRubric,
    baseline: baseBaseline,
    executeFn: echoExecute,
    scoreFn: fixedScore({ relevance: 0.9 }), // missing latency
  });

  assert.equal(report.passCount, 0);
  assert.equal(report.failCount, 2);
});

test('runEval captures execute errors and marks the case failed', async () => {
  const brokenExecute: ExecuteFn = async (_input, caseId) => {
    throw new Error(`boom for ${caseId}`);
  };

  const report = await runEval({
    dataset: twoCaseDataset,
    rubric: baseRubric,
    baseline: baseBaseline,
    executeFn: brokenExecute,
    scoreFn: fixedScore({ relevance: 1, latency: 1 }),
  });

  assert.equal(report.failCount, 2);
  assert.equal(report.passCount, 0);
  assert.match(report.cases[0]!.error!, /boom for case-01/);
});

test('runEval captures score errors separately from execute errors', async () => {
  const brokenScore: ScoreFn = async () => {
    throw new Error('scorer crashed');
  };

  const report = await runEval({
    dataset: twoCaseDataset,
    rubric: baseRubric,
    baseline: baseBaseline,
    executeFn: echoExecute,
    scoreFn: brokenScore,
  });

  assert.equal(report.failCount, 2);
  for (const c of report.cases) {
    assert.match(c.error!, /score failed: scorer crashed/);
  }
});

test('runEval throws when dataset/rubric/baseline skills disagree', async () => {
  await assert.rejects(
    () =>
      runEval({
        dataset: { ...twoCaseDataset, skill: 'daily-review' },
        rubric: baseRubric,
        baseline: baseBaseline,
        executeFn: echoExecute,
        scoreFn: fixedScore({ relevance: 1, latency: 1 }),
      }),
    (err: unknown) => err instanceof EvalError && err.message.includes('Skill mismatch')
  );
});

test('runEval handles an empty case list cleanly', async () => {
  const report = await runEval({
    dataset: { skill: 'daily-brief', cases: [] },
    rubric: baseRubric,
    baseline: baseBaseline,
    executeFn: echoExecute,
    scoreFn: fixedScore({ relevance: 1, latency: 1 }),
  });

  assert.equal(report.passCount, 0);
  assert.equal(report.failCount, 0);
  assert.equal(report.cases.length, 0);
});

// ---------- loader tests ----------

async function makeEvalRoot(): Promise<{ root: string; cleanup: () => Promise<void> }> {
  const root = await mkdtemp(join(tmpdir(), 'intently-evals-'));
  await mkdir(join(root, 'datasets', 'daily-brief'), { recursive: true });
  await mkdir(join(root, 'rubrics', 'daily-brief'), { recursive: true });
  await mkdir(join(root, 'baselines'), { recursive: true });
  return {
    root,
    cleanup: () => rm(root, { recursive: true, force: true }),
  };
}

test('loadDataset reads and validates a cases file', async () => {
  const { root, cleanup } = await makeEvalRoot();
  try {
    await writeFile(
      join(root, 'datasets', 'daily-brief', 'cases.json'),
      JSON.stringify(twoCaseDataset)
    );
    const ds = await loadDataset(root, 'daily-brief');
    assert.equal(ds.skill, 'daily-brief');
    assert.equal(ds.cases.length, 2);
  } finally {
    await cleanup();
  }
});

test('loadDataset rejects a file whose skill field disagrees with the requested skill', async () => {
  const { root, cleanup } = await makeEvalRoot();
  try {
    await writeFile(
      join(root, 'datasets', 'daily-brief', 'cases.json'),
      JSON.stringify({ skill: 'daily-review', cases: [] })
    );
    await assert.rejects(
      () => loadDataset(root, 'daily-brief'),
      (err: unknown) => err instanceof EvalError && err.message.includes('daily-review')
    );
  } finally {
    await cleanup();
  }
});

test('loadRubric reads and validates a rubric file', async () => {
  const { root, cleanup } = await makeEvalRoot();
  try {
    await writeFile(
      join(root, 'rubrics', 'daily-brief', 'rubric.json'),
      JSON.stringify(baseRubric)
    );
    const r = await loadRubric(root, 'daily-brief');
    assert.equal(r.axes.length, 2);
  } finally {
    await cleanup();
  }
});

test('loadBaseline reads and validates a baseline file', async () => {
  const { root, cleanup } = await makeEvalRoot();
  try {
    await writeFile(
      join(root, 'baselines', 'daily-brief.json'),
      JSON.stringify(baseBaseline)
    );
    const b = await loadBaseline(root, 'daily-brief');
    assert.equal(b.minScores.relevance, 0.7);
  } finally {
    await cleanup();
  }
});

test('loaders wrap fs errors in EvalError', async () => {
  await assert.rejects(
    () => loadDataset('/does/not/exist', 'daily-brief'),
    (err: unknown) => err instanceof EvalError && err.message.includes('daily-brief')
  );
});

test('loaders reject a baseline with the wrong skill field', async () => {
  const { root, cleanup } = await makeEvalRoot();
  try {
    await writeFile(
      join(root, 'baselines', 'daily-brief.json'),
      JSON.stringify({ skill: 'daily-review', minScores: {}, updatedAt: 'x' })
    );
    await assert.rejects(
      () => loadBaseline(root, 'daily-brief'),
      (err: unknown) => err instanceof EvalError
    );
  } finally {
    await cleanup();
  }
});
