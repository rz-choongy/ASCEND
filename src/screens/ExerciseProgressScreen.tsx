import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import {
  buildExerciseDetail,
  formatMonthDay,
  formatVolume,
  formatWeight,
  sliceSeriesToRange,
  type ExerciseDetail,
  type ExerciseSession,
  type StrengthMetric,
} from '../domain/strengthProgress';
import { getCompletedSessions } from '../domain/sessionStore';
import type { RootStackScreenProps } from '../navigation/types';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  LineChart,
  PressableScale,
  SegmentedControl,
  StatGrid,
  StatTile,
  font,
  radius,
  spacing,
  useTheme,
  type Shadows,
} from '../ui';
import type { ThemeColors } from '../ui/tokens/colors';
import type { Typography } from '../ui/tokens/typography';

type Range = '3M' | '6M' | '1Y' | 'All';
const RANGE_MONTHS: Record<Range, number | null> = { '3M': 3, '6M': 6, '1Y': 12, All: null };

const METRIC_TITLE: Record<StrengthMetric, string> = {
  e1rm: 'Est. 1RM',
  topWeight: 'Top weight',
  volume: 'Volume',
};

const SESSIONS_COLLAPSED = 8;

const formatSignedWeight = (delta: number): string =>
  `${delta > 0 ? '+' : '−'}${formatWeight(Math.abs(delta))} kg`;

const formatSignedVolume = (delta: number): string => {
  const { value, unit } = formatVolume(Math.abs(delta));
  return `${delta > 0 ? '+' : '−'}${value} ${unit}`;
};

/** "+2.5 kg vs last", or a plain note when there's nothing to compare against. */
const deltaSub = (delta: number | null, format: (d: number) => string) => {
  if (delta === null) return { text: 'First session', tone: 'muted' as const };
  if (Math.abs(delta) < 0.05) return { text: 'Same as last', tone: 'muted' as const };
  return { text: `${format(delta)} vs last`, tone: delta > 0 ? ('positive' as const) : ('negative' as const) };
};

export function ExerciseProgressScreen({ navigation, route }: RootStackScreenProps<'ExerciseProgress'>) {
  const { exerciseKey, exerciseName } = route.params;
  const { colors, typography, shadows } = useTheme();
  const styles = useMemo(() => createStyles(colors, typography, shadows), [colors, typography, shadows]);

  const [detail, setDetail] = useState<ExerciseDetail | null>(null);
  const [metric, setMetric] = useState<StrengthMetric>('e1rm');
  const [range, setRange] = useState<Range>('6M');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [showAll, setShowAll] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setDetail(buildExerciseDetail(getCompletedSessions('strength'), exerciseKey));
    }, [exerciseKey])
  );

  const chartPoints = useMemo(() => {
    if (!detail) return [];
    return sliceSeriesToRange(detail.series[metric], RANGE_MONTHS[range]).map((point) => ({
      value: point.value,
      label: formatMonthDay(point.t),
    }));
  }, [detail, metric, range]);

  const formatAxis = (value: number): string => {
    if (metric !== 'volume') return formatWeight(value);
    const { value: v, unit } = formatVolume(value);
    return `${v}${unit}`;
  };

  const toggleExpanded = (sessionId: string) =>
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(sessionId)) next.delete(sessionId);
      else next.add(sessionId);
      return next;
    });

  const header = (
    <View style={styles.header}>
      <Pressable
        onPress={() => navigation.goBack()}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="Back to strength progress"
        style={styles.back}
      >
        <ChevronLeftIcon size={18} color={colors.accent} strokeWidth={2.4} />
        <Text style={styles.backText}>Strength</Text>
      </Pressable>
      <Text style={styles.title} numberOfLines={2}>
        {detail?.name ?? exerciseName}
      </Text>
    </View>
  );

  if (!detail) {
    return (
      <SafeAreaView edges={['top']} style={styles.root}>
        <View style={styles.content}>
          {header}
          <View style={styles.card}>
            <Text style={styles.emptyText}>No sets logged for this exercise yet.</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const { tiles } = detail;
  const e1rmSub = deltaSub(tiles.e1rm.delta, formatSignedWeight);
  const topSub = deltaSub(tiles.topWeight.delta, formatSignedWeight);
  const volumeSub = deltaSub(tiles.volume.delta, formatSignedVolume);
  const lastVolume = formatVolume(tiles.volume.value);
  const visibleSessions = showAll ? detail.sessions : detail.sessions.slice(0, SESSIONS_COLLAPSED);

  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        {header}

        <View style={styles.stack}>
          <StatGrid>
            <StatTile
              label="Est. 1RM"
              value={formatWeight(tiles.e1rm.value)}
              unit="kg"
              sub={e1rmSub.text}
              subTone={e1rmSub.tone}
              highlight={metric === 'e1rm'}
              onPress={() => setMetric('e1rm')}
            />
            <StatTile
              label="Top weight"
              value={formatWeight(tiles.topWeight.value)}
              unit="kg"
              sub={topSub.text}
              subTone={topSub.tone}
              highlight={metric === 'topWeight'}
              onPress={() => setMetric('topWeight')}
            />
            <StatTile
              label="Volume"
              value={lastVolume.value}
              unit={lastVolume.unit}
              sub={volumeSub.text}
              subTone={volumeSub.tone}
              highlight={metric === 'volume'}
              onPress={() => setMetric('volume')}
            />
            <StatTile
              label="Sessions"
              value={String(detail.sessionCount)}
              sub={`${detail.sessionsThisMonth} this month`}
            />
          </StatGrid>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{METRIC_TITLE[metric]}</Text>
              <Text style={styles.cardMeta}>{metric === 'volume' ? 'per session' : 'kg'}</Text>
            </View>
            <View style={styles.chart}>
              {chartPoints.length > 0 ? (
                <LineChart points={chartPoints} height={120} valueFormatter={formatAxis} />
              ) : (
                <Text style={styles.emptyText}>No sessions in this range.</Text>
              )}
            </View>
            <View style={styles.range}>
              <SegmentedControl
                options={(Object.keys(RANGE_MONTHS) as Range[]).map((value) => ({ value, label: value }))}
                value={range}
                onChange={setRange}
              />
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Sessions</Text>
              <Text style={styles.cardMeta}>tap to expand</Text>
            </View>
            {visibleSessions.map((session, index) => (
              <SessionRow
                key={session.sessionId}
                session={session}
                isRecord={detail.recordSessionIds.has(session.sessionId)}
                expanded={expandedIds.has(session.sessionId)}
                bordered={index > 0}
                onToggle={() => toggleExpanded(session.sessionId)}
              />
            ))}
            {detail.sessions.length > SESSIONS_COLLAPSED ? (
              <Pressable onPress={() => setShowAll((v) => !v)} style={styles.showAll} accessibilityRole="button">
                <Text style={styles.showAllText}>
                  {showAll ? 'Show fewer' : `Show all ${detail.sessions.length} sessions`}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

type SessionRowProps = {
  session: ExerciseSession;
  isRecord: boolean;
  expanded: boolean;
  bordered: boolean;
  onToggle: () => void;
};

const SessionRow = ({ session, isRecord, expanded, bordered, onToggle }: SessionRowProps) => {
  const { colors, typography, shadows } = useTheme();
  const styles = useMemo(() => createStyles(colors, typography, shadows), [colors, typography, shadows]);
  const { topSet, sets } = session;

  return (
    <View style={bordered ? styles.sessionBordered : null}>
      <PressableScale onPress={onToggle} scaleTo={0.985} style={styles.sessionHead}>
        <View style={styles.sessionDateCol}>
          <Text style={styles.sessionDate}>{formatMonthDay(session.startedAt)}</Text>
          {isRecord ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>PR</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.sessionSummary} numberOfLines={1}>
          <Text style={styles.sessionTop}>
            {topSet.weight === 0 ? 'BW' : `${formatWeight(topSet.weight)} kg`} × {topSet.reps}
          </Text>
          {`  ${sets.length} set${sets.length === 1 ? '' : 's'}`}
        </Text>
        <View style={expanded ? styles.chevronOpen : null}>
          <ChevronRightIcon size={14} color={colors.textMuted} strokeWidth={2.4} />
        </View>
      </PressableScale>

      {expanded ? (
        <View style={styles.setList}>
          {sets.map((set, i) => (
            <View key={set.eventId} style={styles.setRow}>
              <Text style={styles.setIndex}>Set {i + 1}</Text>
              <Text style={styles.setValue}>
                {set.weight === 0 ? 'BW' : `${formatWeight(set.weight)} kg`} × {set.reps}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
};

const createStyles = (colors: ThemeColors, typography: Typography, shadows: Shadows) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    content: {
      paddingHorizontal: spacing.sm,
      paddingTop: spacing.xs,
      paddingBottom: spacing.lg,
    },
    header: { marginBottom: spacing.sm },
    back: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      marginLeft: -4,
      paddingVertical: spacing.xxs,
    },
    backText: { ...font('regular'), fontSize: 17, color: colors.accent, letterSpacing: -0.4 },
    title: {
      ...typography.display,
      fontSize: 30,
      letterSpacing: -0.6,
      marginTop: 2,
    },

    stack: { gap: spacing.xs },
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
    chart: { marginTop: spacing.s },
    range: { marginTop: spacing.s },
    emptyText: { ...typography.bodyMuted, textAlign: 'center', paddingVertical: spacing.sm },

    sessionBordered: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.separator,
    },
    // PressableScale centres its children; the header lays them out left to right itself.
    sessionHead: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
      gap: spacing.xs,
      paddingVertical: spacing.s,
    },
    sessionDateCol: {
      width: 74,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    sessionDate: { ...typography.body, fontSize: 15, fontVariant: ['tabular-nums'] },
    badge: {
      backgroundColor: colors.accentMuted,
      borderRadius: radius.pill,
      paddingHorizontal: 6,
      paddingVertical: 1,
    },
    badgeText: { ...font('bold'), fontSize: 11, color: colors.accent },
    sessionSummary: {
      flex: 1,
      ...typography.meta,
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'right',
      fontVariant: ['tabular-nums'],
    },
    sessionTop: { ...font('semibold'), color: colors.textPrimary },
    chevronOpen: { transform: [{ rotate: '90deg' }] },
    setList: { paddingBottom: spacing.s, gap: 6 },
    setRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingLeft: spacing.xs,
    },
    setIndex: { ...typography.meta, fontSize: 14, color: colors.textSecondary },
    setValue: { ...typography.numeric, ...font('medium'), fontSize: 14 },

    showAll: { alignItems: 'center', paddingTop: spacing.s },
    showAllText: { ...font('medium'), fontSize: 15, color: colors.accent },
  });
