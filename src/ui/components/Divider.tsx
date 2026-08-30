import { useMemo } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import type { ThemeColors } from '../tokens/colors';

type DividerProps = {
  style?: ViewStyle;
};

export const Divider = ({ style }: DividerProps) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return <View style={[styles.divider, style]} />;
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    divider: {
      height: 1,
      backgroundColor: colors.border,
      width: '100%',
    },
  });
