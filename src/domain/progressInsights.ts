import { applyClimbEvents, type ClimbLog } from './climbLogUtils';
import { addDays, startOfWeek } from './dateUtils';
import { getGymById } from './gymStore';
import { getSessionEvents } from './sessionStore';
import { applySetEvents } from './strengthLogUtils';
import type { SessionRow } from './types';

export type ClimbGymOption = {
  /** null represents climbs logged before gym tracking existed. */
  gymId: string | null;
  gymName: string;
};

const UNSPECIFIED_GYM_LABEL = 'Unspecified gym';

/**
 * Distinct gyms the user has actually climbed at, in first-seen order.
 * Grouping by gym (not grading type) keeps two gyms that both happen to use
 * "color" grades -- but mean different things by "Purple" -- from being
 * merged into one chart.
 */
export const getAvailableClimbGyms = (sessions: SessionRow[]): ClimbGymOption[] => {
  const seen = new Set<string>();
  const options: ClimbGymOption[] = [];
  sessions
    .filter((session) => session.type === 'climb')
    .forEach((session) => {
      const key = session.gym_id ?? '__unspecified__';
      if (seen.has(key)) return;
      seen.add(key);
      const gymName = session.gym_id
        ? (getGymById(session.gym_id)?.name ?? 'Unknown gym')
        : UNSPECIFIED_GYM_LABEL;
      options.push({ gymId: session.gym_id, gymName });
    });
  return options;
};

export type WeekFrequency = {
  weekLabel: string;
  climbCount: number;
  strengthCount: number;
};

export type GradeDistributionBar = {
  label: string;
  count: number;
  color: string;
};

export type VolumeTrendBar = {
  label: string;
  volume: number;
};

export type AllTimeStats = {
  totalSessions: number;
  hardestGradeLabel: string | null;
  totalStrengthVolume: number;
};

const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const formatShortDate = (ms: number): string => {
  const d = new Date(ms);
  return `${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`;
};

export const buildWeeklyFrequency = (sessions: SessionRow[], weeks: number): WeekFrequency[] => {
  const thisWeekStart = startOfWeek(new Date());
  const buckets: WeekFrequency[] = [];
  const bucketStarts: number[] = [];

  for (let i = weeks - 1; i >= 0; i--) {
    const start = new Date(
      thisWeekStart.getFullYear(),
      thisWeekStart.getMonth(),
      thisWeekStart.getDate() - i * 7
    );
    bucketStarts.push(start.getTime());
    buckets.push({ weekLabel: formatShortDate(start.getTime()), climbCount: 0, strengthCount: 0 });
  }

  sessions.forEach((session) => {
    for (let i = bucketStarts.length - 1; i >= 0; i--) {
      if (session.started_at >= bucketStarts[i]) {
        if (session.type === 'climb') {
          buckets[i].climbCount += 1;
        } else {
          buckets[i].strengthCount += 1;
        }
        break;
      }
    }
  });

  return buckets;
};

export const buildGradeDistribution = (
  sessions: SessionRow[],
  gymId: string | null
): GradeDistributionBar[] => {
  const climbSessions = sessions.filter(
    (session) => session.type === 'climb' && session.gym_id === gymId
  );
  const byLabel = new Map<string, { count: number; color: string; sortKey: number }>();

  climbSessions.forEach((session) => {
    const logs = applyClimbEvents(getSessionEvents(session.id));
    logs.forEach((log: ClimbLog) => {
      const existing = byLabel.get(log.gradeLabel);
      const sortKey = (log.gradeMin + log.gradeMax) / 2;
      if (existing) {
        existing.count += 1;
      } else {
        byLabel.set(log.gradeLabel, {
          count: 1,
          color: log.gradeColor ?? '#3ecf6e',
          sortKey,
        });
      }
    });
  });

  return Array.from(byLabel.entries())
    .map(([label, value]) => ({ label, count: value.count, color: value.color, sortKey: value.sortKey }))
    .sort((a, b) => a.sortKey - b.sortKey)
    .map(({ label, count, color }) => ({ label, count, color }));
};

export const buildStrengthVolumeTrend = (sessions: SessionRow[], limit: number): VolumeTrendBar[] => {
  const strengthSessions = sessions
    .filter((session) => session.type === 'strength')
    .slice(-limit);

  return strengthSessions.map((session) => {
    const sets = applySetEvents(getSessionEvents(session.id));
    const volume = sets.reduce((sum, set) => sum + set.reps * set.weight, 0);
    return { label: formatShortDate(session.started_at), volume };
  });
};

export const buildAllTimeStats = (sessions: SessionRow[]): AllTimeStats => {
  let hardestGradeLabel: string | null = null;
  let hardestGradeValue = -Infinity;
  let totalStrengthVolume = 0;

  sessions.forEach((session) => {
    if (session.type === 'climb') {
      const logs = applyClimbEvents(getSessionEvents(session.id));
      logs.forEach((log) => {
        if (log.gradeMax > hardestGradeValue) {
          hardestGradeValue = log.gradeMax;
          hardestGradeLabel = log.gradeLabel;
        }
      });
    } else {
      const sets = applySetEvents(getSessionEvents(session.id));
      totalStrengthVolume += sets.reduce((sum, set) => sum + set.reps * set.weight, 0);
    }
  });

  return {
    totalSessions: sessions.length,
    hardestGradeLabel,
    totalStrengthVolume,
  };
};

const gymNameFor = (gymId: string | undefined): string => {
  if (!gymId) return UNSPECIFIED_GYM_LABEL;
  return getGymById(gymId)?.name ?? UNSPECIFIED_GYM_LABEL;
};

export type DayCompletion = {
  /** 'M' | 'T' | 'W' | 'T' | 'F' | 'S' | 'S' */
  weekdayLabel: string;
  done: boolean;
  isToday: boolean;
};

/** Mon-Sun completion for the week containing today, for the streak dot strip. */
export const buildWeekCompletion = (sessions: SessionRow[]): DayCompletion[] => {
  const WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const today = new Date();
  const weekStart = startOfWeek(today);
  const doneDays = new Set(
    sessions.map((session) => {
      const d = new Date(session.started_at);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    })
  );
  return WEEKDAY_LABELS.map((weekdayLabel, i) => {
    const d = addDays(weekStart, i);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    return {
      weekdayLabel,
      done: doneDays.has(key),
      isToday: d.toDateString() === today.toDateString(),
    };
  });
};

export type HardestSendThisWeek = {
  gradeLabel: string;
  gymName: string;
  createdAt: number;
  result: 'SEND' | 'FLASH';
};

/** The single hardest logged climb among sessions in `sessions` (expects last-7-days sessions). */
export const findHardestSendThisWeek = (sessions: SessionRow[]): HardestSendThisWeek | null => {
  let best: HardestSendThisWeek | null = null;
  let bestValue = -Infinity;

  sessions
    .filter((session) => session.type === 'climb')
    .forEach((session) => {
      const logs = applyClimbEvents(getSessionEvents(session.id));
      logs.forEach((log) => {
        if (log.gradeMax > bestValue) {
          bestValue = log.gradeMax;
          best = {
            gradeLabel: log.gradeLabel,
            gymName: gymNameFor(log.gymId ?? session.gym_id ?? undefined),
            createdAt: log.createdAt,
            result: log.result,
          };
        }
      });
    });

  return best;
};

export type RecentSend = {
  eventId: string;
  gradeLabel: string;
  gymName: string;
  result: 'SEND' | 'FLASH';
  createdAt: number;
  isToday: boolean;
};

/** Most recent individual climb logs across sessions, newest first, capped at `limit`. */
export const buildRecentSends = (sessions: SessionRow[], limit: number): RecentSend[] => {
  const today = new Date().toDateString();
  const all: RecentSend[] = [];

  sessions
    .filter((session) => session.type === 'climb')
    .forEach((session) => {
      const logs = applyClimbEvents(getSessionEvents(session.id));
      logs.forEach((log) => {
        all.push({
          eventId: log.eventId,
          gradeLabel: log.gradeLabel,
          gymName: gymNameFor(log.gymId ?? session.gym_id ?? undefined),
          result: log.result,
          createdAt: log.createdAt,
          isToday: new Date(log.createdAt).toDateString() === today,
        });
      });
    });

  return all.sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
};

/** Earliest time the given grade label was logged, across all climb sessions. */
export const findFirstReachedDate = (
  sessions: SessionRow[],
  gradeLabel: string | null
): number | null => {
  if (!gradeLabel) return null;
  let earliest: number | null = null;

  sessions
    .filter((session) => session.type === 'climb')
    .forEach((session) => {
      const logs = applyClimbEvents(getSessionEvents(session.id));
      logs.forEach((log) => {
        if (log.gradeLabel === gradeLabel && (earliest === null || log.createdAt < earliest)) {
          earliest = log.createdAt;
        }
      });
    });

  return earliest;
};

/** Longest run of consecutive calendar days with >=1 completed session, across all history. */
export const findLongestStreakEver = (sessions: SessionRow[]): number => {
  const days = Array.from(
    new Set(
      sessions.map((session) => {
        const d = new Date(session.started_at);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
      })
    )
  ).sort((a, b) => a - b);

  if (days.length === 0) return 0;

  let longest = 1;
  let current = 1;
  for (let i = 1; i < days.length; i++) {
    const diffDays = Math.round((days[i] - days[i - 1]) / 86_400_000);
    if (diffDays === 1) {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }
  return longest;
};

/** The most sessions logged in any single Mon-Sun week, across all history. */
export const findMostSessionsInAWeek = (sessions: SessionRow[]): number => {
  const counts = new Map<number, number>();
  sessions.forEach((session) => {
    const weekStart = startOfWeek(new Date(session.started_at)).getTime();
    counts.set(weekStart, (counts.get(weekStart) ?? 0) + 1);
  });
  return counts.size === 0 ? 0 : Math.max(...counts.values());
};

/** Percent of logged climbs that were flashed (first-try sends), 0-100, rounded. */
export const findFlashRate = (sessions: SessionRow[]): number => {
  let sendCount = 0;
  let flashCount = 0;

  sessions
    .filter((session) => session.type === 'climb')
    .forEach((session) => {
      const logs = applyClimbEvents(getSessionEvents(session.id));
      logs.forEach((log) => {
        if (log.result === 'FLASH') flashCount += 1;
        else sendCount += 1;
      });
    });

  const total = sendCount + flashCount;
  return total === 0 ? 0 : Math.round((flashCount / total) * 100);
};
