import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import type { ThemeColors } from '../tokens/colors';
import { spacing } from '../tokens/spacing';
import { PressableScale } from './PressableScale';

type SegmentedControlOption<T extends string> = {
  value: T;
  label: string;
};

type SegmentedControlProps<T extends string> = {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
};

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  const { colors, mode } = useTheme();
  const styles = useMemo(() => createStyles(colors, mode === 'dark'), [colors, mode]);
  return (
    <View style={styles.segmented}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <PressableScale
            key={option.value}
            onPress={() => onChange(option.value)}
            scaleTo={0.97}
            style={[styles.segment, active ? styles.segmentActive : null]}
          >
            <Text style={active ? styles.segmentTextActive : styles.segmentText}>
              {option.label}
            </Text>
          </PressableScale>
        );
      })}
    </View>
  );
}

// UISegmentedControl proper: a translucent track with a lifted neutral thumb.
// The thumb is a surface, not the accent -- selection reads from elevation, so
// the accent stays reserved for actions.
const createStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    segmented: {
      flexDirection: 'row',
      backgroundColor: colors.fill,
      borderRadius: 9,
      padding: 2,
      gap: 2,
    },
    segment: {
      flex: 1,
      paddingHorizontal: spacing.s,
      paddingVertical: 7,
      borderRadius: 7,
    },
    segmentActive: {
      backgroundColor: isDark ? colors.surfaceRaised : colors.surface,
      shadowColor: '#000',
      shadowOpacity: isDark ? 0 : 0.12,
      shadowRadius: 3,
      shadowOffset: { width: 0, height: 1 },
      elevation: isDark ? 0 : 2,
    },
    segmentText: {
      fontSize: 13,
      fontWeight: '500',
      letterSpacing: -0.08,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    segmentTextActive: {
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: -0.08,
      color: colors.textPrimary,
      textAlign: 'center',
    },
  });
