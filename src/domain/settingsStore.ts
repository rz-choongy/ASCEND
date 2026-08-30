import { getFirst, run } from '../db/db';
import type { ThemeMode } from '../ui/tokens/colors';

const THEME_MODE_KEY = 'theme_mode';
const SHOW_SESSION_TIMER_KEY = 'show_session_timer';

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
