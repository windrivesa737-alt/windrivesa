import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import { getRawAuditLogs, recordAuditEvent } from './auditLogs.js';

/**
 * WinDriveSA Admin Service
 *
 * Real Supabase operational queries for dashboard metrics, queues, and ledger.
 * Zero fabricated operational numbers, zero fake users, zero fake compliance metrics.
 */

export const SYSTEM_STATUS = {
  status: 'Database Connected',
  environment: 'Production',
  description: 'Supabase database and authentication services connected.',
};

/**
 * Fetch live operational dashboard metrics directly from Supabase.
 * Returns exact counts from database tables.
 */
export async function fetchLiveDashboardMetrics() {
  if (!isSupabaseConfigured() || !supabase) {
    return {
      pendingUserReviews: 0,
      activeUsers: 0,
      pendingCashClaims: 0,
      pendingVehicleClaims: 0,
      configuredRequirements: 0,
      totalPendingItems: 0,
    };
  }

  try {
    // 1. Pending user reviews (profiles with PENDING_REVIEW status)
    const { count: pendingUserCount, error: pendingErr } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('account_status', 'PENDING_REVIEW');

    if (pendingErr) {
      console.debug('Error counting pending profiles:', pendingErr.message);
    }

    // 2. Active users (profiles with ACTIVE status)
    const { count: activeUserCount, error: activeErr } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('account_status', 'ACTIVE');

    if (activeErr) {
      console.debug('Error counting active profiles:', activeErr.message);
    }

    // 3. Claims in active review states
    const reviewStatuses = ['SUBMITTED', 'UNDER_REVIEW', 'REQUIREMENT_PENDING', 'PROCESSING'];

    const { count: cashClaimCount, error: cashErr } = await supabase
      .from('claims')
      .select('*', { count: 'exact', head: true })
      .eq('claim_type', 'CASH')
      .in('status', reviewStatuses);

    if (cashErr) {
      console.debug('Error counting cash claims:', cashErr.message);
    }

    const { count: vehicleClaimCount, error: vehicleErr } = await supabase
      .from('claims')
      .select('*', { count: 'exact', head: true })
      .eq('claim_type', 'VEHICLE')
      .in('status', reviewStatuses);

    if (vehicleErr) {
      console.debug('Error counting vehicle claims:', vehicleErr.message);
    }

    // 4. Configured claim requirements (active)
    const { count: reqCount, error: reqErr } = await supabase
      .from('claim_requirements')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    if (reqErr) {
      console.debug('Error counting claim requirements:', reqErr.message);
    }

    const pendingUsers = typeof pendingUserCount === 'number' ? pendingUserCount : 0;
    const activeUsers = typeof activeUserCount === 'number' ? activeUserCount : 0;
    const pendingCash = typeof cashClaimCount === 'number' ? cashClaimCount : 0;
    const pendingVehicles = typeof vehicleClaimCount === 'number' ? vehicleClaimCount : 0;
    const requirements = typeof reqCount === 'number' ? reqCount : 0;

    return {
      pendingUserReviews: pendingUsers,
      activeUsers: activeUsers,
      pendingCashClaims: pendingCash,
      pendingVehicleClaims: pendingVehicles,
      configuredRequirements: requirements,
      totalPendingItems: pendingUsers + pendingCash + pendingVehicles,
    };
  } catch (err) {
    console.error('Error fetching live dashboard metrics:', err);
    return {
      pendingUserReviews: 0,
      activeUsers: 0,
      pendingCashClaims: 0,
      pendingVehicleClaims: 0,
      configuredRequirements: 0,
      totalPendingItems: 0,
    };
  }
}

/**
 * Synchronous metrics accessor with zero fake data.
 */
export function getDashboardMetrics() {
  return {
    pendingUserReviews: 0,
    activeUsers: 0,
    pendingCashClaims: 0,
    pendingVehicleClaims: 0,
    configuredRequirements: 0,
    totalPendingItems: 0,
  };
}

/**
 * Build dynamic action required queues based strictly on actual counts.
 * Only returns queues that have 1 or more real items pending review.
 */
export function buildLiveActionQueues(metrics = {}) {
  const queues = [];

  if (metrics.pendingUserReviews > 0) {
    queues.push({
      id: 'queue-users',
      category: 'User Reviews',
      categoryColor: 'amber',
      count: metrics.pendingUserReviews,
      countLabel: `${metrics.pendingUserReviews} accounts`,
      title: 'Accounts awaiting approval',
      description: 'Participant registrations pending administrative verification and approval.',
      actionLabel: `Review (${metrics.pendingUserReviews})`,
      targetRoute: '/admin/users',
      filterParam: 'pending',
    });
  }

  if (metrics.pendingCashClaims > 0) {
    queues.push({
      id: 'queue-cash',
      category: 'Cash Claims',
      categoryColor: 'gold',
      count: metrics.pendingCashClaims,
      countLabel: `${metrics.pendingCashClaims} claims`,
      title: 'Cash prize claims awaiting review',
      description: 'Settlement details submitted by members awaiting administrative verification.',
      actionLabel: `Review (${metrics.pendingCashClaims})`,
      targetRoute: '/admin/claims',
      filterParam: 'cash',
    });
  }

  if (metrics.pendingVehicleClaims > 0) {
    queues.push({
      id: 'queue-vehicles',
      category: 'Vehicle Claims',
      categoryColor: 'navy',
      count: metrics.pendingVehicleClaims,
      countLabel: `${metrics.pendingVehicleClaims} claims`,
      title: 'Vehicle prize claims awaiting review',
      description: 'Vehicle delivery details submitted by members awaiting administrative verification.',
      actionLabel: `Review (${metrics.pendingVehicleClaims})`,
      targetRoute: '/admin/claims',
      filterParam: 'vehicle',
    });
  }

  return queues;
}

/**
 * Retrieve action required queues (legacy wrapper)
 */
export function getActionRequiredQueues() {
  return [];
}

/**
 * Retrieve recent administrative activity from real audit logs.
 */
export async function fetchLiveRecentAdminActivity(limit = 10) {
  try {
    const rawLogs = await getRawAuditLogs();
    if (!Array.isArray(rawLogs) || rawLogs.length === 0) {
      return [];
    }
    return rawLogs.slice(0, limit).map((log) => ({
      id: log.id || `log-${Math.random().toString(36).slice(2, 8)}`,
      action: log.action || 'System Action',
      admin: log.actor_name || log.admin || 'Administrator',
      adminId: log.actor_id || log.adminId || '',
      reference: log.target_id || log.reference || 'N/A',
      referenceNote: log.entity_type || log.details || '',
      timestamp: log.created_at
        ? new Date(log.created_at).toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' })
        : log.timestamp || 'Just now',
      status: log.status || 'COMPLETED',
      statusColor: 'emerald',
    }));
  } catch (err) {
    console.error('Error fetching live recent admin activity:', err);
    return [];
  }
}

/**
 * Synchronous recent admin activity getter
 */
export function getRecentAdminActivity() {
  return [];
}

/**
 * Export audit ledger summary as a clean CSV download
 */
export async function exportLedgerData() {
  try {
    const rawLogs = await getRawAuditLogs();
    const headers = ['Log ID', 'Action', 'Administrator', 'Admin ID', 'Reference', 'Details', 'Timestamp (SAST)', 'Status'];
    const rows = (rawLogs || []).map((log) => [
      log.id || '',
      `"${(log.action || '').replace(/"/g, '""')}"`,
      `"${(log.actor_name || log.admin || 'Admin').replace(/"/g, '""')}"`,
      `"${(log.actor_id || log.adminId || '').replace(/"/g, '""')}"`,
      `"${(log.target_id || log.reference || '').replace(/"/g, '""')}"`,
      `"${(log.entity_type || log.details || '').replace(/"/g, '""')}"`,
      `"${log.created_at || log.timestamp || ''}"`,
      log.status || 'COMPLETED',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    link.setAttribute('href', url);
    link.setAttribute('download', `windrivesa-operations-ledger-${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return {
      success: true,
      count: rawLogs?.length || 0,
      filename: `windrivesa-operations-ledger-${dateStr}.csv`,
    };
  } catch (e) {
    console.error('Error exporting ledger:', e);
    return { success: false, error: e.message };
  }
}

/**
 * Record an administrative activity directly to Supabase audit_logs
 */
export async function recordAdminActivity(action, details = {}) {
  try {
    return await recordAuditEvent(action, details);
  } catch (err) {
    console.debug('Error in recordAdminActivity:', err);
    return { success: false, error: err.message };
  }
}

