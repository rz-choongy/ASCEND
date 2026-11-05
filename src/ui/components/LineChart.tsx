import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';
import { useTheme } from '../theme/ThemeContext';
import type { ThemeColors } from '../tokens/colors';
import type { Typography } from '../tokens/typography';
import { tapeOutlineColor } from './GradeChip';

type LinePoint = {
  value: number;
  label: string;
};

/** A tappable point of note, e.g. the week of a first send. Its label shows under the chart on tap. */
export type LineChartMarker = {
  /** Index into `points`: the column the marker sits on. */
  index: number;
  value: number;
  color: string;
  label: string;
};

type LineChartProps = {
  points: LinePoint[];
  height?: number;
  valueFormatter?: (value: number) => string;
  /** A bare sparkline: no gridlines, axis or date labels. */
  compact?: boolean;
  /** A second series drawn as small rings with no line, aligned to `points` by index. null skips one. */
  dots?: (number | null)[];
  markers?: LineChartMarker[];
};

const PAD_X = 8;
/** Room for the max/min labels, so they sit beside the plot instead of over the line. */
const AXIS_GUTTER = 40;
const PAD_Y = 12;
/** Beyond this many points the per-point dots turn to noise, so only the last is drawn. */
const MAX_DOTTED_POINTS = 24;
/** Markers are small to look at but get a full finger's worth of tap area. */
const MARKER_HIT = 32;

const defaultFormatter = (value: number): string => `${Math.round(value)}`;

export const LineChart = ({
  points,
  height = 140,
  valueFormatter = defaultFormatter,
  compact = false,
  dots,
  markers,
}: LineChartProps) => {
  const { colors, typography, mode } = useTheme();
  const styles = useMemo(() => createStyles(colors, typography), [colors, typography]);
  const [width, setWidth] = useState(0);
  const [activeMarker, setActiveMarker] = useState<number | null>(null);

  const onLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);

  // The y range covers every series, so a dot or marker never falls off the plot.
  const values = [
    ...points.map((p) => p.value),
    ...(dots ?? []).filter((v): v is number => v !== null),
    ...(markers ?? []).map((m) => m.value),
  ];
  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);
  let lo = dataMin;
  let hi = dataMax;
  if (hi === lo) {
    lo -= 1;
    hi += 1;
  }

  const left = compact ? 0 : AXIS_GUTTER;
  const padY = compact ? 6 : PAD_Y;
  const xAt = (i: number) =>
    points.length === 1
      ? left + (width - left) / 2
      : left + PAD_X + (i / (points.length - 1)) * (width - left - PAD_X * 2);
  const yAt = (value: number) => padY + (1 - (value - lo) / (hi - lo)) * (height - padY * 2);
  const plotted = points.map((point, i) => ({ x: xAt(i), y: yAt(point.value) }));
  const last = plotted[plotted.length - 1];
  const floor = height - padY;
  const showAllDots = points.length <= MAX_DOTTED_POINTS;

  const topLabel = valueFormatter(dataMax);
  const bottomLabel = valueFormatter(dataMin);
  const midLabel = valueFormatter((dataMin + dataMax) / 2);
  const showMid = midLabel !== topLabel && midLabel !== bottomLabel;

  const placedMarkers = (markers ?? []).filter((m) => m.index >= 0 && m.index < points.length);
  const activeLabel = activeMarker !== null ? placedMarkers[activeMarker]?.label : undefined;

  return (
    <View onLayout={onLayout}>
      <View style={{ height }}>
        {width > 0 && points.length > 0 ? (
          <Svg width={width} height={height}>
            {compact ? null : (
              <>
                <Line x1={left} x2={width} y1={padY} y2={padY} stroke={colors.separator} strokeWidth={1} />
                <Line x1={left} x2={width} y1={(padY + floor) / 2} y2={(padY + floor) / 2} stroke={colors.separator} strokeWidth={1} />
                <Line x1={left} x2={width} y1={floor} y2={floor} stroke={colors.separator} strokeWidth={1} />
              </>
            )}
            {(dots ?? []).map((value, i) =>
              value === null || i >= points.length ? null : (
                <Circle
                  key={`d${i}`}
                  cx={xAt(i)}
                  cy={yAt(value)}
                  r={2.5}
                  fill={colors.surface}
                  stroke={colors.textMuted}
                  strokeWidth={1.5}
                />
              )
            )}
            {points.length > 1 ? (
              <Polyline
                points={plotted.map((p) => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke={colors.chartStrong}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}
            {showAllDots
              ? plotted.slice(0, -1).map((p, i) => <Circle key={i} cx={p.x} cy={p.y} r={3} fill={colors.chartStrong} />)
              : null}
            <Circle cx={last.x} cy={last.y} r={5.5} fill={colors.accent} stroke={colors.surface} strokeWidth={2} />
            {placedMarkers.map((marker, i) => {
              const outline = tapeOutlineColor(marker.color, colors, mode);
              const active = i === activeMarker;
              return (
                <Circle
                  key={`m${i}`}
                  cx={xAt(marker.index)}
                  cy={yAt(marker.value)}
                  r={active ? 5.5 : 4.5}
                  fill={marker.color}
                  stroke={outline ?? colors.surface}
                  strokeWidth={outline ? 1 : 1.5}
                />
              );
            })}
          </Svg>
        ) : null}
        {compact ? null : (
          <>
            <Text style={[styles.axisLabel, { top: padY - 7 }]} numberOfLines={1}>
              {topLabel}
            </Text>
            {showMid ? (
              <Text style={[styles.axisLabel, { top: (padY + floor) / 2 - 7 }]} numberOfLines={1}>
                {midLabel}
              </Text>
            ) : null}
            <Text style={[styles.axisLabel, { top: height - padY - 7 }]} numberOfLines={1}>
              {bottomLabel}
            </Text>
          </>
        )}
        {width > 0
          ? placedMarkers.map((marker, i) => (
              <Pressable
                key={`hit${i}`}
                onPress={() => setActiveMarker((current) => (current === i ? null : i))}
                accessibilityRole="button"
                accessibilityLabel={marker.label}
                style={[
                  styles.markerHit,
                  { left: xAt(marker.index) - MARKER_HIT / 2, top: yAt(marker.value) - MARKER_HIT / 2 },
                ]}
              />
            ))
          : null}
      </View>
      {points.length > 1 && !compact ? (
        <View style={styles.xRow}>
          <Text style={styles.xLabel}>{points[0].label}</Text>
          <Text style={styles.xLabel}>{points[points.length - 1].label}</Text>
        </View>
      ) : null}
      {activeLabel ? (
        <Text style={styles.markerLabel} numberOfLines={1}>
          {activeLabel}
        </Text>
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
    markerHit: {
      position: 'absolute',
      width: MARKER_HIT,
      height: MARKER_HIT,
    },
    markerLabel: {
      ...typography.meta,
      color: colors.textPrimary,
      marginTop: 4,
      paddingLeft: AXIS_GUTTER,
    },
  });
