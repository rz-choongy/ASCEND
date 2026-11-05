// progressInsights.test.ts
// sessionStore/gymStore reach expo-sqlite — mock them so tests stay pure.
jest.mock('./sessionStore', () => ({
  getSessionEvents: jest.fn(),
}));
jest.mock('./gymStore', () => ({
  gymDisplayNameById: jest.fn(() => null),
}));

import { getSessionEvents } from './sessionStore';
import {
  buildGradeDistribution,
  buildGradeDistributionAcrossGyms,
  buildHardestSendTrend,
  buildTopSendsTrend,
  countSendsAtGrade,
  filterSessionsToPeriod,
  findFirstSendsOfTopGrades,
  findRecentMilestone,
  formatDayMonth,
  formatMilestone,
  listClimbsForPyramidRow,
  MIN_TREND_WEEKS,
  trendWeeksForPeriod,
} from './progressInsights';
import type { SessionRow } from './types';

const mockGetSessionEvents = getSessionEvents as jest.Mock;

const PALETTE = ['#c0', '#c1', '#c2', '#c3', '#c4', '#c5', '#c6', '#c7'];

const makeSession = (id: string, gymId: string | null): SessionRow => ({
  id,
  type: 'climb',
  status: 'completed',
  started_at: 1,
  completed_at: 2,
  title: null,
  gym_id: gymId,
  notes: null,
});

const climbEvent = (id: string, gradeLabel: string, gradeMin: number, gradeMax: number) => ({
  id,
  type: 'CLIMB_LOGGED',
  payload: { gradeLabel, gradeMin, gradeMax, result: 'SEND', gradeColor: '#ignored' },
  createdAt: 1,
});

beforeEach(() => {
  mockGetSessionEvents.mockReset();
});

describe('buildGradeDistributionAcrossGyms', () => {
  it('pools identical numeric bands from different gyms into one bar', () => {
    // Two gyms that label V4 differently — "Yellow" vs "Blue" — must still merge.
    mockGetSessionEvents.mockImplementation((sessionId: string) =>
      sessionId === 'a' ? [climbEvent('e1', 'Yellow', 4, 4)] : [climbEvent('e2', 'Blue', 4, 4)]
    );

    const bars = buildGradeDistributionAcrossGyms(
      [makeSession('a', 'gym-1'), makeSession('b', 'gym-2')],
      PALETTE
    );

    expect(bars).toHaveLength(1);
    expect(bars[0].label).toBe('V4');
    expect(bars[0].count).toBe(2);
  });

  it('keeps different numeric bands apart and sorts them easiest-first', () => {
    mockGetSessionEvents.mockReturnValue([
      climbEvent('e1', 'Hard', 6, 6),
      climbEvent('e2', 'Easy', 2, 2),
      climbEvent('e3', 'Mid', 4, 4),
    ]);

    const bars = buildGradeDistributionAcrossGyms([makeSession('a', 'gym-1')], PALETTE);

    expect(bars.map((bar) => bar.label)).toEqual(['V2', 'V4', 'V6']);
  });

  it('folds a range-logged climb onto its midpoint grade', () => {
    mockGetSessionEvents.mockReturnValue([climbEvent('e1', 'Purple', 3, 5)]);

    const bars = buildGradeDistributionAcrossGyms([makeSession('a', 'gym-1')], PALETTE);

    expect(bars[0].label).toBe('V4');
  });

  // The regression this chart shipped with: a "V3-4" bar sat between V3 and V4
  // pooling with neither, so no bar in the pyramid could be read against another.
  it('pools a two-grade band together with exact sends at the same grade', () => {
    mockGetSessionEvents.mockReturnValue([
      climbEvent('e1', 'Green', 3, 4),
      climbEvent('e2', 'Green', 3, 4),
      climbEvent('e3', 'V3', 3, 3),
    ]);

    const bars = buildGradeDistributionAcrossGyms([makeSession('a', 'gym-1')], PALETTE);

    expect(bars).toHaveLength(1);
    expect(bars[0].label).toBe('V3');
    expect(bars[0].count).toBe(3);
  });

  it('never labels a bar as a range', () => {
    mockGetSessionEvents.mockReturnValue([
      climbEvent('e1', 'Green', 3, 4),
      climbEvent('e2', 'Blue', 4, 5),
      climbEvent('e3', 'Purple', 0, 1),
    ]);

    const bars = buildGradeDistributionAcrossGyms([makeSession('a', 'gym-1')], PALETTE);

    bars.forEach((bar) => expect(bar.label).not.toContain('-'));
  });

  it('colors bands from the supplied palette, not the gym-specific grade color', () => {
    mockGetSessionEvents.mockReturnValue([climbEvent('e1', 'Yellow', 2, 2)]);

    const bars = buildGradeDistributionAcrossGyms([makeSession('a', 'gym-1')], PALETTE);

    expect(bars[0].color).toBe(PALETTE[2]);
  });

  it('ignores strength sessions', () => {
    mockGetSessionEvents.mockReturnValue([climbEvent('e1', 'Yellow', 2, 2)]);
    const strengthSession = { ...makeSession('s', null), type: 'strength' as const };

    const bars = buildGradeDistributionAcrossGyms([strengthSession], PALETTE);

    expect(bars).toEqual([]);
  });
});

describe('flash counts', () => {
  const flashEvent = (id: string, gradeLabel: string, grade: number) => ({
    ...climbEvent(id, gradeLabel, grade, grade),
    payload: { ...climbEvent(id, gradeLabel, grade, grade).payload, result: 'FLASH' },
  });

  it('splits each bar into flashes and sends, per gym', () => {
    mockGetSessionEvents.mockReturnValue([
      climbEvent('e1', 'V3', 3, 3),
      flashEvent('e2', 'V3', 3),
      flashEvent('e3', 'V5', 5),
    ]);
    const bars = buildGradeDistribution([makeSession('a', 'gym-1')], 'gym-1');
    expect(bars.map((b) => [b.label, b.count, b.flashCount])).toEqual([
      ['V3', 2, 1],
      ['V5', 1, 1],
    ]);
  });

  it('pools flashes across gyms too', () => {
    mockGetSessionEvents.mockImplementation((sessionId: string) =>
      sessionId === 'a' ? [flashEvent('e1', 'Yellow', 4)] : [climbEvent('e2', 'Blue', 4, 4)]
    );
    const bars = buildGradeDistributionAcrossGyms([makeSession('a', 'gym-1'), makeSession('b', 'gym-2')], PALETTE);
    expect(bars[0]).toMatchObject({ label: 'V4', count: 2, flashCount: 1 });
  });
});

describe('buildHardestSendTrend', () => {
  // Wednesday 2026-10-28; its week starts Monday 2026-10-26.
  const TODAY = new Date(2026, 9, 28);
  const at = (month: number, day: number) => new Date(2026, month, day, 18).getTime();
  const sessionAt = (id: string, gymId: string, startedAt: number): SessionRow => ({
    ...makeSession(id, gymId),
    started_at: startedAt,
  });

  it('keeps the hardest send of each week, oldest week first', () => {
    mockGetSessionEvents.mockImplementation((sessionId: string) =>
      ({
        mon: [climbEvent('e1', 'V3', 3, 3), climbEvent('e2', 'V5', 5, 5)],
        tue: [climbEvent('e3', 'V4', 4, 4)],
        prev: [climbEvent('e4', 'V6', 6, 6)],
      })[sessionId] ?? []
    );

    const trend = buildHardestSendTrend(
      [sessionAt('mon', 'gym-1', at(9, 26)), sessionAt('tue', 'gym-1', at(9, 27)), sessionAt('prev', 'gym-1', at(9, 21))],
      12,
      TODAY
    );

    expect(trend).toEqual([
      { weekLabel: '19 Oct', grade: 6 },
      { weekLabel: '26 Oct', grade: 5 },
    ]);
  });

  it('pools gyms on the V scale and uses the midpoint of a band', () => {
    mockGetSessionEvents.mockImplementation((sessionId: string) =>
      sessionId === 'a' ? [climbEvent('e1', 'Purple', 3, 7)] : [climbEvent('e2', 'Blue', 4, 4)]
    );

    const trend = buildHardestSendTrend(
      [sessionAt('a', 'gym-1', at(9, 26)), sessionAt('b', 'gym-2', at(9, 27))],
      12,
      TODAY
    );

    expect(trend).toEqual([{ weekLabel: '26 Oct', grade: 5 }]);
  });

  it('skips weeks without climbing and drops sessions before the window', () => {
    mockGetSessionEvents.mockReturnValue([climbEvent('e1', 'V2', 2, 2)]);

    const trend = buildHardestSendTrend(
      [
        sessionAt('old', 'gym-1', at(9, 4)), // week of 28 Sep, outside a 4-week window
        sessionAt('a', 'gym-1', at(9, 6)),
        sessionAt('b', 'gym-1', at(9, 27)),
      ],
      4,
      TODAY
    );

    expect(trend.map((p) => p.weekLabel)).toEqual(['5 Oct', '26 Oct']);
  });

  it('ignores strength sessions and empty climb sessions', () => {
    mockGetSessionEvents.mockReturnValue([]);
    const strength = { ...sessionAt('s', 'gym-1', at(9, 26)), type: 'strength' as const };

    expect(buildHardestSendTrend([strength, sessionAt('c', 'gym-1', at(9, 26))], 12, TODAY)).toEqual([]);
  });
});

describe('filterSessionsToPeriod', () => {
  const now = new Date(2026, 10, 4, 12, 0, 0);
  const daysAgo = (days: number) => now.getTime() - days * 86_400_000;
  const at = (id: string, startedAt: number): SessionRow => ({ ...makeSession(id, null), started_at: startedAt });
  const sessions = [at('old', daysAgo(400)), at('year', daysAgo(200)), at('q', daysAgo(60)), at('m', daysAgo(20)), at('w', daysAgo(3))];
  const ids = (rows: SessionRow[]) => rows.map((s) => s.id);

  it('keeps sessions inside each rolling window', () => {
    expect(ids(filterSessionsToPeriod(sessions, 'W', now))).toEqual(['w']);
    expect(ids(filterSessionsToPeriod(sessions, 'M', now))).toEqual(['m', 'w']);
    expect(ids(filterSessionsToPeriod(sessions, '3M', now))).toEqual(['q', 'm', 'w']);
    expect(ids(filterSessionsToPeriod(sessions, 'Y', now))).toEqual(['year', 'q', 'm', 'w']);
  });

  it('returns every session for All', () => {
    expect(filterSessionsToPeriod(sessions, 'All', now)).toBe(sessions);
  });

  it('includes a session exactly on the cutoff', () => {
    expect(ids(filterSessionsToPeriod([at('edge', daysAgo(7))], 'W', now))).toEqual(['edge']);
  });
});

describe('trendWeeksForPeriod', () => {
  const now = new Date(2026, 10, 4, 12, 0, 0);
  const at = (startedAt: number): SessionRow => ({ ...makeSession('x', null), started_at: startedAt });

  it('never goes below the minimum for short windows', () => {
    expect(trendWeeksForPeriod('W', [], now)).toBe(MIN_TREND_WEEKS);
    expect(trendWeeksForPeriod('M', [], now)).toBe(MIN_TREND_WEEKS);
    expect(trendWeeksForPeriod('3M', [], now)).toBe(13);
  });

  it('covers a year for Y', () => {
    expect(trendWeeksForPeriod('Y', [], now)).toBe(53);
  });

  it('reaches back to the earliest session for All', () => {
    const twentyWeeksAgo = now.getTime() - 20 * 7 * 86_400_000;
    expect(trendWeeksForPeriod('All', [at(now.getTime()), at(twentyWeeksAgo)], now)).toBe(21);
    expect(trendWeeksForPeriod('All', [at(now.getTime())], now)).toBe(MIN_TREND_WEEKS);
  });
});

describe('formatDayMonth', () => {
  const now = new Date(2026, 10, 5);

  it('drops the year inside the current year', () => {
    expect(formatDayMonth(new Date(2026, 8, 11).getTime(), now)).toBe('11 Sep');
  });

  it('adds the year otherwise', () => {
    expect(formatDayMonth(new Date(2025, 8, 11).getTime(), now)).toBe('11 Sep 2025');
  });
});

// Shared helpers for the dated tests below.
const TODAY_WED = new Date(2026, 9, 28); // week starts Mon 26 Oct
const dayAt = (month: number, day: number, hour = 18) => new Date(2026, month, day, hour).getTime();
const datedSession = (id: string, gymId: string | null, startedAt: number): SessionRow => ({
  ...makeSession(id, gymId),
  started_at: startedAt,
});
const datedClimb = (
  id: string,
  grade: number,
  createdAt: number,
  result: 'SEND' | 'FLASH' = 'SEND',
  gradeLabel = `V${grade}`
) => ({
  id,
  type: 'CLIMB_LOGGED',
  payload: { gradeLabel, gradeMin: grade, gradeMax: grade, result, gradeColor: null },
  createdAt,
});

describe('buildTopSendsTrend', () => {
  it('averages the three best sends of each week and keeps the hardest', () => {
    mockGetSessionEvents.mockImplementation(
      (sessionId: string) =>
        ({
          a: [
            datedClimb('e1', 8, dayAt(9, 26)),
            datedClimb('e2', 5, dayAt(9, 26)),
            datedClimb('e3', 5, dayAt(9, 26)),
            datedClimb('e4', 2, dayAt(9, 26)),
          ],
          b: [datedClimb('e5', 4, dayAt(9, 20)), datedClimb('e6', 6, dayAt(9, 20))],
        })[sessionId] ?? []
    );

    const trend = buildTopSendsTrend(
      [datedSession('a', 'gym-1', dayAt(9, 26)), datedSession('b', 'gym-2', dayAt(9, 20))],
      12,
      TODAY_WED
    );

    expect(trend.map(({ weekLabel, usual, hardest }) => ({ weekLabel, usual, hardest }))).toEqual([
      { weekLabel: '19 Oct', usual: 5, hardest: 6 },
      { weekLabel: '26 Oct', usual: 6, hardest: 8 },
    ]);
  });

  it('uses a single send as both values', () => {
    mockGetSessionEvents.mockReturnValue([datedClimb('e1', 3, dayAt(9, 26))]);
    const trend = buildTopSendsTrend([datedSession('a', null, dayAt(9, 26))], 12, TODAY_WED);
    expect(trend[0]).toMatchObject({ usual: 3, hardest: 3 });
  });
});

describe('findFirstSendsOfTopGrades', () => {
  it('returns the first send of each of the top grades, hardest first', () => {
    mockGetSessionEvents.mockImplementation(
      (sessionId: string) =>
        ({
          a: [datedClimb('e1', 2, dayAt(8, 1)), datedClimb('e2', 3, dayAt(8, 1)), datedClimb('e3', 4, dayAt(8, 1))],
          b: [datedClimb('e4', 5, dayAt(9, 6)), datedClimb('e5', 4, dayAt(9, 6))],
          c: [datedClimb('e6', 6, dayAt(9, 27)), datedClimb('e7', 5, dayAt(9, 27))],
        })[sessionId] ?? []
    );

    const firsts = findFirstSendsOfTopGrades(
      [datedSession('a', null, dayAt(8, 1)), datedSession('b', null, dayAt(9, 6)), datedSession('c', null, dayAt(9, 27))],
      4
    );

    expect(firsts.map((f) => [f.grade, f.at])).toEqual([
      [6, dayAt(9, 27)],
      [5, dayAt(9, 6)],
      [4, dayAt(8, 1)],
      [3, dayAt(8, 1)],
    ]);
    expect(firsts[0].weekStart).toBe(new Date(2026, 9, 26).getTime());
  });
});

describe('countSendsAtGrade', () => {
  it('counts climbs whose midpoint is the grade', () => {
    mockGetSessionEvents.mockReturnValue([
      climbEvent('e1', 'Green', 6, 7),
      climbEvent('e2', 'V6', 6, 6),
      climbEvent('e3', 'V7', 7, 7),
    ]);
    expect(countSendsAtGrade([makeSession('a', null)], 6)).toBe(2);
    expect(countSendsAtGrade([makeSession('a', null)], 9)).toBe(0);
  });
});

describe('listClimbsForPyramidRow', () => {
  beforeEach(() => {
    mockGetSessionEvents.mockImplementation(
      (sessionId: string) =>
        ({
          a: [datedClimb('e1', 4, dayAt(9, 1), 'FLASH', 'Blue'), datedClimb('e2', 5, dayAt(9, 1))],
          b: [datedClimb('e3', 4, dayAt(9, 9), 'SEND', 'Yellow')],
        })[sessionId] ?? []
    );
  });
  const sessions = () => [datedSession('a', 'gym-1', dayAt(9, 1)), datedSession('b', 'gym-2', dayAt(9, 9))];

  it('pools by V grade, newest first', () => {
    const climbs = listClimbsForPyramidRow(sessions(), { kind: 'pooled', grade: 4 });
    expect(climbs.map((c) => [c.eventId, c.result])).toEqual([
      ['e3', 'SEND'],
      ['e1', 'FLASH'],
    ]);
  });

  it("matches one gym's own label", () => {
    const climbs = listClimbsForPyramidRow(sessions(), { kind: 'gym', gymId: 'gym-1', gradeLabel: 'Blue' });
    expect(climbs.map((c) => c.eventId)).toEqual(['e1']);
  });
});

describe('findRecentMilestone', () => {
  const now = new Date(2026, 9, 28, 20);
  const manySends = (n: number, at: (i: number) => number, grade = 3, result: 'SEND' | 'FLASH' = 'SEND') =>
    Array.from({ length: n }, (_, i) => datedClimb(`s${grade}-${result}-${i}`, grade, at(i), result));

  it('reports a send total crossed this week', () => {
    // 99 old sends, then the 100th today.
    mockGetSessionEvents.mockReturnValue([
      ...manySends(99, () => dayAt(8, 1)),
      datedClimb('last', 3, dayAt(9, 28, 10)),
    ]);
    const milestone = findRecentMilestone([makeSession('a', null)], now);
    expect(milestone).toEqual({ kind: 'sends', count: 100, at: dayAt(9, 28, 10) });
    expect(formatMilestone(milestone!)).toBe('You passed 100 sends');
  });

  it('ignores milestones older than the window', () => {
    mockGetSessionEvents.mockReturnValue([...manySends(50, () => dayAt(8, 1)), datedClimb('x', 3, dayAt(9, 28, 10))]);
    expect(findRecentMilestone([makeSession('a', null)], now)).toBeNull();
  });

  it('picks the most recent of several, including flashes at one grade', () => {
    mockGetSessionEvents.mockReturnValue([
      ...manySends(9, () => dayAt(8, 1), 5, 'FLASH'),
      ...manySends(40, () => dayAt(8, 1)),
      datedClimb('fifty', 3, dayAt(9, 26)), // 50th climb overall
      datedClimb('tenth', 5, dayAt(9, 27), 'FLASH'), // 10th V5 flash
    ]);
    const milestone = findRecentMilestone([makeSession('a', null)], now);
    expect(milestone).toEqual({ kind: 'flashes', count: 10, grade: 5, at: dayAt(9, 27) });
    expect(formatMilestone(milestone!)).toBe('10 V5 flashes');
  });
});
