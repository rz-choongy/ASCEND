import * as Crypto from 'expo-crypto';
import { getAll, getFirst, run } from '../db/db';
import type { BodyweightLogRow } from './types';

export type { BodyweightLogRow } from './types';

const uuid = (): string => Crypto.randomUUID();

export const logBodyweight = (weightKg: number, loggedAt: number = Date.now()): BodyweightLogRow => {
  if (!(weightKg > 0)) {
    throw new Error('Bodyweight must be greater than zero.');
  }
  const id = uuid();
  const createdAt = Date.now();
  run(
    `INSERT INTO bodyweight_logs (id, weight_kg, logged_at, created_at) VALUES (?, ?, ?, ?);`,
    [id, weightKg, loggedAt, createdAt]
  );
  return { id, weight_kg: weightKg, logged_at: loggedAt, created_at: createdAt };
};

export const getBodyweightLogs = (limit?: number): BodyweightLogRow[] => {
  const sql = limit
    ? 'SELECT * FROM bodyweight_logs ORDER BY logged_at DESC LIMIT ?;'
    : 'SELECT * FROM bodyweight_logs ORDER BY logged_at DESC;';
  return getAll<BodyweightLogRow>(sql, limit ? [limit] : []);
};

export const getLatestBodyweight = (): BodyweightLogRow | null =>
  getFirst<BodyweightLogRow>('SELECT * FROM bodyweight_logs ORDER BY logged_at DESC LIMIT 1;');

export const deleteBodyweightLog = (id: string): void => {
  run('DELETE FROM bodyweight_logs WHERE id = ?;', [id]);
};
