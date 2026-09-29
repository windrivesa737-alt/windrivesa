// WinDriveSA Cash Prize Management Service Abstraction
// Manages manual administrative cash prize allocations associated with approved participant accounts
// Compatible with future Supabase database schema
// Never includes competitions, tickets, entries, draws, odds, betting, or random winner selection

import { recordAdminActivity } from './adminService';
import { getAllUsers } from './mockUsers';

const ADMIN_CASH_PRIZES_STORAGE_KEY = 'windrive_admin_cash_prizes_list';

export const DEFAULT_CASH_PRIZE_AMOUNT = 250000;

export function formatZAR(val) {
  if (val === null || val === undefined || isNaN(Number(val))) return 'R0';
  return 'R' + Number(val).toLocaleString('en-ZA');
}

// Initial 8 cataloged participant cash prize records
const INITIAL_CASH_PRIZES = [
  {
    id: 'CP-101',
    userId: 'WD-RSA-9941',
    user: 'Nkosana Mthembu',
    email: 'nkosana.mthembu@windrivesa.co.za',
    amount: 250000,
    currency: 'ZAR',
    status: 'ACTIVE',
    accountStatus: 'ACTIVE',
    claimStatus: 'UNDER REVIEW',
    assignedAt: '03 Dec 2025',
    updatedAt: '18 Jan 2026',
  },
  {
    id: 'CP-102',
    userId: 'WD-RSA-9942',
    user: 'Lerato Khumalo',
    email: 'lerato.k@vodamail.co.za',
    amount: null,
    currency: 'ZAR',
    status: 'NOT ASSIGNED',
    accountStatus: 'PENDING REVIEW',
    claimStatus: 'No claim submitted',
    assignedAt: null,
    updatedAt: '18 Jan 2026',
  },
  {
    id: 'CP-103',
    userId: 'WD-RSA-9943',
    user: 'Sipho Dlamini',
    email: 's.dlamini@businessmail.co.za',
    amount: 100000,
    currency: 'ZAR',
    status: 'ASSIGNED',
    accountStatus: 'APPROVED',
    claimStatus: 'UNDER REVIEW',
    assignedAt: '12 Jan 2026',
    updatedAt: '15 Jan 2026',
  },
  {
    id: 'CP-104',
    userId: 'WD-RSA-9944',
    user: 'Anri van Zyl',
    email: 'anri.vanzyl@capevine.co.za',
    amount: 500000,
    currency: 'ZAR',
    status: 'COMPLETED',
    accountStatus: 'ACTIVE',
    claimStatus: 'FULFILLED',
    assignedAt: '28 Nov 2025',
    updatedAt: '19 Jan 2026',
  },
  {
    id: 'CP-105',
    userId: 'WD-RSA-9945',
    user: 'Thabo Molefe',
    email: 'thabo.molefe@gautenggov.za',
    amount: null,
    currency: 'ZAR',
    status: 'NOT ASSIGNED',
    accountStatus: 'PENDING REVIEW',
    claimStatus: 'No claim submitted',
    assignedAt: null,
    updatedAt: '18 Jan 2026',
  },
  {
    id: 'CP-106',
    userId: 'WD-RSA-9946',
    user: 'Pieter Botha',
    email: 'p.botha@overbergfarms.co.za',
    amount: null,
    currency: 'ZAR',
    status: 'DEACTIVATED',
    accountStatus: 'DEACTIVATED',
    claimStatus: 'No claim submitted',
    assignedAt: null,
    updatedAt: '15 Oct 2025',
  },
  {
    id: 'CP-107',
    userId: 'WD-RSA-9947',
    user: 'Nomvula Sithole',
    email: 'nomvula.s@durbanlogistics.co.za',
    amount: 150000,
    currency: 'ZAR',
    status: 'ASSIGNED',
    accountStatus: 'ACTIVE',
    claimStatus: 'REQUIREMENT PENDING',
    assignedAt: '04 Jan 2026',
    updatedAt: '16 Jan 2026',
  },
  {
    id: 'CP-108',
    userId: 'WD-RSA-9948',
    user: 'Farhad Patel',
    email: 'farhad.patel@joburgfin.co.za',
    amount: null,
    currency: 'ZAR',
    status: 'NOT ASSIGNED',
    accountStatus: 'REJECTED',
    claimStatus: 'No claim submitted',
    assignedAt: null,
    updatedAt: '10 Nov 2025',
  },
];

export function getStoredCashPrizes() {
  if (typeof window === 'undefined') return INITIAL_CASH_PRIZES;
  try {
    const raw = localStorage.getItem(ADMIN_CASH_PRIZES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(ADMIN_CASH_PRIZES_STORAGE_KEY, JSON.stringify(INITIAL_CASH_PRIZES));
      return INITIAL_CASH_PRIZES;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load cash prizes from storage:', err);
    return INITIAL_CASH_PRIZES;
  }
}

export function saveStoredCashPrizes(prizes) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ADMIN_CASH_PRIZES_STORAGE_KEY, JSON.stringify(prizes));
  } catch (err) {
    console.error('Failed to save cash prizes to storage:', err);
  }
}

export function getAllCashPrizes() {
  const prizes = getStoredCashPrizes();
  const users = getAllUsers();

  // Keep user profile details & account status up-to-date
  const synced = prizes.map((prize) => {
    const matchedUser = users.find((u) => u.id === prize.userId);
    if (matchedUser) {
      return {
        ...prize,
        user: matchedUser.name || prize.user,
        email: matchedUser.email || prize.email,
        accountStatus: matchedUser.status || prize.accountStatus,
      };
    }
    return prize;
  });

  return synced;
}

export function getCashPrizeById(id) {
  const prizes = getAllCashPrizes();
  return prizes.find((p) => p.id === id || p.userId === id) || null;
}

export function getCashPrizeMetrics(prizesList) {
  const list = prizesList || getAllCashPrizes();

  let totalAllocated = 0;
  let activePool = 0;
  let processingPool = 0;
  let fulfilledPool = 0;

  let totalCount = list.length;
  let activeCount = 0;
  let processingCount = 0;
  let fulfilledCount = 0;

  list.forEach((p) => {
    const amount = Number(p.amount) || 0;
    totalAllocated += amount;

    if (p.status === 'ACTIVE') {
      activePool += amount;
      activeCount++;
    }

    const normClaim = (p.claimStatus || '').toUpperCase();
    if (
      normClaim === 'UNDER REVIEW' ||
      normClaim === 'PROCESSING' ||
      normClaim === 'SUBMITTED' ||
      normClaim === 'REQUIREMENT PENDING'
    ) {
      processingPool += amount;
      processingCount++;
    }

    if (p.status === 'COMPLETED' || normClaim === 'FULFILLED') {
      fulfilledPool += amount;
      fulfilledCount++;
    }
  });

  return {
    totalAllocated,
    totalCount,
    activePool,
    activeCount,
    processingPool,
    processingCount,
    fulfilledPool,
    fulfilledCount,
  };
}

/**
 * Creates or assigns a cash prize to an approved user.
 * WinDriveSA allows ONE active cash prize per participant account.
 */
export function createCashPrize({ userId, amount, currency = 'ZAR', status = 'ASSIGNED' }) {
  if (!userId) {
    return { success: false, error: 'User selection is required.' };
  }

  const parsedAmount = Number(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return { success: false, error: 'Cash amount must be a valid positive monetary value.' };
  }

  const users = getAllUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) {
    return { success: false, error: 'Selected participant account does not exist.' };
  }

  // User eligibility: Only approved users can have an active cash prize
  if (user.status === 'PENDING REVIEW') {
    return {
      success: false,
      error: 'User approval required before activating a cash prize. Participant is pending review.',
    };
  }
  if (user.status === 'REJECTED' || user.status === 'DEACTIVATED') {
    return {
      success: false,
      error: `Cannot assign prize to an account with status ${user.status}.`,
    };
  }

  const prizes = getStoredCashPrizes();

  // Check if an allocation record already exists for this user
  const existingIndex = prizes.findIndex((p) => p.userId === userId);
  const nowStr = new Intl.DateTimeFormat('en-ZA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  let targetRecord = null;

  if (existingIndex >= 0) {
    targetRecord = {
      ...prizes[existingIndex],
      amount: parsedAmount,
      currency: 'ZAR',
      status: status || 'ASSIGNED',
      accountStatus: user.status,
      assignedAt: prizes[existingIndex].assignedAt || nowStr,
      updatedAt: nowStr,
      claimStatus:
        prizes[existingIndex].claimStatus === 'No claim submitted'
          ? 'CLAIM AVAILABLE'
          : prizes[existingIndex].claimStatus,
    };
    prizes[existingIndex] = targetRecord;
  } else {
    const nextNum = prizes.length + 101;
    targetRecord = {
      id: `CP-${nextNum}`,
      userId: user.id,
      user: user.name,
      email: user.email,
      amount: parsedAmount,
      currency: 'ZAR',
      status: status || 'ASSIGNED',
      accountStatus: user.status,
      claimStatus: 'CLAIM AVAILABLE',
      assignedAt: nowStr,
      updatedAt: nowStr,
    };
    prizes.unshift(targetRecord);
  }

  saveStoredCashPrizes(prizes);

  recordAdminActivity({
    admin: 'Escrow Operations',
    action: 'ASSIGN_CASH_PRIZE',
    target: `${targetRecord.id} (${formatZAR(parsedAmount)} ZAR to ${user.name})`,
    details: `Assigned cash prize to account ${user.id}`,
  });

  return { success: true, cashPrize: targetRecord };
}

/**
 * Updates an existing cash prize amount.
 * Does not modify account status, claim status, or vehicle prize.
 */
export function updateCashPrize(id, { amount }) {
  const parsedAmount = Number(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return { success: false, error: 'Cash amount must be a valid positive monetary value.' };
  }

  const prizes = getStoredCashPrizes();
  const index = prizes.findIndex((p) => p.id === id || p.userId === id);

  if (index === -1) {
    return { success: false, error: 'Cash prize allocation record not found.' };
  }

  const current = prizes[index];
  const nowStr = new Intl.DateTimeFormat('en-ZA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  const updated = {
    ...current,
    amount: parsedAmount,
    currency: 'ZAR',
    updatedAt: nowStr,
  };

  prizes[index] = updated;
  saveStoredCashPrizes(prizes);

  recordAdminActivity({
    admin: 'Escrow Operations',
    action: 'UPDATE_CASH_PRIZE',
    target: `${current.id} (${formatZAR(parsedAmount)} ZAR)`,
    details: `Updated cash prize amount for ${current.user}`,
  });

  return { success: true, cashPrize: updated };
}

/**
 * Activates an assigned cash prize.
 * User must be approved or active.
 */
export function activateCashPrize(id) {
  const prizes = getStoredCashPrizes();
  const index = prizes.findIndex((p) => p.id === id || p.userId === id);

  if (index === -1) {
    return { success: false, error: 'Cash prize record not found.' };
  }

  const current = prizes[index];
  const users = getAllUsers();
  const matchedUser = users.find((u) => u.id === current.userId);

  if (matchedUser && matchedUser.status === 'PENDING REVIEW') {
    return {
      success: false,
      error: 'User approval required before activating a cash prize. Participant account is pending review.',
    };
  }

  if (matchedUser && (matchedUser.status === 'REJECTED' || matchedUser.status === 'DEACTIVATED')) {
    return {
      success: false,
      error: `Cannot activate prize for an account with status ${matchedUser.status}.`,
    };
  }

  const nowStr = new Intl.DateTimeFormat('en-ZA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  const updated = {
    ...current,
    status: 'ACTIVE',
    updatedAt: nowStr,
    claimStatus:
      current.claimStatus === 'No claim submitted' ? 'CLAIM AVAILABLE' : current.claimStatus,
  };

  prizes[index] = updated;
  saveStoredCashPrizes(prizes);

  recordAdminActivity({
    admin: 'Escrow Operations',
    action: 'ACTIVATE_CASH_PRIZE',
    target: `${current.id} (${current.user})`,
    details: `Activated cash prize allocation for ${current.user}`,
  });

  return { success: true, cashPrize: updated };
}

/**
 * Deactivates an active cash prize.
 * Does NOT deactivate the participant account.
 */
export function deactivateCashPrize(id) {
  const prizes = getStoredCashPrizes();
  const index = prizes.findIndex((p) => p.id === id || p.userId === id);

  if (index === -1) {
    return { success: false, error: 'Cash prize record not found.' };
  }

  const current = prizes[index];
  const nowStr = new Intl.DateTimeFormat('en-ZA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  const updated = {
    ...current,
    status: 'DEACTIVATED',
    updatedAt: nowStr,
  };

  prizes[index] = updated;
  saveStoredCashPrizes(prizes);

  recordAdminActivity({
    admin: 'Escrow Operations',
    action: 'DEACTIVATE_CASH_PRIZE',
    target: `${current.id} (${current.user})`,
    details: `Deactivated cash prize allocation for ${current.user}`,
  });

  return { success: true, cashPrize: updated };
}
