import { useCallback, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  buildDayDots,
  buildSessionReplayMap,
} from '../domain/calendarInsights';
import { formatLocalDate } from '../domain/dateUtils';
import { getSessionsForMonth } from '../domain/sessionStore';
import type { SessionRow } from '../domain/types';
import type { RootStackParamList, TabParamList } from '../navigation/types';
import { colors, spacing } from '../ui';
import { typography } from '../ui/tokens/typography';

type CalendarNavProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Calendar'>,
  NativeStackNavigationProp<RootStackParamList>
>;

const WEEKDAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DOT_CLIMB = colors.accent;
const DOT_STRENGTH = colors.success;

function todayDate(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function firstOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
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

export function CalendarScreen() {
  const navigation = useNavigation<CalendarNavProp>();
  const today = todayDate();

  const [currentMonth, setCurrentMonth] = useState<Date>(() =>
    firstOfMonth(today)
  );
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  // Trigger to force refresh when screen re-focuses
  const [refreshKey, setRefreshKey] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setRefreshKey((k) => k + 1);
    }, [])
  );

  const canGoPrev = true;
  const canGoNext = true;

  const monthSessions = useMemo(() => {
    // refreshKey intentionally used to bust memo on focus
    void refreshKey;
    return getSessionsForMonth(
      currentMonth.getFullYear(),
      currentMonth.getMonth()
    );
  }, [currentMonth, refreshKey]);

  const sessionReplayById = useMemo(() => {
    return buildSessionReplayMap(monthSessions, {
      climb: DOT_CLIMB,
      strength: DOT_STRENGTH,
    });
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
    return buildDayDots(sessionsByDate, sessionReplayById, {
      climb: DOT_CLIMB,
      strength: DOT_STRENGTH,
    });
  }, [sessionReplayById, sessionsByDate]);

  const grid = useMemo(() => buildMonthGrid(currentMonth), [currentMonth]);

  function selectMonth(monthOffset: number) {
    setCurrentMonth((month) => {
      const target = new Date(month.getFullYear(), month.getMonth() + monthOffset, 1);
      setSelectedDate((selected) => {
        const daysInTargetMonth = new Date(
          target.getFullYear(),
          target.getMonth() + 1,
          0
        ).getDate();
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
  const selectedSessions = sessionsByDate.get(selectedKey) ?? [];

  function formatTime(ts: number): string {
    const d = new Date(ts);
    const h = `${d.getHours()}`.padStart(2, '0');
    const min = `${d.getMinutes()}`.padStart(2, '0');
    return `${h}:${min}`;
  }

  function formatSessionTitle(session: SessionRow): string {
    return session.title?.trim() || (session.type === 'climb' ? 'Climbing' : 'Strength');
  }

  return (
    <View style={styles.root}>
      {/* Month navigation header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={prevMonth}
          disabled={!canGoPrev}
          style={styles.navBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={[styles.navArrow, !canGoPrev && styles.navArrowDisabled]}>
            {'<'}
          </Text>
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
          <Text style={[styles.navArrow, !canGoNext && styles.navArrowDisabled]}>
            {'>'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Weekday labels */}
      <View style={styles.weekdayRow}>
        {WEEKDAY_LABELS.map((label) => (
          <View key={label} style={styles.weekdayCell}>
            <Text style={styles.weekdayText}>{label}</Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={styles.grid}>
        {grid.map((day, idx) => {
          if (!day) {
            return <View key={`blank-${idx}`} style={styles.dayCell} />;
          }

          const key = formatLocalDate(day);
          const daySessions = sessionsByDate.get(key) ?? [];
          const dayDots = dotsByDate.get(key);
          const isToday =
            day.getFullYear() === today.getFullYear() &&
            day.getMonth() === today.getMonth() &&
            day.getDate() === today.getDate();
          const isSelected =
            day.getFullYear() === selectedDate.getFullYear() &&
            day.getMonth() === selectedDate.getMonth() &&
            day.getDate() === selectedDate.getDate();

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

      {/* Divider */}
      <View style={styles.divider} />

      {/* Selected day sessions panel */}
      <ScrollView
        style={styles.sessionPanel}
        contentContainerStyle={styles.sessionPanelContent}
      >
        <Text style={styles.panelDateLabel}>
          {selectedDate.getDate()}{' '}
          {MONTH_NAMES[selectedDate.getMonth()].slice(0, 3)}{' '}
          {selectedDate.getFullYear()}
        </Text>

        {selectedSessions.length === 0 ? (
          <Text style={styles.noSessions}>No sessions on this day</Text>
        ) : (
          <View style={styles.selectedSessionsBlock}>
            {selectedSessions.map((session) => (
              <TouchableOpacity
                key={session.id}
                style={styles.sessionRow}
                onPress={() =>
                  navigation.navigate('SessionDetail', { sessionId: session.id })
                }
                activeOpacity={0.75}
              >
                <View style={styles.sessionRowLeft}>
                  <View
                    style={[
                      styles.sessionTypeDot,
                      {
                        backgroundColor:
                          sessionReplayById.get(session.id)?.dotColor ??
                          (session.type === 'climb' ? DOT_CLIMB : DOT_STRENGTH),
                      },
                    ]}
                  />
                  <Text style={styles.sessionTypeLabel}>
                    {formatSessionTitle(session)}
                  </Text>
                </View>
                <View style={styles.sessionRowRight}>
                  <Text style={styles.sessionTime}>
                    {formatTime(session.started_at)}
                  </Text>
                  <Text style={styles.sessionChevron}>{'>'}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const DAY_CELL_SIZE = 40;
const DOT_SIZE = 5;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: spacing.lg,
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
  panelDateLabel: {
    ...typography.section,
    marginBottom: spacing.xs,
  },
  noSessions: {
    ...typography.bodyMuted,
    color: colors.textMuted,
    paddingVertical: spacing.sm,
  },
  selectedSessionsBlock: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sessionRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
  sessionChevron: {
    color: colors.textMuted,
    fontSize: 14,
  },
});
