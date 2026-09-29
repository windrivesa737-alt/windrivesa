import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AdminShell from '../../components/admin/AdminShell';
import {
  fetchLiveDashboardMetrics,
  buildLiveActionQueues,
  fetchLiveRecentAdminActivity,
  SYSTEM_STATUS,
  exportLedgerData,
} from '../../services/adminService';

export default function AdminDashboard() {
  const navigate = useNavigate();

  // Load aggregated operational metrics, action queues, and audit logs from real Supabase data
  const [metrics, setMetrics] = useState({
    pendingUserReviews: 0,
    activeUsers: 0,
    pendingCashClaims: 0,
    pendingVehicleClaims: 0,
    configuredRequirements: 0,
    totalPendingItems: 0,
  });
  const [actionQueues, setActionQueues] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Administrative feedback toast
  const [toastState, setToastState] = useState({
    visible: false,
    title: '',
    message: '',
  });

  const loadData = async () => {
    try {
      const liveMetrics = await fetchLiveDashboardMetrics();
      const queues = buildLiveActionQueues(liveMetrics);
      const logs = await fetchLiveRecentAdminActivity(10);

      setMetrics(liveMetrics);
      setActionQueues(queues);
      setRecentLogs(logs);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Auto-dismiss toast after 3500ms
  useEffect(() => {
    if (toastState.visible) {
      const timer = setTimeout(() => {
        setToastState((prev) => ({ ...prev, visible: false }));
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toastState.visible]);

  const showAdminToast = (title, message) => {
    setToastState({
      visible: true,
      title,
      message,
    });
  };

  const handleCloseToast = () => {
    setToastState((prev) => ({ ...prev, visible: false }));
  };

  // Operational Data Refresh handler
  const handleRefreshData = async () => {
    setIsRefreshing(true);
    await loadData();
    showAdminToast(
      'Operational Data Refreshed',
      'Synchronized live operational indicators and audit ledger.'
    );
  };

  // Export Ledger handler
  const handleExportLedger = async () => {
    const result = await exportLedgerData();
    if (result.success) {
      showAdminToast(
        'Export Complete',
        `Downloaded ${result.count} audit records in CSV format (${result.filename}).`
      );
    } else {
      showAdminToast('Export Failed', result.error || 'Unable to export ledger.');
    }
  };

  const handleQueueReview = (queue) => {
    showAdminToast(
      `Opening Queue: ${queue.category}`,
      `Routing to ${queue.targetRoute} to process ${queue.count} items...`
    );
    setTimeout(() => {
      navigate(queue.targetRoute);
    }, 400);
  };

  const renderStatusBadge = (status, color) => {
    let classes = 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-300';
    if (color === 'emerald') {
      classes = 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300';
    } else if (color === 'amber') {
      classes = 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300';
    } else if (color === 'sky') {
      classes = 'bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-300';
    } else if (color === 'purple') {
      classes = 'bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-300';
    }

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${classes}`}>
        {status}
      </span>
    );
  };

  return (
    <AdminShell
      activeKey="dashboard"
      breadcrumb="HQ Admin Console / Operations Overview"
      toastState={toastState}
      onCloseToast={handleCloseToast}
    >
      <div className="space-y-8 animate-fadeIn">
        
        {/* =========================================================================
            1. PAGE HEADING & OPERATIONAL ACTIONS
            ========================================================================= */}
        <section
          aria-labelledby="dashboard-heading"
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#D9E0E7] dark:border-[#1B354F]"
        >
          <div>
            <div className="flex items-center gap-2">
              <h1
                id="dashboard-heading"
                className="text-2xl sm:text-3xl font-bold font-sora text-[#071A2B] dark:text-white tracking-tight"
              >
                Operations Overview
              </h1>
              <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#00843D]/10 text-[#00843D] dark:bg-[#00843D]/20 dark:text-emerald-300 border border-[#00843D]/20">
                Live Console
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#667085] dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Monitor participant reviews, prize allocations, and claim activity across WinDriveSA.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
            {/* Sync Now / Refresh Button */}
            <button
              type="button"
              id="btn-sync-dashboard"
              onClick={handleRefreshData}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg border border-[#D9E0E7] dark:border-[#1B3754] bg-white dark:bg-[#0B253F] text-[#071A2B] dark:text-slate-200 hover:bg-[#F5F7FA] dark:hover:bg-[#132A42] transition-colors focus:outline-none focus:ring-2 focus:ring-[#F2B705] disabled:opacity-50 font-sora shadow-sm"
              title="Refresh live operational data from database"
            >
              <svg
                className={`w-3.5 h-3.5 text-[#667085] dark:text-slate-400 ${isRefreshing ? 'animate-spin' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{isRefreshing ? 'Syncing...' : 'Sync Live'}</span>
            </button>

            {/* Export Ledger Button */}
            <button
              type="button"
              id="btn-export-ledger"
              onClick={handleExportLedger}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg bg-[#071A2B] text-white hover:bg-[#0E2C48] dark:bg-[#F2B705] dark:text-[#071A2B] dark:hover:bg-[#FFC926] transition-colors focus:outline-none focus:ring-2 focus:ring-[#F2B705] font-sora shadow-sm"
              title="Download audit records as CSV"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Export Ledger</span>
            </button>
          </div>
        </section>

        {/* =========================================================================
            2. SUMMARY METRICS (4 PRIMARY OPERATIONAL TILES)
            Pending User Reviews | Active Users | Pending Cash Claims | Pending Vehicle Claims
            ========================================================================= */}
        <section aria-labelledby="summary-metrics-heading" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2
              id="summary-metrics-heading"
              className="text-xs font-bold uppercase tracking-wider text-[#667085] dark:text-slate-400 font-sora"
            >
              Key Operational Indicators
            </h2>
            <span className="text-[11px] text-[#667085] dark:text-slate-400 font-mono">
              Live Data
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Tile 1: Pending User Reviews */}
            <Link
              to="/admin/users"
              id="metric-pending-users"
              className="group p-5 bg-white dark:bg-[#0B253F] rounded-xl border border-[#D9E0E7] dark:border-[#1B3754] hover:border-[#F2B705] dark:hover:border-[#F2B705] transition-all shadow-sm flex flex-col justify-between focus:outline-none focus:ring-2 focus:ring-[#F2B705]"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded">
                    Pending Review
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-3xl font-bold font-sora text-[#071A2B] dark:text-white group-hover:text-[#F2B705] transition-colors">
                    {metrics.pendingUserReviews}
                  </div>
                  <div className="text-xs font-semibold text-[#071A2B] dark:text-slate-200 mt-1">
                    Pending User Reviews
                  </div>
                  <p className="text-[11px] text-[#667085] dark:text-slate-400 mt-1">
                    Participant accounts awaiting administrative review
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-[#D9E0E7]/60 dark:border-[#1B3754] flex items-center justify-between text-[11px] font-semibold text-[#071A2B] dark:text-[#F2B705]">
                <span>Manage User Queue</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Link>

            {/* Tile 2: Active Users */}
            <Link
              to="/admin/users"
              id="metric-active-users"
              className="group p-5 bg-white dark:bg-[#0B253F] rounded-xl border border-[#D9E0E7] dark:border-[#1B3754] hover:border-[#F2B705] dark:hover:border-[#F2B705] transition-all shadow-sm flex flex-col justify-between focus:outline-none focus:ring-2 focus:ring-[#F2B705]"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#00843D] dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
                    Active
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-[#00843D] dark:text-emerald-300 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-3xl font-bold font-sora text-[#071A2B] dark:text-white group-hover:text-[#F2B705] transition-colors">
                    {metrics.activeUsers}
                  </div>
                  <div className="text-xs font-semibold text-[#071A2B] dark:text-slate-200 mt-1">
                    Active Users
                  </div>
                  <p className="text-[11px] text-[#667085] dark:text-slate-400 mt-1">
                    Verified accounts with approved access
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-[#D9E0E7]/60 dark:border-[#1B3754] flex items-center justify-between text-[11px] font-semibold text-[#071A2B] dark:text-[#F2B705]">
                <span>View Directory</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Link>

            {/* Tile 3: Pending Cash Claims */}
            <Link
              to="/admin/claims"
              id="metric-pending-cash"
              className="group p-5 bg-white dark:bg-[#0B253F] rounded-xl border border-[#D9E0E7] dark:border-[#1B3754] hover:border-[#F2B705] dark:hover:border-[#F2B705] transition-all shadow-sm flex flex-col justify-between focus:outline-none focus:ring-2 focus:ring-[#F2B705]"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-[#F2B705] bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded">
                    Cash Claims
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-[#F2B705] flex items-center justify-center">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-3xl font-bold font-sora text-[#071A2B] dark:text-white group-hover:text-[#F2B705] transition-colors">
                    {metrics.pendingCashClaims}
                  </div>
                  <div className="text-xs font-semibold text-[#071A2B] dark:text-slate-200 mt-1">
                    Pending Cash Claims
                  </div>
                  <p className="text-[11px] text-[#667085] dark:text-slate-400 mt-1">
                    Cash settlement submissions awaiting review
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-[#D9E0E7]/60 dark:border-[#1B3754] flex items-center justify-between text-[11px] font-semibold text-[#071A2B] dark:text-[#F2B705]">
                <span>Review Cash Claims</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Link>

            {/* Tile 4: Pending Vehicle Claims */}
            <Link
              to="/admin/claims"
              id="metric-pending-vehicles"
              className="group p-5 bg-white dark:bg-[#0B253F] rounded-xl border border-[#D9E0E7] dark:border-[#1B3754] hover:border-[#F2B705] dark:hover:border-[#F2B705] transition-all shadow-sm flex flex-col justify-between focus:outline-none focus:ring-2 focus:ring-[#F2B705]"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#071A2B] dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                    Vehicle Claims
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-[#071A2B] dark:text-slate-300 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 17a2 2 0 100-4 2 2 0 000 4zm10 0a2 2 0 100-4 2 2 0 000 4zM4 11h16M4 11V7a1 1 0 011-1h10l4 5v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-7z" />
                    </svg>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-3xl font-bold font-sora text-[#071A2B] dark:text-white group-hover:text-[#F2B705] transition-colors">
                    {metrics.pendingVehicleClaims}
                  </div>
                  <div className="text-xs font-semibold text-[#071A2B] dark:text-slate-200 mt-1">
                    Pending Vehicle Claims
                  </div>
                  <p className="text-[11px] text-[#667085] dark:text-slate-400 mt-1">
                    Vehicle delivery details awaiting review
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-[#D9E0E7]/60 dark:border-[#1B3754] flex items-center justify-between text-[11px] font-semibold text-[#071A2B] dark:text-[#F2B705]">
                <span>Review Vehicle Claims</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Link>

          </div>
        </section>

        {/* =========================================================================
            3. ACTION REQUIRED (OPERATIONAL QUEUES)
            ========================================================================= */}
        <section aria-labelledby="action-required-heading" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2
                id="action-required-heading"
                className="text-base font-bold text-[#071A2B] dark:text-white font-sora"
              >
                Action Required
              </h2>
              <p className="text-xs text-[#667085] dark:text-slate-400 mt-0.5">
                Priority items awaiting administrative verification and approval.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 self-start sm:self-auto font-mono">
              {metrics.totalPendingItems} Items Pending Review
            </span>
          </div>

          {actionQueues.length === 0 ? (
            <div className="p-8 bg-white dark:bg-[#0B253F] rounded-xl border border-[#D9E0E7] dark:border-[#1B3754] text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-[#00843D] flex items-center justify-center mx-auto">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-[#071A2B] dark:text-white font-sora">
                No Action Required
              </h3>
              <p className="text-xs text-[#667085] dark:text-slate-400">
                There are currently no outstanding operational items awaiting review.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {actionQueues.map((queue) => (
                <div
                  key={queue.id}
                  className="bg-white dark:bg-[#0B253F] rounded-xl border border-[#D9E0E7] dark:border-[#1B3754] p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          queue.categoryColor === 'amber'
                            ? 'text-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60'
                            : queue.categoryColor === 'gold'
                            ? 'text-[#F2B705] bg-amber-50 dark:bg-amber-950/60'
                            : queue.categoryColor === 'emerald'
                            ? 'text-[#00843D] bg-emerald-50 dark:bg-emerald-950/60'
                            : 'text-[#071A2B] dark:text-slate-300 bg-slate-100 dark:bg-slate-800'
                        }`}
                      >
                        {queue.category}
                      </span>
                      <span className="font-mono text-xs font-bold text-[#071A2B] dark:text-white">
                        {queue.countLabel}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-[#071A2B] dark:text-white font-sora">
                      {queue.title}
                    </h3>
                    <p className="text-xs text-[#667085] dark:text-slate-400 leading-relaxed">
                      {queue.description}
                    </p>
                  </div>
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleQueueReview(queue)}
                      className="shrink-0 inline-flex items-center justify-center px-4 py-2 text-xs font-bold rounded-lg bg-[#071A2B] text-white hover:bg-[#0E2C48] dark:bg-[#F2B705] dark:text-[#071A2B] dark:hover:bg-[#FFC926] transition-colors focus:outline-none focus:ring-2 focus:ring-[#F2B705] font-sora shadow-sm"
                    >
                      {queue.actionLabel}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* =========================================================================
            4. QUICK ACTIONS
            ========================================================================= */}
        <section aria-labelledby="quick-actions-heading" className="space-y-3">
          <h2
            id="quick-actions-heading"
            className="text-xs font-bold uppercase tracking-wider text-[#667085] dark:text-slate-400 font-sora"
          >
            Quick Actions
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            
            {/* Quick Action 1: Create User */}
            <Link
              to="/admin/users"
              className="group p-4 bg-white dark:bg-[#0B253F] rounded-xl border border-[#D9E0E7] dark:border-[#1B3754] hover:border-[#F2B705] dark:hover:border-[#F2B705] text-left transition-all focus:outline-none focus:ring-2 focus:ring-[#F2B705] shadow-sm flex items-center gap-3.5"
            >
              <div className="w-10 h-10 rounded-lg bg-[#F5F7FA] dark:bg-[#132A42] flex items-center justify-center text-[#071A2B] dark:text-[#F2B705] group-hover:scale-105 transition-transform shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-[#071A2B] dark:text-white font-sora group-hover:text-[#F2B705] transition-colors truncate">
                  Create User
                </div>
                <div className="text-[11px] text-[#667085] dark:text-slate-400 mt-0.5 truncate">
                  → Users / Create User
                </div>
              </div>
            </Link>

            {/* Quick Action 2: Assign Reward */}
            <Link
              to="/admin/rewards"
              className="group p-4 bg-white dark:bg-[#0B253F] rounded-xl border border-[#D9E0E7] dark:border-[#1B3754] hover:border-[#F2B705] dark:hover:border-[#F2B705] text-left transition-all focus:outline-none focus:ring-2 focus:ring-[#F2B705] shadow-sm flex items-center gap-3.5"
            >
              <div className="w-10 h-10 rounded-lg bg-[#F5F7FA] dark:bg-[#132A42] flex items-center justify-center text-[#071A2B] dark:text-[#F2B705] group-hover:scale-105 transition-transform shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-[#071A2B] dark:text-white font-sora group-hover:text-[#F2B705] transition-colors truncate">
                  Assign Reward
                </div>
                <div className="text-[11px] text-[#667085] dark:text-slate-400 mt-0.5 truncate">
                  → Rewards / Assign Reward
                </div>
              </div>
            </Link>

            {/* Quick Action 3: Review Claims */}
            <Link
              to="/admin/claims"
              className="group p-4 bg-white dark:bg-[#0B253F] rounded-xl border border-[#D9E0E7] dark:border-[#1B3754] hover:border-[#F2B705] dark:hover:border-[#F2B705] text-left transition-all focus:outline-none focus:ring-2 focus:ring-[#F2B705] shadow-sm flex items-center gap-3.5"
            >
              <div className="w-10 h-10 rounded-lg bg-[#F5F7FA] dark:bg-[#132A42] flex items-center justify-center text-[#071A2B] dark:text-[#F2B705] group-hover:scale-105 transition-transform shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-[#071A2B] dark:text-white font-sora group-hover:text-[#F2B705] transition-colors truncate">
                  Review Claims
                </div>
                <div className="text-[11px] text-[#667085] dark:text-slate-400 mt-0.5 truncate">
                  → Claim Requests ({metrics.pendingCashClaims + metrics.pendingVehicleClaims})
                </div>
              </div>
            </Link>

            {/* Quick Action 4: Configure Claim Requirements */}
            <Link
              to="/admin/claim-requirements"
              className="group p-4 bg-white dark:bg-[#0B253F] rounded-xl border border-[#D9E0E7] dark:border-[#1B3754] hover:border-[#F2B705] dark:hover:border-[#F2B705] text-left transition-all focus:outline-none focus:ring-2 focus:ring-[#F2B705] shadow-sm flex items-center gap-3.5"
            >
              <div className="w-10 h-10 rounded-lg bg-[#F5F7FA] dark:bg-[#132A42] flex items-center justify-center text-[#071A2B] dark:text-[#F2B705] group-hover:scale-105 transition-transform shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-[#071A2B] dark:text-white font-sora group-hover:text-[#F2B705] transition-colors truncate">
                  Configure Requirements
                </div>
                <div className="text-[11px] text-[#667085] dark:text-slate-400 mt-0.5 truncate">
                  → Claim Requirements
                </div>
              </div>
            </Link>

          </div>
        </section>

        {/* =========================================================================
            5. RECENT ADMIN ACTIVITY
            Real Supabase audit logs ledger.
            ========================================================================= */}
        <section aria-labelledby="activity-heading" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2
                id="activity-heading"
                className="text-base font-bold text-[#071A2B] dark:text-white font-sora"
              >
                Recent Admin Activity
              </h2>
              <p className="text-xs text-[#667085] dark:text-slate-400 mt-0.5">
                Audit trail of administrator actions, approvals, and allocation changes.
              </p>
            </div>
            <div className="flex items-center gap-3 self-start sm:self-auto">
              <span className="text-[11px] font-mono text-[#667085] dark:text-slate-400 bg-white dark:bg-[#0B253F] px-2.5 py-1 rounded border border-[#D9E0E7] dark:border-[#1B3754]">
                Records ({recentLogs.length})
              </span>
              <Link
                to="/admin/audit-logs"
                className="text-xs font-semibold text-[#071A2B] dark:text-[#F2B705] hover:underline"
              >
                View All Logs →
              </Link>
            </div>
          </div>

          {recentLogs.length === 0 ? (
            <div className="p-8 bg-white dark:bg-[#0B253F] rounded-xl border border-[#D9E0E7] dark:border-[#1B3754] text-center space-y-2">
              <p className="text-sm font-bold text-[#071A2B] dark:text-white font-sora">
                No Recent Activity
              </p>
              <p className="text-xs text-[#667085] dark:text-slate-400">
                No administrative activity has been recorded yet.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Activity Table */}
              <div className="hidden md:block bg-white dark:bg-[#0B253F] rounded-xl border border-[#D9E0E7] dark:border-[#1B3754] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[#D9E0E7] dark:border-[#1B3754] bg-[#F5F7FA]/70 dark:bg-[#071A2B]/60 text-[#667085] dark:text-slate-400 font-sora font-semibold">
                        <th scope="col" className="py-3 px-4">Action</th>
                        <th scope="col" className="py-3 px-4">Administrator</th>
                        <th scope="col" className="py-3 px-4">Reference</th>
                        <th scope="col" className="py-3 px-4">Date / Time (SAST)</th>
                        <th scope="col" className="py-3 px-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D9E0E7] dark:divide-[#1B3754] font-manrope">
                      {recentLogs.map((log) => (
                        <tr
                          key={log.id}
                          className="hover:bg-[#F5F7FA]/50 dark:hover:bg-[#071A2B]/30 transition-colors"
                        >
                          <td className="py-3.5 px-4 font-semibold text-[#071A2B] dark:text-white">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-[#00843D]"></span>
                              <span>{log.action}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-[#667085] dark:text-slate-300">
                            {log.admin} {log.adminId ? <span className="text-[10px] text-slate-400 font-mono">({log.adminId.slice(0, 8)})</span> : null}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-medium text-[#071A2B] dark:text-[#F2B705]">
                            {log.reference}{' '}
                            {log.referenceNote ? (
                              <span className="text-[11px] font-sans text-[#667085] dark:text-slate-400">
                                ({log.referenceNote})
                              </span>
                            ) : null}
                          </td>
                          <td className="py-3.5 px-4 text-[#667085] dark:text-slate-400 font-mono">
                            {log.timestamp}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {renderStatusBadge(log.status, log.statusColor)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Activity List */}
              <div className="md:hidden space-y-3">
                {recentLogs.map((log) => (
                  <div
                    key={`mobile-${log.id}`}
                    className="bg-white dark:bg-[#0B253F] rounded-xl border border-[#D9E0E7] dark:border-[#1B3754] p-4 shadow-sm space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#071A2B] dark:text-white font-sora">
                        {log.action}
                      </span>
                      {renderStatusBadge(log.status, log.statusColor)}
                    </div>
                    <div className="text-xs font-mono text-[#071A2B] dark:text-[#F2B705] font-medium">
                      {log.reference} {log.referenceNote ? `(${log.referenceNote})` : ''}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#667085] dark:text-slate-400 pt-2 border-t border-[#D9E0E7]/60 dark:border-[#1B3754]">
                      <span>Admin: {log.admin}</span>
                      <span>{log.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        {/* =========================================================================
            6. SYSTEM STATUS
            Restrained status container. Zero fake uptime or fake certifications.
            ========================================================================= */}
        <section
          aria-label="System Operational Health"
          className="p-5 bg-white dark:bg-[#0B253F] rounded-xl border border-[#D9E0E7] dark:border-[#1B3754] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors"
        >
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-[#00843D] flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-800">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#071A2B] dark:text-white font-sora">
                  System Status: {SYSTEM_STATUS.status}
                </span>
                <span className="inline-block w-2 h-2 rounded-full bg-[#00843D]"></span>
              </div>
              <p className="text-xs text-[#667085] dark:text-slate-400 mt-0.5">
                {SYSTEM_STATUS.description}
              </p>
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-3 text-xs text-[#667085] dark:text-slate-400 font-mono">
            <span>Env: {SYSTEM_STATUS.environment}</span>
          </div>
        </section>

      </div>
    </AdminShell>
  );
}
