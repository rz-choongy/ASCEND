import { useMemo } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { font, radius, spacing, useTheme } from '../../ui';
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
  /** null means every gym is pooled. */
  selectedKey: string | null;
  onSelect: (key: string | null) => void;
  onClose: () => void;
};

/** Every gym climbed at, most visited first, plus "All gyms", for scoping the grade pyramid. */
export const GymScopeSheet = ({ visible, gyms, selectedKey, onSelect, onClose }: Props) => {
  const { colors, typography } = useTheme();
  const styles = useMemo(() => createStyles(colors, typography), [colors, typography]);
  const insets = useSafeAreaInsets();
  const totalSessions = gyms.reduce((sum, gym) => sum + gym.sessions, 0);
  const rows: { key: string | null; name: string; sessions: number }[] = [
    { key: null, name: 'All gyms', sessions: totalSessions },
    ...gyms,
  ];

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
          <ScrollView>
            {rows.map((gym, index) => {
              const selected = gym.key === selectedKey;
              return (
                <Pressable
                  key={gym.key ?? '__all__'}
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
      color: colors.accentInk,
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
      ...font('semibold'),
      color: colors.accentInk,
    },
    rowSub: {
      ...font('regular'),
      fontSize: 13,
      color: colors.textSecondary,
    },
  });
