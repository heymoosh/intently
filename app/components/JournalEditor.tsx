import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Markdown from '@ronradtke/react-native-markdown-display';
import {
  createEditorState,
  setContent,
  toggleMode,
  isEmpty,
} from '../lib/journal-editor';
import { theme } from '../lib/tokens';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSave?: (content: string) => void;
  initialContent?: string;
};

export default function JournalEditor({
  visible,
  onClose,
  onSave,
  initialContent = '',
}: Props) {
  const [state, setState] = useState(() => createEditorState(initialContent));

  const handleToggle = () => setState((s) => toggleMode(s));
  const handleChange = (next: string) => setState((s) => setContent(s, next));
  const handleSave = () => {
    onSave?.(state.content);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={styles.headerAction}>Cancel</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Journal</Text>
          <Pressable
            onPress={handleSave}
            disabled={isEmpty(state)}
            hitSlop={12}
          >
            <Text
              style={[
                styles.headerAction,
                styles.headerActionPrimary,
                isEmpty(state) && styles.headerActionDisabled,
              ]}
            >
              Save
            </Text>
          </Pressable>
        </View>

        <View style={styles.toggleRow}>
          <ToggleChip
            label="Edit"
            active={state.mode === 'edit'}
            onPress={() => state.mode === 'preview' && handleToggle()}
          />
          <ToggleChip
            label="Preview"
            active={state.mode === 'preview'}
            onPress={() => state.mode === 'edit' && handleToggle()}
          />
        </View>

        <View style={styles.body}>
          {state.mode === 'edit' ? (
            <TextInput
              style={styles.input}
              value={state.content}
              onChangeText={handleChange}
              placeholder="Write what happened today..."
              placeholderTextColor={t.colors.SubtleText}
              multiline
              textAlignVertical="top"
              autoFocus
            />
          ) : (
            <View style={styles.preview}>
              {isEmpty(state) ? (
                <Text style={styles.previewEmpty}>Nothing to preview yet.</Text>
              ) : (
                <Markdown>{state.content}</Markdown>
              )}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

function ToggleChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

const t = theme.light;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: t.colors.PrimarySurface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: t.spacing['5'],
    paddingVertical: t.spacing['4'],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: t.colors.EdgeLine,
  },
  headerTitle: {
    fontFamily: t.typography.fonts.UISemi,
    fontSize: 17,
    color: t.colors.PrimaryText,
  },
  headerAction: {
    fontFamily: t.typography.fonts.UI,
    fontSize: 15,
    color: t.colors.SupportingText,
  },
  headerActionPrimary: {
    fontFamily: t.typography.fonts.UISemi,
    color: t.colors.FocusObject,
  },
  headerActionDisabled: {
    color: t.colors.SubtleText,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: t.spacing['2'],
    paddingHorizontal: t.spacing['5'],
    paddingVertical: t.spacing['3'],
  },
  chip: {
    paddingHorizontal: t.spacing['4'],
    paddingVertical: t.spacing['2'],
    borderRadius: t.radius.Chip,
    backgroundColor: t.colors.SecondarySurface,
    minHeight: t.a11y.MinTapTarget,
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: t.colors.FocusObject,
  },
  chipLabel: {
    fontFamily: t.typography.fonts.UIMedium,
    fontSize: 13,
    color: t.colors.SupportingText,
  },
  chipLabelActive: {
    color: t.colors.FocusObjectText,
  },
  body: {
    flex: 1,
    paddingHorizontal: t.spacing['5'],
    paddingVertical: t.spacing['4'],
  },
  input: {
    flex: 1,
    fontFamily: t.typography.fonts.Reading,
    fontSize: 17,
    lineHeight: 27,
    color: t.colors.PrimaryText,
  },
  preview: {
    flex: 1,
  },
  previewEmpty: {
    fontFamily: t.typography.fonts.UI,
    fontSize: 15,
    color: t.colors.SubtleText,
    fontStyle: 'italic',
  },
});
