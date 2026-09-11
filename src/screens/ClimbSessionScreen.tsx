import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
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
import { applyClimbEvents } from '../domain/climbLogUtils';
import { formatElapsed } from '../domain/dateUtils';
import {
  appendEvent,
  canChangeSessionGym,
  getSessionById,
  getSessionEvents,
  setSessionStatus,
  setSessionTitle,
} from '../domain/sessionStore';
import { getShowSessionTimer } from '../domain/settingsStore';
import { useClimbSessionLogs } from '../hooks/useClimbSessionLogs';
import type { RootStackScreenProps } from '../navigation/types';
import {
  Button,
  CloseIcon,
  IconButton,
  PressableScale,
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

/**
 * A band this wide (V4-V6 covers three grades) can't be pooled across gyms
 * meaningfully, so logging one asks which grade it actually was. Narrower bands
 * (V4, or V4-V5) log straight through — not worth a tap.
 */
const WIDE_BAND_MIN_SPAN = 2;

const spansMultipleGrades = (grade: GradeOption): boolean =>
  grade.max - grade.min >= WIDE_BAND_MIN_SPAN;

/** Every whole V grade inside a band, e.g. V4-V6 -> [4, 5, 6]. */
const gradesInBand = (grade: GradeOption): number[] => {
  const values: number[] = [];
  for (let value = grade.min; value <= grade.max; value++) values.push(value);
  return values;
};

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
  /** Set while waiting for the climber to pin down a wide band's exact grade. */
  const [pendingLog, setPendingLog] = useState<{
    result: 'SEND' | 'FLASH';
    grade: GradeOption;
  } | null>(null);

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
  // completed it, this is a no-op. An empty session (nothing logged) abandons silently;
  // one with real logs asks first, since 'abandoned' sessions are excluded from every
  // stats query and a mis-tap would otherwise erase logged climbs with no way back.
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      const current = getSessionById(sessionId);
      if (current?.status !== 'active') return;

      const hasUnsavedLogs = applyClimbEvents(getSessionEvents(sessionId)).length > 0;
      if (!hasUnsavedLogs) {
        setSessionStatus(sessionId, 'abandoned');
        return;
      }

      e.preventDefault();
      Alert.alert('Leave this session?', 'You have logged climbs in this session.', [
        { text: 'Keep logging', style: 'cancel' },
        {
          text: 'Finish session',
          onPress: () => {
            setSessionTitle(sessionId, title.trim());
            setSessionStatus(sessionId, 'completed');
            navigation.dispatch(e.data.action);
          },
        },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            setSessionStatus(sessionId, 'abandoned');
            navigation.dispatch(e.data.action);
          },
        },
      ]);
    });
    return unsubscribe;
  }, [navigation, sessionId, title]);

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

  // Plain ref, not state: guards against a fast double-tap firing twice before React
  // re-renders, since appendEvent runs synchronously. Short window — long enough to
  // absorb an accidental double-tap, short enough not to block a deliberate repeat log.
  const isLoggingRef = useRef(false);

  /**
   * Writes the climb. `gradeMin`/`gradeMax` are passed in rather than taken from the
   * grade option so a wide colour band (e.g. Red = V4-V6) can be logged at the exact
   * grade the climber picked, while keeping the gym's own label on the entry.
   */
  const commitLog = (
    result: 'SEND' | 'FLASH',
    grade: GradeOption,
    gradeMin: number,
    gradeMax: number
  ) => {
    if (isLoggingRef.current) return;
    isLoggingRef.current = true;
    setTimeout(() => {
      isLoggingRef.current = false;
    }, 400);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    appendEvent(sessionId, 'CLIMB_LOGGED', {
      gradeId: grade.id,
      gradeLabel: grade.label,
      gradeMin,
      gradeMax,
      gradeColor: grade.color ?? undefined,
      gymId: currentGym?.id,
      result,
    });
    bump();
  };

  const handleLog = (result: 'SEND' | 'FLASH') => {
    if (session?.status !== 'active') return;

    // A band covering three or more V grades is too coarse to pool accurately across
    // gyms, so ask which one it actually was instead of silently storing the range.
    // Opening the picker is idempotent, so it needs no double-tap guard of its own —
    // commitLog owns that, covering both this path and the picker tiles.
    if (spansMultipleGrades(selectedGrade)) {
      void Haptics.selectionAsync();
      setPendingLog({ result, grade: selectedGrade });
      return;
    }

    commitLog(result, selectedGrade, selectedGrade.min, selectedGrade.max);
  };

  const handlePickExactGrade = (value: number) => {
    if (!pendingLog) return;
    const { result, grade } = pendingLog;
    setPendingLog(null);
    commitLog(result, grade, value, value);
  };

  const handleUndo = () => {
    if (session?.status !== 'active') return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
        <IconButton
          variant="bare"
          onPress={() => navigation.navigate('Tabs')}
          accessibilityLabel="Close"
          hitSlop={8}
        >
          <CloseIcon color={colors.textSecondary} />
        </IconButton>
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
        onPress={() => {
          if (!canChangeSessionGym(sessionId)) {
            Alert.alert(
              'Gym locked for this session',
              'Finish this climbing session before switching gyms. Logged climbs keep their original gym and grade colors.'
            );
            return;
          }
          navigation.navigate('GymSelect', { returnToSessionId: sessionId });
        }}
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

      {/* Wide colour bands get pinned to an exact grade before they're written. */}
      <Modal
        transparent
        animationType="fade"
        visible={pendingLog !== null}
        onRequestClose={() => setPendingLog(null)}
      >
        <Pressable style={styles.pickerBackdrop} onPress={() => setPendingLog(null)}>
          <Pressable style={styles.pickerCard} onPress={() => {}}>
            <Text style={styles.pickerEyebrow}>
              {pendingLog?.result === 'FLASH' ? 'Flash' : 'Send'} · {pendingLog?.grade.label}
            </Text>
            <Text style={styles.pickerTitle}>Which grade was it?</Text>
            <Text style={styles.pickerHint}>
              {pendingLog?.grade.label} covers V{pendingLog?.grade.min}–V{pendingLog?.grade.max} at
              this gym. Picking the exact grade keeps your pyramid accurate.
            </Text>

            <View style={styles.pickerGrid}>
              {pendingLog
                ? gradesInBand(pendingLog.grade).map((value) => {
                    const tileColor = pendingLog.grade.color ?? colors.surface;
                    return (
                      <PressableScale
                        key={value}
                        scaleTo={0.94}
                        style={[styles.pickerTile, { backgroundColor: tileColor }]}
                        onPress={() => handlePickExactGrade(value)}
                        accessibilityLabel={`Log as V${value}`}
                      >
                        <Text
                          style={[styles.pickerTileText, { color: getContrastText(tileColor) }]}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                        >
                          V{value}
                        </Text>
                      </PressableScale>
                    );
                  })
                : null}
            </View>

            <Button
              label="Cancel"
              variant="ghost"
              onPress={() => setPendingLog(null)}
              style={styles.pickerCancel}
            />
          </Pressable>
        </Pressable>
      </Modal>
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
    borderRadius: radius.sm,
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
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    padding: spacing.s,
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

  // Grade grid — each tile tinted with its grade's own color, tonal-ring active state
  gradeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xxs,
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
    gap: spacing.xxs,
    marginBottom: spacing.s,
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

  // Exact-grade picker
  pickerBackdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.overlay,
    padding: spacing.md,
  },
  pickerCard: {
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.sm,
  },
  pickerEyebrow: {
    ...typography.meta,
    color: colors.accent,
  },
  pickerTitle: {
    ...typography.title,
    fontSize: 20,
    marginTop: 2,
  },
  pickerHint: {
    ...typography.bodyMuted,
    fontSize: 12.5,
    lineHeight: 17,
    marginTop: spacing.xxs,
  },
  pickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  // Big targets: this sits in the middle of a session, so it has to be fast.
  pickerTile: {
    flexGrow: 1,
    flexBasis: 64,
    minHeight: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerTileText: {
    ...typography.numeric,
    fontSize: 22,
  },
  pickerCancel: {
    marginTop: spacing.xxs,
  },
});
