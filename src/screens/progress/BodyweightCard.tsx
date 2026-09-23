import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getBodyweightLogs } from '../../domain/bodyweightStore';
import { formatDaysAgo, formatWeight } from '../../domain/strengthProgress';
import type { BodyweightLogRow } from '../../domain/types';
import { LineChart, font, radius, spacing, useTheme, type Shadows } from '../../ui';
import type { ThemeColors } from '../../ui/tokens/colors';
import type { Typography } from '../../ui/tokens/typography';

const TREND_ENTRIES_SHOWN = 30;

export function BodyweightCard() {
  const { colors, typography, shadows } = useTheme();
  const styles = useMemo(() => createStyles(colors, typography, shadows), [colors, typography, shadows]);
  const [logs, setLogs] = useState<BodyweightLogRow[]>([]);

  useFocusEffect(
    useCallback(() => {
      setLogs(getBodyweightLogs(TREND_ENTRIES_SHOWN));
    }, [])
  );

  if (logs.length === 0) return null;

  const latest = logs[0];
  const oldest = logs[logs.length - 1];
  const deltaKg = formatWeight(latest.weight_kg - oldest.weight_kg);
  const points = logs
    .slice()
    .reverse()
    .map((log) => ({ value: log.weight_kg, label: formatDaysAgo(log.logged_at) }));

  return (
    <View style={styles.card}>
      {/* One row: the number that matters, with the trend as a glance, not a chart to read. */}
      <View style={styles.text}>
        <Text style={styles.label}>Bodyweight</Text>
        <Text style={styles.latestValue}>
          {formatWeight(latest.weight_kg)}
          <Text style={styles.latestUnit}> kg</Text>
        </Text>
        <Text style={styles.latestMeta} numberOfLines={1}>
          {formatDaysAgo(latest.logged_at)}
          {logs.length > 1 ? ` · ${deltaKg.startsWith('-') ? '' : '+'}${deltaKg} kg over ${logs.length} logs` : ''}
        </Text>
      </View>
      {logs.length > 1 ? (
        <View style={styles.chart}>
          <LineChart points={points} height={44} compact />
        </View>
      ) : null}
    </View>
  );
}

const createStyles = (colors: ThemeColors, typography: Typography, shadows: Shadows) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      ...shadows.card,
      paddingHorizontal: spacing.s,
      paddingVertical: spacing.s,
      marginBottom: spacing.xs,
    },
    text: {
      flex: 1,
      gap: 1,
    },
    label: {
      ...typography.section,
    },
    latestValue: {
      ...typography.numeric,
      fontSize: 22,
    },
    latestUnit: {
      ...font('medium'),
      fontSize: 13,
      color: colors.textSecondary,
    },
    latestMeta: {
      ...font('regular'),
      fontSize: 12,
      color: colors.textSecondary,
      fontVariant: ['tabular-nums'],
    },
    chart: {
      width: 120,
    },
  });
