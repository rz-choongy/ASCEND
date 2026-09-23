import { useMemo, useState } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';
import { useTheme } from '../theme/ThemeContext';
import type { ThemeColors } from '../tokens/colors';
import type { Typography } from '../tokens/typography';

type LinePoint = {
  value: number;
  label: string;
};

type LineChartProps = {
  points: LinePoint[];
  height?: number;
  valueFormatter?: (value: number) => string;
  /** A bare sparkline: no gridlines, axis or date labels. */
  compact?: boolean;
};

const PAD_X = 8;
/** Room for the max/min labels, so they sit beside the plot instead of over the line. */
const AXIS_GUTTER = 48;
const PAD_Y = 12;
/** Beyond this many points the per-point dots turn to noise, so only the last is drawn. */
const MAX_DOTTED_POINTS = 24;

const defaultFormatter = (value: number): string => `${Math.round(value)}`;

export const LineChart = ({
  points,
  height = 120,
  valueFormatter = defaultFormatter,
  compact = false,
}: LineChartProps) => {
  const { colors, typography } = useTheme();
  const styles = useMemo(() => createStyles(colors, typography), [colors, typography]);
  const [width, setWidth] = useState(0);

  const onLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);

  const values = points.map((p) => p.value);
  let lo = Math.min(...values);
  let hi = Math.max(...values);
  if (hi === lo) {
    lo -= 1;
    hi += 1;
  }

  const left = compact ? 0 : AXIS_GUTTER;
  const padY = compact ? 6 : PAD_Y;
  const plotted = points.map((point, i) => ({
    x:
      points.length === 1
        ? left + (width - left) / 2
        : left + PAD_X + (i / (points.length - 1)) * (width - left - PAD_X * 2),
    y: padY + (1 - (point.value - lo) / (hi - lo)) * (height - padY * 2),
  }));
  const last = plotted[plotted.length - 1];
  const showAllDots = points.length <= MAX_DOTTED_POINTS;

  return (
    <View onLayout={onLayout}>
      <View style={{ height }}>
        {width > 0 && points.length > 0 ? (
          <Svg width={width} height={height}>
            {compact ? null : (
              <>
                <Line x1={left} x2={width} y1={padY} y2={padY} stroke={colors.separator} strokeWidth={StyleSheet.hairlineWidth} strokeDasharray="2 4" />
                <Line x1={left} x2={width} y1={height - padY} y2={height - padY} stroke={colors.separator} strokeWidth={StyleSheet.hairlineWidth} />
              </>
            )}
            {points.length > 1 ? (
              <Polyline
                points={plotted.map((p) => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke={colors.action}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}
            {showAllDots
              ? plotted.slice(0, -1).map((p, i) => <Circle key={i} cx={p.x} cy={p.y} r={2.5} fill={colors.action} />)
              : null}
            <Circle cx={last.x} cy={last.y} r={4.5} fill={colors.accent} />
          </Svg>
        ) : null}
        {compact ? null : (
          <>
            <Text style={[styles.axisLabel, { top: padY - 7 }]} numberOfLines={1}>
              {valueFormatter(Math.max(...values))}
            </Text>
            <Text style={[styles.axisLabel, { top: height - padY - 7 }]} numberOfLines={1}>
              {valueFormatter(Math.min(...values))}
            </Text>
          </>
        )}
      </View>
      {points.length > 1 && !compact ? (
        <View style={styles.xRow}>
          <Text style={styles.xLabel}>{points[0].label}</Text>
          <Text style={styles.xLabel}>{points[points.length - 1].label}</Text>
        </View>
      ) : null}
    </View>
  );
};

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
    axisLabel: {
      ...typography.meta,
      fontSize: 11,
      position: 'absolute',
      left: 0,
      width: AXIS_GUTTER - 6,
      textAlign: 'right',
      lineHeight: 14,
      color: colors.textMuted,
      fontVariant: ['tabular-nums'],
    },
    xRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 4,
      paddingLeft: AXIS_GUTTER,
    },
    xLabel: {
      ...typography.meta,
      fontSize: 11,
    },
  });
