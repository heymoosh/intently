// Conversational evening daily-review overlay per design HANDOFF + intently-flows.jsx →
// ReviewFlow / AutoCheckList / ReviewConfirmCard. Tap evening midnight CTA → agent
// greeting → AutoCheckList animation ("what I saw you do") → 3-question scripted Q&A
// (highlight / friction / tomorrow seed) → ReviewConfirmCard preview → accept fires
// the daily-review MA call. Mirrors the BriefFlow pattern so the demo runs the same
// "agent IS the interface" beat at evening close as it does at morning open.
//
// Persona/scenario stays Sam, hackathon Friday — userDefaults below are pulled from
// the same daily-review-seed scenario (4th MA request 200, font-family displaced,
// Saturday recording day) so the conversation is coherent with the live MA payload.
//
// V1 cut: scripted defaults backstop user input. Calendar preview in the
// ReviewConfirmCard is a static Saturday-recording-day shape; V1 has no calendar
// tool wiring, so this is a coherent demo prop, not a live read.
//
// Dark midnight palette per design source (linear-gradient 1F1B35 → 2E274A → 46386A).
// Carried inline rather than tokenized — this is the only midnight surface in the app
// today; if a second one lands, promote it to tokens.ts.

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
type ChecklistMessage = { role: 'checklist' };
type Message = AgentMessage | UserMessage | ChecklistMessage;

type ScriptStep = {
  agent: string;
  agentSub?: string;
  typing: number;
  input?: { placeholder: string };
  userDefault?: string;
  confirm?: boolean;
  autoCheck?: boolean;
};

// REVIEW_SCRIPT mirrors design source intently-flows.jsx:677–707 with userDefaults
// rewritten for Sam's hackathon-Friday scenario (matches daily-review-seed.ts).
// Original design defaults referenced an Anya/Jordan demo persona that conflicts
// with the locked Sam persona — task brief explicitly forbids introducing Maya,
// and the same logic applies here. Keep the same script *shape*; replace content.
const SCRIPT: ScriptStep[] = [
  {
    agent: "Let's close the day out.",
    agentSub: "I'll mark what I heard you do — protest anything I got wrong.",
    typing: 1200,
    autoCheck: true,
  },
  {
    agent: "What's the one thing from today you want to remember?",
    typing: 1400,
    input: { placeholder: 'Say the thing.' },
    userDefault:
      'The fourth MA request came back 200 after I empirically fixed three schema bugs. Real Opus output on a public URL — the demo is real now.',
  },
  {
    agent: 'And the friction — what tripped you up?',
    typing: 1300,
    input: { placeholder: 'No need to be tidy about it.' },
    userDefault:
      "Tokens font-family fix kept getting displaced. And I skipped the strength slot — that's two slots in a row.",
  },
  {
    agent: 'Okay. One thing to carry into tomorrow?',
    typing: 1200,
    input: { placeholder: 'Something light — a direction, not a to-do.' },
    userDefault: 'Protect Saturday morning for one clean end-to-end dry run before I try a take.',
  },
  {
    agent: "Good work today. Here's what I'll save.",
    typing: 1400,
    confirm: true,
  },
];

// Default auto-check items (passed in as prop from App.tsx). Sourced from Sam's
// hackathon Friday brief plan (daily-brief-seed.ts) — these are the things the
// agent would infer from the day's journal/log/calendar feed.
export const DEFAULT_AUTO_CHECK_ITEMS = [
  'Pairing with Kaya at 9 AM',
  'Tool scaffolds — finished',
  'Started Managed Agents invocation surface',
  'Anya 1:1 at 3:30',
  'Hard stop 21:00 honored',
];

export type ReviewAnswers = { highlight: string; friction: string; tomorrow: string };

type Props = {
  visible: boolean;
  onClose: () => void;
  onAccept: (answers: ReviewAnswers) => void;
  agentRunning: boolean;
  agentError?: string | null;
  autoCheckItems?: string[];
};

export default function ReviewFlow({
  visible,
  onClose,
  onAccept,
  agentRunning,
  agentError,
  autoCheckItems,
}: Props) {
  const items = autoCheckItems && autoCheckItems.length > 0 ? autoCheckItems : DEFAULT_AUTO_CHECK_ITEMS;
  const [step, setStep] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [agentTyping, setAgentTyping] = useState(true);
  const [draft, setDraft] = useState('');
  const [answers, setAnswers] = useState<{ highlight?: string; friction?: string; tomorrow?: string }>({});
  // -1 means no item is checked yet. The stagger effect ticks this up to items.length-1.
  const [checkedIndex, setCheckedIndex] = useState(-1);
  const scrollRef = useRef<ScrollView>(null);

  // Reset all script state every time the overlay opens — repeat-runs need a clean
  // slate (especially checkedIndex; otherwise stale checks bleed into the next open).
  useEffect(() => {
    if (visible) {
      setStep(0);
      setMessages([]);
      setAgentTyping(true);
      setDraft('');
      setAnswers({});
      setCheckedIndex(-1);
    }
  }, [visible]);

  // Drive the script: when step advances, post the agent turn after the typing
  // delay. If the step has autoCheck, append a checklist message after the agent
  // bubble lands so the AutoCheckList component appears in-flow.
  useEffect(() => {
    if (!visible) return;
    const s = SCRIPT[step];
    if (!s) return;
    setAgentTyping(true);
    const timer = setTimeout(() => {
      setMessages((m) => {
        const next: Message[] = [...m, { role: 'agent', text: s.agent, sub: s.agentSub }];
        if (s.autoCheck) next.push({ role: 'checklist' });
        return next;
      });
      setAgentTyping(false);
    }, s.typing);
    return () => clearTimeout(timer);
  }, [step, visible]);

  // Stagger the auto-check animation: once a checklist is in the message list,
  // increment checkedIndex on a 420ms tick (500ms first tick) until all items
  // are checked. Matches design intently-flows.jsx:740–745.
  useEffect(() => {
    if (!visible) return;
    const hasChecklist = messages.some((m) => m.role === 'checklist');
    if (!hasChecklist) return;
    if (checkedIndex >= items.length - 1) return;
    const delay = checkedIndex < 0 ? 500 : 420;
    const timer = setTimeout(() => setCheckedIndex((i) => i + 1), delay);
    return () => clearTimeout(timer);
  }, [messages, checkedIndex, items.length, visible]);

  // Auto-advance past the autoCheck step once all items have animated in.
  useEffect(() => {
    if (!visible) return;
    const s = SCRIPT[step];
    if (!s || !s.autoCheck) return;
    if (checkedIndex !== items.length - 1) return;
    const timer = setTimeout(() => setStep((n) => n + 1), 900);
    return () => clearTimeout(timer);
  }, [checkedIndex, step, visible, items.length]);

  // Keep the scroll pinned to the latest message so new bubbles + the typing
  // indicator + the staggering checklist stay visible without manual scrolling.
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollToEnd({ animated: true });
    }
  }, [messages, agentTyping, checkedIndex]);

  const current = SCRIPT[step];
  const showInput = !!(current && current.input && !agentTyping);
  const showConfirm = !!(current && current.confirm && !agentTyping);

  const submit = (text: string) => {
    if (!current) return;
    const value = text.trim() || current.userDefault || '';
    if (!value) return;
    setMessages((m) => [...m, { role: 'user', text: value }]);
    if (step === 1) setAnswers((a) => ({ ...a, highlight: value }));
    if (step === 2) setAnswers((a) => ({ ...a, friction: value }));
    if (step === 3) setAnswers((a) => ({ ...a, tomorrow: value }));
    setDraft('');
    setTimeout(() => setStep((n) => n + 1), 260);
  };

  const handleAccept = () => {
    onAccept({
      highlight: answers.highlight ?? SCRIPT[1].userDefault!,
      friction: answers.friction ?? SCRIPT[2].userDefault!,
      tomorrow: answers.tomorrow ?? SCRIPT[3].userDefault!,
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
            <View style={styles.moonDot} />
            <Text style={styles.eyebrow}>DAILY REVIEW</Text>
          </View>
          <Pressable
            onPress={onClose}
            hitSlop={12}
            style={styles.closeBtn}
            accessibilityLabel="Close review"
          >
            <Text style={styles.closeGlyph}>✕</Text>
          </Pressable>
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.thread}
          contentContainerStyle={styles.threadContent}
        >
          {messages.map((m, i) => {
            if (m.role === 'checklist') {
              return <AutoCheckList key={i} items={items} checkedIndex={checkedIndex} />;
            }
            return <ChatBubble key={i} message={m} />;
          })}
          {agentTyping ? <AgentTyping /> : null}
          {showConfirm ? (
            <ReviewConfirmCard
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
                placeholderTextColor="rgba(251,246,234,0.4)"
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

function ChatBubble({ message }: { message: AgentMessage | UserMessage }) {
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
        <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextAgent]}>
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

// AutoCheckList — animated stagger, items checked one at a time on a 420ms
// cadence. Visual treatment: subtle cream-on-midnight, with a soft glow ring
// on the most recently checked item to draw the eye to the motion.
function AutoCheckList({ items, checkedIndex }: { items: string[]; checkedIndex: number }) {
  return (
    <View style={styles.checkListCard}>
      <Text style={styles.checkListEyebrow}>WHAT I SAW YOU DO</Text>
      <View style={styles.checkListBody}>
        {items.map((it, i) => {
          const checked = i <= checkedIndex;
          const isCurrent = i === checkedIndex;
          return (
            <View key={i} style={[styles.checkRow, !checked && styles.checkRowDim]}>
              <View
                style={[
                  styles.checkBox,
                  checked && styles.checkBoxChecked,
                  isCurrent && styles.checkBoxCurrent,
                ]}
              >
                {checked ? <Text style={styles.checkGlyph}>✓</Text> : null}
              </View>
              <Text
                style={[
                  styles.checkText,
                  checked && styles.checkTextChecked,
                ]}
              >
                {it}
              </Text>
            </View>
          );
        })}
      </View>
      {checkedIndex >= items.length - 1 ? (
        <Text style={styles.checkListHint}>
          Got these right? Otherwise just say "wait —"
        </Text>
      ) : null}
    </View>
  );
}

// ReviewConfirmCard — preview of what the agent will save, derived from the
// user's three answers. Mirrors BriefConfirmCard's pattern (render the answers,
// not hardcoded text). The "what's on tomorrow" sub-block is a coherent
// Saturday-recording-day shape pulled from the hackathon scenario; V1 has no
// calendar wiring so this is a static demo prop, not a live read.
function ReviewConfirmCard({
  answers,
  onAccept,
  running,
  error,
}: {
  answers: { highlight?: string; friction?: string; tomorrow?: string };
  onAccept: () => void;
  running: boolean;
  error?: string | null;
}) {
  const highlight = answers.highlight ?? SCRIPT[1].userDefault ?? '';
  const friction = answers.friction ?? SCRIPT[2].userDefault ?? '';
  const tomorrow = answers.tomorrow ?? SCRIPT[3].userDefault ?? '';
  return (
    <View style={styles.confirmCard}>
      <Text style={styles.confirmEyebrow}>I'LL SAVE THIS</Text>
      <View style={styles.confirmList}>
        <View style={styles.confirmRow}>
          <Text style={styles.confirmRowLabel}>JOURNAL · TODAY</Text>
          <Text style={styles.confirmRowText}>"{highlight}"</Text>
        </View>
        <View style={styles.confirmRow}>
          <Text style={styles.confirmRowLabel}>FRICTION</Text>
          <Text style={styles.confirmRowSubtle}>{friction}</Text>
        </View>
      </View>

      <View style={styles.tomorrowChip}>
        <Text style={styles.tomorrowEyebrow}>☀  CARRYING INTO TOMORROW</Text>
        <Text style={styles.tomorrowText}>"{tomorrow}"</Text>
        <View style={styles.tomorrowDivider} />
        <Text style={styles.tomorrowSubEyebrow}>WHAT'S ON THE CALENDAR</Text>
        {[
          { time: '09:00', body: 'Clean dry run — record day' },
          { time: '14:00', body: 'Hackathon submission window opens' },
          { time: '20:00', body: 'Submission deadline (8 PM EDT)' },
        ].map((e, i) => (
          <View key={i} style={styles.tomorrowEventRow}>
            <Text style={styles.tomorrowEventTime}>{e.time}</Text>
            <Text style={styles.tomorrowEventBody}>{e.body}</Text>
          </View>
        ))}
      </View>

      {error ? <Text style={styles.confirmError}>{error}</Text> : null}
      <Pressable
        style={[styles.acceptBtn, running && styles.acceptBtnRunning]}
        onPress={running ? undefined : onAccept}
        accessibilityLabel="Accept and close the day"
      >
        {running ? (
          <View style={styles.acceptInner}>
            <ActivityIndicator size="small" color="#2A2348" />
            <Text style={styles.acceptLabel}>Closing the day…</Text>
          </View>
        ) : (
          <Text style={styles.acceptLabel}>Accept &amp; close the day</Text>
        )}
      </Pressable>
      <Text style={styles.acceptHint}>or keep talking to tweak it</Text>
    </View>
  );
}

// Midnight palette pulled from design source linear-gradient(180deg, #1F1B35 0%,
// #2E274A 50%, #46386A 100%). On web, react-native-web passes backgroundImage
// straight to the DOM; on native we fall back to the solid mid-tone — fine for
// hackathon, the gradient is a web-demo nicety.
const SHEET_BACKGROUND_NATIVE = '#2E274A';
const SHEET_BACKGROUND_WEB = 'linear-gradient(180deg, #1F1B35 0%, #2E274A 50%, #46386A 100%)';
const CREAM = '#FBF6EA';
const CREAM_DIM = 'rgba(251,246,234,0.65)';
const CREAM_FAINT = 'rgba(251,246,234,0.5)';
const CARD_BG = 'rgba(251,246,234,0.08)';
const CARD_EDGE = 'rgba(251,246,234,0.16)';
const ACCENT_LILAC = '#E6DFF5';
const ACCENT_LILAC_INK = '#2A2348';
const SAGE_CHECK = '#B8D0BE';
const BUTTER_50 = '#F5EBCF';
const BUTTER_BG = 'rgba(245,235,207,0.12)';
const BUTTER_EDGE = 'rgba(245,235,207,0.28)';

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
    backgroundColor: SHEET_BACKGROUND_NATIVE,
    backgroundImage: SHEET_BACKGROUND_WEB,
    paddingTop: 60,
  } as any,
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
  moonDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: ACCENT_LILAC,
  },
  eyebrow: {
    fontFamily: t.typography.fonts.UISemi,
    fontSize: 11,
    letterSpacing: 1.4,
    color: ACCENT_LILAC,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(251,246,234,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeGlyph: {
    fontSize: 16,
    color: CREAM,
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
    backgroundColor: CARD_BG,
    borderTopLeftRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_EDGE,
  },
  bubbleUser: {
    backgroundColor: ACCENT_LILAC,
    borderTopRightRadius: 6,
  },
  bubbleText: {
    fontFamily: t.typography.fonts.Reading,
    fontSize: 15,
    lineHeight: 22,
  },
  bubbleTextAgent: {
    color: CREAM,
  },
  bubbleTextUser: {
    color: ACCENT_LILAC_INK,
  },
  bubbleSub: {
    marginTop: t.spacing['2'],
    fontFamily: t.typography.fonts.Reading,
    fontSize: 13,
    lineHeight: 19,
    color: CREAM_DIM,
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
    backgroundColor: 'rgba(251,246,234,0.55)',
  },
  composerWrap: {
    backgroundColor: 'rgba(31,27,53,0.55)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(251,246,234,0.12)',
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
    color: CREAM,
    paddingHorizontal: t.spacing['4'],
    paddingVertical: t.spacing['2'],
    borderRadius: 999,
    backgroundColor: CARD_BG,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_EDGE,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ACCENT_LILAC,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendGlyph: {
    color: ACCENT_LILAC_INK,
    fontSize: 18,
    fontFamily: t.typography.fonts.UISemi,
  },
  suggestionHint: {
    fontFamily: t.typography.fonts.UI,
    fontSize: 11,
    color: CREAM_FAINT,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: t.spacing['2'],
  },
  // ─── AutoCheckList ──────────────────────────────────────────────────
  checkListCard: {
    padding: t.spacing['4'],
    backgroundColor: 'rgba(251,246,234,0.06)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_EDGE,
    borderRadius: 14,
  },
  checkListEyebrow: {
    fontFamily: t.typography.fonts.UISemi,
    fontSize: 10,
    letterSpacing: 1.2,
    color: CREAM_DIM,
    marginBottom: t.spacing['3'],
  },
  checkListBody: {
    gap: t.spacing['2'],
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: t.spacing['3'],
  },
  checkRowDim: {
    opacity: 0.4,
  },
  checkBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(251,246,234,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  checkBoxChecked: {
    backgroundColor: SAGE_CHECK,
    borderColor: SAGE_CHECK,
  },
  // The "current" checkbox gets a soft glow ring + scale bump so the eye
  // tracks the staggering animation — design source intently-flows.jsx:916–918.
  checkBoxCurrent: {
    transform: [{ scale: 1.15 }],
    shadowColor: SAGE_CHECK,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
  },
  checkGlyph: {
    fontFamily: t.typography.fonts.UISemi,
    fontSize: 12,
    color: ACCENT_LILAC_INK,
  },
  checkText: {
    flex: 1,
    fontFamily: t.typography.fonts.Reading,
    fontSize: 14,
    lineHeight: 20,
    color: CREAM,
  },
  checkTextChecked: {
    textDecorationLine: 'line-through',
    textDecorationColor: CREAM_FAINT,
  },
  checkListHint: {
    marginTop: t.spacing['3'],
    fontFamily: t.typography.fonts.UI,
    fontSize: 11,
    color: CREAM_FAINT,
    fontStyle: 'italic',
  },
  // ─── ReviewConfirmCard ──────────────────────────────────────────────
  confirmCard: {
    backgroundColor: CARD_BG,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(251,246,234,0.18)',
    borderRadius: 14,
    padding: t.spacing['4'],
    marginTop: t.spacing['1'],
  },
  confirmEyebrow: {
    fontFamily: t.typography.fonts.UISemi,
    fontSize: 10,
    letterSpacing: 1.2,
    color: CREAM_DIM,
    marginBottom: t.spacing['2'],
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
    letterSpacing: 1,
    color: CREAM_FAINT,
  },
  confirmRowText: {
    fontFamily: t.typography.fonts.Display,
    fontSize: 17,
    lineHeight: 23,
    color: CREAM,
    fontStyle: 'italic',
    letterSpacing: -0.2,
  },
  confirmRowSubtle: {
    fontFamily: t.typography.fonts.Reading,
    fontSize: 14,
    lineHeight: 20,
    color: CREAM,
    opacity: 0.85,
  },
  tomorrowChip: {
    backgroundColor: BUTTER_BG,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BUTTER_EDGE,
    borderRadius: 12,
    padding: t.spacing['4'],
    marginBottom: t.spacing['4'],
  },
  tomorrowEyebrow: {
    fontFamily: t.typography.fonts.UISemi,
    fontSize: 10,
    letterSpacing: 1.2,
    color: BUTTER_50,
    marginBottom: t.spacing['2'],
  },
  tomorrowText: {
    fontFamily: t.typography.fonts.Display,
    fontSize: 17,
    lineHeight: 23,
    color: CREAM,
    fontStyle: 'italic',
    letterSpacing: -0.2,
    marginBottom: t.spacing['3'],
  },
  tomorrowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(245,235,207,0.16)',
    marginBottom: t.spacing['3'],
  },
  tomorrowSubEyebrow: {
    fontFamily: t.typography.fonts.UISemi,
    fontSize: 10,
    letterSpacing: 1,
    color: 'rgba(245,235,207,0.55)',
    marginBottom: t.spacing['2'],
  },
  tomorrowEventRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: t.spacing['3'],
    marginBottom: 4,
  },
  tomorrowEventTime: {
    fontFamily: t.typography.fonts.Mono,
    fontSize: 10,
    color: 'rgba(245,235,207,0.7)',
    minWidth: 56,
  },
  tomorrowEventBody: {
    flex: 1,
    fontFamily: t.typography.fonts.Reading,
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(251,246,234,0.86)',
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
    backgroundColor: ACCENT_LILAC,
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
    color: ACCENT_LILAC_INK,
    letterSpacing: 0.2,
  },
  acceptHint: {
    fontFamily: t.typography.fonts.UI,
    fontSize: 11,
    color: CREAM_FAINT,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: t.spacing['2'],
  },
});
