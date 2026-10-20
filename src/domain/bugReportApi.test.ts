jest.mock('expo-crypto', () => ({ randomUUID: () => 'report-1' }));

const input = {
  source: 'user' as const,
  installId: 'install-1',
  description: '  Grade tiles overlap  ',
  appVersion: '2.5.1',
  diagnostics: { Platform: 'android 36' },
};

const loadApi = (env: { url?: string; key?: string }) => {
  process.env.EXPO_PUBLIC_SUPABASE_URL = env.url ?? '';
  process.env.EXPO_PUBLIC_SUPABASE_KEY = env.key ?? '';
  let api!: typeof import('./bugReportApi');
  jest.isolateModules(() => {
    api = require('./bugReportApi');
  });
  return api;
};

const okResponse = { ok: true, status: 201 } as Response;

describe('submitBugReport', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it('refuses to send when the env vars are missing, so the screen falls back to email', async () => {
    const api = loadApi({});
    expect(api.isBugReportApiConfigured()).toBe(false);
    await expect(api.submitBugReport(input)).rejects.toThrow('not configured');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('inserts a trimmed row with the publishable key and no triage fields', async () => {
    const api = loadApi({ url: 'https://x.supabase.co', key: 'pk' });
    fetchMock.mockResolvedValue(okResponse);

    await expect(api.submitBugReport(input)).resolves.toBe('report-1');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://x.supabase.co/rest/v1/bug_reports');
    expect(init.headers).toMatchObject({ apikey: 'pk', Authorization: 'Bearer pk', Prefer: 'return=minimal' });
    expect(JSON.parse(init.body)).toEqual({
      id: 'report-1',
      source: 'user',
      install_id: 'install-1',
      description: 'Grade tiles overlap',
      app_version: '2.5.1',
      diagnostics: { Platform: 'android 36' },
      screenshot_path: null,
    });
  });

  it('uploads the screenshot first and links it by report id', async () => {
    const api = loadApi({ url: 'https://x.supabase.co', key: 'pk' });
    fetchMock.mockResolvedValue(okResponse);

    await api.submitBugReport({ ...input, screenshotUri: 'file:///shot.png' });

    expect(fetchMock.mock.calls[0][0]).toBe('https://x.supabase.co/storage/v1/object/bug-screenshots/report-1.png');
    expect(JSON.parse(fetchMock.mock.calls[1][1].body).screenshot_path).toBe('report-1.png');
  });

  it('still files the report when the screenshot upload fails', async () => {
    const api = loadApi({ url: 'https://x.supabase.co', key: 'pk' });
    fetchMock.mockResolvedValueOnce({ ok: false, status: 413 }).mockResolvedValueOnce(okResponse);

    await api.submitBugReport({ ...input, screenshotUri: 'file:///shot.jpg' });

    expect(JSON.parse(fetchMock.mock.calls[1][1].body).screenshot_path).toBeNull();
  });

  it('throws when the insert is rejected', async () => {
    const api = loadApi({ url: 'https://x.supabase.co', key: 'pk' });
    fetchMock.mockResolvedValue({ ok: false, status: 401 });

    await expect(api.submitBugReport(input)).rejects.toThrow('401');
  });
});
