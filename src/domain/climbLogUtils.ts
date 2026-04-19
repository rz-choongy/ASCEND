export type ClimbLog = {
  gradeLabel: string;
  gradeMin: number;
  gradeMax: number;
  result: 'SEND' | 'FLASH';
  createdAt: number;
};

type ClimbLogPayload = Omit<ClimbLog, 'createdAt'>;

type ClimbRelabelPayload = {
  index: number;
  gradeLabel: string;
  gradeMin: number;
  gradeMax: number;
};

type EventLike = {
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
  };
  return (
    typeof maybe.gradeLabel === 'string' &&
    typeof maybe.gradeMin === 'number' &&
    typeof maybe.gradeMax === 'number' &&
    (maybe.result === 'SEND' || maybe.result === 'FLASH')
  );
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
        ...event.payload,
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
    }
  });

  return logs;
};
