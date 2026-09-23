jest.mock('./sessionStore', () => ({
  getSessionEvents: jest.fn(),
  appendSessionCorrectionEvent: jest.fn(),
  removeSessionFromHistory: jest.fn(),
}));
jest.mock('./exerciseStore', () => ({
  deactivateExercise: jest.fn(),
}));

import { countExerciseData, deleteExerciseWithData } from './exerciseData';
import { deactivateExercise } from './exerciseStore';
import { appendSessionCorrectionEvent, getSessionEvents, removeSessionFromHistory } from './sessionStore';
import type { SessionRow } from './types';

const mockEvents = getSessionEvents as jest.Mock;
const mockCorrect = appendSessionCorrectionEvent as jest.Mock;
const mockDeactivate = deactivateExercise as jest.Mock;
const mockRemove = removeSessionFromHistory as jest.Mock;

const session = (id: string, status: SessionRow['status']): SessionRow => ({
  id,
  type: 'strength',
  status,
  started_at: 1,
  completed_at: 2,
  title: null,
  gym_id: null,
  notes: null,
});

const set = (id: string, exerciseName: string, exerciseId?: string) => ({
  id,
  type: 'SET_LOGGED',
  payload: { exerciseId, exerciseName, reps: 8, weight: 20, unit: 'kg' },
  createdAt: 1,
});

const facePulls = { id: 'ex-face', name: 'Face Pulls' };

beforeEach(() => {
  mockEvents.mockReset();
  mockCorrect.mockReset();
  mockDeactivate.mockReset();
  mockRemove.mockReset();
});

describe('countExerciseData', () => {
  it('counts sets by id, and by name for sets logged before ids existed', () => {
    mockEvents.mockImplementation((id: string) =>
      id === 's1'
        ? [set('a', 'Face Pulls', 'ex-face'), set('b', 'Pull-ups', 'ex-pull')]
        : [set('c', 'face pulls')]
    );
    expect(countExerciseData([session('s1', 'completed'), session('s2', 'completed')], facePulls)).toEqual({
      sets: 2,
      sessions: 2,
      activeSets: 0,
    });
  });

  it('counts the open session separately', () => {
    mockEvents.mockReturnValue([set('a', 'Face Pulls', 'ex-face')]);
    expect(countExerciseData([session('s1', 'active')], facePulls)).toEqual({ sets: 0, sessions: 0, activeSets: 1 });
  });
});

describe('deleteExerciseWithData', () => {
  it('deletes each of its sets with a correction event, then hides the exercise', () => {
    mockEvents.mockImplementation((id: string) =>
      id === 's1' ? [set('a', 'Face Pulls', 'ex-face'), set('b', 'Pull-ups', 'ex-pull')] : [set('c', 'Face Pulls', 'ex-face')]
    );
    deleteExerciseWithData([session('s1', 'completed'), session('s2', 'abandoned')], facePulls);
    expect(mockCorrect.mock.calls).toEqual([
      ['s1', 'SET_DELETED', { eventId: 'a' }],
      ['s2', 'SET_DELETED', { eventId: 'c' }],
    ]);
    expect(mockDeactivate).toHaveBeenCalledWith('ex-face');
    // s2 had nothing else in it, so it goes; s1 keeps its pull-ups.
    expect(mockRemove.mock.calls).toEqual([['s2']]);
  });

  it('refuses while the open session has sets of it, and changes nothing', () => {
    mockEvents.mockReturnValue([set('a', 'Face Pulls', 'ex-face')]);
    expect(() => deleteExerciseWithData([session('s1', 'completed'), session('s2', 'active')], facePulls)).toThrow(/Undo/);
    expect(mockCorrect).not.toHaveBeenCalled();
    expect(mockDeactivate).not.toHaveBeenCalled();
  });
});
