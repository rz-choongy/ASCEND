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
  /** Smaller, intrinsic-width, unlifted variant for a secondary/sub-filter control. */
  compact?: boolean;
};

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  compact = false,
}: SegmentedControlProps<T>) {
  const { colors, shadows } = useTheme();
  const styles = useMemo(() => createStyles(colors, shadows), [colors, shadows]);
  return (
    <View style={[styles.segmented, compact ? styles.segmentedCompact : null]}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <PressableScale
            key={option.value}
            onPress={() => onChange(option.value)}
            scaleTo={0.97}
            style={[
              styles.segment,
              compact ? styles.segmentCompact : null,
              active ? (compact ? styles.segmentActiveCompact : styles.segmentActive) : null,
            ]}
          >
            <Text
              style={[
                active ? styles.segmentTextActive : styles.segmentText,
                compact ? styles.segmentTextCompact : null,
              ]}
            >
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
    // Intrinsic width instead of stretching full-bleed, so a secondary control
    // reads as a sub-filter rather than a peer of the primary tab row above it.
    segmentedCompact: { alignSelf: 'center' },
    segment: {
      flex: 1,
      minHeight: 36,
      paddingHorizontal: spacing.s,
      paddingVertical: 8,
      borderRadius: radius.pill,
    },
    segmentCompact: {
      flex: 0,
      minHeight: 30,
      paddingHorizontal: spacing.s,
      paddingVertical: 5,
    },
    segmentActive: {
      backgroundColor: colors.surfaceRaised,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      ...shadows.sm,
    },
    // No shadow lift -- keeps it visually quieter than the primary control.
    segmentActiveCompact: {
      backgroundColor: colors.surfaceRaised,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
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
    segmentTextCompact: { fontSize: 13 },
  });
