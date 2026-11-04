import type { TextStyle } from 'react-native';
import type { ThemeColors } from './colors';
import { font } from './fonts';

// Google Sans Flex throughout: semibold for screen titles and big figures,
// regular/medium for everything else. Sentence case everywhere -- no uppercase labels.
// Nothing smaller than 13 except chart axes. Weight comes from the family (see
// fonts.ts) -- don't add `fontWeight`.
const tabular = ['tabular-nums'] as TextStyle['fontVariant'];

export const createTypography = (colors: ThemeColors) =>
  ({
    // Screen titles: "Today", "Progress".
    display: {
      ...font('display'),
      fontSize: 30,
      lineHeight: 36,
      letterSpacing: -0.6,
      color: colors.textPrimary,
    },
    // Sheet and section headings.
    title: {
      ...font('bold'),
      fontSize: 18,
      color: colors.textPrimary,
      letterSpacing: -0.2,
    },
    // Big figures in stat rows: sends, grades, percentages.
    numeric: {
      ...font('display'),
      fontSize: 28,
      lineHeight: 34,
      letterSpacing: -0.4,
      color: colors.textPrimary,
      fontVariant: tabular,
    },
    // Card labels: "Grade pyramid", "Last climb". Sentence case.
    section: {
      ...font('bold'),
      fontSize: 14,
      color: colors.textPrimary,
    },
    // Row titles and content.
    body: {
      ...font('medium'),
      fontSize: 16,
      color: colors.textPrimary,
    },
    // Supporting copy under a body line.
    bodyMuted: {
      ...font('regular'),
      fontSize: 14,
      color: colors.textSecondary,
    },
    // Timestamps, units, counts, stat labels.
    meta: {
      ...font('medium'),
      fontSize: 13,
      color: colors.textSecondary,
    },
    // Durations and timers.
    mono: {
      ...font('mono'),
      fontSize: 14,
      color: colors.textSecondary,
      fontVariant: tabular,
    },
  }) as const;

export type Typography = ReturnType<typeof createTypography>;
