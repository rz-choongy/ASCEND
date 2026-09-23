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
    // Prism pill: hairline-bordered on the surface; selected fills with the
    // accent, the same as the primary button.
    base: {
      minHeight: 36,
      paddingHorizontal: 14,
      borderRadius: radius.pill,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    selected: {
      backgroundColor: colors.action,
      borderColor: colors.action,
    },
    text: {
      ...font('medium'),
      color: colors.textSecondary,
      fontSize: 14,
      letterSpacing: -0.1,
    },
    textSelected: {
      color: colors.onAction,
    },
  });
