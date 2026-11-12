import { APP_VERSION } from '../../changelog';
import { getBodyweightLogs } from '../../domain/bodyweightStore';
import { getAbandonedSessions, getCompletedSessions, getSessionById } from '../../domain/sessionStore';
import { CloudAuthError } from './cloudAuth';
import { callCloudRpc, upsertCloudSessions } from './cloudApi';
import { cloudAuth } from './cloudClient';
import { connectorUrlFor, isCloudConfigured, UPSERT_BATCH } from './cloudConfig';
import { buildBodyweightPayload, buildCloudSession, type CloudSessionRow } from './cloudPayload';
import {
  forgetPushed,
  getBodyweightHash,
  getCloudSyncEnabled,
  getConnectorUrl,
  getPushedHashes,
  getSyncedUserId,
  recordPushed,
  resetPushedState,
  setBodyweightHash,
  setCloudLastSync,
  setCloudSyncEnabled,
  setConnectorUrl,
  setSyncedUserId,
} from './cloudSettings';

export type CloudSyncResult =
  | { status: 'off' }
  | { status: 'ok'; pushed: number }
  | { status: 'error'; message: string };

const errorMessage = (e: unknown): string =>
  e instanceof Error ? e.message : 'Something went wrong. Sync will try again later.';

/** A session for this install's cloud identity. A new identity starts the push from scratch. */
const currentSession = async () => {
  const session = await cloudAuth.getSession();
  if (getSyncedUserId() !== session.userId) {
    resetPushedState();
    setConnectorUrl(null);
    setSyncedUserId(session.userId);
  }
  return session;
};

const pushChanges = async (now: () => number): Promise<number> => {
  const session = await currentSession();
  const pushed = getPushedHashes();
  const pending: { row: CloudSessionRow; hash: string }[] = [];

  const current = [...getCompletedSessions(), ...getAbandonedSessions()];
  const currentIds = new Set(current.map((s) => s.id));
  current.forEach((s) => {
    const built = buildCloudSession(s);
    if (pushed.get(s.id) !== built.hash) pending.push(built);
  });

  // Sessions pushed before that are no longer completed/abandoned: deleted, or reopened.
  pushed.forEach((_hash, id) => {
    if (currentIds.has(id)) return;
    const s = getSessionById(id);
    if (!s) {
      forgetPushed(id);
      return;
    }
    const built = buildCloudSession(s);
    if (pushed.get(id) !== built.hash) pending.push(built);
  });

  for (let i = 0; i < pending.length; i += UPSERT_BATCH) {
    const batch = pending.slice(i, i + UPSERT_BATCH);
    await upsertCloudSessions(
      session,
      batch.map((b) => ({ ...b.row, app_version: APP_VERSION }))
    );
    const at = now();
    batch.forEach((b) => recordPushed(b.row.session_id, b.hash, at));
  }

  const bodyweight = buildBodyweightPayload(getBodyweightLogs());
  if (bodyweight.hash !== getBodyweightHash()) {
    await callCloudRpc(session, 'replace_my_bodyweight', { p_logs: bodyweight.logs });
    setBodyweightHash(bodyweight.hash);
  }

  return pending.length;
};

let running: Promise<CloudSyncResult> | null = null;

/**
 * Pushes every finished session whose content changed since its last push. Safe to call often
 * (app foreground, session finish): it's a no-op when sync is off and single-flight otherwise.
 * Never throws; the outcome is also saved for the Settings screen.
 */
export const syncCloud = (now: () => number = Date.now): Promise<CloudSyncResult> => {
  if (!isCloudConfigured() || !getCloudSyncEnabled()) return Promise.resolve({ status: 'off' });
  if (running) return running;
  running = (async (): Promise<CloudSyncResult> => {
    try {
      const count = await pushChanges(now);
      setCloudLastSync({ at: now(), ok: true, pushed: count });
      return { status: 'ok', pushed: count };
    } catch (e) {
      const message = errorMessage(e);
      setCloudLastSync({ at: now(), ok: false, error: message });
      return { status: 'error', message };
    }
  })().finally(() => {
    running = null;
  });
  return running;
};

/** The connector URL for assistants, minting a token the first time. */
export const getOrCreateConnectorUrl = async (): Promise<string> => {
  const existing = getConnectorUrl();
  if (existing) return existing;
  return resetConnectorUrl();
};

/** Mints a new connector token; the previous link stops working at once. */
export const resetConnectorUrl = async (): Promise<string> => {
  const session = await currentSession();
  const token = await callCloudRpc<string>(session, 'rotate_connector_token');
  if (typeof token !== 'string' || !/^[0-9a-f]{48}$/.test(token)) {
    throw new CloudAuthError('rejected', 'The server returned an unexpected link.');
  }
  const url = connectorUrlFor(token);
  setConnectorUrl(url);
  return url;
};

/** Deletes everything this install put in the cloud, revokes the link and turns sync off. */
export const deleteCloudCopy = async (): Promise<void> => {
  const session = await currentSession();
  await callCloudRpc(session, 'delete_my_cloud_data');
  resetPushedState();
  setConnectorUrl(null);
  setCloudSyncEnabled(false);
};
