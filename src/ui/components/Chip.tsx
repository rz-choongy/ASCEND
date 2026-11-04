import { useMemo } from 'react';
import { StyleSheet, Text, type ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import type { ThemeColors } from '../tokens/colors';
import { font } from '../tokens/fonts';
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
      // 36pt tall; the slop takes the tap area to 44 without making the pill bigger.
      hitSlop={4}
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
    // Bordered pill on the surface; selected fills with ink, like the
    // segmented control, so the accent stays for the one main action.
    base: {
      minHeight: 36,
      paddingHorizontal: 14,
      borderRadius: radius.pill,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    selected: {
      backgroundColor: colors.textPrimary,
      borderColor: colors.textPrimary,
    },
    text: {
      ...font('semibold'),
      color: colors.textSecondary,
      fontSize: 14,
    },
    textSelected: {
      color: colors.background,
    },
  });
