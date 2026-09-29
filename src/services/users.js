import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import { sanitizeDbError } from './errorHandler.js';
import { recordAuditLog } from './auditLogs.js';

/**
 * Centralized User & Profile Database Service
 * Connects to the Supabase `profiles` table under strict Row Level Security.
 * Enforces admin authorization, status workflows, and audit logging.
 */

export const ACCOUNT_STATUSES = {
  PENDING_REVIEW: 'PENDING_REVIEW',
  APPROVED: 'APPROVED',
  ACTIVE: 'ACTIVE',
  REJECTED: 'REJECTED',
  DEACTIVATED: 'DEACTIVATED',
};

/**
 * Format date for table display (e.g. 18 Jan 2026)
 */
export function formatDateDisplay(dateInput) {
  if (!dateInput) return '—';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);
  const day = d.getDate().toString().padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Format a raw database profile row and optional reward into an application-standard user object.
 * Provides both standard database properties and view-friendly aliases.
 */
export function formatUserProfile(profile, reward = null) {
  if (!profile) return null;

  // Normalize status for UI badges
  const rawStatus = (profile.account_status || 'PENDING_REVIEW').replace(' ', '_').toUpperCase();
  let uiStatus = 'PENDING REVIEW';
  if (rawStatus === 'ACTIVE') uiStatus = 'ACTIVE';
  else if (rawStatus === 'APPROVED') uiStatus = 'APPROVED';
  else if (rawStatus === 'REJECTED') uiStatus = 'REJECTED';
  else if (rawStatus === 'DEACTIVATED') uiStatus = 'DEACTIVATED';
  else if (rawStatus === 'PENDING_REVIEW') uiStatus = 'PENDING REVIEW';

  // Reward extraction
  const hasReward = reward && reward.reward_status && reward.reward_status !== 'NOT_ASSIGNED';
  const rewardStatus = hasReward ? reward.reward_status : 'NOT ASSIGNED';
  const cashPrize = reward?.cash_amount ? `R${Number(reward.cash_amount).toLocaleString('en-ZA')} ${reward.cash_currency || 'ZAR'}` : null;
  const vehiclePrize = reward?.vehicle_make && reward?.vehicle_model
    ? `${reward.vehicle_year || 2026} ${reward.vehicle_make} ${reward.vehicle_model}`
    : null;

  return {
    id: profile.id,
    name: profile.full_name || 'Participant',
    fullName: profile.full_name || 'Participant',
    email: profile.email || '',
    phone: profile.mobile_number || 'N/A',
    mobile: profile.mobile_number || 'N/A',
    mobile_number: profile.mobile_number || '',
    full_name: profile.full_name || '',
    role: profile.role || 'USER',
    status: uiStatus,
    account_status: rawStatus,
    rewardStatus,
    cashPrize,
    vehiclePrize,
    vehicleImage: reward?.vehicle_image || null,
    claimCash: 'None',
    claimVehicle: 'None',
    claimActivity: 'NO CLAIM',
    createdDate: formatDateDisplay(profile.created_at),
    createdAt: profile.created_at || new Date().toISOString(),
    updatedAt: profile.updated_at || profile.created_at || new Date().toISOString(),
    reward: reward || null,
  };
}

/**
 * Retrieve current authenticated user's profile
 */
export async function getCurrentProfile(explicitUserId = null) {
  if (!isSupabaseConfigured() || !supabase) {
    return { data: null, error: { message: 'Supabase service unavailable.' } };
  }
  try {
    let userId = explicitUserId;
    if (!userId) {
      const { data: authData } = await supabase.auth.getUser();
      userId = authData?.user?.id;
    }
    if (!userId) {
      return { data: null, error: { message: 'No active authenticated session.' } };
    }
    return await getProfileById(userId);
  } catch (err) {
    return { data: null, error: sanitizeDbError(err, 'Failed to load current user profile.') };
  }
}

/**
 * Retrieve a specific profile by UUID (including associated reward if present)
 */
export async function getProfileById(userId) {
  if (!isSupabaseConfigured() || !supabase || !userId) {
    return { data: null, error: { message: 'User ID is required.' } };
  }
  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) {
      return { data: null, error: sanitizeDbError(profileError, 'Failed to retrieve profile.') };
    }
    if (!profile) {
      return { data: null, error: { message: 'Profile record not found.' } };
    }

    // Attempt to load associated reward
    let reward = null;
    try {
      const { data: rewardData } = await supabase
        .from('rewards')
        .select('*')
        .eq('profile_id', userId)
        .maybeSingle();
      reward = rewardData;
    } catch (_) {
      // Rewards table access might be restricted or empty
    }

    const formatted = formatUserProfile(profile, reward);
    return { data: formatted, rawProfile: profile, error: null };
  } catch (err) {
    return { data: null, error: sanitizeDbError(err, 'An error occurred while loading profile.') };
  }
}

export const getProfile = getProfileById;

/**
 * List all users with filtering, search, sorting, and pagination
 */
export async function listUsers({
  status = 'ALL',
  search = '',
  limit = 100,
  offset = 0,
  sortBy = 'created_at',
  sortOrder = 'desc',
} = {}) {
  if (!isSupabaseConfigured() || !supabase) {
    return { data: [], count: 0, error: { message: 'Database service unavailable.' } };
  }
  try {
    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1);

    if (status && status !== 'ALL') {
      const normalizedStatus = status.replace(' ', '_').toUpperCase();
      query = query.eq('account_status', normalizedStatus);
    }

    if (search && search.trim()) {
      const term = search.trim();
      query = query.or(`full_name.ilike.%${term}%,email.ilike.%${term}%,mobile_number.ilike.%${term}%`);
    }

    const { data: profiles, error, count } = await query;

    if (error) {
      return { data: [], count: 0, error: sanitizeDbError(error, 'Failed to retrieve user directory.') };
    }

    if (!profiles || profiles.length === 0) {
      return { data: [], count: count || 0, error: null };
    }

    // Fetch associated rewards for listed users
    const userIds = profiles.map((p) => p.id);
    let rewardsMap = {};
    try {
      const { data: rewards } = await supabase
        .from('rewards')
        .select('*')
        .in('profile_id', userIds);
      if (rewards) {
        rewards.forEach((r) => {
          rewardsMap[r.profile_id] = r;
        });
      }
    } catch (_) {
      // Gracefully continue without rewards
    }

    const formattedList = profiles.map((p) => formatUserProfile(p, rewardsMap[p.id] || null));
    return { data: formattedList, count: count || formattedList.length, error: null };
  } catch (err) {
    return { data: [], count: 0, error: sanitizeDbError(err, 'Error retrieving users.') };
  }
}

/**
 * Search users by query string
 */
export async function searchUsers(query) {
  return await listUsers({ search: query });
}

/**
 * Filter users by specific filters
 */
export async function filterUsers(filters = {}) {
  return await listUsers(filters);
}

/**
 * Admin: Approve User Account
 * Transitions status to APPROVED and logs audit trail
 */
export async function approveUser(userId, adminId = null) {
  if (!isSupabaseConfigured() || !supabase || !userId) {
    return { success: false, error: 'Database service unavailable or user ID missing.' };
  }
  try {
    // Get existing profile to inspect before_changes
    const { data: current } = await supabase.from('profiles').select('*').eq('id', userId).single();
    const oldStatus = current?.account_status || 'PENDING_REVIEW';

    const { data, error } = await supabase
      .from('profiles')
      .update({ account_status: 'APPROVED', updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return { success: false, error: sanitizeDbError(error, 'Failed to approve user.').message };
    }

    // Record Audit Log
    await recordAuditLog({
      adminProfileId: adminId,
      action: 'USER_APPROVED',
      entityType: 'profile',
      entityId: userId,
      description: `Account for ${data.full_name || userId} (${data.email || 'no email'}) was approved by administrator.`,
      beforeChanges: { account_status: oldStatus },
      afterChanges: { account_status: 'APPROVED' },
    });

    return { success: true, user: formatUserProfile(data), error: null };
  } catch (err) {
    return { success: false, error: sanitizeDbError(err, 'User approval failed.').message };
  }
}

/**
 * Admin: Reject User Account
 * Transitions status to REJECTED and logs audit trail
 */
export async function rejectUser(userId, adminId = null) {
  if (!isSupabaseConfigured() || !supabase || !userId) {
    return { success: false, error: 'Database service unavailable or user ID missing.' };
  }
  try {
    const { data: current } = await supabase.from('profiles').select('*').eq('id', userId).single();
    const oldStatus = current?.account_status || 'PENDING_REVIEW';

    const { data, error } = await supabase
      .from('profiles')
      .update({ account_status: 'REJECTED', updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return { success: false, error: sanitizeDbError(error, 'Failed to reject user.').message };
    }

    await recordAuditLog({
      adminProfileId: adminId,
      action: 'USER_REJECTED',
      entityType: 'profile',
      entityId: userId,
      description: `Account for ${data.full_name || userId} was marked as rejected by administrator.`,
      beforeChanges: { account_status: oldStatus },
      afterChanges: { account_status: 'REJECTED' },
    });

    return { success: true, user: formatUserProfile(data), error: null };
  } catch (err) {
    return { success: false, error: sanitizeDbError(err, 'User rejection failed.').message };
  }
}

/**
 * Admin: Activate User Account
 * Transitions status to ACTIVE and logs audit trail
 */
export async function activateUser(userId, adminId = null) {
  if (!isSupabaseConfigured() || !supabase || !userId) {
    return { success: false, error: 'Database service unavailable or user ID missing.' };
  }
  try {
    const { data: current } = await supabase.from('profiles').select('*').eq('id', userId).single();
    const oldStatus = current?.account_status || 'APPROVED';

    const { data, error } = await supabase
      .from('profiles')
      .update({ account_status: 'ACTIVE', updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return { success: false, error: sanitizeDbError(error, 'Failed to activate user.').message };
    }

    await recordAuditLog({
      adminProfileId: adminId,
      action: 'USER_ACTIVATED',
      entityType: 'profile',
      entityId: userId,
      description: `Account for ${data.full_name || userId} was activated for full participation.`,
      beforeChanges: { account_status: oldStatus },
      afterChanges: { account_status: 'ACTIVE' },
    });

    return { success: true, user: formatUserProfile(data), error: null };
  } catch (err) {
    return { success: false, error: sanitizeDbError(err, 'User activation failed.').message };
  }
}

/**
 * Admin: Deactivate User Account
 * Transitions status to DEACTIVATED and logs audit trail
 */
export async function deactivateUser(userId, adminId = null) {
  if (!isSupabaseConfigured() || !supabase || !userId) {
    return { success: false, error: 'Database service unavailable or user ID missing.' };
  }
  try {
    const { data: current } = await supabase.from('profiles').select('*').eq('id', userId).single();
    const oldStatus = current?.account_status || 'ACTIVE';

    const { data, error } = await supabase
      .from('profiles')
      .update({ account_status: 'DEACTIVATED', updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return { success: false, error: sanitizeDbError(error, 'Failed to deactivate user.').message };
    }

    await recordAuditLog({
      adminProfileId: adminId,
      action: 'USER_DEACTIVATED',
      entityType: 'profile',
      entityId: userId,
      description: `Account for ${data.full_name || userId} was deactivated.`,
      beforeChanges: { account_status: oldStatus },
      afterChanges: { account_status: 'DEACTIVATED' },
    });

    return { success: true, user: formatUserProfile(data), error: null };
  } catch (err) {
    return { success: false, error: sanitizeDbError(err, 'User deactivation failed.').message };
  }
}

/**
 * Update user profile details (full name and mobile number).
 * Strictly prevents role tampering via standard profile editing.
 */
export async function updateUserProfile(userId, { fullName, name, mobileNumber, phone, mobile }, adminId = null) {
  if (!isSupabaseConfigured() || !supabase || !userId) {
    return { success: false, error: 'Database service unavailable.' };
  }
  try {
    const cleanName = (fullName || name || '').trim();
    const cleanMobile = (mobileNumber || phone || mobile || '').trim();

    const updates = { updated_at: new Date().toISOString() };
    if (cleanName) updates.full_name = cleanName;
    if (cleanMobile) updates.mobile_number = cleanMobile;

    const { data: current } = await supabase.from('profiles').select('*').eq('id', userId).single();

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return { success: false, error: sanitizeDbError(error, 'Unable to update profile details.').message };
    }

    await recordAuditLog({
      adminProfileId: adminId,
      action: 'USER_PROFILE_UPDATED',
      entityType: 'profile',
      entityId: userId,
      description: `Profile information updated for user ${data.full_name || userId}.`,
      beforeChanges: { full_name: current?.full_name, mobile_number: current?.mobile_number },
      afterChanges: { full_name: data.full_name, mobile_number: data.mobile_number },
    });

    return { success: true, user: formatUserProfile(data), error: null };
  } catch (err) {
    return { success: false, error: sanitizeDbError(err, 'Failed to update profile.').message };
  }
}

/**
 * Legacy & UI bridge: updateUserAccountStatus
 */
export async function updateUserAccountStatus(userId, targetStatus, adminId = null) {
  const norm = (targetStatus || '').replace(' ', '_').toUpperCase();
  if (norm === 'APPROVED') return await approveUser(userId, adminId);
  if (norm === 'REJECTED') return await rejectUser(userId, adminId);
  if (norm === 'ACTIVE') return await activateUser(userId, adminId);
  if (norm === 'DEACTIVATED') return await deactivateUser(userId, adminId);
  return { success: false, error: `Invalid account status: ${targetStatus}` };
}

/**
 * Calculate user count summary metrics directly from user data
 */
export function getUserMetrics(userList = []) {
  const users = Array.isArray(userList) ? userList : [];
  const total = users.length;
  const pendingReview = users.filter(
    (u) => (u.status === 'PENDING REVIEW' || u.account_status === 'PENDING_REVIEW')
  ).length;
  const approved = users.filter(
    (u) => (u.status === 'APPROVED' || u.account_status === 'APPROVED')
  ).length;
  const active = users.filter(
    (u) => (u.status === 'ACTIVE' || u.account_status === 'ACTIVE')
  ).length;
  const approvedOrActive = approved + active;
  const rejected = users.filter(
    (u) => (u.status === 'REJECTED' || u.account_status === 'REJECTED')
  ).length;
  const deactivated = users.filter(
    (u) => (u.status === 'DEACTIVATED' || u.status === 'INACTIVE' || u.account_status === 'DEACTIVATED')
  ).length;
  const rejectedOrDeactivated = rejected + deactivated;

  return {
    total,
    pendingReview,
    approved,
    active,
    approvedOrActive,
    rejected,
    deactivated,
    rejectedOrDeactivated,
  };
}

export const getUserById = getProfileById;
export const getAllUsers = listUsers;

// Aliases for compatibility with existing imports
export const adminGetUsers = listUsers;
export const adminUpdateUserStatus = updateUserAccountStatus;
export const updateProfile = updateUserProfile;

/**
 * Admin: Assign User Role ('USER' | 'ADMIN')
 * Strictly enforces that only an existing administrator can assign roles.
 * Prevents non-admins from changing roles via Row Level Security & trigger constraints.
 * Automatically logs audit trail.
 */
export async function adminAssignUserRole(targetUserId, targetRole, adminId = null) {
  if (!isSupabaseConfigured() || !supabase || !targetUserId) {
    return { success: false, error: 'Database service unavailable.' };
  }

  const role = (targetRole || '').trim().toUpperCase();
  if (!['USER', 'ADMIN'].includes(role)) {
    return { success: false, error: 'Invalid role specified. Role must be USER or ADMIN.' };
  }

  try {
    const { data: current, error: fetchErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', targetUserId)
      .single();

    if (fetchErr || !current) {
      return { success: false, error: 'Target user profile not found.' };
    }

    if (current.role === role) {
      return { success: true, user: formatUserProfile(current), message: `User is already ${role}.` };
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', targetUserId)
      .select()
      .single();

    if (error) {
      return { success: false, error: sanitizeDbError(error, 'Failed to update user role. Administrative authorization required.').message };
    }

    await recordAuditLog({
      adminProfileId: adminId,
      action: role === 'ADMIN' ? 'ADMIN_ROLE_PROMOTED' : 'ADMIN_ROLE_REVOKED',
      entityType: 'profile',
      entityId: targetUserId,
      description: `User ${data.full_name || targetUserId} role changed from ${current.role} to ${role}.`,
      beforeChanges: { role: current.role },
      afterChanges: { role: data.role },
    });

    return { success: true, user: formatUserProfile(data), error: null };
  } catch (err) {
    return { success: false, error: sanitizeDbError(err, 'Failed to update user role.').message };
  }
}
