import { rateLimiter } from './rateLimiter';

const SUPABASE_URL = typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const supabaseClient = {
  isConfigured: isSupabaseConfigured,
  url: SUPABASE_URL,

  // Helper to query with tenant header protected by token bucket rate limiter
  queryWithTenant: async (table, tenantId, options = {}) => {
    const priority = options.priority || 'NORMAL';

    if (!isSupabaseConfigured) {
      // Fallback to local storage
      const localKey = `pharmalink_${table}`;
      const data = JSON.parse(localStorage.getItem(localKey) || '[]');
      return { data, error: null };
    }

    try {
      // Schedule query through RateLimiter to protect free tier from 429 bursts
      return await rateLimiter.schedule(async () => {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?tenant_id=eq.${tenantId}`, {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'X-Tenant-ID': tenantId
          }
        });

        if (response.status === 429) {
          const err = new Error('HTTP 429: Supabase Free Tier Rate Limit Exceeded');
          err.status = 429;
          throw err;
        }

        const data = await response.json();
        return { data, error: null };
      }, priority);
    } catch (err) {
      // Seamless local fallback if circuit tripped or network failed
      console.warn(`[SupabaseClient] Network or rate limit fallback on ${table}:`, err.message);
      const localKey = `pharmalink_${table}`;
      const data = JSON.parse(localStorage.getItem(localKey) || '[]');
      return { data, error: null, isFallback: true };
    }
  }
};