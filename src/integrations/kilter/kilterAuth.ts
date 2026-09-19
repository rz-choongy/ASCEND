import {
  DEFAULT_TOKEN_LIFETIME_MS,
  EXPIRY_MARGIN_MS,
  KILTER_CLIENT_ID,
  KILTER_SCOPE,
  KILTER_TOKEN_URL,
  LOGIN_LOCKOUT_MS,
} from './kilterConfig';

export type KilterAuthErrorKind =
  /** Wrong username or password. */
  | 'bad_credentials'
  /** A recent login was rejected; try again after `retryAfterMs`. */
  | 'locked_out'
  /** No usable session -- never connected, or Kilter revoked the refresh token. */
  | 'signed_out'
  | 'network'
  | 'server';

export class KilterAuthError extends Error {
  constructor(
    readonly kind: KilterAuthErrorKind,
    message: string,
    readonly retryAfterMs?: number
  ) {
    super(message);
    this.name = 'KilterAuthError';
  }
}

export type StoredSession = {
  refreshToken: string;
  username: string;
};

export type SessionStore = {
  get: () => Promise<StoredSession | null>;
  set: (session: StoredSession) => Promise<void>;
  clear: () => Promise<void>;
};

type TokenResponse = {
  access_token?: unknown;
  refresh_token?: unknown;
  expires_in?: unknown;
};

const form = (fields: Record<string, string>): string =>
  Object.entries(fields)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');

type Deps = {
  store: SessionStore;
  fetchImpl?: typeof fetch;
  now?: () => number;
};

/**
 * Keycloak password grant against Kilter's IdP. The password goes to the token endpoint once
 * and is never kept; only the rotating refresh token (and the username, for display) is
 * stored. Nothing here logs, and error messages never echo credentials or tokens.
 */
export const createKilterAuth = ({ store, fetchImpl = fetch, now = Date.now }: Deps) => {
  let accessToken: { value: string; expiresAt: number } | null = null;
  let lockedUntil = 0;

  const requestTokens = async (fields: Record<string, string>): Promise<Response> => {
    try {
      return await fetchImpl(KILTER_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
        body: form({ client_id: KILTER_CLIENT_ID, ...fields }),
      });
    } catch {
      throw new KilterAuthError('network', "Couldn't reach Kilter. Check your connection and try again.");
    }
  };

  const readTokens = async (response: Response): Promise<{ access: string; refresh: string | null }> => {
    let body: TokenResponse;
    try {
      body = (await response.json()) as TokenResponse;
    } catch {
      throw new KilterAuthError('server', 'Kilter sent a response ASCEND could not read.');
    }
    if (typeof body.access_token !== 'string') {
      throw new KilterAuthError('server', 'Kilter sent a response ASCEND could not read.');
    }
    const lifetime = typeof body.expires_in === 'number' ? body.expires_in * 1000 : DEFAULT_TOKEN_LIFETIME_MS;
    accessToken = { value: body.access_token, expiresAt: now() + lifetime };
    return { access: body.access_token, refresh: typeof body.refresh_token === 'string' ? body.refresh_token : null };
  };

  const login = async (username: string, password: string): Promise<void> => {
    const waitMs = lockedUntil - now();
    if (waitMs > 0) {
      throw new KilterAuthError(
        'locked_out',
        `Wait ${Math.ceil(waitMs / 1000)}s before trying again.`,
        waitMs
      );
    }

    const response = await requestTokens({ grant_type: 'password', username, password, scope: KILTER_SCOPE });
    if (response.status === 400 || response.status === 401) {
      lockedUntil = now() + LOGIN_LOCKOUT_MS;
      throw new KilterAuthError('bad_credentials', 'Kilter rejected that username or password.', LOGIN_LOCKOUT_MS);
    }
    if (!response.ok) {
      throw new KilterAuthError('server', `Kilter login failed (${response.status}).`);
    }

    const { refresh } = await readTokens(response);
    if (!refresh) {
      accessToken = null;
      throw new KilterAuthError('server', 'Kilter did not return a refresh token, so ASCEND cannot stay signed in.');
    }
    lockedUntil = 0;
    await store.set({ refreshToken: refresh, username });
  };

  const getAccessToken = async (): Promise<string> => {
    if (accessToken && accessToken.expiresAt - EXPIRY_MARGIN_MS > now()) return accessToken.value;

    const stored = await store.get();
    if (!stored) throw new KilterAuthError('signed_out', 'Connect your Kilter account first.');

    const response = await requestTokens({ grant_type: 'refresh_token', refresh_token: stored.refreshToken });
    if (response.status === 400 || response.status === 401) {
      accessToken = null;
      await store.clear();
      throw new KilterAuthError('signed_out', 'Your Kilter session expired. Connect again.');
    }
    if (!response.ok) {
      throw new KilterAuthError('server', `Kilter token refresh failed (${response.status}).`);
    }

    const { access, refresh } = await readTokens(response);
    // Refresh tokens rotate: the old one is dead the moment a new one is issued.
    if (refresh) await store.set({ ...stored, refreshToken: refresh });
    return access;
  };

  const disconnect = async (): Promise<void> => {
    accessToken = null;
    lockedUntil = 0;
    await store.clear();
  };

  const getConnectedUsername = async (): Promise<string | null> => (await store.get())?.username ?? null;

  return { login, getAccessToken, disconnect, getConnectedUsername };
};
