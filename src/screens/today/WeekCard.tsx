import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { WeekActivity } from '../../domain/dashboard';
import { Card, font, spacing, useTheme } from '../../ui';
import type { ThemeColors } from '../../ui/tokens/colors';
import type { Typography } from '../../ui/tokens/typography';

type Props = {
  week: WeekActivity;
  /** Consecutive weeks with a session. */
  streak: number;
  /** Sessions in a usual week; reaching it joins the week's dots with a line. */
  usualTarget: number;
  /** A quiet note on days without a session, e.g. "Rest day. Last climbed Tue". */
  restLine?: string | null;
};

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Mon-Sun: a filled circle on days with a session, a ring around today. Totals sit in the header. */
export const WeekCard = ({ week, streak, usualTarget, restLine }: Props) => {
  const { colors, typography } = useTheme();
  const styles = useMemo(() => createStyles(colors, typography), [colors, typography]);

  const full = week.sessions >= usualTarget;
  const summary = full
    ? 'Usual week done'
    : [
        plural(week.sessions, 'session', 'sessions'),
        plural(week.sends, 'send', 'sends'),
        plural(week.sets, 'set', 'sets'),
      ].join(', ');
  const activeIdx = week.days.flatMap((day, i) => (day.climbed || day.trained ? [i] : []));
  const first = activeIdx[0];
  const last = activeIdx[activeIdx.length - 1];
  // Each day is an equal column with its dot centred, so the line runs centre to centre.
  const join =
    full && first !== undefined && last > first
      ? { left: `${((first + 0.5) / 7) * 100}%` as const, width: `${((last - first) / 7) * 100}%` as const }
      : null;

  return (
    <Card padded="compact" style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>This week</Text>
          {streak > 0 ? <Text style={styles.streak}>{streak === 1 ? '1 week' : `${streak} weeks in a row`}</Text> : null}
        </View>
        <Text style={styles.summary} numberOfLines={1}>
          {summary}
        </Text>
      </View>
      <View style={styles.days}>
        {join ? <View pointerEvents="none" style={[styles.join, join]} /> : null}
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
      {restLine ? <Text style={styles.rest}>{restLine}</Text> : null}
    </Card>
  );
};

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
    card: {
      gap: spacing.xs,
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
      gap: 4,
    },
    dayLabel: {
      ...typography.meta,
      fontSize: 11,
      lineHeight: 14,
      color: colors.textMuted,
    },
    dayLabelToday: {
      ...font('semibold'),
      color: colors.textPrimary,
    },
    circle: {
      width: 7,
      height: 7,
      borderRadius: 3.5,
      backgroundColor: colors.surfaceRaised,
    },
    circleDone: {
      backgroundColor: colors.accent,
    },
    circleTodayEmpty: {
      backgroundColor: colors.textSecondary,
    },
    circleToday: {},
    // Sits behind the dots at their centre: label line (14) + gap (4) + half a dot, less half the line.
    join: {
      position: 'absolute',
      top: 14 + 4 + 3.5 - 1,
      height: 2,
      borderRadius: 1,
      backgroundColor: colors.accent,
      opacity: 0.35,
    },
    rest: {
      ...typography.meta,
    },
  });
