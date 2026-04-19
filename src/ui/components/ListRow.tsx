import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../tokens/colors';
import { radius } from '../tokens/radius';

type ListRowProps = {
  title: string;
  subtitle?: string;
  meta?: string;
  left?: ReactNode;
  right?: ReactNode;
  onPress?: () => void;
};

export const ListRow = ({ title, subtitle, meta, left, right, onPress }: ListRowProps) => {
  const Container = onPress ? Pressable : View;
  return (
    <Container style={styles.row} onPress={onPress}>
      {left ? <View style={styles.left}>{left}</View> : null}
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <View style={styles.metaCol}>
        {meta ? <Text style={styles.meta}>{meta}</Text> : null}
        {right ? <View style={styles.right}>{right}</View> : null}
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginBottom: 8,
  },
  left: {
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  metaCol: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  meta: {
    color: colors.textMuted,
    fontSize: 11,
    textTransform: 'uppercase',
  },
  right: {
    marginTop: 4,
  },
});
