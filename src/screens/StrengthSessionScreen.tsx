import { useCallback, useMemo, useState } from 'react';
import * as Haptics from 'expo-haptics';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getExercises, createExercise } from '../domain/exerciseStore';
import {
  appendEvent,
  getSessionById,
  getSessionEvents,
  setSessionStatus,
  setSessionTitle,
} from '../domain/sessionStore';
import { applySetEvents, type LoggedSet } from '../domain/strengthLogUtils';
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
  exerciseId?: string;
  exerciseName: string;
  reps: number;
  weight: number;
  unit: 'kg';
  createdAt?: number;
};

type StrengthSessionScreenProps = RootStackScreenProps<'StrengthLogger'>;

type ExerciseOption = {
  id: string;
  name: string;
};

type ExerciseState = {
  exercises: ExerciseOption[];
  selectedExerciseId: string | null;
};

type ExerciseInputMemory = Record<string, { reps: number; weight: number }>;

const loadExerciseState = (selectedExerciseId?: string | null): ExerciseState => {
  const exercises = getExercises();
  const selectedExists = exercises.some((exercise) => exercise.id === selectedExerciseId);
  return {
    exercises,
    selectedExerciseId: selectedExists
      ? selectedExerciseId ?? null
      : exercises[0]?.id ?? null,
  };
};

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

export const StrengthSessionScreen = ({ route, navigation }: StrengthSessionScreenProps) => {
  const { sessionId } = route.params;

  const [session, setSession] = useState(() => getSessionById(sessionId));
  const [refreshKey, setRefreshKey] = useState(0);
  const [exerciseState, setExerciseState] = useState<ExerciseState>(() => loadExerciseState());
  const [title, setTitle] = useState(session?.title ?? '');
  const [isAddExerciseOpen, setIsAddExerciseOpen] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [reps, setReps] = useState(8);
  const [weight, setWeight] = useState(20);
  const [exerciseInputMemory, setExerciseInputMemory] = useState<ExerciseInputMemory>({});

  useFocusEffect(
    useCallback(() => {
      setSession(getSessionById(sessionId));
    }, [sessionId])
  );

  const bump = () => setRefreshKey((k) => k + 1);
  const displayTitle = title.trim() || 'Gym Session';

  const events = useMemo(
    () => getSessionEvents(sessionId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sessionId, refreshKey]
  );
  const loggedSets = useMemo(() => applySetEvents(events), [events]);
  const recentSets = useMemo(() => loggedSets.slice().reverse(), [loggedSets]);

  const selectedExercise =
    exerciseState.exercises.find((e) => e.id === exerciseState.selectedExerciseId) ??
    exerciseState.exercises[0] ??
    null;
  const hasLogs = loggedSets.length > 0;

  const handleSaveTitle = () => {
    if (!session) return;
    setSessionTitle(sessionId, title.trim());
  };

  const rememberCurrentInput = () => {
    if (!exerciseState.selectedExerciseId) return;
    setExerciseInputMemory((current) => ({
      ...current,
      [exerciseState.selectedExerciseId as string]: { reps, weight },
    }));
  };

  const handleSelectExercise = (exerciseId: string) => {
    rememberCurrentInput();
    const savedInput = exerciseInputMemory[exerciseId];
    if (savedInput) {
      setReps(savedInput.reps);
      setWeight(savedInput.weight);
    }
    setExerciseState((state) => ({ ...state, selectedExerciseId: exerciseId }));
  };

  const handleCreateExercise = () => {
    const name = newExerciseName.trim();
    if (name.length === 0) return;

    const created = createExercise(name);
    const exercises = getExercises();
    const selectedExerciseId = created.id;

    setExerciseState({ exercises, selectedExerciseId });
    setReps(8);
    setWeight(0);
    setNewExerciseName('');
    setIsAddExerciseOpen(false);
  };

  const handleLogSet = () => {
    if (session?.status !== 'active' || !selectedExercise) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    appendEvent(sessionId, 'SET_LOGGED', {
      exerciseId: selectedExercise.id,
      exerciseName: selectedExercise.name,
      reps,
      weight,
      unit: 'kg',
    } satisfies StrengthSetPayload);
    setExerciseInputMemory((current) => ({
      ...current,
      [selectedExercise.id]: { reps, weight },
    }));
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
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSessionTitle(sessionId, title.trim());
    setSessionStatus(sessionId, 'completed');
    navigation.navigate('Tabs');
  };

  const handleAbandon = () => {
    if (session?.status !== 'active') {
      navigation.navigate('Tabs');
      return;
    }
    setSessionTitle(sessionId, title.trim());
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
      {/* Exercise chips */}
      <Text style={styles.sectionLabel}>Exercise</Text>
      <View style={styles.chipRow}>
        {exerciseState.exercises.map((exercise) => (
          <Chip
            key={exercise.id}
            label={exercise.name}
            selected={exercise.id === exerciseState.selectedExerciseId}
            onPress={() => handleSelectExercise(exercise.id)}
          />
        ))}
        <Chip
          label="+ Exercise"
          selected={false}
          onPress={() => setIsAddExerciseOpen(true)}
          style={styles.addExerciseChip}
        />
      </View>

      <Modal
        animationType="fade"
        transparent
        visible={isAddExerciseOpen}
        onRequestClose={() => setIsAddExerciseOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add exercise</Text>
            <TextInput
              style={styles.modalInput}
              value={newExerciseName}
              onChangeText={setNewExerciseName}
              placeholder="Exercise name"
              placeholderTextColor={colors.textMuted}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleCreateExercise}
            />
            <View style={styles.modalActions}>
              <Button
                label="Cancel"
                variant="ghost"
                onPress={() => {
                  setNewExerciseName('');
                  setIsAddExerciseOpen(false);
                }}
                style={styles.modalButton}
              />
              <Button
                label="Add"
                onPress={handleCreateExercise}
                disabled={newExerciseName.trim().length === 0}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      {!selectedExercise ? (
        <View style={styles.emptyExerciseBox}>
          <Text style={styles.emptyText}>Add an exercise to start logging sets.</Text>
        </View>
      ) : null}

      {/* Input controls */}
      <View style={styles.inputSection}>
        <View style={styles.loggingHeader}>
          <Text style={styles.loggingEyebrow}>Logging</Text>
          <Text style={styles.loggingExercise}>
            {selectedExercise?.name ?? 'Select an exercise'}
          </Text>
        </View>
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
          <Text style={styles.inputLabel}>Weight (kg)</Text>
          <View style={styles.stepper}>
            <Pressable
              onPress={() => setWeight((v) => Math.max(0, v - 5))}
              style={styles.stepButtonSmall}
            >
              <Text style={styles.stepTextSmall}>-5</Text>
            </Pressable>
            <Pressable
              onPress={() => setWeight((v) => Math.max(0, v - 1))}
              style={styles.stepButtonSmall}
            >
              <Text style={styles.stepText}>-</Text>
            </Pressable>
            <Text style={styles.stepValue}>{weight === 0 ? 'Bodyweight' : `${weight} kg`}</Text>
            <Pressable onPress={() => setWeight((v) => v + 1)} style={styles.stepButtonSmall}>
              <Text style={styles.stepText}>+</Text>
            </Pressable>
            <Pressable onPress={() => setWeight((v) => v + 5)} style={styles.stepButtonSmall}>
              <Text style={styles.stepTextSmall}>+5</Text>
            </Pressable>
          </View>
        </View>

        <Button
          label="Log Set"
          onPress={handleLogSet}
          disabled={!selectedExercise}
          style={styles.logSetButton}
        />
      </View>

      <View style={styles.titleBlock}>
        <Text style={styles.titleLabel}>Optional title</Text>
        <TextInput
          style={styles.titleInput}
          value={title}
          onChangeText={setTitle}
          onBlur={handleSaveTitle}
          onSubmitEditing={handleSaveTitle}
          placeholder={displayTitle}
          placeholderTextColor={colors.textMuted}
          returnKeyType="done"
        />
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
  titleBlock: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginBottom: spacing.sm,
  },
  titleLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  titleInput: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    minHeight: 30,
    padding: 0,
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
  addExerciseChip: {
    borderColor: colors.accent,
  },
  modalBackdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.overlay,
    padding: spacing.md,
  },
  modalCard: {
    width: '100%',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
    gap: spacing.sm,
  },
  modalTitle: {
    ...typography.title,
    fontSize: 20,
  },
  modalInput: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
    color: colors.textPrimary,
    fontSize: 16,
    paddingHorizontal: spacing.sm,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  modalButton: {
    flex: 1,
  },
  emptyExerciseBox: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.sm,
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
  loggingHeader: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.xs,
    marginBottom: spacing.xs,
  },
  loggingEyebrow: {
    ...typography.meta,
    color: colors.accent,
  },
  loggingExercise: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '900',
    marginTop: 2,
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
    width: 82,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexShrink: 1,
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
  stepButtonSmall: {
    width: 32,
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
  stepTextSmall: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '800',
  },
  stepValue: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    minWidth: 70,
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
