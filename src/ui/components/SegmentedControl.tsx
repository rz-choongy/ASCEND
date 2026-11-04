import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import type { ThemeColors } from '../tokens/colors';
import { font } from '../tokens/fonts';
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
  /** Smaller, intrinsic-width, unlifted variant for a secondary/sub-filter control. */
  compact?: boolean;
};

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  compact = false,
}: SegmentedControlProps<T>) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
              numberOfLines={1}
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

// Pill track with a solid ink thumb, as in the brand guide. Ink, not the
// accent, so the accent stays for the screen's one main action.
const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    segmented: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: radius.pill,
      padding: 3,
      gap: 2,
    },
    // Intrinsic width instead of stretching full-bleed, so a secondary control
    // reads as a sub-filter rather than a peer of the primary tab row above it.
    segmentedCompact: { alignSelf: 'center' },
    // Grow to share a full-width track, but never shrink below the label --
    // flex: 1 has a zero basis, which truncates labels in a fit-content track.
    segment: {
      flexGrow: 1,
      flexShrink: 0,
      flexBasis: 'auto',
      minHeight: 36,
      paddingHorizontal: spacing.s,
      paddingVertical: 8,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    segmentCompact: {
      flexGrow: 0,
      minHeight: 30,
      paddingHorizontal: 14,
      paddingVertical: 5,
    },
    segmentActive: {
      backgroundColor: colors.textPrimary,
    },
    // No shadow lift -- keeps it visually quieter than the primary control.
    segmentActiveCompact: {
      backgroundColor: colors.textPrimary,
    },
    segmentText: {
      ...font('semibold'),
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    segmentTextActive: {
      ...font('bold'),
      fontSize: 14,
      color: colors.background,
      textAlign: 'center',
    },
    segmentTextCompact: { fontSize: 13 },
  });
