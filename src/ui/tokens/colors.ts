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

/** "Soft black" -- a neutral near-black, chosen over the earlier navy-tinted dark background. */
export const darkColors = {
  background: '#121212',
  backgroundWarm: '#161616',
  surface: '#1c1c1c',
  surfaceAlt: '#202020',
  surfaceRaised: '#262626',
  border: '#2e2e2e',
  borderSoft: '#3d3d3d',
  textPrimary: '#ececec',
  textSecondary: '#adadad',
  textMuted: '#7a7a7a',
  textInverse: '#0a0a0a',
  accent: '#2f8fff',
  accentMuted: '#152238',
  accentSoft: '#1d3a5c',
  success: '#3ecf6e',
  warning: '#f2c45f',
  danger: '#f2564a',
  overlay: 'rgba(0, 0, 0, 0.78)',
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

export type AccentColorId = 'blue' | 'teal' | 'purple' | 'orange' | 'rose';

type AccentTint = { accent: string; accentMuted: string; accentSoft: string };

export const ACCENT_PALETTE: Record<AccentColorId, { label: string; dark: AccentTint; light: AccentTint }> = {
  blue: {
    label: 'Blue',
    dark: { accent: '#2f8fff', accentMuted: '#152238', accentSoft: '#1d3a5c' },
    light: { accent: '#2f8fff', accentMuted: '#e7f1ff', accentSoft: '#cee3ff' },
  },
  teal: {
    label: 'Teal',
    dark: { accent: '#2dd4bf', accentMuted: '#0f2624', accentSoft: '#164a44' },
    light: { accent: '#0d9488', accentMuted: '#e3faf6', accentSoft: '#b8f0e7' },
  },
  purple: {
    label: 'Purple',
    dark: { accent: '#a78bfa', accentMuted: '#241f38', accentSoft: '#3b2f5c' },
    light: { accent: '#7c3aed', accentMuted: '#f1ebfe', accentSoft: '#ddccfb' },
  },
  orange: {
    label: 'Orange',
    dark: { accent: '#fb923c', accentMuted: '#2b1d10', accentSoft: '#4a2f16' },
    light: { accent: '#ea580c', accentMuted: '#fdece0', accentSoft: '#fbd0ad' },
  },
  rose: {
    label: 'Rose',
    dark: { accent: '#fb7185', accentMuted: '#2b141a', accentSoft: '#4a1f29' },
    light: { accent: '#e11d48', accentMuted: '#fde8ec', accentSoft: '#fac0cb' },
  },
};

export const DEFAULT_ACCENT_ID: AccentColorId = 'blue';

export const applyAccent = (base: ThemeColors, accentId: AccentColorId, mode: ThemeMode): ThemeColors => {
  const tint = ACCENT_PALETTE[accentId]?.[mode] ?? ACCENT_PALETTE[DEFAULT_ACCENT_ID][mode];
  return { ...base, ...tint };
};
