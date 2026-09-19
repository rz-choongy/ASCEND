import { fetchKilterLogs } from './kilterApi';
import { KILTER_LOGS_URL } from './kilterConfig';

const res = (status: number, body?: unknown, badJson = false) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => {
      if (badJson) throw new Error('bad json');
      return body;
    },
  }) as Response;

const call = (response: Response | Error) => {
  const fetchMock = jest.fn();
  if (response instanceof Error) fetchMock.mockRejectedValue(response);
  else fetchMock.mockResolvedValue(response);
  return { fetchMock, run: () => fetchKilterLogs('tok', fetchMock as unknown as typeof fetch) };
};

describe('fetchKilterLogs', () => {
  it('sends the bearer token to the logs endpoint and returns the raw body', async () => {
    const { fetchMock, run } = call(res(200, [{ logUuid: 'a' }]));
    expect(await run()).toEqual([{ logUuid: 'a' }]);
    expect(fetchMock.mock.calls[0][0]).toBe(KILTER_LOGS_URL);
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer tok');
  });

  it.each([
    [401, 'signed_out'],
    [403, 'signed_out'],
    [500, 'server'],
  ])('maps HTTP %s to %s', async (status, kind) => {
    await expect(call(res(status)).run()).rejects.toMatchObject({ kind });
  });

  it('maps a network failure and an unreadable body', async () => {
    await expect(call(new Error('offline')).run()).rejects.toMatchObject({ kind: 'network' });
    await expect(call(res(200, undefined, true)).run()).rejects.toMatchObject({ kind: 'server' });
  });

  it('keeps the token out of error messages', async () => {
    const error = (await call(res(500)).run().catch((e: unknown) => e)) as Error;
    expect(error.message).not.toContain('tok');
  });
});
