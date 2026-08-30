import { useMemo } from 'react';
import { StyleSheet, Text, type ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import type { ThemeColors } from '../tokens/colors';
import { radius } from '../tokens/radius';
import { PressableScale } from './PressableScale';

type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
};

export const Chip = ({ label, selected = false, onPress, style }: ChipProps) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.94}
      style={[styles.base, selected ? styles.selected : null, style]}
    >
      <Text style={[styles.text, selected ? styles.textSelected : null]}>{label}</Text>
    </PressableScale>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    base: {
      minHeight: 42,
      paddingHorizontal: 15,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    selected: {
      borderColor: colors.accent,
      backgroundColor: colors.accentSoft,
    },
    text: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    textSelected: {
      color: colors.textPrimary,
    },
  });
