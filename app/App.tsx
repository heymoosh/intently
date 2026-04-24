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

function ConnectionBanner({ status }: { status: ConnStatus }) {
  let text = '';
  let style = styles.bannerIdle;
  switch (status.kind) {
    case 'idle':
      text = '⏺ Supabase: idle';
      break;
    case 'checking':
      text = '… Supabase: checking';
      break;
    case 'ok':
      text = `✓ Supabase connected · markdown_files visible to you: ${status.rows}`;
      style = styles.bannerOk;
      break;
    case 'error':
      text = `✗ Supabase: ${status.message}`;
      style = styles.bannerError;
      break;
  }
  return (
    <View style={[styles.banner, style]}>
      <Text style={styles.bannerText}>{text}</Text>
    </View>
  );
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
      <View style={[styles.liveTrigger, styles.liveTriggerLoading]}>
        <ActivityIndicator size="small" color={t.colors.FocusObjectText} />
        <Text style={styles.liveTriggerLabel}>Running the agent…</Text>
      </View>
    );
  }
  const label = state.kind === 'ok' ? 'Regenerate live brief' : 'Generate live brief';
  return (
    <View>
      <Pressable style={styles.liveTrigger} onPress={onPress}>
        <Text style={styles.liveTriggerLabel}>{label}</Text>
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
  // equivalent. animated:false = no visible scroll, feels like infinite rotation.
  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (pageWidth <= 0) return;
    const x = e.nativeEvent.contentOffset.x;
    const slot = Math.round(x / pageWidth);
    if (slot === SLOT_FUTURE_CLONE) {
      pager.current?.scrollTo({ x: SLOT_FUTURE * pageWidth, animated: false });
    } else if (slot === SLOT_PAST_CLONE) {
      pager.current?.scrollTo({ x: SLOT_PAST * pageWidth, animated: false });
    }
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

  const pastScreen = (
    <Screen
      md={pastMd}
      header={<NewJournalEntryButton onPress={() => setJournalOpen(true)} />}
    />
  );
  const presentScreen = (
    <Screen
      banner={<ConnectionBanner status={status} />}
      content={
        <View>
          <LiveBriefTrigger state={liveBrief} onPress={handleGenerateLiveBrief} />
          <AgentOutputCard output={displayOutput} />
        </View>
      }
    />
  );
  const futureScreen = <Screen md={futureMd} />;

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
      >
        <View key="future-clone" style={{ width: pageWidth }}>{futureScreen}</View>
        <View key="past" style={{ width: pageWidth }}>{pastScreen}</View>
        <View key="present" style={{ width: pageWidth }}>{presentScreen}</View>
        <View key="future" style={{ width: pageWidth }}>{futureScreen}</View>
        <View key="past-clone" style={{ width: pageWidth }}>{pastScreen}</View>
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
  liveTrigger: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: t.spacing['2'],
    paddingHorizontal: t.spacing['4'],
    paddingVertical: t.spacing['3'],
    borderRadius: t.radius.Chip,
    backgroundColor: t.colors.FocusObject,
    marginBottom: t.spacing['4'],
    minHeight: t.a11y.MinTapTarget,
  },
  liveTriggerLoading: {
    backgroundColor: t.colors.FocusObject,
    opacity: 0.75,
  },
  liveTriggerLabel: {
    fontFamily: t.typography.fonts.UISemi,
    fontSize: 14,
    color: t.colors.FocusObjectText,
  },
  liveTriggerError: {
    fontFamily: t.typography.fonts.Mono,
    fontSize: 11,
    color: t.colors.FocusObjectText,
    marginBottom: t.spacing['4'],
  },
});
