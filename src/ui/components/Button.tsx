import { useMemo } from 'react';
import { StyleSheet, Text, type TextStyle, type ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { getContrastText, type ThemeColors } from '../tokens/colors';
import { radius } from '../tokens/radius';
import { PressableScale } from './PressableScale';

/**
 * Mirrors the SwiftUI button roles:
 * - `primary`   filled / `.borderedProminent`
 * - `secondary` tinted  / `.bordered` with a tint
 * - `ghost`     grey    / `.bordered`
 * - `plain`     text-only / `.plain` -- nav-bar and toolbar actions
 * - `success` / `warning` are filled buttons in a semantic colour.
 */
export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'plain'
  | 'success'
  | 'warning';

type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
};

const getVariantStyles = (variant: ButtonVariant, colors: ThemeColors) => {
  switch (variant) {
    case 'secondary':
      return {
        button: { backgroundColor: colors.accentMuted },
        text: { color: colors.accent },
      };
    case 'ghost':
      return {
        button: { backgroundColor: colors.fill },
        text: { color: colors.textPrimary },
      };
    case 'plain':
      return {
        button: { backgroundColor: 'transparent' },
        text: { color: colors.accent },
      };
    case 'success':
      return {
        button: { backgroundColor: colors.success },
        text: { color: getContrastText(colors.success) },
      };
    case 'warning':
      return {
        button: { backgroundColor: colors.warning },
        text: { color: getContrastText(colors.warning) },
      };
    case 'primary':
    default:
      return {
        button: { backgroundColor: colors.accent },
        // Derived rather than fixed: the accent is user-selectable, and a
        // bright tint (amber, teal) needs dark text where a saturated one
        // (blue, purple) needs white.
        text: { color: getContrastText(colors.accent) },
      };
  }
};

export const Button = ({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
  textStyle,
}: ButtonProps) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(), []);
  const variantStyles = getVariantStyles(variant, colors);
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      style={[styles.base, variantStyles.button, disabled ? styles.disabled : null, style]}
    >
      <Text style={[styles.text, variantStyles.text, textStyle]} numberOfLines={1}>
        {label}
      </Text>
    </PressableScale>
  );
};

const createStyles = () =>
  StyleSheet.create({
    base: {
      minHeight: 46,
      borderRadius: radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 18,
      paddingVertical: 10,
    },
    text: {
      fontSize: 16,
      fontWeight: '600',
      letterSpacing: -0.3,
    },
    disabled: {
      opacity: 0.4,
    },
  });
