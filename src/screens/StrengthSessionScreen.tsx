import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import * as Haptics from 'expo-haptics';
import {
  Keyboard,
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
import { countExerciseData, deleteExerciseWithData } from '../domain/exerciseData';
import {
  createExercise,
  getCategories,
  getExercises,
  renameExercise,
  setExerciseCategory,
  setExerciseFavorite,
} from '../domain/exerciseStore';
import {
  appendEvent,
  getAbandonedSessions,
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
  buildExerciseList,
  buildLoggerReference,
  estimateOneRepMax,
  exerciseKeyFor,
  formatDaysAgo,
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
import type { ExerciseCategoryRow, ExerciseRow, SessionRow } from '../domain/types';
import type { RootStackScreenProps } from '../navigation/types';
import {
  Button,
  Card,
  Chip,
  CloseIcon,
  IconButton,
  PressableScale,
  StarIcon,
  font,
  radius,
  showDialog,
  spacing,
  useTheme,
  type Shadows,
} from '../ui';
import type { ThemeColors } from '../ui/tokens/colors';
import type { Typography } from '../ui/tokens/typography';
import { ExercisePickerSheet, type ExerciseUsage } from './strength/ExercisePickerSheet';

type StrengthSetPayload = {
  exerciseId?: string;
  exerciseName: string;
  reps: number;
  weight: number;
  unit: 'kg';
  createdAt?: number;
};

type StrengthSessionScreenProps = RootStackScreenProps<'StrengthLogger'>;

type ExerciseOption = Pick<ExerciseRow, 'id' | 'name'>;

type ExerciseState = {
  exercises: ExerciseRow[];
  /** null until the first exercise is picked. */
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
  return { exercises, selectedExerciseId: selectedExists ? (selectedExerciseId ?? null) : null };
};

/** Reopening a session carries on with the exercise last logged in it. */
const lastLoggedExerciseId = (sessionId: string): string | null => {
  const sets = applySetEvents(getSessionEvents(sessionId));
  return sets[sets.length - 1]?.exerciseId ?? null;
};

const QUICK_STARTS_SHOWN = 3;

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

// Stepping closes any open number field first: the field shows its own draft, so
// leaving it open would show a stale number next to the stepped value.
const stepHaptic = (fn: () => void) => () => {
  Keyboard.dismiss();
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
  /** Whether typed text is a usable value; while it isn't, the parent blocks logging. */
  isValid: (text: string) => boolean;
  onValidityChange: (valid: boolean) => void;
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
  isValid,
  onValidityChange,
  onDecrement,
  onIncrement,
  accessory,
}: ValuePanelProps) => {
  const { colors, typography } = useTheme();
  const styles = useMemo(() => createPanelStyles(colors, typography), [colors, typography]);
  const [draft, setDraft] = useState<string | null>(null);
  // Closing the field shows the real value again, so it's valid by definition.
  const endEditing = () => {
    setDraft(null);
    onValidityChange(true);
  };

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
            onValidityChange(isValid(text));
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

  const [exerciseState, setExerciseState] = useState<ExerciseState>(() =>
    loadExerciseState(lastLoggedExerciseId(sessionId))
  );
  const [categories, setCategories] = useState<ExerciseCategoryRow[]>(() => getCategories());
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  // A typed field that's empty or not a number: Log waits rather than logging the old value.
  const [invalidFields, setInvalidFields] = useState({ reps: false, weight: false });
  const setFieldValid = (field: 'reps' | 'weight') => (valid: boolean) =>
    setInvalidFields((current) => (current[field] === !valid ? current : { ...current, [field]: !valid }));
  // Picked this session but not logged yet, so they still show in the session row.
  const [pickedIds, setPickedIds] = useState<string[]>([]);
  const [title, setTitle] = useState(session?.title ?? '');
  const [showTimer, setShowTimer] = useState(true);
  const [now, setNow] = useState(() => Date.now());
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
      // Categories may have been added, renamed or deleted on the Categories screen.
      setCategories(getCategories());
      setExerciseState((state) => loadExerciseState(state.selectedExerciseId));
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
      showDialog('Leave this session?', 'You have logged sets in this session.', [
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
    exerciseState.exercises.find((e) => e.id === exerciseState.selectedExerciseId) ?? null;

  // Last top set and date per exercise, for the picker and the quick starts. Older sets
  // were logged without an id, so fall back to matching on the name.
  const usage = useMemo(() => {
    const byKey = new Map(buildExerciseList(historySessions).map((e) => [e.key, e]));
    const map = new Map<string, ExerciseUsage>();
    exerciseState.exercises.forEach((exercise) => {
      const found = byKey.get(exercise.id) ?? byKey.get(exerciseKeyFor({ exerciseName: exercise.name }));
      if (found) map.set(exercise.id, { lastSet: found.lastSet, lastAt: found.lastAt });
    });
    return map;
  }, [historySessions, exerciseState.exercises]);

  const sessionSets = useMemo(() => {
    const counts = new Map<string, number>();
    loggedSets.forEach((set) => {
      if (set.exerciseId) counts.set(set.exerciseId, (counts.get(set.exerciseId) ?? 0) + 1);
    });
    return counts;
  }, [loggedSets]);

  // This session's exercises in the order they were first used: logged ones, then any
  // picked but not logged yet.
  const sessionExercises = useMemo(() => {
    const ids: string[] = [];
    loggedSets.forEach((set) => {
      if (set.exerciseId && !ids.includes(set.exerciseId)) ids.push(set.exerciseId);
    });
    [...pickedIds, exerciseState.selectedExerciseId].forEach((id) => {
      if (id && !ids.includes(id)) ids.push(id);
    });
    return ids
      .map((id) => exerciseState.exercises.find((e) => e.id === id))
      .filter((e): e is ExerciseRow => e !== undefined);
  }, [loggedSets, pickedIds, exerciseState]);

  // First pick of a session: favourites first, then whatever was done most recently.
  const quickStarts = useMemo(() => {
    const byRecent = (a: ExerciseRow, b: ExerciseRow) =>
      (usage.get(b.id)?.lastAt ?? 0) - (usage.get(a.id)?.lastAt ?? 0);
    const favorites = exerciseState.exercises.filter((e) => e.favorite === 1).sort(byRecent);
    const recent = exerciseState.exercises.filter((e) => e.favorite !== 1 && usage.has(e.id)).sort(byRecent);
    return [...favorites, ...recent].slice(0, QUICK_STARTS_SHOWN);
  }, [exerciseState.exercises, usage]);
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
    Keyboard.dismiss();
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

  const handlePickExercise = (exerciseId: string) => {
    if (exerciseId !== exerciseState.selectedExerciseId) handleSelectExercise(exerciseId);
    setPickedIds((ids) => (ids.includes(exerciseId) ? ids : [...ids, exerciseId]));
    setIsPickerOpen(false);
  };

  const handleCreateExercise = (name: string, categoryId: string | null) => {
    rememberCurrentInput();
    const created = createExercise(name, categoryId);
    setExerciseState({ exercises: getExercises(), selectedExerciseId: created.id });
    // A brand-new exercise has no history to start from, so begin at bodyweight.
    setExerciseInputMemory((current) => ({ ...current, [created.id]: { reps: 8, weight: 0 } }));
    setReps(8);
    setWeight(0);
    setRecordChip(null);
    setPickedIds((ids) => [...ids, created.id]);
    setIsPickerOpen(false);
  };

  const reloadExercises = () => setExerciseState((state) => loadExerciseState(state.selectedExerciseId));

  const handleToggleFavorite = (exerciseId: string) => {
    const exercise = exerciseState.exercises.find((e) => e.id === exerciseId);
    if (!exercise) return;
    void Haptics.selectionAsync();
    setExerciseFavorite(exerciseId, exercise.favorite !== 1);
    reloadExercises();
  };

  const handleSetCategory = (exerciseId: string, categoryId: string | null) => {
    setExerciseCategory(exerciseId, categoryId);
    reloadExercises();
  };

  const handleRenameExercise = (exerciseId: string, name: string): string | null => {
    try {
      renameExercise(exerciseId, name);
      reloadExercises();
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : "Couldn't rename it.";
    }
  };

  // Deleting takes the exercise's logged sets with it, so it always asks first and
  // says how much will go.
  const handleDeleteExercise = (exerciseId: string) => {
    const exercise = exerciseState.exercises.find((e) => e.id === exerciseId);
    if (!exercise) return;
    const strengthSessions = [
      ...getCompletedSessions('strength'),
      ...getAbandonedSessions('strength'),
      ...(session ? [session] : []),
    ];
    const count = countExerciseData(strengthSessions, exercise);
    if (count.activeSets > 0) {
      showDialog(
        `${exercise.name} is in this session`,
        `Undo its ${count.activeSets} ${count.activeSets === 1 ? 'set' : 'sets'} here first, then delete it.`
      );
      return;
    }
    const message =
      count.sets > 0
        ? `This also deletes its ${count.sets} logged ${count.sets === 1 ? 'set' : 'sets'} from ${count.sessions} ${
            count.sessions === 1 ? 'session' : 'sessions'
          }, and its progress history. Sessions with nothing else in them are removed too. This can't be undone.`
        : "It hasn't been logged yet, so no history is lost.";
    showDialog(`Delete ${exercise.name}?`, message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: count.sets > 0 ? 'Delete exercise and data' : 'Delete exercise',
        style: 'destructive',
        onPress: () => {
          try {
            deleteExerciseWithData(strengthSessions, exercise);
          } catch (error) {
            showDialog("Couldn't delete it", error instanceof Error ? error.message : 'Try again.');
            return;
          }
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setPickedIds((ids) => ids.filter((id) => id !== exerciseId));
          setExerciseState((state) =>
            loadExerciseState(state.selectedExerciseId === exerciseId ? null : state.selectedExerciseId)
          );
        },
      },
    ]);
  };

  // Let the sheet finish closing first: iOS won't present a new screen while a
  // native modal is still animating away.
  const handleManageCategories = () => {
    setIsPickerOpen(false);
    setTimeout(() => navigation.navigate('Categories'), 350);
  };

  // See ClimbSessionScreen.handleLog for why this guard exists.
  const isLoggingRef = useRef(false);

  const handleLogSet = () => {
    if (session?.status !== 'active' || !selectedExercise || isLoggingRef.current) return;
    if (invalidFields.reps || invalidFields.weight) return;
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
    // Bottom edge too: Done sits at the very bottom and must clear the home indicator.
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
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

      {/* This session's exercises only -- the full list lives in the picker sheet */}
      <Text style={styles.sectionLabel}>This session</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipScroller}
        contentContainerStyle={styles.chipRow}
        keyboardShouldPersistTaps="handled"
      >
        {sessionExercises.map((exercise) => {
          const selected = exercise.id === exerciseState.selectedExerciseId;
          const sets = sessionSets.get(exercise.id) ?? 0;
          return (
            <PressableScale
              key={exercise.id}
              onPress={() => handlePickExercise(exercise.id)}
              scaleTo={0.95}
              accessibilityLabel={`${exercise.name}, ${sets} ${sets === 1 ? 'set' : 'sets'}${selected ? ', selected' : ''}`}
              style={[styles.sessionChip, selected ? styles.sessionChipSelected : null]}
            >
              <Text style={[styles.sessionChipText, selected ? styles.sessionChipTextSelected : null]} numberOfLines={1}>
                {exercise.name}
              </Text>
              <View style={[styles.sessionChipCount, selected ? styles.sessionChipCountSelected : null]}>
                <Text style={[styles.sessionChipCountText, selected ? styles.sessionChipTextSelected : null]}>
                  {sets}
                </Text>
              </View>
            </PressableScale>
          );
        })}
        <Chip label="+ Exercise" onPress={() => setIsPickerOpen(true)} style={styles.addExerciseChip} />
      </ScrollView>

      <ExercisePickerSheet
        visible={isPickerOpen}
        exercises={exerciseState.exercises}
        categories={categories}
        usage={usage}
        sessionSets={sessionSets}
        onPick={handlePickExercise}
        onCreate={handleCreateExercise}
        onToggleFavorite={handleToggleFavorite}
        onSetCategory={handleSetCategory}
        onRename={handleRenameExercise}
        onDelete={handleDeleteExercise}
        onManageCategories={handleManageCategories}
        onClose={() => setIsPickerOpen(false)}
      />

      {!selectedExercise ? (
        <Card style={styles.firstPick}>
          <Text style={styles.firstPickTitle}>What are you starting with?</Text>
          {quickStarts.length > 0 ? (
            <View>
              {quickStarts.map((exercise, index) => {
                const used = usage.get(exercise.id);
                return (
                  <Pressable
                    key={exercise.id}
                    onPress={() => handlePickExercise(exercise.id)}
                    style={({ pressed }) => [
                      styles.quickRow,
                      index > 0 ? styles.quickRowDivided : null,
                      pressed ? styles.quickRowPressed : null,
                    ]}
                    accessibilityRole="button"
                  >
                    <View style={styles.quickText}>
                      <Text style={styles.quickName}>{exercise.name}</Text>
                      <Text style={styles.quickSub}>
                        {used
                          ? `Last: ${used.lastSet.weight === 0 ? 'BW' : `${formatWeight(used.lastSet.weight)} kg`} × ${used.lastSet.reps} · ${formatDaysAgo(used.lastAt)}`
                          : 'Favourite'}
                      </Text>
                    </View>
                    {exercise.favorite === 1 ? <StarIcon size={16} color={colors.accent} filled /> : null}
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <Text style={styles.emptyText}>Pick an exercise, or search to add your own.</Text>
          )}
          <Button label="Browse all exercises" variant="secondary" onPress={() => setIsPickerOpen(true)} />
        </Card>
      ) : null}

      {/* Input: reps and weight side by side, then log */}
      {selectedExercise ? (
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
            isValid={(text) => parseRepsInput(text) !== null}
            onValidityChange={setFieldValid('reps')}
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
            isValid={(text) => parseWeightInput(text) !== null}
            onValidityChange={setFieldValid('weight')}
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
          disabled={!selectedExercise || invalidFields.reps || invalidFields.weight}
        />
      </Card>
      ) : null}

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
            <Text style={styles.logExercise} numberOfLines={1}>
              {exerciseState.exercises.find((e) => e.id === set.exerciseId)?.name ?? set.exerciseName}
            </Text>
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
    borderStyle: 'dashed',
    borderColor: colors.textMuted,
  },
  // Session chips carry a set count, so they're built here rather than with Chip.
  sessionChip: {
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: 40,
    paddingLeft: spacing.s + 2,
    paddingRight: 6,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
  },
  sessionChipSelected: {
    backgroundColor: colors.action,
    borderColor: colors.action,
  },
  sessionChipText: {
    ...font('medium'),
    fontSize: 15,
    color: colors.textPrimary,
  },
  sessionChipTextSelected: {
    color: colors.onAction,
  },
  sessionChipCount: {
    minWidth: 24,
    height: 24,
    paddingHorizontal: 6,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.fill,
  },
  sessionChipCountSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  sessionChipCountText: {
    ...font('semibold'),
    fontSize: 12,
    color: colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  firstPick: {
    padding: spacing.sm,
    gap: spacing.s,
    marginBottom: spacing.sm,
  },
  firstPickTitle: {
    ...typography.title,
    fontSize: 18,
  },
  quickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 56,
  },
  quickRowDivided: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.separator,
  },
  quickRowPressed: {
    opacity: 0.6,
  },
  quickText: {
    flex: 1,
    gap: 1,
  },
  quickName: {
    ...typography.body,
  },
  quickSub: {
    ...font('regular'),
    fontSize: 12,
    color: colors.textSecondary,
    fontVariant: ['tabular-nums'],
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
