// ascend-mcp: a read-only MCP server (Streamable HTTP, stateless, JSON responses) over a user's
// synced ASCEND sessions. Connector URL: https://<ref>.supabase.co/functions/v1/ascend-mcp/<token>
// The token is minted in the app (rotate_connector_token) and stored here only as a hash.
// Deploy with verify_jwt = false: the path token is the auth.

import { needsBodyweight, runTool, ToolInputError, TOOLS, type ToolData } from './tools.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const SERVER_INFO = { name: 'ascend', title: 'ASCEND climbing & gym log', version: '1.0.0' };
const SUPPORTED_VERSIONS = ['2025-06-18', '2025-03-26', '2024-11-05'];
const INSTRUCTIONS =
  'Read-only access to the user\'s ASCEND log: indoor bouldering sessions (sends and flashes by grade) and gym sessions (sets, reps, weight). Call get_overview first. Dates are the user\'s local dates.';

const TOKEN_RE = /^[0-9a-f]{48}$/;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type, mcp-session-id, mcp-protocol-version, authorization',
};

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

type JsonRpc = { jsonrpc?: string; id?: string | number | null; method?: string; params?: Record<string, unknown> };

const rpcError = (id: JsonRpc['id'], code: number, message: string) => ({
  jsonrpc: '2.0',
  id: id ?? null,
  error: { code, message },
});

const db = async (path: string, init: RequestInit = {}): Promise<unknown> => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(`db ${res.status}: ${await res.text()}`);
  return res.json();
};

const userForToken = async (token: string): Promise<string | null> => {
  const id = await db('rpc/connector_user', { method: 'POST', body: JSON.stringify({ p_token: token }) });
  return typeof id === 'string' ? id : null;
};

const SESSION_COLUMNS = 'session_id,type,status,started_at,completed_at,gym_name,title,notes,summary';

const loadData = async (userId: string, tool: string): Promise<ToolData> => {
  const uid = encodeURIComponent(userId);
  const [sessions, bodyweight] = await Promise.all([
    needsBodyweight(tool)
      ? Promise.resolve([])
      : db(`cloud_sessions?user_id=eq.${uid}&status=neq.deleted&select=${SESSION_COLUMNS}&order=started_at.desc&limit=10000`),
    needsBodyweight(tool)
      ? db(`cloud_bodyweight?user_id=eq.${uid}&select=id,weight_kg,logged_at&order=logged_at.asc&limit=10000`)
      : Promise.resolve([]),
  ]);
  return { sessions: sessions as ToolData['sessions'], bodyweight: bodyweight as ToolData['bodyweight'] };
};

export const handleMessage = async (
  msg: JsonRpc,
  userId: string,
  load: typeof loadData = loadData
): Promise<object | null> => {
  const { id, method, params } = msg;
  // Notifications (no id) get no response.
  if (id === undefined || id === null) return null;

  switch (method) {
    case 'initialize': {
      const requested = typeof params?.protocolVersion === 'string' ? params.protocolVersion : '';
      return {
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: SUPPORTED_VERSIONS.includes(requested) ? requested : SUPPORTED_VERSIONS[0],
          capabilities: { tools: { listChanged: false } },
          serverInfo: SERVER_INFO,
          instructions: INSTRUCTIONS,
        },
      };
    }
    case 'ping':
      return { jsonrpc: '2.0', id, result: {} };
    case 'tools/list':
      return {
        jsonrpc: '2.0',
        id,
        result: { tools: TOOLS.map((t) => ({ ...t, annotations: { readOnlyHint: true, openWorldHint: false } })) },
      };
    case 'tools/call': {
      const name = typeof params?.name === 'string' ? params.name : '';
      if (!TOOLS.some((t) => t.name === name)) return rpcError(id, -32602, `Unknown tool: ${name}`);
      const args = (params?.arguments ?? {}) as Record<string, unknown>;
      try {
        const data = await load(userId, name);
        const out = runTool(name, args, data);
        return {
          jsonrpc: '2.0',
          id,
          result: { content: [{ type: 'text', text: JSON.stringify(out) }], structuredContent: out },
        };
      } catch (e) {
        if (e instanceof ToolInputError) {
          return { jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: e.message }], isError: true } };
        }
        console.error(e);
        return rpcError(id, -32603, 'Could not read your ASCEND data. Try again shortly.');
      }
    }
    default:
      return rpcError(id, -32601, `Method not found: ${method}`);
  }
};

export const handler = async (req: Request, deps = { userForToken, loadData }): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

  const token = new URL(req.url).pathname.split('/').filter(Boolean).pop() ?? '';
  if (!TOKEN_RE.test(token)) return json({ error: 'Not found' }, 404);

  // Stateless server: no SSE stream to open and no session to end.
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let userId: string | null;
  try {
    userId = await deps.userForToken(token);
  } catch (e) {
    console.error(e);
    return json({ error: 'Temporarily unavailable' }, 503);
  }
  if (!userId) return json({ error: 'This ASCEND link was reset or removed. Make a new one in the app.' }, 401);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json(rpcError(null, -32700, 'Parse error'), 400);
  }

  const messages = (Array.isArray(body) ? body : [body]) as JsonRpc[];
  const replies = (await Promise.all(messages.map((m) => handleMessage(m, userId!, deps.loadData)))).filter(
    (r): r is object => r !== null
  );
  if (replies.length === 0) return new Response(null, { status: 202, headers: CORS });
  return json(Array.isArray(body) ? replies : replies[0]);
};
