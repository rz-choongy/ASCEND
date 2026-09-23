import { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeContext';
import type { ThemeColors } from '../tokens/colors';
import { font } from '../tokens/fonts';
import { radius } from '../tokens/radius';
import type { Shadows } from '../tokens/shadow';
import { spacing } from '../tokens/spacing';
import type { Typography } from '../tokens/typography';
import { PressableScale } from './PressableScale';

/** Same shape as React Native's AlertButton, so `showDialog` is a drop-in for `Alert.alert`. */
export type DialogButton = {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
};

type DialogRequest = {
  title: string;
  message?: string;
  buttons: DialogButton[];
};

type HostSetter = (request: DialogRequest | null) => void;

// Hosts register themselves; the most recently mounted one shows the dialog. The
// app root has one, and a sheet that is itself a native modal mounts an inline one
// while it's open -- a second native modal can't present over the first on iOS.
const hosts: HostSetter[] = [];

/**
 * The app's own confirm/alert dialog, in place of the platform's stock one.
 * Same arguments as `Alert.alert`; with no buttons it shows a single OK.
 */
export const showDialog = (title: string, message?: string, buttons?: DialogButton[]): void => {
  const host = hosts[hosts.length - 1];
  const request = { title, message, buttons: buttons && buttons.length > 0 ? buttons : [{ text: 'OK' }] };
  if (!host) {
    // No host mounted (shouldn't happen): fall back so the message is never lost.
    Alert.alert(title, message, buttons);
    return;
  }
  if (request.buttons.some((b) => b.style === 'destructive')) {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }
  host(request);
};

type HostProps = {
  /** Draw inside the current view (for use within a sheet that's already a Modal). */
  inline?: boolean;
};

export const DialogHost = ({ inline = false }: HostProps) => {
  const { colors, typography, shadows } = useTheme();
  const styles = useMemo(() => createStyles(colors, typography, shadows), [colors, typography, shadows]);
  const [request, setRequest] = useState<DialogRequest | null>(null);

  useEffect(() => {
    const setter: HostSetter = (next) => setRequest(next);
    hosts.push(setter);
    return () => {
      const index = hosts.lastIndexOf(setter);
      if (index >= 0) hosts.splice(index, 1);
    };
  }, []);

  if (!request) return null;

  const cancel = request.buttons.find((b) => b.style === 'cancel');
  // Tapping outside or pressing back means "cancel" -- but only when there is a
  // cancel option; a lone OK still has to be acknowledged.
  const dismiss = () => {
    if (!cancel && request.buttons.length > 1) return;
    setRequest(null);
    (cancel ?? request.buttons[0]).onPress?.();
  };
  const press = (button: DialogButton) => {
    setRequest(null);
    button.onPress?.();
  };

  // Two short buttons sit side by side (cancel on the left, like the rest of the
  // app); anything else stacks, primary action first.
  const sideBySide =
    request.buttons.length === 2 && request.buttons.every((b) => b.text.length <= 14);
  const ordered = sideBySide
    ? [...request.buttons].sort((a, b) => (a.style === 'cancel' ? -1 : b.style === 'cancel' ? 1 : 0))
    : [...request.buttons].sort((a, b) => (a.style === 'cancel' ? 1 : b.style === 'cancel' ? -1 : 0));

  const body = (
    <View style={styles.backdrop}>
      <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} accessibilityLabel="Dismiss" />
      <View style={styles.card} accessibilityViewIsModal accessibilityRole="alert">
        <Text style={styles.title}>{request.title}</Text>
        {request.message ? <Text style={styles.message}>{request.message}</Text> : null}
        <View style={[styles.actions, sideBySide ? styles.actionsRow : null]}>
          {ordered.map((button, index) => {
            const isCancel = button.style === 'cancel';
            const isDestructive = button.style === 'destructive';
            // The first non-cancel button is the primary action (unless it's
            // destructive, which gets red instead); a lone button is always primary.
            const isPrimary =
              !isCancel && !isDestructive && (request.buttons.length === 1 || index === ordered.findIndex((b) => b.style !== 'cancel'));
            return (
              <PressableScale
                key={`${button.text}-${index}`}
                onPress={() => press(button)}
                accessibilityLabel={button.text}
                style={[
                  styles.button,
                  sideBySide ? styles.buttonFlex : null,
                  isDestructive ? styles.destructive : isPrimary ? styles.primary : styles.secondary,
                ]}
              >
                <Text
                  style={[
                    styles.buttonText,
                    isDestructive ? styles.destructiveText : isPrimary ? styles.primaryText : null,
                  ]}
                  numberOfLines={1}
                >
                  {button.text}
                </Text>
              </PressableScale>
            );
          })}
        </View>
      </View>
    </View>
  );

  if (inline) return <View style={[StyleSheet.absoluteFill, styles.inlineLayer]}>{body}</View>;
  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={dismiss}>
      {body}
    </Modal>
  );
};

const createStyles = (colors: ThemeColors, typography: Typography, shadows: Shadows) =>
  StyleSheet.create({
    inlineLayer: {
      zIndex: 100,
      elevation: 100,
    },
    backdrop: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.overlay,
      padding: spacing.md,
    },
    card: {
      width: '100%',
      maxWidth: 360,
      borderRadius: radius.xl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      ...shadows.lg,
      padding: spacing.md,
      gap: spacing.xs,
    },
    title: {
      ...typography.title,
      fontSize: 19,
    },
    message: {
      ...typography.bodyMuted,
      fontSize: 15,
      lineHeight: 21,
    },
    actions: {
      gap: spacing.xs,
      marginTop: spacing.sm,
    },
    actionsRow: {
      flexDirection: 'row',
    },
    button: {
      minHeight: 48,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.pill,
    },
    buttonFlex: {
      flex: 1,
    },
    primary: {
      backgroundColor: colors.action,
    },
    secondary: {
      backgroundColor: colors.surfaceAlt,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSoft,
    },
    destructive: {
      backgroundColor: colors.danger,
    },
    buttonText: {
      ...font('medium'),
      fontSize: 16,
      color: colors.textPrimary,
    },
    primaryText: {
      color: colors.onAction,
    },
    destructiveText: {
      color: '#ffffff',
    },
  });
