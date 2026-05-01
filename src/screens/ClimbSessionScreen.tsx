import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  ensureSelectedClimbGym,
  getGradeOptionsForGym,
  getGyms,
  getSelectedClimbGym,
} from '../domain/gymStore';
import { appendEvent, getSessionById, setSessionStatus } from '../domain/sessionStore';
import { useClimbSessionLogs } from '../hooks/useClimbSessionLogs';
import type { RootStackScreenProps } from '../navigation/types';
import { Button, Divider, colors, radius, spacing, typography } from '../ui';

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

const GRADE_OPTIONS: GradeOption[] = [
  { id: 'v0', label: 'V0', min: 0, max: 0 },
  { id: 'v1', label: 'V1', min: 1, max: 1 },
  { id: 'v2', label: 'V2', min: 2, max: 2 },
  { id: 'v3', label: 'V3', min: 3, max: 3 },
  { id: 'v4', label: 'V4', min: 4, max: 4 },
  { id: 'v5', label: 'V5', min: 5, max: 5 },
  { id: 'v6', label: 'V6', min: 6, max: 6 },
  { id: 'v7-plus', label: 'V7+', min: 7, max: 10 },
];

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

const formatLogTime = (ms: number): string => {
  const date = new Date(ms);
  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');
  return `${hours}:${minutes}`;
};

export const ClimbSessionScreen = ({ route, navigation }: ClimbSessionScreenProps) => {
  const { sessionId } = route.params;
  const session = getSessionById(sessionId);

  const [refreshKey, setRefreshKey] = useState(0);
  const [currentGym, setCurrentGym] = useState<GymLike | null>(null);
  const [gradeOptions, setGradeOptions] = useState<GradeOption[]>(GRADE_OPTIONS);
  const [selectedGrade, setSelectedGrade] = useState<GradeOption>(GRADE_OPTIONS[0]);

  const logs = useClimbSessionLogs(sessionId, refreshKey);
  const recentLogs = useMemo(() => logs.slice().reverse(), [logs]);

  useFocusEffect(
    useCallback(() => {
      const routeGymId = route.params.gymId;
      const sessionGymId = session?.gym_id ?? null;
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
    }, [route.params.gymId, session?.gym_id])
  );

  const bump = () => setRefreshKey((k) => k + 1);

  const handleLog = (result: 'SEND' | 'FLASH') => {
    if (session?.status !== 'active') return;
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
    setSessionStatus(sessionId, 'completed');
    navigation.navigate('Tabs');
  };

  const handleAbandon = () => {
    if (session?.status !== 'active') {
      navigation.navigate('Tabs');
      return;
    }
    setSessionStatus(sessionId, 'abandoned');
    navigation.navigate('Tabs');
  };

  if (!session) {
    return (
      <View style={styles.screen}>
        <Text style={{ color: colors.textMuted, padding: 16 }}>Session not found.</Text>
      </View>
    );
  }

  const hasLogs = recentLogs.length > 0;

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Log climb</Text>

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

      <Text style={styles.sectionLabel}>Grade</Text>
      <View style={styles.gradeGrid}>
        {gradeOptions.map((grade, index) => {
          const color = grade.color ?? colors.gradePalette[index % colors.gradePalette.length];
          const active = selectedGrade.label === grade.label;
          return (
            <Pressable
              key={grade.id ?? grade.label}
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
        <Button label="Send" variant="success" onPress={() => handleLog('SEND')} style={styles.actionButton} />
        <Button label="Flash" variant="warning" onPress={() => handleLog('FLASH')} style={styles.actionButton} />
      </View>

      <View style={styles.logHeaderRow}>
        <Text style={styles.sectionLabel}>
          Logged{recentLogs.length > 0 ? ` (${recentLogs.length})` : ''}
        </Text>
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
      <Divider style={styles.divider} />

      <ScrollView style={styles.logList} contentContainerStyle={styles.logListContent}>
        {recentLogs.length === 0 ? (
          <Text style={styles.emptyText}>No climbs logged yet. Hit Send or Flash to start.</Text>
        ) : null}
        {recentLogs.map((log, index) => {
          const gradeColor = log.gradeColor;
          return (
            <View key={`${log.gradeLabel}-${log.createdAt}-${index}`} style={styles.logRow}>
              <View
                style={[
                  styles.logAccent,
                  log.result === 'SEND' ? styles.logAccentSend : styles.logAccentFlash,
                  gradeColor ? { backgroundColor: gradeColor } : null,
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
          );
        })}
      </ScrollView>

      <View style={styles.finishBar}>
        {hasLogs ? (
          <Button label="Done" onPress={handleDone} style={styles.finishButton} />
        ) : (
          <Button label="Abandon Session" variant="ghost" onPress={handleAbandon} style={styles.finishButton} />
        )}
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
  title: {
    ...typography.title,
    marginBottom: spacing.sm,
  },
  gymSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    padding: spacing.sm,
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
  logHeaderRow: {
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
