import { useMemo, useState } from 'react';
import { LayoutAnimation, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';
import { applyClimbEvents } from '../../domain/climbLogUtils';
import {
  buildAllTimeStats,
  buildGradeDistribution,
  buildGradeDistributionAcrossGyms,
  buildHardestSendTrend,
  buildWeekCompletion,
  buildWeeklyFrequency,
  findFirstReachedDate,
  findFlashRate,
  findLongestStreakEver,
  findMostClimbsInSession,
  getAvailableClimbGyms,
} from '../../domain/progressInsights';
import { getSessionEvents } from '../../domain/sessionStore';
import {
  getFavoriteGradeGymIds,
  getProgressGradeGymId,
  setFavoriteGradeGymIds,
  setProgressGradeGymId,
} from '../../domain/settingsStore';
import { formatMonthDay } from '../../domain/strengthProgress';
import type { SessionRow } from '../../domain/types';
import { Card, Chip, LineChart, StatRow, font, spacing, useTheme } from '../../ui';
import type { ThemeColors } from '../../ui/tokens/colors';
import type { Typography } from '../../ui/tokens/typography';
import { GymScopeSheet, type GymScopeOption } from './GymScopeSheet';

const WEEKS_SHOWN = 8;
const SENDS_BARS_SHOWN = 6;
const TREND_WEEKS = 12;

/** Sentinel scope meaning "pool every gym", stored alongside real gym ids. */
const ALL_GYMS = '__all__';
/** Climbs logged before gyms were tracked have no gym id; this stands in for it as a key. */
const UNSPECIFIED = '__unspecified__';
/** Before the user pins any, the most-visited gyms get the chips. */
const DEFAULT_PINNED = 2;

const keyOf = (gymId: string | null) => gymId ?? UNSPECIFIED;
const gymIdOf = (key: string) => (key === UNSPECIFIED ? null : key);

type Props = {
  /** Full history: streaks, personal bests, and the weekly trend ignore the month toggle. */
  sessions: SessionRow[];
  /** Sessions inside the All time / By month selection. */
  scopedSessions: SessionRow[];
  streak: number;
};

export function ClimbProgressView({ sessions, scopedSessions, streak }: Props) {
  const { colors, typography } = useTheme();
  const styles = useMemo(() => createStyles(colors, typography), [colors, typography]);
  // undefined = user hasn't picked one this session yet -- fall back to the persisted
  // setting. A string is either a gym id or the ALL_GYMS sentinel.
  const [selectedScope, setSelectedScope] = useState<string | null | undefined>(undefined);
  const [storedFavorites, setStoredFavorites] = useState<string[] | null>(() => getFavoriteGradeGymIds());
  const [isGymSheetOpen, setIsGymSheetOpen] = useState(false);

  const allTimeStats = useMemo(() => buildAllTimeStats(scopedSessions), [scopedSessions]);
  const weeklyFrequency = useMemo(() => buildWeeklyFrequency(sessions, WEEKS_SHOWN), [sessions]);
  const weekCompletion = useMemo(() => buildWeekCompletion(sessions), [sessions]);
  const gradeTrend = useMemo(() => buildHardestSendTrend(sessions, TREND_WEEKS), [sessions]);
  const availableGyms = useMemo(() => getAvailableClimbGyms(scopedSessions), [scopedSessions]);

  const activeScope = useMemo(() => {
    const availableIds = availableGyms.map((gym) => gym.gymId);
    const isValid = (value: string | null) => value === ALL_GYMS || availableIds.includes(value);
    if (selectedScope !== undefined && isValid(selectedScope)) return selectedScope;
    const persisted = getProgressGradeGymId();
    if (persisted && isValid(persisted)) return persisted;
    return availableGyms[0]?.gymId ?? null;
  }, [availableGyms, selectedScope]);
  const isAllScope = activeScope === ALL_GYMS;

  function handleSelectScope(scope: string | null) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedScope(scope);
    if (scope) setProgressGradeGymId(scope);
  }

  const gymOptions = useMemo<GymScopeOption[]>(() => {
    const counts = new Map<string, number>();
    scopedSessions
      .filter((s) => s.type === 'climb')
      .forEach((s) => counts.set(keyOf(s.gym_id), (counts.get(keyOf(s.gym_id)) ?? 0) + 1));
    return availableGyms
      .map((gym) => ({ key: keyOf(gym.gymId), name: gym.gymName, sessions: counts.get(keyOf(gym.gymId)) ?? 0 }))
      .sort((a, b) => b.sessions - a.sessions);
  }, [availableGyms, scopedSessions]);

  const favoriteKeys = useMemo(
    () => new Set(storedFavorites ?? gymOptions.slice(0, DEFAULT_PINNED).map((g) => g.key)),
    [storedFavorites, gymOptions]
  );
  const activeKey = isAllScope ? null : keyOf(activeScope);
  // Pinned gyms, plus whichever unpinned gym is being viewed so the selection stays visible.
  const chipGyms = gymOptions.filter((g) => favoriteKeys.has(g.key) || g.key === activeKey);
  const hasUnpinned = gymOptions.some((g) => !favoriteKeys.has(g.key));

  function handleToggleFavoriteGym(key: string) {
    const next = new Set(favoriteKeys);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    const ids = [...next];
    setStoredFavorites(ids);
    setFavoriteGradeGymIds(ids);
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

  const climbSessions = useMemo(() => scopedSessions.filter((s) => s.type === 'climb'), [scopedSessions]);
  const logsPerSession = useMemo(
    () => climbSessions.map((s) => applyClimbEvents(getSessionEvents(s.id))),
    [climbSessions]
  );
  const sendsLogged = logsPerSession.reduce((sum, logs) => sum + logs.length, 0);
  // The tape colour of the hardest climb, for the dot beside the grade.
  const hardestColor = useMemo(() => {
    let best: { gradeMax: number; color: string | null } | null = null;
    logsPerSession.forEach((logs) =>
      logs.forEach((log) => {
        if (!best || log.gradeMax > best.gradeMax) best = { gradeMax: log.gradeMax, color: log.gradeColor ?? null };
      })
    );
    return (best as { color: string | null } | null)?.color ?? undefined;
  }, [logsPerSession]);

  const firstReached = useMemo(
    () => findFirstReachedDate(scopedSessions, allTimeStats.hardestGradeLabel),
    [scopedSessions, allTimeStats.hardestGradeLabel]
  );

  // Personal bests are historical records -- always computed over full history.
  const longestStreakEver = useMemo(() => findLongestStreakEver(sessions), [sessions]);
  const mostClimbsInSession = useMemo(() => findMostClimbsInSession(sessions), [sessions]);
  const flashRate = useMemo(() => findFlashRate(sessions), [sessions]);
  const daysDoneThisWeek = weekCompletion.filter((day) => day.done).length;

  const pyramidMax = Math.max(1, ...gradeDistribution.map((bar) => bar.count));
  const weekTotals = weeklyFrequency.map((w) => w.climbCount);
  const weekMax = Math.max(1, ...weekTotals);
  const sparkPoints = weekTotals.map((total, i) => ({
    x: weekTotals.length > 1 ? (i / (weekTotals.length - 1)) * 100 : 50,
    y: 100 - (total / weekMax) * 90 - 5,
  }));

  return (
    <View style={styles.stack}>
      <Card padded="compact">
        <StatRow
          bare
          items={[
            {
              label: 'Hardest send',
              value: allTimeStats.hardestGradeLabel ?? '—',
              sub: firstReached ? `since ${formatMonthDay(firstReached)}` : undefined,
              dotColor: allTimeStats.hardestGradeLabel ? hardestColor : undefined,
            },
            {
              label: 'Sends',
              value: String(sendsLogged),
              sub: `${climbSessions.length} session${climbSessions.length === 1 ? '' : 's'}`,
            },
            { label: 'Flash rate', value: `${flashRate}%`, sub: 'first try' },
          ]}
        />
        <View style={styles.streakRow}>
          <Text style={styles.streakLabel}>Current streak</Text>
          <Text style={styles.streakValue}>
            {streak} {streak === 1 ? 'day' : 'days'}
          </Text>
          <View style={styles.dots} accessible accessibilityLabel={`${daysDoneThisWeek} of 7 days this week`}>
            {weekCompletion.map((day, i) => (
              <View key={i} style={[styles.dot, day.done ? styles.dotDone : null]} />
            ))}
          </View>
        </View>
      </Card>

      {gradeDistribution.length > 0 ? (
        <Card padded="graph">
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Grade pyramid</Text>
            <Text style={styles.cardMeta}>
              {totalPyramidSends} climb{totalPyramidSends === 1 ? '' : 's'}
            </Text>
          </View>

          {availableGyms.length > 1 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scopeChips}>
              <Chip label="All" selected={isAllScope} onPress={() => handleSelectScope(ALL_GYMS)} />
              {chipGyms.map((gym) => (
                <Chip
                  key={gym.key}
                  label={gym.name}
                  selected={gym.key === activeKey}
                  onPress={() => handleSelectScope(gymIdOf(gym.key))}
                />
              ))}
              <Chip
                label={hasUnpinned ? 'More ▾' : 'Gyms ▾'}
                onPress={() => setIsGymSheetOpen(true)}
                style={styles.moreChip}
              />
            </ScrollView>
          ) : null}

          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.pyrFlash]} />
              <Text style={styles.legendText}>Flash</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.pyrSend]} />
              <Text style={styles.legendText}>Send</Text>
            </View>
          </View>

          {/* Easiest first, reading down -- the order grades are climbed in. Each bar is
              flashes in strong ink, then the other sends in quiet grey, each segment
              carrying its own count. */}
          <View style={styles.pyramid}>
            {gradeDistribution.map((bar) => {
              const sends = bar.count - bar.flashCount;
              return (
                <View
                  key={bar.label}
                  style={styles.pyrRow}
                  accessible
                  accessibilityLabel={`${bar.label}: ${bar.count} climbs, ${bar.flashCount} flashed`}
                >
                  <Text style={styles.pyrGrade} numberOfLines={1} adjustsFontSizeToFit>
                    {bar.label}
                  </Text>
                  <View style={styles.pyrTrack}>
                    <View style={[styles.pyrBar, { width: `${(bar.count / pyramidMax) * 100}%` }]}>
                      {bar.flashCount > 0 ? (
                        <View style={[styles.pyrSegment, styles.pyrFlash, { flex: bar.flashCount }]}>
                          <Text style={[styles.pyrSegmentText, styles.pyrFlashText]}>
                            {bar.flashCount}
                          </Text>
                        </View>
                      ) : null}
                      {sends > 0 ? (
                        <View style={[styles.pyrSegment, styles.pyrSend, { flex: sends }]}>
                          <Text style={[styles.pyrSegmentText, styles.pyrSendText]}>{sends}</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>

          <GymScopeSheet
            visible={isGymSheetOpen}
            gyms={gymOptions}
            favoriteKeys={favoriteKeys}
            selectedKey={activeKey}
            onSelect={(key) => {
              handleSelectScope(gymIdOf(key));
              setIsGymSheetOpen(false);
            }}
            onToggleFavorite={handleToggleFavoriteGym}
            onClose={() => setIsGymSheetOpen(false)}
          />
          {isAllScope ? (
            <Text style={styles.scopeNote}>
              Pooled by V-scale across {availableGyms.length} gyms — grade names differ per gym, the numeric
              grade doesn't.
            </Text>
          ) : null}
        </Card>
      ) : null}

      {gradeTrend.length >= 2 ? (
        <Card padded="graph">
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Grade trend</Text>
            <Text style={styles.cardMeta}>hardest send · last {TREND_WEEKS} weeks</Text>
          </View>
          <View style={styles.chart}>
            <LineChart
              points={gradeTrend.map((p) => ({ value: p.grade, label: p.weekLabel }))}
              height={140}
              valueFormatter={(value) => `V${Math.round(value)}`}
            />
          </View>
        </Card>
      ) : null}

      <Card padded="graph">
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Frequency</Text>
          <Text style={styles.cardMeta}>
            last {WEEKS_SHOWN} weeks · peak {weekMax}/wk
          </Text>
        </View>
        <View style={styles.sparkWrap}>
          <Svg style={styles.spark} viewBox="0 0 100 100" preserveAspectRatio="none">
            <Polyline
              points={sparkPoints.map((p) => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke={colors.chartStrong}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </Svg>
          {sparkPoints.map((p, i) => (
            <View
              key={i}
              style={[
                styles.sparkDot,
                i === sparkPoints.length - 1 ? styles.sparkDotLatest : null,
                { left: `${p.x}%`, top: `${p.y}%` },
              ]}
            />
          ))}
        </View>
        <View style={styles.sparkLbls}>
          {weeklyFrequency.map((w) => (
            <Text key={w.weekLabel} style={styles.sparkLblText}>
              {w.weekLabel}
            </Text>
          ))}
        </View>
      </Card>

      <StatRow
        items={[
          { label: 'Sessions', value: String(climbSessions.length) },
          { label: 'Best streak', value: `${longestStreakEver}d` },
          { label: 'Most climbs', value: String(mostClimbsInSession) },
        ]}
      />
    </View>
  );
}

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
    stack: { gap: spacing.xs },

    streakRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginTop: 10,
      paddingTop: 10,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.separator,
    },
    streakLabel: { ...typography.meta, ...font('semibold') },
    streakValue: { ...typography.body, ...font('bold'), fontSize: 15, flex: 1, fontVariant: ['tabular-nums'] },
    dots: { flexDirection: 'row', gap: 4 },
    dot: { width: 9, height: 9, borderRadius: 4.5, backgroundColor: colors.chartTrack },
    dotDone: { backgroundColor: colors.accent },

    cardHeader: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: spacing.xs,
    },
    cardTitle: { ...typography.title },
    cardMeta: { ...typography.meta, flexShrink: 1, textAlign: 'right' },

    // Scrolls rather than wraps: the row stays one clean line however many gyms
    // the user has climbed at.
    scopeChips: { flexDirection: 'row', gap: spacing.xxs, paddingTop: spacing.xs },
    scopeNote: {
      ...typography.meta,
      color: colors.textMuted,
      marginTop: spacing.xs,
      lineHeight: 18,
    },

    pyramid: { marginTop: spacing.xs, gap: 8 },
    pyrRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    pyrGrade: {
      ...typography.numeric,
      width: 40,
      fontSize: 20,
      lineHeight: 22,
    },
    pyrTrack: { flex: 1, height: 20, borderRadius: 6, backgroundColor: colors.chartTrack, overflow: 'hidden' },
    // Tall enough to hold its numbers; a segment never shrinks below its count.
    // Absolutely positioned so it reads as a fill on top of pyrTrack's full-width track.
    pyrBar: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      borderRadius: 6,
      flexDirection: 'row',
      overflow: 'hidden',
      gap: 2,
    },
    pyrSegment: { minWidth: 24, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
    pyrSegmentText: { ...font('semibold'), fontSize: 12, fontVariant: ['tabular-nums'] },
    pyrFlash: { backgroundColor: colors.chartStrong },
    pyrFlashText: { color: colors.surface },
    pyrSend: { backgroundColor: colors.chartQuiet },
    pyrSendText: { color: colors.textPrimary },
    moreChip: { borderStyle: 'dashed' },
    legend: { flexDirection: 'row', gap: spacing.s, marginTop: spacing.xs },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendText: { ...typography.meta },

    chart: { marginTop: spacing.s },
    sparkWrap: { marginTop: spacing.sm, height: 56, position: 'relative' },
    spark: { width: '100%', height: 56 },
    sparkDot: {
      position: 'absolute',
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.chartStrong,
      transform: [{ translateX: -3 }, { translateY: -3 }],
    },
    sparkDotLatest: {
      width: 11,
      height: 11,
      borderRadius: 5.5,
      backgroundColor: colors.accent,
      borderWidth: 2,
      borderColor: colors.surface,
      transform: [{ translateX: -5.5 }, { translateY: -5.5 }],
    },
    sparkLbls: { flexDirection: 'row', marginTop: 8 },
    sparkLblText: {
      flex: 1,
      textAlign: 'center',
      ...font('medium'),
      fontSize: 11,
      color: colors.textMuted,
    },
  });
