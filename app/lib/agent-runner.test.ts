import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runSkill, AgentRunnerError, type AnthropicClient } from './agent-runner';
import { SkillLoaderError } from './skill-loader';
import type { ToolContext } from './tools';

// ---------- shared fakes ----------

const FAKE_SYSTEM = 'system prompt';

function fakeLoader(skillName: string): Promise<string> {
  return Promise.resolve(`${FAKE_SYSTEM} for ${skillName}`);
}

function makeClient(
  responses: Array<{
    stop_reason: string;
    content: Array<{ type: string; [key: string]: unknown }>;
    usage?: { input_tokens: number; output_tokens: number };
  }>
): AnthropicClient {
  let call = 0;
  return {
    messages: {
      create: async () => {
        const resp = responses[call++];
        if (!resp) throw new Error(`unexpected call #${call} — no more fake responses`);
        return resp;
      },
    },
  };
}

// ---------- test 1: happy path — text only ----------

test('happy path: text-only response', async () => {
  const client = makeClient([
    { stop_reason: 'end_turn', content: [{ type: 'text', text: 'hello' }] },
  ]);

  const result = await runSkill('daily-brief', 'go', { client, skillLoader: fakeLoader, tools: {} });

  assert.equal(result.finalText, 'hello');
  assert.equal(result.toolCalls.length, 0);
  assert.equal(result.stopReason, 'end_turn');
});

// ---------- test 2: single tool-use round ----------

test('single tool-use round: read_file then text', async () => {
  const toolInput = { path: 'Goals.md' };
  const toolOutput = { file: { path: 'Goals.md', content: '# Goals', updatedAt: 't', version: 'v1' } };

  const client = makeClient([
    {
      stop_reason: 'tool_use',
      content: [{ type: 'tool_use', id: 'tu1', name: 'read_file', input: toolInput }],
    },
    {
      stop_reason: 'end_turn',
      content: [{ type: 'text', text: 'Here is your file.' }],
    },
  ]);

  const fakeReadFile = {
    name: 'read_file',
    description: 'fake',
    execute: async (_input: unknown) => toolOutput,
  };

  const result = await runSkill('daily-brief', 'go', {
    client,
    skillLoader: fakeLoader,
    tools: { read_file: fakeReadFile },
  });

  assert.equal(result.toolCalls.length, 1);
  assert.equal(result.toolCalls[0]!.name, 'read_file');
  assert.deepEqual(result.toolCalls[0]!.input, toolInput);
  assert.deepEqual(result.toolCalls[0]!.output, toolOutput);
  assert.equal(result.toolCalls[0]!.error, undefined);
  assert.equal(result.finalText, 'Here is your file.');
});

// ---------- test 3: multi-round tool-use ----------

test('multi-round: two tool calls across three API calls', async () => {
  const client = makeClient([
    {
      stop_reason: 'tool_use',
      content: [{ type: 'tool_use', id: 'tu1', name: 'tool_a', input: { x: 1 } }],
    },
    {
      stop_reason: 'tool_use',
      content: [{ type: 'tool_use', id: 'tu2', name: 'tool_b', input: { y: 2 } }],
    },
    {
      stop_reason: 'end_turn',
      content: [{ type: 'text', text: 'done' }],
    },
  ]);

  const fakeToolA = { name: 'tool_a', description: 'a', execute: async () => ({ a: 'out' }) };
  const fakeToolB = { name: 'tool_b', description: 'b', execute: async () => ({ b: 'out' }) };

  const result = await runSkill('daily-brief', 'go', {
    client,
    skillLoader: fakeLoader,
    tools: { tool_a: fakeToolA, tool_b: fakeToolB },
  });

  assert.equal(result.toolCalls.length, 2);
  assert.equal(result.toolCalls[0]!.name, 'tool_a');
  assert.deepEqual(result.toolCalls[0]!.input, { x: 1 });
  assert.equal(result.toolCalls[1]!.name, 'tool_b');
  assert.deepEqual(result.toolCalls[1]!.input, { y: 2 });
  assert.equal(result.finalText, 'done');
});

// ---------- test 4: tool thrown exception ----------

test('tool exception: runner catches, records error, continues to final text', async () => {
  const client = makeClient([
    {
      stop_reason: 'tool_use',
      content: [{ type: 'tool_use', id: 'tu1', name: 'read_file', input: { path: 'x.md' } }],
    },
    {
      stop_reason: 'end_turn',
      content: [{ type: 'text', text: 'recovered' }],
    },
  ]);

  const throwingTool = {
    name: 'read_file',
    description: 'fake',
    execute: async (_input: unknown): Promise<unknown> => {
      throw new Error('file not found');
    },
  };

  const result = await runSkill('daily-brief', 'go', {
    client,
    skillLoader: fakeLoader,
    tools: { read_file: throwingTool },
  });

  assert.equal(result.toolCalls.length, 1);
  assert.equal(result.toolCalls[0]!.error, 'file not found');
  assert.equal(result.toolCalls[0]!.output, undefined);
  assert.equal(result.finalText, 'recovered');
});

// ---------- test 5: unknown tool name from Claude ----------

test('unknown tool name: runner records error, sends is_error result, does not crash', async () => {
  const client = makeClient([
    {
      stop_reason: 'tool_use',
      content: [{ type: 'tool_use', id: 'tu1', name: 'nonexistent_tool', input: {} }],
    },
    {
      stop_reason: 'end_turn',
      content: [{ type: 'text', text: 'fallback' }],
    },
  ]);

  const result = await runSkill('daily-brief', 'go', {
    client,
    skillLoader: fakeLoader,
    tools: {},
  });

  assert.equal(result.toolCalls.length, 1);
  assert.equal(result.toolCalls[0]!.name, 'nonexistent_tool');
  assert.ok(result.toolCalls[0]!.error?.includes('unknown tool: nonexistent_tool'));
  assert.equal(result.finalText, 'fallback');
});

// ---------- test 6: maxIterations cap ----------

test('maxIterations cap: throws AgentRunnerError with "did not converge"', async () => {
  const alwaysToolUse = makeClient(
    Array.from({ length: 10 }, () => ({
      stop_reason: 'tool_use',
      content: [{ type: 'tool_use', id: 'tu1', name: 'noop', input: {} }],
    }))
  );

  const noopTool = { name: 'noop', description: 'noop', execute: async () => ({}) };

  await assert.rejects(
    () =>
      runSkill('daily-brief', 'go', {
        client: alwaysToolUse,
        skillLoader: fakeLoader,
        tools: { noop: noopTool },
        maxIterations: 3,
      }),
    (err: unknown) =>
      err instanceof AgentRunnerError && /did not converge/i.test(err.message)
  );
});

// ---------- test 7: bad skill name — SkillLoaderError bubbles up ----------

test('bad skill name: SkillLoaderError bubbles up without being caught', async () => {
  const client = makeClient([]);

  await assert.rejects(
    () => runSkill('InvalidSkill', 'go', { client }),
    (err: unknown) => err instanceof SkillLoaderError
  );
});

// ---------- test 8: default context ----------

test('default context: tool receives userId=user.dev and a Date now', async () => {
  let capturedCtx: ToolContext | undefined;

  const client = makeClient([
    {
      stop_reason: 'tool_use',
      content: [{ type: 'tool_use', id: 'tu1', name: 'ctx_probe', input: {} }],
    },
    {
      stop_reason: 'end_turn',
      content: [{ type: 'text', text: 'ok' }],
    },
  ]);

  const ctxProbeTool = {
    name: 'ctx_probe',
    description: 'captures context',
    execute: async (_input: unknown, ctx: ToolContext) => {
      capturedCtx = ctx;
      return {};
    },
  };

  await runSkill('daily-brief', 'go', {
    client,
    skillLoader: fakeLoader,
    tools: { ctx_probe: ctxProbeTool },
    // context intentionally omitted to test defaults
  });

  assert.ok(capturedCtx !== undefined, 'tool execute was called');
  assert.equal(capturedCtx!.userId, 'user.dev');
  assert.ok(capturedCtx!.now instanceof Date, 'now should be a Date');
});
