import { createClient } from '@supabase/supabase-js';

// Environment variables for Supabase integration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://zfyoyoyqwffkpdqddock.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_wAjYZzXxhpyurrH9gkqikA_FFLjQ2Zh';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Clario Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Please verify your environment configuration.'
  );
}

/**
 * Production-ready Supabase client instance for Clario
 * Configured with persistent sessions, auto-token refresh, and URL recovery detection.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'clario_supabase_auth_token_v1',
  },
});

export interface UserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url?: string | null;
  role?: string | null;
  bio?: string | null;
  phone?: string | null;
  username?: string | null;
  created_at?: string;
  updated_at?: string;
}
