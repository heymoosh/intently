import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { SupabaseClient } from '@supabase/supabase-js';
import { renderDailyBriefContext } from './daily-brief-context';

// Minimal SupabaseClient mock. Each query chain method returns the builder so
// the render function can compose .select().eq().order() etc. without the test
// caring which method is called or in what order. The terminal `await` reads
// the canned data for the `.from(table)` value.

type TableHandler = () => unknown[];

function makeMockClient(handlers: Record<string, TableHandler>): SupabaseClient {
  const buildBuilder = (table: string) => {
    const data = () => (handlers[table] ? handlers[table]() : []);
    const builder: Record<string, unknown> = {};
    const passthrough = () => builder;
    for (const m of ['select', 'eq', 'is', 'in', 'gte', 'lt', 'order', 'limit']) {
      builder[m] = passthrough;
    }
    builder.then = (resolve: (v: { data: unknown[]; error: null }) => unknown) =>
      resolve({ data: data(), error: null });
    return builder;
  };
  return {
    from: (table: string) => buildBuilder(table),
  } as unknown as SupabaseClient;
}

const TODAY = new Date(2026, 3, 24, 9, 0, 0); // 2026-04-24 (Friday) local time.

test('renderDailyBriefContext includes all expected section headers when populated', async () => {
  const client = makeMockClient({
    goals: () => [
      { title: 'Ship Intently V1', monthly_slice: 'Land the three demo flows by 4/26.', position: 0 },
      { title: 'Build a tighter daily practice', monthly_slice: 'Wake by 6:30.', position: 1 },
    ],
    entries: () => [
      {
        kind: 'brief',
        title: 'Thursday brief',
        body_markdown: 'Pacing: ease off. P1 — merge skill loader.',
        at: '2026-04-23T07:30:00-04:00',
      },
    ],
    projects: () => [
      {
        title: 'Intently V1',
        status: 'active',
        is_admin: false,
        todos: [
          { id: 'i1', text: 'Skill loader merged', done: true, created_at: '2026-04-21T08:00:00-04:00' },
          { id: 'i3', text: 'Schema migration', done: false, created_at: '2026-04-24T07:00:00-04:00' },
        ],
      },
    ],
  });

  const md = await renderDailyBriefContext(client, 'user-1', TODAY);

  for (const header of [
    '## Weekly Goals (current week)',
    "## Yesterday's Daily Log",
    "## Today's Calendar",
    '## Email',
    '## Recent project state',
  ]) {
    assert.match(md, new RegExp(header.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `missing header: ${header}`);
  }
});

test('renderDailyBriefContext includes today as a YYYY-MM-DD string', async () => {
  const client = makeMockClient({});
  const md = await renderDailyBriefContext(client, 'user-1', TODAY);
  assert.match(md, /Today: 2026-04-24 \(Friday\)/);
});

test('renderDailyBriefContext renders user name from the demo persona', async () => {
  const client = makeMockClient({});
  const md = await renderDailyBriefContext(client, 'user-1', TODAY);
  assert.match(md, /User: Sam/);
});

test('renderDailyBriefContext renders graceful (none) placeholders for empty result sets', async () => {
  const client = makeMockClient({}); // every table returns []
  const md = await renderDailyBriefContext(client, 'user-1', TODAY);

  // Each populated section falls back to "- (none)" when its query returns empty.
  // Calendar / Email always render `- not_connected` regardless.
  assert.match(md, /## Weekly Goals \(current week\)\n- \(none\)/);
  assert.match(md, /## Yesterday's Daily Log\n- \(none\)/);
  assert.match(md, /## Recent project state\n- \(none\)/);
  assert.match(md, /## Today's Calendar\n- not_connected/);
  assert.match(md, /## Email\n- not_connected/);
});

test('renderDailyBriefContext renders monthly_slice as the goal bullet body', async () => {
  const client = makeMockClient({
    goals: () => [
      { title: 'Ship Intently V1', monthly_slice: 'Land demo flows by 4/26.', position: 0 },
    ],
  });
  const md = await renderDailyBriefContext(client, 'user-1', TODAY);
  assert.match(md, /- Land demo flows by 4\/26\./);
});

test('renderDailyBriefContext picks recent done todos for projects (max 2, newest first)', async () => {
  const client = makeMockClient({
    projects: () => [
      {
        title: 'Intently V1',
        status: 'active',
        is_admin: false,
        todos: [
          { id: 't1', text: 'Old done', done: true, created_at: '2026-04-18T08:00:00-04:00' },
          { id: 't2', text: 'Newest done', done: true, created_at: '2026-04-23T08:00:00-04:00' },
          { id: 't3', text: 'Mid done', done: true, created_at: '2026-04-21T08:00:00-04:00' },
          { id: 't4', text: 'Open todo', done: false, created_at: '2026-04-24T08:00:00-04:00' },
        ],
      },
    ],
  });
  const md = await renderDailyBriefContext(client, 'user-1', TODAY);
  assert.match(md, /Intently V1 \(active\) — recently done: Newest done; Mid done/);
  assert.doesNotMatch(md, /Old done/);
  assert.doesNotMatch(md, /Open todo/);
});

test('renderDailyBriefContext does not throw when supabase returns null data', async () => {
  // Simulates an error case where the client returned { data: null }.
  const nullClient = {
    from: () => {
      const builder: Record<string, unknown> = {};
      const passthrough = () => builder;
      for (const m of ['select', 'eq', 'is', 'in', 'gte', 'lt', 'order', 'limit']) {
        builder[m] = passthrough;
      }
      builder.then = (resolve: (v: { data: null; error: null }) => unknown) =>
        resolve({ data: null, error: null });
      return builder;
    },
  } as unknown as SupabaseClient;

  const md = await renderDailyBriefContext(nullClient, 'user-1', TODAY);
  assert.match(md, /## Weekly Goals/);
  assert.match(md, /- \(none\)/);
});
