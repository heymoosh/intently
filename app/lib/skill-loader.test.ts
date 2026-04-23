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
    [dailyBriefPath]: '---\nname: daily-brief\n---\n\nskill body\n\n',
  });

  const result = await loadSkillDefinition('daily-brief', {
    agentsDir: AGENTS,
    readFileFn: readFn,
  });

  assert.equal(result, 'shared\n\n---\n\n---\nname: daily-brief\n---\n\nskill body\n');
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

test('wraps missing SKILL.md in SkillLoaderError with a user-facing not-found message', async () => {
  const readFn = fakeFs({
    [sharedPath]: 'shared',
  });

  await assert.rejects(
    () => loadSkillDefinition('daily-brief', { agentsDir: AGENTS, readFileFn: readFn }),
    (err: unknown) =>
      err instanceof SkillLoaderError &&
      err.message.includes('Skill "daily-brief" not found') &&
      err.message.includes('SKILL.md')
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

// ---------- hardening (iteration 5) ----------

test('rejects a SKILL.md missing its frontmatter block', async () => {
  const readFn = fakeFs({
    [sharedPath]: 'shared',
    [dailyBriefPath]: '# Daily Brief\n\nNo frontmatter here.\n',
  });
  await assert.rejects(
    () => loadSkillDefinition('daily-brief', { agentsDir: AGENTS, readFileFn: readFn }),
    (err: unknown) =>
      err instanceof SkillLoaderError && /missing a YAML frontmatter/i.test(err.message)
  );
});

test('rejects a SKILL.md with an unterminated frontmatter block', async () => {
  const readFn = fakeFs({
    [sharedPath]: 'shared',
    [dailyBriefPath]: '---\nname: daily-brief\ndescription: "nope"\n\n# Daily Brief\n',
  });
  await assert.rejects(
    () => loadSkillDefinition('daily-brief', { agentsDir: AGENTS, readFileFn: readFn }),
    (err: unknown) =>
      err instanceof SkillLoaderError && /unterminated frontmatter/i.test(err.message)
  );
});

test('rejects a SKILL.md whose frontmatter has no name field', async () => {
  const readFn = fakeFs({
    [sharedPath]: 'shared',
    [dailyBriefPath]: '---\ndescription: "no name"\n---\n\n# Body\n',
  });
  await assert.rejects(
    () => loadSkillDefinition('daily-brief', { agentsDir: AGENTS, readFileFn: readFn }),
    (err: unknown) =>
      err instanceof SkillLoaderError && /missing a "name:" field/i.test(err.message)
  );
});

test('rejects a SKILL.md whose frontmatter name disagrees with the folder name', async () => {
  const readFn = fakeFs({
    [sharedPath]: 'shared',
    [dailyBriefPath]: '---\nname: morning-brief\n---\n\n# Body\n',
  });
  await assert.rejects(
    () => loadSkillDefinition('daily-brief', { agentsDir: AGENTS, readFileFn: readFn }),
    (err: unknown) =>
      err instanceof SkillLoaderError && /does not match requested skill/i.test(err.message)
  );
});

test('accepts name field with quoted value', async () => {
  const readFn = fakeFs({
    [sharedPath]: 'shared',
    [dailyBriefPath]: '---\nname: "daily-brief"\ndescription: "quoted name"\n---\n\n# Body\n',
  });
  const result = await loadSkillDefinition('daily-brief', {
    agentsDir: AGENTS,
    readFileFn: readFn,
  });
  assert.ok(result.includes('# Body'));
});

test('rejects shared conventions larger than maxSharedBytes', async () => {
  const big = 'x'.repeat(200);
  const readFn = fakeFs({
    [sharedPath]: big,
    [dailyBriefPath]: '---\nname: daily-brief\n---\n\n# Body\n',
  });
  await assert.rejects(
    () =>
      loadSkillDefinition('daily-brief', {
        agentsDir: AGENTS,
        readFileFn: readFn,
        maxSharedBytes: 100,
      }),
    (err: unknown) =>
      err instanceof SkillLoaderError &&
      err.message.includes('shared conventions') &&
      err.message.includes('exceeds cap')
  );
});

test('rejects skill file larger than maxSkillBytes', async () => {
  const bigSkill = '---\nname: daily-brief\n---\n\n' + 'x'.repeat(500);
  const readFn = fakeFs({
    [sharedPath]: 'shared',
    [dailyBriefPath]: bigSkill,
  });
  await assert.rejects(
    () =>
      loadSkillDefinition('daily-brief', {
        agentsDir: AGENTS,
        readFileFn: readFn,
        maxSkillBytes: 100,
      }),
    (err: unknown) =>
      err instanceof SkillLoaderError &&
      err.message.includes('skill "daily-brief"') &&
      err.message.includes('exceeds cap')
  );
});

test('rejects an empty SKILL.md with a clear message', async () => {
  const readFn = fakeFs({
    [sharedPath]: 'shared',
    [dailyBriefPath]: '   \n\t\n',
  });
  await assert.rejects(
    () => loadSkillDefinition('daily-brief', { agentsDir: AGENTS, readFileFn: readFn }),
    (err: unknown) => err instanceof SkillLoaderError && /is empty/i.test(err.message)
  );
});

test('unknown-skill error names the expected SKILL.md path and suggests checking folder + name', async () => {
  const readFn = fakeFs({
    [sharedPath]: 'shared',
    // daily-brief folder absent entirely
  });
  await assert.rejects(
    () => loadSkillDefinition('daily-brief', { agentsDir: AGENTS, readFileFn: readFn }),
    (err: unknown) =>
      err instanceof SkillLoaderError &&
      err.message.includes('Expected SKILL.md at') &&
      err.message.includes('folder exists')
  );
});

test('handles CRLF line endings in SKILL.md frontmatter', async () => {
  const readFn = fakeFs({
    [sharedPath]: 'shared',
    [dailyBriefPath]: '---\r\nname: daily-brief\r\n---\r\n\r\n# Body\r\n',
  });
  const result = await loadSkillDefinition('daily-brief', {
    agentsDir: AGENTS,
    readFileFn: readFn,
  });
  assert.ok(result.includes('# Body'));
});
