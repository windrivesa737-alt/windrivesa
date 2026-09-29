import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import { sanitizeDbError } from './errorHandler.js';

/**
 * WinDriveSA Centralized Supabase Authentication Service
 * Uses Supabase Auth email/password authentication as the single source of truth.
 * Strictly adheres to Row Level Security and database-backed role authorization.
 */

const GENERIC_AUTH_ERROR = 'Unable to sign in. Please check your details and try again.';

/**
 * Register a new user with Supabase Auth
 * Creates the auth.users account and initializes a profile with:
 * - account_status = PENDING_REVIEW
 * - role = USER
 * No rewards or claims are assigned automatically.
 */
export async function register({ email, password, fullName, mobileNumber }) {
  if (!isSupabaseConfigured() || !supabase) {
    return {
      success: false,
      error: 'Authentication service is not available. Please try again later.',
    };
  }

  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanFullName = (fullName || '').trim();
  const cleanMobile = (mobileNumber || '').trim();

  try {
    // 1. Create Auth User in Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          full_name: cleanFullName,
          mobile_number: cleanMobile,
        },
      },
    });

    if (error) {
      // Don't leak raw database or internal stack traces
      const msg = error.message?.toLowerCase() || '';
      if (msg.includes('already registered') || msg.includes('user already exists')) {
        return {
          success: false,
          error: 'An account with this email address already exists. Please sign in or use password recovery.',
        };
      }
      return {
        success: false,
        error: sanitizeDbError(error, 'Unable to create account. Please verify your details and try again.').message,
      };
    }

    const authUser = data?.user;
    if (!authUser) {
      return {
        success: false,
        error: 'Unable to complete registration. Please try again.',
      };
    }

    // When Supabase email confirmations are enabled and an account already exists,
    // Supabase returns an obfuscated user object with an empty identities array to prevent user enumeration
    if (authUser.identities && authUser.identities.length === 0) {
      return {
        success: false,
        error: 'An account with this email address already exists. Please sign in or use password recovery.',
      };
    }

    // 2. Profile Safety: Ensure profile is recorded with PENDING_REVIEW and USER role
    // Even though the handle_new_user trigger exists, we safely ensure it without overwriting existing state.
    try {
      await supabase
        .from('profiles')
        .upsert(
          {
            id: authUser.id,
            full_name: cleanFullName,
            email: cleanEmail,
            mobile_number: cleanMobile,
            role: 'USER',
            account_status: 'PENDING_REVIEW',
          },
          { onConflict: 'id', ignoreDuplicates: true }
        );
    } catch (_) {
      // If trigger already handled it, this is safe
    }

    // Check if email confirmation is required by Supabase
    // With Supabase email confirmations enabled, no active session is returned until confirmed
    const requiresEmailConfirmation = !data.session || !authUser.confirmed_at;

    return {
      success: true,
      user: authUser,
      session: data.session,
      requiresEmailConfirmation,
    };
  } catch (err) {
    return {
      success: false,
      error: 'An unexpected error occurred during registration. Please try again.',
    };
  }
}

/**
 * Sign in existing user with Supabase email/password
 * Retrieves profile to verify role and account_status.
 */
export async function login({ email, password }) {
  if (!isSupabaseConfigured() || !supabase) {
    return {
      success: false,
      error: 'Authentication service is currently unavailable.',
    };
  }

  const cleanEmail = (email || '').trim().toLowerCase();

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error || !data?.user) {
      const errorMsg = (error?.message || '').toLowerCase();
      const errorCode = (error?.code || '').toLowerCase();

      // Specifically handle unconfirmed email error from Supabase
      if (
        errorMsg.includes('email not confirmed') ||
        errorCode === 'email_not_confirmed' ||
        errorMsg.includes('confirm your email') ||
        errorMsg.includes('email is not confirmed')
      ) {
        return {
          success: false,
          isEmailUnconfirmed: true,
          error: 'Please confirm your email address before signing in. Check your inbox for the confirmation link we sent you.',
        };
      }

      // Generic auth message prevents account enumeration
      return {
        success: false,
        error: GENERIC_AUTH_ERROR,
      };
    }

    const authUser = data.user;

    // Retrieve database profile linked by auth.uid() -> profiles.id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();

    if (profileError) {
      console.warn('Profile retrieval notice:', profileError.message);
    }

    // Fallback profile object if DB row is still propagating
    const resolvedProfile = profile || {
      id: authUser.id,
      full_name: authUser.user_metadata?.full_name || '',
      email: authUser.email || cleanEmail,
      mobile_number: authUser.user_metadata?.mobile_number || '',
      role: 'USER',
      account_status: 'PENDING_REVIEW',
    };

    return {
      success: true,
      user: authUser,
      session: data.session,
      profile: resolvedProfile,
    };
  } catch (err) {
    return {
      success: false,
      error: GENERIC_AUTH_ERROR,
    };
  }
}

/**
 * Sign out current authenticated session
 */
export async function logout() {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: true };
  }
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return { success: false, error: sanitizeDbError(error).message };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: 'Unable to sign out.' };
  }
}

export const signOut = logout;

/**
 * Get current authenticated Supabase user
 */
export async function getCurrentUser() {
  if (!isSupabaseConfigured() || !supabase) {
    return { user: null };
  }
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) {
      return { user: null };
    }
    return { user: data.user };
  } catch (_) {
    return { user: null };
  }
}

/**
 * Get current Supabase session
 */
export async function getCurrentSession() {
  if (!isSupabaseConfigured() || !supabase) {
    return { session: null, user: null };
  }
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data?.session) {
      return { session: null, user: null };
    }
    return { session: data.session, user: data.session.user };
  } catch (_) {
    return { session: null, user: null };
  }
}

/**
 * Get current user profile from database
 */
export async function getCurrentProfile() {
  if (!isSupabaseConfigured() || !supabase) {
    return { profile: null };
  }
  try {
    const { user } = await getCurrentUser();
    if (!user) {
      return { profile: null };
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error || !profile) {
      return { profile: null };
    }
    return { profile };
  } catch (_) {
    return { profile: null };
  }
}

/**
 * Check if the currently authenticated user is an administrator
 * Uses database-side role verification (never client-side spoofable)
 */
export async function checkIsAdmin() {
  if (!isSupabaseConfigured() || !supabase) {
    return false;
  }
  try {
    const { user } = await getCurrentUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (error || !data) return false;
    return data.role === 'ADMIN';
  } catch (_) {
    return false;
  }
}

/**
 * Request password recovery email via Supabase Auth
 * Redirects user to /reset-password upon clicking the link
 */
export async function resetPassword(email) {
  if (!isSupabaseConfigured() || !supabase) {
    return {
      success: true,
      message: 'If an account exists for that email address, we’ve sent instructions to reset your password.',
    };
  }

  const cleanEmail = (email || '').trim().toLowerCase();
  const siteUrl = window.location.origin;
  const redirectUrl = `${siteUrl}/reset-password`;

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: redirectUrl,
    });

    if (error) {
      // Don't leak whether email exists; log in development only
      console.debug('Supabase resetPassword error:', error.message);
    }

    // Always report uniform success to prevent account enumeration
    return {
      success: true,
      message: 'If an account exists for that email address, we’ve sent instructions to reset your password.',
    };
  } catch (err) {
    return {
      success: true,
      message: 'If an account exists for that email address, we’ve sent instructions to reset your password.',
    };
  }
}

/**
 * Update authenticated user's password in Supabase Auth
 */
export async function updatePassword(newPassword) {
  if (!isSupabaseConfigured() || !supabase) {
    return {
      success: false,
      error: 'Authentication service unavailable.',
    };
  }

  // Password requirement checks
  if (!newPassword || newPassword.length < 8) {
    return { success: false, error: 'Password must contain at least 8 characters.' };
  }
  if (!/[A-Z]/.test(newPassword)) {
    return { success: false, error: 'Password must include an uppercase letter.' };
  }
  if (!/[a-z]/.test(newPassword)) {
    return { success: false, error: 'Password must include a lowercase letter.' };
  }
  if (!/[0-9]/.test(newPassword)) {
    return { success: false, error: 'Password must include a number.' };
  }

  try {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return {
        success: false,
        error: sanitizeDbError(error, 'Failed to update password. Your reset link may have expired.').message,
      };
    }

    return {
      success: true,
      user: data?.user,
    };
  } catch (err) {
    return {
      success: false,
      error: 'An error occurred while updating your password. Please try again.',
    };
  }
}

/**
 * Listen for Supabase Auth state changes (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, USER_UPDATED)
 */
export function onAuthStateChange(callback) {
  if (!isSupabaseConfigured() || !supabase) {
    return { data: { subscription: { unsubscribe: () => {} } } };
  }
  return supabase.auth.onAuthStateChange(callback);
}
