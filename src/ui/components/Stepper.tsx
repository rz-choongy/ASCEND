import { useMemo } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeContext';
import type { ThemeColors } from '../tokens/colors';
import { radius } from '../tokens/radius';
import { spacing } from '../tokens/spacing';
import { PressableScale } from './PressableScale';

const withHaptic = (fn: () => void) => () => {
  void Haptics.selectionAsync();
  fn();
};

type StepperProps = {
  value: string;
  onIncrement: () => void;
  onDecrement: () => void;
  onBigIncrement?: () => void;
  onBigDecrement?: () => void;
  bigStepLabel?: string;
  compact?: boolean;
  style?: ViewStyle;
};

export const Stepper = ({
  value,
  onIncrement,
  onDecrement,
  onBigIncrement,
  onBigDecrement,
  bigStepLabel,
  compact = false,
  style,
}: StepperProps) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const buttonStyle = compact ? styles.buttonCompact : styles.button;

  return (
    <View style={[styles.row, style]}>
      {onBigDecrement ? (
        <PressableScale
          onPress={withHaptic(onBigDecrement)}
          scaleTo={0.88}
          style={[buttonStyle, styles.bigButton]}
          hitSlop={4}
        >
          <Text style={styles.bigText}>-{bigStepLabel}</Text>
        </PressableScale>
      ) : null}
      <PressableScale onPress={withHaptic(onDecrement)} scaleTo={0.88} style={buttonStyle} hitSlop={6}>
        <Text style={styles.symbolText}>-</Text>
      </PressableScale>
      <Text style={[styles.value, compact ? styles.valueCompact : null]}>{value}</Text>
      <PressableScale onPress={withHaptic(onIncrement)} scaleTo={0.88} style={buttonStyle} hitSlop={6}>
        <Text style={styles.symbolText}>+</Text>
      </PressableScale>
      {onBigIncrement ? (
        <PressableScale
          onPress={withHaptic(onBigIncrement)}
          scaleTo={0.88}
          style={[buttonStyle, styles.bigButton]}
          hitSlop={4}
        >
          <Text style={styles.bigText}>+{bigStepLabel}</Text>
        </PressableScale>
      ) : null}
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    // UIStepper's two halves: filled, borderless, softly rounded.
    button: {
      width: 48,
      height: 48,
      borderRadius: radius.md,
      backgroundColor: colors.fill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonCompact: {
      width: 38,
      height: 44,
      borderRadius: radius.sm,
      backgroundColor: colors.fill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bigButton: {
      width: 40,
    },
    symbolText: {
      color: colors.textPrimary,
      fontSize: 24,
      fontWeight: '500',
      lineHeight: 28,
    },
    bigText: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: -0.1,
    },
    value: {
      color: colors.textPrimary,
      fontSize: 20,
      fontWeight: '600',
      letterSpacing: -0.4,
      fontVariant: ['tabular-nums'],
      minWidth: 76,
      textAlign: 'center',
    },
    valueCompact: {
      minWidth: 32,
    },
  });
