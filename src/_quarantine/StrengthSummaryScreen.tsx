import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { getSessionById, getSessionEvents, setSessionNotes, setSessionStatus } from '../domain/sessionStore';
import type { SessionRow } from '../domain/types';
import { Button, Divider, ListRow, MetricCard, colors, radius, spacing, typography } from '../ui';

type StrengthSet = {
  exerciseName: string;
  kind: 'reps' | 'time';
  reps?: number;
  weight?: number;
  seconds?: number;
};

type StrengthSummaryProps = {
  sessionId: string;
  onDone: () => void;
};

const parseSets = (events: { type: string; payload: unknown }[]): StrengthSet[] => {
  const sets: StrengthSet[] = [];
  events.forEach((event) => {
    if (event.type === 'SET_LOGGED') {
      sets.push(event.payload as StrengthSet);
    }
    if (event.type === 'SET_UNDONE') {
      sets.pop();
    }
  });
  return sets;
};

const formatDuration = (session: SessionRow): string => {
  const end = session.completed_at ?? Date.now();
  const totalSeconds = Math.max(0, Math.floor((end - session.started_at) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
};

export const StrengthSummaryScreen = ({ sessionId, onDone }: StrengthSummaryProps) => {
  const session = getSessionById(sessionId);
  const events = useMemo(() => getSessionEvents(sessionId), [sessionId]);
  const sets = useMemo(() => parseSets(events), [events]);
  const [notes, setNotes] = useState(session?.notes ?? '');

  if (!session) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>Session not found.</Text>
      </View>
    );
  }

  const totalVolume = sets.reduce((sum, set) => sum + (set.reps ?? 0) * (set.weight ?? 0), 0);
  const bestWeight = Math.max(0, ...sets.map((set) => set.weight ?? 0));

  const handleConfirm = () => {
    setSessionNotes(sessionId, notes);
    setSessionStatus(sessionId, 'completed');
    onDone();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Strength Review</Text>
          <Text style={styles.subtitle}>Duration {formatDuration(session)}</Text>
        </View>
      </View>

      <View style={styles.metricsRow}>
        <MetricCard label="Volume" value={`${totalVolume.toFixed(0)} kg`} accentColor={colors.accent} />
        <MetricCard label="Sets" value={`${sets.length}`} accentColor={colors.accentSoft} />
        <MetricCard label="Best" value={`${bestWeight.toFixed(0)} kg`} accentColor={colors.accent} />
      </View>

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionLabel}>Sets</Text>
        <Text style={styles.sectionMeta}>{sets.length} Logged</Text>
      </View>
      <Divider style={styles.divider} />
      {sets.length === 0 ? <Text style={styles.emptyText}>No sets logged.</Text> : null}
      {sets.map((set, index) => (
        <ListRow
          key={`${set.exerciseName}-${index}`}
          title={set.exerciseName}
          subtitle={set.kind === 'reps' ? `${set.reps ?? 0} reps @ ${set.weight ?? 0}kg` : `${set.seconds ?? 0}s`}
        />
      ))}

      <Text style={styles.sectionLabel}>Session Notes</Text>
      <TextInput
        style={styles.notesInput}
        value={notes}
        onChangeText={setNotes}
        placeholder="Session notes"
        placeholderTextColor={colors.textMuted}
        multiline
      />

      <Button label="Confirm & Save" onPress={handleConfirm} style={styles.confirmButton} />
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
    marginBottom: spacing.sm,
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
  divider: {
    marginVertical: spacing.xs,
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
