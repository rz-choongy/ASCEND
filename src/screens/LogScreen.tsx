import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { applyClimbEvents } from '../domain/climbLogUtils';
import {
  buildRecentSessions,
  buildWeekActivity,
  lastClimbSessions,
  lastStrengthSessions,
  type ClimbSessionSummary,
  type LastSessions,
  type RecentSession,
  type StrengthSessionSummary,
  type WeekActivity,
} from '../domain/dashboard';
import { addDays, startOfWeek } from '../domain/dateUtils';
import { ensureSelectedClimbGym, getGymById, getSelectedClimbGym } from '../domain/gymStore';
import {
  createSession,
  getActiveSession,
  getCompletedSessions,
  getSessionEvents,
  getSessionStreak,
  getSessionsForDateRange,
  setSessionStatus,
} from '../domain/sessionStore';
import { getShowSessionTimer } from '../domain/settingsStore';
import { applySetEvents } from '../domain/strengthLogUtils';
import { formatWeight } from '../domain/strengthProgress';
import type { SessionRow, SessionType } from '../domain/types';
import { useTabBarClearance } from '../navigation/tabBar';
import type { RootStackParamList, TabParamList } from '../navigation/types';
import { IconButton, SettingsGearIcon, spacing, useTheme } from '../ui';
import type { ThemeColors } from '../ui/tokens/colors';
import type { Typography } from '../ui/tokens/typography';
import { ActiveSessionCard } from './today/ActiveSessionCard';
import { LastSessionCard } from './today/LastSessionCard';
import { RecentSessionsList } from './today/RecentSessionsList';
import { StartCard } from './today/StartCard';
import { WeekCard } from './today/WeekCard';

type LogNavProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Log'>,
  NativeStackNavigationProp<RootStackParamList>
>;

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const RECENT_SHOWN = 4;

function formatHeaderDate(d: Date): string {
  return `${DAY_NAMES[d.getDay()]}, ${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
}

type Dashboard = {
  activeSession: SessionRow | null;
  gymName: string;
  streak: number;
  showTimer: boolean;
  lastType: SessionType | null;
  climb: LastSessions<ClimbSessionSummary> | null;
  strength: LastSessions<StrengthSessionSummary> | null;
  week: WeekActivity;
  recent: RecentSession[];
};

const loadDashboard = (): Dashboard => {
  const completed = getCompletedSessions();
  const now = new Date();
  const weekStart = startOfWeek(now);
  const thisWeek = getSessionsForDateRange(weekStart.getTime(), addDays(weekStart, 7).getTime());
  const strengthHistory = completed.filter((session) => session.type === 'strength');
  return {
    activeSession: getActiveSession(),
    gymName: (getSelectedClimbGym() ?? ensureSelectedClimbGym()).name,
    streak: getSessionStreak(),
    showTimer: getShowSessionTimer(),
    lastType: completed[completed.length - 1]?.type ?? null,
    climb: lastClimbSessions(completed),
    strength: lastStrengthSessions(strengthHistory),
    week: buildWeekActivity(thisWeek, now),
    recent: buildRecentSessions(completed.slice(-RECENT_SHOWN), strengthHistory, RECENT_SHOWN),
  };
};

const SettingsButton = ({ colors, onPress }: { colors: ThemeColors; onPress: () => void }) => (
  <IconButton onPress={onPress} accessibilityLabel="Settings">
    <SettingsGearIcon color={colors.textSecondary} />
  </IconButton>
);

export function LogScreen() {
  const navigation = useNavigation<LogNavProp>();
  const { colors, typography } = useTheme();
  const styles = useMemo(() => createStyles(colors, typography), [colors, typography]);
  const tabBarClearance = useTabBarClearance();

  const [data, setData] = useState<Dashboard | null>(null);
  // Which kind of session the start card is set up for; follows the last one
  // logged until the user picks.
  const [pickedMode, setPickedMode] = useState<SessionType | null>(null);

  useFocusEffect(
    useCallback(() => {
      setData(loadDashboard());
    }, [])
  );

  if (!data) return <SafeAreaView edges={['top']} style={styles.root} />;

  const mode: SessionType = pickedMode ?? data.lastType ?? 'climb';
  const { activeSession, strength } = data;
  const firstExercise = strength?.latest.exercises[0];
  const strengthHint = strength
    ? `Last: ${strength.latest.title ?? DAY_SHORT[new Date(strength.latest.startedAt).getDay()]}`
    : 'Sets, reps and PRs';
  const strengthStartsFrom = firstExercise
    ? `${firstExercise.name} · ${firstExercise.weight === 0 ? 'BW' : `${formatWeight(firstExercise.weight)} kg`} × ${firstExercise.reps}`
    : 'Each exercise opens at your last weight';

  function navigateToSession(type: SessionType, sessionId: string) {
    if (type === 'climb') {
      navigation.navigate('ClimbLogger', { sessionId });
    } else {
      navigation.navigate('StrengthLogger', { sessionId });
    }
  }

  function handleStart() {
    // Re-check for an active session to avoid duplicates
    const existing = getActiveSession();
    if (existing) {
      navigateToSession(existing.type, existing.id);
      return;
    }
    const gym = mode === 'climb' ? ensureSelectedClimbGym() : null;
    const sessionId = createSession(mode, gym ? { gymId: gym.id } : undefined);
    navigateToSession(mode, sessionId);
  }

  // Same rule as the loggers' exit guard: a session with nothing in it is
  // abandoned rather than saved, so it never shows up as an empty workout.
  function handleFinish() {
    if (!activeSession) return;
    const events = getSessionEvents(activeSession.id);
    const logged =
      activeSession.type === 'climb' ? applyClimbEvents(events).length : applySetEvents(events).length;
    setSessionStatus(activeSession.id, logged > 0 ? 'completed' : 'abandoned');
    setData(loadDashboard());
  }

  const activeWhere = activeSession
    ? activeSession.type === 'climb'
      ? (activeSession.gym_id && getGymById(activeSession.gym_id)?.name) || data.gymName
      : activeSession.title?.trim() || ''
    : '';

  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: tabBarClearance }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={styles.date}>{formatHeaderDate(new Date())}</Text>
            <Text style={styles.screenTitle}>Today</Text>
          </View>
          <SettingsButton colors={colors} onPress={() => navigation.navigate('Settings')} />
        </View>

        {activeSession ? (
          <ActiveSessionCard
            session={activeSession}
            where={activeWhere}
            showTimer={data.showTimer}
            onResume={() => navigateToSession(activeSession.type, activeSession.id)}
            onFinish={handleFinish}
          />
        ) : (
          <StartCard
            mode={mode}
            onModeChange={setPickedMode}
            gymName={data.gymName}
            strengthHint={strengthHint}
            strengthStartsFrom={strengthStartsFrom}
            onChangeGym={() => navigation.navigate('GymSelect')}
            onStart={handleStart}
          />
        )}

        <LastSessionCard
          mode={activeSession ? activeSession.type : mode}
          climb={data.climb}
          strength={data.strength}
          onOpen={(sessionId) => navigation.navigate('SessionDetail', { sessionId })}
        />

        <WeekCard week={data.week} streak={data.streak} />

        {data.recent.length > 0 ? (
          <RecentSessionsList
            sessions={data.recent}
            onOpen={(sessionId) => navigation.navigate('SessionDetail', { sessionId })}
            onSeeAll={() => navigation.navigate('Calendar')}
          />
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
      paddingHorizontal: spacing.sm,
      paddingTop: spacing.sm,
      gap: spacing.sm,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      marginBottom: spacing.xxs,
    },
    headerText: {
      gap: 2,
    },
    date: {
      ...typography.section,
    },
    screenTitle: {
      ...typography.display,
    },
  });
