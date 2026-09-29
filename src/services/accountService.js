// WinDriveSA Account and Profile Service
import { getCurrentUser, getStoredUsers } from './mockAuth';

const USERS_STORAGE_KEY = 'windrive_registered_users';
const CURRENT_USER_KEY = 'windrive_current_user';
const PENDING_EMAIL_PREFIX = 'windrive_pending_email_';

/**
 * Get account profile for current user
 */
export function getUserProfile(fallbackToDefault = false) {
  if (import.meta.env.PROD) return null;
  const user = getCurrentUser(fallbackToDefault);
  if (!user) return null;

  // Retrieve any pending email change for this user
  const pendingEmail = getPendingEmailChange(user.id);

  // Retrieve stored user record to get creation date and latest values
  const storedUsers = getStoredUsers();
  const fullRecord = storedUsers.find((u) => u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase()) || {};

  return {
    id: user.id,
    fullName: user.fullName || fullRecord.fullName || 'Nkosana Mthembu',
    memberId: user.memberId || fullRecord.memberId || 'WD-88349-ZA',
    email: user.email || fullRecord.email || 'member.access@windrivesa.co.za',
    mobile: user.mobile || fullRecord.mobile || '+27821234567',
    role: user.role || fullRecord.role || 'user',
    status: user.status || fullRecord.status || 'ACTIVE',
    createdAt: fullRecord.createdAt || user.createdAt || '2025-01-10T08:30:00.000Z',
    lastPasswordChange: fullRecord.lastPasswordChange || '14 January 2026',
    pendingEmail,
  };
}

/**
 * Update user's profile information (Full Name and Mobile Number)
 */
export function updateUserProfile(userId, { fullName, mobile }) {
  try {
    const users = getStoredUsers();
    const userIndex = users.findIndex((u) => u.id === userId);

    const updatedUser = {
      fullName: fullName.trim(),
      mobile: mobile.trim(),
      updatedAt: new Date().toISOString(),
    };

    if (userIndex >= 0) {
      users[userIndex] = {
        ...users[userIndex],
        ...updatedUser,
      };
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    }

    // Update active session user as well
    const sessionRaw = sessionStorage.getItem(CURRENT_USER_KEY) || localStorage.getItem(CURRENT_USER_KEY);
    if (sessionRaw) {
      const sessionUser = JSON.parse(sessionRaw);
      if (sessionUser.id === userId) {
        const newSession = { ...sessionUser, ...updatedUser };
        sessionStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newSession));
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newSession));
      }
    }

    return { success: true, profile: { ...users[userIndex] } };
  } catch (err) {
    console.error('Error updating user profile:', err);
    return { success: false, error: 'Failed to update profile information.' };
  }
}

/**
 * Request an email change - initiates verification flow
 */
export function requestEmailChange(userId, newEmail) {
  try {
    const normalized = newEmail.trim().toLowerCase();
    const payload = {
      newEmail: normalized,
      requestedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };
    localStorage.setItem(`${PENDING_EMAIL_PREFIX}${userId}`, JSON.stringify(payload));
    return { success: true, pendingEmail: normalized };
  } catch (err) {
    console.error('Error requesting email change:', err);
    return { success: false, error: 'Could not submit email change request.' };
  }
}

/**
 * Get pending email change record
 */
export function getPendingEmailChange(userId) {
  try {
    const raw = localStorage.getItem(`${PENDING_EMAIL_PREFIX}${userId}`);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return data.newEmail || null;
  } catch (e) {
    return null;
  }
}

/**
 * Cancel pending email change
 */
export function cancelEmailChange(userId) {
  try {
    localStorage.removeItem(`${PENDING_EMAIL_PREFIX}${userId}`);
    return { success: true };
  } catch (err) {
    return { success: false };
  }
}

/**
 * Resend email verification link
 */
export function resendVerificationEmail(userId) {
  const pending = getPendingEmailChange(userId);
  if (!pending) {
    return { success: false, error: 'No pending email change to verify.' };
  }
  return {
    success: true,
    message: `A verification link has been sent to ${pending}.`,
  };
}

/**
 * Change password
 */
export function changeUserPassword(userId, { currentPassword, newPassword }) {
  try {
    const users = getStoredUsers();
    const user = users.find((u) => u.id === userId);

    // If user exists, check current password (or default fallback)
    const expectedPw = user?.password || 'SecurePass@2025!';
    if (currentPassword !== expectedPw) {
      return {
        success: false,
        error: 'The current password you entered is incorrect.',
      };
    }

    // Validate new password rules
    const hasLen = newPassword.length >= 8;
    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasNum = /[0-9]/.test(newPassword);

    if (!hasLen || !hasUpper || !hasLower || !hasNum) {
      return {
        success: false,
        error: 'New password does not meet the security criteria.',
      };
    }

    // Update in stored users
    if (user) {
      user.password = newPassword;
      user.lastPasswordChange = new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    }

    return {
      success: true,
      message: 'Your password has been changed successfully.',
    };
  } catch (err) {
    console.error('Error changing password:', err);
    return { success: false, error: 'Failed to update password.' };
  }
}
