// WinDriveSA Reward & Claim Service Abstraction
// Conceptually separates User, Account Status, Reward, Cash Prize, Vehicle Prize, and Claim
// Compatible with future Supabase database schema

const REWARDS_STORAGE_PREFIX = 'windrive_rewards_';
const CLAIMS_STORAGE_PREFIX = 'windrive_claims_';

// Default configured institutional rewards for an approved active portfolio
export const DEFAULT_INITIAL_REWARDS = {
  cash: {
    allocationId: 'WD-CP-77402',
    cash_amount: 250000,
    cash_currency: 'ZAR',
    disbursement_method: 'EFT (Verified SA Bank)',
    processing_window: '2–3 Business Days',
    reward_status: 'ACTIVE', // NOT ASSIGNED | ASSIGNED | ACTIVE | COMPLETED
    claim_status: 'CLAIM AVAILABLE', // CLAIM AVAILABLE | SUBMITTED | UNDER REVIEW | APPROVED | REQUIREMENT PENDING | PROCESSING | FULFILLED
  },
  vehicle: {
    allocationId: 'WD-VK-55912',
    vehicle_make: 'Toyota',
    vehicle_model: 'Hilux',
    vehicle_year: 2026,
    vehicle_edition: 'Double-Cab 4x4, White Showroom Spec',
    vehicle_image: '/images/windrivesa-hilux-white-01.jpg',
    registration: 'Brand New (2026)',
    handover_hub: 'Gauteng Hub / Regional',
    review_window: '2–3 Business Days',
    review_type: 'Manual Compliance',
    audit_certificate: 'Compliant & Cleared',
    specs: ['New Delivery', 'Warranty Included'],
    delivery_note: 'RSA National Fleet',
    reward_status: 'ACTIVE',
    claim_status: 'CLAIM AVAILABLE',
  },
  applicable_charge: {
    has_charge: false,
    amount: 1850,
    currency: 'ZAR',
    category: 'Logistics Administration',
    title: 'Flatbed Transport & Title Transfer',
    description: 'Administrative transit registration, pre-delivery inspection documentation, and cross-provincial escrow release sign-off.',
    assurance: 'This is an administrative logistics coordination requirement strictly governed by courier transport standards. WinDriveSA does NOT charge unannounced statutory taxes or hidden prize fees.',
  },
};

/**
 * Format currency in South African Rand (ZAR)
 */
export function formatZAR(amount) {
  if (typeof amount !== 'number') return amount;
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Retrieve assigned rewards for a user
 * Returns null if user account is PENDING REVIEW or has no rewards assigned
 */
export function getUserRewards(user) {
  if (!user) return null;

  // In production, do not return mock/default fake rewards
  if (import.meta.env.PROD) {
    return null;
  }

  // Rule: Do NOT return or expose reward details if user status is PENDING REVIEW or REJECTED
  if (user.status === 'PENDING REVIEW' || user.status === 'REJECTED') {
    return null;
  }

  const storageKey = `${REWARDS_STORAGE_PREFIX}${user.id}`;
  try {
    let rewards = { ...DEFAULT_INITIAL_REWARDS };
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      try {
        rewards = { ...DEFAULT_INITIAL_REWARDS, ...JSON.parse(raw) };
      } catch (e) {
        rewards = { ...DEFAULT_INITIAL_REWARDS };
      }
    }

    // 1. Sync from windrive_admin_rewards_list (Admin reward allocations)
    try {
      const adminRewardsRaw = localStorage.getItem('windrive_admin_rewards_list');
      if (adminRewardsRaw) {
        const adminRewards = JSON.parse(adminRewardsRaw);
        const match = adminRewards.find(
          (r) =>
            r.userId === user.id ||
            r.userId === user.memberId ||
            (r.userEmail && user.email && r.userEmail.toLowerCase() === user.email.toLowerCase()) ||
            (r.userName && user.fullName && r.userName.toLowerCase() === user.fullName.toLowerCase())
        );
        if (match) {
          if (match.cashAmount) {
            rewards.cash = {
              ...rewards.cash,
              cash_amount: Number(match.cashAmount),
              reward_status: match.status || rewards.cash.reward_status || 'ACTIVE',
              claim_status: match.cashClaimStatus || rewards.cash.claim_status || 'CLAIM AVAILABLE',
            };
          }
          if (match.vehicleModel) {
            rewards.vehicle = {
              ...rewards.vehicle,
              vehicle_make: match.vehicleMake || rewards.vehicle.vehicle_make || 'Toyota',
              vehicle_model: match.vehicleModel,
              vehicle_year: match.vehicleYear || rewards.vehicle.vehicle_year || 2026,
              vehicle_image: match.vehicleImage || rewards.vehicle.vehicle_image,
              reward_status: match.status || rewards.vehicle.reward_status || 'ACTIVE',
              claim_status: match.vehicleClaimStatus || rewards.vehicle.claim_status || 'CLAIM AVAILABLE',
            };
          }
        }
      }
    } catch (adminSyncErr) {
      console.warn('Admin rewards sync notice:', adminSyncErr);
    }

    // 2. Sync applicable charge from windrive_claim_requirements_config
    try {
      const reqRaw = localStorage.getItem('windrive_claim_requirements_config');
      if (reqRaw) {
        const reqConfig = JSON.parse(reqRaw);
        const vehicleReq = reqConfig.vehicle;
        if (vehicleReq) {
          const isEnabled = vehicleReq.enabled === true || vehicleReq.status === 'ENABLED';
          rewards.applicable_charge = {
            has_charge: Boolean(isEnabled && (vehicleReq.applicableCharge > 0)),
            amount: vehicleReq.applicableCharge !== undefined ? vehicleReq.applicableCharge : 3500,
            currency: vehicleReq.currency || 'ZAR',
            category: vehicleReq.category || 'Logistics Administration',
            title: vehicleReq.claimType || 'Provincial Carrier & Logistics Administration',
            description: vehicleReq.description || 'Provincial logistics dispatch, pre-delivery vehicle inspection, and registered carrier coordination fee.',
            assurance: 'This is an administrative logistics coordination requirement strictly governed by courier transport standards. WinDriveSA does NOT charge unannounced statutory taxes or hidden prize fees.',
          };
        }
      }
    } catch (reqSyncErr) {
      console.warn('Claim requirements sync notice:', reqSyncErr);
    }

    // 3. Sync claim statuses from user claims list
    try {
      const userClaims = getUserClaims(user.id);
      const cashClaim = userClaims.find((c) => c.type === 'cash');
      const vehicleClaim = userClaims.find((c) => c.type === 'vehicle');
      if (cashClaim) {
        rewards.cash.claim_status = cashClaim.status;
      }
      if (vehicleClaim) {
        rewards.vehicle.claim_status = vehicleClaim.status;
      }
    } catch (claimSyncErr) {
      console.warn('User claims sync notice:', claimSyncErr);
    }

    localStorage.setItem(storageKey, JSON.stringify(rewards));
    return rewards;
  } catch (e) {
    console.error('Error fetching user rewards:', e);
    return DEFAULT_INITIAL_REWARDS;
  }
}

/**
 * Admin updates for assigned reward data (allows changing cash amount or vehicle details)
 */
export function updateUserRewards(userId, updatedData) {
  const storageKey = `${REWARDS_STORAGE_PREFIX}${userId}`;
  try {
    const current = getUserRewards({ id: userId, status: 'APPROVED' }) || DEFAULT_INITIAL_REWARDS;
    const merged = { ...current, ...updatedData };
    localStorage.setItem(storageKey, JSON.stringify(merged));
    return merged;
  } catch (e) {
    console.error('Error updating rewards:', e);
    return null;
  }
}

/**
 * Retrieve user's claim activity
 */
export function getUserClaims(userId) {
  if (!userId) return [];
  const storageKey = `${CLAIMS_STORAGE_PREFIX}${userId}`;
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error fetching user claims:', e);
    return [];
  }
}

/**
 * Record a new claim request for cash or vehicle
 */
export function recordClaimRequest(userId, claimData) {
  const storageKey = `${CLAIMS_STORAGE_PREFIX}${userId}`;
  try {
    const currentClaims = getUserClaims(userId);
    const newClaim = {
      id: `WD-CLM-${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString(),
      status: 'UNDER REVIEW',
      ...claimData,
    };
    const updated = [newClaim, ...currentClaims];
    localStorage.setItem(storageKey, JSON.stringify(updated));

    // Update reward claim_status in user rewards record
    const rewardsKey = `${REWARDS_STORAGE_PREFIX}${userId}`;
    const rewardsRaw = localStorage.getItem(rewardsKey);
    if (rewardsRaw) {
      const rewards = JSON.parse(rewardsRaw);
      if (claimData.type === 'cash') {
        rewards.cash.claim_status = claimData.status || 'UNDER REVIEW';
      } else if (claimData.type === 'vehicle') {
        rewards.vehicle.claim_status = claimData.status || 'UNDER REVIEW';
      }
      localStorage.setItem(rewardsKey, JSON.stringify(rewards));
    }

    // Also sync to windrive_admin_claims_list so admin sees it in /admin/claims
    try {
      const adminClaimsRaw = localStorage.getItem('windrive_admin_claims_list');
      const adminClaims = adminClaimsRaw ? JSON.parse(adminClaimsRaw) : [];
      const userRaw = localStorage.getItem('windrive_current_user') || sessionStorage.getItem('windrive_current_user');
      const currentUser = userRaw ? JSON.parse(userRaw) : null;

      const adminClaim = {
        id: newClaim.id,
        userId: userId,
        userName: currentUser?.fullName || claimData.deliveryDetails?.fullName || 'Claimant',
        userEmail: currentUser?.email || 'claimant@windrivesa.co.za',
        userPhone: currentUser?.mobile || claimData.deliveryDetails?.mobileNumber || '+27 82 000 0000',
        accountStatus: currentUser?.status || 'APPROVED',
        type: claimData.type === 'vehicle' ? 'Vehicle Prize' : 'Cash Prize',
        prizeName: claimData.type === 'vehicle'
          ? ([claimData.vehicleYear, claimData.vehicleMake, claimData.vehicleModel].filter(Boolean).join(' ') || 'Assigned Vehicle Prize')
          : (claimData.amount ? `R ${Number(claimData.amount).toLocaleString('en-US')}` : 'Assigned Cash Prize'),
        submittedDate: new Date().toISOString().slice(0, 16).replace('T', ' '),
        updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
        status: newClaim.status || 'UNDER REVIEW',
        vehicleDetails: claimData.type === 'vehicle' ? claimData.deliveryDetails : null,
        cashDetails: claimData.type === 'cash' ? claimData.bankDetails : null,
        timeline: [
          {
            event: 'Claim Submitted',
            date: new Date().toISOString().slice(0, 16).replace('T', ' '),
            note: claimData.type === 'vehicle' ? 'Claimant submitted physical delivery documentation' : 'Bank settlement coordinates submitted',
          },
          {
            event: 'Under Review',
            date: new Date().toISOString().slice(0, 16).replace('T', ' '),
            note: 'Allocated to compliance registrar queue',
          },
        ],
      };
      const existingAdminIdx = adminClaims.findIndex((ac) => ac.id === newClaim.id);
      if (existingAdminIdx >= 0) {
        adminClaims[existingAdminIdx] = { ...adminClaims[existingAdminIdx], ...adminClaim };
      } else {
        adminClaims.unshift(adminClaim);
      }
      localStorage.setItem('windrive_admin_claims_list', JSON.stringify(adminClaims));
    } catch (adminPushErr) {
      console.warn('Sync claim to admin queue notice:', adminPushErr);
    }

    return newClaim;
  } catch (e) {
    console.error('Error recording claim:', e);
    return null;
  }
}

/**
 * Specifically submit a cash prize claim with validated bank details
 */
export function submitCashPrizeClaim(userId, bankDetails, cashReward) {
  const claimData = {
    type: 'cash',
    title: `Cash Prize Claim Submitted (${formatZAR(cashReward.cash_amount)} ${cashReward.cash_currency})`,
    amount: cashReward.cash_amount,
    currency: cashReward.cash_currency,
    payoutReference: cashReward.allocationId || 'WD-CP-77402',
    bankDetails: {
      accountHolder: bankDetails.accountHolder,
      bankName: bankDetails.bankName,
      accountType: bankDetails.accountType,
      branchCode: bankDetails.branchCode,
      maskedAccountNumber: `••••••${(bankDetails.accountNumber || '').slice(-4)}`,
    },
    status: 'UNDER REVIEW',
    step: 2,
    timestampFormatted: `${new Date().toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })} SAST`,
  };

  return recordClaimRequest(userId, claimData);
}

/**
 * Retrieve existing cash claim if user already submitted one
 */
export function getActiveCashClaim(userId) {
  const claims = getUserClaims(userId);
  return claims.find((c) => c.type === 'cash') || null;
}

/**
 * Specifically submit a vehicle prize claim with verified physical delivery details
 */
export function submitVehicleClaim(userId, deliveryDetails, vehicleReward) {
  const vehicleName = `${vehicleReward.vehicle_year || 2026} ${vehicleReward.vehicle_make || 'Toyota'} ${vehicleReward.vehicle_model || 'Hilux'}`;
  const claimData = {
    type: 'vehicle',
    title: `Vehicle Delivery Claim Submitted (${vehicleName})`,
    vehicleMake: vehicleReward.vehicle_make || 'Toyota',
    vehicleModel: vehicleReward.vehicle_model || 'Hilux',
    vehicleYear: vehicleReward.vehicle_year || 2026,
    allocationId: vehicleReward.allocationId || 'WD-VK-55912',
    deliveryDetails: {
      fullName: deliveryDetails.fullName,
      mobileNumber: deliveryDetails.mobileNumber,
      deliveryAddress: deliveryDetails.deliveryAddress,
      city: deliveryDetails.city,
      province: deliveryDetails.province,
      postalCode: deliveryDetails.postalCode,
      preferredContact: deliveryDetails.preferredContact || 'Self',
    },
    status: 'UNDER REVIEW',
    step: 2,
    submittedAt: new Date().toISOString(),
    timestampFormatted: `${new Date().toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })} SAST`,
  };

  return recordClaimRequest(userId, claimData);
}

/**
 * Retrieve existing vehicle claim if user already submitted one
 */
export function getActiveVehicleClaim(userId) {
  const claims = getUserClaims(userId);
  return claims.find((c) => c.type === 'vehicle') || null;
}

/**
 * Update delivery information for an existing vehicle claim (e.g. if MORE INFORMATION REQUIRED)
 */
export function updateVehicleClaimDetails(userId, claimId, updatedDetails) {
  const storageKey = `${CLAIMS_STORAGE_PREFIX}${userId}`;
  try {
    const claims = getUserClaims(userId);
    const updated = claims.map((c) => {
      if (c.id === claimId || (!claimId && c.type === 'vehicle')) {
        return {
          ...c,
          deliveryDetails: { ...c.deliveryDetails, ...updatedDetails },
          status: 'UNDER REVIEW',
          updatedAt: new Date().toISOString(),
        };
      }
      return c;
    });
    localStorage.setItem(storageKey, JSON.stringify(updated));

    // Update reward state
    const rewardsKey = `${REWARDS_STORAGE_PREFIX}${userId}`;
    const rewardsRaw = localStorage.getItem(rewardsKey);
    if (rewardsRaw) {
      const rewards = JSON.parse(rewardsRaw);
      if (rewards.vehicle) {
        rewards.vehicle.claim_status = 'UNDER REVIEW';
        localStorage.setItem(rewardsKey, JSON.stringify(rewards));
      }
    }

    return updated.find((c) => c.id === claimId || c.type === 'vehicle');
  } catch (e) {
    console.error('Error updating vehicle claim:', e);
    return null;
  }
}

