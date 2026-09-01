import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import type { ThemeColors } from '../tokens/colors';
import { spacing } from '../tokens/spacing';
import type { Typography } from '../tokens/typography';

type BarSegment = {
  value: number;
  color: string;
};

type Bar = {
  label: string;
  segments: BarSegment[];
};

type LegendItem = {
  label: string;
  color: string;
};

type BarChartProps = {
  bars: Bar[];
  maxValue?: number;
  height?: number;
  legend?: LegendItem[];
  valueFormatter?: (value: number) => string;
};

const BAR_MAX_WIDTH = 22;
const SEGMENT_GAP = 2;
const MIN_SEGMENT_HEIGHT = 2;

const defaultFormatter = (value: number): string => `${Math.round(value)}`;

export const BarChart = ({
  bars,
  maxValue,
  height = 120,
  legend,
  valueFormatter = defaultFormatter,
}: BarChartProps) => {
  const { colors, typography } = useTheme();
  const styles = useMemo(() => createStyles(colors, typography), [colors, typography]);
  const computedMax =
    maxValue ??
    Math.max(
      1,
      ...bars.map((bar) => bar.segments.reduce((sum, segment) => sum + segment.value, 0))
    );

  return (
    <View>
      {legend ? (
        <View style={styles.legendRow}>
          {legend.map((item) => (
            <View key={item.label} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: item.color }]} />
              <Text style={styles.legendText}>{item.label}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={[styles.chartRow, { height }]}>
        {bars.map((bar, index) => {
          const total = bar.segments.reduce((sum, segment) => sum + segment.value, 0);
          return (
            <View key={`${bar.label}-${index}`} style={styles.slot}>
              <Text style={styles.valueLabel} numberOfLines={1}>
                {total > 0 ? valueFormatter(total) : ''}
              </Text>
              <View style={styles.barColumn}>
                {bar.segments
                  .slice()
                  .reverse()
                  .map((segment, segmentIndex) => {
                    const isTopmost = segmentIndex === 0;
                    const segmentHeight =
                      segment.value > 0
                        ? Math.max(MIN_SEGMENT_HEIGHT, (segment.value / computedMax) * height)
                        : 0;
                    return (
                      <View
                        key={segmentIndex}
                        style={[
                          styles.segment,
                          {
                            height: segmentHeight,
                            backgroundColor: segment.color,
                            marginBottom: isTopmost || segmentHeight === 0 ? 0 : SEGMENT_GAP,
                          },
                          isTopmost ? styles.segmentTop : null,
                        ]}
                      />
                    );
                  })}
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.baseline} />

      <View style={styles.labelRow}>
        {bars.map((bar, index) => (
          <View key={`${bar.label}-label-${index}`} style={styles.slot}>
            <Text style={styles.categoryLabel} numberOfLines={1}>
              {bar.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
  legendRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    ...typography.meta,
    color: colors.textSecondary,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  slot: {
    flex: 1,
    alignItems: 'center',
  },
  valueLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 4,
  },
  barColumn: {
    width: BAR_MAX_WIDTH,
    justifyContent: 'flex-end',
    alignItems: 'stretch',
  },
  segment: {
    width: '100%',
  },
  segmentTop: {
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  baseline: {
    height: 1,
    backgroundColor: colors.border,
  },
  labelRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  categoryLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
});
