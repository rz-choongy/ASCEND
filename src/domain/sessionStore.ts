import * as Crypto from 'expo-crypto';
import { getAll, getFirst, run } from '../db/db';
import { applyClimbEvents } from './climbLogUtils';
import type {
  ActiveSessionEventType,
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
  if (!session || session.status !== 'completed') {
    throw new Error('Cannot correct a session that is not completed.');
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
  run('UPDATE sessions SET status = ? WHERE id = ? AND status = ?;', [
    'deleted',
    sessionId,
    'completed',
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

export function getSessionsForMonth(year: number, month: number): SessionRow[] {
  // month is 0-indexed (JS Date convention)
  const start = new Date(year, month, 1).getTime();
  const end = new Date(year, month + 1, 1).getTime();
  return getAll<SessionRow>(
    'SELECT * FROM sessions WHERE status = ? AND started_at >= ? AND started_at < ? ORDER BY started_at ASC',
    ['completed', start, end]
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
