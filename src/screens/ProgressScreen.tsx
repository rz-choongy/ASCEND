import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Polyline } from 'react-native-svg';
import { applyClimbEvents } from '../domain/climbLogUtils';
import { firstOfMonth } from '../domain/dateUtils';
import {
  buildAllTimeStats,
  buildGradeDistribution,
  buildGradeDistributionAcrossGyms,
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
import {
  BarChart,
  ChevronLeftIcon,
  ChevronRightIcon,
  Chip,
  IconButton,
  SegmentedControl,
  radius,
  spacing,
  useTheme,
} from '../ui';
import type { ThemeColors } from '../ui/tokens/colors';
import type { Typography } from '../ui/tokens/typography';

const WEEKS_SHOWN = 8;
const STRENGTH_SESSIONS_SHOWN = 10;
const MONTHS_BACK_LIMIT = 12;

/** Sentinel scope meaning "pool every gym", stored alongside real gym ids. */
const ALL_GYMS = '__all__';

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
  // undefined = user hasn't picked one this session yet -- fall back to the persisted
  // setting. A string is either a gym id or the ALL_GYMS sentinel.
  const [selectedScope, setSelectedScope] = useState<string | null | undefined>(undefined);
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
  const activeScope = useMemo(() => {
    const availableIds = availableGyms.map((gym) => gym.gymId);
    const isValid = (value: string | null) => value === ALL_GYMS || availableIds.includes(value);
    if (selectedScope !== undefined && isValid(selectedScope)) {
      return selectedScope;
    }
    const persisted = getProgressGradeGymId();
    if (persisted && isValid(persisted)) {
      return persisted;
    }
    return availableGyms[0]?.gymId ?? null;
  }, [availableGyms, selectedScope]);

  const isAllScope = activeScope === ALL_GYMS;

  function handleSelectScope(scope: string | null) {
    setSelectedScope(scope);
    if (scope) setProgressGradeGymId(scope);
  }

  const gradeDistribution = useMemo(() => {
    if (availableGyms.length === 0) return [];
    return isAllScope
      ? buildGradeDistributionAcrossGyms(scopedSessions, colors.gradePalette)
      : buildGradeDistribution(scopedSessions, activeScope);
  }, [scopedSessions, activeScope, isAllScope, availableGyms.length, colors.gradePalette]);

  const totalPyramidSends = useMemo(
    () => gradeDistribution.reduce((sum, bar) => sum + bar.count, 0),
    [gradeDistribution]
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
              <Text style={styles.pyramidTotal}>
                {totalPyramidSends} send{totalPyramidSends === 1 ? '' : 's'}
              </Text>
            </View>

            {availableGyms.length > 1 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scopeChips}
              >
                <Chip label="All" selected={isAllScope} onPress={() => handleSelectScope(ALL_GYMS)} />
                {availableGyms.map((gym) => (
                  <Chip
                    key={gym.gymId ?? '__unspecified__'}
                    label={gym.gymName}
                    selected={!isAllScope && gym.gymId === activeScope}
                    onPress={() => handleSelectScope(gym.gymId)}
                  />
                ))}
              </ScrollView>
            ) : null}
            <View style={styles.pyramid}>
              {gradeDistribution
                .slice()
                .reverse()
                .map((bar) => (
                  <View key={bar.label} style={styles.pyrRow}>
                    <Text style={styles.pyrGrade} numberOfLines={1} adjustsFontSizeToFit>
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
            {isAllScope ? (
              <Text style={styles.scopeNote}>
                Pooled by V-scale across {availableGyms.length} gyms — grade names differ per gym,
                the numeric grade doesn't.
              </Text>
            ) : null}
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
                stroke={colors.accent}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
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
                segments: [{ value: bar.volume, color: colors.accent }],
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
    fontSize: 34,
    letterSpacing: -0.8,
    marginBottom: spacing.s,
  },

  segmented: {
    marginBottom: spacing.sm,
  },

  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    marginBottom: spacing.s,
  },
  monthNavLabel: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
    minWidth: 150,
    textAlign: 'center',
  },
  emptyMonth: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
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
    ...typography.section,
    color: colors.textSecondary,
  },
  heroNum: {
    ...typography.display,
    fontSize: 56,
    lineHeight: 60,
    letterSpacing: -1.4,
    color: colors.accent,
    marginTop: 2,
  },
  heroSub: {
    ...typography.bodyMuted,
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 6,
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
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: colors.separator,
  },
  miniStatNum: {
    ...typography.numeric,
    fontSize: 20,
  },
  miniStatLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    letterSpacing: -0.05,
    marginTop: 3,
    fontWeight: '500',
  },

  // Analysis card
  // One inset-grouped card holding every chart, its sub-sections split by
  // hairlines -- the same read as a grouped table with multiple rows.
  analysis: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  subSection: {
    paddingVertical: spacing.s,
  },
  subSectionBordered: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.separator,
    marginTop: 2,
  },
  eyebrow: {
    ...typography.body,
    fontSize: 17,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  eyebrowMuted: {
    fontSize: 15,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  gradeDistributionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  pyramidTotal: {
    ...typography.meta,
    fontSize: 13,
    color: colors.textSecondary,
  },
  // Scrolls rather than wraps: the row stays one clean line however many gyms
  // the user has climbed at.
  scopeChips: {
    flexDirection: 'row',
    gap: spacing.xxs,
    paddingBottom: spacing.xs,
  },
  scopeNote: {
    ...typography.bodyMuted,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.xs,
    lineHeight: 16,
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
    width: 46,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
    color: colors.textSecondary,
  },
  pyrTrack: {
    flex: 1,
  },
  pyrBar: {
    height: 14,
    borderRadius: 7,
  },
  pyrCount: {
    ...typography.numeric,
    width: 20,
    fontSize: 12,
    fontWeight: '500',
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
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  spark: {
    width: '100%',
    height: 44,
  },
  sparkDot: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.accent,
    transform: [{ translateX: -2.5 }, { translateY: -2.5 }],
  },
  sparkLbls: {
    flexDirection: 'row',
    marginTop: 6,
  },
  sparkLblText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
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
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.separator,
  },
  pbLabel: {
    ...typography.body,
    fontSize: 16,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  pbValue: {
    ...typography.numeric,
    fontSize: 18,
  },

  emptyState: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  emptyStateTitle: {
    ...typography.body,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyStateCopy: {
    ...typography.bodyMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
