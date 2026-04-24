import { Fraunces_500Medium, Fraunces_600SemiBold, useFonts } from '@expo-google-fonts/fraunces';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { JetBrainsMono_400Regular } from '@expo-google-fonts/jetbrains-mono';
import { SourceSerif4_400Regular } from '@expo-google-fonts/source-serif-4';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import VoiceModal from './components/VoiceModal';
import { AgentOutput } from './lib/agent-output';
import { callMaProxy, MaProxyError, MaSkill, toAgentOutput } from './lib/ma-client';
import { DAILY_BRIEF_DEMO_INPUT, dailyBriefSeed } from './fixtures/daily-brief-seed';
import { DAILY_REVIEW_DEMO_INPUT, dailyReviewSeed } from './fixtures/daily-review-seed';
import { WEEKLY_REVIEW_DEMO_INPUT, weeklyReviewSeed } from './fixtures/weekly-review-seed';
import { fetchDueReminders, formatRemindersForInput } from './lib/reminders';
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

// Present has three data-driven phases per design handoff §3.2.
// morning = pre-brief sunrise CTA. planned = brief + plan visible.
// evening = planned + midnight CTA for daily-review. In production this is
// clock-driven; for demo we expose a dev toggle so we can record each beat.
type PresentPhase = 'morning' | 'planned' | 'evening';

// Three goals at a time per MVP spec (§2.1). Each has a monthly slice that
// refreshes on month boundary. Painterly palettes deferred to post-V1; flat
// card-surface tokens carry the visual load for now, varied so the three
// cards read as distinct.
const GOALS = [
  {
    title: 'Move to Japan.',
    monthly: 'April: finish the visa checklist and book the scouting trip for June.',
    tint: 'ConfirmationCardSurface' as const,
  },
  {
    title: 'Start a side hustle that pays my rent.',
    monthly: 'April: ship the landing page and get 10 waitlist signups from real conversations.',
    tint: 'QuestCardSurface' as const,
  },
  {
    title: 'Be someone I would want to work with.',
    monthly: 'April: one 1:1 a week, and say the hard thing out loud when it matters.',
    tint: 'UncertainCardSurface' as const,
  },
];

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
    </View>
  );
}

// Hero affordance per design handoff §1.2 — persistent bottom-right surface,
// tap opens the listening takeover. Press-and-hold radial menu deferred to
// post-V1; tap is the primary gesture for hackathon.
function HeroButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable style={styles.voiceButton} onPress={onPress}>
      <Text style={styles.voiceIcon}>🎙</Text>
    </Pressable>
  );
}

function NewJournalEntryButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable style={styles.newEntryButton} onPress={onPress}>
      <Text style={styles.newEntryLabel}>+ New journal entry</Text>
    </Pressable>
  );
}

// Derive the Present phase from clock + URL override. Morning before 10am,
// evening at/after 6pm, planned in between. For demo recording the user can
// force a phase with `?phase=morning|planned|evening`. No visible dev toggle
// — it read as primary navigation and mis-led viewers.
function derivePhase(now: Date = new Date()): PresentPhase {
  if (typeof window !== 'undefined' && window.location?.search) {
    const q = new URLSearchParams(window.location.search).get('phase');
    if (q === 'morning' || q === 'planned' || q === 'evening') return q;
  }
  const h = now.getHours();
  if (h < 10) return 'morning';
  if (h >= 18) return 'evening';
  return 'planned';
}

// Morning/evening phase CTA — larger, visually weighted as the focal
// affordance on the screen. Sunrise for morning, midnight for evening.
// Gradient is deferred per "functionality first"; solid tint carries intent.
function PhaseCta({
  label,
  onPress,
  loading,
  variant = 'morning',
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'morning' | 'evening';
}) {
  const bg =
    variant === 'evening' ? t.colors.PrimaryText : t.colors.UndoAffordance;
  const fg = t.colors.InverseText;
  return (
    <Pressable
      style={[styles.phaseCta, { backgroundColor: bg }]}
      onPress={loading ? undefined : onPress}
    >
      {loading ? (
        <ActivityIndicator size="small" color={fg} />
      ) : (
        <Text style={[styles.phaseCtaLabel, { color: fg }]}>{label}</Text>
      )}
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
  // Clock-derived phase with URL override; see derivePhase().
  const [phase, setPhase] = useState<PresentPhase>(() => derivePhase());
  const [voiceOpen, setVoiceOpen] = useState(false);

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

  // The memory loop: before calling the brief agent, fetch any reminders
  // the user committed to in prior sessions and append them to the agent's
  // input. Graceful fallback: if the reminders endpoint isn't deployed or
  // returns an error, we run the brief without them. The synthesis beat —
  // "you asked me last week to remind you about X, it's due now" — is the
  // demo moment that ties the memory architecture together on camera.
  const handleGenerateLiveBrief = async () => {
    const reminders = await fetchDueReminders();
    const input = DAILY_BRIEF_DEMO_INPUT + formatRemindersForInput(reminders);
    return runAgent('daily-brief', input, {
      kind: 'brief',
      title: 'Good morning, Sam',
      inputTraces: ['calendar', 'journal'],
    }, setLiveBrief);
  };

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

  // Past — Week view per design §3.1: default is this week. Shows the
  // weekly-review summary/outcomes, then today's Entries (brief + review)
  // chronologically beneath. Year/Month/Day zoom levels deferred to post-V1.
  // No trigger pills per BUILD-RULES: weekly-review runs Sunday evening or
  // via hero; journal entries are created through the hero affordance.
  const todayEntries: Array<{ key: string; output: AgentOutput }> = [
    { key: 'brief', output: briefOutput },
    ...(liveReview.kind === 'ok' ? [{ key: 'review', output: liveReview.output }] : []),
  ];
  const pastScreen = (
    <Screen
      content={
        <View>
          <ScreenHeader tense="Past · Week 17" title="Apr 20 — 26" />
          <Text style={styles.sectionEyebrow}>THIS WEEK'S OUTCOMES</Text>
          <AgentOutputCard output={weeklyOutput} />
          <Text style={[styles.sectionEyebrow, styles.sectionEyebrowSpaced]}>
            TODAY · {todayLabel.toUpperCase()}
          </Text>
          {todayEntries.map((e) => (
            <AgentOutputCard key={e.key} output={e.output} />
          ))}
        </View>
      }
    />
  );

  // Present — phase-driven per design §3.2. morning = pre-brief sunrise CTA;
  // planned = brief + plan; evening = planned + midnight CTA for daily-review.
  // Dev toggle at top lets us flip between phases on camera.
  const presentScreen = (
    <Screen
      banner={<ConnectionBanner status={status} />}
      content={
        <View>
          <ScreenHeader tense="Today" title={todayLabel} />
          {phase === 'morning' ? (
            <View>
              <Text style={styles.bodyLead}>
                A quiet opening. Yesterday's highlight and this week's outcomes are below;
                when you're ready, start the brief.
              </Text>
              <PhaseCta
                label="Start your daily brief"
                loading={liveBrief.kind === 'loading'}
                onPress={() => {
                  handleGenerateLiveBrief();
                  setPhase('planned');
                }}
              />
            </View>
          ) : (
            <View>
              <AgentOutputCard output={briefOutput} />
              {phase === 'evening' ? (
                <PhaseCta
                  label="Start your daily review"
                  loading={liveReview.kind === 'loading'}
                  onPress={handleGenerateLiveReview}
                  variant="evening"
                />
              ) : null}
              {liveReview.kind === 'ok' ? (
                <View style={styles.reviewInlineNote}>
                  <Text style={styles.reviewInlineNoteText}>
                    Review written. Swipe to Past to read it alongside today's brief.
                  </Text>
                </View>
              ) : null}
              {liveReview.kind === 'error' ? (
                <Text style={styles.liveTriggerError}>{liveReview.message}</Text>
              ) : null}
            </View>
          )}
        </View>
      }
    />
  );

  // Future — three goal cards + monthly slice per design §3.3. Projects band
  // deferred; goals are the primary content here.
  const futureScreen = (
    <Screen
      content={
        <View>
          <ScreenHeader tense="Future" title="What this month is for." />
          <Text style={styles.bodyLead}>
            Three long-term visions. Each one gets a monthly slice — the agent cascades
            it into weekly and daily moves on Present.
          </Text>
          {GOALS.map((g, i) => (
            <View
              key={i}
              style={[styles.goalCard, { backgroundColor: t.colors[g.tint] }]}
            >
              <Text style={styles.goalTitle}>{g.title}</Text>
              <View style={styles.goalDivider} />
              <Text style={styles.goalMonthlyEyebrow}>APRIL</Text>
              <Text style={styles.goalMonthly}>
                {g.monthly.replace(/^April:\s*/, '')}
              </Text>
            </View>
          ))}
        </View>
      }
    />
  );

  // Each slot needs explicit height on web: horizontal ScrollView children
  // collapse to content height otherwise, breaking the inner vertical scroll.
  // `flex: 1` + `height: '100%'` gives us the scroll-view height either way.
  // scrollSnapAlign lands in the DOM via react-native-web passthrough — fixes
  // the "drags like a whiteboard" feel where pagingEnabled alone doesn't snap.
  const slotStyle = {
    width: pageWidth,
    height: '100%' as const,
    scrollSnapAlign: 'start',
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
      <HeroButton onPress={() => setVoiceOpen(true)} />
      <VoiceModal
        visible={voiceOpen}
        onClose={() => setVoiceOpen(false)}
        supabaseUrl={process.env.EXPO_PUBLIC_SUPABASE_URL}
      />
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
  // scrollSnapType: react-native-web passes this through to the scrolling
  // <div>, which makes horizontal paging SNAP on web instead of dragging.
  // Combined with scrollSnapAlign on each slot, fixes the "whiteboard pan"
  // feel on Chrome/Safari/Edge. pagingEnabled alone isn't enough on web.
  pager: { flex: 1, scrollSnapType: 'x mandatory' } as any,
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
  sectionEyebrow: {
    fontFamily: t.typography.fonts.UISemi,
    fontSize: 11,
    letterSpacing: 1.2,
    color: t.colors.SupportingText,
    marginBottom: t.spacing['3'],
  },
  sectionEyebrowSpaced: {
    marginTop: t.spacing['6'],
  },
  bodyLead: {
    fontFamily: t.typography.fonts.Reading,
    fontSize: 15,
    lineHeight: 22,
    color: t.colors.SupportingText,
    marginBottom: t.spacing['4'],
  },
  phaseToggle: {
    flexDirection: 'row',
    alignSelf: 'flex-end',
    gap: 4,
    padding: 3,
    borderRadius: t.radius.Pill,
    backgroundColor: t.colors.SecondarySurface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: t.colors.EdgeLine,
    marginBottom: t.spacing['4'],
  },
  phaseChip: {
    paddingHorizontal: t.spacing['3'],
    paddingVertical: t.spacing['1'],
    borderRadius: t.radius.Pill,
  },
  phaseChipActive: {
    backgroundColor: t.colors.PrimaryText,
  },
  phaseChipLabel: {
    fontFamily: t.typography.fonts.UIMedium,
    fontSize: 11,
    letterSpacing: 0.4,
    color: t.colors.SupportingText,
    textTransform: 'capitalize' as const,
  },
  phaseChipLabelActive: {
    color: t.colors.InverseText,
  },
  phaseCta: {
    marginTop: t.spacing['4'],
    paddingVertical: t.spacing['4'],
    paddingHorizontal: t.spacing['5'],
    borderRadius: t.radius.Pill,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    ...t.elevation.Raised,
  },
  phaseCtaLabel: {
    fontFamily: t.typography.fonts.UISemi,
    fontSize: 16,
    letterSpacing: 0.2,
  },
  reviewInlineNote: {
    marginTop: t.spacing['3'],
    padding: t.spacing['3'],
    borderRadius: t.radius.Chip,
    backgroundColor: t.colors.SecondarySurface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: t.colors.EdgeLine,
  },
  reviewInlineNoteText: {
    fontFamily: t.typography.fonts.Reading,
    fontSize: 13,
    lineHeight: 18,
    color: t.colors.SupportingText,
    fontStyle: 'italic',
  },
  goalCard: {
    padding: t.spacing['5'],
    borderRadius: t.radius.Card,
    marginBottom: t.spacing['4'],
    ...t.elevation.Raised,
  },
  goalTitle: {
    fontFamily: t.typography.fonts.Display,
    fontSize: 24,
    lineHeight: 28,
    color: t.colors.PrimaryText,
    letterSpacing: -0.3,
  },
  goalDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: t.colors.EdgeLine,
    marginVertical: t.spacing['3'],
    opacity: 0.5,
  },
  goalMonthlyEyebrow: {
    fontFamily: t.typography.fonts.UISemi,
    fontSize: 10,
    letterSpacing: 1.2,
    color: t.colors.PrimaryText,
    opacity: 0.55,
    marginBottom: t.spacing['1'],
  },
  goalMonthly: {
    fontFamily: t.typography.fonts.Reading,
    fontSize: 15,
    lineHeight: 22,
    color: t.colors.PrimaryText,
    opacity: 0.86,
  },
});
