import { useMemo } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import type { ThemeColors } from '../tokens/colors';

type DividerProps = {
  /** Left inset, matching a grouped list's separator alignment under its content. */
  inset?: number;
  style?: ViewStyle;
};

export const Divider = ({ inset = 0, style }: DividerProps) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return <View style={[styles.divider, inset ? { marginLeft: inset } : null, style]} />;
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.separator,
      width: '100%',
    },
  });
