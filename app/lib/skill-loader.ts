import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const SKILL_NAME_RE = /^[a-z][a-z0-9-]*$/;

/**
 * Default size ceilings on the two inputs the loader reads. The largest real
 * input today (agents/setup/SKILL.md) is ~9.3KB; these defaults leave ~3x
 * headroom. They exist to catch prompt-bloat regressions — if a skill file
 * exceeds the ceiling during the sprint, that's a review signal, not a runtime
 * error that should quietly balloon the token budget.
 */
export const DEFAULT_MAX_SHARED_BYTES = 65536; // 64 KiB
export const DEFAULT_MAX_SKILL_BYTES = 32768; // 32 KiB

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
  maxSharedBytes?: number;
  maxSkillBytes?: number;
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
  const maxShared = opts.maxSharedBytes ?? DEFAULT_MAX_SHARED_BYTES;
  const maxSkill = opts.maxSkillBytes ?? DEFAULT_MAX_SKILL_BYTES;

  const sharedPath = join(agentsDir, '_shared', 'life-ops-conventions.md');
  const skillPath = join(agentsDir, skillName, 'SKILL.md');

  const [shared, skill] = await Promise.all([
    loadFile(readFn, sharedPath, 'shared conventions', skillName),
    loadFile(readFn, skillPath, `skill "${skillName}"`, skillName),
  ]);

  assertSize(shared, maxShared, 'shared conventions', sharedPath);
  assertSize(skill, maxSkill, `skill "${skillName}"`, skillPath);

  const parsed = parseSkillFrontmatter(skill, skillName, skillPath);
  if (parsed.name !== skillName) {
    throw new SkillLoaderError(
      `Frontmatter name "${parsed.name}" in ${skillPath} does not match requested skill "${skillName}". ` +
        `Rename the folder or the frontmatter; they must agree.`
    );
  }

  return `${shared.trim()}\n\n---\n\n${skill.trim()}\n`;
}

async function loadFile(
  readFn: ReadFileFn,
  path: string,
  label: string,
  skillName: string
): Promise<string> {
  try {
    return await readFn(path);
  } catch (err) {
    const message = (err as Error).message ?? '';
    const isEnoent = /enoent/i.test(message) || (err as { code?: string }).code === 'ENOENT';
    if (isEnoent && label.startsWith('skill ')) {
      throw new SkillLoaderError(
        `Skill "${skillName}" not found. Expected SKILL.md at ${path}. ` +
          `Check that the folder exists under the agents directory and that the skill name matches the folder.`,
        err
      );
    }
    throw new SkillLoaderError(`Failed to read ${label} at ${path}: ${message}`, err);
  }
}

function assertSize(content: string, max: number, label: string, path: string): void {
  const bytes = Buffer.byteLength(content, 'utf8');
  if (bytes > max) {
    throw new SkillLoaderError(
      `${label} at ${path} is ${bytes} bytes, exceeds cap of ${max}. ` +
        `Trim the file or raise the cap via LoadOptions.maxSharedBytes / maxSkillBytes.`
    );
  }
}

type ParsedFrontmatter = {
  name: string;
  body: string;
};

/**
 * Minimal YAML-ish frontmatter extractor. Pulls `name:` out of a SKILL.md that
 * begins with a `---` delimited block. Deliberately does not depend on a full
 * YAML parser — the skill format is narrow and controlled.
 */
export function parseSkillFrontmatter(
  content: string,
  skillName: string,
  path: string
): ParsedFrontmatter {
  const trimmed = content.replace(/^﻿/, '');
  if (trimmed.trim().length === 0) {
    throw new SkillLoaderError(`Skill "${skillName}" at ${path} is empty.`);
  }
  if (!/^---\r?\n/.test(trimmed)) {
    throw new SkillLoaderError(
      `Skill "${skillName}" at ${path} is missing a YAML frontmatter block. ` +
        `Expected the file to start with "---" on its own line.`
    );
  }
  const rest = trimmed.slice(trimmed.indexOf('\n') + 1);
  const closeMatch = rest.match(/^---\r?\n/m);
  if (!closeMatch) {
    throw new SkillLoaderError(
      `Skill "${skillName}" at ${path} has an unterminated frontmatter block. ` +
        `Add a closing "---" line.`
    );
  }
  const closeIdx = rest.indexOf(closeMatch[0]);
  const fmBlock = rest.slice(0, closeIdx);
  const body = rest.slice(closeIdx + closeMatch[0].length);

  const name = extractYamlScalar(fmBlock, 'name');
  if (name === undefined) {
    throw new SkillLoaderError(
      `Skill "${skillName}" at ${path} frontmatter is missing a "name:" field.`
    );
  }

  return { name, body };
}

/**
 * Read a single top-level key from a narrow YAML block. Handles:
 *   key: value
 *   key: "value with spaces"
 *   key: 'single-quoted'
 * Does NOT handle nested mappings, arrays, multiline values, or anchors —
 * those aren't used in the SKILL.md frontmatter format today.
 */
function extractYamlScalar(block: string, key: string): string | undefined {
  const line = block
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .find((l) => new RegExp(`^${escape(key)}\\s*:`).test(l));
  if (!line) return undefined;
  const afterColon = line.slice(line.indexOf(':') + 1).trim();
  if (afterColon.length === 0) return undefined;
  if (
    (afterColon.startsWith('"') && afterColon.endsWith('"') && afterColon.length >= 2) ||
    (afterColon.startsWith("'") && afterColon.endsWith("'") && afterColon.length >= 2)
  ) {
    return afterColon.slice(1, -1);
  }
  return afterColon;
}

function escape(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
