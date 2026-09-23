import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { firstOfMonth } from '../domain/dateUtils';
import { getCompletedSessions, getSessionStreak } from '../domain/sessionStore';
import type { SessionRow } from '../domain/types';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  IconButton,
  SegmentedControl,
  font,
  radius,
  spacing,
  useTheme,
  type Shadows,
} from '../ui';
import type { ThemeColors } from '../ui/tokens/colors';
import type { Typography } from '../ui/tokens/typography';
import { useTabBarClearance } from '../navigation/tabBar';
import { ClimbProgressView } from './progress/ClimbProgressView';
import { StrengthProgressView } from './progress/StrengthProgressView';

const MONTHS_BACK_LIMIT = 12;

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

type ProgressMode = 'climbing' | 'strength';
type ProgressView = 'all' | 'month';

export function ProgressScreen() {
  const { colors, typography, shadows } = useTheme();
  const styles = useMemo(() => createStyles(colors, typography, shadows), [colors, typography, shadows]);
  const tabBarClearance = useTabBarClearance();
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [streak, setStreak] = useState(0);
  const [mode, setMode] = useState<ProgressMode>('climbing');
  const [view, setView] = useState<ProgressView>('all');
  const [currentMonth, setCurrentMonth] = useState<Date>(() => firstOfMonth(new Date()));

  useFocusEffect(
    useCallback(() => {
      setSessions(getCompletedSessions());
      setStreak(getSessionStreak());
    }, [])
  );

  const thisMonth = useMemo(() => firstOfMonth(new Date()), []);
  const earliestMonth = useMemo(
    () => new Date(thisMonth.getFullYear(), thisMonth.getMonth() - MONTHS_BACK_LIMIT, 1),
    [thisMonth]
  );
  const canGoPrevMonth = currentMonth.getTime() > earliestMonth.getTime();
  const canGoNextMonth = currentMonth.getTime() < thisMonth.getTime();

  const goToPrevMonth = () => {
    if (!canGoPrevMonth) return;
    setCurrentMonth((month) => new Date(month.getFullYear(), month.getMonth() - 1, 1));
  };
  const goToNextMonth = () => {
    if (!canGoNextMonth) return;
    setCurrentMonth((month) => new Date(month.getFullYear(), month.getMonth() + 1, 1));
  };

  const monthSessions = useMemo(() => {
    const start = currentMonth.getTime();
    const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1).getTime();
    return sessions.filter((s) => s.started_at >= start && s.started_at < end);
  }, [sessions, currentMonth]);

  // Each mode's grids and charts scope to the selected month; streaks, personal bests,
  // and the rolling weekly trend stay on full history.
  const scopedSessions = view === 'month' ? monthSessions : sessions;

  if (sessions.length === 0) {
    return (
      <SafeAreaView edges={['top']} style={[styles.root, styles.content]}>
        <Text style={styles.screenTitle}>Progress</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>Log a session to see your progress</Text>
          <Text style={styles.emptyStateCopy}>
            Charts and stats will show up here once you've finished a climbing or strength
            session.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: tabBarClearance }]}
      >
        <Text style={styles.screenTitle}>Progress</Text>

        <View style={styles.segmented}>
          <SegmentedControl
            options={[
              { value: 'climbing', label: 'Climbing' },
              { value: 'strength', label: 'Strength' },
            ]}
            value={mode}
            onChange={setMode}
          />
        </View>
        <View style={styles.segmented}>
          <SegmentedControl
            options={[
              { value: 'all', label: 'All time' },
              { value: 'month', label: 'By month' },
            ]}
            value={view}
            onChange={setView}
          />
        </View>

        {view === 'month' ? (
          <View style={styles.monthNav}>
            <IconButton
              variant="bare"
              onPress={goToPrevMonth}
              disabled={!canGoPrevMonth}
              accessibilityLabel="Previous month"
              hitSlop={10}
            >
              <ChevronLeftIcon
                size={16}
                color={canGoPrevMonth ? colors.accent : colors.textMuted}
                strokeWidth={2.4}
              />
            </IconButton>
            <Text style={styles.monthNavLabel}>
              {MONTH_NAMES[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </Text>
            <IconButton
              variant="bare"
              onPress={goToNextMonth}
              disabled={!canGoNextMonth}
              accessibilityLabel="Next month"
              hitSlop={10}
            >
              <ChevronRightIcon
                size={16}
                color={canGoNextMonth ? colors.accent : colors.textMuted}
                strokeWidth={2.4}
              />
            </IconButton>
          </View>
        ) : null}

        {view === 'month' && monthSessions.length === 0 ? (
          <View style={styles.emptyMonth}>
            <Text style={styles.emptyMonthText}>No sessions logged this month.</Text>
          </View>
        ) : null}

        {mode === 'climbing' ? (
          <ClimbProgressView sessions={sessions} scopedSessions={scopedSessions} streak={streak} />
        ) : (
          <StrengthProgressView sessions={sessions} scopedSessions={scopedSessions} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors, typography: Typography, shadows: Shadows) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scroll: {
      flex: 1,
    },
    content: {
      paddingHorizontal: spacing.sm,
      paddingTop: spacing.md,
      paddingBottom: spacing.lg,
    },
    screenTitle: {
      ...typography.display,
      fontSize: 34,
      letterSpacing: -0.8,
      marginBottom: spacing.s,
    },

    segmented: {
      marginBottom: spacing.xs,
    },

    monthNav: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.md,
      marginBottom: spacing.xs,
    },
    monthNavLabel: {
      ...typography.body,
      ...font('semibold'),
      color: colors.textPrimary,
      minWidth: 150,
      textAlign: 'center',
    },
    emptyMonth: {
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      ...shadows.card,
      padding: spacing.sm,
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    emptyMonthText: {
      ...typography.bodyMuted,
    },

    emptyState: {
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      ...shadows.card,
      padding: spacing.md,
      alignItems: 'center',
      gap: spacing.xs,
      marginTop: spacing.md,
    },
    emptyStateTitle: {
      ...typography.body,
      ...font('semibold'),
      textAlign: 'center',
    },
    emptyStateCopy: {
      ...typography.bodyMuted,
      textAlign: 'center',
      lineHeight: 20,
    },
  });
