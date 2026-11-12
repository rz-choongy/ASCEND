import { CloudAuthError, createCloudAuth, type CloudSession } from './cloudAuth';

const memoryStore = (initial: CloudSession | null = null) => {
  let value = initial;
  return { get: () => value, set: (s: CloudSession) => (value = s), clear: () => (value = null) };
};

const ok = (body: object) => ({ ok: true, status: 200, json: async () => body }) as unknown as Response;
const fail = (status: number, body: object = {}) => ({ ok: false, status, json: async () => body }) as unknown as Response;

const authBody = (n: number) => ({
  access_token: `access-${n}`,
  refresh_token: `refresh-${n}`,
  expires_in: 3600,
  user: { id: 'user-1' },
});

const NOW = 1_000_000_000_000;

describe('createCloudAuth', () => {
  it('signs up anonymously when there is no session', async () => {
    const fetchImpl = jest.fn().mockResolvedValue(ok(authBody(1)));
    const store = memoryStore();
    const auth = createCloudAuth({ url: 'https://x', key: 'pk', store, fetchImpl, now: () => NOW });
    const s = await auth.getSession();
    expect(fetchImpl).toHaveBeenCalledWith('https://x/auth/v1/signup', expect.objectContaining({ method: 'POST' }));
    expect(s).toEqual({ accessToken: 'access-1', refreshToken: 'refresh-1', expiresAt: NOW + 3_600_000, userId: 'user-1' });
    expect(store.get()).toEqual(s);
  });

  it('reuses a fresh session without calling the network', async () => {
    const fetchImpl = jest.fn();
    const store = memoryStore({ accessToken: 'a', refreshToken: 'r', expiresAt: NOW + 600_000, userId: 'u' });
    const auth = createCloudAuth({ url: 'https://x', key: 'pk', store, fetchImpl, now: () => NOW });
    expect((await auth.getSession()).accessToken).toBe('a');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('refreshes an expiring session, single-flight', async () => {
    const fetchImpl = jest.fn().mockResolvedValue(ok(authBody(2)));
    const store = memoryStore({ accessToken: 'a', refreshToken: 'r', expiresAt: NOW + 10_000, userId: 'user-1' });
    const auth = createCloudAuth({ url: 'https://x', key: 'pk', store, fetchImpl, now: () => NOW });
    const [a, b] = await Promise.all([auth.getSession(), auth.getSession()]);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl.mock.calls[0][0]).toBe('https://x/auth/v1/token?grant_type=refresh_token');
    expect(a.accessToken).toBe('access-2');
    expect(b).toBe(a);
  });

  it('starts a new anonymous user when the refresh token is rejected', async () => {
    const fetchImpl = jest.fn().mockResolvedValueOnce(fail(400, { msg: 'Invalid Refresh Token' })).mockResolvedValueOnce(ok(authBody(3)));
    const store = memoryStore({ accessToken: 'a', refreshToken: 'r', expiresAt: NOW - 1, userId: 'old' });
    const auth = createCloudAuth({ url: 'https://x', key: 'pk', store, fetchImpl, now: () => NOW });
    expect((await auth.getSession()).accessToken).toBe('access-3');
    expect(fetchImpl.mock.calls[1][0]).toBe('https://x/auth/v1/signup');
  });

  it('keeps the session on network errors so the identity is not lost', async () => {
    const fetchImpl = jest.fn().mockRejectedValue(new Error('offline'));
    const saved = { accessToken: 'a', refreshToken: 'r', expiresAt: NOW - 1, userId: 'u' };
    const store = memoryStore(saved);
    const auth = createCloudAuth({ url: 'https://x', key: 'pk', store, fetchImpl, now: () => NOW });
    await expect(auth.getSession()).rejects.toMatchObject({ kind: 'network' });
    expect(store.get()).toEqual(saved);
  });

  it('explains when anonymous sign-ins are switched off', async () => {
    const fetchImpl = jest.fn().mockResolvedValue(fail(422, { error_code: 'anonymous_provider_disabled' }));
    const auth = createCloudAuth({ url: 'https://x', key: 'pk', store: memoryStore(), fetchImpl, now: () => NOW });
    const err = await auth.getSession().catch((e) => e);
    expect(err).toBeInstanceOf(CloudAuthError);
    expect(err.kind).toBe('disabled');
  });
});
