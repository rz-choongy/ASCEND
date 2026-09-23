import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { formatElapsed } from '../../domain/dateUtils';
import type { SessionRow } from '../../domain/types';
import { Button, font, radius, spacing, useTheme } from '../../ui';
import type { ThemeColors } from '../../ui/tokens/colors';
import type { Typography } from '../../ui/tokens/typography';

type Props = {
  session: SessionRow;
  /** Where it's happening: the gym for a climb, the session's name (if any) for strength. */
  where: string;
  showTimer: boolean;
  onResume: () => void;
  onFinish: () => void;
};

const formatClock = (ms: number) => {
  const d = new Date(ms);
  return `${`${d.getHours()}`.padStart(2, '0')}:${`${d.getMinutes()}`.padStart(2, '0')}`;
};

/** Takes the start card's place while a session is open. */
export const ActiveSessionCard = ({ session, where, showTimer, onResume, onFinish }: Props) => {
  const { colors, typography } = useTheme();
  const styles = useMemo(() => createStyles(colors, typography), [colors, typography]);
  const [now, setNow] = useState(() => Date.now());

  // Passive session length, same setting as the loggers' timers.
  useEffect(() => {
    if (!showTimer) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [showTimer]);

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.liveRow}>
          <View style={styles.liveDot} />
          <Text style={styles.liveLabel}>{session.type === 'climb' ? 'Climbing now' : 'Strength session'}</Text>
        </View>
        {where ? (
          <Text style={styles.where} numberOfLines={1}>
            {where}
          </Text>
        ) : null}
      </View>
      {showTimer ? (
        <Text style={styles.elapsed}>{formatElapsed(now - session.started_at)}</Text>
      ) : (
        <Text style={styles.started}>Started {formatClock(session.started_at)}</Text>
      )}
      <View style={styles.actions}>
        <Button label="Resume" onPress={onResume} style={styles.resume} />
        <Button label="Finish" variant="secondary" onPress={onFinish} style={styles.finish} />
      </View>
    </View>
  );
};

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
    // Tinted rather than shadowed: a translucent fill over a shadow shows the
    // shadow through on Android.
    card: {
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.accentSoft,
      backgroundColor: colors.accentMuted,
      padding: spacing.sm,
      gap: spacing.xs,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.xs,
    },
    liveRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    liveDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: colors.success,
    },
    liveLabel: {
      ...font('medium'),
      fontSize: 13,
      color: colors.accent,
    },
    where: {
      ...typography.meta,
      color: colors.textSecondary,
      flexShrink: 1,
    },
    elapsed: {
      ...typography.mono,
      fontSize: 40,
      lineHeight: 48,
      color: colors.textPrimary,
    },
    started: {
      ...typography.title,
      marginVertical: spacing.xxs,
    },
    actions: {
      flexDirection: 'row',
      gap: spacing.xs,
      marginTop: spacing.xxs,
    },
    resume: {
      flex: 2,
    },
    finish: {
      flex: 1,
    },
  });
