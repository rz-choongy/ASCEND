import { getAll, run } from './db';

export const migrate = (): void => {
  run('PRAGMA journal_mode = WAL;');
  run('PRAGMA foreign_keys = ON;');

  run(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY NOT NULL,
      type TEXT NOT NULL,
      status TEXT NOT NULL,
      started_at INTEGER NOT NULL,
      completed_at INTEGER,
      title TEXT,
      gym_id TEXT,
      notes TEXT
    );
  `);

  const sessionColumns = getAll<{ name: string }>('PRAGMA table_info(sessions);');
  const hasGymId = sessionColumns.some((column) => column.name === 'gym_id');

  if (!hasGymId) {
    run('ALTER TABLE sessions ADD COLUMN gym_id TEXT;');
  }

  run(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY NOT NULL,
      session_id TEXT NOT NULL,
      type TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (session_id) REFERENCES sessions(id)
    );
  `);
};
