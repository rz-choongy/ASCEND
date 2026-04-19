import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { addDays, parseLocalDate } from '../domain/dateUtils';
import type { SessionType } from '../domain/types';
import { usePlannerMonth } from '../hooks/usePlannerMonth';
import { usePlannerWeek } from '../hooks/usePlannerWeek';
import { Button, Card, Chip, Divider, colors, radius, spacing, typography } from '../ui';

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const ROUTINE_SECTIONS = {
  recent: [
    {
      id: 'max-hangs',
      name: 'Max Hangs (20mm)',
      focus: 'Strength',
      level: 'V6-V8',
      duration: '25 min',
      exercises: '1 Set',
      lastLog: 'Yesterday',
      color: '#1f6f7a',
    },
    {
      id: 'power-endo',
      name: '4x4 Power Endurance',
      focus: 'Power Enduro',
      level: 'V4-V6',
      duration: '45 min',
      exercises: '4 Sets',
      lastLog: '3d ago',
      color: '#4b3f8f',
    },
  ],
  saved: [
    {
      id: 'core-blast',
      name: 'Core Blast',
      focus: 'Conditioning',
      level: 'All Levels',
      duration: '30 min',
      exercises: '6 Exercises',
      lastLog: 'Never',
      color: '#7a2f4f',
    },
  ],
};

type PlannerScreenProps = {
  refreshKey: number;
  onAddPlannedSession: (date: string, sessionType: SessionType) => void;
  onStartPlannedSession: (plannedSessionId: string, sessionType: SessionType) => void;
  onOpenSummary: (sessionId: string) => void;
};

export const PlannerScreen = ({
  refreshKey,
  onAddPlannedSession,
  onStartPlannedSession,
  onOpenSummary,
}: PlannerScreenProps) => {
  const [topTab, setTopTab] = useState<'library' | 'planner'>('library');
  const [libraryTab, setLibraryTab] = useState<'mine' | 'browse'>('mine');
  const [mode, setMode] = useState<'week' | 'month'>('week');
  const [focusDate, setFocusDate] = useState<Date>(new Date());

  const weekDays = usePlannerWeek(focusDate, refreshKey);
  const monthCells = usePlannerMonth(focusDate, refreshKey);

  const weekLabel = `${weekDays[0]?.date ?? ''} to ${weekDays[6]?.date ?? ''}`;
  const monthLabel = focusDate.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  const rows = useMemo(() => {
    const result: typeof monthCells[] = [];
    for (let i = 0; i < monthCells.length; i += 7) {
      result.push(monthCells.slice(i, i + 7));
    }
    return result;
  }, [monthCells]);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Training</Text>
        {topTab === 'library' ? (
          <Button label="Search" variant="ghost" onPress={() => undefined} style={styles.searchButton} />
        ) : null}
      </View>

      <View style={styles.primaryTabs}>
        <Chip label="Library" selected={topTab === 'library'} onPress={() => setTopTab('library')} />
        <Chip label="Planner" selected={topTab === 'planner'} onPress={() => setTopTab('planner')} />
      </View>

      {topTab === 'library' ? (
        <>
          <View style={styles.tabRow}>
            <Chip label="My Routines" selected={libraryTab === 'mine'} onPress={() => setLibraryTab('mine')} />
            <Chip label="Browse" selected={libraryTab === 'browse'} onPress={() => setLibraryTab('browse')} />
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>Recents</Text>
              <Button label="Edit List" variant="ghost" onPress={() => undefined} style={styles.editButton} />
            </View>

            {ROUTINE_SECTIONS.recent.map((routine) => (
              <Card key={routine.id} style={styles.routineCard}>
                <View style={styles.routineHeader}>
                  <View style={[styles.routineIcon, { backgroundColor: routine.color }]} />
                  <View style={styles.routineInfo}>
                    <Text style={styles.routineTitle}>{routine.name}</Text>
                    <View style={styles.tagRow}>
                      <View style={styles.tagPill}>
                        <Text style={styles.tagText}>{routine.focus}</Text>
                      </View>
                      <View style={styles.tagPillMuted}>
                        <Text style={styles.tagTextMuted}>{routine.level}</Text>
                      </View>
                    </View>
                  </View>
                  <Text style={styles.chevron}>&gt;</Text>
                </View>
                <View style={styles.metaRow}>
                  <View>
                    <Text style={styles.metaLabel}>Duration</Text>
                    <Text style={styles.metaValue}>{routine.duration}</Text>
                  </View>
                  <View>
                    <Text style={styles.metaLabel}>Exercises</Text>
                    <Text style={styles.metaValue}>{routine.exercises}</Text>
                  </View>
                  <View>
                    <Text style={styles.metaLabel}>Last Log</Text>
                    <Text style={styles.metaValue}>{routine.lastLog}</Text>
                  </View>
                </View>
              </Card>
            ))}

            <Text style={styles.sectionLabel}>Saved Routines</Text>
            {ROUTINE_SECTIONS.saved.map((routine) => (
              <Card key={routine.id} style={styles.routineCard}>
                <View style={styles.routineHeader}>
                  <View style={[styles.routineIcon, { backgroundColor: routine.color }]} />
                  <View style={styles.routineInfo}>
                    <Text style={styles.routineTitle}>{routine.name}</Text>
                    <View style={styles.tagRow}>
                      <View style={styles.tagPill}>
                        <Text style={styles.tagText}>{routine.focus}</Text>
                      </View>
                      <View style={styles.tagPillMuted}>
                        <Text style={styles.tagTextMuted}>{routine.level}</Text>
                      </View>
                    </View>
                  </View>
                  <Text style={styles.chevron}>&gt;</Text>
                </View>
                <View style={styles.metaRow}>
                  <View>
                    <Text style={styles.metaLabel}>Duration</Text>
                    <Text style={styles.metaValue}>{routine.duration}</Text>
                  </View>
                  <View>
                    <Text style={styles.metaLabel}>Exercises</Text>
                    <Text style={styles.metaValue}>{routine.exercises}</Text>
                  </View>
                  <View>
                    <Text style={styles.metaLabel}>Last Log</Text>
                    <Text style={styles.metaValue}>{routine.lastLog}</Text>
                  </View>
                </View>
              </Card>
            ))}
          </ScrollView>

          <Pressable style={styles.fab} onPress={() => undefined}>
            <Text style={styles.fabText}>+</Text>
          </Pressable>
        </>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.modeRow}>
            <Chip label="Week" selected={mode === 'week'} onPress={() => setMode('week')} />
            <Chip label="Month" selected={mode === 'month'} onPress={() => setMode('month')} />
          </View>

          <View style={styles.navRow}>
            <Button
              label="Prev"
              variant="ghost"
              onPress={() => setFocusDate(addDays(focusDate, mode === 'week' ? -7 : -30))}
              style={styles.navButton}
              textStyle={styles.navButtonText}
            />
            <Text style={styles.navLabel}>{mode === 'week' ? weekLabel : monthLabel}</Text>
            <Button
              label="Next"
              variant="ghost"
              onPress={() => setFocusDate(addDays(focusDate, mode === 'week' ? 7 : 30))}
              style={styles.navButton}
              textStyle={styles.navButtonText}
            />
          </View>

          {mode === 'week' ? (
            <View style={styles.weekList}>
              {weekDays.map((day, index) => (
                <Card key={day.date} style={styles.dayCard}>
                  <View style={styles.dayHeader}>
                    <Text style={styles.dayTitle}>{WEEKDAY_LABELS[index]}</Text>
                    <Text style={styles.dayDate}>{day.date}</Text>
                  </View>

                  <Text style={styles.sectionLabel}>Planned</Text>
                  {day.planned.length === 0 ? <Text style={styles.emptyText}>None</Text> : null}
                  {day.planned.map((item) => (
                    <Pressable
                      key={item.id}
                      style={styles.planChip}
                      onPress={() => onStartPlannedSession(item.id, item.sessionType)}
                    >
                      <Text style={styles.planChipText}>{item.sessionType} (start)</Text>
                    </Pressable>
                  ))}

                  <View style={styles.addRow}>
                    <Button
                      label="Add Strength"
                      variant="ghost"
                      onPress={() => onAddPlannedSession(day.date, 'strength')}
                      style={styles.addButton}
                      textStyle={styles.addButtonText}
                    />
                    <Button
                      label="Add Climb"
                      variant="ghost"
                      onPress={() => onAddPlannedSession(day.date, 'climb')}
                      style={styles.addButton}
                      textStyle={styles.addButtonText}
                    />
                  </View>

                  <Divider style={styles.divider} />

                  <Text style={styles.sectionLabel}>Completed</Text>
                  {day.completed.length === 0 ? <Text style={styles.emptyText}>None</Text> : null}
                  {day.completed.map((item) => (
                    <Pressable
                      key={item.id}
                      style={styles.completedRow}
                      onPress={() => onOpenSummary(item.id)}
                    >
                      <Text style={styles.completedText}>{item.sessionType}</Text>
                      <Text style={styles.completedMeta}>Open</Text>
                    </Pressable>
                  ))}
                  {day.extraCompleted > 0 ? (
                    <Text style={styles.extraText}>Extra completed: {day.extraCompleted}</Text>
                  ) : null}
                </Card>
              ))}
            </View>
          ) : (
            <View style={styles.monthContainer}>
              <View style={styles.monthHeaderRow}>
                {WEEKDAY_LABELS.map((label) => (
                  <Text key={label} style={styles.monthHeaderText}>{label}</Text>
                ))}
              </View>
              {rows.map((row, rowIndex) => (
                <View key={`row-${rowIndex}`} style={styles.monthRow}>
                  {row.map((cell) => (
                    <Pressable
                      key={cell.date}
                      style={styles.monthCell}
                      onPress={() => {
                        setFocusDate(parseLocalDate(cell.date));
                        setMode('week');
                      }}
                    >
                      <Text style={[styles.monthDate, !cell.inCurrentMonth ? styles.monthDateMuted : null]}>
                        {parseLocalDate(cell.date).getDate()}
                      </Text>
                      <View style={styles.dotRow}>
                        {cell.hasPlanned ? <View style={[styles.dot, styles.dotPlanned]} /> : null}
                        {cell.hasCompleted ? <View style={[styles.dot, styles.dotCompleted]} /> : null}
                      </View>
                    </Pressable>
                  ))}
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerRow: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    ...typography.title,
  },
  primaryTabs: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
  },
  tabRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
  },
  searchButton: {
    minHeight: 36,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  scrollContent: {
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  sectionLabel: {
    ...typography.section,
    marginBottom: spacing.xs,
  },
  editButton: {
    minHeight: 32,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  routineCard: {
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  routineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routineIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    marginRight: spacing.xs,
  },
  routineInfo: {
    flex: 1,
  },
  routineTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  tagRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: 6,
  },
  tagPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.accentMuted,
  },
  tagText: {
    color: colors.accent,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '700',
  },
  tagPillMuted: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagTextMuted: {
    color: colors.textSecondary,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '700',
  },
  chevron: {
    color: colors.textMuted,
    fontSize: 16,
    marginLeft: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  metaLabel: {
    color: colors.textMuted,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  metaValue: {
    color: colors.textPrimary,
    fontSize: 12,
    marginTop: 4,
  },
  fab: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.sm,
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabText: {
    color: colors.textInverse,
    fontSize: 24,
    fontWeight: '700',
  },
  modeRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  navLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  navButton: {
    minHeight: 32,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  navButtonText: {
    fontSize: 10,
  },
  weekList: {
    gap: spacing.sm,
  },
  dayCard: {
    padding: spacing.sm,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  dayTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  dayDate: {
    color: colors.textMuted,
    fontSize: 11,
  },
  planChip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: spacing.xs,
  },
  planChipText: {
    color: colors.textSecondary,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  addRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  addButton: {
    flex: 1,
    minHeight: 34,
  },
  addButtonText: {
    fontSize: 10,
  },
  divider: {
    marginVertical: spacing.xs,
  },
  completedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  completedText: {
    color: colors.textPrimary,
    fontSize: 12,
    textTransform: 'capitalize',
  },
  completedMeta: {
    color: colors.accent,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  extraText: {
    color: colors.warning,
    fontSize: 11,
    marginTop: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 12,
  },
  monthContainer: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.sm,
  },
  monthHeaderRow: {
    flexDirection: 'row',
  },
  monthHeaderText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: spacing.xs,
    color: colors.textSecondary,
  },
  monthRow: {
    flexDirection: 'row',
  },
  monthCell: {
    flex: 1,
    aspectRatio: 1,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthDate: {
    fontSize: 12,
    color: colors.textPrimary,
  },
  monthDateMuted: {
    color: colors.textMuted,
  },
  dotRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
    minHeight: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotPlanned: {
    backgroundColor: colors.accent,
  },
  dotCompleted: {
    backgroundColor: colors.success,
  },
});
