import { applyClimbEvents } from './climbLogUtils';

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
