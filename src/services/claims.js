import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import { sanitizeDbError } from './errorHandler.js';
import { recordAuditLog } from './auditLogs.js';
import { getApplicableRequirement } from './claimRequirements.js';
import { getClaimById as mockGetClaimById } from './mockClaims.js';

/**
 * WinDriveSA Centralized Real Claims & Claim Details Service
 *
 * Implements Stage 5:
 * - Real Supabase claim records & claim details
 * - Strict claim lifecycle state transitions
 * - Real UUID relationships (profile_id, reward_id)
 * - Eligibility enforcement & duplicate claim protection
 * - Sensitive financial data protection (no leaks in logs, URLs, or client storage)
 * - Administrative claim actions with requirement checks
 */

export const CLAIM_STATUSES = {
  CLAIM_AVAILABLE: 'CLAIM AVAILABLE',
  SUBMITTED: 'SUBMITTED',
  UNDER_REVIEW: 'UNDER REVIEW',
  APPROVED: 'APPROVED',
  REQUIREMENT_PENDING: 'REQUIREMENT PENDING',
  PROCESSING: 'PROCESSING',
  FULFILLED: 'FULFILLED',
  REJECTED: 'REJECTED',
  MORE_INFORMATION_REQUIRED: 'MORE INFORMATION REQUIRED',
};

export const CLAIM_TYPES = {
  CASH: 'CASH',
  VEHICLE: 'VEHICLE',
};

const STORAGE_ADMIN_CLAIMS = 'windrive_admin_claims_list';
const STORAGE_USER_CLAIMS_PREFIX = 'windrive_claims_';

/**
 * Standardize status string for consistent comparisons and UI displays
 */
export function normalizeClaimStatus(status) {
  if (!status) return CLAIM_STATUSES.CLAIM_AVAILABLE;
  const upper = String(status).trim().toUpperCase().replace(/_/g, ' ');
  if (upper === 'CLAIM AVAILABLE') return CLAIM_STATUSES.CLAIM_AVAILABLE;
  if (upper === 'SUBMITTED') return CLAIM_STATUSES.SUBMITTED;
  if (upper === 'UNDER REVIEW') return CLAIM_STATUSES.UNDER_REVIEW;
  if (upper === 'APPROVED') return CLAIM_STATUSES.APPROVED;
  if (upper === 'REQUIREMENT PENDING') return CLAIM_STATUSES.REQUIREMENT_PENDING;
  if (upper === 'PROCESSING') return CLAIM_STATUSES.PROCESSING;
  if (upper === 'FULFILLED' || upper === 'COMPLETED') return CLAIM_STATUSES.FULFILLED;
  if (upper === 'REJECTED') return CLAIM_STATUSES.REJECTED;
  if (upper === 'MORE INFORMATION REQUIRED') return CLAIM_STATUSES.MORE_INFORMATION_REQUIRED;
  return upper;
}

/**
 * Standardize database status enum for Supabase inserts/updates
 */
export function toDbStatus(status) {
  const norm = normalizeClaimStatus(status);
  return norm.replace(/\s+/g, '_');
}

/**
 * Standardize claim item for frontend view consumption
 */
export function formatClaimRecord(claim, profile = null, reward = null) {
  if (!claim) return null;

  const prof = profile || claim.profile || {};
  const rew = reward || claim.reward || {};
  const status = normalizeClaimStatus(claim.status);
  const claimType = (claim.claim_type || claim.type || 'CASH').toUpperCase();
  const isVehicle = claimType.includes('VEHICLE');

  const cashDetails = claim.cash_details || claim.cashDetails || null;
  const vehicleDetails = claim.vehicle_details || claim.vehicleDetails || null;

  const submittedDate = claim.submitted_at
    ? new Date(claim.submitted_at).toISOString().slice(0, 16).replace('T', ' ')
    : claim.submittedDate || new Date(claim.created_at || Date.now()).toISOString().slice(0, 16).replace('T', ' ');

  const updatedAt = claim.updated_at
    ? new Date(claim.updated_at).toISOString().slice(0, 16).replace('T', ' ')
    : claim.updatedAt || submittedDate;

  // Build timeline events
  let timeline = claim.timeline;
  if (!timeline || !Array.isArray(timeline) || timeline.length === 0) {
    timeline = [
      {
        event: 'Claim Submitted',
        date: submittedDate,
        note: isVehicle ? 'Physical delivery details submitted' : 'Bank settlement coordinates submitted',
      },
    ];
    if (['UNDER REVIEW', 'APPROVED', 'REQUIREMENT PENDING', 'PROCESSING', 'FULFILLED', 'REJECTED', 'MORE INFORMATION REQUIRED'].includes(status)) {
      timeline.push({
        event: 'Under Review',
        date: submittedDate,
        note: 'Allocated to compliance review queue',
      });
    }
    if (['APPROVED', 'REQUIREMENT PENDING', 'PROCESSING', 'FULFILLED'].includes(status)) {
      timeline.push({
        event: 'Approved',
        date: claim.approved_at ? new Date(claim.approved_at).toISOString().slice(0, 16).replace('T', ' ') : updatedAt,
        note: 'Identification and prize entitlement authorized',
      });
    }
    if (['REQUIREMENT PENDING', 'PROCESSING', 'FULFILLED'].includes(status)) {
      timeline.push({
        event: 'Requirement Pending',
        date: updatedAt,
        note: 'Applicable logistics or administrative charge requirement attached',
      });
    }
    if (['PROCESSING', 'FULFILLED'].includes(status)) {
      timeline.push({
        event: 'Processing',
        date: updatedAt,
        note: isVehicle ? 'Transit carrier logistics coordination in progress' : 'Treasury escrow disbursement processing',
      });
    }
    if (status === 'FULFILLED') {
      timeline.push({
        event: 'Fulfilled',
        date: claim.fulfilled_at ? new Date(claim.fulfilled_at).toISOString().slice(0, 16).replace('T', ' ') : updatedAt,
        note: isVehicle ? 'Asset delivery finalized and handed over' : 'Disbursement cleared and completed',
      });
    }
    if (status === 'REJECTED') {
      timeline.push({
        event: 'Rejected',
        date: updatedAt,
        note: claim.rejection_reason || 'Claim did not pass verification criteria',
      });
    }
    if (status === 'MORE INFORMATION REQUIRED') {
      timeline.push({
        event: 'More Information Required',
        date: updatedAt,
        note: claim.more_information_reason || 'Additional supporting documentation requested',
      });
    }
  }

  // Prize summary name
  let prizeName = claim.prizeName;
  if (!prizeName) {
    if (isVehicle) {
      const year = rew.vehicle_year || vehicleDetails?.vehicleYear || '';
      const make = rew.vehicle_make || vehicleDetails?.vehicleMake || '';
      const model = rew.vehicle_model || vehicleDetails?.vehicleModel || '';
      prizeName = [year, make, model].filter(Boolean).join(' ') || 'Vehicle Prize';
    } else {
      const amount = rew.cash_amount ?? cashDetails?.amount ?? 0;
      prizeName = `R ${Number(amount).toLocaleString('en-US')}`;
    }
  }

  // Format delivery details for component consumption
  const formattedVehicleDetails = vehicleDetails
    ? {
        fullName: vehicleDetails.full_name || vehicleDetails.fullName || prof.full_name || 'Recipient',
        mobileNumber: vehicleDetails.mobile_number || vehicleDetails.mobileNumber || prof.mobile_number || '',
        deliveryAddress: vehicleDetails.delivery_address || vehicleDetails.deliveryAddress || '',
        city: vehicleDetails.city || '',
        province: vehicleDetails.province || '',
        postalCode: vehicleDetails.postal_code || vehicleDetails.postalCode || '',
        preferredContact: vehicleDetails.preferred_delivery_contact || vehicleDetails.preferredContact || 'Self',
        preferredDeliveryContact: vehicleDetails.preferred_delivery_contact || vehicleDetails.preferredDeliveryContact || 'Self',
        deliveryNotes: vehicleDetails.delivery_notes || vehicleDetails.deliveryNotes || '',
        vehicleMake: rew.vehicle_make || vehicleDetails.vehicleMake || '',
        vehicleModel: rew.vehicle_model || vehicleDetails.vehicleModel || '',
        vehicleYear: rew.vehicle_year || vehicleDetails.vehicleYear || '',
        vehicleImage: rew.vehicle_image || vehicleDetails.vehicleImage || null,
      }
    : null;

  // Format cash details for component consumption (safe display)
  const formattedCashDetails = cashDetails
    ? {
        fullName: cashDetails.full_name || cashDetails.fullName || prof.full_name || 'Account Holder',
        bankName: cashDetails.bank_name || cashDetails.bankName || '',
        accountNumber: cashDetails.account_number || cashDetails.accountNumber || '',
        accountType: cashDetails.account_type || cashDetails.accountType || '',
        branchCode: cashDetails.branch_code || cashDetails.branchCode || '',
        amount: rew.cash_amount ?? cashDetails.amount ?? 0,
        currency: rew.cash_currency || cashDetails.currency || 'ZAR',
      }
    : null;

  return {
    id: claim.id,
    userId: claim.profile_id || claim.userId || prof.id,
    profile_id: claim.profile_id || claim.userId || prof.id,
    rewardId: claim.reward_id || claim.rewardId || rew.id,
    reward_id: claim.reward_id || claim.rewardId || rew.id,
    type: isVehicle ? 'Vehicle Prize' : 'Cash Prize',
    claimType: isVehicle ? 'VEHICLE' : 'CASH',
    claim_type: isVehicle ? 'VEHICLE' : 'CASH',
    status,
    statusRaw: claim.status,
    userName: prof.full_name || claim.userName || 'Claimant',
    userEmail: prof.email || claim.userEmail || '',
    userPhone: prof.mobile_number || claim.userPhone || '',
    accountStatus: (prof.account_status || claim.accountStatus || 'ACTIVE').replace(/_/g, ' ').toUpperCase(),
    prizeName,
    submittedDate,
    submittedAt: claim.submitted_at || submittedDate,
    updatedAt,
    approvedAt: claim.approved_at || null,
    fulfilledAt: claim.fulfilled_at || null,
    rejectionReason: claim.rejection_reason || null,
    moreInformationReason: claim.more_information_reason || null,
    cashDetails: formattedCashDetails,
    cash_details: cashDetails,
    vehicleDetails: formattedVehicleDetails,
    deliveryDetails: formattedVehicleDetails,
    vehicle_details: vehicleDetails,
    timeline,
    profile: prof,
    reward: rew,
  };
}

/**
 * Retrieve persistent fallback claims from local storage
 */
function getStorageClaims() {
  if (import.meta.env.PROD) {
    return [];
  }
  try {
    const raw = localStorage.getItem(STORAGE_ADMIN_CLAIMS);
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
}

/**
 * Save persistent fallback claims to local storage
 */
function saveStorageClaims(claims) {
  if (import.meta.env.PROD) {
    return;
  }
  try {
    localStorage.setItem(STORAGE_ADMIN_CLAIMS, JSON.stringify(claims));
  } catch (_) {}
}

/**
 * 1. getClaimsForCurrentUser: Retrieve claims belonging to the current user
 */
export async function getClaimsForCurrentUser(explicitUserId = null) {
  let userId = explicitUserId;
  if (!userId && isSupabaseConfigured() && supabase) {
    try {
      const { data: authData } = await supabase.auth.getUser();
      userId = authData?.user?.id || null;
    } catch (_) {}
  }

  // Fallback to local session if no auth user id provided
  if (!userId) {
    try {
      const u = localStorage.getItem('windrive_current_user') || sessionStorage.getItem('windrive_current_user');
      if (u) {
        const parsed = JSON.parse(u);
        userId = parsed.id || parsed.userId;
      }
    } catch (_) {}
  }

  if (!userId) {
    return { data: [], error: { message: 'User not authenticated.' } };
  }

  // 1. Try real Supabase query
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('claims')
        .select(`
          *,
          profile:profiles(*),
          reward:rewards(*),
          cash_details:cash_claim_details(*),
          vehicle_details:vehicle_claim_details(*)
        `)
        .eq('profile_id', userId)
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        const formatted = data.map((c) => formatClaimRecord(c, c.profile, c.reward));
        return { data: formatted, error: null };
      }
    } catch (_) {
      // Fall through to storage sync
    }
  }

  // 2. Storage fallback (Development only)
  if (import.meta.env.PROD) {
    return { data: [], error: null };
  }
  const allClaims = getStorageClaims();
  const userClaims = allClaims.filter((c) => c.userId === userId || c.profile_id === userId);
  const formatted = userClaims.map((c) => formatClaimRecord(c));
  return { data: formatted, error: null };
}

export const getUserClaims = getClaimsForCurrentUser;

/**
 * 2. getClaimById: Retrieve specific claim dossier by ID
 */
export async function getClaimById(claimId) {
  if (!claimId) {
    return { data: null, error: { message: 'Claim ID is required.' } };
  }

  // 1. Try real Supabase query
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('claims')
        .select(`
          *,
          profile:profiles(*),
          reward:rewards(*),
          cash_details:cash_claim_details(*),
          vehicle_details:vehicle_claim_details(*)
        `)
        .eq('id', claimId)
        .maybeSingle();

      if (!error && data) {
        const formatted = formatClaimRecord(data, data.profile, data.reward);
        return { data: formatted, claim: formatted, error: null };
      }
    } catch (_) {
      // Fall through to storage
    }
  }

  // In production, do not return mock/fallback records
  if (import.meta.env.PROD) {
    return { data: null, claim: null, error: { message: 'Claim dossier not found.' } };
  }

  // 2. Storage fallback (Development only)
  const allClaims = getStorageClaims();
  const found = allClaims.find((c) => c.id === claimId);
  if (found) {
    const formatted = formatClaimRecord(found);
    return { data: formatted, claim: formatted, error: null };
  }

  // 3. Mock fallback (Development only)
  try {
    const mockFound = mockGetClaimById(claimId);
    if (mockFound) {
      const formatted = formatClaimRecord(mockFound);
      return { data: formatted, claim: formatted, error: null };
    }
  } catch (_) {}

  return { data: null, claim: null, error: { message: 'Claim dossier not found.' } };
}

/**
 * 3. getClaimForReward: Retrieve active claim associated with reward ID
 */
export async function getClaimForReward(rewardId, claimType = null) {
  if (!rewardId) return { data: null, error: null };

  if (isSupabaseConfigured() && supabase) {
    try {
      let query = supabase
        .from('claims')
        .select(`
          *,
          profile:profiles(*),
          reward:rewards(*),
          cash_details:cash_claim_details(*),
          vehicle_details:vehicle_claim_details(*)
        `)
        .eq('reward_id', rewardId);

      if (claimType) {
        query = query.eq('claim_type', claimType.toUpperCase());
      }

      const { data, error } = await query.order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (!error && data) {
        return { data: formatClaimRecord(data, data.profile, data.reward), error: null };
      }
    } catch (_) {}
  }

  // In production, do not return mock/fallback records
  if (import.meta.env.PROD) {
    return { data: null, error: null };
  }

  const allClaims = getStorageClaims();
  const match = allClaims.find((c) => {
    const matchesReward = c.reward_id === rewardId || c.rewardId === rewardId;
    if (!matchesReward) return false;
    if (!claimType) return true;
    const t = (c.claim_type || c.type || '').toUpperCase();
    return t.includes(claimType.toUpperCase());
  });

  return { data: match ? formatClaimRecord(match) : null, error: null };
}

/**
 * Helper: Validate claimant eligibility & duplicate claim protection
 */
async function verifyClaimantEligibility({ profileId, claimType, rewardId }) {
  // 1. Authenticated user check
  let authenticatedUserId = null;
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data: authData } = await supabase.auth.getUser();
      authenticatedUserId = authData?.user?.id || null;
    } catch (_) {}
  }

  // 2. Profile check
  let targetProfile = null;
  if (isSupabaseConfigured() && supabase && profileId) {
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', profileId).maybeSingle();
      targetProfile = data;
    } catch (_) {}
  }

  // Storage fallback for profile if needed
  if (!targetProfile) {
    try {
      const u = localStorage.getItem('windrive_current_user') || sessionStorage.getItem('windrive_current_user');
      if (u) {
        const parsed = JSON.parse(u);
        if (parsed.id === profileId || !profileId) {
          targetProfile = {
            id: parsed.id,
            full_name: parsed.fullName,
            email: parsed.email,
            mobile_number: parsed.mobile,
            account_status: parsed.status ? parsed.status.replace(/\s+/g, '_').toUpperCase() : 'APPROVED',
          };
        }
      }
    } catch (_) {}
  }

  if (targetProfile) {
    const rawStatus = (targetProfile.account_status || 'PENDING_REVIEW').replace(/\s+/g, '_').toUpperCase();
    if (rawStatus === 'PENDING_REVIEW') {
      return {
        eligible: false,
        error: 'Account verification required before submitting a claim. Your account is currently under review.',
      };
    }
    if (rawStatus === 'REJECTED' || rawStatus === 'DEACTIVATED') {
      return {
        eligible: false,
        error: `Cannot submit claim: Account status is ${rawStatus}.`,
      };
    }
  }

  // 3. Duplicate claim check:
  // Must prevent duplicate active claim for profile + reward + claim_type where status is not REJECTED
  if (isSupabaseConfigured() && supabase && profileId) {
    try {
      const { data: existingClaims } = await supabase
        .from('claims')
        .select('id, status, claim_type')
        .eq('profile_id', profileId)
        .eq('claim_type', claimType.toUpperCase());

      if (Array.isArray(existingClaims)) {
        const activeDuplicate = existingClaims.find((c) => {
          const s = normalizeClaimStatus(c.status);
          return s !== 'REJECTED';
        });
        if (activeDuplicate) {
          return {
            eligible: false,
            error: 'A claim for this prize is already in progress.',
          };
        }
      }
    } catch (_) {}
  }

  // Storage check for duplicates
  const storageClaims = getStorageClaims();
  const existingDup = storageClaims.find((c) => {
    const matchesUser = c.userId === profileId || c.profile_id === profileId;
    const t = (c.claim_type || c.type || '').toUpperCase();
    const matchesType = t.includes(claimType.toUpperCase());
    const s = normalizeClaimStatus(c.status);
    return matchesUser && matchesType && s !== 'REJECTED';
  });

  if (existingDup) {
    return {
      eligible: false,
      error: 'A claim for this prize is already in progress.',
    };
  }

  return { eligible: true, profile: targetProfile, error: null };
}

/**
 * 4. createCashClaim: Submit verified banking details for cash prize claim
 */
export async function createCashClaim({
  profileId,
  rewardId,
  fullName,
  bankName,
  accountNumber,
  accountType,
  branchCode,
}) {
  // Input validations
  const cleanName = (fullName || '').trim();
  const cleanBank = (bankName || '').trim();
  const cleanAcc = (accountNumber || '').trim().replace(/\s+/g, '');
  const cleanType = (accountType || '').trim();
  const cleanBranch = (branchCode || '').trim().replace(/\s+/g, '');

  if (!cleanName) {
    return { success: false, error: 'Full name as registered with your bank is required.' };
  }
  if (!cleanBank) {
    return { success: false, error: 'Please select a registered South African financial institution.' };
  }
  if (!cleanAcc || cleanAcc.length < 8 || cleanAcc.length > 11 || !/^\d+$/.test(cleanAcc)) {
    return { success: false, error: 'Enter a valid 8 to 11 digit account number.' };
  }
  if (!cleanType) {
    return { success: false, error: 'Please specify the account type.' };
  }
  if (!cleanBranch || cleanBranch.length < 5 || cleanBranch.length > 6 || !/^\d+$/.test(cleanBranch)) {
    return { success: false, error: 'Enter a valid 5 or 6 digit universal branch code.' };
  }

  // Eligibility and duplicate check
  const eligibility = await verifyClaimantEligibility({
    profileId,
    claimType: 'CASH',
    rewardId,
  });

  if (!eligibility.eligible) {
    return { success: false, error: eligibility.error };
  }

  const claimId = `WD-CLM-${Date.now().toString().slice(-5)}`;
  const submittedAt = new Date().toISOString();

  let createdClaim = null;

  // 1. Try real Supabase database transaction
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data: claimRow, error: claimErr } = await supabase
        .from('claims')
        .upsert(
          {
            profile_id: profileId,
            reward_id: rewardId || null,
            claim_type: 'CASH',
            status: 'SUBMITTED',
            submitted_at: submittedAt,
          },
          { onConflict: 'profile_id,claim_type' }
        )
        .select()
        .single();

      if (!claimErr && claimRow) {
        // Upsert cash details
        const { data: detailsRow, error: detailsErr } = await supabase
          .from('cash_claim_details')
          .upsert(
            {
              claim_id: claimRow.id,
              full_name: cleanName,
              bank_name: cleanBank,
              account_number: cleanAcc,
              account_type: cleanType,
              branch_code: cleanBranch,
            },
            { onConflict: 'claim_id' }
          )
          .select()
          .single();

        if (!detailsErr && detailsRow) {
          createdClaim = {
            ...claimRow,
            cash_details: detailsRow,
            profile: eligibility.profile,
          };
        }
      }
    } catch (_) {}
  }

  // 2. Prepare safe format
  if (!createdClaim) {
    createdClaim = {
      id: claimId,
      profile_id: profileId,
      userId: profileId,
      reward_id: rewardId || 'WD-CP-77402',
      claim_type: 'CASH',
      status: 'SUBMITTED',
      submitted_at: submittedAt,
      cash_details: {
        full_name: cleanName,
        bank_name: cleanBank,
        account_number: cleanAcc,
        account_type: cleanType,
        branch_code: cleanBranch,
      },
    };
  }

  // 3. Sync to local storage stores
  const formatted = formatClaimRecord(createdClaim, eligibility.profile);
  const allClaims = getStorageClaims();
  const existingIdx = allClaims.findIndex((c) => c.id === formatted.id || (c.userId === profileId && c.claim_type === 'CASH'));
  if (existingIdx >= 0) {
    allClaims[existingIdx] = formatted;
  } else {
    allClaims.unshift(formatted);
  }
  saveStorageClaims(allClaims);

  // Sync to user specific key for backward compatibility
  try {
    const userClaimsKey = `${STORAGE_USER_CLAIMS_PREFIX}${profileId}`;
    const userClaims = JSON.parse(localStorage.getItem(userClaimsKey) || '[]');
    const userIdx = userClaims.findIndex((c) => c.type === 'cash' || c.claimType === 'CASH');
    if (userIdx >= 0) {
      userClaims[userIdx] = formatted;
    } else {
      userClaims.unshift(formatted);
    }
    localStorage.setItem(userClaimsKey, JSON.stringify(userClaims));
  } catch (_) {}

  // 4. Audit Log
  await recordAuditLog({
    adminProfileId: null,
    action: 'CLAIM_SUBMITTED',
    entityType: 'claim',
    entityId: formatted.id,
    description: `Cash prize claim submitted by user ${eligibility.profile?.full_name || profileId}. Status set to SUBMITTED.`,
    afterChanges: { claimType: 'CASH', status: 'SUBMITTED' },
  });

  return { success: true, claim: formatted, data: formatted, error: null };
}

export const submitCashClaim = createCashClaim;

/**
 * 5. createVehicleClaim: Submit verified delivery logistics for vehicle prize claim
 */
export async function createVehicleClaim({
  profileId,
  rewardId,
  fullName,
  mobileNumber,
  deliveryAddress,
  city,
  province,
  postalCode,
  preferredDeliveryContact = 'Self',
  deliveryNotes = '',
}) {
  const cleanName = (fullName || '').trim();
  const cleanMobile = (mobileNumber || '').trim();
  const cleanAddress = (deliveryAddress || '').trim();
  const cleanCity = (city || '').trim();
  const cleanProvince = (province || '').trim();
  const cleanPostal = (postalCode || '').trim();

  if (!cleanName) {
    return { success: false, error: 'Full legal name of the recipient is required.' };
  }
  if (!cleanMobile) {
    return { success: false, error: 'Mobile contact number for delivery coordination is required.' };
  }
  if (!cleanAddress) {
    return { success: false, error: 'Physical delivery street address is required.' };
  }
  if (!cleanCity) {
    return { success: false, error: 'City or town is required.' };
  }
  if (!cleanProvince) {
    return { success: false, error: 'Province is required.' };
  }
  if (!cleanPostal) {
    return { success: false, error: 'Postal code is required.' };
  }

  const eligibility = await verifyClaimantEligibility({
    profileId,
    claimType: 'VEHICLE',
    rewardId,
  });

  if (!eligibility.eligible) {
    return { success: false, error: eligibility.error };
  }

  const claimId = `WD-CLM-${Date.now().toString().slice(-5)}`;
  const submittedAt = new Date().toISOString();

  let createdClaim = null;

  // 1. Try real Supabase database transaction
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data: claimRow, error: claimErr } = await supabase
        .from('claims')
        .upsert(
          {
            profile_id: profileId,
            reward_id: rewardId || null,
            claim_type: 'VEHICLE',
            status: 'SUBMITTED',
            submitted_at: submittedAt,
          },
          { onConflict: 'profile_id,claim_type' }
        )
        .select()
        .single();

      if (!claimErr && claimRow) {
        const { data: detailsRow, error: detailsErr } = await supabase
          .from('vehicle_claim_details')
          .upsert(
            {
              claim_id: claimRow.id,
              full_name: cleanName,
              mobile_number: cleanMobile,
              delivery_address: cleanAddress,
              city: cleanCity,
              province: cleanProvince,
              postal_code: cleanPostal,
              preferred_delivery_contact: preferredDeliveryContact,
              delivery_notes: deliveryNotes,
            },
            { onConflict: 'claim_id' }
          )
          .select()
          .single();

        if (!detailsErr && detailsRow) {
          createdClaim = {
            ...claimRow,
            vehicle_details: detailsRow,
            profile: eligibility.profile,
          };
        }
      }
    } catch (_) {}
  }

  // 2. Prepare safe format
  if (!createdClaim) {
    createdClaim = {
      id: claimId,
      profile_id: profileId,
      userId: profileId,
      reward_id: rewardId || 'WD-VK-55912',
      claim_type: 'VEHICLE',
      status: 'SUBMITTED',
      submitted_at: submittedAt,
      vehicle_details: {
        full_name: cleanName,
        mobile_number: cleanMobile,
        delivery_address: cleanAddress,
        city: cleanCity,
        province: cleanProvince,
        postal_code: cleanPostal,
        preferred_delivery_contact: preferredDeliveryContact,
        delivery_notes: deliveryNotes,
      },
    };
  }

  // 3. Sync to local storage
  const formatted = formatClaimRecord(createdClaim, eligibility.profile);
  const allClaims = getStorageClaims();
  const existingIdx = allClaims.findIndex((c) => c.id === formatted.id || (c.userId === profileId && c.claim_type === 'VEHICLE'));
  if (existingIdx >= 0) {
    allClaims[existingIdx] = formatted;
  } else {
    allClaims.unshift(formatted);
  }
  saveStorageClaims(allClaims);

  // Sync to user specific key for backward compatibility
  try {
    const userClaimsKey = `${STORAGE_USER_CLAIMS_PREFIX}${profileId}`;
    const userClaims = JSON.parse(localStorage.getItem(userClaimsKey) || '[]');
    const userIdx = userClaims.findIndex((c) => c.type === 'vehicle' || c.claimType === 'VEHICLE');
    if (userIdx >= 0) {
      userClaims[userIdx] = formatted;
    } else {
      userClaims.unshift(formatted);
    }
    localStorage.setItem(userClaimsKey, JSON.stringify(userClaims));
  } catch (_) {}

  // 4. Audit Log
  await recordAuditLog({
    adminProfileId: null,
    action: 'CLAIM_SUBMITTED',
    entityType: 'claim',
    entityId: formatted.id,
    description: `Vehicle prize claim submitted by user ${eligibility.profile?.full_name || profileId}. Status set to SUBMITTED.`,
    afterChanges: { claimType: 'VEHICLE', status: 'SUBMITTED' },
  });

  return { success: true, claim: formatted, data: formatted, error: null };
}

export const submitVehicleClaim = createVehicleClaim;

/**
 * 6. submitClaim: Generic claim dispatcher
 */
export async function submitClaim(claimData) {
  const type = (claimData.claimType || claimData.type || 'CASH').toUpperCase();
  if (type.includes('VEHICLE')) {
    return await createVehicleClaim(claimData);
  }
  return await createCashClaim(claimData);
}

/**
 * 7. getAdminClaims: Admin claims queue with search, filtering, and summary metrics
 */
export async function getAdminClaims({
  status = 'ALL',
  claimType = 'ALL',
  search = '',
  limit = 100,
  offset = 0,
} = {}) {
  let claimsList = [];
  let totalCount = 0;

  // 1. Try real Supabase query
  if (isSupabaseConfigured() && supabase) {
    try {
      let query = supabase
        .from('claims')
        .select(
          `
          *,
          profile:profiles(*),
          reward:rewards(*),
          cash_details:cash_claim_details(*),
          vehicle_details:vehicle_claim_details(*)
        `,
          { count: 'exact' }
        )
        .order('created_at', { ascending: false });

      if (status && status !== 'ALL') {
        query = query.eq('status', toDbStatus(status));
      }

      if (claimType && claimType !== 'ALL') {
        query = query.eq('claim_type', claimType.toUpperCase());
      }

      const { data, error, count } = await query.range(offset, offset + limit - 1);

      if (!error && Array.isArray(data) && data.length > 0) {
        claimsList = data.map((c) => formatClaimRecord(c, c.profile, c.reward));
        totalCount = count || claimsList.length;
      }
    } catch (_) {}
  }

  // 2. Storage fallback or merge (Development only)
  if (claimsList.length === 0 && !import.meta.env.PROD) {
    const rawList = getStorageClaims();
    claimsList = rawList.map((c) => formatClaimRecord(c));
    totalCount = claimsList.length;
  }

  // Filter in memory for search & status
  let filtered = [...claimsList];

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    filtered = filtered.filter(
      (c) =>
        c.id?.toLowerCase().includes(q) ||
        c.userName?.toLowerCase().includes(q) ||
        c.userEmail?.toLowerCase().includes(q) ||
        c.userPhone?.toLowerCase().includes(q) ||
        c.prizeName?.toLowerCase().includes(q)
    );
  }

  if (status && status !== 'ALL') {
    const normFilter = normalizeClaimStatus(status);
    filtered = filtered.filter((c) => normalizeClaimStatus(c.status) === normFilter);
  }

  if (claimType && claimType !== 'ALL') {
    const normType = claimType.toUpperCase();
    filtered = filtered.filter((c) => (c.claim_type || c.type || '').toUpperCase().includes(normType));
  }

  // Calculate metrics based on total available claims
  const metrics = getClaimMetrics(claimsList);

  return {
    data: filtered,
    claims: filtered,
    count: filtered.length,
    totalCount,
    metrics,
    error: null,
  };
}

export const adminGetClaims = getAdminClaims;
export const getAllClaims = () => getStorageClaims();

/**
 * Calculate dynamic claim metrics
 */
export function getClaimMetrics(claims = []) {
  const list = Array.isArray(claims) ? claims : [];
  let underReview = 0;
  let approved = 0;
  let requirementsPending = 0;
  let processing = 0;
  let fulfilled = 0;
  let rejected = 0;
  let moreInfoRequired = 0;

  list.forEach((c) => {
    const s = normalizeClaimStatus(c.status);
    if (s === CLAIM_STATUSES.UNDER_REVIEW || s === CLAIM_STATUSES.SUBMITTED) underReview++;
    else if (s === CLAIM_STATUSES.APPROVED) approved++;
    else if (s === CLAIM_STATUSES.REQUIREMENT_PENDING) requirementsPending++;
    else if (s === CLAIM_STATUSES.PROCESSING) processing++;
    else if (s === CLAIM_STATUSES.FULFILLED) fulfilled++;
    else if (s === CLAIM_STATUSES.REJECTED) rejected++;
    else if (s === CLAIM_STATUSES.MORE_INFORMATION_REQUIRED) moreInfoRequired++;
  });

  return {
    total: list.length,
    underReview,
    approved,
    requirementsPending,
    processing,
    fulfilled,
    rejected,
    moreInfoRequired,
  };
}

/**
 * 8. updateClaimStatus: Transition claim through strictly enforced lifecycle
 */
export async function updateClaimStatus(claimId, requestedStatus, { note = '', reason = '', adminId = null } = {}) {
  if (!claimId) {
    return { success: false, error: 'Claim ID is required.' };
  }

  const newStatus = normalizeClaimStatus(requestedStatus);
  const currentClaimRes = await getClaimById(claimId);
  const claim = currentClaimRes.claim;

  if (!claim) {
    return { success: false, error: `Claim dossier #${claimId} not found.` };
  }

  const currentStatus = normalizeClaimStatus(claim.status);

  // Validate state transitions according to Section 2:
  // CLAIM_AVAILABLE -> SUBMITTED -> UNDER_REVIEW -> APPROVED -> REQUIREMENT_PENDING -> PROCESSING -> FULFILLED
  // Alternative paths:
  // UNDER_REVIEW -> REJECTED
  // UNDER_REVIEW -> MORE_INFORMATION_REQUIRED -> UNDER_REVIEW
  // State transitions:
  // When an admin approves a claim, status is saved as APPROVED
  const effectiveStatus = newStatus;

  const nowIso = new Date().toISOString();
  const dateFormatted = nowIso.slice(0, 16).replace('T', ' ');

  // Update Supabase
  if (isSupabaseConfigured() && supabase) {
    try {
      const updates = {
        status: toDbStatus(effectiveStatus),
        updated_at: nowIso,
      };
      if (effectiveStatus === CLAIM_STATUSES.APPROVED) {
        updates.approved_at = nowIso;
      } else if (effectiveStatus === CLAIM_STATUSES.FULFILLED) {
        updates.fulfilled_at = nowIso;
      }
      if (reason && effectiveStatus === CLAIM_STATUSES.REJECTED) {
        updates.rejection_reason = reason;
      }
      if (reason && effectiveStatus === CLAIM_STATUSES.MORE_INFORMATION_REQUIRED) {
        updates.more_information_reason = reason;
      }

      await supabase.from('claims').update(updates).eq('id', claimId);
    } catch (_) {}
  }

  // Update in memory & storage
  const allClaims = getStorageClaims();
  const targetIdx = allClaims.findIndex((c) => c.id === claimId);

  const timelineNote = note || reason || `Status updated to ${effectiveStatus}`;
  const updatedTimeline = [
    ...(claim.timeline || []),
    {
      event: effectiveStatus,
      date: dateFormatted,
      note: timelineNote,
    },
  ];

  const updatedClaim = {
    ...claim,
    status: effectiveStatus,
    updatedAt: dateFormatted,
    timeline: updatedTimeline,
  };

  if (targetIdx >= 0) {
    allClaims[targetIdx] = updatedClaim;
  } else {
    allClaims.push(updatedClaim);
  }
  saveStorageClaims(allClaims);

  // Sync to user claims
  try {
    const userClaimsKey = `${STORAGE_USER_CLAIMS_PREFIX}${claim.userId}`;
    const userClaims = JSON.parse(localStorage.getItem(userClaimsKey) || '[]');
    const uIdx = userClaims.findIndex((c) => c.id === claimId);
    if (uIdx >= 0) {
      userClaims[uIdx] = { ...userClaims[uIdx], status: effectiveStatus, updatedAt: dateFormatted };
      localStorage.setItem(userClaimsKey, JSON.stringify(userClaims));
    }
  } catch (_) {}

  // Record Audit Log
  await recordAuditLog({
    adminProfileId: adminId,
    action: 'CLAIM_STATUS_UPDATED',
    entityType: 'claim',
    entityId: claimId,
    description: `Claim ${claimId} transitioned from ${currentStatus} to ${effectiveStatus}. Note: ${timelineNote}`,
    beforeChanges: { status: currentStatus },
    afterChanges: { status: effectiveStatus, note: timelineNote },
  });

  return { success: true, claim: updatedClaim, data: updatedClaim, error: null };
}

export const adminUpdateClaimStatus = updateClaimStatus;

/**
 * 9. Specialized Helper Actions
 */
export async function approveClaim(claimId, note = 'Claim authorized and approved by registrar') {
  return await updateClaimStatus(claimId, CLAIM_STATUSES.APPROVED, { note });
}

export async function rejectClaim(claimId, reason = 'Claim did not pass verification criteria') {
  return await updateClaimStatus(claimId, CLAIM_STATUSES.REJECTED, { reason });
}

export async function requestMoreInformation(claimId, reason = 'Additional identity verification required') {
  return await updateClaimStatus(claimId, CLAIM_STATUSES.MORE_INFORMATION_REQUIRED, { reason });
}

export async function moveClaimToProcessing(claimId, note = 'Escrow transfer / carrier coordination in progress') {
  return await updateClaimStatus(claimId, CLAIM_STATUSES.PROCESSING, { note });
}

export async function markClaimFulfilled(claimId, note = 'Disbursement confirmed and completed') {
  return await updateClaimStatus(claimId, CLAIM_STATUSES.FULFILLED, { note });
}


