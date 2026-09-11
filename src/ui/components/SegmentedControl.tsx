import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import type { ThemeColors } from '../tokens/colors';
import { radius } from '../tokens/radius';
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
    // Pill, not sharp: the system reserves radius.pill for switchable selectors
    // (Chip, Settings' theme toggle, this) so shape alone signals "pick one of these".
    segmented: {
      flexDirection: 'row',
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.pill,
      padding: 3,
      gap: 2,
    },
    segment: {
      paddingHorizontal: spacing.s,
      paddingVertical: 6,
      borderRadius: radius.pill,
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
