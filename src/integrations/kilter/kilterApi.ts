import { KilterAuthError } from './kilterAuth';
import { KILTER_LOGS_URL } from './kilterConfig';

/**
 * Raw `GET /api/logs` body. The response shape is undocumented, so it comes back unparsed and
 * `kilterMapping` decides what to keep. Errors carry a status only -- never headers or tokens.
 */
export const fetchKilterLogs = async (accessToken: string, fetchImpl: typeof fetch = fetch): Promise<unknown> => {
  let response: Response;
  try {
    response = await fetchImpl(KILTER_LOGS_URL, {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
    });
  } catch {
    throw new KilterAuthError('network', "Couldn't reach Kilter. Check your connection and try again.");
  }
  if (response.status === 401 || response.status === 403) {
    throw new KilterAuthError('signed_out', 'Your Kilter session expired. Connect again.');
  }
  if (!response.ok) {
    throw new KilterAuthError('server', `Kilter returned an error (${response.status}).`);
  }
  try {
    return await response.json();
  } catch {
    throw new KilterAuthError('server', 'Kilter sent a response ASCEND could not read.');
  }
};
