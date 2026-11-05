// dashboard.test.ts
// sessionStore/gymStore reach expo-sqlite — mock them so tests stay pure.
jest.mock('./sessionStore', () => ({
  getSessionEvents: jest.fn(),
}));
jest.mock('./gymStore', () => ({
  gymShortNameById: jest.fn((id: string) => (id === 'gym-1' ? 'Boulder Lab' : null)),
  isUnnamedDefaultGym: (gym: { id: string; name: string }) => gym.name === 'Default V-Scale',
}));

import { getSessionEvents } from './sessionStore';
import {
  buildRecentSessions,
  buildWeekActivity,
  lastClimbSessions,
  lastStrengthSessions,
  restDayLine,
  summarizeClimbSession,
  usualWeekTarget,
  weekStreak,
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

  it('counts one PR per exercise when a session builds past the record in steps', () => {
    eventsBySession({
      s1: [set('a', 'Pull-ups', 20, 5)],
      s2: [set('b', 'Pull-ups', 25, 5), set('c', 'Pull-ups', 35, 3), set('d', 'Pull-ups', 40, 3), set('e', 'Pull-ups', 40, 3)],
    });
    const result = lastStrengthSessions([session('s1', 'strength', 1), session('s2', 'strength', 2)]);
    expect(result?.latest.records).toBe(1);
    expect(result?.latest.exercises[0]).toMatchObject({ weight: 40, reps: 3, isRecord: true });
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

// Thu 5 Nov 2026, local time. Weeks run Mon-Sun, so this week started Mon 2 Nov.
const NOW = new Date(2026, 10, 5, 12);
const at = (month: number, day: number, hour = 18) => new Date(2026, month, day, hour).getTime();

describe('weekStreak', () => {
  it('is 0 with no sessions', () => {
    expect(weekStreak([], NOW)).toBe(0);
  });

  it('counts this week and the unbroken weeks before it', () => {
    expect(weekStreak([at(10, 3), at(9, 27), at(9, 20), at(9, 6)], NOW)).toBe(3);
  });

  it("doesn't break the run when this week has no session yet", () => {
    expect(weekStreak([at(9, 31), at(9, 26), at(9, 19)], NOW)).toBe(2);
  });

  it('is 0 when the last session was two weeks ago', () => {
    expect(weekStreak([at(9, 22)], NOW)).toBe(0);
  });

  it('counts several sessions in one week once', () => {
    expect(weekStreak([at(10, 2), at(10, 3), at(10, 4)], NOW)).toBe(1);
  });

  it('puts Sunday in the week before Monday', () => {
    // Sun 1 Nov belongs to the week of Mon 26 Oct, so this week is still empty.
    expect(weekStreak([at(10, 1, 23)], NOW)).toBe(1);
    expect(weekStreak([at(10, 1, 23), at(10, 2, 0)], NOW)).toBe(2);
  });
});

describe('usualWeekTarget', () => {
  // Monday of the week `weeksAgo` complete weeks back.
  const weekOf = (weeksAgo: number, extraDays = 0) => new Date(2026, 10, 2 - 7 * weeksAgo + extraDays, 18).getTime();
  const sessionsPerWeek = (counts: number[]) =>
    counts.flatMap((count, i) => Array.from({ length: count }, (_, j) => weekOf(i + 1, j)));

  it('is at least 2 with little history', () => {
    expect(usualWeekTarget([], NOW)).toBe(2);
    expect(usualWeekTarget(sessionsPerWeek([1, 1, 1]), NOW)).toBe(2);
  });

  it('takes the median of the last 8 complete weeks, empty weeks included', () => {
    expect(usualWeekTarget(sessionsPerWeek([4, 4, 3, 4, 0, 4, 3, 5]), NOW)).toBe(4);
    expect(usualWeekTarget(sessionsPerWeek([3, 3, 3, 0, 0, 0, 3, 3]), NOW)).toBe(3);
  });

  it('ignores this week and anything older than 8 weeks', () => {
    const old = sessionsPerWeek([0, 0, 0, 0, 0, 0, 0, 0, 6, 6]);
    expect(usualWeekTarget([...old, at(10, 3), at(10, 4), at(10, 5)], NOW)).toBe(2);
  });
});

describe('restDayLine', () => {
  it('is null with no sessions', () => {
    expect(restDayLine(null, NOW)).toBeNull();
  });

  it('names the weekday within the last 6 days', () => {
    expect(restDayLine({ type: 'climb', started_at: at(10, 3) }, NOW)).toBe('Rest day. Last climbed Tue');
    expect(restDayLine({ type: 'strength', started_at: at(9, 30) }, NOW)).toBe('Rest day. Last trained Fri');
  });

  it('gives the date once it is a week or more back', () => {
    expect(restDayLine({ type: 'climb', started_at: at(9, 29) }, NOW)).toBe('Rest day. Last climbed 29 Oct');
  });
});
