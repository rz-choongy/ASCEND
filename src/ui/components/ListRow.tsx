import type { ReactNode } from 'react';
import { Children, Fragment, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import type { ThemeColors } from '../tokens/colors';
import { radius } from '../tokens/radius';
import { spacing } from '../tokens/spacing';
import { ChevronRightIcon } from './Icon';

/**
 * The rounded panel that holds a run of `ListRow`s -- iOS's inset-grouped
 * section. Separators are drawn between children and inset to the text column,
 * so the rows read as one card rather than a stack of boxes.
 */
export const ListGroup = ({ children, style }: { children: ReactNode; style?: ViewStyle }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const items = Children.toArray(children).filter(Boolean);
  return (
    <View style={[styles.group, style]}>
      {items.map((child, index) => (
        <Fragment key={index}>
          {index > 0 ? <View style={styles.separator} /> : null}
          {child}
        </Fragment>
      ))}
    </View>
  );
};

type ListRowProps = {
  title: string;
  subtitle?: string;
  meta?: string;
  left?: ReactNode;
  right?: ReactNode;
  /** Draws the disclosure chevron. Defaults on for pressable rows. */
  chevron?: boolean;
  onPress?: () => void;
};

export const ListRow = ({
  title,
  subtitle,
  meta,
  left,
  right,
  chevron,
  onPress,
}: ListRowProps) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const showChevron = chevron ?? (onPress != null && right == null);
  const body = (
    <>
      {left ? <View style={styles.left}>{left}</View> : null}
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <View style={styles.metaCol}>
        {meta ? <Text style={styles.meta}>{meta}</Text> : null}
        {right ? <View style={styles.right}>{right}</View> : null}
      </View>
      {showChevron ? (
        <View style={styles.chevron}>
          <ChevronRightIcon color={colors.textMuted} />
        </View>
      ) : null}
    </>
  );

  if (!onPress) {
    return <View style={styles.row}>{body}</View>;
  }
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed ? styles.rowPressed : null]}
      onPress={onPress}
    >
      {body}
    </Pressable>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    group: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.separator,
      marginLeft: spacing.sm,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 44,
      paddingVertical: 11,
      paddingHorizontal: spacing.sm,
      backgroundColor: colors.surface,
    },
    rowPressed: {
      backgroundColor: colors.fillSoft,
    },
    left: {
      marginRight: spacing.s,
    },
    content: {
      flex: 1,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: '500',
      letterSpacing: -0.24,
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: 13,
      letterSpacing: -0.1,
      marginTop: 2,
    },
    metaCol: {
      alignItems: 'flex-end',
      marginLeft: spacing.s,
    },
    meta: {
      color: colors.textSecondary,
      fontSize: 16,
      letterSpacing: -0.24,
    },
    right: {
      marginTop: 4,
    },
    chevron: {
      marginLeft: 6,
      opacity: 0.9,
    },
  });
