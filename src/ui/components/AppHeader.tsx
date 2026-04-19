import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../tokens/colors';
import { spacing } from '../tokens/spacing';
import { typography } from '../tokens/typography';
import { IconButton } from './IconButton';

type AppHeaderProps = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightAction?: ReactNode;
};

export const AppHeader = ({ title, subtitle, onBack, rightAction }: AppHeaderProps) => {
  return (
    <View style={styles.header}>
      <View style={styles.left}>
        {onBack ? <IconButton label="<" onPress={onBack} /> : null}
        <View style={styles.titleBlock}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      {rightAction ? <View style={styles.right}>{rightAction}</View> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    backgroundColor: colors.background,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.xs,
  },
  titleBlock: {
    flex: 1,
  },
  title: {
    ...typography.title,
  },
  subtitle: {
    marginTop: 2,
    color: colors.textSecondary,
    fontSize: 12,
  },
  right: {
    marginLeft: spacing.xs,
  },
});
