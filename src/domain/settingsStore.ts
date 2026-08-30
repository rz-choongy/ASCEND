import { getFirst, run } from '../db/db';
import type { ThemeMode } from '../ui/tokens/colors';

const THEME_MODE_KEY = 'theme_mode';

type AppSettingRow = {
  value: string;
};

export const getThemeMode = (): ThemeMode | null => {
  const setting = getFirst<AppSettingRow>('SELECT value FROM app_settings WHERE key = ? LIMIT 1;', [
    THEME_MODE_KEY,
  ]);
  return setting?.value === 'light' || setting?.value === 'dark' ? setting.value : null;
};

export const setThemeMode = (mode: ThemeMode): void => {
  run(
    `INSERT INTO app_settings (key, value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at;`,
    [THEME_MODE_KEY, mode, Date.now()]
  );
};
