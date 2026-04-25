import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  provision,
  buildCreateParams,
  formatSummary,
  parseArgs,
  secretNameForSkill,
  loadConfig,
  loadEnvFile,
  MVP_SKILLS,
  type AgentsClient,
  type AgentSummary,
  type CreateAgentParams,
  type ProvisionRunResult,
} from './provision-ma-agents';

// ---------- helpers ----------

function makeConfigRoot(
  configs: Record<string, Record<string, unknown>>
): { root: string; cleanup: () => void } {
  const root = mkdtempSync(join(tmpdir(), 'provision-ma-test-'));
  for (const [skill, body] of Object.entries(configs)) {
    const dir = join(root, skill);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'ma-agent-config.json'), JSON.stringify(body), 'utf8');
  }
  return { root, cleanup: () => rmSync(root, { recursive: true, force: true }) };
}

interface FakeCall {
  list: number;
  create: CreateAgentParams[];
  update: Array<{ agentId: string; params: CreateAgentParams }>;
}

function makeClient(
  existing: AgentSummary[],
  opts: { withUpdate?: boolean; updateThrows?: Error } = {}
): {
  client: AgentsClient;
  calls: FakeCall;
} {
  const calls: FakeCall = { list: 0, create: [], update: [] };
  const client: AgentsClient = {
    async list() {
      calls.list++;
      return (async function* () {
        for (const a of existing) yield a;
      })();
    },
    async create(params) {
      calls.create.push(params);
      return {
        id: `agent_test_${params.name}`,
        name: params.name,
        version: 1,
      };
    },
  };
  if (opts.withUpdate) {
    client.update = async (agentId, params) => {
      calls.update.push({ agentId, params });
      if (opts.updateThrows) throw opts.updateThrows;
      return { id: agentId, name: params.name, version: 2 };
    };
  }
  return { client, calls };
}

function mkConfig(name: string, extras: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    name,
    description: `desc for ${name}`,
    model: 'claude-opus-4-7',
    system: `system for ${name}`,
    mcp_servers: [],
    tools: [],
    skills: [],
    ...extras,
  };
}

function captureLog(): { log: (l: string) => void; warn: (l: string) => void; lines: string[]; warnings: string[] } {
  const lines: string[] = [];
  const warnings: string[] = [];
  return {
    lines,
    warnings,
    log: (l: string) => lines.push(l),
    warn: (l: string) => warnings.push(l),
  };
}

// ---------- argument parsing ----------

test('parseArgs: --all defaults to all MVP skills', () => {
  const flags = parseArgs(['--all']);
  assert.deepEqual(flags.skills, MVP_SKILLS);
  assert.equal(flags.dryRun, false);
  assert.equal(flags.writeSecrets, false);
});

test('parseArgs: defaults to all when no skill flag', () => {
  const flags = parseArgs([]);
  assert.deepEqual(flags.skills, MVP_SKILLS);
});

test('parseArgs: --skill narrows to one', () => {
  const flags = parseArgs(['--skill', 'daily-review']);
  assert.deepEqual(flags.skills, ['daily-review']);
});

test('parseArgs: composite flags', () => {
  const flags = parseArgs([
    '--dry-run',
    '--write-secrets',
    '--skill',
    'weekly-review',
    '--env-file',
    '.env.test',
  ]);
  assert.equal(flags.dryRun, true);
  assert.equal(flags.writeSecrets, true);
  assert.equal(flags.envFile, '.env.test');
  assert.deepEqual(flags.skills, ['weekly-review']);
});

test('parseArgs: rejects unknown flag', () => {
  assert.throws(() => parseArgs(['--bogus']), /unknown flag/);
});

// ---------- secret name mapping ----------

test('secretNameForSkill: matches the bash script convention', () => {
  assert.equal(secretNameForSkill('daily-brief'), 'MA_AGENT_ID_DAILY_BRIEF');
  assert.equal(secretNameForSkill('daily-review'), 'MA_AGENT_ID_DAILY_REVIEW');
  assert.equal(secretNameForSkill('weekly-review'), 'MA_AGENT_ID_WEEKLY_REVIEW');
  assert.equal(secretNameForSkill('monthly-review'), 'MA_AGENT_ID_MONTHLY_REVIEW');
});

// ---------- buildCreateParams ----------

test('buildCreateParams: forwards explicit empty arrays as empty', () => {
  const cfg = mkConfig('intently-x', { tools: [], mcp_servers: [], skills: [] });
  const params = buildCreateParams(cfg as never);
  assert.deepEqual(params.tools, []);
  assert.deepEqual(params.mcp_servers, []);
  assert.deepEqual(params.skills, []);
});

test('buildCreateParams: applies default toolset when tools key absent', () => {
  const cfg: Record<string, unknown> = {
    name: 'intently-y',
    model: 'claude-opus-4-7',
    system: 'sys',
  };
  const params = buildCreateParams(cfg as never);
  assert.equal(Array.isArray(params.tools), true);
  assert.equal((params.tools as unknown[]).length, 1);
  assert.deepEqual(params.tools, [
    { type: 'agent_toolset_20260401', default_config: { enabled: true } },
  ]);
});

test('buildCreateParams: defaults model and forwards description', () => {
  const cfg = mkConfig('intently-z', { description: 'hi', model: undefined });
  delete (cfg as Record<string, unknown>).model;
  const params = buildCreateParams(cfg as never);
  assert.equal(params.model, 'claude-opus-4-7');
  assert.equal(params.description, 'hi');
});

test('buildCreateParams: drops temperature and warns', () => {
  const warnings: string[] = [];
  const cfg = mkConfig('intently-temp', { temperature: 0.7 });
  const params = buildCreateParams(cfg as never, (l) => warnings.push(l));
  assert.equal('temperature' in params, false);
  assert.equal(
    warnings.some((w) => w.includes('temperature')),
    true,
    `expected a warning about temperature, got: ${warnings.join('|')}`
  );
});

test('buildCreateParams: throws on missing system', () => {
  const cfg: Record<string, unknown> = { name: 'intently-broken' };
  assert.throws(() => buildCreateParams(cfg as never), /missing 'system'/);
});

// ---------- loadConfig ----------

test('loadConfig: reads JSON from agents/<skill>/ma-agent-config.json', () => {
  const { root, cleanup } = makeConfigRoot({ 'demo-skill': mkConfig('intently-demo') });
  try {
    const cfg = loadConfig('demo-skill', root);
    assert.equal(cfg.name, 'intently-demo');
  } finally {
    cleanup();
  }
});

test('loadConfig: errors when file missing', () => {
  const { root, cleanup } = makeConfigRoot({});
  try {
    assert.throws(() => loadConfig('nope', root), /config not found/);
  } finally {
    cleanup();
  }
});

// ---------- provision: dry-run ----------

test('provision: --dry-run never calls create', async () => {
  const { root, cleanup } = makeConfigRoot({
    'daily-brief': mkConfig('intently-daily-brief'),
    'daily-review': mkConfig('intently-daily-review'),
  });
  try {
    const { client, calls } = makeClient([]);
    const cap = captureLog();
    const results = await provision({
      skills: ['daily-brief', 'daily-review'],
      configRoot: root,
      dryRun: true,
      writeSecrets: false,
      client,
      log: cap.log,
      warn: cap.warn,
    });
    assert.equal(calls.list, 1, 'list called exactly once');
    assert.equal(calls.create.length, 0, 'create never called in dry-run');
    assert.equal(results.length, 2);
    for (const r of results) {
      assert.equal(r.status, 'would-create');
      assert.equal(r.agentId, undefined);
    }
  } finally {
    cleanup();
  }
});

// ---------- provision: idempotent skip on name match ----------

test('provision: skips existing agents matched by name', async () => {
  const { root, cleanup } = makeConfigRoot({
    'daily-brief': mkConfig('intently-daily-brief'),
    'daily-review': mkConfig('intently-daily-review'),
  });
  try {
    const { client, calls } = makeClient([
      { id: 'agent_existing_db', name: 'intently-daily-brief' },
    ]);
    const cap = captureLog();
    const results = await provision({
      skills: ['daily-brief', 'daily-review'],
      configRoot: root,
      dryRun: false,
      writeSecrets: false,
      client,
      log: cap.log,
      warn: cap.warn,
    });
    assert.equal(calls.create.length, 1, 'only the missing agent gets created');
    assert.equal(calls.create[0]?.name, 'intently-daily-review');

    const briefResult = results.find((r) => r.skill === 'daily-brief');
    const reviewResult = results.find((r) => r.skill === 'daily-review');
    assert.equal(briefResult?.status, 'exists');
    assert.equal(briefResult?.agentId, 'agent_existing_db');
    assert.equal(reviewResult?.status, 'created');
    assert.equal(reviewResult?.agentId, 'agent_test_intently-daily-review');
  } finally {
    cleanup();
  }
});

// ---------- provision: create payload shape ----------

test('provision: create receives the translated payload', async () => {
  const { root, cleanup } = makeConfigRoot({
    'daily-review': mkConfig('intently-daily-review'),
  });
  try {
    const { client, calls } = makeClient([]);
    const cap = captureLog();
    await provision({
      skills: ['daily-review'],
      configRoot: root,
      dryRun: false,
      writeSecrets: false,
      client,
      log: cap.log,
      warn: cap.warn,
    });
    assert.equal(calls.create.length, 1);
    const payload = calls.create[0]!;
    assert.equal(payload.name, 'intently-daily-review');
    assert.equal(payload.model, 'claude-opus-4-7');
    assert.equal(payload.system, 'system for intently-daily-review');
    assert.equal(payload.description, 'desc for intently-daily-review');
    assert.deepEqual(payload.tools, []);
    assert.deepEqual(payload.mcp_servers, []);
    assert.deepEqual(payload.skills, []);
  } finally {
    cleanup();
  }
});

// ---------- provision: --write-secrets path ----------

test('provision: setSecret throwing flips the result to error and surfaces a warning', async () => {
  const { root, cleanup } = makeConfigRoot({
    'daily-review': mkConfig('intently-daily-review'),
  });
  try {
    const { client } = makeClient([]);
    const cap = captureLog();
    const results = await provision({
      skills: ['daily-review'],
      configRoot: root,
      dryRun: false,
      writeSecrets: true,
      client,
      setSecret: () => {
        throw new Error('supabase not authenticated');
      },
      log: cap.log,
      warn: cap.warn,
    });
    assert.equal(results[0]?.status, 'error');
    assert.match(results[0]?.message ?? '', /supabase secret/);
    assert.equal(
      cap.warnings.some((w) => w.includes('supabase not authenticated')),
      true,
      'expected a warning citing the underlying error'
    );
  } finally {
    cleanup();
  }
});

test('provision: --write-secrets calls setSecret for created and existing agents', async () => {
  const { root, cleanup } = makeConfigRoot({
    'daily-brief': mkConfig('intently-daily-brief'),
    'daily-review': mkConfig('intently-daily-review'),
  });
  try {
    const { client } = makeClient([
      { id: 'agent_existing_db', name: 'intently-daily-brief' },
    ]);
    const cap = captureLog();
    const written: Array<[string, string]> = [];
    await provision({
      skills: ['daily-brief', 'daily-review'],
      configRoot: root,
      dryRun: false,
      writeSecrets: true,
      client,
      setSecret: (n, v) => {
        written.push([n, v]);
      },
      log: cap.log,
      warn: cap.warn,
    });
    assert.deepEqual(written, [
      ['MA_AGENT_ID_DAILY_BRIEF', 'agent_existing_db'],
      ['MA_AGENT_ID_DAILY_REVIEW', 'agent_test_intently-daily-review'],
    ]);
  } finally {
    cleanup();
  }
});

// ---------- provision: --update-existing ----------

test('parseArgs: --update-existing flag', () => {
  const flags = parseArgs(['--update-existing', '--skill', 'daily-brief']);
  assert.equal(flags.updateExisting, true);
  assert.deepEqual(flags.skills, ['daily-brief']);
});

test('parseArgs: updateExisting defaults to false', () => {
  const flags = parseArgs(['--all']);
  assert.equal(flags.updateExisting, false);
});

test('provision: --update-existing pushes new config to existing agents', async () => {
  const { root, cleanup } = makeConfigRoot({
    'daily-brief': mkConfig('intently-daily-brief', { system: 'NEW system prompt' }),
    'daily-review': mkConfig('intently-daily-review', { system: 'fresh review prompt' }),
  });
  try {
    const { client, calls } = makeClient(
      [
        { id: 'agent_existing_db', name: 'intently-daily-brief' },
        { id: 'agent_existing_dr', name: 'intently-daily-review' },
      ],
      { withUpdate: true }
    );
    const cap = captureLog();
    const results = await provision({
      skills: ['daily-brief', 'daily-review'],
      configRoot: root,
      dryRun: false,
      writeSecrets: false,
      updateExisting: true,
      client,
      log: cap.log,
      warn: cap.warn,
    });
    assert.equal(calls.create.length, 0, 'never creates when both exist');
    assert.equal(calls.update.length, 2, 'updates both existing agents');
    assert.equal(calls.update[0]?.agentId, 'agent_existing_db');
    assert.equal(calls.update[0]?.params.system, 'NEW system prompt');
    assert.equal(calls.update[1]?.agentId, 'agent_existing_dr');
    assert.equal(calls.update[1]?.params.system, 'fresh review prompt');
    for (const r of results) {
      assert.equal(r.status, 'updated');
    }
  } finally {
    cleanup();
  }
});

test('provision: --update-existing + --dry-run never calls update', async () => {
  const { root, cleanup } = makeConfigRoot({
    'daily-brief': mkConfig('intently-daily-brief'),
  });
  try {
    const { client, calls } = makeClient(
      [{ id: 'agent_existing_db', name: 'intently-daily-brief' }],
      { withUpdate: true }
    );
    const cap = captureLog();
    const results = await provision({
      skills: ['daily-brief'],
      configRoot: root,
      dryRun: true,
      writeSecrets: false,
      updateExisting: true,
      client,
      log: cap.log,
      warn: cap.warn,
    });
    assert.equal(calls.update.length, 0);
    assert.equal(results[0]?.status, 'would-update');
    assert.equal(results[0]?.agentId, 'agent_existing_db');
  } finally {
    cleanup();
  }
});

test('provision: --update-existing falls back to console URL when SDK lacks update', async () => {
  const { root, cleanup } = makeConfigRoot({
    'daily-brief': mkConfig('intently-daily-brief'),
  });
  try {
    // withUpdate omitted → client.update is undefined.
    const { client, calls } = makeClient([
      { id: 'agent_existing_db', name: 'intently-daily-brief' },
    ]);
    const cap = captureLog();
    const results = await provision({
      skills: ['daily-brief'],
      configRoot: root,
      dryRun: false,
      writeSecrets: false,
      updateExisting: true,
      client,
      log: cap.log,
      warn: cap.warn,
    });
    assert.equal(calls.create.length, 0);
    assert.equal(results[0]?.status, 'error');
    assert.match(results[0]?.message ?? '', /update unsupported/);
    assert.equal(
      cap.warnings.some((w) => w.includes('console.anthropic.com/agents/agent_existing_db')),
      true,
      `expected fallback URL warning, got: ${cap.warnings.join('|')}`
    );
  } finally {
    cleanup();
  }
});

test('provision: --update-existing surfaces SDK update errors with console URL', async () => {
  const { root, cleanup } = makeConfigRoot({
    'daily-brief': mkConfig('intently-daily-brief'),
  });
  try {
    const { client } = makeClient(
      [{ id: 'agent_existing_db', name: 'intently-daily-brief' }],
      { withUpdate: true, updateThrows: new Error('agent locked') }
    );
    const cap = captureLog();
    const results = await provision({
      skills: ['daily-brief'],
      configRoot: root,
      dryRun: false,
      writeSecrets: false,
      updateExisting: true,
      client,
      log: cap.log,
      warn: cap.warn,
    });
    assert.equal(results[0]?.status, 'error');
    assert.match(results[0]?.message ?? '', /update failed: agent locked/);
    assert.equal(
      cap.warnings.some((w) => w.includes('agent locked') && w.includes('console.anthropic.com')),
      true
    );
  } finally {
    cleanup();
  }
});

test('provision: without --update-existing, existing agents stay untouched even when client.update exists', async () => {
  const { root, cleanup } = makeConfigRoot({
    'daily-brief': mkConfig('intently-daily-brief'),
  });
  try {
    const { client, calls } = makeClient(
      [{ id: 'agent_existing_db', name: 'intently-daily-brief' }],
      { withUpdate: true }
    );
    const cap = captureLog();
    const results = await provision({
      skills: ['daily-brief'],
      configRoot: root,
      dryRun: false,
      writeSecrets: false,
      updateExisting: false,
      client,
      log: cap.log,
      warn: cap.warn,
    });
    assert.equal(calls.update.length, 0, 'no updates without the flag');
    assert.equal(calls.create.length, 0, 'no creates either — agent already exists');
    assert.equal(results[0]?.status, 'exists');
    assert.equal(results[0]?.agentId, 'agent_existing_db');
  } finally {
    cleanup();
  }
});

// ---------- env file ----------

test('loadEnvFile: parses simple key=value pairs without overwriting existing env', () => {
  const dir = mkdtempSync(join(tmpdir(), 'envfile-test-'));
  const envPath = join(dir, '.env.test');
  writeFileSync(
    envPath,
    [
      '# comment line',
      '',
      'PROVISION_TEST_FRESH=fresh-value',
      'PROVISION_TEST_QUOTED="quoted value"',
      'PROVISION_TEST_PRESET=should-not-overwrite',
    ].join('\n'),
    'utf8'
  );
  const presetKey = 'PROVISION_TEST_PRESET';
  const freshKey = 'PROVISION_TEST_FRESH';
  const quotedKey = 'PROVISION_TEST_QUOTED';
  process.env[presetKey] = 'preset-from-env';
  delete process.env[freshKey];
  delete process.env[quotedKey];
  try {
    loadEnvFile(envPath);
    assert.equal(process.env[freshKey], 'fresh-value');
    assert.equal(process.env[quotedKey], 'quoted value');
    assert.equal(process.env[presetKey], 'preset-from-env');
  } finally {
    delete process.env[freshKey];
    delete process.env[quotedKey];
    delete process.env[presetKey];
    rmSync(dir, { recursive: true, force: true });
  }
});

// ---------- summary table ----------

test('formatSummary: renders header, separator, and aligned rows', () => {
  const results: ProvisionRunResult[] = [
    { skill: 'daily-brief', status: 'exists', agentId: 'agent_aaa' },
    { skill: 'daily-review', status: 'created', agentId: 'agent_bbb' },
    { skill: 'weekly-review', status: 'error', message: 'boom' },
  ];
  const out = formatSummary(results);
  const lines = out.split('\n');
  assert.equal(lines.length, 5);
  assert.match(lines[0]!, /skill\s+status\s+agent_id/);
  assert.match(lines[1]!, /^-+\s+-+\s+-+$/);
  assert.match(lines[2]!, /daily-brief\s+exists\s+agent_aaa/);
  assert.match(lines[3]!, /daily-review\s+created\s+agent_bbb/);
  assert.match(lines[4]!, /weekly-review\s+error/);
});
