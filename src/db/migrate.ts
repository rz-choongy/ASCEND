import { run } from './db';

export const migrate = (): void => {
  run('PRAGMA journal_mode = WAL;');
  run('PRAGMA foreign_keys = ON;');

  run(`
    CREATE TABLE IF NOT EXISTS gyms (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      grading_type TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
  `);

  run(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY NOT NULL,
      type TEXT NOT NULL,
      status TEXT NOT NULL,
      started_at INTEGER NOT NULL,
      completed_at INTEGER,
      title TEXT,
      gym_id TEXT,
      notes TEXT,
      FOREIGN KEY (gym_id) REFERENCES gyms(id)
    );
  `);

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

  run(`
    CREATE TABLE IF NOT EXISTS gym_grade_map (
      id TEXT PRIMARY KEY NOT NULL,
      gym_id TEXT NOT NULL,
      label TEXT NOT NULL,
      grade_min INTEGER NOT NULL,
      grade_max INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      UNIQUE (gym_id, label),
      FOREIGN KEY (gym_id) REFERENCES gyms(id)
    );
  `);

  run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `);

  run(`
    CREATE TABLE IF NOT EXISTS planned_sessions (
      id TEXT PRIMARY KEY NOT NULL,
      date TEXT NOT NULL,
      template_id TEXT,
      session_type TEXT NOT NULL CHECK (session_type IN ('strength', 'climb')),
      order_index INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );
  `);
};
