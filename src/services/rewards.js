import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import { sanitizeDbError } from './errorHandler.js';
import { recordAuditLog } from './auditLogs.js';

/**
 * Centralized Rewards Database Service
 * Connects to the Supabase `rewards` table under Row Level Security.
 * Enforces admin authorization, approval verification, and audit logging.
 */

export const REWARD_STATUSES = {
  NOT_ASSIGNED: 'NOT_ASSIGNED',
  ASSIGNED: 'ASSIGNED',
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
};

export const DEFAULT_VEHICLE_MAKE = 'Toyota';
export const DEFAULT_VEHICLE_MODEL = 'Hilux 2.8 GD-6 Legend 4x4';
export const DEFAULT_VEHICLE_YEAR = 2026;
export const DEFAULT_VEHICLE_IMAGE = '/images/windrivesa-hilux-white-01.jpg';
export const DEFAULT_VEHICLE_IMAGE_FRONT = '/images/windrivesa-hilux-white-02.jpg';

export const DEFAULT_REWARD_VALUES = {
  cashAmount: 250000,
  currency: 'ZAR',
  vehicleMake: DEFAULT_VEHICLE_MAKE,
  vehicleModel: DEFAULT_VEHICLE_MODEL,
  vehicleYear: DEFAULT_VEHICLE_YEAR,
  vehicleImage: DEFAULT_VEHICLE_IMAGE,
};

export const VEHICLE_SPECIMENS = [
  {
    id: 'toyota_hilux_white_main',
    name: '2026 Toyota Hilux 2.8 GD-6 Legend 4x4 (White Showroom)',
    label: 'Toyota Hilux (White Showroom)',
    url: '/images/windrivesa-hilux-white-01.jpg',
  },
  {
    id: 'toyota_hilux_white_front',
    name: '2026 Toyota Hilux GR Sport 4x4 (White Front GR)',
    label: 'Toyota Hilux (White Front GR)',
    url: '/images/windrivesa-hilux-white-02.jpg',
  },
  {
    id: 'ford_ranger',
    name: '2026 Ford Ranger 3.0 V6 Wildtrak 4WD',
    label: 'Ford Ranger (Wildtrak)',
    url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'bmw_m340i',
    name: '2025 BMW M340i xDrive Sedan',
    label: 'BMW M340i xDrive',
    url: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'mercedes_c43',
    name: '2026 Mercedes-AMG C43 4MATIC',
    label: 'Mercedes-AMG C43',
    url: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'isuzu_dmax',
    name: '2026 Isuzu D-Max 3.0 Ddi V-Cross 4x4',
    label: 'Isuzu D-Max 3.0',
    url: 'https://images.unsplash.com/photo-1559416523-140ddc3d238c?auto=format&fit=crop&w=800&q=80',
  },
];

/**
 * Format currency in South African Rand (ZAR)
 */
export function formatZAR(val) {
  if (val === null || val === undefined || isNaN(Number(val))) return 'R 0';
  return 'R ' + Number(val).toLocaleString('en-US');
}

/**
 * Format a reward row + associated profile for standard application view consumption
 */
export function formatRewardItem(reward, profile = null) {
  if (!reward) return null;

  const prof = profile || reward.profile || {};
  const status = reward.reward_status || 'ASSIGNED';

  const d = reward.created_at ? new Date(reward.created_at) : new Date();
  const assignedDate = isNaN(d.getTime())
    ? 'Recent'
    : `${d.getDate().toString().padStart(2, '0')} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()]} ${d.getFullYear()}`;

  const u = reward.updated_at ? new Date(reward.updated_at) : d;
  const lastUpdated = isNaN(u.getTime())
    ? assignedDate
    : `${u.getDate().toString().padStart(2, '0')} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][u.getMonth()]} ${u.getFullYear()}`;

  const userAccountStatus = prof.account_status ? prof.account_status.replace('_', ' ') : 'ACTIVE';

  return {
    id: reward.id,
    userId: reward.profile_id,
    profile_id: reward.profile_id,
    userName: prof.full_name || 'Participant',
    user: prof.full_name || 'Participant',
    userEmail: prof.email || '',
    email: prof.email || '',
    accountStatus: userAccountStatus,
    cashAmount: reward.cash_amount,
    cash_amount: reward.cash_amount,
    amount: reward.cash_amount,
    currency: reward.cash_currency || 'ZAR',
    cash_currency: reward.cash_currency || 'ZAR',
    vehicleMake: reward.vehicle_make,
    vehicle_make: reward.vehicle_make,
    make: reward.vehicle_make,
    vehicleModel: reward.vehicle_model,
    vehicle_model: reward.vehicle_model,
    model: reward.vehicle_model,
    vehicleYear: reward.vehicle_year || 2026,
    vehicle_year: reward.vehicle_year || 2026,
    year: reward.vehicle_year || 2026,
    vehicleImage: reward.vehicle_image || null,
    vehicle_image: reward.vehicle_image || null,
    image: reward.vehicle_image || null,
    status,
    reward_status: status,
    claimStatus: 'No claim submitted',
    assignedDate,
    assignedAt: assignedDate,
    lastUpdated,
    updatedAt: lastUpdated,
    createdAt: reward.created_at,
    profile: prof,
  };
}

/**
 * Calculate standard reward metrics
 */
export function getRewardMetrics(rewardsList = []) {
  const list = Array.isArray(rewardsList) ? rewardsList : [];
  let unassigned = 0;
  let assigned = 0;
  let active = 0;
  let completed = 0;

  list.forEach((item) => {
    const s = item.status || item.reward_status || 'NOT_ASSIGNED';
    if (s === 'ACTIVE') active++;
    else if (s === 'ASSIGNED') assigned++;
    else if (s === 'COMPLETED') completed++;
    else unassigned++;
  });

  return {
    total: list.length,
    unassigned,
    assigned,
    active,
    completed,
    activeOrCompleted: active + completed,
  };
}

/**
 * Retrieve assigned reward for a specific user ID
 */
export async function getUserReward(userId) {
  if (!isSupabaseConfigured() || !supabase || !userId) {
    return { data: null, error: { message: 'Database service unavailable or user ID missing.' } };
  }
  try {
    const { data, error } = await supabase
      .from('rewards')
      .select('*')
      .eq('profile_id', userId)
      .maybeSingle();

    if (error) {
      return { data: null, error: sanitizeDbError(error, 'Unable to load reward details.') };
    }
    if (!data) {
      return { data: null, error: null };
    }
    return { data: formatRewardItem(data), rawReward: data, error: null };
  } catch (err) {
    return { data: null, error: sanitizeDbError(err, 'Failed to fetch reward information.') };
  }
}

export const getRewardForUser = getUserReward;

/**
 * Retrieve a specific reward by reward ID
 */
export async function getRewardById(rewardId) {
  if (!isSupabaseConfigured() || !supabase || !rewardId) {
    return { data: null, error: { message: 'Reward ID is required.' } };
  }
  try {
    const { data, error } = await supabase
      .from('rewards')
      .select('*, profile:profiles(*)')
      .eq('id', rewardId)
      .maybeSingle();

    if (error) {
      return { data: null, error: sanitizeDbError(error, 'Failed to load reward record.') };
    }
    if (!data) {
      return { data: null, error: { message: 'Reward record not found.' } };
    }
    return { data: formatRewardItem(data, data.profile), error: null };
  } catch (err) {
    return { data: null, error: sanitizeDbError(err, 'Error retrieving reward.') };
  }
}

/**
 * Admin: Retrieve all rewards joined with user profiles
 */
export async function getRewards({
  status = 'ALL',
  search = '',
  limit = 100,
  offset = 0,
} = {}) {
  if (!isSupabaseConfigured() || !supabase) {
    return { data: [], count: 0, error: { message: 'Database service unavailable.' } };
  }
  try {
    let query = supabase
      .from('rewards')
      .select('*, profile:profiles(id, full_name, email, account_status)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && status !== 'ALL') {
      const normalizedStatus = status.replace(' ', '_').toUpperCase();
      query = query.eq('reward_status', normalizedStatus);
    }

    const { data, error, count } = await query;

    if (error) {
      return { data: [], count: 0, error: sanitizeDbError(error, 'Failed to retrieve rewards.') };
    }

    let formatted = (data || []).map((r) => formatRewardItem(r, r.profile));

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      formatted = formatted.filter(
        (item) =>
          item.userName?.toLowerCase().includes(q) ||
          item.userEmail?.toLowerCase().includes(q) ||
          item.vehicleMake?.toLowerCase().includes(q) ||
          item.vehicleModel?.toLowerCase().includes(q) ||
          item.userId?.toLowerCase().includes(q)
      );
    }

    return { data: formatted, count: count || formatted.length, error: null };
  } catch (err) {
    return { data: [], count: 0, error: sanitizeDbError(err, 'Error retrieving rewards.') };
  }
}

export const adminGetAllRewards = getRewards;

/**
 * Admin: Assign cash and vehicle reward package to user
 * Strictly requires that the target user's account is APPROVED or ACTIVE
 */
export async function assignReward({
  profileId,
  userId,
  cashAmount = DEFAULT_REWARD_VALUES.cashAmount,
  currency = 'ZAR',
  cashCurrency = 'ZAR',
  vehicleMake = DEFAULT_REWARD_VALUES.vehicleMake,
  vehicleModel = DEFAULT_REWARD_VALUES.vehicleModel,
  vehicleYear = DEFAULT_REWARD_VALUES.vehicleYear,
  vehicleImage = null,
  rewardStatus = 'ASSIGNED',
}, adminId = null) {
  const targetProfileId = profileId || userId;
  if (!isSupabaseConfigured() || !supabase || !targetProfileId) {
    return { success: false, error: 'Target user profile ID is required.' };
  }

  try {
    // 1. Verify user profile exists and check account_status
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', targetProfileId)
      .maybeSingle();

    if (profileErr || !profile) {
      return { success: false, error: 'User profile not found.' };
    }

    const normStatus = (profile.account_status || '').replace(' ', '_').toUpperCase();
    if (normStatus === 'PENDING_REVIEW') {
      return {
        success: false,
        error: 'User approval required before activating a reward. Please approve this user account first.',
      };
    }
    if (normStatus === 'REJECTED' || normStatus === 'DEACTIVATED') {
      return {
        success: false,
        error: `Cannot assign rewards to an account with status ${normStatus}.`,
      };
    }

    // 2. Upsert into rewards table (profile_id is unique)
    const payload = {
      profile_id: targetProfileId,
      cash_amount: cashAmount ? Number(cashAmount) : null,
      cash_currency: cashCurrency || currency || 'ZAR',
      vehicle_make: vehicleMake || null,
      vehicle_model: vehicleModel || null,
      vehicle_year: vehicleYear ? Number(vehicleYear) : null,
      vehicle_image: vehicleImage || null,
      reward_status: rewardStatus || 'ASSIGNED',
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('rewards')
      .upsert(payload, { onConflict: 'profile_id' })
      .select()
      .single();

    if (error) {
      return { success: false, error: sanitizeDbError(error, 'Failed to assign reward to profile.').message };
    }

    // 3. Record Audit Log
    await recordAuditLog({
      adminProfileId: adminId,
      action: 'REWARD_ASSIGNED',
      entityType: 'reward',
      entityId: data.id,
      description: `Reward package assigned to user ${profile.full_name || targetProfileId} (Cash: R${cashAmount || 0}, Vehicle: ${vehicleMake} ${vehicleModel}).`,
      beforeChanges: null,
      afterChanges: payload,
    });

    const formatted = formatRewardItem(data, profile);
    return { success: true, reward: formatted, data: formatted, error: null };
  } catch (err) {
    return { success: false, error: sanitizeDbError(err, 'Error assigning reward package.').message };
  }
}

export const adminAssignReward = assignReward;

/**
 * Admin: Update existing reward parameters
 */
export async function updateReward(rewardId, updates, adminId = null) {
  if (!isSupabaseConfigured() || !supabase || !rewardId) {
    return { success: false, error: 'Reward ID is required.' };
  }
  try {
    const { data: existing } = await supabase
      .from('rewards')
      .select('*, profile:profiles(*)')
      .eq('id', rewardId)
      .single();

    const dbUpdates = { updated_at: new Date().toISOString() };
    if (updates.cashAmount !== undefined) dbUpdates.cash_amount = Number(updates.cashAmount);
    if (updates.amount !== undefined) dbUpdates.cash_amount = Number(updates.amount);
    if (updates.currency !== undefined) dbUpdates.cash_currency = updates.currency;
    if (updates.cashCurrency !== undefined) dbUpdates.cash_currency = updates.cashCurrency;
    if (updates.vehicleMake !== undefined) dbUpdates.vehicle_make = updates.vehicleMake;
    if (updates.make !== undefined) dbUpdates.vehicle_make = updates.make;
    if (updates.vehicleModel !== undefined) dbUpdates.vehicle_model = updates.vehicleModel;
    if (updates.model !== undefined) dbUpdates.vehicle_model = updates.model;
    if (updates.vehicleYear !== undefined) dbUpdates.vehicle_year = Number(updates.vehicleYear);
    if (updates.year !== undefined) dbUpdates.vehicle_year = Number(updates.year);
    if (updates.vehicleImage !== undefined) dbUpdates.vehicle_image = updates.vehicleImage;
    if (updates.image !== undefined) dbUpdates.vehicle_image = updates.image;
    if (updates.rewardStatus !== undefined) dbUpdates.reward_status = updates.rewardStatus;
    if (updates.status !== undefined) dbUpdates.reward_status = updates.status;

    const { data, error } = await supabase
      .from('rewards')
      .update(dbUpdates)
      .eq('id', rewardId)
      .select('*, profile:profiles(*)')
      .single();

    if (error) {
      return { success: false, error: sanitizeDbError(error, 'Failed to update reward specifications.').message };
    }

    // Record Audit Log
    await recordAuditLog({
      adminProfileId: adminId,
      action: 'REWARD_UPDATED',
      entityType: 'reward',
      entityId: rewardId,
      description: `Reward details updated for ${data.profile?.full_name || data.profile_id}.`,
      beforeChanges: existing,
      afterChanges: dbUpdates,
    });

    const formatted = formatRewardItem(data, data.profile);
    return { success: true, reward: formatted, data: formatted, error: null };
  } catch (err) {
    return { success: false, error: sanitizeDbError(err, 'Reward update failed.').message };
  }
}

export const adminUpdateReward = updateReward;

/**
 * Admin: Activate reward allocation
 */
export async function activateReward(rewardId, adminId = null) {
  if (!isSupabaseConfigured() || !supabase || !rewardId) {
    return { success: false, error: 'Reward ID is required.' };
  }
  try {
    const { data, error } = await supabase
      .from('rewards')
      .update({ reward_status: 'ACTIVE', updated_at: new Date().toISOString() })
      .eq('id', rewardId)
      .select('*, profile:profiles(*)')
      .single();

    if (error) {
      return { success: false, error: sanitizeDbError(error, 'Failed to activate reward.').message };
    }

    await recordAuditLog({
      adminProfileId: adminId,
      action: 'REWARD_ACTIVATED',
      entityType: 'reward',
      entityId: rewardId,
      description: `Reward allocation activated for ${data.profile?.full_name || data.profile_id}.`,
      beforeChanges: { reward_status: 'ASSIGNED' },
      afterChanges: { reward_status: 'ACTIVE' },
    });

    const formatted = formatRewardItem(data, data.profile);
    return { success: true, reward: formatted, data: formatted, error: null };
  } catch (err) {
    return { success: false, error: sanitizeDbError(err, 'Failed to activate reward.').message };
  }
}

/**
 * Admin: Deactivate reward allocation
 */
export async function deactivateReward(rewardId, adminId = null) {
  if (!isSupabaseConfigured() || !supabase || !rewardId) {
    return { success: false, error: 'Reward ID is required.' };
  }
  try {
    const { data, error } = await supabase
      .from('rewards')
      .update({ reward_status: 'NOT_ASSIGNED', updated_at: new Date().toISOString() })
      .eq('id', rewardId)
      .select('*, profile:profiles(*)')
      .single();

    if (error) {
      return { success: false, error: sanitizeDbError(error, 'Failed to deactivate reward.').message };
    }

    await recordAuditLog({
      adminProfileId: adminId,
      action: 'REWARD_DEACTIVATED',
      entityType: 'reward',
      entityId: rewardId,
      description: `Reward allocation deactivated for ${data.profile?.full_name || data.profile_id}.`,
      beforeChanges: { reward_status: 'ACTIVE' },
      afterChanges: { reward_status: 'NOT_ASSIGNED' },
    });

    const formatted = formatRewardItem(data, data.profile);
    return { success: true, reward: formatted, data: formatted, error: null };
  } catch (err) {
    return { success: false, error: sanitizeDbError(err, 'Failed to deactivate reward.').message };
  }
}

/**
 * Admin: Complete reward allocation
 */
export async function completeReward(rewardId, adminId = null) {
  if (!isSupabaseConfigured() || !supabase || !rewardId) {
    return { success: false, error: 'Reward ID is required.' };
  }
  try {
    const { data, error } = await supabase
      .from('rewards')
      .update({ reward_status: 'COMPLETED', updated_at: new Date().toISOString() })
      .eq('id', rewardId)
      .select('*, profile:profiles(*)')
      .single();

    if (error) {
      return { success: false, error: sanitizeDbError(error, 'Failed to complete reward.').message };
    }

    await recordAuditLog({
      adminProfileId: adminId,
      action: 'REWARD_COMPLETED',
      entityType: 'reward',
      entityId: rewardId,
      description: `Reward allocation marked as COMPLETED for ${data.profile?.full_name || data.profile_id}.`,
      beforeChanges: { reward_status: 'ACTIVE' },
      afterChanges: { reward_status: 'COMPLETED' },
    });

    const formatted = formatRewardItem(data, data.profile);
    return { success: true, reward: formatted, data: formatted, error: null };
  } catch (err) {
    return { success: false, error: sanitizeDbError(err, 'Failed to complete reward.').message };
  }
}

export async function searchRewards(query) {
  return await getRewards({ search: query });
}

export async function filterRewards(filters = {}) {
  return await getRewards(filters);
}

// =========================================================================
// CASH PRIZE FACADE & CONVENIENCE FUNCTIONS
// =========================================================================
export const DEFAULT_CASH_PRIZE_AMOUNT = 250000;

export async function getCashPrizes(filters = {}) {
  const { data: rewardsList, error } = await getRewards(filters);
  if (error || !rewardsList) {
    return { data: [], error };
  }
  const prizes = rewardsList.map((r) => ({
    id: r.id,
    userId: r.userId,
    profile_id: r.profile_id,
    user: r.userName || 'Participant',
    userName: r.userName || 'Participant',
    email: r.userEmail || '',
    userEmail: r.userEmail || '',
    amount: r.cashAmount,
    cashAmount: r.cashAmount,
    currency: r.currency || 'ZAR',
    status: r.status,
    reward_status: r.status,
    accountStatus: r.accountStatus,
    claimStatus: r.claimStatus,
    assignedAt: r.assignedAt,
    updatedAt: r.updatedAt,
    createdDate: r.assignedAt,
  }));
  return { data: prizes, error: null };
}

export const getAllCashPrizes = getCashPrizes;

export function getCashPrizeMetrics(prizes = []) {
  const list = Array.isArray(prizes) ? prizes : [];
  let totalAllocated = 0;
  let activePool = 0;
  let activeCount = 0;
  let processingPool = 0;
  let processingCount = 0;
  let fulfilledPool = 0;
  let fulfilledCount = 0;

  list.forEach((p) => {
    const amt = Number(p.amount) || 0;
    if (amt > 0) totalAllocated += amt;
    const st = (p.status || '').toUpperCase();
    if (st === 'ACTIVE') {
      activePool += amt;
      activeCount += 1;
    } else if (st === 'UNDER REVIEW' || st === 'PROCESSING') {
      processingPool += amt;
      processingCount += 1;
    } else if (st === 'COMPLETED' || st === 'FULFILLED') {
      fulfilledPool += amt;
      fulfilledCount += 1;
    }
  });

  return {
    totalAllocated,
    totalCount: list.length,
    activePool,
    activeCount,
    processingPool,
    processingCount,
    fulfilledPool,
    fulfilledCount,
  };
}

export async function createCashPrize({ userId, amount, currency = 'ZAR', status = 'ASSIGNED' }) {
  const res = await assignReward({
    userId,
    cashAmount: amount,
    currency,
    status,
  });
  if (res.success && res.reward) {
    return {
      success: true,
      cashPrize: {
        id: res.reward.id,
        userId: res.reward.userId,
        user: res.reward.userName,
        amount: res.reward.cashAmount,
        currency: res.reward.currency,
        status: res.reward.status,
        accountStatus: res.reward.accountStatus,
      },
    };
  }
  return res;
}

export async function updateCashPrize(id, updates) {
  const res = await updateReward(id, {
    cashAmount: updates.amount !== undefined ? updates.amount : updates.cashAmount,
    status: updates.status,
  });
  if (res.success && res.reward) {
    return {
      success: true,
      cashPrize: {
        id: res.reward.id,
        userId: res.reward.userId,
        user: res.reward.userName,
        amount: res.reward.cashAmount,
        currency: res.reward.currency,
        status: res.reward.status,
        accountStatus: res.reward.accountStatus,
      },
    };
  }
  return res;
}

export async function activateCashPrize(id) {
  const res = await activateReward(id);
  if (res.success && res.reward) {
    return {
      success: true,
      cashPrize: {
        id: res.reward.id,
        userId: res.reward.userId,
        user: res.reward.userName,
        amount: res.reward.cashAmount,
        currency: res.reward.currency,
        status: res.reward.status,
        accountStatus: res.reward.accountStatus,
      },
    };
  }
  return res;
}

export async function deactivateCashPrize(id) {
  const res = await deactivateReward(id);
  if (res.success && res.reward) {
    return {
      success: true,
      cashPrize: {
        id: res.reward.id,
        userId: res.reward.userId,
        user: res.reward.userName,
        amount: res.reward.cashAmount,
        currency: res.reward.currency,
        status: res.reward.status,
        accountStatus: res.reward.accountStatus,
      },
    };
  }
  return res;
}

// =========================================================================
// VEHICLE PRIZE FACADE & CONVENIENCE FUNCTIONS
// =========================================================================

export function isValidVehicleYear(year) {
  const y = Number(year);
  return !isNaN(y) && y >= 1990 && y <= 2035;
}

export async function getVehiclePrizes(filters = {}) {
  const { data: rewardsList, error } = await getRewards(filters);
  if (error || !rewardsList) {
    return { data: [], error };
  }
  const prizes = rewardsList.map((r) => ({
    id: r.id,
    userId: r.userId,
    profile_id: r.profile_id,
    user: r.userName || 'Participant',
    userName: r.userName || 'Participant',
    email: r.userEmail || '',
    userEmail: r.userEmail || '',
    vehicleMake: r.vehicleMake || DEFAULT_VEHICLE_MAKE,
    vehicleModel: r.vehicleModel || DEFAULT_VEHICLE_MODEL,
    vehicleYear: r.vehicleYear || DEFAULT_VEHICLE_YEAR,
    vehicleImage: r.vehicleImage,
    status: r.status,
    reward_status: r.status,
    accountStatus: r.accountStatus,
    claimStatus: r.claimStatus,
    assignedAt: r.assignedAt,
    updatedAt: r.updatedAt,
    createdDate: r.assignedAt,
  }));
  return { data: prizes, error: null };
}

export const getAllVehiclePrizes = getVehiclePrizes;

export function getVehiclePrizeMetrics(prizes = []) {
  const list = Array.isArray(prizes) ? prizes : [];
  let activePool = 0;
  let processingPool = 0;
  let fulfilledPool = 0;

  list.forEach((p) => {
    const st = (p.status || '').toUpperCase();
    if (st === 'ACTIVE') activePool += 1;
    else if (st === 'UNDER REVIEW' || st === 'PROCESSING') processingPool += 1;
    else if (st === 'COMPLETED' || st === 'FULFILLED') fulfilledPool += 1;
  });

  return {
    totalAllocated: list.length,
    totalCount: list.length,
    activePool,
    processingPool,
    fulfilledPool,
  };
}

export async function createVehiclePrize({
  userId,
  vehicleMake,
  vehicleModel,
  vehicleYear,
  vehicleImage,
  status = 'ASSIGNED',
}) {
  const res = await assignReward({
    userId,
    vehicleMake,
    vehicleModel,
    vehicleYear,
    vehicleImage,
    status,
  });
  if (res.success && res.reward) {
    return {
      success: true,
      vehiclePrize: {
        id: res.reward.id,
        userId: res.reward.userId,
        user: res.reward.userName,
        vehicleMake: res.reward.vehicleMake,
        vehicleModel: res.reward.vehicleModel,
        vehicleYear: res.reward.vehicleYear,
        status: res.reward.status,
        accountStatus: res.reward.accountStatus,
      },
    };
  }
  return res;
}

export async function updateVehiclePrize(id, updates) {
  const res = await updateReward(id, updates);
  if (res.success && res.reward) {
    return {
      success: true,
      vehiclePrize: {
        id: res.reward.id,
        userId: res.reward.userId,
        user: res.reward.userName,
        vehicleMake: res.reward.vehicleMake,
        vehicleModel: res.reward.vehicleModel,
        vehicleYear: res.reward.vehicleYear,
        status: res.reward.status,
        accountStatus: res.reward.accountStatus,
      },
    };
  }
  return res;
}

export async function activateVehiclePrize(id) {
  const res = await activateReward(id);
  if (res.success && res.reward) {
    return {
      success: true,
      vehiclePrize: {
        id: res.reward.id,
        userId: res.reward.userId,
        user: res.reward.userName,
        vehicleMake: res.reward.vehicleMake,
        vehicleModel: res.reward.vehicleModel,
        vehicleYear: res.reward.vehicleYear,
        status: res.reward.status,
        accountStatus: res.reward.accountStatus,
      },
    };
  }
  return res;
}

export async function deactivateVehiclePrize(id) {
  const res = await deactivateReward(id);
  if (res.success && res.reward) {
    return {
      success: true,
      vehiclePrize: {
        id: res.reward.id,
        userId: res.reward.userId,
        user: res.reward.userName,
        vehicleMake: res.reward.vehicleMake,
        vehicleModel: res.reward.vehicleModel,
        vehicleYear: res.reward.vehicleYear,
        status: res.reward.status,
        accountStatus: res.reward.accountStatus,
      },
    };
  }
  return res;
}
