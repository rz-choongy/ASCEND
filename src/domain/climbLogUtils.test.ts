import {
  applyClimbEvents,
  isGradeBand,
  midpointGrade,
  findSessionHighIndex,
  formatVGrade,
  isNewThirtyDayHigh,
  loggedClimbVGrade,
  pickStartingGrade,
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

describe('formatVGrade', () => {
  it('returns null for labels that are already V grades', () => {
    expect(formatVGrade('V5', 5, 5)).toBeNull();
    expect(formatVGrade('v3-4', 3, 4)).toBeNull();
  });

  it('formats a single grade and a band', () => {
    expect(formatVGrade('Green', 5, 5)).toBe('V5');
    expect(formatVGrade('6', 4, 6)).toBe('V4–6');
  });
});

describe('loggedClimbVGrade', () => {
  it('returns null at a V-labelled gym', () => {
    expect(loggedClimbVGrade({ gradeLabel: 'V5', gradeMin: 5, gradeMax: 5 }, { min: 5, max: 5 })).toBeNull();
  });

  it('shows the exact grade when one was logged', () => {
    expect(loggedClimbVGrade({ gradeLabel: '5', gradeMin: 5, gradeMax: 5 }, { min: 4, max: 6 })).toBe('V5');
  });

  it("shows the option's range for a range-logged climb", () => {
    expect(loggedClimbVGrade({ gradeLabel: 'Blue', gradeMin: 4, gradeMax: 6 }, { min: 4, max: 6 })).toBe('V4–6');
  });

  it("falls back to the climb's own grades when the option is missing", () => {
    expect(loggedClimbVGrade({ gradeLabel: 'Blue', gradeMin: 4, gradeMax: 6 }, undefined)).toBe('V4–6');
    expect(loggedClimbVGrade({ gradeLabel: 'Red', gradeMin: 7, gradeMax: 7 }, null)).toBe('V7');
  });
});

describe('isNewThirtyDayHigh', () => {
  it('is false with no prior history to beat', () => {
    expect(isNewThirtyDayHigh([], 6, null)).toBe(false);
  });

  it('is true when the climb beats the 30-day bar and the session so far', () => {
    expect(isNewThirtyDayHigh([{ gradeMax: 4 }], 6, 5)).toBe(true);
  });

  it('is false when it only ties the bar', () => {
    expect(isNewThirtyDayHigh([], 5, 5)).toBe(false);
  });

  it('is false for a repeat of the session high, which keeps the badge on the first', () => {
    expect(isNewThirtyDayHigh([{ gradeMax: 6 }], 6, 5)).toBe(false);
  });

  it('agrees with findSessionHighIndex on the new row', () => {
    const before = [{ gradeMax: 6 }];
    expect(isNewThirtyDayHigh(before, 7, 5)).toBe(true);
    expect(findSessionHighIndex([...before, { gradeMax: 7 }], 5)).toBe(1);
  });
});

describe('pickStartingGrade', () => {
  const vOptions = [
    { id: 'v0', label: 'V0', min: 0, max: 0 },
    { id: 'v3', label: 'V3', min: 3, max: 3 },
    { id: 'v5', label: 'V5', min: 5, max: 5 },
  ];
  const log = (gradeLabel: string, gradeMin: number, gradeMax = gradeMin, extra: object = {}) => ({
    gradeLabel,
    gradeMin,
    gradeMax,
    ...extra,
  });
  const past = (gymId: string | null, logs: ReturnType<typeof log>[]) => ({
    gymId,
    getLogs: jest.fn(() => logs),
  });

  it('uses the last climb logged in this session', () => {
    const picked = pickStartingGrade(vOptions, [log('V3', 3), log('V5', 5)], [past('g1', [log('V0', 0)])], 'g1');
    expect(picked?.id).toBe('v5');
  });

  it('falls back to the last climb of the newest past session at the same gym', () => {
    const picked = pickStartingGrade(
      vOptions,
      [],
      [past('g2', [log('V5', 5)]), past('g1', [log('V0', 0), log('V3', 3)]), past('g1', [log('V5', 5)])],
      'g1'
    );
    expect(picked?.id).toBe('v3');
  });

  it('skips past sessions with no climbs', () => {
    const picked = pickStartingGrade(vOptions, [], [past('g1', []), past('g1', [log('V5', 5)])], 'g1');
    expect(picked?.id).toBe('v5');
  });

  it('falls back to any gym when this gym has no history', () => {
    const picked = pickStartingGrade(vOptions, [], [past('g2', [log('V3', 3)])], 'g1');
    expect(picked?.id).toBe('v3');
  });

  it('falls back to the first option with no history at all', () => {
    expect(pickStartingGrade(vOptions, [], [], 'g1')?.id).toBe('v0');
  });

  it('matches by grade id first, so an exact pick off a band lands on the band', () => {
    const colours = [
      { id: 'blue', label: 'Blue', min: 0, max: 2 },
      { id: 'red', label: 'Red', min: 4, max: 6 },
    ];
    const picked = pickStartingGrade(colours, [log('Red', 5, 5, { gradeId: 'red' })], [], 'g1');
    expect(picked?.id).toBe('red');
  });

  it('maps a grade from another gym onto the band that holds it', () => {
    const colours = [
      { id: 'blue', label: 'Blue', min: 0, max: 2 },
      { id: 'red', label: 'Red', min: 4, max: 6 },
    ];
    const picked = pickStartingGrade(colours, [], [past('g2', [log('V5', 5)])], 'g1');
    expect(picked?.id).toBe('red');
  });

  it('moves on when the remembered grade no longer exists at this gym', () => {
    const picked = pickStartingGrade(
      vOptions,
      [],
      [past('g1', [log('V9', 9, 9, { gradeId: 'gone' })]), past('g1', [log('V3', 3)])],
      'g1'
    );
    expect(picked?.id).toBe('v3');
  });

  it('does not read events for other gyms while looking for this one', () => {
    const other = past('g2', [log('V5', 5)]);
    pickStartingGrade(vOptions, [], [other, past('g1', [log('V3', 3)])], 'g1');
    expect(other.getLogs).not.toHaveBeenCalled();
  });
});
