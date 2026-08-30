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
import { formatDuration, formatLocalDate } from '../domain/dateUtils';
import { ensureSelectedClimbGym, getSelectedClimbGym } from '../domain/gymStore';
import { createSession, getActiveSession, getSessionStreak, getSessionsForDate, getAllCompletedSessionCount } from '../domain/sessionStore';
import type { SessionRow, SessionType } from '../domain/types';
import type { RootStackParamList, TabParamList } from '../navigation/types';
import { Button, Card, PressableScale, spacing, useTheme } from '../ui';
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

function formatTime(ts: number): string {
  const d = new Date(ts);
  const h = `${d.getHours()}`.padStart(2, '0');
  const min = `${d.getMinutes()}`.padStart(2, '0');
  return `${h}:${min}`;
}

function sessionTypeLabel(type: SessionType): string {
  return type === 'climb' ? 'Climbing' : 'Strength';
}

function sessionDisplayLabel(session: SessionRow): string {
  return session.title?.trim() || sessionTypeLabel(session.type);
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
    style={styles.settingsButton}
    accessibilityLabel="Settings"
  >
    <View style={styles.sliderStack}>
      <View style={[styles.sliderTrack, { backgroundColor: colors.borderSoft }]}>
        <View style={[styles.sliderKnob, { backgroundColor: colors.textPrimary, left: '18%' }]} />
      </View>
      <View style={[styles.sliderTrack, { backgroundColor: colors.borderSoft }]}>
        <View style={[styles.sliderKnob, { backgroundColor: colors.textPrimary, left: '58%' }]} />
      </View>
    </View>
  </PressableScale>
);

const ThemeToggle = ({ colors, styles }: { colors: ThemeColors; styles: ReturnType<typeof createStyles> }) => {
  const { mode, setMode } = useTheme();
  const isDark = mode === 'dark';
  return (
    <PressableScale
      onPress={() => setMode(isDark ? 'light' : 'dark')}
      scaleTo={0.88}
      style={styles.themeToggle}
      accessibilityLabel={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
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
  const [todaySessions, setTodaySessions] = useState<SessionRow[]>([]);
  const [selectedGym, setSelectedGym] = useState<GymLike | null>(null);
  const [streak, setStreak] = useState(0);
  const [hasEverLogged, setHasEverLogged] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const todayStr = formatLocalDate(new Date());
      const active = getActiveSession();
      setActiveSession(active);
      setTodaySessions(getSessionsForDate(todayStr));
      setSelectedGym(getSelectedClimbGym() ?? ensureSelectedClimbGym());
      setStreak(getSessionStreak());
      setHasEverLogged(getAllCompletedSessionCount() > 0 || active !== null);
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
      {/* Date header */}
      <View style={styles.headerBlock}>
        <View style={styles.headerRow}>
          <Text style={styles.screenTitle}>Today</Text>
          <View style={styles.headerRight}>
            {streak > 0 ? (
              <View style={styles.streakPill}>
                <Text style={styles.streakText}>{streak} day streak</Text>
              </View>
            ) : null}
            <ThemeToggle colors={colors} styles={styles} />
            <SettingsButton
              colors={colors}
              styles={styles}
              onPress={() => navigation.navigate('Settings')}
            />
          </View>
        </View>
        <Text style={styles.dateHeader}>{formatHeaderDate(today)}</Text>
      </View>

      {/* Active session banner */}
      {activeSession ? (
        <Card style={styles.banner}>
          <View style={styles.bannerInner}>
            <View style={styles.bannerDot} />
            <View style={styles.bannerTextCol}>
              <Text style={styles.bannerLabel}>Session in progress</Text>
              <Text style={styles.bannerType}>
                {sessionDisplayLabel(activeSession)}
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
            <Button
              label="Start climbing"
              variant="primary"
              onPress={() => handleLog('climb')}
              style={styles.ctaButton}
            />
            <Button
              label="Start strength"
              variant="secondary"
              onPress={() => handleLog('strength')}
              style={styles.ctaButton}
            />
          </>
        )}
      </View>

      {/* First-time empty state */}
      {!hasEverLogged && !activeSession ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>Start your first session</Text>
          <Text style={styles.emptyStateCopy}>
            Tap "Start climbing" or "Start strength" above to log your first session. It'll show up here.
          </Text>
        </View>
      ) : null}

      {/* Today's sessions */}
      {todaySessions.length > 0 ? (
        <View style={styles.sessionSection}>
          <Text style={styles.sectionLabel}>Logged today</Text>
          {todaySessions.map((session) => (
            <TouchableOpacity
              key={session.id}
              style={styles.sessionRow}
              onPress={() =>
                navigation.navigate('SessionDetail', { sessionId: session.id })
              }
              activeOpacity={0.75}
            >
              <View style={styles.sessionRowLeft}>
                <View
                  style={[
                    styles.sessionDot,
                    {
                      backgroundColor:
                        session.type === 'climb' ? colors.accent : colors.success,
                    },
                  ]}
                />
                <Text style={styles.sessionTypeText}>
                  {sessionDisplayLabel(session)}
                </Text>
              </View>
              <View style={styles.sessionRowRight}>
                <Text style={styles.sessionTime}>
                  {formatTime(session.started_at)}
                </Text>
                {session.completed_at != null ? (
                  <Text style={styles.sessionDuration}>
                    {formatDuration(session.started_at, session.completed_at)}
                  </Text>
                ) : null}
                <Text style={styles.chevron}>{'>'}</Text>
              </View>
            </TouchableOpacity>
          ))}
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

  // Date header
  headerBlock: {
    gap: 2,
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
  streakPill: {
    backgroundColor: colors.accentMuted,
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  streakText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '700',
  },
  themeToggle: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
  settingsButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderStack: {
    width: 16,
    height: 14,
    justifyContent: 'space-between',
  },
  sliderTrack: {
    width: 16,
    height: 2,
    borderRadius: 1,
    justifyContent: 'center',
  },
  sliderKnob: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    top: -2,
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

  // Today's sessions section
  sessionSection: {
    gap: 0,
  },
  sectionLabel: {
    ...typography.section,
    marginBottom: spacing.xs,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sessionRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sessionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sessionTypeText: {
    ...typography.body,
    fontSize: 15,
  },
  sessionRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sessionTime: {
    ...typography.bodyMuted,
  },
  sessionDuration: {
    ...typography.meta,
    color: colors.textMuted,
  },
  chevron: {
    color: colors.textMuted,
    fontSize: 14,
  },

  // CTA buttons
  ctaSection: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  activeLockBox: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
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
    borderRadius: 22,
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
  ctaButton: {
    width: '100%',
  },

  emptyState: {
    borderRadius: 16,
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
  });
