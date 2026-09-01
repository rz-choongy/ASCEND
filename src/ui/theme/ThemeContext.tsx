import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { getThemeMode, setThemeMode as persistThemeMode } from '../../domain/settingsStore';
import { darkColors, lightColors, type ThemeColors, type ThemeMode } from '../tokens/colors';
import { createTypography, type Typography } from '../tokens/typography';

type ThemeContextValue = {
  colors: ThemeColors;
  typography: Typography;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>(() => {
    return getThemeMode() ?? (systemScheme === 'light' ? 'light' : 'dark');
  });

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    persistThemeMode(next);
  }, []);

  const value = useMemo<ThemeContextValue>(() => {
    const colors = mode === 'light' ? lightColors : darkColors;
    return {
      colors,
      typography: createTypography(colors),
      mode,
      setMode,
    };
  }, [mode, setMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider.');
  }
  return context;
};
