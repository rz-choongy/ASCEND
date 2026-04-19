import { colors } from './colors';

export const typography = {
  title: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    letterSpacing: 0.3,
  },
  section: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: colors.textMuted,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
  },
  body: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.textPrimary,
  },
  bodyMuted: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
  meta: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
  },
} as const;
