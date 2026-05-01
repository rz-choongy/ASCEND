import { applyClimbEvents, type ClimbLog } from './climbLogUtils';
import { getSessionEvents } from './sessionStore';
import { applySetEvents, type LoggedSet } from './strengthLogUtils';
import type { SessionRow } from './types';

export type CalendarInsightColors = {
  climb: string;
  strength: string;
};

export type SessionReplay = {
  dotColor: string;
  climbs: ClimbLog[];
  sets: LoggedSet[];
};

export type DayDots = {
  climbColor?: string;
  strengthColor?: string;
};

export const buildSessionReplayMap = (
  sessions: SessionRow[],
  insightColors: CalendarInsightColors
): Map<string, SessionReplay> => {
  const map = new Map<string, SessionReplay>();

  for (const session of sessions) {
    const events = getSessionEvents(session.id);
    if (session.type === 'climb') {
      const climbs = applyClimbEvents(events);
      const lastClimb = climbs[climbs.length - 1];
      map.set(session.id, {
        dotColor: lastClimb?.gradeColor || insightColors.climb,
        climbs,
        sets: [],
      });
    } else {
      map.set(session.id, {
        dotColor: insightColors.strength,
        climbs: [],
        sets: applySetEvents(events),
      });
    }
  }

  return map;
};

export const buildDayDots = (
  sessionsByDate: Map<string, SessionRow[]>,
  replayById: Map<string, SessionReplay>,
  insightColors: CalendarInsightColors
): Map<string, DayDots> => {
  const map = new Map<string, DayDots>();

  for (const [dateKey, daySessions] of sessionsByDate) {
    const climbColors = daySessions
      .filter((session) => session.type === 'climb')
      .map((session) => replayById.get(session.id)?.dotColor ?? insightColors.climb);
    const uniqueClimbColors = new Set(climbColors);

    map.set(dateKey, {
      climbColor:
        climbColors.length === 0
          ? undefined
          : uniqueClimbColors.size === 1
            ? climbColors[0]
            : insightColors.climb,
      strengthColor: daySessions.some((session) => session.type === 'strength')
        ? insightColors.strength
        : undefined,
    });
  }

  return map;
};
