import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Lazy singleton — only created on first call, not at module load.
// This prevents build-time failures when env vars are not set.
let _client: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!_client) {
    _client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }
  return _client;
}
