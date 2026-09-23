import { getFirst, run } from '../db/db';
import { ACCENT_PALETTE, DEFAULT_ACCENT_ID, type AccentColorId, type ThemeMode } from '../ui/tokens/colors';

const THEME_MODE_KEY = 'theme_mode';
const SHOW_SESSION_TIMER_KEY = 'show_session_timer';
const PROGRESS_GRADE_GYM_ID_KEY = 'progress_grade_gym_id';
const PROGRESS_FAVORITE_GYMS_KEY = 'progress_favorite_gym_ids';
const ACCENT_COLOR_KEY = 'accent_color';
const KILTER_LAST_SYNCED_KEY = 'kilter_last_synced_at';
const KILTER_USERNAME_KEY = 'kilter_username';
const KILTER_SESSION_KEY = 'kilter_session';

// Derived from the palette so a new accent can't be silently rejected on the next launch.
const VALID_ACCENT_IDS = Object.keys(ACCENT_PALETTE) as AccentColorId[];

type AppSettingRow = {
  value: string;
};

const setSetting = (key: string, value: string): void => {
  run(
    `INSERT INTO app_settings (key, value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at;`,
    [key, value, Date.now()]
  );
};

export const getThemeMode = (): ThemeMode | null => {
  const setting = getFirst<AppSettingRow>('SELECT value FROM app_settings WHERE key = ? LIMIT 1;', [
    THEME_MODE_KEY,
  ]);
  return setting?.value === 'light' || setting?.value === 'dark' ? setting.value : null;
};

export const setThemeMode = (mode: ThemeMode): void => {
  setSetting(THEME_MODE_KEY, mode);
};

export const getShowSessionTimer = (): boolean => {
  const setting = getFirst<AppSettingRow>('SELECT value FROM app_settings WHERE key = ? LIMIT 1;', [
    SHOW_SESSION_TIMER_KEY,
  ]);
  return setting ? setting.value === '1' : true;
};

export const setShowSessionTimer = (value: boolean): void => {
  setSetting(SHOW_SESSION_TIMER_KEY, value ? '1' : '0');
};

/** Which gym's grade distribution to show on the Progress screen, remembered across sessions. */
export const getProgressGradeGymId = (): string | null => {
  const setting = getFirst<AppSettingRow>('SELECT value FROM app_settings WHERE key = ? LIMIT 1;', [
    PROGRESS_GRADE_GYM_ID_KEY,
  ]);
  return setting?.value ?? null;
};

export const setProgressGradeGymId = (gymId: string): void => {
  setSetting(PROGRESS_GRADE_GYM_ID_KEY, gymId);
};

/**
 * Gyms pinned as chips on the grade pyramid; the rest sit behind "More". null means
 * the user hasn't chosen yet (the screen then picks the most-visited gyms).
 */
export const getFavoriteGradeGymIds = (): string[] | null => {
  const setting = getFirst<AppSettingRow>('SELECT value FROM app_settings WHERE key = ? LIMIT 1;', [
    PROGRESS_FAVORITE_GYMS_KEY,
  ]);
  if (!setting) return null;
  try {
    const parsed: unknown = JSON.parse(setting.value);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : null;
  } catch {
    return null;
  }
};

export const setFavoriteGradeGymIds = (gymIds: string[]): void => {
  setSetting(PROGRESS_FAVORITE_GYMS_KEY, JSON.stringify(gymIds));
};

export const getAccentColorId = (): AccentColorId => {
  const setting = getFirst<AppSettingRow>('SELECT value FROM app_settings WHERE key = ? LIMIT 1;', [
    ACCENT_COLOR_KEY,
  ]);
  const value = setting?.value;
  return VALID_ACCENT_IDS.includes(value as AccentColorId) ? (value as AccentColorId) : DEFAULT_ACCENT_ID;
};

export const setAccentColorId = (accentId: AccentColorId): void => {
  setSetting(ACCENT_COLOR_KEY, accentId);
};

/** When Kilter sends were last imported (ms since epoch), or null if never. */
export const getKilterLastSyncedAt = (): number | null => {
  const setting = getFirst<AppSettingRow>('SELECT value FROM app_settings WHERE key = ? LIMIT 1;', [
    KILTER_LAST_SYNCED_KEY,
  ]);
  const value = setting ? Number(setting.value) : NaN;
  return Number.isFinite(value) ? value : null;
};

export const setKilterLastSyncedAt = (ms: number): void => {
  setSetting(KILTER_LAST_SYNCED_KEY, String(ms));
};

/**
 * Who is connected to Kilter, for display only. Kept here rather than read back out of secure
 * storage so opening Settings never has to touch the native keychain module.
 */
export const getKilterUsername = (): string | null => {
  const setting = getFirst<AppSettingRow>('SELECT value FROM app_settings WHERE key = ? LIMIT 1;', [
    KILTER_USERNAME_KEY,
  ]);
  return setting?.value ? setting.value : null;
};

export const setKilterUsername = (username: string | null): void => {
  if (username) setSetting(KILTER_USERNAME_KEY, username);
  else run('DELETE FROM app_settings WHERE key = ?;', [KILTER_USERNAME_KEY]);
};

/**
 * The Kilter sign-in (refresh token + username) as one JSON string. Lives in the local database
 * because expo-secure-store closed the app on Android release builds (Expo SDK 54). The
 * password is never stored -- only the refresh token Kilter issues in exchange for it.
 */
export const getKilterSession = (): string | null => {
  const setting = getFirst<AppSettingRow>('SELECT value FROM app_settings WHERE key = ? LIMIT 1;', [
    KILTER_SESSION_KEY,
  ]);
  return setting?.value ?? null;
};

export const setKilterSession = (json: string): void => {
  setSetting(KILTER_SESSION_KEY, json);
};

export const clearKilterSession = (): void => {
  run('DELETE FROM app_settings WHERE key = ?;', [KILTER_SESSION_KEY]);
};
