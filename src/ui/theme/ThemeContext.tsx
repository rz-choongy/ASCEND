import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import {
  getAccentColorId,
  getThemeMode,
  setAccentColorId as persistAccentColorId,
  setThemeMode as persistThemeMode,
} from '../../domain/settingsStore';
import {
  applyAccent,
  darkColors,
  lightColors,
  type AccentColorId,
  type ThemeColors,
  type ThemeMode,
} from '../tokens/colors';
import { createTypography, type Typography } from '../tokens/typography';

type ThemeContextValue = {
  colors: ThemeColors;
  typography: Typography;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  accentId: AccentColorId;
  setAccentId: (accentId: AccentColorId) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>(() => {
    return getThemeMode() ?? (systemScheme === 'light' ? 'light' : 'dark');
  });
  const [accentId, setAccentIdState] = useState<AccentColorId>(() => getAccentColorId());

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    persistThemeMode(next);
  }, []);

  const setAccentId = useCallback((next: AccentColorId) => {
    setAccentIdState(next);
    persistAccentColorId(next);
  }, []);

  const value = useMemo<ThemeContextValue>(() => {
    const base = mode === 'light' ? lightColors : darkColors;
    const colors = applyAccent(base, accentId, mode);
    return {
      colors,
      typography: createTypography(colors),
      mode,
      setMode,
      accentId,
      setAccentId,
    };
  }, [mode, setMode, accentId, setAccentId]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider.');
  }
  return context;
};
