import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  readCalendar,
  readEmails,
  readFile,
  writeFile,
  tools,
  FileNotFoundError,
  WriteConflictError,
  type ToolContext,
} from './tools';

const ctx = (overrides: Partial<ToolContext> = {}): ToolContext => ({
  userId: 'user.fixture.muxin',
  now: new Date('2026-04-23T08:00:00-04:00'),
  ...overrides,
});

// ---------- registry ----------

test('registry exposes the four MVP tools by canonical name', () => {
  assert.equal(Object.keys(tools).sort().join(','), 'read_calendar,read_emails,read_file,write_file');
  assert.equal(tools.read_calendar.name, 'read_calendar');
  assert.equal(tools.read_emails.name, 'read_emails');
  assert.equal(tools.read_file.name, 'read_file');
  assert.equal(tools.write_file.name, 'write_file');
});

test('every tool has a non-trivial description for the managed-agents SDK', () => {
  for (const [key, tool] of Object.entries(tools)) {
    assert.ok(tool.description.length > 20, `${key} description too short`);
  }
});

// ---------- read_calendar ----------

test('read_calendar returns fixture events in the requested date window', async () => {
  const out = await readCalendar.execute(
    { start: '2026-04-23', end: '2026-04-23' },
    ctx()
  );
  assert.equal(out.events.length, 3);
  for (const e of out.events) {
    assert.ok(e.start.startsWith('2026-04-23'));
    assert.ok(e.end.startsWith('2026-04-23'));
    assert.ok(e.id.startsWith('cal.fixture.'));
  }
});

test('read_calendar rejects inverted date ranges', async () => {
  await assert.rejects(
    () => readCalendar.execute({ start: '2026-04-24', end: '2026-04-23' }, ctx()),
    /start .* must be <= end/
  );
});

test('read_calendar rejects malformed date strings', async () => {
  await assert.rejects(
    () => readCalendar.execute({ start: 'yesterday', end: 'today' }, ctx()),
    /ISO 8601/
  );
});

// ---------- read_emails ----------

test('read_emails returns all fixtures with no query, up to limit', async () => {
  const out = await readEmails.execute({ limit: 2 }, ctx());
  assert.equal(out.messages.length, 2);
});

test('read_emails filters by query substring across from/subject/snippet', async () => {
  const out = await readEmails.execute({ query: 'Michael' }, ctx());
  assert.equal(out.messages.length, 1);
  assert.match(out.messages[0]!.subject, /Michael Cohen/);
});

test('read_emails clamps limit into [1, 100]', async () => {
  const tiny = await readEmails.execute({ limit: 0 }, ctx());
  assert.equal(tiny.messages.length, 1);
  const huge = await readEmails.execute({ limit: 999 }, ctx());
  assert.ok(huge.messages.length <= 100);
});

test('read_emails defaults receivedAt to the context clock when since is omitted', async () => {
  const out = await readEmails.execute({}, ctx({ now: new Date('2026-04-23T07:00:00-04:00') }));
  assert.ok(out.messages[0]!.receivedAt.startsWith('2026-04-23T11:00:00'));
});

// ---------- read_file ----------

test('read_file returns fixture content with version + updatedAt', async () => {
  const out = await readFile.execute({ path: 'Goals.md' }, ctx());
  assert.equal(out.file.path, 'Goals.md');
  assert.ok(out.file.content.includes('# Goals'));
  assert.match(out.file.version, /^v[0-9a-f]{8}$/);
  assert.equal(out.file.updatedAt, '2026-04-23T12:00:00.000Z');
});

test('read_file throws FileNotFoundError for unknown paths', async () => {
  await assert.rejects(
    () => readFile.execute({ path: 'does-not-exist.md' }, ctx()),
    (err: unknown) => err instanceof FileNotFoundError && err.message.includes('does-not-exist.md')
  );
});

test('read_file rejects absolute paths', async () => {
  await assert.rejects(
    () => readFile.execute({ path: '/etc/passwd' }, ctx()),
    /must be relative/
  );
});

test('read_file rejects path traversal', async () => {
  await assert.rejects(
    () => readFile.execute({ path: '../agents/daily-brief/SKILL.md' }, ctx()),
    /traversal/
  );
});

// ---------- write_file ----------

test('write_file returns the written content with a version hash', async () => {
  const out = await writeFile.execute(
    { path: 'NewFile.md', content: '# New\n\nhello\n' },
    ctx()
  );
  assert.equal(out.file.path, 'NewFile.md');
  assert.equal(out.file.content, '# New\n\nhello\n');
  assert.match(out.file.version, /^v[0-9a-f]{8}$/);
});

test('write_file version is deterministic for identical content', async () => {
  const a = await writeFile.execute({ path: 'a.md', content: 'same' }, ctx());
  const b = await writeFile.execute({ path: 'b.md', content: 'same' }, ctx());
  assert.equal(a.file.version, b.file.version);
});

test('write_file throws WriteConflictError when expectedVersion mismatches existing fixture', async () => {
  await assert.rejects(
    () =>
      writeFile.execute(
        { path: 'Goals.md', content: 'overwrite', expectedVersion: 'vdeadbeef' },
        ctx()
      ),
    (err: unknown) => err instanceof WriteConflictError
  );
});

test('write_file accepts omitted expectedVersion as first-time-write semantics', async () => {
  const out = await writeFile.execute(
    { path: 'Goals.md', content: 'first-time write' },
    ctx()
  );
  assert.equal(out.file.content, 'first-time write');
});
