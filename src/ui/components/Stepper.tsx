import { useMemo } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import type { ThemeColors } from '../tokens/colors';
import { radius } from '../tokens/radius';
import { spacing } from '../tokens/spacing';
import { PressableScale } from './PressableScale';

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
        <PressableScale onPress={onBigDecrement} scaleTo={0.88} style={[buttonStyle, styles.bigButton]}>
          <Text style={styles.bigText}>-{bigStepLabel}</Text>
        </PressableScale>
      ) : null}
      <PressableScale onPress={onDecrement} scaleTo={0.88} style={buttonStyle}>
        <Text style={styles.symbolText}>-</Text>
      </PressableScale>
      <Text style={[styles.value, compact ? styles.valueCompact : null]}>{value}</Text>
      <PressableScale onPress={onIncrement} scaleTo={0.88} style={buttonStyle}>
        <Text style={styles.symbolText}>+</Text>
      </PressableScale>
      {onBigIncrement ? (
        <PressableScale onPress={onBigIncrement} scaleTo={0.88} style={[buttonStyle, styles.bigButton]}>
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
    button: {
      width: 48,
      height: 48,
      borderRadius: radius.sm,
      backgroundColor: colors.surfaceRaised,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonCompact: {
      width: 36,
      height: 44,
      borderRadius: radius.sm,
      backgroundColor: colors.surfaceRaised,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bigButton: {
      width: 40,
    },
    symbolText: {
      color: colors.textPrimary,
      fontSize: 22,
      fontWeight: '800',
      lineHeight: 26,
    },
    bigText: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '800',
    },
    value: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: '900',
      minWidth: 76,
      textAlign: 'center',
    },
    valueCompact: {
      minWidth: 32,
    },
  });
