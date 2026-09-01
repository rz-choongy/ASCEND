import { useCallback, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  buildDayDots,
  buildSessionReplayMap,
  type SessionReplay,
} from '../domain/calendarInsights';
import { addDays, formatDuration, formatLocalDate, startOfWeek } from '../domain/dateUtils';
import {
  getCompletedSessions,
  getSessionsForDateRange,
  getSessionsForMonth,
} from '../domain/sessionStore';
import type { SessionRow, SessionType } from '../domain/types';
import type { RootStackParamList, TabParamList } from '../navigation/types';
import { Chip, SegmentedControl, spacing, useTheme } from '../ui';
import type { ThemeColors } from '../ui/tokens/colors';
import type { Typography } from '../ui/tokens/typography';

type CalendarNavProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Calendar'>,
  NativeStackNavigationProp<RootStackParamList>
>;

type CalendarView = 'month' | 'week' | 'list';

const WEEKDAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const WEEKDAY_FULL = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function todayDate(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function firstOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Returns a Monday-anchored grid of Date | null for the month. */
function buildMonthGrid(monthStart: Date): (Date | null)[] {
  const year = monthStart.getFullYear();
  const month = monthStart.getMonth();
  const firstDayOfWeek = monthStart.getDay(); // 0=Sun
  // Convert to Mon-based offset: Mon=0, Sun=6.
  const offset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((offset + daysInMonth) / 7) * 7;

  const cells: (Date | null)[] = [];
  for (let i = 0; i < totalCells; i++) {
    const dayIndex = i - offset + 1;
    if (dayIndex < 1 || dayIndex > daysInMonth) {
      cells.push(null);
    } else {
      cells.push(new Date(year, month, dayIndex));
    }
  }
  return cells;
}

type SessionGroup = { dateKey: string; date: Date; sessions: SessionRow[] };

function groupSessionsByDay(sessions: SessionRow[], order: 'asc' | 'desc'): SessionGroup[] {
  const map = new Map<string, SessionRow[]>();
  sessions.forEach((session) => {
    const key = formatLocalDate(new Date(session.started_at));
    const existing = map.get(key) ?? [];
    existing.push(session);
    map.set(key, existing);
  });
  const groups = Array.from(map.entries()).map(([dateKey, sess]) => ({
    dateKey,
    date: new Date(sess[0].started_at),
    sessions: sess.slice().sort((a, b) => a.started_at - b.started_at),
  }));
  groups.sort((a, b) =>
    order === 'desc' ? b.date.getTime() - a.date.getTime() : a.date.getTime() - b.date.getTime()
  );
  return groups;
}

function formatWeekRangeLabel(weekStart: Date): string {
  const weekEnd = addDays(weekStart, 6);
  const startLabel = `${weekStart.getDate()} ${MONTH_NAMES[weekStart.getMonth()].slice(0, 3)}`;
  const endLabel =
    weekStart.getMonth() === weekEnd.getMonth()
      ? `${weekEnd.getDate()}`
      : `${weekEnd.getDate()} ${MONTH_NAMES[weekEnd.getMonth()].slice(0, 3)}`;
  return `${startLabel} – ${endLabel} ${weekEnd.getFullYear()}`;
}

export function CalendarScreen() {
  const navigation = useNavigation<CalendarNavProp>();
  const { colors, typography } = useTheme();
  const styles = useMemo(() => createStyles(colors, typography), [colors, typography]);
  const DOT_CLIMB = colors.accent;
  const DOT_STRENGTH = colors.success;
  const today = todayDate();

  const [viewMode, setViewMode] = useState<CalendarView>('month');
  const [currentMonth, setCurrentMonth] = useState<Date>(() => firstOfMonth(today));
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [typeFilter, setTypeFilter] = useState<SessionType | null>(null);
  // Trigger to force refresh when screen re-focuses
  const [refreshKey, setRefreshKey] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setRefreshKey((k) => k + 1);
      setSelectedDate(todayDate());
    }, [])
  );

  const thisMonth = firstOfMonth(today);
  const earliestMonth = new Date(thisMonth.getFullYear(), thisMonth.getMonth() - 12, 1);
  const canGoPrev = currentMonth.getTime() > earliestMonth.getTime();
  const canGoNext = currentMonth.getTime() < thisMonth.getTime();

  const monthSessions = useMemo(() => {
    // refreshKey intentionally used to bust memo on focus
    void refreshKey;
    return getSessionsForMonth(currentMonth.getFullYear(), currentMonth.getMonth());
  }, [currentMonth, refreshKey]);

  const sessionReplayById = useMemo(() => {
    return buildSessionReplayMap(monthSessions, { climb: DOT_CLIMB, strength: DOT_STRENGTH });
  }, [monthSessions]);

  /** Map of 'YYYY-MM-DD' -> SessionRow[] */
  const sessionsByDate = useMemo(() => {
    const map = new Map<string, SessionRow[]>();
    for (const s of monthSessions) {
      const key = formatLocalDate(new Date(s.started_at));
      const existing = map.get(key) ?? [];
      existing.push(s);
      map.set(key, existing);
    }
    return map;
  }, [monthSessions]);

  const dotsByDate = useMemo(() => {
    return buildDayDots(sessionsByDate, sessionReplayById, { climb: DOT_CLIMB, strength: DOT_STRENGTH });
  }, [sessionReplayById, sessionsByDate]);

  const grid = useMemo(() => buildMonthGrid(currentMonth), [currentMonth]);

  function selectMonth(monthOffset: number) {
    setCurrentMonth((month) => {
      const target = new Date(month.getFullYear(), month.getMonth() + monthOffset, 1);
      setSelectedDate((selected) => {
        const daysInTargetMonth = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
        const selectedDay = Math.min(selected.getDate(), daysInTargetMonth);
        return new Date(target.getFullYear(), target.getMonth(), selectedDay);
      });
      return target;
    });
  }

  function prevMonth() {
    if (!canGoPrev) return;
    selectMonth(-1);
  }

  function nextMonth() {
    if (!canGoNext) return;
    selectMonth(1);
  }

  const selectedKey = formatLocalDate(selectedDate);
  const selectedSessions = useMemo(() => {
    const all = sessionsByDate.get(selectedKey) ?? [];
    return typeFilter ? all.filter((s) => s.type === typeFilter) : all;
  }, [sessionsByDate, selectedKey, typeFilter]);

  // Week view
  const weekStart = useMemo(() => startOfWeek(selectedDate), [selectedDate]);
  const canGoPrevWeek = weekStart.getTime() > startOfWeek(earliestMonth).getTime();
  const canGoNextWeek = weekStart.getTime() < startOfWeek(today).getTime();

  const weekSessions = useMemo(() => {
    void refreshKey;
    return getSessionsForDateRange(weekStart.getTime(), addDays(weekStart, 7).getTime());
  }, [weekStart, refreshKey]);

  const weekSessionReplayById = useMemo(
    () => buildSessionReplayMap(weekSessions, { climb: DOT_CLIMB, strength: DOT_STRENGTH }),
    [weekSessions]
  );

  const filteredWeekSessions = useMemo(
    () => (typeFilter ? weekSessions.filter((s) => s.type === typeFilter) : weekSessions),
    [weekSessions, typeFilter]
  );

  const weekGroups = useMemo(
    () => groupSessionsByDay(filteredWeekSessions, 'desc'),
    [filteredWeekSessions]
  );

  function prevWeek() {
    if (!canGoPrevWeek) return;
    setSelectedDate((d) => addDays(d, -7));
  }

  function nextWeek() {
    if (!canGoNextWeek) return;
    setSelectedDate((d) => addDays(d, 7));
  }

  // List view (all-time)
  const allSessions = useMemo(() => {
    void refreshKey;
    return getCompletedSessions();
  }, [refreshKey]);

  const allSessionReplayById = useMemo(
    () => buildSessionReplayMap(allSessions, { climb: DOT_CLIMB, strength: DOT_STRENGTH }),
    [allSessions]
  );

  const filteredAllSessions = useMemo(
    () => (typeFilter ? allSessions.filter((s) => s.type === typeFilter) : allSessions),
    [allSessions, typeFilter]
  );

  const allGroups = useMemo(() => groupSessionsByDay(filteredAllSessions, 'desc'), [filteredAllSessions]);

  function formatTime(ts: number): string {
    const d = new Date(ts);
    const h = `${d.getHours()}`.padStart(2, '0');
    const min = `${d.getMinutes()}`.padStart(2, '0');
    return `${h}:${min}`;
  }

  function formatSessionTitle(session: SessionRow): string {
    return session.title?.trim() || (session.type === 'climb' ? 'Climbing' : 'Strength');
  }

  function formatGroupLabel(date: Date): string {
    if (sameDay(date, today)) return `Today · ${date.getDate()} ${MONTH_NAMES[date.getMonth()].slice(0, 3)}`;
    return `${WEEKDAY_FULL[date.getDay()]} · ${date.getDate()} ${MONTH_NAMES[date.getMonth()].slice(0, 3)}`;
  }

  function renderSessionItem(session: SessionRow, replayById: Map<string, SessionReplay>) {
    const replay = replayById.get(session.id);
    const nodeColor = replay?.dotColor ?? (session.type === 'climb' ? DOT_CLIMB : DOT_STRENGTH);
    const hardestGradeLabel = session.type === 'climb' ? replay?.hardestGradeLabel : undefined;

    return (
      <View key={session.id} style={styles.timelineItem}>
        <View style={[styles.timelineNode, { backgroundColor: nodeColor }]} />
        <TouchableOpacity
          style={styles.timelineCard}
          onPress={() => navigation.navigate('SessionDetail', { sessionId: session.id })}
          activeOpacity={0.75}
        >
          <View style={styles.timelineCardLeft}>
            {hardestGradeLabel ? (
              <View style={[styles.gradeBadge, { backgroundColor: nodeColor }]}>
                <Text style={styles.gradeBadgeText}>{hardestGradeLabel}</Text>
              </View>
            ) : (
              <View style={[styles.sessionTypeDot, { backgroundColor: nodeColor }]} />
            )}
            <Text style={styles.sessionTypeLabel}>{formatSessionTitle(session)}</Text>
          </View>
          <View style={styles.sessionRowRight}>
            <Text style={styles.sessionTime}>{formatTime(session.started_at)}</Text>
            {session.completed_at != null ? (
              <Text style={styles.sessionDuration}>
                {formatDuration(session.started_at, session.completed_at)}
              </Text>
            ) : null}
            <Text style={styles.sessionChevron}>{'>'}</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  function renderGroupedTimeline(groups: SessionGroup[], replayById: Map<string, SessionReplay>) {
    if (groups.length === 0) {
      return <Text style={styles.noSessions}>No sessions here yet</Text>;
    }
    return groups.map((group) => (
      <View key={group.dateKey} style={styles.groupBlock}>
        <Text style={styles.groupDateLabel}>{formatGroupLabel(group.date)}</Text>
        <View style={styles.timeline}>
          <View style={styles.timelineLine} />
          {group.sessions.map((session) => renderSessionItem(session, replayById))}
        </View>
      </View>
    ));
  }

  const filterChips = (
    <View style={styles.filterChips}>
      <Chip label="All" selected={typeFilter === null} onPress={() => setTypeFilter(null)} />
      <Chip label="Climb" selected={typeFilter === 'climb'} onPress={() => setTypeFilter('climb')} />
      <Chip label="Strength" selected={typeFilter === 'strength'} onPress={() => setTypeFilter('strength')} />
    </View>
  );

  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      <View style={styles.viewSwitcher}>
        <SegmentedControl
          options={[
            { value: 'month', label: 'Month' },
            { value: 'week', label: 'Week' },
            { value: 'list', label: 'List' },
          ]}
          value={viewMode}
          onChange={setViewMode}
        />
      </View>

      {viewMode === 'month' ? (
        <>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={prevMonth}
              disabled={!canGoPrev}
              style={styles.navBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={[styles.navArrow, !canGoPrev && styles.navArrowDisabled]}>{'<'}</Text>
            </TouchableOpacity>

            <Text style={styles.monthLabel}>
              {MONTH_NAMES[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </Text>

            <TouchableOpacity
              onPress={nextMonth}
              disabled={!canGoNext}
              style={styles.navBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={[styles.navArrow, !canGoNext && styles.navArrowDisabled]}>{'>'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.weekdayRow}>
            {WEEKDAY_LABELS.map((label) => (
              <View key={label} style={styles.weekdayCell}>
                <Text style={styles.weekdayText}>{label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.grid}>
            {grid.map((day, idx) => {
              if (!day) {
                return <View key={`blank-${idx}`} style={styles.dayCell} />;
              }

              const key = formatLocalDate(day);
              const dayDots = dotsByDate.get(key);
              const isToday = sameDay(day, today);
              const isSelected = sameDay(day, selectedDate);

              return (
                <TouchableOpacity
                  key={key}
                  style={styles.dayCell}
                  onPress={() => setSelectedDate(day)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.dayNumberWrapper,
                      isSelected && styles.dayNumberSelected,
                      isToday && !isSelected && styles.dayNumberToday,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayNumber,
                        isToday && !isSelected && styles.dayNumberTodayText,
                        isSelected && styles.dayNumberSelectedText,
                      ]}
                    >
                      {day.getDate()}
                    </Text>
                  </View>
                  <View style={styles.dotsRow}>
                    {dayDots?.climbColor && (
                      <View style={[styles.dot, { backgroundColor: dayDots.climbColor }]} />
                    )}
                    {dayDots?.strengthColor && (
                      <View style={[styles.dot, { backgroundColor: dayDots.strengthColor }]} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.divider} />

          <ScrollView style={styles.sessionPanel} contentContainerStyle={styles.sessionPanelContent}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelDateLabel}>
                {selectedDate.getDate()} {MONTH_NAMES[selectedDate.getMonth()].slice(0, 3)}{' '}
                {selectedDate.getFullYear()}
              </Text>
              {filterChips}
            </View>

            {selectedSessions.length === 0 ? (
              <Text style={styles.noSessions}>No sessions on this day</Text>
            ) : (
              <View style={styles.timeline}>
                <View style={styles.timelineLine} />
                {selectedSessions.map((session) => renderSessionItem(session, sessionReplayById))}
              </View>
            )}
          </ScrollView>
        </>
      ) : null}

      {viewMode === 'week' ? (
        <>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={prevWeek}
              disabled={!canGoPrevWeek}
              style={styles.navBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={[styles.navArrow, !canGoPrevWeek && styles.navArrowDisabled]}>{'<'}</Text>
            </TouchableOpacity>

            <Text style={styles.monthLabel}>{formatWeekRangeLabel(weekStart)}</Text>

            <TouchableOpacity
              onPress={nextWeek}
              disabled={!canGoNextWeek}
              style={styles.navBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={[styles.navArrow, !canGoNextWeek && styles.navArrowDisabled]}>{'>'}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.sessionPanel} contentContainerStyle={styles.sessionPanelContent}>
            <View style={styles.panelHeader}>{filterChips}</View>
            {renderGroupedTimeline(weekGroups, weekSessionReplayById)}
          </ScrollView>
        </>
      ) : null}

      {viewMode === 'list' ? (
        <ScrollView style={styles.sessionPanel} contentContainerStyle={styles.sessionPanelContent}>
          <View style={[styles.panelHeader, styles.listPanelHeader]}>{filterChips}</View>
          {renderGroupedTimeline(allGroups, allSessionReplayById)}
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
}

const DAY_CELL_SIZE = 40;
const DOT_SIZE = 5;

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: spacing.lg,
  },

  viewSwitcher: {
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
    alignItems: 'flex-start',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.xs,
  },
  navBtn: {
    padding: 4,
  },
  navArrow: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  navArrowDisabled: {
    color: colors.textMuted,
  },
  monthLabel: {
    ...typography.title,
    fontSize: 18,
  },

  // Weekday labels
  weekdayRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xs,
    marginBottom: 4,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  weekdayText: {
    ...typography.meta,
    fontSize: 11,
  },

  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.xs,
  },
  dayCell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    paddingVertical: 4,
    minHeight: DAY_CELL_SIZE + 12,
  },
  dayNumberWrapper: {
    width: DAY_CELL_SIZE - 6,
    height: DAY_CELL_SIZE - 6,
    borderRadius: (DAY_CELL_SIZE - 6) / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumberToday: {
    backgroundColor: colors.accentSoft,
  },
  dayNumberSelected: {
    backgroundColor: colors.accent,
  },
  dayNumber: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  dayNumberTodayText: {
    color: colors.accent,
    fontWeight: '700',
  },
  dayNumberSelectedText: {
    color: colors.textInverse,
    fontWeight: '700',
  },
  dotsRow: {
    flexDirection: 'row',
    marginTop: 3,
    gap: 2,
    minHeight: DOT_SIZE,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginTop: spacing.xs,
    marginHorizontal: spacing.sm,
  },

  // Session panel
  sessionPanel: {
    flex: 1,
  },
  sessionPanelContent: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
  },
  panelHeader: {
    marginBottom: spacing.xs,
    gap: spacing.xs,
  },
  listPanelHeader: {
    marginTop: spacing.xs,
  },
  panelDateLabel: {
    ...typography.section,
  },
  filterChips: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  noSessions: {
    ...typography.bodyMuted,
    color: colors.textMuted,
    paddingVertical: spacing.sm,
  },

  groupBlock: {
    marginBottom: spacing.md,
  },
  groupDateLabel: {
    ...typography.meta,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },

  timeline: {
    position: 'relative',
    paddingLeft: 20,
  },
  timelineLine: {
    position: 'absolute',
    left: 5,
    top: 6,
    bottom: 6,
    width: 2,
    backgroundColor: colors.border,
  },
  timelineItem: {
    position: 'relative',
    marginBottom: spacing.xs,
  },
  timelineNode: {
    position: 'absolute',
    left: -20,
    top: 14,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: colors.background,
  },
  timelineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.surface,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  timelineCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  gradeBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  gradeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textInverse,
  },
  sessionTypeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sessionTypeLabel: {
    ...typography.body,
    fontSize: 15,
  },
  sessionRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sessionTime: {
    ...typography.bodyMuted,
  },
  sessionDuration: {
    ...typography.meta,
    color: colors.textMuted,
  },
  sessionChevron: {
    color: colors.textMuted,
    fontSize: 14,
  },
});
