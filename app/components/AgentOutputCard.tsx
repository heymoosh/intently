import { StyleSheet, Text, View } from 'react-native';
import Markdown from '@ronradtke/react-native-markdown-display';
import {
  AgentOutput,
  InputTraceKind,
  formatGeneratedAt,
  kindMetaFor,
  labelForInputTrace,
} from '../lib/agent-output';
import { theme } from '../lib/tokens';
import PainterlyBlock from './painterly/PainterlyBlock';

const t = theme.light;

// Tint + accent per kind, mapped to the existing palette in lib/tokens.
// Mirrors the kindMeta pattern in docs/design/Intently - App/intently-journal.jsx:262-267.
const TINT_BY_KIND: Record<AgentOutput['kind'], { surface: string; edge: string }> = {
  brief:   { surface: t.colors.ConfirmationCardSurface, edge: t.colors.ConfirmationCardEdge },
  journal: { surface: t.colors.QuestCardSurface,        edge: t.colors.QuestCardEdge },
  chat:    { surface: t.colors.SecondarySurface,        edge: t.colors.EdgeLine },
  review:  { surface: t.colors.ReflectionCardSurface,   edge: t.colors.EdgeLine },
};

// Input traces shown as small chips in the footer. Color taken from the
// input-trace token family in lib/tokens.
const TRACE_DOT_COLOR: Record<InputTraceKind, string> = {
  calendar: t.colors.InputTraceCalendar,
  journal:  t.colors.InputTraceJournal,
  email:    t.colors.InputTraceEmail,
  health:   t.colors.InputTraceHealth,
};

type Props = {
  output: AgentOutput;
  now?: Date; // injectable for tests/storybook; defaults to real time in the component
};

export default function AgentOutputCard({ output, now }: Props) {
  const meta = kindMetaFor(output.kind);
  const tint = TINT_BY_KIND[output.kind];
  const isBrief = output.kind === 'brief';

  return (
    <View style={[styles.card, { backgroundColor: tint.surface, borderColor: tint.edge }]}>
      {/* Brief hero panel — painterly dusk/sage panel that lifts the daily
          brief off the page. Title rides on the painterly layer; the rest of
          the card body sits below in the existing sage surface. Only renders
          for `kind=brief` so journal/review/chat keep their flat affordance.
          Source: docs/design/Intently - App/intently-screens.jsx
          PresentMorning yesterday block. */}
      {isBrief ? (
        <View style={styles.briefHeroShell}>
          <PainterlyBlock
            palette={t.painterly.BriefHero}
            seed={7}
            style={styles.briefHero}
          >
            <View style={styles.briefHeroInner}>
              <Text style={styles.briefHeroLabel}>{meta.label.toUpperCase()}</Text>
              <Text style={styles.briefHeroTitle}>{output.title}</Text>
            </View>
          </PainterlyBlock>
        </View>
      ) : (
        <View style={styles.header}>
          <View style={styles.glyphBadge}>
            <Text style={styles.glyph}>{meta.glyph}</Text>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.label}>{meta.label.toUpperCase()}</Text>
            <Text style={styles.title}>{output.title}</Text>
          </View>
        </View>
      )}

      <View style={styles.body}>
        <Markdown style={markdownStyles}>{output.body}</Markdown>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>{formatGeneratedAt(output.generatedAt, now)}</Text>
        {output.inputTraces && output.inputTraces.length > 0 ? (
          <View style={styles.traces}>
            {output.inputTraces.map((trace) => (
              <View key={trace} style={styles.traceChip}>
                <View style={[styles.traceDot, { backgroundColor: TRACE_DOT_COLOR[trace] }]} />
                <Text style={styles.traceLabel}>{labelForInputTrace(trace)}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: t.radius.Card,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: t.spacing['5'],
    paddingTop: t.spacing['5'],
    paddingBottom: t.spacing['4'],
    marginBottom: t.spacing['4'],
    ...t.elevation.Raised,
  },
  // Brief hero — painterly panel at the top of the card, runs edge-to-edge
  // by negating the card's horizontal padding and trimming top padding.
  briefHeroShell: {
    marginHorizontal: -t.spacing['5'],
    marginTop: -t.spacing['5'],
    marginBottom: t.spacing['4'],
    borderTopLeftRadius: t.radius.Card,
    borderTopRightRadius: t.radius.Card,
    overflow: 'hidden',
  },
  briefHero: {
    minHeight: 130,
  },
  briefHeroInner: {
    padding: t.spacing['5'],
    paddingTop: t.spacing['5'],
    paddingBottom: t.spacing['5'],
    flex: 1,
    justifyContent: 'flex-end',
  },
  briefHeroLabel: {
    fontFamily: t.typography.fonts.UISemi,
    fontSize: 11,
    letterSpacing: 1.4,
    color: '#FBF6EA',
    opacity: 0.92,
    marginBottom: t.spacing['1'],
  },
  briefHeroTitle: {
    fontFamily: t.typography.fonts.Display,
    fontSize: 26,
    lineHeight: 30,
    color: '#FBF6EA',
    letterSpacing: -0.3,
    fontStyle: 'italic',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: t.spacing['3'],
    marginBottom: t.spacing['4'],
  },
  glyphBadge: {
    width: 56,
    height: 56,
    borderRadius: t.radius.Inner,
    backgroundColor: t.colors.SecondarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: { fontSize: 26 },
  headerText: { flex: 1, paddingTop: t.spacing['1'] },
  label: {
    fontFamily: t.typography.fonts.UISemi,
    fontSize: 11,
    letterSpacing: 0.8,
    color: t.colors.SupportingText,
    marginBottom: t.spacing['1'],
  },
  title: {
    ...t.typography.scale.HeadingL,
    color: t.colors.PrimaryText,
  },
  body: { marginBottom: t.spacing['4'] },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: t.spacing['3'],
    paddingTop: t.spacing['3'],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: t.colors.EdgeLine,
  },
  footerText: {
    fontFamily: t.typography.fonts.Mono,
    fontSize: 11,
    color: t.colors.SubtleText,
  },
  traces: { flexDirection: 'row', gap: t.spacing['2'], flexWrap: 'wrap' },
  traceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing['1'],
    paddingHorizontal: t.spacing['2'],
    paddingVertical: 2,
    borderRadius: t.radius.Chip,
    backgroundColor: t.colors.SecondarySurface,
  },
  traceDot: { width: 6, height: 6, borderRadius: 3 },
  traceLabel: {
    fontFamily: t.typography.fonts.UIMedium,
    fontSize: 11,
    color: t.colors.SupportingText,
  },
});

// Markdown renderer styles tuned to read inside the card surface.
const markdownStyles = {
  body: {
    fontFamily: t.typography.fonts.Reading,
    fontSize: 16,
    lineHeight: 24,
    color: t.colors.PrimaryText,
  },
  strong: {
    fontFamily: t.typography.fonts.UISemi,
    color: t.colors.PrimaryText,
  },
  bullet_list: { marginVertical: t.spacing['2'] },
  code_inline: {
    fontFamily: t.typography.fonts.Mono,
    fontSize: 14,
    backgroundColor: t.colors.SunkenSurface,
    borderRadius: t.radius.Hair,
    paddingHorizontal: 4,
  },
  paragraph: { marginBottom: t.spacing['3'] },
} as const;
