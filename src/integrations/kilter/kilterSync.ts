import { ensureNamedVScaleGym, getGradeOptionsForGym } from '../../domain/gymStore';
import { importExternalClimbSession } from '../../domain/sessionStore';
import { setKilterLastSyncedAt } from '../../domain/settingsStore';
import { fetchKilterLogs } from './kilterApi';
import { KilterAuthError } from './kilterAuth';
import { kilterAuth } from './kilterClient';
import { KILTER_GYM_NAME, KILTER_SOURCE, MIN_SYNC_INTERVAL_MS } from './kilterConfig';
import { extractLogList, mapKilterLogs, parseKilterLogs } from './kilterMapping';

export type KilterSyncResult = {
  /** Sends written this time. */
  added: number;
  /** Entries Kilter returned, sends or not. */
  fetched: number;
};

let lastFetchAt = 0;

/** Pulls the Kilter logbook and imports any sends not already in the app. Safe to run repeatedly. */
export const syncKilter = async (now: () => number = Date.now): Promise<KilterSyncResult> => {
  const sinceLast = now() - lastFetchAt;
  if (sinceLast < MIN_SYNC_INTERVAL_MS) {
    throw new KilterAuthError(
      'locked_out',
      `Kilter was synced moments ago. Wait ${Math.ceil((MIN_SYNC_INTERVAL_MS - sinceLast) / 1000)}s.`,
      MIN_SYNC_INTERVAL_MS - sinceLast
    );
  }

  const token = await kilterAuth.getAccessToken();
  lastFetchAt = now();
  const raw = await fetchKilterLogs(token);

  // An unrecognised envelope would otherwise read as "nothing new" and hide a broken sync.
  if (extractLogList(raw) === null) {
    throw new KilterAuthError('server', "Kilter returned data in a shape ASCEND doesn't recognise.");
  }

  const gym = ensureNamedVScaleGym(KILTER_GYM_NAME);
  const options = getGradeOptionsForGym(gym.id).map((row) => ({
    id: row.id,
    label: row.label,
    gradeMin: row.grade_min,
    gradeMax: row.grade_max,
    colorHex: row.color_hex,
  }));

  const logs = parseKilterLogs(raw);
  const sessions = mapKilterLogs(logs, options, gym.id);
  const added = sessions.reduce(
    (sum, session) =>
      sum +
      importExternalClimbSession({
        source: KILTER_SOURCE,
        gymId: gym.id,
        title: KILTER_GYM_NAME,
        climbs: session.climbs,
      }),
    0
  );

  setKilterLastSyncedAt(now());
  return { added, fetched: logs.length };
};
