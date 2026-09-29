import { supabase, isSupabaseConfigured, getSupabase } from '../lib/supabase.js';

/**
 * Reusable Supabase service foundation for future data & authentication services.
 * All feature-specific services should import from this module or src/lib/supabase
 * to maintain a single unified connection instance.
 */

export { supabase, isSupabaseConfigured, getSupabase };
export default supabase;
