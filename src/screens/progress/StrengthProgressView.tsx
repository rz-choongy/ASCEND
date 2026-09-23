import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Polyline } from 'react-native-svg';
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
import {
  BarChart,
  ChevronRightIcon,
  PressableScale,
  StatGrid,
  StatTile,
  font,
  radius,
  spacing,
  useTheme,
  type Shadows,
} from '../../ui';
import type { ThemeColors } from '../../ui/tokens/colors';
import type { Typography } from '../../ui/tokens/typography';

const STRENGTH_SESSIONS_SHOWN = 10;

type NavProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Progress'>,
  NativeStackNavigationProp<RootStackParamList>
>;

type Props = {
  /** Full history, for the "this week" figure. */
  sessions: SessionRow[];
  /** Sessions inside the All time / By month selection. */
  scopedSessions: SessionRow[];
};

export function StrengthProgressView({ sessions, scopedSessions }: Props) {
  const { colors, typography, shadows } = useTheme();
  const styles = useMemo(() => createStyles(colors, typography, shadows), [colors, typography, shadows]);
  const navigation = useNavigation<NavProp>();

  const strengthSessions = useMemo(() => scopedSessions.filter((s) => s.type === 'strength'), [scopedSessions]);
  const exercises = useMemo(() => buildExerciseList(scopedSessions), [scopedSessions]);
  const totalVolume = useMemo(() => buildAllTimeStats(scopedSessions).totalStrengthVolume, [scopedSessions]);
  const volumeTrend = useMemo(
    () => buildStrengthVolumeTrend(scopedSessions, STRENGTH_SESSIONS_SHOWN),
    [scopedSessions]
  );
  const thisWeek = useMemo(() => buildWeeklyFrequency(sessions, 1)[0]?.strengthCount ?? 0, [sessions]);
  const volume = formatVolume(totalVolume);

  if (strengthSessions.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>No strength sessions yet</Text>
        <Text style={styles.emptyCopy}>
          Log a strength session and each exercise's trend will show up here.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.stack}>
      <StatGrid>
        <StatTile
          highlight
          label="Sessions"
          value={String(strengthSessions.length)}
          sub={`${thisWeek} this week`}
        />
        <StatTile label="Total volume" value={volume.value} unit={volume.unit} />
      </StatGrid>

      <View style={styles.card}>
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
      </View>

      {volumeTrend.length > 0 ? (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Strength volume</Text>
            <Text style={styles.cardMeta}>last {STRENGTH_SESSIONS_SHOWN} sessions</Text>
          </View>
          <View style={styles.chart}>
            <BarChart
              height={80}
              valueFormatter={(value) => `${Math.round(value)}kg`}
              bars={volumeTrend.map((bar) => ({
                label: bar.label,
                segments: [{ value: bar.volume, color: colors.accent }],
              }))}
            />
          </View>
        </View>
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
  const { colors, typography, shadows } = useTheme();
  const styles = useMemo(() => createStyles(colors, typography, shadows), [colors, typography, shadows]);
  const { changePct, lastSet } = exercise;
  const changeColor =
    changePct === null || changePct === 0 ? colors.textMuted : changePct > 0 ? colors.success : colors.danger;

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
      <Sparkline values={exercise.trend} color={colors.accent} />
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

const createStyles = (colors: ThemeColors, typography: Typography, shadows: Shadows) =>
  StyleSheet.create({
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
      marginBottom: spacing.xxs,
    },
    cardTitle: { ...typography.body, ...font('semibold'), fontSize: 17 },
    cardMeta: { ...typography.meta, fontSize: 13, color: colors.textSecondary },
    chart: { marginTop: spacing.xs },

    // PressableScale centres its children; the row lays them out left to right itself.
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
      gap: spacing.xs,
      paddingVertical: spacing.s,
    },
    rowBordered: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.separator,
    },
    rowText: { flex: 1, alignSelf: 'stretch', justifyContent: 'center' },
    rowName: { ...typography.body, ...font('semibold'), fontSize: 16 },
    rowSub: {
      ...typography.meta,
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
      fontVariant: ['tabular-nums'],
    },
    rowChange: {
      ...typography.numeric,
      width: 42,
      fontSize: 13,
      textAlign: 'right',
    },

    empty: {
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      ...shadows.card,
      padding: spacing.md,
      alignItems: 'center',
      gap: spacing.xs,
    },
    emptyTitle: { ...typography.body, ...font('semibold'), textAlign: 'center' },
    emptyCopy: { ...typography.bodyMuted, textAlign: 'center', lineHeight: 20 },
  });
