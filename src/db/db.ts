import { openDatabaseSync, type SQLiteBindParams, type SQLiteRunResult } from 'expo-sqlite';

export const db = openDatabaseSync('workout_tracker.db');

export const run = (sql: string, params: SQLiteBindParams = []): SQLiteRunResult => {
  return db.runSync(sql, params);
};

export const getAll = <T>(sql: string, params: SQLiteBindParams = []): T[] => {
  return db.getAllSync<T>(sql, params);
};

export const getFirst = <T>(sql: string, params: SQLiteBindParams = []): T | null => {
  return db.getFirstSync<T>(sql, params);
};
