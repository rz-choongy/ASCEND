import { getGyms, setGymLogoDomain, isUnnamedDefaultGym } from './gymStore';
import type { GymRow } from './types';

/**
 * Gym logos come from the web, not the phone: a gym stores only its website (logo_domain),
 * and the image loads from Google's favicon service, which the OS caches like any image.
 * Name -> website lookup tries Clearbit's free autocomplete, then OpenStreetMap, where many
 * climbing gyms are mapped with their website. None of these need a key. A gym with no logo
 * online can use one picked from photos instead (logo_image).
 */

/** company = a business directory hit; place = a mapped venue, whose name may add its suburb. */
export type LogoCandidate = { name: string; domain: string; source?: 'company' | 'place' };

const CLEARBIT_URL = 'https://autocomplete.clearbit.com/v1/companies/suggest?query=';
const OSM_URL = 'https://nominatim.openstreetmap.org/search?format=jsonv2&extratags=1&limit=10&q=';
// Nominatim's usage policy asks every app to identify itself.
const OSM_HEADERS = { 'User-Agent': 'ASCEND-climbing-app/1.0 (choongzhuocen@gmail.com)' };
const REQUEST_TIMEOUT_MS = 6000;

export const gymLogoUrl = (domain: string): string =>
  `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;

/** The image to show: a picked photo, the gym's website logo, or (for a branch) its company's. */
export const resolveLogoUri = (gym: GymRow, allGyms: GymRow[]): string | null => {
  if (gym.logo_image) return gym.logo_image;
  if (gym.logo_domain) return gymLogoUrl(gym.logo_domain);
  if (gym.logo_domain === '' || !gym.parent_id) return null;
  const parent = allGyms.find((g) => g.id === gym.parent_id);
  if (!parent) return null;
  return parent.logo_image || (parent.logo_domain ? gymLogoUrl(parent.logo_domain) : null);
};

const fetchJson = async (url: string, headers?: Record<string, string>): Promise<unknown> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, { headers, signal: controller.signal });
    if (!response.ok) throw new Error(`Logo search failed (${response.status})`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
};

const NUMBER_WORDS = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen',
  'nineteen', 'twenty',
];

/** "Nine Degrees" -> "9 Degrees" and back, since gyms brand with either. */
export const numberVariant = (name: string): string | null => {
  let changed = false;
  const swapped = name.replace(/\b([a-z]+|\d+)\b/gi, (word) => {
    const asNumber = NUMBER_WORDS.indexOf(word.toLowerCase());
    if (asNumber >= 0) {
      changed = true;
      return `${asNumber}`;
    }
    if (/^\d+$/.test(word) && Number(word) < NUMBER_WORDS.length) {
      changed = true;
      return NUMBER_WORDS[Number(word)];
    }
    return word;
  });
  return changed ? swapped : null;
};

const hostOf = (url: string): string | null => {
  const match = url.trim().match(/^(?:https?:\/\/)?([^/?#:]+)/i);
  return match ? match[1].toLowerCase().replace(/^www\./, '') : null;
};

const searchClearbit = async (query: string): Promise<LogoCandidate[]> => {
  const body = await fetchJson(CLEARBIT_URL + encodeURIComponent(query));
  if (!Array.isArray(body)) return [];
  return body
    .filter((item) => typeof item?.name === 'string' && typeof item?.domain === 'string')
    .map((item) => ({ name: item.name as string, domain: item.domain as string, source: 'company' as const }));
};

/** Mapped places with a website, e.g. "9 degrees Chatswood" -> 9degrees.com.au. */
const searchOpenStreetMap = async (query: string): Promise<LogoCandidate[]> => {
  const body = await fetchJson(OSM_URL + encodeURIComponent(query), OSM_HEADERS);
  if (!Array.isArray(body)) return [];
  const found: LogoCandidate[] = [];
  for (const place of body) {
    const website = place?.extratags?.website ?? place?.extratags?.['contact:website'];
    const domain = typeof website === 'string' ? hostOf(website) : null;
    if (typeof place?.name === 'string' && domain) found.push({ name: place.name, domain, source: 'place' });
  }
  return found;
};

const logoChecks = new Map<string, Promise<boolean | null>>();

/**
 * Google answers 404 (with a generic globe) for sites without an icon of their own.
 * null = couldn't tell (offline); not cached, so the next check asks again.
 */
const checkWebLogo = (domain: string): Promise<boolean | null> => {
  let check = logoChecks.get(domain);
  if (!check) {
    check = fetch(gymLogoUrl(domain))
      .then((response) => response.ok)
      .catch(() => {
        logoChecks.delete(domain);
        return null;
      });
    logoChecks.set(domain, check);
  }
  return check;
};

const hasWebLogo = async (domain: string) => (await checkWebLogo(domain)) === true;

const uniqueByDomain = (candidates: LogoCandidate[]): LogoCandidate[] => {
  const seen = new Set<string>();
  return candidates.filter(({ domain }) => !seen.has(domain) && !!seen.add(domain));
};

/**
 * Websites that might be this gym, best first, keeping only ones with a real logo. Asks
 * OpenStreetMap only when Clearbit has nothing that clearly matches, to stay well inside
 * its one-request-a-second limit while someone types.
 */
export const searchLogoCandidates = async (query: string): Promise<LogoCandidate[]> => {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];
  const queries = [trimmed, numberVariant(trimmed)].filter((q): q is string => !!q);
  // A bare brand ("Bump") drowns in unrelated companies; say it's a climbing gym.
  const saysClimbing = trimmed.toLowerCase().split(/[^a-z]+/).some((word) => FILLER_WORDS.has(word));
  const companyQueries = saysClimbing
    ? queries
    : queries.flatMap((q) => [q, `${q} climbing`, `${q} bouldering`]);

  let found = (await Promise.all(companyQueries.map(searchClearbit))).flat();
  if (!queries.some((q) => pickConfidentMatch(q, found))) {
    for (const q of queries) {
      found = found.concat(await searchOpenStreetMap(q).catch(() => []));
    }
  }

  const candidates = uniqueByDomain(found);
  const withLogo = await Promise.all(candidates.map((candidate) => hasWebLogo(candidate.domain)));
  const usable = candidates.filter((_, index) => withLogo[index]);
  // Best match first, then other clear matches, so the right gym tops the list in the editor.
  const best = queries.map((q) => pickConfidentMatch(q, usable)).find(Boolean);
  const isMatch = (candidate: LogoCandidate) => queries.some((q) => pickConfidentMatch(q, [candidate]));
  const rest = usable.filter((candidate) => candidate !== best);
  return [...(best ? [best] : []), ...rest.filter(isMatch), ...rest.filter((candidate) => !isMatch(candidate))];
};

// Words that say "this is a climbing gym" and so can't tell two gyms apart.
const FILLER_WORDS = new Set([
  'the', 'and', 'climbing', 'climb', 'bouldering', 'boulder', 'gym', 'gyms', 'centre', 'center',
  'wall', 'walls', 'indoor', 'co', 'pty', 'ltd', 'inc',
]);

const nameWords = (name: string): string[] =>
  name
    .toLowerCase()
    .replace(/&/g, ' and ')
    .split(/[^a-z0-9]+/)
    .filter((word) => word && !FILLER_WORDS.has(word))
    .map((word) => {
      const asNumber = NUMBER_WORDS.indexOf(word);
      return asNumber >= 0 ? `${asNumber}` : word;
    });

const mentionsClimbing = (name: string): boolean =>
  /\b(climb\w*|boulder\w*)\b/i.test(name);

const isSubset = (a: string[], b: string[]) => a.length > 0 && a.every((word) => b.includes(word));

/**
 * The first result whose name agrees with the gym's, word for word: "BlocHaus Bouldering"
 * for "Blochaus", "Urban Climb" for "Urban Climb Collingwood". A mapped venue may add one
 * word, its suburb ("9 degrees Chatswood" for "Nine Degrees"). So "Bump Boxes", "Nine
 * Degrees North Hospitality" and "Bloch Australia" never match.
 */
export const pickConfidentMatch = (gymName: string, candidates: LogoCandidate[]): LogoCandidate | null => {
  const gymWords = nameWords(gymName);
  const matches = candidates.filter((candidate) => {
    const words = nameWords(candidate.name);
    if (isSubset(words, gymWords)) return true;
    return candidate.source === 'place' && isSubset(gymWords, words) && words.length - gymWords.length <= 1;
  });
  // "Crux" matches both Crux (software) and Crux Climbing Center: take the climbing one.
  return matches.find((candidate) => mentionsClimbing(candidate.name)) ?? matches[0] ?? null;
};

let autoMatchRunning = false;

/**
 * Looks up a logo for every company or standalone gym never looked up before. Saves the
 * website when the match is clear, '' when it isn't (pick one in the gym editor). Network
 * failures leave the gym untouched so the next run tries again. Returns true if any gym changed.
 */
export const autoMatchGymLogos = async (): Promise<boolean> => {
  if (autoMatchRunning) return false;
  autoMatchRunning = true;
  let changed = false;
  try {
    const roots = getGyms().filter((gym) => !gym.parent_id && !gym.logo_image && !isUnnamedDefaultGym(gym));
    // A saved website whose icon turns out to be a generic globe gets searched again.
    for (const gym of roots) {
      if (gym.logo_domain && (await checkWebLogo(gym.logo_domain)) === false) {
        setGymLogoDomain(gym.id, null);
        gym.logo_domain = null;
        changed = true;
      }
    }
    const pending = roots.filter((gym) => gym.logo_domain == null);
    for (const gym of pending) {
      try {
        const match = pickConfidentMatch(gym.name, await searchLogoCandidates(gym.name));
        setGymLogoDomain(gym.id, match?.domain ?? '');
        changed = true;
      } catch {
        // Offline or the service is down: stop and retry on the next visit.
        break;
      }
    }
  } finally {
    autoMatchRunning = false;
  }
  return changed;
};
