// WinDriveSA Reward Management Service Abstraction
// Manages direct administrative reward allocation to approved participant accounts
// Compatible with future Supabase database schema
// Never includes competitions, tickets, entries, draws, odds, betting, or winner selection

import { recordAdminActivity } from './adminService';
import { getAllUsers } from './mockUsers';

const ADMIN_REWARDS_STORAGE_KEY = 'windrive_admin_rewards_list';

export const VEHICLE_SPECIMENS = [
  {
    id: 'hilux-white-showroom',
    make: 'Toyota',
    model: 'Hilux 2.8 GD-6 Legend 4x4',
    year: 2026,
    label: 'Toyota Hilux (White Showroom)',
    url: '/images/windrivesa-hilux-white-01.jpg',
  },
  {
    id: 'hilux-white-front',
    make: 'Toyota',
    model: 'Hilux GR Sport 4x4',
    year: 2026,
    label: 'Toyota Hilux (White Front GR)',
    url: '/images/windrivesa-hilux-white-02.jpg',
  },
  {
    id: 'hilux-executive',
    make: 'Toyota',
    model: 'Hilux 2.8 GD-6 Double-Cab',
    year: 2026,
    label: 'Toyota Hilux (White Fleet Spec)',
    url: '/images/windrivesa-hilux-white-01.jpg',
  },
];

export const DEFAULT_REWARD_VALUES = {
  cashAmount: 250000,
  currency: 'ZAR',
  vehicleMake: 'Toyota',
  vehicleModel: 'Hilux 2.8 GD-6 Legend 4x4',
  vehicleYear: 2026,
  vehicleImage: VEHICLE_SPECIMENS[0].url,
};

// Initial Seed Data aligning with the verified user records
const INITIAL_REWARDS = [
  {
    id: 'REW-101',
    userId: 'WD-RSA-9941',
    userName: 'Nkosana Mthembu',
    userEmail: 'nkosana.mthembu@windrivesa.co.za',
    accountStatus: 'ACTIVE',
    cashAmount: 250000,
    currency: 'ZAR',
    vehicleMake: 'Toyota',
    vehicleModel: 'Hilux 2.8 GD-6 Legend 4x4',
    vehicleYear: 2026,
    vehicleImage: VEHICLE_SPECIMENS[0].url,
    status: 'ACTIVE',
    assignedAt: '03 Dec 2025',
    updatedAt: '18 Jan 2026',
    cashClaimStatus: 'UNDER REVIEW',
    vehicleClaimStatus: 'SUBMITTED',
  },
  {
    id: 'REW-102',
    userId: 'WD-RSA-9942',
    userName: 'Lerato Khumalo',
    userEmail: 'lerato.k@vodamail.co.za',
    accountStatus: 'PENDING REVIEW',
    cashAmount: null,
    currency: 'ZAR',
    vehicleMake: null,
    vehicleModel: null,
    vehicleYear: null,
    vehicleImage: null,
    status: 'NOT ASSIGNED',
    assignedAt: null,
    updatedAt: '18 Jan 2026',
    cashClaimStatus: 'NOT STARTED',
    vehicleClaimStatus: 'NOT STARTED',
  },
  {
    id: 'REW-103',
    userId: 'WD-RSA-9943',
    userName: 'Sipho Dlamini',
    userEmail: 's.dlamini@businessmail.co.za',
    accountStatus: 'APPROVED',
    cashAmount: 100000,
    currency: 'ZAR',
    vehicleMake: null,
    vehicleModel: null,
    vehicleYear: null,
    vehicleImage: null,
    status: 'ASSIGNED',
    assignedAt: '12 Jan 2026',
    updatedAt: '15 Jan 2026',
    cashClaimStatus: 'UNDER REVIEW',
    vehicleClaimStatus: 'NOT STARTED',
  },
  {
    id: 'REW-104',
    userId: 'WD-RSA-9944',
    userName: 'Anri van Zyl',
    userEmail: 'anri.vanzyl@capevine.co.za',
    accountStatus: 'ACTIVE',
    cashAmount: 500000,
    currency: 'ZAR',
    vehicleMake: 'BMW',
    vehicleModel: 'M340i xDrive',
    vehicleYear: 2025,
    vehicleImage: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=800&q=80',
    status: 'COMPLETED',
    assignedAt: '28 Nov 2025',
    updatedAt: '19 Jan 2026',
    cashClaimStatus: 'FULFILLED',
    vehicleClaimStatus: 'PROCESSING',
  },
  {
    id: 'REW-105',
    userId: 'WD-RSA-9945',
    userName: 'Thabo Molefe',
    userEmail: 'thabo.molefe@gautenggov.za',
    accountStatus: 'PENDING REVIEW',
    cashAmount: null,
    currency: 'ZAR',
    vehicleMake: null,
    vehicleModel: null,
    vehicleYear: null,
    vehicleImage: null,
    status: 'NOT ASSIGNED',
    assignedAt: null,
    updatedAt: '18 Jan 2026',
    cashClaimStatus: 'NOT STARTED',
    vehicleClaimStatus: 'NOT STARTED',
  },
  {
    id: 'REW-106',
    userId: 'WD-RSA-9946',
    userName: 'Pieter Botha',
    userEmail: 'p.botha@overbergfarms.co.za',
    accountStatus: 'DEACTIVATED',
    cashAmount: null,
    currency: 'ZAR',
    vehicleMake: null,
    vehicleModel: null,
    vehicleYear: null,
    vehicleImage: null,
    status: 'NOT ASSIGNED',
    assignedAt: null,
    updatedAt: '15 Oct 2025',
    cashClaimStatus: 'NOT STARTED',
    vehicleClaimStatus: 'NOT STARTED',
  },
  {
    id: 'REW-107',
    userId: 'WD-RSA-9947',
    userName: 'Nomvula Sithole',
    userEmail: 'nomvula.s@durbanlogistics.co.za',
    accountStatus: 'ACTIVE',
    cashAmount: 150000,
    currency: 'ZAR',
    vehicleMake: 'Ford',
    vehicleModel: 'Ranger 3.0 V6 Wildtrak',
    vehicleYear: 2026,
    vehicleImage: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
    status: 'ASSIGNED',
    assignedAt: '04 Jan 2026',
    updatedAt: '16 Jan 2026',
    cashClaimStatus: 'REQUIREMENT PENDING',
    vehicleClaimStatus: 'REQUIREMENT PENDING',
  },
  {
    id: 'REW-108',
    userId: 'WD-RSA-9948',
    userName: 'Farhad Patel',
    userEmail: 'farhad.patel@joburgfin.co.za',
    accountStatus: 'REJECTED',
    cashAmount: null,
    currency: 'ZAR',
    vehicleMake: null,
    vehicleModel: null,
    vehicleYear: null,
    vehicleImage: null,
    status: 'NOT ASSIGNED',
    assignedAt: null,
    updatedAt: '02 Jan 2026',
    cashClaimStatus: 'NOT STARTED',
    vehicleClaimStatus: 'NOT STARTED',
  },
];

/**
 * Format date for table display (e.g. 18 Jan 2026)
 */
function formatDateDisplay(dateInput) {
  const d = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(d.getTime())) return dateInput || '18 Jan 2026';
  const day = d.getDate().toString().padStart(2, '0');
  const month = d.toLocaleString('en-GB', { month: 'short' });
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Format currency in South African Rand (ZAR)
 */
export function formatZAR(amount) {
  if (amount === null || amount === undefined || isNaN(Number(amount))) return '—';
  return `R${Number(amount).toLocaleString('en-ZA')}`;
}

/**
 * Sync helper to reflect reward changes back to `windrive_admin_users_list`
 */
function syncUserRewardRecord(userId, reward) {
  try {
    const raw = localStorage.getItem('windrive_admin_users_list');
    if (!raw) return;
    const users = JSON.parse(raw);
    const uIdx = users.findIndex((u) => u.id === userId);
    if (uIdx !== -1) {
      users[uIdx].rewardStatus = reward.status;
      users[uIdx].cashPrize = reward.cashAmount ? `${formatZAR(reward.cashAmount)} ZAR` : null;
      users[uIdx].vehiclePrize = reward.vehicleModel
        ? `${reward.vehicleYear || 2026} ${reward.vehicleMake || 'Toyota'} ${reward.vehicleModel}`
        : null;
      if (reward.vehicleImage) {
        users[uIdx].vehicleImage = reward.vehicleImage;
      }
      localStorage.setItem('windrive_admin_users_list', JSON.stringify(users));
    }
  } catch (e) {
    console.warn('Sync reward to users error:', e);
  }
}

/**
 * Retrieve all reward records from storage, synchronized with user roster
 */
export function getAllRewards() {
  try {
    const raw = localStorage.getItem(ADMIN_REWARDS_STORAGE_KEY);
    let rewards = [];
    if (!raw) {
      rewards = [...INITIAL_REWARDS];
      localStorage.setItem(ADMIN_REWARDS_STORAGE_KEY, JSON.stringify(rewards));
    } else {
      rewards = JSON.parse(raw);
    }

    // Keep user names and account statuses in sync with current user records
    try {
      const users = getAllUsers();
      let modified = false;

      users.forEach((u) => {
        const existingRew = rewards.find((r) => r.userId === u.id);
        if (existingRew) {
          if (existingRew.userName !== u.name || existingRew.accountStatus !== u.status || existingRew.userEmail !== u.email) {
            existingRew.userName = u.name;
            existingRew.userEmail = u.email;
            existingRew.accountStatus = u.status;
            modified = true;
          }
        } else {
          // Add unassigned reward placeholder for new users
          const newRew = {
            id: `REW-${Math.floor(100 + Math.random() * 900)}`,
            userId: u.id,
            userName: u.name,
            userEmail: u.email,
            accountStatus: u.status,
            cashAmount: null,
            currency: 'ZAR',
            vehicleMake: null,
            vehicleModel: null,
            vehicleYear: null,
            vehicleImage: null,
            status: u.rewardStatus || 'NOT ASSIGNED',
            assignedAt: null,
            updatedAt: formatDateDisplay(new Date()),
            cashClaimStatus: 'NOT STARTED',
            vehicleClaimStatus: 'NOT STARTED',
          };
          rewards.push(newRew);
          modified = true;
        }
      });

      if (modified) {
        localStorage.setItem(ADMIN_REWARDS_STORAGE_KEY, JSON.stringify(rewards));
      }
    } catch (syncErr) {
      console.warn('Reward sync with users notice:', syncErr);
    }

    return rewards;
  } catch (e) {
    console.error('Error fetching admin rewards:', e);
    return [...INITIAL_REWARDS];
  }
}

/**
 * Get a specific reward record by reward ID
 */
export function getRewardById(id) {
  const rewards = getAllRewards();
  return rewards.find((r) => r.id === id) || null;
}

/**
 * Get a specific reward record by User ID
 */
export function getRewardByUserId(userId) {
  const rewards = getAllRewards();
  return rewards.find((r) => r.userId === userId) || null;
}

/**
 * Assign reward to an approved user account
 * Enforces rule: User must not be PENDING REVIEW or REJECTED to receive an active/assigned reward.
 */
export function assignReward({
  userId,
  cashAmount = DEFAULT_REWARD_VALUES.cashAmount,
  currency = 'ZAR',
  vehicleMake = DEFAULT_REWARD_VALUES.vehicleMake,
  vehicleModel = DEFAULT_REWARD_VALUES.vehicleModel,
  vehicleYear = DEFAULT_REWARD_VALUES.vehicleYear,
  vehicleImage = DEFAULT_REWARD_VALUES.vehicleImage,
}) {
  const users = getAllUsers();
  const targetUser = users.find((u) => u.id === userId);

  if (!targetUser) {
    return { success: false, error: 'Selected participant account not found.' };
  }

  // Check user eligibility rule
  if (targetUser.status === 'PENDING REVIEW') {
    return {
      success: false,
      error: 'User approval required before activating a reward. This account is currently pending review.',
    };
  }

  if (targetUser.status === 'REJECTED' || targetUser.status === 'DEACTIVATED') {
    return {
      success: false,
      error: `Cannot assign reward to an account with status ${targetUser.status}.`,
    };
  }

  if (!cashAmount && !vehicleModel) {
    return { success: false, error: 'At least one reward component (Cash or Vehicle) must be configured.' };
  }

  const rewards = getAllRewards();
  const existingIdx = rewards.findIndex((r) => r.userId === userId);
  const nowStr = formatDateDisplay(new Date());

  let targetRecord;
  if (existingIdx !== -1) {
    rewards[existingIdx] = {
      ...rewards[existingIdx],
      cashAmount: cashAmount ? Number(cashAmount) : null,
      currency: currency || 'ZAR',
      vehicleMake: vehicleMake ? vehicleMake.trim() : null,
      vehicleModel: vehicleModel ? vehicleModel.trim() : null,
      vehicleYear: vehicleYear ? Number(vehicleYear) : null,
      vehicleImage: vehicleImage || null,
      status: 'ASSIGNED',
      assignedAt: nowStr,
      updatedAt: nowStr,
      cashClaimStatus: cashAmount ? 'CLAIM AVAILABLE' : 'NOT STARTED',
      vehicleClaimStatus: vehicleModel ? 'CLAIM AVAILABLE' : 'NOT STARTED',
    };
    targetRecord = rewards[existingIdx];
  } else {
    targetRecord = {
      id: `REW-${Math.floor(100 + Math.random() * 900)}`,
      userId: targetUser.id,
      userName: targetUser.name,
      userEmail: targetUser.email,
      accountStatus: targetUser.status,
      cashAmount: cashAmount ? Number(cashAmount) : null,
      currency: currency || 'ZAR',
      vehicleMake: vehicleMake ? vehicleMake.trim() : null,
      vehicleModel: vehicleModel ? vehicleModel.trim() : null,
      vehicleYear: vehicleYear ? Number(vehicleYear) : null,
      vehicleImage: vehicleImage || null,
      status: 'ASSIGNED',
      assignedAt: nowStr,
      updatedAt: nowStr,
      cashClaimStatus: cashAmount ? 'CLAIM AVAILABLE' : 'NOT STARTED',
      vehicleClaimStatus: vehicleModel ? 'CLAIM AVAILABLE' : 'NOT STARTED',
    };
    rewards.unshift(targetRecord);
  }

  try {
    localStorage.setItem(ADMIN_REWARDS_STORAGE_KEY, JSON.stringify(rewards));
    syncUserRewardRecord(userId, targetRecord);

    recordAdminActivity({
      action: 'Reward Assigned',
      admin: 'Operations Lead',
      adminId: 'WD-HQ-001',
      reference: `Reward #${targetRecord.id}`,
      referenceNote: `Assigned ${formatZAR(cashAmount)} and ${vehicleYear} ${vehicleMake} ${vehicleModel} to ${targetUser.name} (${targetUser.id})`,
      status: 'ASSIGNED',
      statusColor: 'amber',
    });

    return { success: true, reward: targetRecord };
  } catch (e) {
    console.error('Error saving assigned reward:', e);
    return { success: false, error: 'Failed to record reward assignment in storage.' };
  }
}

/**
 * Edit reward details (cash amount, vehicle make, model, year, image)
 * Currency remains ZAR.
 * Does NOT modify account status.
 */
export function updateReward(id, { cashAmount, vehicleMake, vehicleModel, vehicleYear, vehicleImage }) {
  const rewards = getAllRewards();
  const index = rewards.findIndex((r) => r.id === id);

  if (index === -1) {
    return { success: false, error: 'Reward record not found.' };
  }

  const prevRecord = rewards[index];
  const nowStr = formatDateDisplay(new Date());

  rewards[index] = {
    ...prevRecord,
    cashAmount: cashAmount !== undefined ? (cashAmount ? Number(cashAmount) : null) : prevRecord.cashAmount,
    vehicleMake: vehicleMake !== undefined ? (vehicleMake ? vehicleMake.trim() : null) : prevRecord.vehicleMake,
    vehicleModel: vehicleModel !== undefined ? (vehicleModel ? vehicleModel.trim() : null) : prevRecord.vehicleModel,
    vehicleYear: vehicleYear !== undefined ? (vehicleYear ? Number(vehicleYear) : null) : prevRecord.vehicleYear,
    vehicleImage: vehicleImage !== undefined ? vehicleImage : prevRecord.vehicleImage,
    updatedAt: nowStr,
  };

  try {
    localStorage.setItem(ADMIN_REWARDS_STORAGE_KEY, JSON.stringify(rewards));
    syncUserRewardRecord(rewards[index].userId, rewards[index]);

    recordAdminActivity({
      action: 'Reward Details Updated',
      admin: 'Operations Lead',
      adminId: 'WD-HQ-001',
      reference: `Reward #${id}`,
      referenceNote: `Updated prize parameters for ${rewards[index].userName} (${rewards[index].userId})`,
      status: 'UPDATED',
      statusColor: 'sky',
    });

    return { success: true, reward: rewards[index] };
  } catch (e) {
    console.error('Error updating reward:', e);
    return { success: false, error: 'Failed to update reward details.' };
  }
}

/**
 * Activate Reward: Changes status from ASSIGNED to ACTIVE
 * Validates that the associated user is approved.
 * If user is PENDING REVIEW, activation is rejected.
 */
export function activateReward(id) {
  const rewards = getAllRewards();
  const index = rewards.findIndex((r) => r.id === id);

  if (index === -1) {
    return { success: false, error: 'Reward record not found.' };
  }

  const record = rewards[index];
  const users = getAllUsers();
  const user = users.find((u) => u.id === record.userId);

  if (user && user.status === 'PENDING REVIEW') {
    return {
      success: false,
      error: 'User approval required before activating a reward. Please approve the user account in Users management first.',
    };
  }

  if (user && (user.status === 'REJECTED' || user.status === 'DEACTIVATED')) {
    return {
      success: false,
      error: `Cannot activate reward for user with account status: ${user.status}.`,
    };
  }

  rewards[index].status = 'ACTIVE';
  rewards[index].updatedAt = formatDateDisplay(new Date());

  try {
    localStorage.setItem(ADMIN_REWARDS_STORAGE_KEY, JSON.stringify(rewards));
    syncUserRewardRecord(record.userId, rewards[index]);

    recordAdminActivity({
      action: 'Reward Activated',
      admin: 'Operations Lead',
      adminId: 'WD-HQ-001',
      reference: `Reward #${id}`,
      referenceNote: `Activated allocation for ${record.userName}. Available for participant claim requests.`,
      status: 'ACTIVE',
      statusColor: 'emerald',
    });

    return { success: true, reward: rewards[index] };
  } catch (e) {
    console.error('Error activating reward:', e);
    return { success: false, error: 'Failed to activate reward in storage.' };
  }
}

/**
 * Deactivate Reward: Changes status from ACTIVE back to ASSIGNED (or NOT ASSIGNED)
 * Does NOT change the user's account status.
 */
export function deactivateReward(id) {
  const rewards = getAllRewards();
  const index = rewards.findIndex((r) => r.id === id);

  if (index === -1) {
    return { success: false, error: 'Reward record not found.' };
  }

  const record = rewards[index];
  rewards[index].status = 'ASSIGNED';
  rewards[index].updatedAt = formatDateDisplay(new Date());

  try {
    localStorage.setItem(ADMIN_REWARDS_STORAGE_KEY, JSON.stringify(rewards));
    syncUserRewardRecord(record.userId, rewards[index]);

    recordAdminActivity({
      action: 'Reward Deactivated',
      admin: 'Operations Lead',
      adminId: 'WD-HQ-001',
      reference: `Reward #${id}`,
      referenceNote: `Deactivated reward allocation for ${record.userName}. Account preserved for audit governance.`,
      status: 'PAUSED',
      statusColor: 'amber',
    });

    return { success: true, reward: rewards[index] };
  } catch (e) {
    console.error('Error deactivating reward:', e);
    return { success: false, error: 'Failed to deactivate reward.' };
  }
}

/**
 * Calculate reward metrics from current dataset
 */
export function getRewardMetrics(rewardList = null) {
  const rewards = rewardList || getAllRewards();
  const total = rewards.length;
  const unassigned = rewards.filter((r) => r.status === 'NOT_ASSIGNED' || r.status === 'NOT ASSIGNED').length;
  const assigned = rewards.filter((r) => r.status === 'ASSIGNED').length;
  const activeOrCompleted = rewards.filter((r) => r.status === 'ACTIVE' || r.status === 'COMPLETED').length;
  const active = rewards.filter((r) => r.status === 'ACTIVE').length;
  const completed = rewards.filter((r) => r.status === 'COMPLETED').length;

  return {
    total,
    unassigned,
    assigned,
    active,
    completed,
    activeOrCompleted,
  };
}
