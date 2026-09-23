// dashboard.test.ts
// sessionStore/gymStore reach expo-sqlite — mock them so tests stay pure.
jest.mock('./sessionStore', () => ({
  getSessionEvents: jest.fn(),
}));
jest.mock('./gymStore', () => ({
  getGymById: jest.fn((id: string) => (id === 'gym-1' ? { name: 'Boulder Lab' } : null)),
}));

import { getSessionEvents } from './sessionStore';
import {
  buildRecentSessions,
  buildWeekActivity,
  lastClimbSessions,
  lastStrengthSessions,
  summarizeClimbSession,
} from './dashboard';
import type { SessionRow } from './types';

const mockGetSessionEvents = getSessionEvents as jest.Mock;

const session = (id: string, type: SessionRow['type'], startedAt: number, extra: Partial<SessionRow> = {}): SessionRow => ({
  id,
  type,
  status: 'completed',
  started_at: startedAt,
  completed_at: startedAt + 45 * 60_000,
  title: null,
  gym_id: type === 'climb' ? 'gym-1' : null,
  notes: null,
  ...extra,
});

const climb = (id: string, gradeLabel: string, grade: number, result: 'SEND' | 'FLASH' = 'SEND') => ({
  id,
  type: 'CLIMB_LOGGED',
  payload: { gradeLabel, gradeMin: grade, gradeMax: grade, result, gradeColor: `#${grade}` },
  createdAt: 1,
});

const set = (id: string, exerciseName: string, weight: number, reps: number) => ({
  id,
  type: 'SET_LOGGED',
  payload: { exerciseId: `ex-${exerciseName}`, exerciseName, weight, reps, unit: 'kg' },
  createdAt: 1,
});

const eventsBySession = (map: Record<string, unknown[]>) =>
  mockGetSessionEvents.mockImplementation((id: string) => map[id] ?? []);

beforeEach(() => {
  mockGetSessionEvents.mockReset();
});

describe('summarizeClimbSession', () => {
  it('counts sends, flash rate, best grade and a per-grade tally, easiest first', () => {
    eventsBySession({
      c1: [climb('a', 'V3', 3), climb('b', 'V1', 1, 'FLASH'), climb('c', 'V3', 3), climb('d', 'V5', 5)],
    });
    const summary = summarizeClimbSession(session('c1', 'climb', 0));
    expect(summary.sends).toBe(4);
    expect(summary.flashRate).toBe(25);
    expect(summary.bestGradeLabel).toBe('V5');
    expect(summary.gymName).toBe('Boulder Lab');
    expect(summary.grades.map((g) => [g.label, g.count])).toEqual([
      ['V1', 1],
      ['V3', 2],
      ['V5', 1],
    ]);
  });

  it('handles a session with nothing logged', () => {
    eventsBySession({});
    const summary = summarizeClimbSession(session('c1', 'climb', 0));
    expect(summary.sends).toBe(0);
    expect(summary.flashRate).toBe(0);
    expect(summary.bestGradeLabel).toBeNull();
  });
});

describe('lastClimbSessions', () => {
  it('returns the newest climb and the one before, skipping strength', () => {
    eventsBySession({ c1: [climb('a', 'V2', 2)], c2: [climb('b', 'V4', 4)] });
    const result = lastClimbSessions([
      session('c1', 'climb', 1),
      session('s1', 'strength', 2),
      session('c2', 'climb', 3),
    ]);
    expect(result?.latest.sessionId).toBe('c2');
    expect(result?.previous?.sessionId).toBe('c1');
  });

  it('is null with no climbs', () => {
    expect(lastClimbSessions([session('s1', 'strength', 1)])).toBeNull();
  });
});

describe('lastStrengthSessions', () => {
  it('flags PRs only against earlier sessions and keeps each exercise’s top set', () => {
    eventsBySession({
      s1: [set('a', 'Pull-ups', 20, 6)],
      s2: [set('b', 'Pull-ups', 20, 5), set('c', 'Pull-ups', 25, 6), set('d', 'Dips', 10, 10)],
    });
    const result = lastStrengthSessions([session('s1', 'strength', 1), session('s2', 'strength', 2)]);
    expect(result?.latest.sets).toBe(3);
    expect(result?.latest.volume).toBe(20 * 5 + 25 * 6 + 10 * 10);
    // Dips has no history, so its first set isn't a PR; the 25 x 6 pull-up is.
    expect(result?.latest.records).toBe(1);
    expect(result?.latest.exercises).toEqual([
      { name: 'Pull-ups', sets: 2, weight: 25, reps: 6, isRecord: true },
      { name: 'Dips', sets: 1, weight: 10, reps: 10, isRecord: false },
    ]);
    expect(result?.previous?.records).toBe(0);
  });
});

describe('buildWeekActivity', () => {
  // Wednesday 23 Sep 2026
  const today = new Date(2026, 8, 23, 12);
  const at = (day: number) => new Date(2026, 8, day, 18).getTime();

  it('marks climb and strength days Mon-Sun and totals the week only', () => {
    eventsBySession({
      mon: [climb('a', 'V2', 2), climb('b', 'V3', 3)],
      tue: [set('c', 'Pull-ups', 20, 6)],
      lastWeek: [climb('d', 'V1', 1)],
    });
    const week = buildWeekActivity(
      [session('lastWeek', 'climb', at(20)), session('mon', 'climb', at(21)), session('tue', 'strength', at(22))],
      today
    );
    expect(week.days.map((d) => d.label).join('')).toBe('MTWTFSS');
    expect(week.days[0]).toMatchObject({ climbed: true, trained: false });
    expect(week.days[1]).toMatchObject({ climbed: false, trained: true });
    expect(week.days[2].isToday).toBe(true);
    expect(week.sessions).toBe(2);
    expect(week.sends).toBe(2);
    expect(week.sets).toBe(1);
  });
});

describe('buildRecentSessions', () => {
  it('lists newest first with a headline figure per type', () => {
    eventsBySession({
      c1: [climb('a', 'V4', 4)],
      s1: [set('b', 'Pull-ups', 20, 6), set('c', 'Dips', 10, 10)],
    });
    const strength = [session('s1', 'strength', 2, { title: 'Pull day' })];
    const rows = buildRecentSessions([session('c1', 'climb', 1), ...strength], strength, 5);
    expect(rows.map((r) => [r.title, r.figure, r.detail])).toEqual([
      ['Pull day', '2 sets', '2 exercises'],
      ['Boulder Lab', '1 send', 'best V4'],
    ]);
  });
});

describe('lastStrengthSessions with an emptied session', () => {
  it('skips a session whose sets were all deleted', () => {
    eventsBySession({
      s1: [set('a', 'Pull-ups', 20, 6)],
      s2: [
        set('b', 'Dips', 10, 10),
        { id: 'c', type: 'SET_DELETED', payload: { eventId: 'b' }, createdAt: 2 },
      ],
    });
    const result = lastStrengthSessions([session('s1', 'strength', 1), session('s2', 'strength', 2)]);
    expect(result?.latest.sessionId).toBe('s1');
    expect(result?.previous).toBeNull();
  });
});
