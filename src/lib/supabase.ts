import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_DATABASE_URL ||
  '';

const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (client) return client;

  if (supabaseUrl && supabaseKey && supabaseUrl.startsWith('http')) {
    try {
      client = createClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
      return client;
    } catch (err) {
      console.warn('Could not initialize Supabase client:', err);
    }
  }

  return null;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(getSupabaseClient());
}
