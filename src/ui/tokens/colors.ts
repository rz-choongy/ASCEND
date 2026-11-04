/**
 * Returns a readable text color for a given background hex: black or white, whichever has the
 * higher WCAG contrast ratio. The old brightness cutoff put white text on mid greens at about 2.3:1.
 */
export const getContrastText = (hex: string): string => {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return '#ffffff';
  const channel = (start: number) => {
    const c = parseInt(clean.slice(start, start + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const luminance = 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4);
  const contrastWithBlack = (luminance + 0.05) / 0.05;
  const contrastWithWhite = 1.05 / (luminance + 0.05);
  return contrastWithBlack >= contrastWithWhite ? '#000000' : '#ffffff';
};

/** Grade tape, V0 to V7: the colours a new grade gets in the gym editor and the V-scale default. */
const gradePalette = [
  '#F6F5F2',
  '#F2C230',
  '#3AA86B',
  '#4D86E0',
  '#E0533F',
  '#EE8FBD',
  '#9B7AD8',
  '#151515',
];

/** Status colours (success/warning/danger) draw from this range. */
const semantic = {
  red: '#E8503A',
  orange: '#FF5A1F',
  yellow: '#F2C230',
  green: '#3AA86B',
  sky: '#5FB4E8',
  blue: '#4D86E0',
  purple: '#9B6BEA',
  pink: '#EE8FBD',
};

/** Dark: pure black ground for OLED, cards one soft step up, no borders. The accent fills actions. */
export const darkColors = {
  background: '#000000',
  surface: '#17181B',
  surfaceAlt: '#202125',
  surfaceRaised: '#2A2B30',
  border: '#26272B',
  borderSoft: '#34353A',
  separator: '#26272B',
  fill: '#202125',
  fillSoft: '#17181B',
  // Solid fills for primary actions and selections. Overwritten by `applyAccent`.
  action: '#22B0A0',
  onAction: '#151515',
  textPrimary: '#F2F2F4',
  textSecondary: '#9A9DA6',
  textMuted: '#6E717A',
  textInverse: '#000000',
  accent: '#22B0A0',
  accentMuted: 'rgba(34, 176, 160, 0.16)',
  accentSoft: 'rgba(34, 176, 160, 0.28)',
  // The accent when it has to be read as text or a thin line on the surface.
  accentInk: '#22B0A0',
  // Chart marks: the strong series (flash, the line) and the quiet one (send, empty weeks).
  chartStrong: '#F2F2F4',
  chartQuiet: '#55575E',
  chartTrack: '#2A2B30',
  success: semantic.green,
  successSubtle: 'rgba(58, 168, 107, 0.18)',
  warning: semantic.orange,
  warningSubtle: 'rgba(255, 90, 31, 0.18)',
  danger: semantic.red,
  dangerSubtle: 'rgba(232, 80, 58, 0.18)',
  overlay: 'rgba(0, 0, 0, 0.6)',
  shadow: 'transparent',
  semantic,
  gradePalette,
};

/** Light: white cards on a cool soft-grey ground, no borders, accent-filled actions. */
export const lightColors: ThemeColors = {
  background: '#F1F2F6',
  surface: '#FFFFFF',
  surfaceAlt: '#F1F2F6',
  surfaceRaised: '#FFFFFF',
  border: '#E7E8ED',
  borderSoft: '#D9DAE0',
  separator: '#E7E8ED',
  fill: '#E9EAEF',
  fillSoft: '#F1F2F6',
  action: '#22B0A0',
  onAction: '#151515',
  textPrimary: '#16171A',
  textSecondary: '#666973',
  textMuted: '#8E919A',
  textInverse: '#FFFFFF',
  accent: '#22B0A0',
  accentMuted: 'rgba(34, 176, 160, 0.14)',
  accentSoft: 'rgba(34, 176, 160, 0.26)',
  accentInk: '#13695F',
  chartStrong: '#16171A',
  chartQuiet: '#B9BBC3',
  chartTrack: '#E9EAEF',
  success: '#23804D',
  successSubtle: '#DDF2E5',
  warning: '#C2410C',
  warningSubtle: '#FFE8DC',
  danger: '#C23A26',
  dangerSubtle: '#FBE3DF',
  overlay: 'rgba(0, 0, 0, 0.4)',
  shadow: '#000000',
  semantic,
  gradePalette,
};

export type ThemeColors = typeof darkColors;
export type ThemeMode = 'light' | 'dark';

export type AccentColorId =
  | 'yellow'
  | 'amber'
  | 'orange'
  | 'red'
  | 'pink'
  | 'magenta'
  | 'purple'
  | 'blue'
  | 'sky'
  | 'teal'
  | 'green'
  | 'lime';

/**
 * Twelve flat accents, the same hex in both modes. Every one carries near-black text
 * at 4.6:1 or better, so `onAction` is always #151515.
 */
export const ACCENT_PALETTE: Record<AccentColorId, { label: string; hex: string }> = {
  yellow: { label: 'Tape Yellow', hex: '#F2C230' },
  amber: { label: 'Amber', hex: '#F59A23' },
  orange: { label: 'Hazard Orange', hex: '#FF5A1F' },
  red: { label: 'Red', hex: '#E8503A' },
  pink: { label: 'Tape Pink', hex: '#EE8FBD' },
  magenta: { label: 'Magenta', hex: '#D65CC0' },
  purple: { label: 'Purple', hex: '#9B6BEA' },
  blue: { label: 'Tape Blue', hex: '#4D86E0' },
  sky: { label: 'Sky', hex: '#5FB4E8' },
  teal: { label: 'Teal', hex: '#22B0A0' },
  green: { label: 'Hold Green', hex: '#3AA86B' },
  lime: { label: 'Lime', hex: '#B5D334' },
};

/** Accent ids from before 2.7.0, mapped to the nearest new accent so nobody's colour jumps. */
export const LEGACY_ACCENT_IDS: Record<string, AccentColorId> = {
  rose: 'red',
};

export const DEFAULT_ACCENT_ID: AccentColorId = 'teal';

const hexToRgb = (hex: string) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as const;
};

const rgba = (hex: string, alpha: number) => `rgba(${hexToRgb(hex).join(', ')}, ${alpha})`;

/** Darkens a hex towards black; used so a bright accent stays readable as text on white. */
const darken = (hex: string, amount: number) =>
  '#' +
  hexToRgb(hex)
    .map((c) => Math.round(c * (1 - amount)).toString(16).padStart(2, '0'))
    .join('');

export const applyAccent = (base: ThemeColors, accentId: AccentColorId, mode: ThemeMode): ThemeColors => {
  const hex = (ACCENT_PALETTE[accentId] ?? ACCENT_PALETTE[DEFAULT_ACCENT_ID]).hex;
  return {
    ...base,
    accent: hex,
    accentMuted: rgba(hex, mode === 'light' ? 0.14 : 0.16),
    accentSoft: rgba(hex, mode === 'light' ? 0.26 : 0.28),
    accentInk: mode === 'light' ? darken(hex, 0.45) : hex,
    action: hex,
    onAction: getContrastText(hex) === '#000000' ? '#151515' : '#ffffff',
  };
};
