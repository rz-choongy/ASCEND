import { applyClimbEvents } from '../../domain/climbLogUtils';
import { formatLocalDate } from '../../domain/dateUtils';
import { gymShortNameById, isUnnamedDefaultGym } from '../../domain/gymStore';
import { getRoutine } from '../../domain/routineStore';
import { getSessionEvents } from '../../domain/sessionStore';
import { applySetEvents } from '../../domain/strengthLogUtils';
import type { BodyweightLogRow, SessionRow } from '../../domain/types';

// What one session looks like in the cloud. The ascend-mcp function reads `summary`
// (supabase/functions/ascend-mcp/tools.ts); keep the two in step and bump SUMMARY_VERSION on a
// breaking change.
export const SUMMARY_VERSION = 1;

export type CloudStatus = 'completed' | 'abandoned' | 'deleted';

export type CloudSessionRow = {
  session_id: string;
  type: SessionRow['type'];
  status: CloudStatus;
  started_at: string;
  completed_at: string | null;
  gym_name: string | null;
  title: string | null;
  notes: string | null;
  summary: Record<string, unknown>;
  events: unknown[];
};

const gymName = (gymId: string | null | undefined): string | null => {
  if (!gymId) return null;
  const name = gymShortNameById(gymId);
  return !name || isUnnamedDefaultGym({ id: gymId, name }) ? null : name;
};

const iso = (ms: number | null): string | null => (ms == null ? null : new Date(ms).toISOString());

/** Small, fast, stable string hash (cyrb53). Only used to spot changed payloads, not for security. */
export const hashString = (str: string): string => {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
};

/**
 * The cloud row for a session plus a hash of it. Anything that isn't completed or abandoned
 * (soft-deleted, or reopened) goes up as 'deleted' so assistants stop seeing it.
 */
export const buildCloudSession = (session: SessionRow): { row: CloudSessionRow; hash: string } => {
  const events = getSessionEvents(session.id);
  const started = new Date(session.started_at);
  const status: CloudStatus =
    session.status === 'completed' || session.status === 'abandoned' ? session.status : 'deleted';

  const summary: Record<string, unknown> = {
    v: SUMMARY_VERSION,
    localDate: formatLocalDate(started),
    tzOffsetMin: -started.getTimezoneOffset(),
    durationMs: session.completed_at ? Math.max(0, session.completed_at - session.started_at) : null,
  };

  if (session.type === 'climb') {
    summary.climbs = applyClimbEvents(events).map((c) => ({
      grade: c.gradeLabel,
      vMin: c.gradeMin,
      vMax: c.gradeMax,
      result: c.result === 'FLASH' ? 'flash' : 'send',
      at: c.createdAt,
      name: c.climbName ?? null,
    }));
  } else {
    summary.routine = session.routine_id ? (getRoutine(session.routine_id)?.name ?? null) : null;
    summary.sets = applySetEvents(events).map((s) => ({
      exercise: s.exerciseName,
      reps: s.reps,
      weight: s.weight,
      unit: s.unit,
      at: s.createdAt,
    }));
  }

  const row: CloudSessionRow = {
    session_id: session.id,
    type: session.type,
    status,
    started_at: started.toISOString(),
    completed_at: iso(session.completed_at),
    gym_name: gymName(session.gym_id),
    title: session.title ?? null,
    notes: session.notes ?? null,
    summary,
    events,
  };
  return { row, hash: hashString(JSON.stringify(row)) };
};

export const buildBodyweightPayload = (
  logs: BodyweightLogRow[]
): { logs: { id: string; weightKg: number; loggedAt: number }[]; hash: string } => {
  const out = [...logs]
    .sort((a, b) => a.logged_at - b.logged_at)
    .map((l) => ({ id: l.id, weightKg: l.weight_kg, loggedAt: l.logged_at }));
  return { logs: out, hash: hashString(JSON.stringify(out)) };
};
