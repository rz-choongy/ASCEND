import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as Haptics from 'expo-haptics';
import {
  Alert,
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { formatElapsed } from '../domain/dateUtils';
import { getExercises, createExercise } from '../domain/exerciseStore';
import {
  appendEvent,
  getCompletedSessions,
  getSessionById,
  getSessionEvents,
  setSessionStatus,
  setSessionTitle,
} from '../domain/sessionStore';
import { getShowSessionTimer } from '../domain/settingsStore';
import { applySetEvents, type LoggedSet } from '../domain/strengthLogUtils';
import {
  buildExerciseDetail,
  buildLoggerReference,
  estimateOneRepMax,
  exerciseKeyFor,
  formatMonthDay,
  formatWeight,
  initialInputFor,
  isNewRecord,
  parseRepsInput,
  parseWeightInput,
  roundWeight,
  type LoggerReference,
  type SetInput,
} from '../domain/strengthProgress';
import type { SessionRow } from '../domain/types';
import type { RootStackScreenProps } from '../navigation/types';
import {
  Button,
  Card,
  Chip,
  CloseIcon,
  Divider,
  IconButton,
  Stepper,
  radius,
  spacing,
  useTheme,
} from '../ui';
import type { ThemeColors } from '../ui/tokens/colors';
import type { Typography } from '../ui/tokens/typography';

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

type ExerciseInputMemory = Record<string, SetInput>;

const DEFAULT_INPUT: SetInput = { reps: 8, weight: 20 };
const WEIGHT_STEP = 1;
const BIG_WEIGHT_STEP = 5;
const RECORD_CHIP_MS = 3000;
const LAST_TIME_SETS_SHOWN = 4;

/** Older sets were logged without an exercise id, so fall back to matching on the name. */
const buildReferenceFor = (
  sessions: SessionRow[],
  exercise: ExerciseOption
): LoggerReference | null =>
  buildLoggerReference(
    buildExerciseDetail(sessions, exercise.id) ??
      buildExerciseDetail(sessions, exerciseKeyFor({ exerciseName: exercise.name }))
  );


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
  const weightLabel = set.weight === 0 ? 'bw' : `${formatWeight(set.weight)}kg`;
  return `${set.reps}x${weightLabel}`;
};

export const StrengthSessionScreen = ({ route, navigation }: StrengthSessionScreenProps) => {
  const { colors, typography } = useTheme();
  const styles = useMemo(() => createStyles(colors, typography), [colors, typography]);
  const { sessionId } = route.params;

  const [session, setSession] = useState(() => getSessionById(sessionId));
  const [refreshKey, setRefreshKey] = useState(0);
  // Completed sessions can't change while one is being logged, so read them once and cache
  // each exercise's reference (last time out, best to beat) the first time it's needed.
  const [historySessions] = useState(() => getCompletedSessions('strength'));
  const references = useRef(new Map<string, LoggerReference | null>()).current;
  const getReference = (exercise: ExerciseOption): LoggerReference | null => {
    if (!references.has(exercise.id)) references.set(exercise.id, buildReferenceFor(historySessions, exercise));
    return references.get(exercise.id) ?? null;
  };

  const [exerciseState, setExerciseState] = useState<ExerciseState>(() => loadExerciseState());
  const [title, setTitle] = useState(session?.title ?? '');
  const [isAddExerciseOpen, setIsAddExerciseOpen] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState('');
  // Start each exercise where you left off last time, not at a fixed 8 x 20.
  const startInput = (): SetInput => {
    const first = exerciseState.exercises.find((e) => e.id === exerciseState.selectedExerciseId);
    return initialInputFor(first ? getReference(first) : null, DEFAULT_INPUT);
  };
  const [reps, setReps] = useState(() => startInput().reps);
  const [weight, setWeight] = useState(() => startInput().weight);
  const [recordChip, setRecordChip] = useState<number | null>(null);
  const recordChipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (recordChipTimer.current) clearTimeout(recordChipTimer.current);
    },
    []
  );
  const [exerciseInputMemory, setExerciseInputMemory] = useState<ExerciseInputMemory>({});
  const [showTimer, setShowTimer] = useState(true);
  const [now, setNow] = useState(() => Date.now());

  useFocusEffect(
    useCallback(() => {
      setSession(getSessionById(sessionId));
      setShowTimer(getShowSessionTimer());
      setNow(Date.now());
    }, [sessionId])
  );

  // See ClimbSessionScreen for why this listener exists: any exit path (header back,
  // hardware back, swipe, or Done) must never leave a session stuck 'active' forever.
  // An empty session (nothing logged) abandons silently; one with real sets asks
  // first, since 'abandoned' sessions are excluded from every stats query and a
  // mis-tap would otherwise erase logged sets with no way back.
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      const current = getSessionById(sessionId);
      if (current?.status !== 'active') return;

      const hasUnsavedLogs = applySetEvents(getSessionEvents(sessionId)).length > 0;
      if (!hasUnsavedLogs) {
        setSessionStatus(sessionId, 'abandoned');
        return;
      }

      e.preventDefault();
      Alert.alert('Leave this session?', 'You have logged sets in this session.', [
        { text: 'Keep logging', style: 'cancel' },
        {
          text: 'Finish session',
          onPress: () => {
            setSessionTitle(sessionId, title.trim());
            setSessionStatus(sessionId, 'completed');
            navigation.dispatch(e.data.action);
          },
        },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            setSessionStatus(sessionId, 'abandoned');
            navigation.dispatch(e.data.action);
          },
        },
      ]);
    });
    return unsubscribe;
  }, [navigation, sessionId, title]);

  // Ticks the live session-length display; only runs while there's something to show.
  useEffect(() => {
    if (!showTimer || session?.status !== 'active') return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [showTimer, session?.status]);

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
  const reference = selectedExercise ? getReference(selectedExercise) : null;

  // Which logged sets were records, replayed in order so it stays right after an undo.
  const recordEventIds = useMemo(() => {
    const ids = new Set<string>();
    const sessionBest = new Map<string, number>();
    loggedSets.forEach((set) => {
      const key = set.exerciseId ?? exerciseKeyFor(set);
      const exercise = exerciseState.exercises.find((e) => e.id === set.exerciseId);
      const historyBest = exercise ? (getReference(exercise)?.bestE1rm ?? null) : null;
      if (isNewRecord(historyBest, sessionBest.get(key) ?? null, set.weight, set.reps)) ids.add(set.eventId);
      sessionBest.set(key, Math.max(sessionBest.get(key) ?? 0, estimateOneRepMax(set.weight, set.reps)));
    });
    return ids;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedSets, exerciseState.exercises]);

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
    const exercise = exerciseState.exercises.find((e) => e.id === exerciseId);
    const next =
      exerciseInputMemory[exerciseId] ??
      initialInputFor(exercise ? getReference(exercise) : null, DEFAULT_INPUT);
    setReps(next.reps);
    setWeight(next.weight);
    setRecordChip(null);
    setExerciseState((state) => ({ ...state, selectedExerciseId: exerciseId }));
  };

  const handleCreateExercise = () => {
    const name = newExerciseName.trim();
    if (name.length === 0) return;

    const created = createExercise(name);
    const exercises = getExercises();
    const selectedExerciseId = created.id;

    setExerciseState({ exercises, selectedExerciseId });
    setExerciseInputMemory((current) => ({ ...current, [created.id]: { reps: 8, weight: 0 } }));
    setReps(8);
    setWeight(0);
    setRecordChip(null);
    setNewExerciseName('');
    setIsAddExerciseOpen(false);
  };

  // See ClimbSessionScreen.handleLog for why this guard exists.
  const isLoggingRef = useRef(false);

  const handleLogSet = () => {
    if (session?.status !== 'active' || !selectedExercise || isLoggingRef.current) return;
    isLoggingRef.current = true;
    // Close any open number field so the steppers go back to their labels.
    Keyboard.dismiss();
    setTimeout(() => {
      isLoggingRef.current = false;
    }, 400);
    const sessionBest = loggedSets
      .filter((set) => set.exerciseId === selectedExercise.id)
      .reduce<number | null>(
        (best, set) => Math.max(best ?? 0, estimateOneRepMax(set.weight, set.reps)),
        null
      );
    const isRecord = isNewRecord(reference?.bestE1rm ?? null, sessionBest, weight, reps);
    if (isRecord) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setRecordChip(estimateOneRepMax(weight, reps));
      if (recordChipTimer.current) clearTimeout(recordChipTimer.current);
      recordChipTimer.current = setTimeout(() => setRecordChip(null), RECORD_CHIP_MS);
    } else {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
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
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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

  if (!session) {
    return (
      <SafeAreaView edges={['top']} style={styles.screen}>
        <Text style={{ color: colors.textMuted, padding: 16 }}>Session not found.</Text>
      </SafeAreaView>
    );
  }

  const elapsedMs = Math.max(0, now - session.started_at);

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      {/* Header — close, screen title, and elapsed timer bound into one row (mirrors ClimbSessionScreen) */}
      <View style={styles.headerRow}>
        <IconButton
          variant="bare"
          onPress={() => navigation.navigate('Tabs')}
          accessibilityLabel="Close"
          hitSlop={8}
        >
          <CloseIcon color={colors.textSecondary} />
        </IconButton>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Log strength
        </Text>
        {showTimer && session.status === 'active' ? (
          <View style={styles.timerCol}>
            <View style={styles.timerLabelRow}>
              <View style={styles.liveDot} />
              <Text style={styles.timerLabel}>Elapsed</Text>
            </View>
            <Text style={styles.timerValue}>{formatElapsed(elapsedMs)}</Text>
          </View>
        ) : (
          <View style={styles.closeBtn} />
        )}
      </View>

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
        transparent
        animationType="fade"
        visible={isAddExerciseOpen}
        onRequestClose={() => setIsAddExerciseOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setIsAddExerciseOpen(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
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
          </Pressable>
        </Pressable>
      </Modal>

      {!selectedExercise ? (
        <View style={styles.emptyExerciseBox}>
          <Text style={styles.emptyText}>Add an exercise to start logging sets.</Text>
        </View>
      ) : null}

      {/* Input controls */}
      <Card accentColor={colors.accent} style={styles.inputSection}>
        <View style={styles.loggingHeader}>
          <Text style={styles.loggingEyebrow}>Logging</Text>
          <Text style={styles.loggingExercise}>
            {selectedExercise?.name ?? 'Select an exercise'}
          </Text>
          {reference ? (
            <Text style={styles.lastTime} numberOfLines={2}>
              {`Last time · ${formatMonthDay(reference.lastAt)} · `}
              {reference.lastSets
                .slice(0, LAST_TIME_SETS_SHOWN)
                .map((set) => `${set.weight === 0 ? 'bw' : `${formatWeight(set.weight)} kg`} × ${set.reps}`)
                .join(', ')}
              {reference.lastSets.length > LAST_TIME_SETS_SHOWN
                ? ` +${reference.lastSets.length - LAST_TIME_SETS_SHOWN} more`
                : ''}
            </Text>
          ) : null}
        </View>
        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>Reps</Text>
          <Stepper
            value={`${reps}`}
            editable={{
              text: `${reps}`,
              keyboardType: 'numeric',
              onChangeText: (text) => {
                const n = parseRepsInput(text);
                if (n !== null) setReps(n);
              },
            }}
            onDecrement={() => setReps((v) => Math.max(1, v - 1))}
            onIncrement={() => setReps((v) => v + 1)}
          />
        </View>

        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>Weight (kg)</Text>
          <Stepper
            compact
            value={weight === 0 ? 'BW' : `${formatWeight(weight)} kg`}
            editable={{
              text: formatWeight(weight),
              keyboardType: 'decimal-pad',
              onChangeText: (text) => {
                const n = parseWeightInput(text);
                if (n !== null) setWeight(n);
              },
            }}
            onDecrement={() => setWeight((v) => Math.max(0, roundWeight(v - WEIGHT_STEP)))}
            onIncrement={() => setWeight((v) => roundWeight(v + WEIGHT_STEP))}
            onBigDecrement={() => setWeight((v) => Math.max(0, roundWeight(v - BIG_WEIGHT_STEP)))}
            onBigIncrement={() => setWeight((v) => roundWeight(v + BIG_WEIGHT_STEP))}
            bigStepLabel="5"
          />
        </View>

        {recordChip !== null ? (
          <View style={styles.recordChip}>
            <Text style={styles.recordChipText}>New est. 1RM · {formatWeight(recordChip)} kg</Text>
          </View>
        ) : null}

        <Button
          label="Log Set"
          onPress={handleLogSet}
          disabled={!selectedExercise}
          style={styles.logSetButton}
        />
      </Card>

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
            <View style={styles.logAccent} />
            <View style={styles.logBody}>
              <Text style={styles.logExercise}>{set.exerciseName}</Text>
              <View style={styles.logDetailRow}>
                <Text style={styles.logDetail}>{formatSetLabel(set)}</Text>
                {recordEventIds.has(set.eventId) ? (
                  <View style={styles.recordBadge}>
                    <Text style={styles.recordBadgeText}>PR</Text>
                  </View>
                ) : null}
              </View>
            </View>
            <Text style={styles.logTime}>{formatLogTime(set.createdAt)}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Bottom action */}
      {hasLogs ? (
        <View style={styles.finishBar}>
          <Button label="Done" onPress={handleDone} style={styles.finishButton} />
        </View>
      ) : null}
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    marginBottom: 10,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.title,
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  timerCol: {
    alignItems: 'flex-end',
    gap: 1,
    minWidth: 64,
  },
  timerLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  timerLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  timerValue: {
    ...typography.title,
    fontSize: 19,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  titleBlock: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.s,
    marginBottom: spacing.sm,
  },
  titleLabel: {
    ...typography.meta,
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 1,
  },
  titleInput: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.3,
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
    backgroundColor: colors.accentMuted,
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
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceAlt,
    padding: spacing.md,
    gap: spacing.sm,
  },
  modalTitle: {
    ...typography.title,
    fontSize: 20,
  },
  // A UITextField in its filled style: no outline, just a tinted well.
  modalInput: {
    minHeight: 48,
    borderRadius: radius.md,
    backgroundColor: colors.fill,
    color: colors.textPrimary,
    fontSize: 17,
    paddingHorizontal: spacing.s,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  modalButton: {
    flex: 1,
  },
  emptyExerciseBox: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  inputSection: {
    padding: spacing.sm,
    paddingLeft: spacing.sm + 6,
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  loggingHeader: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.separator,
    paddingBottom: spacing.xs,
    marginBottom: spacing.xs,
  },
  loggingEyebrow: {
    ...typography.meta,
    fontSize: 13,
    color: colors.accent,
  },
  loggingExercise: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.4,
    marginTop: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputLabel: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: -0.24,
    width: 82,
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
    minHeight: 30,
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xxs,
    borderRadius: radius.pill,
  },
  undoText: {
    fontSize: 13,
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
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.s,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    marginBottom: 6,
  },
  logAccent: {
    width: 4,
    height: '70%',
    borderRadius: 2,
    backgroundColor: colors.accent,
    marginRight: spacing.s,
  },
  logBody: {
    flex: 1,
  },
  logExercise: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.24,
  },
  logDetail: {
    ...typography.numeric,
    fontSize: 16,
    fontWeight: '500',
    marginTop: 1,
  },
  logTime: {
    color: colors.textMuted,
    fontSize: 13,
  },
  lastTime: {
    ...typography.meta,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  recordChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accentMuted,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.s,
    paddingVertical: 5,
  },
  recordChipText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '700',
  },
  logDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recordBadge: {
    backgroundColor: colors.accentMuted,
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
    marginTop: 1,
  },
  recordBadgeText: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '700',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  finishBar: {
    paddingTop: spacing.xs,
  },
  finishButton: {
    width: '100%',
  },
});
