// GoalDetail.tsx — full-bleed drill-down screen reachable from a Future goal
// card. Ports the design folder's GoalDetail (docs/design/Intently - App/
// intently-flows.jsx → GoalDetail) to React Native + Expo TS.
//
// Sections (per HANDOFF §3.3 + design source):
//   1. Painterly hero — full-bleed colored panel, oversized corner glyph (stub
//      circle until Track B's PainterlyBlock + Glyph land), back button.
//   2. Intention — the original "why" paragraph.
//   3. This month — sage-tinted card with monthNarrative + April focus eyebrow.
//   4. Milestones — vertical timeline with status-colored dots and target months.
//   5. Projects under this goal — compact 2-column ProjectCard grid.
//   6. Reflections — lilac left-bordered pull quotes from the journal.
//
// Wiring contract: parent owns `detailView`. GoalDetail calls onBack to clear,
// onOpenProject(project) to switch detailView.kind to 'project'.

import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Goal, getProjectsForGoal, Project } from '../fixtures/goals-projects';
import { theme } from '../lib/tokens';
import ProjectCard from './ProjectCard';

const t = theme.light;

type Props = {
  goal: Goal;
  onBack: () => void;
  onOpenProject: (project: Project) => void;
};

export default function GoalDetail({ goal, onBack, onOpenProject }: Props) {
  const projects = getProjectsForGoal(goal.id);
  return (
    <View style={styles.container}>
      {/* Painterly hero. The first stop of `goal.pal` paints the panel as a
          flat colored block. TODO: swap for Track B's PainterlyBlock once it
          lands so the 4-stop palette gets the painterly treatment. The
          oversized corner GlyphGhost is a placeholder circle for the same
          reason — Glyph component (Lucide-equivalent) ships with Track B. */}
      <View style={[styles.hero, { backgroundColor: goal.pal[0] }]}>
        <Pressable
          onPress={onBack}
          accessibilityLabel="Back to Future"
          style={styles.backChip}
          hitSlop={12}
        >
          <Text style={styles.backChipLabel}>← Future</Text>
        </Pressable>

        {/* Oversized corner glyph placeholder. */}
        <View style={[styles.glyphGhost, { backgroundColor: goal.pal[1] }]} />

        <View style={styles.heroTextWrap}>
          <Text style={styles.heroEyebrow}>
            GOAL · STARTED {goal.created.toUpperCase()}
          </Text>
          <Text style={styles.heroTitle}>{goal.title}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Intention */}
        <Section label="Intention">
          <Text style={styles.readingP}>{goal.intention}</Text>
        </Section>

        {/* This month */}
        <Section label="This month" sub="from your monthly review">
          <View style={styles.monthCard}>
            <Text style={styles.monthEyebrow}>APRIL · FOCUS</Text>
            <Text style={styles.monthFocus}>
              "{goal.month.replace(/^April:\s*/, '')}"
            </Text>
            <Text style={styles.monthNarrative}>{goal.monthNarrative}</Text>
          </View>
        </Section>

        {/* Milestones — timeline */}
        <Section label="Milestones" sub="the higher-level beats">
          <View style={styles.timeline}>
            {goal.milestones.map((m, i) => {
              const isLast = i === goal.milestones.length - 1;
              const dotColor =
                m.status === 'done'
                  ? t.colors.PositiveAccent
                  : m.status === 'doing'
                  ? t.colors.FocusObject
                  : t.colors.SubtleText;
              return (
                <View key={`${m.text}-${i}`} style={styles.timelineRow}>
                  <View style={styles.timelineCol}>
                    <View
                      style={[
                        styles.timelineDot,
                        {
                          borderColor: dotColor,
                          backgroundColor:
                            m.status === 'done' ? dotColor : t.colors.PrimarySurface,
                        },
                      ]}
                    />
                    {!isLast ? (
                      <View
                        style={[
                          styles.timelineLine,
                          { backgroundColor: t.colors.EdgeLine },
                        ]}
                      />
                    ) : null}
                  </View>
                  <View style={styles.timelineBody}>
                    <Text
                      style={[
                        styles.timelineText,
                        m.status === 'done' && styles.timelineTextDone,
                      ]}
                    >
                      {m.text}
                    </Text>
                    {m.status === 'doing' ? (
                      <Text style={styles.timelineInMotion}>IN MOTION</Text>
                    ) : null}
                  </View>
                  <Text style={styles.timelineMonth}>{m.month}</Text>
                </View>
              );
            })}
          </View>
        </Section>

        {/* Projects under this goal */}
        <Section
          label="Projects"
          sub={`${projects.length} under this goal`}
        >
          {projects.length > 0 ? (
            <View style={styles.projectGrid}>
              {projects.map((p) => (
                <View key={p.id} style={styles.projectGridCell}>
                  <ProjectCard project={p} onPress={() => onOpenProject(p)} />
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.empty}>No projects under this goal yet.</Text>
          )}
        </Section>

        {/* Reflections */}
        {goal.reflections.length > 0 ? (
          <Section label="Reflections" sub="pulled from your journal">
            <View style={styles.reflectionList}>
              {goal.reflections.map((r, i) => (
                <View key={`${r.date}-${i}`} style={styles.reflectionCard}>
                  <Text style={styles.reflectionDate}>
                    {r.date.toUpperCase()}
                  </Text>
                  <Text style={styles.reflectionQuote}>"{r.quote}"</Text>
                </View>
              ))}
            </View>
          </Section>
        ) : null}
      </ScrollView>
    </View>
  );
}

function Section({
  label,
  sub,
  children,
}: {
  label: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionLabel}>{label.toUpperCase()}</Text>
        {sub ? <Text style={styles.sectionSub}>{sub}</Text> : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: t.colors.PrimarySurface,
  },
  hero: {
    paddingTop: 60,
    paddingHorizontal: t.spacing['5'],
    paddingBottom: t.spacing['6'],
    minHeight: 240,
    overflow: 'hidden',
    position: 'relative',
  },
  backChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: t.spacing['3'],
    paddingVertical: t.spacing['2'],
    borderRadius: t.radius.Pill,
    backgroundColor: 'rgba(251,248,242,0.6)',
    minHeight: t.a11y.MinTapTarget,
  },
  backChipLabel: {
    fontFamily: t.typography.fonts.UISemi,
    fontSize: 12,
    color: t.colors.PrimaryText,
    letterSpacing: 0.2,
  },
  glyphGhost: {
    position: 'absolute',
    right: -40,
    bottom: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.35,
  },
  heroTextWrap: {
    marginTop: t.spacing['5'],
    maxWidth: '88%',
  },
  heroEyebrow: {
    fontFamily: t.typography.fonts.UISemi,
    fontSize: 10,
    letterSpacing: 1.4,
    color: t.colors.PrimaryText,
    opacity: 0.62,
    marginBottom: t.spacing['1'],
  },
  heroTitle: {
    fontFamily: t.typography.fonts.Display,
    fontSize: 30,
    lineHeight: 36,
    fontStyle: 'italic',
    color: t.colors.PrimaryText,
    letterSpacing: -0.6,
  },
  scroll: {
    paddingHorizontal: t.spacing['5'],
    paddingTop: t.spacing['4'],
    paddingBottom: 140,
  },
  section: {
    marginTop: t.spacing['5'],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: t.spacing['3'],
  },
  sectionLabel: {
    fontFamily: t.typography.fonts.UISemi,
    fontSize: 10,
    letterSpacing: 1.2,
    color: t.colors.SupportingText,
  },
  sectionSub: {
    fontFamily: t.typography.fonts.UI,
    fontSize: 11,
    color: t.colors.SubtleText,
    fontStyle: 'italic',
  },
  readingP: {
    fontFamily: t.typography.fonts.Reading,
    fontSize: 15,
    lineHeight: 24,
    color: t.colors.PrimaryText,
  },
  monthCard: {
    backgroundColor: t.colors.ConfirmationCardSurface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: t.colors.ConfirmationCardEdge,
    borderRadius: 12,
    padding: t.spacing['4'],
  },
  monthEyebrow: {
    fontFamily: t.typography.fonts.UISemi,
    fontSize: 10,
    letterSpacing: 1.2,
    color: t.colors.PositiveAccent,
    marginBottom: t.spacing['2'],
  },
  monthFocus: {
    fontFamily: t.typography.fonts.Reading,
    fontSize: 15,
    lineHeight: 23,
    color: t.colors.PrimaryText,
    fontStyle: 'italic',
    marginBottom: t.spacing['3'],
  },
  monthNarrative: {
    fontFamily: t.typography.fonts.Reading,
    fontSize: 14,
    lineHeight: 22,
    color: t.colors.SupportingText,
  },
  timeline: {
    flexDirection: 'column',
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 44,
  },
  timelineCol: {
    width: 28,
    alignItems: 'center',
    position: 'relative',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    marginTop: 8,
    zIndex: 2,
  },
  timelineLine: {
    position: 'absolute',
    top: 22,
    bottom: 0,
    width: 2,
  },
  timelineBody: {
    flex: 1,
    paddingTop: 6,
    paddingBottom: t.spacing['3'],
    paddingLeft: t.spacing['2'],
  },
  timelineText: {
    fontFamily: t.typography.fonts.Reading,
    fontSize: 15,
    lineHeight: 22,
    color: t.colors.PrimaryText,
  },
  timelineTextDone: {
    textDecorationLine: 'line-through',
    opacity: 0.55,
  },
  timelineInMotion: {
    fontFamily: t.typography.fonts.UISemi,
    fontSize: 10,
    letterSpacing: 0.8,
    color: t.colors.FocusObject,
    marginTop: 2,
  },
  timelineMonth: {
    fontFamily: t.typography.fonts.Mono,
    fontSize: 11,
    color: t.colors.SupportingText,
    paddingTop: 8,
    paddingLeft: t.spacing['2'],
  },
  projectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  projectGridCell: {
    width: '50%',
    paddingHorizontal: 5,
    marginBottom: 10,
  },
  empty: {
    fontFamily: t.typography.fonts.Reading,
    fontSize: 13,
    color: t.colors.SubtleText,
    fontStyle: 'italic',
  },
  reflectionList: {
    flexDirection: 'column',
    gap: t.spacing['3'],
  },
  reflectionCard: {
    paddingVertical: t.spacing['3'],
    paddingHorizontal: t.spacing['4'],
    backgroundColor: t.colors.ReflectionCardSurface,
    borderLeftWidth: 3,
    borderLeftColor: t.colors.UndoAffordance,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
  },
  reflectionDate: {
    fontFamily: t.typography.fonts.UISemi,
    fontSize: 10,
    letterSpacing: 1,
    color: t.colors.SupportingText,
    marginBottom: t.spacing['1'],
  },
  reflectionQuote: {
    fontFamily: t.typography.fonts.Reading,
    fontSize: 15,
    lineHeight: 23,
    color: t.colors.PrimaryText,
    fontStyle: 'italic',
  },
});
