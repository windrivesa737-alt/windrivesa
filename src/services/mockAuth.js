// Mock authentication service compatible with future Supabase schema
import { supabase } from '../lib/supabase.js';

const USERS_STORAGE_KEY = 'windrive_registered_users';
const CURRENT_REGISTRATION_KEY = 'windrive_pending_registration';
const CURRENT_USER_KEY = 'windrive_current_user';

// Pre-seeded prototype demo accounts for testing all lifecycle states
const SEED_USERS = [
  {
    id: 'usr_approved_001',
    fullName: 'Nkosana Mthembu',
    memberId: 'WD-88349-ZA',
    email: 'member.access@windrivesa.co.za',
    mobile: '+27821234567',
    password: 'SecurePass@2025!',
    role: 'user',
    status: 'APPROVED',
    rewardAssigned: 'Toyota Hilux 2.8 GD-6 Legend 4x4 Auto',
    claimId: 'CLM-2025-0842',
    termsAccepted: true,
    termsAcceptedAt: '2025-01-10T08:30:00.000Z',
    createdAt: '2025-01-10T08:30:00.000Z',
    updatedAt: '2025-01-11T10:00:00.000Z',
  },
  {
    id: 'usr_active_002',
    fullName: 'Lerato Khumalo',
    email: 'active@windrivesa.co.za',
    mobile: '+27839876543',
    password: 'SecurePass@2025!',
    role: 'user',
    status: 'ACTIVE',
    rewardAssigned: 'R150,000 Cash Prize Allocation',
    claimId: 'CLM-2025-0914',
    termsAccepted: true,
    termsAcceptedAt: '2025-01-12T14:15:00.000Z',
    createdAt: '2025-01-12T14:15:00.000Z',
    updatedAt: '2025-01-14T09:20:00.000Z',
  },
  {
    id: 'usr_pending_003',
    fullName: 'Thabo Mokoena',
    email: 'pending@windrivesa.co.za',
    mobile: '+27725551234',
    password: 'SecurePass@2025!',
    role: 'user',
    status: 'PENDING REVIEW',
    rewardAssigned: null,
    claimId: null,
    termsAccepted: true,
    termsAcceptedAt: '2025-02-01T11:00:00.000Z',
    createdAt: '2025-02-01T11:00:00.000Z',
    updatedAt: '2025-02-01T11:00:00.000Z',
  },
  {
    id: 'usr_rejected_004',
    fullName: 'Nandi Dlamini',
    email: 'rejected@windrivesa.co.za',
    mobile: '+27814449876',
    password: 'SecurePass@2025!',
    role: 'user',
    status: 'REJECTED',
    rewardAssigned: null,
    claimId: null,
    termsAccepted: true,
    termsAcceptedAt: '2025-01-20T16:45:00.000Z',
    createdAt: '2025-01-20T16:45:00.000Z',
    updatedAt: '2025-01-22T08:15:00.000Z',
  },
  {
    id: 'usr_admin_001',
    fullName: 'Super Admin Console',
    memberId: 'WD-HQ-001',
    email: 'admin@windrivesa.co.za',
    mobile: '+27820000001',
    password: 'SecurePass@2025!',
    role: 'admin',
    status: 'ACTIVE',
    rewardAssigned: null,
    claimId: null,
    termsAccepted: true,
    termsAcceptedAt: '2025-01-01T08:00:00.000Z',
    createdAt: '2025-01-01T08:00:00.000Z',
    updatedAt: '2025-01-01T08:00:00.000Z',
  },
  {
    id: 'usr_pending_004',
    fullName: 'Sipho Zulu',
    email: 'sipho.zulu@gmail.com',
    mobile: '+27825551001',
    password: 'SecurePass@2025!',
    role: 'user',
    status: 'PENDING REVIEW',
    rewardAssigned: null,
    claimId: null,
    termsAccepted: true,
    termsAcceptedAt: '2025-02-02T09:15:00.000Z',
    createdAt: '2025-02-02T09:15:00.000Z',
    updatedAt: '2025-02-02T09:15:00.000Z',
  },
  {
    id: 'usr_pending_005',
    fullName: 'Zanele Sithole',
    email: 'zanele.s@webmail.co.za',
    mobile: '+27835552002',
    password: 'SecurePass@2025!',
    role: 'user',
    status: 'PENDING REVIEW',
    rewardAssigned: null,
    claimId: null,
    termsAccepted: true,
    termsAcceptedAt: '2025-02-03T14:20:00.000Z',
    createdAt: '2025-02-03T14:20:00.000Z',
    updatedAt: '2025-02-03T14:20:00.000Z',
  },
  {
    id: 'usr_pending_006',
    fullName: 'Johan van der Merwe',
    email: 'johan.vdm@outlook.com',
    mobile: '+27845553003',
    password: 'SecurePass@2025!',
    role: 'user',
    status: 'PENDING REVIEW',
    rewardAssigned: null,
    claimId: null,
    termsAccepted: true,
    termsAcceptedAt: '2025-02-04T10:05:00.000Z',
    createdAt: '2025-02-04T10:05:00.000Z',
    updatedAt: '2025-02-04T10:05:00.000Z',
  },
];

export function getStoredUsers() {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) {
      // Initialize with seed users
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(SEED_USERS));
      return [...SEED_USERS];
    }
    const users = JSON.parse(raw);
    // Ensure all seed users exist in the list
    let modified = false;
    for (const seed of SEED_USERS) {
      if (!users.some((u) => u.email.toLowerCase() === seed.email.toLowerCase())) {
        users.push(seed);
        modified = true;
      }
    }
    if (modified) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    }
    return users;
  } catch (e) {
    console.error('Error reading stored users:', e);
    return [...SEED_USERS];
  }
}

export function registerUser({ fullName, email, mobile, password }) {
  const users = getStoredUsers();

  // Normalize inputs
  const normalizedEmail = email.trim().toLowerCase();
  const cleanedMobile = mobile.replace(/[\s\-\(\)]/g, '');

  const newUser = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    fullName: fullName.trim(),
    email: normalizedEmail,
    mobile: cleanedMobile.startsWith('0')
      ? `+27${cleanedMobile.substring(1)}`
      : cleanedMobile.startsWith('+27')
      ? cleanedMobile
      : `+27${cleanedMobile}`,
    rawMobileInput: mobile.trim(),
    password: password, // Stored for mock prototype auth matching
    role: 'user',
    status: 'PENDING REVIEW', // A newly self-registered user must start as PENDING REVIEW
    rewardAssigned: null,
    claimId: null,
    termsAccepted: true,
    termsAcceptedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Upsert user in storage
  const existingIdx = users.findIndex((u) => u.email.toLowerCase() === normalizedEmail);
  if (existingIdx >= 0) {
    users[existingIdx] = { ...users[existingIdx], ...newUser };
  } else {
    users.push(newUser);
  }

  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    localStorage.setItem(CURRENT_REGISTRATION_KEY, JSON.stringify(newUser));
  } catch (e) {
    console.error('Error saving user to localStorage:', e);
  }

  return newUser;
}

export function loginUser({ email, password, remember = false }) {
  const users = getStoredUsers();
  const normalizedEmail = email.trim().toLowerCase();

  const user = users.find(
    (u) => u.email.toLowerCase() === normalizedEmail
  );

  // Security rule: Generic error message to never leak whether an email exists
  const genericError = 'Unable to sign in. Please check your email address and password and try again.';

  if (!user) {
    return { success: false, error: genericError };
  }

  // Verify mock password (matches password or default prototype password)
  const isMatch = user.password ? user.password === password : password === 'SecurePass@2025!';

  if (!isMatch) {
    return { success: false, error: genericError };
  }

  // Create sanitized session user (never store raw password in session)
  const sessionUser = {
    id: user.id,
    fullName: user.fullName,
    memberId: user.memberId || `WD-${Math.floor(10000 + Math.random() * 90000)}-ZA`,
    email: user.email,
    mobile: user.mobile,
    role: user.role,
    status: user.status,
    rewardAssigned: user.rewardAssigned,
    claimId: user.claimId,
  };

  try {
    sessionStorage.removeItem('windrive_logged_out');
    if (sessionUser.role === 'admin') {
      sessionStorage.removeItem('windrive_admin_logged_out');
      localStorage.setItem('windrive_admin_user', JSON.stringify(sessionUser));
    }
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem(CURRENT_USER_KEY, JSON.stringify(sessionUser));
  } catch (e) {
    console.error('Error saving session:', e);
  }

  return { success: true, user: sessionUser };
}

export function getCurrentUser(fallbackToDefault = false) {
  try {
    const isLoggedOut = sessionStorage.getItem('windrive_logged_out') === 'true';
    if (isLoggedOut) return null;
    const sessionData = sessionStorage.getItem(CURRENT_USER_KEY) || localStorage.getItem(CURRENT_USER_KEY);
    if (sessionData) return JSON.parse(sessionData);
    if (fallbackToDefault) {
      const defaultUser = SEED_USERS[0];
      const sessionUser = {
        id: defaultUser.id,
        fullName: defaultUser.fullName,
        memberId: defaultUser.memberId,
        email: defaultUser.email,
        mobile: defaultUser.mobile,
        role: defaultUser.role,
        status: defaultUser.status,
        rewardAssigned: defaultUser.rewardAssigned,
        claimId: defaultUser.claimId,
      };
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(sessionUser));
      return sessionUser;
    }
    return null;
  } catch (e) {
    return null;
  }
}

export function logoutUser() {
  try {
    sessionStorage.setItem('windrive_logged_out', 'true');
    sessionStorage.removeItem(CURRENT_USER_KEY);
    localStorage.removeItem(CURRENT_USER_KEY);
    if (supabase) {
      supabase.auth.signOut().catch(() => {});
    }
  } catch (e) {}
}

export const logout = logoutUser;

export function getCurrentAdminUser(fallbackToDefault = false) {
  try {
    // Check dedicated admin session
    const adminSession = sessionStorage.getItem('windrive_admin_user') || localStorage.getItem('windrive_admin_user');
    if (adminSession) {
      const parsed = JSON.parse(adminSession);
      if (parsed && parsed.role === 'admin') return parsed;
    }

    // Check standard current user session
    const currentSessionRaw = sessionStorage.getItem(CURRENT_USER_KEY) || localStorage.getItem(CURRENT_USER_KEY);
    if (currentSessionRaw) {
      const parsed = JSON.parse(currentSessionRaw);
      if (parsed && parsed.role === 'admin') return parsed;
    }

    // If fallback is enabled (for direct admin testing/review routes)
    if (fallbackToDefault) {
      const adminUser = SEED_USERS.find((u) => u.role === 'admin') || {
        id: 'usr_admin_001',
        fullName: 'Super Admin Console',
        memberId: 'WD-HQ-001',
        email: 'admin@windrivesa.co.za',
        mobile: '+27820000001',
        role: 'admin',
        status: 'ACTIVE',
      };
      return adminUser;
    }

    return null;
  } catch (e) {
    return null;
  }
}

export function logoutAdminUser() {
  try {
    sessionStorage.setItem('windrive_admin_logged_out', 'true');
    sessionStorage.removeItem('windrive_admin_user');
    localStorage.removeItem('windrive_admin_user');
    sessionStorage.removeItem(CURRENT_USER_KEY);
    localStorage.removeItem(CURRENT_USER_KEY);
    if (supabase) {
      supabase.auth.signOut().catch(() => {});
    }
  } catch (e) {}
}

export function getPendingRegistration() {
  try {
    const data = localStorage.getItem(CURRENT_REGISTRATION_KEY);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
}

export function clearPendingRegistration() {
  localStorage.removeItem(CURRENT_REGISTRATION_KEY);
}

export function requestPasswordReset(email) {
  // Service abstraction compatible with future Supabase auth.resetPasswordForEmail
  // Always returns success to prevent user enumeration
  const normalizedEmail = (email || '').trim().toLowerCase();
  const token = 'wd_rst_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
  const record = {
    token,
    email: normalizedEmail,
    createdAt: Date.now(),
    expiresAt: Date.now() + 15 * 60 * 1000, // 15 minutes validity
    used: false,
  };
  try {
    sessionStorage.setItem('windrive_latest_reset_token', JSON.stringify(record));
    localStorage.setItem('windrive_latest_reset_token', JSON.stringify(record));
  } catch (e) {}

  return {
    success: true,
    email: normalizedEmail,
    token,
    resetUrl: `/reset-password?token=${token}`,
    message: 'If an account exists for that email address, we’ve sent instructions to reset your password.',
  };
}

export function validateResetToken(token) {
  try {
    // If token is explicitly marked as expired or invalid via parameter
    if (token === 'expired' || token === 'invalid') {
      return { valid: false, reason: token };
    }

    let storedRecord = null;
    const rawSession = sessionStorage.getItem('windrive_latest_reset_token');
    const rawLocal = localStorage.getItem('windrive_latest_reset_token');
    if (rawSession) {
      storedRecord = JSON.parse(rawSession);
    } else if (rawLocal) {
      storedRecord = JSON.parse(rawLocal);
    }

    // If a token string is explicitly provided in URL or parameter
    if (token) {
      if (storedRecord && storedRecord.token === token) {
        if (storedRecord.used) {
          return { valid: false, reason: 'used' };
        }
        if (Date.now() > storedRecord.expiresAt) {
          return { valid: false, reason: 'expired' };
        }
        return { valid: true, email: storedRecord.email, token: storedRecord.token };
      }
      // If token format is reasonable (>= 8 characters), treat as active link
      if (token.length >= 8) {
        return { valid: true, email: 'member@windrivesa.co.za', token };
      }
      return { valid: false, reason: 'invalid' };
    }

    // If no token was passed (direct visit / refresh)
    if (storedRecord) {
      if (storedRecord.used) {
        return { valid: false, reason: 'used' };
      }
      if (Date.now() > storedRecord.expiresAt) {
        return { valid: false, reason: 'expired' };
      }
      return { valid: true, email: storedRecord.email, token: storedRecord.token };
    }

    // Default valid recovery session for direct visit so reset form is ready
    const defaultRecord = {
      token: 'wd_rst_default_' + Date.now().toString(36),
      email: 'member@windrivesa.co.za',
      createdAt: Date.now(),
      expiresAt: Date.now() + 15 * 60 * 1000,
      used: false,
    };
    sessionStorage.setItem('windrive_latest_reset_token', JSON.stringify(defaultRecord));
    return { valid: true, email: defaultRecord.email, token: defaultRecord.token };
  } catch (e) {
    return { valid: false, reason: 'error' };
  }
}

export function resetPassword(token, newPassword) {
  // Validate token
  const tokenValidation = validateResetToken(token);
  if (!tokenValidation.valid) {
    return {
      success: false,
      reason: tokenValidation.reason,
      message: 'This password reset link is no longer valid.',
    };
  }

  // Enforce password criteria: >= 8 characters, 1 uppercase, 1 lowercase, 1 number
  if (!newPassword || newPassword.length < 8) {
    return { success: false, message: 'Password must contain at least 8 characters.' };
  }
  if (!/[A-Z]/.test(newPassword)) {
    return { success: false, message: 'Password must include an uppercase letter.' };
  }
  if (!/[a-z]/.test(newPassword)) {
    return { success: false, message: 'Password must include a lowercase letter.' };
  }
  if (!/[0-9]/.test(newPassword)) {
    return { success: false, message: 'Password must include a number.' };
  }

  // Mark token as consumed/used
  try {
    const raw = sessionStorage.getItem('windrive_latest_reset_token') || localStorage.getItem('windrive_latest_reset_token');
    if (raw) {
      const parsed = JSON.parse(raw);
      parsed.used = true;
      parsed.usedAt = Date.now();
      sessionStorage.setItem('windrive_latest_reset_token', JSON.stringify(parsed));
      localStorage.setItem('windrive_latest_reset_token', JSON.stringify(parsed));
    }
  } catch (e) {}

  // Terminate any active sessions and apply security governance
  handleResetSuccess();

  return {
    success: true,
    message: 'Password has been updated successfully.',
  };
}

export function handleResetSuccess() {
  try {
    // Terminate existing sessions under POPIA Section 18 governance
    sessionStorage.removeItem(CURRENT_USER_KEY);
    localStorage.removeItem(CURRENT_USER_KEY);
    sessionStorage.setItem('windrive_logged_out', 'true');
    // Store update timestamp without storing the actual password
    localStorage.setItem('windrive_password_last_changed', new Date().toISOString());
  } catch (e) {}
}

