import { useCallback, useMemo, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import {
  createExercise,
  getCategories,
  getExercises,
  renameExercise,
  setExerciseCategory,
  setExerciseFavorite,
} from '../domain/exerciseStore';
import { createRoutine, getRoutine, updateRoutine, type RoutineItem } from '../domain/routineStore';
import { getCompletedSessions, getSessionById, getSessionEvents } from '../domain/sessionStore';
import { applySetEvents, routineFromSets } from '../domain/strengthLogUtils';
import { buildExerciseList, exerciseKeyFor } from '../domain/strengthProgress';
import type { ExerciseCategoryRow, ExerciseRow } from '../domain/types';
import type { RootStackScreenProps } from '../navigation/types';
import { Button, ListGroup, ListSectionHeader, ScreenHeader, Stepper, font, radius, showDialog, spacing, useTheme } from '../ui';
import type { ThemeColors } from '../ui/tokens/colors';
import type { Typography } from '../ui/tokens/typography';
import { ExercisePickerSheet, type ExerciseUsage } from './strength/ExercisePickerSheet';

type Props = RootStackScreenProps<'RoutineEdit'>;

const DEFAULT_SETS = 3;
const DEFAULT_REPS = 8;
const MAX_TARGET = 99;

const clamp = (n: number) => Math.min(MAX_TARGET, Math.max(1, n));

/** What the editor opens with: an existing routine, a finished session's exercises, or nothing. */
const loadInitial = (routineId?: string, fromSessionId?: string): { name: string; items: RoutineItem[] } => {
  if (routineId) {
    const routine = getRoutine(routineId);
    if (routine) return { name: routine.name, items: routine.items };
  }
  if (fromSessionId) {
    const session = getSessionById(fromSessionId);
    const active = new Set(getExercises().map((e) => e.id));
    const items = routineFromSets(applySetEvents(getSessionEvents(fromSessionId))).filter((item) =>
      active.has(item.exerciseId)
    );
    return { name: session?.title?.trim() ?? '', items };
  }
  return { name: '', items: [] };
};

/**
 * One routine: a name and an ordered list of exercises, each with target sets and reps. Nothing
 * is written until Save, so backing out discards the edits.
 */
export const RoutineEditScreen = ({ navigation, route }: Props) => {
  const routineId = route.params?.routineId;
  const fromSessionId = route.params?.fromSessionId;
  const { colors, typography } = useTheme();
  const styles = useMemo(() => createStyles(colors, typography), [colors, typography]);
  const [initial] = useState(() => loadInitial(routineId, fromSessionId));
  const [name, setName] = useState(initial.name);
  const [items, setItems] = useState<RoutineItem[]>(initial.items);
  const [exercises, setExercises] = useState<ExerciseRow[]>(() => getExercises());
  const [categories, setCategories] = useState<ExerciseCategoryRow[]>(() => getCategories());
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  // Coming back from Categories may have added one.
  useFocusEffect(useCallback(() => setCategories(getCategories()), []));

  const [historySessions] = useState(() => getCompletedSessions('strength'));
  const usage = useMemo(() => {
    const byKey = new Map(buildExerciseList(historySessions).map((e) => [e.key, e]));
    const map = new Map<string, ExerciseUsage>();
    exercises.forEach((exercise) => {
      const found = byKey.get(exercise.id) ?? byKey.get(exerciseKeyFor({ exerciseName: exercise.name }));
      if (found) map.set(exercise.id, { lastSet: found.lastSet, lastAt: found.lastAt });
    });
    return map;
  }, [historySessions, exercises]);

  const nameFor = (exerciseId: string) => exercises.find((e) => e.id === exerciseId)?.name ?? 'Exercise';

  const updateItem = (index: number, patch: Partial<RoutineItem>) =>
    setItems((current) => current.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  const moveItem = (index: number, by: -1 | 1) =>
    setItems((current) => {
      const target = index + by;
      if (target < 0 || target >= current.length) return current;
      const next = current.slice();
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  const removeItem = (index: number) => setItems((current) => current.filter((_, i) => i !== index));

  const addExercise = (exerciseId: string) => {
    setItems((current) =>
      current.some((item) => item.exerciseId === exerciseId)
        ? current
        : [
            ...current,
            { exerciseId, targetSets: DEFAULT_SETS, targetReps: usage.get(exerciseId)?.lastSet.reps ?? DEFAULT_REPS },
          ]
    );
    setIsPickerOpen(false);
  };

  const handleCreateExercise = (exerciseName: string, categoryId: string | null) => {
    const created = createExercise(exerciseName, categoryId);
    setExercises(getExercises());
    addExercise(created.id);
  };

  const handleToggleFavorite = (exerciseId: string) => {
    const exercise = exercises.find((e) => e.id === exerciseId);
    if (!exercise) return;
    void Haptics.selectionAsync();
    setExerciseFavorite(exerciseId, exercise.favorite !== 1);
    setExercises(getExercises());
  };

  const handleSetCategory = (exerciseId: string, categoryId: string | null) => {
    setExerciseCategory(exerciseId, categoryId);
    setExercises(getExercises());
  };

  const handleRenameExercise = (exerciseId: string, newName: string): string | null => {
    try {
      renameExercise(exerciseId, newName);
      setExercises(getExercises());
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : "Couldn't rename it.";
    }
  };

  // See StrengthSessionScreen.handleManageCategories for the delay.
  const handleManageCategories = () => {
    setIsPickerOpen(false);
    setTimeout(() => navigation.navigate('Categories'), 350);
  };

  const handleSave = () => {
    if (items.length === 0) {
      showDialog('No exercises yet', 'Add at least one exercise to the routine.');
      return;
    }
    try {
      if (routineId && getRoutine(routineId)) {
        updateRoutine(routineId, name, items);
      } else {
        createRoutine(name, items);
      }
    } catch (error) {
      showDialog("Couldn't save it", error instanceof Error ? error.message : 'Try again.');
      return;
    }
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    navigation.goBack();
  };

  const smallButton = (label: string, onPress: () => void, accessibilityLabel: string, disabled = false) => (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.smallButton, pressed ? styles.pressed : null, disabled ? styles.disabled : null]}
    >
      <Text style={styles.smallButtonText}>{label}</Text>
    </Pressable>
  );

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.root}>
      <View style={styles.header}>
        <ScreenHeader
          eyebrow="Routine"
          title={routineId ? 'Edit routine' : 'New routine'}
          onClose={() => navigation.goBack()}
        />
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Name, e.g. Push day"
          placeholderTextColor={colors.textMuted}
          returnKeyType="done"
          style={styles.nameInput}
          accessibilityLabel="Routine name"
        />

        <View>
          <ListSectionHeader title="Exercises" />
          {items.length > 0 ? (
            <ListGroup>
              {items.map((item, index) => (
                <View key={item.exerciseId} style={[styles.item, index > 0 ? styles.itemDivided : null]}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemName} numberOfLines={1}>
                      {nameFor(item.exerciseId)}
                    </Text>
                    {smallButton('↑', () => moveItem(index, -1), `Move ${nameFor(item.exerciseId)} up`, index === 0)}
                    {smallButton(
                      '↓',
                      () => moveItem(index, 1),
                      `Move ${nameFor(item.exerciseId)} down`,
                      index === items.length - 1
                    )}
                    <Pressable
                      onPress={() => removeItem(index)}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${nameFor(item.exerciseId)}`}
                    >
                      <Text style={styles.remove}>Remove</Text>
                    </Pressable>
                  </View>
                  <View style={styles.targets}>
                    <View style={styles.target}>
                      <Text style={styles.targetLabel}>Sets</Text>
                      <Stepper
                        compact
                        value={String(item.targetSets)}
                        onIncrement={() => updateItem(index, { targetSets: clamp(item.targetSets + 1) })}
                        onDecrement={() => updateItem(index, { targetSets: clamp(item.targetSets - 1) })}
                      />
                    </View>
                    <View style={styles.target}>
                      <Text style={styles.targetLabel}>Reps</Text>
                      <Stepper
                        compact
                        value={String(item.targetReps)}
                        onIncrement={() => updateItem(index, { targetReps: clamp(item.targetReps + 1) })}
                        onDecrement={() => updateItem(index, { targetReps: clamp(item.targetReps - 1) })}
                      />
                    </View>
                  </View>
                </View>
              ))}
            </ListGroup>
          ) : (
            <Text style={styles.empty}>Add the exercises in the order you do them.</Text>
          )}
        </View>

        <Button label="+ Exercise" variant="secondary" onPress={() => setIsPickerOpen(true)} />
        <Button label="Save routine" onPress={handleSave} disabled={!name.trim()} />
      </ScrollView>

      <ExercisePickerSheet
        visible={isPickerOpen}
        exercises={exercises}
        categories={categories}
        usage={usage}
        sessionSets={new Map()}
        onPick={addExercise}
        onCreate={handleCreateExercise}
        onToggleFavorite={handleToggleFavorite}
        onSetCategory={handleSetCategory}
        onRename={handleRenameExercise}
        onManageCategories={handleManageCategories}
        onClose={() => setIsPickerOpen(false)}
      />
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: spacing.sm,
      paddingTop: spacing.sm,
    },
    content: {
      paddingHorizontal: spacing.sm,
      paddingBottom: spacing.xl,
      gap: spacing.md,
    },
    nameInput: {
      ...font('medium'),
      fontSize: 18,
      color: colors.textPrimary,
      minHeight: 48,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    empty: {
      ...typography.bodyMuted,
      paddingHorizontal: spacing.xxs,
    },
    item: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.s,
      gap: spacing.xs,
    },
    itemDivided: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    itemHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    itemName: {
      ...typography.body,
      flex: 1,
    },
    smallButton: {
      width: 32,
      height: 32,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.fill,
    },
    smallButtonText: {
      ...font('medium'),
      fontSize: 16,
      color: colors.textPrimary,
    },
    pressed: {
      opacity: 0.6,
    },
    disabled: {
      opacity: 0.3,
    },
    remove: {
      ...font('medium'),
      fontSize: 14,
      color: colors.danger,
      marginLeft: spacing.xxs,
    },
    targets: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    target: {
      flex: 1,
      gap: spacing.xxs,
    },
    targetLabel: {
      ...font('medium'),
      fontSize: 12,
      color: colors.textMuted,
    },
  });
