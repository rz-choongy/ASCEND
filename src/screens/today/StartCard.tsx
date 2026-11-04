import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { SessionType } from '../../domain/types';
import { Button, SegmentedControl, font, spacing, useTheme } from '../../ui';
import type { ThemeColors } from '../../ui/tokens/colors';
import type { Typography } from '../../ui/tokens/typography';

type Props = {
  mode: SessionType;
  onModeChange: (mode: SessionType) => void;
  /** The selected gym's name, or null when only the built-in default grade scale is set. */
  gymName: string | null;
  /** What the strength context line says the first exercise starts from. */
  strengthStartsFrom: string;
  onChangeGym: () => void;
  /** The routine the next strength session starts from, or null to start from last time. */
  routineName: string | null;
  onChangeRoutine: () => void;
  onStart: () => void;
};

const MODE_OPTIONS: { value: SessionType; label: string }[] = [
  { value: 'climb', label: 'Climbing' },
  { value: 'strength', label: 'Strength' },
];

/**
 * A segmented switch for the session type, one context line for the chosen one
 * (gym for climbing, routine for strength), and a single Start button.
 */
export const StartCard = ({
  mode,
  onModeChange,
  gymName,
  strengthStartsFrom,
  onChangeGym,
  routineName,
  onChangeRoutine,
  onStart,
}: Props) => {
  const { colors, typography } = useTheme();
  const styles = useMemo(() => createStyles(colors, typography), [colors, typography]);
  const climb = mode === 'climb';

  const contextText = climb ? gymName ?? 'No gym picked' : routineName ?? strengthStartsFrom;
  const linkText = climb ? (gymName ? 'Change gym' : 'Pick gym') : routineName ? 'Change routine' : 'Pick routine';
  const onLink = climb ? onChangeGym : onChangeRoutine;
  const a11y = climb
    ? `Gym: ${gymName ?? 'none'}. ${linkText}`
    : `Routine: ${routineName ?? 'none, starts from last time'}. ${linkText}`;

  return (
    <View style={styles.block}>
      <SegmentedControl options={MODE_OPTIONS} value={mode} onChange={onModeChange} />

      <Pressable onPress={onLink} hitSlop={6} style={styles.context} accessibilityRole="button" accessibilityLabel={a11y}>
        <View style={styles.dot} />
        <Text style={styles.contextValue} numberOfLines={1}>
          {contextText}
        </Text>
        <Text style={styles.link}>{linkText}</Text>
      </Pressable>

      <Button label={climb ? 'Start climbing' : 'Start strength'} onPress={onStart} />
    </View>
  );
};

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
    block: {
      gap: spacing.xs,
    },
    context: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      minHeight: 40,
      paddingHorizontal: spacing.xxs,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.accent,
    },
    contextValue: {
      ...font('semibold'),
      flex: 1,
      fontSize: 15,
      color: colors.textPrimary,
    },
    link: {
      ...typography.meta,
      ...font('semibold'),
      textDecorationLine: 'underline',
    },
  });
