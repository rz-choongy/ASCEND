import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

type HighPulseProps = {
  /** The grade's tape colour. */
  color: string;
};

const PEAK_OPACITY = 0.32;

/**
 * One soft wash of a grade's tape colour behind a row (about 400ms), for the climb that just
 * set a new 30-day high. Runs once on mount. Nothing at all with reduced motion on.
 */
export const HighPulse = ({ color }: HighPulseProps) => {
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    opacity.value = withSequence(
      withTiming(PEAK_OPACITY, { duration: 120 }),
      withTiming(0, { duration: 280 })
    );
  }, [opacity, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  if (reduceMotion) return null;
  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { backgroundColor: color }, animatedStyle]}
    />
  );
};
