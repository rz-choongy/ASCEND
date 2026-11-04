import { useMemo, useState } from 'react';
import { LayoutAnimation, ScrollView, StyleSheet, Text, View } from 'react-native';
import { applyClimbEvents } from '../../domain/climbLogUtils';
import {
  buildAllTimeStats,
  buildGradeDistribution,
  buildGradeDistributionAcrossGyms,
  buildHardestSendTrend,
  buildWeeklyFrequency,
  findFirstReachedDate,
  getAvailableClimbGyms,
  trendWeeksForPeriod,
  type ProgressPeriod,
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
import { BarChart, Card, Chip, GradeChip, LineChart, StatRow, font, spacing, useTheme } from '../../ui';
import type { ThemeColors } from '../../ui/tokens/colors';
import type { Typography } from '../../ui/tokens/typography';
import { GymScopeSheet, type GymScopeOption } from './GymScopeSheet';

const WEEKS_SHOWN = 8;

/** Sentinel scope meaning "pool every gym", stored alongside real gym ids. */
const ALL_GYMS = '__all__';
/** Climbs logged before gyms were tracked have no gym id; this stands in for it as a key. */
const UNSPECIFIED = '__unspecified__';
/** Before the user pins any, the most-visited gyms get the chips. */
const DEFAULT_PINNED = 2;

const keyOf = (gymId: string | null) => gymId ?? UNSPECIFIED;
const gymIdOf = (key: string) => (key === UNSPECIFIED ? null : key);

type Props = {
  /** Full history: the weekly frequency chart and "since" dates ignore the period. */
  sessions: SessionRow[];
  /** Sessions inside the selected period (W / M / 3M / Y / All). */
  scopedSessions: SessionRow[];
  period: ProgressPeriod;
};

export function ClimbProgressView({ sessions, scopedSessions, period }: Props) {
  const { colors, typography } = useTheme();
  const styles = useMemo(() => createStyles(colors, typography), [colors, typography]);
  // undefined = user hasn't picked one this session yet -- fall back to the persisted
  // setting. A string is either a gym id or the ALL_GYMS sentinel.
  const [selectedScope, setSelectedScope] = useState<string | null | undefined>(undefined);
  const [storedFavorites, setStoredFavorites] = useState<string[] | null>(() => getFavoriteGradeGymIds());
  const [isGymSheetOpen, setIsGymSheetOpen] = useState(false);

  const allTimeStats = useMemo(() => buildAllTimeStats(scopedSessions), [scopedSessions]);
  const weeklyFrequency = useMemo(() => buildWeeklyFrequency(sessions, WEEKS_SHOWN), [sessions]);
  const trendWeeks = useMemo(() => trendWeeksForPeriod(period, sessions), [period, sessions]);
  const gradeTrend = useMemo(() => buildHardestSendTrend(sessions, trendWeeks), [sessions, trendWeeks]);
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
  const flashesLogged = logsPerSession.reduce(
    (sum, logs) => sum + logs.filter((log) => log.result === 'FLASH').length,
    0
  );
  const flashRate = sendsLogged === 0 ? 0 : Math.round((flashesLogged / sendsLogged) * 100);
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

  // "Since" is the first time the grade was ever reached, not the first time inside the period.
  const firstReached = useMemo(
    () => findFirstReachedDate(sessions, allTimeStats.hardestGradeLabel),
    [sessions, allTimeStats.hardestGradeLabel]
  );

  const pyramidMax = Math.max(1, ...gradeDistribution.map((bar) => bar.count));
  const weekPeak = Math.max(0, ...weeklyFrequency.map((w) => w.climbCount));
  const trendMeta = period === 'All' ? 'all time' : `last ${trendWeeks} weeks`;

  return (
    <View style={styles.stack}>
      <StatRow
        items={[
          {
            label: 'Hardest',
            value: allTimeStats.hardestGradeLabel ?? '—',
            sub: firstReached ? `since ${formatMonthDay(firstReached)}` : undefined,
            dotColor: allTimeStats.hardestGradeLabel ? hardestColor : undefined,
          },
          {
            label: 'Sends',
            value: String(sendsLogged),
            sub: `${climbSessions.length} session${climbSessions.length === 1 ? '' : 's'}`,
          },
          {
            label: 'Flashed',
            value: `${flashRate}%`,
            sub: sendsLogged > 0 ? `${flashesLogged} of ${sendsLogged}` : 'first try',
          },
        ]}
      />

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
              flashes in strong ink, then the other sends in quiet grey; the total sits to the right. */}
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
                  <GradeChip label={bar.label} color={bar.color} style={styles.pyrGrade} />
                  <View style={styles.pyrTrack}>
                    {bar.flashCount > 0 ? (
                      <View
                        style={[styles.pyrSegment, styles.pyrFlash, { width: `${(bar.flashCount / pyramidMax) * 100}%` }]}
                      />
                    ) : null}
                    {sends > 0 ? (
                      <View style={[styles.pyrSegment, styles.pyrSend, { width: `${(sends / pyramidMax) * 100}%` }]} />
                    ) : null}
                  </View>
                  <Text style={styles.pyrCount}>{bar.count}</Text>
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
            <Text style={styles.cardMeta}>hardest send by week · {trendMeta}</Text>
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
          <Text style={styles.cardTitle}>Sessions</Text>
          <Text style={styles.cardMeta}>
            per week · last {WEEKS_SHOWN} weeks{weekPeak > 0 ? ` · peak ${weekPeak}` : ''}
          </Text>
        </View>
        <View style={styles.chart}>
          <BarChart
            height={120}
            maxValue={Math.max(1, weekPeak)}
            bars={weeklyFrequency.map((week, i) => ({
              label: week.weekLabel,
              segments: [
                {
                  value: week.climbCount,
                  // Ink bars; only the current week takes the accent.
                  color: i === weeklyFrequency.length - 1 ? colors.accent : colors.chartStrong,
                },
              ],
            }))}
          />
        </View>
      </Card>
    </View>
  );
}

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
    stack: { gap: spacing.xs },

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
    pyrGrade: { width: 40 },
    pyrTrack: {
      flex: 1,
      height: 16,
      borderRadius: 6,
      backgroundColor: colors.chartTrack,
      flexDirection: 'row',
      gap: 2,
      overflow: 'hidden',
    },
    pyrSegment: { height: '100%', borderRadius: 6 },
    pyrFlash: { backgroundColor: colors.chartStrong },
    pyrSend: { backgroundColor: colors.chartQuiet },
    pyrCount: {
      ...font('semibold'),
      fontSize: 14,
      color: colors.textPrimary,
      minWidth: 22,
      textAlign: 'right',
      fontVariant: ['tabular-nums'],
    },
    moreChip: { borderStyle: 'dashed' },
    legend: { flexDirection: 'row', gap: spacing.s, marginTop: spacing.xs },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendText: { ...typography.meta },

    chart: { marginTop: spacing.s },
  });
