import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { appendEvent, getSessionById, setSessionStatus } from '../domain/sessionStore';
import { useClimbSessionLogs } from '../hooks/useClimbSessionLogs';
import type { RootStackScreenProps } from '../navigation/types';
import { Button, Chip, Divider, IconButton, colors, radius, spacing, typography } from '../ui';

type GradeOption = {
  label: string;
  min: number;
  max: number;
};

type ScaleOption = 'tape' | 'vscale' | 'french';

type ClimbSessionScreenProps = RootStackScreenProps<'ClimbLogger'>;

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

const formatDurationParts = (ms: number) => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return {
    hours: hours.toString().padStart(2, '0'),
    minutes: minutes.toString().padStart(2, '0'),
    seconds: seconds.toString().padStart(2, '0'),
  };
};

const formatLogTime = (ms: number): string => {
  const date = new Date(ms);
  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');
  return `${hours}:${minutes}`;
};

export const ClimbSessionScreen = ({ route, navigation }: ClimbSessionScreenProps) => {
  const { sessionId } = route.params;
  const session = getSessionById(sessionId);

  const [tick, setTick] = useState(0);
  const [selectedGrade, setSelectedGrade] = useState<GradeOption>(GRADE_OPTIONS[4]);
  const [scale, setScale] = useState<ScaleOption>('tape');

  useEffect(() => {
    const interval = setInterval(() => setTick((prev) => prev + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const logs = useClimbSessionLogs(sessionId, tick);
  const recentLogs = useMemo(() => logs.slice().reverse(), [logs]);
  const duration = formatDurationParts(Date.now() - (session?.started_at ?? Date.now()));
  const points = recentLogs.length * 5;

  const handleFinish = () => {
    setSessionStatus(sessionId, 'completed');
    navigation.navigate('Tabs');
  };

  if (!session) {
    return (
      <View style={styles.screen}>
        <Text style={{ color: colors.textMuted, padding: 16 }}>Session not found.</Text>
      </View>
    );
  }

  const handleLog = (result: 'SEND' | 'FLASH') => {
    appendEvent(sessionId, 'CLIMB_LOGGED', {
      gradeLabel: selectedGrade.label,
      gradeMin: selectedGrade.min,
      gradeMax: selectedGrade.max,
      result,
    });
  };

  const handleUndo = () => {
    appendEvent(sessionId, 'CLIMB_UNDONE', { at: Date.now() });
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Log Session</Text>
          <Text style={styles.subtitle}>Boulder Co. Downtown - Today</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.timerPill}>
            <Text style={styles.timerText}>
              {duration.hours}:{duration.minutes}:{duration.seconds}
            </Text>
          </View>
          <IconButton label="..." />
        </View>
      </View>

      <View style={styles.segmentRow}>
        <Chip label="Tape Only" selected={scale === 'tape'} onPress={() => setScale('tape')} />
        <Chip label="V-Scale" selected={scale === 'vscale'} onPress={() => setScale('vscale')} />
        <Chip label="French" selected={scale === 'french'} onPress={() => setScale('french')} />
      </View>

      <Text style={styles.sectionLabel}>Select Route</Text>
      <View style={styles.gradeGrid}>
        {GRADE_OPTIONS.map((grade, index) => {
          const color = colors.gradePalette[index % colors.gradePalette.length];
          const active = selectedGrade.label === grade.label;
          return (
            <Pressable
              key={grade.label}
              style={[
                styles.gradeTile,
                { backgroundColor: color },
                active ? styles.gradeTileActive : null,
              ]}
              onPress={() => setSelectedGrade(grade)}
            >
              <Text style={styles.gradeText}>{grade.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.actionRow}>
        <Button label="Flash" variant="warning" onPress={() => handleLog('FLASH')} style={styles.actionButton} />
        <Button label="Send" variant="success" onPress={() => handleLog('SEND')} style={styles.actionButton} />
      </View>

      <View style={styles.sessionHeaderRow}>
        <Text style={styles.sectionLabel}>Current Session ({recentLogs.length})</Text>
        <View style={styles.pointsPill}>
          <Text style={styles.pointsText}>{points} Points</Text>
        </View>
      </View>

      <View style={styles.logHeaderRow}>
        <Text style={styles.sectionLabel}>Recent Logs</Text>
        <Button
          label="Undo"
          variant="ghost"
          onPress={handleUndo}
          style={styles.undoButton}
          textStyle={styles.undoText}
        />
      </View>
      <Divider style={styles.divider} />

      <ScrollView style={styles.logList} contentContainerStyle={styles.logListContent}>
        {recentLogs.length === 0 ? <Text style={styles.emptyText}>No climbs logged yet.</Text> : null}
        {recentLogs.map((log, index) => (
          <View key={`${log.gradeLabel}-${index}`} style={styles.logRow}>
            <View
              style={[
                styles.logAccent,
                log.result === 'SEND' ? styles.logAccentSend : styles.logAccentFlash,
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
            <Text style={styles.logTime}>{formatLogTime(log.createdAt)}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.finishBar}>
        <Button label="Finish Session" onPress={handleFinish} style={styles.finishButton} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.title,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  timerPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  timerText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.sm,
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
  },
  gradeText: {
    color: colors.textInverse,
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
  sessionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pointsPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.accentMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pointsText: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  logHeaderRow: {
    marginTop: spacing.xs,
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
