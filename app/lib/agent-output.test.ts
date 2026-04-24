import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  kindMetaFor,
  formatGeneratedAt,
  labelForInputTrace,
} from './agent-output';

test('kindMetaFor returns meta for every known kind', () => {
  assert.equal(kindMetaFor('brief').label, 'Brief');
  assert.equal(kindMetaFor('journal').label, 'Journal');
  assert.equal(kindMetaFor('chat').label, 'Chat');
  assert.equal(kindMetaFor('review').label, 'Review');
});

test('kindMetaFor returns a glyph and tintKey for every kind', () => {
  for (const kind of ['brief', 'journal', 'chat', 'review'] as const) {
    const meta = kindMetaFor(kind);
    assert.ok(meta.glyph.length > 0, `${kind} glyph should be non-empty`);
    assert.equal(meta.tintKey, kind);
  }
});

// Tests construct Date objects via the local-time constructor (new Date(y, m, d, hh, mm))
// then round-trip through toISOString() so formatGeneratedAt's local-time reads are
// stable regardless of the test machine's timezone.

test('formatGeneratedAt shows just the time for same-day generation', () => {
  const now = new Date(2026, 3, 24, 9, 0, 0);
  const when = new Date(2026, 3, 24, 7, 32, 0);
  assert.equal(formatGeneratedAt(when.toISOString(), now), 'Generated 7:32 AM');
});

test('formatGeneratedAt adds a month + day for different-day generation', () => {
  const now = new Date(2026, 3, 24, 9, 0, 0);
  const when = new Date(2026, 3, 23, 21, 5, 0);
  assert.equal(formatGeneratedAt(when.toISOString(), now), 'Generated 9:05 PM · Apr 23');
});

test('formatGeneratedAt uses 12-hour format for noon and midnight', () => {
  const now = new Date(2026, 3, 24, 13, 0, 0);
  const noon = new Date(2026, 3, 24, 12, 0, 0);
  const midnight = new Date(2026, 3, 24, 0, 15, 0);
  assert.equal(formatGeneratedAt(noon.toISOString(), now), 'Generated 12:00 PM');
  assert.equal(formatGeneratedAt(midnight.toISOString(), now), 'Generated 12:15 AM');
});

test('formatGeneratedAt falls back gracefully on unparseable input', () => {
  const out = formatGeneratedAt('not-a-date');
  assert.equal(out, 'Generated not-a-date');
});

test('labelForInputTrace labels every trace kind', () => {
  assert.equal(labelForInputTrace('calendar'), 'Calendar');
  assert.equal(labelForInputTrace('journal'), 'Journal');
  assert.equal(labelForInputTrace('email'), 'Email');
  assert.equal(labelForInputTrace('health'), 'Health');
});
