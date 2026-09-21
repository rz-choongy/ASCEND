// Runs the real importExternalClimbSession against a tiny in-memory stand-in for the
// tables it touches, routed by SQL text, so dedupe and day-merging are exercised end to end.
jest.mock('expo-crypto', () => {
  let n = 0;
  return { randomUUID: () => `id-${++n}` };
});
jest.mock('../db/db', () => ({ getAll: jest.fn(), getFirst: jest.fn(), run: jest.fn() }));

import { getFirst, run } from '../db/db';
import { importExternalClimbSession } from './sessionStore';
import type { ClimbLogPayload } from './types';

const mockGetFirst = getFirst as jest.Mock;
const mockRun = run as jest.Mock;

type Sess = {
  id: string;
  started_at: number;
  completed_at: number;
  title: string;
  gym_id: string;
  status: string;
  type: string;
  notes: string | null;
};
let sessions: Sess[];
let externals: { source: string; external_id: string; session_id: string }[];
let events: { session_id: string; created_at: number }[];

const payload: ClimbLogPayload = { gradeLabel: 'V4', gradeMin: 4, gradeMax: 4, result: 'SEND', gymId: 'kilter' };
const at = (day: number, hour: number) => new Date(2026, 8, day, hour).getTime();
const climb = (id: string, createdAt: number, climbName: string | null = null) => ({
  externalId: id,
  createdAt,
  payload,
  climbName,
});
const input = (climbs: ReturnType<typeof climb>[]) => ({ source: 'kilter', gymId: 'kilter', title: 'Kilter Board', climbs });

beforeEach(() => {
  sessions = [];
  externals = [];
  events = [];
  mockGetFirst.mockReset();
  mockRun.mockReset();

  mockGetFirst.mockImplementation((sql: string, params: unknown[]) => {
    if (sql.includes('FROM external_logs WHERE source')) {
      const [source, id] = params as string[];
      return externals.some((e) => e.source === source && e.external_id === id) ? { found: 1 } : null;
    }
    if (sql.includes('FROM sessions s')) {
      const [start, end, source] = params as [number, number, string];
      return (
        sessions.find(
          (s) =>
            s.started_at >= start &&
            s.started_at < end &&
            externals.some((e) => e.session_id === s.id && e.source === source)
        ) ?? null
      );
    }
    return null;
  });

  mockRun.mockImplementation((sql: string, params: unknown[] = []) => {
    if (sql.startsWith('INSERT INTO sessions')) {
      const [id, started_at, completed_at, title, gym_id, notes] = params as [
        string,
        number,
        number,
        string,
        string,
        string | null,
      ];
      sessions.push({ id, started_at, completed_at, title, gym_id, notes, status: 'completed', type: 'climb' });
    } else if (sql.includes('SET started_at')) {
      const [first, last, id] = params as [number, number, string];
      const s = sessions.find((x) => x.id === id)!;
      s.started_at = Math.min(s.started_at, first);
      s.completed_at = Math.max(s.completed_at, last);
    } else if (sql.includes('SET notes')) {
      const [notes, id] = params as [string | null, string];
      sessions.find((x) => x.id === id)!.notes = notes;
    } else if (sql.includes('INTO events')) {
      const [, session_id, , , created_at] = params as [string, string, string, number, number];
      events.push({ session_id, created_at });
    } else if (sql.includes('INTO external_logs')) {
      const [source, external_id, session_id] = params as string[];
      externals.push({ source, external_id, session_id });
    }
    return { changes: 1 };
  });
});

describe('importExternalClimbSession', () => {
  it('creates one completed session spanning the sends, with original timestamps', () => {
    const added = importExternalClimbSession(input([climb('b', at(1, 20)), climb('a', at(1, 18))]));

    expect(added).toBe(2);
    expect(sessions).toHaveLength(1);
    expect(sessions[0]).toMatchObject({ started_at: at(1, 18), completed_at: at(1, 20), status: 'completed', title: 'Kilter Board' });
    expect(events.map((e) => e.created_at)).toEqual([at(1, 18), at(1, 20)]);
    expect(externals.map((e) => e.external_id)).toEqual(['a', 'b']);
  });

  it('skips sends it has already imported', () => {
    importExternalClimbSession(input([climb('a', at(1, 18))]));
    mockRun.mockClear();

    expect(importExternalClimbSession(input([climb('a', at(1, 18))]))).toBe(0);
    expect(mockRun).not.toHaveBeenCalled();
  });

  it('appends a new send to that day\'s existing session instead of opening another', () => {
    importExternalClimbSession(input([climb('a', at(1, 18))]));
    const added = importExternalClimbSession(input([climb('a', at(1, 18)), climb('late', at(1, 21))]));

    expect(added).toBe(1);
    expect(sessions).toHaveLength(1);
    expect(sessions[0].completed_at).toBe(at(1, 21));
    expect(externals.filter((e) => e.session_id === sessions[0].id)).toHaveLength(2);
  });

  it('opens a separate session for a different day', () => {
    importExternalClimbSession(input([climb('a', at(1, 18))]));
    importExternalClimbSession(input([climb('b', at(3, 18))]));
    expect(sessions).toHaveLength(2);
  });

  it('adds a note line per named climb, leaving unnamed ones out', () => {
    importExternalClimbSession(input([climb('a', at(1, 18), 'Bomb Pop'), climb('b', at(1, 19))]));
    expect(sessions[0].notes).toBe('Bomb Pop (V4)');
  });

  it('appends new note lines to an existing session without duplicating or losing the user\'s own notes', () => {
    importExternalClimbSession(input([climb('a', at(1, 18), 'Bomb Pop')]));
    sessions[0].notes = `${sessions[0].notes}\nGreat session today`;

    importExternalClimbSession(input([climb('a', at(1, 18), 'Bomb Pop'), climb('late', at(1, 21), 'Tomahawk')]));

    expect(sessions[0].notes).toBe('Bomb Pop (V4)\nGreat session today\nTomahawk (V4)');
  });

  it('rolls back if a write fails part way', () => {
    mockRun.mockImplementation((sql: string) => {
      if (sql.includes('INTO events')) throw new Error('disk full');
      return { changes: 1 };
    });
    expect(() => importExternalClimbSession(input([climb('a', at(1, 18))]))).toThrow('disk full');
    expect(mockRun).toHaveBeenCalledWith('ROLLBACK;');
  });
});
