import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminShell from '../../components/admin/AdminShell';
import {
  getFulfilledPrizeRecords,
  getFulfilledMetrics,
  exportFulfilledRecordsCSV,
} from '../../services/mockWinners';

export default function AdminWinners() {
  const navigate = useNavigate();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [prizeTypeFilter, setPrizeTypeFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('ALL');
  const [rewardStatusFilter, setRewardStatusFilter] = useState('COMPLETED');
  const [toastMessage, setToastMessage] = useState(null);

  // Raw Records from Service
  const [records, setRecords] = useState([]);

  useEffect(() => {
    const data = getFulfilledPrizeRecords();
    setRecords(data);
  }, []);

  // Summary Metrics from real service data
  const metrics = useMemo(() => {
    return getFulfilledMetrics(records);
  }, [records]);

  // Dynamic Filtering against service dataset
  const filteredRecords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return records.filter((rec) => {
      // 1. Search Query: user name, email, or prize title
      const matchesSearch =
        !q ||
        rec.userName.toLowerCase().includes(q) ||
        rec.userEmail.toLowerCase().includes(q) ||
        rec.prizeTitle.toLowerCase().includes(q) ||
        rec.id.toLowerCase().includes(q);

      // 2. Prize Type: ALL, CASH, VEHICLE
      const matchesType =
        prizeTypeFilter === 'ALL' ||
        rec.prizeType.toUpperCase() === prizeTypeFilter.toUpperCase();

      // 3. Date Filter: ALL, RECENT (September 2026), OLDER
      let matchesDate = true;
      if (dateFilter === 'RECENT') {
        matchesDate =
          rec.fulfilledDate.includes('Sep 2026') ||
          rec.fulfilledDate.includes('September 2026');
      } else if (dateFilter === 'OLDER') {
        matchesDate =
          !rec.fulfilledDate.includes('Sep 2026') &&
          !rec.fulfilledDate.includes('September 2026');
      }

      // 4. Reward Status: ALL, COMPLETED
      const matchesStatus =
        rewardStatusFilter === 'ALL' ||
        rec.rewardStatus.toUpperCase() === rewardStatusFilter.toUpperCase();

      return matchesSearch && matchesType && matchesDate && matchesStatus;
    });
  }, [records, searchQuery, prizeTypeFilter, dateFilter, rewardStatusFilter]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setPrizeTypeFilter('ALL');
    setDateFilter('ALL');
    setRewardStatusFilter('ALL');
    showToast('Filters cleared');
  };

  const handleExportCSV = () => {
    const success = exportFulfilledRecordsCSV();
    if (success) {
      showToast('Fulfilment ledger exported as CSV');
    } else {
      showToast('Unable to export records');
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  return (
    <AdminShell
      activeKey="winners"
      breadcrumb="HQ Admin Console / Fulfilled Prize Records / Winners Ledger"
      toastState={toastMessage ? { visible: true, message: toastMessage } : null}
      onCloseToast={() => setToastMessage(null)}
    >
      <div className="space-y-6">
        {/* =========================================================================
            HEADER SECTION
            ========================================================================= */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-[#D9E0E7] dark:border-[#1B3754]">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#667085] dark:text-slate-400 uppercase tracking-wider mb-1.5">
              <span>FULFILLED PRIZE RECORDS</span>
              <span>•</span>
              <span className="text-[#00843D] dark:text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00843D] dark:bg-emerald-400 animate-pulse"></span>
                Fulfilment Ledger Active
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-sora text-[#071A2B] dark:text-white tracking-tight">
              Winners
            </h1>
            <p className="text-sm text-[#667085] dark:text-slate-400 mt-1 max-w-2xl">
              Review completed prize records and their fulfilment history.
            </p>
          </div>

          {/* Operational Secondary Actions */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              id="export-csv-btn"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-white dark:bg-[#071A2B] border border-[#D9E0E7] dark:border-[#1B3754] text-[#071A2B] dark:text-white hover:bg-[#F5F7FA] dark:hover:bg-[#0B253F] transition-colors shadow-xs"
            >
              <svg className="w-4 h-4 text-[#667085] dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Export Fulfilment CSV</span>
            </button>
            <div className="hidden sm:block text-[11px] font-mono text-[#667085] dark:text-slate-400 px-2.5 py-1.5 rounded bg-[#F5F7FA] dark:bg-[#0B253F]/60 border border-[#D9E0E7] dark:border-[#1B3754]">
              Audit Cycle: <strong className="text-[#071A2B] dark:text-white">#WD-2026-F</strong>
            </div>
          </div>
        </div>

        {/* =========================================================================
            RESTRAINED SUMMARY ROW (Operational Metrics from Service)
            ========================================================================= */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* 1. Fulfilled Records */}
          <div className="bg-white dark:bg-[#071A2B] p-4 rounded-xl border border-[#D9E0E7] dark:border-[#1B3754] shadow-xs">
            <div className="flex items-center justify-between text-[#667085] dark:text-slate-400 text-xs font-mono">
              <span>FULFILLED RECORDS</span>
              <svg className="w-4 h-4 text-[#00843D] dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-sora text-[#071A2B] dark:text-white mt-2">
              {metrics.totalRecords}
            </div>
            <div className="text-[11px] text-[#667085] dark:text-slate-400 mt-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00843D] dark:bg-emerald-400"></span>
              <span>100% Cleared & Documented</span>
            </div>
          </div>

          {/* 2. Cash Prizes */}
          <div className="bg-white dark:bg-[#071A2B] p-4 rounded-xl border border-[#D9E0E7] dark:border-[#1B3754] shadow-xs">
            <div className="flex items-center justify-between text-[#667085] dark:text-slate-400 text-xs font-mono">
              <span>CASH PRIZES</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#F2B705]/20 text-[#071A2B] dark:text-[#F2B705]">
                ZAR
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-sora text-[#071A2B] dark:text-white mt-2">
              {metrics.cashCount}
            </div>
            <div className="text-[11px] text-[#667085] dark:text-slate-400 mt-1">
              Disbursed via Escrow Account
            </div>
          </div>

          {/* 3. Vehicle Prizes */}
          <div className="bg-white dark:bg-[#071A2B] p-4 rounded-xl border border-[#D9E0E7] dark:border-[#1B3754] shadow-xs">
            <div className="flex items-center justify-between text-[#667085] dark:text-slate-400 text-xs font-mono">
              <span>VEHICLE PRIZES</span>
              <svg className="w-4 h-4 text-[#071A2B] dark:text-[#F2B705]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 17a2 2 0 100-4 2 2 0 000 4zm10 0a2 2 0 100-4 2 2 0 000 4zM4 11h16M4 11V7a1 1 0 011-1h10l4 5v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-7z" />
              </svg>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-sora text-[#071A2B] dark:text-white mt-2">
              {metrics.vehicleCount}
            </div>
            <div className="text-[11px] text-[#667085] dark:text-slate-400 mt-1">
              Provincial Handover Certified
            </div>
          </div>

          {/* 4. Latest Fulfilment */}
          <div className="bg-white dark:bg-[#071A2B] p-4 rounded-xl border border-[#D9E0E7] dark:border-[#1B3754] shadow-xs">
            <div className="flex items-center justify-between text-[#667085] dark:text-slate-400 text-xs font-mono">
              <span>LATEST FULFILMENT</span>
              <svg className="w-4 h-4 text-[#667085] dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-lg sm:text-xl font-bold font-sora text-[#071A2B] dark:text-white mt-2.5 truncate">
              {metrics.latestFulfilment}
            </div>
            <div className="text-[11px] text-[#667085] dark:text-slate-400 mt-1 truncate">
              {metrics.latestRecord ? `${metrics.latestRecord.userName} • #${metrics.latestRecord.id}` : 'No records yet'}
            </div>
          </div>
        </div>

        {/* =========================================================================
            FILTER / SEARCH AREA
            ========================================================================= */}
        <div className="bg-white dark:bg-[#071A2B] p-4 rounded-xl border border-[#D9E0E7] dark:border-[#1B3754] shadow-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
            {/* Search Input */}
            <div className="lg:col-span-4 relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[#667085] dark:text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                id="search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by user, email, or prize"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#D9E0E7] dark:border-[#1B3754] bg-[#F5F7FA]/70 dark:bg-[#0B253F]/40 text-[#071A2B] dark:text-white placeholder-[#667085] dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#F2B705] focus:border-[#F2B705]"
              />
            </div>

            {/* Prize Type Filter */}
            <div className="lg:col-span-2">
              <label htmlFor="filter-type" className="sr-only">
                Prize Type
              </label>
              <select
                id="filter-type"
                value={prizeTypeFilter}
                onChange={(e) => setPrizeTypeFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#D9E0E7] dark:border-[#1B3754] bg-[#F5F7FA]/70 dark:bg-[#0B253F]/40 text-[#071A2B] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#F2B705]"
              >
                <option value="ALL">All Prize Types</option>
                <option value="CASH">Cash</option>
                <option value="VEHICLE">Vehicle</option>
              </select>
            </div>

            {/* Fulfilment Date Filter */}
            <div className="lg:col-span-2">
              <label htmlFor="filter-date" className="sr-only">
                Fulfilment Date
              </label>
              <select
                id="filter-date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#D9E0E7] dark:border-[#1B3754] bg-[#F5F7FA]/70 dark:bg-[#0B253F]/40 text-[#071A2B] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#F2B705]"
              >
                <option value="ALL">All Dates</option>
                <option value="RECENT">Recent</option>
                <option value="OLDER">Older</option>
              </select>
            </div>

            {/* Reward Status Filter */}
            <div className="lg:col-span-2">
              <label htmlFor="filter-status" className="sr-only">
                Reward Status
              </label>
              <select
                id="filter-status"
                value={rewardStatusFilter}
                onChange={(e) => setRewardStatusFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#D9E0E7] dark:border-[#1B3754] bg-[#F5F7FA]/70 dark:bg-[#0B253F]/40 text-[#071A2B] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#F2B705]"
              >
                <option value="ALL">All</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>

            {/* Clear Filters Button */}
            <div className="lg:col-span-2 flex items-center justify-end">
              <button
                type="button"
                id="clear-filters-btn"
                onClick={handleClearFilters}
                className="w-full sm:w-auto px-3.5 py-2 text-xs font-semibold text-[#667085] dark:text-slate-400 hover:text-[#071A2B] dark:hover:text-white border border-[#D9E0E7] dark:border-[#1B3754] rounded-lg bg-white dark:bg-[#071A2B] hover:bg-[#F5F7FA] dark:hover:bg-[#0B253F] transition-colors flex items-center justify-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Clear Filters</span>
              </button>
            </div>
          </div>
        </div>

        {/* =========================================================================
            DESKTOP TABLE (>= md)
            ========================================================================= */}
        <div className="hidden md:block bg-white dark:bg-[#071A2B] rounded-xl border border-[#D9E0E7] dark:border-[#1B3754] overflow-hidden shadow-xs">
          {filteredRecords.length === 0 ? (
            <div className="p-12 text-center" id="empty-state-desktop">
              <div className="w-12 h-12 rounded-full bg-[#F5F7FA] dark:bg-[#0B253F] mx-auto flex items-center justify-center text-[#667085] dark:text-slate-400 mb-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-sm font-bold font-sora text-[#071A2B] dark:text-white">
                No fulfilled prize records yet.
              </h3>
              <p className="text-xs text-[#667085] dark:text-slate-400 mt-1 max-w-sm mx-auto">
                Completed prize records will appear here after a claim has been fulfilled.
              </p>
              <button
                type="button"
                onClick={handleClearFilters}
                className="mt-3 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#071A2B] text-white dark:bg-[#F2B705] dark:text-[#071A2B] hover:opacity-90 transition-opacity"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <table className="w-full text-left border-collapse" id="winners-desktop-table">
              <thead>
                <tr className="border-b border-[#D9E0E7] dark:border-[#1B3754] bg-[#F5F7FA]/70 dark:bg-[#0B253F]/50 text-[11px] font-mono uppercase text-[#667085] dark:text-slate-400 tracking-wider">
                  <th className="py-3.5 px-4 font-semibold">User</th>
                  <th className="py-3.5 px-4 font-semibold">Prize</th>
                  <th className="py-3.5 px-4 font-semibold">Type</th>
                  <th className="py-3.5 px-4 font-semibold">Claim Status</th>
                  <th className="py-3.5 px-4 font-semibold">Fulfilled</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9E0E7]/60 dark:divide-[#1B3754]/60 text-xs">
                {filteredRecords.map((rec) => {
                  const isCash = rec.prizeType === 'CASH';
                  return (
                    <tr
                      key={rec.id}
                      className="hover:bg-[#F5F7FA]/60 dark:hover:bg-[#0B253F]/40 transition-colors"
                    >
                      {/* User Column */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#071A2B] text-white dark:bg-[#F2B705] dark:text-[#071A2B] font-bold text-xs flex items-center justify-center shrink-0 font-sora">
                            {rec.userName
                              .split(' ')
                              .map((n) => n[0])
                              .join('')}
                          </div>
                          <div>
                            <div className="font-bold text-[#071A2B] dark:text-white leading-tight">
                              {rec.userName}
                            </div>
                            <div className="text-[11px] text-[#667085] dark:text-slate-400 font-mono">
                              {rec.userEmail}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Prize Column */}
                      <td className="py-3.5 px-4 font-semibold text-[#071A2B] dark:text-white">
                        {rec.prizeTitle}
                      </td>

                      {/* Type Column */}
                      <td className="py-3.5 px-4">
                        {isCash ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-300">
                            CASH
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 text-blue-900 dark:bg-blue-900/40 dark:text-blue-300">
                            VEHICLE
                          </span>
                        )}
                      </td>

                      {/* Claim Status Column */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#00843D]/10 text-[#00843D] dark:bg-emerald-950/40 dark:text-emerald-400 border border-[#00843D]/20 dark:border-emerald-800/40">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#00843D] dark:bg-emerald-400"></span>
                          FULFILLED
                        </span>
                      </td>

                      {/* Fulfilled Date Column */}
                      <td className="py-3.5 px-4 font-mono text-[#667085] dark:text-slate-400">
                        {rec.fulfilledDate}
                      </td>

                      {/* Action Column */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          id={`view-btn-${rec.id}`}
                          onClick={() => navigate(`/admin/winners/${rec.id}`)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#F5F7FA] dark:bg-[#0B253F] hover:bg-[#071A2B] hover:text-white dark:hover:bg-[#F2B705] dark:hover:text-[#071A2B] text-[#071A2B] dark:text-white border border-[#D9E0E7] dark:border-[#1B3754] transition-all"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* =========================================================================
            MOBILE & TABLET STACKED CARDS (< md)
            ========================================================================= */}
        <div className="block md:hidden space-y-3" id="winners-mobile-list">
          {filteredRecords.length === 0 ? (
            <div className="bg-white dark:bg-[#071A2B] p-8 rounded-xl border border-[#D9E0E7] dark:border-[#1B3754] text-center" id="empty-state-mobile">
              <div className="w-10 h-10 rounded-full bg-[#F5F7FA] dark:bg-[#0B253F] mx-auto flex items-center justify-center text-[#667085] dark:text-slate-400 mb-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-sm font-bold font-sora text-[#071A2B] dark:text-white">
                No fulfilled prize records yet.
              </h3>
              <p className="text-xs text-[#667085] dark:text-slate-400 mt-1">
                Completed prize records will appear here after a claim has been fulfilled.
              </p>
              <button
                type="button"
                onClick={handleClearFilters}
                className="mt-3 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#071A2B] text-white dark:bg-[#F2B705] dark:text-[#071A2B]"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            filteredRecords.map((rec) => {
              const isCash = rec.prizeType === 'CASH';
              return (
                <div
                  key={rec.id}
                  className="bg-white dark:bg-[#071A2B] p-4 rounded-xl border border-[#D9E0E7] dark:border-[#1B3754] space-y-3 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#071A2B] text-white dark:bg-[#F2B705] dark:text-[#071A2B] font-bold text-xs flex items-center justify-center font-sora">
                        {rec.userName
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-[#071A2B] dark:text-white leading-tight">
                          {rec.userName}
                        </div>
                        <div className="text-[11px] text-[#667085] dark:text-slate-400 font-mono">
                          {rec.userEmail}
                        </div>
                      </div>
                    </div>
                    {isCash ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-300">
                        CASH
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 text-blue-900 dark:bg-blue-900/40 dark:text-blue-300">
                        VEHICLE
                      </span>
                    )}
                  </div>

                  <div className="text-xs space-y-1.5 py-2 border-y border-[#D9E0E7]/60 dark:border-[#1B3754]/60">
                    <div className="flex justify-between items-center">
                      <span className="text-[#667085] dark:text-slate-400">Prize:</span>
                      <span className="font-semibold text-[#071A2B] dark:text-white text-right max-w-[200px] truncate">
                        {rec.prizeTitle}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#667085] dark:text-slate-400">Fulfilled Date:</span>
                      <span className="font-mono text-[#667085] dark:text-slate-300">
                        {rec.fulfilledDate}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#667085] dark:text-slate-400">Claim Status:</span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#00843D]/10 text-[#00843D] dark:bg-emerald-950/40 dark:text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00843D] dark:bg-emerald-400"></span>
                        FULFILLED
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate(`/admin/winners/${rec.id}`)}
                    className="w-full py-2 text-xs font-semibold rounded-lg bg-[#071A2B] text-white dark:bg-[#F2B705] dark:text-[#071A2B] text-center transition-opacity hover:opacity-90"
                  >
                    View
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </AdminShell>
  );
}
