import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { loadDataset, loadRubric, loadBaseline, runEval } from './runner';
import type { EvalReport, ExecuteFn, ScoreFn, AxisScores } from './types';
import { EvalError } from './types';

export type CliArgs = {
  skill: string;
  evalsRoot: string;
  out?: string;
  prettyPrint: boolean;
};

export class CliUsageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CliUsageError';
  }
}

const USAGE = [
  'Usage: eval-runner --skill <name> [--evals-root <path>] [--out <path>] [--pretty]',
  '',
  'Options:',
  '  --skill <name>         Required. Which skill to run the eval batch against.',
  '  --evals-root <path>    Default: <cwd>/evals. Root of datasets/rubrics/baselines.',
  '  --out <path>           If set, write the JSON report to this path.',
  '                         Otherwise the report is printed to stdout.',
  '  --pretty               Format JSON output with 2-space indentation.',
  '  --help, -h             Show this message.',
].join('\n');

export function parseArgs(argv: string[]): CliArgs {
  let skill: string | undefined;
  let evalsRoot: string | undefined;
  let out: string | undefined;
  let prettyPrint = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case '--help':
      case '-h':
        throw new CliUsageError(USAGE);
      case '--skill':
        skill = requireValue(argv, i, '--skill');
        i++;
        break;
      case '--evals-root':
        evalsRoot = requireValue(argv, i, '--evals-root');
        i++;
        break;
      case '--out':
        out = requireValue(argv, i, '--out');
        i++;
        break;
      case '--pretty':
        prettyPrint = true;
        break;
      default:
        if (arg !== undefined && arg.startsWith('--skill=')) {
          skill = arg.slice('--skill='.length);
        } else if (arg !== undefined && arg.startsWith('--evals-root=')) {
          evalsRoot = arg.slice('--evals-root='.length);
        } else if (arg !== undefined && arg.startsWith('--out=')) {
          out = arg.slice('--out='.length);
        } else {
          throw new CliUsageError(`Unknown argument: ${arg}\n\n${USAGE}`);
        }
    }
  }

  if (!skill) {
    throw new CliUsageError(`Missing required --skill\n\n${USAGE}`);
  }

  return {
    skill,
    evalsRoot: evalsRoot ?? join(process.cwd(), 'evals'),
    out,
    prettyPrint,
  };
}

function requireValue(argv: string[], i: number, flag: string): string {
  const v = argv[i + 1];
  if (v === undefined || v.startsWith('--')) {
    throw new CliUsageError(`${flag} requires a value\n\n${USAGE}`);
  }
  return v;
}

/**
 * Stub executor used when no real skill runtime is available yet. Echoes the
 * input so scorers can compare against `expected` without the harness
 * pretending to have a working agent. Friday swaps this for a real
 * Managed-Agents-SDK-backed executor.
 */
export const stubExecutor: ExecuteFn = async (input, caseId) => ({
  kind: 'stub',
  caseId,
  note: 'no real executor wired; returned input unchanged',
  input,
});

/**
 * Stub scorer: returns 1.0 on every rubric axis if the executor output
 * contains the expected value (deep-equal via JSON comparison); 0.0 otherwise.
 * Exists to prove the end-to-end plumbing before a real LLM judge arrives.
 */
export const stubScorer: ScoreFn = async ({ output, expected, rubric }) => {
  const passed = deepEqualJson(extractStubInput(output), expected);
  const scores: AxisScores = {};
  for (const axis of rubric.axes) {
    scores[axis.name] = passed ? 1 : 0;
  }
  return scores;
};

function extractStubInput(output: unknown): unknown {
  if (
    output &&
    typeof output === 'object' &&
    (output as { kind?: string }).kind === 'stub'
  ) {
    return (output as { input?: unknown }).input;
  }
  return output;
}

function deepEqualJson(a: unknown, b: unknown): boolean {
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

export type RunCliOptions = {
  executeFn?: ExecuteFn;
  scoreFn?: ScoreFn;
  now?: Date;
  writeFileFn?: (path: string, data: string) => Promise<void>;
};

export type RunCliResult = {
  report: EvalReport;
  exitCode: number;
  stdout: string;
};

export async function runCli(
  args: CliArgs,
  opts: RunCliOptions = {}
): Promise<RunCliResult> {
  const dataset = await loadDataset(args.evalsRoot, args.skill);
  const rubric = await loadRubric(args.evalsRoot, args.skill);
  const baseline = await loadBaseline(args.evalsRoot, args.skill);

  const report = await runEval({
    dataset,
    rubric,
    baseline,
    executeFn: opts.executeFn ?? stubExecutor,
    scoreFn: opts.scoreFn ?? stubScorer,
    now: opts.now,
  });

  const indent = args.prettyPrint ? 2 : 0;
  const serialized = JSON.stringify(report, null, indent);

  if (args.out) {
    const write = opts.writeFileFn ?? ((p, d) => writeFile(p, d, 'utf8'));
    await write(args.out, serialized);
  }

  const exitCode = report.failCount === 0 ? 0 : 1;
  return {
    report,
    exitCode,
    stdout: serialized,
  };
}

export async function main(argv: string[] = process.argv.slice(2)): Promise<number> {
  let args: CliArgs;
  try {
    args = parseArgs(argv);
  } catch (err) {
    if (err instanceof CliUsageError) {
      process.stderr.write(`${err.message}\n`);
      return 2;
    }
    throw err;
  }

  try {
    const { report, exitCode, stdout } = await runCli(args);
    if (!args.out) {
      process.stdout.write(`${stdout}\n`);
    }
    const loc = args.out ? ` → ${args.out}` : '';
    process.stderr.write(
      `eval-runner: ${args.skill} · ${report.passCount} pass / ${report.failCount} fail${loc}\n`
    );
    return exitCode;
  } catch (err) {
    if (err instanceof EvalError) {
      process.stderr.write(`eval-runner error: ${err.message}\n`);
      return 1;
    }
    throw err;
  }
}
