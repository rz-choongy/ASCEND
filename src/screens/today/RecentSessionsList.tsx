import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { RecentSession } from '../../domain/dashboard';
import { formatDuration } from '../../domain/dateUtils';
import { DumbbellIcon, GradeChip, MountainMarkIcon, font, radius, spacing, useTheme, type Shadows } from '../../ui';
import type { ThemeColors } from '../../ui/tokens/colors';
import type { Typography } from '../../ui/tokens/typography';

type Props = {
  sessions: RecentSession[];
  onOpen: (sessionId: string) => void;
  onSeeAll: () => void;
  /** Best grade and its tape colour per climb session id, drawn as a chip beside the figure. */
  bestGrades?: Record<string, { label: string; color: string }>;
};

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const whenLabel = (ms: number): string => {
  const d = new Date(ms);
  const today = new Date();
  const time = `${`${d.getHours()}`.padStart(2, '0')}:${`${d.getMinutes()}`.padStart(2, '0')}`;
  if (d.toDateString() === today.toDateString()) return `Today · ${time}`;
  const daysAgo = Math.round((today.setHours(0, 0, 0, 0) - new Date(d).setHours(0, 0, 0, 0)) / 86_400_000);
  if (daysAgo < 7) return `${DAY_SHORT[d.getDay()]} · ${time}`;
  return `${d.getDate()}/${d.getMonth() + 1} · ${time}`;
};

/** Climbs and strength in one newest-first list. */
export const RecentSessionsList = ({ sessions, onOpen, onSeeAll, bestGrades }: Props) => {
  const { colors, typography, shadows } = useTheme();
  const styles = useMemo(() => createStyles(colors, typography, shadows), [colors, typography, shadows]);

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Recent</Text>
        <Pressable onPress={onSeeAll} hitSlop={10} accessibilityRole="button">
          <Text style={styles.seeAll}>See all</Text>
        </Pressable>
      </View>
      <View style={styles.card}>
        <View style={styles.clip}>
          {sessions.map((session, index) => {
            const climb = session.type === 'climb';
            const best = climb ? bestGrades?.[session.sessionId] : undefined;
            return (
              <Pressable
                key={session.sessionId}
                onPress={() => onOpen(session.sessionId)}
                style={({ pressed }) => [
                  styles.row,
                  index > 0 ? styles.rowDivided : null,
                  pressed ? styles.rowPressed : null,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`${session.title}, ${whenLabel(session.startedAt)}, ${session.figure}, ${session.detail}`}
              >
                <View style={[styles.icon, climb ? styles.iconClimb : null]}>
                  {climb ? (
                    <MountainMarkIcon size={14} color={colors.accentInk} />
                  ) : (
                    <DumbbellIcon size={14} color={colors.textPrimary} />
                  )}
                </View>
                <View style={styles.body}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {session.title}
                  </Text>
                  <Text style={styles.rowMeta} numberOfLines={1}>
                    {whenLabel(session.startedAt)}
                    {session.durationMs !== null ? ` · ${formatDuration(0, session.durationMs)}` : ''}
                  </Text>
                </View>
                <View style={styles.figures}>
                  <Text style={styles.figure}>{session.figure}</Text>
                  {best ? null : <Text style={styles.detail}>{session.detail}</Text>}
                </View>
                {best ? <GradeChip variant="dot" label={best.label} color={best.color} /> : null}
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const createStyles = (colors: ThemeColors, typography: Typography, shadows: Shadows) =>
  StyleSheet.create({
    section: {
      gap: spacing.xs,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.xxs,
    },
    title: {
      ...typography.section,
    },
    seeAll: {
      ...font('medium'),
      fontSize: 12,
      color: colors.textSecondary,
    },
    // Outer view carries the shadow; the inner one clips pressed rows to the corners.
    card: {
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      ...shadows.card,
    },
    clip: {
      borderRadius: radius.lg,
      overflow: 'hidden',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.s,
      minHeight: 48,
      paddingHorizontal: spacing.s,
      paddingVertical: spacing.xs,
    },
    rowDivided: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.separator,
    },
    rowPressed: {
      backgroundColor: colors.fillSoft,
    },
    icon: {
      width: 28,
      height: 28,
      borderRadius: radius.md,
      backgroundColor: colors.fill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconClimb: {
      backgroundColor: colors.accentMuted,
    },
    body: {
      flex: 1,
      gap: 1,
    },
    rowTitle: {
      ...typography.body,
    },
    rowMeta: {
      ...typography.meta,
      fontVariant: ['tabular-nums'],
    },
    figures: {
      alignItems: 'flex-end',
      gap: 1,
    },
    figure: {
      ...font('semibold'),
      fontSize: 14,
      lineHeight: 18,
      color: colors.textPrimary,
      fontVariant: ['tabular-nums'],
    },
    detail: {
      ...typography.meta,
    },
  });
