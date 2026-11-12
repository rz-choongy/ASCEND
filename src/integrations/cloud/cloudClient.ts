import { createCloudAuth } from './cloudAuth';
import { SUPABASE_KEY, SUPABASE_URL } from './cloudConfig';
import { cloudSessionStore } from './cloudSettings';

export const cloudAuth = createCloudAuth({ url: SUPABASE_URL, key: SUPABASE_KEY, store: cloudSessionStore });
