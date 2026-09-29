import { createClient } from '@supabase/supabase-js';

/**
 * Centralized Supabase Client Foundation for WinDriveSA
 *
 * Security Principles:
 * 1. Reads ONLY publishable credentials (SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY).
 * 2. Never exposes or handles service-role keys, master keys, or database passwords in the browser.
 * 3. Database access is governed exclusively by Supabase Row Level Security (RLS) policies.
 * 4. Credentials are strictly retrieved via environment variables and never hardcoded.
 */

const getEnvVar = (key) => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      return import.meta.env[key];
    }
  } catch (_) {}
  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key];
    }
  } catch (_) {}
  return '';
};

const supabaseUrl =
  getEnvVar('VITE_SUPABASE_URL') ||
  getEnvVar('SUPABASE_URL') ||
  '';

const supabasePublishableKey =
  getEnvVar('VITE_SUPABASE_PUBLISHABLE_KEY') ||
  getEnvVar('SUPABASE_PUBLISHABLE_KEY') ||
  '';

/**
 * Determines whether Supabase has valid public configuration credentials.
 * @returns {boolean}
 */
export function isSupabaseConfigured() {
  return Boolean(
    supabaseUrl &&
    supabasePublishableKey &&
    typeof supabaseUrl === 'string' &&
    typeof supabasePublishableKey === 'string' &&
    supabaseUrl.trim().length > 0 &&
    supabasePublishableKey.trim().length > 0
  );
}

let supabaseInstance = null;

if (isSupabaseConfigured()) {
  try {
    supabaseInstance = createClient(supabaseUrl.trim(), supabasePublishableKey.trim(), {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'windrive_supabase_auth_token',
      },
    });
  } catch (initErr) {
    console.warn('Notice: Supabase client initialization encountered an issue. Check configuration format.');
  }
}

/**
 * Shared singleton Supabase client instance.
 * Reusable across services to prevent multiple redundant client connections.
 */
export const supabase = supabaseInstance;

/**
 * Accessor for the active Supabase client.
 * Throws a clear descriptive error if invoked while unconfigured.
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 */
export function getSupabase() {
  if (!supabaseInstance) {
    throw new Error(
      'Supabase client is not configured. Ensure SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY are declared in your environment.'
    );
  }
  return supabaseInstance;
}

export default supabase;
