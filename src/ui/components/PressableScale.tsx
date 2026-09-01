import type { ReactNode } from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

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

const SPRING_CONFIG = { damping: 14, stiffness: 300 };

export const PressableScale = ({
  onPress,
  disabled,
  scaleTo = 0.96,
  children,
  style,
  accessibilityLabel,
  hitSlop,
}: PressableScaleProps) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.base, style, animatedStyle]}>
      {children}
      <Pressable
        onPress={onPress}
        disabled={disabled}
        accessibilityLabel={accessibilityLabel}
        hitSlop={hitSlop}
        onPressIn={() => {
          scale.value = withSpring(scaleTo, SPRING_CONFIG);
        }}
        onPressOut={() => {
          scale.value = withSpring(1, SPRING_CONFIG);
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
