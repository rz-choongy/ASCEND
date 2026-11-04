import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import { getAll, getFirst, run } from '../db/db';
import { ensureSelectedClimbGym, getGradeOptionsForGym } from '../domain/gymStore';
import { setAccentColorId, setThemeMode } from '../domain/settingsStore';
import type { AccentColorId } from '../ui/tokens/colors';

/**
 * Dev-only, web-only: `?seed` fills an empty database with a few weeks of sample
 * sessions so every screen has something to show; `?mode=light|dark` and
 * `?accent=<id>` set the theme. Used for design screenshots. Never runs in a build.
 */
export const applyDevUrlOptions = () => {
  if (!__DEV__ || Platform.OS !== 'web' || typeof window === 'undefined') return;
  const params = new URLSearchParams(window.location.search);
  const mode = params.get('mode');
  if (mode === 'light' || mode === 'dark') setThemeMode(mode);
  const accent = params.get('accent');
  if (accent) setAccentColorId(accent as AccentColorId);
  if (params.has('seed')) seedDemo();
};

const DAY = 86_400_000;
const uuid = () => Crypto.randomUUID();

const seedDemo = () => {
  const count = getFirst<{ n: number }>('SELECT COUNT(*) AS n FROM sessions;')?.n ?? 0;
  if (count > 0) return;
  const gym = ensureSelectedClimbGym();
  const grades = getGradeOptionsForGym(gym.id);
  const byLabel = (label: string) => grades.find((g) => g.label === label) ?? grades[0];

  const insertSession = (type: 'climb' | 'strength', start: number, minutes: number) => {
    const id = uuid();
    run(
      `INSERT INTO sessions (id, type, status, started_at, completed_at, title, gym_id, notes)
       VALUES (?, ?, 'completed', ?, ?, NULL, ?, NULL);`,
      [id, type, start, start + minutes * 60_000, type === 'climb' ? gym.id : null]
    );
    return id;
  };
  const insertEvent = (sessionId: string, type: string, payload: object, at: number) =>
    run(
      `INSERT INTO events (id, session_id, type, payload_json, schema_version, created_at)
       VALUES (?, ?, ?, ?, 1, ?);`,
      [uuid(), sessionId, type, JSON.stringify(payload), at]
    );

  const now = Date.now();
  const climbDays: [number, [string, 'SEND' | 'FLASH'][]][] = [
    [40, [['V0', 'SEND'], ['V0', 'SEND'], ['V1', 'FLASH'], ['V2', 'SEND']]],
    [26, [['V1', 'SEND'], ['V2', 'FLASH'], ['V3', 'SEND']]],
    [19, [['V2', 'FLASH'], ['V3', 'SEND'], ['V3', 'FLASH'], ['V3', 'SEND']]],
    [9, [['V0', 'SEND'], ['V3', 'FLASH'], ['V3', 'SEND']]],
    [2, [['V3', 'SEND'], ['V4', 'SEND']]],
  ];
  climbDays.forEach(([daysAgo, climbs]) => {
    const start = now - daysAgo * DAY - 3 * 3_600_000;
    const id = insertSession('climb', start, 80);
    climbs.forEach(([label, result], i) => {
      const g = byLabel(label);
      insertEvent(
        id,
        'CLIMB_LOGGED',
        {
          gradeLabel: g.label,
          gradeMin: g.grade_min,
          gradeMax: g.grade_max,
          result,
          gradeColor: g.color_hex,
          gradeId: g.id,
          gymId: gym.id,
        },
        start + (i + 1) * 9 * 60_000
      );
    });
  });

  const exercises = getAll<{ id: string; name: string }>('SELECT id, name FROM exercises ORDER BY sort_order LIMIT 3;');
  [33, 16, 5].forEach((daysAgo, s) => {
    const start = now - daysAgo * DAY - 5 * 3_600_000;
    const id = insertSession('strength', start, 55);
    exercises.forEach((ex, e) => {
      for (let set = 0; set < 3; set++) {
        insertEvent(
          id,
          'SET_LOGGED',
          { exerciseName: ex.name, exerciseId: ex.id, reps: 8, weight: 40 + e * 15 + s * 5, unit: 'kg' },
          start + (e * 3 + set + 1) * 4 * 60_000
        );
      }
    });
  });

  [30, 20, 10, 3].forEach((daysAgo, i) =>
    run('INSERT INTO bodyweight_logs (id, weight_kg, logged_at, created_at) VALUES (?, ?, ?, ?);', [
      uuid(),
      73.1 - i * 0.25,
      now - daysAgo * DAY,
      now - daysAgo * DAY,
    ])
  );
};
