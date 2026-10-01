import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { deleteRoutine, getRoutines, type RoutineSummary } from '../domain/routineStore';
import type { RootStackScreenProps } from '../navigation/types';
import { Button, ListGroup, ListRow, ScreenHeader, font, showDialog, spacing, useTheme } from '../ui';
import type { ThemeColors } from '../ui/tokens/colors';
import type { Typography } from '../ui/tokens/typography';

type Props = RootStackScreenProps<'Routines'>;

const countLabel = (n: number) => `${n} ${n === 1 ? 'exercise' : 'exercises'}`;

/** Saved gym workouts. Tap one to edit it; pick one on the Start card to log from it. */
export const RoutinesScreen = ({ navigation }: Props) => {
  const { colors, typography } = useTheme();
  const styles = useMemo(() => createStyles(colors, typography), [colors, typography]);
  const [routines, setRoutines] = useState<RoutineSummary[]>([]);

  const reload = useCallback(() => setRoutines(getRoutines()), []);
  useFocusEffect(reload);

  const confirmDelete = (routine: RoutineSummary) => {
    showDialog(`Delete ${routine.name}?`, 'Sessions you already logged from it are kept.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteRoutine(routine.id);
          reload();
        },
      },
    ]);
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.root}>
      <View style={styles.header}>
        <ScreenHeader eyebrow="Strength" title="Routines" onClose={() => navigation.goBack()} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {routines.length > 0 ? (
          <ListGroup>
            {routines.map((routine) => (
              <ListRow
                key={routine.id}
                title={routine.name}
                subtitle={countLabel(routine.exercise_count)}
                onPress={() => navigation.navigate('RoutineEdit', { routineId: routine.id })}
                right={
                  <Pressable
                    onPress={() => confirmDelete(routine)}
                    hitSlop={10}
                    accessibilityRole="button"
                    accessibilityLabel={`Delete ${routine.name}`}
                  >
                    <Text style={styles.remove}>Delete</Text>
                  </Pressable>
                }
              />
            ))}
          </ListGroup>
        ) : (
          <Text style={styles.empty}>
            None yet. Save the exercises you always do, like a push day, then pick it on the Start card to have them
            lined up with your target sets and reps.
          </Text>
        )}
        <Button label="New routine" onPress={() => navigation.navigate('RoutineEdit')} />
      </ScrollView>
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
    empty: {
      ...typography.bodyMuted,
      paddingHorizontal: spacing.xxs,
    },
    remove: {
      ...font('medium'),
      fontSize: 14,
      color: colors.danger,
    },
  });
