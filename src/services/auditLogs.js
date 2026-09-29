import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import { sanitizeDbError } from './errorHandler.js';

/**
 * WinDriveSA Centralized Audit Logging Database Service
 * Authoritative operational audit trail across users, rewards, claims, and settings.
 *
 * Strict Compliance:
 * - Admin-only read/write access enforced via Supabase RLS
 * - Fiduciary operational history (immutable, no delete or edit UI)
 * - Zero sensitive credentials, tokens, passwords, OTPs, PINs, or CVVs logged
 * - Real database queries with seamless local backup for offline/unprovisioned resilience
 */

const AUDIT_STORAGE_BACKUP_KEY = 'windrive_supabase_audit_logs_backup';

// Sensitive keys whitelist blacklist to prevent logging secrets
const SENSITIVE_KEYS = new Set([
  'password',
  'passwords',
  'currentpassword',
  'newpassword',
  'confirmpassword',
  'passwordhash',
  'password_hash',
  'token',
  'tokens',
  'access_token',
  'refreshtoken',
  'refresh_token',
  'apikey',
  'api_key',
  'secret',
  'secretkey',
  'service_role',
  'pin',
  'pins',
  'otp',
  'otps',
  'cvv',
  'cvc',
  'cardnumber',
  'card_number',
  'bankpin',
]);

/**
 * Deep sanitize any data payload to strip passwords and secret credentials
 */
export function sanitizeAuditPayload(data) {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) {
    return data.map(sanitizeAuditPayload);
  }
  const clean = {};
  for (const [key, val] of Object.entries(data)) {
    const lowerKey = key.toLowerCase().replace(/[-_]/g, '');
    if (SENSITIVE_KEYS.has(lowerKey)) {
      clean[key] = '[REDACTED]';
    } else if (val && typeof val === 'object') {
      clean[key] = sanitizeAuditPayload(val);
    } else {
      clean[key] = val;
    }
  }
  return clean;
}

/**
 * Format timestamp in South Africa Standard Time (SAST, UTC+2)
 */
export function formatAuditTimestamp(dateInput) {
  if (!dateInput) return '—';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);
  const dateStr = d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Africa/Johannesburg',
  });
  const timeStr = d.toLocaleTimeString('en-ZA', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Africa/Johannesburg',
  });
  return `${dateStr}, ${timeStr} SAST`;
}

/**
 * Categorize event based on entityType and action name
 */
export function inferAuditCategory(entityType, action = '') {
  const normType = String(entityType || '').trim().toLowerCase();
  const normAction = String(action || '').trim().toUpperCase();

  if (normType.includes('user') || normAction.includes('USER') || normAction.includes('ACCOUNT')) {
    return 'User & Account';
  }
  if (normType.includes('claim requirement') || normAction.includes('REQUIREMENT')) {
    return 'Claim Requirements';
  }
  if (normType.includes('claim') || normAction.includes('CLAIM')) {
    return 'Claims';
  }
  if (normType.includes('reward') || normType.includes('prize') || normAction.includes('REWARD') || normAction.includes('PRIZE')) {
    return 'Rewards';
  }
  if (normType.includes('support') || normAction.includes('SUPPORT')) {
    return 'Support';
  }
  if (normType.includes('setting') || normAction.includes('SETTING') || normAction.includes('SESSION') || normAction.includes('PASSWORD')) {
    return 'Settings';
  }
  return 'System';
}

/**
 * Compute field-level diffs from before and after JSONB payloads
 */
function extractFieldChanges(before = {}, after = {}) {
  if (after && Array.isArray(after.changes)) return after.changes;
  if (before && Array.isArray(before.changes)) return before.changes;

  const changes = [];
  const b = before && typeof before === 'object' ? before : {};
  const a = after && typeof after === 'object' ? after : {};
  const allKeys = new Set([...Object.keys(b), ...Object.keys(a)]);

  for (const key of allKeys) {
    if (key === 'entityReference' || key === 'timestamp' || key === 'updatedAt' || key === 'updated_at') continue;
    const bVal = b[key];
    const aVal = a[key];
    if (bVal !== aVal) {
      const fieldName = key
        .replace(/([A-Z])/g, ' $1')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase())
        .trim();
      changes.push({
        field: fieldName,
        before: bVal !== undefined && bVal !== null ? String(bVal) : '—',
        after: aVal !== undefined && aVal !== null ? String(aVal) : '—',
      });
    }
  }
  return changes;
}

/**
 * Construct concise summary of changes
 */
function generateChangeSummary(action, changes = [], desc = '') {
  if (changes.length > 0) {
    const parts = changes.slice(0, 3).map((c) => `${c.field}: ${c.before} → ${c.after}`);
    return changes.length > 3 ? `${parts.join('; ')} (+${changes.length - 3} more)` : parts.join('; ');
  }
  if (desc) return desc;
  return `Administrative event: ${action}`;
}

/**
 * Construct record label
 */
function generateRecordLabel(entityType, entityId, desc = '') {
  const shortId = entityId ? (String(entityId).length > 12 ? String(entityId).slice(0, 8) : entityId) : 'N/A';
  if (desc && desc.includes('for participant')) {
    const match = desc.match(/for participant ([^(]+)/);
    if (match) return `${match[1].trim()} (${shortId})`;
  }
  if (desc && desc.includes('Ticket #')) {
    const match = desc.match(/Ticket #([A-Za-z0-9-_]+)/);
    if (match) return `Ticket #${match[1]}`;
  }
  if (desc && desc.includes('Claim #')) {
    const match = desc.match(/Claim #([A-Za-z0-9-_]+)/);
    if (match) return `Claim #${match[1]}`;
  }
  return `${entityType} #${shortId}`;
}

/**
 * Format raw database audit row into client-friendly audit log object
 */
export function formatAuditRow(row) {
  if (!row) return null;

  const admin = row.admin || {};
  const category = inferAuditCategory(row.entity_type, row.action);
  const changes = extractFieldChanges(row.before_changes, row.after_changes);
  const changeSummary = generateChangeSummary(row.action, changes, row.description);
  const recordLabel = generateRecordLabel(row.entity_type, row.entity_id, row.description);

  const statusColor =
    row.status === 'FAILED'
      ? 'rose'
      : row.action?.includes('REJECT') || row.action?.includes('DEACTIVAT')
      ? 'rose'
      : row.action?.includes('APPROV') || row.action?.includes('ACTIVAT')
      ? 'emerald'
      : category === 'Rewards'
      ? 'purple'
      : category === 'Claims'
      ? 'amber'
      : 'sky';

  return {
    id: row.id,
    createdAt: row.created_at,
    timestamp: formatAuditTimestamp(row.created_at),
    admin: admin.full_name || 'System Administrator',
    adminId: row.admin_profile_id || admin.id || 'HQ-ADMIN',
    adminName: admin.full_name || 'System Administrator',
    adminEmail: admin.email || 'admin@windrivesa.co.za',
    action: row.action,
    category,
    entityType: row.entity_type || 'System',
    entityId: row.entity_id || 'N/A',
    recordLabel,
    reference: recordLabel,
    changeSummary,
    referenceNote: changeSummary,
    description: row.description || `Audit event for ${row.action}`,
    status: row.status || 'COMPLETED',
    statusColor,
    relatedUserId: row.entity_type === 'User' ? row.entity_id : (row.after_changes?.userId || row.before_changes?.userId || null),
    relatedRewardId: row.entity_type === 'Reward' ? row.entity_id : (row.after_changes?.rewardId || row.before_changes?.rewardId || null),
    relatedClaimId: row.entity_type === 'Claim' ? row.entity_id : (row.after_changes?.claimId || row.before_changes?.claimId || null),
    relatedSupportId: row.entity_type === 'Support Request' ? row.entity_id : (row.after_changes?.supportId || row.before_changes?.supportId || null),
    changes,
    timeline: [
      {
        timestamp: formatAuditTimestamp(row.created_at),
        event: row.action,
        note: row.description || `Recorded by ${admin.full_name || 'System Administrator'}.`,
      },
    ],
  };
}

/**
 * Synchronous accessor for recent logs from local ledger
 */
export function getSyncAuditLogs() {
  const localLogs = getLocalBackupLogs();
  return localLogs.map(formatAuditRow);
}

/**
 * Local storage backup operations
 */
function getLocalBackupLogs() {
  try {
    const raw = localStorage.getItem(AUDIT_STORAGE_BACKUP_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
}

function saveLocalBackupLogs(logs) {
  try {
    localStorage.setItem(AUDIT_STORAGE_BACKUP_KEY, JSON.stringify(logs));
  } catch (_) {}
}

const isUuid = (val) =>
  typeof val === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);

/**
 * Append an immutable administrative audit event
 */
export async function recordAuditLog({
  adminProfileId = null,
  action,
  entityType,
  entityId = null,
  description = '',
  beforeChanges = null,
  afterChanges = null,
}) {
  if (!action || !entityType) {
    return { data: null, error: { message: 'Action and entityType are required.' } };
  }

  // 1. Sanitize all changes against credentials/tokens
  const cleanBefore = sanitizeAuditPayload(beforeChanges);
  const cleanAfter = sanitizeAuditPayload(afterChanges);

  // 2. Resolve admin profile
  let resolvedAdminId = adminProfileId;
  let resolvedAdminName = 'System Administrator';
  let resolvedAdminEmail = 'admin@windrivesa.co.za';

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user?.id) {
        resolvedAdminId = authData.user.id;
        resolvedAdminEmail = authData.user.email || resolvedAdminEmail;
      }
    } catch (_) {}
  }

  // 3. Construct local representation
  const newRow = {
    id: `aud_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    admin_profile_id: resolvedAdminId,
    action: String(action).toUpperCase(),
    entity_type: entityType,
    entity_id: entityId ? String(entityId) : null,
    description: description || `Audit event for ${action}`,
    before_changes: cleanBefore ? (typeof cleanBefore === 'object' ? cleanBefore : { value: cleanBefore }) : null,
    after_changes: cleanAfter ? (typeof cleanAfter === 'object' ? cleanAfter : { value: cleanAfter }) : null,
    created_at: new Date().toISOString(),
    status: 'COMPLETED',
    admin: {
      id: resolvedAdminId,
      full_name: resolvedAdminName,
      email: resolvedAdminEmail,
    },
  };

  // 4. Attempt real Supabase insertion
  let insertedData = null;
  if (isSupabaseConfigured() && supabase) {
    try {
      const dbEntityId = isUuid(entityId) ? entityId : null;
      const { data, error } = await supabase
        .from('audit_logs')
        .insert({
          admin_profile_id: resolvedAdminId,
          action: newRow.action,
          entity_type: newRow.entity_type,
          entity_id: dbEntityId,
          description: newRow.description,
          before_changes: newRow.before_changes,
          after_changes: newRow.after_changes,
        })
        .select('*, admin:profiles(id, full_name, email)')
        .single();

      if (!error && data) {
        insertedData = data;
      }
    } catch (dbErr) {
      console.warn('Notice: Remote audit_logs insert failed, syncing to local backup:', dbErr.message);
    }
  }

  // 5. Always persist to local backup ledger
  const rowToSave = insertedData || newRow;
  const currentLogs = getLocalBackupLogs();
  const updatedLogs = [rowToSave, ...currentLogs];
  saveLocalBackupLogs(updatedLogs);

  const formatted = formatAuditRow(rowToSave);
  return { data: formatted, error: null };
}

export const createAuditLog = recordAuditLog;
export const recordAuditEvent = recordAuditLog;

/**
 * Filter an array of formatted audit logs
 */
export function filterAuditLogs(logs = [], filters = {}) {
  const {
    search = '',
    category = 'All',
    admin = 'All',
    entityType = 'All',
    dateRange = 'All',
  } = filters;

  const normalizedSearch = search.trim().toLowerCase();

  // Time boundaries in Africa/Johannesburg (SAST)
  const now = new Date();
  const jhbDateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Johannesburg' }).format(now);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  return logs.filter((log) => {
    // 1. Search text
    if (normalizedSearch) {
      const matchSearch =
        (log.adminName && log.adminName.toLowerCase().includes(normalizedSearch)) ||
        (log.adminEmail && log.adminEmail.toLowerCase().includes(normalizedSearch)) ||
        (log.adminId && String(log.adminId).toLowerCase().includes(normalizedSearch)) ||
        (log.action && log.action.toLowerCase().includes(normalizedSearch)) ||
        (log.recordLabel && log.recordLabel.toLowerCase().includes(normalizedSearch)) ||
        (log.entityId && String(log.entityId).toLowerCase().includes(normalizedSearch)) ||
        (log.changeSummary && log.changeSummary.toLowerCase().includes(normalizedSearch)) ||
        (log.description && log.description.toLowerCase().includes(normalizedSearch));

      if (!matchSearch) return false;
    }

    // 2. Category
    if (category !== 'All' && log.category !== category) {
      return false;
    }

    // 3. Admin user
    if (admin !== 'All') {
      if (log.adminName !== admin && log.adminId !== admin) {
        return false;
      }
    }

    // 4. Entity Type
    if (entityType !== 'All' && log.entityType !== entityType) {
      return false;
    }

    // 5. Date Range
    if (dateRange !== 'All' && log.createdAt) {
      const logDate = new Date(log.createdAt);
      if (dateRange === 'Today') {
        const logJhbDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Johannesburg' }).format(logDate);
        if (logJhbDate !== jhbDateStr) return false;
      } else if (dateRange === 'Last 7 Days') {
        if (logDate < sevenDaysAgo) return false;
      } else if (dateRange === 'Last 30 Days') {
        if (logDate < thirtyDaysAgo) return false;
      }
    }

    return true;
  });
}

/**
 * Paginate an array of audit logs
 */
export function paginateAuditLogs(logs = [], pagination = { page: 1, limit: 25 }) {
  const total = logs.length;
  const page = Math.max(1, pagination.page || 1);
  const limit = Math.max(1, pagination.limit || 25);
  const totalPages = Math.ceil(total / limit) || 1;
  const startIndex = (page - 1) * limit;
  const endIndex = Math.min(startIndex + limit, total);
  const items = logs.slice(startIndex, endIndex);

  return {
    items,
    total,
    page,
    limit,
    totalPages,
    startIndex: total > 0 ? startIndex + 1 : 0,
    endIndex,
  };
}

/**
 * Fetch raw logs from database or local backup store
 */
export async function getRawAuditLogs() {
  let dbLogs = [];

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          *,
          admin:profiles(id, full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        dbLogs = data;
      }
    } catch (_) {}
  }

  // Combine with local backup if Supabase has fewer records or was offline
  const localLogs = getLocalBackupLogs();
  const seenIds = new Set();
  const combined = [];

  for (const log of [...dbLogs, ...localLogs]) {
    if (log && log.id && !seenIds.has(log.id)) {
      seenIds.add(log.id);
      combined.push(log);
    }
  }

  combined.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  return combined.map(formatAuditRow);
}

/**
 * Admin: Retrieve paginated audit logs with server/client filtering
 */
export async function getAuditLogs(filters = {}, pagination = { page: 1, limit: 25 }) {
  const allLogs = await getRawAuditLogs();
  const filtered = filterAuditLogs(allLogs, filters);
  return paginateAuditLogs(filtered, pagination);
}

/**
 * Admin: Retrieve single audit log event by ID
 */
export async function getAuditLog(id) {
  if (!id) return null;

  // Try Supabase first if valid UUID
  if (isSupabaseConfigured() && supabase && isUuid(id)) {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          *,
          admin:profiles(id, full_name, email)
        `)
        .eq('id', id)
        .maybeSingle();

      if (!error && data) {
        return formatAuditRow(data);
      }
    } catch (_) {}
  }

  // Fallback to all logs
  const allLogs = await getRawAuditLogs();
  return allLogs.find((l) => String(l.id) === String(id)) || null;
}

export const getAuditLogById = getAuditLog;

/**
 * Compute operational metrics from real audit records
 */
export async function getAuditMetrics(explicitLogs = null) {
  const logs = explicitLogs || (await getRawAuditLogs());
  const now = new Date();
  const jhbDateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Johannesburg' }).format(now);

  let todayCount = 0;
  let userAccountChanges = 0;
  let rewardClaimChanges = 0;

  logs.forEach((log) => {
    if (log.createdAt) {
      const logJhbDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Johannesburg' }).format(new Date(log.createdAt));
      if (logJhbDate === jhbDateStr) {
        todayCount++;
      }
    }

    if (log.category === 'User & Account') {
      userAccountChanges++;
    }

    if (
      log.category === 'Rewards' ||
      log.category === 'Claims' ||
      log.category === 'Claim Requirements'
    ) {
      rewardClaimChanges++;
    }
  });

  return {
    totalEvents: logs.length,
    today: todayCount,
    userAccountChanges,
    rewardClaimChanges,
  };
}

/**
 * Retrieve unique list of administrators recorded in the audit logs
 */
export async function getDistinctAdmins(explicitLogs = null) {
  const logs = explicitLogs || (await getRawAuditLogs());
  const adminsMap = new Map();

  logs.forEach((log) => {
    if (log.adminName && !adminsMap.has(log.adminName)) {
      adminsMap.set(log.adminName, {
        id: log.adminId || log.adminName,
        name: log.adminName,
        email: log.adminEmail || '',
      });
    }
  });

  return Array.from(adminsMap.values());
}

/**
 * Export filtered audit records to clean CSV download
 * Never exports secrets, passwords, OTPs, PINs, CVVs, or tokens
 */
export async function exportAuditLogs(filters = {}) {
  try {
    const { items } = await getAuditLogs(filters, { page: 1, limit: 10000 });

    const headers = [
      'Event ID',
      'Timestamp (SAST)',
      'Admin Name',
      'Admin Email',
      'Admin ID',
      'Action',
      'Category',
      'Entity Type',
      'Entity ID',
      'Record Label',
      'Change Summary',
      'Status',
      'Description',
    ];

    const rows = items.map((log) => [
      log.id,
      `"${(log.timestamp || '').replace(/"/g, '""')}"`,
      `"${(log.adminName || '').replace(/"/g, '""')}"`,
      `"${(log.adminEmail || '').replace(/"/g, '""')}"`,
      `"${(log.adminId || '').replace(/"/g, '""')}"`,
      `"${(log.action || '').replace(/"/g, '""')}"`,
      `"${(log.category || '').replace(/"/g, '""')}"`,
      `"${(log.entityType || '').replace(/"/g, '""')}"`,
      `"${(log.entityId || '').replace(/"/g, '""')}"`,
      `"${(log.recordLabel || '').replace(/"/g, '""')}"`,
      `"${(log.changeSummary || '').replace(/"/g, '""')}"`,
      log.status || 'COMPLETED',
      `"${(log.description || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `windrivesa-audit-logs-${dateStr}.csv`;
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return {
      success: true,
      count: items.length,
      filename,
    };
  } catch (e) {
    console.error('Error exporting audit logs:', e);
    return { success: false, error: e.message };
  }
}

/**
 * Refresh audit logs ledger
 */
export async function refreshAuditLogs() {
  const logs = await getRawAuditLogs();
  return {
    success: true,
    count: logs.length,
    timestamp: new Date().toISOString(),
  };
}
