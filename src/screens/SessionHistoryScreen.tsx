import { useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getExerciseNames, getExercises } from '../domain/exerciseStore';
import { applyClimbEvents, type ClimbLog } from '../domain/climbLogUtils';
import { formatDuration } from '../domain/dateUtils';
import { getGradeOptionsForGym } from '../domain/gymStore';
import {
  appendSessionCorrectionEvent,
  getSessionById,
  getSessionEvents,
  removeSessionFromHistory,
  setSessionNotes,
  setSessionStatus,
  setSessionTitle,
} from '../domain/sessionStore';
import { applySetEvents, type LoggedSet } from '../domain/strengthLogUtils';
import type { RootStackScreenProps } from '../navigation/types';
import {
  Button,
  ChevronLeftIcon,
  DialogHost,
  ListGroup,
  ListRow,
  StatRow,
  font,
  getContrastText,
  radius,
  showDialog,
  spacing,
  useTheme,
  type Shadows,
} from '../ui';
import type { ThemeColors } from '../ui/tokens/colors';
import type { Typography } from '../ui/tokens/typography';

type SessionDetailScreenProps = RootStackScreenProps<'SessionDetail'>;

type GradeOption = {
  id?: string;
  label: string;
  gradeMin: number;
  gradeMax: number;
  colorHex?: string | null;
};

type EditingEntry =
  | { kind: 'climb'; entry: ClimbLog }
  | { kind: 'set'; entry: LoggedSet }
  | null;

type ClimbDraft = {
  gradeLabel: string;
  gradeMin: string;
  gradeMax: string;
  gradeColor: string | null;
  gradeId?: string;
  result: 'SEND' | 'FLASH';
  climbName: string;
};

type SetDraft = {
  exerciseName: string;
  reps: string;
  weight: string;
};

// Helpers

const formatSessionType = (type: string): string =>
  type === 'climb' ? 'Climbing Session' : 'Strength Session';

const formatDateLine = (ms: number): string => {
  const date = new Date(ms);
  const weekday = date.toLocaleDateString(undefined, { weekday: 'short' });
  const day = date.getDate();
  const month = date.toLocaleDateString(undefined, { month: 'short' });
  const time = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  return `${weekday} ${day} ${month} - ${time}`;
};

const formatLogTime = (ms: number): string => {
  const date = new Date(ms);
  const hh = `${date.getHours()}`.padStart(2, '0');
  const mm = `${date.getMinutes()}`.padStart(2, '0');
  return `${hh}:${mm}`;
};

const formatSetLabel = (set: LoggedSet): string => {
  const weightLabel = set.weight === 0 ? 'bw' : `${set.weight}${set.unit}`;
  return `${set.reps}x${weightLabel}`;
};

const toNumber = (value: string, fallback: number): number => {
  if (value.trim() === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeGradeOption = (grade: unknown): GradeOption | null => {
  if (!grade || typeof grade !== 'object') return null;
  const value = grade as {
    id?: unknown;
    label?: unknown;
    gradeMin?: unknown;
    gradeMax?: unknown;
    grade_min?: unknown;
    grade_max?: unknown;
    colorHex?: unknown;
    color_hex?: unknown;
  };
  const min = value.gradeMin ?? value.grade_min;
  const max = value.gradeMax ?? value.grade_max;
  const color = value.colorHex ?? value.color_hex;
  if (typeof value.label !== 'string' || typeof min !== 'number' || typeof max !== 'number') {
    return null;
  }
  return {
    id: typeof value.id === 'string' ? value.id : undefined,
    label: value.label,
    gradeMin: min,
    gradeMax: max,
    colorHex: typeof color === 'string' ? color : null,
  };
};

// Screen

export const SessionHistoryScreen = ({ route, navigation }: SessionDetailScreenProps) => {
  const { colors, typography, shadows } = useTheme();
  const styles = useMemo(() => createStyles(colors, typography, shadows), [colors, typography, shadows]);
  const { sessionId } = route.params;

  const [refreshKey, setRefreshKey] = useState(0);
  const [editingEntry, setEditingEntry] = useState<EditingEntry>(null);
  const [climbDraft, setClimbDraft] = useState<ClimbDraft>({
    gradeLabel: '',
    gradeMin: '0',
    gradeMax: '0',
    gradeColor: null,
    result: 'SEND',
    climbName: '',
  });
  const [setDraft, setSetDraft] = useState<SetDraft>({
    exerciseName: '',
    reps: '0',
    weight: '0',
  });

  const session = useMemo(() => getSessionById(sessionId), [sessionId, refreshKey]);
  const events = useMemo(() => getSessionEvents(sessionId), [sessionId, refreshKey]);

  const climbs = useMemo(
    () => (session?.type === 'climb' ? applyClimbEvents(events) : []),
    [session, events]
  );

  const sets = useMemo(
    () => (session?.type === 'strength' ? applySetEvents(events) : []),
    [session, events]
  );

  const gradeOptions = useMemo(() => {
    if (!session?.gym_id) return [];
    return getGradeOptionsForGym(session.gym_id)
      .map(normalizeGradeOption)
      .filter((grade): grade is GradeOption => grade !== null);
  }, [session?.gym_id]);

  const climbStats = useMemo(() => {
    if (session?.type !== 'climb' || climbs.length === 0) return null;
    const sends = climbs.filter((c) => c.result === 'SEND').length;
    const flashes = climbs.filter((c) => c.result === 'FLASH').length;
    const flashRate = climbs.length > 0 ? Math.round((flashes / climbs.length) * 100) : 0;
    return { total: climbs.length, sends, flashes, flashRate };
  }, [climbs, session?.type]);

  // Sets keep the name they were logged under; show the exercise's current name.
  const exerciseNames = useMemo(() => getExerciseNames(), []);
  const displayName = (set: { exerciseId?: string; exerciseName: string }) =>
    (set.exerciseId && exerciseNames.get(set.exerciseId)) || set.exerciseName;

  const strengthStats = useMemo(() => {
    if (session?.type !== 'strength' || sets.length === 0) return null;
    const totalSets = sets.length;
    const totalVolume = sets.reduce((sum, s) => sum + s.reps * s.weight, 0);
    const exerciseCounts = sets.reduce<Record<string, number>>((acc, s) => {
      acc[displayName(s)] = (acc[displayName(s)] ?? 0) + 1;
      return acc;
    }, {});
    return { totalSets, totalVolume, exerciseCounts };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sets, session?.type, exerciseNames]);

  const [notes, setNotes] = useState(session?.notes ?? '');
  const [title, setTitle] = useState(session?.title ?? '');

  // Save title and notes however the screen is left -- the Back button, a swipe, or
  // Android's back -- not only when a field happens to blur first.
  const latestText = useRef({ title, notes });
  latestText.current = { title, notes };
  useEffect(
    () =>
      navigation.addListener('beforeRemove', () => {
        setSessionTitle(sessionId, latestText.current.title);
        setSessionNotes(sessionId, latestText.current.notes);
      }),
    [navigation, sessionId]
  );

  if (!session) {
    return (
      <SafeAreaView edges={['top']} style={styles.container}>
        <Text style={styles.emptyText}>Session not found.</Text>
      </SafeAreaView>
    );
  }

  const duration =
    session.completed_at != null
      ? formatDuration(session.started_at, session.completed_at)
      : null;

  const isClimb = session.type === 'climb';
  const fallbackTitle = formatSessionType(session.type);

  const saveTitle = () => {
    setSessionTitle(sessionId, title);
  };

  // Back doesn't rely on onBlur firing before the screen unmounts — save explicitly,
  // mirroring the safety-net pattern the session screens use before navigating on Done.
  const handleBack = () => {
    setSessionTitle(sessionId, title);
    setSessionNotes(sessionId, notes);
    navigation.goBack();
  };

  const bump = () => setRefreshKey((key) => key + 1);

  const openClimbEdit = (entry: ClimbLog) => {
    setEditingEntry({ kind: 'climb', entry });
    setClimbDraft({
      gradeLabel: entry.gradeLabel,
      gradeMin: `${entry.gradeMin}`,
      gradeMax: `${entry.gradeMax}`,
      gradeColor: entry.gradeColor ?? null,
      gradeId: entry.gradeId,
      result: entry.result,
      climbName: entry.climbName ?? '',
    });
  };

  const openSetEdit = (entry: LoggedSet) => {
    setEditingEntry({ kind: 'set', entry });
    setSetDraft({
      // What the list shows (the exercise's current name), not the name it was logged under.
      exerciseName: displayName(entry),
      reps: `${entry.reps}`,
      weight: `${entry.weight}`,
    });
  };

  const selectGrade = (grade: GradeOption) => {
    setClimbDraft((draft) => ({
      ...draft,
      gradeLabel: grade.label,
      gradeMin: `${grade.gradeMin}`,
      gradeMax: `${grade.gradeMax}`,
      gradeColor: grade.colorHex ?? null,
      gradeId: grade.id,
    }));
  };

  const closeEdit = () => {
    setEditingEntry(null);
  };

  const saveEntryEdit = () => {
    if (!editingEntry) return;

    if (editingEntry.kind === 'climb') {
      appendSessionCorrectionEvent(sessionId, 'CLIMB_EDITED', {
        eventId: editingEntry.entry.eventId,
        gradeLabel: climbDraft.gradeLabel.trim() || editingEntry.entry.gradeLabel,
        gradeMin: toNumber(climbDraft.gradeMin, editingEntry.entry.gradeMin),
        gradeMax: toNumber(climbDraft.gradeMax, editingEntry.entry.gradeMax),
        gradeColor: climbDraft.gradeColor,
        gradeId: climbDraft.gradeId,
        gymId: session?.gym_id ?? editingEntry.entry.gymId,
        result: climbDraft.result,
        climbName: climbDraft.climbName.trim() || null,
      });
      closeEdit();
      bump();
      return;
    }

    // Changing the name moves the set to the exercise with that name; the set's old
    // exercise id would otherwise keep winning and the edit would look ignored.
    const typedName = setDraft.exerciseName.trim();
    const renamed = typedName !== '' && typedName.toLowerCase() !== displayName(editingEntry.entry).toLowerCase();
    const target = renamed
      ? getExercises().find((e) => e.name.toLowerCase() === typedName.toLowerCase()) ?? null
      : null;
    appendSessionCorrectionEvent(sessionId, 'SET_EDITED', {
      eventId: editingEntry.entry.eventId,
      ...(renamed ? { exerciseId: target?.id ?? null } : {}),
      exerciseName: renamed ? (target?.name ?? typedName) : editingEntry.entry.exerciseName,
      reps: Math.max(1, Math.round(toNumber(setDraft.reps, editingEntry.entry.reps))),
      weight: Math.max(0, toNumber(setDraft.weight, editingEntry.entry.weight)),
      unit: 'kg',
    });
    closeEdit();
    bump();
  };

  const deleteEntry = () => {
    if (!editingEntry) return;
    const type = editingEntry.kind === 'climb' ? 'climb' : 'set';
    showDialog(`Delete ${type}?`, "This removes it from this session's history.", [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          appendSessionCorrectionEvent(
            sessionId,
            editingEntry.kind === 'climb' ? 'CLIMB_DELETED' : 'SET_DELETED',
            { eventId: editingEntry.entry.eventId }
          );
          closeEdit();
          bump();
        },
      },
    ]);
  };

  const handleRemoveSession = () => {
    showDialog(
      'Delete session?',
      "This removes it from Log and Calendar. You can't undo this in the app yet.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            removeSessionFromHistory(sessionId);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleRestoreSession = () => {
    setSessionStatus(sessionId, 'completed');
    bump();
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoider}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable onPress={handleBack} style={styles.backRow} hitSlop={12}>
          <ChevronLeftIcon size={14} color={colors.textMuted} strokeWidth={2.2} />
          <Text style={styles.backLabel}>Back</Text>
        </Pressable>
        {/* Session metadata header */}
        <View style={styles.metaBlock}>
          <Text style={styles.titleLabel}>Session title</Text>
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={setTitle}
            onBlur={saveTitle}
            onSubmitEditing={saveTitle}
            returnKeyType="done"
            placeholder={fallbackTitle}
            placeholderTextColor={colors.textMuted}
          />
          <Text style={styles.metaLine}>{formatDateLine(session.started_at)}</Text>
          {duration != null ? (
            <Text style={styles.metaLine}>{duration}</Text>
          ) : null}
        </View>

        {/* Stats strip */}
        {climbStats ? (
          <StatRow
            style={styles.statsRow}
            items={[
              { value: `${climbStats.total}`, label: 'Climbs' },
              { value: `${climbStats.sends}`, label: 'Sends' },
              { value: `${climbStats.flashes}`, label: 'Flashes' },
              { value: `${climbStats.flashRate}%`, label: 'Flash rate' },
            ]}
          />
        ) : null}

        {strengthStats ? (
          <StatRow
            style={styles.statsRow}
            items={[
              { value: `${strengthStats.totalSets}`, label: 'Sets' },
              {
                value: strengthStats.totalVolume > 0 ? `${strengthStats.totalVolume}kg` : 'bw',
                label: 'Volume',
              },
              { value: `${Object.keys(strengthStats.exerciseCounts).length}`, label: 'Exercises' },
            ]}
          />
        ) : null}

        {/* Log list */}
        <Text style={styles.sectionLabel}>{isClimb ? 'Sends' : 'Sets'}</Text>

        {isClimb ? (
          climbs.length === 0 ? (
            <Text style={styles.emptyText}>Nothing logged</Text>
          ) : (
            <ListGroup>
              {climbs.map((climb) => (
                <ListRow
                  key={climb.eventId}
                  title={climb.climbName || climb.gradeLabel}
                  subtitle={
                    climb.climbName
                      ? `${climb.gradeLabel} · ${climb.result === 'FLASH' ? 'Flash' : 'Send'}`
                      : climb.result === 'FLASH'
                        ? 'Flash'
                        : 'Send'
                  }
                  meta={formatLogTime(climb.createdAt)}
                  left={
                    climb.gradeColor ? (
                      <View style={[styles.gradeSwatch, { backgroundColor: climb.gradeColor }]} />
                    ) : undefined
                  }
                  onPress={() => openClimbEdit(climb)}
                />
              ))}
            </ListGroup>
          )
        ) : sets.length === 0 ? (
          <Text style={styles.emptyText}>Nothing logged</Text>
        ) : (
          <ListGroup>
            {sets.map((set) => (
              <ListRow
                key={set.eventId}
                title={displayName(set)}
                subtitle={formatSetLabel(set)}
                meta={formatLogTime(set.createdAt)}
                onPress={() => openSetEdit(set)}
              />
            ))}
          </ListGroup>
        )}

        {/* Notes */}
        <Text style={[styles.sectionLabel, styles.notesSectionLabel]}>Notes</Text>
        <TextInput
          style={styles.notesInput}
          multiline
          placeholder="Add notes..."
          placeholderTextColor={colors.textMuted}
          value={notes}
          onChangeText={setNotes}
          onBlur={() => setSessionNotes(sessionId, notes)}
          textAlignVertical="top"
        />

        {session.status === 'abandoned' ? (
          <View style={styles.dangerBlock}>
            <Text style={styles.dangerLabel}>Discarded session</Text>
            <Text style={styles.dangerCopy}>
              This was closed before you tapped Done, so it doesn't count toward your stats.
              Restore it to keep the logged entries, or delete it for good.
            </Text>
            <Button
              label="Restore session"
              variant="secondary"
              onPress={handleRestoreSession}
              style={styles.restoreButton}
            />
            <Button
              label="Delete Session"
              variant="ghost"
              onPress={handleRemoveSession}
              style={styles.removeButton}
              textStyle={styles.removeButtonText}
            />
          </View>
        ) : null}

        {session.status === 'completed' ? (
          <View style={styles.dangerBlock}>
            <Text style={styles.dangerLabel}>Correction</Text>
            <Text style={styles.dangerCopy}>
              Delete this session from history.
            </Text>
            <Button
              label="Delete Session"
              variant="ghost"
              onPress={handleRemoveSession}
              style={styles.removeButton}
              textStyle={styles.removeButtonText}
            />
          </View>
        ) : null}
      </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        animationType="fade"
        transparent
        visible={editingEntry !== null}
        onRequestClose={closeEdit}
      >
        {/* Lifts the card above the keyboard so Save/Delete stay reachable while typing. */}
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {editingEntry?.kind === 'climb' ? 'Edit climb' : 'Edit set'}
            </Text>

            {editingEntry?.kind === 'climb' ? (
              <View style={styles.modalContent}>
                {gradeOptions.length > 0 ? (
                  <View style={styles.gradeChipRow}>
                    {gradeOptions.map((grade) => {
                      const selected = climbDraft.gradeLabel === grade.label;
                      return (
                        <Pressable
                          key={grade.id ?? grade.label}
                          style={[
                            styles.gradeChip,
                            grade.colorHex ? { backgroundColor: grade.colorHex } : null,
                            selected ? styles.gradeChipSelected : null,
                          ]}
                          onPress={() => selectGrade(grade)}
                        >
                          <Text
                            style={[
                              styles.gradeChipText,
                              { color: grade.colorHex ? getContrastText(grade.colorHex) : colors.textPrimary },
                            ]}
                          >
                            {grade.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ) : (
                  <TextInput
                    style={styles.modalInput}
                    value={climbDraft.gradeLabel}
                    onChangeText={(value) =>
                      setClimbDraft((draft) => ({ ...draft, gradeLabel: value }))
                    }
                    placeholder="Grade label"
                    placeholderTextColor={colors.textMuted}
                  />
                )}

                {gradeOptions.length === 0 && (
                  <View style={styles.modalRow}>
                    <TextInput
                      style={[styles.modalInput, styles.smallInput]}
                      value={climbDraft.gradeMin}
                      onChangeText={(value) =>
                        setClimbDraft((draft) => ({ ...draft, gradeMin: value }))
                      }
                      keyboardType="number-pad"
                      placeholder="Min"
                      placeholderTextColor={colors.textMuted}
                    />
                    <TextInput
                      style={[styles.modalInput, styles.smallInput]}
                      value={climbDraft.gradeMax}
                      onChangeText={(value) =>
                        setClimbDraft((draft) => ({ ...draft, gradeMax: value }))
                      }
                      keyboardType="number-pad"
                      placeholder="Max"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                )}

                <View style={styles.resultRow}>
                  {(['FLASH', 'SEND'] as const).map((result) => {
                    const selected = climbDraft.result === result;
                    return (
                      <Pressable
                        key={result}
                        style={[styles.resultChip, selected ? styles.resultChipSelected : null]}
                        onPress={() => setClimbDraft((draft) => ({ ...draft, result }))}
                      >
                        <Text style={[styles.resultText, selected ? styles.resultTextSelected : null]}>
                          {result}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <TextInput
                  style={styles.modalInput}
                  value={climbDraft.climbName}
                  onChangeText={(value) => setClimbDraft((draft) => ({ ...draft, climbName: value }))}
                  placeholder="Name this climb (optional)"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            ) : (
              <View style={styles.modalContent}>
                <TextInput
                  style={styles.modalInput}
                  value={setDraft.exerciseName}
                  onChangeText={(value) =>
                    setSetDraft((draft) => ({ ...draft, exerciseName: value }))
                  }
                  placeholder="Exercise"
                  placeholderTextColor={colors.textMuted}
                />
                <View style={styles.modalRow}>
                  <TextInput
                    style={[styles.modalInput, styles.smallInput]}
                    value={setDraft.reps}
                    onChangeText={(value) => setSetDraft((draft) => ({ ...draft, reps: value }))}
                    keyboardType="number-pad"
                    placeholder="Reps"
                    placeholderTextColor={colors.textMuted}
                  />
                  <TextInput
                    style={[styles.modalInput, styles.smallInput]}
                    value={setDraft.weight}
                    onChangeText={(value) => setSetDraft((draft) => ({ ...draft, weight: value }))}
                    keyboardType="decimal-pad"
                    placeholder="Weight"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>
            )}

            <View style={styles.modalActions}>
              <Button
                label="Delete"
                variant="ghost"
                onPress={deleteEntry}
                style={styles.deleteEntryButton}
                textStyle={styles.removeButtonText}
              />
              <Button label="Cancel" variant="ghost" onPress={closeEdit} style={styles.modalButton} />
              <Button label="Save" onPress={saveEntryEdit} style={styles.modalButton} />
            </View>
          </View>
        </KeyboardAvoidingView>
        {/* The delete confirmation opens from inside this sheet, so it draws in here. */}
        {editingEntry !== null ? <DialogHost inline /> : null}
      </Modal>
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors, typography: Typography, shadows: Shadows) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardAvoider: {
    flex: 1,
  },
  content: {
    padding: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    marginBottom: spacing.xs,
  },
  backLabel: {
    ...font('regular'),
    color: colors.accent,
    fontSize: 17,
    letterSpacing: -0.3,
  },
  metaBlock: {
    marginBottom: spacing.md,
    gap: 4,
  },
  titleLabel: {
    ...typography.section,
  },
  titleInput: {
    ...typography.title,
    fontSize: 20,
    minHeight: 44,
    borderRadius: radius.md,
    backgroundColor: colors.fill,
    color: colors.textPrimary,
    paddingHorizontal: spacing.s,
    paddingVertical: 6,
    marginTop: 4,
    marginBottom: 2,
  },
  metaLine: {
    ...font('regular'),
    color: colors.textSecondary,
    fontSize: 15,
    fontVariant: ['tabular-nums'],
  },
  sectionLabel: {
    ...typography.section,
    marginBottom: 6,
    marginLeft: 2,
  },
  notesSectionLabel: {
    marginTop: spacing.md,
  },
  emptyText: {
    ...font('regular'),
    color: colors.textMuted,
    fontSize: 14,
    paddingVertical: spacing.xs,
  },
  gradeSwatch: {
    width: 10,
    height: 36,
    borderRadius: 5,
  },
  notesInput: {
    ...font('regular'),
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadows.card,
    color: colors.textPrimary,
    fontSize: 16,
    padding: spacing.sm,
    minHeight: 100,
  },
  dangerBlock: {
    marginTop: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadows.card,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  dangerLabel: {
    ...typography.meta,
    ...font('semibold'),
    fontSize: 13,
    color: colors.danger,
  },
  dangerCopy: {
    ...font('regular'),
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 19,
  },
  restoreButton: {
    marginTop: 4,
  },
  removeButton: {
    marginTop: 8,
  },
  removeButtonText: {
    color: colors.danger,
  },
  modalBackdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.overlay,
    padding: spacing.md,
  },
  modalCard: {
    width: '100%',
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadows.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  modalTitle: {
    ...typography.title,
    fontSize: 20,
  },
  modalContent: {
    gap: spacing.xs,
  },
  modalInput: {
    minHeight: 48,
    borderRadius: radius.md,
    backgroundColor: colors.fill,
    color: colors.textPrimary,
    ...font('regular'),
    fontSize: 17,
    paddingHorizontal: spacing.s,
  },
  modalRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  smallInput: {
    flex: 1,
  },
  gradeChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  gradeChip: {
    minHeight: 44,
    minWidth: 64,
    borderRadius: radius.pill,
    borderWidth: 2.5,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.s,
    backgroundColor: colors.surfaceRaised,
  },
  gradeChipSelected: {
    borderColor: colors.textPrimary,
  },
  gradeChipText: {
    ...font('semibold'),
    fontSize: 15,
  },
  resultRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  resultChip: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultChipSelected: {
    backgroundColor: colors.action,
    borderColor: colors.action,
  },
  resultText: {
    ...font('medium'),
    color: colors.textSecondary,
    fontSize: 15,
    letterSpacing: -0.2,
  },
  resultTextSelected: {
    ...font('semibold'),
    color: colors.onAction,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  modalButton: {
    flex: 1,
  },
  deleteEntryButton: {
    flex: 1,
  },

  statsRow: {
    marginBottom: spacing.md,
  },
});
