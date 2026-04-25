// ProjectDetail.tsx — full-bleed drill-down screen for a single Project.
// Ports the design folder's ProjectDetailV2 (docs/design/Intently - App/
// intently-flows.jsx → ProjectDetailV2) to React Native + Expo TS.
//
// Sections (per the task spec + design source):
//   1. Cover — project name, glyph chip, "under <Goal>" link-chip back to
//      GoalDetail. Back + close buttons.
//   2. Intention — what this was when it started.
//   3. Impact — why it earns time.
//   4. Status — single tight read.
//   5. Tracker — flat checklist of {text, deadline, status} rows. NOT kanban,
//      NOT a gantt — BUILD-RULES.md anti-patterns. Just status dots + deadlines.
//
// Wiring contract: parent owns `detailView`. ProjectDetail calls onBack to
// clear; if the project has a goal, onOpenGoal(goal) flips detailView.kind
// back to 'goal'.

import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  Goal,
  getGoalById,
  Project,
} from '../fixtures/goals-projects';
import { theme } from '../lib/tokens';

const t = theme.light;

type Props = {
  project: Project;
  onBack: () => void;
  onOpenGoal: (goal: Goal) => void;
};

export default function ProjectDetail({ project, onBack, onOpenGoal }: Props) {
  const goal = project.goalId ? getGoalById(project.goalId) : null;

  return (
    <View style={styles.container}>
      {/* Cover */}
      <View style={[styles.cover, { backgroundColor: project.tint }]}>
        <View style={styles.coverTopRow}>
          <Pressable
            onPress={onBack}
            accessibilityLabel="Back"
            style={styles.backChip}
            hitSlop={12}
          >
            <Text style={styles.backChipLabel}>← Back</Text>
          </Pressable>
          <Pressable
            onPress={onBack}
            accessibilityLabel="Close"
            style={styles.closeBtn}
            hitSlop={12}
          >
            <Text style={styles.closeGlyph}>✕</Text>
          </Pressable>
        </View>

        <View style={styles.coverBody}>
          <View style={styles.coverText}>
            <Text style={styles.coverEyebrow}>PROJECT</Text>
            <Text style={styles.coverTitle}>{project.name}</Text>
            {goal ? (
              <Pressable
                onPress={() => onOpenGoal(goal)}
                style={styles.goalChip}
                accessibilityLabel={`Open goal ${goal.title}`}
                hitSlop={10}
              >
                <Text style={styles.goalChipUnder}>under</Text>
                <Text style={styles.goalChipTitle} numberOfLines={1}>
                  {goal.title.replace(/\.$/, '')}
                </Text>
              </Pressable>
            ) : null}
          </View>
          {/* Glyph chip placeholder (Track B Glyph component drops in here). */}
          <View style={[styles.coverGlyph, { backgroundColor: 'rgba(31,27,21,0.12)' }]} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {project.intention ? (
          <Section label="Intention" sub="what this was when you started">
            <Text style={styles.readingP}>{project.intention}</Text>
          </Section>
        ) : null}

        {project.impact ? (
          <Section label="Impact" sub="why it earns your time">
            <Text style={styles.readingP}>{project.impact}</Text>
          </Section>
        ) : null}

        {project.status ? (
          <Section label="Status" sub="where we're at now">
            <View style={styles.statusCard}>
              <Text style={styles.statusText}>{project.status}</Text>
            </View>
          </Section>
        ) : null}

        {/* Tracker — flat checklist. Not kanban, not gantt (BUILD-RULES). */}
        <Section label="Tracker">
          {project.tracker.length > 0 ? (
            <View style={styles.trackerCard}>
              {project.tracker.map((row, i) => {
                const dot =
                  row.status === 'done'
                    ? t.colors.PositiveAccent
                    : row.status === 'doing'
                    ? t.colors.FocusObject
                    : t.colors.SubtleText;
                const isLast = i === project.tracker.length - 1;
                return (
                  <View
                    key={`${row.text}-${i}`}
                    style={[
                      styles.trackerRow,
                      !isLast && styles.trackerRowDivided,
                    ]}
                  >
                    <View style={styles.trackerLeft}>
                      <View
                        style={[styles.trackerDot, { backgroundColor: dot }]}
                      />
                      <Text
                        style={[
                          styles.trackerText,
                          row.status === 'done' && styles.trackerTextDone,
                        ]}
                        numberOfLines={2}
                      >
                        {row.text}
                      </Text>
                    </View>
                    <Text style={styles.trackerDeadline}>{row.deadline}</Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <Text style={styles.empty}>No tracker rows yet.</Text>
          )}
        </Section>
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
  cover: {
    paddingTop: 60,
    paddingHorizontal: t.spacing['4'],
    paddingBottom: t.spacing['5'],
  },
  coverTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backChip: {
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
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(251,248,242,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeGlyph: {
    fontSize: 14,
    color: t.colors.PrimaryText,
    fontFamily: t.typography.fonts.UISemi,
  },
  coverBody: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: t.spacing['4'],
    gap: t.spacing['3'],
  },
  coverText: {
    flex: 1,
  },
  coverEyebrow: {
    fontFamily: t.typography.fonts.UISemi,
    fontSize: 10,
    letterSpacing: 1.2,
    color: t.colors.PrimaryText,
    opacity: 0.62,
    marginBottom: 2,
  },
  coverTitle: {
    fontFamily: t.typography.fonts.Display,
    fontSize: 26,
    lineHeight: 30,
    fontStyle: 'italic',
    color: t.colors.PrimaryText,
    letterSpacing: -0.4,
    marginTop: 2,
  },
  goalChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: t.spacing['3'],
    paddingHorizontal: t.spacing['3'],
    paddingVertical: t.spacing['2'],
    borderRadius: t.radius.Pill,
    backgroundColor: 'rgba(31,27,21,0.12)',
    gap: 6,
    minHeight: t.a11y.MinTapTarget,
  },
  goalChipUnder: {
    fontFamily: t.typography.fonts.UI,
    fontSize: 11,
    color: t.colors.PrimaryText,
    opacity: 0.7,
  },
  goalChipTitle: {
    fontFamily: t.typography.fonts.Display,
    fontSize: 13,
    fontStyle: 'italic',
    color: t.colors.PrimaryText,
    maxWidth: 180,
  },
  coverGlyph: {
    width: 48,
    height: 48,
    borderRadius: 12,
    flexShrink: 0,
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
  statusCard: {
    backgroundColor: t.colors.SecondarySurface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: t.colors.EdgeLine,
    borderRadius: 10,
    paddingVertical: t.spacing['3'],
    paddingHorizontal: t.spacing['4'],
  },
  statusText: {
    fontFamily: t.typography.fonts.Reading,
    fontSize: 14,
    lineHeight: 22,
    color: t.colors.PrimaryText,
  },
  trackerCard: {
    backgroundColor: t.colors.SecondarySurface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: t.colors.EdgeLine,
    borderRadius: 12,
    overflow: 'hidden',
  },
  trackerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: t.spacing['3'],
    paddingHorizontal: t.spacing['4'],
    gap: t.spacing['3'],
  },
  trackerRowDivided: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: t.colors.EdgeLine,
  },
  trackerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing['3'],
  },
  trackerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  trackerText: {
    flex: 1,
    fontFamily: t.typography.fonts.Reading,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.PrimaryText,
  },
  trackerTextDone: {
    textDecorationLine: 'line-through',
    opacity: 0.55,
  },
  trackerDeadline: {
    fontFamily: t.typography.fonts.Mono,
    fontSize: 11,
    color: t.colors.SupportingText,
    flexShrink: 0,
  },
  empty: {
    fontFamily: t.typography.fonts.Reading,
    fontSize: 13,
    color: t.colors.SubtleText,
    fontStyle: 'italic',
  },
});
