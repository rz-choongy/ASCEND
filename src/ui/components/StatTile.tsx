import { Children, Fragment, useMemo, type ReactNode } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import type { ThemeColors } from '../tokens/colors';
import { radius } from '../tokens/radius';
import { spacing } from '../tokens/spacing';
import type { Typography } from '../tokens/typography';
import { PressableScale } from './PressableScale';

type StatItem = {
  value: string;
  label: string;
};

type StatRowProps = {
  items: StatItem[];
  style?: ViewStyle;
};

export const StatRow = ({ items, style }: StatRowProps) => {
  const { colors, typography } = useTheme();
  const styles = useMemo(() => createStyles(colors, typography), [colors, typography]);
  return (
    <View style={[styles.strip, style]}>
      {items.map((item, index) => (
        <Fragment key={item.label}>
          {index > 0 ? <View style={styles.divider} /> : null}
          <View style={styles.cell}>
            <Text style={styles.value} numberOfLines={1}>
              {item.value}
            </Text>
            <Text style={styles.label} numberOfLines={1}>
              {item.label}
            </Text>
          </View>
        </Fragment>
      ))}
    </View>
  );
};

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
    strip: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      paddingVertical: spacing.sm,
    },
    cell: {
      flex: 1,
      alignItems: 'center',
      gap: 3,
    },
    value: {
      ...typography.numeric,
      fontSize: 22,
    },
    label: {
      ...typography.meta,
      fontSize: 12,
      color: colors.textSecondary,
    },
    divider: {
      width: StyleSheet.hairlineWidth,
      backgroundColor: colors.separator,
      marginVertical: spacing.xs,
    },
  });

type StatTileProps = {
  label: string;
  value: string;
  unit?: string;
  sub?: string;
  subTone?: 'muted' | 'positive' | 'negative';
  /** Accent wash: the tile that leads a grid, or the one currently driving a chart. */
  highlight?: boolean;
  /** Smaller value, for a dense secondary row. */
  compact?: boolean;
  onPress?: () => void;
  /** Mini visual: sits under the text, or beside it with `accessoryBeside`. */
  accessory?: ReactNode;
  accessoryBeside?: boolean;
};

export const StatTile = ({
  label,
  value,
  unit,
  sub,
  subTone = 'muted',
  highlight = false,
  compact = false,
  onPress,
  accessory,
  accessoryBeside = false,
}: StatTileProps) => {
  const { colors, typography } = useTheme();
  const styles = useMemo(() => createTileStyles(colors, typography), [colors, typography]);
  const subColor =
    subTone === 'positive' ? colors.success : subTone === 'negative' ? colors.danger : colors.textMuted;

  const body = (
    <View style={accessoryBeside ? styles.besideRow : null}>
      <View style={styles.textCol}>
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
        <Text
          style={[styles.value, compact ? styles.valueCompact : null, highlight ? styles.valueHighlight : null]}
          numberOfLines={1}
        >
          {value}
          {unit ? <Text style={styles.unit}> {unit}</Text> : null}
        </Text>
        {sub ? (
          <Text style={[styles.sub, { color: subColor }]} numberOfLines={1}>
            {sub}
          </Text>
        ) : null}
      </View>
      {accessory ? <View style={accessoryBeside ? null : styles.accessoryBelow}>{accessory}</View> : null}
    </View>
  );

  const tileStyle = [styles.tile, compact ? styles.tileCompact : null, highlight ? styles.tileHighlight : null];

  return onPress ? (
    <PressableScale onPress={onPress} scaleTo={0.97} style={[styles.pressable, ...tileStyle]}>
      {body}
    </PressableScale>
  ) : (
    <View style={tileStyle}>{body}</View>
  );
};

type StatGridProps = {
  children: ReactNode;
  columns?: 2 | 3;
};

/** Lays tiles out in equal-width rows; a short last row keeps its tiles column-aligned. */
export const StatGrid = ({ children, columns = 2 }: StatGridProps) => {
  const items = Children.toArray(children);
  const rows: ReactNode[][] = [];
  for (let i = 0; i < items.length; i += columns) rows.push(items.slice(i, i + columns));
  return (
    <View style={gridStyles.grid}>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={gridStyles.row}>
          {row}
          {Array.from({ length: columns - row.length }, (_, i) => (
            <View key={`pad-${i}`} style={gridStyles.pad} />
          ))}
        </View>
      ))}
    </View>
  );
};

const gridStyles = StyleSheet.create({
  grid: { gap: spacing.xs },
  row: { flexDirection: 'row', gap: spacing.xs },
  pad: { flex: 1 },
});

const createTileStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
    tile: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'transparent',
      paddingHorizontal: spacing.s,
      paddingVertical: spacing.s,
    },
    // PressableScale centres its children by default; the tile's text is left-aligned.
    pressable: {
      alignItems: 'stretch',
      justifyContent: 'flex-start',
    },
    tileCompact: {
      paddingVertical: spacing.xs,
    },
    tileHighlight: {
      backgroundColor: colors.accentMuted,
      borderColor: colors.accent,
    },
    besideRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.xs,
    },
    textCol: {
      flexShrink: 1,
    },
    label: {
      ...typography.section,
    },
    value: {
      ...typography.numeric,
      fontSize: 26,
      marginTop: 2,
    },
    valueCompact: {
      fontSize: 20,
      marginTop: 0,
    },
    valueHighlight: {
      color: colors.accent,
    },
    unit: {
      fontSize: 13,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    sub: {
      ...typography.meta,
      marginTop: 2,
    },
    accessoryBelow: {
      marginTop: spacing.xs,
    },
  });
