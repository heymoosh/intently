import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Markdown from 'react-native-markdown-display';
import PagerView from 'react-native-pager-view';
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

const presentMd = `# Today

_Your morning briefing will appear here once the \`daily-brief\` agent runs._

**Primary block (P1):** ship the Expo shell.
**Secondary block (P2):** Managed Agents SDK wiring.
**Admin block (P3):** inbox, tracker sync.
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

function Screen({ md, banner }: { md: string; banner?: React.ReactNode }) {
  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {banner}
        <Markdown>{md}</Markdown>
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

export default function App() {
  const pager = useRef<PagerView>(null);
  const [status, setStatus] = useState<ConnStatus>({ kind: 'idle' });

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

  return (
    <View style={styles.container}>
      <PagerView ref={pager} style={styles.pager} initialPage={1}>
        <View key="past"><Screen md={pastMd} /></View>
        <View key="present"><Screen md={presentMd} banner={<ConnectionBanner status={status} />} /></View>
        <View key="future"><Screen md={futureMd} /></View>
      </PagerView>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.PrimarySurface, paddingTop: 60 },
  pager: { flex: 1 },
  screen: { flex: 1, backgroundColor: theme.colors.PrimarySurface },
  scroll: { padding: theme.spacing.lg, paddingBottom: 140 },
  banner: {
    padding: theme.spacing.md,
    borderRadius: theme.radius.sm,
    marginBottom: theme.spacing.base,
  },
  bannerIdle: { backgroundColor: theme.colors.SecondarySurface },
  bannerOk: { backgroundColor: theme.colors.ConfirmationBanner },
  bannerError: { backgroundColor: theme.colors.WarningBanner },
  bannerText: { ...theme.typography.mono, color: theme.colors.PrimaryText },
  voiceButton: {
    position: 'absolute',
    bottom: 40,
    right: theme.spacing.lg,
    width: 72,
    height: 72,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.FocusObject,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.elevation.floating,
  },
  voiceIcon: { fontSize: 32, color: theme.colors.FocusObjectText },
});
