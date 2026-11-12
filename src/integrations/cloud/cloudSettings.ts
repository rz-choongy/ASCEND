import { getAll, getFirst, run } from '../../db/db';
import type { CloudSession } from './cloudAuth';

// Cloud sync state on-device. Tokens live in SQLite like Kilter's (secure-store crashed Android).

const ENABLED_KEY = 'cloud_sync_enabled';
const SESSION_KEY = 'cloud_session';
const SYNCED_USER_KEY = 'cloud_synced_user';
const CONNECTOR_URL_KEY = 'cloud_connector_url';
const LAST_SYNC_KEY = 'cloud_last_sync';
const BODYWEIGHT_HASH_KEY = 'cloud_bodyweight_hash';

const get = (key: string): string | null =>
  getFirst<{ value: string }>('SELECT value FROM app_settings WHERE key = ? LIMIT 1;', [key])?.value ?? null;

const set = (key: string, value: string | null): void => {
  if (value === null) {
    run('DELETE FROM app_settings WHERE key = ?;', [key]);
    return;
  }
  run(
    `INSERT INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at;`,
    [key, value, Date.now()]
  );
};

const getJson = <T>(key: string): T | null => {
  const raw = get(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

/** Off by default: nothing leaves the phone until the user turns it on. */
export const getCloudSyncEnabled = (): boolean => get(ENABLED_KEY) === '1';
export const setCloudSyncEnabled = (value: boolean): void => set(ENABLED_KEY, value ? '1' : '0');

export const cloudSessionStore = {
  get: (): CloudSession | null => getJson<CloudSession>(SESSION_KEY),
  set: (session: CloudSession): void => set(SESSION_KEY, JSON.stringify(session)),
  clear: (): void => set(SESSION_KEY, null),
};

export const getSyncedUserId = (): string | null => get(SYNCED_USER_KEY);
export const setSyncedUserId = (id: string): void => set(SYNCED_USER_KEY, id);

export const getConnectorUrl = (): string | null => get(CONNECTOR_URL_KEY);
export const setConnectorUrl = (url: string | null): void => set(CONNECTOR_URL_KEY, url);

export type CloudLastSync = { at: number; ok: boolean; pushed?: number; error?: string };
export const getCloudLastSync = (): CloudLastSync | null => getJson<CloudLastSync>(LAST_SYNC_KEY);
export const setCloudLastSync = (value: CloudLastSync): void => set(LAST_SYNC_KEY, JSON.stringify(value));

export const getBodyweightHash = (): string | null => get(BODYWEIGHT_HASH_KEY);
export const setBodyweightHash = (hash: string | null): void => set(BODYWEIGHT_HASH_KEY, hash);

export const getPushedHashes = (): Map<string, string> =>
  new Map(
    getAll<{ session_id: string; payload_hash: string }>('SELECT session_id, payload_hash FROM cloud_sync_state;').map(
      (r) => [r.session_id, r.payload_hash]
    )
  );

export const recordPushed = (sessionId: string, hash: string, at: number): void => {
  run(
    `INSERT INTO cloud_sync_state (session_id, payload_hash, pushed_at) VALUES (?, ?, ?)
      ON CONFLICT(session_id) DO UPDATE SET payload_hash = excluded.payload_hash, pushed_at = excluded.pushed_at;`,
    [sessionId, hash, at]
  );
};

export const forgetPushed = (sessionId: string): void => {
  run('DELETE FROM cloud_sync_state WHERE session_id = ?;', [sessionId]);
};

/** Forget everything pushed, e.g. after the cloud copy is deleted or the cloud identity changes. */
export const resetPushedState = (): void => {
  run('DELETE FROM cloud_sync_state;');
  set(BODYWEIGHT_HASH_KEY, null);
};
