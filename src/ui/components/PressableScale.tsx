import type { ReactNode } from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

type HitSlop = number | { top?: number; bottom?: number; left?: number; right?: number };

type PressableScaleProps = {
  onPress?: () => void;
  disabled?: boolean;
  scaleTo?: number;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  hitSlop?: HitSlop;
};

// Prism's press: a fast spring that lands without overshoot (its
// cubic-bezier(0.16,1,0.3,1) ease), with a light dim for the pressed state.
const SPRING_CONFIG = { damping: 26, stiffness: 520, mass: 0.6 };
const PRESSED_OPACITY = 0.85;
const DISABLED_OPACITY = 0.4;

export const PressableScale = ({
  onPress,
  disabled,
  scaleTo = 0.97,
  children,
  style,
  accessibilityLabel,
  hitSlop,
}: PressableScaleProps) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  // The animated opacity wins over any opacity in `style`, so the disabled dim
  // has to be applied here or disabled buttons look tappable.
  const restingOpacity = disabled ? DISABLED_OPACITY : 1;
  const animatedStyle = useAnimatedStyle(
    () => ({
      transform: [{ scale: scale.value }],
      opacity: opacity.value * restingOpacity,
    }),
    [restingOpacity]
  );

  return (
    <Animated.View style={[styles.base, style, animatedStyle]}>
      {children}
      <Pressable
        onPress={onPress}
        disabled={disabled}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        hitSlop={hitSlop}
        onPressIn={() => {
          scale.value = withSpring(scaleTo, SPRING_CONFIG);
          opacity.value = withTiming(PRESSED_OPACITY, { duration: 80 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, SPRING_CONFIG);
          opacity.value = withTiming(1, { duration: 140 });
        }}
        style={StyleSheet.absoluteFillObject}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
