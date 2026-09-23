import * as Crypto from 'expo-crypto';
import { getAll, getFirst, run } from '../db/db';
import type { ExerciseCategoryRow, ExerciseRow } from './types';

export type { ExerciseCategoryRow, ExerciseRow } from './types';

type SortOrderRow = {
  max_sort_order: number | null;
};

const defaultExercises = [
  { id: 'exercise-pullups', name: 'Pull-ups', sortOrder: 0 },
  { id: 'exercise-pushups', name: 'Push-ups', sortOrder: 1 },
  { id: 'exercise-barbell-row', name: 'Barbell Row', sortOrder: 2 },
  { id: 'exercise-hangboard', name: 'Hangboard', sortOrder: 3 },
  { id: 'exercise-dips', name: 'Dips', sortOrder: 4 },
];

const uuid = (): string => Crypto.randomUUID();

const normalizeExerciseName = (name: string): string => {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error('Exercise name is required.');
  }
  return trimmed;
};

const ensureDefaultExercisesSeeded = (): void => {
  const timestamp = Date.now();
  defaultExercises.forEach((exercise) => {
    run(
      `INSERT OR IGNORE INTO exercises (
        id,
        name,
        sort_order,
        active,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?);`,
      [exercise.id, exercise.name, exercise.sortOrder, 1, timestamp, timestamp]
    );
  });
};

export const getExercises = (): ExerciseRow[] => {
  ensureDefaultExercisesSeeded();
  return getAll<ExerciseRow>(
    'SELECT * FROM exercises WHERE active = 1 ORDER BY sort_order ASC, name ASC;'
  );
};

export const createExercise = (name: string, categoryId: string | null = null): ExerciseRow => {
  ensureDefaultExercisesSeeded();
  const normalizedName = normalizeExerciseName(name);
  const existing = getFirst<ExerciseRow>(
    'SELECT * FROM exercises WHERE lower(name) = lower(?) LIMIT 1;',
    [normalizedName]
  );

  if (existing) {
    // Re-adding an exercise under a category fills in a missing one, never overrides a choice.
    if (categoryId && !existing.category_id) {
      run('UPDATE exercises SET category_id = ? WHERE id = ?;', [categoryId, existing.id]);
      existing.category_id = categoryId;
    }
    if (existing.active === 0) {
      const timestamp = Date.now();
      run('UPDATE exercises SET active = 1, updated_at = ? WHERE id = ?;', [timestamp, existing.id]);
      return {
        ...existing,
        active: 1,
        updated_at: timestamp,
      };
    }
    return existing;
  }

  const sortOrderRow = getFirst<SortOrderRow>('SELECT MAX(sort_order) AS max_sort_order FROM exercises;');
  const sortOrder = (sortOrderRow?.max_sort_order ?? -1) + 1;
  const timestamp = Date.now();
  const exerciseId = uuid();

  run(
    `INSERT INTO exercises (
      id,
      name,
      sort_order,
      active,
      category_id,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?);`,
    [exerciseId, normalizedName, sortOrder, 1, categoryId, timestamp, timestamp]
  );

  const created = getFirst<ExerciseRow>('SELECT * FROM exercises WHERE id = ? LIMIT 1;', [
    exerciseId,
  ]);
  if (!created) {
    throw new Error('Exercise could not be created.');
  }
  return created;
};

export const setExerciseFavorite = (exerciseId: string, favorite: boolean): void => {
  run('UPDATE exercises SET favorite = ?, updated_at = ? WHERE id = ?;', [favorite ? 1 : 0, Date.now(), exerciseId]);
};

export const setExerciseCategory = (exerciseId: string, categoryId: string | null): void => {
  run('UPDATE exercises SET category_id = ?, updated_at = ? WHERE id = ?;', [categoryId, Date.now(), exerciseId]);
};

// --- Categories -------------------------------------------------------------
// Built-ins (seeded by migration 8) come first in their fixed order, then the
// user's own in the order they were added.

export const getCategories = (): ExerciseCategoryRow[] =>
  getAll<ExerciseCategoryRow>(
    'SELECT * FROM exercise_categories ORDER BY builtin DESC, sort_order ASC, name ASC;'
  );

const normalizeCategoryName = (name: string): string => {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error('Category name is required.');
  }
  return trimmed;
};

const findCategoryByName = (name: string): ExerciseCategoryRow | null =>
  getFirst<ExerciseCategoryRow>('SELECT * FROM exercise_categories WHERE lower(name) = lower(?) LIMIT 1;', [name]);

/** Returns the existing category when the name is already taken (case-insensitive). */
export const createCategory = (name: string): ExerciseCategoryRow => {
  const normalizedName = normalizeCategoryName(name);
  const existing = findCategoryByName(normalizedName);
  if (existing) return existing;

  const sortOrderRow = getFirst<SortOrderRow>('SELECT MAX(sort_order) AS max_sort_order FROM exercise_categories;');
  const category: ExerciseCategoryRow = {
    id: uuid(),
    name: normalizedName,
    sort_order: (sortOrderRow?.max_sort_order ?? -1) + 1,
    builtin: 0,
    created_at: Date.now(),
    updated_at: Date.now(),
  };
  run(
    `INSERT INTO exercise_categories (id, name, sort_order, builtin, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?);`,
    [category.id, category.name, category.sort_order, 0, category.created_at, category.updated_at]
  );
  return category;
};

/** Custom categories only. Throws if the new name belongs to a different category. */
export const renameCategory = (categoryId: string, name: string): void => {
  const normalizedName = normalizeCategoryName(name);
  const clash = findCategoryByName(normalizedName);
  if (clash && clash.id !== categoryId) {
    throw new Error(`There's already a category called ${clash.name}.`);
  }
  run('UPDATE exercise_categories SET name = ?, updated_at = ? WHERE id = ? AND builtin = 0;', [
    normalizedName,
    Date.now(),
    categoryId,
  ]);
};

export const countExercisesInCategory = (categoryId: string): number =>
  getFirst<{ n: number }>('SELECT COUNT(*) AS n FROM exercises WHERE category_id = ? AND active = 1;', [categoryId])?.n ?? 0;

/** Custom categories only. Its exercises become uncategorised rather than disappearing. */
export const deleteCategory = (categoryId: string): void => {
  const category = getFirst<ExerciseCategoryRow>('SELECT * FROM exercise_categories WHERE id = ? LIMIT 1;', [categoryId]);
  if (!category || category.builtin === 1) return;
  run('UPDATE exercises SET category_id = NULL WHERE category_id = ?;', [categoryId]);
  run('DELETE FROM exercise_categories WHERE id = ?;', [categoryId]);
};

// --- Renaming ---------------------------------------------------------------
// Logged sets keep the name they were logged under (events are never rewritten);
// screens show the current name by looking sets up by exercise id instead.

/** Current name per exercise id, including deleted ones, for displaying logged sets. */
export const getExerciseNames = (): Map<string, string> =>
  new Map(getAll<ExerciseRow>('SELECT * FROM exercises;').map((e) => [e.id, e.name]));

/** Throws if another active exercise already has the name (case-insensitive). */
export const renameExercise = (exerciseId: string, name: string): void => {
  const normalizedName = normalizeExerciseName(name);
  const clash = getFirst<ExerciseRow>(
    'SELECT * FROM exercises WHERE lower(name) = lower(?) AND id != ? AND active = 1 LIMIT 1;',
    [normalizedName, exerciseId]
  );
  if (clash) {
    throw new Error(`You already have an exercise called ${clash.name}.`);
  }
  run('UPDATE exercises SET name = ?, updated_at = ? WHERE id = ?;', [normalizedName, Date.now(), exerciseId]);
};

/** Hides the exercise from every list; its logged sets are removed separately (exerciseData.ts). */
export const deactivateExercise = (exerciseId: string): void => {
  run('UPDATE exercises SET active = 0, favorite = 0, updated_at = ? WHERE id = ?;', [Date.now(), exerciseId]);
};
