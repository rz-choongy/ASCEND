jest.mock('../../domain/gymStore', () => ({
  ensureNamedVScaleGym: jest.fn(() => ({ id: 'gym-kilter' })),
  getGradeOptionsForGym: jest.fn(() => [
    { id: 'g4', label: 'V4', grade_min: 4, grade_max: 4, color_hex: '#F97316' },
  ]),
}));
jest.mock('../../domain/sessionStore', () => ({ importExternalClimbSession: jest.fn(() => 1) }));
jest.mock('../../domain/settingsStore', () => ({ setKilterLastSyncedAt: jest.fn() }));
jest.mock('./kilterClient', () => ({ kilterAuth: { getAccessToken: jest.fn() } }));
jest.mock('./kilterApi', () => ({ fetchKilterLogs: jest.fn() }));

import { importExternalClimbSession } from '../../domain/sessionStore';
import { setKilterLastSyncedAt } from '../../domain/settingsStore';
import { fetchKilterLogs } from './kilterApi';
import { KilterAuthError } from './kilterAuth';
import { kilterAuth } from './kilterClient';
import { syncKilter } from './kilterSync';

const mockFetch = fetchKilterLogs as jest.Mock;
const mockImport = importExternalClimbSession as jest.Mock;

const entry = (id: string, createdAt: string, extra = {}) => ({
  logUuid: id,
  createdAt,
  topped: true,
  flashed: false,
  attempts: 1,
  currentDifficultyId: 18,
  ...extra,
});

let time = 10_000_000;
const clock = () => time;

beforeEach(() => {
  time += 10 * 60_000; // clear the module-level throttle between tests
  jest.clearAllMocks();
  (kilterAuth.getAccessToken as jest.Mock).mockResolvedValue('tok');
});

describe('syncKilter', () => {
  it('imports sends into the Kilter gym and records the sync time', async () => {
    mockFetch.mockResolvedValue({ logs: [entry('a', '2026-09-01T18:00:00Z'), entry('b', '2026-09-01T19:00:00Z', { topped: false })] });

    const result = await syncKilter(clock);

    expect(result).toEqual({ added: 1, fetched: 2 });
    expect(mockImport).toHaveBeenCalledTimes(1);
    const arg = mockImport.mock.calls[0][0];
    expect(arg).toMatchObject({ source: 'kilter', gymId: 'gym-kilter', title: 'Kilter Board' });
    expect(arg.climbs.map((c: { externalId: string }) => c.externalId)).toEqual(['a']);
    expect(setKilterLastSyncedAt).toHaveBeenCalledWith(time);
  });

  it('fails loudly on a response shape it does not recognise, instead of reporting "nothing new"', async () => {
    mockFetch.mockResolvedValue({ unexpected: true });
    await expect(syncKilter(clock)).rejects.toThrow("doesn't recognise");
    expect(setKilterLastSyncedAt).not.toHaveBeenCalled();
  });

  it('throttles back-to-back syncs to once a minute', async () => {
    mockFetch.mockResolvedValue([]);
    await syncKilter(clock);
    await expect(syncKilter(clock)).rejects.toMatchObject({ kind: 'locked_out' });
    expect(mockFetch).toHaveBeenCalledTimes(1);

    time += 61_000;
    await expect(syncKilter(clock)).resolves.toEqual({ added: 0, fetched: 0 });
  });

  it('does not write anything when auth fails', async () => {
    (kilterAuth.getAccessToken as jest.Mock).mockRejectedValue(new KilterAuthError('signed_out', 'x'));
    await expect(syncKilter(clock)).rejects.toMatchObject({ kind: 'signed_out' });
    expect(mockImport).not.toHaveBeenCalled();
  });

  it('does not lock out an immediate retry after a failed fetch', async () => {
    mockFetch.mockRejectedValueOnce(new Error('network drop'));
    await expect(syncKilter(clock)).rejects.toThrow('network drop');

    // A retry right after the failure must reach fetchKilterLogs again, not
    // be told "Kilter was synced moments ago" for a sync that never happened.
    mockFetch.mockResolvedValueOnce([]);
    await expect(syncKilter(clock)).resolves.toEqual({ added: 0, fetched: 0 });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});
