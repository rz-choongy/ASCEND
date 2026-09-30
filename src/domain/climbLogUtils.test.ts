import {
  applyClimbEvents,
  isGradeBand,
  midpointGrade,
  findSessionHighIndex,
} from './climbLogUtils';

const event = (id: string, type: string, payload: unknown, createdAt = 1) => ({
  id,
  type,
  payload,
  createdAt,
});

describe('applyClimbEvents', () => {
  it('replays logged climbs and undo events in order', () => {
    const logs = applyClimbEvents([
      event('a', 'CLIMB_LOGGED', {
        gradeLabel: 'V2',
        gradeMin: 2,
        gradeMax: 2,
        result: 'SEND',
      }),
      event('b', 'CLIMB_LOGGED', {
        gradeLabel: 'V3',
        gradeMin: 3,
        gradeMax: 3,
        result: 'FLASH',
      }),
      event('c', 'CLIMB_UNDONE', { at: 3 }),
    ]);

    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({
      eventId: 'a',
      gradeLabel: 'V2',
      result: 'SEND',
    });
  });

  it('applies target-addressed edits and deletes', () => {
    const logs = applyClimbEvents([
      event('a', 'CLIMB_LOGGED', {
        gradeLabel: 'V2',
        gradeMin: 2,
        gradeMax: 2,
        result: 'SEND',
      }),
      event('b', 'CLIMB_LOGGED', {
        gradeLabel: 'V3',
        gradeMin: 3,
        gradeMax: 3,
        result: 'SEND',
      }),
      event('c', 'CLIMB_EDITED', {
        eventId: 'a',
        gradeLabel: 'Blue',
        gradeMin: 3,
        gradeMax: 4,
        gradeColor: '#3b82f6',
        result: 'FLASH',
      }),
      event('d', 'CLIMB_DELETED', { eventId: 'b' }),
    ]);

    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({
      eventId: 'a',
      gradeLabel: 'Blue',
      gradeMin: 3,
      gradeMax: 4,
      gradeColor: '#3b82f6',
      result: 'FLASH',
    });
  });

  it('ignores unsupported climb results instead of replaying hidden logs', () => {
    const logs = applyClimbEvents([
      event('a', 'CLIMB_LOGGED', {
        gradeLabel: 'V2',
        gradeMin: 2,
        gradeMax: 2,
        result: 'FAIL',
      }),
    ]);

    expect(logs).toEqual([]);
  });

  it('carries a climb name through, defaulting to null when absent', () => {
    const logs = applyClimbEvents([
      event('a', 'CLIMB_LOGGED', {
        gradeLabel: 'V2',
        gradeMin: 2,
        gradeMax: 2,
        result: 'SEND',
        climbName: 'Bomb Pop',
      }),
      event('b', 'CLIMB_LOGGED', {
        gradeLabel: 'V3',
        gradeMin: 3,
        gradeMax: 3,
        result: 'SEND',
      }),
    ]);

    expect(logs.map((log) => log.climbName)).toEqual(['Bomb Pop', null]);
  });

  it('replaces the climb name on edit, clearing it when the edit omits one', () => {
    const logs = applyClimbEvents([
      event('a', 'CLIMB_LOGGED', {
        gradeLabel: 'V2',
        gradeMin: 2,
        gradeMax: 2,
        result: 'SEND',
        climbName: 'Bomb Pop',
      }),
      event('b', 'CLIMB_EDITED', {
        eventId: 'a',
        gradeLabel: 'V2',
        gradeMin: 2,
        gradeMax: 2,
        result: 'SEND',
      }),
    ]);

    expect(logs[0].climbName).toBeNull();
  });
});

describe('isGradeBand', () => {
  it('is false only for an exact grade', () => {
    expect(isGradeBand(4, 4)).toBe(false);
    expect(isGradeBand(0, 0)).toBe(false);
  });

  // The regression: a V3-V4 hold is a range, so logging must ask for the exact grade
  // on it -- the same rule the refine pass uses, or it gets nagged about later.
  it('flags every band wider than one grade', () => {
    expect(isGradeBand(3, 4)).toBe(true);
    expect(isGradeBand(4, 6)).toBe(true);
    expect(isGradeBand(6, 9)).toBe(true);
  });

  it('flags wider bands too', () => {
    expect(isGradeBand(4, 6)).toBe(true);
  });
});

describe('midpointGrade', () => {
  it('returns the exact middle of an odd-width band', () => {
    expect(midpointGrade(4, 6)).toBe(5);
  });

  it('floors an even-width band so it never inflates a personal best', () => {
    // V6-V9 resolves to V7, not V8 — guessing upward would invent a harder send.
    expect(midpointGrade(6, 9)).toBe(7);
  });

  it('is a no-op on an already-exact grade', () => {
    expect(midpointGrade(5, 5)).toBe(5);
  });
});

describe('findSessionHighIndex', () => {
  const logs = [{ gradeMax: 3 }, { gradeMax: 5 }, { gradeMax: 6 }, { gradeMax: 6 }];

  it('is null with no prior history to beat', () => {
    expect(findSessionHighIndex(logs, null)).toBeNull();
  });

  it('flags the first log at the session high when it beats the prior best', () => {
    expect(findSessionHighIndex(logs, 4)).toBe(2);
  });

  it('moves to the later, higher climb rather than the first one over the bar', () => {
    expect(findSessionHighIndex([{ gradeMax: 5 }, { gradeMax: 7 }], 4)).toBe(1);
  });

  it('is null for an empty session', () => {
    expect(findSessionHighIndex([], 4)).toBeNull();
  });

  it('does not count a tie as a new high', () => {
    expect(findSessionHighIndex(logs, 6)).toBeNull();
  });
});
