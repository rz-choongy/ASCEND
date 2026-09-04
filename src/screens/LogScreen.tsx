import { useCallback, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { addDays, formatLocalDate } from '../domain/dateUtils';
import { ensureSelectedClimbGym, getSelectedClimbGym } from '../domain/gymStore';
import {
  buildRecentSends,
  buildWeekCompletion,
  findHardestSendThisWeek,
  type RecentSend,
} from '../domain/progressInsights';
import {
  createSession,
  getActiveSession,
  getAllCompletedSessionCount,
  getSessionStreak,
  getSessionsForDate,
  getSessionsForDateRange,
} from '../domain/sessionStore';
import type { SessionRow, SessionType } from '../domain/types';
import type { RootStackParamList, TabParamList } from '../navigation/types';
import {
  ArrowRightIcon,
  Button,
  Card,
  PressableScale,
  SettingsSlidersIcon,
  spacing,
  useTheme,
} from '../ui';
import type { ThemeColors } from '../ui/tokens/colors';
import type { Typography } from '../ui/tokens/typography';

type LogNavProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Log'>,
  NativeStackNavigationProp<RootStackParamList>
>;

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

type GymLike = {
  id: string;
  name: string;
};

function formatHeaderDate(d: Date): string {
  return `${DAY_NAMES[d.getDay()]}, ${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
}

function formatRecentSendMeta(send: RecentSend): string {
  const d = new Date(send.createdAt);
  const h = `${d.getHours()}`.padStart(2, '0');
  const min = `${d.getMinutes()}`.padStart(2, '0');
  const time = `${h}:${min}`;
  if (send.isToday) return time;
  return `${DAY_NAMES[d.getDay()].slice(0, 3)}, ${time}`;
}

const SettingsButton = ({
  styles,
  colors,
  onPress,
}: {
  styles: ReturnType<typeof createStyles>;
  colors: ThemeColors;
  onPress: () => void;
}) => (
  <PressableScale
    onPress={onPress}
    scaleTo={0.88}
    style={styles.iconBtn}
    accessibilityLabel="Settings"
    hitSlop={6}
  >
    <SettingsSlidersIcon color={colors.textSecondary} />
  </PressableScale>
);

const ThemeToggle = ({ colors, styles }: { colors: ThemeColors; styles: ReturnType<typeof createStyles> }) => {
  const { mode, setMode } = useTheme();
  const isDark = mode === 'dark';
  return (
    <PressableScale
      onPress={() => setMode(isDark ? 'light' : 'dark')}
      scaleTo={0.88}
      style={styles.iconBtn}
      accessibilityLabel={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      hitSlop={6}
    >
      {isDark ? (
        <View style={styles.moonWrap}>
          <View style={[styles.moonBase, { backgroundColor: colors.textPrimary }]} />
          <View style={[styles.moonCutout, { backgroundColor: colors.surfaceRaised }]} />
        </View>
      ) : (
        <View style={[styles.sunDot, { backgroundColor: colors.warning }]} />
      )}
    </PressableScale>
  );
};

export function LogScreen() {
  const navigation = useNavigation<LogNavProp>();
  const { colors, typography } = useTheme();
  const styles = useMemo(() => createStyles(colors, typography), [colors, typography]);

  const today = new Date();

  const [activeSession, setActiveSession] = useState<SessionRow | null>(null);
  const [selectedGym, setSelectedGym] = useState<GymLike | null>(null);
  const [streak, setStreak] = useState(0);
  const [weekDots, setWeekDots] = useState<ReturnType<typeof buildWeekCompletion>>([]);
  const [hardestThisWeek, setHardestThisWeek] = useState<ReturnType<typeof findHardestSendThisWeek>>(null);
  const [recentSends, setRecentSends] = useState<RecentSend[]>([]);
  const [hasEverLogged, setHasEverLogged] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const active = getActiveSession();
      setActiveSession(active);
      setSelectedGym(getSelectedClimbGym() ?? ensureSelectedClimbGym());
      setStreak(getSessionStreak());
      setHasEverLogged(getAllCompletedSessionCount() > 0 || active !== null);

      const now = new Date();
      const last7Start = addDays(now, -6);
      last7Start.setHours(0, 0, 0, 0);
      const last7 = getSessionsForDateRange(last7Start.getTime(), now.getTime() + 1);
      setWeekDots(buildWeekCompletion(last7));
      setHardestThisWeek(findHardestSendThisWeek(last7));

      const recentWindowStart = addDays(now, -30);
      recentWindowStart.setHours(0, 0, 0, 0);
      const recentSessions = getSessionsForDateRange(recentWindowStart.getTime(), now.getTime() + 1);
      setRecentSends(buildRecentSends(recentSessions, 4));
    }, [])
  );

  function navigateToSession(type: SessionType, sessionId: string) {
    if (type === 'climb') {
      navigation.navigate('ClimbLogger', { sessionId });
    } else {
      navigation.navigate('StrengthLogger', { sessionId });
    }
  }

  function handleResume() {
    if (!activeSession) return;
    navigateToSession(activeSession.type, activeSession.id);
  }

  function handleLog(type: SessionType) {
    // Re-check for active session to avoid duplicates
    const existing = getActiveSession();
    if (existing) {
      navigateToSession(existing.type, existing.id);
      return;
    }
    const gym = type === 'climb' ? ensureSelectedClimbGym() : null;
    const sessionId = createSession(type, gym ? { gymId: gym.id } : undefined);
    navigateToSession(type, sessionId);
  }

  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
      {/* Header */}
      <View style={styles.headerBlock}>
        <View style={styles.headerRow}>
          <Text style={styles.screenTitle}>Today</Text>
          <View style={styles.headerRight}>
            <ThemeToggle colors={colors} styles={styles} />
            <SettingsButton
              colors={colors}
              styles={styles}
              onPress={() => navigation.navigate('Settings')}
            />
          </View>
        </View>
        <Text style={styles.dateHeader}>{formatHeaderDate(today)}</Text>

        {/* Streak numeral + week dot strip */}
        <View style={styles.streakRow}>
          <View style={styles.streakNumWrap}>
            <Text style={styles.streakNum}>{streak}</Text>
            <Text style={styles.streakLabel}>Day{'\n'}Streak</Text>
          </View>
          <View style={styles.weekStrip}>
            {weekDots.map((day, i) => (
              <View key={i} style={styles.weekCell}>
                <View style={[styles.weekDot, day.done ? styles.weekDotDone : null]} />
                <Text style={styles.weekDayLabel}>{day.weekdayLabel}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Active session banner */}
      {activeSession ? (
        <Card style={styles.banner}>
          <View style={styles.bannerInner}>
            <View style={styles.bannerDot} />
            <View style={styles.bannerTextCol}>
              <Text style={styles.bannerLabel}>Session in progress</Text>
              <Text style={styles.bannerType}>
                {activeSession.title?.trim() || (activeSession.type === 'climb' ? 'Climbing' : 'Strength')}
              </Text>
            </View>
            <Button
              label="Resume session"
              variant="primary"
              onPress={handleResume}
              style={styles.resumeButton}
            />
          </View>
        </Card>
      ) : null}

      {/* Quick-log CTAs */}
      <View style={styles.ctaSection}>
        {activeSession ? (
          <View style={styles.activeLockBox}>
            <Text style={styles.activeLockTitle}>Finish current session first</Text>
            <Text style={styles.activeLockCopy}>
              Resume the active session above before starting a new one.
            </Text>
          </View>
        ) : (
          <>
            <TouchableOpacity
              style={styles.gymRow}
              onPress={() => navigation.navigate('GymSelect')}
              activeOpacity={0.75}
            >
              <View>
                <Text style={styles.gymLabel}>Climb grades</Text>
                <Text style={styles.gymName}>{selectedGym?.name ?? 'Default V-Scale'}</Text>
              </View>
              <Text style={styles.chevron}>{'>'}</Text>
            </TouchableOpacity>
            <View style={styles.ctaRow}>
              <Button
                label="Start Climbing"
                variant="primary"
                onPress={() => handleLog('climb')}
                style={styles.ctaPrimary}
              />
              <Button
                label="Strength"
                variant="secondary"
                onPress={() => handleLog('strength')}
                style={styles.ctaSecondary}
              />
            </View>
          </>
        )}
      </View>

      {/* First-time empty state */}
      {!hasEverLogged && !activeSession ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>Start your first session</Text>
          <Text style={styles.emptyStateCopy}>
            Tap "Start Climbing" or "Strength" above to log your first session. It'll show up here.
          </Text>
        </View>
      ) : null}

      {/* This week's hardest send */}
      {hardestThisWeek ? (
        <View style={styles.prCallout}>
          <Text style={styles.prGrade}>{hardestThisWeek.gradeLabel}</Text>
          <View style={styles.prInfo}>
            <Text style={styles.prLabel}>This week's hardest send</Text>
            <Text style={styles.prGym}>{hardestThisWeek.gymName}</Text>
            <Text style={styles.prMeta}>
              {formatRecentSendMeta({ ...hardestThisWeek, eventId: '', isToday: false })}
              {hardestThisWeek.result === 'FLASH' ? ' · Flash' : ''}
            </Text>
          </View>
        </View>
      ) : null}

      {/* Recent sends */}
      {recentSends.length > 0 ? (
        <View style={styles.sessionSection}>
          <Text style={styles.sectionLabel}>Recent sends</Text>
          <View>
            {recentSends.map((send) => (
              <View key={send.eventId} style={styles.sendRow}>
                <View style={styles.gradeChip}>
                  <Text style={styles.gradeChipText}>{send.gradeLabel}</Text>
                </View>
                <View style={styles.sendInfo}>
                  <View style={styles.sendGymRow}>
                    <Text style={styles.sendGym}>{send.gymName}</Text>
                    {send.isToday ? (
                      <View style={styles.todayChip}>
                        <Text style={styles.todayChipText}>Today</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.sendMeta}>{formatRecentSendMeta(send)}</Text>
                </View>
                {send.result === 'FLASH' ? (
                  <Text style={styles.sendResult}>Flash</Text>
                ) : null}
              </View>
            ))}
          </View>
          <TouchableOpacity
            style={styles.viewAll}
            onPress={() => navigation.navigate('Calendar')}
            activeOpacity={0.75}
          >
            <Text style={styles.viewAllText}>View all sessions</Text>
            <ArrowRightIcon color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },

  // Header
  headerBlock: {
    gap: 8,
    marginBottom: spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  screenTitle: {
    ...typography.display,
  },
  dateHeader: {
    ...typography.bodyMuted,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moonWrap: {
    width: 14,
    height: 14,
  },
  moonBase: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  moonCutout: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    top: -3,
    left: 5,
  },
  sunDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },

  // Streak module
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  streakNumWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    flexShrink: 0,
    paddingBottom: 2,
  },
  streakNum: {
    ...typography.display,
    fontSize: 42,
    lineHeight: 40,
  },
  streakLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.textMuted,
    lineHeight: 13,
  },
  weekStrip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  weekCell: {
    alignItems: 'center',
    gap: 6,
  },
  weekDot: {
    width: 13,
    height: 13,
    borderWidth: 1,
    borderColor: colors.textMuted,
    backgroundColor: colors.background,
  },
  weekDotDone: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  weekDayLabel: {
    fontSize: 8.5,
    fontWeight: '600',
    color: colors.textMuted,
  },

  // Active session banner
  banner: {
    borderColor: colors.accent,
    borderWidth: 1,
    backgroundColor: colors.accentMuted,
    padding: spacing.sm,
  },
  bannerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  bannerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  bannerTextCol: {
    flex: 1,
  },
  bannerLabel: {
    ...typography.meta,
    color: colors.accent,
  },
  bannerType: {
    ...typography.body,
    fontWeight: '700',
    marginTop: 2,
  },
  resumeButton: {
    minWidth: 126,
  },

  // CTA buttons
  ctaSection: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  activeLockBox: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 0,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 12,
  },
  activeLockTitle: {
    ...typography.body,
    fontWeight: '800',
  },
  activeLockCopy: {
    ...typography.bodyMuted,
    marginTop: 2,
  },
  gymRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 0,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.sm,
    paddingVertical: 12,
  },
  gymLabel: {
    ...typography.meta,
    color: colors.textMuted,
  },
  gymName: {
    ...typography.body,
    fontWeight: '700',
    marginTop: 2,
  },
  chevron: {
    color: colors.textMuted,
    fontSize: 14,
  },
  ctaRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  ctaPrimary: {
    flex: 2.6,
  },
  ctaSecondary: {
    flex: 1,
  },

  emptyState: {
    borderRadius: 0,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  emptyStateTitle: {
    ...typography.body,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyStateCopy: {
    ...typography.bodyMuted,
    textAlign: 'center',
    lineHeight: 20,
  },

  // PR callout
  prCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: 16,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  prGrade: {
    ...typography.display,
    fontSize: 34,
    lineHeight: 34,
    color: colors.accent,
    flexShrink: 0,
  },
  prInfo: {
    flex: 1,
  },
  prLabel: {
    ...typography.meta,
    fontSize: 9.5,
  },
  prGym: {
    ...typography.body,
    fontSize: 13.5,
    marginTop: 3,
  },
  prMeta: {
    ...typography.bodyMuted,
    fontSize: 11.5,
    marginTop: 1,
  },

  // Recent sends section
  sessionSection: {
    gap: 0,
  },
  sectionLabel: {
    ...typography.section,
    marginBottom: spacing.xs,
  },
  sendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 11,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  gradeChip: {
    ...typography.numeric,
    minWidth: 32,
    height: 32,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  gradeChipText: {
    ...typography.numeric,
    fontSize: 14,
    color: colors.textSecondary,
  },
  sendInfo: {
    flex: 1,
  },
  sendGymRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  sendGym: {
    ...typography.body,
    fontSize: 13.5,
  },
  todayChip: {
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
  },
  todayChipText: {
    fontSize: 8.5,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.textSecondary,
  },
  sendMeta: {
    ...typography.bodyMuted,
    fontSize: 11.5,
    marginTop: 2,
  },
  sendResult: {
    ...typography.meta,
    fontSize: 11.5,
    color: colors.accent,
    flexShrink: 0,
  },
  viewAll: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    paddingTop: 14,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  viewAllText: {
    ...typography.bodyMuted,
    fontSize: 11.5,
    fontWeight: '600',
  },
  });
