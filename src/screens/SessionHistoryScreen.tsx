import { useMemo, useState } from 'react';
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
import { applyClimbEvents, type ClimbLog } from '../domain/climbLogUtils';
import { formatDuration } from '../domain/dateUtils';
import { getGradeOptionsForGym } from '../domain/gymStore';
import {
  appendSessionCorrectionEvent,
  getSessionById,
  getSessionEvents,
  removeSessionFromHistory,
  setSessionNotes,
  setSessionTitle,
} from '../domain/sessionStore';
import { applySetEvents, type LoggedSet } from '../domain/strengthLogUtils';
import type { RootStackScreenProps } from '../navigation/types';
import { Button, Divider, ListRow, colors, radius, spacing, typography } from '../ui';

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
  const { sessionId } = route.params;

  const [refreshKey, setRefreshKey] = useState(0);
  const [editingEntry, setEditingEntry] = useState<EditingEntry>(null);
  const [climbDraft, setClimbDraft] = useState<ClimbDraft>({
    gradeLabel: '',
    gradeMin: '0',
    gradeMax: '0',
    gradeColor: null,
    result: 'SEND',
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

  const strengthStats = useMemo(() => {
    if (session?.type !== 'strength' || sets.length === 0) return null;
    const totalSets = sets.length;
    const totalVolume = sets.reduce((sum, s) => sum + s.reps * s.weight, 0);
    const exerciseCounts = sets.reduce<Record<string, number>>((acc, s) => {
      acc[s.exerciseName] = (acc[s.exerciseName] ?? 0) + 1;
      return acc;
    }, {});
    return { totalSets, totalVolume, exerciseCounts };
  }, [sets, session?.type]);

  const [notes, setNotes] = useState(session?.notes ?? '');
  const [title, setTitle] = useState(session?.title ?? '');

  if (!session) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>Session not found.</Text>
      </View>
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
    });
  };

  const openSetEdit = (entry: LoggedSet) => {
    setEditingEntry({ kind: 'set', entry });
    setSetDraft({
      exerciseName: entry.exerciseName,
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
      });
      closeEdit();
      bump();
      return;
    }

    appendSessionCorrectionEvent(sessionId, 'SET_EDITED', {
      eventId: editingEntry.entry.eventId,
      exerciseName: setDraft.exerciseName.trim() || editingEntry.entry.exerciseName,
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
    Alert.alert(`Delete ${type}?`, "This removes it from this session's history.", [
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
    Alert.alert(
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

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => navigation.goBack()} style={styles.backRow} hitSlop={12}>
          <Text style={styles.backLabel}>← Back</Text>
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
          <View style={styles.statsStrip}>
            <View style={styles.statCell}>
              <Text style={styles.statValue}>{climbStats.total}</Text>
              <Text style={styles.statLabel}>Climbs</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCell}>
              <Text style={styles.statValue}>{climbStats.sends}</Text>
              <Text style={styles.statLabel}>Sends</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCell}>
              <Text style={styles.statValue}>{climbStats.flashes}</Text>
              <Text style={styles.statLabel}>Flashes</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCell}>
              <Text style={styles.statValue}>{climbStats.flashRate}%</Text>
              <Text style={styles.statLabel}>Flash rate</Text>
            </View>
          </View>
        ) : null}

        {strengthStats ? (
          <View style={styles.statsStrip}>
            <View style={styles.statCell}>
              <Text style={styles.statValue}>{strengthStats.totalSets}</Text>
              <Text style={styles.statLabel}>Sets</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCell}>
              <Text style={styles.statValue}>
                {strengthStats.totalVolume > 0 ? `${strengthStats.totalVolume}kg` : 'bw'}
              </Text>
              <Text style={styles.statLabel}>Volume</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCell}>
              <Text style={styles.statValue}>
                {Object.keys(strengthStats.exerciseCounts).length}
              </Text>
              <Text style={styles.statLabel}>Exercises</Text>
            </View>
          </View>
        ) : null}

        {/* Log list */}
        <Text style={styles.sectionLabel}>{isClimb ? 'Sends' : 'Sets'}</Text>
        <Divider style={styles.divider} />

        {isClimb ? (
          climbs.length === 0 ? (
            <Text style={styles.emptyText}>Nothing logged</Text>
          ) : (
            climbs.map((climb) => (
              <ListRow
                key={climb.eventId}
                title={climb.gradeLabel}
                subtitle={climb.result === 'FLASH' ? 'Flash' : 'Send'}
                meta={formatLogTime(climb.createdAt)}
                left={
                  climb.gradeColor ? (
                    <View style={[styles.gradeSwatch, { backgroundColor: climb.gradeColor }]} />
                  ) : undefined
                }
                onPress={() => openClimbEdit(climb)}
              />
            ))
          )
        ) : sets.length === 0 ? (
          <Text style={styles.emptyText}>Nothing logged</Text>
        ) : (
          sets.map((set) => (
            <ListRow
              key={set.eventId}
              title={set.exerciseName}
              subtitle={formatSetLabel(set)}
              meta={formatLogTime(set.createdAt)}
              onPress={() => openSetEdit(set)}
            />
          ))
        )}

        {/* Notes */}
        <Text style={[styles.sectionLabel, styles.notesSectionLabel]}>Notes</Text>
        <Divider style={styles.divider} />
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

        {(session.status === 'completed' || session.status === 'abandoned') ? (
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

      <Modal
        animationType="fade"
        transparent
        visible={editingEntry !== null}
        onRequestClose={closeEdit}
      >
        <View style={styles.modalBackdrop}>
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
                          <Text style={styles.gradeChipText}>{grade.label}</Text>
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
                    keyboardType="number-pad"
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
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  backRow: {
    marginBottom: spacing.xs,
  },
  backLabel: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  metaBlock: {
    marginBottom: spacing.md,
    gap: 4,
  },
  titleLabel: {
    ...typography.meta,
    color: colors.textMuted,
  },
  titleInput: {
    ...typography.title,
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    marginTop: 4,
    marginBottom: 2,
  },
  metaLine: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  sectionLabel: {
    ...typography.section,
    marginBottom: spacing.xs,
  },
  notesSectionLabel: {
    marginTop: spacing.md,
  },
  divider: {
    marginBottom: spacing.xs,
  },
  emptyText: {
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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    color: colors.textPrimary,
    fontSize: 14,
    padding: spacing.sm,
    minHeight: 100,
  },
  dangerBlock: {
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 10,
    backgroundColor: colors.surfaceRaised,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  dangerLabel: {
    ...typography.meta,
    color: colors.danger,
  },
  dangerCopy: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  removeButton: {
    borderColor: colors.danger,
    marginTop: 4,
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
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
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
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: spacing.sm,
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
    minHeight: 42,
    minWidth: 64,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
    backgroundColor: colors.surfaceRaised,
  },
  gradeChipSelected: {
    borderColor: colors.textPrimary,
  },
  gradeChipText: {
    color: colors.textInverse,
    fontSize: 13,
    fontWeight: '800',
  },
  resultRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  resultChip: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultChipSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentMuted,
  },
  resultText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  resultTextSelected: {
    color: colors.textPrimary,
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
    borderColor: colors.danger,
  },

  statsStrip: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    ...typography.meta,
    color: colors.textMuted,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
});
