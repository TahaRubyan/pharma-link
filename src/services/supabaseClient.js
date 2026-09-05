// Supabase Cloud PostgreSQL Client & RLS Engine Connector
// If environment variables VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are present,
// queries route to Supabase; otherwise, seamlessly falls back to offline local storage.

const SUPABASE_URL = typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const supabaseClient = {
  isConfigured: isSupabaseConfigured,
  url: SUPABASE_URL,

  // Helper to query with tenant header
  queryWithTenant: async (table, tenantId, options = {}) => {
    if (!isSupabaseConfigured) {
      // Fallback to local storage
      const localKey = `pharmalink_${table}`;
      const data = JSON.parse(localStorage.getItem(localKey) || '[]');
      return { data, error: null };
    }

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?tenant_id=eq.${tenantId}`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId
        }
      });
      const data = await response.json();
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  }
};