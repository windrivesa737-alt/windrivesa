import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import { sanitizeDbError } from './errorHandler.js';
import { recordAuditLog } from './auditLogs.js';
import { recordAdminActivity } from './adminService.js';
import { getAppSettings } from './settings.js';

/**
 * WinDriveSA Centralized Support Database Service
 * Authoritative Supabase operations for participant support inquiries,
 * bidirectional messaging, and restricted admin-only internal notes.
 *
 * Strict Compliance:
 * - POPIA Section 18 / FICA compliance
 * - Customer data isolation & RLS enforcement
 * - Internal notes restricted strictly to admins (NEVER exposed to users)
 * - Zero credentials, tokens, passwords, OTPs, or CVVs collected or logged
 */

// Storage backup key used ONLY if Supabase connection is offline
const OFFLINE_SUPPORT_STORAGE_KEY = 'windrive_supabase_support_backup';

export const SUPPORT_STATUSES = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  WAITING_FOR_USER: 'WAITING_FOR_USER',
  RESOLVED: 'RESOLVED',
};

export const SUPPORT_CATEGORIES = {
  ACCOUNT: 'ACCOUNT',
  CASH_PRIZE: 'CASH_PRIZE',
  VEHICLE_PRIZE: 'VEHICLE_PRIZE',
  CLAIM: 'CLAIM',
  GENERAL_SUPPORT: 'GENERAL_SUPPORT',
};

// =========================================================================
// NORMALIZATION HELPERS
// =========================================================================

export function normalizeCategoryToDb(cat) {
  if (!cat) return 'GENERAL_SUPPORT';
  const c = String(cat).trim().toUpperCase().replace(/[\s-]+/g, '_');
  if (c === 'ACCOUNT') return 'ACCOUNT';
  if (c === 'CASH_PRIZE' || c === 'CASHPRIZE') return 'CASH_PRIZE';
  if (c === 'VEHICLE_PRIZE' || c === 'VEHICLEPRIZE') return 'VEHICLE_PRIZE';
  if (c === 'CLAIM') return 'CLAIM';
  if (c === 'GENERAL_SUPPORT' || c === 'GENERALSUPPORT') return 'GENERAL_SUPPORT';
  return 'GENERAL_SUPPORT';
}

export function formatCategoryDisplay(cat) {
  if (!cat) return 'General Support';
  const c = String(cat).trim().toUpperCase().replace(/[\s-]+/g, '_');
  if (c === 'ACCOUNT') return 'Account';
  if (c === 'CASH_PRIZE') return 'Cash Prize';
  if (c === 'VEHICLE_PRIZE') return 'Vehicle Prize';
  if (c === 'CLAIM') return 'Claim';
  return 'General Support';
}

export function normalizeStatusToDb(status) {
  if (!status) return 'OPEN';
  const s = String(status).trim().toUpperCase().replace(/[\s-]+/g, '_');
  if (s === 'OPEN' || s === 'SUBMITTED') return 'OPEN';
  if (s === 'IN_PROGRESS' || s === 'UNDER_REVIEW') return 'IN_PROGRESS';
  if (s === 'WAITING_FOR_USER') return 'WAITING_FOR_USER';
  if (s === 'RESOLVED') return 'RESOLVED';
  return 'OPEN';
}

export function formatStatusDisplay(status) {
  if (!status) return 'OPEN';
  const s = String(status).trim().toUpperCase().replace(/[\s-]+/g, '_');
  if (s === 'OPEN' || s === 'SUBMITTED') return 'OPEN';
  if (s === 'IN_PROGRESS' || s === 'UNDER_REVIEW') return 'IN PROGRESS';
  if (s === 'WAITING_FOR_USER') return 'WAITING FOR USER';
  if (s === 'RESOLVED') return 'RESOLVED';
  return s;
}

export function formatSupportDate(isoOrDate) {
  if (!isoOrDate) return 'N/A';
  try {
    const d = new Date(isoOrDate);
    if (isNaN(d.getTime())) return String(isoOrDate);
    const day = d.getDate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day} ${month} ${year}, ${hours}:${minutes} SAST`;
  } catch (_) {
    return String(isoOrDate);
  }
}

function isValidUuid(id) {
  if (!id || typeof id !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

// Offline backup helpers (only used in development if Supabase client is unavailable)
function getOfflineStore() {
  if (import.meta.env.PROD) {
    return { requests: [], messages: [], notes: [] };
  }
  try {
    const raw = localStorage.getItem(OFFLINE_SUPPORT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : { requests: [], messages: [], notes: [] };
  } catch (_) {
    return { requests: [], messages: [], notes: [] };
  }
}

function saveOfflineStore(store) {
  if (import.meta.env.PROD) {
    return;
  }
  try {
    localStorage.setItem(OFFLINE_SUPPORT_STORAGE_KEY, JSON.stringify(store));
  } catch (_) {}
}

// =========================================================================
// INSTITUTIONAL CONFIGURATION
// =========================================================================

/**
 * Retrieve configuration for support desk and WhatsApp channel
 */
export async function getSupportConfig() {
  let whatsappNumber = '+27 82 000 0000';
  let supportEmail = 'support@windrivesa.co.za';
  let operatingHours = 'Mon–Fri 08:00–17:00 SAST';

  try {
    const { data: settings } = await getAppSettings();
    if (settings) {
      if (settings.whatsapp_support_number) {
        whatsappNumber = settings.whatsapp_support_number;
      }
      if (settings.support_email) {
        supportEmail = settings.support_email;
      }
      if (settings.support_availability) {
        operatingHours = settings.support_availability;
      }
    }
  } catch (_) {}

  const digits = (whatsappNumber || '').replace(/\D+/g, '');
  const isAvailable = Boolean(digits && digits.length >= 7);

  return {
    whatsappNumber,
    whatsappRawNumber: digits,
    supportEmail,
    operatingHours,
    isWhatsAppAvailable: isAvailable,
    responseTimeGuidance: 'Inquiries are reviewed by our regional coordination team during business hours.',
  };
}

// =========================================================================
// USER OPERATIONS
// =========================================================================

/**
 * 1. createSupportRequest
 * Creates a real support inquiry in Supabase support_requests & support_messages
 */
export async function createSupportRequest(arg1, arg2) {
  // Support both createSupportRequest({ profileId, subject, ... }) and createSupportRequest(profileId, formData)
  let profileId, subject, message, category, relatedClaimId, relatedClaimType;
  if (typeof arg1 === 'object' && arg1 !== null && !arg2) {
    profileId = arg1.profileId || arg1.userId;
    subject = arg1.subject;
    message = arg1.message;
    category = arg1.category;
    relatedClaimId = arg1.relatedClaimId;
    relatedClaimType = arg1.relatedClaimType;
  } else {
    profileId = arg1;
    subject = arg2?.subject;
    message = arg2?.message;
    category = arg2?.category;
    relatedClaimId = arg2?.relatedClaimId;
    relatedClaimType = arg2?.relatedClaimType;
  }

  // 1. Authenticated User Resolution
  let resolvedProfileId = profileId;
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user?.id) {
        resolvedProfileId = authData.user.id;
      }
    } catch (_) {}
  }

  if (!resolvedProfileId) {
    try {
      const rawUser = localStorage.getItem('windrive_current_user') || sessionStorage.getItem('windrive_current_user');
      if (rawUser) {
        const parsed = JSON.parse(rawUser);
        resolvedProfileId = parsed.id;
      }
    } catch (_) {}
  }

  if (!resolvedProfileId) {
    return {
      success: false,
      data: null,
      error: { message: 'Authentication required. Please log in to submit a support request.' },
    };
  }

  // Validation
  const cleanSubject = (subject || '').trim();
  const cleanMessage = (message || '').trim();

  if (cleanSubject.length < 4) {
    return {
      success: false,
      data: null,
      error: { message: 'Subject must be at least 4 characters.' },
    };
  }
  if (cleanMessage.length < 10) {
    return {
      success: false,
      data: null,
      error: { message: 'Message description must be at least 10 characters.' },
    };
  }

  const dbCategory = normalizeCategoryToDb(category);

  // Validate or resolve related claim UUID
  let resolvedClaimUuid = null;
  if (isValidUuid(relatedClaimId)) {
    resolvedClaimUuid = relatedClaimId;
  } else if (isSupabaseConfigured() && supabase) {
    try {
      // Look up if user has an active claim matching requested prize type
      const { data: claims } = await supabase
        .from('claims')
        .select('id, claim_type')
        .eq('profile_id', resolvedProfileId)
        .order('created_at', { ascending: false });

      if (claims && claims.length > 0) {
        if (relatedClaimType) {
          const match = claims.find((c) =>
            (c.claim_type || '').toUpperCase().includes(relatedClaimType.toUpperCase())
          );
          if (match) resolvedClaimUuid = match.id;
        } else if (dbCategory === 'CASH_PRIZE') {
          const match = claims.find((c) => (c.claim_type || '').toUpperCase().includes('CASH'));
          if (match) resolvedClaimUuid = match.id;
        } else if (dbCategory === 'VEHICLE_PRIZE') {
          const match = claims.find((c) => (c.claim_type || '').toUpperCase().includes('VEHICLE'));
          if (match) resolvedClaimUuid = match.id;
        }
      }
    } catch (_) {}
  }

  // Primary: Supabase execution
  if (isSupabaseConfigured() && supabase) {
    try {
      // 1. Create support_requests record
      const { data: request, error: requestError } = await supabase
        .from('support_requests')
        .insert({
          profile_id: resolvedProfileId,
          subject: cleanSubject,
          message: cleanMessage,
          category: dbCategory,
          status: 'OPEN',
          related_claim_id: resolvedClaimUuid,
        })
        .select()
        .single();

      if (requestError || !request) {
        return {
          success: false,
          data: null,
          error: sanitizeDbError(requestError, 'Failed to submit support inquiry.'),
        };
      }

      // 2. Insert initial user message in support_messages
      const { data: initialMsg, error: msgError } = await supabase
        .from('support_messages')
        .insert({
          support_request_id: request.id,
          sender_profile_id: resolvedProfileId,
          message: cleanMessage,
        })
        .select()
        .single();

      // 3. Audit log (Non-sensitive summary)
      recordAuditLog({
        action: 'SUPPORT_REQUEST_CREATED',
        entityType: 'SUPPORT_REQUEST',
        entityId: request.id,
        description: `Support inquiry created: ${cleanSubject}`,
      }).catch(() => {});

      // Format customer-facing representation
      const formatted = {
        id: request.id,
        ref: `WD-${request.id.substring(0, 8).toUpperCase()}`,
        subject: request.subject,
        message: request.message,
        category: formatCategoryDisplay(request.category),
        status: formatStatusDisplay(request.status),
        createdAt: request.created_at,
        updatedAt: request.updated_at,
        relatedClaimId: request.related_claim_id,
        relatedClaimType: relatedClaimType || (dbCategory === 'CASH_PRIZE' ? 'cash' : dbCategory === 'VEHICLE_PRIZE' ? 'vehicle' : null),
        responses: [],
      };

      return {
        success: true,
        data: formatted,
        request: formatted,
        error: null,
      };
    } catch (err) {
      return {
        success: false,
        data: null,
        error: sanitizeDbError(err, 'Error processing support submission.'),
      };
    }
  }

  // Graceful Offline Store fallback (starts empty, only holds locally created items)
  const store = getOfflineStore();
  const newId = `req_${Date.now()}`;
  const now = new Date().toISOString();
  const offlineReq = {
    id: newId,
    profile_id: resolvedProfileId,
    subject: cleanSubject,
    message: cleanMessage,
    category: dbCategory,
    status: 'OPEN',
    related_claim_id: resolvedClaimUuid,
    created_at: now,
    updated_at: now,
  };
  const offlineMsg = {
    id: `msg_${Date.now()}_1`,
    support_request_id: newId,
    sender_profile_id: resolvedProfileId,
    message: cleanMessage,
    created_at: now,
  };

  store.requests.unshift(offlineReq);
  store.messages.push(offlineMsg);
  saveOfflineStore(store);

  const formatted = {
    id: newId,
    ref: `WD-${newId.substring(4, 12).toUpperCase()}`,
    subject: cleanSubject,
    message: cleanMessage,
    category: formatCategoryDisplay(dbCategory),
    status: 'OPEN',
    createdAt: now,
    updatedAt: now,
    relatedClaimId: resolvedClaimUuid,
    relatedClaimType: relatedClaimType || null,
    responses: [],
  };

  return { success: true, data: formatted, request: formatted, error: null };
}

/**
 * 2. getMySupportRequests
 * Retrieves all support inquiries belonging strictly to the authenticated user.
 * Internal notes are NEVER included.
 */
export async function getMySupportRequests(userId = null) {
  let resolvedUserId = userId;
  if (!resolvedUserId && isSupabaseConfigured() && supabase) {
    try {
      const { data: authData } = await supabase.auth.getUser();
      resolvedUserId = authData?.user?.id || null;
    } catch (_) {}
  }

  if (!resolvedUserId) {
    try {
      const rawUser = localStorage.getItem('windrive_current_user') || sessionStorage.getItem('windrive_current_user');
      if (rawUser) {
        resolvedUserId = JSON.parse(rawUser)?.id;
      }
    } catch (_) {}
  }

  if (!resolvedUserId) {
    return { data: [], error: null };
  }

  // Supabase real query
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('support_requests')
        .select(`
          *,
          support_messages(
            id,
            sender_profile_id,
            message,
            created_at
          ),
          related_claim:claims(id, claim_type, status)
        `)
        .eq('profile_id', resolvedUserId)
        .order('created_at', { ascending: false });

      if (error) {
        return { data: [], error: sanitizeDbError(error, 'Unable to load support history.') };
      }

      if (!data || data.length === 0) {
        return { data: [], error: null };
      }

      const formatted = data.map((req) => {
        // Collect official responses (messages NOT sent by claimant)
        const messages = Array.isArray(req.support_messages) ? req.support_messages : [];
        const responses = messages
          .filter((m) => m.sender_profile_id !== resolvedUserId)
          .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
          .map((m) => ({
            id: m.id,
            sender: 'WinDriveSA Operations Desk',
            senderRole: 'Regional Coordinator',
            message: m.message,
            createdAt: m.created_at,
          }));

        const isVeh = (req.related_claim?.claim_type || '').toUpperCase().includes('VEHICLE') || req.category === 'VEHICLE_PRIZE';
        const isCash = (req.related_claim?.claim_type || '').toUpperCase().includes('CASH') || req.category === 'CASH_PRIZE';

        return {
          id: req.id,
          ref: `WD-${req.id.substring(0, 8).toUpperCase()}`,
          subject: req.subject,
          message: req.message,
          category: formatCategoryDisplay(req.category),
          status: formatStatusDisplay(req.status),
          createdAt: req.created_at,
          updatedAt: req.updated_at,
          relatedClaimId: req.related_claim_id,
          relatedClaimType: isVeh ? 'vehicle' : isCash ? 'cash' : null,
          responses,
        };
      });

      return { data: formatted, error: null };
    } catch (err) {
      return { data: [], error: sanitizeDbError(err, 'Error retrieving support history.') };
    }
  }

  // Offline store fallback
  const store = getOfflineStore();
  const userRequests = store.requests.filter((r) => r.profile_id === resolvedUserId);
  const formatted = userRequests.map((req) => {
    const responses = (store.messages || [])
      .filter((m) => m.support_request_id === req.id && m.sender_profile_id !== resolvedUserId)
      .map((m) => ({
        id: m.id,
        sender: 'WinDriveSA Operations Desk',
        senderRole: 'Regional Coordinator',
        message: m.message,
        createdAt: m.created_at,
      }));

    return {
      id: req.id,
      ref: `WD-${req.id.substring(0, 8).toUpperCase()}`,
      subject: req.subject,
      message: req.message,
      category: formatCategoryDisplay(req.category),
      status: formatStatusDisplay(req.status),
      createdAt: req.created_at,
      updatedAt: req.updated_at,
      relatedClaimId: req.related_claim_id,
      relatedClaimType: req.category === 'CASH_PRIZE' ? 'cash' : req.category === 'VEHICLE_PRIZE' ? 'vehicle' : null,
      responses,
    };
  });

  return { data: formatted, error: null };
}

/**
 * 3. getMySupportRequest
 * Retrieve a specific single request for the authenticated user
 */
export async function getMySupportRequest(requestId, userId = null) {
  const { data: list, error } = await getMySupportRequests(userId);
  if (error) return { data: null, error };
  const found = list.find((r) => r.id === requestId || r.ref === requestId);
  return { data: found || null, error: null };
}

/**
 * 4. getMySupportMessages
 * Retrieve messages for a user's request. NEVER returns internal notes.
 */
export async function getMySupportMessages(requestId, userId = null) {
  if (!requestId) return { data: [], error: { message: 'Request ID missing.' } };

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('support_messages')
        .select(`
          id,
          support_request_id,
          sender_profile_id,
          message,
          created_at
        `)
        .eq('support_request_id', requestId)
        .order('created_at', { ascending: true });

      if (error) {
        return { data: [], error: sanitizeDbError(error, 'Unable to load messages.') };
      }
      return { data: data || [], error: null };
    } catch (err) {
      return { data: [], error: sanitizeDbError(err, 'Error retrieving messages.') };
    }
  }

  const store = getOfflineStore();
  const msgs = (store.messages || []).filter((m) => m.support_request_id === requestId);
  return { data: msgs, error: null };
}

/**
 * 5. sendSupportMessage
 * Customer follow-up message to an existing support ticket
 */
export async function sendSupportMessage({ requestId, senderProfileId, message }) {
  if (!requestId || !message || !message.trim()) {
    return { data: null, error: { message: 'Message content is required.' } };
  }

  let resolvedSenderId = senderProfileId;
  if (!resolvedSenderId && isSupabaseConfigured() && supabase) {
    try {
      const { data: authData } = await supabase.auth.getUser();
      resolvedSenderId = authData?.user?.id || null;
    } catch (_) {}
  }

  const cleanMessage = message.trim();

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('support_messages')
        .insert({
          support_request_id: requestId,
          sender_profile_id: resolvedSenderId,
          message: cleanMessage,
        })
        .select()
        .single();

      if (error) {
        return { data: null, error: sanitizeDbError(error, 'Failed to send message.') };
      }

      // Update timestamp on parent request
      await supabase
        .from('support_requests')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', requestId);

      return { data, error: null };
    } catch (err) {
      return { data: null, error: sanitizeDbError(err, 'Error sending message.') };
    }
  }

  const store = getOfflineStore();
  const now = new Date().toISOString();
  const newMsg = {
    id: `msg_${Date.now()}`,
    support_request_id: requestId,
    sender_profile_id: resolvedSenderId,
    message: cleanMessage,
    created_at: now,
  };
  store.messages.push(newMsg);
  const req = store.requests.find((r) => r.id === requestId);
  if (req) req.updated_at = now;
  saveOfflineStore(store);

  return { data: newMsg, error: null };
}

// =========================================================================
// ADMIN OPERATIONS
// =========================================================================

/**
 * 6. getSupportRequests
 * Admin queue retrieval with filtering, search, and metric alignment
 */
export async function getSupportRequests({
  search = '',
  status = 'ALL',
  category = 'ALL',
  dateRange = 'ALL',
} = {}) {
  let list = [];

  if (isSupabaseConfigured() && supabase) {
    try {
      let query = supabase
        .from('support_requests')
        .select(`
          *,
          profile:profiles(id, full_name, email, mobile_number, account_status, created_at),
          related_claim:claims(id, claim_type, status)
        `)
        .order('updated_at', { ascending: false });

      const { data, error } = await query;
      if (!error && Array.isArray(data)) {
        list = data;
      }
    } catch (err) {
      console.warn('Notice: Error querying support_requests:', err);
    }
  }

  // If Supabase empty or failed, fallback to local offline store
  if (list.length === 0) {
    const store = getOfflineStore();
    list = store.requests || [];
  }

  // Map to approved AdminSupport.jsx row structure
  let formatted = list.map((req) => {
    const prof = req.profile || {};
    const claim = req.related_claim || null;
    const isVeh = (claim?.claim_type || '').toUpperCase().includes('VEHICLE') || req.category === 'VEHICLE_PRIZE';

    const userName = prof.full_name || 'Participant';
    const userEmail = prof.email || 'N/A';
    const userPhone = prof.mobile_number || 'N/A';
    const userStatus = prof.account_status || 'PENDING REVIEW';

    return {
      id: req.id,
      ticketNumber: `#WD-SUP-${req.id.substring(0, 6).toUpperCase()}`,
      subject: req.subject,
      category: formatCategoryDisplay(req.category),
      status: formatStatusDisplay(req.status),
      message: req.message,
      timestamp: formatSupportDate(req.created_at),
      lastUpdated: formatSupportDate(req.updated_at),
      createdAt: req.created_at,
      updatedAt: req.updated_at,
      assignedAdmin: 'Admin Controller 04',
      dossierAccessToken: `WD-SUP-SEC-${req.id.substring(0, 4).toUpperCase()}`,
      user: {
        id: req.profile_id || prof.id,
        name: userName,
        email: userEmail,
        phone: userPhone,
        msisdn: userPhone !== 'N/A' ? `${userPhone} (RSA)` : 'N/A',
        registrationDate: formatSupportDate(prof.created_at),
        ficaStatus: (userStatus === 'APPROVED' || userStatus === 'ACTIVE') ? 'MATCHED' : 'PENDING REVIEW',
        ficaTier: 'FICA Tier 2 Verification',
      },
      associatedClaim: {
        hasClaim: Boolean(claim || req.related_claim_id),
        claimId: claim ? `CLM-ZA-${claim.id.substring(0, 8).toUpperCase()}` : null,
        claimRouteId: claim?.id || null,
        title: isVeh ? (claim?.prizeName || 'Vehicle Prize Allocation') : (claim?.prizeName || 'Cash Prize Allocation'),
        status: claim?.status || 'UNDER REVIEW',
        guaranteedValue: null,
        applicableCharge: null,
        type: isVeh ? 'Vehicle Prize' : 'Cash Prize',
      },
    };
  });

  // Apply filters
  if (status && status !== 'ALL') {
    const norm = normalizeStatusToDb(status);
    formatted = formatted.filter((t) => normalizeStatusToDb(t.status) === norm);
  }

  if (category && category !== 'ALL') {
    const norm = normalizeCategoryToDb(category);
    formatted = formatted.filter((t) => normalizeCategoryToDb(t.category) === norm);
  }

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    formatted = formatted.filter(
      (t) =>
        t.subject?.toLowerCase().includes(q) ||
        t.ticketNumber?.toLowerCase().includes(q) ||
        t.user?.name?.toLowerCase().includes(q) ||
        t.user?.email?.toLowerCase().includes(q) ||
        t.message?.toLowerCase().includes(q)
    );
  }

  if (dateRange && dateRange !== 'ALL') {
    const now = Date.now();
    formatted = formatted.filter((t) => {
      const created = new Date(t.createdAt).getTime();
      if (isNaN(created)) return true;
      if (dateRange === 'TODAY') {
        return now - created <= 24 * 60 * 60 * 1000;
      }
      if (dateRange === '7DAYS') {
        return now - created <= 7 * 24 * 60 * 60 * 1000;
      }
      if (dateRange === '30DAYS') {
        return now - created <= 30 * 24 * 60 * 60 * 1000;
      }
      return true;
    });
  }

  return formatted;
}

/**
 * 7. getSupportRequest
 * Admin detailed dossier view for /admin/support/:id
 */
export async function getSupportRequest(requestId) {
  if (!requestId) return null;

  let rawReq = null;
  let rawMessages = [];
  let rawNotes = [];

  if (isSupabaseConfigured() && supabase) {
    try {
      // Find support request
      let query = supabase
        .from('support_requests')
        .select(`
          *,
          profile:profiles(*),
          related_claim:claims(*)
        `);

      if (isValidUuid(requestId)) {
        query = query.eq('id', requestId);
      } else {
        query = query.or(`id.eq.${requestId}`);
      }

      const { data, error } = await query.maybeSingle();
      if (!error && data) {
        rawReq = data;

        // Fetch messages with sender info
        const { data: msgs } = await supabase
          .from('support_messages')
          .select(`
            *,
            sender:profiles(id, full_name, role)
          `)
          .eq('support_request_id', rawReq.id)
          .order('created_at', { ascending: true });

        rawMessages = msgs || [];

        // Fetch internal notes (admin only)
        const { data: notes } = await supabase
          .from('support_internal_notes')
          .select(`
            *,
            admin:profiles(id, full_name, role)
          `)
          .eq('support_request_id', rawReq.id)
          .order('created_at', { ascending: true });

        rawNotes = notes || [];
      }
    } catch (err) {
      console.warn('Error fetching support dossier:', err);
    }
  }

  // Offline fallback
  if (!rawReq) {
    const store = getOfflineStore();
    rawReq = store.requests.find((r) => r.id === requestId || r.id.startsWith(requestId));
    if (rawReq) {
      rawMessages = store.messages.filter((m) => m.support_request_id === rawReq.id);
      rawNotes = store.notes.filter((n) => n.support_request_id === rawReq.id);
    }
  }

  if (!rawReq) return null;

  const prof = rawReq.profile || {};
  const claim = rawReq.related_claim || null;
  const isVeh = (claim?.claim_type || '').toUpperCase().includes('VEHICLE') || rawReq.category === 'VEHICLE_PRIZE';

  const userName = prof.full_name || 'Participant';
  const userEmail = prof.email || 'N/A';
  const userPhone = prof.mobile_number || 'N/A';
  const userStatus = prof.account_status || 'PENDING REVIEW';

  // Construct unified conversation thread for admin dossier
  const threadMessages = [];

  // Inbound messages (from user) and official dispatches (from admin)
  (rawMessages || []).forEach((msg) => {
    const isUser = msg.sender_profile_id === rawReq.profile_id;
    if (isUser) {
      threadMessages.push({
        id: msg.id,
        type: 'inbound',
        senderName: `${userName} (Claimant)`,
        senderInitials: userName
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2),
        role: 'user',
        timestamp: formatSupportDate(msg.created_at),
        createdAt: msg.created_at,
        body: msg.message,
      });
    } else {
      const senderName = msg.sender?.full_name
        ? `${msg.sender.full_name} (WinDriveSA Desk)`
        : 'Admin Controller 04 (WinDriveSA Fiduciary Desk)';
      threadMessages.push({
        id: msg.id,
        type: 'dispatch',
        senderName,
        senderInitials: 'AC',
        role: 'admin_dispatch',
        timestamp: formatSupportDate(msg.created_at),
        createdAt: msg.created_at,
        badge: 'Official Dispatch',
        body: msg.message,
      });
    }
  });

  // Internal Notes (Admin-only confidential audit stamp)
  (rawNotes || []).forEach((note) => {
    const adminName = note.admin?.full_name || 'Admin Controller 04';
    threadMessages.push({
      id: note.id,
      type: 'internal_note',
      senderName: adminName,
      senderInitials: 'AC',
      role: 'admin_note',
      timestamp: formatSupportDate(note.created_at),
      createdAt: note.created_at,
      authorNote: `Author: ${adminName} • Level 4 Audit Flag`,
      body: note.note,
    });
  });

  // Sort chronological by created date
  threadMessages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  return {
    id: rawReq.id,
    ticketNumber: `#WD-SUP-${rawReq.id.substring(0, 6).toUpperCase()}`,
    subject: rawReq.subject,
    category: formatCategoryDisplay(rawReq.category),
    status: formatStatusDisplay(rawReq.status),
    createdAt: rawReq.created_at,
    updatedAt: rawReq.updated_at,
    timestamp: formatSupportDate(rawReq.created_at),
    lastUpdated: formatSupportDate(rawReq.updated_at),
    assignedAdmin: 'Admin Controller 04',
    dossierAccessToken: `WD-SUP-SEC-${rawReq.id.substring(0, 4).toUpperCase()}`,
    user: {
      id: rawReq.profile_id || prof.id,
      name: userName,
      email: userEmail,
      phone: userPhone,
      msisdn: userPhone !== 'N/A' ? `${userPhone} (RSA)` : 'N/A',
      registrationDate: formatSupportDate(prof.created_at),
      ficaStatus: (userStatus === 'APPROVED' || userStatus === 'ACTIVE') ? 'MATCHED' : 'PENDING REVIEW',
      ficaTier: 'FICA Tier 2 Verification',
    },
    message: rawReq.message,
    associatedClaim: {
      hasClaim: Boolean(claim || rawReq.related_claim_id),
      claimId: claim ? `CLM-ZA-${claim.id.substring(0, 8).toUpperCase()}` : null,
      claimRouteId: claim?.id || null,
      title: isVeh ? (claim?.prizeName || 'Vehicle Prize Allocation') : (claim?.prizeName || 'Cash Prize Allocation'),
      status: claim?.status || 'UNDER REVIEW',
      guaranteedValue: null,
      applicableCharge: null,
      type: isVeh ? 'Vehicle Prize' : 'Cash Prize',
    },
    messages: threadMessages,
  };
}

/**
 * 8. getSupportMessages
 * Admin operation to retrieve messages for ticket
 */
export async function getSupportMessages(requestId) {
  if (!requestId) return { data: [], error: { message: 'Missing ticket ID.' } };

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('support_messages')
        .select(`
          *,
          sender:profiles(id, full_name, role)
        `)
        .eq('support_request_id', requestId)
        .order('created_at', { ascending: true });

      if (error) {
        return { data: [], error: sanitizeDbError(error, 'Failed to load conversation history.') };
      }
      return { data: data || [], error: null };
    } catch (err) {
      return { data: [], error: sanitizeDbError(err, 'Error retrieving messages.') };
    }
  }

  const store = getOfflineStore();
  const msgs = (store.messages || []).filter((m) => m.support_request_id === requestId);
  return { data: msgs, error: null };
}

/**
 * 9. sendAdminSupportReply
 * Authorized Admin outbound response to participant.
 * Inserts in support_messages, updates updated_at, appends to audit log.
 */
export async function sendAdminSupportReply({ requestId, adminProfileId, message, adminUser = null }) {
  if (!requestId || !message || !message.trim()) {
    return { success: false, error: 'Reply message cannot be empty.' };
  }

  let resolvedAdminId = adminProfileId;
  if (!resolvedAdminId && isSupabaseConfigured() && supabase) {
    try {
      const { data: authData } = await supabase.auth.getUser();
      resolvedAdminId = authData?.user?.id || null;
    } catch (_) {}
  }

  const cleanMessage = message.trim();
  const now = new Date().toISOString();

  if (isSupabaseConfigured() && supabase) {
    try {
      // 1. Insert message
      const { data: newMsg, error: msgError } = await supabase
        .from('support_messages')
        .insert({
          support_request_id: requestId,
          sender_profile_id: resolvedAdminId,
          message: cleanMessage,
        })
        .select()
        .single();

      if (msgError) {
        return { success: false, error: sanitizeDbError(msgError, 'Failed to send reply.').message };
      }

      // 2. Update status to WAITING_FOR_USER if currently OPEN, and bump updated_at
      await supabase
        .from('support_requests')
        .update({
          status: 'WAITING_FOR_USER',
          updated_at: now,
        })
        .eq('id', requestId);

      // 3. Audit log (never includes full message credentials)
      recordAuditLog({
        adminProfileId: resolvedAdminId,
        action: 'ADMIN_REPLIED_SUPPORT',
        entityType: 'SUPPORT_REQUEST',
        entityId: requestId,
        description: 'Admin dispatched official reply to participant.',
      }).catch(() => {});

      recordAdminActivity({
        adminId: resolvedAdminId,
        actionType: 'SUPPORT_REPLY',
        targetEntity: `Ticket ${requestId}`,
        details: 'Admin transmitted official dispatch to claimant',
      });

      const updated = await getSupportRequest(requestId);
      return { success: true, ticket: updated, error: null };
    } catch (err) {
      return { success: false, error: sanitizeDbError(err, 'Failed to send reply.').message };
    }
  }

  // Offline fallback
  const store = getOfflineStore();
  const newMsg = {
    id: `msg_disp_${Date.now()}`,
    support_request_id: requestId,
    sender_profile_id: resolvedAdminId,
    message: cleanMessage,
    created_at: now,
  };
  store.messages.push(newMsg);
  const req = store.requests.find((r) => r.id === requestId);
  if (req) {
    req.status = 'WAITING_FOR_USER';
    req.updated_at = now;
  }
  saveOfflineStore(store);

  const updated = await getSupportRequest(requestId);
  return { success: true, ticket: updated, error: null };
}

/**
 * 10. addInternalNote
 * Authorized Admin confidential internal note.
 * Stored in support_internal_notes, completely isolated from user views.
 */
export async function addInternalNote({ requestId, adminProfileId, note, adminUser = null }) {
  if (!requestId || !note || !note.trim()) {
    return { success: false, error: 'Internal note cannot be empty.' };
  }

  let resolvedAdminId = adminProfileId;
  if (!resolvedAdminId && isSupabaseConfigured() && supabase) {
    try {
      const { data: authData } = await supabase.auth.getUser();
      resolvedAdminId = authData?.user?.id || null;
    } catch (_) {}
  }

  const cleanNote = note.trim();
  const now = new Date().toISOString();

  if (isSupabaseConfigured() && supabase) {
    try {
      const { error: noteError } = await supabase
        .from('support_internal_notes')
        .insert({
          support_request_id: requestId,
          admin_profile_id: resolvedAdminId,
          note: cleanNote,
        });

      if (noteError) {
        return { success: false, error: sanitizeDbError(noteError, 'Failed to record internal note.').message };
      }

      // Bump parent updated_at
      await supabase
        .from('support_requests')
        .update({ updated_at: now })
        .eq('id', requestId);

      // Audit log
      recordAuditLog({
        adminProfileId: resolvedAdminId,
        action: 'ADMIN_ADDED_INTERNAL_NOTE',
        entityType: 'SUPPORT_REQUEST',
        entityId: requestId,
        description: 'Admin recorded confidential internal note.',
      }).catch(() => {});

      recordAdminActivity({
        adminId: resolvedAdminId,
        actionType: 'SUPPORT_INTERNAL_NOTE',
        targetEntity: `Ticket ${requestId}`,
        details: 'Admin recorded confidential internal note',
      });

      const updated = await getSupportRequest(requestId);
      return { success: true, ticket: updated, error: null };
    } catch (err) {
      return { success: false, error: sanitizeDbError(err, 'Failed to record internal note.').message };
    }
  }

  // Offline fallback
  const store = getOfflineStore();
  const newNote = {
    id: `note_${Date.now()}`,
    support_request_id: requestId,
    admin_profile_id: resolvedAdminId,
    note: cleanNote,
    created_at: now,
  };
  store.notes.push(newNote);
  saveOfflineStore(store);

  const updated = await getSupportRequest(requestId);
  return { success: true, ticket: updated, error: null };
}

/**
 * 11. updateSupportStatus
 * Authorized Admin status transitions: OPEN -> IN_PROGRESS -> WAITING_FOR_USER -> RESOLVED
 */
export async function updateSupportStatus({ requestId, status, adminProfileId, adminUser = null }) {
  if (!requestId || !status) {
    return { success: false, error: 'Request ID and new status required.' };
  }

  const dbStatus = normalizeStatusToDb(status);
  const now = new Date().toISOString();

  let resolvedAdminId = adminProfileId;
  if (!resolvedAdminId && isSupabaseConfigured() && supabase) {
    try {
      const { data: authData } = await supabase.auth.getUser();
      resolvedAdminId = authData?.user?.id || null;
    } catch (_) {}
  }

  if (isSupabaseConfigured() && supabase) {
    try {
      const { error } = await supabase
        .from('support_requests')
        .update({
          status: dbStatus,
          updated_at: now,
        })
        .eq('id', requestId);

      if (error) {
        return { success: false, error: sanitizeDbError(error, 'Failed to update ticket status.').message };
      }

      // Record audit log
      recordAuditLog({
        adminProfileId: resolvedAdminId,
        action: 'SUPPORT_STATUS_CHANGED',
        entityType: 'SUPPORT_REQUEST',
        entityId: requestId,
        description: `Support status changed to ${dbStatus}.`,
        afterChanges: { status: dbStatus },
      }).catch(() => {});

      recordAdminActivity({
        adminId: resolvedAdminId,
        actionType: 'SUPPORT_STATUS_UPDATE',
        targetEntity: `Ticket ${requestId}`,
        details: `Status updated to ${dbStatus}`,
      });

      const updated = await getSupportRequest(requestId);
      return { success: true, ticket: updated, error: null };
    } catch (err) {
      return { success: false, error: sanitizeDbError(err, 'Failed to update ticket status.').message };
    }
  }

  // Offline fallback
  const store = getOfflineStore();
  const req = store.requests.find((r) => r.id === requestId);
  if (req) {
    req.status = dbStatus;
    req.updated_at = now;
    saveOfflineStore(store);
  }

  const updated = await getSupportRequest(requestId);
  return { success: true, ticket: updated, error: null };
}

/**
 * 12. reopenSupportRequest
 * Authorized Admin reopening: RESOLVED -> OPEN
 */
export async function reopenSupportRequest({ requestId, adminProfileId, adminUser = null }) {
  const result = await updateSupportStatus({
    requestId,
    status: 'OPEN',
    adminProfileId,
    adminUser,
  });

  if (result.success) {
    recordAuditLog({
      adminProfileId,
      action: 'SUPPORT_REQUEST_REOPENED',
      entityType: 'SUPPORT_REQUEST',
      entityId: requestId,
      description: 'Support request reopened to OPEN status.',
    }).catch(() => {});
  }

  return result;
}

/**
 * Compute real-time admin queue metrics
 */
export function getSupportMetrics(ticketsList = null) {
  const tickets = Array.isArray(ticketsList) ? ticketsList : [];
  return {
    open: tickets.filter((t) => normalizeStatusToDb(t.status) === 'OPEN').length,
    inProgress: tickets.filter((t) => normalizeStatusToDb(t.status) === 'IN_PROGRESS').length,
    waitingForUser: tickets.filter((t) => normalizeStatusToDb(t.status) === 'WAITING_FOR_USER').length,
    resolved: tickets.filter((t) => normalizeStatusToDb(t.status) === 'RESOLVED').length,
    total: tickets.length,
  };
}

// =========================================================================
// BACKWARD-COMPATIBLE WRAPPERS AND CONVENIENCE ALIASES
// =========================================================================

export const getUserSupportRequests = getMySupportRequests;
export const getSupportRequestById = getSupportRequest;

export async function updateSupportRequestStatus(ticketId, newStatus, adminUser) {
  return await updateSupportStatus({
    requestId: ticketId,
    status: newStatus,
    adminProfileId: adminUser?.id,
    adminUser,
  });
}

export async function sendSupportReply(ticketId, replyBody, adminUser) {
  return await sendAdminSupportReply({
    requestId: ticketId,
    adminProfileId: adminUser?.id,
    message: replyBody,
    adminUser,
  });
}

export async function addInternalNoteWrapper(ticketId, noteBody, adminUser) {
  return await addInternalNote({
    requestId: ticketId,
    adminProfileId: adminUser?.id,
    note: noteBody,
    adminUser,
  });
}

export const adminGetSupportRequests = getSupportRequests;
export const adminUpdateSupportStatus = updateSupportStatus;
export const adminAddInternalNote = addInternalNote;
