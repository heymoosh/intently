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
  NativeScrollEvent,
  NativeSyntheticEvent,
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
import { callMaProxy, MaProxyError, toAgentOutput } from './lib/ma-client';
import { DAILY_BRIEF_DEMO_INPUT, dailyBriefSeed } from './fixtures/daily-brief-seed';
import { supabase } from './lib/supabase';
import { theme } from './lib/tokens';

const pastMd = `# Past

_Journal entries and prior reviews will render here._

### 2026-04-21
- Scaffolded the Intently skills, ADRs, and architecture docs.

### 2026-04-22
- Wrote the Supabase schema; shipped the Expo shell.
`;

const futureMd = `# Future

## Goals
- Intently demo ready by 2026-04-26

## Projects
- **Intently** · 🟡 · Next: Expo shell
`;

type ConnStatus =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'ok'; rows: number }
  | { kind: 'error'; message: string };

type LiveBriefState =
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

function LiveBriefTrigger({
  state,
  onPress,
}: {
  state: LiveBriefState;
  onPress: () => void;
}) {
  if (state.kind === 'loading') {
    return (
      <View style={[styles.liveTriggerPill, styles.liveTriggerLoading]}>
        <ActivityIndicator size="small" color={t.colors.SupportingText} />
        <Text style={styles.liveTriggerPillLabel}>Running agent…</Text>
      </View>
    );
  }
  const label = state.kind === 'ok' ? '↻ Regenerate' : '✨ Generate live brief';
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

// Circular carousel: 5 virtual slots [FutureClone, Past, Present, Future, PastClone].
// Initial scroll is SLOT_PRESENT. onMomentumScrollEnd jumps silently from clone
// slots back to real equivalents so swiping off either edge wraps to the
// opposite side — 1 swipe from any screen to any other.
const SLOT_FUTURE_CLONE = 0;
const SLOT_PAST = 1;
const SLOT_PRESENT = 2;
const SLOT_FUTURE = 3;
const SLOT_PAST_CLONE = 4;

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
  const wrapGuard = useRef(false);
  const [screenWidth, setScreenWidth] = useState(() => Dimensions.get('window').width);
  const [status, setStatus] = useState<ConnStatus>({ kind: 'idle' });
  const [journalOpen, setJournalOpen] = useState(false);
  const [liveBrief, setLiveBrief] = useState<LiveBriefState>({ kind: 'idle' });

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

  // Initial scroll to SLOT_PRESENT on first layout. contentOffset is unreliable
  // on react-native-web; onContentSizeChange is the canonical fallback.
  const onPagerContentSized = () => {
    if (!initialized.current && pageWidth > 0) {
      pager.current?.scrollTo({ x: SLOT_PRESENT * pageWidth, animated: false });
      initialized.current = true;
    }
  };

  // Circular wrap: when user lands on a clone slot, silently jump to the real
  // equivalent. Wired on both onMomentumScrollEnd (native + most web) AND
  // onScrollEndDrag (belt & suspenders for react-native-web, which sometimes
  // skips momentum-end after a programmatic scrollTo). wrapGuard prevents
  // both handlers from double-firing.
  const maybeWrap = (x: number) => {
    if (pageWidth <= 0 || wrapGuard.current) return;
    const slot = Math.round(x / pageWidth);
    if (slot === SLOT_FUTURE_CLONE) {
      wrapGuard.current = true;
      pager.current?.scrollTo({ x: SLOT_FUTURE * pageWidth, animated: false });
      setTimeout(() => (wrapGuard.current = false), 50);
    } else if (slot === SLOT_PAST_CLONE) {
      wrapGuard.current = true;
      pager.current?.scrollTo({ x: SLOT_PAST * pageWidth, animated: false });
      setTimeout(() => (wrapGuard.current = false), 50);
    }
  };
  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    maybeWrap(e.nativeEvent.contentOffset.x);
  };
  const onScrollEndDrag = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    // Fires when finger lifts. On web after a programmatic scrollTo the
    // momentum-end often doesn't fire; drag-end is our fallback.
    maybeWrap(e.nativeEvent.contentOffset.x);
  };

  const handleGenerateLiveBrief = async () => {
    setLiveBrief({ kind: 'loading' });
    try {
      const res = await callMaProxy({
        skill: 'daily-brief',
        input: DAILY_BRIEF_DEMO_INPUT,
      });
      if (res.status !== 'idle' || !res.finalText) {
        setLiveBrief({
          kind: 'error',
          message: `Agent returned status "${res.status}" with no text. Try again.`,
        });
        return;
      }
      const output = toAgentOutput(res.finalText, {
        kind: 'brief',
        title: 'Good morning, Sam',
        inputTraces: ['calendar', 'journal'],
      });
      setLiveBrief({ kind: 'ok', output });
    } catch (err) {
      const message =
        err instanceof MaProxyError
          ? `${err.message} (HTTP ${err.status || 'network'})`
          : err instanceof Error
          ? err.message
          : 'Unknown error calling ma-proxy.';
      setLiveBrief({ kind: 'error', message });
    }
  };

  const displayOutput = liveBrief.kind === 'ok' ? liveBrief.output : dailyBriefSeed;

  const todayLabel = formatDateHeader();
  const pastScreen = (
    <Screen
      md={pastMd}
      header={
        <>
          <ScreenHeader tense="Past" title="Earlier" />
          <NewJournalEntryButton onPress={() => setJournalOpen(true)} />
        </>
      }
    />
  );
  const presentScreen = (
    <Screen
      banner={<ConnectionBanner status={status} />}
      content={
        <View>
          <ScreenHeader tense="Today" title={todayLabel} />
          <LiveBriefTrigger state={liveBrief} onPress={handleGenerateLiveBrief} />
          <AgentOutputCard output={displayOutput} />
        </View>
      }
    />
  );
  const futureScreen = (
    <Screen
      md={futureMd}
      header={<ScreenHeader tense="Future" title="What's ahead" />}
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
        onMomentumScrollEnd={onMomentumScrollEnd}
        onScrollEndDrag={onScrollEndDrag}
      >
        <View key="future-clone" style={slotStyle}>{futureScreen}</View>
        <View key="past" style={slotStyle}>{pastScreen}</View>
        <View key="present" style={slotStyle}>{presentScreen}</View>
        <View key="future" style={slotStyle}>{futureScreen}</View>
        <View key="past-clone" style={slotStyle}>{pastScreen}</View>
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
