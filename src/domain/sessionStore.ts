import * as Crypto from 'expo-crypto';
import { getAll, getFirst, run } from '../db/db';
import {
  applyClimbEvents,
  isGradeBand,
  midpointGrade,
  type ClimbLog,
} from './climbLogUtils';
import type {
  ActiveSessionEventType,
  ClimbLogPayload,
  EventRow,
  SessionCorrectionEventType,
  SessionEvent,
  SessionEventPayload,
  SessionEventType,
  SessionRow,
  SessionStatus,
  SessionType,
} from './types';

type SessionCreateOptions = {
  title?: string;
  gymId?: string;
};

const EVENT_SCHEMA_VERSION = 1;

const SESSION_EVENT_TYPES: readonly SessionEventType[] = [
  'CLIMB_LOGGED',
  'CLIMB_UNDONE',
  'CLIMB_EDITED',
  'CLIMB_DELETED',
  'SET_LOGGED',
  'SET_UNDONE',
  'SET_EDITED',
  'SET_DELETED',
];

const uuid = (): string => Crypto.randomUUID();

const isSessionEventType = (type: string): type is SessionEventType => {
  return SESSION_EVENT_TYPES.includes(type as SessionEventType);
};

export const createSession = (
  type: SessionType,
  opts: SessionCreateOptions = {}
): string => {
  const activeSession = getActiveSession();
  if (activeSession) {
    throw new Error('Finish the active session before starting another.');
  }

  const sessionId = uuid();
  run(
    `INSERT INTO sessions (
      id,
      type,
      status,
      started_at,
      completed_at,
      title,
      gym_id,
      notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      sessionId,
      type,
      'active',
      Date.now(),
      null,
      opts.title ?? null,
      opts.gymId ?? null,
      null,
    ]
  );
  return sessionId;
};

export const appendEvent = <T extends ActiveSessionEventType>(
  sessionId: string,
  type: T,
  payload: SessionEventPayload<T>
): string => {
  const session = getSessionById(sessionId);
  if (!session || session.status !== 'active') {
    throw new Error('Cannot append events to an inactive session.');
  }

  const eventId = uuid();
  const payloadJson = JSON.stringify(payload ?? null) ?? 'null';
  run(
    `INSERT INTO events (
      id,
      session_id,
      type,
      payload_json,
      schema_version,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?);`,
    [eventId, sessionId, type, payloadJson, EVENT_SCHEMA_VERSION, Date.now()]
  );
  return eventId;
};

export const appendSessionCorrectionEvent = <T extends SessionCorrectionEventType>(
  sessionId: string,
  type: T,
  payload: SessionEventPayload<T>
): string => {
  const session = getSessionById(sessionId);
  if (!session || (session.status !== 'completed' && session.status !== 'abandoned')) {
    throw new Error('Cannot correct a session that is not completed or abandoned.');
  }

  const eventId = uuid();
  const payloadJson = JSON.stringify(payload ?? null) ?? 'null';
  run(
    `INSERT INTO events (
      id,
      session_id,
      type,
      payload_json,
      schema_version,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?);`,
    [eventId, sessionId, type, payloadJson, EVENT_SCHEMA_VERSION, Date.now()]
  );
  return eventId;
};

export const getActiveSession = (): SessionRow | null => {
  return getFirst<SessionRow>(
    'SELECT * FROM sessions WHERE status = ? ORDER BY started_at DESC LIMIT 1;',
    ['active']
  );
};

export const getSessionById = (sessionId: string): SessionRow | null => {
  return getFirst<SessionRow>('SELECT * FROM sessions WHERE id = ? LIMIT 1;', [sessionId]);
};

export const getSessionEvents = (sessionId: string): SessionEvent[] => {
  const rows = getAll<EventRow>(
    'SELECT id, type, payload_json, schema_version, created_at FROM events WHERE session_id = ? ORDER BY created_at ASC, rowid ASC;',
    [sessionId]
  );
  return rows.map((row) => {
    let payload: unknown = null;
    try {
      payload = JSON.parse(row.payload_json);
    } catch {
      payload = row.payload_json;
    }
    if (!isSessionEventType(row.type)) {
      return {
        id: row.id,
        type: 'UNKNOWN',
        originalType: row.type,
        payload,
        schemaVersion: row.schema_version ?? 1,
        createdAt: row.created_at,
      };
    }
    return {
      id: row.id,
      type: row.type,
      payload: payload as SessionEventPayload<SessionEventType>,
      schemaVersion: row.schema_version ?? 1,
      createdAt: row.created_at,
    };
  });
};

export const setSessionStatus = (
  sessionId: string,
  status: SessionStatus
): void => {
  if (status === 'completed') {
    run('UPDATE sessions SET status = ?, completed_at = ? WHERE id = ?;', [
      status,
      Date.now(),
      sessionId,
    ]);
    return;
  }

  run('UPDATE sessions SET status = ?, completed_at = NULL WHERE id = ?;', [
    status,
    sessionId,
  ]);
};

export const removeSessionFromHistory = (sessionId: string): void => {
  run('UPDATE sessions SET status = ? WHERE id = ? AND status IN (?, ?);', [
    'deleted',
    sessionId,
    'completed',
    'abandoned',
  ]);
};

export const setSessionNotes = (sessionId: string, notes: string): void => {
  run('UPDATE sessions SET notes = ? WHERE id = ?;', [notes, sessionId]);
};

export const setSessionTitle = (sessionId: string, title: string): void => {
  const normalizedTitle = title.trim();
  run('UPDATE sessions SET title = ? WHERE id = ?;', [
    normalizedTitle.length > 0 ? normalizedTitle : null,
    sessionId,
  ]);
};

export const canChangeSessionGym = (sessionId: string): boolean => {
  return applyClimbEvents(getSessionEvents(sessionId)).length === 0;
};

export const setSessionGymId = (sessionId: string, gymId: string | null): boolean => {
  if (!canChangeSessionGym(sessionId)) {
    return false;
  }
  run('UPDATE sessions SET gym_id = ? WHERE id = ?;', [gymId, sessionId]);
  return true;
};

export type WideBandSummary = {
  sessions: number;
  climbs: number;
};

/** Completed/abandoned climb sessions holding at least one range-logged climb. */
const findWideBandClimbs = (): { sessionId: string; climbs: ClimbLog[] }[] => {
  const rows = getAll<SessionRow>(
    "SELECT * FROM sessions WHERE status IN ('completed', 'abandoned') AND type = 'climb';"
  );
  const found: { sessionId: string; climbs: ClimbLog[] }[] = [];
  rows.forEach((session) => {
    const wide = applyClimbEvents(getSessionEvents(session.id)).filter((log) =>
      isGradeBand(log.gradeMin, log.gradeMax)
    );
    if (wide.length > 0) {
      found.push({ sessionId: session.id, climbs: wide });
    }
  });
  return found;
};

const summarize = (found: { climbs: ClimbLog[] }[]): WideBandSummary => ({
  sessions: found.length,
  climbs: found.reduce((sum, entry) => sum + entry.climbs.length, 0),
});

/** How much history a refine pass would touch, for confirming before running it. */
export const countWideGradeBandClimbs = (): WideBandSummary => summarize(findWideBandClimbs());

/**
 * Narrows already-logged wide bands to their midpoint grade.
 *
 * Appends CLIMB_EDITED corrections rather than rewriting the original events — the
 * log stays append-only, so the band a climb was actually logged at is still on
 * record and this stays inspectable (and undoable) after the fact.
 */
export const narrowWideGradeBands = (): WideBandSummary => {
  const found = findWideBandClimbs();
  found.forEach(({ sessionId, climbs }) => {
    climbs.forEach((log) => {
      const value = midpointGrade(log.gradeMin, log.gradeMax);
      appendSessionCorrectionEvent(sessionId, 'CLIMB_EDITED', {
        eventId: log.eventId,
        gradeLabel: log.gradeLabel,
        gradeMin: value,
        gradeMax: value,
        gradeColor: log.gradeColor ?? null,
        gradeId: log.gradeId,
        gymId: log.gymId,
        result: log.result,
      });
    });
  });
  return summarize(found);
};

export function getSessionsForMonth(
  year: number,
  month: number,
  status: SessionStatus = 'completed'
): SessionRow[] {
  // month is 0-indexed (JS Date convention)
  const start = new Date(year, month, 1).getTime();
  const end = new Date(year, month + 1, 1).getTime();
  return getAll<SessionRow>(
    'SELECT * FROM sessions WHERE status = ? AND started_at >= ? AND started_at < ? ORDER BY started_at ASC',
    [status, start, end]
  );
}

export function getAllCompletedSessionCount(): number {
  const row = getFirst<{ n: number }>(
    'SELECT COUNT(*) AS n FROM sessions WHERE status = ?;',
    ['completed']
  );
  return row?.n ?? 0;
}

export function getSessionStreak(): number {
  const rows = getAll<{ day: string }>(
    `SELECT DISTINCT date(started_at / 1000, 'unixepoch', 'localtime') AS day
     FROM sessions WHERE status = 'completed'
     ORDER BY day DESC;`
  );
  if (rows.length === 0) return 0;

  // Only count if the most recent session was today or yesterday (streak alive)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const mostRecent = new Date(rows[0].day + 'T00:00:00');
  const daysSinceLast = Math.round((today.getTime() - mostRecent.getTime()) / 86_400_000);
  if (daysSinceLast > 1) return 0;

  // Count consecutive days backwards from the most recent
  let streak = 1;
  let prev = mostRecent;
  for (let i = 1; i < rows.length; i++) {
    const curr = new Date(rows[i].day + 'T00:00:00');
    const diff = Math.round((prev.getTime() - curr.getTime()) / 86_400_000);
    if (diff === 1) {
      streak += 1;
      prev = curr;
    } else {
      break;
    }
  }
  return streak;
}

export function getCompletedSessions(type?: SessionType): SessionRow[] {
  if (type) {
    return getAll<SessionRow>(
      'SELECT * FROM sessions WHERE status = ? AND type = ? ORDER BY started_at ASC;',
      ['completed', type]
    );
  }
  return getAll<SessionRow>(
    'SELECT * FROM sessions WHERE status = ? ORDER BY started_at ASC;',
    ['completed']
  );
}

/** Sessions left mid-way (closed without finishing) rather than explicitly deleted. */
export function getAbandonedSessions(type?: SessionType): SessionRow[] {
  if (type) {
    return getAll<SessionRow>(
      'SELECT * FROM sessions WHERE status = ? AND type = ? ORDER BY started_at ASC;',
      ['abandoned', type]
    );
  }
  return getAll<SessionRow>(
    'SELECT * FROM sessions WHERE status = ? ORDER BY started_at ASC;',
    ['abandoned']
  );
}

/** startMs inclusive, endMs exclusive. */
export function getSessionsForDateRange(
  startMs: number,
  endMs: number,
  status: SessionStatus = 'completed'
): SessionRow[] {
  return getAll<SessionRow>(
    'SELECT * FROM sessions WHERE status = ? AND started_at >= ? AND started_at < ? ORDER BY started_at ASC',
    [status, startMs, endMs]
  );
}

export function getSessionsForDate(dateStr: string): SessionRow[] {
  // dateStr is 'YYYY-MM-DD'
  const [y, m, d] = dateStr.split('-').map(Number);
  const start = new Date(y, m - 1, d).getTime();
  const end = new Date(y, m - 1, d + 1).getTime();
  return getAll<SessionRow>(
    'SELECT * FROM sessions WHERE status = ? AND started_at >= ? AND started_at < ? ORDER BY started_at ASC',
    ['completed', start, end]
  );
}

export type ExternalClimbInput = {
  /** The other service's id for this send; the dedupe key. */
  externalId: string;
  createdAt: number;
  payload: ClimbLogPayload;
  /** The climb's name at the source, when it has one -- recorded as a note line. */
  climbName?: string | null;
};

export type ExternalClimbSessionInput = {
  source: string;
  gymId: string;
  title: string;
  climbs: ExternalClimbInput[];
};

/** One line per named climb, e.g. "Bomb Pop (V4)"; unnamed climbs are left out rather than noised up with a placeholder. */
const climbNoteLine = (climb: ExternalClimbInput): string | null =>
  climb.climbName ? `${climb.climbName} (${climb.payload.gradeLabel})` : null;

/** Appends lines not already present, so a re-sync or a same-day repeat of a climb never duplicates a note, and never touches what the user already wrote. */
const mergeNoteLines = (existing: string | null, newLines: string[]): string | null => {
  const existingLines = existing ? existing.split('\n') : [];
  const seen = new Set(existingLines);
  const toAdd: string[] = [];
  newLines.forEach((line) => {
    if (!seen.has(line)) {
      seen.add(line);
      toAdd.push(line);
    }
  });
  if (toAdd.length === 0) return existing;
  return [...existingLines, ...toAdd].join('\n');
};

const inTransaction = (work: () => void): void => {
  run('BEGIN TRANSACTION;');
  try {
    work();
    run('COMMIT;');
  } catch (error) {
    run('ROLLBACK;');
    throw error;
  }
};

/**
 * Writes sends from another service as already-completed history, with their original
 * timestamps -- the live-logging path (`createSession`/`appendEvent`) stamps "now" and refuses
 * to run beside an active session, so it can't do this. Sends already imported (same
 * `source` + `externalId`) are skipped, and a day that was imported before gets the new sends
 * appended to its session instead of a second one. Named climbs get a note line appended to the
 * session's notes (deduped against what's there, existing notes never overwritten). Returns how
 * many sends were new.
 */
export const importExternalClimbSession = (input: ExternalClimbSessionInput): number => {
  const fresh = input.climbs
    .filter(
      (climb) =>
        !getFirst<{ found: number }>(
          'SELECT 1 AS found FROM external_logs WHERE source = ? AND external_id = ? LIMIT 1;',
          [input.source, climb.externalId]
        )
    )
    .sort((a, b) => a.createdAt - b.createdAt);
  if (fresh.length === 0) return 0;

  const first = fresh[0].createdAt;
  const last = fresh[fresh.length - 1].createdAt;
  const day = new Date(first);
  const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
  const dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1).getTime();

  inTransaction(() => {
    const existing = getFirst<SessionRow>(
      `SELECT s.* FROM sessions s
       WHERE s.status = 'completed' AND s.type = 'climb'
         AND s.started_at >= ? AND s.started_at < ?
         AND EXISTS (SELECT 1 FROM external_logs l WHERE l.session_id = s.id AND l.source = ?)
       LIMIT 1;`,
      [dayStart, dayEnd, input.source]
    );

    const newLines = fresh.map(climbNoteLine).filter((line): line is string => line !== null);

    let sessionId: string;
    if (existing) {
      sessionId = existing.id;
      run('UPDATE sessions SET started_at = MIN(started_at, ?), completed_at = MAX(COALESCE(completed_at, 0), ?) WHERE id = ?;', [
        first,
        last,
        sessionId,
      ]);
      const mergedNotes = mergeNoteLines(existing.notes, newLines);
      if (mergedNotes !== existing.notes) {
        run('UPDATE sessions SET notes = ? WHERE id = ?;', [mergedNotes, sessionId]);
      }
    } else {
      sessionId = uuid();
      run(
        `INSERT INTO sessions (id, type, status, started_at, completed_at, title, gym_id, notes)
         VALUES (?, 'climb', 'completed', ?, ?, ?, ?, ?);`,
        [sessionId, first, last, input.title, input.gymId, mergeNoteLines(null, newLines)]
      );
    }

    fresh.forEach((climb) => {
      const eventId = uuid();
      run(
        `INSERT INTO events (id, session_id, type, payload_json, schema_version, created_at)
         VALUES (?, ?, 'CLIMB_LOGGED', ?, ?, ?);`,
        [eventId, sessionId, JSON.stringify(climb.payload), EVENT_SCHEMA_VERSION, climb.createdAt]
      );
      run('INSERT INTO external_logs (source, external_id, session_id, event_id) VALUES (?, ?, ?, ?);', [
        input.source,
        climb.externalId,
        sessionId,
        eventId,
      ]);
    });
  });

  return fresh.length;
};
