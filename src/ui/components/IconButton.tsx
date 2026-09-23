import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import type { ThemeColors } from '../tokens/colors';
import type { Shadows } from '../tokens/shadow';
import { PressableScale } from './PressableScale';

type HitSlop = number | { top?: number; bottom?: number; left?: number; right?: number };

/**
 * Prism's 38px circle. `bordered` sits on the surface with a hairline and a
 * faint shadow (header actions, gym row edit); `bare` is unframed, for spots
 * where the surrounding surface already reads as a header. `active` fills it
 * with the accent -- Prism's "this panel is open" state -- so pass icons
 * `useTheme().colors.onAction` while active.
 */
type IconButtonVariant = 'bordered' | 'bare';

type IconButtonProps = {
  children: ReactNode;
  onPress?: () => void;
  variant?: IconButtonVariant;
  size?: number;
  disabled?: boolean;
  active?: boolean;
  accessibilityLabel?: string;
  hitSlop?: HitSlop;
  style?: StyleProp<ViewStyle>;
};

export const IconButton = ({
  children,
  onPress,
  variant = 'bordered',
  size = 38,
  disabled,
  active = false,
  accessibilityLabel,
  hitSlop = 8,
  style,
}: IconButtonProps) => {
  const { colors, shadows } = useTheme();
  const styles = useMemo(() => createStyles(colors, shadows), [colors, shadows]);
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      scaleTo={0.94}
      accessibilityLabel={accessibilityLabel}
      hitSlop={hitSlop}
      style={[
        styles.base,
        { width: size, height: size, borderRadius: size / 2 },
        variant === 'bordered' ? styles.bordered : null,
        active ? styles.active : null,
        style,
      ]}
    >
      {children}
    </PressableScale>
  );
};

const createStyles = (colors: ThemeColors, shadows: Shadows) =>
  StyleSheet.create({
    base: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    bordered: {
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSoft,
      ...shadows.sm,
    },
    active: {
      backgroundColor: colors.action,
      borderColor: colors.action,
    },
  });
