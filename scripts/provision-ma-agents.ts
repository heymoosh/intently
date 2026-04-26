// scripts/provision-ma-agents.ts — provision Intently's Managed Agents via the Anthropic SDK.
//
// Reads agents/<skill>/ma-agent-config.json, lists existing agents once,
// creates only the ones missing by name, and (with --write-secrets) sets
// the resulting agent IDs in Supabase secrets so ma-proxy can resolve
// skill → agent_id.
//
// Run from the app/ workspace so @anthropic-ai/sdk resolves:
//   cd app && tsx ../scripts/provision-ma-agents.ts --dry-run --all

import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve as resolvePath, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// ---------- types ----------

export const MVP_SKILLS = [
  'chat',
  'daily-brief',
  'daily-review',
  'weekly-review',
  'monthly-review',
  'noticing',
  'reminders-classifier',
  'setup',
  'update-tracker',
  'insight',
] as const;
export type MvpSkill = (typeof MVP_SKILLS)[number];

// Skills that receive MA memory stores. Subset of MVP_SKILLS.
// reminders-classifier is excluded (stateless classification, no benefit).
export const MEMORY_SKILLS: readonly string[] = [
  'chat',
  'daily-brief',
  'daily-review',
  'weekly-review',
  'monthly-review',
  'setup',
  'update-tracker',
  'noticing',
  'insight',
] as const;

export interface RawAgentConfig {
  name: string;
  description?: string;
  model?: string;
  system?: string;
  system_prompt?: string;
  tools?: unknown[];
  mcp_servers?: unknown[];
  skills?: unknown[];
  temperature?: unknown;
  [extra: string]: unknown;
}

export interface CreateAgentParams {
  name: string;
  model: string;
  system: string;
  description?: string;
  tools?: unknown[];
  mcp_servers?: unknown[];
  skills?: unknown[];
}

export interface AgentSummary {
  id: string;
  name: string;
  version?: string | number;
}

export interface AgentsClient {
  list(): Promise<AsyncIterable<AgentSummary>> | AsyncIterable<AgentSummary>;
  create(params: CreateAgentParams): Promise<AgentSummary>;
  // Optional: not all SDK versions expose update. The script falls back to
  // logging a console URL when this method is missing or throws.
  update?(agentId: string, params: CreateAgentParams): Promise<AgentSummary>;
}

export interface ProvisionRunResult {
  skill: string;
  status:
    | 'created'
    | 'exists'
    | 'updated'
    | 'would-create'
    | 'would-skip'
    | 'would-update'
    | 'error';
  agentId?: string;
  message?: string;
}

export interface MemoryStoreSummary {
  id: string;
  name: string;
}

export interface MemoryStoreProvisionResult {
  skill: string;
  status: 'created' | 'exists' | 'would-create' | 'would-skip' | 'error';
  storeId?: string;
  message?: string;
}

export interface MemoryStoresClient {
  list(params?: { include_archived?: boolean }): AsyncIterable<MemoryStoreSummary>;
  create(params: { name: string; description: string }): Promise<MemoryStoreSummary>;
}

export interface ProvisionOpts {
  skills: readonly string[];
  configRoot: string;
  dryRun: boolean;
  writeSecrets: boolean;
  // Default: false. When true, an agent that already exists by name has its
  // local config pushed to the live workspace via client.update.
  updateExisting?: boolean;
  // Default: false. When true, provision a memory store for each memory-eligible
  // skill and write MA_MEMORY_STORE_ID_<SKILL> to Supabase secrets.
  withMemory?: boolean;
  client: AgentsClient;
  // Raw fetch function for APIs not yet in the SDK (e.g. memory stores).
  // Defaults to global fetch.
  fetchFn?: typeof fetch;
  setSecret?: (name: string, value: string) => void;
  log?: (line: string) => void;
  warn?: (line: string) => void;
}

// ---------- pure logic ----------

const DEFAULT_MODEL = 'claude-opus-4-7';
const DEFAULT_TOOLS = [
  { type: 'agent_toolset_20260401', default_config: { enabled: true } },
];

const DROP_FIELDS = new Set([
  // Top-level fields the SDK rejects or that don't apply to Opus 4.7.
  'temperature',
  'top_p',
  'top_k',
  'max_tokens',
  'metadata',
]);

const ALLOWED_FIELDS = new Set([
  'name',
  'model',
  'system',
  'description',
  'tools',
  'mcp_servers',
  'skills',
]);

export function loadConfig(skill: string, configRoot: string): RawAgentConfig {
  const path = resolvePath(configRoot, skill, 'ma-agent-config.json');
  if (!existsSync(path)) {
    throw new Error(`config not found: ${path}`);
  }
  const raw = readFileSync(path, 'utf8');
  let parsed: RawAgentConfig;
  try {
    parsed = JSON.parse(raw) as RawAgentConfig;
  } catch (err) {
    throw new Error(`config is not valid JSON: ${path} — ${(err as Error).message}`);
  }
  if (!parsed.name || typeof parsed.name !== 'string') {
    throw new Error(`config missing 'name' field: ${path}`);
  }
  return parsed;
}

export function buildCreateParams(
  config: RawAgentConfig,
  warn: (line: string) => void = () => {}
): CreateAgentParams {
  const system = config.system ?? config.system_prompt;
  if (!system || typeof system !== 'string') {
    throw new Error(`config missing 'system' (or 'system_prompt') field for ${config.name}`);
  }

  const params: CreateAgentParams = {
    name: config.name,
    model: typeof config.model === 'string' && config.model ? config.model : DEFAULT_MODEL,
    system,
  };

  if (typeof config.description === 'string' && config.description) {
    params.description = config.description;
  }

  // Forward fields when present (even empty arrays — V1 demo agents
  // intentionally have tools: [] / mcp_servers: []). Apply the toolset
  // default ONLY when the key is absent entirely.
  if ('tools' in config) {
    params.tools = (config.tools ?? []) as unknown[];
  } else {
    params.tools = DEFAULT_TOOLS;
  }
  if ('mcp_servers' in config && Array.isArray(config.mcp_servers)) {
    params.mcp_servers = config.mcp_servers;
  }
  if ('skills' in config && Array.isArray(config.skills)) {
    params.skills = config.skills;
  }

  // Warn on dropped fields.
  for (const key of Object.keys(config)) {
    if (ALLOWED_FIELDS.has(key) || key === 'system_prompt') continue;
    if (DROP_FIELDS.has(key)) {
      warn(`[${config.name}] dropping unsupported field: ${key}`);
    } else {
      warn(`[${config.name}] dropping unknown field: ${key}`);
    }
  }

  return params;
}

export function secretNameForSkill(skill: string): string {
  return `MA_AGENT_ID_${skill.toUpperCase().replace(/-/g, '_')}`;
}

export function memoryStoreSecretName(skill: string): string {
  return `MA_MEMORY_STORE_ID_${skill.toUpperCase().replace(/-/g, '_')}`;
}

export function memoryStoreName(skill: string): string {
  return `intently-${skill}-memory`;
}

export function memoryStoreDescription(skill: string): string {
  const descriptions: Record<string, string> = {
    chat: 'User preferences, ongoing topics, tonal patterns, and cross-session context for Intently chat.',
    'daily-brief': "What was told to the user yesterday so today's brief doesn't repeat it.",
    'daily-review': 'Recurring patterns the user has mentioned recently, for surface-in-review.',
    'weekly-review': 'Multi-week patterns and insights for weekly compounding context.',
    setup: 'Partial onboarding state so a user who walks away mid-setup can resume.',
    'update-tracker':
      'Projects the user has mentioned multiple times — signals for noticing-layer promotion.',
    'monthly-review':
      "What was discussed in last month's review — themes, follow-ups, and patterns to watch.",
    noticing:
      'Working tier of pattern observations — soft accumulator before promoting to public.observations table per architecture audit Correction 2.',
    insight: 'Prior deep-pass conclusions to avoid repeating across sessions.',
  };
  return descriptions[skill] ?? `Persistent memory for the Intently ${skill} skill.`;
}

// provisionMemoryStores provisions memory stores for memory-eligible skills via
// the Anthropic MA API. The SDK v0.90 does not expose memoryStores, so this
// function uses raw fetch against the same base URL.
export async function provisionMemoryStores(
  skills: readonly string[],
  opts: {
    apiKey: string;
    dryRun: boolean;
    writeSecrets: boolean;
    setSecret?: (name: string, value: string) => void;
    fetchFn?: typeof fetch;
    log?: (line: string) => void;
    warn?: (line: string) => void;
  },
): Promise<MemoryStoreProvisionResult[]> {
  const log = opts.log ?? ((line: string) => console.log(line));
  const warn = opts.warn ?? ((line: string) => console.warn(line));
  const fetchFn = opts.fetchFn ?? fetch;
  const baseUrl = 'https://api.anthropic.com/v1/memory_stores';
  const headers = {
    'x-api-key': opts.apiKey,
    'anthropic-version': '2023-06-01',
    'anthropic-beta': 'managed-agents-2026-04-01',
    'Content-Type': 'application/json',
  };

  // Fetch existing stores.
  let existingByName = new Map<string, MemoryStoreSummary>();
  try {
    const res = await fetchFn(baseUrl, { headers });
    if (res.ok) {
      const data = (await res.json()) as { data?: MemoryStoreSummary[] };
      for (const s of data.data ?? []) {
        if (s.name) existingByName.set(s.name, s);
      }
      log(`Found ${existingByName.size} existing memory store(s).`);
    } else {
      const text = await res.text();
      warn(`Failed to list memory stores (${res.status}): ${text}`);
    }
  } catch (err) {
    warn(`Error listing memory stores: ${(err as Error).message}`);
  }

  const results: MemoryStoreProvisionResult[] = [];
  const memorySkills = skills.filter((s) => MEMORY_SKILLS.includes(s));

  for (const skill of memorySkills) {
    const name = memoryStoreName(skill);
    const existing = existingByName.get(name);

    if (existing) {
      log(`✓ ${skill}: memory store '${name}' exists → ${existing.id}`);
      const result: MemoryStoreProvisionResult = {
        skill,
        status: opts.dryRun ? 'would-skip' : 'exists',
        storeId: existing.id,
      };
      if (opts.writeSecrets && !opts.dryRun) {
        const ok = writeMemorySecret(skill, existing.id, opts, warn, log);
        if (!ok) {
          result.status = 'error';
          result.message = 'failed to write supabase secret';
        }
      }
      results.push(result);
      continue;
    }

    if (opts.dryRun) {
      log(`→ ${skill}: would create memory store '${name}'`);
      results.push({ skill, status: 'would-create' });
      continue;
    }

    try {
      const res = await fetchFn(baseUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name, description: memoryStoreDescription(skill) }),
      });
      if (!res.ok) {
        const text = await res.text();
        warn(`✗ ${skill}: create memory store failed (${res.status}): ${text}`);
        results.push({ skill, status: 'error', message: `create failed: ${text}` });
        continue;
      }
      const store = (await res.json()) as MemoryStoreSummary;
      log(`✓ ${skill}: created memory store '${name}' → ${store.id}`);
      const result: MemoryStoreProvisionResult = { skill, status: 'created', storeId: store.id };
      if (opts.writeSecrets) {
        const ok = writeMemorySecret(skill, store.id, opts, warn, log);
        if (!ok) {
          result.status = 'error';
          result.message = 'failed to write supabase secret';
        }
      }
      results.push(result);
    } catch (err) {
      const msg = (err as Error).message;
      warn(`✗ ${skill}: create memory store error — ${msg}`);
      results.push({ skill, status: 'error', message: msg });
    }
  }

  return results;
}

function writeMemorySecret(
  skill: string,
  storeId: string,
  opts: { setSecret?: (name: string, value: string) => void },
  warn: (line: string) => void,
  log: (line: string) => void,
): boolean {
  const name = memoryStoreSecretName(skill);
  if (!opts.setSecret) {
    warn(`[${skill}] --write-secrets set but no setSecret provided; skipping memory secret`);
    return false;
  }
  try {
    opts.setSecret(name, storeId);
    log(`✓ ${skill}: ${name} written to Supabase`);
    return true;
  } catch (err) {
    warn(`✗ ${skill}: failed to set ${name} — ${(err as Error).message}`);
    return false;
  }
}

async function collectAgents(client: AgentsClient): Promise<Map<string, AgentSummary>> {
  const list = await client.list();
  const byName = new Map<string, AgentSummary>();
  for await (const agent of list) {
    if (agent && typeof agent.name === 'string' && typeof agent.id === 'string') {
      byName.set(agent.name, agent);
    }
  }
  return byName;
}

export async function provision(opts: ProvisionOpts): Promise<ProvisionRunResult[]> {
  const log = opts.log ?? ((line: string) => console.log(line));
  const warn = opts.warn ?? ((line: string) => console.warn(line));

  const existingByName = await collectAgents(opts.client);
  log(`Found ${existingByName.size} existing agent(s) in this workspace.`);

  const results: ProvisionRunResult[] = [];

  for (const skill of opts.skills) {
    let config: RawAgentConfig;
    try {
      config = loadConfig(skill, opts.configRoot);
    } catch (err) {
      const msg = (err as Error).message;
      warn(`✗ ${skill}: ${msg}`);
      results.push({ skill, status: 'error', message: msg });
      continue;
    }

    const existing = existingByName.get(config.name);

    if (existing) {
      if (opts.updateExisting) {
        if (opts.dryRun) {
          log(`→ ${skill}: would update agent '${config.name}' (${existing.id})`);
          results.push({ skill, status: 'would-update', agentId: existing.id });
          continue;
        }

        let params: CreateAgentParams;
        try {
          params = buildCreateParams(config, warn);
        } catch (err) {
          const msg = (err as Error).message;
          warn(`✗ ${skill}: ${msg}`);
          results.push({ skill, status: 'error', message: msg });
          continue;
        }

        log(`→ ${skill}: updating agent '${params.name}' (${existing.id})…`);
        const result: ProvisionRunResult = {
          skill,
          status: 'updated',
          agentId: existing.id,
        };

        if (typeof opts.client.update !== 'function') {
          const url = consoleUrlForAgent(existing.id);
          warn(
            `✗ ${skill}: SDK does not expose agents.update — open the console to push the new prompt by hand: ${url}`
          );
          result.status = 'error';
          result.message = `update unsupported by this SDK; edit manually at ${url}`;
        } else {
          try {
            // The Anthropic Managed Agents API requires the agent's current
            // `version` on update (optimistic concurrency). It comes from the
            // list response (existing.version). Cast to bypass the narrower
            // CreateAgentParams type — runtime accepts the extra field.
            const updateParams = { ...params, version: Number(existing.version) } as CreateAgentParams;
            const updated = await opts.client.update(existing.id, updateParams);
            log(`✓ ${skill}: updated → ${updated.id}`);
          } catch (err) {
            const msg = (err as Error).message;
            const url = consoleUrlForAgent(existing.id);
            warn(`✗ ${skill}: update failed — ${msg}. Edit manually at ${url}`);
            result.status = 'error';
            result.message = `update failed: ${msg}`;
          }
        }

        if (result.status === 'updated' && opts.writeSecrets) {
          const ok = writeSecret(skill, existing.id, opts, warn, log);
          if (!ok) {
            result.status = 'error';
            result.message = 'failed to write supabase secret';
          }
        }

        results.push(result);
        continue;
      }

      log(`✓ ${skill}: exists as ${config.name} → ${existing.id}`);
      const result: ProvisionRunResult = {
        skill,
        status: opts.dryRun ? 'would-skip' : 'exists',
        agentId: existing.id,
      };
      if (opts.writeSecrets && !opts.dryRun) {
        const ok = writeSecret(skill, existing.id, opts, warn, log);
        if (!ok) {
          result.status = 'error';
          result.message = 'failed to write supabase secret';
        }
      }
      results.push(result);
      continue;
    }

    if (opts.dryRun) {
      log(`→ ${skill}: would create agent '${config.name}'`);
      results.push({ skill, status: 'would-create' });
      continue;
    }

    let params: CreateAgentParams;
    try {
      params = buildCreateParams(config, warn);
    } catch (err) {
      const msg = (err as Error).message;
      warn(`✗ ${skill}: ${msg}`);
      results.push({ skill, status: 'error', message: msg });
      continue;
    }

    log(`→ ${skill}: creating agent '${params.name}'…`);
    let created: AgentSummary;
    try {
      created = await opts.client.create(params);
    } catch (err) {
      const msg = (err as Error).message;
      warn(`✗ ${skill}: create failed — ${msg}`);
      results.push({ skill, status: 'error', message: msg });
      continue;
    }

    log(`✓ ${skill}: created → ${created.id}`);
    const result: ProvisionRunResult = { skill, status: 'created', agentId: created.id };

    if (opts.writeSecrets) {
      const ok = writeSecret(skill, created.id, opts, warn, log);
      if (!ok) {
        result.status = 'error';
        result.message = 'failed to write supabase secret';
      }
    }
    results.push(result);
  }

  return results;
}

export function consoleUrlForAgent(agentId: string): string {
  return `https://console.anthropic.com/agents/${agentId}`;
}

function writeSecret(
  skill: string,
  agentId: string,
  opts: ProvisionOpts,
  warn: (line: string) => void,
  log: (line: string) => void
): boolean {
  const name = secretNameForSkill(skill);
  if (!opts.setSecret) {
    warn(`[${skill}] --write-secrets set but no setSecret provided; skipping`);
    return false;
  }
  try {
    opts.setSecret(name, agentId);
    log(`✓ ${skill}: ${name} written to Supabase`);
    return true;
  } catch (err) {
    warn(`✗ ${skill}: failed to set ${name} — ${(err as Error).message}`);
    return false;
  }
}

export function formatSummary(results: readonly ProvisionRunResult[]): string {
  const header = ['skill', 'status', 'agent_id'];
  const rows: string[][] = results.map((r) => [r.skill, r.status, r.agentId ?? '']);
  const widths = header.map((h, i) =>
    Math.max(h.length, ...rows.map((row) => row[i]?.length ?? 0))
  );
  const fmt = (cols: string[]) =>
    cols.map((c, i) => c.padEnd(widths[i] ?? c.length)).join('  ').trimEnd();
  const sep = widths.map((w) => '-'.repeat(w)).join('  ');
  return [fmt(header), sep, ...rows.map(fmt)].join('\n');
}

// ---------- CLI helpers ----------

interface CliFlags {
  skills: readonly string[];
  dryRun: boolean;
  writeSecrets: boolean;
  updateExisting: boolean;
  withMemory: boolean;
  envFile?: string;
  help: boolean;
}

const HELP = `\
Usage: tsx scripts/provision-ma-agents.ts [flags]

Flags:
  --all                Provision all MVP skills (default if --skill omitted).
  --skill <name>       Provision only one skill (e.g. daily-review). Repeatable.
  --write-secrets      Write each agent ID to Supabase secrets after creation.
  --update-existing    For agents that already exist by name, push the local
                       config to overwrite the live system prompt. Without this
                       flag, existing agents are left alone.
  --with-memory        Also provision memory stores for memory-eligible skills
                       (chat, daily-brief, daily-review, weekly-review, setup,
                       update-tracker). Writes MA_MEMORY_STORE_ID_<SKILL> to
                       Supabase secrets when --write-secrets is also set.
  --dry-run            List existing agents but never call create, update, or write secrets.
  --env-file <path>    Load ANTHROPIC_API_KEY from a .env file (default: .env.local if present).
  --help, -h           Show this help.
`;

export function parseArgs(argv: readonly string[]): CliFlags {
  const flags: CliFlags = {
    skills: [],
    dryRun: false,
    writeSecrets: false,
    updateExisting: false,
    withMemory: false,
    help: false,
  };
  const skills: string[] = [];
  let allFlag = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case '--all':
        allFlag = true;
        break;
      case '--skill': {
        const next = argv[++i];
        if (!next) throw new Error('--skill requires a value');
        skills.push(next);
        break;
      }
      case '--write-secrets':
        flags.writeSecrets = true;
        break;
      case '--update-existing':
        flags.updateExisting = true;
        break;
      case '--with-memory':
        flags.withMemory = true;
        break;
      case '--dry-run':
        flags.dryRun = true;
        break;
      case '--env-file': {
        const next = argv[++i];
        if (!next) throw new Error('--env-file requires a value');
        flags.envFile = next;
        break;
      }
      case '--help':
      case '-h':
        flags.help = true;
        break;
      default:
        throw new Error(`unknown flag: ${arg}`);
    }
  }

  if (skills.length > 0) {
    flags.skills = skills;
  } else if (allFlag || skills.length === 0) {
    flags.skills = MVP_SKILLS;
  }
  return flags;
}

export function loadEnvFile(path: string): void {
  const text = readFileSync(path, 'utf8');
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    // Strip surrounding quotes if present.
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function defaultSetSecret(name: string, value: string): void {
  // Supabase CLI: `supabase secrets set KEY=VALUE`. Throws if the CLI is
  // missing or unauthenticated — caller logs and continues.
  execFileSync('supabase', ['secrets', 'set', `${name}=${value}`], { stdio: 'pipe' });
}

// ---------- main ----------

async function main(argv: readonly string[]): Promise<number> {
  let flags: CliFlags;
  try {
    flags = parseArgs(argv);
  } catch (err) {
    console.error((err as Error).message);
    console.error(HELP);
    return 2;
  }

  if (flags.help) {
    console.log(HELP);
    return 0;
  }

  // Repo root: this file lives at <repo>/scripts/provision-ma-agents.ts.
  const here = dirname(fileURLToPath(import.meta.url));
  const repoRoot = resolvePath(here, '..');
  const configRoot = resolvePath(repoRoot, 'agents');

  const envFile = flags.envFile
    ? resolvePath(process.cwd(), flags.envFile)
    : resolvePath(repoRoot, '.env.local');
  if (existsSync(envFile)) {
    try {
      loadEnvFile(envFile);
      console.log(`Loaded env from ${envFile}`);
    } catch (err) {
      console.warn(`Failed to read ${envFile}: ${(err as Error).message}`);
    }
  } else if (flags.envFile) {
    console.warn(`--env-file ${envFile} not found; continuing with process env.`);
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY not set. Export it or pass --env-file <path>.');
    return 1;
  }

  // The SDK lives in app/node_modules, so resolve through app/'s require
  // rather than the script's own location. This lets the script run from
  // either the repo root or app/.
  const appRequire = createRequire(resolvePath(repoRoot, 'app', 'package.json'));
  let sdkPath: string;
  try {
    sdkPath = appRequire.resolve('@anthropic-ai/sdk');
  } catch (err) {
    console.error(
      `Could not resolve @anthropic-ai/sdk from app/. Run \`npm install\` in app/ first.\n${(err as Error).message}`
    );
    return 1;
  }
  const sdkModule = (await import(pathToFileURL(sdkPath).href)) as {
    default: new (cfg?: unknown) => unknown;
  };
  const Anthropic = sdkModule.default;
  const sdkClient = new Anthropic() as { beta: { agents: AgentsClient } };
  const client = sdkClient.beta.agents;

  const results = await provision({
    skills: flags.skills,
    configRoot,
    dryRun: flags.dryRun,
    writeSecrets: flags.writeSecrets,
    updateExisting: flags.updateExisting,
    withMemory: flags.withMemory,
    client,
    setSecret: defaultSetSecret,
  });

  console.log('');
  console.log(formatSummary(results));

  let errored = results.some((r) => r.status === 'error');

  if (flags.withMemory) {
    const memResults = await provisionMemoryStores(flags.skills, {
      apiKey: process.env.ANTHROPIC_API_KEY!,
      dryRun: flags.dryRun,
      writeSecrets: flags.writeSecrets,
      setSecret: defaultSetSecret,
    });

    if (memResults.length > 0) {
      console.log('\nMemory stores:');
      const memHeader = ['skill', 'status', 'store_id'];
      const memRows: string[][] = memResults.map((r) => [r.skill, r.status, r.storeId ?? '']);
      const memWidths = memHeader.map((h, i) =>
        Math.max(h.length, ...memRows.map((row) => row[i]?.length ?? 0)),
      );
      const memFmt = (cols: string[]) =>
        cols.map((c, i) => c.padEnd(memWidths[i] ?? c.length)).join('  ').trimEnd();
      const memSep = memWidths.map((w) => '-'.repeat(w)).join('  ');
      console.log([memFmt(memHeader), memSep, ...memRows.map(memFmt)].join('\n'));

      if (memResults.some((r) => r.status === 'error')) errored = true;
    }
  }

  if (errored) {
    console.error('\nOne or more skills failed. See messages above.');
    return 1;
  }

  if (flags.writeSecrets && !flags.dryRun) {
    console.log('\nDone. Redeploy ma-proxy so it picks up the secrets:');
    console.log('  supabase functions deploy ma-proxy');
  }
  return 0;
}

const isDirectRun =
  typeof process !== 'undefined' &&
  Array.isArray(process.argv) &&
  process.argv[1] !== undefined &&
  fileURLToPath(import.meta.url) === resolvePath(process.argv[1]);

if (isDirectRun) {
  main(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (err) => {
      console.error(err instanceof Error ? err.stack ?? err.message : String(err));
      process.exit(1);
    }
  );
}
