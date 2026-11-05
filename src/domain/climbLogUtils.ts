/**
 * One rule for "is this a range?", used both when logging (open the pick-the-exact-grade
 * popup) and by the Settings refine pass. They used to disagree -- logging only asked on
 * V4-V6 and wider while refine flagged every V3-V4 -- so two-grade hold colours were logged
 * silently as ranges and then nagged about later. A "V3-4" bucket pools with neither V3 nor
 * V4, so any band wider than one grade is worth the extra tap.
 *
 * A range rather than one exact grade -- V3-V4 counts, V3 alone does not.
 */
export const isGradeBand = (gradeMin: number, gradeMax: number): boolean =>
  gradeMax > gradeMin;

/**
 * Representative single grade for a band. Floors the midpoint, so an even-width band
 * settles on the easier grade — guessing upward would silently inflate personal bests.
 */
export const midpointGrade = (gradeMin: number, gradeMax: number): number =>
  Math.floor((gradeMin + gradeMax) / 2);

/**
 * V-scale text for a gym grade: "V5" for one grade, "V4–6" for a band. null when the gym's own
 * label already starts with V, since repeating it would just be noise.
 */
export const formatVGrade = (label: string, gradeMin: number, gradeMax: number): string | null => {
  if (/^v/i.test(label)) return null;
  return gradeMin === gradeMax ? `V${gradeMin}` : `V${gradeMin}–${gradeMax}`;
};

/**
 * The V grade shown beside a logged climb at a colour/number-graded gym. An exact pick wins
 * (e.g. "V6" off a V4–6 band); otherwise the gym option's range, falling back to the climb's
 * own stored range when the option has since been edited away.
 */
export const loggedClimbVGrade = (
  log: { gradeLabel: string; gradeMin: number; gradeMax: number },
  option?: { min: number; max: number } | null
): string | null => {
  if (log.gradeMin === log.gradeMax) return formatVGrade(log.gradeLabel, log.gradeMin, log.gradeMax);
  return option
    ? formatVGrade(log.gradeLabel, option.min, option.max)
    : formatVGrade(log.gradeLabel, log.gradeMin, log.gradeMax);
};

export type ClimbLog = {
  eventId: string;
  gradeLabel: string;
  gradeMin: number;
  gradeMax: number;
  result: 'SEND' | 'FLASH';
  gradeColor?: string | null;
  gradeId?: string;
  gymId?: string;
  climbName?: string | null;
  createdAt: number;
};

type ClimbLogPayload = Omit<ClimbLog, 'createdAt' | 'eventId'>;

type ClimbRelabelPayload = {
  index: number;
  gradeLabel: string;
  gradeMin: number;
  gradeMax: number;
};

type ClimbEditPayload = {
  eventId: string;
  gradeLabel: string;
  gradeMin: number;
  gradeMax: number;
  result: 'SEND' | 'FLASH';
  gradeColor?: string | null;
  gradeId?: string;
  gymId?: string;
  climbName?: string | null;
};

type ClimbDeletePayload = {
  eventId: string;
};

type EventLike = {
  id?: string;
  type: string;
  payload: unknown;
  createdAt: number;
};

const isClimbPayload = (payload: unknown): payload is ClimbLogPayload => {
  if (!payload || typeof payload !== 'object') {
    return false;
  }
  const maybe = payload as {
    gradeLabel?: unknown;
    gradeMin?: unknown;
    gradeMax?: unknown;
    result?: unknown;
    gradeColor?: unknown;
    gradeId?: unknown;
    gymId?: unknown;
  };
  return (
    typeof maybe.gradeLabel === 'string' &&
    typeof maybe.gradeMin === 'number' &&
    typeof maybe.gradeMax === 'number' &&
    (maybe.result === 'SEND' || maybe.result === 'FLASH')
  );
};

const isEditPayload = (payload: unknown): payload is ClimbEditPayload => {
  if (!payload || typeof payload !== 'object') {
    return false;
  }
  const maybe = payload as {
    eventId?: unknown;
    gradeLabel?: unknown;
    gradeMin?: unknown;
    gradeMax?: unknown;
    result?: unknown;
    gradeColor?: unknown;
    gradeId?: unknown;
    gymId?: unknown;
  };
  return (
    typeof maybe.eventId === 'string' &&
    typeof maybe.gradeLabel === 'string' &&
    typeof maybe.gradeMin === 'number' &&
    typeof maybe.gradeMax === 'number' &&
    (maybe.result === 'SEND' || maybe.result === 'FLASH')
  );
};

const isDeletePayload = (payload: unknown): payload is ClimbDeletePayload => {
  if (!payload || typeof payload !== 'object') {
    return false;
  }
  const maybe = payload as { eventId?: unknown };
  return typeof maybe.eventId === 'string';
};

const isRelabelPayload = (payload: unknown): payload is ClimbRelabelPayload => {
  if (!payload || typeof payload !== 'object') {
    return false;
  }
  const maybe = payload as {
    index?: unknown;
    gradeLabel?: unknown;
    gradeMin?: unknown;
    gradeMax?: unknown;
  };
  return (
    typeof maybe.index === 'number' &&
    Number.isFinite(maybe.index) &&
    typeof maybe.gradeLabel === 'string' &&
    typeof maybe.gradeMin === 'number' &&
    typeof maybe.gradeMax === 'number'
  );
};

export const applyClimbEvents = (events: EventLike[]): ClimbLog[] => {
  const logs: ClimbLog[] = [];

  events.forEach((event) => {
    if (event.type === 'CLIMB_LOGGED' && isClimbPayload(event.payload)) {
      logs.push({
        eventId:
          typeof event.id === 'string'
            ? event.id
            : `${event.createdAt}-${logs.length}`,
        gradeLabel: event.payload.gradeLabel,
        gradeMin: event.payload.gradeMin,
        gradeMax: event.payload.gradeMax,
        result: event.payload.result,
        gradeColor:
          typeof event.payload.gradeColor === 'string' ? event.payload.gradeColor : null,
        gradeId: typeof event.payload.gradeId === 'string' ? event.payload.gradeId : undefined,
        gymId: typeof event.payload.gymId === 'string' ? event.payload.gymId : undefined,
        climbName: typeof event.payload.climbName === 'string' ? event.payload.climbName : null,
        createdAt: event.createdAt,
      });
      return;
    }

    if (event.type === 'CLIMB_UNDONE') {
      logs.pop();
      return;
    }

    if (event.type === 'CLIMB_RELABELED' && isRelabelPayload(event.payload)) {
      const target = logs[event.payload.index];
      if (!target) {
        return;
      }
      logs[event.payload.index] = {
        ...target,
        gradeLabel: event.payload.gradeLabel,
        gradeMin: event.payload.gradeMin,
        gradeMax: event.payload.gradeMax,
      };
      return;
    }

    if (event.type === 'CLIMB_EDITED' && isEditPayload(event.payload)) {
      const payload = event.payload;
      const targetIndex = logs.findIndex((log) => log.eventId === payload.eventId);
      if (targetIndex < 0) {
        return;
      }
      logs[targetIndex] = {
        ...logs[targetIndex],
        gradeLabel: payload.gradeLabel,
        gradeMin: payload.gradeMin,
        gradeMax: payload.gradeMax,
        gradeColor:
          typeof payload.gradeColor === 'string' ? payload.gradeColor : null,
        gradeId: typeof payload.gradeId === 'string' ? payload.gradeId : undefined,
        gymId: typeof payload.gymId === 'string' ? payload.gymId : undefined,
        climbName: typeof payload.climbName === 'string' ? payload.climbName : null,
        result: payload.result,
      };
      return;
    }

    if (event.type === 'CLIMB_DELETED' && isDeletePayload(event.payload)) {
      const payload = event.payload;
      const targetIndex = logs.findIndex((log) => log.eventId === payload.eventId);
      if (targetIndex >= 0) {
        logs.splice(targetIndex, 1);
      }
    }
  });

  return logs;
};

/**
 * Index of the log in this session that earns the "30-day high" badge: the first log at the
 * session's top grade, provided that grade beats `priorBest` (the best from other sessions in
 * the window). Only one row, so a run of V6s doesn't badge every one, and it tracks the
 * session's actual high -- a V5 then V7 badges the V7. Null when there's no prior history to
 * beat (`priorBest` null): on a first session back every send would trivially qualify.
 */
export const findSessionHighIndex = (
  logs: Pick<ClimbLog, 'gradeMax'>[],
  priorBest: number | null
): number | null => {
  if (priorBest == null || logs.length === 0) return null;
  const sessionMax = Math.max(...logs.map((log) => log.gradeMax));
  if (sessionMax <= priorBest) return null;
  return logs.findIndex((log) => log.gradeMax === sessionMax);
};

/**
 * Whether logging a climb at `gradeMax` makes it the row that earns the "30-day high" badge
 * (see findSessionHighIndex): it beats the 30-day bar and every climb already in the session.
 * A repeat at the session's top grade doesn't count -- the badge stays on the first one.
 */
export const isNewThirtyDayHigh = (
  previousLogs: Pick<ClimbLog, 'gradeMax'>[],
  gradeMax: number,
  priorBest: number | null
): boolean => {
  if (priorBest == null || gradeMax <= priorBest) return false;
  return previousLogs.every((log) => log.gradeMax < gradeMax);
};

type StartingGradeOption = { id?: string; label: string; min: number; max: number };

type PastClimbSession = {
  gymId: string | null;
  /** Read lazily, so only the sessions actually checked hit the event store. */
  getLogs: () => Pick<ClimbLog, 'gradeId' | 'gradeLabel' | 'gradeMin' | 'gradeMax' | 'gymId'>[];
};

/** The gym option a past log maps to: same grade id, else same label, else the band holding it. */
const matchGradeOption = <G extends StartingGradeOption>(
  options: G[],
  log: Pick<ClimbLog, 'gradeId' | 'gradeLabel' | 'gradeMin' | 'gradeMax'>
): G | undefined =>
  (log.gradeId ? options.find((option) => option.id === log.gradeId) : undefined) ??
  options.find((option) => option.label === log.gradeLabel) ??
  options.find((option) => option.min <= log.gradeMin && log.gradeMax <= option.max);

/**
 * The grade the climb logger opens on: the last climb logged in this session; else the last
 * climb of the most recent past session at this gym; else of the most recent past session
 * anywhere; else the first option. A candidate only counts if it maps to one of this gym's
 * current options, otherwise the next one is tried. `pastSessions` is newest first.
 */
export const pickStartingGrade = <G extends StartingGradeOption>(
  options: G[],
  sessionLogs: Pick<ClimbLog, 'gradeId' | 'gradeLabel' | 'gradeMin' | 'gradeMax'>[],
  pastSessions: PastClimbSession[],
  gymId: string | null
): G | undefined => {
  const lastOf = <T,>(items: T[]): T | undefined => items[items.length - 1];

  const current = lastOf(sessionLogs);
  const fromCurrent = current ? matchGradeOption(options, current) : undefined;
  if (fromCurrent) return fromCurrent;

  // One read per session at most, shared by both passes.
  const cache = new Map<PastClimbSession, ReturnType<PastClimbSession['getLogs']>>();
  const logsOf = (session: PastClimbSession) => {
    let logs = cache.get(session);
    if (!logs) {
      logs = session.getLogs();
      cache.set(session, logs);
    }
    return logs;
  };
  const firstMatch = (sameGymOnly: boolean): G | undefined => {
    for (const session of pastSessions) {
      // Skip other gyms before reading their events.
      if (sameGymOnly && session.gymId != null && session.gymId !== gymId) continue;
      const logs = logsOf(session);
      const last = lastOf(logs);
      if (!last) continue;
      if (sameGymOnly && (session.gymId ?? last.gymId ?? null) !== gymId) continue;
      // Most recent session with climbs wins; if its grade is gone, fall through to the next.
      const match = matchGradeOption(options, last);
      if (match) return match;
    }
    return undefined;
  };

  return (gymId ? firstMatch(true) : undefined) ?? firstMatch(false) ?? options[0];
};
