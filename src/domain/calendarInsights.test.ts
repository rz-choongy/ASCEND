// calendarInsights.test.ts
// sessionStore uses expo-sqlite/db — mock it so tests stay pure.
jest.mock('./sessionStore', () => ({
  getSessionEvents: jest.fn(),
}));

import { getSessionEvents } from './sessionStore';
import { buildSessionReplayMap } from './calendarInsights';
import type { SessionRow } from './types';

const mockGetSessionEvents = getSessionEvents as jest.Mock;

// ─── helpers ────────────────────────────────────────────────────────────────

const colors = { climb: '#ff0000', strength: '#0000ff' };

const makeSession = (overrides: Partial<SessionRow> & { id: string; type: 'climb' | 'strength' }): SessionRow => ({
  status: 'completed',
  started_at: Date.now(),
  completed_at: Date.now(),
  title: null,
  gym_id: null,
  notes: null,
  ...overrides,
});

/** Build a minimal CLIMB_LOGGED event object (shape expected by applyClimbEvents). */
const climbEvent = (
  id: string,
  gradeLabel: string,
  gradeColor: string | null = null,
  result: 'SEND' | 'FLASH' = 'SEND',
  gradeMax = 1,
) => ({
  id,
  type: 'CLIMB_LOGGED',
  payload: { gradeLabel, gradeMin: gradeMax, gradeMax, result, gradeColor },
  createdAt: 1,
});

/** Build a minimal SET_LOGGED event object. */
const setEvent = (id: string) => ({
  id,
  type: 'SET_LOGGED',
  payload: { exerciseName: 'Pull-up', reps: 5, weight: 0, unit: 'kg' },
  createdAt: 1,
});

// ─── buildSessionReplayMap ───────────────────────────────────────────────────

describe('buildSessionReplayMap', () => {
  beforeEach(() => {
    mockGetSessionEvents.mockReset();
  });

  it('returns an empty map when given no sessions', () => {
    const result = buildSessionReplayMap([], colors);
    expect(result.size).toBe(0);
  });

  it('maps a climb session to its id with climbs array and empty sets', () => {
    const session = makeSession({ id: 'sess-1', type: 'climb' });
    mockGetSessionEvents.mockReturnValueOnce([
      climbEvent('evt-a', 'V3', '#3b82f6'),
    ]);

    const result = buildSessionReplayMap([session], colors);

    expect(result.size).toBe(1);
    const replay = result.get('sess-1')!;
    expect(replay.climbs).toHaveLength(1);
    expect(replay.climbs[0]).toMatchObject({ eventId: 'evt-a', gradeLabel: 'V3' });
    expect(replay.sets).toHaveLength(0);
  });

  it('uses gradeColor and label of the hardest climb as dotColor, regardless of log order', () => {
    const session = makeSession({ id: 'sess-1', type: 'climb' });
    mockGetSessionEvents.mockReturnValueOnce([
      climbEvent('evt-a', 'V5', '#bbb', 'SEND', 5),
      climbEvent('evt-b', 'V2', '#aaa', 'SEND', 2), // logged after, but easier
    ]);

    const result = buildSessionReplayMap([session], colors);
    expect(result.get('sess-1')!.dotColor).toBe('#bbb');
    expect(result.get('sess-1')!.hardestGradeLabel).toBe('V5');
  });

  it('breaks a tie between equally-hard climbs by using the most recently logged one', () => {
    const session = makeSession({ id: 'sess-1', type: 'climb' });
    mockGetSessionEvents.mockReturnValueOnce([
      climbEvent('evt-a', 'V3-a', '#aaa', 'SEND', 3),
      climbEvent('evt-b', 'V3-b', '#bbb', 'SEND', 3),
    ]);

    const result = buildSessionReplayMap([session], colors);
    expect(result.get('sess-1')!.hardestGradeLabel).toBe('V3-b');
  });

  it('falls back to insightColors.climb as dotColor when last climb has no gradeColor', () => {
    const session = makeSession({ id: 'sess-1', type: 'climb' });
    mockGetSessionEvents.mockReturnValueOnce([
      climbEvent('evt-a', 'V2', null), // gradeColor is null
    ]);

    const result = buildSessionReplayMap([session], colors);
    expect(result.get('sess-1')!.dotColor).toBe(colors.climb);
  });

  it('falls back to insightColors.climb as dotColor when the session has no climbs', () => {
    const session = makeSession({ id: 'sess-1', type: 'climb' });
    mockGetSessionEvents.mockReturnValueOnce([]); // no events at all

    const result = buildSessionReplayMap([session], colors);
    expect(result.get('sess-1')!.dotColor).toBe(colors.climb);
  });

  it('maps a strength session to its id with sets array and empty climbs', () => {
    const session = makeSession({ id: 'sess-2', type: 'strength' });
    mockGetSessionEvents.mockReturnValueOnce([
      setEvent('evt-s1'),
      setEvent('evt-s2'),
    ]);

    const result = buildSessionReplayMap([session], colors);

    const replay = result.get('sess-2')!;
    expect(replay.climbs).toHaveLength(0);
    expect(replay.sets).toHaveLength(2);
  });

  it('always uses insightColors.strength as dotColor for strength sessions', () => {
    const session = makeSession({ id: 'sess-2', type: 'strength' });
    mockGetSessionEvents.mockReturnValueOnce([setEvent('s1')]);

    const result = buildSessionReplayMap([session], colors);
    expect(result.get('sess-2')!.dotColor).toBe(colors.strength);
  });

  it('handles multiple sessions across both types', () => {
    const climbSession = makeSession({ id: 'c1', type: 'climb' });
    const strengthSession = makeSession({ id: 's1', type: 'strength' });

    mockGetSessionEvents
      .mockReturnValueOnce([climbEvent('e1', 'V4', '#4ade80')]) // called for c1
      .mockReturnValueOnce([setEvent('e2')]); // called for s1

    const result = buildSessionReplayMap([climbSession, strengthSession], colors);

    expect(result.size).toBe(2);
    expect(result.get('c1')!.climbs).toHaveLength(1);
    expect(result.get('s1')!.sets).toHaveLength(1);
  });
});
