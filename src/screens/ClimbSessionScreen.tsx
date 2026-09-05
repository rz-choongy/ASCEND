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
import { Button, CloseIcon, PressableScale, getContrastText, spacing, useTheme } from '../ui';
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

  const sessionStats = useMemo(() => {
    if (logs.length === 0) return null;
    let bestLabel = logs[0].gradeLabel;
    let bestValue = -Infinity;
    let sum = 0;
    logs.forEach((log) => {
      if (log.gradeMax > bestValue) {
        bestValue = log.gradeMax;
        bestLabel = log.gradeLabel;
      }
      sum += (log.gradeMin + log.gradeMax) / 2;
    });
    return {
      count: logs.length,
      bestLabel,
      bestValue,
      avg: (sum / logs.length).toFixed(1),
    };
  }, [logs]);

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
      {/* Header — close, gym name, and elapsed timer bound into one row */}
      <View style={styles.headerRow}>
        <PressableScale
          onPress={() => navigation.navigate('Tabs')}
          style={styles.closeBtn}
          accessibilityLabel="Close"
          hitSlop={8}
        >
          <CloseIcon color={colors.textSecondary} />
        </PressableScale>
        <Text style={styles.headerGym} numberOfLines={1}>
          {currentGym?.name ?? 'Boulder gym'}
        </Text>
        {showTimer && session.status === 'active' ? (
          <View style={styles.timerCol}>
            <View style={styles.timerLabelRow}>
              <View style={styles.liveDot} />
              <Text style={styles.timerLabel}>Elapsed</Text>
            </View>
            <Text style={styles.timerValue}>{formatElapsed(elapsedMs)}</Text>
          </View>
        ) : (
          <View style={styles.closeBtn} />
        )}
      </View>

      <View style={styles.titleBlock}>
        <TextInput
          style={styles.titleInput}
          value={title}
          onChangeText={setTitle}
          onBlur={handleSaveTitle}
          onSubmitEditing={handleSaveTitle}
          placeholder="Session name"
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

      {/* Grade grid — each tile tinted with its own grade color (shared with the log
          list below and the Progress grade pyramid), with a tonal amber ring marking
          the active tile. */}
      <View style={styles.gradeGrid}>
        {gradeOptions.map((grade) => {
          const active = selectedGrade.label === grade.label;
          const tileColor = grade.color ?? colors.surface;
          return (
            <PressableScale
              key={grade.id ?? grade.label}
              scaleTo={0.94}
              style={[
                styles.gradeTile,
                { backgroundColor: tileColor },
                active ? styles.gradeTileActive : null,
              ]}
              onPress={() => {
                void Haptics.selectionAsync();
                setSelectedGrade(grade);
              }}
            >
              <Text
                style={[
                  styles.gradeText,
                  { color: getContrastText(tileColor) },
                  active ? styles.gradeTextActive : null,
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {grade.label}
              </Text>
            </PressableScale>
          );
        })}
      </View>

      <View style={styles.actionRow}>
        <Button
          label={`Send ${selectedGrade.label}`}
          variant="primary"
          onPress={() => handleLog('SEND')}
          style={styles.actionButtonPrimary}
        />
        <Button
          label={`Flash ${selectedGrade.label}`}
          variant="secondary"
          onPress={() => handleLog('FLASH')}
          style={styles.actionButtonSecondary}
        />
      </View>

      <View style={styles.panel}>
        <View style={styles.panelHeaderRow}>
          <Text style={styles.panelHd}>This session</Text>
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

        <ScrollView style={styles.logList} contentContainerStyle={styles.logListContent}>
          {recentLogs.length === 0 ? (
            <Text style={styles.emptyText}>No climbs logged yet. Hit Send or Flash to start.</Text>
          ) : null}
          {recentLogs.map((log, index) => {
            const chipColor = log.gradeColor ?? colors.surfaceRaised;
            const isPB = sessionStats != null && log.gradeMax === sessionStats.bestValue;
            const isLatest = index === 0;
            return (
              <View
                key={`${log.gradeLabel}-${log.createdAt}-${index}`}
                style={[styles.logRow, index % 2 === 1 ? styles.logRowAlt : null]}
              >
                <View style={[styles.gradeChip, { backgroundColor: chipColor }]}>
                  <Text
                    style={[styles.gradeChipText, { color: getContrastText(chipColor) }]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {log.gradeLabel}
                  </Text>
                </View>
                {isPB ? (
                  <View style={styles.pbBadge}>
                    <Text style={styles.pbBadgeText}>PB</Text>
                  </View>
                ) : null}
                <Text style={[styles.logTime, isLatest ? styles.logTimeLatest : null]}>
                  {formatElapsed(log.createdAt - session.started_at)}
                  {isLatest ? ' · just now' : ''}
                  {log.result === 'FLASH' ? ' · Flash' : ''}
                </Text>
              </View>
            );
          })}
        </ScrollView>

        {sessionStats ? (
          <View style={styles.statBar}>
            <View style={styles.statNums}>
              <Text style={styles.statNum}>{sessionStats.count}</Text>
              <Text style={styles.statNum}>{sessionStats.bestLabel}</Text>
              <Text style={styles.statNum}>{sessionStats.avg}</Text>
            </View>
            <Text style={styles.statCaps}>sends      best      avg grade</Text>
          </View>
        ) : null}
      </View>

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

  // Header — close / gym name / elapsed timer as one row
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    marginBottom: 10,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerGym: {
    ...typography.title,
    fontSize: 16,
    flex: 1,
    textAlign: 'center',
  },
  timerCol: {
    alignItems: 'flex-end',
    gap: 1,
    minWidth: 64,
  },
  timerLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.success,
  },
  timerLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  timerValue: {
    ...typography.title,
    fontSize: 19,
    fontVariant: ['tabular-nums'],
  },

  titleBlock: {
    marginBottom: spacing.sm,
  },
  titleInput: {
    ...typography.body,
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    minHeight: 30,
    padding: 0,
  },
  gymSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 0,
    backgroundColor: colors.surface,
    padding: 12,
    marginBottom: 14,
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

  // Grade grid — each tile tinted with its grade's own color, tonal-ring active state
  gradeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: spacing.sm,
  },
  gradeTile: {
    width: '22.5%',
    minHeight: 46,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradeTileActive: {
    borderWidth: 3,
    borderColor: colors.accent,
  },
  gradeText: {
    ...typography.body,
    fontSize: 15,
    fontWeight: '600',
  },
  gradeTextActive: {
    fontWeight: '700',
  },

  actionRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  actionButtonPrimary: {
    flex: 1.4,
  },
  actionButtonSecondary: {
    flex: 1,
  },

  // Session panel
  panel: {
    flex: 1,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  panelHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingTop: 10,
    paddingBottom: 4,
  },
  panelHd: {
    ...typography.section,
  },
  undoButton: {
    minHeight: 32,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  undoText: {
    fontSize: 10,
  },
  logList: {
    flex: 1,
  },
  logListContent: {
    paddingBottom: spacing.xs,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  logRowAlt: {
    backgroundColor: colors.surfaceAlt,
  },
  gradeChip: {
    ...typography.numeric,
    minWidth: 36,
    height: 26,
    maxWidth: 64,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradeChipText: {
    ...typography.numeric,
    fontSize: 14,
  },
  pbBadge: {
    backgroundColor: colors.danger,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  pbBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textInverse,
    letterSpacing: 0.4,
  },
  logTime: {
    ...typography.bodyMuted,
    fontSize: 13,
    marginLeft: 'auto',
    textAlign: 'right',
  },
  logTimeLatest: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 12,
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
  },

  statBar: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surfaceRaised,
  },
  statNums: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 18,
    marginBottom: 4,
  },
  statNum: {
    ...typography.numeric,
    fontSize: 24,
  },
  statCaps: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },

  finishBar: {
    paddingTop: spacing.xs,
  },
  finishButton: {
    width: '100%',
  },
});
