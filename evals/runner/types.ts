/**
 * Type contracts for the eval harness. Shape is deliberately minimal — v1
 * proves the pass/fail plumbing end-to-end. Latency and cost axes are named
 * as first-class axes rather than special-cased fields so the rubric stays
 * uniform.
 */

export type EvalCase = {
  id: string;
  input: unknown;
  expected?: unknown;
  notes?: string;
};

export type Dataset = {
  skill: string;
  cases: EvalCase[];
};

export type RubricAxis = {
  name: string;
  description: string;
  scale?: { min: number; max: number };
};

export type Rubric = {
  skill: string;
  axes: RubricAxis[];
};

export type Baseline = {
  skill: string;
  minScores: Record<string, number>;
  updatedAt: string;
};

export type AxisScores = Record<string, number>;

export type CaseResult = {
  caseId: string;
  scores: AxisScores;
  pass: boolean;
  executionMs: number;
  notes?: string;
  error?: string;
};

export type RegressionFinding = {
  caseId: string;
  axis: string;
  baselineMin: number;
  observed: number;
};

export type EvalReport = {
  skill: string;
  ranAt: string;
  passCount: number;
  failCount: number;
  cases: CaseResult[];
  regressions: RegressionFinding[];
};

export type ExecuteFn = (input: unknown, caseId: string) => Promise<unknown>;

export type ScoreFn = (args: {
  input: unknown;
  output: unknown;
  expected: unknown;
  rubric: Rubric;
  caseId: string;
}) => Promise<AxisScores>;

export class EvalError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'EvalError';
  }
}
