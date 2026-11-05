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
import { defaultOptionsForType, getGradeOptionsForGym } from '../domain/gymStore';
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
import { EndTimeSheet } from './EndTimeSheet';
import type { RootStackScreenProps } from '../navigation/types';
import {
  Button,
  ChevronLeftIcon,
  DialogHost,
  GradeChip,
  PencilIcon,
  ListGroup,
  ListRow,
  OverflowMenu,
  SessionStrip,
  StatRow,
  font,
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
  type === 'climb' ? 'Climbing session' : 'Strength session';

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

  const [editingEnd, setEditingEnd] = useState(false);
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

  // The gym the climb was logged at, else the session's. Old sessions with no gym get the
  // default V-scale chips rather than free-text fields that accepted any range.
  const editingGymId =
    (editingEntry?.kind === 'climb' ? editingEntry.entry.gymId : null) ?? session?.gym_id ?? null;
  const gradeOptions = useMemo(() => {
    const source = editingGymId ? getGradeOptionsForGym(editingGymId) : defaultOptionsForType('v_scale');
    return source
      .map(normalizeGradeOption)
      .filter((grade): grade is GradeOption => grade !== null);
  }, [editingGymId]);

  const climbStats = useMemo(() => {
    if (session?.type !== 'climb' || climbs.length === 0) return null;
    const sends = climbs.filter((c) => c.result === 'SEND').length;
    const flashes = climbs.filter((c) => c.result === 'FLASH').length;
    const flashRate = climbs.length > 0 ? Math.round((flashes / climbs.length) * 100) : 0;
    const hardest = climbs.reduce<ClimbLog | null>(
      (best, c) => (best === null || c.gradeMax > best.gradeMax ? c : best),
      null
    );
    // Oldest first, the order they were climbed.
    const tape = climbs
      .slice()
      .sort((a, b) => a.createdAt - b.createdAt)
      .map((c) => c.gradeColor || colors.chartQuiet);
    return { total: climbs.length, sends, flashes, flashRate, hardest, tape };
  }, [climbs, session?.type, colors.chartQuiet]);

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
  const [titleFocused, setTitleFocused] = useState(false);
  const titleInputRef = useRef<TextInput>(null);

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
    setClimbDraft((draft) => {
      // Keep an exact pick (e.g. V5 off Blue V4-6) when it still fits the band, instead of
      // widening the climb back to the full range.
      const exact = Number(draft.gradeMin);
      const keepExact =
        draft.gradeMin === draft.gradeMax && exact >= grade.gradeMin && exact <= grade.gradeMax;
      return {
        ...draft,
        gradeLabel: grade.label,
        gradeMin: keepExact ? draft.gradeMin : `${grade.gradeMin}`,
        gradeMax: keepExact ? draft.gradeMax : `${grade.gradeMax}`,
        gradeColor: grade.colorHex ?? null,
        gradeId: grade.id,
      };
    });
  };

  const pickExactGrade = (value: number) => {
    setClimbDraft((draft) => ({ ...draft, gradeMin: `${value}`, gradeMax: `${value}` }));
  };

  // Climbs logged before grade ids were kept on edit can carry an id no option has; match
  // those by label instead.
  const draftIdKnown = gradeOptions.some((grade) => grade.id && grade.id === climbDraft.gradeId);
  const isDraftGrade = (grade: GradeOption) =>
    draftIdKnown ? grade.id === climbDraft.gradeId : climbDraft.gradeLabel === grade.label;
  const draftBand = gradeOptions.find(isDraftGrade);
  const exactChoices =
    draftBand && draftBand.gradeMax > draftBand.gradeMin
      ? Array.from(
          { length: draftBand.gradeMax - draftBand.gradeMin + 1 },
          (_, index) => draftBand.gradeMin + index
        )
      : [];

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
        <View style={styles.topBar}>
          <Pressable onPress={handleBack} style={styles.backRow} hitSlop={12}>
            <ChevronLeftIcon size={14} color={colors.textMuted} strokeWidth={2.2} />
            <Text style={styles.backLabel}>Back</Text>
          </Pressable>
          {/* Deleting is rare, so it lives in the menu rather than on the page. A discarded
              session keeps its own Delete beside Restore below. */}
          {session.status === 'completed' ? (
            <OverflowMenu
              accessibilityLabel="Session options"
              items={[{ label: 'Delete session', destructive: true, onPress: handleRemoveSession }]}
            />
          ) : null}
        </View>
        {/* Session metadata header */}
        <View style={styles.metaBlock}>
          {/* The title is the screen title: display font, left, editable in place. The
              default name shows in full ink so it never reads as an empty field. */}
          <Pressable
            style={styles.titleRow}
            onPress={() => titleInputRef.current?.focus()}
            accessibilityLabel="Edit session title"
          >
            <TextInput
              ref={titleInputRef}
              style={[styles.titleInput, titleFocused && styles.titleInputFocused]}
              value={title}
              onChangeText={setTitle}
              onFocus={() => setTitleFocused(true)}
              onBlur={() => {
                setTitleFocused(false);
                saveTitle();
              }}
              onSubmitEditing={saveTitle}
              returnKeyType="done"
              placeholder={fallbackTitle}
              placeholderTextColor={colors.textPrimary}
              accessibilityLabel="Session title"
            />
            {titleFocused ? null : <PencilIcon size={16} color={colors.textMuted} />}
          </Pressable>
          <Text style={styles.metaLine}>{formatDateLine(session.started_at)}</Text>
          {duration != null ? (
            session.status === 'completed' ? (
              <Pressable
                onPress={() => setEditingEnd(true)}
                accessibilityRole="button"
                accessibilityLabel={`Duration ${duration}. Edit end time`}
                hitSlop={8}
              >
                <Text style={styles.metaLine}>
                  {duration} · <Text style={styles.editLink}>Edit end time</Text>
                </Text>
              </Pressable>
            ) : (
              <Text style={styles.metaLine}>{duration}</Text>
            )
          ) : null}
        </View>

        {/* Stats strip */}
        {climbStats ? (
          <View style={styles.statsBlock}>
            <StatRow
              items={[
                {
                  label: 'Climbs',
                  value: `${climbStats.total}`,
                  sub: `${climbStats.sends} send${climbStats.sends === 1 ? '' : 's'}`,
                },
                {
                  label: 'Flashes',
                  value: `${climbStats.flashes}`,
                  sub: `${climbStats.flashRate}% flash rate`,
                },
                ...(climbStats.hardest
                  ? [
                      {
                        label: 'Hardest',
                        value: climbStats.hardest.gradeLabel,
                        sub: climbStats.hardest.result === 'FLASH' ? 'Flash' : 'Send',
                        dotColor: climbStats.hardest.gradeColor ?? undefined,
                      },
                    ]
                  : []),
              ]}
            />
            <SessionStrip colors={climbStats.tape} style={styles.sessionStrip} />
          </View>
        ) : null}

        {strengthStats ? (
          <StatRow
            style={styles.statsBlock}
            items={[
              { label: 'Sets', value: `${strengthStats.totalSets}` },
              {
                label: 'Volume',
                value: strengthStats.totalVolume > 0 ? `${strengthStats.totalVolume}` : 'bw',
                sub: strengthStats.totalVolume > 0 ? 'kg' : 'Bodyweight',
              },
              { label: 'Exercises', value: `${Object.keys(strengthStats.exerciseCounts).length}` },
            ]}
          />
        ) : null}

        {/* Log list */}
        <Text style={styles.sectionLabel}>{isClimb ? 'Climbs' : 'Sets'}</Text>

        {isClimb ? (
          climbs.length === 0 ? (
            <Text style={styles.emptyText}>Nothing logged</Text>
          ) : (
            <ListGroup>
              {climbs.map((climb) => (
                <ListRow
                  key={climb.eventId}
                  title={climb.climbName || (climb.result === 'FLASH' ? 'Flash' : 'Send')}
                  subtitle={climb.climbName ? (climb.result === 'FLASH' ? 'Flash' : 'Send') : undefined}
                  meta={formatLogTime(climb.createdAt)}
                  left={
                    <GradeChip
                      variant="dot"
                      label={climb.gradeLabel}
                      color={climb.gradeColor || colors.surfaceAlt}
                      style={styles.gradeChipLead}
                    />
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

        {session.type === 'strength' && session.status === 'completed' && sets.some((set) => set.exerciseId) ? (
          <Button
            label="Save as routine"
            variant="secondary"
            onPress={() => {
              // The editor names the routine after the title, so save any edit to it first.
              setSessionTitle(sessionId, title);
              navigation.navigate('RoutineEdit', { fromSessionId: sessionId });
            }}
            style={styles.saveRoutineButton}
          />
        ) : null}

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
              label="Delete session"
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
                      const selected = isDraftGrade(grade);
                      return (
                        <Pressable
                          key={grade.id ?? grade.label}
                          style={[styles.gradeChip, selected ? styles.gradeChipSelected : null]}
                          onPress={() => selectGrade(grade)}
                        >
                          {grade.colorHex ? (
                            <View style={[styles.gradeDot, { backgroundColor: grade.colorHex }]} />
                          ) : null}
                          <Text style={[styles.gradeChipText, selected ? styles.gradeChipTextSelected : null]}>
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

                {exactChoices.length > 0 ? (
                  // Same rule as logging: a band asks which grade it really was.
                  <View style={styles.gradeChipRow}>
                    {exactChoices.map((value) => {
                      const selected =
                        climbDraft.gradeMin === climbDraft.gradeMax && Number(climbDraft.gradeMin) === value;
                      return (
                        <Pressable
                          key={value}
                          style={[styles.gradeChip, selected ? styles.gradeChipSelected : null]}
                          onPress={() => pickExactGrade(value)}
                          accessibilityLabel={`Exact grade V${value}`}
                        >
                          <Text style={[styles.gradeChipText, selected ? styles.gradeChipTextSelected : null]}>
                            V{value}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ) : null}

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
                          {result === 'FLASH' ? 'Flash' : 'Send'}
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
      <EndTimeSheet sessionId={sessionId} visible={editingEnd} onClose={() => setEditingEnd(false)} onSaved={bump} />
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 38,
    marginBottom: spacing.xs,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  backLabel: {
    ...font('medium'),
    color: colors.textSecondary,
    fontSize: 14,
  },
  metaBlock: {
    marginBottom: spacing.md,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 2,
  },
  titleInput: {
    ...typography.display,
    flexShrink: 1,
    minHeight: 44,
    padding: 0,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  // Same underline the Stepper uses while editing, so focus reads as "typing here".
  titleInputFocused: {
    flex: 1,
    borderBottomColor: colors.action,
  },
  metaLine: {
    ...typography.bodyMuted,
    fontVariant: ['tabular-nums'],
  },
  editLink: {
    ...font('semibold'),
    color: colors.accentInk,
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
  gradeChipLead: {
    minWidth: 40,
  },
  notesInput: {
    ...font('regular'),
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    ...shadows.card,
    color: colors.textPrimary,
    fontSize: 14,
    padding: 12,
    minHeight: 100,
  },
  dangerBlock: {
    marginTop: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    ...shadows.card,
    padding: 12,
    gap: spacing.xs,
  },
  dangerLabel: {
    ...typography.section,
    color: colors.danger,
  },
  dangerCopy: {
    ...typography.bodyMuted,
    lineHeight: 19,
  },
  restoreButton: {
    marginTop: 4,
  },
  saveRoutineButton: {
    marginTop: 12,
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
    ...shadows.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  modalTitle: {
    ...typography.title,
    fontSize: 18,
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
    fontSize: 15,
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
  // Neutral pill with the tape colour as a small dot; selected is an ink fill.
  gradeChip: {
    minHeight: 44,
    minWidth: 64,
    borderRadius: radius.pill,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.s,
    backgroundColor: colors.fill,
  },
  gradeChipSelected: {
    backgroundColor: colors.textPrimary,
  },
  gradeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSoft,
  },
  gradeChipText: {
    ...font('display'),
    fontSize: 16,
    color: colors.textPrimary,
  },
  gradeChipTextSelected: {
    color: colors.textInverse,
  },
  resultRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  resultChip: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.fill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultChipSelected: {
    backgroundColor: colors.textPrimary,
  },
  resultText: {
    ...font('medium'),
    color: colors.textSecondary,
    fontSize: 15,
  },
  resultTextSelected: {
    ...font('semibold'),
    color: colors.textInverse,
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

  statsBlock: {
    marginBottom: spacing.md,
  },
  sessionStrip: {
    marginTop: spacing.xs,
  },
});
