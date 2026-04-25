// ProjectCard.tsx — compact card used in:
//   - GoalDetail's "Projects under this goal" 2-column grid
//   - Future screen's "Projects" band
//
// Ported from docs/design/Intently - App/intently-projects.jsx → ProjectCard.
// The painterly tint stripe + glyph chip are stubs (flat colored panel + flat
// chip placeholder until Track B's Glyph component lands).

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Project } from '../fixtures/goals-projects';
import { theme } from '../lib/tokens';

const t = theme.light;

type Props = {
  project: Project;
  onPress: () => void;
};

export default function ProjectCard({ project, onPress }: Props) {
  const pct = Math.round(
    (project.done / Math.max(1, project.count)) * 100,
  );
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={`Open ${project.name}`}
      style={styles.card}
    >
      <View style={[styles.tintStripe, { backgroundColor: project.tint }]} />
      <View style={styles.cardHead}>
        {/* Glyph chip — flat colored square as a placeholder until Track B's
            Glyph component ships. */}
        <View style={[styles.glyphChip, { backgroundColor: project.tint }]} />
        <Text style={styles.progressLabel}>
          {project.done}/{project.count}
        </Text>
      </View>
      <Text style={styles.name}>{project.name}</Text>
      <Text style={styles.blurb} numberOfLines={2}>
        {project.blurb}
      </Text>
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${pct}%`, backgroundColor: project.tint },
          ]}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: t.colors.SecondarySurface,
    borderRadius: 14,
    padding: t.spacing['3'],
    paddingTop: t.spacing['4'],
    overflow: 'hidden',
    position: 'relative',
    minHeight: 130,
    ...t.elevation.Raised,
  },
  tintStripe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: t.spacing['2'],
  },
  glyphChip: {
    width: 32,
    height: 32,
    borderRadius: 9,
    opacity: 0.55,
  },
  progressLabel: {
    fontFamily: t.typography.fonts.UISemi,
    fontSize: 10,
    letterSpacing: 0.6,
    color: t.colors.SubtleText,
  },
  name: {
    fontFamily: t.typography.fonts.Display,
    fontSize: 16,
    lineHeight: 20,
    fontStyle: 'italic',
    color: t.colors.PrimaryText,
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  blurb: {
    fontFamily: t.typography.fonts.Reading,
    fontSize: 12,
    lineHeight: 17,
    color: t.colors.SupportingText,
    marginBottom: t.spacing['3'],
  },
  progressTrack: {
    height: 3,
    backgroundColor: t.colors.EdgeLine,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 'auto',
  },
  progressFill: {
    height: '100%',
  },
});
