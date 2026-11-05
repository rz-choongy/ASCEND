import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
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
  gymDisplayNameById,
  isUnnamedDefaultGym,
} from '../domain/gymStore';
import {
  applyClimbEvents,
  findSessionHighIndex,
  formatVGrade,
  isGradeBand,
  loggedClimbVGrade,
} from '../domain/climbLogUtils';
import { formatElapsed } from '../domain/dateUtils';
import {
  appendEvent,
  canChangeSessionGym,
  deleteEmptySession,
  getCompletedSessions,
  getSessionById,
  getSessionEvents,
  setSessionStatus,
  setSessionTitle,
} from '../domain/sessionStore';
import { finishSession } from './confirmEndTime';
import {
  getShowLoggedVGrade,
  getShowSessionTimer,
  getShowTileVRange,
} from '../domain/settingsStore';
import { useClimbSessionLogs } from '../hooks/useClimbSessionLogs';
import type { RootStackScreenProps } from '../navigation/types';
import {
  BoltIcon,
  Button,
  Card,
  CloseIcon,
  GradeChip,
  IconButton,
  PressableScale,
  SessionStrip,
  StatRow,
  font,
  radius,
  showDialog,
  spacing,
  StarIcon,
  useTheme,
  type Shadows,
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

/** What an unnamed climb session is called everywhere else (history, detail). */
const DEFAULT_TITLE = 'Climbing session';

const GRADE_OPTIONS: GradeOption[] = defaultOptionsForType('v_scale')
  .map(normalizeGradeOption)
  .filter((grade): grade is GradeOption => grade !== null);

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
  const { colors, typography, shadows } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, typography, shadows),
    [colors, typography, shadows]
  );
  const { sessionId } = route.params;

  const [session, setSession] = useState(() => getSessionById(sessionId));
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentGym, setCurrentGym] = useState<GymLike | null>(null);
  const currentGymName = useMemo(
    () => (currentGym && !isUnnamedDefaultGym(currentGym) ? (gymDisplayNameById(currentGym.id) ?? currentGym.name) : null),
    [currentGym]
  );
  const [gradeOptions, setGradeOptions] = useState<GradeOption[]>(GRADE_OPTIONS);
  const [selectedGrade, setSelectedGrade] = useState<GradeOption>(GRADE_OPTIONS[0]);
  const [title, setTitle] = useState('');
  const [climbName, setClimbName] = useState('');
  const [showTimer, setShowTimer] = useState(true);
  const [showLoggedVGrade, setShowLoggedVGrade] = useState(true);
  const [showTileVRange, setShowTileVRange] = useState(true);
  const [now, setNow] = useState(() => Date.now());
  /** Set while waiting for the climber to pin down a wide band's exact grade. */
  const [pendingLog, setPendingLog] = useState<{
    result: 'SEND' | 'FLASH';
    grade: GradeOption;
  } | null>(null);

  const logs = useClimbSessionLogs(sessionId, refreshKey);
  const recentLogs = useMemo(() => logs.slice().reverse(), [logs]);

  // Best grade from other completed sessions in the last 30 days: the bar a climb here has to
  // beat to earn the "30-day high" badge. Read once -- it can't change while this one is open.
  const priorMonthBest = useMemo(() => {
    const since = Date.now() - 30 * 86_400_000;
    let best: number | null = null;
    getCompletedSessions('climb')
      .filter((row) => row.id !== sessionId && row.started_at >= since)
      .forEach((row) => {
        applyClimbEvents(getSessionEvents(row.id)).forEach((log) => {
          if (best == null || log.gradeMax > best) best = log.gradeMax;
        });
      });
    return best;
  }, [sessionId]);

  const sessionHighEventId = useMemo(() => {
    const index = findSessionHighIndex(logs, priorMonthBest);
    return index == null ? null : logs[index].eventId;
  }, [logs, priorMonthBest]);

  const sessionStats = useMemo(() => {
    if (logs.length === 0) return null;
    let bestLabel = logs[0].gradeLabel;
    let bestColor: string | null = logs[0].gradeColor ?? null;
    let bestValue = -Infinity;
    let sum = 0;
    let flashes = 0;
    logs.forEach((log) => {
      if (log.gradeMax > bestValue) {
        bestValue = log.gradeMax;
        bestLabel = log.gradeLabel;
        bestColor = log.gradeColor ?? null;
      }
      sum += (log.gradeMin + log.gradeMax) / 2;
      if (log.result === 'FLASH') flashes += 1;
    });
    return {
      count: logs.length,
      bestLabel,
      bestColor,
      flashes,
      // Shown as a grade ("V4"), never a decimal.
      avg: `V${Math.round(sum / logs.length)}`,
    };
  }, [logs]);

  useFocusEffect(
    useCallback(() => {
      const refreshedSession = getSessionById(sessionId);
      setSession(refreshedSession);
      setTitle((prev) => prev || refreshedSession?.title || '');
      setShowTimer(getShowSessionTimer());
      setShowLoggedVGrade(getShowLoggedVGrade());
      setShowTileVRange(getShowTileVRange());
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
  // completed it, this is a no-op. Both cases now ask first: an empty session (nothing
  // logged) offers Delete/Keep going, while one with real logs offers Keep logging/Finish
  // session/Discard, since 'abandoned' sessions are excluded from every stats query and a
  // mis-tap would otherwise erase logged climbs with no way back.
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      const current = getSessionById(sessionId);
      if (current?.status !== 'active') return;

      const hasUnsavedLogs = applyClimbEvents(getSessionEvents(sessionId)).length > 0;
      if (!hasUnsavedLogs) {
        e.preventDefault();
        showDialog('Discard this session?', "You haven't logged anything yet.", [
          { text: 'Keep going', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              deleteEmptySession(sessionId);
              navigation.dispatch(e.data.action);
            },
          },
        ]);
        return;
      }

      e.preventDefault();
      showDialog('Leave this session?', 'You have logged climbs in this session.', [
        { text: 'Keep logging', style: 'cancel' },
        {
          text: 'Finish session',
          onPress: () => {
            setSessionTitle(sessionId, title.trim());
            finishSession(sessionId, () => navigation.dispatch(e.data.action));
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
      climbName: climbName.trim() || null,
    });
    setClimbName('');
    bump();
  };

  const handleLog = (result: 'SEND' | 'FLASH') => {
    if (session?.status !== 'active') return;

    // Any band wider than one grade pools with nothing else in the pyramid, so ask which
    // grade it actually was rather than storing the range and making Settings refine it later.
    // Opening the picker is idempotent, so it needs no double-tap guard of its own —
    // commitLog owns that, covering both this path and the picker tiles.
    if (isGradeBand(selectedGrade.min, selectedGrade.max)) {
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
      navigation.popTo('Tabs');
      return;
    }
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSessionTitle(sessionId, title.trim());
    // popTo goes back to the existing tabs; navigate would stack a second copy on top.
    finishSession(sessionId, () => navigation.popTo('Tabs'));
  };

  if (!session) {
    return (
      <SafeAreaView edges={['top']} style={styles.screen}>
        <Text style={{ ...font('regular'), color: colors.textMuted, padding: spacing.sm }}>Session not found.</Text>
      </SafeAreaView>
    );
  }

  const hasLogs = recentLogs.length > 0;
  const gymLocked = session.status === 'active' && !canChangeSessionGym(sessionId);
  const elapsedMs = Math.max(0, now - session.started_at);

  const stripColors = logs.map((log) => log.gradeColor ?? colors.chartQuiet);

  return (
    // Bottom edge too: Done sits at the very bottom and must clear the home indicator.
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
      {/* Header: close, the session's name (tap to rename) with the gym under it, elapsed time.
          Same pattern as the strength logger. */}
      <View style={styles.headerRow}>
        <IconButton onPress={() => navigation.navigate('Tabs')} accessibilityLabel="Close">
          <CloseIcon size={16} color={colors.textPrimary} />
        </IconButton>
        <View style={styles.titleBlock}>
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={setTitle}
            onBlur={handleSaveTitle}
            onSubmitEditing={handleSaveTitle}
            // The default name reads as the title, not as a disabled field.
            placeholder={DEFAULT_TITLE}
            placeholderTextColor={colors.textPrimary}
            returnKeyType="done"
            accessibilityLabel="Session name"
            numberOfLines={1}
          />
          <Pressable
            style={styles.gymSelector}
            disabled={gymLocked}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel={`Climb grades: ${currentGymName ?? 'No gym picked'}${gymLocked ? ', locked' : ', change'}`}
            onPress={() => navigation.navigate('GymSelect', { returnToSessionId: sessionId })}
          >
            <Text style={styles.gymSelectorName} numberOfLines={1}>
              {currentGymName ?? 'No gym picked'}
            </Text>
            {/* Once a climb is logged the gym is fixed, so say so instead of offering a dead button. */}
            {gymLocked ? (
              <Text style={styles.gymSelectorLocked}>Locked</Text>
            ) : (
              <Text style={styles.gymSelectorAction}>Change</Text>
            )}
          </Pressable>
        </View>
        {showTimer && session.status === 'active' ? (
          <View style={styles.timer} accessibilityLabel={`Elapsed ${formatElapsed(elapsedMs)}`}>
            <View style={styles.liveDot} />
            <Text style={styles.timerValue}>{formatElapsed(elapsedMs)}</Text>
          </View>
        ) : null}
      </View>

      {/* Session so far: one stat row, then the climbs as a strip of tape colours. */}
      <Card padded="compact" style={styles.summaryCard}>
        <StatRow
          bare
          items={[
            {
              label: 'Sends',
              value: `${sessionStats?.count ?? 0}`,
              sub: sessionStats ? `${sessionStats.flashes} flashed` : 'none yet',
            },
            {
              label: 'Best',
              value: sessionStats?.bestLabel ?? '–',
              dotColor: sessionStats?.bestColor ?? undefined,
            },
            { label: 'Avg grade', value: sessionStats?.avg ?? '–' },
          ]}
        />
        {stripColors.length > 0 ? (
          <>
            <SessionStrip colors={stripColors} style={styles.summaryStrip} />
            <Text style={styles.summaryCaption}>Each climb in order, by tape colour</Text>
          </>
        ) : null}
      </Card>

      {/* Grade grid — neutral tiles, the big label in the display face, a thin tape-colour
          edge for the gym's colour, and an ink ring on the picked one. */}
      <Card style={styles.gradeCard}>
        <ScrollView
          style={[styles.gradeGridWrap, gradeOptions.length > 12 ? styles.gradeGridScroll : null]}
          scrollEnabled={gradeOptions.length > 12}
          contentContainerStyle={styles.gradeGrid}
          nestedScrollEnabled
        >
          {gradeOptions.map((grade) => {
            // Match by id so two grades sharing a label can't both light up.
            const active =
              selectedGrade.id && grade.id ? selectedGrade.id === grade.id : selectedGrade.label === grade.label;
            // Colour/number-graded gyms: show the V range under the gym's own label so you know
            // what you're picking. V-scale labels already say it.
            const vRange = showTileVRange ? formatVGrade(grade.label, grade.min, grade.max) : null;
            return (
              <PressableScale
                key={grade.id ?? grade.label}
                scaleTo={0.94}
                accessibilityState={{ selected: !!active }}
                accessibilityLabel={[grade.label, vRange].filter(Boolean).join(', ')}
                style={[styles.gradeTile, active ? styles.gradeTileActive : null]}
                onPress={() => {
                  void Haptics.selectionAsync();
                  setSelectedGrade(grade);
                }}
              >
                <Text style={styles.gradeText} numberOfLines={1} adjustsFontSizeToFit>
                  {grade.label}
                </Text>
                {vRange ? (
                  <Text style={styles.gradeRangeText} numberOfLines={1} adjustsFontSizeToFit>
                    {vRange}
                  </Text>
                ) : null}
                {grade.color ? <View style={[styles.gradeEdge, { backgroundColor: grade.color }]} /> : null}
              </PressableScale>
            );
          })}
        </ScrollView>
      </Card>

      <TextInput
        style={styles.climbNameInput}
        value={climbName}
        onChangeText={setClimbName}
        placeholder="Name this climb (optional)"
        placeholderTextColor={colors.textMuted}
        returnKeyType="done"
      />

      {/* Send is the everyday log, so it's the filled primary; Flash sits beside it outlined. */}
      <View style={styles.actionRow}>
        <Button
          label={`Send ${selectedGrade.label}`}
          variant="primary"
          onPress={() => handleLog('SEND')}
          style={styles.actionButton}
        />
        <Button
          label={`Flash ${selectedGrade.label}`}
          variant="secondary"
          icon={(color) => <BoltIcon size={16} color={color} filled />}
          onPress={() => handleLog('FLASH')}
          style={styles.actionButton}
        />
      </View>

      <Card style={styles.panel}>
        <View style={styles.panelHeaderRow}>
          <Text style={styles.panelHd}>This session</Text>
          {hasLogs ? (
            <Button
              label="Undo"
              variant="plain"
              onPress={handleUndo}
              style={styles.undoButton}
              textStyle={styles.undoText}
            />
          ) : null}
        </View>

        <ScrollView style={styles.logList} contentContainerStyle={styles.logListContent}>
          {recentLogs.length === 0 ? (
            <Text style={styles.emptyText}>No climbs logged yet. Pick a grade, then Send or Flash.</Text>
          ) : null}
          {recentLogs.map((log, index) => {
            const isSessionHigh = log.eventId === sessionHighEventId;
            const isLatest = index === 0;
            const elapsed = formatElapsed(log.createdAt - session.started_at);
            // Colour/number-graded gyms: the chip only carries the gym's own label (e.g. "5"), so
            // show the V grade beside it -- the exact pick if there was one, else the band.
            // The stored range is the band that applied when it was logged; the gym's current
            // option may have been edited since.
            const pinnedGrade = showLoggedVGrade ? loggedClimbVGrade(log, null) : null;
            return (
              <View
                key={log.eventId}
                accessible
                accessibilityLabel={[
                  log.gradeLabel,
                  pinnedGrade,
                  log.result === 'FLASH' ? 'flash' : 'send',
                  isSessionHigh ? '30-day high' : null,
                  elapsed,
                  log.climbName,
                ]
                  .filter(Boolean)
                  .join(', ')}
                style={styles.logRow}
              >
                <GradeChip
                  variant="dot"
                  label={log.gradeLabel}
                  color={log.gradeColor ?? colors.chartQuiet}
                  style={styles.logChip}
                />
                {showLoggedVGrade ? (
                  <Text style={styles.pinnedGrade} numberOfLines={1}>
                    {pinnedGrade ?? ''}
                  </Text>
                ) : null}
                <View style={styles.flashMark}>
                  {log.result === 'FLASH' ? <BoltIcon size={14} color={colors.accentInk} filled /> : null}
                </View>
                {isSessionHigh ? (
                  <View style={styles.highBadge}>
                    <StarIcon size={11} color={colors.accentInk} strokeWidth={2.2} filled />
                    <Text style={styles.highBadgeText}>30-day high</Text>
                  </View>
                ) : null}
                <Text
                  style={[styles.logTime, isLatest ? styles.logTimeLatest : null]}
                  numberOfLines={1}
                >
                  {elapsed}
                  {isLatest ? ' · just now' : ''}
                  {log.climbName ? ` · ${log.climbName}` : ''}
                </Text>
              </View>
            );
          })}
        </ScrollView>
      </Card>

      {hasLogs ? (
        <View style={styles.finishBar}>
          <Button label="Done" variant="secondary" onPress={handleDone} style={styles.finishButton} />
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
                ? gradesInBand(pendingLog.grade).map((value) => (
                    <PressableScale
                      key={value}
                      scaleTo={0.94}
                      style={styles.pickerTile}
                      onPress={() => handlePickExactGrade(value)}
                      accessibilityLabel={`Log as V${value}`}
                    >
                      <Text style={styles.pickerTileText} numberOfLines={1} adjustsFontSizeToFit>
                        V{value}
                      </Text>
                      {pendingLog.grade.color ? (
                        <View style={[styles.gradeEdge, { backgroundColor: pendingLog.grade.color }]} />
                      ) : null}
                    </PressableScale>
                  ))
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

const createStyles = (colors: ThemeColors, typography: Typography, shadows: Shadows) =>
  StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.s,
    paddingTop: spacing.xs,
    // Added to the bottom safe-area inset, so Done clears the gesture bar.
    paddingBottom: spacing.s,
  },

  // Header row: close / session name with the gym under it / elapsed time.
  // Mirrors StrengthSessionScreen so both loggers open the same way.
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    marginBottom: spacing.xs,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  titleInput: {
    ...typography.display,
    fontSize: 22,
    lineHeight: 32,
    minHeight: 32,
    padding: 0,
  },
  gymSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 24,
  },
  gymSelectorName: {
    ...typography.meta,
    flexShrink: 1,
  },
  gymSelectorLocked: {
    ...typography.meta,
    color: colors.textMuted,
  },
  gymSelectorAction: {
    ...typography.meta,
    ...font('semibold'),
    color: colors.textPrimary,
    textDecorationLine: 'underline',
  },
  timer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.s,
    minHeight: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.fill,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
  timerValue: {
    ...typography.mono,
    color: colors.textPrimary,
  },

  summaryCard: {
    marginBottom: spacing.xs,
  },
  summaryStrip: {
    marginTop: spacing.xs,
  },
  summaryCaption: {
    ...typography.meta,
    color: colors.textMuted,
    marginTop: 6,
  },

  // Grade grid — neutral tiles inside a card, tape colour as a thin bottom edge.
  gradeCard: {
    padding: 6,
    marginBottom: spacing.xs,
  },
  gradeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  gradeGridWrap: {
    flexGrow: 0,
  },
  // Big grade lists scroll inside about three and a half rows, so the session log keeps its room.
  gradeGridScroll: {
    maxHeight: 200,
  },
  gradeTile: {
    // Four per row: 4 x 23.5% + 3 x 6px gap fills the row at any phone width.
    width: '23.5%',
    minHeight: 54,
    borderRadius: radius.md,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  gradeTileActive: {
    borderColor: colors.textPrimary,
  },
  gradeText: {
    ...typography.numeric,
    fontSize: 22,
    lineHeight: 28,
  },
  gradeRangeText: {
    ...typography.meta,
    lineHeight: 15,
    fontVariant: ['tabular-nums'],
  },
  gradeEdge: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 4,
  },

  climbNameInput: {
    ...typography.body,
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.s,
    minHeight: 44,
    marginBottom: spacing.xs,
  },

  actionRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  actionButton: {
    flex: 1,
    minHeight: 56,
  },

  // Session panel
  panel: {
    flex: 1,
    minHeight: 96,
    overflow: 'hidden',
  },
  panelHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: spacing.s,
    paddingRight: 4,
    minHeight: 40,
  },
  panelHd: {
    ...typography.section,
  },
  undoButton: {
    minHeight: 40,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  undoText: {
    ...font('semibold'),
    fontSize: 14,
    color: colors.textSecondary,
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
    minHeight: 40,
    paddingVertical: 6,
    paddingHorizontal: spacing.s,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.separator,
  },
  // Fixed-width columns so grade / V grade / flash line up row to row.
  logChip: {
    flexShrink: 0,
    width: 72,
  },
  pinnedGrade: {
    ...typography.numeric,
    flexShrink: 0,
    width: 34,
    fontSize: 15,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  flashMark: {
    flexShrink: 0,
    width: 16,
    alignItems: 'center',
  },
  highBadge: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accentMuted,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  highBadgeText: {
    ...font('semibold'),
    fontSize: 13,
    // Label in body text, not the accent: light-theme accents on the tinted pill fall
    // under 3:1. The star carries the accent colour.
    color: colors.textPrimary,
  },
  logTime: {
    ...typography.meta,
    flexShrink: 1,
    marginLeft: 'auto',
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  logTimeLatest: {
    ...font('semibold'),
    color: colors.textPrimary,
  },
  emptyText: {
    ...typography.bodyMuted,
    color: colors.textMuted,
    paddingHorizontal: spacing.s,
    paddingBottom: spacing.s,
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
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    ...shadows.lg,
    padding: spacing.sm,
  },
  pickerEyebrow: {
    ...typography.meta,
    ...font('semibold'),
    color: colors.accentInk,
  },
  pickerTitle: {
    ...typography.title,
    fontSize: 18,
    marginTop: 2,
  },
  pickerHint: {
    ...typography.bodyMuted,
    lineHeight: 19,
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
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
    overflow: 'hidden',
  },
  pickerTileText: {
    ...typography.numeric,
    fontSize: 22,
    lineHeight: 30,
  },
  pickerCancel: {
    marginTop: spacing.xxs,
  },
});
