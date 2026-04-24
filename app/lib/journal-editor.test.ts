import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createEditorState,
  toggleMode,
  setContent,
  isEmpty,
  type EditorState,
} from './journal-editor';

test('createEditorState defaults to edit mode with empty content', () => {
  const s = createEditorState();
  assert.equal(s.mode, 'edit');
  assert.equal(s.content, '');
});

test('createEditorState accepts initial content', () => {
  const s = createEditorState('# hello');
  assert.equal(s.mode, 'edit');
  assert.equal(s.content, '# hello');
});

test('toggleMode flips edit to preview', () => {
  const s = createEditorState('x');
  const next = toggleMode(s);
  assert.equal(next.mode, 'preview');
  assert.equal(next.content, 'x');
});

test('toggleMode flips preview back to edit', () => {
  const s: EditorState = { mode: 'preview', content: 'x' };
  const next = toggleMode(s);
  assert.equal(next.mode, 'edit');
});

test('two toggles return to the original mode', () => {
  const s = createEditorState('y');
  assert.equal(toggleMode(toggleMode(s)).mode, 'edit');
});

test('setContent updates content and preserves mode', () => {
  const s = createEditorState('old');
  const inPreview = toggleMode(s);
  const next = setContent(inPreview, 'new');
  assert.equal(next.content, 'new');
  assert.equal(next.mode, 'preview');
});

test('setContent does not mutate prior state', () => {
  const s = createEditorState('first');
  setContent(s, 'second');
  assert.equal(s.content, 'first');
});

test('toggleMode does not mutate prior state', () => {
  const s = createEditorState();
  toggleMode(s);
  assert.equal(s.mode, 'edit');
});

test('isEmpty returns true for empty and whitespace-only content', () => {
  assert.equal(isEmpty(createEditorState('')), true);
  assert.equal(isEmpty(createEditorState('   ')), true);
  assert.equal(isEmpty(createEditorState('\n\t  \n')), true);
});

test('isEmpty returns false once any non-whitespace content is present', () => {
  assert.equal(isEmpty(createEditorState('a')), false);
  assert.equal(isEmpty(createEditorState('  x  ')), false);
});
