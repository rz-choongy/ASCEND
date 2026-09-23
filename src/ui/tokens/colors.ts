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
 * Prism's semantic range. Status colours (success/warning/danger) draw from it,
 * and the `subtle` tints are the washes behind a status badge or PR flag.
 */
const semantic = {
  red: '#ef4444',
  orange: '#f97316',
  yellow: '#eab308',
  green: '#22c55e',
  sky: '#0ea5e9',
  blue: '#3b82f6',
  purple: '#a855f7',
  pink: '#ec4899',
};

/**
 * Prism dark: near-black ground, cards one step up, hairline borders doing the
 * separating. Neutral everywhere except `action`: Prism's solid pills and
 * selections, filled with the user's accent by `applyAccent`.
 */
export const darkColors = {
  background: '#0a0a0a',
  surface: '#161616',
  surfaceAlt: '#1e1e1e',
  surfaceRaised: '#333333',
  border: '#2a2a2a',
  borderSoft: '#3d3d3d',
  separator: '#2a2a2a',
  fill: '#1e1e1e',
  fillSoft: '#161616',
  // Solid fills for primary actions and selections (Prism's black pill).
  // Overwritten by `applyAccent`, so the user's accent drives them.
  action: '#eac60f',
  onAction: '#000000',
  textPrimary: '#f5f5f5',
  textSecondary: '#a3a3a3',
  textMuted: '#6b6b6b',
  textInverse: '#0a0a0a',
  accent: '#eac60f',
  accentMuted: 'rgba(234, 198, 15, 0.16)',
  accentSoft: 'rgba(234, 198, 15, 0.28)',
  success: semantic.green,
  successSubtle: 'rgba(34, 197, 94, 0.16)',
  warning: semantic.orange,
  warningSubtle: 'rgba(249, 115, 22, 0.16)',
  danger: semantic.red,
  dangerSubtle: 'rgba(239, 68, 68, 0.16)',
  overlay: 'rgba(0, 0, 0, 0.6)',
  shadow: 'transparent',
  semantic,
  gradePalette,
};

/** Prism light: white cards floating on the soft-grey ground, accent-filled actions. */
export const lightColors = {
  background: '#f4f4f5',
  surface: '#ffffff',
  surfaceAlt: '#f4f4f5',
  surfaceRaised: '#ffffff',
  border: '#e5e5e5',
  borderSoft: '#d4d4d4',
  separator: '#e5e5e5',
  fill: '#ececef',
  fillSoft: '#f4f4f5',
  action: '#b8860a',
  onAction: '#ffffff',
  textPrimary: '#0a0a0a',
  textSecondary: '#737373',
  textMuted: '#a3a3a3',
  textInverse: '#ffffff',
  accent: '#b8860a',
  accentMuted: 'rgba(184, 134, 10, 0.12)',
  accentSoft: 'rgba(184, 134, 10, 0.22)',
  success: '#16a34a',
  successSubtle: '#dcfce7',
  warning: semantic.orange,
  warningSubtle: '#ffedd5',
  danger: '#dc2626',
  dangerSubtle: '#fee2e2',
  overlay: 'rgba(0, 0, 0, 0.4)',
  shadow: '#000000',
  semantic,
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
  // Derived rather than fixed: a bright tint (amber, teal) needs dark text on
  // its fill where a saturated one (blue, purple) needs white.
  return { ...base, ...tint, action: tint.accent, onAction: getContrastText(tint.accent) };
};
