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

export const colors = {
  background: '#0b1110',
  backgroundWarm: '#10150f',
  surface: '#151b18',
  surfaceAlt: '#1b241d',
  surfaceRaised: '#202a21',
  border: '#2b352d',
  borderSoft: '#3a463b',
  textPrimary: '#f2eadc',
  textSecondary: '#cfc5b3',
  textMuted: '#918a7d',
  textInverse: '#0b1110',
  accent: '#d8a448',
  accentMuted: '#332817',
  accentSoft: '#4a371a',
  success: '#7dbb6d',
  warning: '#f2c45f',
  danger: '#e0644f',
  overlay: 'rgba(6, 10, 8, 0.74)',
  gradePalette: [
    '#e9dfc7',
    '#d8a448',
    '#9db56f',
    '#4f8f7a',
    '#486f9f',
    '#9a6fb0',
    '#d76f45',
    '#3f473f',
  ],
};
