import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

// Cliente público (frontend)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cliente privilegiado (API Routes, webhooks)
export function getServiceSupabase() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder';
  return createClient(supabaseUrl, serviceRoleKey);
}
