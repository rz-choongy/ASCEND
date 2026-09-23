import { useMemo } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StarIcon, font, radius, spacing, useTheme } from '../../ui';
import type { ThemeColors } from '../../ui/tokens/colors';
import type { Typography } from '../../ui/tokens/typography';

export type GymScopeOption = {
  key: string;
  name: string;
  sessions: number;
};

type Props = {
  visible: boolean;
  gyms: GymScopeOption[];
  favoriteKeys: Set<string>;
  selectedKey: string | null;
  onSelect: (key: string) => void;
  onToggleFavorite: (key: string) => void;
  onClose: () => void;
};

/**
 * Every gym climbed at, for the grade pyramid. Starred gyms get their own chip
 * on the card; the rest are reached from here, so a gym visited once a year
 * doesn't crowd the row.
 */
export const GymScopeSheet = ({ visible, gyms, favoriteKeys, selectedKey, onSelect, onToggleFavorite, onClose }: Props) => {
  const { colors, typography } = useTheme();
  const styles = useMemo(() => createStyles(colors, typography), [colors, typography]);
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close gym list" />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.sm }]}>
          <View style={styles.grabber} />
          <View style={styles.headerRow}>
            <Text style={styles.title}>Gyms</Text>
            <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button">
              <Text style={styles.done}>Done</Text>
            </Pressable>
          </View>
          <Text style={styles.hint}>Star the gyms you climb at most to keep them on the pyramid card.</Text>
          <ScrollView>
            {gyms.map((gym, index) => {
              const favorite = favoriteKeys.has(gym.key);
              const selected = gym.key === selectedKey;
              return (
                <Pressable
                  key={gym.key}
                  onPress={() => onSelect(gym.key)}
                  style={({ pressed }) => [
                    styles.row,
                    index > 0 ? styles.rowDivided : null,
                    pressed ? styles.rowPressed : null,
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                >
                  <View style={styles.rowText}>
                    <Text style={[styles.rowTitle, selected ? styles.rowTitleSelected : null]} numberOfLines={1}>
                      {gym.name}
                    </Text>
                    <Text style={styles.rowSub}>
                      {gym.sessions} {gym.sessions === 1 ? 'session' : 'sessions'}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => onToggleFavorite(gym.key)}
                    hitSlop={10}
                    style={styles.star}
                    accessibilityRole="button"
                    accessibilityLabel={favorite ? `Unpin ${gym.name}` : `Pin ${gym.name}`}
                  >
                    <StarIcon size={20} color={favorite ? colors.accent : colors.textMuted} filled={favorite} />
                  </Pressable>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: colors.overlay,
    },
    sheet: {
      maxHeight: '75%',
      backgroundColor: colors.surface,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      paddingHorizontal: spacing.sm,
      paddingTop: spacing.xs,
      gap: spacing.xs,
    },
    grabber: {
      alignSelf: 'center',
      width: 36,
      height: 5,
      borderRadius: 3,
      backgroundColor: colors.borderSoft,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 36,
    },
    title: {
      ...typography.title,
    },
    done: {
      ...font('medium'),
      fontSize: 15,
      color: colors.accent,
    },
    hint: {
      ...typography.bodyMuted,
      fontSize: 13,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      minHeight: 56,
      paddingHorizontal: spacing.xxs,
    },
    rowDivided: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.separator,
    },
    rowPressed: {
      backgroundColor: colors.fillSoft,
    },
    rowText: {
      flex: 1,
      gap: 1,
    },
    rowTitle: {
      ...typography.body,
    },
    rowTitleSelected: {
      color: colors.accent,
    },
    rowSub: {
      ...font('regular'),
      fontSize: 12,
      color: colors.textSecondary,
    },
    star: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
