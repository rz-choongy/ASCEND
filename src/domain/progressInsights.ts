import { applyClimbEvents, type ClimbLog } from './climbLogUtils';
import { getGymById } from './gymStore';
import { getSessionEvents } from './sessionStore';
import { applySetEvents } from './strengthLogUtils';
import type { GymGradingType, SessionRow } from './types';

export const GRADING_TYPE_LABELS: Record<GymGradingType, string> = {
  v_scale: 'V-Scale',
  color: 'Color grades',
  numeric: 'Numeric',
};

const DEFAULT_GRADING_TYPE: GymGradingType = 'v_scale';

const resolveGradingType = (gymId: string | null | undefined): GymGradingType => {
  if (!gymId) return DEFAULT_GRADING_TYPE;
  return getGymById(gymId)?.grading_type ?? DEFAULT_GRADING_TYPE;
};

/** Distinct grading systems present across the user's climb sessions, in first-seen order. */
export const getAvailableGradingTypes = (sessions: SessionRow[]): GymGradingType[] => {
  const seen = new Set<GymGradingType>();
  const order: GymGradingType[] = [];
  sessions
    .filter((session) => session.type === 'climb')
    .forEach((session) => {
      const type = resolveGradingType(session.gym_id);
      if (!seen.has(type)) {
        seen.add(type);
        order.push(type);
      }
    });
  return order;
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

const startOfWeek = (date: Date): Date => {
  const day = date.getDay(); // 0=Sun
  const offset = day === 0 ? 6 : day - 1; // Monday-anchored
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate() - offset);
  return start;
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
  gradingType?: GymGradingType
): GradeDistributionBar[] => {
  const climbSessions = sessions.filter((session) => {
    if (session.type !== 'climb') return false;
    if (!gradingType) return true;
    return resolveGradingType(session.gym_id) === gradingType;
  });
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
