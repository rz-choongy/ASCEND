import type { ThemeColors } from './colors';

// Space Grotesk carries display/heading roles; Work Sans carries body/label
// roles -- ported from the Direction A wireframe's type pairing. RN (Android
// especially) needs the specific loaded weight family, not a generic family
// name plus `fontWeight`, so each style names its exact loaded font.
export const createTypography = (colors: ThemeColors) =>
  ({
    display: {
      fontSize: 34,
      fontFamily: 'SpaceGrotesk_700Bold',
      fontWeight: '700' as const,
      color: colors.textPrimary,
      letterSpacing: -0.5,
    },
    title: {
      fontSize: 23,
      fontFamily: 'SpaceGrotesk_600SemiBold',
      fontWeight: '600' as const,
      color: colors.textPrimary,
      letterSpacing: 0.1,
    },
    numeric: {
      fontSize: 24,
      fontFamily: 'SpaceGrotesk_700Bold',
      fontWeight: '700' as const,
      color: colors.textPrimary,
      letterSpacing: -0.2,
    },
    section: {
      fontSize: 12,
      fontFamily: 'WorkSans_800ExtraBold',
      fontWeight: '800' as const,
      color: colors.textMuted,
      letterSpacing: 1.1,
      textTransform: 'uppercase' as const,
    },
    body: {
      fontSize: 14,
      fontFamily: 'WorkSans_600SemiBold',
      fontWeight: '600' as const,
      color: colors.textPrimary,
    },
    bodyMuted: {
      fontSize: 13,
      fontFamily: 'WorkSans_500Medium',
      fontWeight: '500' as const,
      color: colors.textSecondary,
    },
    meta: {
      fontSize: 11,
      fontFamily: 'WorkSans_800ExtraBold',
      fontWeight: '800' as const,
      color: colors.textMuted,
      letterSpacing: 0.9,
      textTransform: 'uppercase' as const,
    },
  }) as const;

export type Typography = ReturnType<typeof createTypography>;
