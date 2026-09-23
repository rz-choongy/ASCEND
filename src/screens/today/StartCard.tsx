import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { SessionType } from '../../domain/types';
import {
  Button,
  Card,
  ChevronRightIcon,
  DumbbellIcon,
  MountainMarkIcon,
  PressableScale,
  font,
  radius,
  spacing,
  useTheme,
} from '../../ui';
import type { ThemeColors } from '../../ui/tokens/colors';
import type { Typography } from '../../ui/tokens/typography';

type Props = {
  mode: SessionType;
  onModeChange: (mode: SessionType) => void;
  gymName: string;
  /** Sub-line on the Strength tile, e.g. "Last: Pull day". */
  strengthHint: string;
  /** What the strength context row says the first exercise starts from. */
  strengthStartsFrom: string;
  onChangeGym: () => void;
  onStart: () => void;
};

/**
 * The two session types as big tiles that double as the switch, a context
 * row for the chosen one (gym for climbing), and a single Start button.
 */
export const StartCard = ({
  mode,
  onModeChange,
  gymName,
  strengthHint,
  strengthStartsFrom,
  onChangeGym,
  onStart,
}: Props) => {
  const { colors, typography } = useTheme();
  const styles = useMemo(() => createStyles(colors, typography), [colors, typography]);
  const climb = mode === 'climb';

  const tile = (type: SessionType, title: string, sub: string) => {
    const selected = mode === type;
    const fg = selected ? colors.onAction : colors.textPrimary;
    return (
      <PressableScale
        onPress={() => onModeChange(type)}
        scaleTo={0.97}
        accessibilityLabel={`${title}${selected ? ', selected' : ''}`}
        style={[styles.tile, selected ? styles.tileSelected : null]}
      >
        {type === 'climb' ? <MountainMarkIcon size={22} color={fg} /> : <DumbbellIcon size={22} color={fg} />}
        <View style={styles.tileText}>
          <Text style={[styles.tileTitle, { color: fg }]}>{title}</Text>
          <Text style={[styles.tileSub, { color: fg }]} numberOfLines={1}>
            {sub}
          </Text>
        </View>
      </PressableScale>
    );
  };

  return (
    <Card style={styles.card}>
      <View style={styles.tiles}>
        {tile('climb', 'Climb', gymName)}
        {tile('strength', 'Strength', strengthHint)}
      </View>

      {climb ? (
        <PressableScale onPress={onChangeGym} scaleTo={0.98} style={styles.context} accessibilityLabel={`Gym: ${gymName}. Change`}>
          <View style={styles.contextText}>
            <Text style={styles.contextLabel}>Gym</Text>
            <Text style={styles.contextValue} numberOfLines={1}>
              {gymName}
            </Text>
          </View>
          <ChevronRightIcon size={16} color={colors.textMuted} />
        </PressableScale>
      ) : (
        <View style={styles.context}>
          <View style={styles.contextText}>
            <Text style={styles.contextLabel}>Starts from last time</Text>
            <Text style={styles.contextValue} numberOfLines={1}>
              {strengthStartsFrom}
            </Text>
          </View>
        </View>
      )}

      <Button label={climb ? 'Start climbing' : 'Start strength'} onPress={onStart} />
    </Card>
  );
};

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
    card: {
      padding: spacing.s,
      gap: spacing.s,
    },
    tiles: {
      flexDirection: 'row',
      gap: spacing.xs,
    },
    // PressableScale centres its children; tiles read top-down instead.
    tile: {
      flex: 1,
      minHeight: 92,
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      padding: spacing.s,
      borderRadius: radius.md + 4,
      backgroundColor: colors.surfaceAlt,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    tileSelected: {
      backgroundColor: colors.action,
      borderColor: colors.action,
    },
    tileText: {
      gap: 1,
      alignSelf: 'stretch',
    },
    tileTitle: {
      ...font('semibold'),
      fontSize: 17,
      letterSpacing: -0.2,
    },
    tileSub: {
      ...font('regular'),
      fontSize: 12,
      opacity: 0.8,
    },
    context: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 48,
      paddingHorizontal: spacing.xxs,
      gap: spacing.xs,
    },
    contextText: {
      flex: 1,
      gap: 1,
    },
    contextLabel: {
      ...typography.section,
    },
    contextValue: {
      ...typography.body,
    },
  });
