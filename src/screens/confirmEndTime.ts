import { formatClockTime, formatDuration } from '../domain/dateUtils';
import { getLastLogAt, getSessionById, setSessionEndedAt, setSessionStatus } from '../domain/sessionStore';
import { syncActiveSessionNotification } from '../domain/sessionNotification';
import { showDialog } from '../ui';

// Past this gap between the last log and tapping Done, assume the session was left running.
const STALE_GAP_MS = 20 * 60_000;

/**
 * Completes a session, first asking whether it really ended at the last log when Done comes
 * long after it ("End at 6:12 pm or now?"). Calls onDone once the session is saved either way.
 */
export const finishSession = (sessionId: string, onDone?: () => void): void => {
  const session = getSessionById(sessionId);
  const lastLogAt = getLastLogAt(sessionId);
  const complete = (endAt: number | null) => {
    setSessionStatus(sessionId, 'completed');
    if (endAt != null) setSessionEndedAt(sessionId, endAt);
    void syncActiveSessionNotification();
    onDone?.();
  };

  if (!session || lastLogAt == null || Date.now() - lastLogAt < STALE_GAP_MS) {
    complete(null);
    return;
  }

  const what = session.type === 'climb' ? 'climb' : 'set';
  showDialog(
    'When did you finish?',
    `Your last ${what} was logged at ${formatClockTime(lastLogAt)}. Ending now would make this a ${formatDuration(session.started_at, Date.now())} session.`,
    [
      { text: `End at ${formatClockTime(lastLogAt)}`, onPress: () => complete(lastLogAt) },
      { text: 'End now', onPress: () => complete(null) },
    ]
  );
};
