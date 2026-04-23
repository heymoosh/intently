import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { loadSkillDefinition, SkillLoaderError, ReadFileFn } from './skill-loader';

function fakeFs(files: Record<string, string>): ReadFileFn {
  return async (p: string) => {
    if (!(p in files)) {
      const err = new Error(`ENOENT: no such file or directory, open '${p}'`);
      (err as NodeJS.ErrnoException).code = 'ENOENT';
      throw err;
    }
    return files[p];
  };
}

const AGENTS = '/repo/agents';
const sharedPath = join(AGENTS, '_shared', 'life-ops-conventions.md');
const dailyBriefPath = join(AGENTS, 'daily-brief', 'SKILL.md');

test('concatenates shared conventions and SKILL.md with a --- separator', async () => {
  const readFn = fakeFs({
    [sharedPath]: '# Conventions\n\nrule A\n',
    [dailyBriefPath]: '---\nname: daily-brief\n---\n\n# Daily Brief\n\nbody.\n',
  });

  const result = await loadSkillDefinition('daily-brief', {
    agentsDir: AGENTS,
    readFileFn: readFn,
  });

  assert.equal(
    result,
    '# Conventions\n\nrule A\n\n---\n\n---\nname: daily-brief\n---\n\n# Daily Brief\n\nbody.\n'
  );
});

test('trims trailing whitespace from each source before concatenating', async () => {
  const readFn = fakeFs({
    [sharedPath]: '   shared   \n\n\n',
    [dailyBriefPath]: '\n\nskill body\n\n',
  });

  const result = await loadSkillDefinition('daily-brief', {
    agentsDir: AGENTS,
    readFileFn: readFn,
  });

  assert.equal(result, 'shared\n\n---\n\nskill body\n');
});

test('rejects skill names with uppercase letters', async () => {
  await assert.rejects(
    () => loadSkillDefinition('DailyBrief'),
    (err: unknown) =>
      err instanceof SkillLoaderError &&
      err.message.includes('Invalid skill name "DailyBrief"')
  );
});

test('rejects skill names with path traversal sequences', async () => {
  await assert.rejects(
    () => loadSkillDefinition('../../etc/passwd'),
    (err: unknown) => err instanceof SkillLoaderError
  );
});

test('rejects empty skill name', async () => {
  await assert.rejects(
    () => loadSkillDefinition(''),
    (err: unknown) => err instanceof SkillLoaderError
  );
});

test('rejects skill name starting with a digit or hyphen', async () => {
  await assert.rejects(
    () => loadSkillDefinition('1-skill'),
    (err: unknown) => err instanceof SkillLoaderError
  );
  await assert.rejects(
    () => loadSkillDefinition('-skill'),
    (err: unknown) => err instanceof SkillLoaderError
  );
});

test('wraps missing SKILL.md in SkillLoaderError with skill name in message', async () => {
  const readFn = fakeFs({
    [sharedPath]: 'shared',
  });

  await assert.rejects(
    () => loadSkillDefinition('daily-brief', { agentsDir: AGENTS, readFileFn: readFn }),
    (err: unknown) =>
      err instanceof SkillLoaderError &&
      err.message.includes('skill "daily-brief"') &&
      err.message.includes('ENOENT')
  );
});

test('wraps missing shared conventions in SkillLoaderError', async () => {
  const readFn = fakeFs({
    [dailyBriefPath]: 'skill body',
  });

  await assert.rejects(
    () => loadSkillDefinition('daily-brief', { agentsDir: AGENTS, readFileFn: readFn }),
    (err: unknown) =>
      err instanceof SkillLoaderError && err.message.includes('shared conventions')
  );
});

test('integration: loads real daily-brief skill from the repo', async () => {
  const repoAgents = join(process.cwd(), '..', 'agents');
  const result = await loadSkillDefinition('daily-brief', { agentsDir: repoAgents });

  assert.ok(
    result.includes('Life Ops Conventions'),
    'expected shared conventions header in output'
  );
  assert.ok(result.includes('---'), 'expected separator in output');
  assert.ok(
    result.includes('daily-brief') || result.includes('Daily Brief'),
    'expected daily-brief skill content in output'
  );
});

test('integration: all five MVP skills load without error', async () => {
  const repoAgents = join(process.cwd(), '..', 'agents');
  const skills = ['setup', 'daily-brief', 'update-tracker', 'daily-review', 'weekly-review'];
  for (const skill of skills) {
    const result = await loadSkillDefinition(skill, { agentsDir: repoAgents });
    assert.ok(result.length > 100, `expected non-trivial definition for ${skill}`);
    assert.ok(result.includes('---'), `expected separator for ${skill}`);
  }
});
