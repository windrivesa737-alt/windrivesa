import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import { sanitizeDbError } from './errorHandler.js';
import { getAppSettings } from './settings.js';
import { recordAuditLog } from './auditLogs.js';

/**
 * Centralized User-Specific Claim Requirements Database Service
 * Manages administrative configuration of individual Applicable Charges and claimant visibility in Supabase.
 *
 * Core Governance:
 * 1. Requirements are USER-SPECIFIC, associated with `profile_id` and `claim_type` ('CASH' or 'VEHICLE').
 * 2. Each user can have one independent CASH requirement and one independent VEHICLE requirement.
 * 3. User A's requirements never appear for User B.
 * 4. Applicable charges are NEVER shown before claim approval.
 * 5. If no requirement is configured for that specific user and claim type, NO requirement is returned (returns null).
 * 6. Records where `profile_id IS NULL` are legacy global entries and are COMPLETELY IGNORED.
 * 7. Never silently fall back to global or hardcoded default charges.
 * 8. Only administrators may create, modify, or disable claim requirements.
 * 9. Uses canonical database column `title` (not prize_context).
 */

const USER_REQUIREMENTS_STORAGE_PREFIX = 'windrive_user_claim_requirements_';

/**
 * Format timestamp in South Africa Standard Time (SAST)
 */
export function formatSASTDate(date = new Date()) {
  const d = new Date(date);
  if (isNaN(d.getTime())) return String(date || '—');
  const day = String(d.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day} ${month} ${year}, ${hours}:${minutes}`;
}

/**
 * Format monetary amount into ZAR standard display (e.g., R 15,000)
 */
export function formatZAR(amount, includeDecimals = false) {
  const num = typeof amount === 'number' ? amount : parseFloat(String(amount || 0).replace(/[^0-9.-]/g, '')) || 0;
  return 'R ' + num.toLocaleString('en-US', {
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: includeDecimals ? 2 : 0,
  });
}

/**
 * Clean numeric input string into float
 */
export function parseNumericAmount(str) {
  if (typeof str === 'number') return Math.max(0, str);
  if (!str) return 0;
  const cleaned = String(str).replace(/[^0-9.]/g, '');
  const val = parseFloat(cleaned);
  return isNaN(val) ? 0 : Math.max(0, val);
}

/**
 * Validate phone number string for standard South African formats
 */
export function validatePhoneNumber(phone) {
  if (!phone) return { valid: false, message: 'Contact number is required.' };
  const cleaned = phone.replace(/[^0-9+]/g, '');
  if (cleaned.length < 9 || cleaned.length > 15) {
    return { valid: false, message: 'Please enter a valid phone number (e.g. +27 82 555 0194).' };
  }
  return { valid: true };
}

/**
 * Validate requirement record integrity
 */
export function validateRequirement(req) {
  const errors = {};
  if (!req) {
    return { isValid: false, valid: false, errors: { form: 'Requirement details are required.' } };
  }

  if (req.applicableCharge === undefined || req.applicableCharge === null || isNaN(Number(req.applicableCharge))) {
    errors.applicableCharge = 'Applicable charge must be a valid numeric amount.';
  } else if (Number(req.applicableCharge) < 0) {
    errors.applicableCharge = 'Applicable charge cannot be negative.';
  }

  if (req.status === 'ENABLED' && Number(req.applicableCharge) > 0 && (!req.description || !req.description.trim())) {
    errors.description = 'Description is required when an applicable charge is enabled.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Centralized Requirement Matching Logic (User-Specific)
 *
 * For an approved claim:
 * resolveApplicableClaimRequirement(claim, options)
 *
 * 1. Check claim approval status (MUST be approved before showing charge, unless options.ignoreStatus is set).
 * 2. Determine claim_type ('CASH' or 'VEHICLE').
 * 3. Determine the specific claimant's profile_id.
 * 4. Query claim_requirements from Supabase specifically for (profile_id, claim_type).
 * 5. IGNORE any records where profile_id IS NULL (legacy global entries).
 * 6. Only return ENABLED requirements.
 * 7. Return null if no requirement exists for that specific user or if status is DISABLED.
 * 8. NEVER fall back to global templates or hardcoded fees.
 */
export async function resolveApplicableClaimRequirement(claim, options = {}) {
  if (!claim) return null;

  // 1. Check claim approval status
  // BEFORE CLAIM APPROVAL: Do NOT display an applicable charge unless explicitly instructed (e.g. admin review)
  const rawStatus = typeof claim === 'object' ? (claim.status || claim.statusRaw || '') : '';
  const normStatus = rawStatus.toUpperCase().replace(/[\s-]/g, '_');

  const isApproved =
    options.ignoreStatus === true ||
    normStatus === 'APPROVED' ||
    normStatus === 'REQUIREMENT_PENDING' ||
    normStatus === 'PROCESSING' ||
    normStatus === 'FULFILLED';

  if (!isApproved && !options.ignoreStatus) {
    return null;
  }

  // 2. Determine claim_type
  let rawType = '';
  if (typeof claim === 'string') {
    rawType = claim;
  } else if (typeof claim === 'object') {
    rawType = claim.claim_type || claim.type || claim.claimType || '';
  }
  let normType = rawType.toUpperCase().includes('VEHICLE')
    ? 'VEHICLE'
    : rawType.toUpperCase().includes('CASH')
    ? 'CASH'
    : null;

  if (!normType && typeof claim === 'object') {
    if (claim.cashDetails || (claim.prizeName && String(claim.prizeName).startsWith('R'))) {
      normType = 'CASH';
    } else if (claim.vehicleDetails || (claim.prizeName && String(claim.prizeName).toLowerCase().includes('hilux'))) {
      normType = 'VEHICLE';
    }
  }

  if (!normType) return null;

  // 3. Resolve target claimant profile ID
  let targetProfileId =
    options.profileId ||
    options.profile_id ||
    options.userId ||
    (typeof claim === 'object' ? (claim.profile_id || claim.userId || claim.profile?.id) : null);

  // If not in claim object or options, attempt current authenticated user lookup
  if (!targetProfileId && isSupabaseConfigured() && supabase) {
    try {
      const { data: authData } = await supabase.auth.getUser();
      targetProfileId = authData?.user?.id || null;
    } catch (_) {}
  }

  if (!targetProfileId) {
    return null;
  }

  // 4. Query claim_requirements from Supabase specifically for (profile_id, claim_type)
  let row = null;
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('claim_requirements')
        .select('*')
        .eq('profile_id', targetProfileId)
        .eq('claim_type', normType)
        .maybeSingle();

      if (!error && data) {
        row = data;
      }
    } catch (err) {
      console.debug('Notice querying claim_requirements:', err);
    }
  }

  // User-specific store fallback for offline/preview environments
  if (!row) {
    const userStore = getStoredUserRequirements(targetProfileId);
    const catKey = normType.toLowerCase();
    const candidate = userStore[catKey];
    if (candidate && candidate.status === 'ENABLED' && candidate.profile_id === targetProfileId) {
      row = {
        id: candidate.id || `req_${catKey}_${targetProfileId}`,
        profile_id: targetProfileId,
        claim_type: normType,
        title: candidate.title || (normType === 'VEHICLE' ? 'Vehicle Prize' : 'Cash Prize'),
        applicable_charge: candidate.applicableCharge ?? candidate.applicable_charge ?? 0,
        currency: candidate.currency || 'ZAR',
        description: candidate.description || '',
        status: candidate.status || 'ENABLED',
        support_whatsapp: candidate.support_whatsapp,
      };
    }
  }

  // 5. Explicitly IGNORE any record where profile_id is NULL or doesn't match target user
  if (!row || !row.profile_id || row.profile_id !== targetProfileId) {
    return null;
  }

  // 6. If requirement is not ENABLED, return null
  if (row.status !== 'ENABLED') {
    return null;
  }

  // 7. Retrieve institutional WhatsApp contact if not set on the user requirement
  let supportWhatsapp = row.support_whatsapp;
  if (!supportWhatsapp) {
    try {
      const { data: settings } = await getAppSettings();
      supportWhatsapp = settings?.whatsapp_support_number || '+27 82 555 0194';
    } catch (_) {
      supportWhatsapp = '+27 82 555 0194';
    }
  }

  const numCharge = Number(row.applicable_charge || 0);
  const requirementTitle = row.title || (normType === 'VEHICLE' ? 'Vehicle Prize' : 'Cash Prize');

  return {
    id: row.id,
    profileId: row.profile_id,
    profile_id: row.profile_id,
    claimType: normType,
    claim_type: normType,
    title: requirementTitle,
    prize: requirementTitle,
    applicableCharge: numCharge,
    applicable_charge: numCharge,
    currency: row.currency || 'ZAR',
    description: row.description || '',
    status: 'ENABLED',
    supportWhatsapp,
    support_whatsapp: supportWhatsapp,
    hasCharge: numCharge > 0,
  };
}

/**
 * Retrieve applicable requirement for a specific claim type (backwards compatibility wrapper)
 */
export async function getApplicableRequirement(claimType, profileId = null) {
  return {
    data: await resolveApplicableClaimRequirement(
      { claim_type: claimType, status: 'APPROVED', profile_id: profileId },
      { ignoreStatus: true, profileId }
    ),
    error: null,
  };
}

/**
 * Admin: Retrieve all requirements configured for a specific user profile
 * Strictly ignores any legacy records where profile_id is NULL.
 */
export async function adminGetUserRequirements(profileId) {
  if (!profileId) {
    return { data: { cash: null, vehicle: null }, error: 'User Profile ID is required.' };
  }

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('claim_requirements')
        .select('*')
        .eq('profile_id', profileId);

      if (!error && Array.isArray(data)) {
        // Enforce that only rows strictly belonging to this profile_id are processed
        const rows = data.filter((r) => r.profile_id && r.profile_id === profileId);
        const cashRow = rows.find((r) => (r.claim_type || '').toUpperCase() === 'CASH') || null;
        const vehicleRow = rows.find((r) => (r.claim_type || '').toUpperCase() === 'VEHICLE') || null;

        return {
          data: {
            cash: cashRow ? formatRequirementRecord(cashRow) : null,
            vehicle: vehicleRow ? formatRequirementRecord(vehicleRow) : null,
            all: rows.map(formatRequirementRecord),
          },
          error: null,
        };
      }

      if (error) {
        console.warn('Notice loading user claim requirements from Supabase:', error.message);
      }
    } catch (err) {
      console.warn('Exception loading user claim requirements:', err);
    }
  }

  // User-specific store fallback
  const store = getStoredUserRequirements(profileId);
  return {
    data: {
      cash: store.cash || null,
      vehicle: store.vehicle || null,
      all: [store.cash, store.vehicle].filter(Boolean),
    },
    error: null,
  };
}

/**
 * Admin: Retrieve all configured requirements across all users (for administrative overview)
 * Strictly filters out any records where profile_id IS NULL.
 */
export async function adminGetRequirements() {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('claim_requirements')
        .select('*, profile:profiles(id, full_name, email, member_number, mobile_number, account_status)')
        .not('profile_id', 'is', null)
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        const userSpecificOnly = data.filter((r) => r.profile_id !== null && r.profile_id !== undefined);
        return { data: userSpecificOnly.map(formatRequirementRecord), error: null };
      }
      if (error) {
        console.debug('Notice retrieving admin claim_requirements:', error.message);
      }
    } catch (err) {
      console.debug('adminGetRequirements error:', err);
    }
  }

  return { data: [], error: null };
}

/**
 * Admin: Upsert or update a claim requirement for a SPECIFIC USER
 * Matches actual database columns:
 * - profile_id (UUID)
 * - claim_type (TEXT)
 * - title (TEXT)
 * - applicable_charge (NUMERIC)
 * - currency (TEXT)
 * - description (TEXT)
 * - status (TEXT)
 * - support_whatsapp (TEXT)
 * - updated_at (TIMESTAMPTZ)
 */
export async function adminUpsertRequirement({
  profileId,
  userId,
  claimType,
  title = '',
  applicableCharge = 0,
  currency = 'ZAR',
  description = '',
  status = 'ENABLED',
  supportWhatsapp = null,
  adminUser = null,
  targetUserName = '',
}) {
  const targetProfileId = profileId || userId;
  if (!targetProfileId) {
    return { data: null, success: false, error: 'Target user must be selected before configuring requirements.' };
  }

  const normType = (claimType || 'CASH').toUpperCase().includes('VEHICLE') ? 'VEHICLE' : 'CASH';
  const normStatus = (status || 'ENABLED').toUpperCase() === 'ENABLED' ? 'ENABLED' : 'DISABLED';
  const finalTitle = title?.trim() || (normType === 'VEHICLE' ? 'Vehicle Prize' : 'Cash Prize');
  const numCharge = parseNumericAmount(applicableCharge);

  if (isSupabaseConfigured() && supabase) {
    try {
      // 1. Fetch before-state for audit trail
      let beforeState = null;
      try {
        const { data: existing } = await supabase
          .from('claim_requirements')
          .select('*')
          .eq('profile_id', targetProfileId)
          .eq('claim_type', normType)
          .maybeSingle();
        beforeState = existing;
      } catch (_) {}

      // 2. Prepare payload matching exact schema
      const payload = {
        profile_id: targetProfileId,
        claim_type: normType,
        title: finalTitle,
        applicable_charge: numCharge,
        currency: currency || 'ZAR',
        description: (description || '').trim(),
        status: normStatus,
        updated_at: new Date().toISOString(),
      };

      if (supportWhatsapp && supportWhatsapp.trim()) {
        payload.support_whatsapp = supportWhatsapp.trim();
      }

      // 3. Persist to Supabase: Update if exists, otherwise insert
      let data = null;
      let error = null;

      if (beforeState?.id) {
        const res = await supabase
          .from('claim_requirements')
          .update(payload)
          .eq('id', beforeState.id)
          .select()
          .single();
        data = res.data;
        error = res.error;
      } else {
        const res = await supabase
          .from('claim_requirements')
          .insert(payload)
          .select()
          .single();
        data = res.data;
        error = res.error;
      }

      if (!error && data) {
        // 4. Record audit log
        try {
          await recordAuditLog({
            actorId: adminUser?.id || null,
            actorEmail: adminUser?.email || 'admin@windrivesa.co.za',
            actorRole: 'admin',
            action: beforeState ? 'UPDATE_CLAIM_REQUIREMENT' : 'CREATE_CLAIM_REQUIREMENT',
            entityType: 'CLAIM_REQUIREMENT',
            entityId: data.id,
            description: `${beforeState ? 'Updated' : 'Created'} ${normType} claim requirement for participant ${targetUserName || targetProfileId}: ${formatZAR(numCharge)} (${normStatus})`,
            beforeState: beforeState ? { charge: beforeState.applicable_charge, status: beforeState.status, desc: beforeState.description } : null,
            afterState: { charge: numCharge, status: normStatus, desc: payload.description },
            metadata: {
              targetProfileId,
              claimType: normType,
              charge: numCharge,
              status: normStatus,
            },
          });
        } catch (_) {}

        saveStoredUserRequirement(targetProfileId, normType.toLowerCase(), formatRequirementRecord(data));
        return { data: formatRequirementRecord(data), success: true, error: null };
      }

      if (error) {
        console.warn('Notice on database claim_requirements mutation:', error.message);
      }
    } catch (err) {
      console.warn('Exception during adminUpsertRequirement:', err);
    }
  }

  // User-specific store fallback (maintains isolated per-user requirement records)
  const record = {
    id: `req_${normType.toLowerCase()}_${targetProfileId}`,
    profile_id: targetProfileId,
    claim_type: normType,
    claimType: normType === 'VEHICLE' ? 'Vehicle Prize' : 'Cash Prize',
    title: finalTitle,
    applicable_charge: numCharge,
    applicableCharge: numCharge,
    currency: currency || 'ZAR',
    description,
    status: normStatus,
    enabled: normStatus === 'ENABLED',
    support_whatsapp: supportWhatsapp,
    updated_at: new Date().toISOString(),
    updatedAt: formatSASTDate(new Date()),
  };

  saveStoredUserRequirement(targetProfileId, normType.toLowerCase(), record);
  return { data: record, success: true, error: null };
}

/**
 * Format a database requirement row into consistent client representation
 */
function formatRequirementRecord(row) {
  if (!row) return null;
  const numCharge = Number(row.applicable_charge || 0);
  const normType = (row.claim_type || '').toUpperCase() === 'VEHICLE' ? 'VEHICLE' : 'CASH';
  const isEnabled = (row.status || 'ENABLED').toUpperCase() === 'ENABLED';
  const requirementTitle = row.title || (normType === 'VEHICLE' ? 'Vehicle Prize' : 'Cash Prize');

  return {
    id: row.id,
    profileId: row.profile_id,
    profile_id: row.profile_id,
    claimType: normType === 'VEHICLE' ? 'Vehicle Prize' : 'Cash Prize',
    claim_type: normType,
    title: requirementTitle,
    prize: requirementTitle,
    applicableCharge: numCharge,
    applicable_charge: numCharge,
    currency: row.currency || 'ZAR',
    description: row.description || '',
    status: isEnabled ? 'ENABLED' : 'DISABLED',
    enabled: isEnabled,
    supportWhatsapp: row.support_whatsapp || null,
    support_whatsapp: row.support_whatsapp || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at ? formatSASTDate(row.updated_at) : '',
    updated_at: row.updated_at,
    profile: row.profile || null,
  };
}

/**
 * Isolated User Storage helpers (keyed by target profile ID to guarantee User A != User B)
 */
function getStoredUserRequirements(profileId) {
  if (!profileId) {
    return { cash: null, vehicle: null };
  }
  try {
    if (typeof localStorage === 'undefined') {
      return globalThis.__mockUserReqStore?.[profileId] || { cash: null, vehicle: null };
    }
    const raw = localStorage.getItem(`${USER_REQUIREMENTS_STORAGE_PREFIX}${profileId}`);
    return raw ? JSON.parse(raw) : { cash: null, vehicle: null };
  } catch (_) {
    return { cash: null, vehicle: null };
  }
}

function saveStoredUserRequirement(profileId, category, record) {
  if (!profileId) return;
  try {
    if (typeof localStorage === 'undefined') {
      if (!globalThis.__mockUserReqStore) globalThis.__mockUserReqStore = {};
      if (!globalThis.__mockUserReqStore[profileId]) globalThis.__mockUserReqStore[profileId] = {};
      globalThis.__mockUserReqStore[profileId][category] = record;
      return;
    }
    const current = getStoredUserRequirements(profileId);
    current[category] = record;
    localStorage.setItem(`${USER_REQUIREMENTS_STORAGE_PREFIX}${profileId}`, JSON.stringify(current));
  } catch (_) {}
}

/**
 * Legacy local cache getters and setters (Backward-compatibility only)
 */
export function getClaimRequirements() {
  return {
    cash: {
      claimType: 'Cash Prize',
      title: 'Cash Prize',
      applicableCharge: 0.0,
      currency: 'ZAR',
      description: '',
      status: 'DISABLED',
      enabled: false,
    },
    vehicle: {
      claimType: 'Vehicle Prize',
      title: 'Vehicle Prize',
      applicableCharge: 0.0,
      currency: 'ZAR',
      description: '',
      status: 'DISABLED',
      enabled: false,
    },
    whatsappSupportNumber: '+27 82 555 0194',
  };
}

export function saveWhatsAppSupportNumber(number) {
  return { success: true, whatsappSupportNumber: number };
}
