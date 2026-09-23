import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';
import { applyClimbEvents } from '../../domain/climbLogUtils';
import {
  buildAllTimeStats,
  buildGradeDistribution,
  buildGradeDistributionAcrossGyms,
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
import { Chip, StatGrid, StatTile, font, radius, spacing, useTheme, type Shadows } from '../../ui';
import type { ThemeColors } from '../../ui/tokens/colors';
import type { Typography } from '../../ui/tokens/typography';
import { GymScopeSheet, type GymScopeOption } from './GymScopeSheet';

const WEEKS_SHOWN = 8;
const SENDS_BARS_SHOWN = 6;

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
  const { colors, typography, shadows } = useTheme();
  const styles = useMemo(() => createStyles(colors, typography, shadows), [colors, typography, shadows]);
  // undefined = user hasn't picked one this session yet -- fall back to the persisted
  // setting. A string is either a gym id or the ALL_GYMS sentinel.
  const [selectedScope, setSelectedScope] = useState<string | null | undefined>(undefined);
  const [storedFavorites, setStoredFavorites] = useState<string[] | null>(() => getFavoriteGradeGymIds());
  const [isGymSheetOpen, setIsGymSheetOpen] = useState(false);

  const allTimeStats = useMemo(() => buildAllTimeStats(scopedSessions), [scopedSessions]);
  const weeklyFrequency = useMemo(() => buildWeeklyFrequency(sessions, WEEKS_SHOWN), [sessions]);
  const weekCompletion = useMemo(() => buildWeekCompletion(sessions), [sessions]);
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
  const sendsPerSession = useMemo(
    () => climbSessions.map((s) => applyClimbEvents(getSessionEvents(s.id)).length),
    [climbSessions]
  );
  const sendsLogged = sendsPerSession.reduce((sum, n) => sum + n, 0);

  const firstReached = useMemo(
    () => findFirstReachedDate(scopedSessions, allTimeStats.hardestGradeLabel),
    [scopedSessions, allTimeStats.hardestGradeLabel]
  );

  // Personal bests are historical records -- always computed over full history.
  const longestStreakEver = useMemo(() => findLongestStreakEver(sessions), [sessions]);
  const mostClimbsInSession = useMemo(() => findMostClimbsInSession(sessions), [sessions]);
  const flashRate = useMemo(() => findFlashRate(sessions), [sessions]);

  const pyramidMax = Math.max(1, ...gradeDistribution.map((bar) => bar.count));
  const weekTotals = weeklyFrequency.map((w) => w.climbCount);
  const weekMax = Math.max(1, ...weekTotals);
  const sparkPoints = weekTotals.map((total, i) => ({
    x: weekTotals.length > 1 ? (i / (weekTotals.length - 1)) * 100 : 50,
    y: 100 - (total / weekMax) * 90 - 5,
  }));

  return (
    <View style={styles.stack}>
      <StatGrid>
        <StatTile
          highlight
          label="Hardest send"
          value={allTimeStats.hardestGradeLabel ?? '—'}
          sub={firstReached ? `since ${formatMonthDay(firstReached)}` : undefined}
        />
        <StatTile
          label="Current streak"
          value={String(streak)}
          unit={streak === 1 ? 'day' : 'days'}
          accessory={
            <View style={styles.dots}>
              {weekCompletion.map((day, i) => (
                <View key={i} style={[styles.dot, day.done ? styles.dotDone : null]} />
              ))}
            </View>
          }
        />
        <StatTile
          label="Sends"
          value={String(sendsLogged)}
          accessory={<MiniBars values={sendsPerSession.slice(-SENDS_BARS_SHOWN)} color={colors.accent} />}
        />
        <StatTile
          label="Flash rate"
          value={String(flashRate)}
          unit="%"
          accessoryBeside
          accessory={<Ring percent={flashRate} track={colors.fill} color={colors.accent} />}
        />
      </StatGrid>

      {gradeDistribution.length > 0 ? (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Grade pyramid</Text>
            <Text style={styles.cardMeta}>
              {totalPyramidSends} send{totalPyramidSends === 1 ? '' : 's'}
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
              <View style={[styles.legendSwatch, { backgroundColor: colors.textSecondary }]} />
              <Text style={styles.legendText}>Flash</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendSwatch, styles.legendSend, { backgroundColor: colors.textSecondary }]} />
              <Text style={styles.legendText}>Send</Text>
            </View>
          </View>

          {/* Easiest first, reading down -- the order grades are climbed in. Each bar is
              flashes (solid) then the other sends (faded) in the grade's colour. */}
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
                    <View style={[styles.pyrBar, { width: `${Math.max(8, (bar.count / pyramidMax) * 100)}%` }]}>
                      {bar.flashCount > 0 ? (
                        <View style={{ flex: bar.flashCount, backgroundColor: bar.color }} />
                      ) : null}
                      {sends > 0 ? (
                        <View style={[styles.pyrSend, { flex: sends, backgroundColor: bar.color }]} />
                      ) : null}
                    </View>
                  </View>
                  <Text style={styles.pyrCount}>
                    {bar.count}
                    {bar.flashCount > 0 ? <Text style={styles.pyrFlashCount}> · {bar.flashCount}F</Text> : null}
                  </Text>
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
        </View>
      ) : null}

      <View style={styles.card}>
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

      <StatGrid columns={3}>
        <StatTile compact label="Sessions" value={String(climbSessions.length)} />
        <StatTile compact label="Best streak" value={`${longestStreakEver}d`} />
        <StatTile compact label="Most climbs" value={String(mostClimbsInSession)} />
      </StatGrid>
    </View>
  );
}

const MiniBars = ({ values, color }: { values: number[]; color: string }) => {
  const max = Math.max(1, ...values);
  return (
    <View style={miniStyles.row}>
      {values.map((value, i) => (
        <View key={i} style={[miniStyles.bar, { height: Math.max(3, (value / max) * 14), backgroundColor: color }]} />
      ))}
    </View>
  );
};

const RING_SIZE = 34;
const RING_STROKE = 5;

const Ring = ({ percent, track, color }: { percent: number; track: string; color: string }) => {
  const r = (RING_SIZE - RING_STROKE) / 2;
  const circumference = 2 * Math.PI * r;
  const c = RING_SIZE / 2;
  return (
    <Svg width={RING_SIZE} height={RING_SIZE}>
      <Circle cx={c} cy={c} r={r} stroke={track} strokeWidth={RING_STROKE} fill="none" />
      <Circle
        cx={c}
        cy={c}
        r={r}
        stroke={color}
        strokeWidth={RING_STROKE}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${(circumference * percent) / 100} ${circumference}`}
        rotation={-90}
        origin={`${c}, ${c}`}
      />
    </Svg>
  );
};

const miniStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 14 },
  bar: { width: 6, borderRadius: 2 },
});

const createStyles = (colors: ThemeColors, typography: Typography, shadows: Shadows) =>
  StyleSheet.create({
    stack: { gap: spacing.xs },
    dots: { flexDirection: 'row', gap: 4 },
    dot: { width: 9, height: 9, borderRadius: 4.5, backgroundColor: colors.fill },
    dotDone: { backgroundColor: colors.accent },

    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      ...shadows.card,
      paddingHorizontal: spacing.s,
      paddingVertical: spacing.s,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: spacing.xs,
    },
    cardTitle: { ...typography.body, ...font('semibold'), fontSize: 17 },
    cardMeta: { ...typography.meta, fontSize: 13, color: colors.textSecondary },

    // Scrolls rather than wraps: the row stays one clean line however many gyms
    // the user has climbed at.
    scopeChips: { flexDirection: 'row', gap: spacing.xxs, paddingTop: spacing.xs },
    scopeNote: {
      ...typography.bodyMuted,
      fontSize: 12,
      color: colors.textMuted,
      marginTop: spacing.xs,
      lineHeight: 16,
    },

    pyramid: { marginTop: spacing.xs, gap: 5 },
    pyrRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    pyrGrade: {
      ...typography.numeric,
      width: 46,
      fontSize: 12,
      textAlign: 'right',
      color: colors.textSecondary,
    },
    pyrTrack: { flex: 1 },
    pyrBar: { height: 14, borderRadius: 7, flexDirection: 'row', overflow: 'hidden' },
    pyrSend: { opacity: 0.42 },
    pyrCount: {
      ...typography.numeric,
      minWidth: 44,
      fontSize: 12,
      ...font('medium'),
      color: colors.textSecondary,
    },
    pyrFlashCount: { color: colors.textMuted },
    moreChip: { borderStyle: 'dashed' },
    legend: { flexDirection: 'row', gap: spacing.s, marginTop: spacing.xs },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    legendSwatch: { width: 10, height: 10, borderRadius: 3 },
    legendSend: { opacity: 0.42 },
    legendText: { ...typography.meta, fontSize: 11, color: colors.textSecondary },

    sparkWrap: { marginTop: spacing.s, height: 44, position: 'relative' },
    spark: { width: '100%', height: 44 },
    sparkDot: {
      position: 'absolute',
      width: 5,
      height: 5,
      borderRadius: 2.5,
      backgroundColor: colors.accent,
      transform: [{ translateX: -2.5 }, { translateY: -2.5 }],
    },
    sparkLbls: { flexDirection: 'row', marginTop: 6 },
    sparkLblText: {
      flex: 1,
      textAlign: 'center',
      ...font('medium'),
      fontSize: 11,
      color: colors.textMuted,
    },
  });
