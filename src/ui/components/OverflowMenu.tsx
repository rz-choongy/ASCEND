import { useMemo, useRef, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import type { ThemeColors } from '../tokens/colors';
import { font } from '../tokens/fonts';
import { radius } from '../tokens/radius';
import type { Shadows } from '../tokens/shadow';
import { spacing } from '../tokens/spacing';
import { MoreIcon } from './Icon';
import { IconButton } from './IconButton';

export type OverflowMenuItem = {
  label: string;
  destructive?: boolean;
  onPress: () => void;
};

type OverflowMenuProps = {
  items: OverflowMenuItem[];
  accessibilityLabel?: string;
};

type Anchor = { top: number; right: number };

/**
 * A header "…" button that opens a small menu under itself. For the rare actions that
 * shouldn't sit on the page, like deleting. Items run after the menu has closed, so one that
 * opens a dialog never stacks a second native modal on the first.
 */
export const OverflowMenu = ({ items, accessibilityLabel = 'More options' }: OverflowMenuProps) => {
  const { colors, shadows } = useTheme();
  const styles = useMemo(() => createStyles(colors, shadows), [colors, shadows]);
  const { width: windowWidth } = useWindowDimensions();
  const anchorRef = useRef<View>(null);
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const pendingRef = useRef<(() => void) | null>(null);

  const open = () => {
    anchorRef.current?.measureInWindow((x, y, width, height) => {
      setAnchor({ top: y + height + spacing.xxs, right: Math.max(spacing.xs, windowWidth - (x + width)) });
    });
  };

  const runPending = () => {
    const action = pendingRef.current;
    pendingRef.current = null;
    action?.();
  };

  const choose = (item: OverflowMenuItem) => {
    pendingRef.current = item.onPress;
    setAnchor(null);
    // iOS tells us when the modal is gone (onDismiss); Android doesn't, and closes at once.
    if (Platform.OS !== 'ios') setTimeout(runPending, 0);
  };

  return (
    <View ref={anchorRef} collapsable={false}>
      <IconButton onPress={open} accessibilityLabel={accessibilityLabel}>
        <MoreIcon size={18} color={colors.textPrimary} />
      </IconButton>
      <Modal
        visible={anchor !== null}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setAnchor(null)}
        onDismiss={runPending}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setAnchor(null)} accessibilityLabel="Close menu" />
        {anchor ? (
          <View style={[styles.menu, { top: anchor.top, right: anchor.right }]} accessibilityRole="menu">
            {items.map((item, index) => (
              <Pressable
                key={item.label}
                onPress={() => choose(item)}
                accessibilityRole="menuitem"
                accessibilityLabel={item.label}
                style={({ pressed }) => [
                  styles.item,
                  index > 0 ? styles.itemDivider : null,
                  pressed ? styles.itemPressed : null,
                ]}
              >
                <Text style={[styles.itemText, item.destructive ? styles.itemTextDestructive : null]}>
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </Modal>
    </View>
  );
};

const createStyles = (colors: ThemeColors, shadows: Shadows) =>
  StyleSheet.create({
    menu: {
      position: 'absolute',
      minWidth: 180,
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      ...shadows.lg,
      overflow: 'hidden',
    },
    item: {
      minHeight: 48,
      justifyContent: 'center',
      paddingHorizontal: spacing.sm,
    },
    itemDivider: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.separator,
    },
    itemPressed: {
      backgroundColor: colors.surfaceAlt,
    },
    itemText: {
      ...font('medium'),
      fontSize: 15,
      color: colors.textPrimary,
    },
    itemTextDestructive: {
      color: colors.danger,
    },
  });
