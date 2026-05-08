export type SessionType = 'strength' | 'climb';

export type SessionStatus = 'active' | 'completed' | 'abandoned' | 'deleted';

export type GymGradingType = 'v_scale' | 'numeric' | 'color';

export type SessionRow = {
  id: string;
  type: SessionType;
  status: SessionStatus;
  started_at: number;
  completed_at: number | null;
  title: string | null;
  gym_id: string | null;
  notes: string | null;
};

export type EventRow = {
  id: string;
  session_id: string;
  type: string;
  payload_json: string;
  schema_version: number;
  created_at: number;
};

export type GymRow = {
  id: string;
  name: string;
  grading_type: GymGradingType;
  is_default: number;
  parent_id: string | null;
  created_at: number;
  updated_at: number;
};

export type GymGradeOptionRow = {
  id: string;
  gym_id: string;
  label: string;
  grade_min: number;
  grade_max: number;
  color_hex: string | null;
  sort_order: number;
  created_at: number;
  updated_at: number;
};

export type ExerciseRow = {
  id: string;
  name: string;
  sort_order: number;
  active: number;
  created_at: number;
  updated_at: number;
};

export type ClimbResult = 'SEND' | 'FLASH';

export type ClimbLogPayload = {
  gradeLabel: string;
  gradeMin: number;
  gradeMax: number;
  result: ClimbResult;
  gradeColor?: string | null;
  gradeId?: string;
  gymId?: string;
};

export type StrengthSetPayload = {
  exerciseName: string;
  reps: number;
  weight: number;
  unit: 'kg';
  exerciseId?: string;
};

export type ClimbUndoPayload = {
  at: number;
  targetEventId?: string;
};

export type SetUndoPayload = {
  at: number;
  targetEventId?: string;
};

export type ClimbEditPayload = ClimbLogPayload & {
  eventId: string;
};

export type SetEditPayload = StrengthSetPayload & {
  eventId: string;
};

export type DeleteLoggedEntryPayload = {
  eventId: string;
};

export type SessionEventPayloadMap = {
  CLIMB_LOGGED: ClimbLogPayload;
  CLIMB_UNDONE: ClimbUndoPayload;
  CLIMB_EDITED: ClimbEditPayload;
  CLIMB_DELETED: DeleteLoggedEntryPayload;
  SET_LOGGED: StrengthSetPayload;
  SET_UNDONE: SetUndoPayload;
  SET_EDITED: SetEditPayload;
  SET_DELETED: DeleteLoggedEntryPayload;
};

export type SessionEventType = keyof SessionEventPayloadMap;

export type ActiveSessionEventType =
  | 'CLIMB_LOGGED'
  | 'CLIMB_UNDONE'
  | 'SET_LOGGED'
  | 'SET_UNDONE';

export type SessionCorrectionEventType =
  | 'CLIMB_EDITED'
  | 'CLIMB_DELETED'
  | 'SET_EDITED'
  | 'SET_DELETED';

export type SessionEventPayload<T extends SessionEventType> = SessionEventPayloadMap[T];

export type SessionEvent =
  | {
      id: string;
      type: SessionEventType;
      payload: SessionEventPayload<SessionEventType>;
      schemaVersion: number;
      createdAt: number;
    }
  | {
      id: string;
      type: 'UNKNOWN';
      originalType: string;
      payload: unknown;
      schemaVersion: number;
      createdAt: number;
    };
