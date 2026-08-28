/**
 * SIPRAS MABAR - Supabase Integration Client Helper
 * Supports direct connection to live Supabase backend when environment credentials exist,
 * otherwise transparently interfaces with our persistent reactive storage engine.
 */

export interface SupabaseConfig {
  url?: string;
  anonKey?: string;
  isConfigured: boolean;
}

export function getSupabaseConfig(): SupabaseConfig {
  const url = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const anonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';
  return {
    url,
    anonKey,
    isConfigured: Boolean(url && anonKey)
  };
}
