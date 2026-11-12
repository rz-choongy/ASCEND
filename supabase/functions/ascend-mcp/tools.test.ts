import { assert, assertEquals } from 'jsr:@std/assert@1';
import { handler, handleMessage } from './server.ts';
import { runTool, ToolInputError, type SessionRowIn } from './tools.ts';

const climb = (id: string, date: string, climbs: [number, number, 'send' | 'flash'][], status: SessionRowIn['status'] = 'completed'): SessionRowIn => ({
  session_id: id,
  type: 'climb',
  status,
  started_at: `${date}T09:00:00.000Z`,
  completed_at: `${date}T10:30:00.000Z`,
  gym_name: 'Blochaus',
  title: null,
  notes: id === 'c2' ? 'felt strong' : null,
  summary: {
    v: 1,
    localDate: date,
    tzOffsetMin: 600,
    durationMs: 90 * 60000,
    climbs: climbs.map(([vMin, vMax, result], i) => ({ grade: `Blue ${i}`, vMin, vMax, result, at: Date.parse(`${date}T09:10:00Z`) })),
  },
});

const gym = (id: string, date: string, sets: [string, number, number][]): SessionRowIn => ({
  session_id: id,
  type: 'strength',
  status: 'completed',
  started_at: `${date}T18:00:00.000Z`,
  completed_at: `${date}T19:00:00.000Z`,
  gym_name: null,
  title: 'Pull day',
  notes: null,
  summary: {
    v: 1,
    localDate: date,
    tzOffsetMin: 600,
    durationMs: 60 * 60000,
    sets: sets.map(([exercise, weight, reps]) => ({ exercise, weight, reps, unit: 'kg', at: Date.parse(`${date}T18:10:00Z`) })),
  },
});

const sessions: SessionRowIn[] = [
  climb('c1', '2026-10-05', [[3, 3, 'flash'], [4, 4, 'send']]),
  climb('c2', '2026-11-03', [[5, 5, 'send'], [4, 6, 'send'], [3, 3, 'flash'], [3, 3, 'flash']]),
  climb('c3', '2026-11-04', [[9, 9, 'flash']], 'deleted'),
  gym('g1', '2026-11-01', [['Weighted pull-up', 10, 5], ['Weighted pull-up', 15, 3], ['Row', 40, 10]]),
  gym('g2', '2026-11-06', [['Weighted pull-up', 20, 2]]),
];
const data = { sessions, bodyweight: [
  { id: 'b1', weight_kg: 70.4, logged_at: '2026-10-01T07:00:00Z' },
  { id: 'b2', weight_kg: 69.1, logged_at: '2026-11-01T07:00:00Z' },
] };
const NOW = new Date('2026-11-07T02:00:00Z'); // 12:00 on 7 Nov at UTC+10

Deno.test('overview ignores deleted sessions and windows by local date', () => {
  const o = runTool('get_overview', {}, data, NOW) as any;
  assertEquals(o.today, '2026-11-07');
  assertEquals(o.allTime.climbingSessions, 2);
  assertEquals(o.allTime.gymSessions, 2);
  assertEquals(o.allTime.bestGrade.v, 'V5');
  assertEquals(o.last7Days.climbingSessions, 1);
  assertEquals(o.last7Days.sends, 4);
  assertEquals(o.last7Days.flashRate, 50);
  assertEquals(o.last30Days.climbingSessions, 1);
  assertEquals(o.lastSession.session_id, 'g2');
});

Deno.test('list_sessions filters, orders newest first and limits', () => {
  const r = runTool('list_sessions', { type: 'climb', limit: 1 }, data) as any;
  assertEquals(r.total, 2);
  assertEquals(r.sessions.map((s: any) => s.session_id), ['c2']);
  assertEquals(r.sessions[0].bestGrade, { gym: 'Blue 0', v: 'V5' });
  const ranged = runTool('list_sessions', { from: '2026-11-02', to: '2026-11-05' }, data) as any;
  assertEquals(ranged.sessions.map((s: any) => s.session_id), ['c2']);
});

Deno.test('get_session returns detail and rejects deleted ids', () => {
  const s = runTool('get_session', { session_id: 'c2' }, data) as any;
  assertEquals(s.notes, 'felt strong');
  assertEquals(s.climbs.length, 4);
  let threw = false;
  try {
    runTool('get_session', { session_id: 'c3' }, data);
  } catch (e) {
    threw = e instanceof ToolInputError;
  }
  assert(threw);
});

Deno.test('climbing_progress builds a pyramid per month', () => {
  const r = runTool('climbing_progress', {}, data) as any;
  assertEquals(r.periods.map((p: any) => p.period), ['2026-10', '2026-11']);
  assertEquals(r.periods[1].pyramid, { V5: 2, V3: 2 });
  assertEquals(r.periods[1].bestGrade, 'V5');
});

Deno.test('strength_progress lists exercises, then tracks one', () => {
  const list = runTool('strength_progress', {}, data) as any;
  assertEquals(list.exercises[0], { exercise: 'Weighted pull-up', sessions: 2 });
  const r = runTool('strength_progress', { exercise: 'pull' }, data) as any;
  assertEquals(r.sessions.length, 2);
  assertEquals(r.sessions[0].topSet, { weight: 15, reps: 3, unit: 'kg' });
  assertEquals(r.sessions[1].est1RM, 21.3);
});

Deno.test('bodyweight_history reports change', () => {
  const r = runTool('bodyweight_history', {}, data) as any;
  assertEquals(r.changeKg, -1.3);
});

Deno.test('bad dates are tool errors, not crashes', async () => {
  const reply = (await handleMessage(
    { jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'list_sessions', arguments: { from: 'last week' } } },
    'u1',
    async () => data
  )) as any;
  assertEquals(reply.result.isError, true);
});

const TOKEN = 'a'.repeat(48);
const deps = {
  userForToken: async (t: string) => (t === TOKEN ? 'u1' : null),
  loadData: async () => data,
};
const post = (path: string, body: unknown) =>
  new Request(`https://x.supabase.co/functions/v1/ascend-mcp/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' },
    body: JSON.stringify(body),
  });

Deno.test('handler: initialize, list, call', async () => {
  const init = await (await handler(post(TOKEN, { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18' } }), deps)).json();
  assertEquals(init.result.protocolVersion, '2025-06-18');
  assertEquals(init.result.serverInfo.name, 'ascend');
  const list = await (await handler(post(TOKEN, { jsonrpc: '2.0', id: 2, method: 'tools/list' }), deps)).json();
  assertEquals(list.result.tools.length, 6);
  const call = await (await handler(post(TOKEN, { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'get_overview', arguments: {} } }), deps)).json();
  assertEquals(call.result.structuredContent.allTime.climbingSessions, 2);
});

Deno.test('handler: notifications get 202, bad tokens 401/404, GET 405', async () => {
  assertEquals((await handler(post(TOKEN, { jsonrpc: '2.0', method: 'notifications/initialized' }), deps)).status, 202);
  assertEquals((await handler(post('b'.repeat(48), { jsonrpc: '2.0', id: 1, method: 'ping' }), deps)).status, 401);
  assertEquals((await handler(post('nope', { jsonrpc: '2.0', id: 1, method: 'ping' }), deps)).status, 404);
  assertEquals((await handler(new Request(`https://x/ascend-mcp/${TOKEN}`), deps)).status, 405);
});
