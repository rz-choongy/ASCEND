import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  createGym,
  getGradeOptionsForGym,
  getGyms,
  setSelectedClimbGym,
  updateGym,
} from '../domain/gymStore';
import { setSessionGymId } from '../domain/sessionStore';
import type { RootStackScreenProps } from '../navigation/types';
import { Button, colors, radius, spacing, typography } from '../ui';

type GymEditScreenProps = RootStackScreenProps<'GymEdit'>;

type GradingType = 'v_scale' | 'numeric' | 'color';

type EditableGradeRow = {
  draftId: string;
  label: string;
  colorHex: string;
  gradeMin: string;
  gradeMax: string;
};

type GradeRowFields = Omit<EditableGradeRow, 'draftId'>;

const TYPE_OPTIONS: { value: GradingType; label: string }[] = [
  { value: 'v_scale', label: 'V-Scale' },
  { value: 'numeric', label: 'Numeric' },
  { value: 'color', label: 'Color' },
];

const COLOR_SEEDS = ['#f8fafc', '#facc15', '#22c55e', '#3b82f6', '#ef4444'];
const GRADE_COLOR_OPTIONS = [
  '#f8fafc',
  '#facc15',
  '#f97316',
  '#ef4444',
  '#ec4899',
  '#a855f7',
  '#6366f1',
  '#3b82f6',
  '#06b6d4',
  '#14b8a6',
  '#22c55e',
  '#84cc16',
  '#78716c',
  '#111827',
];

let draftRowCounter = 0;

const createDraftRowId = (): string => {
  draftRowCounter += 1;
  return `grade-row-${draftRowCounter}`;
};

const seedRowFieldsForType = (type: GradingType): GradeRowFields[] => {
  if (type === 'numeric') {
    return Array.from({ length: 6 }, (_, index) => {
      const grade = index + 1;
      return {
        label: `${grade}`,
        colorHex: COLOR_SEEDS[index % COLOR_SEEDS.length],
        gradeMin: `${index}`,
        gradeMax: `${index}`,
      };
    });
  }

  if (type === 'color') {
    return ['White', 'Yellow', 'Green', 'Blue', 'Red'].map((label, index) => ({
      label,
      colorHex: COLOR_SEEDS[index],
      gradeMin: `${index}`,
      gradeMax: `${index + 1}`,
    }));
  }

  return Array.from({ length: 8 }, (_, index) => ({
    label: index === 7 ? 'V7+' : `V${index}`,
    colorHex: colors.gradePalette[index % colors.gradePalette.length],
    gradeMin: `${index}`,
    gradeMax: `${index === 7 ? 10 : index}`,
  }));
};

const seedRowsForType = (type: GradingType): EditableGradeRow[] =>
  seedRowFieldsForType(type).map((row) => ({
    draftId: createDraftRowId(),
    ...row,
  }));

const getCreatedGymId = (created: unknown): string | null => {
  if (typeof created === 'string') return created;
  if (!created || typeof created !== 'object') return null;
  const value = created as { id?: unknown };
  return typeof value.id === 'string' ? value.id : null;
};

const normalizeGradeRows = (grades: unknown[]): EditableGradeRow[] => {
  return grades
    .map((grade) => {
      if (!grade || typeof grade !== 'object') return null;
      const value = grade as {
        label?: unknown;
        gradeMin?: unknown;
        gradeMax?: unknown;
        grade_min?: unknown;
        grade_max?: unknown;
        colorHex?: unknown;
        color_hex?: unknown;
        color?: unknown;
      };
      const min = value.gradeMin ?? value.grade_min;
      const max = value.gradeMax ?? value.grade_max;
      const color = value.colorHex ?? value.color_hex ?? value.color;
      if (typeof value.label !== 'string' || typeof min !== 'number' || typeof max !== 'number') {
        return null;
      }
      return {
        draftId: createDraftRowId(),
        label: value.label,
        colorHex: typeof color === 'string' ? color : '',
        gradeMin: `${min}`,
        gradeMax: `${max}`,
      };
    })
    .filter((row): row is EditableGradeRow => row !== null);
};

const toNumber = (value: string, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const rowsMatchSeed = (rows: EditableGradeRow[], type: GradingType): boolean => {
  const seedRows = seedRowFieldsForType(type);
  if (rows.length !== seedRows.length) return false;
  return rows.every((row, index) => {
    const seed = seedRows[index];
    return (
      row.label === seed.label &&
      row.colorHex.toLowerCase() === seed.colorHex.toLowerCase() &&
      row.gradeMin === seed.gradeMin &&
      row.gradeMax === seed.gradeMax
    );
  });
};

export const GymEditScreen = ({ route, navigation }: GymEditScreenProps) => {
  const returnToSessionId = route.params?.returnToSessionId;
  const editingGymId = route.params?.gymId;
  const editingGym = useMemo(() => {
    if (!editingGymId) return null;
    return getGyms().find((gym) => gym.id === editingGymId) ?? null;
  }, [editingGymId]);
  const [name, setName] = useState('');
  const [gradingType, setGradingType] = useState<GradingType>('v_scale');
  const [rows, setRows] = useState<EditableGradeRow[]>(seedRowsForType('v_scale'));

  useEffect(() => {
    if (!editingGymId || !editingGym) return;
    setName(editingGym.name);
    const existingRows = normalizeGradeRows(getGradeOptionsForGym(editingGymId));
    setRows(existingRows.length > 0 ? existingRows : seedRowsForType(editingGym.grading_type));
    setGradingType(editingGym.grading_type);
  }, [editingGym, editingGymId]);

  const replaceTypeRows = (nextType: GradingType) => {
    setGradingType(nextType);
    setRows(seedRowsForType(nextType));
  };

  const updateType = (nextType: GradingType) => {
    if (nextType === gradingType) return;
    if (!rowsMatchSeed(rows, gradingType)) {
      Alert.alert(
        'Replace grade rows?',
        'Changing grading type will reset the current grade list.',
        [
          { text: 'Keep rows', style: 'cancel' },
          {
            text: 'Replace',
            style: 'destructive',
            onPress: () => replaceTypeRows(nextType),
          },
        ]
      );
      return;
    }
    replaceTypeRows(nextType);
  };

  const updateRow = (index: number, patch: Partial<EditableGradeRow>) => {
    setRows((current) =>
      current.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row))
    );
  };

  const addRow = () => {
    setRows((current) => [
      ...current,
      {
        draftId: createDraftRowId(),
        label: `Grade ${current.length + 1}`,
        colorHex: colors.gradePalette[current.length % colors.gradePalette.length],
        gradeMin: `${current.length}`,
        gradeMax: `${current.length}`,
      },
    ]);
  };

  const handleSave = () => {
    const trimmedName = name.trim();
    if (!trimmedName && !editingGymId) return;

    const gradeOptions = rows
      .map((row, index) => ({
        label: row.label.trim(),
        gradeMin: toNumber(row.gradeMin, index),
        gradeMax: toNumber(row.gradeMax, index),
        colorHex: row.colorHex.trim() || null,
        sortOrder: index,
      }))
      .filter((row) => row.label.length > 0);

    if (gradeOptions.length === 0) {
      Alert.alert('Add at least one grade', 'Each gym needs at least one grade before saving.');
      return;
    }

    if (editingGymId) {
      updateGym({
        id: editingGymId,
        name: trimmedName || editingGym?.name || 'Climbing Gym',
        gradingType,
        gradeOptions,
      });
      setSelectedClimbGym(editingGymId);
      if (returnToSessionId) {
        const changed = setSessionGymId(returnToSessionId, editingGymId);
        if (!changed) {
          Alert.alert(
            'Gym locked for this session',
            'Finish this climbing session before switching gyms. Your grade edits were saved.'
          );
          navigation.navigate('ClimbLogger', { sessionId: returnToSessionId });
          return;
        }
        navigation.navigate('ClimbLogger', { sessionId: returnToSessionId, gymId: editingGymId });
        return;
      }
      navigation.navigate('GymSelect');
      return;
    }

    const created = createGym({ name: trimmedName, gradingType, gradeOptions, makeSelected: true });
    const gymId = getCreatedGymId(created);
    if (!gymId) return;
    setSelectedClimbGym(gymId);

    if (returnToSessionId) {
      const changed = setSessionGymId(returnToSessionId, gymId);
      if (!changed) {
        Alert.alert(
          'Gym locked for this session',
          'Finish this climbing session before switching gyms. The new gym was saved.'
        );
        navigation.navigate('ClimbLogger', { sessionId: returnToSessionId });
        return;
      }
      navigation.navigate('ClimbLogger', { sessionId: returnToSessionId, gymId });
      return;
    }
    navigation.navigate('GymSelect');
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>{editingGym ? editingGym.name : 'New gym'}</Text>
          <Text style={styles.title}>{editingGym ? 'Edit grades' : 'Climb grades'}</Text>
        </View>
        <Button
          label="Close"
          variant="ghost"
          onPress={() => navigation.goBack()}
          style={styles.closeButton}
          textStyle={styles.closeText}
        />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Gym name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Boulder Lab"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />

        <Text style={styles.label}>Grading type</Text>
        <View style={styles.typeRow}>
          {TYPE_OPTIONS.map((option) => {
            const selected = option.value === gradingType;
            return (
              <Pressable
                key={option.value}
                style={[styles.typeChip, selected ? styles.typeChipSelected : null]}
                onPress={() => updateType(option.value)}
              >
                <Text style={[styles.typeText, selected ? styles.typeTextSelected : null]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.gradeHeader}>
          <Text style={styles.label}>Grades at this gym</Text>
          <Pressable onPress={addRow}>
            <Text style={styles.addRowText}>+ Add grade</Text>
          </Pressable>
        </View>

        {rows.map((row, index) => (
          <View key={row.draftId} style={styles.gradeCard}>
            <View style={styles.gradeRow}>
              <TextInput
                value={row.label}
                onChangeText={(value) => updateRow(index, { label: value })}
                placeholder="Label"
                placeholderTextColor={colors.textMuted}
                style={[styles.input, styles.labelInput]}
              />
              <TextInput
                value={row.gradeMin}
                onChangeText={(value) => updateRow(index, { gradeMin: value })}
                keyboardType="number-pad"
                placeholder="Easy"
                placeholderTextColor={colors.textMuted}
                style={[styles.input, styles.rangeInput]}
              />
              <TextInput
                value={row.gradeMax}
                onChangeText={(value) => updateRow(index, { gradeMax: value })}
                keyboardType="number-pad"
                placeholder="Hard"
                placeholderTextColor={colors.textMuted}
                style={[styles.input, styles.rangeInput]}
              />
            </View>
            <View style={styles.colorRow}>
              <View style={[styles.currentSwatch, { backgroundColor: row.colorHex || colors.border }]} />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.paletteRow}
                keyboardShouldPersistTaps="handled"
              >
                {GRADE_COLOR_OPTIONS.map((color) => {
                  const selected = row.colorHex.toLowerCase() === color.toLowerCase();
                  return (
                    <Pressable
                      key={`${index}-${color}`}
                      onPress={() => updateRow(index, { colorHex: color })}
                      style={[
                        styles.colorSwatchButton,
                        selected ? styles.colorSwatchSelected : null,
                      ]}
                      accessibilityLabel={`Use color ${color} for ${row.label || 'grade'}`}
                    >
                      <View style={[styles.colorSwatch, { backgroundColor: color }]} />
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label="Save gym"
          onPress={handleSave}
          disabled={!editingGym && !name.trim()}
        />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  eyebrow: {
    ...typography.meta,
    color: colors.accent,
  },
  title: {
    ...typography.title,
    marginTop: 2,
  },
  closeButton: {
    minHeight: 38,
    paddingHorizontal: 12,
  },
  closeText: {
    fontSize: 10,
  },
  content: {
    gap: spacing.xs,
    paddingBottom: spacing.lg,
  },
  label: {
    ...typography.section,
    marginTop: spacing.xs,
  },
  input: {
    minHeight: 44,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  typeChip: {
    minHeight: 40,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  typeChipSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentMuted,
  },
  typeText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  typeTextSelected: {
    color: colors.textPrimary,
  },
  gradeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  addRowText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '800',
  },
  gradeRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  gradeCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
    padding: spacing.xs,
    gap: spacing.xs,
  },
  labelInput: {
    flex: 1.3,
  },
  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  currentSwatch: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  paletteRow: {
    gap: 8,
    paddingRight: spacing.sm,
  },
  colorSwatchButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorSwatchSelected: {
    borderColor: colors.textPrimary,
    backgroundColor: colors.accentSoft,
  },
  colorSwatch: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  colorInput: {
    flex: 1,
  },
  rangeInput: {
    width: 64,
    textAlign: 'center',
  },
  footer: {
    paddingTop: spacing.xs,
  },
});
