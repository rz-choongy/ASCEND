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
    base: {
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    surface: {},
    raised: {
      backgroundColor: colors.surfaceAlt,
      shadowColor: '#050806',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.18,
      shadowRadius: 18,
      elevation: 2,
    },
    accentBar: {
      position: 'absolute',
      left: 1,
      top: 1,
      bottom: 1,
      width: 4,
      borderTopLeftRadius: radius.lg - 1,
      borderBottomLeftRadius: radius.lg - 1,
    },
  });
