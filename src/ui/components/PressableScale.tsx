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

// Gentle and quick, the way UIKit's own controls respond: a slight settle
// rather than a bounce, paired with the dim iOS uses for highlight state.
const SPRING_CONFIG = { damping: 18, stiffness: 420, mass: 0.6 };
const PRESSED_OPACITY = 0.72;

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
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

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
