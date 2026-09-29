// WinDriveSA Vehicle Prize Management Service Abstraction
// Manages manual administrative vehicle prize allocations associated with approved participant accounts
// Compatible with future Supabase database schema
// Never includes competitions, tickets, entries, draws, odds, betting, or random winner selection

import { recordAdminActivity } from './adminService';
import { getAllUsers } from './mockUsers';

const ADMIN_VEHICLE_PRIZES_STORAGE_KEY = 'windrive_admin_vehicle_prizes_list';

export const DEFAULT_VEHICLE_MAKE = 'Toyota';
export const DEFAULT_VEHICLE_MODEL = 'Hilux';
export const DEFAULT_VEHICLE_YEAR = 2026;

// Initial 8 cataloged participant vehicle prize records aligned with Screen 15 reference and user registry
const INITIAL_VEHICLE_PRIZES = [
  {
    id: 'VP-101',
    userId: 'WD-RSA-9941',
    user: 'Nkosana Mthembu',
    email: 'nkosana.mthembu@windrivesa.co.za',
    vehicleMake: 'Toyota',
    vehicleModel: 'Hilux 2.8 GD-6 Legend 4x4',
    vehicleYear: 2026,
    vehicleImage: '/images/windrivesa-hilux-white-01.jpg',
    status: 'ACTIVE',
    accountStatus: 'ACTIVE',
    claimStatus: 'SUBMITTED',
    assignedAt: '03 Dec 2025',
    updatedAt: '18 Jan 2026',
  },
  {
    id: 'VP-102',
    userId: 'WD-RSA-9942',
    user: 'Lerato Khumalo',
    email: 'lerato.k@vodamail.co.za',
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: null,
    vehicleImage: null,
    status: 'NOT ASSIGNED',
    accountStatus: 'PENDING REVIEW',
    claimStatus: 'No claim submitted',
    assignedAt: null,
    updatedAt: '18 Jan 2026',
  },
  {
    id: 'VP-103',
    userId: 'WD-RSA-9943',
    user: 'Sipho Dlamini',
    email: 's.dlamini@businessmail.co.za',
    vehicleMake: 'Toyota',
    vehicleModel: 'Hilux 2.4 GD-6 Raider Single Cab',
    vehicleYear: 2026,
    vehicleImage: null, // Test case with no image available
    status: 'ASSIGNED',
    accountStatus: 'APPROVED',
    claimStatus: 'CLAIM AVAILABLE',
    assignedAt: '12 Jan 2026',
    updatedAt: '15 Jan 2026',
  },
  {
    id: 'VP-104',
    userId: 'WD-RSA-9944',
    user: 'Anri van Zyl',
    email: 'anri.vanzyl@capevine.co.za',
    vehicleMake: 'BMW',
    vehicleModel: 'M340i xDrive',
    vehicleYear: 2025,
    vehicleImage: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=800&q=80',
    status: 'ACTIVE',
    accountStatus: 'ACTIVE',
    claimStatus: 'PROCESSING',
    assignedAt: '28 Nov 2025',
    updatedAt: '19 Jan 2026',
  },
  {
    id: 'VP-105',
    userId: 'WD-RSA-9945',
    user: 'Thabo Molefe',
    email: 'thabo.molefe@gautenggov.za',
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: null,
    vehicleImage: null,
    status: 'NOT ASSIGNED',
    accountStatus: 'PENDING REVIEW',
    claimStatus: 'No claim submitted',
    assignedAt: null,
    updatedAt: '18 Jan 2026',
  },
  {
    id: 'VP-106',
    userId: 'WD-RSA-9946',
    user: 'Pieter Botha',
    email: 'p.botha@overbergfarms.co.za',
    vehicleMake: 'Isuzu',
    vehicleModel: 'D-Max 3.0 Ddi V-Cross 4x4',
    vehicleYear: 2025,
    vehicleImage: null,
    status: 'DEACTIVATED',
    accountStatus: 'DEACTIVATED',
    claimStatus: 'No claim submitted',
    assignedAt: '15 Oct 2025',
    updatedAt: '15 Oct 2025',
  },
  {
    id: 'VP-107',
    userId: 'WD-RSA-9947',
    user: 'Nomvula Sithole',
    email: 'nomvula.s@durbanlogistics.co.za',
    vehicleMake: 'Ford',
    vehicleModel: 'Ranger 3.0 V6 Wildtrak',
    vehicleYear: 2026,
    vehicleImage: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
    status: 'ASSIGNED',
    accountStatus: 'ACTIVE',
    claimStatus: 'REQUIREMENT PENDING',
    assignedAt: '04 Jan 2026',
    updatedAt: '16 Jan 2026',
  },
  {
    id: 'VP-108',
    userId: 'WD-RSA-9948',
    user: 'Farhad Patel',
    email: 'farhad.patel@joburgfin.co.za',
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: null,
    vehicleImage: null,
    status: 'NOT ASSIGNED',
    accountStatus: 'REJECTED',
    claimStatus: 'No claim submitted',
    assignedAt: null,
    updatedAt: '10 Nov 2025',
  },
];

export function getStoredVehiclePrizes() {
  if (typeof window === 'undefined') return INITIAL_VEHICLE_PRIZES;
  try {
    const raw = localStorage.getItem(ADMIN_VEHICLE_PRIZES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(ADMIN_VEHICLE_PRIZES_STORAGE_KEY, JSON.stringify(INITIAL_VEHICLE_PRIZES));
      return INITIAL_VEHICLE_PRIZES;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load vehicle prizes from storage:', err);
    return INITIAL_VEHICLE_PRIZES;
  }
}

export function saveStoredVehiclePrizes(prizes) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ADMIN_VEHICLE_PRIZES_STORAGE_KEY, JSON.stringify(prizes));
  } catch (err) {
    console.error('Failed to save vehicle prizes to storage:', err);
  }
}

export function getAllVehiclePrizes() {
  const prizes = getStoredVehiclePrizes();
  const users = getAllUsers();

  // Keep participant details & account status synchronized with the authoritative user service
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

export function getVehiclePrizeById(id) {
  const prizes = getAllVehiclePrizes();
  return prizes.find((p) => p.id === id || p.userId === id) || null;
}

export function getVehiclePrizeMetrics(prizesList) {
  const list = prizesList || getAllVehiclePrizes();

  let totalAllocated = 0;
  let activePool = 0;
  let processingPool = 0;
  let fulfilledPool = 0;

  list.forEach((p) => {
    // Only count records that have an assigned vehicle
    const hasVehicle = p.vehicleMake && p.vehicleModel;
    if (hasVehicle && p.status !== 'NOT ASSIGNED') {
      totalAllocated++;
    }

    if (p.status === 'ACTIVE') {
      activePool++;
    }

    const normClaim = (p.claimStatus || '').toUpperCase();
    if (
      normClaim === 'UNDER REVIEW' ||
      normClaim === 'PROCESSING' ||
      normClaim === 'SUBMITTED' ||
      normClaim === 'REQUIREMENT PENDING'
    ) {
      processingPool++;
    }

    if (p.status === 'COMPLETED' || normClaim === 'FULFILLED') {
      fulfilledPool++;
    }
  });

  return {
    totalAllocated,
    totalCount: list.length,
    activePool,
    processingPool,
    fulfilledPool,
  };
}

/**
 * Validates a four-digit year.
 */
export function isValidVehicleYear(year) {
  const num = Number(year);
  if (isNaN(num)) return false;
  return Number.isInteger(num) && num >= 1990 && num <= 2035;
}

/**
 * Creates or assigns a vehicle prize to an approved participant account.
 * WinDriveSA enforces ONE active vehicle prize per participant.
 */
export function createVehiclePrize({
  userId,
  vehicleMake = DEFAULT_VEHICLE_MAKE,
  vehicleModel = DEFAULT_VEHICLE_MODEL,
  vehicleYear = DEFAULT_VEHICLE_YEAR,
  vehicleImage = null,
  status = 'ASSIGNED',
}) {
  if (!userId) {
    return { success: false, error: 'User selection is required.' };
  }

  const make = (vehicleMake || '').trim();
  const model = (vehicleModel || '').trim();
  const year = Number(vehicleYear);

  if (!make) {
    return { success: false, error: 'Vehicle Make is required.' };
  }
  if (!model) {
    return { success: false, error: 'Vehicle Model is required.' };
  }
  if (!isValidVehicleYear(year)) {
    return { success: false, error: 'Vehicle Year must be a reasonable 4-digit year (e.g. 2026).' };
  }

  const users = getAllUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) {
    return { success: false, error: 'Selected participant account does not exist.' };
  }

  // User eligibility rules
  if (user.status === 'PENDING REVIEW') {
    return {
      success: false,
      error: 'User approval required before activating a vehicle prize.',
    };
  }
  if (user.status === 'REJECTED' || user.status === 'DEACTIVATED') {
    return {
      success: false,
      error: `Cannot assign vehicle prize to an account with status ${user.status}.`,
    };
  }

  const prizes = getStoredVehiclePrizes();

  // Check if another active vehicle prize is already assigned to this user
  if (status === 'ACTIVE') {
    const existingActive = prizes.find(
      (p) => p.userId === userId && p.status === 'ACTIVE'
    );
    if (existingActive) {
      return {
        success: false,
        error: 'Each user can have only one active vehicle prize.',
      };
    }
  }

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
      vehicleMake: make,
      vehicleModel: model,
      vehicleYear: year,
      vehicleImage: vehicleImage ? vehicleImage.trim() : null,
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
      id: `VP-${nextNum}`,
      userId: user.id,
      user: user.name,
      email: user.email,
      vehicleMake: make,
      vehicleModel: model,
      vehicleYear: year,
      vehicleImage: vehicleImage ? vehicleImage.trim() : null,
      status: status || 'ASSIGNED',
      accountStatus: user.status,
      claimStatus: 'CLAIM AVAILABLE',
      assignedAt: nowStr,
      updatedAt: nowStr,
    };
    prizes.unshift(targetRecord);
  }

  saveStoredVehiclePrizes(prizes);

  recordAdminActivity({
    admin: 'Fleet Operations',
    action: 'ASSIGN_VEHICLE_PRIZE',
    target: `${targetRecord.id} (${year} ${make} ${model} to ${user.name})`,
    details: `Assigned vehicle prize to account ${user.id}`,
  });

  return { success: true, vehiclePrize: targetRecord };
}

/**
 * Updates an existing vehicle prize record (make, model, year, image).
 * Does not modify account status, claim status, or cash prizes.
 */
export function updateVehiclePrize(id, { vehicleMake, vehicleModel, vehicleYear, vehicleImage }) {
  const make = (vehicleMake || '').trim();
  const model = (vehicleModel || '').trim();
  const year = Number(vehicleYear);

  if (!make) {
    return { success: false, error: 'Vehicle Make is required.' };
  }
  if (!model) {
    return { success: false, error: 'Vehicle Model is required.' };
  }
  if (!isValidVehicleYear(year)) {
    return { success: false, error: 'Vehicle Year must be a reasonable 4-digit year (e.g. 2026).' };
  }

  const prizes = getStoredVehiclePrizes();
  const index = prizes.findIndex((p) => p.id === id || p.userId === id);

  if (index === -1) {
    return { success: false, error: 'Vehicle prize allocation record not found.' };
  }

  const current = prizes[index];
  const nowStr = new Intl.DateTimeFormat('en-ZA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  const updated = {
    ...current,
    vehicleMake: make,
    vehicleModel: model,
    vehicleYear: year,
    vehicleImage: vehicleImage ? vehicleImage.trim() : null,
    updatedAt: nowStr,
  };

  prizes[index] = updated;
  saveStoredVehiclePrizes(prizes);

  recordAdminActivity({
    admin: 'Fleet Operations',
    action: 'UPDATE_VEHICLE_PRIZE',
    target: `${current.id} (${year} ${make} ${model})`,
    details: `Updated vehicle prize parameters for ${current.user}`,
  });

  return { success: true, vehiclePrize: updated };
}

/**
 * Activates an assigned vehicle prize.
 * User must be approved.
 * Each user can have only ONE active vehicle prize.
 */
export function activateVehiclePrize(id) {
  const prizes = getStoredVehiclePrizes();
  const index = prizes.findIndex((p) => p.id === id || p.userId === id);

  if (index === -1) {
    return { success: false, error: 'Vehicle prize record not found.' };
  }

  const current = prizes[index];
  const users = getAllUsers();
  const matchedUser = users.find((u) => u.id === current.userId);

  if (matchedUser && matchedUser.status === 'PENDING REVIEW') {
    return {
      success: false,
      error: 'User approval required before activating a vehicle prize.',
    };
  }

  if (matchedUser && (matchedUser.status === 'REJECTED' || matchedUser.status === 'DEACTIVATED')) {
    return {
      success: false,
      error: `Cannot activate vehicle prize for an account with status ${matchedUser.status}.`,
    };
  }

  // Check if another active vehicle prize exists for this user
  const otherActive = prizes.find(
    (p) => p.userId === current.userId && p.id !== current.id && p.status === 'ACTIVE'
  );
  if (otherActive) {
    return {
      success: false,
      error: 'User already has an active vehicle prize. Each user can have only one active vehicle prize.',
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
  saveStoredVehiclePrizes(prizes);

  recordAdminActivity({
    admin: 'Fleet Operations',
    action: 'ACTIVATE_VEHICLE_PRIZE',
    target: `${current.id} (${current.user})`,
    details: `Activated vehicle prize allocation for ${current.user}`,
  });

  return { success: true, vehiclePrize: updated };
}

/**
 * Deactivates an active vehicle prize.
 * Does NOT deactivate the participant account.
 */
export function deactivateVehiclePrize(id) {
  const prizes = getStoredVehiclePrizes();
  const index = prizes.findIndex((p) => p.id === id || p.userId === id);

  if (index === -1) {
    return { success: false, error: 'Vehicle prize record not found.' };
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
  saveStoredVehiclePrizes(prizes);

  recordAdminActivity({
    admin: 'Fleet Operations',
    action: 'DEACTIVATE_VEHICLE_PRIZE',
    target: `${current.id} (${current.user})`,
    details: `Deactivated vehicle prize allocation for ${current.user}`,
  });

  return { success: true, vehiclePrize: updated };
}
