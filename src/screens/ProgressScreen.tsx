import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Polyline } from 'react-native-svg';
import { applyClimbEvents } from '../domain/climbLogUtils';
import { firstOfMonth } from '../domain/dateUtils';
import {
  buildAllTimeStats,
  buildGradeDistribution,
  buildStrengthVolumeTrend,
  buildWeeklyFrequency,
  findFirstReachedDate,
  findFlashRate,
  findLongestStreakEver,
  findMostClimbsInSession,
  getAvailableClimbGyms,
} from '../domain/progressInsights';
import { getCompletedSessions, getSessionEvents, getSessionStreak } from '../domain/sessionStore';
import { getProgressGradeGymId, setProgressGradeGymId } from '../domain/settingsStore';
import type { SessionRow } from '../domain/types';
import { BarChart, Chip, PressableScale, spacing, useTheme } from '../ui';
import type { ThemeColors } from '../ui/tokens/colors';
import type { Typography } from '../ui/tokens/typography';

const WEEKS_SHOWN = 8;
const STRENGTH_SESSIONS_SHOWN = 10;
const MONTHS_BACK_LIMIT = 12;

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const MONTH_SHORT = MONTH_NAMES.map((m) => m.slice(0, 3));

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

  const sendsLogged = useMemo(() => {
    let count = 0;
    scopedSessions
      .filter((s) => s.type === 'climb')
      .forEach((s) => {
        count += applyClimbEvents(getSessionEvents(s.id)).length;
      });
    return count;
  }, [scopedSessions]);

  const firstReached = useMemo(
    () => findFirstReachedDate(scopedSessions, allTimeStats.hardestGradeLabel),
    [scopedSessions, allTimeStats.hardestGradeLabel]
  );

  // Personal bests are historical records -- always computed over full history,
  // independent of the All time / By month toggle above.
  const longestStreakEver = useMemo(() => findLongestStreakEver(sessions), [sessions]);
  const mostClimbsInSession = useMemo(() => findMostClimbsInSession(sessions), [sessions]);
  const flashRate = useMemo(() => findFlashRate(sessions), [sessions]);

  const pyramidMax = Math.max(1, ...gradeDistribution.map((bar) => bar.count));
  const weekTotals = weeklyFrequency.map((w) => w.climbCount + w.strengthCount);
  const weekMax = Math.max(1, ...weekTotals);
  const sparkPoints = weekTotals
    .map((total, i) => {
      const x = weekTotals.length > 1 ? (i / (weekTotals.length - 1)) * 100 : 50;
      const y = 100 - (total / weekMax) * 90 - 5;
      return { x, y };
    });

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

      {/* Ghost-underline segmented control -- deliberately distinct from Settings'
          filled-pill style; ordinary state never uses amber here (reserved for
          record/peak data only). */}
      <View style={styles.segmented}>
        <TouchableOpacity style={styles.seg} onPress={() => setView('all')} activeOpacity={0.7}>
          <Text style={[styles.segText, view === 'all' && styles.segTextActive]}>All time</Text>
          {view === 'all' ? <View style={styles.segUnderline} /> : null}
        </TouchableOpacity>
        <TouchableOpacity style={styles.seg} onPress={() => setView('month')} activeOpacity={0.7}>
          <Text style={[styles.segText, view === 'month' && styles.segTextActive]}>By month</Text>
          {view === 'month' ? <View style={styles.segUnderline} /> : null}
        </TouchableOpacity>
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

      {/* Hero -- the one dominant metric, off the grid */}
      {allTimeStats.hardestGradeLabel ? (
        <View style={styles.hero}>
          <Text style={styles.heroLabel}>Hardest send</Text>
          <Text style={styles.heroNum}>{allTimeStats.hardestGradeLabel}</Text>
          {firstReached ? (
            <Text style={styles.heroSub}>
              First reached {MONTH_SHORT[new Date(firstReached).getMonth()]}{' '}
              {new Date(firstReached).getDate()}
            </Text>
          ) : null}
        </View>
      ) : null}

      <View style={styles.miniStats}>
        <View style={styles.miniStat}>
          <Text style={styles.miniStatNum}>{allTimeStats.totalSessions}</Text>
          <Text style={styles.miniStatLabel}>Sessions</Text>
        </View>
        <View style={[styles.miniStat, styles.miniStatDivider]}>
          <Text style={styles.miniStatNum}>{streak}</Text>
          <Text style={styles.miniStatLabel}>Current streak</Text>
        </View>
        <View style={[styles.miniStat, styles.miniStatDivider]}>
          <Text style={styles.miniStatNum}>{sendsLogged}</Text>
          <Text style={styles.miniStatLabel}>Sends logged</Text>
        </View>
      </View>

      {/* One elevated surface holding every chart/list -- two zones on the page
          (hero, floating) + (this card), not a stack of separately-boxed widgets. */}
      <View style={styles.analysis}>
        {gradeDistribution.length > 0 ? (
          <View style={styles.subSection}>
            <View style={styles.gradeDistributionHeader}>
              <Text style={styles.eyebrow}>Grade pyramid</Text>
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
            <View style={styles.pyramid}>
              {gradeDistribution
                .slice()
                .reverse()
                .map((bar) => (
                  <View key={bar.label} style={styles.pyrRow}>
                    <Text style={styles.pyrGrade} numberOfLines={1}>
                      {bar.label}
                    </Text>
                    <View style={styles.pyrTrack}>
                      <View
                        style={[
                          styles.pyrBar,
                          {
                            width: `${Math.max(8, (bar.count / pyramidMax) * 100)}%`,
                            backgroundColor: bar.color,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.pyrCount}>{bar.count}</Text>
                  </View>
                ))}
            </View>
          </View>
        ) : null}

        <View style={[styles.subSection, styles.subSectionBordered]}>
          <Text style={styles.eyebrow}>
            Session frequency <Text style={styles.eyebrowMuted}>— last {WEEKS_SHOWN} weeks</Text>
          </Text>
          <View style={styles.sparkWrap}>
            <Text style={styles.sparkPeakLbl}>{weekMax}</Text>
            <Svg style={styles.spark} viewBox="0 0 100 100" preserveAspectRatio="none">
              <Polyline
                points={sparkPoints.map((p) => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke={colors.textMuted}
                strokeWidth={1.6}
                vectorEffect="non-scaling-stroke"
              />
            </Svg>
            {sparkPoints.map((p, i) => (
              <View key={i} style={[styles.sparkDot, { left: `${p.x}%`, top: `${p.y}%` }]} />
            ))}
          </View>
          <View style={styles.sparkLbls}>
            {weeklyFrequency.map((w) => (
              <Text key={w.weekLabel} style={styles.sparkLblText}>
                {w.weekLabel}
              </Text>
            ))}
          </View>
        </View>

        {volumeTrend.length > 0 ? (
          <View style={[styles.subSection, styles.subSectionBordered]}>
            <Text style={styles.eyebrow}>Strength volume</Text>
            <BarChart
              height={80}
              valueFormatter={(value) => `${Math.round(value)}kg`}
              bars={volumeTrend.map((bar) => ({
                label: bar.label,
                segments: [{ value: bar.volume, color: colors.textMuted }],
              }))}
            />
          </View>
        ) : null}

        <View style={[styles.subSection, styles.subSectionBordered]}>
          <Text style={styles.eyebrow}>Personal bests</Text>
          <View style={styles.pbList}>
            <View style={styles.pbRow}>
              <Text style={styles.pbLabel}>Longest streak</Text>
              <Text style={styles.pbValue}>{longestStreakEver} day{longestStreakEver === 1 ? '' : 's'}</Text>
            </View>
            <View style={[styles.pbRow, styles.pbRowBordered]}>
              <Text style={styles.pbLabel}>Most climbs in a session</Text>
              <Text style={styles.pbValue}>{mostClimbsInSession}</Text>
            </View>
            <View style={[styles.pbRow, styles.pbRowBordered]}>
              <Text style={styles.pbLabel}>Flash rate</Text>
              <Text style={styles.pbValue}>{flashRate}%</Text>
            </View>
          </View>
        </View>
      </View>
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
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  screenTitle: {
    ...typography.display,
    fontSize: 28,
    marginBottom: spacing.sm,
  },

  segmented: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.sm,
  },
  seg: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: 8,
  },
  segText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  segTextActive: {
    color: colors.textPrimary,
  },
  segUnderline: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -1,
    height: 2,
    backgroundColor: colors.textPrimary,
  },

  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    marginBottom: spacing.s,
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
    borderRadius: 0,
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

  // Hero
  hero: {
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  heroLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  heroNum: {
    ...typography.display,
    fontSize: 52,
    lineHeight: 54,
    color: colors.accent,
    marginTop: 4,
  },
  heroSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 8,
  },

  // Mini stats
  miniStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  miniStat: {
    alignItems: 'center',
    paddingHorizontal: spacing.s,
  },
  miniStatDivider: {
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
  },
  miniStatNum: {
    ...typography.numeric,
    fontSize: 18,
  },
  miniStatLabel: {
    fontSize: 9.5,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 5,
    fontWeight: '600',
  },

  // Analysis card
  analysis: {
    backgroundColor: colors.surfaceRaised,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginBottom: spacing.md,
  },
  subSection: {
    paddingVertical: spacing.xs,
  },
  subSectionBordered: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 2,
  },
  eyebrow: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  eyebrowMuted: {
    textTransform: 'none',
    letterSpacing: 0,
    fontWeight: '500',
  },
  gradeDistributionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  gradingTypeChips: {
    flexDirection: 'row',
    gap: spacing.xxs,
  },

  // Grade pyramid
  pyramid: {
    marginTop: spacing.xs,
    gap: 5,
  },
  pyrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pyrGrade: {
    ...typography.numeric,
    minWidth: 26,
    maxWidth: 64,
    fontSize: 11,
    textAlign: 'right',
    color: colors.textSecondary,
  },
  pyrTrack: {
    flex: 1,
  },
  pyrBar: {
    height: 13,
  },
  pyrCount: {
    ...typography.numeric,
    width: 18,
    fontSize: 10.5,
    color: colors.textMuted,
  },

  // Sparkline
  sparkWrap: {
    marginTop: spacing.xs,
    height: 44,
    position: 'relative',
  },
  sparkPeakLbl: {
    position: 'absolute',
    right: 0,
    top: -14,
    ...typography.numeric,
    fontSize: 10.5,
    color: colors.textSecondary,
  },
  spark: {
    width: '100%',
    height: 44,
  },
  sparkDot: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.textMuted,
    transform: [{ translateX: -2 }, { translateY: -2 }],
  },
  sparkLbls: {
    flexDirection: 'row',
    marginTop: 6,
  },
  sparkLblText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 9.5,
    color: colors.textMuted,
    fontWeight: '600',
  },

  // Personal bests
  pbList: {
    marginTop: spacing.xs,
  },
  pbRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingVertical: 7,
  },
  pbRowBordered: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  pbLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  pbValue: {
    ...typography.numeric,
    fontSize: 17,
  },

  emptyState: {
    borderRadius: 0,
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
