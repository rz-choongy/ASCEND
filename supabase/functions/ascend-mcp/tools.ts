// Read-only tools over a user's cloud_sessions rows. Pure functions: index.ts fetches the rows and
// hands them in, so everything here is testable without a database.
//
// The `summary` shape is written by the app (src/integrations/cloud/cloudPayload.ts). Keep the
// two in step: bump SUMMARY_VERSION there and handle older versions here.

export type CloudClimb = {
  grade: string;
  vMin: number;
  vMax: number;
  result: 'send' | 'flash';
  at: number;
  name?: string | null;
};

export type CloudSet = {
  exercise: string;
  reps: number;
  weight: number;
  unit: string;
  at: number;
};

export type CloudSummary = {
  v: number;
  /** Local calendar date the session started on, YYYY-MM-DD. */
  localDate: string;
  /** Minutes east of UTC on the phone when the session was summarised. */
  tzOffsetMin: number;
  durationMs: number | null;
  routine?: string | null;
  climbs?: CloudClimb[];
  sets?: CloudSet[];
};

export type SessionRowIn = {
  session_id: string;
  type: 'climb' | 'strength';
  status: 'completed' | 'abandoned' | 'deleted';
  started_at: string;
  completed_at: string | null;
  gym_name: string | null;
  title: string | null;
  notes: string | null;
  summary: CloudSummary;
};

export type BodyweightRowIn = { id: string; weight_kg: number; logged_at: string };

export type ToolDef = {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
};

const DATE = { type: 'string', description: 'Inclusive local date, YYYY-MM-DD.' };

export const TOOLS: ToolDef[] = [
  {
    name: 'get_overview',
    title: 'Training overview',
    description:
      'Snapshot of the user\'s climbing and gym training: all-time totals, the last 7 and 30 days, best boulder grade, and the most recent session. Start here.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'list_sessions',
    title: 'List sessions',
    description:
      'Logged sessions, newest first, with headline numbers (sends, flashes, best grade for climbing; sets, volume, exercises for gym). Use get_session for the full detail of one.',
    inputSchema: {
      type: 'object',
      properties: {
        from: DATE,
        to: DATE,
        type: { type: 'string', enum: ['climb', 'strength'] },
        limit: { type: 'integer', minimum: 1, maximum: 200, default: 20 },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'get_session',
    title: 'Session detail',
    description: 'Every climb or set in one session, with its notes. Takes a session_id from list_sessions.',
    inputSchema: {
      type: 'object',
      properties: { session_id: { type: 'string' } },
      required: ['session_id'],
      additionalProperties: false,
    },
  },
  {
    name: 'climbing_progress',
    title: 'Climbing progress',
    description:
      'Bouldering trend per week or month: sessions, sends, flash rate, best grade and a V-grade pyramid. Grade bands (e.g. V3–5) count at their floored midpoint.',
    inputSchema: {
      type: 'object',
      properties: {
        from: DATE,
        to: DATE,
        group_by: { type: 'string', enum: ['week', 'month'], default: 'month' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'strength_progress',
    title: 'Strength progress',
    description:
      'Per-session top set, estimated 1RM and volume for one exercise (case-insensitive name match). Without an exercise, lists every exercise logged with its session count.',
    inputSchema: {
      type: 'object',
      properties: { exercise: { type: 'string' }, from: DATE, to: DATE },
      additionalProperties: false,
    },
  },
  {
    name: 'bodyweight_history',
    title: 'Bodyweight history',
    description: 'Logged bodyweight entries (kg), oldest first, with the change over the range.',
    inputSchema: { type: 'object', properties: { from: DATE, to: DATE }, additionalProperties: false },
  },
];

export class ToolInputError extends Error {}

type Args = Record<string, unknown>;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const dateArg = (args: Args, key: string): string | null => {
  const value = args[key];
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string' || !DATE_RE.test(value)) {
    throw new ToolInputError(`${key} must be a date like 2026-11-01`);
  }
  return value;
};

const inRange = (date: string, from: string | null, to: string | null): boolean =>
  (!from || date >= from) && (!to || date <= to);

/** One number per climb: an exact grade, or the floored midpoint of a band. */
export const climbV = (c: CloudClimb): number => Math.floor((c.vMin + c.vMax) / 2);

const vLabel = (c: CloudClimb): string => (c.vMin === c.vMax ? `V${c.vMin}` : `V${c.vMin}–${c.vMax}`);

const minutes = (ms: number | null): number | null => (ms === null ? null : Math.round(ms / 60000));

const round1 = (n: number): number => Math.round(n * 10) / 10;

/** Epley; a single rep is the lift itself. */
const est1RM = (weight: number, reps: number): number => (reps <= 1 ? weight : round1(weight * (1 + reps / 30)));

const live = (rows: SessionRowIn[]): SessionRowIn[] =>
  rows.filter((r) => r.status === 'completed').sort((a, b) => b.started_at.localeCompare(a.started_at));

const bestClimb = (climbs: CloudClimb[]): CloudClimb | null =>
  climbs.reduce<CloudClimb | null>((best, c) => (!best || climbV(c) > climbV(best) ? c : best), null);

const climbHeadline = (r: SessionRowIn) => {
  const climbs = r.summary.climbs ?? [];
  const flashes = climbs.filter((c) => c.result === 'flash').length;
  const best = bestClimb(climbs);
  return {
    sends: climbs.length,
    flashes,
    flashRate: climbs.length ? Math.round((flashes / climbs.length) * 100) : 0,
    bestGrade: best ? { gym: best.grade, v: vLabel(best) } : null,
  };
};

const strengthHeadline = (r: SessionRowIn) => {
  const sets = r.summary.sets ?? [];
  return {
    sets: sets.length,
    reps: sets.reduce((n, s) => n + s.reps, 0),
    volume: round1(sets.reduce((n, s) => n + s.reps * s.weight, 0)),
    exercises: [...new Set(sets.map((s) => s.exercise))],
  };
};

const brief = (r: SessionRowIn) => ({
  session_id: r.session_id,
  type: r.type,
  date: r.summary.localDate,
  startedAt: r.started_at,
  durationMin: minutes(r.summary.durationMs),
  gym: r.gym_name,
  title: r.title,
  ...(r.type === 'climb' ? climbHeadline(r) : strengthHeadline(r)),
});

/** YYYY-MM-DD `days` before the user's local today. */
const localDaysAgo = (now: Date, tzOffsetMin: number, days: number): string =>
  new Date(now.getTime() + tzOffsetMin * 60000 - days * 86400000).toISOString().slice(0, 10);

const windowStats = (rows: SessionRowIn[], from: string) => {
  const inWindow = rows.filter((r) => r.summary.localDate >= from);
  const climbs = inWindow.flatMap((r) => r.summary.climbs ?? []);
  const sets = inWindow.flatMap((r) => r.summary.sets ?? []);
  const flashes = climbs.filter((c) => c.result === 'flash').length;
  const best = bestClimb(climbs);
  return {
    since: from,
    climbingSessions: inWindow.filter((r) => r.type === 'climb').length,
    gymSessions: inWindow.filter((r) => r.type === 'strength').length,
    sends: climbs.length,
    flashRate: climbs.length ? Math.round((flashes / climbs.length) * 100) : 0,
    bestGrade: best ? vLabel(best) : null,
    sets: sets.length,
    volume: round1(sets.reduce((n, s) => n + s.reps * s.weight, 0)),
  };
};

const overview = (rows: SessionRowIn[], now: Date) => {
  const done = live(rows);
  if (done.length === 0) {
    return { message: 'No sessions synced yet. Sessions appear here after they are finished in ASCEND with cloud sync on.' };
  }
  const tz = done[0].summary.tzOffsetMin ?? 0;
  const allClimbs = done.flatMap((r) => (r.summary.climbs ?? []).map((c) => ({ c, date: r.summary.localDate })));
  const best = allClimbs.reduce<{ c: CloudClimb; date: string } | null>(
    (b, x) => (!b || climbV(x.c) > climbV(b.c) ? x : b),
    null
  );
  return {
    today: localDaysAgo(now, tz, 0),
    allTime: {
      climbingSessions: done.filter((r) => r.type === 'climb').length,
      gymSessions: done.filter((r) => r.type === 'strength').length,
      sends: allClimbs.length,
      firstSession: done[done.length - 1].summary.localDate,
      bestGrade: best ? { v: vLabel(best.c), gym: best.c.grade, date: best.date } : null,
    },
    last7Days: windowStats(done, localDaysAgo(now, tz, 6)),
    last30Days: windowStats(done, localDaysAgo(now, tz, 29)),
    lastSession: brief(done[0]),
  };
};

/** Monday-start ISO-ish week key: the date of that Monday. */
const weekKey = (date: string): string => {
  const d = new Date(`${date}T00:00:00Z`);
  const back = (d.getUTCDay() + 6) % 7;
  return new Date(d.getTime() - back * 86400000).toISOString().slice(0, 10);
};

const climbingProgress = (rows: SessionRowIn[], args: Args) => {
  const from = dateArg(args, 'from');
  const to = dateArg(args, 'to');
  const groupBy = args.group_by === 'week' ? 'week' : 'month';
  const sessions = live(rows)
    .filter((r) => r.type === 'climb' && inRange(r.summary.localDate, from, to))
    .reverse();
  const periods = new Map<string, { sessions: number; climbs: CloudClimb[] }>();
  sessions.forEach((r) => {
    const key = groupBy === 'week' ? weekKey(r.summary.localDate) : r.summary.localDate.slice(0, 7);
    const p = periods.get(key) ?? { sessions: 0, climbs: [] };
    p.sessions += 1;
    p.climbs.push(...(r.summary.climbs ?? []));
    periods.set(key, p);
  });
  return {
    groupBy,
    periods: [...periods.entries()].map(([period, p]) => {
      const flashes = p.climbs.filter((c) => c.result === 'flash').length;
      const pyramid: Record<string, number> = {};
      [...p.climbs].sort((a, b) => climbV(b) - climbV(a)).forEach((c) => {
        const k = `V${climbV(c)}`;
        pyramid[k] = (pyramid[k] ?? 0) + 1;
      });
      const best = bestClimb(p.climbs);
      return {
        period,
        sessions: p.sessions,
        sends: p.climbs.length,
        flashRate: p.climbs.length ? Math.round((flashes / p.climbs.length) * 100) : 0,
        bestGrade: best ? vLabel(best) : null,
        pyramid,
      };
    }),
  };
};

const strengthProgress = (rows: SessionRowIn[], args: Args) => {
  const from = dateArg(args, 'from');
  const to = dateArg(args, 'to');
  const sessions = live(rows)
    .filter((r) => r.type === 'strength' && inRange(r.summary.localDate, from, to))
    .reverse();
  const query = typeof args.exercise === 'string' ? args.exercise.trim().toLowerCase() : '';

  if (!query) {
    const counts = new Map<string, number>();
    sessions.forEach((r) => {
      new Set((r.summary.sets ?? []).map((s) => s.exercise)).forEach((e) => counts.set(e, (counts.get(e) ?? 0) + 1));
    });
    return {
      exercises: [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([exercise, sessionCount]) => ({ exercise, sessions: sessionCount })),
    };
  }

  const matches = new Set<string>();
  const points = sessions.flatMap((r) => {
    const sets = (r.summary.sets ?? []).filter((s) => s.exercise.toLowerCase().includes(query));
    if (sets.length === 0) return [];
    sets.forEach((s) => matches.add(s.exercise));
    const top = sets.reduce((a, b) => (est1RM(b.weight, b.reps) > est1RM(a.weight, a.reps) ? b : a));
    return [
      {
        date: r.summary.localDate,
        session_id: r.session_id,
        topSet: { weight: top.weight, reps: top.reps, unit: top.unit },
        est1RM: est1RM(top.weight, top.reps),
        sets: sets.length,
        volume: round1(sets.reduce((n, s) => n + s.reps * s.weight, 0)),
      },
    ];
  });
  return { query: args.exercise, matched: [...matches], sessions: points };
};

const bodyweightHistory = (rows: BodyweightRowIn[], args: Args) => {
  const from = dateArg(args, 'from');
  const to = dateArg(args, 'to');
  const entries = rows
    .map((r) => ({ date: r.logged_at.slice(0, 10), loggedAt: r.logged_at, kg: round1(r.weight_kg) }))
    .filter((e) => inRange(e.date, from, to))
    .sort((a, b) => a.loggedAt.localeCompare(b.loggedAt));
  return {
    entries,
    changeKg: entries.length > 1 ? round1(entries[entries.length - 1].kg - entries[0].kg) : null,
  };
};

export type ToolData = { sessions: SessionRowIn[]; bodyweight: BodyweightRowIn[] };

/** Which data a tool needs, so index.ts only queries what it must. */
export const needsBodyweight = (name: string): boolean => name === 'bodyweight_history';

export const runTool = (name: string, args: Args, data: ToolData, now = new Date()): unknown => {
  switch (name) {
    case 'get_overview':
      return overview(data.sessions, now);
    case 'list_sessions': {
      const from = dateArg(args, 'from');
      const to = dateArg(args, 'to');
      const type = args.type === 'climb' || args.type === 'strength' ? args.type : null;
      const limit = Math.min(200, Math.max(1, Number.isInteger(args.limit) ? (args.limit as number) : 20));
      const rows = live(data.sessions).filter(
        (r) => (!type || r.type === type) && inRange(r.summary.localDate, from, to)
      );
      return { total: rows.length, sessions: rows.slice(0, limit).map(brief) };
    }
    case 'get_session': {
      const id = args.session_id;
      if (typeof id !== 'string' || !id) throw new ToolInputError('session_id is required');
      const r = data.sessions.find((s) => s.session_id === id && s.status !== 'deleted');
      if (!r) throw new ToolInputError(`No session with id ${id}`);
      return {
        ...brief(r),
        status: r.status,
        completedAt: r.completed_at,
        notes: r.notes,
        routine: r.summary.routine ?? null,
        climbs: r.summary.climbs?.map((c) => ({ ...c, v: vLabel(c), at: new Date(c.at).toISOString() })),
        sets: r.summary.sets?.map((s) => ({ ...s, at: new Date(s.at).toISOString() })),
      };
    }
    case 'climbing_progress':
      return climbingProgress(data.sessions, args);
    case 'strength_progress':
      return strengthProgress(data.sessions, args);
    case 'bodyweight_history':
      return bodyweightHistory(data.bodyweight, args);
    default:
      throw new ToolInputError(`Unknown tool ${name}`);
  }
};
