import type { CloudSession } from './cloudAuth';
import { SUPABASE_KEY, SUPABASE_URL } from './cloudConfig';
import type { CloudSessionRow } from './cloudPayload';

export class CloudApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = 'CloudApiError';
  }
}

const headers = (session: CloudSession) => ({
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${session.accessToken}`,
  'Content-Type': 'application/json',
});

const send = async (fetchImpl: typeof fetch, path: string, init: RequestInit): Promise<Response> => {
  let res: Response;
  try {
    res = await fetchImpl(`${SUPABASE_URL}/rest/v1/${path}`, init);
  } catch {
    throw new CloudApiError(0, "Couldn't reach the sync server. Check your connection.");
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new CloudApiError(res.status, `Sync failed (${res.status})${text ? `: ${text.slice(0, 200)}` : ''}`);
  }
  return res;
};

export const upsertCloudSessions = async (
  session: CloudSession,
  rows: (CloudSessionRow & { app_version: string })[],
  fetchImpl: typeof fetch = fetch
): Promise<void> => {
  await send(fetchImpl, 'cloud_sessions?on_conflict=user_id,session_id', {
    method: 'POST',
    headers: { ...headers(session), Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(rows.map((r) => ({ ...r, user_id: session.userId, updated_at: new Date().toISOString() }))),
  });
};

export const callCloudRpc = async <T = unknown>(
  session: CloudSession,
  name: string,
  args: object = {},
  fetchImpl: typeof fetch = fetch
): Promise<T> => {
  const res = await send(fetchImpl, `rpc/${name}`, {
    method: 'POST',
    headers: headers(session),
    body: JSON.stringify(args),
  });
  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
};
