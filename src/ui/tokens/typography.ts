import type { ThemeColors } from './colors';

export const createTypography = (colors: ThemeColors) =>
  ({
    display: {
      fontSize: 34,
      fontWeight: '900' as const,
      color: colors.textPrimary,
      letterSpacing: -0.5,
    },
    title: {
      fontSize: 23,
      fontWeight: '800' as const,
      color: colors.textPrimary,
      letterSpacing: 0.1,
    },
    numeric: {
      fontSize: 24,
      fontWeight: '900' as const,
      color: colors.textPrimary,
      letterSpacing: -0.2,
    },
    section: {
      fontSize: 12,
      fontWeight: '800' as const,
      color: colors.textMuted,
      letterSpacing: 1.1,
      textTransform: 'uppercase' as const,
    },
    body: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.textPrimary,
    },
    bodyMuted: {
      fontSize: 13,
      fontWeight: '500' as const,
      color: colors.textSecondary,
    },
    meta: {
      fontSize: 11,
      fontWeight: '800' as const,
      color: colors.textMuted,
      letterSpacing: 0.9,
      textTransform: 'uppercase' as const,
    },
  }) as const;

export type Typography = ReturnType<typeof createTypography>;
