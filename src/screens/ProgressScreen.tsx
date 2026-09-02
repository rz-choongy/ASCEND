import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { firstOfMonth } from '../domain/dateUtils';
import {
  buildAllTimeStats,
  buildGradeDistribution,
  buildStrengthVolumeTrend,
  buildWeeklyFrequency,
  getAvailableClimbGyms,
} from '../domain/progressInsights';
import { getCompletedSessions, getSessionStreak } from '../domain/sessionStore';
import { getProgressGradeGymId, setProgressGradeGymId } from '../domain/settingsStore';
import type { SessionRow } from '../domain/types';
import { BarChart, Chip, PressableScale, SegmentedControl, StatRow, spacing, useTheme } from '../ui';
import type { ThemeColors } from '../ui/tokens/colors';
import type { Typography } from '../ui/tokens/typography';

const WEEKS_SHOWN = 10;
const STRENGTH_SESSIONS_SHOWN = 10;
const MONTHS_BACK_LIMIT = 12;

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

type ProgressView = 'all' | 'month';

export function ProgressScreen() {
  const { colors, typography } = useTheme();
  const styles = useMemo(() => createStyles(colors, typography), [colors, typography]);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [streak, setStreak] = useState(0);
  // undefined = user hasn't picked one this session yet -- fall back to the persisted setting.
  const [selectedGymId, setSelectedGymId] = useState<string | null | undefined>(undefined);
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

  // Grade distribution, volume, and the stat row scope to the selected month; the weekly
  // frequency chart stays anchored to "now" regardless of view, since it's a rolling
  // recent-weeks trend rather than something a past month's data could sensibly redraw.
  const scopedSessions = view === 'month' ? monthSessions : sessions;

  const allTimeStats = useMemo(() => buildAllTimeStats(scopedSessions), [scopedSessions]);
  const weeklyFrequency = useMemo(
    () => buildWeeklyFrequency(sessions, WEEKS_SHOWN),
    [sessions]
  );
  const availableGyms = useMemo(() => getAvailableClimbGyms(scopedSessions), [scopedSessions]);
  const activeGymId = useMemo(() => {
    const availableIds = availableGyms.map((gym) => gym.gymId);
    if (selectedGymId !== undefined && availableIds.includes(selectedGymId)) {
      return selectedGymId;
    }
    const persisted = getProgressGradeGymId();
    if (persisted && availableIds.includes(persisted)) {
      return persisted;
    }
    return availableGyms[0]?.gymId ?? null;
  }, [availableGyms, selectedGymId]);

  function handleSelectGym(gymId: string | null) {
    setSelectedGymId(gymId);
    if (gymId) setProgressGradeGymId(gymId);
  }

  const gradeDistribution = useMemo(
    () => (availableGyms.length > 0 ? buildGradeDistribution(scopedSessions, activeGymId) : []),
    [scopedSessions, activeGymId, availableGyms.length]
  );
  const volumeTrend = useMemo(
    () => buildStrengthVolumeTrend(scopedSessions, STRENGTH_SESSIONS_SHOWN),
    [scopedSessions]
  );

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
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.screenTitle}>Progress</Text>

      <View style={styles.viewToggleRow}>
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
          <PressableScale
            onPress={goToPrevMonth}
            disabled={!canGoPrevMonth}
            hitSlop={10}
            style={styles.monthNavButton}
          >
            <Text style={[styles.monthNavArrow, !canGoPrevMonth && styles.monthNavArrowDisabled]}>
              {'‹'}
            </Text>
          </PressableScale>
          <Text style={styles.monthNavLabel}>
            {MONTH_NAMES[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </Text>
          <PressableScale
            onPress={goToNextMonth}
            disabled={!canGoNextMonth}
            hitSlop={10}
            style={styles.monthNavButton}
          >
            <Text style={[styles.monthNavArrow, !canGoNextMonth && styles.monthNavArrowDisabled]}>
              {'›'}
            </Text>
          </PressableScale>
        </View>
      ) : null}

      {view === 'month' && monthSessions.length === 0 ? (
        <View style={styles.emptyMonth}>
          <Text style={styles.emptyMonthText}>No sessions logged this month.</Text>
        </View>
      ) : null}

      <StatRow
        style={styles.statsRow}
        items={[
          { value: `${allTimeStats.totalSessions}`, label: 'Sessions' },
          { value: `${streak}`, label: 'Streak' },
          { value: allTimeStats.hardestGradeLabel ?? '—', label: 'Hardest' },
          {
            value:
              allTimeStats.totalStrengthVolume > 0
                ? `${allTimeStats.totalStrengthVolume}kg`
                : '—',
            label: 'Volume',
          },
        ]}
      />

      <Text style={styles.sectionLabel}>Session frequency</Text>
      <BarChart
        height={110}
        legend={[
          { label: 'Climb', color: colors.accent },
          { label: 'Strength', color: colors.success },
        ]}
        bars={weeklyFrequency.map((week) => ({
          label: week.weekLabel,
          segments: [
            { value: week.strengthCount, color: colors.success },
            { value: week.climbCount, color: colors.accent },
          ],
        }))}
      />

      {availableGyms.length > 0 ? (
        <>
          <View style={[styles.gradeDistributionHeader, styles.sectionSpacing]}>
            <Text style={styles.sectionLabel}>Grade distribution</Text>
            {availableGyms.length > 1 ? (
              <View style={styles.gradingTypeChips}>
                {availableGyms.map((gym) => (
                  <Chip
                    key={gym.gymId ?? '__unspecified__'}
                    label={gym.gymName}
                    selected={gym.gymId === activeGymId}
                    onPress={() => handleSelectGym(gym.gymId)}
                  />
                ))}
              </View>
            ) : null}
          </View>
          <BarChart
            height={110}
            bars={gradeDistribution.map((bar) => ({
              label: bar.label,
              segments: [{ value: bar.count, color: bar.color }],
            }))}
          />
        </>
      ) : null}

      {volumeTrend.length > 0 ? (
        <>
          <Text style={[styles.sectionLabel, styles.sectionSpacing]}>Strength volume</Text>
          <BarChart
            height={110}
            valueFormatter={(value) => `${Math.round(value)}kg`}
            bars={volumeTrend.map((bar) => ({
              label: bar.label,
              segments: [{ value: bar.volume, color: colors.accent }],
            }))}
          />
        </>
      ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  screenTitle: {
    ...typography.display,
    marginBottom: spacing.sm,
  },
  viewToggleRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  monthNavButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthNavArrow: {
    color: colors.accent,
    fontSize: 22,
    fontWeight: '700',
  },
  monthNavArrowDisabled: {
    color: colors.textMuted,
    opacity: 0.4,
  },
  monthNavLabel: {
    ...typography.section,
    minWidth: 150,
    textAlign: 'center',
  },
  emptyMonth: {
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    padding: spacing.sm,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emptyMonthText: {
    ...typography.bodyMuted,
  },
  statsRow: {
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    ...typography.section,
    marginBottom: spacing.sm,
  },
  gradeDistributionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  gradingTypeChips: {
    flexDirection: 'row',
    gap: spacing.xxs,
  },
  sectionSpacing: {
    marginTop: spacing.lg,
  },
  emptyState: {
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  emptyStateTitle: {
    ...typography.body,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyStateCopy: {
    ...typography.bodyMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
