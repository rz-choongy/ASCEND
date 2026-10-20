import * as Crypto from 'expo-crypto';

// Both come from the environment (.env.local for dev, EAS env vars for builds) so the project
// ref stays out of this public repo. The key is Supabase's publishable key: safe on-device,
// since RLS only lets it insert reports, never read them back.
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_KEY ?? '';

export const SCREENSHOT_BUCKET = 'bug-screenshots';

export type BugReportSource = 'user' | 'crash' | 'scanner';

export type BugReportInput = {
  source: BugReportSource;
  installId: string;
  description: string;
  appVersion: string;
  diagnostics: Record<string, string>;
  screenshotUri?: string | null;
};

export const isBugReportApiConfigured = (): boolean => SUPABASE_URL.length > 0 && SUPABASE_KEY.length > 0;

const authHeaders = () => ({ apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` });

const screenshotExtension = (uri: string): 'png' | 'jpg' => (/\.png($|\?)/i.test(uri) ? 'png' : 'jpg');

/** Row shape for `public.bug_reports`. Triage columns (status, classification, …) are server-owned. */
export const buildBugReportRow = (id: string, input: BugReportInput, screenshotPath: string | null) => ({
  id,
  source: input.source,
  install_id: input.installId,
  description: input.description.trim(),
  app_version: input.appVersion,
  diagnostics: input.diagnostics,
  screenshot_path: screenshotPath,
});

const uploadScreenshot = async (id: string, uri: string): Promise<string> => {
  const ext = screenshotExtension(uri);
  const path = `${id}.${ext}`;
  // React Native's fetch streams a { uri, type, name } FormData part straight from disk, so the
  // image never has to be read into JS memory (and no file-system module is needed).
  const form = new FormData();
  form.append('file', { uri, type: ext === 'png' ? 'image/png' : 'image/jpeg', name: path } as unknown as Blob);
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${SCREENSHOT_BUCKET}/${path}`, {
    method: 'POST',
    headers: authHeaders(),
    body: form,
  });
  if (!res.ok) throw new Error(`Screenshot upload failed (${res.status})`);
  return path;
};

/**
 * Files a report in Supabase. Throws on any failure so the caller can fall back to email.
 * A screenshot that fails to upload doesn't sink the report: it goes in without one.
 */
export const submitBugReport = async (input: BugReportInput): Promise<string> => {
  if (!isBugReportApiConfigured()) throw new Error('Bug report API is not configured');
  const id = Crypto.randomUUID();

  let screenshotPath: string | null = null;
  if (input.screenshotUri) {
    try {
      screenshotPath = await uploadScreenshot(id, input.screenshotUri);
    } catch {
      screenshotPath = null;
    }
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/bug_reports`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify(buildBugReportRow(id, input, screenshotPath)),
  });
  if (!res.ok) throw new Error(`Report failed to send (${res.status})`);
  return id;
};
