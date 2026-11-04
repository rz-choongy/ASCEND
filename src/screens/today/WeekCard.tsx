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

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Mon-Sun: a filled circle on days with a session, a ring around today. Totals sit in the header. */
export const WeekCard = ({ week, streak }: Props) => {
  const { colors, typography } = useTheme();
  const styles = useMemo(() => createStyles(colors, typography), [colors, typography]);

  const summary = [
    plural(week.sessions, 'session', 'sessions'),
    plural(week.sends, 'send', 'sends'),
    plural(week.sets, 'set', 'sets'),
  ].join(', ');

  return (
    <Card padded="compact" style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>This week</Text>
          {streak > 0 ? <Text style={styles.streak}>{`${streak}-day streak`}</Text> : null}
        </View>
        <Text style={styles.summary} numberOfLines={1}>
          {summary}
        </Text>
      </View>
      <View style={styles.days}>
        {week.days.map((day, i) => {
          const active = day.climbed || day.trained;
          return (
            <View
              key={i}
              style={styles.day}
              accessibilityLabel={`${day.label}${day.isToday ? ', today' : ''}: ${[day.climbed && 'climbed', day.trained && 'strength'].filter(Boolean).join(' and ') || 'rest'}`}
            >
              <Text style={[styles.dayLabel, day.isToday ? styles.dayLabelToday : null]}>{day.label}</Text>
              <View
                style={[
                  styles.circle,
                  active ? styles.circleDone : day.isToday ? styles.circleTodayEmpty : null,
                  day.isToday ? styles.circleToday : null,
                ]}
              />
            </View>
          );
        })}
      </View>
    </Card>
  );
};

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
    card: {
      gap: spacing.s,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: spacing.xs,
    },
    titleBlock: {
      gap: 1,
    },
    title: {
      ...typography.section,
    },
    streak: {
      ...typography.meta,
    },
    summary: {
      ...typography.meta,
      flexShrink: 1,
    },
    days: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    day: {
      flex: 1,
      alignItems: 'center',
      gap: 6,
    },
    dayLabel: {
      ...typography.meta,
    },
    dayLabelToday: {
      ...font('bold'),
      color: colors.textPrimary,
    },
    circle: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: colors.fill,
    },
    circleDone: {
      backgroundColor: colors.accent,
    },
    circleTodayEmpty: {
      backgroundColor: 'transparent',
    },
    circleToday: {
      borderWidth: 2,
      borderColor: colors.textPrimary,
    },
  });
