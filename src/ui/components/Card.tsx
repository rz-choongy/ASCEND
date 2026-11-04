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
  /**
   * Built-in padding. `compact` for stats, lists and rows (12px, 16 radius);
   * `graph` for a chart's card, which gets more room (16px, 20 radius).
   */
  padded?: 'compact' | 'graph';
  style?: ViewStyle;
};

export const Card = ({ children, tone = 'surface', accentColor, padded, style }: CardProps) => {
  const { colors, shadows } = useTheme();
  const styles = useMemo(() => createStyles(colors, shadows), [colors, shadows]);
  return (
    <View
      style={[
        styles.base,
        tone === 'raised' ? styles.raised : styles.surface,
        padded === 'compact' ? styles.compact : padded === 'graph' ? styles.graph : null,
        style,
      ]}
    >
      {accentColor ? <View style={[styles.accentBar, { backgroundColor: accentColor }]} /> : null}
      {children}
    </View>
  );
};

const createStyles = (colors: ThemeColors, shadows: Shadows) =>
  StyleSheet.create({
    // White (or one step off black) on the ground, 16px radius, no border: cards
    // separate by tone. No `overflow: 'hidden'` -- it would clip the shadow on
    // iOS; children that need clipping round their own corners.
    base: {
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
    },
    compact: {
      paddingHorizontal: 12,
      paddingVertical: 12,
    },
    graph: {
      borderRadius: radius.xl,
      padding: 16,
    },
    surface: {
      ...shadows.card,
    },
    // Inset panel inside a card or sheet: flat, one step off the surface.
    raised: {
      backgroundColor: colors.surfaceAlt,
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
