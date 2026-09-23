import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import type { ThemeColors } from '../tokens/colors';
import { radius } from '../tokens/radius';
import type { Shadows } from '../tokens/shadow';

type CardTone = 'surface' | 'raised';

type CardProps = {
  children: ReactNode;
  tone?: CardTone;
  accentColor?: string;
  style?: ViewStyle;
};

export const Card = ({ children, tone = 'surface', accentColor, style }: CardProps) => {
  const { colors, shadows } = useTheme();
  const styles = useMemo(() => createStyles(colors, shadows), [colors, shadows]);
  return (
    <View style={[styles.base, tone === 'raised' ? styles.raised : styles.surface, style]}>
      {accentColor ? <View style={[styles.accentBar, { backgroundColor: accentColor }]} /> : null}
      {children}
    </View>
  );
};

const createStyles = (colors: ThemeColors, shadows: Shadows) =>
  StyleSheet.create({
    // Prism's card: white on the soft-grey ground, 16px radius, a hairline edge
    // and a soft drop shadow. No `overflow: 'hidden'` -- it would clip the
    // shadow on iOS; children that need clipping round their own corners.
    base: {
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    surface: {
      ...shadows.card,
    },
    // Inset panel inside a card or sheet: flat, one step off the surface.
    raised: {
      backgroundColor: colors.surfaceAlt,
      borderColor: colors.border,
    },
    // Inset indicator rather than a full-height edge: the card doesn't clip
    // (that would clip its shadow), so a flush bar would poke past the corners.
    accentBar: {
      position: 'absolute',
      left: 0,
      top: 14,
      bottom: 14,
      width: 3,
      borderTopRightRadius: 3,
      borderBottomRightRadius: 3,
    },
  });
