import { useCallback, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { formatLocalDate } from '../domain/dateUtils';
import { createSession, getActiveSession, getSessionsForDate } from '../domain/sessionStore';
import type { SessionRow, SessionType } from '../domain/types';
import type { RootStackParamList, TabParamList } from '../navigation/types';
import { Button, Card, colors, spacing } from '../ui';
import { typography } from '../ui/tokens/typography';

type LogNavProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Log'>,
  NativeStackNavigationProp<RootStackParamList>
>;

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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
  return type === 'climb' ? 'Climbing' : 'Gym';
}

export function LogScreen() {
  const navigation = useNavigation<LogNavProp>();

  const today = new Date();
  const todayStr = formatLocalDate(today);

  const [activeSession, setActiveSession] = useState<SessionRow | null>(null);
  const [todaySessions, setTodaySessions] = useState<SessionRow[]>([]);

  useFocusEffect(
    useCallback(() => {
      setActiveSession(getActiveSession());
      setTodaySessions(getSessionsForDate(todayStr));
    }, [todayStr])
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
    const sessionId = createSession(type);
    navigateToSession(type, sessionId);
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Date header */}
      <Text style={styles.dateHeader}>{formatHeaderDate(today)}</Text>

      {/* Active session banner */}
      {activeSession ? (
        <Card style={styles.banner}>
          <View style={styles.bannerInner}>
            <View style={styles.bannerDot} />
            <View style={styles.bannerTextCol}>
              <Text style={styles.bannerLabel}>In progress</Text>
              <Text style={styles.bannerType}>
                {sessionTypeLabel(activeSession.type)}
              </Text>
            </View>
            <Button
              label="Resume"
              variant="primary"
              onPress={handleResume}
              style={styles.resumeButton}
            />
          </View>
        </Card>
      ) : null}

      {/* Today's sessions */}
      {todaySessions.length > 0 ? (
        <View style={styles.sessionSection}>
          <Text style={styles.sectionLabel}>Today's sessions</Text>
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
                  {sessionTypeLabel(session.type)}
                </Text>
              </View>
              <View style={styles.sessionRowRight}>
                <Text style={styles.sessionTime}>
                  {formatTime(session.started_at)}
                </Text>
                <Text style={styles.chevron}>{'>'}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      {/* Quick-log CTAs */}
      <View style={styles.ctaSection}>
        <Button
          label="Log Climbing"
          variant="primary"
          onPress={() => handleLog('climb')}
          style={styles.ctaButton}
        />
        <Button
          label="Log Gym"
          variant="secondary"
          onPress={() => handleLog('strength')}
          style={styles.ctaButton}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },

  // Date header
  dateHeader: {
    ...typography.section,
    marginBottom: spacing.xs,
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
    minWidth: 90,
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
  chevron: {
    color: colors.textMuted,
    fontSize: 14,
  },

  // CTA buttons
  ctaSection: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  ctaButton: {
    width: '100%',
  },
});
