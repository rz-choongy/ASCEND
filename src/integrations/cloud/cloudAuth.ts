// Anonymous Supabase sign-in over plain fetch (no supabase-js, no native modules). Each install
// gets its own anonymous user; a later real login can be linked to the same user id.

export type CloudSession = {
  accessToken: string;
  refreshToken: string;
  /** Epoch ms. */
  expiresAt: number;
  userId: string;
};

export type CloudSessionStore = {
  get: () => CloudSession | null;
  set: (session: CloudSession) => void;
  clear: () => void;
};

export type CloudAuthErrorKind = 'network' | 'rejected' | 'disabled';

export class CloudAuthError extends Error {
  constructor(
    public kind: CloudAuthErrorKind,
    message: string
  ) {
    super(message);
    this.name = 'CloudAuthError';
  }
}

type AuthResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  expires_at?: number;
  user?: { id?: string };
};

/** Refresh this long before expiry so a request never goes out with a token about to lapse. */
const EXPIRY_MARGIN_MS = 60_000;

export const createCloudAuth = ({
  url,
  key,
  store,
  fetchImpl = fetch,
  now = Date.now,
}: {
  url: string;
  key: string;
  store: CloudSessionStore;
  fetchImpl?: typeof fetch;
  now?: () => number;
}) => {
  const call = async (path: string, body: object): Promise<CloudSession> => {
    let res: Response;
    try {
      res = await fetchImpl(`${url}/auth/v1/${path}`, {
        method: 'POST',
        headers: { apikey: key, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch {
      throw new CloudAuthError('network', "Couldn't reach the sync server. Check your connection.");
    }
    const json = (await res.json().catch(() => ({}))) as AuthResponse & { error_code?: string; msg?: string };
    if (!res.ok) {
      if (json.error_code === 'anonymous_provider_disabled') {
        throw new CloudAuthError('disabled', 'Cloud sync is not switched on for this server yet.');
      }
      throw new CloudAuthError(res.status >= 500 ? 'network' : 'rejected', json.msg ?? `Sign-in failed (${res.status}).`);
    }
    if (!json.access_token || !json.refresh_token || !json.user?.id) {
      throw new CloudAuthError('rejected', 'Sign-in returned an unexpected response.');
    }
    return {
      accessToken: json.access_token,
      refreshToken: json.refresh_token,
      expiresAt: json.expires_at ? json.expires_at * 1000 : now() + (json.expires_in ?? 3600) * 1000,
      userId: json.user.id,
    };
  };

  let inflight: Promise<CloudSession> | null = null;

  const refreshOrSignUp = async (): Promise<CloudSession> => {
    const existing = store.get();
    if (existing) {
      try {
        const next = await call('token?grant_type=refresh_token', { refresh_token: existing.refreshToken });
        store.set(next);
        return next;
      } catch (e) {
        // A revoked refresh token means this identity is gone; anything else is worth retrying later.
        if (!(e instanceof CloudAuthError) || e.kind !== 'rejected') throw e;
        store.clear();
      }
    }
    const created = await call('signup', { data: {} });
    store.set(created);
    return created;
  };

  /** A valid session, refreshing or creating the anonymous user as needed. Single-flight. */
  const getSession = async (): Promise<CloudSession> => {
    const current = store.get();
    if (current && current.expiresAt - EXPIRY_MARGIN_MS > now()) return current;
    if (!inflight) {
      inflight = refreshOrSignUp().finally(() => {
        inflight = null;
      });
    }
    return inflight;
  };

  return { getSession, signOut: () => store.clear() };
};

export type CloudAuth = ReturnType<typeof createCloudAuth>;
