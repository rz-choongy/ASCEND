// sessionStore reaches expo-sqlite — mock it so tests stay pure.
jest.mock('./sessionStore', () => ({
  getSessionEvents: jest.fn(),
}));

import { getSessionEvents } from './sessionStore';
import {
  buildExerciseDetail,
  buildExerciseList,
  estimateOneRepMax,
  exerciseKeyFor,
  formatDaysAgo,
  formatMonthDay,
  formatVolume,
  formatWeight,
  sliceSeriesToRange,
} from './strengthProgress';
import type { SessionRow } from './types';

const mockGetSessionEvents = getSessionEvents as jest.Mock;

const DAY = 86_400_000;

const makeSession = (id: string, startedAt: number, type: SessionRow['type'] = 'strength'): SessionRow => ({
  id,
  type,
  status: 'completed',
  started_at: startedAt,
  completed_at: startedAt + 1,
  title: null,
  gym_id: null,
  notes: null,
});

const setEvent = (
  id: string,
  exerciseName: string,
  weight: number,
  reps: number,
  exerciseId?: string
) => ({
  id,
  type: 'SET_LOGGED',
  payload: { exerciseName, weight, reps, unit: 'kg', exerciseId },
  createdAt: 1,
});

const stubSessions = (bySession: Record<string, ReturnType<typeof setEvent>[]>) => {
  mockGetSessionEvents.mockImplementation((id: string) => bySession[id] ?? []);
};

beforeEach(() => {
  mockGetSessionEvents.mockReset();
});

describe('estimateOneRepMax', () => {
  it('takes a single rep at face value and applies Epley beyond that', () => {
    expect(estimateOneRepMax(100, 1)).toBe(100);
    expect(estimateOneRepMax(100, 5)).toBeCloseTo(116.67, 1);
  });
});

describe('exerciseKeyFor', () => {
  it('prefers the exercise id and falls back to a normalised name', () => {
    expect(exerciseKeyFor({ exerciseId: 'ex1', exerciseName: 'Press' })).toBe('ex1');
    expect(exerciseKeyFor({ exerciseName: ' Shoulder Press ' })).toBe('name:shoulder press');
  });
});

describe('buildExerciseList', () => {
  it('groups by exercise, orders by most recent, and reports the trend', () => {
    stubSessions({
      a: [setEvent('1', 'Deadlift', 100, 5, 'dl'), setEvent('2', 'Press', 30, 8, 'sp')],
      b: [setEvent('3', 'Deadlift', 110, 5, 'dl')],
    });
    const list = buildExerciseList([makeSession('a', DAY), makeSession('b', 2 * DAY)]);

    expect(list.map((e) => e.name)).toEqual(['Deadlift', 'Press']);
    const deadlift = list[0];
    expect(deadlift.sessionCount).toBe(2);
    expect(deadlift.lastSet).toEqual({ weight: 110, reps: 5 });
    expect(deadlift.changePct).toBe(10);
    expect(list[1].changePct).toBeNull();
  });

  it('ignores climb sessions', () => {
    stubSessions({ a: [setEvent('1', 'Deadlift', 100, 5, 'dl')] });
    expect(buildExerciseList([makeSession('a', DAY, 'climb')])).toEqual([]);
  });
});

describe('buildExerciseDetail', () => {
  const sessions = [makeSession('a', DAY), makeSession('b', 2 * DAY), makeSession('c', 3 * DAY)];

  it('returns null for an exercise that was never logged', () => {
    stubSessions({});
    expect(buildExerciseDetail(sessions, 'nope')).toBeNull();
  });

  it('derives tiles, deltas, and records from the session history', () => {
    stubSessions({
      a: [setEvent('1', 'Pull-up', 20, 8, 'pu')],
      b: [setEvent('2', 'Pull-up', 25, 5, 'pu'), setEvent('3', 'Pull-up', 25, 4, 'pu')],
      c: [setEvent('4', 'Pull-up', 20, 5, 'pu')],
    });
    const detail = buildExerciseDetail(sessions, 'pu', new Date(3 * DAY))!;

    expect(detail.sessions.map((s) => s.sessionId)).toEqual(['c', 'b', 'a']);
    expect(detail.tiles.topWeight).toEqual({ value: 20, delta: -5 });
    expect(detail.sessionCount).toBe(3);
    // Session b is the only one to beat every earlier est. 1RM.
    expect([...detail.recordSessionIds]).toEqual(['b']);
    expect(detail.sessions[1].topSet).toMatchObject({ weight: 25, reps: 5 });
    expect(detail.sessions[1].volume).toBe(25 * 5 + 25 * 4);
  });

  it('gives a lone session no delta and no record badge', () => {
    stubSessions({ a: [setEvent('1', 'Pull-up', 20, 8, 'pu')] });
    const detail = buildExerciseDetail([sessions[0]], 'pu')!;
    expect(detail.tiles.e1rm.delta).toBeNull();
    expect(detail.recordSessionIds.size).toBe(0);
  });
});

describe('sliceSeriesToRange', () => {
  it('keeps only points inside the trailing window', () => {
    const now = new Date(2026, 8, 19);
    const points = [
      { t: new Date(2026, 0, 1).getTime(), value: 1 },
      { t: new Date(2026, 7, 1).getTime(), value: 2 },
    ];
    expect(sliceSeriesToRange(points, 3, now)).toEqual([points[1]]);
    expect(sliceSeriesToRange(points, null, now)).toEqual(points);
  });
});

describe('formatters', () => {
  it('switches to tonnes at 1000 kg', () => {
    expect(formatVolume(850)).toEqual({ value: '850', unit: 'kg' });
    expect(formatVolume(42_140)).toEqual({ value: '42.1', unit: 't' });
  });

  it('trims trailing zeros from weights', () => {
    expect(formatWeight(30)).toBe('30');
    expect(formatWeight(27.5)).toBe('27.5');
  });
});

describe('date formatters', () => {
  const now = new Date(2026, 8, 19, 15, 0);

  it('formats a month and day', () => {
    expect(formatMonthDay(new Date(2026, 8, 3).getTime())).toBe('Sep 3');
  });

  it('describes recency relative to today, ignoring time of day', () => {
    expect(formatDaysAgo(new Date(2026, 8, 19, 1, 0).getTime(), now)).toBe('Today');
    expect(formatDaysAgo(new Date(2026, 8, 18, 23, 0).getTime(), now)).toBe('Yesterday');
    expect(formatDaysAgo(new Date(2026, 8, 14).getTime(), now)).toBe('5d ago');
    expect(formatDaysAgo(new Date(2026, 7, 1).getTime(), now)).toBe('Aug 1');
  });
});
