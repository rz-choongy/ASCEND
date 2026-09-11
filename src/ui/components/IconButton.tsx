import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import type { ThemeColors } from '../tokens/colors';
import { radius } from '../tokens/radius';
import { PressableScale } from './PressableScale';

type HitSlop = number | { top?: number; bottom?: number; left?: number; right?: number };

/**
 * `bordered` is the framed control (Log's settings/theme buttons, gym row edit);
 * `bare` is the unframed one used where the surrounding surface already reads as
 * a header (session close, Settings back, Progress month arrows).
 */
type IconButtonVariant = 'bordered' | 'bare';

type IconButtonProps = {
  children: ReactNode;
  onPress?: () => void;
  variant?: IconButtonVariant;
  size?: number;
  disabled?: boolean;
  accessibilityLabel?: string;
  hitSlop?: HitSlop;
  style?: StyleProp<ViewStyle>;
};

export const IconButton = ({
  children,
  onPress,
  variant = 'bordered',
  size = 32,
  disabled,
  accessibilityLabel,
  hitSlop = 6,
  style,
}: IconButtonProps) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      scaleTo={0.88}
      accessibilityLabel={accessibilityLabel}
      hitSlop={hitSlop}
      style={[
        styles.base,
        { width: size, height: size },
        variant === 'bordered' ? styles.bordered : null,
        style,
      ]}
    >
      {children}
    </PressableScale>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    base: {
      borderRadius: radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bordered: {
      borderWidth: 1,
      borderColor: colors.borderSoft,
      backgroundColor: colors.surfaceRaised,
    },
  });
