import { useMemo, useState } from 'react';
import { Platform, Pressable, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { getAll } from '../db/db';
import { applyClimbEvents, type ClimbLog } from '../domain/climbLogUtils';
import type { SessionRow } from '../domain/types';
import { Button, Card, Divider, MetricCard, colors, radius, spacing, typography } from '../ui';

type AnalyticsScreenProps = {
  onOpenHistory?: () => void;
};

type SessionTrendPoint = {
  sessionId: string;
  date: string;
  grade: number;
};

const formatDate = (ms: number): string => {
  const date = new Date(ms);
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${month}.${day}`;
};

const formatWeekday = (ms: number): string => {
  return new Date(ms).toLocaleDateString(undefined, { weekday: 'short' });
};

const startOfWeek = (date: Date): Date => {
  const copy = new Date(date);
  const day = (copy.getDay() + 6) % 7;
  copy.setDate(copy.getDate() - day);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const addDays = (date: Date, days: number): Date => {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
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

const gradeValueFor = (log: ClimbLog): number => {
  if (Number.isFinite(log.gradeMin)) {
    return log.gradeMin;
  }
  return parseGradeValue(log.gradeLabel, 0);
};

const gradeMidpointFor = (log: ClimbLog): number => {
  if (Number.isFinite(log.gradeMin) && Number.isFinite(log.gradeMax)) {
    return (log.gradeMin + log.gradeMax) / 2;
  }
  return parseGradeValue(log.gradeLabel, 0);
};

const pickMaxGradeLabel = (climbs: ClimbLog[], maxValue: number): string => {
  const matches = climbs.filter((climb) => gradeValueFor(climb) === maxValue);
  if (matches.length === 0) {
    return `V${maxValue}`;
  }
  const plus = matches.find((climb) => climb.gradeLabel.includes('+'));
  return (plus ?? matches[0]).gradeLabel;
};

export const AnalyticsScreen = ({ onOpenHistory }: AnalyticsScreenProps) => {
  const [trendWidth, setTrendWidth] = useState(0);
  const [selectedVolumeSessionId, setSelectedVolumeSessionId] = useState<string | null>(null);
  const safeTop = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;

  const analytics = useMemo(() => {
    const sessions = getAll<SessionRow>(
      "SELECT * FROM sessions WHERE status = 'completed' ORDER BY started_at ASC;"
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

    const climbsBySession = new Map<string, ClimbLog[]>();
    sessions.forEach((session) => {
      const sessionEvents = eventsBySession.get(session.id) ?? [];
      climbsBySession.set(session.id, applyClimbEvents(sessionEvents));
    });

    const allClimbs = Array.from(climbsBySession.values()).flat();

    const sendsCount = allClimbs.filter((climb) =>
      climb.result === 'SEND' || climb.result === 'FLASH'
    ).length;

    const allGrades = allClimbs.map((climb) => gradeValueFor(climb));
    const maxGradeValue = allGrades.length > 0 ? Math.max(...allGrades) : 0;
    const maxGradeLabel = pickMaxGradeLabel(allClimbs, maxGradeValue);

    const currentWeekStart = startOfWeek(new Date());
    const windowStart = addDays(currentWeekStart, -7 * 7);
    const windowStartMs = windowStart.getTime();

    const weeklyMax = new Map<number, number>();
    let lastKnown = 0;

    sessions.forEach((session) => {
      const climbs = climbsBySession.get(session.id) ?? [];
      if (climbs.length === 0) {
        return;
      }
      const gradeValues = climbs.map((climb) => gradeMidpointFor(climb));
      const topGrade = gradeValues.length > 0 ? Math.max(...gradeValues) : 0;
      if (session.started_at < windowStartMs) {
        lastKnown = topGrade;
        return;
      }
      const weekKey = startOfWeek(new Date(session.started_at)).getTime();
      const existing = weeklyMax.get(weekKey);
      weeklyMax.set(weekKey, existing ? Math.max(existing, topGrade) : topGrade);
    });

    const trend: SessionTrendPoint[] = Array.from({ length: 8 }).map((_, index) => {
      const weekStart = addDays(windowStart, index * 7);
      const weekKey = weekStart.getTime();
      const weekValue = weeklyMax.get(weekKey);
      if (weekValue !== undefined) {
        lastKnown = weekValue;
      }
      return {
        sessionId: `${weekKey}`,
        date: formatDate(weekKey),
        grade: lastKnown,
      };
    });

    const recentSessions = sessions.slice(-6);
    const gradeBuckets = new Map<string, number>();
    const volumeBySession = recentSessions.map((session) => {
      const climbs = climbsBySession.get(session.id) ?? [];
      const counts: Record<string, number> = {};
      climbs.forEach((climb) => {
        const label = climb.gradeLabel;
        counts[label] = (counts[label] ?? 0) + 1;
        gradeBuckets.set(label, (gradeBuckets.get(label) ?? 0) + 1);
      });
      return {
        sessionId: session.id,
        date: formatDate(session.started_at),
        weekday: formatWeekday(session.started_at),
        counts,
        total: climbs.length,
      };
    });

    const gradeLabels = Array.from(gradeBuckets.keys()).sort(compareGradeLabels);

    return {
      sessionsCount: sessions.length,
      sendsCount,
      maxGradeLabel,
      trend,
      volumeBySession,
      gradeLabels,
    };
  }, []);

  const trendPoints = analytics.trend.slice(-12);
  const maxTrend = Math.max(1, ...trendPoints.map((point) => point.grade));
  const minTrend = Math.min(0, ...trendPoints.map((point) => point.grade));
  const trendRange = maxTrend - minTrend || 1;
  const chartHeight = 140;
  const chartPadding = spacing.xs;
  const chartWidth = Math.max(0, trendWidth - chartPadding * 2);

  const trendPlot = trendPoints.map((point, index) => {
    const x = trendPoints.length <= 1
      ? chartPadding
      : chartPadding + (chartWidth * index) / (trendPoints.length - 1);
    const y = chartPadding + (chartHeight - chartPadding * 2)
      - ((point.grade - minTrend) / trendRange) * (chartHeight - chartPadding * 2);
    return { ...point, x, y };
  });

  return (
    <SafeAreaView style={[styles.container, { paddingTop: safeTop }]}>
      <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Analytics // V-Scale</Text>
        {onOpenHistory ? (
          <Button label="Sessions" variant="secondary" onPress={onOpenHistory} style={styles.historyButton} />
        ) : null}
      </View>

      <View style={styles.metricRow}>
        <MetricCard label="Max Grade" value={analytics.maxGradeLabel} accentColor={colors.accent} />
        <MetricCard label="Sessions" value={`${analytics.sessionsCount}`} accentColor={colors.accentSoft} />
        <MetricCard label="Sends" value={`${analytics.sendsCount}`} accentColor={colors.accent} />
      </View>

      <Text style={styles.sectionLabel}>Hardest Send Trend</Text>
      <Card style={styles.trendCard}>
        <View style={styles.trendMetaRow}>
          <Text style={styles.trendMeta}>Metric - V-Grade Midpoint</Text>
          <Text style={styles.trendMeta}>Last 8 Weeks</Text>
        </View>
        <View
          style={styles.trendChart}
          onLayout={(event) => setTrendWidth(event.nativeEvent.layout.width)}
        >
          {trendPlot.map((point, index) => {
            const next = trendPlot[index + 1];
            if (!next) {
              return null;
            }
            const dx = next.x - point.x;
            const dy = next.y - point.y;
            const length = Math.sqrt(dx * dx + dy * dy) || 1;
            const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
            return (
              <View
                key={`${point.sessionId}-line`}
                style={[
                  styles.trendLine,
                  {
                    width: length,
                    left: point.x,
                    top: point.y,
                    transform: [
                      { translateX: -length / 2 },
                      { rotate: `${angle}deg` },
                      { translateX: length / 2 },
                    ],
                  },
                ]}
              />
            );
          })}
          {trendPlot.map((point) => (
            <View
              key={`${point.sessionId}-dot`}
              style={[styles.trendDot, { left: point.x - 4, top: point.y - 4 }]}
            />
          ))}
        </View>
        <View style={styles.trendAxis}>
          {trendPoints.map((point) => (
            <Text key={point.sessionId} style={styles.trendAxisLabel}>
              {point.date}
            </Text>
          ))}
        </View>
      </Card>

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionLabel}>Volume By Grade</Text>
        <Text style={styles.sectionMeta}>Last {analytics.volumeBySession.length} Sessions</Text>
      </View>
      <Divider style={styles.divider} />

      {analytics.volumeBySession.length === 0 ? (
        <Text style={styles.emptyText}>No sessions yet.</Text>
      ) : (
        analytics.volumeBySession.map((session, index) => (
          <View key={session.sessionId} style={styles.volumeRow}>
            <View style={styles.volumeLabelCol}>
              <Text style={styles.volumeLabel}>Session {analytics.volumeBySession.length - index}</Text>
              <Text style={styles.volumeSubLabel}>
                {session.weekday} - {session.date}
              </Text>
            </View>
            <Pressable
              style={styles.volumeBar}
              onPress={() =>
                setSelectedVolumeSessionId((prev) => (prev === session.sessionId ? null : session.sessionId))
              }
            >
              {analytics.gradeLabels.map((label, gradeIndex) => (
                <View
                  key={`${session.sessionId}-${label}`}
                  style={[
                    styles.volumeSegment,
                    {
                      flex: session.counts[label] ?? 0,
                      backgroundColor: colors.gradePalette[gradeIndex % colors.gradePalette.length],
                    },
                  ]}
                />
              ))}
            </Pressable>
            <Text style={styles.volumeCount}>{session.total} climbs</Text>
            {selectedVolumeSessionId === session.sessionId ? (
              <Card style={styles.breakdownCard}>
                <Text style={styles.breakdownTitle}>Grade Breakdown</Text>
                {analytics.gradeLabels.filter((label) => (session.counts[label] ?? 0) > 0).length === 0 ? (
                  <Text style={styles.breakdownEmpty}>No climbs in this session.</Text>
                ) : (
                  analytics.gradeLabels.map((label, gradeIndex) => {
                    const count = session.counts[label] ?? 0;
                    if (count === 0) {
                      return null;
                    }
                    return (
                      <View key={`${session.sessionId}-detail-${label}`} style={styles.breakdownRow}>
                        <View
                          style={[
                            styles.breakdownDot,
                            { backgroundColor: colors.gradePalette[gradeIndex % colors.gradePalette.length] },
                          ]}
                        />
                        <Text style={styles.breakdownLabel}>{label}</Text>
                        <Text style={styles.breakdownValue}>{count}</Text>
                      </View>
                    );
                  })
                )}
              </Card>
            ) : null}
          </View>
        ))
      )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.sm,
    paddingBottom: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  title: {
    ...typography.title,
  },
  historyButton: {
    minHeight: 36,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  metricRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  sectionLabel: {
    ...typography.section,
    marginBottom: spacing.xs,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  sectionMeta: {
    color: colors.textMuted,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  trendCard: {
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  trendMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  trendMeta: {
    color: colors.textMuted,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  trendChart: {
    position: 'relative',
    height: 140,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xs,
    overflow: 'hidden',
  },
  trendLine: {
    position: 'absolute',
    height: 2,
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
  },
  trendDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  trendAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  trendAxisLabel: {
    fontSize: 9,
    color: colors.textMuted,
  },
  divider: {
    marginVertical: spacing.xs,
  },
  volumeRow: {
    marginBottom: spacing.sm,
  },
  volumeLabelCol: {
    marginBottom: spacing.xs,
  },
  volumeLabel: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  volumeSubLabel: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  volumeBar: {
    flexDirection: 'row',
    height: 18,
    borderRadius: radius.pill,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  volumeSegment: {
    height: '100%',
  },
  volumeCount: {
    marginTop: spacing.xs,
    color: colors.textMuted,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  breakdownCard: {
    marginTop: spacing.xs,
    padding: spacing.sm,
  },
  breakdownTitle: {
    color: colors.textSecondary,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  breakdownEmpty: {
    color: colors.textMuted,
    fontSize: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  breakdownDot: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
    marginRight: 8,
  },
  breakdownLabel: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  breakdownValue: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 12,
  },
});
