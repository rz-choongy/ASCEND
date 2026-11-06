import * as Crypto from 'expo-crypto';

// Both come from the environment (.env.local for dev, EAS env vars for builds) so the project
// ref stays out of this public repo. The key is Supabase's publishable key: safe on-device,
// since RLS only lets it insert reports, never read them back.
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_KEY ?? '';

export const SCREENSHOT_BUCKET = 'bug-screenshots';

/** Matches the bucket: at most 6 files, each under the project's 50 MB upload cap. */
export const MAX_ATTACHMENTS = 6;
export const MAX_ATTACHMENT_BYTES = 50 * 1024 * 1024;

export type BugReportSource = 'user' | 'crash' | 'scanner';

export type BugAttachment = {
  uri: string;
  kind: 'image' | 'video';
  /** From the picker; used to pick the upload type when the uri has no extension. */
  mimeType?: string | null;
};

export type BugReportInput = {
  source: BugReportSource;
  installId: string;
  description: string;
  appVersion: string;
  diagnostics: Record<string, string>;
  attachments?: BugAttachment[];
};

export const isBugReportApiConfigured = (): boolean => SUPABASE_URL.length > 0 && SUPABASE_KEY.length > 0;

const authHeaders = () => ({ apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` });

type Upload = { ext: 'jpg' | 'png' | 'mp4' | 'mov' | 'webm'; type: string };

export const uploadTypeFor = (attachment: BugAttachment): Upload => {
  const fromUri = /\.(\w+)($|\?)/.exec(attachment.uri)?.[1]?.toLowerCase();
  const mime = attachment.mimeType?.toLowerCase() ?? '';
  if (attachment.kind === 'video') {
    if (fromUri === 'mov' || mime === 'video/quicktime') return { ext: 'mov', type: 'video/quicktime' };
    if (fromUri === 'webm' || mime === 'video/webm') return { ext: 'webm', type: 'video/webm' };
    return { ext: 'mp4', type: 'video/mp4' };
  }
  if (fromUri === 'png' || mime === 'image/png') return { ext: 'png', type: 'image/png' };
  return { ext: 'jpg', type: 'image/jpeg' };
};

/** Row shape for `public.bug_reports`. Triage columns (status, classification, …) are server-owned. */
export const buildBugReportRow = (id: string, input: BugReportInput, attachmentPaths: string[]) => ({
  id,
  source: input.source,
  install_id: input.installId,
  description: input.description.trim(),
  app_version: input.appVersion,
  diagnostics: input.diagnostics,
  // Older triage tooling only reads screenshot_path, so it keeps the first image.
  screenshot_path: attachmentPaths.find((p) => /\.(jpg|png)$/.test(p)) ?? null,
  attachment_paths: attachmentPaths,
});

const uploadAttachment = async (path: string, uri: string, type: string): Promise<string> => {
  // React Native's fetch streams a { uri, type, name } FormData part straight from disk, so the
  // file never has to be read into JS memory (and no file-system module is needed).
  const form = new FormData();
  form.append('file', { uri, type, name: path } as unknown as Blob);
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${SCREENSHOT_BUCKET}/${path}`, {
    method: 'POST',
    headers: authHeaders(),
    body: form,
  });
  if (!res.ok) throw new Error(`Attachment upload failed (${res.status})`);
  return path;
};

/**
 * Files a report in Supabase. Throws on any failure so the caller can fall back to email.
 * An attachment that fails to upload doesn't sink the report: it goes in without that file,
 * and the count of dropped files is noted in diagnostics.
 */
export const submitBugReport = async (input: BugReportInput): Promise<string> => {
  if (!isBugReportApiConfigured()) throw new Error('Bug report API is not configured');
  const id = Crypto.randomUUID();
  const attachments = (input.attachments ?? []).slice(0, MAX_ATTACHMENTS);

  // One at a time: a couple of videos uploading together can stall a weak gym connection.
  const paths: string[] = [];
  for (const [index, attachment] of attachments.entries()) {
    const { ext, type } = uploadTypeFor(attachment);
    const path = `${id}-${index}.${ext}`;
    try {
      paths.push(await uploadAttachment(path, attachment.uri, type));
    } catch {
      // Skip it; the report still goes in.
    }
  }

  const dropped = attachments.length - paths.length;
  const diagnostics = dropped > 0 ? { ...input.diagnostics, 'Dropped attachments': String(dropped) } : input.diagnostics;

  const res = await fetch(`${SUPABASE_URL}/rest/v1/bug_reports`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify(buildBugReportRow(id, { ...input, diagnostics }, paths)),
  });
  if (!res.ok) throw new Error(`Report failed to send (${res.status})`);
  return id;
};
