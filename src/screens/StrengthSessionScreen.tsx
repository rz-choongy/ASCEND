import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { appendEvent, getSessionById, getSessionEvents, setSessionStatus } from '../domain/sessionStore';
import type { RootStackScreenProps } from '../navigation/types';
import {
  Button,
  Card,
  Chip,
  Divider,
  IconButton,
  ListRow,
  MetricCard,
  colors,
  radius,
  spacing,
  typography,
} from '../ui';

type StrengthExercise = {
  id: string;
  name: string;
  kind: 'reps' | 'time';
  target?: string;
};

type StrengthSetPayload = {
  exerciseId: string;
  exerciseName: string;
  setNumber: number;
  reps?: number;
  weight?: number;
  unit: 'kg';
  timeSeconds?: number;
};

type DraftSet = {
  setNumber: number;
  reps: number;
  weight: number;
  timeSeconds: number;
};

type StrengthSessionScreenProps = RootStackScreenProps<'StrengthLogger'>;

const EXERCISES: StrengthExercise[] = [
  { id: 'pullups', name: 'Weighted Pull-ups', kind: 'reps', target: 'Back - 3 Sets' },
  { id: 'row', name: 'Barbell Row', kind: 'reps', target: '60kg x 8' },
  { id: 'hangboard', name: 'Hangboard Repeaters', kind: 'time', target: 'Fingers - 6 Sets' },
];

const formatDuration = (ms: number): string => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const formatSessionTime = (ms: number): string => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const initialDraftSet = (setNumber: number): DraftSet => ({
  setNumber,
  reps: 5,
  weight: 20,
  timeSeconds: 7,
});

const parseLoggedSets = (events: { type: string; payload: unknown }[]): StrengthSetPayload[] => {
  const sets: StrengthSetPayload[] = [];
  events.forEach((event) => {
    if (event.type === 'SET_LOGGED') {
      sets.push(event.payload as StrengthSetPayload);
    }
    if (event.type === 'SET_UNDONE') {
      sets.pop();
    }
  });
  return sets;
};

export const StrengthSessionScreen = ({ route, navigation }: StrengthSessionScreenProps) => {
  const { sessionId } = route.params;
  const session = getSessionById(sessionId);

  const [tick, setTick] = useState(0);
  const [restStart, setRestStart] = useState<number | null>(null);
  const [restElapsed, setRestElapsed] = useState(0);
  const [restTargetMs, setRestTargetMs] = useState(180000);
  const [showRestSheet, setShowRestSheet] = useState(false);
  const [selectedExerciseId, setSelectedExerciseId] = useState(EXERCISES[0].id);
  const [copyLast, setCopyLast] = useState(true);
  const [draftsByExercise, setDraftsByExercise] = useState<Record<string, DraftSet[]>>(() => {
    const initial: Record<string, DraftSet[]> = {};
    EXERCISES.forEach((exercise) => {
      initial[exercise.id] = [initialDraftSet(1)];
    });
    return initial;
  });

  useEffect(() => {
    const interval = setInterval(() => setTick((prev) => prev + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (restStart) {
      setRestElapsed(Date.now() - restStart);
    }
  }, [tick, restStart]);

  const handleFinish = () => {
    setSessionStatus(sessionId, 'completed');
    navigation.navigate('Tabs');
  };

  const events = useMemo(() => getSessionEvents(sessionId), [sessionId, tick]);
  const loggedSets = useMemo(() => parseLoggedSets(events), [events]);
  const selectedExercise = EXERCISES.find((exercise) => exercise.id === selectedExerciseId) ?? EXERCISES[0];

  const totalVolume = loggedSets.reduce((sum, set) => sum + (set.reps ?? 0) * (set.weight ?? 0), 0);
  const bestWeight = Math.max(0, ...loggedSets.map((set) => set.weight ?? 0));

  const draftSets = draftsByExercise[selectedExercise.id] ?? [initialDraftSet(1)];

  const updateDraft = (index: number, field: keyof DraftSet, delta: number) => {
    setDraftsByExercise((prev) => {
      const current = prev[selectedExercise.id] ?? [initialDraftSet(1)];
      const next = current.map((draft, draftIndex) => {
        if (draftIndex !== index) {
          return draft;
        }
        const nextValue = Math.max(0, draft[field] + delta);
        return { ...draft, [field]: nextValue };
      });
      return { ...prev, [selectedExercise.id]: next };
    });
  };

  const addDraftSet = (seed?: DraftSet) => {
    setDraftsByExercise((prev) => {
      const current = prev[selectedExercise.id] ?? [initialDraftSet(1)];
      const lastNumber = current.length > 0 ? current[current.length - 1].setNumber : 0;
      const nextNumber = lastNumber + 1;
      const nextSet = seed ? { ...seed, setNumber: nextNumber } : initialDraftSet(nextNumber);
      return { ...prev, [selectedExercise.id]: [...current, nextSet] };
    });
  };

  const handleCompleteSet = (index: number) => {
    const target = draftSets[index];
    if (!target) {
      return;
    }

    appendEvent(sessionId, 'SET_LOGGED', {
      exerciseId: selectedExercise.id,
      exerciseName: selectedExercise.name,
      setNumber: target.setNumber,
      reps: selectedExercise.kind === 'reps' ? target.reps : undefined,
      weight: selectedExercise.kind === 'reps' ? target.weight : undefined,
      unit: 'kg',
      timeSeconds: selectedExercise.kind === 'time' ? target.timeSeconds : undefined,
    } as StrengthSetPayload);

    setDraftsByExercise((prev) => {
      const current = prev[selectedExercise.id] ?? [];
      const remaining = current.filter((_, idx) => idx !== index);
      if (remaining.length === 0) {
        const seed = copyLast ? target : initialDraftSet(target.setNumber + 1);
        return { ...prev, [selectedExercise.id]: [seed] };
      }
      if (copyLast) {
        const nextNumber = Math.max(...current.map((item) => item.setNumber)) + 1;
        remaining.push({ ...target, setNumber: nextNumber });
      }
      return { ...prev, [selectedExercise.id]: remaining };
    });
  };

  const handleUndo = () => {
    appendEvent(sessionId, 'SET_UNDONE', { at: Date.now() });
  };

  const handleRestStart = () => {
    setRestStart(Date.now());
    setRestElapsed(0);
    setRestTargetMs(180000);
    setShowRestSheet(true);
    appendEvent(sessionId, 'REST_STARTED', { at: Date.now() });
  };

  const handleRestEnd = () => {
    appendEvent(sessionId, 'REST_ENDED', { at: Date.now(), durationMs: restElapsed });
    setRestStart(null);
    setRestElapsed(0);
    setShowRestSheet(false);
  };

  const handleAddRest = () => {
    setRestTargetMs((prev) => prev + 30000);
  };

  const restRemaining = Math.max(0, restTargetMs - restElapsed);

  if (!session) {
    return (
      <View style={styles.screen}>
        <Text style={{ color: colors.textMuted, padding: 16 }}>Session not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Pull Day</Text>
          <Text style={styles.headerTimer}>Session Time {formatSessionTime(Date.now() - (session?.started_at ?? Date.now()))}</Text>
        </View>
        <Button label="Finish" onPress={handleFinish} style={styles.finishButton} />
      </View>

      <View style={styles.metricsRow}>
        <MetricCard label="Volume" value={`${totalVolume.toFixed(0)} kg`} accentColor={colors.accent} />
        <MetricCard label="Sets" value={`${loggedSets.length}`} accentColor={colors.accentSoft} />
        <MetricCard label="Best" value={`${bestWeight.toFixed(0)} kg`} accentColor={colors.accent} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionLabel}>Exercises</Text>
        <View style={styles.exerciseRow}>
          {EXERCISES.map((exercise) => (
            <Chip
              key={exercise.id}
              label={exercise.name}
              selected={exercise.id === selectedExerciseId}
              onPress={() => setSelectedExerciseId(exercise.id)}
              style={styles.exerciseChip}
            />
          ))}
        </View>

        {selectedExercise.kind === 'time' ? (
          <Card style={styles.intervalCard}>
            <View style={styles.intervalHeader}>
              <Text style={styles.intervalLabel}>Active Hang</Text>
              <IconButton label="||" variant="ghost" />
            </View>
            <Text style={styles.intervalTime}>
              {formatDuration((draftSets[0]?.timeSeconds ?? 0) * 1000)}
            </Text>
            <Text style={styles.intervalMeta}>Next Rest (3m)</Text>
            <View style={styles.intervalActions}>
              <Button
                label="Reset"
                variant="secondary"
                onPress={() => updateDraft(0, 'timeSeconds', -(draftSets[0]?.timeSeconds ?? 0))}
              />
              <Button label="Pause Timer" variant="primary" onPress={() => undefined} />
            </View>
          </Card>
        ) : null}

        <Card style={styles.logCard}>
          <View style={styles.logHeader}>
            <View>
              <Text style={styles.logTitle}>{selectedExercise.name}</Text>
              {selectedExercise.target ? <Text style={styles.logSubtitle}>{selectedExercise.target}</Text> : null}
            </View>
            <View style={styles.logHeaderActions}>
              <Pressable style={styles.copyToggle} onPress={() => setCopyLast((prev) => !prev)}>
                <View style={[styles.copyDot, copyLast ? styles.copyDotActive : null]} />
                <Text style={styles.copyText}>Copy last set</Text>
              </Pressable>
              <Button label="Undo" variant="ghost" onPress={handleUndo} style={styles.undoButton} textStyle={styles.undoText} />
            </View>
          </View>

          <View style={styles.setHeaderRow}>
            <Text style={styles.setHeaderText}>Set</Text>
            <Text style={styles.setHeaderText}>Load</Text>
            <Text style={styles.setHeaderText}>{selectedExercise.kind === 'reps' ? 'Reps' : 'Time'}</Text>
            <Text style={styles.setHeaderText}>Done</Text>
          </View>
          <Divider style={styles.divider} />

          {draftSets.map((draft, index) => (
            <View key={`${selectedExercise.id}-${draft.setNumber}`} style={styles.setRow}>
              <View style={styles.setNumberCell}>
                <Text style={styles.setNumberText}>{draft.setNumber}</Text>
              </View>
              {selectedExercise.kind === 'reps' ? (
                <View style={styles.valueCell}>
                  <Pressable onPress={() => updateDraft(index, 'weight', -1)} style={styles.adjustButton}>
                    <Text style={styles.adjustText}>-</Text>
                  </Pressable>
                  <Text style={styles.valueText}>{draft.weight}</Text>
                  <Pressable onPress={() => updateDraft(index, 'weight', 1)} style={styles.adjustButton}>
                    <Text style={styles.adjustText}>+</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.valueCell}>
                  <Text style={styles.valueText}>-</Text>
                </View>
              )}

              {selectedExercise.kind === 'reps' ? (
                <View style={styles.valueCell}>
                  <Pressable onPress={() => updateDraft(index, 'reps', -1)} style={styles.adjustButton}>
                    <Text style={styles.adjustText}>-</Text>
                  </Pressable>
                  <Text style={styles.valueText}>{draft.reps}</Text>
                  <Pressable onPress={() => updateDraft(index, 'reps', 1)} style={styles.adjustButton}>
                    <Text style={styles.adjustText}>+</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.valueCell}>
                  <Pressable onPress={() => updateDraft(index, 'timeSeconds', -1)} style={styles.adjustButton}>
                    <Text style={styles.adjustText}>-</Text>
                  </Pressable>
                  <Text style={styles.valueText}>{draft.timeSeconds}s</Text>
                  <Pressable onPress={() => updateDraft(index, 'timeSeconds', 1)} style={styles.adjustButton}>
                    <Text style={styles.adjustText}>+</Text>
                  </Pressable>
                </View>
              )}

              <Pressable style={styles.completeButton} onPress={() => handleCompleteSet(index)}>
                <Text style={styles.completeText}>OK</Text>
              </Pressable>
            </View>
          ))}

          <Button
            label="Add Set"
            variant="ghost"
            onPress={() => addDraftSet(copyLast ? draftSets[draftSets.length - 1] : undefined)}
            style={styles.addSetButton}
          />
        </Card>

        <Text style={styles.sectionLabel}>Logged Sets</Text>
        {loggedSets.length === 0 ? <Text style={styles.emptyText}>No sets logged yet.</Text> : null}
        {loggedSets.map((set, index) => (
          <ListRow
            key={`${set.exerciseId}-${index}`}
            title={set.exerciseName}
            subtitle={`Set ${set.setNumber}`}
            meta={set.reps ? `${set.reps} reps @ ${set.weight ?? 0}kg` : `${set.timeSeconds ?? 0}s`}
          />
        ))}

        <Card style={styles.restCard}>
          <View style={styles.restRow}>
            <View>
              <Text style={styles.restLabel}>Rest Timer</Text>
              <Text style={styles.restTime}>{formatDuration(restElapsed)}</Text>
            </View>
            <Button
              label={restStart ? 'End Rest' : 'Start Rest'}
              variant={restStart ? 'warning' : 'secondary'}
              onPress={restStart ? handleRestEnd : handleRestStart}
              style={styles.restButton}
            />
          </View>
        </Card>
      </ScrollView>

      {restStart && showRestSheet ? (
        <Pressable style={styles.restOverlay} onPress={() => setShowRestSheet(false)}>
          <Pressable style={styles.restSheet} onPress={() => undefined}>
            <View style={styles.restHandle} />
            <Text style={styles.restTitle}>Resting</Text>
            <Text style={styles.restCountdown}>{formatDuration(restRemaining)}</Text>
            <View style={styles.restActions}>
              <Button label="+30s" variant="secondary" onPress={handleAddRest} style={styles.restActionButton} />
              <Button label="Skip" variant="ghost" onPress={handleRestEnd} style={styles.restActionButton} />
            </View>
            <Text style={styles.restHint}>Tap outside to minimize</Text>
          </Pressable>
        </Pressable>
      ) : null}
      {restStart && !showRestSheet ? (
        <Pressable style={styles.restMini} onPress={() => setShowRestSheet(true)}>
          <Text style={styles.restMiniLabel}>Resting</Text>
          <Text style={styles.restMiniTime}>{formatDuration(restRemaining)}</Text>
        </Pressable>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    ...typography.title,
  },
  headerTimer: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  finishButton: {
    minHeight: 44,
    paddingHorizontal: 18,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.xl,
  },
  sectionLabel: {
    ...typography.section,
    marginBottom: spacing.xs,
  },
  exerciseRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  exerciseChip: {
    flexGrow: 1,
  },
  intervalCard: {
    padding: spacing.sm,
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  intervalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  intervalLabel: {
    ...typography.meta,
    color: colors.textSecondary,
  },
  intervalTime: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  intervalMeta: {
    color: colors.textMuted,
    fontSize: 12,
  },
  intervalActions: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  logCard: {
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  logHeader: {
    marginBottom: spacing.xs,
  },
  logTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  logSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  logHeaderActions: {
    marginTop: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  copyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  copyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: colors.textMuted,
  },
  copyDotActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  copyText: {
    color: colors.textSecondary,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  undoButton: {
    minHeight: 32,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  undoText: {
    fontSize: 10,
  },
  setHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  setHeaderText: {
    flex: 1,
    fontSize: 10,
    color: colors.textMuted,
    textTransform: 'uppercase',
    textAlign: 'center',
    letterSpacing: 1,
  },
  divider: {
    marginVertical: spacing.xs,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: spacing.xs,
  },
  setNumberCell: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setNumberText: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 12,
  },
  valueCell: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
  },
  adjustButton: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adjustText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  valueText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  completeButton: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: '700',
  },
  addSetButton: {
    marginTop: spacing.xs,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: spacing.xs,
  },
  restCard: {
    padding: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  restRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  restLabel: {
    ...typography.meta,
  },
  restTime: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.warning,
    marginTop: 4,
  },
  restButton: {
    minHeight: 44,
  },
  restOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  restSheet: {
    backgroundColor: colors.surfaceAlt,
    padding: spacing.sm,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  restHandle: {
    width: 40,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.borderSoft,
    alignSelf: 'center',
  },
  restTitle: {
    ...typography.meta,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  restCountdown: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.warning,
    textAlign: 'center',
  },
  restActions: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  restActionButton: {
    flex: 1,
  },
  restHint: {
    textAlign: 'center',
    fontSize: 11,
    color: colors.textMuted,
  },
  restMini: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.sm,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  restMiniLabel: {
    ...typography.meta,
    color: colors.textSecondary,
  },
  restMiniTime: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.warning,
  },
});
