import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Polyline } from 'react-native-svg';
import { getExerciseNames } from '../../domain/exerciseStore';
import { buildAllTimeStats, buildStrengthVolumeTrend, buildWeeklyFrequency } from '../../domain/progressInsights';
import {
  buildExerciseList,
  formatDaysAgo,
  formatVolume,
  formatWeight,
  type ExerciseSummary,
} from '../../domain/strengthProgress';
import type { SessionRow } from '../../domain/types';
import type { RootStackParamList, TabParamList } from '../../navigation/types';
import { BarChart, Card, ChevronRightIcon, PressableScale, StatRow, font, spacing, useTheme } from '../../ui';
import type { ThemeColors } from '../../ui/tokens/colors';
import type { Typography } from '../../ui/tokens/typography';

/** Six bars leave each one room for a full "3,960 kg" label. */
const STRENGTH_SESSIONS_SHOWN = 6;

/** Whole kilograms with thousands separators: 3960 -> "3,960 kg". */
const formatKg = (value: number): string =>
  `${String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} kg`;

type NavProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Progress'>,
  NativeStackNavigationProp<RootStackParamList>
>;

type Props = {
  /** Full history, for the "this week" figure. */
  sessions: SessionRow[];
  /** Sessions inside the selected period (W / M / 3M / Y / All). */
  scopedSessions: SessionRow[];
};

export function StrengthProgressView({ sessions, scopedSessions }: Props) {
  const { colors, typography } = useTheme();
  const styles = useMemo(() => createStyles(colors, typography), [colors, typography]);
  const navigation = useNavigation<NavProp>();

  const strengthSessions = useMemo(() => scopedSessions.filter((s) => s.type === 'strength'), [scopedSessions]);
  const exercises = useMemo(() => buildExerciseList(scopedSessions, getExerciseNames()), [scopedSessions]);
  const totalVolume = useMemo(() => buildAllTimeStats(scopedSessions).totalStrengthVolume, [scopedSessions]);
  const volumeTrend = useMemo(
    () => buildStrengthVolumeTrend(scopedSessions, STRENGTH_SESSIONS_SHOWN),
    [scopedSessions]
  );
  const thisWeek = useMemo(() => buildWeeklyFrequency(sessions, 1)[0]?.strengthCount ?? 0, [sessions]);
  const volume = formatVolume(totalVolume);

  if (strengthSessions.length === 0) {
    return (
      <Card padded="graph" style={styles.empty}>
        <Text style={styles.emptyTitle}>No strength sessions yet</Text>
        <Text style={styles.emptyCopy}>
          Log a strength session and each exercise's trend will show up here.
        </Text>
      </Card>
    );
  }

  return (
    <View style={styles.stack}>
      <StatRow
        items={[
          { label: 'Sessions', value: String(strengthSessions.length), sub: `${thisWeek} this week` },
          { label: 'Total volume', value: `${volume.value} ${volume.unit}`, sub: 'all sets' },
        ]}
      />

      <Card padded="compact">
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Exercises</Text>
          <Text style={styles.cardMeta}>most recent first</Text>
        </View>
        {exercises.map((exercise, index) => (
          <ExerciseRow
            key={exercise.key}
            exercise={exercise}
            bordered={index > 0}
            onPress={() =>
              navigation.navigate('ExerciseProgress', { exerciseKey: exercise.key, exerciseName: exercise.name })
            }
          />
        ))}
      </Card>

      {volumeTrend.length > 0 ? (
        <Card padded="graph">
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Strength volume</Text>
            <Text style={styles.cardMeta}>last {STRENGTH_SESSIONS_SHOWN} sessions</Text>
          </View>
          <View style={styles.chart}>
            <BarChart
              height={110}
              valueFormatter={formatKg}
              bars={volumeTrend.map((bar, i) => ({
                label: bar.label,
                // Ink bars; only the latest session takes the accent.
                segments: [
                  { value: bar.volume, color: i === volumeTrend.length - 1 ? colors.accent : colors.chartStrong },
                ],
              }))}
            />
          </View>
        </Card>
      ) : null}
    </View>
  );
}

type ExerciseRowProps = {
  exercise: ExerciseSummary;
  bordered: boolean;
  onPress: () => void;
};

const ExerciseRow = ({ exercise, bordered, onPress }: ExerciseRowProps) => {
  const { colors, typography } = useTheme();
  const styles = useMemo(() => createStyles(colors, typography), [colors, typography]);
  const { changePct, lastSet } = exercise;
  const changeColor =
    changePct === null || changePct === 0 ? colors.textMuted : changePct > 0 ? colors.accentInk : colors.danger;

  return (
    <PressableScale onPress={onPress} scaleTo={0.985} style={[styles.row, bordered ? styles.rowBordered : null]}>
      <View style={styles.rowText}>
        <Text style={styles.rowName} numberOfLines={1}>
          {exercise.name}
        </Text>
        <Text style={styles.rowSub} numberOfLines={1}>
          {lastSet.weight === 0 ? 'BW' : `${formatWeight(lastSet.weight)} kg`} × {lastSet.reps} · {formatDaysAgo(exercise.lastAt)}
        </Text>
      </View>
      <Sparkline values={exercise.trend} color={colors.chartStrong} />
      <Text style={[styles.rowChange, { color: changeColor }]}>
        {changePct === null ? '—' : `${changePct > 0 ? '+' : ''}${changePct}%`}
      </Text>
      <ChevronRightIcon size={14} color={colors.textMuted} strokeWidth={2.4} />
    </PressableScale>
  );
};

const SPARK_WIDTH = 44;
const SPARK_HEIGHT = 20;

const Sparkline = ({ values, color }: { values: number[]; color: string }) => {
  if (values.length < 2) return <View style={{ width: SPARK_WIDTH, height: SPARK_HEIGHT }} />;
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const span = hi - lo || 1;
  const points = values
    .map((v, i) => `${(i / (values.length - 1)) * 100},${100 - ((v - lo) / span) * 84 - 8}`)
    .join(' ');
  return (
    <Svg width={SPARK_WIDTH} height={SPARK_HEIGHT} viewBox="0 0 100 100" preserveAspectRatio="none">
      <Polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </Svg>
  );
};

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
    stack: { gap: spacing.xs },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: spacing.xs,
      marginBottom: spacing.xxs,
    },
    cardTitle: { ...typography.title },
    cardMeta: { ...typography.meta, flexShrink: 1, textAlign: 'right' },
    chart: { marginTop: spacing.s },

    // PressableScale centres its children; the row lays them out left to right itself.
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
      gap: spacing.xs,
      paddingVertical: 10,
    },
    rowBordered: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.separator,
    },
    rowText: { flex: 1, alignSelf: 'stretch', justifyContent: 'center' },
    rowName: { ...typography.body, ...font('semibold') },
    rowSub: {
      ...typography.meta,
      marginTop: 2,
      fontVariant: ['tabular-nums'],
    },
    rowChange: {
      ...font('bold'),
      width: 48,
      fontSize: 14,
      textAlign: 'right',
      fontVariant: ['tabular-nums'],
    },

    empty: { alignItems: 'center', gap: spacing.xs },
    emptyTitle: { ...typography.body, ...font('semibold'), textAlign: 'center' },
    emptyCopy: { ...typography.bodyMuted, textAlign: 'center', lineHeight: 20 },
  });
