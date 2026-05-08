import * as Crypto from 'expo-crypto';
import { getAll, getFirst, run } from '../db/db';
import type { GymGradeOptionRow, GymGradingType, GymRow } from './types';

export type { GymGradeOptionRow, GymGradingType, GymRow } from './types';

const SELECTED_CLIMB_GYM_KEY = 'selected_climb_gym_id';
const DEFAULT_CLIMB_GYM_ID = 'gym-default-v-scale';

type AppSettingRow = {
  value: string;
};

export type CreateGymInput = {
  name: string;
  gradingType?: GymGradingType;
  grading_type?: GymGradingType;
  gradeOptions?: GymGradeOptionInput[];
  makeSelected?: boolean;
  /** If set, this gym is a branch of the given parent gym and inherits its grade system. */
  parentId?: string | null;
};

export type UpdateGymInput = {
  id: string;
  name: string;
  gradingType: GymGradingType;
  gradeOptions: GymGradeOptionInput[];
};

export type GymGradeOptionInput = {
  id?: string;
  label: string;
  gradeMin?: number;
  gradeMax?: number;
  grade_min?: number;
  grade_max?: number;
  colorHex?: string | null;
  color_hex?: string | null;
  sortOrder?: number;
  sort_order?: number;
};

type NormalizedGymGradeOption = {
  id: string;
  label: string;
  gradeMin: number;
  gradeMax: number;
  colorHex: string | null;
  sortOrder: number;
};

const uuid = (): string => Crypto.randomUUID();

const defaultVScaleGrades: GymGradeOptionInput[] = [
  { id: 'grade-default-v0', label: 'V0', gradeMin: 0, gradeMax: 0, colorHex: '#65A30D', sortOrder: 0 },
  { id: 'grade-default-v1', label: 'V1', gradeMin: 1, gradeMax: 1, colorHex: '#84CC16', sortOrder: 1 },
  { id: 'grade-default-v2', label: 'V2', gradeMin: 2, gradeMax: 2, colorHex: '#EAB308', sortOrder: 2 },
  { id: 'grade-default-v3', label: 'V3', gradeMin: 3, gradeMax: 3, colorHex: '#F97316', sortOrder: 3 },
  { id: 'grade-default-v4', label: 'V4', gradeMin: 4, gradeMax: 4, colorHex: '#EF4444', sortOrder: 4 },
  { id: 'grade-default-v5', label: 'V5', gradeMin: 5, gradeMax: 5, colorHex: '#A855F7', sortOrder: 5 },
  { id: 'grade-default-v6', label: 'V6', gradeMin: 6, gradeMax: 6, colorHex: '#3B82F6', sortOrder: 6 },
  { id: 'grade-default-v7-plus', label: 'V7+', gradeMin: 7, gradeMax: 10, colorHex: '#111827', sortOrder: 7 },
];

const defaultNumericGrades: GymGradeOptionInput[] = Array.from({ length: 10 }, (_, index) => ({
  label: `${index + 1}`,
  gradeMin: index,
  gradeMax: index,
  colorHex: null,
  sortOrder: index,
}));

const defaultColorGrades: GymGradeOptionInput[] = [
  { label: 'White', gradeMin: 0, gradeMax: 1, colorHex: '#F8FAFC', sortOrder: 0 },
  { label: 'Yellow', gradeMin: 1, gradeMax: 2, colorHex: '#FACC15', sortOrder: 1 },
  { label: 'Green', gradeMin: 2, gradeMax: 4, colorHex: '#22C55E', sortOrder: 2 },
  { label: 'Blue', gradeMin: 4, gradeMax: 6, colorHex: '#3B82F6', sortOrder: 3 },
  { label: 'Red', gradeMin: 6, gradeMax: 8, colorHex: '#EF4444', sortOrder: 4 },
  { label: 'Black', gradeMin: 8, gradeMax: 10, colorHex: '#111827', sortOrder: 5 },
];

const defaultOptionsForType = (gradingType: GymGradingType): GymGradeOptionInput[] => {
  if (gradingType === 'numeric') {
    return defaultNumericGrades;
  }
  if (gradingType === 'color') {
    return defaultColorGrades;
  }
  return defaultVScaleGrades;
};

const normalizeName = (name: string): string => {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error('Gym name is required.');
  }
  return trimmed;
};

const normalizeGradeOption = (
  option: GymGradeOptionInput,
  index: number
): NormalizedGymGradeOption => {
  const label = option.label.trim();
  if (!label) {
    throw new Error('Grade label is required.');
  }
  const rawMin = option.gradeMin ?? option.grade_min;
  const rawMax = option.gradeMax ?? option.grade_max;
  if (typeof rawMin !== 'number' || typeof rawMax !== 'number') {
    throw new Error('Grade range is required.');
  }
  if (!Number.isFinite(rawMin) || !Number.isFinite(rawMax)) {
    throw new Error('Grade range must be finite.');
  }
  const gradeMin = Math.min(rawMin, rawMax);
  const gradeMax = Math.max(rawMin, rawMax);
  return {
    id: option.id ?? uuid(),
    label,
    gradeMin,
    gradeMax,
    colorHex: option.colorHex ?? option.color_hex ?? null,
    sortOrder: option.sortOrder ?? option.sort_order ?? index,
  };
};

const setSetting = (key: string, value: string): void => {
  run(
    `INSERT INTO app_settings (key, value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at;`,
    [key, value, Date.now()]
  );
};

const insertGradeOptions = (gymId: string, options: GymGradeOptionInput[]): void => {
  const timestamp = Date.now();
  options.map(normalizeGradeOption).forEach((option) => {
    run(
      `INSERT INTO gym_grade_options (
        id,
        gym_id,
        label,
        grade_min,
        grade_max,
        color_hex,
        sort_order,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        option.id,
        gymId,
        option.label,
        option.gradeMin,
        option.gradeMax,
        option.colorHex,
        option.sortOrder,
        timestamp,
        timestamp,
      ]
    );
  });
};

const runInTransaction = (work: () => void): void => {
  run('BEGIN TRANSACTION;');
  try {
    work();
    run('COMMIT;');
  } catch (error) {
    run('ROLLBACK;');
    throw error;
  }
};

const ensureDefaultClimbGymSeeded = (): void => {
  const timestamp = Date.now();
  run(
    `INSERT OR IGNORE INTO gyms (
      id,
      name,
      grading_type,
      is_default,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?);`,
    [DEFAULT_CLIMB_GYM_ID, 'Default V-Scale', 'v_scale', 1, timestamp, timestamp]
  );
  defaultVScaleGrades.forEach((option) => {
    const normalized = normalizeGradeOption(option, option.sortOrder ?? 0);
    run(
      `INSERT OR IGNORE INTO gym_grade_options (
        id,
        gym_id,
        label,
        grade_min,
        grade_max,
        color_hex,
        sort_order,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        normalized.id,
        DEFAULT_CLIMB_GYM_ID,
        normalized.label,
        normalized.gradeMin,
        normalized.gradeMax,
        normalized.colorHex,
        normalized.sortOrder,
        timestamp,
        timestamp,
      ]
    );
  });
};

/** Returns all gyms — companies, standalone gyms, and branches. */
export const getGyms = (): GymRow[] => {
  ensureDefaultClimbGymSeeded();
  return getAll<GymRow>('SELECT * FROM gyms ORDER BY is_default DESC, name ASC;');
};

/** Returns only root-level gyms (companies + standalones) — excludes branches. */
export const getRootGyms = (): GymRow[] => {
  ensureDefaultClimbGymSeeded();
  return getAll<GymRow>(
    'SELECT * FROM gyms WHERE parent_id IS NULL ORDER BY is_default DESC, name ASC;'
  );
};

/** Returns all branches of the given parent gym, ordered by name. */
export const getBranchesForGym = (parentId: string): GymRow[] => {
  return getAll<GymRow>(
    'SELECT * FROM gyms WHERE parent_id = ? ORDER BY name ASC;',
    [parentId]
  );
};

export const getGymById = (gymId: string): GymRow | null => {
  ensureDefaultClimbGymSeeded();
  return getFirst<GymRow>('SELECT * FROM gyms WHERE id = ? LIMIT 1;', [gymId]);
};

export const getSelectedClimbGym = (): GymRow | null => {
  ensureDefaultClimbGymSeeded();
  const setting = getFirst<AppSettingRow>('SELECT value FROM app_settings WHERE key = ? LIMIT 1;', [
    SELECTED_CLIMB_GYM_KEY,
  ]);
  if (!setting) {
    return null;
  }
  return getFirst<GymRow>('SELECT * FROM gyms WHERE id = ? LIMIT 1;', [setting.value]);
};

export const setSelectedClimbGym = (gymId: string): void => {
  const gym = getFirst<GymRow>('SELECT * FROM gyms WHERE id = ? LIMIT 1;', [gymId]);
  if (!gym) {
    throw new Error('Cannot select a missing gym.');
  }
  setSetting(SELECTED_CLIMB_GYM_KEY, gymId);
};

export const ensureSelectedClimbGym = (): GymRow => {
  const selected = getSelectedClimbGym();
  if (selected) {
    return selected;
  }

  const fallback =
    getFirst<GymRow>('SELECT * FROM gyms WHERE is_default = 1 ORDER BY created_at ASC LIMIT 1;') ??
    getFirst<GymRow>('SELECT * FROM gyms ORDER BY created_at ASC LIMIT 1;');

  if (!fallback) {
    ensureDefaultClimbGymSeeded();
    const seeded = getFirst<GymRow>('SELECT * FROM gyms WHERE id = ? LIMIT 1;', [
      DEFAULT_CLIMB_GYM_ID,
    ]);
    if (!seeded) {
      throw new Error('Default climbing gym could not be created.');
    }
    setSelectedClimbGym(seeded.id);
    return seeded;
  }

  setSelectedClimbGym(fallback.id);
  return fallback;
};

export const createGym = (input: CreateGymInput): GymRow => {
  const gymId = uuid();
  const parentId = input.parentId ?? null;
  const timestamp = Date.now();

  let gradingType: GymGradingType;
  if (parentId) {
    // Branches inherit grading type from parent; no grade rows needed.
    const parent = getFirst<GymRow>('SELECT * FROM gyms WHERE id = ? LIMIT 1;', [parentId]);
    if (!parent) {
      throw new Error('Parent gym not found.');
    }
    gradingType = parent.grading_type;
  } else {
    gradingType = input.gradingType ?? input.grading_type ?? 'v_scale';
  }

  const existingDefault = getFirst<GymRow>('SELECT * FROM gyms WHERE is_default = 1 LIMIT 1;');

  run(
    `INSERT INTO gyms (
      id,
      name,
      grading_type,
      is_default,
      parent_id,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?);`,
    [gymId, normalizeName(input.name), gradingType, existingDefault ? 0 : 1, parentId, timestamp, timestamp]
  );

  // Branches have no grade rows of their own; they always resolve to parent's grades.
  if (!parentId) {
    const gradeOptions =
      input.gradeOptions && input.gradeOptions.length > 0
        ? input.gradeOptions
        : defaultOptionsForType(gradingType);
    insertGradeOptions(gymId, gradeOptions);
  }

  if (input.makeSelected) {
    setSelectedClimbGym(gymId);
  }

  const created = getFirst<GymRow>('SELECT * FROM gyms WHERE id = ? LIMIT 1;', [gymId]);
  if (!created) {
    throw new Error('Gym could not be created.');
  }
  return created;
};

export const getGradeOptionsForGym = (gymId: string): GymGradeOptionRow[] => {
  // Branches inherit grades from their parent; resolve the source gym first.
  const gym = getFirst<GymRow>('SELECT * FROM gyms WHERE id = ? LIMIT 1;', [gymId]);
  const sourceId = gym?.parent_id ?? gymId;
  return getAll<GymGradeOptionRow>(
    'SELECT * FROM gym_grade_options WHERE gym_id = ? ORDER BY sort_order ASC, created_at ASC;',
    [sourceId]
  );
};

const doReplaceGymGradeOptions = (gymId: string, options: GymGradeOptionInput[]): void => {
  run('DELETE FROM gym_grade_options WHERE gym_id = ?;', [gymId]);
  insertGradeOptions(gymId, options);
  run('UPDATE gyms SET updated_at = ? WHERE id = ?;', [Date.now(), gymId]);
};

export const replaceGymGradeOptions = (
  gymId: string,
  options: GymGradeOptionInput[]
): GymGradeOptionRow[] => {
  const gym = getFirst<GymRow>('SELECT * FROM gyms WHERE id = ? LIMIT 1;', [gymId]);
  if (!gym) {
    throw new Error('Cannot replace grades for a missing gym.');
  }
  if (options.length === 0) {
    throw new Error('A gym needs at least one grade option.');
  }

  runInTransaction(() => doReplaceGymGradeOptions(gymId, options));

  return getGradeOptionsForGym(gymId);
};

export const updateGym = (input: UpdateGymInput): GymRow => {
  const existing = getGymById(input.id);
  if (!existing) {
    throw new Error('Cannot update a missing gym.');
  }

  if (existing.parent_id) {
    // Branches: rename only — grades are always inherited from the parent.
    run('UPDATE gyms SET name = ?, updated_at = ? WHERE id = ?;', [
      normalizeName(input.name),
      Date.now(),
      input.id,
    ]);
  } else {
    if (input.gradeOptions.length === 0) {
      throw new Error('A gym needs at least one grade option.');
    }
    runInTransaction(() => {
      run('UPDATE gyms SET name = ?, grading_type = ?, updated_at = ? WHERE id = ?;', [
        normalizeName(input.name),
        input.gradingType,
        Date.now(),
        input.id,
      ]);
      doReplaceGymGradeOptions(input.id, input.gradeOptions);
    });
  }

  const updated = getGymById(input.id);
  if (!updated) {
    throw new Error('Gym could not be updated.');
  }
  return updated;
};
