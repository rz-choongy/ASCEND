import { KilterAuthError, createKilterAuth, type SessionStore, type StoredSession } from './kilterAuth';
import { KILTER_TOKEN_URL } from './kilterConfig';

const json = (status: number, body: unknown = {}) =>
  ({ ok: status >= 200 && status < 300, status, json: async () => body }) as Response;

const memoryStore = (initial: StoredSession | null = null) => {
  let value = initial;
  const store: SessionStore = {
    get: async () => value,
    set: async (session) => {
      value = session;
    },
    clear: async () => {
      value = null;
    },
  };
  return { store, read: () => value };
};

const setup = (initial: StoredSession | null = null) => {
  let time = 1_000_000;
  const fetchMock = jest.fn();
  const { store, read } = memoryStore(initial);
  const auth = createKilterAuth({ store, fetchImpl: fetchMock as unknown as typeof fetch, now: () => time });
  return { auth, fetchMock, read, advance: (ms: number) => (time += ms) };
};

const sentForm = (fetchMock: jest.Mock, call = 0) =>
  new URLSearchParams(fetchMock.mock.calls[call][1].body as string);

describe('login', () => {
  it('sends a password grant to the IdP and stores only the refresh token', async () => {
    const { auth, fetchMock, read } = setup();
    fetchMock.mockResolvedValueOnce(json(200, { access_token: 'a1', refresh_token: 'r1', expires_in: 300 }));

    await auth.login('climber', 'p@ss word&=');

    expect(fetchMock.mock.calls[0][0]).toBe(KILTER_TOKEN_URL);
    const body = sentForm(fetchMock);
    expect(Object.fromEntries(body)).toEqual({
      client_id: 'kilter',
      grant_type: 'password',
      username: 'climber',
      password: 'p@ss word&=',
      scope: 'openid offline_access',
    });
    expect(read()).toEqual({ refreshToken: 'r1', username: 'climber' });
    expect(JSON.stringify(read())).not.toContain('p@ss');
  });

  it('reports bad credentials, then blocks retries for a minute', async () => {
    const { auth, fetchMock, advance } = setup();
    fetchMock.mockResolvedValue(json(401));

    await expect(auth.login('u', 'wrong')).rejects.toMatchObject({ kind: 'bad_credentials' });
    await expect(auth.login('u', 'again')).rejects.toMatchObject({ kind: 'locked_out' });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    advance(61_000);
    await expect(auth.login('u', 'again')).rejects.toMatchObject({ kind: 'bad_credentials' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('maps a network failure and a missing refresh token to clear errors', async () => {
    const { auth, fetchMock, read } = setup();
    fetchMock.mockRejectedValueOnce(new Error('offline'));
    await expect(auth.login('u', 'p')).rejects.toMatchObject({ kind: 'network' });

    fetchMock.mockResolvedValueOnce(json(200, { access_token: 'a1' }));
    await expect(auth.login('u', 'p')).rejects.toMatchObject({ kind: 'server' });
    expect(read()).toBeNull();
  });

  it('never puts the password in an error message', async () => {
    const { auth, fetchMock } = setup();
    fetchMock.mockResolvedValueOnce(json(401));
    const error = await auth.login('u', 'hunter2').catch((e: KilterAuthError) => e);
    expect(String((error as Error).message)).not.toContain('hunter2');
  });
});

describe('getAccessToken', () => {
  it('requires a connected account', async () => {
    const { auth } = setup();
    await expect(auth.getAccessToken()).rejects.toMatchObject({ kind: 'signed_out' });
  });

  it('refreshes, rotates the stored refresh token, and reuses the access token until near expiry', async () => {
    const { auth, fetchMock, read, advance } = setup({ refreshToken: 'r0', username: 'u' });
    fetchMock.mockResolvedValueOnce(json(200, { access_token: 'a1', refresh_token: 'r1', expires_in: 300 }));

    expect(await auth.getAccessToken()).toBe('a1');
    expect(Object.fromEntries(sentForm(fetchMock))).toMatchObject({ grant_type: 'refresh_token', refresh_token: 'r0' });
    expect(read()).toEqual({ refreshToken: 'r1', username: 'u' });

    expect(await auth.getAccessToken()).toBe('a1');
    expect(fetchMock).toHaveBeenCalledTimes(1);

    advance(250_000); // inside the 60 s expiry margin
    fetchMock.mockResolvedValueOnce(json(200, { access_token: 'a2', refresh_token: 'r2', expires_in: 300 }));
    expect(await auth.getAccessToken()).toBe('a2');
    expect(read()?.refreshToken).toBe('r2');
  });

  it('assumes a 5 minute lifetime when expires_in is missing', async () => {
    const { auth, fetchMock, advance } = setup({ refreshToken: 'r0', username: 'u' });
    fetchMock.mockResolvedValueOnce(json(200, { access_token: 'a1' }));
    await auth.getAccessToken();

    advance(200_000);
    await auth.getAccessToken();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    advance(50_000);
    fetchMock.mockResolvedValueOnce(json(200, { access_token: 'a2' }));
    await auth.getAccessToken();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('signs out and clears storage when Kilter revokes the refresh token', async () => {
    const { auth, fetchMock, read } = setup({ refreshToken: 'dead', username: 'u' });
    fetchMock.mockResolvedValueOnce(json(400, { error: 'invalid_grant' }));

    await expect(auth.getAccessToken()).rejects.toMatchObject({ kind: 'signed_out' });
    expect(read()).toBeNull();
  });
});

describe('disconnect', () => {
  it('forgets the session and drops the cached access token', async () => {
    const { auth, fetchMock, read } = setup({ refreshToken: 'r0', username: 'u' });
    fetchMock.mockResolvedValueOnce(json(200, { access_token: 'a1', expires_in: 300 }));
    await auth.getAccessToken();

    await auth.disconnect();
    expect(read()).toBeNull();
    await expect(auth.getAccessToken()).rejects.toMatchObject({ kind: 'signed_out' });
    expect(await auth.getConnectedUsername()).toBeNull();
  });
});
