import { clearKilterSession, getKilterSession, setKilterSession } from '../../domain/settingsStore';
import type { SessionStore, StoredSession } from './kilterAuth';

/** Persists the Kilter sign-in in the local database. Unreadable or malformed data reads as "signed out". */
export const databaseSessionStore: SessionStore = {
  get: async () => {
    const raw = getKilterSession();
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as Partial<StoredSession>;
      return typeof parsed.refreshToken === 'string' && typeof parsed.username === 'string'
        ? { refreshToken: parsed.refreshToken, username: parsed.username }
        : null;
    } catch {
      return null;
    }
  },
  set: async (session) => setKilterSession(JSON.stringify(session)),
  clear: async () => clearKilterSession(),
};
