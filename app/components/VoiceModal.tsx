// Full-screen voice/chat takeover invoked from the hero affordance.
// Per design handoff §1.2 + §6.2: tap hero → listening → transcript →
// classify → ConfirmationCard. For V1 we scope to the reminders path:
// transcript → classify-and-store → success toast.
//
// Web Speech API when available; TextInput fallback so the flow works on
// any target. Styling is flat (no waveform animation / gradient takeover
// yet) — button placement and modality are the bar here.

import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { classifyTranscript, ClassifyResult, useVoiceInput } from '../lib/voice';
import { theme } from '../lib/tokens';

const t = theme.light;

type SaveState =
  | { kind: 'idle' }
  | { kind: 'saving' }
  | { kind: 'ok'; result: ClassifyResult }
  | { kind: 'error'; message: string };

type Props = {
  visible: boolean;
  onClose: () => void;
  supabaseUrl: string | undefined;
};

export default function VoiceModal({ visible, onClose, supabaseUrl }: Props) {
  const voice = useVoiceInput();
  const [manual, setManual] = useState('');
  const [save, setSave] = useState<SaveState>({ kind: 'idle' });

  const activeTranscript =
    voice.state.kind === 'listening'
      ? voice.state.interim
      : voice.state.kind === 'stopped'
      ? voice.state.transcript
      : '';

  const close = () => {
    voice.reset();
    setManual('');
    setSave({ kind: 'idle' });
    onClose();
  };

  const handleSave = async (transcript: string) => {
    if (!supabaseUrl) {
      setSave({
        kind: 'error',
        message: 'Supabase URL missing — cannot reach reminders endpoint.',
      });
      return;
    }
    setSave({ kind: 'saving' });
    try {
      const result = await classifyTranscript(transcript, supabaseUrl);
      setSave({ kind: 'ok', result });
    } catch (err) {
      setSave({
        kind: 'error',
        message: err instanceof Error ? err.message : 'unknown error',
      });
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <View style={styles.scrim}>
        <View style={styles.sheet}>
          <Pressable style={styles.closeBtn} onPress={close} hitSlop={12}>
            <Text style={styles.closeGlyph}>✕</Text>
          </Pressable>
          <Text style={styles.eyebrow}>HERO · LISTENING</Text>
          <Text style={styles.prompt}>
            Try: "Remind me to schedule the dentist next Tuesday."
          </Text>

          {voice.state.kind === 'unsupported' ? (
            <View style={styles.body}>
              <Text style={styles.fallbackHint}>
                Your browser doesn't expose speech recognition — type it instead.
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder="Type your reminder…"
                placeholderTextColor={t.colors.SubtleText}
                value={manual}
                onChangeText={setManual}
                multiline
              />
              <Pressable
                style={[styles.primaryBtn, manual.trim().length === 0 && styles.primaryBtnDisabled]}
                onPress={() => {
                  voice.submitManual(manual);
                  handleSave(manual.trim());
                }}
              >
                <Text style={styles.primaryBtnLabel}>Save reminder</Text>
              </Pressable>
            </View>
          ) : voice.state.kind === 'listening' ? (
            <View style={styles.body}>
              <View style={styles.dotsRow}>
                <View style={[styles.dot, styles.dotOn]} />
                <View style={[styles.dot, styles.dotOn]} />
                <View style={[styles.dot, styles.dotOn]} />
              </View>
              <Text style={styles.transcript}>
                {activeTranscript || '…'}
              </Text>
              <Pressable style={styles.primaryBtn} onPress={voice.stop}>
                <Text style={styles.primaryBtnLabel}>Stop</Text>
              </Pressable>
            </View>
          ) : voice.state.kind === 'stopped' ? (
            <View style={styles.body}>
              <Text style={styles.eyebrowMuted}>TRANSCRIPT</Text>
              <Text style={styles.transcript}>{voice.state.transcript}</Text>
              {save.kind === 'idle' ? (
                <View style={styles.btnRow}>
                  <Pressable style={styles.secondaryBtn} onPress={voice.reset}>
                    <Text style={styles.secondaryBtnLabel}>Try again</Text>
                  </Pressable>
                  <Pressable
                    style={styles.primaryBtn}
                    onPress={() => handleSave(voice.state.kind === 'stopped' ? voice.state.transcript : '')}
                  >
                    <Text style={styles.primaryBtnLabel}>Save as reminder</Text>
                  </Pressable>
                </View>
              ) : save.kind === 'saving' ? (
                <View style={styles.statusRow}>
                  <ActivityIndicator size="small" color={t.colors.SupportingText} />
                  <Text style={styles.statusLabel}>Saving…</Text>
                </View>
              ) : save.kind === 'ok' ? (
                <View>
                  {save.result.classified ? (
                    <View style={styles.confirmationCard}>
                      <Text style={styles.confirmationEyebrow}>REMINDER SAVED</Text>
                      <Text style={styles.confirmationText}>{save.result.reminder.text}</Text>
                      <Text style={styles.confirmationMeta}>
                        Due {save.result.reminder.remind_on}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.confirmationCard}>
                      <Text style={styles.confirmationEyebrow}>NOT A REMINDER</Text>
                      <Text style={styles.confirmationMeta}>{save.result.reason}</Text>
                    </View>
                  )}
                  <Pressable style={styles.primaryBtn} onPress={close}>
                    <Text style={styles.primaryBtnLabel}>Done</Text>
                  </Pressable>
                </View>
              ) : (
                <View>
                  <Text style={styles.errorText}>{save.message}</Text>
                  <Pressable style={styles.secondaryBtn} onPress={() => setSave({ kind: 'idle' })}>
                    <Text style={styles.secondaryBtnLabel}>Retry</Text>
                  </Pressable>
                </View>
              )}
            </View>
          ) : voice.state.kind === 'error' ? (
            <View style={styles.body}>
              <Text style={styles.errorText}>{voice.state.message}</Text>
              <Pressable style={styles.primaryBtn} onPress={voice.reset}>
                <Text style={styles.primaryBtnLabel}>Try again</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.body}>
              <Pressable style={styles.primaryBtn} onPress={voice.start}>
                <Text style={styles.primaryBtnLabel}>🎙 Start listening</Text>
              </Pressable>
              <Text style={styles.fallbackHint}>
                Or type it below.
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder="Type your reminder…"
                placeholderTextColor={t.colors.SubtleText}
                value={manual}
                onChangeText={setManual}
                multiline
              />
              {manual.trim().length > 0 ? (
                <Pressable
                  style={styles.secondaryBtn}
                  onPress={() => {
                    voice.submitManual(manual);
                    handleSave(manual.trim());
                  }}
                >
                  <Text style={styles.secondaryBtnLabel}>Save typed reminder</Text>
                </Pressable>
              ) : null}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: t.colors.OverlayScrim,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: t.colors.PrimarySurface,
    borderTopLeftRadius: t.radius.Card,
    borderTopRightRadius: t.radius.Card,
    padding: t.spacing['5'],
    paddingBottom: t.spacing['7'],
    minHeight: 340,
    ...t.elevation.Hero,
  },
  closeBtn: {
    alignSelf: 'flex-end',
    padding: t.spacing['2'],
  },
  closeGlyph: {
    fontFamily: t.typography.fonts.UISemi,
    fontSize: 18,
    color: t.colors.SupportingText,
  },
  eyebrow: {
    fontFamily: t.typography.fonts.UISemi,
    fontSize: 11,
    letterSpacing: 1.2,
    color: t.colors.SupportingText,
    marginBottom: t.spacing['2'],
  },
  eyebrowMuted: {
    fontFamily: t.typography.fonts.UISemi,
    fontSize: 10,
    letterSpacing: 1.2,
    color: t.colors.SubtleText,
    marginBottom: t.spacing['2'],
  },
  prompt: {
    fontFamily: t.typography.fonts.Reading,
    fontSize: 15,
    lineHeight: 22,
    color: t.colors.SupportingText,
    fontStyle: 'italic',
    marginBottom: t.spacing['5'],
  },
  body: {
    gap: t.spacing['4'],
  },
  dotsRow: {
    flexDirection: 'row',
    gap: t.spacing['2'],
    justifyContent: 'center',
    marginVertical: t.spacing['4'],
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: t.colors.EdgeLine,
  },
  dotOn: {
    backgroundColor: t.colors.AgentListening,
  },
  transcript: {
    fontFamily: t.typography.fonts.Reading,
    fontSize: 18,
    lineHeight: 26,
    color: t.colors.PrimaryText,
    minHeight: 60,
    padding: t.spacing['3'],
    backgroundColor: t.colors.SecondarySurface,
    borderRadius: t.radius.Chip,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: t.colors.EdgeLine,
  },
  textInput: {
    fontFamily: t.typography.fonts.Reading,
    fontSize: 16,
    lineHeight: 24,
    color: t.colors.PrimaryText,
    minHeight: 80,
    padding: t.spacing['3'],
    backgroundColor: t.colors.SecondarySurface,
    borderRadius: t.radius.Chip,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: t.colors.EdgeLine,
  },
  fallbackHint: {
    fontFamily: t.typography.fonts.Reading,
    fontSize: 13,
    color: t.colors.SubtleText,
    textAlign: 'center' as const,
  },
  primaryBtn: {
    backgroundColor: t.colors.PrimaryText,
    paddingVertical: t.spacing['3'],
    paddingHorizontal: t.spacing['5'],
    borderRadius: t.radius.Pill,
    alignItems: 'center',
    minHeight: t.a11y.MinTapTarget,
    justifyContent: 'center',
  },
  primaryBtnDisabled: {
    opacity: 0.4,
  },
  primaryBtnLabel: {
    fontFamily: t.typography.fonts.UISemi,
    fontSize: 15,
    color: t.colors.InverseText,
  },
  secondaryBtn: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: t.colors.EdgeLine,
    paddingVertical: t.spacing['3'],
    paddingHorizontal: t.spacing['4'],
    borderRadius: t.radius.Pill,
    alignItems: 'center',
    minHeight: t.a11y.MinTapTarget,
    justifyContent: 'center',
  },
  secondaryBtnLabel: {
    fontFamily: t.typography.fonts.UIMedium,
    fontSize: 14,
    color: t.colors.PrimaryText,
  },
  btnRow: {
    flexDirection: 'row',
    gap: t.spacing['3'],
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing['2'],
    justifyContent: 'center',
  },
  statusLabel: {
    fontFamily: t.typography.fonts.UIMedium,
    fontSize: 13,
    color: t.colors.SupportingText,
  },
  confirmationCard: {
    padding: t.spacing['4'],
    borderRadius: t.radius.Inner,
    backgroundColor: t.colors.ConfirmationCardSurface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: t.colors.ConfirmationCardEdge,
    marginBottom: t.spacing['3'],
  },
  confirmationEyebrow: {
    fontFamily: t.typography.fonts.UISemi,
    fontSize: 10,
    letterSpacing: 1.2,
    color: t.colors.SupportingText,
    marginBottom: t.spacing['2'],
  },
  confirmationText: {
    fontFamily: t.typography.fonts.Display,
    fontSize: 18,
    lineHeight: 24,
    color: t.colors.PrimaryText,
    marginBottom: t.spacing['2'],
  },
  confirmationMeta: {
    fontFamily: t.typography.fonts.Reading,
    fontSize: 13,
    color: t.colors.SupportingText,
  },
  errorText: {
    fontFamily: t.typography.fonts.Mono,
    fontSize: 12,
    color: t.colors.WarnAccent,
  },
});
