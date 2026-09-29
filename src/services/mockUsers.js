// WinDriveSA User Management Service Abstraction
// Encapsulates administrative user lifecycle operations compatible with future Supabase database schema
// Never stores or returns sensitive credentials (passwords, PINs, OTPs, CVVs)

import { recordAdminActivity } from './adminService';
import { getStoredUsers } from './mockAuth';

const ADMIN_USERS_STORAGE_KEY = 'windrive_admin_users_list';

// Baseline registered participants from approved Stitch Screen 12
const INITIAL_USERS = [
  {
    id: 'WD-RSA-9941',
    name: 'Nkosana Mthembu',
    email: 'nkosana.mthembu@windrivesa.co.za',
    phone: '+27 82 555 0194',
    status: 'ACTIVE',
    rewardStatus: 'ASSIGNED',
    cashPrize: 'R250,000 ZAR',
    vehiclePrize: '2026 Toyota Hilux 2.8 GD-6 Legend 4x4',
    vehicleImage: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80',
    claimCash: 'None',
    claimVehicle: 'SUBMITTED',
    claimActivity: 'VEHICLE — SUBMITTED',
    createdDate: '03 Dec 2025',
  },
  {
    id: 'WD-RSA-9942',
    name: 'Lerato Khumalo',
    email: 'lerato.k@vodamail.co.za',
    phone: '+27 83 412 8891',
    status: 'PENDING REVIEW',
    rewardStatus: 'NOT ASSIGNED',
    cashPrize: null,
    vehiclePrize: null,
    vehicleImage: null,
    claimCash: 'None',
    claimVehicle: 'None',
    claimActivity: 'NO CLAIM',
    createdDate: '18 Jan 2026',
  },
  {
    id: 'WD-RSA-9943',
    name: 'Sipho Dlamini',
    email: 's.dlamini@businessmail.co.za',
    phone: '+27 71 884 9201',
    status: 'APPROVED',
    rewardStatus: 'ASSIGNED',
    cashPrize: 'R100,000 ZAR',
    vehiclePrize: null,
    vehicleImage: null,
    claimCash: 'UNDER REVIEW',
    claimVehicle: 'None',
    claimActivity: 'CASH — UNDER REVIEW',
    createdDate: '12 Jan 2026',
  },
  {
    id: 'WD-RSA-9944',
    name: 'Anri van Zyl',
    email: 'anri.vanzyl@capevine.co.za',
    phone: '+27 82 991 3044',
    status: 'ACTIVE',
    rewardStatus: 'ASSIGNED',
    cashPrize: 'R500,000 ZAR',
    vehiclePrize: '2025 BMW M340i xDrive',
    vehicleImage: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=800&q=80',
    claimCash: 'FULFILLED',
    claimVehicle: 'PROCESSING',
    claimActivity: 'CASH — FULFILLED',
    createdDate: '28 Nov 2025',
  },
  {
    id: 'WD-RSA-9945',
    name: 'Thabo Molefe',
    email: 'thabo.molefe@gautenggov.za',
    phone: '+27 76 223 9011',
    status: 'PENDING REVIEW',
    rewardStatus: 'NOT ASSIGNED',
    cashPrize: null,
    vehiclePrize: null,
    vehicleImage: null,
    claimCash: 'None',
    claimVehicle: 'None',
    claimActivity: 'NO CLAIM',
    createdDate: '18 Jan 2026',
  },
  {
    id: 'WD-RSA-9946',
    name: 'Pieter Botha',
    email: 'p.botha@overbergfarms.co.za',
    phone: '+27 84 330 1982',
    status: 'DEACTIVATED',
    rewardStatus: 'NOT ASSIGNED',
    cashPrize: null,
    vehiclePrize: null,
    vehicleImage: null,
    claimCash: 'None',
    claimVehicle: 'None',
    claimActivity: 'NO CLAIM',
    createdDate: '15 Oct 2025',
  },
  {
    id: 'WD-RSA-9947',
    name: 'Nomvula Sithole',
    email: 'nomvula.s@durbanlogistics.co.za',
    phone: '+27 81 772 4099',
    status: 'ACTIVE',
    rewardStatus: 'ASSIGNED',
    cashPrize: 'R150,000 ZAR',
    vehiclePrize: '2026 Ford Ranger 3.0 V6 Wildtrak',
    vehicleImage: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
    claimCash: 'REQUIREMENT PENDING',
    claimVehicle: 'REQUIREMENT PENDING',
    claimActivity: 'REQUIREMENT PENDING',
    createdDate: '04 Jan 2026',
  },
  {
    id: 'WD-RSA-9948',
    name: 'Farhad Patel',
    email: 'farhad.patel@joburgfin.co.za',
    phone: '+27 72 109 4432',
    status: 'REJECTED',
    rewardStatus: 'NOT ASSIGNED',
    cashPrize: null,
    vehiclePrize: null,
    vehicleImage: null,
    claimCash: 'None',
    claimVehicle: 'None',
    claimActivity: 'NO CLAIM',
    createdDate: '02 Jan 2026',
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
 * Normalize and retrieve all users from persistent storage
 */
export function getAllUsers() {
  try {
    const raw = localStorage.getItem(ADMIN_USERS_STORAGE_KEY);
    let users = [];
    if (!raw) {
      users = [...INITIAL_USERS];
      localStorage.setItem(ADMIN_USERS_STORAGE_KEY, JSON.stringify(users));
    } else {
      users = JSON.parse(raw);
    }

    // Sync any newly registered users from public mockAuth system that don't yet exist in the admin list
    try {
      const authUsers = getStoredUsers();
      let hasNew = false;
      authUsers.forEach((au) => {
        if (au.role === 'admin') return; // Skip internal admin accounts from citizen user registry
        const exists = users.some(
          (u) => u.email.toLowerCase() === au.email.toLowerCase() || (au.memberId && u.id === au.memberId)
        );
        if (!exists) {
          const newUserObj = {
            id: au.memberId || `WD-RSA-${Math.floor(1000 + Math.random() * 9000)}`,
            name: au.fullName || 'Registered User',
            email: au.email,
            phone: au.mobile || '+27 82 000 0000',
            status: au.status || 'PENDING REVIEW',
            rewardStatus: au.rewardAssigned ? 'ASSIGNED' : 'NOT ASSIGNED',
            cashPrize: au.rewardAssigned?.includes('Cash') ? au.rewardAssigned : null,
            vehiclePrize: au.rewardAssigned?.includes('Toyota') || au.rewardAssigned?.includes('BMW') ? au.rewardAssigned : null,
            vehicleImage: null,
            claimCash: 'None',
            claimVehicle: 'None',
            claimActivity: 'NO CLAIM',
            createdDate: formatDateDisplay(au.createdAt),
          };
          users.unshift(newUserObj);
          hasNew = true;
        }
      });
      if (hasNew) {
        localStorage.setItem(ADMIN_USERS_STORAGE_KEY, JSON.stringify(users));
      }
    } catch (err) {
      console.warn('Sync with auth users warning:', err);
    }

    return users;
  } catch (e) {
    console.error('Error getting admin users:', e);
    return [...INITIAL_USERS];
  }
}

/**
 * Get a specific user by their ID
 */
export function getUserById(id) {
  const users = getAllUsers();
  return users.find((u) => u.id === id) || null;
}

/**
 * Update user account status (e.g. APPROVED, REJECTED, ACTIVE, DEACTIVATED)
 */
export function updateUserAccountStatus(id, newStatus, adminNote = '') {
  const users = getAllUsers();
  const index = users.findIndex((u) => u.id === id);
  if (index === -1) {
    return { success: false, error: 'User not found' };
  }

  const prevStatus = users[index].status;
  users[index].status = newStatus;
  users[index].updatedDate = formatDateDisplay(new Date());

  try {
    localStorage.setItem(ADMIN_USERS_STORAGE_KEY, JSON.stringify(users));

    // Also sync to auth storage if matching user exists
    try {
      const authRaw = localStorage.getItem('windrive_registered_users');
      if (authRaw) {
        const authUsers = JSON.parse(authRaw);
        const aIdx = authUsers.findIndex((au) => au.email.toLowerCase() === users[index].email.toLowerCase());
        if (aIdx >= 0) {
          authUsers[aIdx].status = newStatus;
          localStorage.setItem('windrive_registered_users', JSON.stringify(authUsers));
        }
      }
    } catch (e) {}

    // Record in administrative audit ledger
    recordAdminActivity({
      action: `User Status Updated (${newStatus})`,
      admin: 'Operations Lead',
      adminId: 'WD-HQ-001',
      reference: `User #${users[index].id}`,
      referenceNote: `${users[index].name} status changed from ${prevStatus} to ${newStatus}${adminNote ? ` (${adminNote})` : ''}`,
      status: newStatus === 'APPROVED' || newStatus === 'ACTIVE' ? 'APPROVED' : newStatus === 'REJECTED' ? 'REJECTED' : 'UPDATED',
      statusColor: newStatus === 'APPROVED' || newStatus === 'ACTIVE' ? 'emerald' : newStatus === 'REJECTED' ? 'rose' : 'amber',
    });

    return { success: true, user: users[index] };
  } catch (e) {
    console.error('Error saving updated status:', e);
    return { success: false, error: 'Failed to update user status in storage' };
  }
}

/**
 * Update user profile details (Name, Email, Phone)
 */
export function updateUserProfile(id, { name, email, phone }) {
  const users = getAllUsers();
  const index = users.findIndex((u) => u.id === id);
  if (index === -1) {
    return { success: false, error: 'User not found' };
  }

  const prevEmail = users[index].email;
  const emailChanged = prevEmail.toLowerCase() !== email.trim().toLowerCase();

  users[index].name = name.trim();
  users[index].email = email.trim().toLowerCase();
  users[index].phone = phone.trim();
  users[index].updatedDate = formatDateDisplay(new Date());

  try {
    localStorage.setItem(ADMIN_USERS_STORAGE_KEY, JSON.stringify(users));

    recordAdminActivity({
      action: 'User Profile Updated',
      admin: 'Operations Lead',
      adminId: 'WD-HQ-001',
      reference: `User #${users[index].id}`,
      referenceNote: `Updated profile details for ${users[index].name}${emailChanged ? ' (Email changed)' : ''}`,
      status: 'UPDATED',
      statusColor: 'sky',
    });

    return {
      success: true,
      user: users[index],
      emailChanged,
    };
  } catch (e) {
    console.error('Error saving user profile update:', e);
    return { success: false, error: 'Failed to update profile' };
  }
}

/**
 * Create a new user record in the administrative registry
 */
export function createAdminUser({ name, email, phone, status = 'APPROVED', rewardStatus = 'NOT ASSIGNED' }) {
  const users = getAllUsers();

  const newId = `WD-RSA-${Math.floor(1000 + Math.random() * 9000)}`;
  const dateStr = formatDateDisplay(new Date());

  const newUser = {
    id: newId,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    phone: phone.trim(),
    status: status,
    rewardStatus: rewardStatus,
    cashPrize: null,
    vehiclePrize: null,
    vehicleImage: null,
    claimCash: 'None',
    claimVehicle: 'None',
    claimActivity: 'NO CLAIM',
    createdDate: dateStr,
  };

  users.unshift(newUser);

  try {
    localStorage.setItem(ADMIN_USERS_STORAGE_KEY, JSON.stringify(users));

    recordAdminActivity({
      action: 'User Account Created',
      admin: 'Operations Lead',
      adminId: 'WD-HQ-001',
      reference: `User #${newId}`,
      referenceNote: `Manually enrolled ${newUser.name} into National Registry (Status: ${status})`,
      status: 'CREATED',
      statusColor: 'emerald',
    });

    return { success: true, user: newUser };
  } catch (e) {
    console.error('Error creating user:', e);
    return { success: false, error: 'Failed to save new user' };
  }
}

/**
 * Calculate user count summary metrics directly from the current data source
 * (No invented or fake metrics)
 */
export function getUserMetrics(userList = null) {
  const users = userList || getAllUsers();
  const total = users.length;
  const pendingReview = users.filter((u) => u.status === 'PENDING REVIEW').length;
  const approved = users.filter((u) => u.status === 'APPROVED').length;
  const active = users.filter((u) => u.status === 'ACTIVE').length;
  const approvedOrActive = users.filter((u) => u.status === 'APPROVED' || u.status === 'ACTIVE').length;
  const rejected = users.filter((u) => u.status === 'REJECTED').length;
  const deactivated = users.filter((u) => u.status === 'DEACTIVATED' || u.status === 'INACTIVE').length;
  const rejectedOrDeactivated = users.filter(
    (u) => u.status === 'REJECTED' || u.status === 'DEACTIVATED' || u.status === 'INACTIVE'
  ).length;

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
