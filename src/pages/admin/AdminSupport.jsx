import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminShell from '../../components/admin/AdminShell';
import {
  getSupportRequests,
  getSupportMetrics,
} from '../../services/support';

export default function AdminSupport() {
  const navigate = useNavigate();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('ALL');
  const [activePreset, setActivePreset] = useState('all');
  const [toastMessage, setToastMessage] = useState(null);
  const [loading, setLoading] = useState(true);

  // Tickets & Metrics from Service
  const [tickets, setTickets] = useState([]);
  const [metrics, setMetrics] = useState({
    open: 0,
    inProgress: 0,
    waitingForUser: 0,
    resolved: 0,
    total: 0,
  });

  const refreshData = async () => {
    setLoading(true);
    try {
      const data = await getSupportRequests({
        search: searchQuery,
        status: statusFilter,
        category: categoryFilter,
        dateRange: dateFilter,
      });
      setTickets(data);
      const allForMetrics = await getSupportRequests({});
      setMetrics(getSupportMetrics(allForMetrics));
    } catch (err) {
      console.error('Failed to load support queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [searchQuery, statusFilter, categoryFilter, dateFilter]);

  const handleApplyPreset = (presetKey) => {
    setActivePreset(presetKey);
    if (presetKey === 'all') {
      setSearchQuery('');
      setStatusFilter('ALL');
      setCategoryFilter('ALL');
      setDateFilter('ALL');
    } else if (presetKey === 'open') {
      setSearchQuery('');
      setStatusFilter('OPEN');
      setCategoryFilter('ALL');
    } else if (presetKey === 'claims') {
      setSearchQuery('claim');
      setStatusFilter('ALL');
      setCategoryFilter('ALL');
    }
  };

  const handleResetFilters = () => {
    setActivePreset('all');
    setSearchQuery('');
    setStatusFilter('ALL');
    setCategoryFilter('ALL');
    setDateFilter('ALL');
  };

  // Helper for Status Badge styling
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'OPEN':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            OPEN
          </span>
        );
      case 'IN PROGRESS':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            IN PROGRESS
          </span>
        );
      case 'WAITING FOR USER':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
            WAITING FOR USER
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#00843D]/10 text-[#00843D] dark:text-emerald-400 border border-[#00843D]/20">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00843D]"></span>
            RESOLVED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {status}
          </span>
        );
    }
  };

  // Helper for Category badge styling
  const renderCategoryBadge = (category) => {
    switch (category) {
      case 'Cash Prize':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-[#00843D] dark:text-emerald-400">
            Cash Prize
          </span>
        );
      case 'Vehicle Prize':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400">
            Vehicle Prize
          </span>
        );
      case 'Account':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-[#15273C] text-[#071A2B] dark:text-[#EDF4FF]">
            Account
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-[#15273C] text-[#071A2B] dark:text-[#EDF4FF]">
            {category}
          </span>
        );
    }
  };

  return (
    <AdminShell
      activeKey="support"
      breadcrumb="HQ Admin Console / Participant Support Queue"
      toastState={toastMessage}
      onCloseToast={() => setToastMessage(null)}
    >
      <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto" id="support-queue-container">
        
        {/* =========================================================================
            HEADER & TOP METADATA BAR
            ========================================================================= */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold font-sora tracking-widest text-[#00843D] uppercase">
                CUSTOMER OPERATIONS DESK
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                TICKETING &amp; FICA FIDUCIARY DISPATCH
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-sora tracking-tight text-[#071A2B] dark:text-[#EDF4FF]">
              Support
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
              Review, assign, and manage regulatory support requests from WinDriveSA participants.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#071A2B] text-white text-xs rounded-md font-medium shadow-xs border border-[#1E344A]">
              <span className="w-2 h-2 rounded-full bg-[#00843D] animate-pulse"></span>
              ZAR Secure Dispatch Active
            </span>
          </div>
        </div>

        {/* =========================================================================
            4 OPERATIONAL SUMMARY METRIC CARDS
            ========================================================================= */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4" id="support-metric-cards">
          {/* Card 1: OPEN */}
          <button
            type="button"
            onClick={() => {
              setStatusFilter(statusFilter === 'OPEN' ? 'ALL' : 'OPEN');
              setActivePreset(statusFilter === 'OPEN' ? 'all' : 'open');
            }}
            className={`text-left bg-white dark:bg-[#0B1E30] p-4 rounded-lg border shadow-xs flex flex-col justify-between transition-all hover:border-amber-400 focus:outline-none ${
              statusFilter === 'OPEN'
                ? 'ring-2 ring-amber-500 border-transparent dark:border-amber-500'
                : 'border-[#D9E0E7] dark:border-[#1E344A]'
            }`}
            id="metric-card-open"
          >
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
              <span className="font-bold uppercase tracking-wider font-sora">OPEN</span>
              <span className="material-symbols-outlined text-amber-500 text-[18px]">mark_email_unread</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-sora text-[#071A2B] dark:text-[#EDF4FF] tabular-nums">
                {metrics.open}
              </span>
              <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">Immediate Action</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Requires First Response</div>
          </button>

          {/* Card 2: IN PROGRESS */}
          <button
            type="button"
            onClick={() => {
              setStatusFilter(statusFilter === 'IN PROGRESS' ? 'ALL' : 'IN PROGRESS');
              setActivePreset('custom');
            }}
            className={`text-left bg-white dark:bg-[#0B1E30] p-4 rounded-lg border shadow-xs flex flex-col justify-between transition-all hover:border-blue-400 focus:outline-none ${
              statusFilter === 'IN PROGRESS'
                ? 'ring-2 ring-blue-500 border-transparent dark:border-blue-500'
                : 'border-[#D9E0E7] dark:border-[#1E344A]'
            }`}
            id="metric-card-in-progress"
          >
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
              <span className="font-bold uppercase tracking-wider font-sora">IN PROGRESS</span>
              <span className="material-symbols-outlined text-blue-500 text-[18px]">sync</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-sora text-[#071A2B] dark:text-[#EDF4FF] tabular-nums">
                {metrics.inProgress}
              </span>
              <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold">Under Audit</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Active Investigation</div>
          </button>

          {/* Card 3: WAITING FOR USER */}
          <button
            type="button"
            onClick={() => {
              setStatusFilter(statusFilter === 'WAITING FOR USER' ? 'ALL' : 'WAITING FOR USER');
              setActivePreset('custom');
            }}
            className={`text-left bg-white dark:bg-[#0B1E30] p-4 rounded-lg border shadow-xs flex flex-col justify-between transition-all hover:border-purple-400 focus:outline-none ${
              statusFilter === 'WAITING FOR USER'
                ? 'ring-2 ring-purple-500 border-transparent dark:border-purple-500'
                : 'border-[#D9E0E7] dark:border-[#1E344A]'
            }`}
            id="metric-card-waiting"
          >
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
              <span className="font-bold uppercase tracking-wider font-sora">WAITING FOR USER</span>
              <span className="material-symbols-outlined text-purple-500 text-[18px]">hourglass_top</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-sora text-[#071A2B] dark:text-[#EDF4FF] tabular-nums">
                {metrics.waitingForUser}
              </span>
              <span className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold">Pending Document</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Awaiting Claimant Response</div>
          </button>

          {/* Card 4: RESOLVED */}
          <button
            type="button"
            onClick={() => {
              setStatusFilter(statusFilter === 'RESOLVED' ? 'ALL' : 'RESOLVED');
              setActivePreset('custom');
            }}
            className={`text-left bg-white dark:bg-[#0B1E30] p-4 rounded-lg border shadow-xs flex flex-col justify-between transition-all hover:border-[#00843D] focus:outline-none ${
              statusFilter === 'RESOLVED'
                ? 'ring-2 ring-[#00843D] border-transparent dark:border-[#00843D]'
                : 'border-[#D9E0E7] dark:border-[#1E344A]'
            }`}
            id="metric-card-resolved"
          >
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
              <span className="font-bold uppercase tracking-wider font-sora">RESOLVED</span>
              <span className="material-symbols-outlined text-[#00843D] text-[18px]">check_circle</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-sora text-[#071A2B] dark:text-[#EDF4FF] tabular-nums">
                {metrics.resolved}
              </span>
              <span className="text-[11px] text-[#00843D] dark:text-emerald-400 font-semibold">100% Verified</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Fulfilled &amp; Closed Dossiers</div>
          </button>
        </div>

        {/* =========================================================================
            WHATSAPP DIRECT ASSISTANCE DESK INTEGRATION BAR
            ========================================================================= */}
        <div
          id="whatsapp-support-banner"
          className="p-4 rounded-lg bg-[#071A2B] text-white border border-[#1E344A] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm"
        >
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#00843D]/20 text-[#00843D] flex items-center justify-center shrink-0 border border-[#00843D]/40">
              <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                chat
              </span>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-sora text-sm font-bold tracking-tight text-white">
                  Direct WhatsApp Assistance Desk
                </span>
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-white/10 text-[#F2B705]">
                  +27 (0) 11 884 9200
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Support Channel Only • WinDriveSA never processes payments or collects banking credentials / OTPs via WhatsApp.
              </p>
            </div>
          </div>
          <a
            id="whatsapp-direct-link"
            className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#00843D] hover:bg-[#007034] text-white font-sora text-xs font-bold tracking-wide transition-all shadow-xs focus:outline-none focus:ring-2 focus:ring-[#F2B705]"
            href="https://wa.me/27118849200"
            rel="noopener noreferrer"
            target="_blank"
          >
            <span>Open WhatsApp</span>
            <span className="material-symbols-outlined text-[16px]">open_in_new</span>
          </a>
        </div>

        {/* =========================================================================
            FILTER PRESETS & SEARCH TOOLBAR
            ========================================================================= */}
        <div
          id="support-filters-toolbar"
          className="flex flex-col gap-3 bg-white dark:bg-[#0B1E30] p-4 rounded-lg border border-[#D9E0E7] dark:border-[#1E344A] shadow-xs"
        >
          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mr-1">
              Filter Presets:
            </span>
            <button
              id="preset-all"
              type="button"
              onClick={() => handleApplyPreset('all')}
              className={`px-3 py-1 rounded-md font-semibold transition-all text-xs focus:outline-none ${
                activePreset === 'all'
                  ? 'bg-[#071A2B] text-white dark:bg-[#F2B705] dark:text-[#071A2B]'
                  : 'bg-slate-100 dark:bg-[#15273C] text-[#071A2B] dark:text-[#EDF4FF] hover:bg-slate-200 dark:hover:bg-[#1E344A]'
              }`}
            >
              1. All Requests ({metrics.total})
            </button>
            <button
              id="preset-open"
              type="button"
              onClick={() => handleApplyPreset('open')}
              className={`px-3 py-1 rounded-md font-medium transition-all text-xs focus:outline-none ${
                activePreset === 'open'
                  ? 'bg-[#071A2B] text-white dark:bg-[#F2B705] dark:text-[#071A2B] font-semibold'
                  : 'bg-slate-100 dark:bg-[#15273C] text-[#071A2B] dark:text-[#EDF4FF] hover:bg-slate-200 dark:hover:bg-[#1E344A]'
              }`}
            >
              2. Open Only ({metrics.open})
            </button>
            <button
              id="preset-claims"
              type="button"
              onClick={() => handleApplyPreset('claims')}
              className={`px-3 py-1 rounded-md font-medium transition-all text-xs focus:outline-none ${
                activePreset === 'claims'
                  ? 'bg-[#071A2B] text-white dark:bg-[#F2B705] dark:text-[#071A2B] font-semibold'
                  : 'bg-slate-100 dark:bg-[#15273C] text-[#071A2B] dark:text-[#EDF4FF] hover:bg-slate-200 dark:hover:bg-[#1E344A]'
              }`}
            >
              3. Claims Inquiries
            </button>
            <button
              id="btn-reset-filters"
              type="button"
              onClick={handleResetFilters}
              className="text-xs text-slate-500 hover:text-[#071A2B] dark:text-slate-400 dark:hover:text-white underline ml-auto focus:outline-none"
            >
              Reset Filters
            </button>
          </div>

          {/* Filter Inputs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2 border-t border-[#D9E0E7] dark:border-[#1E344A]">
            {/* Search Input */}
            <div className="lg:col-span-2 relative">
              <span className="material-symbols-outlined text-slate-400 absolute left-3 top-2.5 text-[18px]">
                search
              </span>
              <input
                id="search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setActivePreset('custom');
                }}
                placeholder="Search by user, email, subject, or ticket..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-md border border-[#D9E0E7] dark:border-[#1E344A] bg-white dark:bg-[#071524] text-[#071A2B] dark:text-[#EDF4FF] focus:outline-none focus:ring-1 focus:ring-[#071A2B] dark:focus:ring-[#F2B705]"
              />
            </div>

            {/* Status Filter */}
            <div>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setActivePreset('custom');
                }}
                aria-label="Filter by Status"
                className="w-full py-2 px-3 text-xs rounded-md border border-[#D9E0E7] dark:border-[#1E344A] bg-white dark:bg-[#071524] text-[#071A2B] dark:text-[#EDF4FF] focus:outline-none focus:ring-1 focus:ring-[#071A2B] dark:focus:ring-[#F2B705]"
              >
                <option value="ALL">All Statuses</option>
                <option value="OPEN">OPEN</option>
                <option value="IN PROGRESS">IN PROGRESS</option>
                <option value="WAITING FOR USER">WAITING FOR USER</option>
                <option value="RESOLVED">RESOLVED</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <select
                id="category-filter"
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setActivePreset('custom');
                }}
                aria-label="Filter by Category"
                className="w-full py-2 px-3 text-xs rounded-md border border-[#D9E0E7] dark:border-[#1E344A] bg-white dark:bg-[#071524] text-[#071A2B] dark:text-[#EDF4FF] focus:outline-none focus:ring-1 focus:ring-[#071A2B] dark:focus:ring-[#F2B705]"
              >
                <option value="ALL">All Categories</option>
                <option value="Account">Account</option>
                <option value="Cash Prize">Cash Prize</option>
                <option value="Vehicle Prize">Vehicle Prize</option>
                <option value="General Support">General Support</option>
              </select>
            </div>

            {/* Date Range Filter */}
            <div>
              <select
                id="date-filter"
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  setActivePreset('custom');
                }}
                aria-label="Filter by Date Range"
                className="w-full py-2 px-3 text-xs rounded-md border border-[#D9E0E7] dark:border-[#1E344A] bg-white dark:bg-[#071524] text-[#071A2B] dark:text-[#EDF4FF] focus:outline-none focus:ring-1 focus:ring-[#071A2B] dark:focus:ring-[#F2B705]"
              >
                <option value="ALL">All Time</option>
                <option value="TODAY">Today</option>
                <option value="7DAYS">Last 7 Days</option>
                <option value="30DAYS">Last 30 Days</option>
              </select>
            </div>
          </div>
        </div>

        {/* =========================================================================
            DESKTOP SUPPORT QUEUE TABLE (hidden md:block)
            ========================================================================= */}
        <div
          id="desktop-support-table-card"
          className="hidden md:block bg-white dark:bg-[#0B1E30] rounded-lg border border-[#D9E0E7] dark:border-[#1E344A] shadow-xs overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs" id="support-table">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#071524] text-slate-500 dark:text-slate-400 border-b border-[#D9E0E7] dark:border-[#1E344A] uppercase tracking-wider font-semibold font-sora">
                  <th className="py-3.5 px-4">Request / Subject</th>
                  <th className="py-3.5 px-4">User Profile</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Last Updated</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9E0E7] dark:divide-[#1E344A]" id="table-body">
                {tickets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 px-4 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-slate-400 text-3xl">
                          inbox
                        </span>
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          No support requests found
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                          No tickets match your active filter combination. Try adjusting search terms or resetting filters.
                        </p>
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="mt-2 px-3 py-1.5 rounded-md bg-[#071A2B] text-white dark:bg-[#F2B705] dark:text-[#071A2B] text-xs font-semibold"
                        >
                          Clear All Filters
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  tickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      id={`ticket-row-${ticket.id}`}
                      className="hover:bg-slate-50/80 dark:hover:bg-[#15273C]/50 transition-colors"
                    >
                      {/* Request / Subject */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#071A2B] dark:text-[#EDF4FF] font-sora text-sm">
                              {ticket.subject}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#15273C] text-slate-600 dark:text-slate-400">
                              {ticket.ticketNumber}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs mt-0.5">
                            "{ticket.message}"
                          </span>
                        </div>
                      </td>

                      {/* User Profile */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-[#071A2B] dark:text-[#EDF4FF]">
                            {ticket.user.name}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                            {ticket.user.email}
                          </span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4">
                        {renderCategoryBadge(ticket.category)}
                      </td>

                      {/* Last Updated */}
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 tabular-nums">
                        {ticket.lastUpdated || ticket.timestamp}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {renderStatusBadge(ticket.status)}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          id={`btn-view-${ticket.id}`}
                          onClick={() => navigate(`/admin/support/${ticket.id}`)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-[#071A2B] hover:bg-slate-800 dark:bg-[#F2B705] dark:hover:bg-amber-400 text-white dark:text-[#071A2B] font-sora font-semibold text-xs tracking-tight transition-all shadow-xs focus:outline-none focus:ring-2 focus:ring-[#F2B705]"
                        >
                          <span>View Request</span>
                          <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* =========================================================================
            MOBILE STACKED CARDS (< 768px)
            ========================================================================= */}
        <div className="md:hidden flex flex-col gap-3" id="mobile-cards-container">
          {tickets.length === 0 ? (
            <div className="bg-white dark:bg-[#0B1E30] p-6 rounded-lg border border-[#D9E0E7] dark:border-[#1E344A] text-center">
              <span className="material-symbols-outlined text-slate-400 text-3xl">inbox</span>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mt-2">
                No support requests found
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-3 px-3 py-1.5 rounded-md bg-[#071A2B] text-white dark:bg-[#F2B705] dark:text-[#071A2B] text-xs font-semibold"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            tickets.map((ticket) => (
              <div
                key={ticket.id}
                id={`mobile-card-${ticket.id}`}
                className="bg-white dark:bg-[#0B1E30] p-4 rounded-lg border border-[#D9E0E7] dark:border-[#1E344A] shadow-xs flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400">
                      {ticket.ticketNumber} • {ticket.category}
                    </span>
                    <h2 className="font-sora font-bold text-sm text-[#071A2B] dark:text-[#EDF4FF]">
                      {ticket.subject}
                    </h2>
                  </div>
                  <div>{renderStatusBadge(ticket.status)}</div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                  "{ticket.message}"
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-[#D9E0E7] dark:border-[#1E344A] text-xs">
                  <div>
                    <div className="font-semibold text-[#071A2B] dark:text-[#EDF4FF]">
                      {ticket.user.name}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                      {ticket.lastUpdated || ticket.timestamp}
                    </div>
                  </div>
                  <button
                    type="button"
                    id={`mobile-view-${ticket.id}`}
                    onClick={() => navigate(`/admin/support/${ticket.id}`)}
                    className="px-3 py-1.5 rounded-md bg-[#071A2B] dark:bg-[#F2B705] text-white dark:text-[#071A2B] font-sora text-xs font-semibold shadow-xs"
                  >
                    View Request
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* =========================================================================
            STATUTORY POPIA SECTION 18 & SARB ESCROW AUDIT FOOTER
            ========================================================================= */}
        <footer
          id="support-audit-footer"
          className="w-full mt-6 pt-6 border-t border-[#D9E0E7] dark:border-[#1E344A] flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400"
        >
          <div className="flex flex-col sm:flex-row items-center gap-2 text-center sm:text-left">
            <span className="font-bold text-[#071A2B] dark:text-[#EDF4FF] font-sora">
              WinDriveSA Customer Operations Desk
            </span>
            <span className="hidden sm:inline">•</span>
            <span>POPIA Section 18 &amp; SARB Escrow Audit Ledger Compliant</span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span>Node: JHB-FID-04</span>
            <span>•</span>
            <span className="text-[#00843D] dark:text-emerald-400 font-semibold">
              SSL 256-bit Encrypted
            </span>
          </div>
        </footer>

      </div>
    </AdminShell>
  );
}
