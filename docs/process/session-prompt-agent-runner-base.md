# Session Prompt — agent-runner-base

**Purpose:** Build the first cut of the base Claude API agent runner. Ties together the existing skill loader (PR #2) and tools registry (PR #3) into a single callable `runSkill()` that actually executes a skill against Claude. This is TRACKER.md Next #1 — critical path for all three demo flows. Scoped deliberately around the Thursday 2026-04-23 Michael Cohen session: base Claude API works without Managed Agents approval; a follow-up track wraps this runner with MA primitives once the session resolves unknowns.

---

Read these files before making any changes:

- `app/lib/skill-loader.ts` — existing `loadSkillDefinition(skillName)` you'll consume
- `app/lib/tools.ts` — existing `tools` registry and the `Tool<I,O>` / `ToolContext` types
- `app/lib/skill-loader.test.ts` and `app/lib/tools.test.ts` — conventions to match (named error classes, DI-for-testing, strict types, node:test runner)
- `app/package.json` — to see the existing Expo / TypeScript setup before you add the SDK dep

Do NOT touch: `app/lib/skill-loader.ts`, `app/lib/tools.ts`, `TRACKER.md`, `CLAUDE.md`, or anything under `docs/`. Those are owned elsewhere.

---

## Deliverable

A single new file `app/lib/agent-runner.ts` exporting `runSkill(skillName, userInput, opts?)`, plus `app/lib/agent-runner.test.ts` with the test cases listed below. Only new dep: `@anthropic-ai/sdk` (current stable). Tests must not make real API calls.

---

## Function signature

```ts
export type AgentResponse = {
  finalText: string;
  toolCalls: Array<{
    name: string;
    input: unknown;
    output?: unknown;
    error?: string;
  }>;
  stopReason: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
};

export type RunSkillOptions = {
  client?: AnthropicClient;      // inject a fake for tests; default = lazy `new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })`
  tools?: typeof tools;          // inject a subset/fake for tests
  context?: ToolContext;         // passed to tool.execute(); default { userId: 'user.dev', now: new Date() }
  maxIterations?: number;        // tool-use loop cap; default 8
  model?: string;                // default 'claude-sonnet-4-6'
};

export async function runSkill(
  skillName: string,
  userInput: string,
  opts?: RunSkillOptions
): Promise<AgentResponse>;
```

`AnthropicClient` is a minimal shape: an object with `messages.create(params): Promise<MessageResponse>` matching the Anthropic SDK's public API for that one call. Tests pass a fake that implements only that method.

---

## Behavior

1. Call `loadSkillDefinition(skillName)` — the returned string is the system prompt.
2. Translate the `tools` registry into Anthropic tool schemas. Each entry needs `{ name, description, input_schema }`. Derive `input_schema` from the TypeScript input types — **for this iteration, hand-write minimal JSON Schemas for the four tools inline in agent-runner.ts** rather than reflecting types. Keep them narrow (required fields, primitive types). A follow-up iteration can generate schemas automatically.
3. Call `client.messages.create({ model, system, tools, messages: [{role:'user', content: userInput}], max_tokens: 4096 })`.
4. Loop until `stop_reason !== 'tool_use'` or `maxIterations` reached:
   - For each `tool_use` block in the response:
     - Look up the tool in the registry. If missing, record `{ error: 'unknown tool: <name>' }` in that `toolCalls` entry and send back a `tool_result` with `is_error: true` and the error message.
     - Call `tool.execute(input, context)`. On success, record `{ name, input, output }` and send `tool_result` with the JSON-stringified output.
     - On thrown exception, record `{ name, input, error: err.message }` and send `tool_result` with `is_error: true`. Don't re-throw.
   - Build the next `messages.create` call with the running conversation history (assistant response + user tool_result blocks).
5. If `maxIterations` is hit with `stop_reason` still `tool_use`, throw `AgentRunnerError` with message `agent did not converge within N iterations`.
6. On final response, extract the concatenated text from all `text` blocks → `finalText`. Return the full `AgentResponse`.

Named error class: `AgentRunnerError` extends `Error`, pattern matches `SkillLoaderError` in skill-loader.ts.

---

## Client construction

Default `client` is constructed lazily only when not injected:

```ts
async function defaultClient(): Promise<AnthropicClient> {
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new AgentRunnerError('ANTHROPIC_API_KEY not set; pass opts.client for testing or set the env var for real calls.');
  }
  return new Anthropic({ apiKey });
}
```

Do NOT:
- Commit any API key or reference one in code beyond `process.env.ANTHROPIC_API_KEY`.
- Log the api key, even partially.
- Construct the real client at module import (must be lazy so tests never hit network).

---

## Tests (`app/lib/agent-runner.test.ts`)

Use `node:test` and `node:assert/strict` (matches existing test infrastructure). All tests pass a fake `client` — zero real API calls.

Required test cases:

1. **Happy path — text only.** Fake returns `{stop_reason:'end_turn', content:[{type:'text', text:'hello'}]}`. Assert `finalText === 'hello'`, `toolCalls.length === 0`, `stopReason === 'end_turn'`.
2. **Single tool-use round.** Fake returns `tool_use` for `read_file` first call, then `text` on second call. Fake registry provides a fake `read_file` that returns deterministic output. Assert: one entry in `toolCalls` with correct name/input/output, `finalText` matches the final text block.
3. **Multi-round tool-use.** Fake returns two different `tool_use` blocks in sequence across three calls, then `text`. Assert `toolCalls.length === 2` in correct order.
4. **Tool thrown exception.** Tool's `execute` throws. Runner catches → records `error` in `toolCalls`, sends `tool_result` with `is_error:true`, Claude's next call returns text. Assert the entry has `error` populated and no `output`; runner still returns `finalText` (doesn't throw).
5. **Unknown tool name from Claude.** Fake returns `tool_use` for `nonexistent_tool`. Runner records `error: 'unknown tool: nonexistent_tool'`, sends error result, Claude's next call returns text. Assert runner doesn't crash.
6. **maxIterations cap.** Fake always returns `tool_use`. Runner hits cap → throws `AgentRunnerError` with `did not converge` in message. Assert.
7. **Bad skill name.** `runSkill('InvalidSkill', ...)` → `SkillLoaderError` bubbles up (don't catch it).
8. **Default context.** When `opts.context` not provided, the fake tool observes a `ToolContext` with `userId === 'user.dev'` and a `Date` `now`.

Keep tests deterministic. No `await sleep`. No real timers.

---

## Package.json

Add `@anthropic-ai/sdk` to `dependencies` (not devDependencies — it's a runtime dep). Pick current stable. Do not change any other scripts or deps.

---

## Done when

- `app/lib/agent-runner.ts` exists, exports `runSkill`, `AgentResponse`, `RunSkillOptions`, `AgentRunnerError`, `AnthropicClient` (type)
- `app/lib/agent-runner.test.ts` exists with 8 test cases (at minimum — happy to add more)
- `@anthropic-ai/sdk` added as a runtime dep in `app/package.json`
- `npm run typecheck` clean
- `npm run test:unit` green (existing + new tests; total should be 82+)
- No real API calls in tests (verify by running tests with `ANTHROPIC_API_KEY` unset — they must still pass)
- No `console.log` of tool inputs/outputs or anything that might leak user data
- Commit, push, open a draft PR. Auto-merge-safe will classify as code, wait for ci + security both green, merge.

---

## What's next (do not do here)

After this ships, the follow-up tracks are:

- **Managed Agents SDK wrap** — replace `client.messages.create` with MA's agent-definition primitive once the Thursday 2026-04-23 Michael Cohen session resolves scheduling/memory/vault_ids.
- **Auto-generated tool schemas** — replace the hand-written JSON Schemas with reflection from the TypeScript input types (zod or typebox).
- **Agent invocation from the app** — wire `runSkill` into a Supabase Edge Function that `pg_cron` triggers per `life_ops_config.config` schedule times.

Leave placeholders/TODOs for those — don't pre-build.
