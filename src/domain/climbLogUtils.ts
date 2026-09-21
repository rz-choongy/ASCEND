/**
 * Two separate questions, deliberately kept apart:
 *
 * 1. `spansMultipleGrades` -- is this band coarse enough to interrupt logging for?
 *    Only V4-V6 and wider. A V3-V4 hold colour is by far the most common case, and
 *    stopping to ask on every one of those would cost a tap on the hot path.
 * 2. `isGradeBand` -- is this a range at all, rather than one exact grade?
 *    Anything wider than a single grade. This is what analytics and the refine pass
 *    care about, because a "V3-4" bucket pools with neither V3 nor V4 and so can't
 *    be compared against anything.
 *
 * Conflating the two is what left range-logged climbs stranded in their own
 * pyramid rows while Settings reported nothing left to refine.
 */
export const WIDE_BAND_MIN_SPAN = 2;

/** Coarse enough that logging stops to ask which grade it actually was. */
export const spansMultipleGrades = (gradeMin: number, gradeMax: number): boolean =>
  gradeMax - gradeMin >= WIDE_BAND_MIN_SPAN;

/** A range rather than one exact grade -- V3-V4 counts, V3 alone does not. */
export const isGradeBand = (gradeMin: number, gradeMax: number): boolean =>
  gradeMax > gradeMin;

/**
 * Representative single grade for a band. Floors the midpoint, so an even-width band
 * settles on the easier grade — guessing upward would silently inflate personal bests.
 */
export const midpointGrade = (gradeMin: number, gradeMax: number): number =>
  Math.floor((gradeMin + gradeMax) / 2);

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
