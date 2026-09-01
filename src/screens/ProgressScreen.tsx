import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
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
import { BarChart, Chip, StatRow, spacing, useTheme } from '../ui';
import type { ThemeColors } from '../ui/tokens/colors';
import type { Typography } from '../ui/tokens/typography';

const WEEKS_SHOWN = 10;
const STRENGTH_SESSIONS_SHOWN = 10;

export function ProgressScreen() {
  const { colors, typography } = useTheme();
  const styles = useMemo(() => createStyles(colors, typography), [colors, typography]);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [streak, setStreak] = useState(0);
  // undefined = user hasn't picked one this session yet -- fall back to the persisted setting.
  const [selectedGymId, setSelectedGymId] = useState<string | null | undefined>(undefined);

  useFocusEffect(
    useCallback(() => {
      setSessions(getCompletedSessions());
      setStreak(getSessionStreak());
    }, [])
  );

  const allTimeStats = useMemo(() => buildAllTimeStats(sessions), [sessions]);
  const weeklyFrequency = useMemo(
    () => buildWeeklyFrequency(sessions, WEEKS_SHOWN),
    [sessions]
  );
  const availableGyms = useMemo(() => getAvailableClimbGyms(sessions), [sessions]);
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
    () => (availableGyms.length > 0 ? buildGradeDistribution(sessions, activeGymId) : []),
    [sessions, activeGymId, availableGyms.length]
  );
  const volumeTrend = useMemo(
    () => buildStrengthVolumeTrend(sessions, STRENGTH_SESSIONS_SHOWN),
    [sessions]
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
