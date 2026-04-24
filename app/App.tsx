import { Fraunces_500Medium, Fraunces_600SemiBold, useFonts } from '@expo-google-fonts/fraunces';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { JetBrainsMono_400Regular } from '@expo-google-fonts/jetbrains-mono';
import { SourceSerif4_400Regular } from '@expo-google-fonts/source-serif-4';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
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
import { dailyBriefSeed } from './fixtures/daily-brief-seed';
import { supabase } from './lib/supabase';
import { theme } from './lib/tokens';

// Placeholder markdown per screen. Real content flows from markdown_files in Supabase
// once the agent pipeline is wired. See TRACKER items 2–5.
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

  // Track viewport width so the three screens resize on rotation / browser resize.
  // Dimensions.addEventListener is polyfilled by react-native-web.
  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
    });
    return () => sub?.remove();
  }, []);

  if (!fontsLoaded) return null;

  const pageWidth = screenWidth;

  // contentOffset is unreliable on react-native-web; scroll to Present on
  // first layout so the app opens on the agent-output card, not Past.
  const onPagerContentSized = () => {
    if (!initialized.current && pageWidth > 0) {
      pager.current?.scrollTo({ x: pageWidth, animated: false });
      initialized.current = true;
    }
  };

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
        <View key="past" style={{ width: pageWidth }}>
          <Screen
            md={pastMd}
            header={<NewJournalEntryButton onPress={() => setJournalOpen(true)} />}
          />
        </View>
        <View key="present" style={{ width: pageWidth }}>
          <Screen
            content={<AgentOutputCard output={dailyBriefSeed} />}
            banner={<ConnectionBanner status={status} />}
          />
        </View>
        <View key="future" style={{ width: pageWidth }}>
          <Screen md={futureMd} />
        </View>
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
});
