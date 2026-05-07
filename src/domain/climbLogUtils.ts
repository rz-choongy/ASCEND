export type ClimbLog = {
  eventId: string;
  gradeLabel: string;
  gradeMin: number;
  gradeMax: number;
  result: 'SEND' | 'FLASH' | 'TRIED';
  gradeColor?: string | null;
  gradeId?: string;
  gymId?: string;
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
  result: 'SEND' | 'FLASH' | 'TRIED';
  gradeColor?: string | null;
  gradeId?: string;
  gymId?: string;
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
    (maybe.result === 'SEND' || maybe.result === 'FLASH' || maybe.result === 'TRIED')
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
    (maybe.result === 'SEND' || maybe.result === 'FLASH' || maybe.result === 'TRIED')
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
