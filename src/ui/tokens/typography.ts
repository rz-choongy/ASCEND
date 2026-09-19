import type { TextStyle } from 'react-native';
import type { ThemeColors } from './colors';

// The type scale follows the iOS text styles (large title / title / headline /
// body / subhead / footnote), so the app reads as a native SwiftUI screen.
// No `fontFamily` is set anywhere on purpose: that hands each platform its own
// UI face -- SF Pro on iOS, Roboto on Android -- which is the whole point of the
// system look, and sidesteps the RN "weight must name a loaded family" problem
// that custom families have.
export const createTypography = (colors: ThemeColors) =>
  ({
    // Large title. Screen headers that scroll under a nav bar.
    display: {
      fontSize: 34,
      fontWeight: '700' as const,
      color: colors.textPrimary,
      letterSpacing: 0.37,
    },
    // Title 2/3. Card and section headings.
    title: {
      fontSize: 22,
      fontWeight: '700' as const,
      color: colors.textPrimary,
      letterSpacing: -0.4,
    },
    // Figures. Tabular so columns of weights and counts stay aligned.
    numeric: {
      fontSize: 24,
      fontWeight: '700' as const,
      color: colors.textPrimary,
      letterSpacing: -0.4,
      fontVariant: ['tabular-nums'] as TextStyle['fontVariant'],
    },
    // Grouped-list section header. Sentence case, not shouted -- modern iOS
    // dropped the all-caps table headers.
    section: {
      fontSize: 13,
      fontWeight: '600' as const,
      color: colors.textSecondary,
      letterSpacing: -0.08,
    },
    // Body / headline. The default reading size for row titles and content.
    body: {
      fontSize: 16,
      fontWeight: '500' as const,
      color: colors.textPrimary,
      letterSpacing: -0.24,
    },
    // Subhead. Supporting copy under a body line.
    bodyMuted: {
      fontSize: 14,
      fontWeight: '400' as const,
      color: colors.textSecondary,
      letterSpacing: -0.15,
    },
    // Footnote/caption. Timestamps, units, counts.
    meta: {
      fontSize: 12,
      fontWeight: '500' as const,
      color: colors.textMuted,
      letterSpacing: -0.05,
    },
  }) as const;

export type Typography = ReturnType<typeof createTypography>;
