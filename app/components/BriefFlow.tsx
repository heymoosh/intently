// Conversational morning-brief overlay per design HANDOFF §6.1 + intently-flows.jsx → BriefFlow.
// Tap morning sunrise CTA → 3-question scripted Q&A → BriefConfirmCard preview → accept →
// close overlay + populate planned phase. The scripted shape is the demo beat that lands
// "the agent IS the interface" on camera; HANDOFF §0.1 #5 ("agent drafts; user confirms").
//
// V1 cut: scripted defaults backstop user input, so the demo runs cleanly with or without
// typed answers. The full hero state machine (idle/listening/processing/expanded) is
// deferred — this overlay opens via PhaseCta tap, not the hero affordance.

import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { theme } from '../lib/tokens';

const t = theme.light;

type AgentMessage = { role: 'agent'; text: string; sub?: string };
type UserMessage = { role: 'user'; text: string };
type Message = AgentMessage | UserMessage;

type ScriptStep = {
  agent: string;
  agentSub?: string;
  typing: number;
  input?: { placeholder: string };
  userDefault?: string;
  confirm?: boolean;
};

// Persona/scenario mirrors fixtures/daily-brief-seed.ts — Sam, Friday, two days from
// demo, "body talking" yesterday, tool scaffolds half-shipped. Keeps the conversation
// coherent with the live MA call's input bundle.
const SCRIPT: ScriptStep[] = [
  {
    agent: 'Morning, Sam.',
    agentSub:
      "Yesterday you wrapped tool scaffolds halfway and said your body's talking. Today is Friday — two days from demo.",
    typing: 1800,
  },
  {
    agent: "What's alive for you today? Tell me in a sentence.",
    typing: 1200,
    input: { placeholder: 'e.g. ship the agent surface, then wrap clean' },
    userDefault:
      'Ship the agent surface, finish tool scaffolds, and respect the hard stop tonight.',
  },
  {
    agent: "And anything you're carrying that you want to park?",
    typing: 1200,
    input: { placeholder: "Things you'll consciously not do today" },
    userDefault:
      'No new branches. Not chasing the font-family rabbit hole today.',
  },
  {
    agent: "Got it. Here's the shape of your day — check it, tweak it, accept.",
    typing: 1400,
    confirm: true,
  },
];

export type BriefAnswers = { alive: string; park: string };

type Props = {
  visible: boolean;
  onClose: () => void;
  onAccept: (answers: BriefAnswers) => void;
  agentRunning: boolean;
  agentError?: string | null;
};

export default function BriefFlow({
  visible,
  onClose,
  onAccept,
  agentRunning,
  agentError,
}: Props) {
  const [step, setStep] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [agentTyping, setAgentTyping] = useState(true);
  const [draft, setDraft] = useState('');
  const [answers, setAnswers] = useState<{ alive?: string; park?: string }>({});
  const scrollRef = useRef<ScrollView>(null);

  // Reset script state every time the overlay opens — running the brief
  // multiple times in a session needs a clean slate.
  useEffect(() => {
    if (visible) {
      setStep(0);
      setMessages([]);
      setAgentTyping(true);
      setDraft('');
      setAnswers({});
    }
  }, [visible]);

  // Drive the script: when step changes, post the agent turn after the typing
  // delay. Cleared on unmount/step-change so a fast tap doesn't double-post.
  useEffect(() => {
    if (!visible) return;
    const s = SCRIPT[step];
    if (!s) return;
    setAgentTyping(true);
    const timer = setTimeout(() => {
      setMessages((m) => [
        ...m,
        { role: 'agent', text: s.agent, sub: s.agentSub },
      ]);
      setAgentTyping(false);
    }, s.typing);
    return () => clearTimeout(timer);
  }, [step, visible]);

  // Keep the scroll pinned to the latest message so new bubbles + the
  // typing indicator stay visible without manual scrolling.
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollToEnd({ animated: true });
    }
  }, [messages, agentTyping]);

  const current = SCRIPT[step];
  const showInput = !!(current && current.input && !agentTyping);
  const showConfirm = !!(current && current.confirm && !agentTyping);

  const submit = (text: string) => {
    if (!current) return;
    const value = text.trim() || current.userDefault || '';
    if (!value) return;
    setMessages((m) => [...m, { role: 'user', text: value }]);
    if (step === 1) setAnswers((a) => ({ ...a, alive: value }));
    if (step === 2) setAnswers((a) => ({ ...a, park: value }));
    setDraft('');
    // Tiny pause so the user sees their bubble land before the agent
    // starts typing the next turn.
    setTimeout(() => setStep(step + 1), 260);
  };

  const handleAccept = () => {
    onAccept({
      alive: answers.alive ?? SCRIPT[1].userDefault!,
      park: answers.park ?? SCRIPT[2].userDefault!,
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      transparent={false}
    >
      <View style={styles.sheet}>
        <View style={styles.header}>
          <View style={styles.headerLabel}>
            <View style={styles.sunDot} />
            <Text style={styles.eyebrow}>DAILY BRIEF</Text>
          </View>
          <Pressable
            onPress={onClose}
            hitSlop={12}
            style={styles.closeBtn}
            accessibilityLabel="Close brief"
          >
            <Text style={styles.closeGlyph}>✕</Text>
          </Pressable>
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.thread}
          contentContainerStyle={styles.threadContent}
        >
          {messages.map((m, i) => (
            <ChatBubble key={i} message={m} />
          ))}
          {agentTyping ? <AgentTyping /> : null}
          {showConfirm ? (
            <BriefConfirmCard
              answers={answers}
              onAccept={handleAccept}
              running={agentRunning}
              error={agentError}
            />
          ) : null}
        </ScrollView>

        {showInput && current ? (
          <View style={styles.composerWrap}>
            <View style={styles.composer}>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder={current.input!.placeholder}
                placeholderTextColor={t.colors.SubtleText}
                style={styles.input}
                multiline
                onSubmitEditing={() => submit(draft || current.userDefault || '')}
                blurOnSubmit
              />
              <Pressable
                style={styles.sendBtn}
                onPress={() => submit(draft || current.userDefault || '')}
                accessibilityLabel="Send"
              >
                <Text style={styles.sendGlyph}>→</Text>
              </Pressable>
            </View>
            {current.userDefault && draft.trim().length === 0 ? (
              <Text style={styles.suggestionHint}>
                tap send to use the suggested answer
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

function ChatBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  return (
    <View
      style={[styles.bubbleRow, isUser ? styles.bubbleRowUser : styles.bubbleRowAgent]}
    >
      <View
        style={[
          styles.bubble,
          isUser ? styles.bubbleUser : styles.bubbleAgent,
        ]}
      >
        <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : null]}>
          {message.text}
        </Text>
        {message.role === 'agent' && message.sub ? (
          <Text style={styles.bubbleSub}>{message.sub}</Text>
        ) : null}
      </View>
    </View>
  );
}

function AgentTyping() {
  return (
    <View style={[styles.bubbleRow, styles.bubbleRowAgent]}>
      <View style={[styles.bubble, styles.bubbleAgent, styles.typingBubble]}>
        <View style={styles.typingDot} />
        <View style={styles.typingDot} />
        <View style={styles.typingDot} />
      </View>
    </View>
  );
}

function BriefConfirmCard({
  answers,
  onAccept,
  running,
  error,
}: {
  answers: { alive?: string; park?: string };
  onAccept: () => void;
  running: boolean;
  error?: string | null;
}) {
  const aliveText = answers.alive ?? SCRIPT[1].userDefault ?? '';
  const parkText = answers.park ?? SCRIPT[2].userDefault ?? '';
  return (
    <View style={styles.confirmCard}>
      <Text style={styles.confirmEyebrow}>I'LL DRAFT YOUR DAY FROM</Text>
      <View style={styles.confirmList}>
        <View style={styles.confirmRow}>
          <Text style={styles.confirmRowLabel}>ALIVE</Text>
          <Text style={styles.confirmRowText}>{aliveText}</Text>
        </View>
        <View style={styles.confirmRow}>
          <Text style={styles.confirmRowLabel}>PARKED</Text>
          <Text style={styles.confirmRowText}>{parkText}</Text>
        </View>
      </View>
      {error ? <Text style={styles.confirmError}>{error}</Text> : null}
      <Pressable
        style={[styles.acceptBtn, running && styles.acceptBtnRunning]}
        onPress={running ? undefined : onAccept}
        accessibilityLabel="Accept and populate my day"
      >
        {running ? (
          <View style={styles.acceptInner}>
            <ActivityIndicator size="small" color={t.colors.InverseText} />
            <Text style={styles.acceptLabel}>Drafting your day…</Text>
          </View>
        ) : (
          <Text style={styles.acceptLabel}>Accept &amp; populate my day</Text>
        )}
      </Pressable>
      <Text style={styles.acceptHint}>or keep talking to tweak it</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
    backgroundColor: t.colors.PrimarySurface,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: t.spacing['4'],
    paddingBottom: t.spacing['3'],
  },
  headerLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing['2'],
  },
  sunDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: t.colors.UndoAffordance,
  },
  eyebrow: {
    fontFamily: t.typography.fonts.UISemi,
    fontSize: 11,
    letterSpacing: 1.4,
    color: t.colors.UndoAffordance,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: t.colors.SunkenSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeGlyph: {
    fontSize: 16,
    color: t.colors.PrimaryText,
    fontFamily: t.typography.fonts.UISemi,
  },
  thread: {
    flex: 1,
    paddingHorizontal: t.spacing['4'],
  },
  threadContent: {
    paddingTop: t.spacing['2'],
    paddingBottom: t.spacing['5'],
    gap: t.spacing['3'],
  },
  bubbleRow: {
    flexDirection: 'row',
  },
  bubbleRowAgent: {
    justifyContent: 'flex-start',
  },
  bubbleRowUser: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '85%',
    paddingVertical: t.spacing['3'],
    paddingHorizontal: t.spacing['4'],
    borderRadius: 18,
  },
  bubbleAgent: {
    backgroundColor: t.colors.SecondarySurface,
    borderTopLeftRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: t.colors.EdgeLine,
  },
  bubbleUser: {
    backgroundColor: t.colors.UndoAffordance,
    borderTopRightRadius: 6,
  },
  bubbleText: {
    fontFamily: t.typography.fonts.Reading,
    fontSize: 15,
    lineHeight: 22,
    color: t.colors.PrimaryText,
  },
  bubbleTextUser: {
    color: t.colors.InverseText,
  },
  bubbleSub: {
    marginTop: t.spacing['2'],
    fontFamily: t.typography.fonts.Reading,
    fontSize: 13,
    lineHeight: 19,
    color: t.colors.SupportingText,
    fontStyle: 'italic',
  },
  typingBubble: {
    flexDirection: 'row',
    gap: 5,
    paddingVertical: t.spacing['3'],
    alignItems: 'center',
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: t.colors.SubtleText,
  },
  composerWrap: {
    backgroundColor: t.colors.SecondarySurface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: t.colors.EdgeLine,
    paddingTop: t.spacing['3'],
    paddingBottom: t.spacing['5'],
    paddingHorizontal: t.spacing['3'],
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing['2'],
  },
  input: {
    flex: 1,
    fontFamily: t.typography.fonts.Reading,
    fontSize: 14,
    minHeight: 40,
    maxHeight: 120,
    color: t.colors.PrimaryText,
    paddingHorizontal: t.spacing['4'],
    paddingVertical: t.spacing['2'],
    borderRadius: 999,
    backgroundColor: t.colors.PrimarySurface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: t.colors.EdgeLine,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: t.colors.UndoAffordance,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendGlyph: {
    color: t.colors.InverseText,
    fontSize: 18,
    fontFamily: t.typography.fonts.UISemi,
  },
  suggestionHint: {
    fontFamily: t.typography.fonts.UI,
    fontSize: 11,
    color: t.colors.SubtleText,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: t.spacing['2'],
  },
  confirmCard: {
    backgroundColor: t.colors.ConfirmationCardSurface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: t.colors.ConfirmationCardEdge,
    borderRadius: 14,
    padding: t.spacing['4'],
    marginVertical: t.spacing['2'],
    ...t.elevation.Raised,
  },
  confirmEyebrow: {
    fontFamily: t.typography.fonts.UISemi,
    fontSize: 10,
    letterSpacing: 1.2,
    color: t.colors.SupportingText,
    marginBottom: t.spacing['3'],
  },
  confirmList: {
    gap: t.spacing['3'],
    marginBottom: t.spacing['4'],
  },
  confirmRow: {
    flexDirection: 'column',
    gap: 4,
  },
  confirmRowLabel: {
    fontFamily: t.typography.fonts.UISemi,
    fontSize: 10,
    letterSpacing: 0.8,
    color: t.colors.PrimaryText,
    opacity: 0.6,
  },
  confirmRowText: {
    fontFamily: t.typography.fonts.Reading,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.PrimaryText,
    fontStyle: 'italic',
  },
  confirmError: {
    fontFamily: t.typography.fonts.Mono,
    fontSize: 12,
    color: t.colors.WarnAccent,
    marginBottom: t.spacing['3'],
  },
  acceptBtn: {
    paddingVertical: t.spacing['3'],
    paddingHorizontal: t.spacing['4'],
    borderRadius: 999,
    backgroundColor: t.colors.PrimaryText,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: t.a11y.MinTapTarget,
  },
  acceptBtnRunning: {
    opacity: 0.85,
  },
  acceptInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing['2'],
  },
  acceptLabel: {
    fontFamily: t.typography.fonts.UISemi,
    fontSize: 14,
    color: t.colors.InverseText,
    letterSpacing: 0.2,
  },
  acceptHint: {
    fontFamily: t.typography.fonts.UI,
    fontSize: 11,
    color: t.colors.SubtleText,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: t.spacing['2'],
  },
});
