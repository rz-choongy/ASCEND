import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Button,
  DialogHost,
  SessionStrip,
  StarIcon,
  font,
  radius,
  spacing,
  useTheme,
  type Shadows,
} from '../../ui';
import type { ThemeColors } from '../../ui/tokens/colors';
import type { Typography } from '../../ui/tokens/typography';

type SessionSummarySheetProps = {
  visible: boolean;
  /** One tape colour per climb, oldest first: the same strip as the logger header. */
  stripColors: string[];
  sendCount: number;
  bestLabel: string;
  isThirtyDayHigh: boolean;
  /** Plain text handed to the share sheet. */
  shareMessage: string;
  /** Finish the session (whatever Done does). */
  onDone: () => void;
  /** Back out and keep logging. */
  onClose: () => void;
};

const STRIP_HEIGHT = 14;
const FILL_MS = 600;

/** The session drawn left to right, once. Shown whole straight away with reduced motion on. */
const FillingStrip = ({ colors }: { colors: string[] }) => {
  const reduceMotion = useReducedMotion();
  const [width, setWidth] = useState(0);
  const progress = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    if (width === 0) return;
    if (reduceMotion) {
      progress.value = 1;
      return;
    }
    progress.value = 0;
    progress.value = withTiming(1, { duration: FILL_MS, easing: Easing.out(Easing.cubic) });
  }, [progress, reduceMotion, width]);

  const clipStyle = useAnimatedStyle(() => ({ width: width * progress.value }), [width]);

  return (
    <View style={{ height: STRIP_HEIGHT }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <Animated.View style={[{ height: STRIP_HEIGHT, overflow: 'hidden' }, clipStyle]}>
        {/* Laid out at full width inside a clip that grows, so segments don't squash as it fills. */}
        {width > 0 ? <SessionStrip colors={colors} height={STRIP_HEIGHT} style={{ width }} /> : null}
      </Animated.View>
    </View>
  );
};

/** End-of-session moment: the tape strip, one line of numbers, Share and Done. */
export const SessionSummarySheet = ({
  visible,
  stripColors,
  sendCount,
  bestLabel,
  isThirtyDayHigh,
  shareMessage,
  onDone,
  onClose,
}: SessionSummarySheetProps) => {
  const { colors, typography, shadows } = useTheme();
  const styles = useMemo(() => createStyles(colors, typography, shadows), [colors, typography, shadows]);

  const handleShare = () => {
    Share.share({ message: shareMessage }).catch(() => {
      // Dismissed or no share target: nothing to do.
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Keep logging" />
        <SafeAreaView edges={['bottom']} style={styles.sheetWrap} pointerEvents="box-none">
          <View style={styles.sheet} accessibilityViewIsModal>
            <Text style={styles.eyebrow}>Session done</Text>
            <FillingStrip colors={stripColors} />
            <Text style={styles.summaryLine}>
              {sendCount} send{sendCount === 1 ? '' : 's'} · best {bestLabel}
            </Text>
            {isThirtyDayHigh ? (
              <View style={styles.highBadge}>
                <StarIcon size={12} color={colors.accentInk} strokeWidth={2.2} filled />
                <Text style={styles.highBadgeText}>30-day high</Text>
              </View>
            ) : null}
            <View style={styles.actions}>
              <Button label="Share" variant="secondary" onPress={handleShare} style={styles.action} />
              <Button label="Done" variant="primary" onPress={onDone} style={styles.action} />
            </View>
          </View>
        </SafeAreaView>
        {/* Done can ask "When did you finish?"; it has to draw inside this modal. */}
        <DialogHost inline />
      </View>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors, typography: Typography, shadows: Shadows) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: colors.overlay,
    },
    sheetWrap: {
      paddingHorizontal: spacing.s,
      paddingBottom: spacing.s,
    },
    sheet: {
      borderRadius: radius.xl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      ...shadows.lg,
      padding: spacing.sm,
      gap: spacing.s,
    },
    eyebrow: {
      ...typography.meta,
      ...font('semibold'),
      color: colors.textSecondary,
    },
    summaryLine: {
      ...typography.title,
      fontSize: 20,
    },
    highBadge: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xxs,
      backgroundColor: colors.accentMuted,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.xs,
      paddingVertical: 2,
      marginTop: -spacing.xxs,
    },
    highBadgeText: {
      ...font('semibold'),
      fontSize: 13,
      color: colors.textPrimary,
    },
    actions: {
      flexDirection: 'row',
      gap: spacing.xs,
      marginTop: spacing.xxs,
    },
    action: {
      flex: 1,
      minHeight: 52,
    },
  });
