import { useMemo } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatDayMonth, type PyramidRowClimb } from '../../domain/progressInsights';
import { GradeChip, font, radius, spacing, useTheme } from '../../ui';
import type { ThemeColors } from '../../ui/tokens/colors';
import type { Typography } from '../../ui/tokens/typography';

type Props = {
  /** The pyramid row that was tapped; null keeps the sheet closed. */
  grade: { label: string; color: string } | null;
  climbs: PyramidRowClimb[];
  /** "last 30 days", "all time" and so on, for the sub-line. */
  scopeNote: string;
  onClose: () => void;
};

/** Every climb behind one pyramid row, newest first, inside the current period and gym filter. */
export const GradeClimbsSheet = ({ grade, climbs, scopeNote, onClose }: Props) => {
  const { colors, typography } = useTheme();
  const styles = useMemo(() => createStyles(colors, typography), [colors, typography]);
  const insets = useSafeAreaInsets();
  const flashes = climbs.filter((c) => c.result === 'FLASH').length;

  return (
    <Modal visible={grade !== null} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close climb list" />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.sm }]}>
          <View style={styles.grabber} />
          <View style={styles.headerRow}>
            <View style={styles.titleRow}>
              {grade ? <GradeChip label={grade.label} color={grade.color} /> : null}
              <Text style={styles.title}>
                {climbs.length} climb{climbs.length === 1 ? '' : 's'}
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button">
              <Text style={styles.done}>Done</Text>
            </Pressable>
          </View>
          <Text style={styles.hint}>
            {flashes} flashed · {scopeNote}
          </Text>
          <ScrollView>
            {climbs.map((climb, index) => (
              <View key={climb.eventId} style={[styles.row, index > 0 ? styles.rowDivided : null]}>
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {climb.gymName}
                  </Text>
                  <Text style={styles.rowSub}>{formatDayMonth(climb.createdAt)}</Text>
                </View>
                <Text style={[styles.result, climb.result === 'FLASH' ? styles.resultFlash : null]}>
                  {climb.result === 'FLASH' ? 'Flash' : 'Send'}
                </Text>
              </View>
            ))}
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
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    title: {
      ...typography.title,
    },
    done: {
      ...font('medium'),
      fontSize: 15,
      color: colors.accentInk,
    },
    hint: {
      ...typography.bodyMuted,
      fontSize: 13,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      minHeight: 52,
      paddingHorizontal: spacing.xxs,
    },
    rowDivided: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.separator,
    },
    rowText: {
      flex: 1,
      gap: 1,
    },
    rowTitle: {
      ...typography.body,
    },
    rowSub: {
      ...font('regular'),
      fontSize: 13,
      color: colors.textSecondary,
    },
    result: {
      ...font('medium'),
      fontSize: 13,
      color: colors.textSecondary,
    },
    resultFlash: {
      color: colors.accentInk,
    },
  });
