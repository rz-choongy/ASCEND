import * as Crypto from 'expo-crypto';
import { getAll, run } from '../db/db';
import type { PlannedSessionRow, SessionRow, SessionType } from './types';
import { formatLocalDate, parseLocalDate, toDayEndMs, toDayStartMs } from './dateUtils';

export type PlannedSessionItem = {
  id: string;
  date: string;
  sessionType: SessionType;
  orderIndex: number;
};

export type CompletedSessionItem = {
  id: string;
  date: string;
  sessionType: SessionType;
  startedAt: number;
};

const uuid = (): string => Crypto.randomUUID();

export const addPlannedSession = (date: string, sessionType: SessionType): string => {
  const maxOrder = getAll<{ max_order: number | null }>(
    'SELECT MAX(order_index) AS max_order FROM planned_sessions WHERE date = ?;',
    [date]
  );
  const nextOrder = (maxOrder[0]?.max_order ?? -1) + 1;
  const plannedId = uuid();

  run(
    `INSERT INTO planned_sessions (
      id,
      date,
      template_id,
      session_type,
      order_index,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?);`,
    [plannedId, date, null, sessionType, nextOrder, Date.now()]
  );

  return plannedId;
};

export const removePlannedSession = (plannedSessionId: string): void => {
  run('DELETE FROM planned_sessions WHERE id = ?;', [plannedSessionId]);
};

export const getPlannedSessionsForDate = (date: string): PlannedSessionItem[] => {
  const rows = getAll<PlannedSessionRow>(
    `SELECT id, date, template_id, session_type, order_index, created_at
     FROM planned_sessions
     WHERE date = ?
     ORDER BY order_index ASC;`,
    [date]
  );

  return rows.map((row) => ({
    id: row.id,
    date: row.date,
    sessionType: row.session_type,
    orderIndex: row.order_index,
  }));
};

export const getPlannedSessionsInRange = (startDate: string, endDate: string): PlannedSessionItem[] => {
  const rows = getAll<PlannedSessionRow>(
    `SELECT id, date, template_id, session_type, order_index, created_at
     FROM planned_sessions
     WHERE date >= ? AND date <= ?
     ORDER BY date ASC, order_index ASC;`,
    [startDate, endDate]
  );

  return rows.map((row) => ({
    id: row.id,
    date: row.date,
    sessionType: row.session_type,
    orderIndex: row.order_index,
  }));
};

export const getCompletedSessionsInRange = (startDate: string, endDate: string): CompletedSessionItem[] => {
  const startMs = toDayStartMs(parseLocalDate(startDate));
  const endMs = toDayEndMs(parseLocalDate(endDate));
  const rows = getAll<SessionRow>(
    `SELECT id, type, status, started_at, completed_at, title, gym_id, notes
     FROM sessions
     WHERE status = 'completed' AND started_at >= ? AND started_at <= ?
     ORDER BY started_at ASC;`,
    [startMs, endMs]
  );

  return rows.map((row) => ({
    id: row.id,
    date: formatLocalDate(new Date(row.started_at)),
    sessionType: row.type,
    startedAt: row.started_at,
  }));
};
