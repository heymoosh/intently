import { loadSkillDefinition } from './skill-loader';
import { tools as defaultTools, type ToolContext } from './tools';

// ---------- error ----------

export class AgentRunnerError extends Error {
  readonly cause?: unknown;
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'AgentRunnerError';
    this.cause = cause;
  }
}

// ---------- internal types ----------

type TextBlock = { type: 'text'; text: string };
type ToolUseBlock = { type: 'tool_use'; id: string; name: string; input: unknown };
type ContentBlock = TextBlock | ToolUseBlock | { type: string; [key: string]: unknown };

type ToolResultContent = {
  type: 'tool_result';
  tool_use_id: string;
  content: string;
  is_error?: boolean;
};

type MessageParam =
  | { role: 'user'; content: string | ToolResultContent[] }
  | { role: 'assistant'; content: ContentBlock[] };

type ToolSchema = {
  name: string;
  description: string;
  input_schema: object;
};

type MessageCreateParams = {
  model: string;
  system: string;
  messages: MessageParam[];
  max_tokens: number;
  tools?: ToolSchema[];
};

type MessageCreateResponse = {
  content: ContentBlock[];
  stop_reason: string;
  usage?: { input_tokens: number; output_tokens: number };
};

type AnyTool = {
  name: string;
  description: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  execute(input: any, ctx: ToolContext): Promise<unknown>;
};

type AnyToolRegistry = Record<string, AnyTool>;

// ---------- public types ----------

export type AnthropicClient = {
  messages: {
    create(params: MessageCreateParams): Promise<MessageCreateResponse>;
  };
};

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
  client?: AnthropicClient;
  tools?: AnyToolRegistry;
  context?: ToolContext;
  maxIterations?: number;
  model?: string;
  skillLoader?: (skillName: string) => Promise<string>;
};

// ---------- tool schemas (hand-written for V1; TODO: auto-generate from TypeScript types) ----------

const TOOL_SCHEMAS: Record<string, ToolSchema> = {
  read_calendar: {
    name: 'read_calendar',
    description:
      "Read the user's calendar events between start and end (inclusive). ISO 8601 date or datetime strings. Optional calendarIds filter; omitted = all calendars.",
    input_schema: {
      type: 'object',
      properties: {
        start: { type: 'string' },
        end: { type: 'string' },
        calendarIds: { type: 'array', items: { type: 'string' } },
      },
      required: ['start', 'end'],
    },
  },
  read_emails: {
    name: 'read_emails',
    description:
      "Read the user's recent emails, optionally filtered by Gmail query syntax. Default limit 20. since = ISO 8601 timestamp.",
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        limit: { type: 'number' },
        since: { type: 'string' },
      },
      required: [],
    },
  },
  read_file: {
    name: 'read_file',
    description:
      "Read a markdown file from the user's cloud store by relative path (e.g. 'Goals.md'). Throws FileNotFoundError if missing.",
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string' },
      },
      required: ['path'],
    },
  },
  write_file: {
    name: 'write_file',
    description:
      "Write a markdown file to the user's cloud store. Optional expectedVersion for optimistic concurrency; omit on first-time writes.",
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string' },
        content: { type: 'string' },
        expectedVersion: { type: 'string' },
      },
      required: ['path', 'content'],
    },
  },
};

// ---------- client ----------

async function makeDefaultClient(): Promise<AnthropicClient> {
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new AgentRunnerError(
      'ANTHROPIC_API_KEY not set; pass opts.client for testing or set the env var for real calls.'
    );
  }
  return new Anthropic({ apiKey }) as unknown as AnthropicClient;
}

function buildToolSchemas(registry: AnyToolRegistry): ToolSchema[] {
  return Object.keys(registry)
    .map((name) => TOOL_SCHEMAS[name])
    .filter((s): s is ToolSchema => s !== undefined);
}

// ---------- runner ----------

export async function runSkill(
  skillName: string,
  userInput: string,
  opts?: RunSkillOptions
): Promise<AgentResponse> {
  const loader = opts?.skillLoader ?? loadSkillDefinition;
  const systemPrompt = await loader(skillName);

  const client = opts?.client ?? (await makeDefaultClient());
  const registry = (opts?.tools ?? defaultTools) as AnyToolRegistry;
  const context: ToolContext = opts?.context ?? { userId: 'user.dev', now: new Date() };
  const maxIterations = opts?.maxIterations ?? 8;
  const model = opts?.model ?? 'claude-sonnet-4-6';

  const toolSchemas = buildToolSchemas(registry);
  const messages: MessageParam[] = [{ role: 'user', content: userInput }];
  const toolCalls: AgentResponse['toolCalls'] = [];
  let iterations = 0;
  let lastResponse: MessageCreateResponse | null = null;

  while (true) {
    const createParams: MessageCreateParams = {
      model,
      system: systemPrompt,
      messages,
      max_tokens: 4096,
    };
    if (toolSchemas.length > 0) {
      createParams.tools = toolSchemas;
    }

    const response = await client.messages.create(createParams);
    iterations++;
    lastResponse = response;

    if (response.stop_reason !== 'tool_use') break;

    if (iterations >= maxIterations) {
      throw new AgentRunnerError(`agent did not converge within ${maxIterations} iterations`);
    }

    const toolResults: ToolResultContent[] = [];

    for (const block of response.content) {
      if (block.type !== 'tool_use') continue;
      const toolBlock = block as ToolUseBlock;
      const tool = registry[toolBlock.name];

      if (!tool) {
        const errMsg = `unknown tool: ${toolBlock.name}`;
        toolCalls.push({ name: toolBlock.name, input: toolBlock.input, error: errMsg });
        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolBlock.id,
          content: errMsg,
          is_error: true,
        });
        continue;
      }

      try {
        const output = await tool.execute(toolBlock.input, context);
        toolCalls.push({ name: toolBlock.name, input: toolBlock.input, output });
        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolBlock.id,
          content: JSON.stringify(output),
        });
      } catch (err) {
        const errMsg = (err as Error).message ?? String(err);
        toolCalls.push({ name: toolBlock.name, input: toolBlock.input, error: errMsg });
        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolBlock.id,
          content: errMsg,
          is_error: true,
        });
      }
    }

    messages.push({ role: 'assistant', content: response.content });
    messages.push({ role: 'user', content: toolResults });
  }

  const finalText = lastResponse!.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as TextBlock).text)
    .join('');

  return {
    finalText,
    toolCalls,
    stopReason: lastResponse!.stop_reason,
    usage: lastResponse!.usage
      ? {
          inputTokens: lastResponse!.usage.input_tokens,
          outputTokens: lastResponse!.usage.output_tokens,
        }
      : undefined,
  };
}
