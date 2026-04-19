import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { applyClimbEvents } from '../domain/climbLogUtils';
import { getSessionById, getSessionEvents, setSessionNotes } from '../domain/sessionStore';
import type { RootStackScreenProps } from '../navigation/types';
import { Divider, ListRow, colors, spacing, typography } from '../ui';

type LoggedSet = {
  exerciseName: string;
  reps: number;
  weight: number;
  unit: string;
  createdAt: number;
};

type SessionDetailScreenProps = RootStackScreenProps<'SessionDetail'>;

// ── Helpers ──────────────────────────────────────────────────────────────────

const formatSessionType = (type: string): string =>
  type === 'climb' ? 'Climbing Session' : 'Strength Session';

const formatDateLine = (ms: number): string => {
  const date = new Date(ms);
  const weekday = date.toLocaleDateString(undefined, { weekday: 'short' });
  const day = date.getDate();
  const month = date.toLocaleDateString(undefined, { month: 'short' });
  const time = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  return `${weekday} ${day} ${month} · ${time}`;
};

const formatDuration = (startMs: number, endMs: number): string => {
  const totalMin = Math.round((endMs - startMs) / 60_000);
  if (totalMin < 60) {
    return `${totalMin} min`;
  }
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
};

const formatLogTime = (ms: number): string => {
  const date = new Date(ms);
  const hh = `${date.getHours()}`.padStart(2, '0');
  const mm = `${date.getMinutes()}`.padStart(2, '0');
  return `${hh}:${mm}`;
};

const formatSetLabel = (set: LoggedSet): string => {
  const weightLabel = set.weight === 0 ? 'bw' : `${set.weight}${set.unit}`;
  return `${set.reps}×${weightLabel}`;
};

const parseLoggedSets = (
  events: { type: string; payload: unknown; createdAt: number }[]
): LoggedSet[] => {
  const sets: LoggedSet[] = [];
  for (const event of events) {
    if (event.type === 'SET_LOGGED' && event.payload && typeof event.payload === 'object') {
      const p = event.payload as Partial<LoggedSet>;
      sets.push({
        exerciseName: p.exerciseName ?? 'Set',
        reps: p.reps ?? 0,
        weight: p.weight ?? 0,
        unit: p.unit ?? 'kg',
        createdAt: event.createdAt,
      });
    } else if (event.type === 'SET_UNDONE') {
      sets.pop();
    }
  }
  return sets;
};

// ── Screen ────────────────────────────────────────────────────────────────────

export const SessionHistoryScreen = ({ route }: SessionDetailScreenProps) => {
  const { sessionId } = route.params;

  const session = useMemo(() => getSessionById(sessionId), [sessionId]);
  const events = useMemo(() => getSessionEvents(sessionId), [sessionId]);

  const climbs = useMemo(
    () => (session?.type === 'climb' ? applyClimbEvents(events) : []),
    [session, events]
  );

  const sets = useMemo(
    () => (session?.type === 'strength' ? parseLoggedSets(events) : []),
    [session, events]
  );

  const [notes, setNotes] = useState(session?.notes ?? '');

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

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* ── Session metadata header ── */}
        <View style={styles.metaBlock}>
          <Text style={styles.sessionType}>{formatSessionType(session.type)}</Text>
          <Text style={styles.metaLine}>{formatDateLine(session.started_at)}</Text>
          {duration != null ? (
            <Text style={styles.metaLine}>{duration}</Text>
          ) : null}
        </View>

        {/* ── Log list ── */}
        <Text style={styles.sectionLabel}>{isClimb ? 'Sends' : 'Sets'}</Text>
        <Divider style={styles.divider} />

        {isClimb ? (
          climbs.length === 0 ? (
            <Text style={styles.emptyText}>Nothing logged</Text>
          ) : (
            climbs.map((climb, index) => (
              <ListRow
                key={`climb-${index}`}
                title={climb.gradeLabel}
                subtitle={climb.result === 'FLASH' ? 'Flash' : 'Send'}
                meta={formatLogTime(climb.createdAt)}
              />
            ))
          )
        ) : sets.length === 0 ? (
          <Text style={styles.emptyText}>Nothing logged</Text>
        ) : (
          sets.map((set, index) => (
            <ListRow
              key={`set-${index}`}
              title={set.exerciseName}
              subtitle={formatSetLabel(set)}
              meta={formatLogTime(set.createdAt)}
            />
          ))
        )}

        {/* ── Notes ── */}
        <Text style={[styles.sectionLabel, styles.notesSectionLabel]}>Notes</Text>
        <Divider style={styles.divider} />
        <TextInput
          style={styles.notesInput}
          multiline
          placeholder="Add notes…"
          placeholderTextColor={colors.textMuted}
          value={notes}
          onChangeText={setNotes}
          onBlur={() => setSessionNotes(sessionId, notes)}
          textAlignVertical="top"
        />
      </ScrollView>
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
  metaBlock: {
    marginBottom: spacing.md,
    gap: 4,
  },
  sessionType: {
    ...typography.title,
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
});
