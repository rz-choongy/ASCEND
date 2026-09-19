import {
  applyClimbEvents,
  isGradeBand,
  midpointGrade,
  spansMultipleGrades,
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
});

describe('spansMultipleGrades', () => {
  it('leaves exact grades and two-grade bands alone', () => {
    expect(spansMultipleGrades(4, 4)).toBe(false);
    expect(spansMultipleGrades(4, 5)).toBe(false);
  });

  it('flags bands covering three or more grades', () => {
    expect(spansMultipleGrades(4, 6)).toBe(true);
    expect(spansMultipleGrades(6, 9)).toBe(true);
  });
});

describe('isGradeBand', () => {
  it('is false only for an exact grade', () => {
    expect(isGradeBand(4, 4)).toBe(false);
    expect(isGradeBand(0, 0)).toBe(false);
  });

  // The regression: a V3-V4 hold is a range, so analytics and the refine pass
  // have to see it as one even though logging waves it through without asking.
  it('flags a two-grade band that logging deliberately allows', () => {
    expect(isGradeBand(3, 4)).toBe(true);
    expect(spansMultipleGrades(3, 4)).toBe(false);
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
