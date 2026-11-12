// Entry point for the ascend-mcp edge function. All logic lives in server.ts and tools.ts.
import { handler } from './server.ts';

Deno.serve((req) => handler(req));
