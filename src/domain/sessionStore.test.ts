// sessionStore.test.ts
// Exercises the real sessionStore code against a fake SQLite layer, routed by
// SQL text, so this actually runs the reported "Refine" code path end-to-end
// rather than mocking sessionStore itself away.
jest.mock('../db/db', () => ({
  getAll: jest.fn(),
  getFirst: jest.fn(),
  run: jest.fn(),
}));

import { getAll, getFirst, run } from '../db/db';
import { countWideGradeBandClimbs, narrowWideGradeBands, setSessionStatus } from './sessionStore';
import type { SessionRow } from './types';

const mockGetAll = getAll as jest.Mock;
const mockGetFirst = getFirst as jest.Mock;
const mockRun = run as jest.Mock;

const session = (id: string, status: SessionRow['status'] = 'completed'): SessionRow => ({
  id,
  type: 'climb',
  status,
  started_at: 1,
  completed_at: 2,
  title: null,
  gym_id: 'gym-1',
  notes: null,
});

const eventRow = (id: string, type: string, payload: unknown, createdAt = 1) => ({
  id,
  type,
  payload_json: JSON.stringify(payload),
  schema_version: 1,
  created_at: createdAt,
});

/**
 * Wires the getAll mock to answer both queries findWideBandClimbs makes, applying
 * the same status/type filter the real SQL WHERE clause would -- so a session
 * findWideBandClimbs' own query would never surface (e.g. status 'active') is
 * excluded here too, rather than only trusting the literal string in the query.
 */
const wireDb = (sessions: SessionRow[], eventsBySession: Record<string, ReturnType<typeof eventRow>[]>) => {
  mockGetAll.mockImplementation((sql: string, params?: unknown[]) => {
    if (sql.includes('FROM sessions')) {
      return sessions.filter(
        (s) => (s.status === 'completed' || s.status === 'abandoned') && s.type === 'climb'
      );
    }
    if (sql.includes('FROM events')) {
      const sessionId = (params as [string])[0];
      return eventsBySession[sessionId] ?? [];
    }
    return [];
  });
  mockGetFirst.mockImplementation((sql: string, params?: unknown[]) => {
    const id = (params as [string])[0];
    return sessions.find((s) => s.id === id) ?? null;
  });
};

beforeEach(() => {
  mockGetAll.mockReset();
  mockGetFirst.mockReset();
  mockRun.mockReset();
});

describe('setSessionStatus', () => {
  it('preserves the original completed_at when restoring an abandoned session', () => {
    // Restoring must COALESCE onto the existing completed_at rather than
    // overwriting it -- a session abandoned hours ago and restored later
    // should keep its real (short) duration instead of being stretched to
    // the restore button's press time.
    setSessionStatus('s1', 'completed');
    expect(mockRun).toHaveBeenCalledWith(
      expect.stringContaining('COALESCE(completed_at'),
      ['completed', expect.any(Number), 's1']
    );
  });

  it('stamps completed_at once when a session is first abandoned, and clears it for non-terminal statuses', () => {
    setSessionStatus('s1', 'abandoned');
    expect(mockRun).toHaveBeenCalledWith(
      expect.stringContaining('COALESCE(completed_at'),
      ['abandoned', expect.any(Number), 's1']
    );

    mockRun.mockClear();
    setSessionStatus('s1', 'active');
    expect(mockRun).toHaveBeenCalledWith(
      expect.stringContaining('completed_at = NULL'),
      ['active', 's1']
    );
  });
});

describe('countWideGradeBandClimbs / narrowWideGradeBands', () => {
  it('finds a wide-band climb (the reported Urban Climb "Black" V4-6 case) and counts it', () => {
    wireDb(
      [session('s1')],
      {
        s1: [
          eventRow('e1', 'CLIMB_LOGGED', {
            gradeLabel: 'Black',
            gradeMin: 4,
            gradeMax: 6,
            result: 'SEND',
            gradeColor: '#111827',
          }),
        ],
      }
    );

    expect(countWideGradeBandClimbs()).toEqual({ sessions: 1, climbs: 1 });
  });

  it('leaves exact grades alone', () => {
    wireDb(
      [session('s1')],
      {
        s1: [
          eventRow('e1', 'CLIMB_LOGGED', { gradeLabel: 'V5', gradeMin: 5, gradeMax: 5, result: 'SEND' }),
          eventRow('e2', 'CLIMB_LOGGED', { gradeLabel: 'V2', gradeMin: 2, gradeMax: 2, result: 'FLASH' }),
        ],
      }
    );

    expect(countWideGradeBandClimbs()).toEqual({ sessions: 0, climbs: 0 });
  });

  // Logging waves a two-grade band through without asking (see spansMultipleGrades),
  // but it is still a range: it pools with neither V3 nor V4 in the pyramid, so the
  // refine pass has to offer to resolve it. Reporting "nothing to refine" while such
  // climbs sat in the history was the bug.
  it('flags a two-grade band that logging accepted silently', () => {
    wireDb(
      [session('s1')],
      {
        s1: [
          eventRow('e1', 'CLIMB_LOGGED', { gradeLabel: 'V5', gradeMin: 5, gradeMax: 5, result: 'SEND' }),
          eventRow('e2', 'CLIMB_LOGGED', { gradeLabel: 'Purple', gradeMin: 3, gradeMax: 4, result: 'FLASH' }),
        ],
      }
    );

    expect(countWideGradeBandClimbs()).toEqual({ sessions: 1, climbs: 1 });
  });

  it('narrows a wide band by appending a CLIMB_EDITED correction, not rewriting the log', () => {
    wireDb(
      [session('s1')],
      {
        s1: [
          eventRow('e1', 'CLIMB_LOGGED', {
            gradeLabel: 'Black',
            gradeMin: 4,
            gradeMax: 6,
            result: 'SEND',
            gradeColor: '#111827',
          }),
        ],
      }
    );

    const result = narrowWideGradeBands();

    expect(result).toEqual({ sessions: 1, climbs: 1 });
    expect(mockRun).toHaveBeenCalledTimes(1);
    const [sql, params] = mockRun.mock.calls[0];
    expect(sql).toMatch(/INSERT INTO events/);
    const [, sessionIdParam, typeParam, payloadJson] = params as [string, string, string, string];
    expect(sessionIdParam).toBe('s1');
    expect(typeParam).toBe('CLIMB_EDITED');
    expect(JSON.parse(payloadJson)).toMatchObject({ eventId: 'e1', gradeMin: 5, gradeMax: 5 });
  });

  it('never touches a still-active session, even one with a wide-band climb logged', () => {
    wireDb(
      [session('s1', 'active')],
      { s1: [eventRow('e1', 'CLIMB_LOGGED', { gradeLabel: 'Black', gradeMin: 4, gradeMax: 6, result: 'SEND' })] }
    );

    expect(countWideGradeBandClimbs()).toEqual({ sessions: 0, climbs: 0 });
    expect(() => narrowWideGradeBands()).not.toThrow();
    expect(mockRun).not.toHaveBeenCalled();
  });
});
