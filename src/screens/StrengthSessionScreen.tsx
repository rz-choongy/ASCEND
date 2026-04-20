import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { appendEvent, getSessionById, getSessionEvents, setSessionStatus } from '../domain/sessionStore';
import type { RootStackScreenProps } from '../navigation/types';
import {
  Button,
  Chip,
  Divider,
  colors,
  radius,
  spacing,
  typography,
} from '../ui';

type StrengthSetPayload = {
  exerciseName: string;
  reps: number;
  weight: number;
  unit: 'kg';
  createdAt?: number;
};

type LoggedSet = StrengthSetPayload & { createdAt: number };

type StrengthSessionScreenProps = RootStackScreenProps<'StrengthLogger'>;

const EXERCISES = [
  { id: 'pullups', name: 'Pull-ups' },
  { id: 'pushups', name: 'Push-ups' },
  { id: 'row', name: 'Barbell Row' },
  { id: 'hangboard', name: 'Hangboard' },
  { id: 'dips', name: 'Dips' },
];

const formatLogTime = (ms: number): string => {
  const date = new Date(ms);
  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');
  return `${hours}:${minutes}`;
};

const formatSetLabel = (set: LoggedSet): string => {
  const weightLabel = set.weight === 0 ? 'bw' : `${set.weight}kg`;
  return `${set.reps}x${weightLabel}`;
};

const parseLoggedSets = (
  events: { type: string; payload: unknown; createdAt: number }[]
): LoggedSet[] => {
  const sets: LoggedSet[] = [];
  for (const event of events) {
    if (event.type === 'SET_LOGGED') {
      const p = event.payload as StrengthSetPayload;
      sets.push({ ...p, createdAt: event.createdAt });
    }
    if (event.type === 'SET_UNDONE') {
      sets.pop();
    }
  }
  return sets;
};

export const StrengthSessionScreen = ({ route, navigation }: StrengthSessionScreenProps) => {
  const { sessionId } = route.params;
  const session = getSessionById(sessionId);

  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedExerciseId, setSelectedExerciseId] = useState(EXERCISES[0].id);
  const [reps, setReps] = useState(8);
  const [weight, setWeight] = useState(20);

  const bump = () => setRefreshKey((k) => k + 1);

  const events = useMemo(
    () => getSessionEvents(sessionId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sessionId, refreshKey]
  );
  const loggedSets = useMemo(() => parseLoggedSets(events), [events]);
  const recentSets = useMemo(() => loggedSets.slice().reverse(), [loggedSets]);

  const selectedExercise = EXERCISES.find((e) => e.id === selectedExerciseId) ?? EXERCISES[0];
  const hasLogs = loggedSets.length > 0;

  const handleLogSet = () => {
    if (session?.status !== 'active') return;
    appendEvent(sessionId, 'SET_LOGGED', {
      exerciseName: selectedExercise.name,
      reps,
      weight,
      unit: 'kg',
    } satisfies StrengthSetPayload);
    bump();
  };

  const handleUndo = () => {
    if (session?.status !== 'active') return;
    appendEvent(sessionId, 'SET_UNDONE', { at: Date.now() });
    bump();
  };

  const handleDone = () => {
    if (session?.status !== 'active') {
      navigation.navigate('Tabs');
      return;
    }
    setSessionStatus(sessionId, 'completed');
    navigation.navigate('Tabs');
  };

  const handleAbandon = () => {
    if (session?.status !== 'active') {
      navigation.navigate('Tabs');
      return;
    }
    setSessionStatus(sessionId, 'abandoned');
    navigation.navigate('Tabs');
  };

  if (!session) {
    return (
      <View style={styles.screen}>
        <Text style={{ color: colors.textMuted, padding: 16 }}>Session not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Gym Session</Text>

      {/* Exercise chips */}
      <Text style={styles.sectionLabel}>Exercise</Text>
      <View style={styles.chipRow}>
        {EXERCISES.map((exercise) => (
          <Chip
            key={exercise.id}
            label={exercise.name}
            selected={exercise.id === selectedExerciseId}
            onPress={() => setSelectedExerciseId(exercise.id)}
          />
        ))}
      </View>

      {/* Input controls */}
      <View style={styles.inputSection}>
        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>Reps</Text>
          <View style={styles.stepper}>
            <Pressable
              onPress={() => setReps((v) => Math.max(1, v - 1))}
              style={styles.stepButton}
            >
              <Text style={styles.stepText}>-</Text>
            </Pressable>
            <Text style={styles.stepValue}>{reps}</Text>
            <Pressable onPress={() => setReps((v) => v + 1)} style={styles.stepButton}>
              <Text style={styles.stepText}>+</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>Weight</Text>
          <View style={styles.stepper}>
            <Pressable
              onPress={() => setWeight((v) => Math.max(0, v - 1))}
              style={styles.stepButton}
            >
              <Text style={styles.stepText}>-</Text>
            </Pressable>
            <Text style={styles.stepValue}>{weight === 0 ? 'bw' : `${weight} kg`}</Text>
            <Pressable onPress={() => setWeight((v) => v + 1)} style={styles.stepButton}>
              <Text style={styles.stepText}>+</Text>
            </Pressable>
          </View>
        </View>

        <Button label="Log Set" onPress={handleLogSet} style={styles.logSetButton} />
      </View>

      {/* Logged sets */}
      <View style={styles.logHeaderRow}>
        <Text style={styles.sectionLabel}>
          Logged{recentSets.length > 0 ? ` (${recentSets.length})` : ''}
        </Text>
        {hasLogs ? (
          <Button
            label="Undo"
            variant="ghost"
            onPress={handleUndo}
            style={styles.undoButton}
            textStyle={styles.undoText}
          />
        ) : null}
      </View>
      <Divider style={styles.divider} />

      <ScrollView style={styles.logList} contentContainerStyle={styles.logListContent}>
        {recentSets.length === 0 ? (
          <Text style={styles.emptyText}>No sets logged yet.</Text>
        ) : null}
        {recentSets.map((set, index) => (
          <View key={`${set.exerciseName}-${set.createdAt}-${index}`} style={styles.logRow}>
            <View style={styles.logBody}>
              <Text style={styles.logExercise}>{set.exerciseName}</Text>
              <Text style={styles.logDetail}>{formatSetLabel(set)}</Text>
            </View>
            <Text style={styles.logTime}>{formatLogTime(set.createdAt)}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Bottom action */}
      <View style={styles.finishBar}>
        {hasLogs ? (
          <Button label="Done" onPress={handleDone} style={styles.finishButton} />
        ) : (
          <Button
            label="Abandon Session"
            variant="ghost"
            onPress={handleAbandon}
            style={styles.finishButton}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  title: {
    ...typography.title,
    marginBottom: spacing.sm,
  },
  sectionLabel: {
    ...typography.section,
    marginBottom: spacing.xs,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  inputSection: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    width: 60,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  stepButton: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 24,
  },
  stepValue: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    minWidth: 56,
    textAlign: 'center',
  },
  logSetButton: {
    marginTop: spacing.xs,
  },
  logHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  undoButton: {
    minHeight: 36,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  undoText: {
    fontSize: 10,
  },
  divider: {
    marginVertical: spacing.xs,
  },
  logList: {
    flex: 1,
  },
  logListContent: {
    paddingBottom: spacing.lg,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginBottom: spacing.xs,
  },
  logBody: {
    flex: 1,
  },
  logExercise: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  logDetail: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  logTime: {
    color: colors.textMuted,
    fontSize: 11,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 12,
  },
  finishBar: {
    paddingTop: spacing.xs,
  },
  finishButton: {
    width: '100%',
  },
});
