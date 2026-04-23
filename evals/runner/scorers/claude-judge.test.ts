import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeClaudeJudgeScorer, type AnthropicClient } from './claude-judge';
import { EvalError } from '../types';
import type { Rubric } from '../types';

// ---------- helpers ----------

type RecordedCall = {
  model: string;
  temperature: number;
  messages: Array<{ role: string; content: string }>;
};

function fakeClient(responseText: string): { client: AnthropicClient; calls: RecordedCall[] } {
  const calls: RecordedCall[] = [];
  const client: AnthropicClient = {
    messages: {
      async create(params) {
        calls.push({
          model: params.model,
          temperature: params.temperature,
          messages: params.messages,
        });
        return { content: [{ type: 'text', text: responseText }] };
      },
    },
  };
  return { client, calls };
}

const baseRubric: Rubric = {
  skill: 'daily-brief',
  axes: [
    { name: 'relevance', description: 'matches user intent' },
    { name: 'clarity', description: 'easy to understand' },
  ],
};

const baseArgs = {
  input: { query: 'What should I focus on today?' },
  output: { summary: 'Focus on the project meeting at 2pm.' },
  expected: { summary: 'Project meeting at 2pm is top priority.' },
  rubric: baseRubric,
  caseId: 'test-1',
};

// ---------- tests ----------

test('happy path: valid JSON with scores for all axes', async () => {
  const { client } = fakeClient(
    JSON.stringify({ scores: { relevance: 0.9, clarity: 0.7 }, rationale: 'Good match' })
  );
  const scorer = makeClaudeJudgeScorer({ client });
  const scores = await scorer(baseArgs);
  assert.equal(scores.relevance, 0.9);
  assert.equal(scores.clarity, 0.7);
});

test('missing axis: EvalError naming the missing axis', async () => {
  const { client } = fakeClient(
    JSON.stringify({ scores: { relevance: 0.8 } }) // missing clarity
  );
  const scorer = makeClaudeJudgeScorer({ client });
  await assert.rejects(
    () => scorer(baseArgs),
    (err: unknown) =>
      err instanceof EvalError && err.message.includes('"clarity"')
  );
});

test('invalid JSON: EvalError on markdown fences or prose', async () => {
  const { client } = fakeClient(
    '```json\n{"scores": {"relevance": 0.9, "clarity": 0.8}}\n```'
  );
  const scorer = makeClaudeJudgeScorer({ client });
  await assert.rejects(
    () => scorer(baseArgs),
    (err: unknown) => err instanceof EvalError
  );
});

test('out-of-scale score: EvalError when score exceeds axis max', async () => {
  const rubricWithScale: Rubric = {
    skill: 'daily-brief',
    axes: [
      { name: 'relevance', description: 'matches user intent', scale: { min: 0, max: 1 } },
      { name: 'clarity', description: 'easy to understand', scale: { min: 0, max: 1 } },
    ],
  };
  const { client } = fakeClient(
    JSON.stringify({ scores: { relevance: 1.5, clarity: 0.8 } })
  );
  const scorer = makeClaudeJudgeScorer({ client });
  await assert.rejects(
    () => scorer({ ...baseArgs, rubric: rubricWithScale }),
    (err: unknown) =>
      err instanceof EvalError && err.message.includes('out of range')
  );
});

test('model and temperature pass-through: opts are forwarded to the client', async () => {
  const { client, calls } = fakeClient(
    JSON.stringify({ scores: { relevance: 0.9, clarity: 0.7 } })
  );
  const scorer = makeClaudeJudgeScorer({
    client,
    model: 'claude-opus-4-7',
    temperature: 0.2,
  });
  await scorer(baseArgs);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].model, 'claude-opus-4-7');
  assert.equal(calls[0].temperature, 0.2);
});

test('minimal rubric: scorer works with a single axis', async () => {
  const singleAxis: Rubric = {
    skill: 'daily-brief',
    axes: [{ name: 'relevance', description: 'matches user intent' }],
  };
  const { client } = fakeClient(
    JSON.stringify({ scores: { relevance: 0.75 } })
  );
  const scorer = makeClaudeJudgeScorer({ client });
  const scores = await scorer({ ...baseArgs, rubric: singleAxis });
  assert.equal(scores.relevance, 0.75);
  assert.equal(Object.keys(scores).length, 1);
});

test('no expected: user message omits Expected section', async () => {
  const { client, calls } = fakeClient(
    JSON.stringify({ scores: { relevance: 0.8, clarity: 0.6 } })
  );
  const scorer = makeClaudeJudgeScorer({ client });
  await scorer({ ...baseArgs, expected: undefined });
  assert.equal(calls.length, 1);
  const userMessage = calls[0].messages[0].content;
  assert.ok(!userMessage.includes('Expected (reference):'), 'should not contain expected section');
});
