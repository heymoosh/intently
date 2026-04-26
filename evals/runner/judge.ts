/**
 * judge.ts — Haiku-backed soft assertion.
 *
 * Takes a single agent output string and a plain-English rubric string,
 * returns { pass: boolean, rationale: string }.
 *
 * Intentionally simpler than the full claude-judge scorer (which operates
 * over multi-axis rubrics and integrates with the runner framework).
 * This is used by run-case.ts to evaluate individual cognition eval cases
 * against per-rubric pass/fail criteria without needing a full Rubric object.
 */

// @ts-ignore — @anthropic-ai/sdk resolves at runtime from app/node_modules/
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import Anthropic from '@anthropic-ai/sdk';

export type JudgeResult = {
  pass: boolean;
  rationale: string;
};

const JUDGE_SYSTEM = `You are a precise pass/fail evaluator for AI agent outputs.
You receive an agent output and a rubric (a plain-English requirement).
Determine whether the output satisfies the rubric.

Respond with valid JSON only — no markdown, no extra text:
{ "pass": true|false, "rationale": "one sentence explaining your verdict" }`;

export async function judge(args: {
  output: string;
  rubric: string;
}): Promise<JudgeResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not set');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = new (Anthropic as any)({ apiKey });

  const response = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 200,
    system: JUDGE_SYSTEM,
    messages: [
      {
        role: 'user',
        content: `Output:\n${args.output}\n\nRubric:\n${args.rubric}\n\nDoes the output satisfy the rubric?`,
      },
    ],
  });

  const rawText: string = response.content
    .filter((b: { type: string; text?: string }) => b.type === 'text' && typeof b.text === 'string')
    .map((b: { text: string }) => b.text)
    .join('');

  let parsed: { pass?: unknown; rationale?: unknown };
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new Error(`judge returned invalid JSON: ${rawText}`);
  }

  if (typeof parsed.pass !== 'boolean') {
    throw new Error(`judge response missing boolean "pass": ${rawText}`);
  }
  if (typeof parsed.rationale !== 'string') {
    throw new Error(`judge response missing string "rationale": ${rawText}`);
  }

  return { pass: parsed.pass, rationale: parsed.rationale };
}
