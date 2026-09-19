import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import type { ThemeColors } from '../tokens/colors';
import { radius } from '../tokens/radius';

type CardTone = 'surface' | 'raised';

type CardProps = {
  children: ReactNode;
  tone?: CardTone;
  accentColor?: string;
  style?: ViewStyle;
};

export const Card = ({ children, tone = 'surface', accentColor, style }: CardProps) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={[styles.base, tone === 'raised' ? styles.raised : styles.surface, style]}>
      {accentColor ? <View style={[styles.accentBar, { backgroundColor: accentColor }]} /> : null}
      {children}
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    // The iOS inset-grouped card: a rounded panel that reads as a layer above the
    // ground, with a hairline that only barely resolves -- the surface tone does
    // the separating, the line just keeps the edge crisp.
    base: {
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      overflow: 'hidden',
    },
    surface: {},
    raised: {
      backgroundColor: colors.surfaceAlt,
      borderColor: colors.borderSoft,
    },
    accentBar: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 4,
    },
  });
