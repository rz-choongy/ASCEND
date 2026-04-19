import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getAll } from '../db/db';
import { applyClimbEvents } from '../domain/climbLogUtils';
import { appendEvent, getSessionEvents } from '../domain/sessionStore';
import type { SessionRow } from '../domain/types';
import { Button, Chip, Divider, ListRow, colors, radius, spacing, typography } from '../ui';

type GradeOption = {
  label: string;
  min: number;
  max: number;
};

type SessionSummary = {
  session: SessionRow;
  counts: Record<string, number>;
  total: number;
  maxGradeLabel: string;
  totalSets: number;
  volume: number;
};

type StrengthSet = {
  reps?: number;
  weight?: number;
  timeSeconds?: number;
  exerciseName?: string;
};

type SessionHistoryScreenProps = {
  onStartNewSession?: () => void;
};

const GRADE_OPTIONS: GradeOption[] = [
  { label: 'V0', min: 0, max: 0 },
  { label: 'V1', min: 1, max: 1 },
  { label: 'V2', min: 2, max: 2 },
  { label: 'V3', min: 3, max: 3 },
  { label: 'V4', min: 4, max: 4 },
  { label: 'V5', min: 5, max: 5 },
  { label: 'V6', min: 6, max: 6 },
  { label: 'V7+', min: 7, max: 10 },
];

const formatDateTime = (ms: number): string => {
  return new Date(ms).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatHeaderTime = (ms: number): string => {
  const date = new Date(ms);
  const now = new Date();
  const startToday = new Date(now);
  startToday.setHours(0, 0, 0, 0);
  const startYesterday = new Date(startToday);
  startYesterday.setDate(startYesterday.getDate() - 1);
  const time = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  if (date >= startToday) {
    return `Today, ${time}`;
  }
  if (date >= startYesterday) {
    return `Yesterday, ${time}`;
  }
  const dateLabel = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return `${dateLabel}, ${time}`;
};

const formatLogTime = (ms: number): string => {
  const date = new Date(ms);
  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');
  return `${hours}:${minutes}`;
};

const parseGradeValue = (label: string, fallbackValue: number): number => {
  const match = label.match(/\d+/);
  if (!match) {
    return fallbackValue;
  }
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : fallbackValue;
};

const compareGradeLabels = (a: string, b: string): number => {
  const aValue = parseGradeValue(a, 0);
  const bValue = parseGradeValue(b, 0);
  if (aValue !== bValue) {
    return aValue - bValue;
  }
  const aPlus = a.includes('+');
  const bPlus = b.includes('+');
  if (aPlus === bPlus) {
    return a.localeCompare(b);
  }
  return aPlus ? 1 : -1;
};

const pickMaxGradeLabel = (labels: string[]): string => {
  if (labels.length === 0) {
    return 'V0';
  }
  const sorted = labels.slice().sort(compareGradeLabels);
  return sorted[sorted.length - 1];
};

const parseStrengthSets = (events: { type: string; payload: unknown }[]): StrengthSet[] => {
  const sets: StrengthSet[] = [];
  events.forEach((event) => {
    if (event.type === 'SET_LOGGED' && event.payload && typeof event.payload === 'object') {
      const payload = event.payload as StrengthSet;
      sets.push({
        reps: payload.reps,
        weight: payload.weight,
        timeSeconds: payload.timeSeconds,
        exerciseName: payload.exerciseName,
      });
    }
    if (event.type === 'SET_UNDONE') {
      sets.pop();
    }
  });
  return sets;
};

export const SessionHistoryScreen = ({ onStartNewSession }: SessionHistoryScreenProps) => {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const historyData = useMemo(() => {
    const sessions = getAll<SessionRow>(
      "SELECT * FROM sessions WHERE status = 'completed' ORDER BY started_at DESC;"
    );

    const events = getAll<{ session_id: string; type: string; payload_json: string; created_at: number }>(
      `SELECT e.session_id, e.type, e.payload_json, e.created_at
       FROM events e
       JOIN sessions s ON s.id = e.session_id
       WHERE s.status = 'completed'
       ORDER BY e.created_at ASC;`
    );

    const eventsBySession = new Map<string, { type: string; payload: unknown; createdAt: number }[]>();
    events.forEach((event) => {
      let payload: unknown = null;
      try {
        payload = JSON.parse(event.payload_json);
      } catch {
        payload = event.payload_json;
      }
      const list = eventsBySession.get(event.session_id) ?? [];
      list.push({
        type: event.type,
        payload,
        createdAt: event.created_at,
      });
      eventsBySession.set(event.session_id, list);
    });

    const gradeBuckets = new Map<string, number>();
    const summaries: SessionSummary[] = sessions.map((session) => {
      const sessionEvents = eventsBySession.get(session.id) ?? [];
      const climbs = session.type === 'climb' ? applyClimbEvents(sessionEvents) : [];
      const counts: Record<string, number> = {};
      climbs.forEach((climb) => {
        const label = climb.gradeLabel;
        counts[label] = (counts[label] ?? 0) + 1;
        gradeBuckets.set(label, (gradeBuckets.get(label) ?? 0) + 1);
      });

      const maxGradeLabel = pickMaxGradeLabel(Object.keys(counts));

      const strengthSets = session.type === 'strength' ? parseStrengthSets(sessionEvents) : [];
      const totalSets = strengthSets.length;
      const volume = strengthSets.reduce((sum, set) => sum + (set.reps ?? 0) * (set.weight ?? 0), 0);

      return {
        session,
        counts,
        total: climbs.length,
        maxGradeLabel,
        totalSets,
        volume,
      };
    });

    const gradeLabels = Array.from(gradeBuckets.keys()).sort(compareGradeLabels);

    return {
      summaries,
      gradeLabels,
    };
  }, [refreshKey]);

  const summaries = historyData.summaries;
  const gradeLabels = historyData.gradeLabels;

  const selectedSummary = summaries.find((item) => item.session.id === selectedSessionId) ?? null;
  const selectedSession = selectedSummary?.session ?? null;

  const events = useMemo(() => {
    if (!selectedSessionId) {
      return [];
    }
    return getSessionEvents(selectedSessionId);
  }, [selectedSessionId, refreshKey]);

  const climbs = useMemo(() => applyClimbEvents(events), [events]);
  const strengthSets = useMemo(() => parseStrengthSets(events), [events]);

  const handleRelabel = (index: number, option: GradeOption) => {
    if (!selectedSession) {
      return;
    }
    appendEvent(selectedSession.id, 'CLIMB_RELABELED', {
      index,
      gradeLabel: option.label,
      gradeMin: option.min,
      gradeMax: option.max,
    });
    setEditingIndex(null);
    setRefreshKey((prev) => prev + 1);
  };

  if (selectedSession) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.detailHeader}>
          <Button
            label="Back to list"
            variant="ghost"
            onPress={() => {
              setSelectedSessionId(null);
              setEditingIndex(null);
            }}
            style={styles.backButton}
            textStyle={styles.backButtonText}
          />
          <View>
            <Text style={styles.title}>Session Detail</Text>
            <Text style={styles.subtitle}>
              {selectedSession.type.toUpperCase()} - {formatDateTime(selectedSession.started_at)}
            </Text>
          </View>
        </View>

        {selectedSession.type === 'climb' ? (
          <>
            <Text style={styles.sectionLabel}>Route Log</Text>
            <Divider style={styles.divider} />
            {climbs.length === 0 ? <Text style={styles.emptyText}>No climbs logged.</Text> : null}
            {climbs.map((climb, index) => (
              <View key={`${climb.gradeLabel}-${index}`} style={styles.logCard}>
                <ListRow
                  title={climb.gradeLabel}
                  subtitle={climb.result}
                  meta={formatLogTime(climb.createdAt)}
                  right={
                    <Button
                      label={editingIndex === index ? 'Close' : 'Edit'}
                      variant="ghost"
                      onPress={() => setEditingIndex((prev) => (prev === index ? null : index))}
                      style={styles.editButton}
                      textStyle={styles.editButtonText}
                    />
                  }
                />
                {editingIndex === index ? (
                  <View style={styles.gradePicker}>
                    {GRADE_OPTIONS.map((option) => (
                      <Chip
                        key={option.label}
                        label={option.label}
                        selected={option.label === climb.gradeLabel}
                        onPress={() => handleRelabel(index, option)}
                        style={styles.gradeChip}
                      />
                    ))}
                  </View>
                ) : null}
              </View>
            ))}
          </>
        ) : (
          <>
            <Text style={styles.sectionLabel}>Logged Sets</Text>
            <Divider style={styles.divider} />
            {strengthSets.length === 0 ? <Text style={styles.emptyText}>No sets logged.</Text> : null}
            {strengthSets.map((set, index) => (
              <ListRow
                key={`${set.exerciseName ?? 'set'}-${index}`}
                title={set.exerciseName ?? `Set ${index + 1}`}
                subtitle={set.reps ? `${set.reps} reps @ ${set.weight ?? 0}kg` : `${set.timeSeconds ?? 0}s`}
              />
            ))}
          </>
        )}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.listHeader}>
          <Text style={styles.title}>Session History</Text>
          <View style={styles.headerActions}>
            <Button label="Filter" variant="ghost" onPress={() => undefined} style={styles.iconButton} />
            <Button label="Profile" variant="ghost" onPress={() => undefined} style={styles.iconButton} />
          </View>
        </View>
        {summaries.length === 0 ? <Text style={styles.emptyText}>No completed sessions yet.</Text> : null}
        <View style={styles.timelineWrap}>
          <View style={styles.timelineLine} />
          {summaries.map((summary, index) => {
            const isClimb = summary.session.type === 'climb';
            return (
              <Pressable
                key={summary.session.id}
                style={styles.historyRow}
                onPress={() => setSelectedSessionId(summary.session.id)}
              >
                <View style={styles.timelineDot} />
                <View style={styles.historyCard}>
                  <View style={styles.historyHeader}>
                    <View>
                      <Text style={styles.historyTime}>{formatHeaderTime(summary.session.started_at).toUpperCase()}</Text>
                      <Text style={styles.historyTitle}>
                        {summary.session.title ?? (isClimb ? 'Climb Session' : 'Strength Session')}
                      </Text>
                    </View>
                    <Text style={styles.chevron}>&gt;</Text>
                  </View>
                  <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                      <View style={[styles.statIcon, styles.statIconPrimary]}>
                        <Text style={styles.statIconText}>T</Text>
                      </View>
                      <View>
                        <Text style={styles.statLabel}>{isClimb ? 'Total Climbs' : 'Total Sets'}</Text>
                        <Text style={styles.statValue}>{isClimb ? summary.total : summary.totalSets}</Text>
                      </View>
                    </View>
                    <View style={styles.statCard}>
                      <View style={[styles.statIcon, styles.statIconSecondary]}>
                        <Text style={styles.statIconText}>M</Text>
                      </View>
                      <View>
                        <Text style={styles.statLabel}>{isClimb ? 'Max Grade' : 'Volume'}</Text>
                        <Text style={styles.statValue}>{isClimb ? summary.maxGradeLabel : `${summary.volume.toFixed(0)} kg`}</Text>
                      </View>
                    </View>
                  </View>
                  {isClimb ? (
                    <View style={styles.historyBar}>
                      {gradeLabels.map((label, gradeIndex) => (
                        <View
                          key={`${summary.session.id}-${label}`}
                          style={[
                            styles.historySegment,
                            {
                              flex: summary.counts[label] ?? 0,
                              backgroundColor: colors.gradePalette[gradeIndex % colors.gradePalette.length],
                            },
                          ]}
                        />
                      ))}
                    </View>
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
      {onStartNewSession ? (
        <View style={styles.startBar}>
          <Button label="Start New Session" onPress={onStartNewSession} style={styles.startButton} />
        </View>
      ) : null}
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
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  title: {
    ...typography.title,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  detailHeader: {
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  backButton: {
    alignSelf: 'flex-start',
    minHeight: 32,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  backButtonText: {
    fontSize: 10,
  },
  iconButton: {
    minHeight: 36,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  timelineWrap: {
    position: 'relative',
    paddingLeft: 22,
  },
  timelineLine: {
    position: 'absolute',
    left: 10,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: colors.border,
  },
  historyRow: {
    marginBottom: spacing.md,
  },
  timelineDot: {
    position: 'absolute',
    left: -18,
    top: 18,
    width: 12,
    height: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  historyCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.sm,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyTime: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 6,
  },
  historyTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  chevron: {
    color: colors.textMuted,
    fontSize: 18,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  statCard: {
    flex: 1,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIconPrimary: {
    backgroundColor: colors.accentMuted,
  },
  statIconSecondary: {
    backgroundColor: colors.surfaceAlt,
  },
  statIconText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 11,
  },
  statValue: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
  },
  historyBar: {
    flexDirection: 'row',
    height: 14,
    borderRadius: radius.pill,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginTop: spacing.sm,
  },
  historySegment: {
    height: '100%',
  },
  sectionLabel: {
    ...typography.section,
    marginBottom: spacing.xs,
  },
  divider: {
    marginBottom: spacing.xs,
  },
  logCard: {
    marginBottom: spacing.xs,
  },
  editButton: {
    minHeight: 30,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  editButtonText: {
    fontSize: 10,
  },
  gradePicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  gradeChip: {
    minHeight: 36,
  },
  startBar: {
    position: 'absolute',
    left: spacing.sm,
    right: spacing.sm,
    bottom: spacing.sm,
  },
  startButton: {
    width: '100%',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 12,
  },
});
