import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type ViewStyle } from 'react-native';
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

type EditableValue = {
  /** The bare number to edit, e.g. "27.5" -- not the formatted label shown on the stepper. */
  text: string;
  /** Called on every keystroke, so the parent's value always matches what's on screen. */
  onChangeText: (text: string) => void;
  keyboardType?: 'numeric' | 'decimal-pad';
};

type StepperProps = {
  value: string;
  /** Makes the centre value tappable so an exact number can be typed instead of stepped to. */
  editable?: EditableValue;
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
  editable,
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
  const [draft, setDraft] = useState<string | null>(null);
  // Ends the edit, going back to the formatted label. The value itself was already updated as the
  // user typed -- waiting for blur to commit meant tapping Log Set with the keyboard open logged
  // the old number.
  const endEditing = () => setDraft(null);

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
      {draft !== null ? (
        <TextInput
          value={draft}
          onChangeText={(text) => {
            setDraft(text);
            editable?.onChangeText(text);
          }}
          onBlur={endEditing}
          onSubmitEditing={endEditing}
          keyboardType={editable?.keyboardType ?? 'numeric'}
          returnKeyType="done"
          autoFocus
          selectTextOnFocus
          style={[styles.value, compact ? styles.valueCompact : null, styles.valueInput]}
        />
      ) : editable ? (
        <Pressable
          onPress={() => setDraft(editable.text)}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={`Edit value, currently ${value}`}
        >
          <Text style={[styles.value, compact ? styles.valueCompact : null]}>{value}</Text>
        </Pressable>
      ) : (
        <Text style={[styles.value, compact ? styles.valueCompact : null]}>{value}</Text>
      )}
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
    // Same footprint as the label it replaces, with an underline so it reads as editing.
    valueInput: {
      minWidth: 64,
      padding: 0,
      borderBottomWidth: 2,
      borderBottomColor: colors.accent,
    },
  });
