import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
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
  deleteGym,
  getGradeOptionsForGym,
  getGymById,
  getGyms,
  setGymLogoDomain,
  setGymLogoImage,
  setSelectedClimbGym,
  updateGym,
} from '../domain/gymStore';
import * as ImagePicker from 'expo-image-picker';
import { gymLogoUrl, searchLogoCandidates, shareGymLogos, type LogoCandidate } from '../domain/gymLogo';
import { setSessionGymId } from '../domain/sessionStore';
import type { RootStackScreenProps } from '../navigation/types';
import {
  Button,
  IconButton,
  PressableScale,
  CloseIcon,
  GymLogo,
  SegmentedControl,
  Stepper,
  font,
  radius,
  showDialog,
  spacing,
  useTheme,
  type Shadows,
} from '../ui';
import type { ThemeColors } from '../ui/tokens/colors';
import type { Typography } from '../ui/tokens/typography';

type GymEditScreenProps = RootStackScreenProps<'GymEdit'>;

type GradingType = 'v_scale' | 'numeric' | 'color';

type EditableGradeRow = {
  draftId: string;
  /** Saved grade option id; kept so edits update the row instead of replacing it. */
  id?: string;
  label: string;
  colorHex: string;
  gradeMin: string;
  gradeMax: string;
};

type GradeRowFields = Omit<EditableGradeRow, 'draftId' | 'id'>;

const TYPE_OPTIONS: { value: GradingType; label: string }[] = [
  { value: 'v_scale', label: 'V-scale' },
  { value: 'numeric', label: 'Numeric' },
  { value: 'color', label: 'Colour' },
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
    .map((grade): EditableGradeRow | null => {
      if (!grade || typeof grade !== 'object') return null;
      const value = grade as {
        id?: unknown;
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
        id: typeof value.id === 'string' ? value.id : undefined,
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

/** Compares what the user can change, ignoring draft ids, to spot unsaved edits. */
const snapshotForm = (
  name: string,
  gradingType: GradingType,
  rows: EditableGradeRow[],
  logoDomain: string | null = null,
  logoImage: string | null = null
): string =>
  JSON.stringify({
    name: name.trim(),
    gradingType,
    logoDomain,
    logoImage,
    rows: rows.map(({ draftId: _draftId, ...fields }) => fields),
  });

const findDuplicateLabel = (labels: string[]): string | null => {
  const seen = new Set<string>();
  for (const label of labels) {
    const key = label.toLowerCase();
    if (seen.has(key)) return label;
    seen.add(key);
  }
  return null;
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
  const { colors, typography, shadows } = useTheme();
  const styles = useMemo(() => createStyles(colors, typography, shadows), [colors, typography, shadows]);
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
  // One grade at a time shows its V steppers; the rest stay one compact line.
  const [openRangeId, setOpenRangeId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  // null = not chosen (looked up automatically later), '' = no logo, otherwise a website.
  const [logoDomain, setLogoDomain] = useState<string | null>(null);
  // A logo picked from photos, for gyms with none online. Wins over logoDomain.
  const [logoImage, setLogoImage] = useState<string | null>(null);
  const [logoCandidates, setLogoCandidates] = useState<LogoCandidate[]>([]);
  const [logoSearch, setLogoSearch] = useState<'idle' | 'searching' | 'offline'>('idle');
  // Plain ref, not state: guards against a second tap firing before React
  // re-renders with the disabled button, since handleSave runs synchronously.
  const isSavingRef = useRef(false);
  // Form state as loaded, so closing can warn about unsaved edits.
  const initialSnapshotRef = useRef(snapshotForm(name, gradingType, rows));
  // Set right before a save or delete navigates away, so the guard lets it through.
  const allowLeaveRef = useRef(false);
  const latestSnapshot = snapshotForm(name, gradingType, rows, logoDomain, logoImage);
  const latestSnapshotRef = useRef(latestSnapshot);
  latestSnapshotRef.current = latestSnapshot;

  useEffect(() => {
    if (!editingGymId || !editingGym) return;
    const existingRows = normalizeGradeRows(getGradeOptionsForGym(editingGymId));
    const loadedRows =
      existingRows.length > 0 ? existingRows : seedRowsForType(editingGym.grading_type);
    setName(editingGym.name);
    setRows(loadedRows);
    setGradingType(editingGym.grading_type);
    setLogoDomain(editingGym.logo_domain ?? null);
    setLogoImage(editingGym.logo_image ?? null);
    initialSnapshotRef.current = snapshotForm(
      editingGym.name,
      editingGym.grading_type,
      loadedRows,
      editingGym.logo_domain ?? null,
      editingGym.logo_image ?? null
    );
  }, [editingGym, editingGymId]);

  // Logo suggestions follow the name as it's typed.
  useEffect(() => {
    const query = name.trim();
    if (parentId || editingGym?.parent_id || query.length < 2) {
      setLogoCandidates([]);
      setLogoSearch('idle');
      return;
    }
    let active = true;
    setLogoSearch('searching');
    const timer = setTimeout(() => {
      searchLogoCandidates(query)
        .then((found) => {
          if (!active) return;
          setLogoCandidates(found.slice(0, 4));
          setLogoSearch('idle');
        })
        .catch(() => {
          if (active) setLogoSearch('offline');
        });
    }, 400);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [name, parentId, editingGym?.parent_id]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (allowLeaveRef.current) return;
      if (latestSnapshotRef.current === initialSnapshotRef.current) return;
      e.preventDefault();
      showDialog('Discard changes?', 'Your edits to this gym haven’t been saved.', [
        { text: 'Keep editing', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            allowLeaveRef.current = true;
            navigation.dispatch(e.data.action);
          },
        },
      ]);
    });
    return unsubscribe;
  }, [navigation]);

  const chooseLogoPhoto = async () => {
    // System photo picker: needs no permission. Small and square, since it lives in the database.
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.25,
      base64: true,
    });
    const asset = result.canceled ? null : result.assets[0];
    if (!asset?.base64) return;
    setLogoImage(`data:${asset.mimeType ?? 'image/jpeg'};base64,${asset.base64}`);
    // Stop the automatic search from replacing it later.
    if (!logoDomain) setLogoDomain('');
  };

  const removeLogo = () => {
    setLogoImage(null);
    setLogoDomain('');
  };

  const replaceTypeRows = (nextType: GradingType) => {
    setGradingType(nextType);
    setRows(seedRowsForType(nextType));
  };

  const updateType = (nextType: GradingType) => {
    if (nextType === gradingType) return;
    if (!rowsMatchSeed(rows, gradingType)) {
      showDialog(
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
    setRows((current) => {
      // Continue the scale from the last row instead of restarting at the row count.
      const last = current[current.length - 1];
      const lastMax = last ? toNumber(last.gradeMax, current.length - 1) : -1;
      const nextMin = gradingType === 'color' ? Math.max(lastMax, 0) : lastMax + 1;
      const nextMax = gradingType === 'color' ? nextMin + 1 : nextMin;
      return [
        ...current,
        {
          draftId: createDraftRowId(),
          label: gradingType === 'v_scale' ? `V${nextMin}` : `Grade ${current.length + 1}`,
          colorHex: colors.gradePalette[current.length % colors.gradePalette.length],
          gradeMin: `${nextMin}`,
          gradeMax: `${nextMax}`,
        },
      ];
    });
  };

  // Typed values: keep digits only. Min/max order is fixed on save.
  const typeGradeBound = (index: number, field: 'gradeMin' | 'gradeMax' | 'both', text: string) => {
    const digits = text.replace(/[^0-9]/g, '');
    updateRow(index, field === 'both' ? { gradeMin: digits, gradeMax: digits } : { [field]: digits });
  };

  const adjustBothBounds = (index: number, delta: number) => {
    setRows((current) =>
      current.map((row, rowIndex) => {
        if (rowIndex !== index) return row;
        const next = `${Math.max(0, toNumber(row.gradeMin, 0) + delta)}`;
        return { ...row, gradeMin: next, gradeMax: next };
      })
    );
  };

  // Swap with the neighbour above (-1) or below (+1). Save writes sort order from list
  // position, and ids travel with the row, so logged climbs are unaffected.
  const moveRow = (index: number, delta: -1 | 1) => {
    setRows((current) => {
      const target = index + delta;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const removeRow = (index: number) => {
    if (rows.length <= 1) {
      showDialog('At least one grade required', 'A gym needs at least one grade — add another before removing this one.');
      return;
    }
    const row = rows[index];
    showDialog(`Delete ${row.label || 'this grade'}?`, 'This removes it from the gym’s grade list.', [
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

  const leave = () => {
    allowLeaveRef.current = true;
    navigation.goBack();
  };

  // Only used after creating a gym: a new gym becomes the selected one.
  const navigateAfterSave = (gymId: string) => {
    allowLeaveRef.current = true;
    setSelectedClimbGym(gymId);
    if (returnToSessionId) {
      const changed = setSessionGymId(returnToSessionId, gymId);
      if (!changed) {
        showDialog(
          'Gym locked for this session',
          'Finish this climbing session before switching gyms. Your changes were saved.'
        );
        navigation.popTo('ClimbLogger', { sessionId: returnToSessionId });
        return;
      }
      navigation.popTo('ClimbLogger', { sessionId: returnToSessionId, gymId });
      return;
    }
    // GymEdit is always pushed directly from GymSelect — goBack() returns to
    // that exact instance instead of navigate(), which could otherwise stack
    // a second GymSelect screen and leave Close bouncing between the two.
    navigation.goBack();
  };

  const branchCount = (gymId: string): number =>
    getGyms().filter((gym) => gym.parent_id === gymId).length;

  const handleDelete = () => {
    if (!editingGym) return;
    const count = isBranchMode ? 0 : branchCount(editingGym.id);
    const branchWarning =
      count > 0 ? ` This also removes its ${count} branch${count === 1 ? '' : 'es'}.` : '';
    const noun = isBranchMode ? 'branch' : 'gym';
    showDialog(
      `Delete ${editingGym.name}?`,
      `This removes the ${noun} and its grade list.${branchWarning} Logged sessions keep their history.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            try {
              deleteGym(editingGym.id);
              leave();
            } catch (e) {
              showDialog('Can’t delete this gym', e instanceof Error ? e.message : 'Something went wrong.');
            }
          },
        },
      ]
    );
  };

  const handleSave = () => {
    if (isSavingRef.current) return;
    const trimmedName = name.trim();
    if (!trimmedName) return;

    isSavingRef.current = true;
    setIsSaving(true);
    try {
      // ── Branch mode: name-only save ──────────────────────────────────────
      if (isBranchMode) {
        if (editingGymId) {
          // Rename existing branch — updateGym skips grade changes for branches
          updateGym({ id: editingGymId, name: trimmedName, gradingType, gradeOptions: [] });
          leave();
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

      // ── Full gym mode: validate grades ───────────────────────────────────
      const gradeOptions = rows.map((row, index) => {
        const min = toNumber(row.gradeMin === '' ? 'x' : row.gradeMin, index);
        const max = toNumber(row.gradeMax === '' ? 'x' : row.gradeMax, min);
        return {
          id: row.id,
          label: row.label.trim(),
          gradeMin: Math.min(min, max),
          gradeMax: Math.max(min, max),
          colorHex: row.colorHex.trim() || null,
          sortOrder: index,
        };
      });

      if (gradeOptions.length === 0) {
        showDialog('Add at least one grade', 'Each gym needs at least one grade before saving.');
        return;
      }

      // A blank label used to be dropped silently, deleting the grade.
      if (gradeOptions.some((option) => option.label.length === 0)) {
        showDialog('Name every grade', 'One grade has no label. Give it a name, or remove it with ×.');
        return;
      }

      // Climbs and stats match grades by label, so two "Blue" rows would mix up.
      const duplicate = findDuplicateLabel(gradeOptions.map((option) => option.label));
      if (duplicate) {
        showDialog('Two grades share a name', `“${duplicate}” is used twice. Give each grade its own label.`);
        return;
      }

      if (editingGymId) {
        updateGym({
          id: editingGymId,
          name: trimmedName || editingGym?.name || 'Climbing Gym',
          gradingType,
          gradeOptions,
        });
        if (logoDomain !== (editingGym?.logo_domain ?? null)) {
          setGymLogoDomain(editingGymId, logoDomain);
        }
        if (logoImage !== (editingGym?.logo_image ?? null)) {
          setGymLogoImage(editingGymId, logoImage);
        }
        void shareGymLogos(new Set([editingGymId]));
        // Editing a gym shouldn't switch the selected gym or the live session to it.
        leave();
        return;
      }

      const created = createGym({ name: trimmedName, gradingType, gradeOptions, makeSelected: true, logoDomain, logoImage });
      const gymId = getCreatedGymId(created);
      if (!gymId) return;
      void shareGymLogos(new Set([gymId]));
      navigateAfterSave(gymId);
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  };

  const renderHeader = (eyebrow: string, title: string, left?: ReactNode) => (
    <View style={styles.header}>
      <View style={styles.headerText}>
        {left}
        <Text style={styles.eyebrow} numberOfLines={1}>
          {eyebrow}
        </Text>
        <Text style={styles.screenTitle} numberOfLines={1}>
          {title}
        </Text>
      </View>
      <IconButton onPress={() => navigation.goBack()} accessibilityLabel="Close">
        <CloseIcon size={16} color={colors.textPrimary} />
      </IconButton>
    </View>
  );

  // ─── Branch mode: name-only UI ─────────────────────────────────────────────
  if (isBranchMode) {
    const eyebrow = parentGym?.name ?? 'Company';
    const title = editingGym ? 'Rename branch' : 'New branch';
    return (
      <SafeAreaView edges={['top']} style={styles.screen}>
        {renderHeader(eyebrow, title)}

        <KeyboardAvoidingView
          style={styles.keyboardAvoider}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
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
              disabled={!name.trim() || isSaving}
            />
            {editingGym ? (
              <Pressable onPress={handleDelete} hitSlop={8} style={styles.deleteLink}>
                <Text style={styles.deleteLinkText}>Delete branch</Text>
              </Pressable>
            ) : null}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ─── Full gym edit / create mode ──────────────────────────────────────────
  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      {renderHeader(editingGym ? editingGym.name : 'New gym', editingGym ? 'Edit grades' : 'Climb grades')}

      <KeyboardAvoidingView
        style={styles.keyboardAvoider}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Gym name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Boulder Lab"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          autoFocus={!editingGym}
        />

        <Text style={styles.label}>Logo</Text>
        <View style={styles.logoList}>
          {logoImage || logoDomain ? (
            <View style={[styles.logoRow, styles.logoRowSelected]}>
              <GymLogo uri={logoImage ?? gymLogoUrl(logoDomain ?? '')} name={name} size={32} />
              <Text style={styles.logoRowText} numberOfLines={1}>
                {logoImage ? (logoImage.startsWith('data:') ? 'From your photos' : 'Shared photo') : logoDomain}
              </Text>
              <Pressable onPress={removeLogo} hitSlop={8}>
                <Text style={styles.logoAction}>Remove</Text>
              </Pressable>
            </View>
          ) : null}
          {logoCandidates
            .filter((candidate) =>
              candidate.imageUrl ? candidate.imageUrl !== logoImage : logoImage || candidate.domain !== logoDomain
            )
            .map((candidate) => (
              <PressableScale
                key={candidate.imageUrl ?? candidate.domain}
                style={styles.logoRow}
                onPress={() => {
                  setLogoImage(candidate.imageUrl ?? null);
                  setLogoDomain(candidate.imageUrl ? '' : candidate.domain);
                }}
                scaleTo={0.98}
              >
                <GymLogo uri={candidate.imageUrl ?? gymLogoUrl(candidate.domain)} name={candidate.name} size={32} />
                <View style={styles.logoRowTextCol}>
                  <Text style={styles.logoRowText} numberOfLines={1}>
                    {candidate.source === 'shared' ? 'Used by other climbers' : candidate.name}
                  </Text>
                  <Text style={styles.logoRowMeta} numberOfLines={1}>
                    {candidate.imageUrl ? 'Shared photo' : candidate.domain}
                  </Text>
                </View>
                <Text style={styles.logoAction}>Use</Text>
              </PressableScale>
            ))}
          {!logoImage && !logoDomain && logoCandidates.length === 0 ? (
            <Text style={styles.logoHint}>
              {logoSearch === 'searching'
                ? 'Looking for a logo…'
                : logoSearch === 'offline'
                  ? 'Can’t search for logos offline.'
                  : name.trim().length < 2
                    ? 'Type the gym’s name to find its logo.'
                    : 'No logo found online. Choose one from your photos, like a screenshot of their Instagram.'}
            </Text>
          ) : null}
          <Pressable onPress={() => void chooseLogoPhoto()} hitSlop={8} style={styles.logoPhotoLink}>
            <Text style={styles.logoAction}>{logoImage ? 'Choose another photo' : 'Choose from photos'}</Text>
          </Pressable>
          <Text style={styles.logoHint}>Logos you set are shared with other climbers who add this gym.</Text>
        </View>

        <Text style={styles.label}>Grading type</Text>
        <SegmentedControl options={TYPE_OPTIONS} value={gradingType} onChange={updateType} />

        <View style={styles.gradeHeader}>
          <Text style={styles.label}>Grades at this gym</Text>
          <Pressable onPress={addRow} hitSlop={10}>
            <Text style={styles.addRowText}>+ Add grade</Text>
          </Pressable>
        </View>

        <View style={styles.gradeList}>
        {rows.map((row, index) => {
          const swatchColor = row.colorHex || colors.border;
          // V-Scale grades are their own V. Numeric and colour grades map to a V range, so they always
          // show both ends and any row can widen or narrow it.
          const isSingleValue = gradingType === 'v_scale' && row.gradeMin === row.gradeMax;
          const rangeOpen = openRangeId === row.draftId;
          const rangeText =
            row.gradeMin === row.gradeMax ? `V${row.gradeMin}` : `V${row.gradeMin}–${row.gradeMax}`;
          return (
            <View key={row.draftId} style={[styles.gradeRow, index > 0 ? styles.gradeRowDivider : null]}>
              {gradingType === 'color' ? (
                <View style={styles.moveColumn}>
                  <IconButton
                    variant="bare"
                    size={26}
                    hitSlop={4}
                    disabled={index === 0}
                    onPress={() => moveRow(index, -1)}
                    accessibilityLabel={`Move ${row.label || 'grade'} up`}
                  >
                    <Text style={[styles.moveGlyph, index === 0 ? styles.moveGlyphDisabled : null]}>▲</Text>
                  </IconButton>
                  <IconButton
                    variant="bare"
                    size={26}
                    hitSlop={4}
                    disabled={index === rows.length - 1}
                    onPress={() => moveRow(index, 1)}
                    accessibilityLabel={`Move ${row.label || 'grade'} down`}
                  >
                    <Text
                      style={[styles.moveGlyph, index === rows.length - 1 ? styles.moveGlyphDisabled : null]}
                    >
                      ▼
                    </Text>
                  </IconButton>
                </View>
              ) : null}
              {/* The tape colour as a small dot beside the grade; tap it to change the colour. */}
              <PressableScale
                onPress={() => setColorPickerIndex(index)}
                scaleTo={0.9}
                style={styles.swatchTarget}
                accessibilityLabel={`Change colour of ${row.label || 'grade'}`}
              >
                <View style={[styles.currentSwatch, { backgroundColor: swatchColor }]} />
              </PressableScale>
              <TextInput
                value={row.label}
                onChangeText={(value) => updateRow(index, { label: value })}
                placeholder="Label"
                placeholderTextColor={colors.textMuted}
                style={styles.gradeLabelInput}
              />
              {/* Tap the V value to open its steppers below the row. */}
              <PressableScale
                onPress={() => setOpenRangeId(rangeOpen ? null : row.draftId)}
                scaleTo={0.95}
                accessibilityLabel={`${row.label || 'Grade'} covers ${rangeText}. Change`}
                style={[styles.rangePill, rangeOpen ? styles.rangePillOpen : null]}
              >
                <Text style={[styles.rangePillText, rangeOpen ? styles.rangePillTextOpen : null]}>{rangeText}</Text>
              </PressableScale>
              <IconButton
                onPress={() => removeRow(index)}
                accessibilityLabel={`Remove ${row.label || 'grade'}`}
                hitSlop={8}
              >
                <Text style={styles.deleteGlyph}>×</Text>
              </IconButton>
              {rangeOpen && isSingleValue ? (
                // V-scale grades are one V: a single stepper sets both bounds.
                <View style={[styles.rangeGroup, styles.rangeGroupFull]}>
                  <Text style={styles.rangeDash}>V</Text>
                  <Stepper
                    compact
                    value={row.gradeMin}
                    editable={{
                      text: row.gradeMin,
                      onChangeText: (text) => typeGradeBound(index, 'both', text),
                      keyboardType: 'numeric',
                    }}
                    onDecrement={() => adjustBothBounds(index, -1)}
                    onIncrement={() => adjustBothBounds(index, 1)}
                  />
                </View>
              ) : null}
              {rangeOpen && !isSingleValue ? (
                <View style={[styles.rangeGroup, styles.rangeGroupFull]}>
                  <Text style={styles.rangeDash}>V</Text>
                  <Stepper
                    compact
                    value={row.gradeMin}
                    editable={{
                      text: row.gradeMin,
                      onChangeText: (text) => typeGradeBound(index, 'gradeMin', text),
                      keyboardType: 'numeric',
                    }}
                    onDecrement={() => adjustGradeBound(index, 'gradeMin', -1)}
                    onIncrement={() => adjustGradeBound(index, 'gradeMin', 1)}
                  />
                  <Text style={styles.rangeDash}>–</Text>
                  <Stepper
                    compact
                    value={row.gradeMax}
                    editable={{
                      text: row.gradeMax,
                      onChangeText: (text) => typeGradeBound(index, 'gradeMax', text),
                      keyboardType: 'numeric',
                    }}
                    onDecrement={() => adjustGradeBound(index, 'gradeMax', -1)}
                    onIncrement={() => adjustGradeBound(index, 'gradeMax', 1)}
                  />
                </View>
              ) : null}
            </View>
          );
        })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label="Save gym"
          onPress={handleSave}
          disabled={!name.trim() || isSaving}
        />
        {editingGym ? (
          <View style={styles.footerLinks}>
            {/* Without this, a gym's first branch could never be created: the branch
                list (and its Add branch button) only opens once a gym has branches. */}
            <Pressable
              onPress={() => navigation.push('GymEdit', { parentId: editingGym.id })}
              hitSlop={8}
              style={styles.deleteLink}
            >
              <Text style={styles.addRowText}>Add a branch</Text>
            </Pressable>
            {!editingGym.is_default ? (
              <Pressable onPress={handleDelete} hitSlop={8} style={styles.deleteLink}>
                <Text style={styles.deleteLinkText}>Delete gym</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>
      </KeyboardAvoidingView>

      <Modal
        transparent
        animationType="fade"
        visible={colorPickerIndex !== null}
        onRequestClose={() => setColorPickerIndex(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setColorPickerIndex(null)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>Grade colour</Text>
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
                    accessibilityLabel={`Use colour ${color}`}
                  />
                );
              })}
            </View>
            <Button label="Close" variant="ghost" onPress={() => setColorPickerIndex(null)} />
          </Pressable>
        </Pressable>
      </Modal>
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
  // Left-aligned display title with its context line above and a close circle on the right.
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.s,
    marginBottom: spacing.sm,
  },
  headerText: {
    flex: 1,
  },
  eyebrow: {
    ...typography.meta,
    marginBottom: 2,
  },
  screenTitle: {
    ...typography.display,
  },
  keyboardAvoider: {
    flex: 1,
  },
  content: {
    gap: spacing.xs,
    paddingBottom: spacing.lg,
  },
  label: {
    ...typography.section,
    marginTop: spacing.xs,
  },
  logoList: {
    gap: spacing.xxs,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 48,
    borderRadius: radius.md,
    backgroundColor: colors.fill,
    paddingHorizontal: spacing.xs,
  },
  logoRowSelected: {
    backgroundColor: colors.accentMuted,
  },
  logoRowTextCol: {
    flex: 1,
  },
  logoRowText: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
    ...font('medium'),
  },
  logoRowMeta: {
    color: colors.textSecondary,
    fontSize: 12,
    ...font('regular'),
  },
  logoAction: {
    color: colors.accentInk,
    fontSize: 14,
    ...font('semibold'),
  },
  logoPhotoLink: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xxs,
  },
  logoHint: {
    color: colors.textMuted,
    fontSize: 13,
    ...font('regular'),
  },
  // Filled text field, no outline -- how iOS draws an input inside a form.
  input: {
    minHeight: 44,
    borderRadius: radius.md,
    backgroundColor: colors.fill,
    color: colors.textPrimary,
    paddingHorizontal: spacing.s,
    fontSize: 14,
    ...font('regular'),
  },
  gradeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  addRowText: {
    color: colors.accentInk,
    fontSize: 14,
    ...font('medium'),
  },
  // All grades share one card, split by hairlines, one line each.
  gradeList: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    ...shadows.card,
    overflow: 'hidden',
  },
  gradeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 48,
    paddingVertical: 2,
    paddingHorizontal: spacing.xs,
  },
  gradeRowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  rangePill: {
    minWidth: 64,
    minHeight: 34,
    paddingHorizontal: spacing.s,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rangePillOpen: {
    backgroundColor: colors.textPrimary,
  },
  rangePillText: {
    ...font('semibold'),
    fontSize: 15,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  rangePillTextOpen: {
    color: colors.background,
  },
  // The grade label reads as the grade itself: display type on the card, no filled field.
  gradeLabelInput: {
    // A small basis so the stepper and delete share the line on narrow phones.
    flexBasis: 64,
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 56,
    minHeight: 40,
    paddingHorizontal: spacing.xxs,
    color: colors.textPrimary,
    ...font('display'),
    fontSize: 20,
  },
  rangeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  // Colour bands: label, swatch and delete on top, the V range on its own line below.
  rangeGroupFull: {
    flexBasis: '100%',
    justifyContent: 'center',
    paddingBottom: spacing.xs,
  },
  rangeDash: {
    color: colors.textMuted,
    fontSize: 14,
    ...font('medium'),
  },
  swatchTarget: {
    width: 32,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentSwatch: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSoft,
  },
  moveColumn: {
    gap: 2,
  },
  moveGlyph: {
    color: colors.textSecondary,
    fontSize: 11,
    ...font('medium'),
  },
  moveGlyphDisabled: {
    color: colors.border,
  },
  deleteGlyph: {
    color: colors.textMuted,
    fontSize: 15,
    ...font('medium'),
    lineHeight: 20,
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
    backgroundColor: colors.surface,
    ...shadows.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  modalTitle: {
    ...typography.title,
    fontSize: 18,
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
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorGridSwatchSelected: {
    borderColor: colors.textPrimary,
  },
  footer: {
    paddingTop: spacing.xs,
    gap: spacing.xs,
  },
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  deleteLink: {
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteLinkText: {
    color: colors.danger,
    fontSize: 15,
    ...font('regular'),
  },
  inheritedNotice: {
    flexDirection: 'row',
    gap: spacing.xs,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    ...shadows.card,
    padding: spacing.sm,
    marginTop: spacing.xs,
  },
  inheritedIcon: {
    color: colors.accentInk,
    fontSize: 16,
    ...font('bold'),
    lineHeight: 22,
  },
  inheritedText: {
    flex: 1,
    gap: 4,
  },
  inheritedTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    ...font('semibold'),
  },
  inheritedBody: {
    color: colors.textSecondary,
    fontSize: 14,
    ...font('regular'),
    lineHeight: 19,
  },
});
