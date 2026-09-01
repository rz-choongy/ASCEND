import { useMemo } from 'react';
import { StyleSheet, Text, type TextStyle, type ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import type { ThemeColors } from '../tokens/colors';
import { radius } from '../tokens/radius';
import type { Typography } from '../tokens/typography';
import { PressableScale } from './PressableScale';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'success' | 'warning';

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
        button: {
          backgroundColor: colors.surfaceRaised,
          borderColor: colors.borderSoft,
        },
        text: {
          color: colors.textPrimary,
        },
      };
    case 'ghost':
      return {
        button: {
          backgroundColor: 'transparent',
          borderColor: colors.borderSoft,
        },
        text: {
          color: colors.textSecondary,
        },
      };
    case 'success':
      return {
        button: {
          backgroundColor: colors.success,
          borderColor: colors.success,
        },
        text: {
          color: colors.textInverse,
        },
      };
    case 'warning':
      return {
        button: {
          backgroundColor: colors.warning,
          borderColor: colors.warning,
        },
        text: {
          color: colors.textInverse,
        },
      };
    case 'primary':
    default:
      return {
        button: {
          backgroundColor: colors.accent,
          borderColor: colors.accent,
          shadowColor: colors.accent,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.35,
          shadowRadius: 14,
          elevation: 4,
        },
        text: {
          color: colors.textInverse,
        },
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
  const { colors, typography } = useTheme();
  const styles = useMemo(() => createStyles(typography), [typography]);
  const variantStyles = getVariantStyles(variant, colors);
  const loudLabel =
    variant === 'primary' || variant === 'success' || variant === 'warning';
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      style={[styles.base, variantStyles.button, disabled ? styles.disabled : null, style]}
    >
      <Text
        style={[
          styles.text,
          loudLabel ? styles.loudText : styles.quietText,
          variantStyles.text,
          textStyle,
        ]}
      >
        {label}
      </Text>
    </PressableScale>
  );
};

const createStyles = (typography: Typography) =>
  StyleSheet.create({
    base: {
      minHeight: 52,
      borderRadius: radius.lg,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    text: {
      ...typography.body,
      fontWeight: '700',
    },
    loudText: {
      textTransform: 'uppercase',
      letterSpacing: 1.1,
    },
    quietText: {
      letterSpacing: 0.2,
    },
    disabled: {
      opacity: 0.5,
    },
  });
