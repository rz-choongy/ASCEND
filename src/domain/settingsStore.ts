import { getFirst, run } from '../db/db';
import { DEFAULT_ACCENT_ID, type AccentColorId, type ThemeMode } from '../ui/tokens/colors';

const THEME_MODE_KEY = 'theme_mode';
const SHOW_SESSION_TIMER_KEY = 'show_session_timer';
const PROGRESS_GRADE_GYM_ID_KEY = 'progress_grade_gym_id';
const ACCENT_COLOR_KEY = 'accent_color';

const VALID_ACCENT_IDS: AccentColorId[] = ['blue', 'teal', 'purple', 'orange', 'rose'];

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
