import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../tokens/colors';
import { radius } from '../tokens/radius';
import { typography } from '../tokens/typography';

type MetricCardProps = {
  label: string;
  value: string;
  meta?: string;
  accentColor?: string;
  right?: ReactNode;
};

export const MetricCard = ({ label, value, meta, accentColor, right }: MetricCardProps) => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        {right ? <View style={styles.right}>{right}</View> : null}
      </View>
      <Text style={styles.value}>{value}</Text>
      {meta ? <Text style={styles.meta}>{meta}</Text> : null}
      {accentColor ? <View style={[styles.accent, { backgroundColor: accentColor }]} /> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 88,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    ...typography.meta,
  },
  value: {
    marginTop: 6,
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  meta: {
    marginTop: 4,
    fontSize: 11,
    color: colors.textSecondary,
  },
  right: {
    marginLeft: 8,
  },
  accent: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 4,
    height: '100%',
    borderTopLeftRadius: radius.md,
    borderBottomLeftRadius: radius.md,
  },
});
