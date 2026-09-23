import { useMemo, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { logBodyweight } from '../../domain/bodyweightStore';
import { formatDaysAgo, formatWeight, parseWeightInput } from '../../domain/strengthProgress';
import type { BodyweightLogRow } from '../../domain/types';
import { Button, font, radius, spacing, useTheme, type Shadows } from '../../ui';
import type { ThemeColors } from '../../ui/tokens/colors';
import type { Typography } from '../../ui/tokens/typography';

type Props = {
  latest: BodyweightLogRow | null;
  onLogged: (row: BodyweightLogRow) => void;
};

/** Latest bodyweight with a one-tap log; the full trend lives on Progress. */
export const BodyweightRow = ({ latest, onLogged }: Props) => {
  const { colors, typography, shadows } = useTheme();
  const styles = useMemo(() => createStyles(colors, typography, shadows), [colors, typography, shadows]);
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');

  const parsed = parseWeightInput(input);
  const canLog = parsed !== null && parsed > 0;

  // Prefill with the last logged weight, not a blank field -- most people's weight barely
  // moves day to day, so this is usually a confirm-and-tap rather than a retype.
  const open = () => {
    setInput(latest ? formatWeight(latest.weight_kg) : '');
    setIsOpen(true);
  };
  const close = () => {
    setInput('');
    setIsOpen(false);
  };
  const log = () => {
    if (!canLog) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onLogged(logBodyweight(parsed as number));
    close();
  };

  return (
    <>
      <View style={styles.row}>
        <View style={styles.text}>
          <Text style={styles.label}>Bodyweight</Text>
          <Text style={styles.value}>
            {latest
              ? `${formatWeight(latest.weight_kg)} kg · ${formatDaysAgo(latest.logged_at)}`
              : 'Not logged yet'}
          </Text>
        </View>
        <Button label="Log" variant="secondary" onPress={open} style={styles.logButton} />
      </View>

      <Modal transparent animationType="fade" visible={isOpen} onRequestClose={close}>
        <Pressable style={styles.backdrop} onPress={close}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>Log bodyweight</Text>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Weight (kg)"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              autoFocus
              selectTextOnFocus
              returnKeyType="done"
              onSubmitEditing={log}
            />
            <View style={styles.actions}>
              <Button label="Cancel" variant="ghost" onPress={close} style={styles.action} />
              <Button label="Log" onPress={log} disabled={!canLog} style={styles.action} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

const createStyles = (colors: ThemeColors, typography: Typography, shadows: Shadows) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.s,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      ...shadows.card,
      paddingLeft: spacing.sm,
      paddingRight: spacing.s,
      paddingVertical: spacing.s,
    },
    text: {
      flex: 1,
      gap: 2,
    },
    label: {
      ...typography.section,
    },
    value: {
      ...typography.body,
      fontVariant: ['tabular-nums'],
    },
    logButton: {
      minHeight: 40,
      minWidth: 64,
      paddingHorizontal: spacing.sm,
    },
    backdrop: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.overlay,
      padding: spacing.md,
    },
    modalCard: {
      width: '100%',
      borderRadius: radius.xl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      ...shadows.lg,
      padding: spacing.md,
      gap: spacing.sm,
    },
    modalTitle: {
      ...typography.title,
    },
    input: {
      ...font('regular'),
      minHeight: 48,
      borderRadius: radius.md,
      backgroundColor: colors.fill,
      color: colors.textPrimary,
      fontSize: 17,
      paddingHorizontal: spacing.s,
    },
    actions: {
      flexDirection: 'row',
      gap: spacing.xs,
    },
    action: {
      flex: 1,
    },
  });
