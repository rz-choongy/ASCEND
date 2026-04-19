import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Platform, SafeAreaView, StatusBar as NativeStatusBar, StyleSheet, Text, View } from 'react-native';
import { migrate } from './src/db/migrate';
import {
  createSession,
  getActiveSession,
  getSessionById,
  setSessionStatus,
} from './src/domain/sessionStore';
import type { SessionRow, SessionType } from './src/domain/types';
import { ClimbSessionScreen } from './src/screens/ClimbSessionScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { SessionHistoryScreen } from './src/screens/SessionHistoryScreen';
import { StrengthSessionScreen } from './src/screens/StrengthSessionScreen';
import { Button, colors, spacing } from './src/ui';

type AppScreen =
  | { name: 'tabs' }
  | { name: 'strength'; sessionId: string }
  | { name: 'climb'; sessionId: string }
  | { name: 'history' };

export default function App() {
  const [activeSession, setActiveSession] = useState<SessionRow | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [screen, setScreen] = useState<AppScreen>({ name: 'tabs' });
  const safeTop = Platform.OS === 'android' ? NativeStatusBar.currentHeight ?? 0 : 0;

  useEffect(() => {
    migrate();
    setActiveSession(getActiveSession());
  }, []);

  const refresh = () => {
    setActiveSession(getActiveSession());
    setRefreshKey((prev) => prev + 1);
  };

  const navigateToActiveSession = () => {
    const session = getActiveSession();
    if (!session) {
      return;
    }
    if (session.type === 'strength') {
      setScreen({ name: 'strength', sessionId: session.id });
      return;
    }
    setScreen({ name: 'climb', sessionId: session.id });
  };

  const handleStartQuickSession = (type: SessionType) => {
    if (getActiveSession()) {
      navigateToActiveSession();
      return;
    }
    const sessionId = createSession(type);
    refresh();
    if (type === 'strength') {
      setScreen({ name: 'strength', sessionId });
      return;
    }
    setScreen({ name: 'climb', sessionId });
  };

  const handleFinishSession = (sessionId: string) => {
    setSessionStatus(sessionId, 'completed');
    refresh();
    setScreen({ name: 'tabs' });
  };

  const handleOpenHistory = () => {
    setScreen({ name: 'history' });
  };

  const renderTabs = () => (
    <View style={styles.content}>
      <HomeScreen
        activeSession={activeSession}
        onStartQuickSession={handleStartQuickSession}
        onResumeSession={navigateToActiveSession}
      />
    </View>
  );

  return (
    <View style={styles.appShell}>
      {screen.name === 'tabs' ? null : (
        <SafeAreaView style={[styles.sessionHeader, { paddingTop: spacing.xs + safeTop }]}>
          <Button
            label="Back"
            variant="ghost"
            onPress={() => setScreen({ name: 'tabs' })}
            style={styles.backButton}
            textStyle={styles.backButtonText}
          />
        </SafeAreaView>
      )}

      {screen.name === 'tabs' ? renderTabs() : null}
      {screen.name === 'strength' ? (
        getSessionById(screen.sessionId) ? (
          <StrengthSessionScreen
            session={getSessionById(screen.sessionId) as SessionRow}
            onFinish={() => handleFinishSession(screen.sessionId)}
          />
        ) : (
          <View style={styles.content}>
            <Text style={styles.emptyText}>Session not found.</Text>
          </View>
        )
      ) : null}
      {screen.name === 'climb' ? (
        getSessionById(screen.sessionId) ? (
          <ClimbSessionScreen
            session={getSessionById(screen.sessionId) as SessionRow}
            onFinish={() => handleFinishSession(screen.sessionId)}
          />
        ) : (
          <View style={styles.content}>
            <Text style={styles.emptyText}>Session not found.</Text>
          </View>
        )
      ) : null}
      {screen.name === 'history' ? (
        <SessionHistoryScreen
          onStartNewSession={() => {
            setScreen({ name: 'tabs' });
          }}
        />
      ) : null}

      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  appShell: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  sessionHeader: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  backButton: {
    minHeight: 36,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: 11,
    letterSpacing: 1,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 12,
    padding: spacing.sm,
  },
});
