import { Pressable, StyleSheet, Text, type TextStyle, type ViewStyle } from 'react-native';
import { colors } from '../tokens/colors';
import { radius } from '../tokens/radius';

type IconButtonProps = {
  label: string;
  onPress?: () => void;
  size?: number;
  variant?: 'default' | 'primary' | 'ghost';
  style?: ViewStyle;
  textStyle?: TextStyle;
};

export const IconButton = ({
  label,
  onPress,
  size = 44,
  variant = 'default',
  style,
  textStyle,
}: IconButtonProps) => {
  const variantStyle =
    variant === 'primary'
      ? styles.primary
      : variant === 'ghost'
        ? styles.ghost
        : styles.default;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variantStyle,
        { width: size, height: size },
        pressed ? styles.pressed : null,
        style,
      ]}
    >
      <Text style={[styles.label, textStyle]}>{label}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  default: {},
  primary: {
    borderColor: colors.accent,
    backgroundColor: colors.accent,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  label: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.85,
  },
});
