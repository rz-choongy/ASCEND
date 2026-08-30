// calendarInsights.test.ts
// sessionStore uses expo-sqlite/db — mock it so tests stay pure.
jest.mock('./sessionStore', () => ({
  getSessionEvents: jest.fn(),
}));

import { getSessionEvents } from './sessionStore';
import { buildDayDots, buildSessionReplayMap } from './calendarInsights';
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
) => ({
  id,
  type: 'CLIMB_LOGGED',
  payload: { gradeLabel, gradeMin: 1, gradeMax: 1, result, gradeColor },
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

  it('uses gradeColor of the last climb as dotColor', () => {
    const session = makeSession({ id: 'sess-1', type: 'climb' });
    mockGetSessionEvents.mockReturnValueOnce([
      climbEvent('evt-a', 'V2', '#aaa'),
      climbEvent('evt-b', 'V5', '#bbb'),
    ]);

    const result = buildSessionReplayMap([session], colors);
    expect(result.get('sess-1')!.dotColor).toBe('#bbb');
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

// ─── buildDayDots ────────────────────────────────────────────────────────────

describe('buildDayDots', () => {
  it('returns an empty map when sessionsByDate is empty', () => {
    const result = buildDayDots(new Map(), new Map(), colors);
    expect(result.size).toBe(0);
  });

  it('sets climbColor and no strengthColor when the day has only climb sessions', () => {
    const session = makeSession({ id: 'c1', type: 'climb' });
    const sessionsByDate = new Map([['2025-01-01', [session]]]);
    const replayById = new Map([['c1', { dotColor: '#4ade80', climbs: [], sets: [] }]]);

    const result = buildDayDots(sessionsByDate, replayById, colors);
    const dots = result.get('2025-01-01')!;

    expect(dots.climbColor).toBe('#4ade80');
    expect(dots.strengthColor).toBeUndefined();
  });

  it('sets strengthColor and no climbColor when the day has only strength sessions', () => {
    const session = makeSession({ id: 's1', type: 'strength' });
    const sessionsByDate = new Map([['2025-01-02', [session]]]);
    const replayById = new Map([['s1', { dotColor: colors.strength, climbs: [], sets: [] }]]);

    const result = buildDayDots(sessionsByDate, replayById, colors);
    const dots = result.get('2025-01-02')!;

    expect(dots.strengthColor).toBe(colors.strength);
    expect(dots.climbColor).toBeUndefined();
  });

  it('sets both climbColor and strengthColor when the day has mixed sessions', () => {
    const cSession = makeSession({ id: 'c1', type: 'climb' });
    const sSession = makeSession({ id: 's1', type: 'strength' });
    const sessionsByDate = new Map([['2025-01-03', [cSession, sSession]]]);
    const replayById = new Map([
      ['c1', { dotColor: '#aaa', climbs: [], sets: [] }],
      ['s1', { dotColor: colors.strength, climbs: [], sets: [] }],
    ]);

    const result = buildDayDots(sessionsByDate, replayById, colors);
    const dots = result.get('2025-01-03')!;

    expect(dots.climbColor).toBeDefined();
    expect(dots.strengthColor).toBe(colors.strength);
  });

  it('uses the single shared dotColor when all climb sessions on a day share the same color', () => {
    const c1 = makeSession({ id: 'c1', type: 'climb' });
    const c2 = makeSession({ id: 'c2', type: 'climb' });
    const sessionsByDate = new Map([['2025-01-04', [c1, c2]]]);
    const replayById = new Map([
      ['c1', { dotColor: '#aaa', climbs: [], sets: [] }],
      ['c2', { dotColor: '#aaa', climbs: [], sets: [] }],
    ]);

    const result = buildDayDots(sessionsByDate, replayById, colors);
    // All sessions same color → use that color directly
    expect(result.get('2025-01-04')!.climbColor).toBe('#aaa');
  });

  it('falls back to insightColors.climb when climb sessions have different dot colors', () => {
    const c1 = makeSession({ id: 'c1', type: 'climb' });
    const c2 = makeSession({ id: 'c2', type: 'climb' });
    const sessionsByDate = new Map([['2025-01-05', [c1, c2]]]);
    const replayById = new Map([
      ['c1', { dotColor: '#aaa', climbs: [], sets: [] }],
      ['c2', { dotColor: '#bbb', climbs: [], sets: [] }],
    ]);

    const result = buildDayDots(sessionsByDate, replayById, colors);
    // Mixed colors → fall back to generic climb color
    expect(result.get('2025-01-05')!.climbColor).toBe(colors.climb);
  });

  it('falls back to insightColors.climb when replay is missing for a climb session', () => {
    const session = makeSession({ id: 'c1', type: 'climb' });
    const sessionsByDate = new Map([['2025-01-06', [session]]]);
    // replayById is empty — the session has no entry
    const replayById = new Map<string, { dotColor: string; climbs: []; sets: [] }>();

    const result = buildDayDots(sessionsByDate, replayById, colors);
    // Missing replay → dotColor defaults to insightColors.climb via ?? operator
    expect(result.get('2025-01-06')!.climbColor).toBe(colors.climb);
  });

  it('produces entries for each date key independently', () => {
    const c1 = makeSession({ id: 'c1', type: 'climb' });
    const s1 = makeSession({ id: 's1', type: 'strength' });
    const sessionsByDate = new Map([
      ['2025-02-01', [c1]],
      ['2025-02-02', [s1]],
    ]);
    const replayById = new Map([
      ['c1', { dotColor: '#4ade80', climbs: [], sets: [] }],
      ['s1', { dotColor: colors.strength, climbs: [], sets: [] }],
    ]);

    const result = buildDayDots(sessionsByDate, replayById, colors);

    expect(result.size).toBe(2);
    expect(result.get('2025-02-01')!.climbColor).toBe('#4ade80');
    expect(result.get('2025-02-01')!.strengthColor).toBeUndefined();
    expect(result.get('2025-02-02')!.strengthColor).toBe(colors.strength);
    expect(result.get('2025-02-02')!.climbColor).toBeUndefined();
  });
});
