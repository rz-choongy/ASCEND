import { getGyms, setGymLogoDomain, isUnnamedDefaultGym } from './gymStore';
import type { GymRow } from './types';

/**
 * Gym logos come from the web, not the phone: a gym stores only its website (logo_domain),
 * and the image loads from Google's favicon service, which the OS caches like any image.
 * Name -> website lookup uses Clearbit's free autocomplete. Neither needs a key.
 */

export type LogoCandidate = { name: string; domain: string };

const SEARCH_URL = 'https://autocomplete.clearbit.com/v1/companies/suggest?query=';
const SEARCH_TIMEOUT_MS = 6000;

export const gymLogoUrl = (domain: string): string =>
  `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;

/** A branch without its own logo shows its company's. */
export const resolveLogoDomain = (gym: GymRow, allGyms: GymRow[]): string | null => {
  if (gym.logo_domain) return gym.logo_domain;
  if (gym.logo_domain === '' || !gym.parent_id) return null;
  const parent = allGyms.find((g) => g.id === gym.parent_id);
  return parent?.logo_domain || null;
};

export const searchLogoCandidates = async (query: string): Promise<LogoCandidate[]> => {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS);
  try {
    const response = await fetch(SEARCH_URL + encodeURIComponent(trimmed), { signal: controller.signal });
    if (!response.ok) throw new Error(`Logo search failed (${response.status})`);
    const body: unknown = await response.json();
    if (!Array.isArray(body)) return [];
    return body
      .filter((item): item is LogoCandidate => typeof item?.name === 'string' && typeof item?.domain === 'string')
      .map(({ name, domain }) => ({ name, domain }));
  } finally {
    clearTimeout(timer);
  }
};

// Words that say "this is a climbing gym" and so can't tell two gyms apart.
const FILLER_WORDS = new Set([
  'the', 'and', 'climbing', 'climb', 'bouldering', 'boulder', 'gym', 'gyms', 'centre', 'center',
  'wall', 'walls', 'co', 'pty', 'ltd', 'inc',
]);

const nameWords = (name: string): string[] =>
  name
    .toLowerCase()
    .replace(/&/g, ' and ')
    .split(/[^a-z0-9]+/)
    .filter((word) => word && !FILLER_WORDS.has(word));

const isSubset = (a: string[], b: string[]) => a.length > 0 && a.every((word) => b.includes(word));

/**
 * The first result whose name agrees with the gym's, word for word: "BlocHaus Bouldering"
 * for "Blochaus", "Urban Climb" for "Urban Climb Collingwood", never "Bloch Australia".
 */
export const pickConfidentMatch = (gymName: string, candidates: LogoCandidate[]): LogoCandidate | null => {
  const gymWords = nameWords(gymName);
  return (
    candidates.find((candidate) => {
      const words = nameWords(candidate.name);
      return isSubset(gymWords, words) || isSubset(words, gymWords);
    }) ?? null
  );
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
    const pending = getGyms().filter(
      (gym) => !gym.parent_id && gym.logo_domain == null && !isUnnamedDefaultGym(gym)
    );
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
