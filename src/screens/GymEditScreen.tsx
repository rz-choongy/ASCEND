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
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  createGym,
  defaultOptionsForType,
  getGradeOptionsForGym,
  getGymById,
  getGyms,
  setSelectedClimbGym,
  updateGym,
} from '../domain/gymStore';
import { setSessionGymId } from '../domain/sessionStore';
import type { RootStackScreenProps } from '../navigation/types';
import {
  Button,
  PressableScale,
  ScreenHeader,
  Stepper,
  getContrastText,
  radius,
  spacing,
  useTheme,
} from '../ui';
import type { ThemeColors } from '../ui/tokens/colors';
import type { Typography } from '../ui/tokens/typography';

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

const seedRowFieldsForType = (type: GradingType): GradeRowFields[] =>
  defaultOptionsForType(type).map((option) => ({
    label: option.label,
    colorHex: option.colorHex ?? option.color_hex ?? '',
    gradeMin: `${option.gradeMin ?? option.grade_min ?? 0}`,
    gradeMax: `${option.gradeMax ?? option.grade_max ?? 0}`,
  }));

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
  const { colors, typography } = useTheme();
  const styles = useMemo(() => createStyles(colors, typography), [colors, typography]);
  const returnToSessionId = route.params?.returnToSessionId;
  const editingGymId = route.params?.gymId;
  const parentId = route.params?.parentId ?? null;

  const editingGym = useMemo(() => {
    if (!editingGymId) return null;
    return getGyms().find((gym) => gym.id === editingGymId) ?? null;
  }, [editingGymId]);

  /** Resolved parent gym — either from route param (new branch) or editing gym's parent */
  const parentGym = useMemo(() => {
    const resolvedParentId = parentId ?? editingGym?.parent_id ?? null;
    if (!resolvedParentId) return null;
    return getGymById(resolvedParentId) ?? null;
  }, [parentId, editingGym]);

  /** True when this screen is in branch mode (creating or editing a branch) */
  const isBranchMode = parentGym !== null;
  const [name, setName] = useState('');
  const [gradingType, setGradingType] = useState<GradingType>('v_scale');
  const [rows, setRows] = useState<EditableGradeRow[]>(seedRowsForType('v_scale'));
  const [colorPickerIndex, setColorPickerIndex] = useState<number | null>(null);

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

  const removeRow = (index: number) => {
    if (rows.length <= 1) {
      Alert.alert('At least one grade required', 'A gym needs at least one grade — add another before removing this one.');
      return;
    }
    const row = rows[index];
    Alert.alert(`Delete ${row.label || 'this grade'}?`, 'This removes it from the gym’s grade list.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => setRows((current) => current.filter((_, i) => i !== index)),
      },
    ]);
  };

  const adjustGradeBound = (index: number, field: 'gradeMin' | 'gradeMax', delta: number) => {
    setRows((current) =>
      current.map((row, rowIndex) => {
        if (rowIndex !== index) return row;
        const proposed = Math.max(0, toNumber(row[field], 0) + delta);
        const otherField = field === 'gradeMin' ? 'gradeMax' : 'gradeMin';
        const otherValue = toNumber(row[otherField], 0);
        // Keep min <= max: decrementing max can't pass min, incrementing min can't pass max.
        const next =
          field === 'gradeMin' ? Math.min(proposed, otherValue) : Math.max(proposed, otherValue);
        return { ...row, [field]: `${next}` };
      })
    );
  };

  const navigateAfterSave = (gymId: string) => {
    setSelectedClimbGym(gymId);
    if (returnToSessionId) {
      const changed = setSessionGymId(returnToSessionId, gymId);
      if (!changed) {
        Alert.alert(
          'Gym locked for this session',
          'Finish this climbing session before switching gyms. Your changes were saved.'
        );
        navigation.navigate('ClimbLogger', { sessionId: returnToSessionId });
        return;
      }
      navigation.navigate('ClimbLogger', { sessionId: returnToSessionId, gymId });
      return;
    }
    navigation.navigate('GymSelect');
  };

  const handleSave = () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    // ── Branch mode: name-only save ────────────────────────────────────────
    if (isBranchMode) {
      if (editingGymId) {
        // Rename existing branch — updateGym skips grade changes for branches
        updateGym({ id: editingGymId, name: trimmedName, gradingType, gradeOptions: [] });
        navigation.navigate('GymSelect');
        return;
      }
      // Create new branch
      const resolvedParentId = parentId ?? editingGym?.parent_id ?? null;
      if (!resolvedParentId) return;
      const created = createGym({ name: trimmedName, parentId: resolvedParentId, makeSelected: true });
      const gymId = getCreatedGymId(created);
      if (!gymId) return;
      navigateAfterSave(gymId);
      return;
    }

    // ── Full gym mode: validate grades ─────────────────────────────────────
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
      navigateAfterSave(editingGymId);
      return;
    }

    const created = createGym({ name: trimmedName, gradingType, gradeOptions, makeSelected: true });
    const gymId = getCreatedGymId(created);
    if (!gymId) return;
    navigateAfterSave(gymId);
  };

  // ─── Branch mode: name-only UI ─────────────────────────────────────────────
  if (isBranchMode) {
    const eyebrow = parentGym?.name ?? 'Company';
    const title = editingGym ? 'Rename branch' : 'New branch';
    return (
      <SafeAreaView edges={['top']} style={styles.screen}>
        <ScreenHeader eyebrow={eyebrow} title={title} onClose={() => navigation.goBack()} />

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Branch name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="City Road"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            autoFocus
          />

          <View style={styles.inheritedNotice}>
            <Text style={styles.inheritedIcon}>↗</Text>
            <View style={styles.inheritedText}>
              <Text style={styles.inheritedTitle}>Grade system inherited</Text>
              <Text style={styles.inheritedBody}>
                This branch uses the grades defined on {parentGym?.name ?? 'the parent gym'}.
                To change grades, edit the parent gym.
              </Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            label={editingGym ? 'Save branch' : 'Add branch'}
            onPress={handleSave}
            disabled={!name.trim()}
          />
        </View>
      </SafeAreaView>
    );
  }

  // ─── Full gym edit / create mode ──────────────────────────────────────────
  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <ScreenHeader
        eyebrow={editingGym ? editingGym.name : 'New gym'}
        title={editingGym ? 'Edit grades' : 'Climb grades'}
        onClose={() => navigation.goBack()}
      />

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
              <PressableScale
                key={option.value}
                style={[styles.typeChip, selected ? styles.typeChipSelected : null]}
                onPress={() => updateType(option.value)}
                scaleTo={0.94}
              >
                <Text style={[styles.typeText, selected ? styles.typeTextSelected : null]}>
                  {option.label}
                </Text>
              </PressableScale>
            );
          })}
        </View>

        <View style={styles.gradeHeader}>
          <Text style={styles.label}>Grades at this gym</Text>
          <Pressable onPress={addRow} hitSlop={10}>
            <Text style={styles.addRowText}>+ Add grade</Text>
          </Pressable>
        </View>

        {rows.map((row, index) => {
          const swatchColor = row.colorHex || colors.border;
          return (
            <View key={row.draftId} style={styles.gradeCard}>
              <View style={styles.gradeTopRow}>
                <TextInput
                  value={row.label}
                  onChangeText={(value) => updateRow(index, { label: value })}
                  placeholder="Label"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.input, styles.labelInput]}
                />
                <View style={[styles.previewChip, { backgroundColor: swatchColor }]}>
                  <Text
                    style={[styles.previewChipText, { color: getContrastText(swatchColor) }]}
                    numberOfLines={1}
                  >
                    {row.label || '—'}
                  </Text>
                </View>
                <PressableScale
                  onPress={() => removeRow(index)}
                  scaleTo={0.88}
                  style={styles.deleteButton}
                >
                  <Text style={styles.deleteGlyph}>×</Text>
                </PressableScale>
              </View>

              <View style={styles.gradeBottomRow}>
                <View style={styles.rangeGroup}>
                  <Text style={styles.rangeLabel}>Min</Text>
                  <Stepper
                    compact
                    value={row.gradeMin}
                    onDecrement={() => adjustGradeBound(index, 'gradeMin', -1)}
                    onIncrement={() => adjustGradeBound(index, 'gradeMin', 1)}
                    onBigDecrement={() => adjustGradeBound(index, 'gradeMin', -5)}
                    onBigIncrement={() => adjustGradeBound(index, 'gradeMin', 5)}
                    bigStepLabel="5"
                  />
                </View>
                <View style={styles.rangeGroup}>
                  <Text style={styles.rangeLabel}>Max</Text>
                  <Stepper
                    compact
                    value={row.gradeMax}
                    onDecrement={() => adjustGradeBound(index, 'gradeMax', -1)}
                    onIncrement={() => adjustGradeBound(index, 'gradeMax', 1)}
                    onBigDecrement={() => adjustGradeBound(index, 'gradeMax', -5)}
                    onBigIncrement={() => adjustGradeBound(index, 'gradeMax', 5)}
                    bigStepLabel="5"
                  />
                </View>
                <PressableScale
                  onPress={() => setColorPickerIndex(index)}
                  scaleTo={0.9}
                  style={[styles.currentSwatch, { backgroundColor: swatchColor }]}
                />
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label="Save gym"
          onPress={handleSave}
          disabled={!editingGym && !name.trim()}
        />
      </View>

      {colorPickerIndex !== null ? (
        <Pressable
          style={[styles.modalBackdrop, styles.modalOverlay]}
          onPress={() => setColorPickerIndex(null)}
        >
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>Grade color</Text>
            <View style={styles.colorGrid}>
              {GRADE_COLOR_OPTIONS.map((color) => {
                const selected =
                  colorPickerIndex !== null &&
                  rows[colorPickerIndex]?.colorHex.toLowerCase() === color.toLowerCase();
                return (
                  <PressableScale
                    key={color}
                    scaleTo={0.9}
                    onPress={() => {
                      if (colorPickerIndex !== null) {
                        updateRow(colorPickerIndex, { colorHex: color });
                      }
                      setColorPickerIndex(null);
                    }}
                    style={[
                      styles.colorGridSwatch,
                      { backgroundColor: color },
                      selected ? styles.colorGridSwatchSelected : null,
                    ]}
                    accessibilityLabel={`Use color ${color}`}
                  />
                );
              })}
            </View>
            <Button label="Close" variant="ghost" onPress={() => setColorPickerIndex(null)} />
          </Pressable>
        </Pressable>
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
  gradeCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
    padding: spacing.xs,
    gap: spacing.xs,
  },
  gradeTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  labelInput: {
    flex: 1,
  },
  previewChip: {
    minWidth: 52,
    height: 40,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  previewChipText: {
    fontSize: 12,
    fontWeight: '800',
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteGlyph: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 18,
  },
  gradeBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  rangeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rangeLabel: {
    ...typography.meta,
    color: colors.textMuted,
  },
  currentSwatch: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    marginLeft: 'auto',
  },
  modalBackdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.overlay,
    padding: spacing.md,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    elevation: 20,
    zIndex: 20,
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
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  colorGridSwatch: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorGridSwatchSelected: {
    borderColor: colors.textPrimary,
  },
  footer: {
    paddingTop: spacing.xs,
  },
  inheritedNotice: {
    flexDirection: 'row',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    padding: spacing.sm,
    marginTop: spacing.xs,
  },
  inheritedIcon: {
    color: colors.accent,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
  },
  inheritedText: {
    flex: 1,
    gap: 4,
  },
  inheritedTitle: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  inheritedBody: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
});
