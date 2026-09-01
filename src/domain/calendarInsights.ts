import { applyClimbEvents, type ClimbLog } from './climbLogUtils';
import { getSessionEvents } from './sessionStore';
import { applySetEvents, type LoggedSet } from './strengthLogUtils';
import type { SessionRow } from './types';

type CalendarInsightColors = {
  climb: string;
  strength: string;
};

export type SessionReplay = {
  dotColor: string;
  /** Label of the hardest climb logged in the session (e.g. "V6"), if any. */
  hardestGradeLabel?: string;
  climbs: ClimbLog[];
  sets: LoggedSet[];
};

/** Hardest climb by gradeMax; among ties, the most recently logged one. */
const findHardestClimb = (climbs: ClimbLog[]): ClimbLog | undefined => {
  return climbs.reduce<ClimbLog | undefined>((hardest, climb) => {
    if (!hardest || climb.gradeMax >= hardest.gradeMax) return climb;
    return hardest;
  }, undefined);
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
      const hardestClimb = findHardestClimb(climbs);
      map.set(session.id, {
        dotColor: hardestClimb?.gradeColor || insightColors.climb,
        hardestGradeLabel: hardestClimb?.gradeLabel,
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
