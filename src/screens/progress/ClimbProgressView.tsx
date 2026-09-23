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
import { getProgressGradeGymId, setProgressGradeGymId } from '../../domain/settingsStore';
import { formatMonthDay } from '../../domain/strengthProgress';
import type { SessionRow } from '../../domain/types';
import { Chip, StatGrid, StatTile, font, radius, spacing, useTheme, type Shadows } from '../../ui';
import type { ThemeColors } from '../../ui/tokens/colors';
import type { Typography } from '../../ui/tokens/typography';

const WEEKS_SHOWN = 8;
const SENDS_BARS_SHOWN = 6;

/** Sentinel scope meaning "pool every gym", stored alongside real gym ids. */
const ALL_GYMS = '__all__';

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
                        { width: `${Math.max(8, (bar.count / pyramidMax) * 100)}%`, backgroundColor: bar.color },
                      ]}
                    />
                  </View>
                  <Text style={styles.pyrCount}>{bar.count}</Text>
                </View>
              ))}
          </View>
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
          <Text style={styles.cardMeta}>last {WEEKS_SHOWN} weeks</Text>
        </View>
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
    pyrBar: { height: 14, borderRadius: 7 },
    pyrCount: {
      ...typography.numeric,
      width: 20,
      fontSize: 12,
      ...font('medium'),
      color: colors.textMuted,
    },

    sparkWrap: { marginTop: spacing.s, height: 44, position: 'relative' },
    sparkPeakLbl: {
      position: 'absolute',
      right: 0,
      top: -14,
      ...typography.numeric,
      fontSize: 12,
      ...font('medium'),
      color: colors.textSecondary,
    },
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
