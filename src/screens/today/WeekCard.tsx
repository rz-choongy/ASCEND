import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { WeekActivity } from '../../domain/dashboard';
import { Card, font, spacing, useTheme } from '../../ui';
import type { ThemeColors } from '../../ui/tokens/colors';
import type { Typography } from '../../ui/tokens/typography';

type Props = {
  week: WeekActivity;
  streak: number;
};

/** Mon-Sun: a filled dot for a climb, a ring for strength, both for both. */
export const WeekCard = ({ week, streak }: Props) => {
  const { colors, typography } = useTheme();
  const styles = useMemo(() => createStyles(colors, typography), [colors, typography]);

  const total = (value: number, label: string) => (
    <View style={styles.total} key={label}>
      <Text style={styles.totalValue}>{value}</Text>
      <Text style={styles.totalLabel}>{label}</Text>
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
      <View style={styles.days}>
        {week.days.map((day, i) => (
          <View key={i} style={styles.day} accessibilityLabel={`${day.label}: ${[day.climbed && 'climbed', day.trained && 'strength'].filter(Boolean).join(' and ') || 'rest'}`}>
            <View
              style={[
                styles.dot,
                day.climbed ? styles.dotClimb : null,
                day.trained ? styles.dotStrength : null,
              ]}
            />
            <Text style={[styles.dayLabel, day.isToday ? styles.dayLabelToday : null]}>{day.label}</Text>
          </View>
        ))}
      </View>
      <View style={styles.totals}>
        {total(week.sessions, week.sessions === 1 ? 'session' : 'sessions')}
        {total(week.sends, week.sends === 1 ? 'send' : 'sends')}
        {total(week.sets, week.sets === 1 ? 'set' : 'sets')}
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
    days: {
      flexDirection: 'row',
    },
    day: {
      flex: 1,
      alignItems: 'center',
      gap: 6,
    },
    dot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.fill,
    },
    dotClimb: {
      backgroundColor: colors.accent,
    },
    dotStrength: {
      borderWidth: 2,
      borderColor: colors.textPrimary,
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
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.separator,
      paddingTop: spacing.s,
    },
    total: {
      flex: 1,
      gap: 1,
    },
    totalValue: {
      ...typography.numeric,
      fontSize: 20,
    },
    totalLabel: {
      ...font('regular'),
      fontSize: 12,
      color: colors.textSecondary,
    },
  });
