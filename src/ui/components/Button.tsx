import { Pressable, StyleSheet, Text, type TextStyle, type ViewStyle } from 'react-native';
import { colors } from '../tokens/colors';
import { radius } from '../tokens/radius';
import { typography } from '../tokens/typography';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'success' | 'warning';

type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
};

const getVariantStyles = (variant: ButtonVariant) => {
  switch (variant) {
    case 'secondary':
      return {
        button: {
          backgroundColor: colors.surface,
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
  const variantStyles = getVariantStyles(variant);
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        variantStyles.button,
        pressed ? styles.pressed : null,
        disabled ? styles.disabled : null,
        style,
      ]}
    >
      <Text style={[styles.text, variantStyles.text, textStyle]}>{label}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  text: {
    ...typography.body,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  pressed: {
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.5,
  },
});
