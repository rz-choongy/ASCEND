import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { ClimbSessionSummary, LastSessions, StrengthSessionSummary } from '../../domain/dashboard';
import { formatDuration } from '../../domain/dateUtils';
import { formatVolume, formatWeight } from '../../domain/strengthProgress';
import type { SessionType } from '../../domain/types';
import { Card, PressableScale, font, radius, spacing, useTheme } from '../../ui';
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

  const stat = (value: string, label: string, delta: Delta | null, highlight = false) => (
    <View style={styles.stat} key={label}>
      <Text style={[styles.statValue, highlight ? styles.statHighlight : null]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
      {delta ? (
        <Text style={[styles.delta, delta.tone === 'up' ? styles.deltaUp : null]} numberOfLines={1}>
          {delta.text}
        </Text>
      ) : null}
    </View>
  );

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
        <Card style={styles.card}>
          <Text style={styles.title}>Last climb</Text>
          <Text style={styles.empty}>Your first climbing session will show up here.</Text>
        </Card>
      );
    }
    const { latest, previous } = climb;
    const maxCount = Math.max(1, ...latest.grades.map((g) => g.count));
    return (
      <PressableScale onPress={() => onOpen(latest.sessionId)} scaleTo={0.98} style={styles.pressable}>
        <Card style={styles.card}>
          {header('Last climb', latest.startedAt, latest.durationMs)}
          <View style={styles.stats}>
            {stat(`${latest.sends}`, latest.sends === 1 ? 'send' : 'sends', countDelta(latest.sends, previous?.sends))}
            {stat(latest.bestGradeLabel ?? '–', 'best', gradeDelta(latest, previous), true)}
            {stat(`${latest.flashRate}%`, 'flashed', countDelta(latest.flashRate, previous?.flashRate, 'vs last', ' pts'))}
          </View>
          {latest.grades.length > 0 ? (
            <View style={styles.chart}>
              <View style={styles.bars}>
                {/* Same split as the Progress pyramid: flashes in the grade colour at the base, other sends grey above. */}
                {latest.grades.map((g) => {
                  const color = g.color ?? colors.textMuted;
                  const sends = g.count - g.flashCount;
                  return (
                    <View key={g.label} style={[styles.bar, { height: `${Math.max(12, (g.count / maxCount) * 100)}%` }]}>
                      {sends > 0 ? <View style={[styles.barSend, { flex: sends }]} /> : null}
                      {g.flashCount > 0 ? <View style={{ flex: g.flashCount, backgroundColor: color }} /> : null}
                    </View>
                  );
                })}
              </View>
              <View style={styles.barLabels}>
                {latest.grades.map((g) => (
                  <Text key={g.label} style={styles.barLabel} numberOfLines={1}>
                    {g.label}
                  </Text>
                ))}
              </View>
            </View>
          ) : null}
        </Card>
      </PressableScale>
    );
  }

  if (!strength) {
    return (
      <Card style={styles.card}>
        <Text style={styles.title}>Last strength</Text>
        <Text style={styles.empty}>Your first strength session will show up here.</Text>
      </Card>
    );
  }
  const { latest, previous } = strength;
  const volume = formatVolume(latest.volume);
  return (
    <PressableScale onPress={() => onOpen(latest.sessionId)} scaleTo={0.98} style={styles.pressable}>
      <Card style={styles.card}>
        {header(latest.title ? `Last · ${latest.title}` : 'Last strength', latest.startedAt, latest.durationMs)}
        <View style={styles.stats}>
          {stat(`${latest.sets}`, latest.sets === 1 ? 'set' : 'sets', countDelta(latest.sets, previous?.sets))}
          {/* Bodyweight work has no kg volume to speak of, so count reps instead of showing 0. */}
          {latest.volume > 0
            ? stat(
                `${volume.value}${volume.unit === 't' ? 't' : ''}`,
                volume.unit === 't' ? 'volume' : 'kg volume',
                previous && previous.volume > 0 ? percentDelta(latest.volume, previous.volume) : null
              )
            : stat(`${latest.reps}`, latest.reps === 1 ? 'rep' : 'reps', countDelta(latest.reps, previous?.reps))}
          {stat(`${latest.records}`, latest.records === 1 ? 'PR' : 'PRs', null, latest.records > 0)}
        </View>
        {latest.exercises.length > 0 ? (
          <View>
            {latest.exercises.slice(0, 4).map((ex) => (
              <View key={ex.name} style={styles.exerciseRow}>
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
      padding: spacing.sm,
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
    stats: {
      flexDirection: 'row',
      gap: spacing.xs,
    },
    stat: {
      flex: 1,
      gap: 1,
    },
    statValue: {
      ...typography.numeric,
      fontSize: 22,
    },
    statHighlight: {
      color: colors.accent,
    },
    statLabel: {
      ...font('regular'),
      fontSize: 12,
      color: colors.textSecondary,
    },
    delta: {
      ...font('medium'),
      fontSize: 11,
      color: colors.textMuted,
      fontVariant: ['tabular-nums'],
    },
    deltaUp: {
      color: colors.success,
    },
    chart: {
      gap: 4,
    },
    bars: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 4,
      height: 40,
    },
    bar: {
      flex: 1,
      borderRadius: 3,
      overflow: 'hidden',
    },
    barSend: {
      backgroundColor: colors.borderSoft,
    },
    barLabels: {
      flexDirection: 'row',
      gap: 4,
    },
    barLabel: {
      ...typography.meta,
      flex: 1,
      fontSize: 10,
      textAlign: 'center',
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
      color: colors.accent,
    },
    exerciseTop: {
      ...font('medium'),
      fontSize: 14,
      color: colors.textSecondary,
      fontVariant: ['tabular-nums'],
    },
  });
