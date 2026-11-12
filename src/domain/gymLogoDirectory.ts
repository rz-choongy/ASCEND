import * as Crypto from 'expo-crypto';

/**
 * The shared logo directory in Supabase: when one climber sets a gym's logo, every other phone
 * finds it by the gym's name before searching the web. Gyms are matched by name key (see
 * logoNameKey in gymLogo.ts). The app can only call two functions there, never read the table:
 * gym_logo_lookup and submit_gym_logo. Everything here fails quietly, since the web search and
 * the gym editor still work without it.
 */

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_KEY ?? '';
const LOGO_BUCKET = 'gym-logos';
const REQUEST_TIMEOUT_MS = 6000;

export type DirectoryLogo = { domain: string | null; imageUrl: string | null; votes: number };

const isConfigured = () => SUPABASE_URL.length > 0 && SUPABASE_KEY.length > 0;

const authHeaders = () => ({ apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` });

const imageUrlFor = (path: string) => `${SUPABASE_URL}/storage/v1/object/public/${LOGO_BUCKET}/${path}`;

/** The bucket path of a directory photo URL, so picking one shares the same file again. */
const imagePathOf = (url: string): string | null => {
  const prefix = imageUrlFor('');
  return isConfigured() && url.startsWith(prefix) ? url.slice(prefix.length) : null;
};

const post = async (path: string, body: unknown, headers: Record<string, string> = {}) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${SUPABASE_URL}${path}`, {
      method: 'POST',
      headers: { ...authHeaders(), 'Content-Type': 'application/json', ...headers },
      body: body instanceof ArrayBuffer ? body : JSON.stringify(body),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Logo directory request failed (${response.status})`);
    return response;
  } finally {
    clearTimeout(timer);
  }
};

/** The most-chosen logo for each name key that anyone has set. Throws when offline. */
export const lookupDirectoryLogos = async (keys: string[]): Promise<Map<string, DirectoryLogo>> => {
  const found = new Map<string, DirectoryLogo>();
  const unique = [...new Set(keys.filter(Boolean))];
  if (!isConfigured() || unique.length === 0) return found;
  const response = await post('/rest/v1/rpc/gym_logo_lookup', { p_name_keys: unique });
  const rows: unknown = await response.json();
  if (!Array.isArray(rows)) return found;
  for (const row of rows) {
    if (typeof row?.name_key !== 'string') continue;
    const domain = typeof row.domain === 'string' ? row.domain : null;
    const imageUrl = typeof row.image_path === 'string' ? imageUrlFor(row.image_path) : null;
    if (domain || imageUrl) found.set(row.name_key, { domain, imageUrl, votes: Number(row.votes) || 0 });
  }
  return found;
};

const bytesOf = (base64: string): ArrayBuffer => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
};

/** Uploads a photo picked on this phone (a data: URI) and returns its path in the bucket. */
const uploadPhoto = async (dataUri: string): Promise<string | null> => {
  const match = /^data:(image\/(?:jpeg|jpg|png));base64,(.+)$/.exec(dataUri);
  if (!match) return null;
  const isPng = match[1] === 'image/png';
  const path = `${Crypto.randomUUID()}.${isPng ? 'png' : 'jpg'}`;
  await post(`/storage/v1/object/${LOGO_BUCKET}/${path}`, bytesOf(match[2]), {
    'Content-Type': isPng ? 'image/png' : 'image/jpeg',
  });
  return path;
};

export type SharedLogo = {
  installId: string;
  nameKey: string;
  gymName: string;
  /** A website domain, or logo_image: a picked photo (data: URI) or a directory photo URL. */
  domain?: string | null;
  image?: string | null;
  /** Chosen by a person (counts for more) rather than matched automatically. */
  picked: boolean;
};

/** Adds this phone's choice to the directory. Returns false if it couldn't be sent. */
export const shareGymLogo = async (logo: SharedLogo): Promise<boolean> => {
  if (!isConfigured() || !logo.nameKey) return false;
  try {
    let imagePath: string | null = null;
    if (logo.image) {
      imagePath = imagePathOf(logo.image) ?? (await uploadPhoto(logo.image));
      if (!imagePath) return false;
    } else if (!logo.domain) {
      return false;
    }
    await post(
      '/rest/v1/rpc/submit_gym_logo',
      {
        p_install_id: logo.installId,
        p_name_key: logo.nameKey,
        p_gym_name: logo.gymName.trim().slice(0, 80),
        p_domain: imagePath ? null : logo.domain,
        p_image_path: imagePath,
        p_picked: logo.picked,
      },
      { Prefer: 'return=minimal' }
    );
    return true;
  } catch {
    return false;
  }
};
