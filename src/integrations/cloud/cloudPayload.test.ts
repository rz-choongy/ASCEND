jest.mock('../../domain/sessionStore', () => ({ getSessionEvents: jest.fn() }));
jest.mock('../../domain/gymStore', () => ({
  gymShortNameById: jest.fn((id: string) => (id === 'gym-1' ? 'Blochaus' : 'Default V-Scale')),
  isUnnamedDefaultGym: jest.fn((g: { name: string }) => g.name === 'Default V-Scale'),
}));
jest.mock('../../domain/routineStore', () => ({ getRoutine: jest.fn(() => ({ name: 'Pull day' })) }));

import { getSessionEvents } from '../../domain/sessionStore';
import type { SessionRow } from '../../domain/types';
import { buildBodyweightPayload, buildCloudSession, hashString } from './cloudPayload';

const mockEvents = getSessionEvents as jest.Mock;

const climbSession: SessionRow = {
  id: 's1',
  type: 'climb',
  status: 'completed',
  started_at: Date.UTC(2026, 10, 3, 9, 0),
  completed_at: Date.UTC(2026, 10, 3, 10, 30),
  title: null,
  gym_id: 'gym-1',
  notes: 'good day',
};

const climbEvent = (id: string, gradeMin: number, gradeMax: number, result: 'SEND' | 'FLASH', at: number) => ({
  id,
  type: 'CLIMB_LOGGED',
  payload: { gradeLabel: 'Blue', gradeMin, gradeMax, result },
  schemaVersion: 1,
  createdAt: at,
});

describe('buildCloudSession', () => {
  beforeEach(() => mockEvents.mockReset());

  it('summarises climbs with V ranges and results', () => {
    mockEvents.mockReturnValue([climbEvent('e1', 4, 4, 'FLASH', 1), climbEvent('e2', 3, 5, 'SEND', 2)]);
    const { row } = buildCloudSession(climbSession);
    expect(row.status).toBe('completed');
    expect(row.gym_name).toBe('Blochaus');
    expect(row.started_at).toBe('2026-11-03T09:00:00.000Z');
    expect(row.summary).toMatchObject({ v: 1, durationMs: 90 * 60000 });
    expect(row.summary.climbs).toEqual([
      { grade: 'Blue', vMin: 4, vMax: 4, result: 'flash', at: 1, name: null },
      { grade: 'Blue', vMin: 3, vMax: 5, result: 'send', at: 2, name: null },
    ]);
    expect(row.events).toHaveLength(2);
  });

  it('marks soft-deleted sessions as deleted and hides the default gym name', () => {
    mockEvents.mockReturnValue([]);
    const { row } = buildCloudSession({ ...climbSession, status: 'deleted', gym_id: 'default' });
    expect(row.status).toBe('deleted');
    expect(row.gym_name).toBeNull();
  });

  it('summarises strength sets with the routine name', () => {
    mockEvents.mockReturnValue([
      { id: 'e1', type: 'SET_LOGGED', payload: { exerciseName: 'Row', reps: 8, weight: 40, unit: 'kg' }, schemaVersion: 1, createdAt: 5 },
    ]);
    const { row } = buildCloudSession({ ...climbSession, type: 'strength', routine_id: 'r1', gym_id: null });
    expect(row.summary.routine).toBe('Pull day');
    expect(row.summary.sets).toEqual([{ exercise: 'Row', reps: 8, weight: 40, unit: 'kg', at: 5 }]);
  });

  it('changes hash when content changes, and only then', () => {
    mockEvents.mockReturnValue([climbEvent('e1', 4, 4, 'SEND', 1)]);
    const a = buildCloudSession(climbSession).hash;
    expect(buildCloudSession(climbSession).hash).toBe(a);
    expect(buildCloudSession({ ...climbSession, notes: 'edited' }).hash).not.toBe(a);
  });
});

describe('hashString and bodyweight', () => {
  it('is stable and sensitive', () => {
    expect(hashString('abc')).toBe(hashString('abc'));
    expect(hashString('abc')).not.toBe(hashString('abd'));
  });

  it('sorts bodyweight oldest first', () => {
    const { logs } = buildBodyweightPayload([
      { id: 'b', weight_kg: 70, logged_at: 20, created_at: 20 },
      { id: 'a', weight_kg: 71, logged_at: 10, created_at: 10 },
    ]);
    expect(logs.map((l) => l.id)).toEqual(['a', 'b']);
  });
});
