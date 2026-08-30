import { Fragment, useMemo } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import type { ThemeColors } from '../tokens/colors';
import { radius } from '../tokens/radius';
import { spacing } from '../tokens/spacing';
import type { Typography } from '../tokens/typography';

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
            <Text style={styles.label}>{item.label}</Text>
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
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: spacing.sm,
    },
    cell: {
      flex: 1,
      alignItems: 'center',
      gap: 2,
    },
    value: {
      color: colors.textPrimary,
      fontSize: 20,
      fontWeight: '800',
    },
    label: {
      ...typography.meta,
      color: colors.textMuted,
    },
    divider: {
      width: 1,
      backgroundColor: colors.border,
      marginVertical: 4,
    },
  });
