import { applyClimbEvents, midpointGrade, type ClimbLog } from './climbLogUtils';
import { addDays, startOfWeek } from './dateUtils';
import { gymDisplayNameById } from './gymStore';
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
        ? (gymDisplayNameById(session.gym_id) ?? 'Unknown gym')
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
  /** Every logged climb at this grade, flashes included. */
  count: number;
  /** The subset of `count` sent first try. */
  flashCount: number;
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
  const byLabel = new Map<string, { count: number; flashCount: number; color: string; sortKey: number }>();

  climbSessions.forEach((session) => {
    const logs = applyClimbEvents(getSessionEvents(session.id));
    logs.forEach((log: ClimbLog) => {
      const existing = byLabel.get(log.gradeLabel);
      const sortKey = (log.gradeMin + log.gradeMax) / 2;
      const flash = log.result === 'FLASH' ? 1 : 0;
      if (existing) {
        existing.count += 1;
        existing.flashCount += flash;
      } else {
        byLabel.set(log.gradeLabel, {
          count: 1,
          flashCount: flash,
          color: log.gradeColor ?? '#3ecf6e',
          sortKey,
        });
      }
    });
  });

  return Array.from(byLabel.entries())
    .sort(([, a], [, b]) => a.sortKey - b.sortKey)
    .map(([label, { count, flashCount, color }]) => ({ label, count, flashCount, color }));
};

/**
 * Grade distribution pooled across every gym.
 *
 * Buckets by numeric grade rather than by label: two gyms can both call a grade
 * "Purple" and mean different things, so the label is not comparable across gyms
 * but the number is. Colors come from the caller's grade palette for the same
 * reason -- one gym's "Purple" hex would be an arbitrary choice to represent a
 * grade several gyms contributed to.
 *
 * A range-logged climb is folded onto its midpoint grade rather than getting a
 * "V3-4" row of its own. Such a row pools with neither V3 nor V4, so it can't be
 * read against any other bar in the chart -- which is the whole job of a pyramid.
 * This matches what the Settings refine pass writes, so the chart looks the same
 * before and after a refine; refining just makes it exact rather than inferred.
 */
export const buildGradeDistributionAcrossGyms = (
  sessions: SessionRow[],
  palette: string[]
): GradeDistributionBar[] => {
  const byGrade = new Map<number, { count: number; flashCount: number }>();

  sessions
    .filter((session) => session.type === 'climb')
    .forEach((session) => {
      applyClimbEvents(getSessionEvents(session.id)).forEach((log: ClimbLog) => {
        const grade = midpointGrade(log.gradeMin, log.gradeMax);
        const entry = byGrade.get(grade) ?? { count: 0, flashCount: 0 };
        entry.count += 1;
        if (log.result === 'FLASH') entry.flashCount += 1;
        byGrade.set(grade, entry);
      });
    });

  return Array.from(byGrade.entries())
    .sort(([a], [b]) => a - b)
    .map(([grade, { count, flashCount }]) => ({
      label: `V${grade}`,
      count,
      flashCount,
      color: palette.length > 0 ? palette[grade % palette.length] : '#3ecf6e',
    }));
};

export type GradeTrendPoint = {
  weekLabel: string;
  /** Hardest send that week, on the V scale. */
  grade: number;
};

/**
 * Hardest send per week over the last `weeks` weeks, oldest first, pooled across gyms.
 *
 * Uses the midpoint grade, like the pooled pyramid, so a wide colour band doesn't lift the line
 * to the top of its range. Weeks without a climb are left out rather than plotted as zero -- a
 * week off is not a drop in grade.
 */
export const buildHardestSendTrend = (
  sessions: SessionRow[],
  weeks: number,
  today: Date = new Date()
): GradeTrendPoint[] => {
  const thisWeekStart = startOfWeek(today);
  const firstWeekStart = addDays(thisWeekStart, -(weeks - 1) * 7).getTime();
  const hardestByWeek = new Map<number, number>();

  sessions
    .filter((session) => session.type === 'climb' && session.started_at >= firstWeekStart)
    .forEach((session) => {
      const weekStart = startOfWeek(new Date(session.started_at)).getTime();
      applyClimbEvents(getSessionEvents(session.id)).forEach((log: ClimbLog) => {
        const grade = midpointGrade(log.gradeMin, log.gradeMax);
        if (grade > (hardestByWeek.get(weekStart) ?? -Infinity)) hardestByWeek.set(weekStart, grade);
      });
    });

  return Array.from(hardestByWeek.entries())
    .sort(([a], [b]) => a - b)
    .map(([weekStart, grade]) => ({ weekLabel: formatShortDate(weekStart), grade }));
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
  return gymDisplayNameById(gymId) ?? UNSPECIFIED_GYM_LABEL;
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
  gradeColor: string | null;
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
          gradeColor: log.gradeColor ?? null,
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

/** The most individual climbs (sends + flashes) logged in any single climb session. */
export const findMostClimbsInSession = (sessions: SessionRow[]): number => {
  let most = 0;
  sessions
    .filter((session) => session.type === 'climb')
    .forEach((session) => {
      const logs = applyClimbEvents(getSessionEvents(session.id));
      most = Math.max(most, logs.length);
    });
  return most;
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

/** The Progress screen's time windows: last 7, 30, 90, 365 days, or all history. */
export type ProgressPeriod = 'W' | 'M' | '3M' | 'Y' | 'All';

export const PROGRESS_PERIOD_DAYS: Record<ProgressPeriod, number | null> = {
  W: 7,
  M: 30,
  '3M': 90,
  Y: 365,
  All: null,
};

const DAY_MS = 86_400_000;

/** Sessions started inside the rolling window ending now. `All` returns every session. */
export const filterSessionsToPeriod = (
  sessions: SessionRow[],
  period: ProgressPeriod,
  now: Date = new Date()
): SessionRow[] => {
  const days = PROGRESS_PERIOD_DAYS[period];
  if (days === null) return sessions;
  const cutoff = now.getTime() - days * DAY_MS;
  return sessions.filter((session) => session.started_at >= cutoff);
};

/** A weekly trend needs several weeks to read as a trend, so short windows still show this many. */
export const MIN_TREND_WEEKS = 12;

/**
 * How many weeks a weekly trend should cover for a period: the window's length in weeks, but
 * never fewer than MIN_TREND_WEEKS. `All` reaches back to the week of the earliest session.
 */
export const trendWeeksForPeriod = (
  period: ProgressPeriod,
  sessions: SessionRow[],
  now: Date = new Date()
): number => {
  const days = PROGRESS_PERIOD_DAYS[period];
  if (days !== null) return Math.max(MIN_TREND_WEEKS, Math.ceil(days / 7));
  if (sessions.length === 0) return MIN_TREND_WEEKS;
  const earliest = Math.min(...sessions.map((session) => session.started_at));
  const span = Math.round(
    (startOfWeek(now).getTime() - startOfWeek(new Date(earliest)).getTime()) / (7 * DAY_MS)
  );
  return Math.max(MIN_TREND_WEEKS, span + 1);
};

/** "11 Sep", or "11 Sep 2025" when it isn't this year. */
export const formatDayMonth = (ms: number, now: Date = new Date()): string => {
  const d = new Date(ms);
  const base = formatShortDate(ms);
  return d.getFullYear() === now.getFullYear() ? base : `${base} ${d.getFullYear()}`;
};

/** How many of the week's best sends make up its "usual top grade". */
export const TOP_SENDS_AVERAGED = 3;

export type TopSendsTrendPoint = {
  /** Monday of the week, local midnight. */
  weekStart: number;
  weekLabel: string;
  /** Average of the week's best TOP_SENDS_AVERAGED sends (fewer if fewer were logged), V scale. */
  usual: number;
  /** The single hardest send that week, V scale. */
  hardest: number;
};

/**
 * Per week over the last `weeks` weeks, oldest first, pooled across gyms on the V scale: the
 * "usual top grade" (average of the three best sends) and the single hardest send. The average
 * keeps one lucky send from setting the line; the hardest is kept so it still shows as a dot.
 * Uses midpoint grades and skips weeks without climbing, like buildHardestSendTrend.
 */
export const buildTopSendsTrend = (
  sessions: SessionRow[],
  weeks: number,
  today: Date = new Date()
): TopSendsTrendPoint[] => {
  const thisWeekStart = startOfWeek(today);
  const firstWeekStart = addDays(thisWeekStart, -(weeks - 1) * 7).getTime();
  const gradesByWeek = new Map<number, number[]>();

  sessions
    .filter((session) => session.type === 'climb' && session.started_at >= firstWeekStart)
    .forEach((session) => {
      const weekStart = startOfWeek(new Date(session.started_at)).getTime();
      applyClimbEvents(getSessionEvents(session.id)).forEach((log: ClimbLog) => {
        const list = gradesByWeek.get(weekStart) ?? [];
        list.push(midpointGrade(log.gradeMin, log.gradeMax));
        gradesByWeek.set(weekStart, list);
      });
    });

  return Array.from(gradesByWeek.entries())
    .sort(([a], [b]) => a - b)
    .map(([weekStart, grades]) => {
      const best = [...grades].sort((a, b) => b - a).slice(0, TOP_SENDS_AVERAGED);
      return {
        weekStart,
        weekLabel: formatShortDate(weekStart),
        usual: best.reduce((sum, g) => sum + g, 0) / best.length,
        hardest: best[0],
      };
    });
};

export type FirstSend = {
  grade: number;
  /** When the grade was first sent, anywhere. */
  at: number;
  /** Monday of that week, to line the marker up with the weekly trend. */
  weekStart: number;
};

/**
 * The first-ever send of each of the user's top `count` grades (pooled V scale, midpoint), hardest
 * first. These are the notable firsts worth marking on the trend; easy grades are left out.
 */
export const findFirstSendsOfTopGrades = (sessions: SessionRow[], count = 4): FirstSend[] => {
  const firstByGrade = new Map<number, number>();
  sessions
    .filter((session) => session.type === 'climb')
    .forEach((session) => {
      applyClimbEvents(getSessionEvents(session.id)).forEach((log: ClimbLog) => {
        const grade = midpointGrade(log.gradeMin, log.gradeMax);
        const seen = firstByGrade.get(grade);
        if (seen === undefined || log.createdAt < seen) firstByGrade.set(grade, log.createdAt);
      });
    });

  return Array.from(firstByGrade.entries())
    .sort(([a], [b]) => b - a)
    .slice(0, count)
    .map(([grade, at]) => ({ grade, at, weekStart: startOfWeek(new Date(at)).getTime() }));
};

/** Every logged climb at a V grade (midpoint, pooled across gyms). */
export const countSendsAtGrade = (sessions: SessionRow[], grade: number): number => {
  let count = 0;
  sessions
    .filter((session) => session.type === 'climb')
    .forEach((session) => {
      applyClimbEvents(getSessionEvents(session.id)).forEach((log: ClimbLog) => {
        if (midpointGrade(log.gradeMin, log.gradeMax) === grade) count += 1;
      });
    });
  return count;
};

export type PyramidRowScope =
  /** The pooled pyramid buckets by V grade. */
  | { kind: 'pooled'; grade: number }
  /** A single gym's pyramid buckets by that gym's own label. */
  | { kind: 'gym'; gymId: string | null; gradeLabel: string };

export type PyramidRowClimb = {
  eventId: string;
  createdAt: number;
  gymName: string;
  gradeLabel: string;
  result: 'SEND' | 'FLASH';
};

/** The climbs behind one pyramid row, newest first, matching how that pyramid buckets them. */
export const listClimbsForPyramidRow = (sessions: SessionRow[], scope: PyramidRowScope): PyramidRowClimb[] => {
  const climbs: PyramidRowClimb[] = [];
  sessions
    .filter((session) => session.type === 'climb')
    .filter((session) => scope.kind === 'pooled' || session.gym_id === scope.gymId)
    .forEach((session) => {
      applyClimbEvents(getSessionEvents(session.id)).forEach((log: ClimbLog) => {
        const matches =
          scope.kind === 'pooled'
            ? midpointGrade(log.gradeMin, log.gradeMax) === scope.grade
            : log.gradeLabel === scope.gradeLabel;
        if (!matches) return;
        climbs.push({
          eventId: log.eventId,
          createdAt: log.createdAt,
          gymName: gymNameFor(log.gymId ?? session.gym_id ?? undefined),
          gradeLabel: log.gradeLabel,
          result: log.result,
        });
      });
    });
  return climbs.sort((a, b) => b.createdAt - a.createdAt);
};

export const SEND_MILESTONES = [50, 100, 200, 300, 500, 1000];
export const FLASH_MILESTONES = [10, 25, 50];

export type Milestone =
  | { kind: 'sends'; count: number; at: number }
  | { kind: 'flashes'; count: number; grade: number; at: number };

/**
 * The most recent milestone crossed in the last `days` days, or null: total climbs passing
 * 50/100/200/300/500/1000, or flashes at one V grade (midpoint, pooled) passing 10/25/50.
 */
export const findRecentMilestone = (
  sessions: SessionRow[],
  now: Date = new Date(),
  days = 7
): Milestone | null => {
  const logs: ClimbLog[] = [];
  sessions
    .filter((session) => session.type === 'climb')
    .forEach((session) => logs.push(...applyClimbEvents(getSessionEvents(session.id))));
  logs.sort((a, b) => a.createdAt - b.createdAt);

  const cutoff = now.getTime() - days * DAY_MS;
  let latest: Milestone | null = null;
  let total = 0;
  const flashesByGrade = new Map<number, number>();

  logs.forEach((log) => {
    total += 1;
    if (SEND_MILESTONES.includes(total) && log.createdAt >= cutoff) {
      latest = { kind: 'sends', count: total, at: log.createdAt };
    }
    if (log.result === 'FLASH') {
      const grade = midpointGrade(log.gradeMin, log.gradeMax);
      const flashes = (flashesByGrade.get(grade) ?? 0) + 1;
      flashesByGrade.set(grade, flashes);
      if (FLASH_MILESTONES.includes(flashes) && log.createdAt >= cutoff) {
        latest = { kind: 'flashes', count: flashes, grade, at: log.createdAt };
      }
    }
  });

  return latest;
};

export const formatMilestone = (milestone: Milestone): string =>
  milestone.kind === 'sends'
    ? `You passed ${milestone.count} sends`
    : `${milestone.count} V${milestone.grade} flashes`;
