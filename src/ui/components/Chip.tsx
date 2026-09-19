import { useMemo } from 'react';
import { StyleSheet, Text, type ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { getContrastText, type ThemeColors } from '../tokens/colors';
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
      scaleTo={0.95}
      style={[styles.base, selected ? styles.selected : null, style]}
    >
      <Text style={[styles.text, selected ? styles.textSelected : null]} numberOfLines={1}>
        {label}
      </Text>
    </PressableScale>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    // Capsule filter, the shape iOS reserves for "pick one of these".
    base: {
      minHeight: 34,
      paddingHorizontal: 14,
      borderRadius: radius.pill,
      backgroundColor: colors.fill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    selected: {
      backgroundColor: colors.accent,
    },
    text: {
      color: colors.textSecondary,
      fontSize: 14,
      fontWeight: '600',
      letterSpacing: -0.2,
    },
    textSelected: {
      color: getContrastText(colors.accent),
    },
  });
