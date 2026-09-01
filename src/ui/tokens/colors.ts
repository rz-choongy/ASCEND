/**
 * Returns a readable text color for a given background hex.
 * Uses perceived luminance so dark tiles get white text and light tiles get dark text.
 */
export const getContrastText = (hex: string): string => {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return '#f2eadc';
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.45 ? '#0b1110' : '#f2eadc';
};

const gradePalette = [
  '#e9dfc7',
  '#d8a448',
  '#9db56f',
  '#4f8f7a',
  '#486f9f',
  '#9a6fb0',
  '#d76f45',
  '#3f473f',
];

export const darkColors = {
  background: '#0a0e14',
  backgroundWarm: '#0d1219',
  surface: '#131820',
  surfaceAlt: '#171d27',
  surfaceRaised: '#1c2430',
  border: '#242c38',
  borderSoft: '#333d4c',
  textPrimary: '#f5f7fa',
  textSecondary: '#a9b2c3',
  textMuted: '#6b7484',
  textInverse: '#05080d',
  accent: '#2f8fff',
  accentMuted: '#152238',
  accentSoft: '#1d3a5c',
  success: '#3ecf6e',
  warning: '#f2c45f',
  danger: '#f2564a',
  overlay: 'rgba(4, 6, 10, 0.78)',
  gradePalette,
};

/** GoClimbr-inspired: warm off-white background, white cards, near-black text. */
export const lightColors = {
  background: '#f7f4ee',
  backgroundWarm: '#f2ede2',
  surface: '#ffffff',
  surfaceAlt: '#f4f1ea',
  surfaceRaised: '#ffffff',
  border: '#e6e1d5',
  borderSoft: '#d6cfc0',
  textPrimary: '#17181c',
  textSecondary: '#5b5d66',
  textMuted: '#8b8d94',
  textInverse: '#ffffff',
  accent: '#2f8fff',
  accentMuted: '#e7f1ff',
  accentSoft: '#cee3ff',
  success: '#1f9d55',
  warning: '#b7791f',
  danger: '#d64545',
  overlay: 'rgba(23, 20, 14, 0.45)',
  gradePalette,
};

export type ThemeColors = typeof darkColors;
export type ThemeMode = 'light' | 'dark';
