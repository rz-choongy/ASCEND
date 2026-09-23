import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import type { ThemeColors } from '../tokens/colors';
import { font } from '../tokens/fonts';
import { radius } from '../tokens/radius';
import type { Shadows } from '../tokens/shadow';
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
  const { colors, shadows } = useTheme();
  const styles = useMemo(() => createStyles(colors, shadows), [colors, shadows]);
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

// Prism's pill track with a lifted surface thumb. The thumb is a surface, not
// the accent -- selection reads from elevation, so colour stays for highlights.
const createStyles = (colors: ThemeColors, shadows: Shadows) =>
  StyleSheet.create({
    segmented: {
      flexDirection: 'row',
      backgroundColor: colors.fill,
      borderRadius: radius.pill,
      padding: 3,
      gap: 2,
    },
    segment: {
      flex: 1,
      minHeight: 36,
      paddingHorizontal: spacing.s,
      paddingVertical: 8,
      borderRadius: radius.pill,
    },
    segmentActive: {
      backgroundColor: colors.surfaceRaised,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      ...shadows.sm,
    },
    segmentText: {
      ...font('medium'),
      fontSize: 14,
      letterSpacing: -0.1,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    segmentTextActive: {
      ...font('semibold'),
      fontSize: 14,
      letterSpacing: -0.1,
      color: colors.textPrimary,
      textAlign: 'center',
    },
  });
