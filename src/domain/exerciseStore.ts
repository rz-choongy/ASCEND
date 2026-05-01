import * as Crypto from 'expo-crypto';
import { getAll, getFirst, run } from '../db/db';
import type { ExerciseRow } from './types';

export type { ExerciseRow } from './types';

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

export const createExercise = (name: string): ExerciseRow => {
  ensureDefaultExercisesSeeded();
  const normalizedName = normalizeExerciseName(name);
  const existing = getFirst<ExerciseRow>(
    'SELECT * FROM exercises WHERE lower(name) = lower(?) LIMIT 1;',
    [normalizedName]
  );

  if (existing) {
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
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?);`,
    [exerciseId, normalizedName, sortOrder, 1, timestamp, timestamp]
  );

  const created = getFirst<ExerciseRow>('SELECT * FROM exercises WHERE id = ? LIMIT 1;', [
    exerciseId,
  ]);
  if (!created) {
    throw new Error('Exercise could not be created.');
  }
  return created;
};
