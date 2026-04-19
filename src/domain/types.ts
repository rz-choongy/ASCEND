export type SessionType = 'strength' | 'climb';

export type SessionStatus = 'active' | 'completed' | 'abandoned';

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
  created_at: number;
};

export type PlannedSessionRow = {
  id: string;
  date: string;
  template_id: string | null;
  session_type: SessionType;
  order_index: number;
  created_at: number;
};
