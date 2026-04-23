import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const SKILL_NAME_RE = /^[a-z][a-z0-9-]*$/;

export class SkillLoaderError extends Error {
  readonly cause?: unknown;
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'SkillLoaderError';
    this.cause = cause;
  }
}

export type ReadFileFn = (path: string) => Promise<string>;

export type LoadOptions = {
  agentsDir?: string;
  readFileFn?: ReadFileFn;
};

export async function loadSkillDefinition(
  skillName: string,
  opts: LoadOptions = {}
): Promise<string> {
  if (!SKILL_NAME_RE.test(skillName)) {
    throw new SkillLoaderError(
      `Invalid skill name "${skillName}". Must match [a-z][a-z0-9-]* (lowercase ASCII, digits, hyphen; must start with a letter).`
    );
  }

  const agentsDir = resolve(opts.agentsDir ?? join(process.cwd(), 'agents'));
  const readFn: ReadFileFn = opts.readFileFn ?? ((p) => readFile(p, 'utf8'));

  const sharedPath = join(agentsDir, '_shared', 'life-ops-conventions.md');
  const skillPath = join(agentsDir, skillName, 'SKILL.md');

  const [shared, skill] = await Promise.all([
    loadFile(readFn, sharedPath, 'shared conventions'),
    loadFile(readFn, skillPath, `skill "${skillName}"`),
  ]);

  return `${shared.trim()}\n\n---\n\n${skill.trim()}\n`;
}

async function loadFile(
  readFn: ReadFileFn,
  path: string,
  label: string
): Promise<string> {
  try {
    return await readFn(path);
  } catch (err) {
    throw new SkillLoaderError(
      `Failed to read ${label} at ${path}: ${(err as Error).message}`,
      err
    );
  }
}
