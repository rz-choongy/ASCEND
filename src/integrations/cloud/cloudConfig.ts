// Same Supabase project as bug reports. Both values come from the environment (.env.local, EAS env
// vars) so the project ref stays out of this public repo.
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_KEY ?? '';

export const isCloudConfigured = (): boolean => SUPABASE_URL.length > 0 && SUPABASE_KEY.length > 0;

/** The MCP endpoint an assistant connects to; the token is the secret. */
export const connectorUrlFor = (token: string): string => `${SUPABASE_URL}/functions/v1/ascend-mcp/${token}`;

/** Rows per upsert request, to keep each body well under PostgREST's limits. */
export const UPSERT_BATCH = 25;
