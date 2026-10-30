// progressInsights.test.ts
// sessionStore/gymStore reach expo-sqlite — mock them so tests stay pure.
jest.mock('./sessionStore', () => ({
  getSessionEvents: jest.fn(),
}));
jest.mock('./gymStore', () => ({
  getGymById: jest.fn(() => null),
}));

import { getSessionEvents } from './sessionStore';
import {
  buildGradeDistribution,
  buildGradeDistributionAcrossGyms,
  buildHardestSendTrend,
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
