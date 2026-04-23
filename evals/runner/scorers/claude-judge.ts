import type { ScoreFn, Rubric, AxisScores } from '../types';
import { EvalError } from '../types';

// Minimal client shape — copied locally to avoid app/lib cross-boundary imports.
type MessageCreateParams = {
  model: string;
  system: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  max_tokens: number;
  temperature: number;
  tool_choice: 'none';
};

type ContentBlock = { type: string; text?: string };

type MessageCreateResponse = {
  content: ContentBlock[];
};

export type AnthropicClient = {
  messages: {
    create(params: MessageCreateParams): Promise<MessageCreateResponse>;
  };
};

export type ClaudeJudgeOptions = {
  client?: AnthropicClient;
  model?: string;
  temperature?: number;
};

const JUDGE_SYSTEM_PROMPT = `You are an evaluation judge for an AI agent's output. You receive:
- A rubric (list of scoring axes with descriptions)
- A test case (input + optional expected reference output)
- The agent's actual output

Score each rubric axis independently on the scale specified (default 0.0-1.0 if no scale given). Be calibrated — reserve 1.0 for excellent, 0.5 for adequate, 0.0 for failing the axis entirely.

Respond with valid JSON only, in this exact shape:
{
  "scores": { "<axis name>": <number>, ... },
  "rationale": "<one short sentence per axis, optional>"
}

No other text outside the JSON. Do not include markdown code fences. Every axis named in the rubric must appear in scores.`;

function buildJudgePrompt(args: {
  input: unknown;
  output: unknown;
  expected: unknown;
  rubric: Rubric;
  caseId: string;
}): string {
  const { input, output, expected, rubric, caseId } = args;

  const axisLines = rubric.axes
    .map((a) => {
      const scale = a.scale ? ` [${a.scale.min}..${a.scale.max}]` : '';
      return `- ${a.name}${scale}: ${a.description}`;
    })
    .join('\n');

  const expectedSection =
    expected !== undefined
      ? `Expected (reference):\n${JSON.stringify(expected, null, 2)}\n\n`
      : '';

  return [
    `Rubric (skill: ${rubric.skill}):`,
    axisLines,
    '',
    `Test case ${caseId}:`,
    'Input:',
    JSON.stringify(input, null, 2),
    '',
    `${expectedSection}Actual output:`,
    JSON.stringify(output, null, 2),
    '',
    'Score each axis.',
  ].join('\n');
}

async function makeDefaultClient(): Promise<AnthropicClient> {
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new EvalError(
      'ANTHROPIC_API_KEY not set; pass opts.client for testing or set the env var for real calls.'
    );
  }
  return new Anthropic({ apiKey }) as unknown as AnthropicClient;
}

export function makeClaudeJudgeScorer(opts?: ClaudeJudgeOptions): ScoreFn {
  const model = opts?.model ?? 'claude-sonnet-4-6';
  const temperature = opts?.temperature ?? 0.0;
  let resolvedClient: AnthropicClient | undefined = opts?.client;

  return async function claudeJudgeScorer(args) {
    if (!resolvedClient) {
      resolvedClient = await makeDefaultClient();
    }

    const userMessage = buildJudgePrompt(args);

    const response = await resolvedClient.messages.create({
      model,
      system: JUDGE_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
      max_tokens: 1024,
      temperature,
      tool_choice: 'none',
    });

    const rawText = response.content
      .filter((b) => b.type === 'text' && typeof b.text === 'string')
      .map((b) => b.text as string)
      .join('');

    let parsed: { scores?: unknown; rationale?: unknown };
    try {
      parsed = JSON.parse(rawText);
    } catch {
      throw new EvalError(
        `Judge returned invalid JSON for case ${args.caseId}`,
        rawText
      );
    }

    if (!parsed.scores || typeof parsed.scores !== 'object' || Array.isArray(parsed.scores)) {
      throw new EvalError(
        `Judge response missing "scores" object for case ${args.caseId}`,
        rawText
      );
    }

    const scores = parsed.scores as Record<string, unknown>;

    for (const axis of args.rubric.axes) {
      const value = scores[axis.name];
      if (value === undefined) {
        throw new EvalError(
          `Judge response missing score for axis "${axis.name}" in case ${args.caseId}`,
          rawText
        );
      }
      if (typeof value !== 'number') {
        throw new EvalError(
          `Judge score for axis "${axis.name}" is not a number in case ${args.caseId}`,
          rawText
        );
      }
      const min = axis.scale?.min ?? 0;
      const max = axis.scale?.max ?? 1;
      if (value < min || value > max) {
        throw new EvalError(
          `Judge score ${value} for axis "${axis.name}" is out of range [${min}, ${max}] in case ${args.caseId}`,
          rawText
        );
      }
    }

    const result: AxisScores = {};
    for (const axis of args.rubric.axes) {
      result[axis.name] = scores[axis.name] as number;
    }
    return result;
  };
}
