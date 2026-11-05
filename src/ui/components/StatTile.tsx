import { Children, Fragment, useMemo, type ReactNode } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import type { ThemeColors } from '../tokens/colors';
import { font } from '../tokens/fonts';
import { radius } from '../tokens/radius';
import type { Shadows } from '../tokens/shadow';
import { spacing } from '../tokens/spacing';
import type { Typography } from '../tokens/typography';
import { PressableScale } from './PressableScale';

type StatItem = {
  label: string;
  value: string;
  sub?: string;
  /** A small dot beside the value, e.g. a grade's tape colour. Never a filled block. */
  dotColor?: string;
};

type StatRowProps = {
  items: StatItem[];
  /** Drop the card around the row, when it already sits inside one. */
  bare?: boolean;
  style?: ViewStyle;
};

/**
 * The compact stat row: label, big condensed figure, small sub-line, in equal
 * columns split by hairlines. Replaces a grid of separate stat cards.
 */
export const StatRow = ({ items, bare = false, style }: StatRowProps) => {
  const { colors, typography } = useTheme();
  const styles = useMemo(() => createRowStyles(colors, typography), [colors, typography]);
  return (
    <View style={[styles.strip, bare ? styles.bare : null, style]}>
      {items.map((item, index) => (
        <View key={item.label} style={[styles.cell, index > 0 ? styles.cellDivided : null]}>
          <Text style={styles.label} numberOfLines={1}>
            {item.label}
          </Text>
          <View style={styles.valueRow}>
            <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
              {item.value}
            </Text>
            {item.dotColor ? <View style={[styles.dot, { backgroundColor: item.dotColor }]} /> : null}
          </View>
          {item.sub ? (
            <Text style={styles.sub} numberOfLines={1}>
              {item.sub}
            </Text>
          ) : null}
        </View>
      ))}
    </View>
  );
};

const createRowStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
    strip: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      paddingVertical: 12,
      paddingHorizontal: 12,
    },
    bare: {
      backgroundColor: 'transparent',
      paddingVertical: 0,
      paddingHorizontal: 0,
    },
    cell: {
      flex: 1,
      minWidth: 0,
    },
    cellDivided: {
      borderLeftWidth: StyleSheet.hairlineWidth,
      borderLeftColor: colors.separator,
      paddingLeft: 10,
      marginLeft: 10,
    },
    label: {
      ...typography.meta,
      ...font('semibold'),
    },
    valueRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 2,
    },
    value: {
      ...typography.numeric,
      flexShrink: 1,
    },
    dot: {
      width: 9,
      height: 9,
      borderRadius: 5,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(0, 0, 0, 0.2)',
    },
    sub: {
      ...typography.meta,
      fontSize: 13,
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
  const { colors, typography, shadows } = useTheme();
  const styles = useMemo(() => createTileStyles(colors, typography, shadows), [colors, typography, shadows]);
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

const createTileStyles = (colors: ThemeColors, typography: Typography, shadows: Shadows) =>
  StyleSheet.create({
    tile: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1.5,
      borderColor: colors.surface,
      ...shadows.card,
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
    // Selected, not shouted: an ink outline instead of a coloured fill.
    tileHighlight: {
      borderColor: colors.textPrimary,
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
      ...typography.meta,
      ...font('semibold'),
    },
    value: {
      ...typography.numeric,
      marginTop: 2,
    },
    valueCompact: {
      fontSize: 22,
      lineHeight: 28,
      marginTop: 0,
    },
    valueHighlight: {},
    unit: {
      ...typography.meta,
      fontSize: 13,
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
