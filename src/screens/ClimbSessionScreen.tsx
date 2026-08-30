import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from '@react-navigation/native';
import {
  defaultOptionsForType,
  ensureSelectedClimbGym,
  getGradeOptionsForGym,
  getGyms,
  getSelectedClimbGym,
} from '../domain/gymStore';
import { formatElapsed } from '../domain/dateUtils';
import { appendEvent, getSessionById, setSessionStatus, setSessionTitle } from '../domain/sessionStore';
import { getShowSessionTimer } from '../domain/settingsStore';
import { useClimbSessionLogs } from '../hooks/useClimbSessionLogs';
import type { RootStackScreenProps } from '../navigation/types';
import {
  Button,
  Divider,
  PressableScale,
  ScreenHeader,
  getContrastText,
  radius,
  spacing,
  useTheme,
} from '../ui';
import type { ThemeColors } from '../ui/tokens/colors';
import type { Typography } from '../ui/tokens/typography';

type GradeOption = {
  id?: string;
  label: string;
  min: number;
  max: number;
  color?: string | null;
};

type GymLike = {
  id: string;
  name: string;
};

type ClimbSessionScreenProps = RootStackScreenProps<'ClimbLogger'>;

const normalizeGradeOption = (grade: unknown): GradeOption | null => {
  if (!grade || typeof grade !== 'object') return null;
  const value = grade as {
    id?: unknown;
    label?: unknown;
    gradeMin?: unknown;
    gradeMax?: unknown;
    grade_min?: unknown;
    grade_max?: unknown;
    min?: unknown;
    max?: unknown;
    colorHex?: unknown;
    color_hex?: unknown;
    color?: unknown;
  };
  const min = value.gradeMin ?? value.grade_min ?? value.min;
  const max = value.gradeMax ?? value.grade_max ?? value.max;
  if (typeof value.label !== 'string' || typeof min !== 'number' || typeof max !== 'number') {
    return null;
  }
  const color = value.colorHex ?? value.color_hex ?? value.color;
  return {
    id: typeof value.id === 'string' ? value.id : undefined,
    label: value.label,
    min,
    max,
    color: typeof color === 'string' ? color : null,
  };
};

const GRADE_OPTIONS: GradeOption[] = defaultOptionsForType('v_scale')
  .map(normalizeGradeOption)
  .filter((grade): grade is GradeOption => grade !== null);

const normalizeGym = (gym: unknown): GymLike | null => {
  if (!gym || typeof gym !== 'object') return null;
  const value = gym as { id?: unknown; name?: unknown };
  if (typeof value.id !== 'string' || typeof value.name !== 'string') return null;
  return { id: value.id, name: value.name };
};

const loadGrades = (gymId: string | null): GradeOption[] => {
  if (!gymId) return GRADE_OPTIONS;
  const grades = getGradeOptionsForGym(gymId)
    .map(normalizeGradeOption)
    .filter((grade): grade is GradeOption => grade !== null);
  return grades.length > 0 ? grades : GRADE_OPTIONS;
};

export const ClimbSessionScreen = ({ route, navigation }: ClimbSessionScreenProps) => {
  const { colors, typography } = useTheme();
  const styles = useMemo(() => createStyles(colors, typography), [colors, typography]);
  const { sessionId } = route.params;

  const [session, setSession] = useState(() => getSessionById(sessionId));
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentGym, setCurrentGym] = useState<GymLike | null>(null);
  const [gradeOptions, setGradeOptions] = useState<GradeOption[]>(GRADE_OPTIONS);
  const [selectedGrade, setSelectedGrade] = useState<GradeOption>(GRADE_OPTIONS[0]);
  const [title, setTitle] = useState('');
  const [showTimer, setShowTimer] = useState(true);
  const [now, setNow] = useState(() => Date.now());

  const logs = useClimbSessionLogs(sessionId, refreshKey);
  const recentLogs = useMemo(() => logs.slice().reverse(), [logs]);

  useFocusEffect(
    useCallback(() => {
      const refreshedSession = getSessionById(sessionId);
      setSession(refreshedSession);
      setTitle((prev) => prev || refreshedSession?.title || '');
      setShowTimer(getShowSessionTimer());
      setNow(Date.now());
      const routeGymId = route.params.gymId;
      const sessionGymId = refreshedSession?.gym_id ?? null;
      const selected = normalizeGym(getSelectedClimbGym() ?? ensureSelectedClimbGym());
      const gyms = getGyms().map(normalizeGym).filter((gym): gym is GymLike => gym !== null);
      const gym =
        (routeGymId ? gyms.find((item) => item.id === routeGymId) : null) ??
        (sessionGymId ? gyms.find((item) => item.id === sessionGymId) : null) ??
        selected;
      const grades = loadGrades(gym?.id ?? null);

      setCurrentGym(gym);
      setGradeOptions(grades);
      setSelectedGrade((previous) => {
        return (
          grades.find((grade) => grade.id === previous.id || grade.label === previous.label) ??
          grades[0] ??
          GRADE_OPTIONS[0]
        );
      });
    }, [route.params.gymId, sessionId])
  );

  // Any way of leaving this screen — header back, Android hardware back, swipe, or the
  // Done flow above — should never leave a session stuck 'active' forever. If Done already
  // completed it, this is a no-op; otherwise it silently saves as abandoned.
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', () => {
      const current = getSessionById(sessionId);
      if (current?.status === 'active') {
        setSessionStatus(sessionId, 'abandoned');
      }
    });
    return unsubscribe;
  }, [navigation, sessionId]);

  // Ticks the live session-length display; only runs while there's something to show.
  useEffect(() => {
    if (!showTimer || session?.status !== 'active') return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [showTimer, session?.status]);

  const bump = () => setRefreshKey((k) => k + 1);

  const handleSaveTitle = () => {
    setSessionTitle(sessionId, title.trim());
  };

  const handleLog = (result: 'SEND' | 'FLASH') => {
    if (session?.status !== 'active') return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    appendEvent(sessionId, 'CLIMB_LOGGED', {
      gradeId: selectedGrade.id,
      gradeLabel: selectedGrade.label,
      gradeMin: selectedGrade.min,
      gradeMax: selectedGrade.max,
      gradeColor: selectedGrade.color ?? undefined,
      gymId: currentGym?.id,
      result,
    });
    bump();
  };

  const handleUndo = () => {
    if (session?.status !== 'active') return;
    appendEvent(sessionId, 'CLIMB_UNDONE', { at: Date.now() });
    bump();
  };

  const handleDone = () => {
    if (session?.status !== 'active') {
      navigation.navigate('Tabs');
      return;
    }
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSessionTitle(sessionId, title.trim());
    setSessionStatus(sessionId, 'completed');
    navigation.navigate('Tabs');
  };

  if (!session) {
    return (
      <SafeAreaView edges={['top']} style={styles.screen}>
        <Text style={{ color: colors.textMuted, padding: 16 }}>Session not found.</Text>
      </SafeAreaView>
    );
  }

  const hasLogs = recentLogs.length > 0;
  const elapsedMs = Math.max(0, now - session.started_at);

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <ScreenHeader title="Log climb" onClose={() => navigation.navigate('Tabs')} />

      {showTimer && session.status === 'active' ? (
        <View style={styles.timerCard}>
          <Text style={styles.timerLabel}>Session length</Text>
          <Text style={styles.timerValue}>{formatElapsed(elapsedMs)}</Text>
        </View>
      ) : null}

      <View style={styles.titleBlock}>
        <Text style={styles.titleLabel}>Session name</Text>
        <TextInput
          style={styles.titleInput}
          value={title}
          onChangeText={setTitle}
          onBlur={handleSaveTitle}
          onSubmitEditing={handleSaveTitle}
          placeholder="Climbing session"
          placeholderTextColor={colors.textMuted}
          returnKeyType="done"
        />
      </View>

      <Pressable
        style={styles.gymSelector}
        onPress={() => navigation.navigate('GymSelect', { returnToSessionId: sessionId })}
      >
        <View>
          <Text style={styles.gymSelectorLabel}>Climb grades</Text>
          <Text style={styles.gymSelectorName}>{currentGym?.name ?? 'Default V-Scale'}</Text>
        </View>
        <Text style={styles.gymSelectorAction}>Change</Text>
      </Pressable>

      <Text style={styles.sectionLabel}>Grade</Text>
      <View style={styles.gradeGrid}>
        {gradeOptions.map((grade, index) => {
          const color = grade.color ?? colors.gradePalette[index % colors.gradePalette.length];
          const active = selectedGrade.label === grade.label;
          return (
            <PressableScale
              key={grade.id ?? grade.label}
              scaleTo={0.92}
              style={[
                styles.gradeTile,
                { backgroundColor: color },
                active ? styles.gradeTileActive : null,
              ]}
              onPress={() => {
                void Haptics.selectionAsync();
                setSelectedGrade(grade);
              }}
            >
              <Text style={[styles.gradeText, { color: getContrastText(color) }]}>{grade.label}</Text>
            </PressableScale>
          );
        })}
      </View>

      <View style={styles.actionRow}>
        <Button label="Send" variant="success" onPress={() => handleLog('SEND')} style={styles.actionButton} />
        <Button label="Flash" variant="warning" onPress={() => handleLog('FLASH')} style={styles.actionButton} />
      </View>

      <View style={styles.logHeaderRow}>
        <Text style={styles.sectionLabel}>
          Logged{recentLogs.length > 0 ? ` (${recentLogs.length})` : ''}
        </Text>
        {hasLogs ? (
          <Button
            label="Undo"
            variant="ghost"
            onPress={handleUndo}
            style={styles.undoButton}
            textStyle={styles.undoText}
          />
        ) : null}
      </View>
      <Divider style={styles.divider} />

      <ScrollView style={styles.logList} contentContainerStyle={styles.logListContent}>
        {recentLogs.length === 0 ? (
          <Text style={styles.emptyText}>No climbs logged yet. Hit Send or Flash to start.</Text>
        ) : null}
        {recentLogs.map((log, index) => {
          const gradeColor = log.gradeColor;
          return (
            <View key={`${log.gradeLabel}-${log.createdAt}-${index}`} style={styles.logRow}>
              <View
                style={[
                  styles.logAccent,
                  log.result === 'SEND' ? styles.logAccentSend : styles.logAccentFlash,
                  gradeColor ? { backgroundColor: gradeColor } : null,
                ]}
              />
              <View style={styles.logBody}>
                <Text style={styles.logGrade}>{log.gradeLabel}</Text>
                <Text
                  style={[
                    styles.logResult,
                    log.result === 'SEND' ? styles.logResultSend : styles.logResultFlash,
                  ]}
                >
                  {log.result}
                </Text>
              </View>
              <Text style={styles.logTime}>{formatElapsed(log.createdAt - session.started_at)}</Text>
            </View>
          );
        })}
      </ScrollView>

      {hasLogs ? (
        <View style={styles.finishBar}>
          <Button label="Done" onPress={handleDone} style={styles.finishButton} />
        </View>
      ) : null}
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  timerCard: {
    backgroundColor: colors.accentMuted,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.accentSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginBottom: spacing.sm,
  },
  timerLabel: {
    ...typography.meta,
    color: colors.accent,
  },
  timerValue: {
    color: colors.textPrimary,
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  titleBlock: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginBottom: spacing.sm,
  },
  titleLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  titleInput: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    minHeight: 30,
    padding: 0,
  },
  gymSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  gymSelectorLabel: {
    ...typography.meta,
    color: colors.textMuted,
  },
  gymSelectorName: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  gymSelectorAction: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sectionLabel: {
    ...typography.section,
    marginBottom: spacing.xs,
  },
  gradeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  gradeTile: {
    width: '22%',
    minHeight: 64,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  gradeTileActive: {
    borderColor: colors.accent,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 10,
    elevation: 4,
  },
  gradeText: {
    fontSize: 15,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  logHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  undoButton: {
    minHeight: 36,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  undoText: {
    fontSize: 10,
  },
  divider: {
    marginVertical: spacing.xs,
  },
  logList: {
    flex: 1,
  },
  logListContent: {
    paddingBottom: spacing.lg,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginBottom: spacing.xs,
  },
  logAccent: {
    width: 4,
    height: '70%',
    borderRadius: radius.pill,
    marginRight: 12,
  },
  logAccentSend: {
    backgroundColor: colors.success,
  },
  logAccentFlash: {
    backgroundColor: colors.warning,
  },
  logBody: {
    flex: 1,
  },
  logGrade: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  logResult: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  logResultSend: {
    color: colors.success,
  },
  logResultFlash: {
    color: colors.warning,
  },
  logTime: {
    color: colors.textMuted,
    fontSize: 11,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 12,
  },
  finishBar: {
    paddingTop: spacing.xs,
  },
  finishButton: {
    width: '100%',
  },
});
