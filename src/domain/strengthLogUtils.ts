export type LoggedSet = {
  eventId: string;
  exerciseId?: string;
  exerciseName: string;
  reps: number;
  weight: number;
  unit: string;
  createdAt: number;
};

type EventLike = {
  id?: string;
  type: string;
  payload: unknown;
  createdAt: number;
};

type SetPayload = Omit<LoggedSet, 'eventId' | 'createdAt'>;

type SetEditPayload = SetPayload & {
  eventId: string;
};

type SetDeletePayload = {
  eventId: string;
};

const isSetPayload = (payload: unknown): payload is SetPayload => {
  if (!payload || typeof payload !== 'object') {
    return false;
  }
  const maybe = payload as {
    exerciseName?: unknown;
    reps?: unknown;
    weight?: unknown;
    unit?: unknown;
    exerciseId?: unknown;
  };
  return (
    typeof maybe.exerciseName === 'string' &&
    typeof maybe.reps === 'number' &&
    typeof maybe.weight === 'number' &&
    typeof maybe.unit === 'string'
  );
};

const isSetEditPayload = (payload: unknown): payload is SetEditPayload => {
  if (!payload || typeof payload !== 'object') {
    return false;
  }
  const maybe = payload as { eventId?: unknown };
  return typeof maybe.eventId === 'string' && isSetPayload(payload);
};

const isSetDeletePayload = (payload: unknown): payload is SetDeletePayload => {
  if (!payload || typeof payload !== 'object') {
    return false;
  }
  const maybe = payload as { eventId?: unknown };
  return typeof maybe.eventId === 'string';
};

export const applySetEvents = (events: EventLike[]): LoggedSet[] => {
  const sets: LoggedSet[] = [];

  events.forEach((event) => {
    if (event.type === 'SET_LOGGED' && isSetPayload(event.payload)) {
      sets.push({
        eventId:
          typeof event.id === 'string'
            ? event.id
            : `${event.createdAt}-${sets.length}`,
        exerciseName: event.payload.exerciseName,
        exerciseId:
          typeof event.payload.exerciseId === 'string' ? event.payload.exerciseId : undefined,
        reps: event.payload.reps,
        weight: event.payload.weight,
        unit: event.payload.unit,
        createdAt: event.createdAt,
      });
      return;
    }

    if (event.type === 'SET_UNDONE') {
      sets.pop();
      return;
    }

    if (event.type === 'SET_EDITED' && isSetEditPayload(event.payload)) {
      const payload = event.payload;
      const targetIndex = sets.findIndex((set) => set.eventId === payload.eventId);
      if (targetIndex < 0) {
        return;
      }
      sets[targetIndex] = {
        ...sets[targetIndex],
        exerciseId:
          typeof payload.exerciseId === 'string' ? payload.exerciseId : sets[targetIndex].exerciseId,
        exerciseName: payload.exerciseName,
        reps: payload.reps,
        weight: payload.weight,
        unit: payload.unit,
      };
      return;
    }

    if (event.type === 'SET_DELETED' && isSetDeletePayload(event.payload)) {
      const payload = event.payload;
      const targetIndex = sets.findIndex((set) => set.eventId === payload.eventId);
      if (targetIndex >= 0) {
        sets.splice(targetIndex, 1);
      }
    }
  });

  return sets;
};
