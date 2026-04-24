import { Fraunces_500Medium, Fraunces_600SemiBold, useFonts } from '@expo-google-fonts/fraunces';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { JetBrainsMono_400Regular } from '@expo-google-fonts/jetbrains-mono';
import { SourceSerif4_400Regular } from '@expo-google-fonts/source-serif-4';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Markdown from '@ronradtke/react-native-markdown-display';
import AgentOutputCard from './components/AgentOutputCard';
import JournalEditor from './components/JournalEditor';
import { AgentOutput } from './lib/agent-output';
import { callMaProxy, MaProxyError, MaSkill, toAgentOutput } from './lib/ma-client';
import { DAILY_BRIEF_DEMO_INPUT, dailyBriefSeed } from './fixtures/daily-brief-seed';
import { DAILY_REVIEW_DEMO_INPUT, dailyReviewSeed } from './fixtures/daily-review-seed';
import { WEEKLY_REVIEW_DEMO_INPUT, weeklyReviewSeed } from './fixtures/weekly-review-seed';
import { supabase } from './lib/supabase';
import { theme } from './lib/tokens';

type ConnStatus =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'ok'; rows: number }
  | { kind: 'error'; message: string };

type LiveState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'ok'; output: AgentOutput }
  | { kind: 'error'; message: string };

// Dev-only Supabase status pill. Hidden in normal state so the demo surface
// isn't cluttered; we only surface an error (user-meaningful).
function ConnectionBanner({ status }: { status: ConnStatus }) {
  if (status.kind !== 'error') return null;
  return (
    <View style={[styles.banner, styles.bannerError]}>
      <Text style={styles.bannerText}>Supabase: {status.message}</Text>
    </View>
  );
}

function ScreenHeader({
  tense,
  title,
}: {
  tense: string;
  title: string;
}) {
  return (
    <View style={styles.screenHeader}>
      <Text style={styles.screenHeaderTense}>{tense}</Text>
      <Text style={styles.screenHeaderTitle}>{title}</Text>
    </View>
  );
}

function formatDateHeader(now: Date = new Date()): string {
  const day = now.toLocaleDateString('en-US', { weekday: 'long' });
  const month = now.toLocaleDateString('en-US', { month: 'long' });
  return `${day}, ${month} ${now.getDate()}`;
}

function LiveAgentTrigger({
  state,
  onPress,
  idleLabel,
  regenerateLabel = '↻ Regenerate',
}: {
  state: LiveState;
  onPress: () => void;
  idleLabel: string;
  regenerateLabel?: string;
}) {
  if (state.kind === 'loading') {
    return (
      <View style={[styles.liveTriggerPill, styles.liveTriggerLoading]}>
        <ActivityIndicator size="small" color={t.colors.SupportingText} />
        <Text style={styles.liveTriggerPillLabel}>Running agent…</Text>
      </View>
    );
  }
  const label = state.kind === 'ok' ? regenerateLabel : idleLabel;
  return (
    <View>
      <Pressable style={styles.liveTriggerPill} onPress={onPress}>
        <Text style={styles.liveTriggerPillLabel}>{label}</Text>
      </Pressable>
      {state.kind === 'error' ? (
        <Text style={styles.liveTriggerError}>{state.message}</Text>
      ) : null}
    </View>
  );
}

function Screen({
  md,
  content,
  banner,
  header,
}: {
  md?: string;
  content?: React.ReactNode;
  banner?: React.ReactNode;
  header?: React.ReactNode;
}) {
  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {banner}
        {header}
        {content ?? (md ? <Markdown>{md}</Markdown> : null)}
      </ScrollView>
      <Pressable
        style={styles.voiceButton}
        onPress={() =>
          Alert.alert('Voice capture', 'Stub — STT wiring lands with the agent pipeline.')
        }
      >
        <Text style={styles.voiceIcon}>🎙</Text>
      </Pressable>
    </View>
  );
}

function NewJournalEntryButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable style={styles.newEntryButton} onPress={onPress}>
      <Text style={styles.newEntryLabel}>+ New journal entry</Text>
    </Pressable>
  );
}

// Infinite-ish rotation: repeat [Past, Present, Future] across many slots so
// the user can keep swiping in either direction through the rotation. Start
// scrolled to the middle cycle's Present. Clone-slot wrap logic was fragile on
// react-native-web; the repeat pattern eliminates the wrap handler entirely.
// 7 cycles × 3 screens = 21 slots. Middle Present = slot 10.
const CYCLES = 7;
const SCREENS_PER_CYCLE = 3;
const TOTAL_SLOTS = CYCLES * SCREENS_PER_CYCLE;
const INITIAL_SLOT = Math.floor(TOTAL_SLOTS / 2); // 10
// slot % 3: 0 = Past, 1 = Present, 2 = Future

export default function App() {
  const [fontsLoaded] = useFonts({
    Fraunces_500Medium,
    Fraunces_600SemiBold,
    SourceSerif4_400Regular,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    JetBrainsMono_400Regular,
  });
  const pager = useRef<ScrollView>(null);
  const initialized = useRef(false);
  const [screenWidth, setScreenWidth] = useState(() => Dimensions.get('window').width);
  const [status, setStatus] = useState<ConnStatus>({ kind: 'idle' });
  const [journalOpen, setJournalOpen] = useState(false);
  const [liveBrief, setLiveBrief] = useState<LiveState>({ kind: 'idle' });
  const [liveReview, setLiveReview] = useState<LiveState>({ kind: 'idle' });
  const [liveWeekly, setLiveWeekly] = useState<LiveState>({ kind: 'idle' });

  useEffect(() => {
    let cancelled = false;
    setStatus({ kind: 'checking' });
    supabase
      .from('markdown_files')
      .select('*', { count: 'exact', head: true })
      .then(({ count, error }) => {
        if (cancelled) return;
        if (error) setStatus({ kind: 'error', message: error.message });
        else setStatus({ kind: 'ok', rows: count ?? 0 });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
    });
    return () => sub?.remove();
  }, []);

  if (!fontsLoaded) return null;

  const pageWidth = screenWidth;

  // Initial scroll to INITIAL_SLOT (middle cycle's Present) on first layout.
  const onPagerContentSized = () => {
    if (!initialized.current && pageWidth > 0) {
      pager.current?.scrollTo({ x: INITIAL_SLOT * pageWidth, animated: false });
      initialized.current = true;
    }
  };

  const runAgent = async (
    skill: MaSkill,
    input: string,
    meta: Pick<AgentOutput, 'kind' | 'title' | 'inputTraces'>,
    setState: (s: LiveState) => void,
  ) => {
    setState({ kind: 'loading' });
    try {
      const res = await callMaProxy({ skill, input });
      if (res.status !== 'idle' || !res.finalText) {
        setState({
          kind: 'error',
          message: `Agent returned status "${res.status}" with no text. Try again.`,
        });
        return;
      }
      setState({ kind: 'ok', output: toAgentOutput(res.finalText, meta) });
    } catch (err) {
      const message =
        err instanceof MaProxyError
          ? `${err.message} (HTTP ${err.status || 'network'})`
          : err instanceof Error
          ? err.message
          : 'Unknown error calling ma-proxy.';
      setState({ kind: 'error', message });
    }
  };

  const handleGenerateLiveBrief = () =>
    runAgent('daily-brief', DAILY_BRIEF_DEMO_INPUT, {
      kind: 'brief',
      title: 'Good morning, Sam',
      inputTraces: ['calendar', 'journal'],
    }, setLiveBrief);

  const handleGenerateLiveReview = () =>
    runAgent('daily-review', DAILY_REVIEW_DEMO_INPUT, {
      kind: 'review',
      title: 'Today, in review',
      inputTraces: ['calendar', 'journal'],
    }, setLiveReview);

  const handleGenerateLiveWeekly = () =>
    runAgent('weekly-review', WEEKLY_REVIEW_DEMO_INPUT, {
      kind: 'review',
      title: 'Week in review',
      inputTraces: ['calendar', 'journal'],
    }, setLiveWeekly);

  const briefOutput = liveBrief.kind === 'ok' ? liveBrief.output : dailyBriefSeed;
  const reviewOutput = liveReview.kind === 'ok' ? liveReview.output : dailyReviewSeed;
  const weeklyOutput = liveWeekly.kind === 'ok' ? liveWeekly.output : weeklyReviewSeed;

  const todayLabel = formatDateHeader();
  const pastScreen = (
    <Screen
      content={
        <View>
          <ScreenHeader tense="Past" title="Today, in review" />
          <LiveAgentTrigger
            state={liveReview}
            onPress={handleGenerateLiveReview}
            idleLabel="🌙 Generate today's review"
          />
          <AgentOutputCard output={reviewOutput} />
          <NewJournalEntryButton onPress={() => setJournalOpen(true)} />
        </View>
      }
    />
  );
  const presentScreen = (
    <Screen
      banner={<ConnectionBanner status={status} />}
      content={
        <View>
          <ScreenHeader tense="Today" title={todayLabel} />
          <LiveAgentTrigger
            state={liveBrief}
            onPress={handleGenerateLiveBrief}
            idleLabel="✨ Generate live brief"
          />
          <AgentOutputCard output={briefOutput} />
        </View>
      }
    />
  );
  const futureScreen = (
    <Screen
      content={
        <View>
          <ScreenHeader tense="Future" title="This week ahead" />
          <LiveAgentTrigger
            state={liveWeekly}
            onPress={handleGenerateLiveWeekly}
            idleLabel="🗓 Generate weekly review"
          />
          <AgentOutputCard output={weeklyOutput} />
        </View>
      }
    />
  );

  // Each slot needs explicit height on web: horizontal ScrollView children
  // collapse to content height otherwise, breaking the inner vertical scroll.
  // `flex: 1` + `height: '100%'` gives us the scroll-view height either way.
  const slotStyle = { width: pageWidth, height: '100%' as const };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={pager}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={styles.pager}
        onContentSizeChange={onPagerContentSized}
      >
        {Array.from({ length: TOTAL_SLOTS }, (_, i) => {
          const kind = i % SCREENS_PER_CYCLE; // 0 Past, 1 Present, 2 Future
          const screen = kind === 0 ? pastScreen : kind === 1 ? presentScreen : futureScreen;
          return (
            <View key={i} style={slotStyle}>
              {screen}
            </View>
          );
        })}
      </ScrollView>
      <JournalEditor
        visible={journalOpen}
        onClose={() => setJournalOpen(false)}
      />
      <StatusBar style="auto" />
    </View>
  );
}

const t = theme.light;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: t.colors.PrimarySurface, paddingTop: 60 },
  pager: { flex: 1 },
  screen: { flex: 1, backgroundColor: t.colors.PrimarySurface },
  scroll: { padding: t.spacing['5'], paddingBottom: 140 },
  banner: {
    padding: t.spacing['3'],
    borderRadius: t.radius.Chip,
    marginBottom: t.spacing['4'],
  },
  bannerIdle:  { backgroundColor: t.colors.SecondarySurface },
  bannerOk:    { backgroundColor: t.colors.ConfirmationCardSurface },
  bannerError: { backgroundColor: 'rgba(163, 115, 31, 0.10)' },
  bannerText: {
    fontFamily: t.typography.fonts.Mono,
    fontSize: 13,
    lineHeight: 18,
    color: t.colors.PrimaryText,
  },
  voiceButton: {
    position: 'absolute',
    bottom: 40,
    right: t.spacing['5'],
    width: 72,
    height: 72,
    borderRadius: t.radius.Pill,
    backgroundColor: t.colors.FocusObject,
    alignItems: 'center',
    justifyContent: 'center',
    ...t.elevation.Hero,
  },
  voiceIcon: { fontSize: 32, color: t.colors.FocusObjectText },
  newEntryButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: t.spacing['4'],
    paddingVertical: t.spacing['3'],
    borderRadius: t.radius.Chip,
    backgroundColor: t.colors.SecondarySurface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: t.colors.EdgeLine,
    marginBottom: t.spacing['4'],
    minHeight: t.a11y.MinTapTarget,
    justifyContent: 'center',
  },
  newEntryLabel: {
    fontFamily: t.typography.fonts.UIMedium,
    fontSize: 13,
    color: t.colors.PrimaryText,
  },
  liveTriggerPill: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing['2'],
    paddingHorizontal: t.spacing['3'],
    paddingVertical: t.spacing['2'],
    borderRadius: t.radius.Pill,
    backgroundColor: t.colors.SecondarySurface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: t.colors.EdgeLine,
    marginBottom: t.spacing['3'],
  },
  liveTriggerLoading: {
    opacity: 0.8,
  },
  liveTriggerPillLabel: {
    fontFamily: t.typography.fonts.UIMedium,
    fontSize: 12,
    color: t.colors.SupportingText,
  },
  liveTriggerError: {
    fontFamily: t.typography.fonts.Mono,
    fontSize: 11,
    color: t.colors.PrimaryText,
    marginBottom: t.spacing['3'],
    alignSelf: 'flex-end',
  },
  screenHeader: {
    marginBottom: t.spacing['4'],
  },
  screenHeaderTense: {
    fontFamily: t.typography.fonts.UISemi,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: t.colors.SupportingText,
    marginBottom: t.spacing['1'],
  },
  screenHeaderTitle: {
    fontFamily: t.typography.fonts.Display,
    fontSize: 32,
    lineHeight: 38,
    color: t.colors.PrimaryText,
    letterSpacing: -0.5,
  },
});
