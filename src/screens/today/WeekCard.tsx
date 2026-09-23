import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { WeekActivity } from '../../domain/dashboard';
import { Card, font, radius, spacing, useTheme } from '../../ui';
import type { ThemeColors } from '../../ui/tokens/colors';
import type { Typography } from '../../ui/tokens/typography';
import { countDelta, type Delta } from './deltas';

type Props = {
  week: WeekActivity;
  /** Last week's totals, for the "vs last week" line under each number. */
  lastWeek: WeekActivity;
  streak: number;
};

/** Mon-Sun: a filled dot for a climb, a ring for strength, both for both. */
export const WeekCard = ({ week, lastWeek, streak }: Props) => {
  const { colors, typography } = useTheme();
  const styles = useMemo(() => createStyles(colors, typography), [colors, typography]);

  // Laid out exactly like the Last session card's stats, so the two read as one system.
  const total = (value: number, label: string, delta: Delta | null) => (
    <View style={styles.total} key={label}>
      <Text style={styles.totalValue}>{value}</Text>
      <Text style={styles.totalLabel}>{label}</Text>
      {delta ? (
        <Text style={[styles.delta, delta.tone === 'up' ? styles.deltaUp : null]} numberOfLines={1}>
          {delta.text}
        </Text>
      ) : null}
    </View>
  );

  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>This week</Text>
        <Text style={styles.streak}>
          {streak > 0 ? `${streak}-day streak` : 'No streak yet'}
        </Text>
      </View>
      <View style={styles.daysWell}>
        <View style={styles.days}>
          {week.days.map((day, i) => (
            <View key={i} style={styles.day} accessibilityLabel={`${day.label}: ${[day.climbed && 'climbed', day.trained && 'strength'].filter(Boolean).join(' and ') || 'rest'}`}>
              {/* Strength is a ring drawn around the dot with a gap, so a day with both
                  still shows the climb fill clearly. */}
              <View style={[styles.ring, day.trained ? styles.ringStrength : null]}>
                <View style={[styles.dot, day.climbed ? styles.dotClimb : null]} />
              </View>
              <Text style={[styles.dayLabel, day.isToday ? styles.dayLabelToday : null]}>{day.label}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={styles.totals}>
        {total(week.sessions, week.sessions === 1 ? 'session' : 'sessions', countDelta(week.sessions, lastWeek.sessions, 'vs last wk'))}
        {total(week.sends, week.sends === 1 ? 'send' : 'sends', countDelta(week.sends, lastWeek.sends, 'vs last wk'))}
        {total(week.sets, week.sets === 1 ? 'set' : 'sets', countDelta(week.sets, lastWeek.sets, 'vs last wk'))}
      </View>
    </Card>
  );
};

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
    card: {
      padding: spacing.sm,
      gap: spacing.s,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    title: {
      ...typography.section,
    },
    streak: {
      ...typography.meta,
      color: colors.textSecondary,
    },
    // The dots sit in their own inset well, so they read as one strip rather than
    // a second row of columns competing with the totals below.
    daysWell: {
      backgroundColor: colors.surfaceAlt,
      borderRadius: radius.md,
      paddingVertical: spacing.s,
      paddingHorizontal: spacing.xxs,
    },
    days: {
      flexDirection: 'row',
    },
    day: {
      flex: 1,
      alignItems: 'center',
      gap: 6,
    },
    ring: {
      width: 16,
      height: 16,
      borderRadius: 8,
      borderWidth: 1.5,
      borderColor: 'transparent',
      alignItems: 'center',
      justifyContent: 'center',
    },
    ringStrength: {
      borderColor: colors.textPrimary,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.borderSoft,
    },
    dotClimb: {
      backgroundColor: colors.accent,
    },
    dayLabel: {
      ...typography.meta,
      fontSize: 11,
    },
    dayLabelToday: {
      ...font('semibold'),
      color: colors.textPrimary,
    },
    totals: {
      flexDirection: 'row',
      gap: spacing.xs,
    },
    total: {
      flex: 1,
      gap: 1,
    },
    totalValue: {
      ...typography.numeric,
      fontSize: 22,
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
    totalLabel: {
      ...font('regular'),
      fontSize: 12,
      color: colors.textSecondary,
    },
  });
