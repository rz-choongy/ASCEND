jest.mock('../db/db', () => ({
  getAll: jest.fn(),
  getFirst: jest.fn(),
  run: jest.fn(),
}));

let mockUuidCount = 0;
jest.mock('expo-crypto', () => ({ randomUUID: () => `id-${++mockUuidCount}` }));

import { getAll, getFirst, run } from '../db/db';
import { createRoutine, deleteRoutine, getRoutine, updateRoutine } from './routineStore';

const mockGetAll = getAll as jest.Mock;
const mockGetFirst = getFirst as jest.Mock;
const mockRun = run as jest.Mock;

const routineRow = (id: string, name: string) => ({
  id,
  name,
  sort_order: 0,
  active: 1,
  created_at: 1,
  updated_at: 1,
});

const insertedItems = () =>
  mockRun.mock.calls
    .filter(([sql]) => String(sql).includes('INSERT INTO routine_exercises'))
    .map(([, params]) => params);

beforeEach(() => {
  mockUuidCount = 0;
  mockGetAll.mockReset();
  mockGetFirst.mockReset();
  mockRun.mockReset();
});

describe('createRoutine', () => {
  it('inserts the routine after the last one, then its exercises in order', () => {
    mockGetFirst.mockReturnValueOnce(null).mockReturnValueOnce({ max_sort_order: 2 });
    const id = createRoutine('  Push day ', [
      { exerciseId: 'bench', targetSets: 3, targetReps: 8 },
      { exerciseId: 'dips', targetSets: 0, targetReps: 10.4 },
    ]);
    expect(id).toBe('id-1');
    expect(mockRun).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO routines'), [
      'id-1',
      'Push day',
      3,
      expect.any(Number),
      expect.any(Number),
    ]);
    // Targets are clamped to whole numbers of at least one.
    expect(insertedItems()).toEqual([
      ['id-2', 'id-1', 'bench', 0, 3, 8],
      ['id-3', 'id-1', 'dips', 1, 1, 10],
    ]);
  });

  it('rejects a blank name', () => {
    expect(() => createRoutine('  ', [])).toThrow('Routine name is required.');
    expect(mockRun).not.toHaveBeenCalled();
  });

  it('rejects a name already in use, ignoring case', () => {
    mockGetFirst.mockReturnValueOnce(routineRow('r1', 'Push Day'));
    expect(() => createRoutine('push day', [])).toThrow('You already have a routine called "Push Day".');
    expect(mockRun).not.toHaveBeenCalled();
  });
});

describe('updateRoutine', () => {
  it('renames and replaces the exercise list in one go', () => {
    mockGetFirst.mockReturnValueOnce(null);
    updateRoutine('r1', 'Pull day', [{ exerciseId: 'row', targetSets: 4, targetReps: 6 }]);
    expect(mockGetFirst).toHaveBeenCalledWith(expect.stringContaining('id != ?'), ['Pull day', 'r1']);
    expect(mockRun).toHaveBeenCalledWith(expect.stringContaining('UPDATE routines SET name'), [
      'Pull day',
      expect.any(Number),
      'r1',
    ]);
    expect(mockRun).toHaveBeenCalledWith('DELETE FROM routine_exercises WHERE routine_id = ?;', ['r1']);
    expect(insertedItems()).toEqual([['id-1', 'r1', 'row', 0, 4, 6]]);
  });
});

describe('getRoutine', () => {
  it('returns the routine with its exercises in order', () => {
    mockGetFirst.mockReturnValueOnce(routineRow('r1', 'Legs'));
    mockGetAll.mockReturnValueOnce([
      { id: 'a', routine_id: 'r1', exercise_id: 'squat', sort_order: 0, target_sets: 5, target_reps: 5 },
    ]);
    expect(getRoutine('r1')).toEqual({
      id: 'r1',
      name: 'Legs',
      items: [{ exerciseId: 'squat', targetSets: 5, targetReps: 5 }],
    });
  });

  it('returns null for a deleted or missing routine', () => {
    mockGetFirst.mockReturnValueOnce(null);
    expect(getRoutine('gone')).toBeNull();
  });
});

describe('deleteRoutine', () => {
  it('soft-deletes', () => {
    deleteRoutine('r1');
    expect(mockRun).toHaveBeenCalledWith(expect.stringContaining('SET active = 0'), [expect.any(Number), 'r1']);
  });
});
