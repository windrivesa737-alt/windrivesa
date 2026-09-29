// WinDriveSA Administration: Audit Logs
// Fiduciary operational audit trail across users, rewards, claims, and settings.

import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import AdminShell from '../../components/admin/AdminShell';
import {
  getAuditLogs,
  getAuditMetrics,
  getDistinctAdmins,
  exportAuditLogs,
} from '../../services/auditLogs';

export default function AdminAuditLogs() {
  // Filter and pagination state
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [adminUser, setAdminUser] = useState('All');
  const [entityType, setEntityType] = useState('All');
  const [dateRange, setDateRange] = useState('All');
  const [page, setPage] = useState(1);
  const pageSize = 25;

  // Data state
  const [logsData, setLogsData] = useState({
    items: [],
    total: 0,
    page: 1,
    limit: 25,
    totalPages: 1,
    startIndex: 0,
    endIndex: 0,
  });
  const [metrics, setMetrics] = useState({
    totalEvents: 0,
    today: 0,
    userAccountChanges: 0,
    rewardClaimChanges: 0,
  });
  const [adminList, setAdminList] = useState([]);
  const [toastMessage, setToastMessage] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load distinct admins on mount
  useEffect(() => {
    let isMounted = true;
    async function initAdmins() {
      try {
        const admins = await getDistinctAdmins();
        if (isMounted) setAdminList(admins);
      } catch (err) {
        console.error('Error fetching admin list:', err);
      }
    }
    initAdmins();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch audit logs and metrics from centralized database service
  const loadLogs = async () => {
    try {
      const [result, m] = await Promise.all([
        getAuditLogs(
          {
            search,
            category,
            admin: adminUser,
            entityType,
            dateRange,
          },
          { page, limit: pageSize }
        ),
        getAuditMetrics(),
      ]);
      if (result) setLogsData(result);
      if (m) setMetrics(m);
    } catch (err) {
      console.error('Error loading audit logs:', err);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [search, category, adminUser, entityType, dateRange, page]);

  // Handle Refresh action
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadLogs();
      const updatedAdmins = await getDistinctAdmins();
      setAdminList(updatedAdmins);
      setToastMessage({
        title: 'Audit Logs Refreshed',
        text: 'The audit log ledger has been synchronized with the latest administrative events.',
      });
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      console.error('Refresh error:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle Export action
  const handleExport = async () => {
    const result = await exportAuditLogs({
      search,
      category,
      admin: adminUser,
      entityType,
      dateRange,
    });
    if (result && result.success) {
      setToastMessage({
        title: 'Audit Ledger Exported',
        text: `Exported ${result.count} audit events to ${result.filename}.`,
      });
      setTimeout(() => setToastMessage(null), 4000);
    } else {
      setToastMessage({
        title: 'Export Failed',
        text: (result && result.error) || 'Could not export audit ledger at this time.',
      });
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearch('');
    setCategory('All');
    setAdminUser('All');
    setEntityType('All');
    setDateRange('All');
    setPage(1);
  };

  // Check if any filter is active
  const hasActiveFilters =
    search.trim() !== '' ||
    category !== 'All' ||
    adminUser !== 'All' ||
    entityType !== 'All' ||
    dateRange !== 'All';

  // Action badge color styling
  const getActionBadgeColor = (action = '', category = '') => {
    if (action.includes('REJECT') || action.includes('DEACTIVAT') || action.includes('SUSPEND')) {
      return 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-900/50';
    }
    if (action.includes('APPROV') || action.includes('ACTIVAT')) {
      return 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900/50';
    }
    if (category === 'Rewards') {
      return 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-900/50';
    }
    if (category === 'Claims') {
      return 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900/50';
    }
    if (category === 'Claim Requirements') {
      return 'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-900/50';
    }
    return 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
  };

  return (
    <AdminShell
      activeKey="audit-logs"
      breadcrumb="HQ Admin Console / Audit Logs"
      toastState={toastMessage}
      onCloseToast={() => setToastMessage(null)}
    >
      <div className="space-y-6 pb-12">
        {/* =========================================================================
            1. PAGE HEADER & ACTIONS
            ========================================================================= */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#D9E0E7] dark:border-[#1B3754] pb-5">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#667085] dark:text-slate-400 font-sora block mb-1">
              ADMINISTRATION
            </span>
            <h1 className="text-2xl font-extrabold text-[#071A2B] dark:text-white font-sora tracking-tight">
              Audit Logs
            </h1>
            <p className="text-xs text-[#667085] dark:text-slate-400 mt-1 max-w-2xl font-manrope">
              Review administrative activity and changes across the WinDriveSA platform.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-white dark:bg-[#0B253F] border border-[#D9E0E7] dark:border-[#1B3754] text-[#071A2B] dark:text-slate-200 hover:bg-[#F5F7FA] dark:hover:bg-[#132A42] transition-colors focus:outline-none focus:ring-2 focus:ring-[#F2B705] font-sora shadow-sm disabled:opacity-60"
            >
              <svg
                className={`w-3.5 h-3.5 text-[#667085] dark:text-slate-400 ${isRefreshing ? 'animate-spin' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>

            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#071A2B] text-white hover:bg-[#0E2C48] dark:bg-[#F2B705] dark:text-[#071A2B] dark:hover:bg-[#FFC926] transition-colors focus:outline-none focus:ring-2 focus:ring-[#F2B705] font-sora shadow-sm"
            >
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              <span>Export Logs</span>
            </button>
          </div>
        </header>

        {/* =========================================================================
            2. OPERATIONAL SUMMARY METRICS (4 CARDS)
            ========================================================================= */}
        <section aria-labelledby="summary-metrics-heading" className="space-y-3">
          <h2 id="summary-metrics-heading" className="sr-only">
            Operational Summary Metrics
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Metric 1: Total Events */}
            <div className="bg-white dark:bg-[#0B253F] rounded-xl border border-[#D9E0E7] dark:border-[#1B3754] p-4 shadow-sm">
              <div className="text-[11px] font-semibold text-[#667085] dark:text-slate-400 font-sora uppercase tracking-wider">
                Total Events
              </div>
              <div className="text-2xl font-bold text-[#071A2B] dark:text-white font-sora mt-1">
                {metrics.totalEvents.toLocaleString()}
              </div>
              <div className="text-[11px] text-[#667085] dark:text-slate-400 mt-1 font-manrope">
                Recorded platform audit entries
              </div>
            </div>

            {/* Metric 2: Today */}
            <div className="bg-white dark:bg-[#0B253F] rounded-xl border border-[#D9E0E7] dark:border-[#1B3754] p-4 shadow-sm">
              <div className="text-[11px] font-semibold text-[#667085] dark:text-slate-400 font-sora uppercase tracking-wider">
                Today
              </div>
              <div className="text-2xl font-bold text-[#071A2B] dark:text-white font-sora mt-1 flex items-baseline gap-2">
                <span>{metrics.today.toLocaleString()}</span>
                {metrics.today > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-sora">
                    Active
                  </span>
                )}
              </div>
              <div className="text-[11px] text-[#667085] dark:text-slate-400 mt-1 font-manrope">
                Events logged during today's shift
              </div>
            </div>

            {/* Metric 3: User & Account Changes */}
            <div className="bg-white dark:bg-[#0B253F] rounded-xl border border-[#D9E0E7] dark:border-[#1B3754] p-4 shadow-sm">
              <div className="text-[11px] font-semibold text-[#667085] dark:text-slate-400 font-sora uppercase tracking-wider">
                User & Account Changes
              </div>
              <div className="text-2xl font-bold text-[#071A2B] dark:text-white font-sora mt-1">
                {metrics.userAccountChanges.toLocaleString()}
              </div>
              <div className="text-[11px] text-[#667085] dark:text-slate-400 mt-1 font-manrope">
                Approvals, suspensions & updates
              </div>
            </div>

            {/* Metric 4: Reward & Claim Changes */}
            <div className="bg-white dark:bg-[#0B253F] rounded-xl border border-[#D9E0E7] dark:border-[#1B3754] p-4 shadow-sm">
              <div className="text-[11px] font-semibold text-[#667085] dark:text-slate-400 font-sora uppercase tracking-wider">
                Reward & Claim Changes
              </div>
              <div className="text-2xl font-bold text-[#071A2B] dark:text-white font-sora mt-1">
                {metrics.rewardClaimChanges.toLocaleString()}
              </div>
              <div className="text-[11px] text-[#667085] dark:text-slate-400 mt-1 font-manrope">
                Allocations, reviews & rule updates
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            3. SEARCH & ADVANCED FILTERS
            ========================================================================= */}
        <section
          aria-labelledby="audit-filters-heading"
          className="bg-white dark:bg-[#0B253F] rounded-xl border border-[#D9E0E7] dark:border-[#1B3754] p-4 shadow-sm space-y-4"
        >
          <h2 id="audit-filters-heading" className="sr-only">
            Filter Audit Ledger
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Search Input (spans 5 cols on md) */}
            <div className="md:col-span-12 lg:col-span-4 relative">
              <label htmlFor="audit-search" className="sr-only">
                Search by admin, action, user, or record
              </label>
              <div className="relative">
                <input
                  id="audit-search"
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search by admin, action, user, or record"
                  className="w-full pl-9 pr-3.5 py-2 text-xs rounded-lg border border-[#D9E0E7] dark:border-[#1B3754] bg-white dark:bg-[#071A2B] text-[#071A2B] dark:text-white placeholder-[#667085] dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#F2B705] font-manrope"
                />
                <svg
                  className="w-4 h-4 text-[#667085] dark:text-slate-400 absolute left-3 top-2.5 pointer-events-none"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            {/* Action Category Filter */}
            <div className="sm:col-span-6 md:col-span-3 lg:col-span-2">
              <label htmlFor="filter-category" className="sr-only">
                Action Category
              </label>
              <select
                id="filter-category"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setPage(1);
                }}
                className="w-full px-2.5 py-2 text-xs rounded-lg border border-[#D9E0E7] dark:border-[#1B3754] bg-white dark:bg-[#071A2B] text-[#071A2B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F2B705] font-manrope"
              >
                <option value="All">Category: All</option>
                <option value="User & Account">User & Account</option>
                <option value="Rewards">Rewards</option>
                <option value="Claims">Claims</option>
                <option value="Claim Requirements">Claim Requirements</option>
                <option value="Support">Support</option>
                <option value="Settings">Settings</option>
                <option value="System">System</option>
              </select>
            </div>

            {/* Admin User Filter */}
            <div className="sm:col-span-6 md:col-span-3 lg:col-span-2">
              <label htmlFor="filter-admin" className="sr-only">
                Admin User
              </label>
              <select
                id="filter-admin"
                value={adminUser}
                onChange={(e) => {
                  setAdminUser(e.target.value);
                  setPage(1);
                }}
                className="w-full px-2.5 py-2 text-xs rounded-lg border border-[#D9E0E7] dark:border-[#1B3754] bg-white dark:bg-[#071A2B] text-[#071A2B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F2B705] font-manrope"
              >
                <option value="All">Admin: All Users</option>
                {adminList.map((adm) => (
                  <option key={adm.id} value={adm.name}>
                    {adm.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Entity Type Filter */}
            <div className="sm:col-span-6 md:col-span-3 lg:col-span-2">
              <label htmlFor="filter-entity" className="sr-only">
                Entity Type
              </label>
              <select
                id="filter-entity"
                value={entityType}
                onChange={(e) => {
                  setEntityType(e.target.value);
                  setPage(1);
                }}
                className="w-full px-2.5 py-2 text-xs rounded-lg border border-[#D9E0E7] dark:border-[#1B3754] bg-white dark:bg-[#071A2B] text-[#071A2B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F2B705] font-manrope"
              >
                <option value="All">Entity: All Types</option>
                <option value="User">User</option>
                <option value="Reward">Reward</option>
                <option value="Claim">Claim</option>
                <option value="Claim Requirement">Claim Requirement</option>
                <option value="Support Request">Support Request</option>
                <option value="Setting">Setting</option>
                <option value="System">System</option>
              </select>
            </div>

            {/* Date Range Filter */}
            <div className="sm:col-span-6 md:col-span-3 lg:col-span-2">
              <label htmlFor="filter-date" className="sr-only">
                Date Range
              </label>
              <select
                id="filter-date"
                value={dateRange}
                onChange={(e) => {
                  setDateRange(e.target.value);
                  setPage(1);
                }}
                className="w-full px-2.5 py-2 text-xs rounded-lg border border-[#D9E0E7] dark:border-[#1B3754] bg-white dark:bg-[#071A2B] text-[#071A2B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F2B705] font-manrope"
              >
                <option value="All">Date: All History</option>
                <option value="Today">Today</option>
                <option value="Last 7 Days">Last 7 Days</option>
                <option value="Last 30 Days">Last 30 Days</option>
              </select>
            </div>
          </div>

          {/* Active Filter Indicators & Clear button */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#D9E0E7] dark:border-[#1B3754] text-xs">
              <div className="flex items-center gap-2 text-[#667085] dark:text-slate-400">
                <span className="font-semibold">Active filters:</span>
                {search && (
                  <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[#071A2B] dark:text-slate-200">
                    Search: "{search}"
                  </span>
                )}
                {category !== 'All' && (
                  <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[#071A2B] dark:text-slate-200">
                    {category}
                  </span>
                )}
                {adminUser !== 'All' && (
                  <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[#071A2B] dark:text-slate-200">
                    {adminUser}
                  </span>
                )}
                {entityType !== 'All' && (
                  <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[#071A2B] dark:text-slate-200">
                    {entityType}
                  </span>
                )}
                {dateRange !== 'All' && (
                  <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[#071A2B] dark:text-slate-200">
                    {dateRange}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleClearFilters}
                className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline"
              >
                Clear Filters
              </button>
            </div>
          )}
        </section>

        {/* =========================================================================
            4. AUDIT EVENTS TABLE (DESKTOP) & CARDS (MOBILE)
            ========================================================================= */}
        <section aria-labelledby="audit-table-heading" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2
              id="audit-table-heading"
              className="text-sm font-bold text-[#071A2B] dark:text-white font-sora"
            >
              Activity Ledger
            </h2>
            <div className="text-xs text-[#667085] dark:text-slate-400 font-manrope">
              {logsData.total > 0
                ? `Showing ${logsData.startIndex}–${logsData.endIndex} of ${logsData.total}`
                : '0 events'}
            </div>
          </div>

          {/* EMPTY STATE 1: NO RECORDS AT ALL */}
          {metrics.totalEvents === 0 ? (
            <div className="p-12 bg-white dark:bg-[#0B253F] rounded-xl border border-[#D9E0E7] dark:border-[#1B3754] text-center space-y-2.5">
              <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-[#132A42] flex items-center justify-center text-[#667085] dark:text-slate-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-[#071A2B] dark:text-white font-sora">
                No audit events yet.
              </h3>
              <p className="text-xs text-[#667085] dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                Administrative activity will appear here as actions are recorded across users, claims, rewards, and system configurations.
              </p>
            </div>
          ) : logsData.items.length === 0 ? (
            /* EMPTY STATE 2: NO FILTER RESULTS */
            <div className="p-12 bg-white dark:bg-[#0B253F] rounded-xl border border-[#D9E0E7] dark:border-[#1B3754] text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-[#071A2B] dark:text-white font-sora">
                No audit events match your filters.
              </h3>
              <p className="text-xs text-[#667085] dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                Try refining your search terms or clearing the current category, admin, or date filters to view administrative events.
              </p>
              <div>
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="inline-flex items-center px-4 py-2 text-xs font-semibold rounded-lg bg-[#071A2B] text-white hover:bg-[#0E2C48] dark:bg-[#F2B705] dark:text-[#071A2B] dark:hover:bg-[#FFC926] transition-colors font-sora"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE */}
              <div className="hidden lg:block bg-white dark:bg-[#0B253F] rounded-xl border border-[#D9E0E7] dark:border-[#1B3754] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[#D9E0E7] dark:border-[#1B3754] bg-[#F5F7FA]/70 dark:bg-[#071A2B]/60 text-[#667085] dark:text-slate-400 font-sora font-semibold">
                        <th scope="col" className="py-3 px-4">Date & Time</th>
                        <th scope="col" className="py-3 px-4">Admin</th>
                        <th scope="col" className="py-3 px-4">Action</th>
                        <th scope="col" className="py-3 px-4">Entity</th>
                        <th scope="col" className="py-3 px-4">Record</th>
                        <th scope="col" className="py-3 px-4">Change</th>
                        <th scope="col" className="py-3 px-4 text-center">Status</th>
                        <th scope="col" className="py-3 px-4 text-right">View</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D9E0E7] dark:divide-[#1B3754] font-manrope">
                      {logsData.items.map((log) => (
                        <tr
                          key={log.id}
                          className="hover:bg-[#F5F7FA]/50 dark:hover:bg-[#071A2B]/30 transition-colors"
                        >
                          {/* Date & Time */}
                          <td className="py-3 px-4 font-mono text-[11px] text-[#071A2B] dark:text-slate-200 whitespace-nowrap">
                            {log.timestamp}
                          </td>

                          {/* Admin */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="font-semibold text-[#071A2B] dark:text-white">
                              {log.adminName}
                            </div>
                            <div className="text-[10px] text-[#667085] dark:text-slate-400 font-mono">
                              {log.adminId}
                            </div>
                          </td>

                          {/* Action */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border font-sora ${getActionBadgeColor(
                                log.action,
                                log.category
                              )}`}
                            >
                              {log.action}
                            </span>
                          </td>

                          {/* Entity */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                              {log.entityType}
                            </span>
                          </td>

                          {/* Record */}
                          <td className="py-3 px-4 max-w-[180px] truncate">
                            <div className="font-semibold text-[#071A2B] dark:text-white truncate" title={log.recordLabel}>
                              {log.recordLabel}
                            </div>
                            <div className="text-[10px] text-[#667085] dark:text-slate-400 font-mono truncate">
                              ID: {log.entityId}
                            </div>
                          </td>

                          {/* Change */}
                          <td className="py-3 px-4 max-w-[240px] text-[#071A2B] dark:text-slate-300 truncate" title={log.changeSummary}>
                            {log.changeSummary}
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border font-sora ${
                                log.status === 'FAILED'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/50'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50'
                              }`}
                            >
                              {log.status}
                            </span>
                          </td>

                          {/* View Link */}
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <Link
                              to={`/admin/audit-logs/${log.id}`}
                              className="inline-flex items-center gap-1 text-xs font-bold text-[#071A2B] dark:text-[#F2B705] hover:underline"
                            >
                              <span>View</span>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                              </svg>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* MOBILE CARDS */}
              <div className="lg:hidden space-y-3">
                {logsData.items.map((log) => (
                  <div
                    key={log.id}
                    className="bg-white dark:bg-[#0B253F] rounded-xl border border-[#D9E0E7] dark:border-[#1B3754] p-4 shadow-sm space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border font-sora ${getActionBadgeColor(
                            log.action,
                            log.category
                          )}`}
                        >
                          {log.action}
                        </span>
                        <div className="font-bold text-xs text-[#071A2B] dark:text-white mt-1.5 font-sora">
                          {log.recordLabel}
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border font-sora shrink-0 ${
                          log.status === 'FAILED'
                            ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400'
                        }`}
                      >
                        {log.status}
                      </span>
                    </div>

                    <div className="text-xs text-[#071A2B] dark:text-slate-300 font-manrope bg-[#F5F7FA] dark:bg-[#071A2B]/40 p-2.5 rounded-lg border border-[#D9E0E7]/60 dark:border-[#1B3754]/60">
                      <span className="font-semibold block text-[10px] uppercase tracking-wider text-[#667085] dark:text-slate-400 mb-0.5">
                        Change
                      </span>
                      {log.changeSummary}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-[#667085] dark:text-slate-400 pt-1">
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-[#667085] dark:text-slate-400">
                          Performer
                        </span>
                        <span className="font-semibold text-[#071A2B] dark:text-white">
                          {log.adminName}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-[#667085] dark:text-slate-400">
                          Entity
                        </span>
                        <span className="font-semibold text-[#071A2B] dark:text-white">
                          {log.entityType}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="block text-[10px] uppercase font-bold text-[#667085] dark:text-slate-400">
                          Timestamp
                        </span>
                        <span className="font-mono text-[#071A2B] dark:text-slate-200">
                          {log.timestamp}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#D9E0E7] dark:border-[#1B3754] flex justify-end">
                      <Link
                        to={`/admin/audit-logs/${log.id}`}
                        className="inline-flex items-center justify-center px-3.5 py-1.5 text-xs font-bold rounded-lg bg-[#071A2B] text-white hover:bg-[#0E2C48] dark:bg-[#F2B705] dark:text-[#071A2B] dark:hover:bg-[#FFC926] transition-colors font-sora shadow-sm"
                      >
                        View Details →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* =========================================================================
              5. PAGINATION CONTROLS
              ========================================================================= */}
          {logsData.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <div className="text-xs text-[#667085] dark:text-slate-400 font-manrope">
                Page {logsData.page} of {logsData.totalPages}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={logsData.page <= 1}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-[#0B253F] border border-[#D9E0E7] dark:border-[#1B3754] text-[#071A2B] dark:text-white hover:bg-[#F5F7FA] dark:hover:bg-[#132A42] disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-sora"
                >
                  ← Previous
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(logsData.totalPages, p + 1))}
                  disabled={logsData.page >= logsData.totalPages}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-[#0B253F] border border-[#D9E0E7] dark:border-[#1B3754] text-[#071A2B] dark:text-white hover:bg-[#F5F7FA] dark:hover:bg-[#132A42] disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-sora"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </section>

        {/* POPIA Section 18 Security & Regulatory Guarantee Notice */}
        <footer className="mt-8 pt-4 border-t border-[#D9E0E7] dark:border-[#1B3754] flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#667085] dark:text-slate-400 font-manrope">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
            <span>POPIA Section 18 Fiduciary Audit Ledger • Cryptographically timestamped operations</span>
          </div>
          <div>
            <span>No authentication secrets, tokens, or plaintext card numbers are stored or exported.</span>
          </div>
        </footer>
      </div>
    </AdminShell>
  );
}
