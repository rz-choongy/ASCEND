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
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Bodyweight</Text>
        <Text style={styles.cardMeta}>last {logs.length} logged</Text>
      </View>
      <View style={styles.latestRow}>
        <Text style={styles.latestValue}>
          {formatWeight(latest.weight_kg)} <Text style={styles.latestUnit}>kg</Text>
        </Text>
        <Text style={styles.latestMeta}>
          {formatDaysAgo(latest.logged_at)}
          {logs.length > 1 ? ` · ${deltaKg.startsWith('-') ? '' : '+'}${deltaKg} kg` : ''}
        </Text>
      </View>
      {logs.length > 1 ? (
        <View style={styles.chart}>
          <LineChart points={points} height={70} valueFormatter={(value) => `${formatWeight(value)} kg`} />
        </View>
      ) : null}
    </View>
  );
}

const createStyles = (colors: ThemeColors, typography: Typography, shadows: Shadows) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      ...shadows.card,
      paddingHorizontal: spacing.s,
      paddingVertical: spacing.s,
      marginBottom: spacing.xs,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: spacing.xs,
    },
    cardTitle: { ...typography.body, ...font('semibold'), fontSize: 17 },
    cardMeta: { ...typography.meta, fontSize: 13, color: colors.textSecondary },
    latestRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      marginTop: spacing.xxs,
    },
    latestValue: {
      ...typography.display,
      fontSize: 26,
      letterSpacing: -0.5,
    },
    latestUnit: {
      ...typography.body,
      fontSize: 15,
      color: colors.textSecondary,
    },
    latestMeta: {
      ...typography.bodyMuted,
      fontSize: 13,
    },
    chart: {
      marginTop: spacing.xs,
    },
  });
