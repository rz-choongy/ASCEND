import type { TextStyle } from 'react-native';
import type { ThemeColors } from './colors';
import { font } from './fonts';

// Prism's type, scaled up for a phone: Geist with tight tracking and tabular
// figures, and small wide-tracked uppercase labels for sections. Prism's 13px
// desktop base becomes 16px here so body copy stays readable at arm's length.
// Weight comes from the family (see fonts.ts) -- don't add `fontWeight`.
export const createTypography = (colors: ThemeColors) =>
  ({
    // Screen titles.
    display: {
      ...font('semibold'),
      fontSize: 30,
      color: colors.textPrimary,
      letterSpacing: -0.6,
    },
    // Card and sheet headings.
    title: {
      ...font('semibold'),
      fontSize: 20,
      color: colors.textPrimary,
      letterSpacing: -0.3,
    },
    // Figures. Tabular so columns of weights and counts stay aligned.
    numeric: {
      ...font('semibold'),
      fontSize: 24,
      color: colors.textPrimary,
      letterSpacing: -0.4,
      fontVariant: ['tabular-nums'] as TextStyle['fontVariant'],
    },
    // Prism's `--font-size-xs upper` label: "SETTINGS", "EXPORT".
    section: {
      ...font('medium'),
      fontSize: 11,
      color: colors.textSecondary,
      letterSpacing: 0.9,
      textTransform: 'uppercase' as const,
    },
    // Row titles and content.
    body: {
      ...font('medium'),
      fontSize: 16,
      color: colors.textPrimary,
      letterSpacing: -0.16,
    },
    // Supporting copy under a body line.
    bodyMuted: {
      ...font('regular'),
      fontSize: 14,
      color: colors.textSecondary,
      letterSpacing: -0.07,
    },
    // Timestamps, units, counts.
    meta: {
      ...font('medium'),
      fontSize: 12,
      color: colors.textMuted,
      letterSpacing: -0.06,
    },
    // Durations and measurements: Prism's tabular mono (00:04.5s).
    mono: {
      ...font('mono'),
      fontSize: 13,
      color: colors.textSecondary,
      fontVariant: ['tabular-nums'] as TextStyle['fontVariant'],
    },
  }) as const;

export type Typography = ReturnType<typeof createTypography>;
