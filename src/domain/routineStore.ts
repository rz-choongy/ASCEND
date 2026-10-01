import * as Crypto from 'expo-crypto';
import { getAll, getFirst, run } from '../db/db';
import type { RoutineExerciseRow, RoutineRow } from './types';

export type { RoutineExerciseRow, RoutineRow } from './types';

/** One exercise in a routine, in the shape the editor and logger use. */
export type RoutineItem = {
  exerciseId: string;
  targetSets: number;
  targetReps: number;
};

export type Routine = {
  id: string;
  name: string;
  items: RoutineItem[];
};

export type RoutineSummary = RoutineRow & { exercise_count: number };

const uuid = (): string => Crypto.randomUUID();

const normalizeRoutineName = (name: string): string => {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error('Routine name is required.');
  }
  return trimmed;
};

/** Targets are whole numbers of at least one; anything else is a typo, not a plan. */
const clampTarget = (value: number): number => Math.max(1, Math.round(value) || 1);

const assertNameFree = (name: string, exceptId: string | null): void => {
  const taken = getFirst<RoutineRow>(
    'SELECT * FROM routines WHERE active = 1 AND lower(name) = lower(?) AND id != ? LIMIT 1;',
    [name, exceptId ?? '']
  );
  if (taken) {
    throw new Error(`You already have a routine called "${taken.name}".`);
  }
};

const writeItems = (routineId: string, items: RoutineItem[]): void => {
  run('DELETE FROM routine_exercises WHERE routine_id = ?;', [routineId]);
  items.forEach((item, index) => {
    run(
      `INSERT INTO routine_exercises (id, routine_id, exercise_id, sort_order, target_sets, target_reps)
       VALUES (?, ?, ?, ?, ?, ?);`,
      [uuid(), routineId, item.exerciseId, index, clampTarget(item.targetSets), clampTarget(item.targetReps)]
    );
  });
};

/** Active routines in the order they were made, each with how many (still active) exercises it holds. */
export const getRoutines = (): RoutineSummary[] =>
  getAll<RoutineSummary>(
    `SELECT r.*, (
       SELECT COUNT(*) FROM routine_exercises re
       JOIN exercises e ON e.id = re.exercise_id AND e.active = 1
       WHERE re.routine_id = r.id
     ) AS exercise_count
     FROM routines r WHERE r.active = 1 ORDER BY r.sort_order ASC, r.name ASC;`
  );

/** A routine with its exercises in order. Exercises deleted since are skipped. Null if it's gone. */
export const getRoutine = (routineId: string): Routine | null => {
  const row = getFirst<RoutineRow>('SELECT * FROM routines WHERE id = ? AND active = 1 LIMIT 1;', [routineId]);
  if (!row) return null;
  const items = getAll<RoutineExerciseRow>(
    `SELECT re.* FROM routine_exercises re
     JOIN exercises e ON e.id = re.exercise_id AND e.active = 1
     WHERE re.routine_id = ? ORDER BY re.sort_order ASC;`,
    [routineId]
  );
  return {
    id: row.id,
    name: row.name,
    items: items.map((item) => ({
      exerciseId: item.exercise_id,
      targetSets: item.target_sets,
      targetReps: item.target_reps,
    })),
  };
};

export const createRoutine = (name: string, items: RoutineItem[]): string => {
  const normalizedName = normalizeRoutineName(name);
  assertNameFree(normalizedName, null);
  const sortOrderRow = getFirst<{ max_sort_order: number | null }>(
    'SELECT MAX(sort_order) AS max_sort_order FROM routines;'
  );
  const routineId = uuid();
  const timestamp = Date.now();
  run(
    `INSERT INTO routines (id, name, sort_order, active, created_at, updated_at)
     VALUES (?, ?, ?, 1, ?, ?);`,
    [routineId, normalizedName, (sortOrderRow?.max_sort_order ?? -1) + 1, timestamp, timestamp]
  );
  writeItems(routineId, items);
  return routineId;
};

/** Saves the editor's whole state at once: the name and the full ordered exercise list. */
export const updateRoutine = (routineId: string, name: string, items: RoutineItem[]): void => {
  const normalizedName = normalizeRoutineName(name);
  assertNameFree(normalizedName, routineId);
  run('UPDATE routines SET name = ?, updated_at = ? WHERE id = ?;', [normalizedName, Date.now(), routineId]);
  writeItems(routineId, items);
};

/** Soft delete: sessions started from it keep their routine_id, they just stop finding it. */
export const deleteRoutine = (routineId: string): void => {
  run('UPDATE routines SET active = 0, updated_at = ? WHERE id = ?;', [Date.now(), routineId]);
};
