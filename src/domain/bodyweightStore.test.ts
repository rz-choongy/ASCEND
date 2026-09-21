jest.mock('../db/db', () => ({
  getAll: jest.fn(),
  getFirst: jest.fn(),
  run: jest.fn(),
}));

jest.mock('expo-crypto', () => ({ randomUUID: () => 'bw-1' }));

import { getAll, getFirst, run } from '../db/db';
import { deleteBodyweightLog, getBodyweightLogs, getLatestBodyweight, logBodyweight } from './bodyweightStore';

const mockGetAll = getAll as jest.Mock;
const mockGetFirst = getFirst as jest.Mock;
const mockRun = run as jest.Mock;

beforeEach(() => {
  mockGetAll.mockReset();
  mockGetFirst.mockReset();
  mockRun.mockReset();
});

describe('logBodyweight', () => {
  it('inserts a row and returns it', () => {
    const entry = logBodyweight(72.5, 1000);
    expect(mockRun).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO bodyweight_logs'),
      ['bw-1', 72.5, 1000, expect.any(Number)]
    );
    expect(entry).toMatchObject({ id: 'bw-1', weight_kg: 72.5, logged_at: 1000 });
  });

  it('rejects a non-positive weight', () => {
    expect(() => logBodyweight(0)).toThrow();
    expect(() => logBodyweight(-5)).toThrow();
    expect(mockRun).not.toHaveBeenCalled();
  });
});

describe('getBodyweightLogs', () => {
  it('queries without a limit by default', () => {
    mockGetAll.mockReturnValue([]);
    getBodyweightLogs();
    expect(mockGetAll).toHaveBeenCalledWith(expect.stringContaining('ORDER BY logged_at DESC'), []);
  });

  it('applies a limit when given one', () => {
    mockGetAll.mockReturnValue([]);
    getBodyweightLogs(5);
    expect(mockGetAll).toHaveBeenCalledWith(expect.stringContaining('LIMIT ?'), [5]);
  });
});

describe('getLatestBodyweight', () => {
  it('returns the most recent row, or null', () => {
    mockGetFirst.mockReturnValue(null);
    expect(getLatestBodyweight()).toBeNull();

    const row = { id: 'bw-1', weight_kg: 70, logged_at: 1, created_at: 1 };
    mockGetFirst.mockReturnValue(row);
    expect(getLatestBodyweight()).toEqual(row);
  });
});

describe('deleteBodyweightLog', () => {
  it('deletes by id', () => {
    deleteBodyweightLog('bw-1');
    expect(mockRun).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM bodyweight_logs'), ['bw-1']);
  });
});
