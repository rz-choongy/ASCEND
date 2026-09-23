import { useMemo, type ReactNode } from 'react';
import { StyleSheet, Text, View, type TextStyle, type ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { getContrastText, type ThemeColors } from '../tokens/colors';
import { font } from '../tokens/fonts';
import { radius } from '../tokens/radius';
import { PressableScale } from './PressableScale';

/**
 * Prism's pill buttons:
 * - `primary`   solid pill in the user's accent -- the CTA
 * - `secondary` bordered pill on the surface ("Add audio")
 * - `ghost`     soft filled pill
 * - `plain`     text-only -- inline and header actions
 * - `success` / `warning` are solid pills in a semantic colour.
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
  /** Leading icon, drawn in the label colour: `(color) => <Icon color={color} />`. */
  icon?: (color: string) => ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
};

const getVariantStyles = (variant: ButtonVariant, colors: ThemeColors) => {
  switch (variant) {
    case 'secondary':
      return {
        button: {
          backgroundColor: colors.surface,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.borderSoft,
        },
        text: { color: colors.textPrimary },
      };
    case 'ghost':
      return {
        button: { backgroundColor: colors.fill },
        text: { color: colors.textPrimary },
      };
    case 'plain':
      return {
        button: { backgroundColor: 'transparent' },
        text: { color: colors.textPrimary },
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
        button: { backgroundColor: colors.action },
        text: { color: colors.onAction },
      };
  }
};

export const Button = ({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  icon,
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
      style={[styles.base, variantStyles.button, style]}
    >
      <View style={styles.inner}>
        {icon ? icon(variantStyles.text.color) : null}
        <Text style={[styles.text, variantStyles.text, textStyle]} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </PressableScale>
  );
};

const createStyles = () =>
  StyleSheet.create({
    base: {
      minHeight: 48,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 20,
      paddingVertical: 10,
    },
    inner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    text: {
      ...font('medium'),
      fontSize: 16,
      letterSpacing: -0.16,
    },
  });
