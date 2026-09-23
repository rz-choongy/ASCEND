import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
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
  IconButton,
  PressableScale,
  font,
  radius,
  spacing,
  useTheme,
  type Shadows,
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
  const weightLabel = set.weight === 0 ? 'BW' : `${formatWeight(set.weight)} kg`;
  return `${weightLabel} × ${set.reps}`;
};

const stepHaptic = (fn: () => void) => () => {
  void Haptics.selectionAsync();
  fn();
};

type ValuePanelProps = {
  label: string;
  /** Formatted value shown at rest, e.g. "20" or "BW". */
  value: string;
  /** The bare number put in the field when tapped to type. */
  editText: string;
  keyboardType: 'numeric' | 'decimal-pad';
  /** Called on every keystroke -- see Stepper for why this doesn't wait for blur. */
  onChangeText: (text: string) => void;
  onDecrement: () => void;
  onIncrement: () => void;
  /** Extra controls on the label row (the weight panel's -5 / +5). */
  accessory?: ReactNode;
};

/** One half of the logging card: label, a big number you can tap to type, and - / + below. */
const ValuePanel = ({
  label,
  value,
  editText,
  keyboardType,
  onChangeText,
  onDecrement,
  onIncrement,
  accessory,
}: ValuePanelProps) => {
  const { colors, typography } = useTheme();
  const styles = useMemo(() => createPanelStyles(colors, typography), [colors, typography]);
  const [draft, setDraft] = useState<string | null>(null);
  const endEditing = () => setDraft(null);

  return (
    <View style={styles.panel}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {accessory}
      </View>
      {draft !== null ? (
        <TextInput
          value={draft}
          onChangeText={(text) => {
            setDraft(text);
            onChangeText(text);
          }}
          onBlur={endEditing}
          onSubmitEditing={endEditing}
          keyboardType={keyboardType}
          returnKeyType="done"
          autoFocus
          selectTextOnFocus
          style={[styles.value, styles.valueInput]}
        />
      ) : (
        <Pressable
          onPress={() => setDraft(editText)}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={`${label}: ${value}. Tap to type`}
          style={styles.valueTap}
        >
          <Text style={styles.value}>{value}</Text>
        </Pressable>
      )}
      <View style={styles.stepRow}>
        <PressableScale onPress={stepHaptic(onDecrement)} scaleTo={0.92} style={styles.step} hitSlop={4} accessibilityLabel={`Decrease ${label}`}>
          <Text style={styles.stepText}>−</Text>
        </PressableScale>
        <PressableScale onPress={stepHaptic(onIncrement)} scaleTo={0.92} style={styles.step} hitSlop={4} accessibilityLabel={`Increase ${label}`}>
          <Text style={styles.stepText}>+</Text>
        </PressableScale>
      </View>
    </View>
  );
};

export const StrengthSessionScreen = ({ route, navigation }: StrengthSessionScreenProps) => {
  const { colors, typography, shadows } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, typography, shadows),
    [colors, typography, shadows]
  );
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
  const [showTimer, setShowTimer] = useState(true);
  const [now, setNow] = useState(() => Date.now());
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

  useFocusEffect(
    useCallback(() => {
      setSession(getSessionById(sessionId));
      setShowTimer(getShowSessionTimer());
      setNow(Date.now());
    }, [sessionId])
  );

  // Passive session length, same as the climb logger; ticks only while it's shown.
  useEffect(() => {
    if (!showTimer || session?.status !== 'active') return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [showTimer, session?.status]);

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
        <Text style={{ ...font('regular'), color: colors.textMuted, padding: spacing.sm }}>Session not found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      {/* Header: close, the session's name (tap to rename), elapsed time */}
      <View style={styles.headerRow}>
        <IconButton onPress={() => navigation.navigate('Tabs')} accessibilityLabel="Close">
          <CloseIcon size={16} color={colors.textPrimary} />
        </IconButton>
        <TextInput
          style={styles.titleInput}
          value={title}
          onChangeText={setTitle}
          onBlur={handleSaveTitle}
          onSubmitEditing={handleSaveTitle}
          placeholder={displayTitle}
          placeholderTextColor={colors.textPrimary}
          returnKeyType="done"
          accessibilityLabel="Session name"
          numberOfLines={1}
        />
        {showTimer && session.status === 'active' ? (
          <View style={styles.timer} accessibilityLabel={`Elapsed ${formatElapsed(now - session.started_at)}`}>
            <View style={styles.liveDot} />
            <Text style={styles.timerValue}>{formatElapsed(Math.max(0, now - session.started_at))}</Text>
          </View>
        ) : null}
      </View>

      {/* Exercise chips: one scrolling row keeps the card high on screen */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipScroller}
        contentContainerStyle={styles.chipRow}
        keyboardShouldPersistTaps="handled"
      >
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
      </ScrollView>

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

      {/* Input: reps and weight side by side, then log */}
      <Card style={styles.inputSection}>
        {recordChip !== null ? (
          <View style={styles.recordChip}>
            <Text style={styles.recordChipText}>New est. 1RM · {formatWeight(recordChip)} kg</Text>
          </View>
        ) : reference ? (
          <Text style={styles.lastTime} numberOfLines={1}>
            <Text style={styles.lastTimeLead}>Last time</Text>
            {` · ${formatMonthDay(reference.lastAt)} · `}
            {reference.lastSets
              .slice(0, LAST_TIME_SETS_SHOWN)
              .map((set) => `${set.weight === 0 ? 'BW' : `${formatWeight(set.weight)}`} × ${set.reps}`)
              .join(', ')}
          </Text>
        ) : (
          <Text style={styles.lastTime} numberOfLines={1}>
            First time logging {selectedExercise?.name ?? 'this'}
          </Text>
        )}
        <View style={styles.panels}>
          <ValuePanel
            label="Reps"
            value={`${reps}`}
            editText={`${reps}`}
            keyboardType="numeric"
            onChangeText={(text) => {
              const n = parseRepsInput(text);
              if (n !== null) setReps(n);
            }}
            onDecrement={() => setReps((v) => Math.max(1, v - 1))}
            onIncrement={() => setReps((v) => v + 1)}
          />
          <ValuePanel
            label="Kg"
            value={weight === 0 ? 'BW' : formatWeight(weight)}
            editText={formatWeight(weight)}
            keyboardType="decimal-pad"
            onChangeText={(text) => {
              const n = parseWeightInput(text);
              if (n !== null) setWeight(n);
            }}
            onDecrement={() => setWeight((v) => Math.max(0, roundWeight(v - WEIGHT_STEP)))}
            onIncrement={() => setWeight((v) => roundWeight(v + WEIGHT_STEP))}
            accessory={
              <View style={styles.bigSteps}>
                <PressableScale
                  onPress={stepHaptic(() => setWeight((v) => Math.max(0, roundWeight(v - BIG_WEIGHT_STEP))))}
                  scaleTo={0.9}
                  style={styles.bigStep}
                  hitSlop={8}
                  accessibilityLabel={`Minus ${BIG_WEIGHT_STEP} kg`}
                >
                  <Text style={styles.bigStepText}>−{BIG_WEIGHT_STEP}</Text>
                </PressableScale>
                <PressableScale
                  onPress={stepHaptic(() => setWeight((v) => roundWeight(v + BIG_WEIGHT_STEP)))}
                  scaleTo={0.9}
                  style={styles.bigStep}
                  hitSlop={8}
                  accessibilityLabel={`Plus ${BIG_WEIGHT_STEP} kg`}
                >
                  <Text style={styles.bigStepText}>+{BIG_WEIGHT_STEP}</Text>
                </PressableScale>
              </View>
            }
          />
        </View>
        <Button
          label={`Log set · ${weight === 0 ? 'BW' : `${formatWeight(weight)} kg`} × ${reps}`}
          onPress={handleLogSet}
          disabled={!selectedExercise}
        />
      </Card>

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
      <ScrollView style={styles.logList} contentContainerStyle={styles.logListContent}>
        {recentSets.length === 0 ? (
          <Text style={styles.emptyText}>No sets logged yet.</Text>
        ) : null}
        {recentSets.length > 0 ? (
          <View style={styles.logCard}>
        {recentSets.map((set, index) => (
          <View
            key={`${set.exerciseName}-${set.createdAt}-${index}`}
            style={[styles.logRow, index > 0 ? styles.logRowDivided : null]}
          >
            <Text style={styles.logExercise} numberOfLines={1}>{set.exerciseName}</Text>
            {recordEventIds.has(set.eventId) ? (
              <View style={styles.recordBadge}>
                <Text style={styles.recordBadgeText}>PR</Text>
              </View>
            ) : null}
            <Text style={styles.logDetail}>{formatSetLabel(set)}</Text>
            <Text style={styles.logTime}>{formatLogTime(set.createdAt)}</Text>
          </View>
        ))}
          </View>
        ) : null}
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

const createStyles = (colors: ThemeColors, typography: Typography, shadows: Shadows) =>
  StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  // Header row: close / editable session name / elapsed time.
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    marginBottom: spacing.sm,
  },
  titleInput: {
    ...typography.title,
    flex: 1,
    minHeight: 38,
    padding: 0,
  },
  timer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.s,
    minHeight: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.fill,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  timerValue: {
    ...typography.mono,
    fontSize: 14,
    color: colors.textPrimary,
  },
  sectionLabel: {
    ...typography.section,
    marginBottom: spacing.xs,
  },
  // Bleeds to the screen edges so chips scroll under the gutter, not clip at it.
  chipScroller: {
    flexGrow: 0,
    marginHorizontal: -spacing.sm,
    marginBottom: spacing.sm,
  },
  chipRow: {
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
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
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadows.lg,
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
    ...font('regular'),
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
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadows.card,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  inputSection: {
    padding: spacing.s,
    gap: spacing.s,
    marginBottom: spacing.sm,
  },
  panels: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  bigSteps: {
    flexDirection: 'row',
    gap: 4,
  },
  bigStep: {
    minWidth: 34,
    height: 24,
    paddingHorizontal: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSoft,
  },
  bigStepText: {
    ...font('mono'),
    fontSize: 11,
    color: colors.textSecondary,
  },
  logHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  undoButton: {
    minHeight: 44,
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xxs,
    borderRadius: radius.pill,
  },
  undoText: {
    fontSize: 13,
  },
  logList: {
    flex: 1,
  },
  logListContent: {
    paddingTop: spacing.xs,
    paddingBottom: spacing.lg,
  },
  logCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadows.card,
  },
  // One line per set: exercise, PR flag, weight x reps, time.
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 44,
    paddingHorizontal: spacing.sm,
  },
  logRowDivided: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.separator,
  },
  logExercise: {
    ...font('medium'),
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
    letterSpacing: -0.15,
  },
  logDetail: {
    ...font('semibold'),
    color: colors.textPrimary,
    fontSize: 15,
    fontVariant: ['tabular-nums'],
  },
  logTime: {
    ...typography.mono,
    fontSize: 12,
    color: colors.textMuted,
    minWidth: 40,
    textAlign: 'right',
  },
  lastTime: {
    ...font('regular'),
    fontSize: 13,
    color: colors.textSecondary,
    fontVariant: ['tabular-nums'],
    paddingHorizontal: 2,
  },
  lastTimeLead: {
    ...font('medium'),
    color: colors.textPrimary,
  },
  recordChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accentMuted,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.s,
    paddingVertical: 5,
  },
  recordChipText: {
    ...font('bold'),
    color: colors.accent,
    fontSize: 13,
    fontVariant: ['tabular-nums'],
  },
  recordBadge: {
    backgroundColor: colors.accentMuted,
    borderRadius: radius.sm,
    paddingHorizontal: 5,
    paddingVertical: 1,
    marginTop: 1,
  },
  recordBadgeText: {
    ...font('bold'),
    color: colors.accent,
    fontSize: 11,
  },
  emptyText: {
    ...font('regular'),
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

// Each half sits as a flat inset well inside the card, so the two values read
// as one control rather than two more boxes.
const createPanelStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
    panel: {
      flex: 1,
      backgroundColor: colors.surfaceAlt,
      borderRadius: radius.md,
      padding: spacing.xs,
      paddingTop: spacing.xs + 2,
      gap: 2,
    },
    labelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 24,
      paddingHorizontal: 4,
    },
    label: {
      ...typography.section,
    },
    valueTap: {
      alignSelf: 'stretch',
      alignItems: 'center',
    },
    value: {
      ...typography.numeric,
      fontSize: 34,
      lineHeight: 42,
      letterSpacing: -0.8,
      textAlign: 'center',
    },
    // Same footprint as the number it replaces, underlined so it reads as editing.
    valueInput: {
      alignSelf: 'center',
      minWidth: 72,
      padding: 0,
      borderBottomWidth: 2,
      borderBottomColor: colors.action,
    },
    stepRow: {
      flexDirection: 'row',
      gap: spacing.xs,
      marginTop: 2,
    },
    step: {
      flex: 1,
      height: 40,
      borderRadius: radius.pill,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSoft,
    },
    stepText: {
      ...font('regular'),
      fontSize: 22,
      lineHeight: 26,
      color: colors.textPrimary,
    },
  });
