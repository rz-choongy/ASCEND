import { getSessionEvents } from './sessionStore';
import { applySetEvents, type LoggedSet } from './strengthLogUtils';
import type { SessionRow } from './types';

export type StrengthMetric = 'e1rm' | 'topWeight' | 'volume';

const TREND_SESSIONS = 8;

/** Sets logged before exercises had ids fall back to their (case-insensitive) name. */
export const exerciseKeyFor = (set: Pick<LoggedSet, 'exerciseId' | 'exerciseName'>): string =>
  set.exerciseId ?? `name:${set.exerciseName.trim().toLowerCase()}`;

/** Epley estimate. A single rep is taken at face value. */
export const estimateOneRepMax = (weight: number, reps: number): number =>
  reps <= 1 ? weight : weight * (1 + reps / 30);

export type ExerciseSession = {
  sessionId: string;
  startedAt: number;
  /** In the order they were logged. */
  sets: LoggedSet[];
  topSet: LoggedSet;
  topWeight: number;
  e1rm: number;
  volume: number;
};

type ExerciseHistory = {
  key: string;
  name: string;
  /** Oldest first. */
  sessions: ExerciseSession[];
};

const heavierSet = (best: LoggedSet, candidate: LoggedSet): LoggedSet =>
  candidate.weight > best.weight ||
  (candidate.weight === best.weight && candidate.reps > best.reps)
    ? candidate
    : best;

const toExerciseSession = (
  session: SessionRow,
  sets: LoggedSet[]
): ExerciseSession => ({
  sessionId: session.id,
  startedAt: session.started_at,
  sets,
  topSet: sets.reduce(heavierSet),
  topWeight: Math.max(...sets.map((set) => set.weight)),
  e1rm: Math.max(...sets.map((set) => estimateOneRepMax(set.weight, set.reps))),
  volume: sets.reduce((sum, set) => sum + set.reps * set.weight, 0),
});

/** Groups every strength set by exercise, one entry per exercise per session. */
const collectHistories = (sessions: SessionRow[]): Map<string, ExerciseHistory> => {
  const histories = new Map<string, ExerciseHistory>();
  sessions
    .filter((session) => session.type === 'strength')
    .slice()
    .sort((a, b) => a.started_at - b.started_at)
    .forEach((session) => {
      const byExercise = new Map<string, LoggedSet[]>();
      applySetEvents(getSessionEvents(session.id)).forEach((set) => {
        const key = exerciseKeyFor(set);
        byExercise.set(key, [...(byExercise.get(key) ?? []), set]);
      });
      byExercise.forEach((sets, key) => {
        const history = histories.get(key) ?? { key, name: sets[0].exerciseName, sessions: [] };
        // Latest logged spelling wins if the exercise was renamed along the way.
        history.name = sets[sets.length - 1].exerciseName;
        history.sessions.push(toExerciseSession(session, sets));
        histories.set(key, history);
      });
    });
  return histories;
};

export type ExerciseSummary = {
  key: string;
  name: string;
  lastSet: { weight: number; reps: number };
  lastAt: number;
  sessionCount: number;
  /** Est. 1RM per session, oldest first, capped to the most recent few. */
  trend: number[];
  /** First-to-last change across `trend`, or null with fewer than two sessions. */
  changePct: number | null;
};

/** Every exercise with logged sets, most recently trained first. */
export const buildExerciseList = (sessions: SessionRow[]): ExerciseSummary[] =>
  Array.from(collectHistories(sessions).values())
    .map((history): ExerciseSummary => {
      const last = history.sessions[history.sessions.length - 1];
      const trend = history.sessions.slice(-TREND_SESSIONS).map((s) => s.e1rm);
      const first = trend[0];
      const changePct =
        trend.length >= 2 && first > 0
          ? Math.round(((trend[trend.length - 1] - first) / first) * 100)
          : null;
      return {
        key: history.key,
        name: history.name,
        lastSet: { weight: last.topSet.weight, reps: last.topSet.reps },
        lastAt: last.startedAt,
        sessionCount: history.sessions.length,
        trend,
        changePct,
      };
    })
    .sort((a, b) => b.lastAt - a.lastAt);

export type MetricTile = {
  value: number;
  /** Change against the previous session, null when there isn't one. */
  delta: number | null;
};

export type SeriesPoint = {
  t: number;
  value: number;
};

export type ExerciseDetail = {
  name: string;
  /** Newest first, for the history list. */
  sessions: ExerciseSession[];
  /** Ids of sessions whose est. 1RM beat everything before them. */
  recordSessionIds: Set<string>;
  tiles: Record<StrengthMetric, MetricTile>;
  sessionCount: number;
  sessionsThisMonth: number;
  /** Oldest first, one point per session. */
  series: Record<StrengthMetric, SeriesPoint[]>;
};

const METRIC_OF: Record<StrengthMetric, (s: ExerciseSession) => number> = {
  e1rm: (s) => s.e1rm,
  topWeight: (s) => s.topWeight,
  volume: (s) => s.volume,
};

export const buildExerciseDetail = (
  sessions: SessionRow[],
  exerciseKey: string,
  now: Date = new Date()
): ExerciseDetail | null => {
  const history = collectHistories(sessions).get(exerciseKey);
  if (!history) return null;

  const chronological = history.sessions;
  const metrics = Object.keys(METRIC_OF) as StrengthMetric[];

  const series = {} as Record<StrengthMetric, SeriesPoint[]>;
  const tiles = {} as Record<StrengthMetric, MetricTile>;
  metrics.forEach((metric) => {
    const points = chronological.map((s) => ({ t: s.startedAt, value: METRIC_OF[metric](s) }));
    series[metric] = points;
    const latest = points[points.length - 1].value;
    const previous = points.length >= 2 ? points[points.length - 2].value : null;
    tiles[metric] = { value: latest, delta: previous === null ? null : latest - previous };
  });

  const recordSessionIds = new Set<string>();
  let bestSoFar = -Infinity;
  chronological.forEach((s, index) => {
    if (index > 0 && s.e1rm > bestSoFar) recordSessionIds.add(s.sessionId);
    bestSoFar = Math.max(bestSoFar, s.e1rm);
  });

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  return {
    name: history.name,
    sessions: chronological.slice().reverse(),
    recordSessionIds,
    tiles,
    sessionCount: chronological.length,
    sessionsThisMonth: chronological.filter((s) => s.startedAt >= monthStart).length,
    series,
  };
};

/** Trailing window for the chart's range chips; `null` months keeps everything. */
export const sliceSeriesToRange = (
  points: SeriesPoint[],
  months: number | null,
  now: Date = new Date()
): SeriesPoint[] => {
  if (months === null) return points;
  const cutoff = new Date(now.getFullYear(), now.getMonth() - months, now.getDate()).getTime();
  return points.filter((point) => point.t >= cutoff);
};

/** 850 kg below a tonne, 42.1 t from there up. */
export const formatVolume = (kg: number): { value: string; unit: string } =>
  kg >= 1000
    ? { value: (Math.round(kg / 100) / 10).toString(), unit: 't' }
    : { value: Math.round(kg).toString(), unit: 'kg' };

/** Drops a trailing ".0" so 30 reads as "30" but 27.5 stays "27.5". */
export const formatWeight = (kg: number): string => (Math.round(kg * 10) / 10).toString();

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "Sep 17" */
export const formatMonthDay = (ms: number): string => {
  const d = new Date(ms);
  return `${MONTH_SHORT[d.getMonth()]} ${d.getDate()}`;
};

/** "Today", "Yesterday", "5d ago", then a plain date once it's more than a couple of weeks old. */
export const formatDaysAgo = (ms: number, now: Date = new Date()): string => {
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOf(now) - startOf(new Date(ms))) / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return days <= 14 ? `${days}d ago` : formatMonthDay(ms);
};

export type LoggerReference = {
  /** The exercise's most recent completed session, in the order the sets were logged. */
  lastSets: LoggedSet[];
  lastAt: number;
  /** Best est. 1RM across every completed session. */
  bestE1rm: number;
};

/** What the strength logger needs to know about an exercise's past: last time out, and the bar to beat. */
export const buildLoggerReference = (detail: ExerciseDetail | null): LoggerReference | null => {
  const last = detail?.sessions[0];
  if (!detail || !last) return null;
  return {
    lastSets: last.sets,
    lastAt: last.startedAt,
    bestE1rm: Math.max(...detail.series.e1rm.map((point) => point.value)),
  };
};

export type SetInput = { reps: number; weight: number };

/** Start where you left off: the last set of the last session, else the given defaults. */
export const initialInputFor = (reference: LoggerReference | null, fallback: SetInput): SetInput => {
  const lastSet = reference?.lastSets[reference.lastSets.length - 1];
  return lastSet ? { reps: lastSet.reps, weight: lastSet.weight } : fallback;
};

/**
 * A record beats every earlier session's est. 1RM and anything already logged today. An exercise
 * with no history has nothing to beat, so its first sets aren't flagged -- otherwise every warm-up
 * ramp on a new lift would read as a PR.
 */
export const isNewRecord = (
  historyBest: number | null,
  sessionBest: number | null,
  weight: number,
  reps: number
): boolean => {
  if (historyBest === null) return false;
  return estimateOneRepMax(weight, reps) > Math.max(historyBest, sessionBest ?? 0) + 1e-9;
};

/** Weights are kept to one decimal, matching how `formatWeight` shows them. */
export const roundWeight = (kg: number): number => Math.round(kg * 10) / 10;

/** What the weight field means by its text so far: null while it isn't a usable weight yet (empty, "-", "abc"). */
export const parseWeightInput = (text: string): number | null => {
  const trimmed = text.trim().replace(',', '.');
  if (trimmed === '') return null;
  const n = Number(trimmed);
  return Number.isFinite(n) && n >= 0 ? roundWeight(n) : null;
};

/** Whole reps, at least 1; null while the text isn't usable. */
export const parseRepsInput = (text: string): number | null => {
  const trimmed = text.trim().replace(',', '.');
  if (trimmed === '') return null;
  const n = Math.round(Number(trimmed));
  return Number.isFinite(n) && n >= 1 ? n : null;
};
