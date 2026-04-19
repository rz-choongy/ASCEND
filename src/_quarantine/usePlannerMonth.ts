import { useMemo } from 'react';
import { addDays, endOfMonth, formatLocalDate, startOfMonth, startOfWeekMonday } from '../domain/dateUtils';
import { getCompletedSessionsInRange, getPlannedSessionsInRange } from '../domain/plannerStore';

export type MonthCell = {
  date: string;
  inCurrentMonth: boolean;
  hasPlanned: boolean;
  hasCompleted: boolean;
};

export const usePlannerMonth = (focusDate: Date, refreshKey: number): MonthCell[] => {
  return useMemo(() => {
    const firstDay = startOfMonth(focusDate);
    const lastDay = endOfMonth(focusDate);
    const gridStart = startOfWeekMonday(firstDay);
    const gridEnd = addDays(startOfWeekMonday(lastDay), 6);

    const planned = getPlannedSessionsInRange(formatLocalDate(gridStart), formatLocalDate(gridEnd));
    const completed = getCompletedSessionsInRange(formatLocalDate(gridStart), formatLocalDate(gridEnd));

    const plannedCountByDateAndType = new Map<string, { strength: number; climb: number }>();
    const completedCountByDateAndType = new Map<string, { strength: number; climb: number }>();

    planned.forEach((item) => {
      const counts = plannedCountByDateAndType.get(item.date) ?? { strength: 0, climb: 0 };
      counts[item.sessionType] += 1;
      plannedCountByDateAndType.set(item.date, counts);
    });

    completed.forEach((item) => {
      const counts = completedCountByDateAndType.get(item.date) ?? { strength: 0, climb: 0 };
      counts[item.sessionType] += 1;
      completedCountByDateAndType.set(item.date, counts);
    });

    const cells: MonthCell[] = [];
    let cursor = gridStart;
    while (cursor <= gridEnd) {
      const date = formatLocalDate(cursor);
      const plannedCounts = plannedCountByDateAndType.get(date) ?? { strength: 0, climb: 0 };
      const completedCounts = completedCountByDateAndType.get(date) ?? { strength: 0, climb: 0 };
      const hasRemainingPlanned =
        Math.max(0, plannedCounts.strength - completedCounts.strength) +
          Math.max(0, plannedCounts.climb - completedCounts.climb) >
        0;
      const hasCompleted = completedCounts.strength + completedCounts.climb > 0;

      cells.push({
        date,
        inCurrentMonth: cursor.getMonth() === focusDate.getMonth(),
        hasPlanned: hasRemainingPlanned,
        hasCompleted,
      });
      cursor = addDays(cursor, 1);
    }

    return cells;
  }, [focusDate, refreshKey]);
};
