jest.mock('../db/db', () => ({
  getAll: jest.fn(),
  getFirst: jest.fn(),
  run: jest.fn(),
}));

let mockUuidCount = 0;
jest.mock('expo-crypto', () => ({ randomUUID: () => `new-${++mockUuidCount}` }));

import { getAll, getFirst, run } from '../db/db';
import { replaceGymGradeOptions } from './gymStore';

const mockGetAll = getAll as jest.Mock;
const mockGetFirst = getFirst as jest.Mock;
const mockRun = run as jest.Mock;

const sqlCalls = (fragment: string) =>
  mockRun.mock.calls.filter(([sql]) => String(sql).includes(fragment)).map(([, params]) => params);

beforeEach(() => {
  mockUuidCount = 0;
  mockGetAll.mockReset();
  mockGetFirst.mockReset();
  mockRun.mockReset();
  mockGetFirst.mockReturnValue({ id: 'gym-1', parent_id: null, grading_type: 'color' });
  mockGetAll.mockImplementation((sql: string) =>
    sql.startsWith('SELECT id FROM gym_grade_options') ? [{ id: 'blue' }, { id: 'red' }] : []
  );
});

describe('replaceGymGradeOptions', () => {
  it('updates kept grades in place so logged climbs keep their gradeId', () => {
    replaceGymGradeOptions('gym-1', [
      { id: 'blue', label: 'Navy', gradeMin: 3, gradeMax: 5, colorHex: '#3B82F6' },
      { label: 'Purple', gradeMin: 8, gradeMax: 10, colorHex: '#A855F7' },
    ]);

    const updates = sqlCalls('UPDATE gym_grade_options');
    expect(updates).toEqual([['Navy', 3, 5, '#3B82F6', 0, expect.any(Number), 'blue']]);

    // Red was dropped from the list, so only it is deleted.
    expect(sqlCalls('DELETE FROM gym_grade_options')).toEqual([['red']]);

    const inserts = sqlCalls('INSERT INTO gym_grade_options');
    expect(inserts).toHaveLength(1);
    expect(inserts[0].slice(0, 3)).toEqual(['new-1', 'gym-1', 'Purple']);
  });

  it('never reuses an id that belongs to another gym', () => {
    replaceGymGradeOptions('gym-1', [
      { id: 'grade-default-v0', label: 'V0', gradeMin: 0, gradeMax: 0 },
    ]);
    expect(sqlCalls('UPDATE gym_grade_options')).toEqual([]);
    expect(sqlCalls('INSERT INTO gym_grade_options')[0][0]).toBe('new-1');
  });
});
