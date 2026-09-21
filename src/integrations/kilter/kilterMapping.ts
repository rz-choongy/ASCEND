import type { ClimbLogPayload } from '../../domain/types';

/** Kilter's 39 difficulty ids -> V-scale, from portal.kiltergrips.com/api/grades (ids unchanged since the Aurora era). */
const V_GRADE_BY_DIFFICULTY_ID: Record<number, number> = {
  1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0,
  13: 1, 14: 1, 15: 2, 16: 3, 17: 3, 18: 4, 19: 4, 20: 5, 21: 5, 22: 6, 23: 7,
  24: 8, 25: 8, 26: 9, 27: 10, 28: 11, 29: 12, 30: 13, 31: 14, 32: 15, 33: 16,
  34: 17, 35: 18, 36: 19, 37: 20, 38: 21, 39: 22,
};

export const vGradeForDifficultyId = (difficultyId: number): number | null =>
  V_GRADE_BY_DIFFICULTY_ID[difficultyId] ?? null;

/** One logbook entry from `GET /api/logs`, reduced to what ASCEND uses. */
export type KilterLog = {
  logUuid: string;
  attempts: number;
  topped: boolean;
  flashed: boolean;
  /** ms since epoch */
  createdAt: number;
  difficultyId: number | null;
  climbName: string | null;
};

/** The field the undocumented endpoint uses for a climb's display name is unconfirmed, so try the plausible ones. */
const CLIMB_NAME_KEYS = ['climbName', 'climb_name', 'name', 'routeName'] as const;

const readClimbName = (e: Record<string, unknown>): string | null => {
  for (const key of CLIMB_NAME_KEYS) {
    const value = e[key];
    if (typeof value === 'string' && value.trim().length > 0) return value.trim();
  }
  return null;
};

/**
 * The /api/logs envelope is undocumented, so accept a bare array or the usual
 * `{ logs | data | items: [...] }` wrapper, and drop entries missing an id or a usable date
 * rather than failing the whole sync on one odd row.
 */
export const extractLogList = (raw: unknown): unknown[] | null => {
  if (Array.isArray(raw)) return raw;
  if (!raw || typeof raw !== 'object') return null;
  const wrapper = raw as Record<string, unknown>;
  return [wrapper.logs, wrapper.data, wrapper.items].find(Array.isArray) ?? null;
};

export const parseKilterLogs = (raw: unknown): KilterLog[] => {
  const list = extractLogList(raw);
  if (!list) return [];

  const logs: KilterLog[] = [];
  list.forEach((entry) => {
    if (!entry || typeof entry !== 'object') return;
    const e = entry as Record<string, unknown>;
    const createdAt = typeof e.createdAt === 'string' ? Date.parse(e.createdAt) : NaN;
    if (typeof e.logUuid !== 'string' || Number.isNaN(createdAt)) return;
    logs.push({
      logUuid: e.logUuid,
      attempts: typeof e.attempts === 'number' ? Math.max(1, e.attempts) : 1,
      topped: e.topped === true,
      flashed: e.flashed === true,
      createdAt,
      difficultyId: typeof e.currentDifficultyId === 'number' ? e.currentDifficultyId : null,
      climbName: readClimbName(e),
    });
  });
  return logs;
};

/** A grade bucket of the Kilter gym, in the shape the climb logger records. */
export type GradeOption = {
  id: string;
  label: string;
  gradeMin: number;
  gradeMax: number;
  colorHex: string | null;
};

/** The bucket covering `vGrade`; clamps to the hardest/easiest bucket when it falls outside them all. */
export const pickGradeOption = (options: GradeOption[], vGrade: number): GradeOption | null => {
  if (options.length === 0) return null;
  const covering = options.find((o) => vGrade >= o.gradeMin && vGrade <= o.gradeMax);
  if (covering) return covering;
  const byRange = options.slice().sort((a, b) => a.gradeMin - b.gradeMin);
  return vGrade > byRange[byRange.length - 1].gradeMax ? byRange[byRange.length - 1] : byRange[0];
};

export type ImportedClimb = {
  /** Kilter `logUuid`, the dedupe key across syncs. */
  externalId: string;
  createdAt: number;
  payload: ClimbLogPayload;
  climbName: string | null;
};

/** One local calendar day of Kilter sends, imported as a single completed climb session. */
export type ImportedSession = {
  dayKey: string;
  startedAt: number;
  completedAt: number;
  climbs: ImportedClimb[];
};

const dayKeyOf = (ms: number): string => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/**
 * Sends only: `topped && flashed` is a FLASH, `topped` a SEND, and attempt-only logs are dropped
 * (the app records sends). Entries with an unknown difficulty id are skipped, not guessed.
 */
export const mapKilterLogs = (
  logs: KilterLog[],
  options: GradeOption[],
  gymId: string
): ImportedSession[] => {
  const seen = new Set<string>();
  const byDay = new Map<string, ImportedClimb[]>();

  logs
    .slice()
    .sort((a, b) => a.createdAt - b.createdAt)
    .forEach((log) => {
      if (!log.topped || log.difficultyId === null || seen.has(log.logUuid)) return;
      const vGrade = vGradeForDifficultyId(log.difficultyId);
      const option = vGrade === null ? null : pickGradeOption(options, vGrade);
      if (!option) return;
      seen.add(log.logUuid);

      const climb: ImportedClimb = {
        externalId: log.logUuid,
        createdAt: log.createdAt,
        climbName: log.climbName,
        payload: {
          gradeLabel: option.label,
          gradeMin: option.gradeMin,
          gradeMax: option.gradeMax,
          result: log.flashed ? 'FLASH' : 'SEND',
          gradeColor: option.colorHex,
          gradeId: option.id,
          gymId,
        },
      };
      const key = dayKeyOf(log.createdAt);
      byDay.set(key, [...(byDay.get(key) ?? []), climb]);
    });

  return Array.from(byDay.entries()).map(([dayKey, climbs]) => ({
    dayKey,
    startedAt: climbs[0].createdAt,
    completedAt: climbs[climbs.length - 1].createdAt,
    climbs,
  }));
};
