jest.mock('../db/db', () => ({
  getAll: jest.fn(),
  getFirst: jest.fn(),
  run: jest.fn(),
}));

jest.mock('expo-crypto', () => ({ randomUUID: () => 'cat-new' }));

import { getFirst, run } from '../db/db';
import {
  createCategory,
  createExercise,
  deleteCategory,
  renameCategory,
  setExerciseCategory,
  setExerciseFavorite,
} from './exerciseStore';

const mockGetFirst = getFirst as jest.Mock;
const mockRun = run as jest.Mock;

const category = (id: string, name: string, builtin = 0) => ({
  id,
  name,
  sort_order: 0,
  builtin,
  created_at: 1,
  updated_at: 1,
});

beforeEach(() => {
  mockGetFirst.mockReset();
  mockRun.mockReset();
});

describe('createCategory', () => {
  it('returns the existing category when the name is taken, ignoring case', () => {
    mockGetFirst.mockReturnValueOnce(category('cat-pull', 'Pull', 1));
    expect(createCategory('  pull ').id).toBe('cat-pull');
    expect(mockRun).not.toHaveBeenCalled();
  });

  it('inserts a custom category after the last one', () => {
    mockGetFirst.mockReturnValueOnce(null).mockReturnValueOnce({ max_sort_order: 5 });
    const created = createCategory('Antagonist');
    expect(created).toMatchObject({ id: 'cat-new', name: 'Antagonist', sort_order: 6, builtin: 0 });
    expect(mockRun).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO exercise_categories'), [
      'cat-new',
      'Antagonist',
      6,
      0,
      expect.any(Number),
      expect.any(Number),
    ]);
  });

  it('rejects a blank name', () => {
    expect(() => createCategory('   ')).toThrow();
  });
});

describe('renameCategory', () => {
  it('refuses a name another category already has', () => {
    mockGetFirst.mockReturnValueOnce(category('cat-pull', 'Pull', 1));
    expect(() => renameCategory('cat-mine', 'Pull')).toThrow(/already/);
    expect(mockRun).not.toHaveBeenCalled();
  });

  it('only ever updates custom categories', () => {
    mockGetFirst.mockReturnValueOnce(null);
    renameCategory('cat-mine', 'Antagonist');
    expect(mockRun).toHaveBeenCalledWith(expect.stringContaining('AND builtin = 0'), [
      'Antagonist',
      expect.any(Number),
      'cat-mine',
    ]);
  });
});

describe('deleteCategory', () => {
  it('uncategorises its exercises, then removes it', () => {
    mockGetFirst.mockReturnValueOnce(category('cat-mine', 'Antagonist'));
    deleteCategory('cat-mine');
    expect(mockRun.mock.calls[0]).toEqual([expect.stringContaining('SET category_id = NULL'), ['cat-mine']]);
    expect(mockRun.mock.calls[1]).toEqual([expect.stringContaining('DELETE FROM exercise_categories'), ['cat-mine']]);
  });

  it('leaves built-in categories alone', () => {
    mockGetFirst.mockReturnValueOnce(category('cat-pull', 'Pull', 1));
    deleteCategory('cat-pull');
    expect(mockRun).not.toHaveBeenCalled();
  });
});

describe('exercise flags', () => {
  it('stores favourite as 0/1', () => {
    setExerciseFavorite('ex-1', true);
    expect(mockRun).toHaveBeenCalledWith(expect.stringContaining('SET favorite = ?'), [1, expect.any(Number), 'ex-1']);
  });

  it('can clear a category', () => {
    setExerciseCategory('ex-1', null);
    expect(mockRun).toHaveBeenCalledWith(expect.stringContaining('SET category_id = ?'), [null, expect.any(Number), 'ex-1']);
  });
});

describe('createExercise', () => {
  it('files a new exercise under the given category', () => {
    // existing-by-name lookup, max sort order, then the read-back of the created row
    mockGetFirst
      .mockReturnValueOnce(null)
      .mockReturnValueOnce({ max_sort_order: 4 })
      .mockReturnValueOnce({ id: 'cat-new', name: 'Face Pulls', category_id: 'cat-pull' });
    const created = createExercise('Face Pulls', 'cat-pull');
    const insert = mockRun.mock.calls.find(([sql]) => String(sql).includes('INSERT INTO exercises ('));
    expect(insert?.[1]).toEqual(['cat-new', 'Face Pulls', 5, 1, 'cat-pull', expect.any(Number), expect.any(Number)]);
    expect(created.category_id).toBe('cat-pull');
  });
});
