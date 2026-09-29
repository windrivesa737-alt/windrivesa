import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  getCurrentSession,
  login as authLogin,
  register as authRegister,
  logout as authLogout,
  onAuthStateChange,
} from '../services/auth.js';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Keep a ref to track whether the initial auth check has completed
  const initialCheckCompleted = useRef(false);

  // Sync active user to browser storage for backward compatibility with existing services
  const syncStorageUser = (authUser, userProfile) => {
    if (!authUser) return;
    try {
      sessionStorage.removeItem('windrive_logged_out');
      const sessionUser = {
        id: authUser.id,
        fullName: userProfile?.full_name || authUser.user_metadata?.full_name || 'WinDriveSA Member',
        memberId: userProfile?.member_number || (authUser.id ? `WD-${authUser.id.slice(0, 5).toUpperCase()}` : 'WD-88349-ZA'),
        email: userProfile?.email || authUser.email || '',
        mobile: userProfile?.mobile_number || authUser.user_metadata?.mobile_number || '',
        role: (userProfile?.role || authUser.user_metadata?.role || 'USER').toLowerCase(),
        status: (userProfile?.account_status || 'PENDING_REVIEW').replace('_', ' '),
      };
      sessionStorage.setItem('windrive_current_user', JSON.stringify(sessionUser));
      localStorage.setItem('windrive_current_user', JSON.stringify(sessionUser));
      if (sessionUser.role === 'admin') {
        sessionStorage.removeItem('windrive_admin_logged_out');
        localStorage.setItem('windrive_admin_user', JSON.stringify(sessionUser));
      }
    } catch (_) {}
  };

  const clearStorageUser = () => {
    try {
      sessionStorage.removeItem('windrive_current_user');
      localStorage.removeItem('windrive_current_user');
      sessionStorage.removeItem('windrive_admin_user');
      localStorage.removeItem('windrive_admin_user');
      sessionStorage.setItem('windrive_logged_out', 'true');
    } catch (_) {}
  };

  // Fetch full profile by user ID from Supabase
  // Safe resilience: database errors, missing rows, or network hiccups NEVER sign the user out
  const fetchProfile = useCallback(async (userId, fallbackUser = null) => {
    if (!userId) {
      setProfile(null);
      return null;
    }

    if (!isSupabaseConfigured() || !supabase) {
      const temp = {
        id: userId,
        full_name: fallbackUser?.user_metadata?.full_name || '',
        email: fallbackUser?.email || '',
        mobile_number: fallbackUser?.user_metadata?.mobile_number || '',
        role: (fallbackUser?.user_metadata?.role || 'USER').toUpperCase(),
        account_status: (fallbackUser?.user_metadata?.account_status || 'PENDING_REVIEW').toUpperCase(),
      };
      setProfile(temp);
      syncStorageUser(fallbackUser || { id: userId }, temp);
      return temp;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.debug('Notice fetching profile from Supabase:', error.message);
      }

      if (data) {
        setProfile(data);
        syncStorageUser(fallbackUser || { id: userId, email: data.email }, data);
        return data;
      }

      // If profile record is still being created by trigger, create safe default
      const tempProfile = {
        id: userId,
        full_name: fallbackUser?.user_metadata?.full_name || '',
        email: fallbackUser?.email || '',
        mobile_number: fallbackUser?.user_metadata?.mobile_number || '',
        role: (fallbackUser?.user_metadata?.role || 'USER').toUpperCase(),
        account_status: (fallbackUser?.user_metadata?.account_status || 'PENDING_REVIEW').toUpperCase(),
      };
      setProfile(tempProfile);
      syncStorageUser(fallbackUser || { id: userId }, tempProfile);
      return tempProfile;
    } catch (err) {
      console.debug('Profile fetch caught error:', err);
      if (fallbackUser) {
        const tempProfile = {
          id: userId,
          full_name: fallbackUser.user_metadata?.full_name || '',
          email: fallbackUser.email || '',
          mobile_number: fallbackUser.user_metadata?.mobile_number || '',
          role: (fallbackUser.user_metadata?.role || 'USER').toUpperCase(),
          account_status: (fallbackUser.user_metadata?.account_status || 'PENDING_REVIEW').toUpperCase(),
        };
        setProfile(tempProfile);
        syncStorageUser(fallbackUser, tempProfile);
        return tempProfile;
      }
      return null;
    }
  }, []);

  // Initialize and subscribe to Supabase Auth state changes
  useEffect(() => {
    let isMounted = true;

    // Single source of truth auth listener
    // Handles: INITIAL_SESSION, SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, USER_UPDATED
    const { data } = onAuthStateChange(async (event, newSession) => {
      if (!isMounted) return;

      if (
        event === 'INITIAL_SESSION' ||
        event === 'SIGNED_IN' ||
        event === 'TOKEN_REFRESHED' ||
        event === 'USER_UPDATED'
      ) {
        const newUser = newSession?.user || null;
        setSession(newSession || null);
        setUser(newUser);

        if (newUser) {
          await fetchProfile(newUser.id, newUser);
        } else {
          setProfile(null);
          clearStorageUser();
        }

        if (!initialCheckCompleted.current) {
          initialCheckCompleted.current = true;
          setLoading(false);
        }
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setProfile(null);
        clearStorageUser();
        if (!initialCheckCompleted.current) {
          initialCheckCompleted.current = true;
          setLoading(false);
        }
      }
    });

    // Fallback direct session check in case INITIAL_SESSION was missed
    async function initDirectCheck() {
      try {
        const { session: currentSession, user: currentUser } = await getCurrentSession();
        if (!isMounted) return;

        if (currentSession && currentUser) {
          setSession(currentSession);
          setUser(currentUser);
          await fetchProfile(currentUser.id, currentUser);
        } else if (!user) {
          setSession(null);
          setUser(null);
          setProfile(null);
        }
      } catch (err) {
        console.debug('Session check notice:', err);
      } finally {
        if (isMounted) {
          initialCheckCompleted.current = true;
          setLoading(false);
        }
      }
    }

    initDirectCheck();

    return () => {
      isMounted = false;
      if (data?.subscription?.unsubscribe) {
        data.subscription.unsubscribe();
      }
    };
  }, [fetchProfile]);

  const login = async ({ email, password }) => {
    const result = await authLogin({ email, password });
    if (result.success) {
      setUser(result.user);
      setSession(result.session);
      if (result.profile) {
        setProfile(result.profile);
        syncStorageUser(result.user, result.profile);
      } else if (result.user) {
        await fetchProfile(result.user.id, result.user);
      }
    }
    return result;
  };

  const register = async ({ email, password, fullName, mobileNumber }) => {
    const result = await authRegister({ email, password, fullName, mobileNumber });
    if (result.success && result.session) {
      setUser(result.user);
      setSession(result.session);
      await fetchProfile(result.user.id, result.user);
    }
    return result;
  };

  const signOut = async () => {
    try {
      await authLogout();
    } catch (_) {}
    setSession(null);
    setUser(null);
    setProfile(null);
    clearStorageUser();
  };

  const logout = signOut;

  const refreshProfile = async () => {
    if (user?.id) {
      return await fetchProfile(user.id, user);
    }
    return null;
  };

  const roleValue = (profile?.role || user?.user_metadata?.role || 'USER').toUpperCase();
  const isAdmin = roleValue === 'ADMIN';

  const value = {
    session,
    user,
    profile,
    loading,
    isAuthenticated: !!user,
    accountStatus: (profile?.account_status || 'PENDING_REVIEW').toUpperCase(),
    role: roleValue,
    isAdmin,
    login,
    register,
    logout,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
