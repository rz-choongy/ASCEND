import * as Crypto from 'expo-crypto';
import { getAll, getFirst, run } from '../db/db';
import type { EventRow, SessionRow, SessionStatus, SessionType } from './types';

type SessionCreateOptions = {
  title?: string;
  gymId?: string;
};

type SessionEvent = {
  id: string;
  type: string;
  payload: unknown;
  createdAt: number;
};

const uuid = (): string => Crypto.randomUUID();

export const createSession = (
  type: SessionType,
  opts: SessionCreateOptions = {}
): string => {
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

export const appendEvent = (
  sessionId: string,
  type: string,
  payload: unknown
): string => {
  const eventId = uuid();
  const payloadJson = JSON.stringify(payload ?? null) ?? 'null';
  run(
    `INSERT INTO events (
      id,
      session_id,
      type,
      payload_json,
      created_at
    ) VALUES (?, ?, ?, ?, ?);`,
    [eventId, sessionId, type, payloadJson, Date.now()]
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
    'SELECT id, type, payload_json, created_at FROM events WHERE session_id = ? ORDER BY created_at ASC;',
    [sessionId]
  );
  return rows.map((row) => {
    let payload: unknown = null;
    try {
      payload = JSON.parse(row.payload_json);
    } catch {
      payload = row.payload_json;
    }
    return {
      id: row.id,
      type: row.type,
      payload,
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

export const setSessionNotes = (sessionId: string, notes: string): void => {
  run('UPDATE sessions SET notes = ? WHERE id = ?;', [notes, sessionId]);
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
