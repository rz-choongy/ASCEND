// progressInsights.test.ts
// sessionStore/gymStore reach expo-sqlite — mock them so tests stay pure.
jest.mock('./sessionStore', () => ({
  getSessionEvents: jest.fn(),
}));
jest.mock('./gymStore', () => ({
  getGymById: jest.fn(() => null),
}));

import { getSessionEvents } from './sessionStore';
import { buildGradeDistributionAcrossGyms } from './progressInsights';
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

  it('labels a spanning band as a range', () => {
    mockGetSessionEvents.mockReturnValue([climbEvent('e1', 'Purple', 3, 5)]);

    const bars = buildGradeDistributionAcrossGyms([makeSession('a', 'gym-1')], PALETTE);

    expect(bars[0].label).toBe('V3-5');
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
