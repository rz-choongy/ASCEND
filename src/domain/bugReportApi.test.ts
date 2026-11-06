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
      attachment_paths: [],
    });
  });

  it('uploads each attachment in order and links them by report id', async () => {
    const api = loadApi({ url: 'https://x.supabase.co', key: 'pk' });
    fetchMock.mockResolvedValue(okResponse);

    await api.submitBugReport({
      ...input,
      attachments: [
        { uri: 'file:///rec.mp4', kind: 'video' },
        { uri: 'file:///shot.png', kind: 'image' },
        { uri: 'content://media/42', kind: 'image', mimeType: 'image/jpeg' },
      ],
    });

    const urls = fetchMock.mock.calls.map(([url]) => url);
    expect(urls.slice(0, 3)).toEqual([
      'https://x.supabase.co/storage/v1/object/bug-screenshots/report-1-0.mp4',
      'https://x.supabase.co/storage/v1/object/bug-screenshots/report-1-1.png',
      'https://x.supabase.co/storage/v1/object/bug-screenshots/report-1-2.jpg',
    ]);
    const row = JSON.parse(fetchMock.mock.calls[3][1].body);
    expect(row.attachment_paths).toEqual(['report-1-0.mp4', 'report-1-1.png', 'report-1-2.jpg']);
    // The first image, not the video, so older triage tooling still finds a screenshot.
    expect(row.screenshot_path).toBe('report-1-1.png');
  });

  it('still files the report when an upload fails, and notes the dropped file', async () => {
    const api = loadApi({ url: 'https://x.supabase.co', key: 'pk' });
    fetchMock
      .mockResolvedValueOnce({ ok: false, status: 413 })
      .mockResolvedValueOnce(okResponse)
      .mockResolvedValueOnce(okResponse);

    await api.submitBugReport({
      ...input,
      attachments: [
        { uri: 'file:///big.mov', kind: 'video' },
        { uri: 'file:///shot.jpg', kind: 'image' },
      ],
    });

    const row = JSON.parse(fetchMock.mock.calls[2][1].body);
    expect(row.attachment_paths).toEqual(['report-1-1.jpg']);
    expect(row.diagnostics['Dropped attachments']).toBe('1');
  });

  it('picks the upload type from the mime type when the uri has no extension', () => {
    const api = loadApi({});
    expect(api.uploadTypeFor({ uri: 'content://x', kind: 'video', mimeType: 'video/quicktime' })).toEqual({
      ext: 'mov',
      type: 'video/quicktime',
    });
    expect(api.uploadTypeFor({ uri: 'content://x', kind: 'image' })).toEqual({ ext: 'jpg', type: 'image/jpeg' });
  });

  it('throws when the insert is rejected', async () => {
    const api = loadApi({ url: 'https://x.supabase.co', key: 'pk' });
    fetchMock.mockResolvedValue({ ok: false, status: 401 });

    await expect(api.submitBugReport(input)).rejects.toThrow('401');
  });
});
