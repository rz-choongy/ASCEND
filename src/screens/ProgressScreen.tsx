import { useCallback, useMemo, useState } from 'react';
import { LayoutAnimation, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { filterSessionsToPeriod, type ProgressPeriod } from '../domain/progressInsights';
import { getCompletedSessions } from '../domain/sessionStore';
import type { SessionRow } from '../domain/types';
import { Card, SegmentedControl, font, spacing, useTheme } from '../ui';
import type { ThemeColors } from '../ui/tokens/colors';
import type { Typography } from '../ui/tokens/typography';
import { useTabBarClearance } from '../navigation/tabBar';
import { BodyweightCard } from './progress/BodyweightCard';
import { ClimbProgressView } from './progress/ClimbProgressView';
import { StrengthProgressView } from './progress/StrengthProgressView';

const PERIOD_OPTIONS: { value: ProgressPeriod; label: string }[] = [
  { value: 'W', label: 'W' },
  { value: 'M', label: 'M' },
  { value: '3M', label: '3M' },
  { value: 'Y', label: 'Y' },
  { value: 'All', label: 'All' },
];

const PERIOD_EMPTY_COPY: Record<ProgressPeriod, string> = {
  W: 'No sessions in the last 7 days.',
  M: 'No sessions in the last 30 days.',
  '3M': 'No sessions in the last 90 days.',
  Y: 'No sessions in the last year.',
  All: 'No sessions yet.',
};

type ProgressMode = 'climbing' | 'strength';

export function ProgressScreen() {
  const { colors, typography } = useTheme();
  const styles = useMemo(() => createStyles(colors, typography), [colors, typography]);
  const tabBarClearance = useTabBarClearance();
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [mode, setMode] = useState<ProgressMode>('climbing');
  const [period, setPeriod] = useState<ProgressPeriod>('All');

  const handleChangePeriod = (next: ProgressPeriod) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setPeriod(next);
  };

  useFocusEffect(
    useCallback(() => {
      setSessions(getCompletedSessions());
    }, [])
  );

  // Stats, the pyramid and the graphs scope to the chosen window; the weekly
  // frequency chart is always the last 8 weeks.
  const scopedSessions = useMemo(() => filterSessionsToPeriod(sessions, period), [sessions, period]);

  if (sessions.length === 0) {
    return (
      <SafeAreaView edges={['top']} style={[styles.root, styles.content]}>
        <Text style={styles.screenTitle}>Progress</Text>
        <Card padded="graph" style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>Log a session to see your progress</Text>
          <Text style={styles.emptyStateCopy}>
            Charts and stats will show up here once you've finished a climbing or strength
            session.
          </Text>
        </Card>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: tabBarClearance }]}
      >
        <Text style={styles.screenTitle}>Progress</Text>

        <View style={styles.segmentedPrimary}>
          <SegmentedControl
            options={[
              { value: 'climbing', label: 'Climbing' },
              { value: 'strength', label: 'Strength' },
            ]}
            value={mode}
            onChange={setMode}
          />
        </View>
        <View style={styles.segmentedSecondary}>
          <SegmentedControl compact options={PERIOD_OPTIONS} value={period} onChange={handleChangePeriod} />
        </View>

        {scopedSessions.length === 0 ? (
          <Card padded="compact" style={styles.emptyPeriod}>
            <Text style={styles.emptyPeriodText}>{PERIOD_EMPTY_COPY[period]}</Text>
          </Card>
        ) : null}

        {mode === 'climbing' ? (
          <ClimbProgressView sessions={sessions} scopedSessions={scopedSessions} period={period} />
        ) : (
          <StrengthProgressView sessions={sessions} scopedSessions={scopedSessions} />
        )}

        {/* Bodyweight sits under either tab's content: it belongs to neither, and stays one tap away. */}
        <View style={styles.bodyweight}>
          <BodyweightCard />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scroll: {
      flex: 1,
    },
    content: {
      paddingHorizontal: spacing.sm,
      paddingTop: spacing.md,
      paddingBottom: spacing.lg,
    },
    screenTitle: {
      ...typography.display,
      marginBottom: spacing.s,
    },

    segmentedPrimary: {
      marginBottom: spacing.xs,
    },
    segmentedSecondary: {
      alignItems: 'center',
      marginBottom: spacing.xs,
    },

    emptyPeriod: {
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    emptyPeriodText: {
      ...typography.bodyMuted,
    },
    bodyweight: {
      marginTop: spacing.xs,
    },

    emptyState: {
      alignItems: 'center',
      gap: spacing.xs,
      marginTop: spacing.md,
    },
    emptyStateTitle: {
      ...typography.body,
      ...font('semibold'),
      textAlign: 'center',
    },
    emptyStateCopy: {
      ...typography.bodyMuted,
      textAlign: 'center',
      lineHeight: 20,
    },
  });
