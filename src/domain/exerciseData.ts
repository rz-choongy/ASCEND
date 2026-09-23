import { deactivateExercise } from './exerciseStore';
import { appendSessionCorrectionEvent, getSessionEvents, removeSessionFromHistory } from './sessionStore';
import { applySetEvents, type LoggedSet } from './strengthLogUtils';
import type { ExerciseRow, SessionRow } from './types';

// Deleting an exercise takes its logged sets with it. History is append-only, so
// that's done with SET_DELETED corrections rather than by removing events.

/** Sets logged before exercises had ids only carry the name, so match on that too. */
const belongsTo = (set: LoggedSet, exercise: Pick<ExerciseRow, 'id' | 'name'>): boolean =>
  set.exerciseId
    ? set.exerciseId === exercise.id
    : set.exerciseName.trim().toLowerCase() === exercise.name.trim().toLowerCase();

export type ExerciseDataCount = {
  sets: number;
  sessions: number;
  /** Sets in a session that's still open -- those can't be corrected yet. */
  activeSets: number;
};

/** `sessions`: every strength session that isn't deleted (completed, abandoned or active). */
export const countExerciseData = (
  sessions: SessionRow[],
  exercise: Pick<ExerciseRow, 'id' | 'name'>
): ExerciseDataCount => {
  let sets = 0;
  let sessionCount = 0;
  let activeSets = 0;
  sessions
    .filter((s) => s.type === 'strength')
    .forEach((session) => {
      const n = applySetEvents(getSessionEvents(session.id)).filter((set) => belongsTo(set, exercise)).length;
      if (n === 0) return;
      if (session.status === 'active') activeSets += n;
      else {
        sets += n;
        sessionCount += 1;
      }
    });
  return { sets, sessions: sessionCount, activeSets };
};

/**
 * Removes every logged set of the exercise from finished sessions, then hides the
 * exercise. A session left with no sets at all goes too, rather than lingering as
 * an empty workout. Refuses while the open session has sets of it (undo those first).
 */
export const deleteExerciseWithData = (
  sessions: SessionRow[],
  exercise: Pick<ExerciseRow, 'id' | 'name'>
): void => {
  const strength = sessions.filter((s) => s.type === 'strength');
  if (strength.some((s) => s.status === 'active' && applySetEvents(getSessionEvents(s.id)).some((set) => belongsTo(set, exercise)))) {
    throw new Error('This exercise has sets in the session you have open. Undo them first.');
  }
  strength
    .filter((s) => s.status === 'completed' || s.status === 'abandoned')
    .forEach((session) => {
      const sets = applySetEvents(getSessionEvents(session.id));
      const doomed = sets.filter((set) => belongsTo(set, exercise));
      if (doomed.length === 0) return;
      doomed.forEach((set) => appendSessionCorrectionEvent(session.id, 'SET_DELETED', { eventId: set.eventId }));
      if (doomed.length === sets.length) removeSessionFromHistory(session.id);
    });
  deactivateExercise(exercise.id);
};
