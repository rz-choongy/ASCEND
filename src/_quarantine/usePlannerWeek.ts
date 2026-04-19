import { useMemo } from 'react';
import { addDays, formatLocalDate, startOfWeekMonday } from '../domain/dateUtils';
import {
  getCompletedSessionsInRange,
  getPlannedSessionsInRange,
  type CompletedSessionItem,
  type PlannedSessionItem,
} from '../domain/plannerStore';

export type WeekDayData = {
  date: string;
  planned: PlannedSessionItem[];
  completed: CompletedSessionItem[];
  extraCompleted: number;
};

export const usePlannerWeek = (focusDate: Date, refreshKey: number): WeekDayData[] => {
  return useMemo(() => {
    const monday = startOfWeekMonday(focusDate);
    const sunday = addDays(monday, 6);
    const start = formatLocalDate(monday);
    const end = formatLocalDate(sunday);

    const planned = getPlannedSessionsInRange(start, end);
    const completed = getCompletedSessionsInRange(start, end);

    const days: WeekDayData[] = [];
    for (let i = 0; i < 7; i += 1) {
      const date = formatLocalDate(addDays(monday, i));
      const plannedForDay = planned.filter((item) => item.date === date);
      const completedForDay = completed.filter((item) => item.date === date);

      const plannedByType = {
        strength: plannedForDay.filter((item) => item.sessionType === 'strength').length,
        climb: plannedForDay.filter((item) => item.sessionType === 'climb').length,
      };
      const completedByType = {
        strength: completedForDay.filter((item) => item.sessionType === 'strength').length,
        climb: completedForDay.filter((item) => item.sessionType === 'climb').length,
      };
      const consumedByType = {
        strength: Math.min(plannedByType.strength, completedByType.strength),
        climb: Math.min(plannedByType.climb, completedByType.climb),
      };
      const consumedCursor = { strength: 0, climb: 0 };
      const remainingPlanned = plannedForDay.filter((item) => {
        if (consumedCursor[item.sessionType] < consumedByType[item.sessionType]) {
          consumedCursor[item.sessionType] += 1;
          return false;
        }
        return true;
      });

      const extraCompleted =
        Math.max(0, completedByType.strength - plannedByType.strength) +
        Math.max(0, completedByType.climb - plannedByType.climb);

      days.push({
        date,
        planned: remainingPlanned,
        completed: completedForDay,
        extraCompleted,
      });
    }

    return days;
  }, [focusDate, refreshKey]);
};
