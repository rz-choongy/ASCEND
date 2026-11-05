import { applyClimbEvents } from './climbLogUtils';
import { addDays, startOfWeek } from './dateUtils';
import { gymShortNameById, isUnnamedDefaultGym } from './gymStore';
import { getSessionEvents } from './sessionStore';
import { applySetEvents } from './strengthLogUtils';
import { estimateOneRepMax, exerciseKeyFor, findRecordSetIds, type ExerciseNames } from './strengthProgress';
import type { SessionRow } from './types';

// Read-only summaries for the Today dashboard. Everything is derived by
// replaying each session's events; nothing here writes.

const namedGym = (gymId: string | null | undefined): string | null => {
  if (!gymId) return null;
  const name = gymShortNameById(gymId);
  if (!name || isUnnamedDefaultGym({ id: gymId, name })) return null;
  return name;
};

export type GradeCount = {
  label: string;
  count: number;
  /** The subset of `count` flashed. */
  flashCount: number;
  color: string | null;
};

export type ClimbSessionSummary = {
  sessionId: string;
  startedAt: number;
  durationMs: number | null;
  gymName: string;
  sends: number;
  /** 0-100, rounded. */
  flashRate: number;
  bestGradeLabel: string | null;
  /** Upper bound of the hardest grade, for comparing sessions. */
  bestGradeValue: number | null;
  /** Sends per grade, easiest first. */
  grades: GradeCount[];
};

export type ExerciseTopSet = {
  name: string;
  sets: number;
  weight: number;
  reps: number;
  isRecord: boolean;
};

export type StrengthSessionSummary = {
  sessionId: string;
  startedAt: number;
  durationMs: number | null;
  title: string | null;
  sets: number;
  /** Sum of weight x reps, kg. Zero for a bodyweight-only session. */
  volume: number;
  reps: number;
  records: number;
  /** In the order each exercise was first logged. */
  exercises: ExerciseTopSet[];
};

export type LastSessions<T> = {
  latest: T;
  previous: T | null;
};

const durationOf = (session: SessionRow): number | null =>
  session.completed_at ? Math.max(0, session.completed_at - session.started_at) : null;

export const summarizeClimbSession = (session: SessionRow): ClimbSessionSummary => {
  const logs = applyClimbEvents(getSessionEvents(session.id));
  const byGrade = new Map<string, GradeCount & { order: number }>();
  let best: { label: string; value: number } | null = null;
  let flashes = 0;

  logs.forEach((log) => {
    if (log.result === 'FLASH') flashes += 1;
    if (!best || log.gradeMax > best.value) best = { label: log.gradeLabel, value: log.gradeMax };
    const flash = log.result === 'FLASH' ? 1 : 0;
    const entry = byGrade.get(log.gradeLabel);
    if (entry) {
      entry.count += 1;
      entry.flashCount += flash;
    } else {
      byGrade.set(log.gradeLabel, {
        label: log.gradeLabel,
        count: 1,
        flashCount: flash,
        color: log.gradeColor ?? null,
        order: log.gradeMin,
      });
    }
  });

  const hardest = best as { label: string; value: number } | null;
  return {
    sessionId: session.id,
    startedAt: session.started_at,
    durationMs: durationOf(session),
    gymName: namedGym(session.gym_id) || 'Climbing',
    sends: logs.length,
    flashRate: logs.length === 0 ? 0 : Math.round((flashes / logs.length) * 100),
    bestGradeLabel: hardest?.label ?? null,
    bestGradeValue: hardest?.value ?? null,
    grades: [...byGrade.values()]
      .sort((a, b) => a.order - b.order)
      .map(({ label, count, flashCount, color }) => ({ label, count, flashCount, color })),
  };
};

/**
 * Summarises strength sessions in order, so each one's PRs are judged against
 * the sessions before it only. `sessions` must be completed strength sessions
 * sorted oldest first (as `getCompletedSessions('strength')` returns them).
 */
export const summarizeStrengthSessions = (sessions: SessionRow[], names?: ExerciseNames): StrengthSessionSummary[] => {
  const historyBest = new Map<string, number>();

  return sessions.map((session) => {
    const sets = applySetEvents(getSessionEvents(session.id));
    // At most one PR per exercise per session, same rule as the session log's PR tags.
    const recordIds = findRecordSetIds(sets, exerciseKeyFor, (set) => historyBest.get(exerciseKeyFor(set)) ?? null);
    const sessionBest = new Map<string, number>();
    const exercises = new Map<string, ExerciseTopSet & { e1rm: number }>();
    let volume = 0;
    let reps = 0;

    sets.forEach((set) => {
      const key = exerciseKeyFor(set);
      const e1rm = estimateOneRepMax(set.weight, set.reps);
      const isRecord = recordIds.has(set.eventId);
      sessionBest.set(key, Math.max(sessionBest.get(key) ?? 0, e1rm));
      volume += set.weight * set.reps;
      reps += set.reps;

      const current = exercises.get(key);
      if (!current) {
        exercises.set(key, { name: (set.exerciseId && names?.get(set.exerciseId)) || set.exerciseName, sets: 1, weight: set.weight, reps: set.reps, isRecord, e1rm });
        return;
      }
      current.sets += 1;
      current.isRecord = current.isRecord || isRecord;
      if (e1rm > current.e1rm) Object.assign(current, { weight: set.weight, reps: set.reps, e1rm });
    });

    sessionBest.forEach((best, key) => historyBest.set(key, Math.max(historyBest.get(key) ?? 0, best)));

    return {
      sessionId: session.id,
      startedAt: session.started_at,
      durationMs: durationOf(session),
      title: session.title?.trim() || null,
      sets: sets.length,
      volume,
      reps,
      records: recordIds.size,
      exercises: [...exercises.values()].map(({ e1rm: _e1rm, ...rest }) => rest),
    };
  });
};

/** The newest climb session and the one before it, from sessions sorted oldest first. */
export const lastClimbSessions = (sessions: SessionRow[]): LastSessions<ClimbSessionSummary> | null => {
  const climbs = sessions.filter((s) => s.type === 'climb');
  if (climbs.length === 0) return null;
  const latest = summarizeClimbSession(climbs[climbs.length - 1]);
  const previous = climbs.length > 1 ? summarizeClimbSession(climbs[climbs.length - 2]) : null;
  return { latest, previous };
};

/** The newest strength session and the one before it, from sessions sorted oldest first. */
export const lastStrengthSessions = (
  sessions: SessionRow[],
  names?: ExerciseNames
): LastSessions<StrengthSessionSummary> | null => {
  // PRs are judged across every session, but an emptied session (all its sets deleted)
  // isn't a workout to headline or compare against.
  const summaries = summarizeStrengthSessions(sessions.filter((s) => s.type === 'strength'), names).filter(
    (s) => s.sets > 0
  );
  if (summaries.length === 0) return null;
  return {
    latest: summaries[summaries.length - 1],
    previous: summaries.length > 1 ? summaries[summaries.length - 2] : null,
  };
};

export type WeekDay = {
  /** 'M' | 'T' | 'W' | 'T' | 'F' | 'S' | 'S' */
  label: string;
  climbed: boolean;
  trained: boolean;
  isToday: boolean;
};

export type WeekActivity = {
  days: WeekDay[];
  sessions: number;
  sends: number;
  sets: number;
};

/** Mon-Sun activity for the week containing `today`, split by session type. */
export const buildWeekActivity = (sessions: SessionRow[], today: Date = new Date()): WeekActivity => {
  const weekStart = startOfWeek(today);
  const weekEnd = addDays(weekStart, 7);
  const inWeek = sessions.filter(
    (s) => s.started_at >= weekStart.getTime() && s.started_at < weekEnd.getTime()
  );
  const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  const climbDays = new Set<string>();
  const strengthDays = new Set<string>();
  let sends = 0;
  let sets = 0;

  inWeek.forEach((session) => {
    const key = dayKey(new Date(session.started_at));
    if (session.type === 'climb') {
      climbDays.add(key);
      sends += applyClimbEvents(getSessionEvents(session.id)).length;
    } else {
      strengthDays.add(key);
      sets += applySetEvents(getSessionEvents(session.id)).length;
    }
  });

  const labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  return {
    days: labels.map((label, i) => {
      const key = dayKey(addDays(weekStart, i));
      return {
        label,
        climbed: climbDays.has(key),
        trained: strengthDays.has(key),
        isToday: key === dayKey(today),
      };
    }),
    sessions: inWeek.length,
    sends,
    sets,
  };
};

export type RecentSession = {
  sessionId: string;
  type: SessionRow['type'];
  title: string;
  startedAt: number;
  durationMs: number | null;
  /** The headline number: "14 sends" / "12 sets". */
  figure: string;
  /** Supporting detail: "best V5" / "2 PRs". */
  detail: string;
};

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/**
 * Newest-first rows for the dashboard's recent list. `strengthHistory` is every
 * completed strength session oldest first, so PR counts match the logger's.
 */
export const buildRecentSessions = (
  sessions: SessionRow[],
  strengthHistory: SessionRow[],
  limit: number
): RecentSession[] => {
  const recent = [...sessions].sort((a, b) => b.started_at - a.started_at).slice(0, limit);
  const needsStrength = recent.some((s) => s.type === 'strength');
  const strengthById = new Map(
    (needsStrength ? summarizeStrengthSessions(strengthHistory) : []).map((s) => [s.sessionId, s])
  );

  return recent.map((session) => {
    if (session.type === 'climb') {
      const summary = summarizeClimbSession(session);
      return {
        sessionId: session.id,
        type: session.type,
        title: session.title?.trim() || summary.gymName,
        startedAt: session.started_at,
        durationMs: summary.durationMs,
        figure: plural(summary.sends, 'send', 'sends'),
        detail: summary.bestGradeLabel ? `best ${summary.bestGradeLabel}` : 'no sends',
      };
    }
    const summary = strengthById.get(session.id);
    return {
      sessionId: session.id,
      type: session.type,
      title: session.title?.trim() || 'Strength',
      startedAt: session.started_at,
      durationMs: durationOf(session),
      figure: plural(summary?.sets ?? 0, 'set', 'sets'),
      detail:
        summary && summary.records > 0
          ? plural(summary.records, 'PR', 'PRs')
          : plural(summary?.exercises.length ?? 0, 'exercise', 'exercises'),
    };
  });
};

const weekKey = (ms: number): number => startOfWeek(new Date(ms)).getTime();

/**
 * Consecutive Mon-Sun weeks (local time) with at least one session, ending at
 * this week. A week with nothing yet doesn't break the run, it just isn't counted.
 */
export const weekStreak = (startedAts: number[], now: Date = new Date()): number => {
  const weeks = new Set(startedAts.map(weekKey));
  let cursor = startOfWeek(now);
  if (!weeks.has(cursor.getTime())) cursor = addDays(cursor, -7);
  let streak = 0;
  while (weeks.has(cursor.getTime())) {
    streak += 1;
    cursor = addDays(cursor, -7);
  }
  return streak;
};

const USUAL_WEEKS = 8;
const USUAL_WEEK_MIN = 2;

/**
 * How many sessions make a normal week: the median over the last 8 complete
 * weeks, empty weeks included, and never fewer than 2.
 */
export const usualWeekTarget = (startedAts: number[], now: Date = new Date()): number => {
  const thisWeek = startOfWeek(now);
  const counts = new Map<number, number>();
  startedAts.forEach((ms) => counts.set(weekKey(ms), (counts.get(weekKey(ms)) ?? 0) + 1));
  const perWeek = Array.from({ length: USUAL_WEEKS }, (_, i) => counts.get(addDays(thisWeek, -7 * (i + 1)).getTime()) ?? 0).sort(
    (a, b) => a - b
  );
  const mid = USUAL_WEEKS / 2;
  const median = Math.round((perWeek[mid - 1] + perWeek[mid]) / 2);
  return Math.max(USUAL_WEEK_MIN, median);
};

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "Rest day. Last climbed Tue": the weekday within the last 6 days, else "3 Nov". */
export const restDayLine = (last: Pick<SessionRow, 'type' | 'started_at'> | null, now: Date = new Date()): string | null => {
  if (!last) return null;
  const d = new Date(last.started_at);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const daysAgo = Math.round((today.getTime() - day.getTime()) / 86_400_000);
  const when = daysAgo <= 6 ? DAY_SHORT[d.getDay()] : `${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`;
  return `Rest day. Last ${last.type === 'climb' ? 'climbed' : 'trained'} ${when}`;
};
