import type { TextStyle } from 'react-native';
import type { ThemeColors } from './colors';
import { font } from './fonts';

// Google Sans Flex throughout, on the Material 3 scale: semibold for titles and
// figures, regular/medium for everything else. Sentence case, no uppercase labels.
// Big type is tightened, small labels opened up a touch. Nothing below 12 except
// chart axes and week letters. Weight comes from the family (see fonts.ts) --
// don't add `fontWeight`.
const tabular = ['tabular-nums'] as TextStyle['fontVariant'];

export const createTypography = (colors: ThemeColors) =>
  ({
    // Screen titles: "Today", "Progress".
    display: {
      ...font('display'),
      fontSize: 22,
      lineHeight: 28,
      letterSpacing: -0.3,
      color: colors.textPrimary,
    },
    // Sheet and section headings.
    title: {
      ...font('semibold'),
      fontSize: 17,
      lineHeight: 22,
      letterSpacing: -0.1,
      color: colors.textPrimary,
    },
    // Figures in stat rows: sends, grades, percentages.
    numeric: {
      ...font('display'),
      fontSize: 20,
      lineHeight: 24,
      letterSpacing: -0.2,
      color: colors.textPrimary,
      fontVariant: tabular,
    },
    // Card labels: "Grade pyramid", "Last climb". Sentence case.
    section: {
      ...font('semibold'),
      fontSize: 14,
      lineHeight: 18,
      color: colors.textPrimary,
    },
    // Row titles and content.
    body: {
      ...font('medium'),
      fontSize: 14,
      lineHeight: 18,
      color: colors.textPrimary,
    },
    // Supporting copy under a body line.
    bodyMuted: {
      ...font('regular'),
      fontSize: 13,
      lineHeight: 18,
      color: colors.textSecondary,
    },
    // Timestamps, units, counts, stat labels.
    meta: {
      ...font('regular'),
      fontSize: 12,
      lineHeight: 16,
      letterSpacing: 0.15,
      color: colors.textSecondary,
    },
    // Durations and timers.
    mono: {
      ...font('mono'),
      fontSize: 13,
      lineHeight: 16,
      color: colors.textSecondary,
      fontVariant: tabular,
    },
  }) as const;

export type Typography = ReturnType<typeof createTypography>;
