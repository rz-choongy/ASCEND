jest.mock('./cloudConfig', () => ({
  isCloudConfigured: () => true,
  connectorUrlFor: (t: string) => `https://x/functions/v1/ascend-mcp/${t}`,
  UPSERT_BATCH: 2,
}));
jest.mock('../../changelog', () => ({ APP_VERSION: '9.9.9' }));
jest.mock('./cloudClient', () => ({ cloudAuth: { getSession: jest.fn() } }));
jest.mock('./cloudApi', () => ({ upsertCloudSessions: jest.fn(), callCloudRpc: jest.fn() }));
jest.mock('./cloudPayload', () => ({
  buildCloudSession: jest.fn((s: { id: string; status: string; notes?: string }) => ({
    row: { session_id: s.id, status: s.status },
    hash: `${s.id}:${s.status}:${s.notes ?? ''}`,
  })),
  buildBodyweightPayload: jest.fn(() => ({ logs: [], hash: 'bw-1' })),
}));
jest.mock('../../domain/sessionStore', () => ({
  getCompletedSessions: jest.fn(),
  getAbandonedSessions: jest.fn(() => []),
  getSessionById: jest.fn(),
}));
jest.mock('../../domain/bodyweightStore', () => ({ getBodyweightLogs: jest.fn(() => []) }));
jest.mock('./cloudSettings', () => {
  const state = {
    enabled: true,
    pushed: new Map<string, string>(),
    syncedUser: 'user-1' as string | null,
    url: null as string | null,
    bwHash: null as string | null,
    last: null as unknown,
  };
  return {
    __state: state,
    getCloudSyncEnabled: () => state.enabled,
    setCloudSyncEnabled: (v: boolean) => (state.enabled = v),
    getPushedHashes: () => new Map(state.pushed),
    recordPushed: (id: string, hash: string) => state.pushed.set(id, hash),
    forgetPushed: (id: string) => state.pushed.delete(id),
    resetPushedState: () => {
      state.pushed.clear();
      state.bwHash = null;
    },
    getSyncedUserId: () => state.syncedUser,
    setSyncedUserId: (id: string) => (state.syncedUser = id),
    getConnectorUrl: () => state.url,
    setConnectorUrl: (u: string | null) => (state.url = u),
    getBodyweightHash: () => state.bwHash,
    setBodyweightHash: (h: string | null) => (state.bwHash = h),
    setCloudLastSync: (v: unknown) => (state.last = v),
  };
});

import { callCloudRpc, upsertCloudSessions } from './cloudApi';
import { cloudAuth } from './cloudClient';
import { deleteCloudCopy, getOrCreateConnectorUrl, syncCloud } from './cloudSync';
import { getCompletedSessions, getSessionById } from '../../domain/sessionStore';

const settings = jest.requireMock('./cloudSettings').__state;
const upsert = upsertCloudSessions as jest.Mock;
const rpc = callCloudRpc as jest.Mock;
const completed = getCompletedSessions as jest.Mock;
const byId = getSessionById as jest.Mock;
const session = { accessToken: 'a', refreshToken: 'r', expiresAt: 0, userId: 'user-1' };

beforeEach(() => {
  jest.clearAllMocks();
  (cloudAuth.getSession as jest.Mock).mockResolvedValue(session);
  settings.enabled = true;
  settings.pushed.clear();
  settings.syncedUser = 'user-1';
  settings.url = null;
  settings.bwHash = null;
  completed.mockReturnValue([]);
});

describe('syncCloud', () => {
  it('does nothing when sync is off', async () => {
    settings.enabled = false;
    expect(await syncCloud()).toEqual({ status: 'off' });
    expect(cloudAuth.getSession).not.toHaveBeenCalled();
  });

  it('pushes only new or changed sessions, in batches', async () => {
    completed.mockReturnValue([
      { id: 'a', status: 'completed' },
      { id: 'b', status: 'completed' },
      { id: 'c', status: 'completed', notes: 'edited' },
    ]);
    settings.pushed.set('a', 'a:completed:');
    settings.pushed.set('c', 'c:completed:');
    const result = await syncCloud();
    expect(result).toEqual({ status: 'ok', pushed: 2 });
    expect(upsert).toHaveBeenCalledTimes(1);
    expect(upsert.mock.calls[0][1].map((r: { session_id: string }) => r.session_id)).toEqual(['b', 'c']);
    expect(upsert.mock.calls[0][1][0].app_version).toBe('9.9.9');
    expect(settings.pushed.get('c')).toBe('c:completed:edited');
    expect(rpc).toHaveBeenCalledWith(session, 'replace_my_bodyweight', { p_logs: [] });
  });

  it('sends a deleted state for pushed sessions that left history', async () => {
    settings.pushed.set('gone', 'gone:completed:');
    settings.pushed.set('hard', 'hard:completed:');
    settings.bwHash = 'bw-1';
    byId.mockImplementation((id: string) => (id === 'gone' ? { id, status: 'deleted' } : null));
    await syncCloud();
    expect(upsert.mock.calls[0][1]).toEqual([{ session_id: 'gone', status: 'deleted', app_version: '9.9.9' }]);
    expect(settings.pushed.has('hard')).toBe(false);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('starts over when the cloud identity changes', async () => {
    completed.mockReturnValue([{ id: 'a', status: 'completed' }]);
    settings.pushed.set('a', 'a:completed:');
    settings.syncedUser = 'someone-else';
    settings.url = 'https://old';
    await syncCloud();
    expect(upsert).toHaveBeenCalledTimes(1);
    expect(settings.url).toBeNull();
    expect(settings.syncedUser).toBe('user-1');
  });

  it('reports errors without throwing and keeps unpushed state', async () => {
    completed.mockReturnValue([{ id: 'a', status: 'completed' }]);
    upsert.mockRejectedValueOnce(new Error('Sync failed (500)'));
    expect(await syncCloud()).toEqual({ status: 'error', message: 'Sync failed (500)' });
    expect(settings.pushed.has('a')).toBe(false);
    expect(settings.last).toMatchObject({ ok: false, error: 'Sync failed (500)' });
  });

  it('is single-flight', async () => {
    const [a, b] = [syncCloud(), syncCloud()];
    expect(a).toBe(b);
    await a;
    expect(cloudAuth.getSession).toHaveBeenCalledTimes(1);
  });
});

describe('connector link and delete', () => {
  it('mints a link once and reuses it', async () => {
    rpc.mockResolvedValueOnce('f'.repeat(48));
    expect(await getOrCreateConnectorUrl()).toBe(`https://x/functions/v1/ascend-mcp/${'f'.repeat(48)}`);
    expect(await getOrCreateConnectorUrl()).toBe(settings.url);
    expect(rpc).toHaveBeenCalledTimes(1);
  });

  it('rejects a malformed token', async () => {
    rpc.mockResolvedValueOnce('nope');
    await expect(getOrCreateConnectorUrl()).rejects.toThrow('unexpected link');
  });

  it('delete clears state and turns sync off', async () => {
    settings.pushed.set('a', 'x');
    settings.url = 'https://u';
    await deleteCloudCopy();
    expect(rpc).toHaveBeenCalledWith(session, 'delete_my_cloud_data');
    expect(settings.pushed.size).toBe(0);
    expect(settings.url).toBeNull();
    expect(settings.enabled).toBe(false);
  });
});
