import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  Dataset,
  Rubric,
  Baseline,
  EvalReport,
  ExecuteFn,
  ScoreFn,
  CaseResult,
  RegressionFinding,
  AxisScores,
  EvalError,
} from './types';

export type RunOptions = {
  dataset: Dataset;
  rubric: Rubric;
  baseline: Baseline;
  executeFn: ExecuteFn;
  scoreFn: ScoreFn;
  now?: Date;
};

export async function runEval(opts: RunOptions): Promise<EvalReport> {
  const { dataset, rubric, baseline, executeFn, scoreFn } = opts;
  const ranAt = (opts.now ?? new Date()).toISOString();

  if (dataset.skill !== rubric.skill || dataset.skill !== baseline.skill) {
    throw new EvalError(
      `Skill mismatch: dataset=${dataset.skill} rubric=${rubric.skill} baseline=${baseline.skill}`
    );
  }

  const caseResults: CaseResult[] = [];

  for (const c of dataset.cases) {
    const started = nowMs();
    let output: unknown;
    let execError: string | undefined;
    try {
      output = await executeFn(c.input, c.id);
    } catch (err) {
      execError = (err as Error).message ?? 'execute failed';
    }

    let scores: AxisScores = {};
    if (execError === undefined) {
      try {
        scores = await scoreFn({
          input: c.input,
          output,
          expected: c.expected,
          rubric,
          caseId: c.id,
        });
      } catch (err) {
        execError = `score failed: ${(err as Error).message ?? String(err)}`;
      }
    }

    const executionMs = nowMs() - started;
    const pass =
      execError === undefined && passesBaseline(scores, baseline.minScores);

    caseResults.push({
      caseId: c.id,
      scores,
      pass,
      executionMs,
      notes: c.notes,
      error: execError,
    });
  }

  const regressions = collectRegressions(caseResults, baseline);

  return {
    skill: dataset.skill,
    ranAt,
    passCount: caseResults.filter((r) => r.pass).length,
    failCount: caseResults.filter((r) => !r.pass).length,
    cases: caseResults,
    regressions,
  };
}

function passesBaseline(scores: AxisScores, minScores: Record<string, number>): boolean {
  for (const [axis, min] of Object.entries(minScores)) {
    const observed = scores[axis];
    if (observed === undefined || observed < min) {
      return false;
    }
  }
  return true;
}

function collectRegressions(
  caseResults: CaseResult[],
  baseline: Baseline
): RegressionFinding[] {
  const regressions: RegressionFinding[] = [];
  for (const r of caseResults) {
    for (const [axis, min] of Object.entries(baseline.minScores)) {
      const observed = r.scores[axis];
      if (observed !== undefined && observed < min) {
        regressions.push({
          caseId: r.caseId,
          axis,
          baselineMin: min,
          observed,
        });
      }
    }
  }
  return regressions;
}

function nowMs(): number {
  const h = (globalThis as unknown as { performance?: { now(): number } }).performance;
  if (h && typeof h.now === 'function') return h.now();
  return Date.now();
}

// ---------- loaders ----------

export async function loadDataset(evalsRoot: string, skill: string): Promise<Dataset> {
  const path = join(evalsRoot, 'datasets', skill, 'cases.json');
  const raw = await readJson(path, `dataset for ${skill}`);
  assertIsObject(raw, path);
  if (raw.skill !== skill) {
    throw new EvalError(
      `Dataset at ${path} has skill="${raw.skill}" but expected "${skill}"`
    );
  }
  if (!Array.isArray(raw.cases)) {
    throw new EvalError(`Dataset at ${path} missing cases[] array`);
  }
  return raw as unknown as Dataset;
}

export async function loadRubric(evalsRoot: string, skill: string): Promise<Rubric> {
  const path = join(evalsRoot, 'rubrics', skill, 'rubric.json');
  const raw = await readJson(path, `rubric for ${skill}`);
  assertIsObject(raw, path);
  if (raw.skill !== skill) {
    throw new EvalError(
      `Rubric at ${path} has skill="${raw.skill}" but expected "${skill}"`
    );
  }
  if (!Array.isArray(raw.axes)) {
    throw new EvalError(`Rubric at ${path} missing axes[] array`);
  }
  return raw as unknown as Rubric;
}

export async function loadBaseline(evalsRoot: string, skill: string): Promise<Baseline> {
  const path = join(evalsRoot, 'baselines', `${skill}.json`);
  const raw = await readJson(path, `baseline for ${skill}`);
  assertIsObject(raw, path);
  if (raw.skill !== skill) {
    throw new EvalError(
      `Baseline at ${path} has skill="${raw.skill}" but expected "${skill}"`
    );
  }
  if (!raw.minScores || typeof raw.minScores !== 'object') {
    throw new EvalError(`Baseline at ${path} missing minScores object`);
  }
  return raw as unknown as Baseline;
}

async function readJson(path: string, label: string): Promise<Record<string, unknown>> {
  try {
    const text = await readFile(path, 'utf8');
    return JSON.parse(text);
  } catch (err) {
    throw new EvalError(`Failed to load ${label} from ${path}: ${(err as Error).message}`, err);
  }
}

function assertIsObject(
  raw: unknown,
  path: string
): asserts raw is Record<string, unknown> {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new EvalError(`Expected JSON object at ${path}, got ${typeof raw}`);
  }
}
