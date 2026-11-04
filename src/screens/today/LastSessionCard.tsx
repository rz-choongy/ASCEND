import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { ClimbSessionSummary, LastSessions, StrengthSessionSummary } from '../../domain/dashboard';
import { formatDuration } from '../../domain/dateUtils';
import { formatVolume, formatWeight } from '../../domain/strengthProgress';
import type { SessionType } from '../../domain/types';
import { Card, PressableScale, SessionStrip, StatRow, font, radius, spacing, useTheme } from '../../ui';
import type { ThemeColors } from '../../ui/tokens/colors';
import type { Typography } from '../../ui/tokens/typography';
import { countDelta, percentDelta, type Delta } from './deltas';

type Props = {
  mode: SessionType;
  climb: LastSessions<ClimbSessionSummary> | null;
  strength: LastSessions<StrengthSessionSummary> | null;
  onOpen: (sessionId: string) => void;
};

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const dayLabel = (ms: number): string => {
  const d = new Date(ms);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return 'Today';
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return DAY_SHORT[d.getDay()];
};

/** Grade values are only comparable within one gym's scale. */
const gradeDelta = (latest: ClimbSessionSummary, previous: ClimbSessionSummary | null): Delta | null => {
  if (!previous || latest.bestGradeValue === null || previous.bestGradeValue === null) return null;
  if (latest.gymName !== previous.gymName) return null;
  if (latest.bestGradeValue > previous.bestGradeValue) return { text: 'harder than last', tone: 'up' };
  if (latest.bestGradeValue < previous.bestGradeValue) return { text: `last: ${previous.bestGradeLabel}`, tone: 'flat' };
  return { text: 'same as last', tone: 'flat' };
};

/** The last session of the chosen type, with how it compares to the one before. */
export const LastSessionCard = ({ mode, climb, strength, onOpen }: Props) => {
  const { colors, typography } = useTheme();
  const styles = useMemo(() => createStyles(colors, typography), [colors, typography]);

  // Deltas sit in the stat's sub-line in the neutral meta colour: they compare, they don't grade.
  const stat = (label: string, value: string, delta: Delta | null, dotColor?: string) => ({
    label,
    value,
    sub: delta?.text,
    dotColor,
  });

  const header = (title: string, startedAt: number, durationMs: number | null) => (
    <View style={styles.headerRow}>
      <Text style={styles.title}>
        {title} · {dayLabel(startedAt)}
      </Text>
      {durationMs !== null ? <Text style={styles.duration}>{formatDuration(0, durationMs)}</Text> : null}
    </View>
  );

  if (mode === 'climb') {
    if (!climb) {
      return (
        <Card padded="compact" style={styles.card}>
          <Text style={styles.title}>Last climb</Text>
          <Text style={styles.empty}>Your first climbing session will show up here.</Text>
        </Card>
      );
    }
    const { latest, previous } = climb;
    const bestColor = latest.grades.find((g) => g.label === latest.bestGradeLabel)?.color ?? undefined;
    // One segment per climb in its tape colour, easiest grade first.
    const tape = latest.grades.flatMap((g) => Array.from({ length: g.count }, () => g.color ?? colors.textMuted));
    return (
      <PressableScale onPress={() => onOpen(latest.sessionId)} scaleTo={0.98} style={styles.pressable}>
        <Card padded="compact" style={styles.card}>
          {header('Last climb', latest.startedAt, latest.durationMs)}
          <StatRow
            bare
            items={[
              stat('Sends', `${latest.sends}`, countDelta(latest.sends, previous?.sends)),
              stat('Best', latest.bestGradeLabel ?? '–', gradeDelta(latest, previous), latest.bestGradeLabel ? bestColor : undefined),
              stat('Flashed', `${latest.flashRate}%`, countDelta(latest.flashRate, previous?.flashRate, 'vs last', ' pts')),
            ]}
          />
          {tape.length > 0 ? <SessionStrip colors={tape} /> : null}
        </Card>
      </PressableScale>
    );
  }

  if (!strength) {
    return (
      <Card padded="compact" style={styles.card}>
        <Text style={styles.title}>Last strength</Text>
        <Text style={styles.empty}>Your first strength session will show up here.</Text>
      </Card>
    );
  }
  const { latest, previous } = strength;
  const volume = formatVolume(latest.volume);
  return (
    <PressableScale onPress={() => onOpen(latest.sessionId)} scaleTo={0.98} style={styles.pressable}>
      <Card padded="compact" style={styles.card}>
        {header(latest.title ? `Last · ${latest.title}` : 'Last strength', latest.startedAt, latest.durationMs)}
        <StatRow
          bare
          items={[
            stat('Sets', `${latest.sets}`, countDelta(latest.sets, previous?.sets)),
            // Bodyweight work has no kg volume to speak of, so count reps instead of showing 0.
            latest.volume > 0
              ? stat(
                  volume.unit === 't' ? 'Volume' : 'Kg volume',
                  `${volume.value}${volume.unit === 't' ? 't' : ''}`,
                  previous && previous.volume > 0 ? percentDelta(latest.volume, previous.volume) : null
                )
              : stat('Reps', `${latest.reps}`, countDelta(latest.reps, previous?.reps)),
            stat('PRs', `${latest.records}`, null),
          ]}
        />
        {latest.exercises.length > 0 ? (
          <View>
            {latest.exercises.slice(0, 4).map((ex, index) => (
              // Names can repeat (a renamed exercise next to an older name-only entry).
              <View key={`${ex.name}-${index}`} style={styles.exerciseRow}>
                <Text style={styles.exerciseName} numberOfLines={1}>
                  {ex.name}
                </Text>
                {ex.isRecord ? (
                  <View style={styles.prBadge}>
                    <Text style={styles.prText}>PR</Text>
                  </View>
                ) : null}
                <Text style={styles.exerciseTop}>
                  {ex.weight === 0 ? 'BW' : `${formatWeight(ex.weight)} kg`} × {ex.reps}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </Card>
    </PressableScale>
  );
};

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
    pressable: {
      alignItems: 'stretch',
    },
    card: {
      gap: spacing.s,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.xs,
    },
    title: {
      ...typography.section,
      flexShrink: 1,
    },
    duration: {
      ...typography.mono,
      fontSize: 12,
    },
    empty: {
      ...typography.bodyMuted,
    },
    exerciseRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      minHeight: 36,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.separator,
    },
    exerciseName: {
      ...font('regular'),
      flex: 1,
      fontSize: 14,
      color: colors.textPrimary,
    },
    prBadge: {
      backgroundColor: colors.accentMuted,
      borderRadius: radius.pill,
      paddingHorizontal: 6,
      paddingVertical: 1,
    },
    prText: {
      ...font('semibold'),
      fontSize: 10,
      color: colors.accentInk,
    },
    exerciseTop: {
      ...font('medium'),
      fontSize: 14,
      color: colors.textSecondary,
      fontVariant: ['tabular-nums'],
    },
  });
