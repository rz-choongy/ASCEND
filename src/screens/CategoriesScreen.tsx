import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import {
  countExercisesInCategory,
  createCategory,
  deleteCategory,
  getCategories,
  renameCategory,
} from '../domain/exerciseStore';
import type { ExerciseCategoryRow } from '../domain/types';
import type { RootStackScreenProps } from '../navigation/types';
import {
  Button,
  ListGroup,
  ListRow,
  ListSectionHeader,
  ScreenHeader,
  font,
  radius,
  spacing,
  useTheme,
  type Shadows,
} from '../ui';
import type { ThemeColors } from '../ui/tokens/colors';
import type { Typography } from '../ui/tokens/typography';

type Props = RootStackScreenProps<'Categories'>;

const countLabel = (n: number) => `${n} ${n === 1 ? 'exercise' : 'exercises'}`;

/**
 * The built-in categories are fixed; the user's own can be added, renamed
 * (tap) and removed. Removing one leaves its exercises uncategorised.
 */
export const CategoriesScreen = ({ navigation }: Props) => {
  const { colors, typography, shadows } = useTheme();
  const styles = useMemo(() => createStyles(colors, typography, shadows), [colors, typography, shadows]);
  const [categories, setCategories] = useState<ExerciseCategoryRow[]>([]);
  const [counts, setCounts] = useState<Map<string, number>>(new Map());
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const reload = useCallback(() => {
    const rows = getCategories();
    setCategories(rows);
    setCounts(new Map(rows.map((row) => [row.id, countExercisesInCategory(row.id)])));
  }, []);

  useFocusEffect(reload);

  const builtins = categories.filter((c) => c.builtin === 1);
  const custom = categories.filter((c) => c.builtin !== 1);

  const handleAdd = () => {
    if (!newName.trim()) return;
    const existing = categories.find((c) => c.name.toLowerCase() === newName.trim().toLowerCase());
    if (existing) {
      Alert.alert('Already there', `You already have a category called ${existing.name}.`);
      return;
    }
    createCategory(newName);
    setNewName('');
    reload();
  };

  const startEditing = (category: ExerciseCategoryRow) => {
    setEditingId(category.id);
    setEditingName(category.name);
  };

  const saveEditing = () => {
    if (!editingId) return;
    try {
      if (editingName.trim()) renameCategory(editingId, editingName);
      setEditingId(null);
      reload();
    } catch (error) {
      Alert.alert("Couldn't rename", error instanceof Error ? error.message : 'Try a different name.');
    }
  };

  const confirmDelete = (category: ExerciseCategoryRow) => {
    const n = counts.get(category.id) ?? 0;
    Alert.alert(
      `Remove ${category.name}?`,
      n > 0 ? `Its ${countLabel(n)} will become uncategorised.` : 'No exercises are in it.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            deleteCategory(category.id);
            if (editingId === category.id) setEditingId(null);
            reload();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.root}>
      <View style={styles.header}>
        <ScreenHeader eyebrow="Strength" title="Exercise categories" onClose={() => navigation.goBack()} />
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View>
          <ListSectionHeader title="Your categories" />
          {custom.length > 0 ? (
            <ListGroup>
              {custom.map((category) =>
                editingId === category.id ? (
                  <View key={category.id} style={styles.editRow}>
                    <TextInput
                      value={editingName}
                      onChangeText={setEditingName}
                      onSubmitEditing={saveEditing}
                      autoFocus
                      selectTextOnFocus
                      returnKeyType="done"
                      style={styles.editInput}
                      accessibilityLabel={`Rename ${category.name}`}
                    />
                    <Button label="Save" variant="plain" onPress={saveEditing} style={styles.inlineButton} />
                  </View>
                ) : (
                  <ListRow
                    key={category.id}
                    title={category.name}
                    subtitle={`${countLabel(counts.get(category.id) ?? 0)} · tap to rename`}
                    onPress={() => startEditing(category)}
                    right={
                      <Pressable
                        onPress={() => confirmDelete(category)}
                        hitSlop={10}
                        accessibilityRole="button"
                        accessibilityLabel={`Remove ${category.name}`}
                      >
                        <Text style={styles.remove}>Remove</Text>
                      </Pressable>
                    }
                  />
                )
              )}
            </ListGroup>
          ) : (
            <Text style={styles.empty}>
              None yet. Add one below — say, Antagonist or Warm-up — then file exercises under it from the exercise
              picker.
            </Text>
          )}
        </View>

        <View style={styles.addCard}>
          <TextInput
            value={newName}
            onChangeText={setNewName}
            onSubmitEditing={handleAdd}
            placeholder="New category"
            placeholderTextColor={colors.textMuted}
            returnKeyType="done"
            style={styles.addInput}
            accessibilityLabel="New category name"
          />
          <Button label="Add" onPress={handleAdd} disabled={!newName.trim()} style={styles.addButton} />
        </View>

        <View>
          <ListSectionHeader title="Built-in" />
          <ListGroup>
            {builtins.map((category) => (
              <ListRow key={category.id} title={category.name} meta={countLabel(counts.get(category.id) ?? 0)} />
            ))}
          </ListGroup>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors, typography: Typography, shadows: Shadows) =>
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
    editRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      minHeight: 52,
      paddingLeft: spacing.sm,
      paddingRight: spacing.xs,
    },
    editInput: {
      ...typography.body,
      flex: 1,
      paddingVertical: 0,
      borderBottomWidth: 2,
      borderBottomColor: colors.action,
    },
    inlineButton: {
      minHeight: 40,
      paddingHorizontal: spacing.s,
    },
    addCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      padding: spacing.xs,
      paddingLeft: spacing.sm,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      ...shadows.card,
    },
    addInput: {
      ...font('regular'),
      flex: 1,
      fontSize: 16,
      color: colors.textPrimary,
      minHeight: 44,
      paddingVertical: 0,
    },
    addButton: {
      minHeight: 40,
      paddingHorizontal: spacing.sm,
    },
  });
