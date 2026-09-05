import { getAll, getFirst, run } from './db';

const now = (): number => Date.now();

const DEFAULT_CLIMB_GYM_ID = 'gym-default-v-scale';
const SELECTED_CLIMB_GYM_KEY = 'selected_climb_gym_id';

// Kept in sync by hand with gymStore.ts's defaultVScaleGrades -- this is the only other
// place the default V-scale grade set is defined (SQL seeding here needs snake_case params;
// gymStore's version feeds normal app code with camelCase fields), so a divergence between
// the two is exactly what caused the old V7+-only row here to double up against gymStore's
// later V7-V11+ split.
const defaultGrades = [
  { id: 'grade-default-v0', label: 'V0', grade_min: 0, grade_max: 0, color_hex: '#22C55E', sort_order: 0 },
  { id: 'grade-default-v1', label: 'V1', grade_min: 1, grade_max: 1, color_hex: '#84CC16', sort_order: 1 },
  { id: 'grade-default-v2', label: 'V2', grade_min: 2, grade_max: 2, color_hex: '#EAB308', sort_order: 2 },
  { id: 'grade-default-v3', label: 'V3', grade_min: 3, grade_max: 3, color_hex: '#F59E0B', sort_order: 3 },
  { id: 'grade-default-v4', label: 'V4', grade_min: 4, grade_max: 4, color_hex: '#F97316', sort_order: 4 },
  { id: 'grade-default-v5', label: 'V5', grade_min: 5, grade_max: 5, color_hex: '#EF4444', sort_order: 5 },
  { id: 'grade-default-v6', label: 'V6', grade_min: 6, grade_max: 6, color_hex: '#EC4899', sort_order: 6 },
  { id: 'grade-default-v7', label: 'V7', grade_min: 7, grade_max: 7, color_hex: '#D946EF', sort_order: 7 },
  { id: 'grade-default-v8', label: 'V8', grade_min: 8, grade_max: 8, color_hex: '#A855F7', sort_order: 8 },
  { id: 'grade-default-v9', label: 'V9', grade_min: 9, grade_max: 9, color_hex: '#6366F1', sort_order: 9 },
  { id: 'grade-default-v10', label: 'V10', grade_min: 10, grade_max: 10, color_hex: '#3B82F6', sort_order: 10 },
  { id: 'grade-default-v11-plus', label: 'V11+', grade_min: 11, grade_max: 17, color_hex: '#111827', sort_order: 11 },
];

const defaultExercises = [
  { id: 'exercise-pullups', name: 'Pull-ups', sort_order: 0 },
  { id: 'exercise-pushups', name: 'Push-ups', sort_order: 1 },
  { id: 'exercise-barbell-row', name: 'Barbell Row', sort_order: 2 },
  { id: 'exercise-hangboard', name: 'Hangboard', sort_order: 3 },
  { id: 'exercise-dips', name: 'Dips', sort_order: 4 },
];

const APP_SCHEMA_VERSION = 5;

type Migration = {
  version: number;
  up: () => void;
};

const getUserVersion = (): number => {
  return getFirst<{ user_version: number }>('PRAGMA user_version;')?.user_version ?? 0;
};

const setUserVersion = (version: number): void => {
  run(`PRAGMA user_version = ${version};`);
};

/** Backfills any columns missing from an existing table (e.g. an old dev DB predating a column added to the CREATE TABLE DDL). */
const ensureColumns = (table: string, columns: { name: string; ddl: string }[]): void => {
  const existing = getAll<{ name: string }>(`PRAGMA table_info(${table});`);
  const existingNames = new Set(existing.map((col) => col.name));
  columns.forEach((col) => {
    if (!existingNames.has(col.name)) {
      run(`ALTER TABLE ${table} ADD COLUMN ${col.ddl};`);
    }
  });
};

const ensureSchema = (): void => {
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

  ensureColumns('sessions', [
    { name: 'gym_id', ddl: 'gym_id TEXT' },
    { name: 'title', ddl: 'title TEXT' },
    { name: 'notes', ddl: 'notes TEXT' },
  ]);

  run(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY NOT NULL,
      session_id TEXT NOT NULL,
      type TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      schema_version INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (session_id) REFERENCES sessions(id)
    );
  `);

  ensureColumns('events', [
    { name: 'schema_version', ddl: 'schema_version INTEGER NOT NULL DEFAULT 1' },
  ]);

  run(`
    CREATE TABLE IF NOT EXISTS gyms (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      grading_type TEXT NOT NULL,
      is_default INTEGER NOT NULL DEFAULT 0,
      parent_id TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  ensureColumns('gyms', [
    { name: 'parent_id', ddl: 'parent_id TEXT' },
    { name: 'is_default', ddl: 'is_default INTEGER NOT NULL DEFAULT 0' },
    { name: 'created_at', ddl: 'created_at INTEGER NOT NULL DEFAULT 0' },
    { name: 'updated_at', ddl: 'updated_at INTEGER NOT NULL DEFAULT 0' },
  ]);

  run(`
    CREATE TABLE IF NOT EXISTS gym_grade_options (
      id TEXT PRIMARY KEY NOT NULL,
      gym_id TEXT NOT NULL,
      label TEXT NOT NULL,
      grade_min INTEGER NOT NULL,
      grade_max INTEGER NOT NULL,
      color_hex TEXT,
      sort_order INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (gym_id) REFERENCES gyms(id)
    );
  `);

  run('CREATE INDEX IF NOT EXISTS idx_gym_grade_options_gym_sort ON gym_grade_options(gym_id, sort_order);');

  run(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  run(`
    CREATE TABLE IF NOT EXISTS exercises (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      sort_order INTEGER NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);
};

/**
 * Seed data only -- must run once on true first-run (migration version 1), never as part
 * of the "re-run idempotently" safety net below. INSERT OR IGNORE on a fixed id is only a
 * no-op if that exact row still exists; once the user edits a gym's grades, the fixed-id
 * seed rows get deleted and replaced with fresh-uuid ones, so re-running this on every
 * launch was re-adding the original seed rows alongside the user's edits -- doubling the
 * grade list every time the app started.
 */
const seedDefaults = (): void => {
  const seededAt = now();

  run(
    `INSERT OR IGNORE INTO gyms (
      id,
      name,
      grading_type,
      is_default,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?);`,
    [DEFAULT_CLIMB_GYM_ID, 'Default V-Scale', 'v_scale', 1, seededAt, seededAt]
  );

  defaultGrades.forEach((grade) => {
    run(
      `INSERT OR IGNORE INTO gym_grade_options (
        id,
        gym_id,
        label,
        grade_min,
        grade_max,
        color_hex,
        sort_order,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        grade.id,
        DEFAULT_CLIMB_GYM_ID,
        grade.label,
        grade.grade_min,
        grade.grade_max,
        grade.color_hex,
        grade.sort_order,
        seededAt,
        seededAt,
      ]
    );
  });

  run(
    'INSERT OR IGNORE INTO app_settings (key, value, updated_at) VALUES (?, ?, ?);',
    [SELECTED_CLIMB_GYM_KEY, DEFAULT_CLIMB_GYM_ID, seededAt]
  );

  defaultExercises.forEach((exercise) => {
    run(
      `INSERT OR IGNORE INTO exercises (
        id,
        name,
        sort_order,
        active,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?);`,
      [exercise.id, exercise.name, exercise.sort_order, 1, seededAt, seededAt]
    );
  });
};

const ensureBaseSchema = (): void => {
  ensureSchema();
  seedDefaults();
};

/**
 * One-time cleanup for databases that already hit the reseed-doubling bug above: for each
 * gym, keep only the most-recently-updated grade_options row per label (the user's edit,
 * if they made one) and drop the rest.
 */
const dedupeGymGradeOptions = (): void => {
  run(`
    DELETE FROM gym_grade_options
    WHERE rowid NOT IN (
      SELECT g1.rowid FROM gym_grade_options g1
      WHERE g1.updated_at = (
        SELECT MAX(g2.updated_at) FROM gym_grade_options g2
        WHERE g2.gym_id = g1.gym_id AND g2.label = g1.label
      )
      GROUP BY g1.gym_id, g1.label
    );
  `);
};

const ensureBetaHardening = (): void => {
  // Preserve the newest active session if an old dev/beta DB somehow has duplicates.
  const activeSessions = getAll<{ id: string }>(
    'SELECT id FROM sessions WHERE status = ? ORDER BY started_at DESC, rowid DESC;',
    ['active']
  );
  activeSessions.slice(1).forEach((session) => {
    run('UPDATE sessions SET status = ?, completed_at = NULL WHERE id = ?;', [
      'abandoned',
      session.id,
    ]);
  });

  run('CREATE INDEX IF NOT EXISTS idx_events_session_created ON events(session_id, created_at);');
  run('CREATE INDEX IF NOT EXISTS idx_sessions_status_started ON sessions(status, started_at);');
  run(
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_sessions_one_active ON sessions(status) WHERE status = 'active';"
  );
};

const addGymParentIdColumn = (): void => {
  const gymColumns = getAll<{ name: string }>('PRAGMA table_info(gyms);');
  const hasParentId = gymColumns.some((col) => col.name === 'parent_id');
  if (!hasParentId) {
    run('ALTER TABLE gyms ADD COLUMN parent_id TEXT;');
  }
};

// Numeric-graded gyms used to seed every grade with color_hex NULL, so every logged climb
// looked identical (falling back to one neutral color everywhere colors are shown). Backfill
// existing rows with the same cycle gymStore.ts now assigns to newly created numeric gyms.
const numericGradeColorCycle = [
  '#22C55E', '#84CC16', '#EAB308', '#F59E0B', '#F97316',
  '#EF4444', '#EC4899', '#D946EF', '#A855F7', '#6366F1',
];

const backfillNumericGradeColors = (): void => {
  const rows = getAll<{ id: string; sort_order: number }>(
    `SELECT o.id AS id, o.sort_order AS sort_order
     FROM gym_grade_options o
     JOIN gyms g ON g.id = o.gym_id
     WHERE g.grading_type = 'numeric' AND o.color_hex IS NULL;`
  );
  rows.forEach((row) => {
    const color = numericGradeColorCycle[row.sort_order % numericGradeColorCycle.length];
    run('UPDATE gym_grade_options SET color_hex = ? WHERE id = ?;', [color, row.id]);
  });
};

const migrations: Migration[] = [
  { version: 1, up: ensureBaseSchema },
  { version: 2, up: ensureBetaHardening },
  { version: 3, up: addGymParentIdColumn },
  { version: 4, up: dedupeGymGradeOptions },
  { version: 5, up: backfillNumericGradeColors },
];

export const migrate = (): void => {
  run('PRAGMA journal_mode = WAL;');
  run('PRAGMA foreign_keys = ON;');

  let currentVersion = getUserVersion();
  for (const migration of migrations) {
    if (currentVersion >= migration.version) {
      continue;
    }
    migration.up();
    setUserVersion(migration.version);
    currentVersion = migration.version;
  }

  // Keep idempotent safety checks active for dev DBs whose user_version was touched manually.
  // Schema only -- never re-seed here, or every launch would re-add default rows the user
  // has since edited away (see seedDefaults' comment).
  if (currentVersion >= APP_SCHEMA_VERSION) {
    ensureSchema();
    ensureBetaHardening();
  }
};
