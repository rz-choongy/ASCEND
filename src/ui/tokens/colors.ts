/**
 * Returns a readable text color for a given background hex.
 * Uses perceived luminance so dark tiles get white text and light tiles get dark text.
 */
export const getContrastText = (hex: string): string => {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return '#ffffff';
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? '#000000' : '#ffffff';
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

/**
 * iOS dark: a true-black ground with the system's layered greys stacked on top,
 * so grouped cards read as elevation rather than as outlined boxes. Separators
 * and fills are translucent (as UIKit's are) so they hold up over any surface.
 */
export const darkColors = {
  background: '#000000',
  backgroundWarm: '#0b0b0d',
  surface: '#1c1c1e',
  surfaceAlt: '#2c2c2e',
  surfaceRaised: '#3a3a3c',
  border: '#2c2c2e',
  borderSoft: '#3a3a3c',
  separator: 'rgba(84, 84, 88, 0.6)',
  fill: 'rgba(120, 120, 128, 0.24)',
  fillSoft: 'rgba(120, 120, 128, 0.14)',
  textPrimary: '#ffffff',
  textSecondary: 'rgba(235, 235, 245, 0.62)',
  textMuted: 'rgba(235, 235, 245, 0.4)',
  textInverse: '#000000',
  accent: '#eac60f',
  accentMuted: 'rgba(234, 198, 15, 0.16)',
  accentSoft: 'rgba(234, 198, 15, 0.28)',
  success: '#30d158',
  warning: '#ffd60a',
  danger: '#ff453a',
  overlay: 'rgba(0, 0, 0, 0.6)',
  gradePalette,
};

/** iOS light: the grouped-table pairing -- grey ground, white cards floating on it. */
export const lightColors = {
  background: '#f2f2f7',
  backgroundWarm: '#ebebf0',
  surface: '#ffffff',
  surfaceAlt: '#f2f2f7',
  surfaceRaised: '#ffffff',
  border: '#e5e5ea',
  borderSoft: '#d1d1d6',
  separator: 'rgba(60, 60, 67, 0.29)',
  fill: 'rgba(118, 118, 128, 0.12)',
  fillSoft: 'rgba(118, 118, 128, 0.08)',
  textPrimary: '#000000',
  textSecondary: 'rgba(60, 60, 67, 0.6)',
  textMuted: 'rgba(60, 60, 67, 0.4)',
  textInverse: '#ffffff',
  accent: '#b8860a',
  accentMuted: 'rgba(184, 134, 10, 0.12)',
  accentSoft: 'rgba(184, 134, 10, 0.22)',
  success: '#34c759',
  warning: '#ff9f0a',
  danger: '#ff3b30',
  overlay: 'rgba(0, 0, 0, 0.4)',
  gradePalette,
};

export type ThemeColors = typeof darkColors;
export type ThemeMode = 'light' | 'dark';

export type AccentColorId = 'blue' | 'teal' | 'purple' | 'orange' | 'rose' | 'amber';

type AccentTint = { accent: string; accentMuted: string; accentSoft: string };

/**
 * Accent tints. Dark uses the iOS "vivid on black" variant of each hue; light
 * uses the standard one. Muted/soft are alpha tints of the accent itself rather
 * than baked-in mixes, so they sit correctly on every surface layer.
 */
export const ACCENT_PALETTE: Record<AccentColorId, { label: string; dark: AccentTint; light: AccentTint }> = {
  blue: {
    label: 'Blue',
    dark: { accent: '#0a84ff', accentMuted: 'rgba(10, 132, 255, 0.16)', accentSoft: 'rgba(10, 132, 255, 0.28)' },
    light: { accent: '#007aff', accentMuted: 'rgba(0, 122, 255, 0.12)', accentSoft: 'rgba(0, 122, 255, 0.22)' },
  },
  teal: {
    label: 'Teal',
    dark: { accent: '#64d2ff', accentMuted: 'rgba(100, 210, 255, 0.16)', accentSoft: 'rgba(100, 210, 255, 0.28)' },
    light: { accent: '#0d9488', accentMuted: 'rgba(13, 148, 136, 0.12)', accentSoft: 'rgba(13, 148, 136, 0.22)' },
  },
  purple: {
    label: 'Purple',
    dark: { accent: '#bf5af2', accentMuted: 'rgba(191, 90, 242, 0.16)', accentSoft: 'rgba(191, 90, 242, 0.28)' },
    light: { accent: '#7c3aed', accentMuted: 'rgba(124, 58, 237, 0.12)', accentSoft: 'rgba(124, 58, 237, 0.22)' },
  },
  orange: {
    label: 'Orange',
    dark: { accent: '#ff9f0a', accentMuted: 'rgba(255, 159, 10, 0.16)', accentSoft: 'rgba(255, 159, 10, 0.28)' },
    light: { accent: '#ea580c', accentMuted: 'rgba(234, 88, 12, 0.12)', accentSoft: 'rgba(234, 88, 12, 0.22)' },
  },
  rose: {
    label: 'Rose',
    dark: { accent: '#ff375f', accentMuted: 'rgba(255, 55, 95, 0.16)', accentSoft: 'rgba(255, 55, 95, 0.28)' },
    light: { accent: '#e11d48', accentMuted: 'rgba(225, 29, 72, 0.12)', accentSoft: 'rgba(225, 29, 72, 0.22)' },
  },
  amber: {
    label: 'Amber',
    dark: { accent: '#eac60f', accentMuted: 'rgba(234, 198, 15, 0.16)', accentSoft: 'rgba(234, 198, 15, 0.28)' },
    light: { accent: '#b8860a', accentMuted: 'rgba(184, 134, 10, 0.12)', accentSoft: 'rgba(184, 134, 10, 0.22)' },
  },
};

export const DEFAULT_ACCENT_ID: AccentColorId = 'amber';

export const applyAccent = (base: ThemeColors, accentId: AccentColorId, mode: ThemeMode): ThemeColors => {
  const tint = ACCENT_PALETTE[accentId]?.[mode] ?? ACCENT_PALETTE[DEFAULT_ACCENT_ID][mode];
  return { ...base, ...tint };
};
