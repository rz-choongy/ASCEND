import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import type { ThemeColors } from '../tokens/colors';
import { radius } from '../tokens/radius';
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
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.segmented}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <PressableScale
            key={option.value}
            onPress={() => onChange(option.value)}
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

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    segmented: {
      flexDirection: 'row',
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      padding: 3,
      gap: 2,
    },
    segment: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: radius.md - 3,
    },
    segmentActive: {
      backgroundColor: colors.accent,
    },
    segmentText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    segmentTextActive: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.textInverse,
    },
  });
