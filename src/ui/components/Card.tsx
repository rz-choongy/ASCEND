import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { colors } from '../tokens/colors';
import { radius } from '../tokens/radius';
import { shadows } from '../tokens/shadows';

type CardTone = 'surface' | 'raised';

type CardProps = {
  children: ReactNode;
  tone?: CardTone;
  style?: ViewStyle;
};

export const Card = ({ children, tone = 'surface', style }: CardProps) => {
  return (
    <View style={[styles.base, tone === 'raised' ? styles.raised : styles.surface, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  surface: {},
  raised: {
    backgroundColor: colors.surfaceAlt,
    ...shadows.soft,
  },
});
