import { useMemo, useState } from 'react';
import { LayoutAnimation, Pressable, StyleSheet, Text, View } from 'react-native';
import { applyClimbEvents } from '../../domain/climbLogUtils';
import {
  buildAllTimeStats,
  buildGradeDistribution,
  buildGradeDistributionAcrossGyms,
  buildTopSendsTrend,
  buildWeeklyFrequency,
  countSendsAtGrade,
  findFirstReachedDate,
  findFirstSendsOfTopGrades,
  findRecentMilestone,
  formatDayMonth,
  formatMilestone,
  getAvailableClimbGyms,
  listClimbsForPyramidRow,
  trendWeeksForPeriod,
  TOP_SENDS_AVERAGED,
  type GradeDistributionBar,
  type ProgressPeriod,
} from '../../domain/progressInsights';
import { getSessionEvents } from '../../domain/sessionStore';
import { getProgressGradeGymId, setProgressGradeGymId } from '../../domain/settingsStore';
import type { SessionRow } from '../../domain/types';
import { BarChart, Card, GradeChip, LineChart, StatRow, font, radius, spacing, useTheme } from '../../ui';
import type { LineChartMarker } from '../../ui/components/LineChart';
import type { ThemeColors } from '../../ui/tokens/colors';
import type { Typography } from '../../ui/tokens/typography';
import { GradeClimbsSheet } from './GradeClimbsSheet';
import { GymScopeSheet, type GymScopeOption } from './GymScopeSheet';

const WEEKS_SHOWN = 8;
/** First sends of this many of the user's top grades get a marker on the trend. */
const FIRST_SEND_MARKERS = 4;

/** Sentinel scope meaning "pool every gym", stored alongside real gym ids. */
const ALL_GYMS = '__all__';
/** Climbs logged before gyms were tracked have no gym id; this stands in for it as a key. */
const UNSPECIFIED = '__unspecified__';

const keyOf = (gymId: string | null) => gymId ?? UNSPECIFIED;
const gymIdOf = (key: string) => (key === UNSPECIFIED ? null : key);

const PERIOD_NOTE: Record<ProgressPeriod, string> = {
  W: 'last 7 days',
  M: 'last 30 days',
  '3M': 'last 90 days',
  Y: 'last year',
  All: 'all time',
};

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
  const [isGymSheetOpen, setIsGymSheetOpen] = useState(false);
  const [openRow, setOpenRow] = useState<GradeDistributionBar | null>(null);

  const allTimeStats = useMemo(() => buildAllTimeStats(scopedSessions), [scopedSessions]);
  const weeklyFrequency = useMemo(() => buildWeeklyFrequency(sessions, WEEKS_SHOWN), [sessions]);
  const trendWeeks = useMemo(() => trendWeeksForPeriod(period, sessions), [period, sessions]);
  const gradeTrend = useMemo(() => buildTopSendsTrend(sessions, trendWeeks), [sessions, trendWeeks]);
  const firstSends = useMemo(() => findFirstSendsOfTopGrades(sessions, FIRST_SEND_MARKERS), [sessions]);
  const milestone = useMemo(() => findRecentMilestone(sessions), [sessions]);
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

  const activeKey = isAllScope ? null : keyOf(activeScope);
  const activeGymName = isAllScope ? 'All gyms' : (gymOptions.find((g) => g.key === activeKey)?.name ?? 'All gyms');

  const gradeDistribution = useMemo(() => {
    if (availableGyms.length === 0) return [];
    return isAllScope
      ? buildGradeDistributionAcrossGyms(scopedSessions, colors.gradePalette)
      : buildGradeDistribution(scopedSessions, activeScope);
  }, [scopedSessions, activeScope, isAllScope, availableGyms.length, colors.gradePalette]);
  // Hardest at the top, the way a pyramid stands.
  const pyramidRows = useMemo(() => [...gradeDistribution].reverse(), [gradeDistribution]);

  const totalPyramidSends = useMemo(
    () => gradeDistribution.reduce((sum, bar) => sum + bar.count, 0),
    [gradeDistribution]
  );

  const openRowClimbs = useMemo(() => {
    if (!openRow) return [];
    return isAllScope
      ? listClimbsForPyramidRow(scopedSessions, { kind: 'pooled', grade: Number(openRow.label.slice(1)) })
      : listClimbsForPyramidRow(scopedSessions, { kind: 'gym', gymId: activeScope, gradeLabel: openRow.label });
  }, [openRow, isAllScope, scopedSessions, activeScope]);

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

  // The first time the grade was ever reached, not the first time inside the period.
  const firstReached = useMemo(
    () => findFirstReachedDate(sessions, allTimeStats.hardestGradeLabel),
    [sessions, allTimeStats.hardestGradeLabel]
  );

  // Tape colours come from the V-scale palette: the trend pools gyms, so one gym's hex would be arbitrary.
  const trendMarkers: LineChartMarker[] = firstSends
    .map((first) => ({
      index: gradeTrend.findIndex((point) => point.weekStart === first.weekStart),
      value: first.grade,
      color:
        colors.gradePalette.length > 0
          ? colors.gradePalette[first.grade % colors.gradePalette.length]
          : colors.chartStrong,
      label: `First V${first.grade} · ${formatDayMonth(first.at)}`,
    }))
    .filter((marker) => marker.index >= 0);

  // The grade above the latest week's usual top grade, and how often it's been sent in the period.
  const latestUsual = gradeTrend.length > 0 ? Math.round(gradeTrend[gradeTrend.length - 1].usual) : null;
  const nextGrade = latestUsual === null ? null : latestUsual + 1;
  const nextGradeSends = useMemo(
    () => (nextGrade === null ? 0 : countSendsAtGrade(scopedSessions, nextGrade)),
    [scopedSessions, nextGrade]
  );

  const pyramidMax = Math.max(1, ...gradeDistribution.map((bar) => bar.count));
  const weekPeak = Math.max(0, ...weeklyFrequency.map((w) => w.climbCount));
  const trendMeta = period === 'All' ? 'all time' : `last ${trendWeeks} weeks`;

  return (
    <View style={styles.stack}>
      {milestone ? (
        <View style={styles.milestone}>
          <View style={styles.milestoneDot} />
          <Text style={styles.milestoneText} numberOfLines={1}>
            {formatMilestone(milestone)}
          </Text>
        </View>
      ) : null}

      <StatRow
        items={[
          {
            label: 'Hardest',
            value: allTimeStats.hardestGradeLabel ?? '—',
            sub: firstReached ? `Sent ${formatDayMonth(firstReached)}` : undefined,
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

          <View style={styles.controlsRow}>
            {availableGyms.length > 1 ? (
              <Pressable
                onPress={() => setIsGymSheetOpen(true)}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel={`Gym: ${activeGymName}. Change gym`}
                style={({ pressed }) => [styles.gymPicker, pressed ? styles.gymPickerPressed : null]}
              >
                <Text style={styles.gymPickerText} numberOfLines={1}>
                  {activeGymName} ▾
                </Text>
              </Pressable>
            ) : (
              <View />
            )}
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
          </View>

          {/* Hardest first, reading down, so the pyramid stands on its base. Each bar is flashes
              in a soft accent, then the other sends in quiet grey; the total sits to the right.
              Tap a row for the climbs behind it. */}
          <View style={styles.pyramid}>
            {pyramidRows.map((bar) => {
              const sends = bar.count - bar.flashCount;
              return (
                <Pressable
                  key={bar.label}
                  onPress={() => setOpenRow(bar)}
                  style={({ pressed }) => [styles.pyrRow, pressed ? styles.pyrRowPressed : null]}
                  accessibilityRole="button"
                  accessibilityLabel={`${bar.label}: ${bar.count} climbs, ${bar.flashCount} flashed. Show climbs`}
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
                </Pressable>
              );
            })}
          </View>

          {nextGrade !== null ? (
            <Text style={styles.nextGrade} numberOfLines={1}>
              Next grade V{nextGrade}:{' '}
              {nextGradeSends === 0 ? 'no sends yet' : `${nextGradeSends} send${nextGradeSends === 1 ? '' : 's'} so far`}
            </Text>
          ) : null}

          {isAllScope ? (
            <Text style={styles.scopeNote}>Grades from {availableGyms.length} gyms, matched on the V-scale.</Text>
          ) : null}

          <GymScopeSheet
            visible={isGymSheetOpen}
            gyms={gymOptions}
            selectedKey={activeKey}
            onSelect={(key) => {
              handleSelectScope(key === null ? ALL_GYMS : gymIdOf(key));
              setIsGymSheetOpen(false);
            }}
            onClose={() => setIsGymSheetOpen(false)}
          />
          <GradeClimbsSheet
            grade={openRow ? { label: openRow.label, color: openRow.color } : null}
            climbs={openRowClimbs}
            scopeNote={isAllScope ? PERIOD_NOTE[period] : `${activeGymName} · ${PERIOD_NOTE[period]}`}
            onClose={() => setOpenRow(null)}
          />
        </Card>
      ) : null}

      {gradeTrend.length >= 2 ? (
        <Card padded="graph">
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Grade trend</Text>
            <Text style={styles.cardMeta}>{trendMeta}</Text>
          </View>
          <Text style={styles.cardSub}>Average of your {TOP_SENDS_AVERAGED} best sends each week</Text>
          <View style={styles.chart}>
            <LineChart
              points={gradeTrend.map((p) => ({ value: p.usual, label: p.weekLabel }))}
              dots={gradeTrend.map((p) => (p.hardest === p.usual ? null : p.hardest))}
              markers={trendMarkers}
              height={140}
              valueFormatter={(value) => `V${Math.round(value)}`}
            />
          </View>
          <View style={[styles.legend, styles.trendLegend]}>
            <View style={styles.legendItem}>
              <View style={styles.legendLine} />
              <Text style={styles.legendText}>Top {TOP_SENDS_AVERAGED} average</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={styles.legendRing} />
              <Text style={styles.legendText}>Hardest send</Text>
            </View>
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

    milestone: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.xxs,
    },
    milestoneDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent },
    milestoneText: { ...typography.bodyMuted, color: colors.textPrimary, flexShrink: 1 },

    cardHeader: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: spacing.xs,
    },
    cardTitle: { ...typography.title },
    cardMeta: { ...typography.meta, flexShrink: 1, textAlign: 'right' },
    cardSub: { ...typography.meta, marginTop: spacing.xxs },

    controlsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.xs,
      marginTop: spacing.xs,
    },
    gymPicker: {
      flexShrink: 1,
      minHeight: 32,
      paddingHorizontal: spacing.s,
      borderRadius: radius.pill,
      backgroundColor: colors.surfaceAlt,
      justifyContent: 'center',
    },
    gymPickerPressed: { backgroundColor: colors.fill },
    gymPickerText: { ...font('medium'), fontSize: 13, color: colors.textPrimary },
    scopeNote: {
      ...typography.meta,
      color: colors.textMuted,
      marginTop: spacing.xxs,
      lineHeight: 18,
    },
    nextGrade: { ...typography.meta, marginTop: spacing.s },

    pyramid: { marginTop: spacing.s, gap: 2 },
    pyrRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 3, borderRadius: radius.sm },
    pyrRowPressed: { backgroundColor: colors.fillSoft },
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
    // Soft accent for flashes, quiet grey for sends: both read on the dark and the white card
    // without a bright block pulling the eye off the grade labels.
    pyrFlash: { backgroundColor: colors.textSecondary },
    pyrSend: { backgroundColor: colors.chartQuiet },
    pyrCount: {
      ...font('semibold'),
      fontSize: 14,
      color: colors.textPrimary,
      minWidth: 22,
      textAlign: 'right',
      fontVariant: ['tabular-nums'],
    },
    legend: { flexDirection: 'row', gap: spacing.s },
    trendLegend: { marginTop: spacing.xs },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendLine: { width: 12, height: 2, borderRadius: 1, backgroundColor: colors.chartStrong },
    legendRing: { width: 8, height: 8, borderRadius: 4, borderWidth: 1.5, borderColor: colors.textMuted },
    legendText: { ...typography.meta },

    chart: { marginTop: spacing.s },
  });
