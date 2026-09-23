import type { ReactNode } from 'react';
import { Children, Fragment, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import type { ThemeColors } from '../tokens/colors';
import { font } from '../tokens/fonts';
import { radius } from '../tokens/radius';
import type { Shadows } from '../tokens/shadow';
import { spacing } from '../tokens/spacing';
import { ChevronRightIcon } from './Icon';

/**
 * Prism's uppercase group label ("SETTINGS", "EXPORT") that sits above a
 * `ListGroup` or card.
 */
export const ListSectionHeader = ({ title, style }: { title: string; style?: ViewStyle }) => {
  const { typography } = useTheme();
  return <Text style={[typography.section, sectionHeaderStyles.header, style]}>{title}</Text>;
};

const sectionHeaderStyles = StyleSheet.create({
  header: {
    marginLeft: spacing.xxs,
    marginBottom: spacing.xs,
  },
});

/**
 * The card that holds a run of `ListRow`s. Separators are drawn between
 * children and inset to the text column, so the rows read as one card rather
 * than a stack of boxes.
 */
export const ListGroup = ({ children, style }: { children: ReactNode; style?: ViewStyle }) => {
  const { colors, shadows } = useTheme();
  const styles = useMemo(() => createStyles(colors, shadows), [colors, shadows]);
  const items = Children.toArray(children).filter(Boolean);
  return (
    <View style={[styles.group, style]}>
      <View style={styles.groupInner}>
        {items.map((child, index) => (
          <Fragment key={index}>
            {index > 0 ? <View style={styles.separator} /> : null}
            {child}
          </Fragment>
        ))}
      </View>
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
  const { colors, shadows } = useTheme();
  const styles = useMemo(() => createStyles(colors, shadows), [colors, shadows]);
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

const createStyles = (colors: ThemeColors, shadows: Shadows) =>
  StyleSheet.create({
    // Outer view carries the shadow; rows are clipped by `groupInner` so the
    // pressed highlight respects the rounded corners without clipping the shadow.
    group: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      ...shadows.card,
    },
    groupInner: {
      borderRadius: radius.lg,
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
      minHeight: 48,
      paddingVertical: 12,
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
      ...font('medium'),
      color: colors.textPrimary,
      fontSize: 16,
      letterSpacing: -0.16,
    },
    subtitle: {
      ...font('regular'),
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
      ...font('regular'),
      color: colors.textSecondary,
      fontSize: 15,
      letterSpacing: -0.1,
      fontVariant: ['tabular-nums'],
    },
    right: {
      marginTop: 4,
    },
    chevron: {
      marginLeft: 6,
      opacity: 0.9,
    },
  });
