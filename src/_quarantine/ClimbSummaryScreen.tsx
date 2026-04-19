import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { getSessionById, getSessionEvents, setSessionNotes, setSessionStatus } from '../domain/sessionStore';
import type { SessionRow } from '../domain/types';
import { applyClimbEvents } from '../domain/climbLogUtils';
import { Button, Card, Divider, ListRow, MetricCard, colors, radius, spacing, typography } from '../ui';

type ClimbSummaryProps = {
  sessionId: string;
  onDone: () => void;
};

const formatDuration = (session: SessionRow): string => {
  const end = session.completed_at ?? Date.now();
  const totalSeconds = Math.max(0, Math.floor((end - session.started_at) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
};

const formatDate = (ms: number): string => {
  return new Date(ms).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const ClimbSummaryScreen = ({ sessionId, onDone }: ClimbSummaryProps) => {
  const session = getSessionById(sessionId);
  const events = useMemo(() => getSessionEvents(sessionId), [sessionId]);
  const climbs = useMemo(() => applyClimbEvents(events), [events]);
  const [notes, setNotes] = useState(session?.notes ?? '');

  if (!session) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>Session not found.</Text>
      </View>
    );
  }

  const totalSends = climbs.filter((climb) => climb.result === 'SEND' || climb.result === 'FLASH').length;
  const topGrade = climbs.length
    ? Math.max(...climbs.map((climb) => (climb.gradeMin + climb.gradeMax) / 2))
    : 0;

  const gradeCounts = climbs.reduce<Record<string, number>>((acc, climb) => {
    acc[climb.gradeLabel] = (acc[climb.gradeLabel] ?? 0) + 1;
    return acc;
  }, {});
  const gradeLabels = Object.keys(gradeCounts).sort((a, b) => {
    const numA = Number(a.replace(/\D/g, '')) || 0;
    const numB = Number(b.replace(/\D/g, '')) || 0;
    return numA - numB;
  });
  const maxCount = Math.max(1, ...Object.values(gradeCounts));
  const chartHeight = 120;

  const handleConfirm = () => {
    setSessionNotes(sessionId, notes);
    setSessionStatus(sessionId, 'completed');
    onDone();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Session Review</Text>
          <Text style={styles.subtitle}>
            {formatDate(session.started_at)} - {formatDuration(session)}
          </Text>
        </View>
      </View>

      <View style={styles.metricsRow}>
        <MetricCard label="Total Sends" value={`${totalSends}`} accentColor={colors.success} />
        <MetricCard label="Top Grade" value={`V${topGrade.toFixed(0)}`} accentColor={colors.accent} />
      </View>

      <Text style={styles.sectionLabel}>Sends Distribution</Text>
      <Card style={styles.chartCard}>
        <View style={styles.chartBars}>
          {gradeLabels.length === 0 ? (
            <Text style={styles.emptyText}>No climbs logged yet.</Text>
          ) : (
            gradeLabels.map((label, index) => (
              <View key={label} style={styles.chartColumn}>
                <View
                  style={[
                    styles.chartBar,
                    {
                      height: Math.max(8, (gradeCounts[label] / maxCount) * chartHeight),
                      backgroundColor: colors.gradePalette[index % colors.gradePalette.length],
                    },
                  ]}
                />
                <Text style={styles.chartLabel}>{label}</Text>
              </View>
            ))
          )}
        </View>
      </Card>

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionLabel}>Route Log</Text>
        <Text style={styles.sectionMeta}>{climbs.length} Tops</Text>
      </View>
      <Divider style={styles.divider} />
      {climbs.length === 0 ? <Text style={styles.emptyText}>No routes logged.</Text> : null}
      {climbs.map((climb, index) => (
        <ListRow
          key={`${climb.gradeLabel}-${index}`}
          title={`${climb.gradeLabel} - ${climb.result === 'FLASH' ? 'Flash' : 'Send'}`}
          subtitle="Bouldering"
          right={
            <View
              style={[
                styles.badge,
                climb.result === 'FLASH' ? styles.badgeFlash : styles.badgeSend,
              ]}
            >
              <Text style={styles.badgeText}>{climb.result === 'FLASH' ? 'Flash' : 'Send'}</Text>
            </View>
          }
        />
      ))}

      <Text style={styles.sectionLabel}>Session Notes</Text>
      <TextInput
        style={styles.notesInput}
        value={notes}
        onChangeText={setNotes}
        placeholder="Write notes for this session"
        placeholderTextColor={colors.textMuted}
        multiline
      />

      <Button label="Edit Session" onPress={handleConfirm} style={styles.confirmButton} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.sm,
    paddingBottom: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  title: {
    ...typography.title,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  sectionLabel: {
    ...typography.section,
    marginBottom: spacing.xs,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  sectionMeta: {
    color: colors.textMuted,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  chartCard: {
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  chartBars: {
    height: 140,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  chartColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
  },
  chartBar: {
    width: '100%',
    borderRadius: radius.sm,
  },
  chartLabel: {
    color: colors.textMuted,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  divider: {
    marginVertical: spacing.xs,
  },
  badge: {
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 60,
    alignItems: 'center',
  },
  badgeSend: {
    backgroundColor: colors.success,
  },
  badgeFlash: {
    backgroundColor: colors.warning,
  },
  badgeText: {
    color: colors.textInverse,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    minHeight: 120,
    textAlignVertical: 'top',
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },
  confirmButton: {
    width: '100%',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 12,
  },
});
