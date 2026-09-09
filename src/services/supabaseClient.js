import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rwauhobqpegxmaztxbnd.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3YXVob2JxcGVneG1henR4Ym5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5NDg2NTksImV4cCI6MjEwNDUyNDY1OX0.MfJXXeM3b-xwbQxqS6dLaKQuXnQVGrLfHJ9F0bUsN7s';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('your-project-ref'));

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      db: {
        schema: 'public',
      },
    })
  : null;

/**
 * Health check to verify live connectivity with Supabase Postgres
 */
export async function checkSupabaseHealth() {
  if (!supabase) return { connected: false, reason: 'Client not configured' };
  try {
    const { data, error } = await supabase.from('tenants').select('tenant_id').limit(1);
    if (error) {
      console.warn('[Supabase] Health check returned error:', error.message);
      return { connected: false, error: error.message };
    }
    return { connected: true, data };
  } catch (err) {
    console.warn('[Supabase] Health check network error:', err);
    return { connected: false, error: err.message };
  }
}

export default supabase;