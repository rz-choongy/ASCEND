import { applySetEvents } from './strengthLogUtils';

const event = (id: string, type: string, payload: unknown, createdAt = 1) => ({
  id,
  type,
  payload,
  createdAt,
});

describe('applySetEvents', () => {
  it('replays logged sets and undo events in order', () => {
    const sets = applySetEvents([
      event('a', 'SET_LOGGED', {
        exerciseId: 'exercise-pullups',
        exerciseName: 'Pull-ups',
        reps: 8,
        weight: 0,
        unit: 'kg',
      }),
      event('b', 'SET_LOGGED', {
        exerciseId: 'exercise-row',
        exerciseName: 'Barbell Row',
        reps: 5,
        weight: 60,
        unit: 'kg',
      }),
      event('c', 'SET_UNDONE', { at: 3 }),
    ]);

    expect(sets).toHaveLength(1);
    expect(sets[0]).toMatchObject({
      eventId: 'a',
      exerciseId: 'exercise-pullups',
      exerciseName: 'Pull-ups',
      reps: 8,
      weight: 0,
    });
  });

  it('applies target-addressed edits and deletes', () => {
    const sets = applySetEvents([
      event('a', 'SET_LOGGED', {
        exerciseId: 'exercise-pullups',
        exerciseName: 'Pull-ups',
        reps: 8,
        weight: 0,
        unit: 'kg',
      }),
      event('b', 'SET_LOGGED', {
        exerciseId: 'exercise-dips',
        exerciseName: 'Dips',
        reps: 8,
        weight: 10,
        unit: 'kg',
      }),
      event('c', 'SET_EDITED', {
        eventId: 'a',
        exerciseId: 'exercise-pullups',
        exerciseName: 'Pull-ups',
        reps: 10,
        weight: 5,
        unit: 'kg',
      }),
      event('d', 'SET_DELETED', { eventId: 'b' }),
    ]);

    expect(sets).toEqual([
      {
        eventId: 'a',
        exerciseId: 'exercise-pullups',
        exerciseName: 'Pull-ups',
        reps: 10,
        weight: 5,
        unit: 'kg',
        createdAt: 1,
      },
    ]);
  });

  it('ignores malformed set payloads', () => {
    const sets = applySetEvents([
      event('a', 'SET_LOGGED', {
        exerciseName: 'Pull-ups',
        reps: '8',
        weight: 0,
        unit: 'kg',
      }),
    ]);

    expect(sets).toEqual([]);
  });
});
