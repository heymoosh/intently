// Pure state machine for the journal editor.
// Kept separate from the React component so it can be unit-tested without a
// React Native renderer (the repo's test harness is plain node:test).

export type EditorMode = 'edit' | 'preview';

export type EditorState = {
  mode: EditorMode;
  content: string;
};

export function createEditorState(initialContent = ''): EditorState {
  return { mode: 'edit', content: initialContent };
}

export function toggleMode(state: EditorState): EditorState {
  return { ...state, mode: state.mode === 'edit' ? 'preview' : 'edit' };
}

export function setContent(state: EditorState, content: string): EditorState {
  return { ...state, content };
}

export function isEmpty(state: EditorState): boolean {
  return state.content.trim().length === 0;
}
