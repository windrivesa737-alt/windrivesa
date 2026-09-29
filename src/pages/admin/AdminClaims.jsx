import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AdminShell from '../../components/admin/AdminShell';
import { getAdminClaims, getClaimMetrics } from '../../services/claims';
import { getAllClaims } from '../../services/mockClaims';

export default function AdminClaims() {
  const navigate = useNavigate();
  const [claims, setClaims] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [toastMessage, setToastMessage] = useState(null);

  // Load claims data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await getAdminClaims();
      if (res?.data && res.data.length > 0) {
        setClaims(res.data);
      } else if (!import.meta.env.PROD) {
        const data = getAllClaims();
        setClaims(data || []);
      } else {
        setClaims([]);
      }
    } catch (_) {
      if (!import.meta.env.PROD) {
        const data = getAllClaims();
        setClaims(data || []);
      } else {
        setClaims([]);
      }
    }
  };

  // Summary metrics computed dynamically
  const metrics = useMemo(() => {
    return getClaimMetrics(claims);
  }, [claims]);

  // Filter claims
  const filteredClaims = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return claims.filter((claim) => {
      // Search matching Claim ID, User Full Name, or Email
      const matchesSearch =
        !query ||
        claim.id.toLowerCase().includes(query) ||
        (claim.userName && claim.userName.toLowerCase().includes(query)) ||
        (claim.userEmail && claim.userEmail.toLowerCase().includes(query));

      // Type filter
      const matchesType =
        typeFilter === 'ALL' ||
        (typeFilter === 'CASH' && claim.type.toLowerCase().includes('cash')) ||
        (typeFilter === 'VEHICLE' && claim.type.toLowerCase().includes('vehicle'));

      // Status filter
      const matchesStatus =
        statusFilter === 'ALL' || claim.status.toUpperCase() === statusFilter.toUpperCase();

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [claims, searchQuery, typeFilter, statusFilter]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setTypeFilter('ALL');
    setStatusFilter('ALL');
    showToast('Filters cleared');
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'UNDER REVIEW':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Under Review
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#00843D]/10 text-[#00843D] dark:text-[#10B981] border border-[#00843D]/20">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00843D] dark:bg-[#10B981]"></span>
            Approved
          </span>
        );
      case 'REQUIREMENT PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            Req. Pending
          </span>
        );
      case 'MORE INFORMATION REQUIRED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
            More Info Req.
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
            Processing
          </span>
        );
      case 'FULFILLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
            ✓ Fulfilled
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
            × Rejected
          </span>
        );
      case 'SUBMITTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
            Submitted
          </span>
        );
      case 'CLAIM AVAILABLE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
            Available
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {status}
          </span>
        );
    }
  };

  const isFiltersActive = searchQuery !== '' || typeFilter !== 'ALL' || statusFilter !== 'ALL';

  return (
    <AdminShell
      activeKey="claims"
      breadcrumb="HQ Admin Console / Claim Requests Queue"
      toastState={toastMessage ? { open: true, message: toastMessage, type: 'success' } : null}
      onCloseToast={() => setToastMessage(null)}
    >
      <div className="space-y-8">
        {/* PAGE HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#071A2B] text-[#F2B705] dark:bg-[#F2B705] dark:text-[#071A2B]">
                REGISTRY MODULE
              </span>
              <span className="text-xs text-[#667085] dark:text-[#94A3B8] font-mono">
                ROUTE: /admin/claims
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-[#071A2B] dark:text-white tracking-tight">
              Claim Requests
            </h1>
            <p className="text-sm text-[#667085] dark:text-[#94A3B8] mt-1 max-w-3xl">
              Review submitted cash and vehicle prize claims, manage claim status, and complete approved fulfilment workflows.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/admin/claim-requirements"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-white dark:bg-[#0B1A28] border border-[#D9E0E7] dark:border-[#1E2E3E] text-[#071A2B] dark:text-white hover:border-[#071A2B] dark:hover:border-white transition-colors shadow-xs"
            >
              <svg className="w-4 h-4 text-[#00843D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              <span>Claim Requirements</span>
            </Link>
          </div>
        </div>

        {/* SUMMARY METRICS CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Card 1: Total Claims */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#0B1A28] border border-[#D9E0E7] dark:border-[#1E2E3E] shadow-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#667085] dark:text-[#94A3B8]">
                Total Claims
              </span>
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-[#071A2B] dark:text-white flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-heading font-extrabold text-[#071A2B] dark:text-white">
              {metrics.totalClaims}
            </div>
            <p className="text-[11px] text-[#667085] dark:text-[#94A3B8]">
              All logged claims in system
            </p>
          </div>

          {/* Card 2: Under Review */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#0B1A28] border border-[#D9E0E7] dark:border-[#1E2E3E] shadow-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#667085] dark:text-[#94A3B8]">
                Under Review
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-heading font-extrabold text-amber-600 dark:text-amber-400">
              {metrics.underReview}
            </div>
            <p className="text-[11px] text-[#667085] dark:text-[#94A3B8]">
              Awaiting registrar verification
            </p>
          </div>

          {/* Card 3: Approved */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#0B1A28] border border-[#D9E0E7] dark:border-[#1E2E3E] shadow-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#667085] dark:text-[#94A3B8]">
                Approved
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#00843D]/10 text-[#00843D] dark:text-[#10B981] flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-heading font-extrabold text-[#00843D] dark:text-[#10B981]">
              {metrics.approved}
            </div>
            <p className="text-[11px] text-[#667085] dark:text-[#94A3B8]">
              Passed statutory compliance
            </p>
          </div>

          {/* Card 4: Requirements Pending */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#0B1A28] border border-[#D9E0E7] dark:border-[#1E2E3E] shadow-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#667085] dark:text-[#94A3B8]">
                Requirements Pending
              </span>
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-heading font-extrabold text-rose-600 dark:text-rose-400">
              {metrics.requirementsPending}
            </div>
            <p className="text-[11px] text-[#667085] dark:text-[#94A3B8]">
              Logistics or documentation pending
            </p>
          </div>
        </div>

        {/* SEARCH AND FILTERS BAR */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0B1A28] border border-[#D9E0E7] dark:border-[#1E2E3E] shadow-xs space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Search input */}
            <div className="md:col-span-6 relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#667085] dark:text-[#94A3B8]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search claims by claimant name, email, or Claim ID..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F5F7FA] dark:bg-[#07131E] border border-[#D9E0E7] dark:border-[#1E2E3E] text-xs sm:text-sm text-[#071A2B] dark:text-white placeholder-[#667085] dark:placeholder-[#94A3B8] focus:outline-none focus:border-[#071A2B] dark:focus:border-[#F2B705] transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-[#667085] hover:text-[#071A2B] dark:hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Type Filter */}
            <div className="md:col-span-3">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F7FA] dark:bg-[#07131E] border border-[#D9E0E7] dark:border-[#1E2E3E] text-xs sm:text-sm text-[#071A2B] dark:text-white focus:outline-none focus:border-[#071A2B] dark:focus:border-[#F2B705] transition-colors"
              >
                <option value="ALL">All Claim Types</option>
                <option value="CASH">Cash Prize Claim</option>
                <option value="VEHICLE">Vehicle Prize Claim</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="md:col-span-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F7FA] dark:bg-[#07131E] border border-[#D9E0E7] dark:border-[#1E2E3E] text-xs sm:text-sm text-[#071A2B] dark:text-white focus:outline-none focus:border-[#071A2B] dark:focus:border-[#F2B705] transition-colors"
              >
                <option value="ALL">All Statuses</option>
                <option value="UNDER REVIEW">Under Review</option>
                <option value="APPROVED">Approved</option>
                <option value="REQUIREMENT PENDING">Requirement Pending</option>
                <option value="PROCESSING">Processing</option>
                <option value="FULFILLED">Fulfilled</option>
                <option value="MORE INFORMATION REQUIRED">More Information Required</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="REJECTED">Rejected</option>
                <option value="CLAIM AVAILABLE">Claim Available</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-2 border-t border-[#D9E0E7] dark:border-[#1E2E3E] text-xs">
            <span className="text-[#667085] dark:text-[#94A3B8] font-mono">
              Showing {filteredClaims.length} of {claims.length} operational claim records
            </span>
            {isFiltersActive && (
              <button
                onClick={handleClearFilters}
                className="text-xs font-bold text-[#071A2B] dark:text-[#F2B705] hover:underline self-start sm:self-auto"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>

        {/* DESKTOP CLAIMS TABLE (lg:block) */}
        <div className="hidden lg:block bg-white dark:bg-[#0B1A28] rounded-2xl border border-[#D9E0E7] dark:border-[#1E2E3E] shadow-xs overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#D9E0E7] dark:border-[#1E2E3E] bg-[#F5F7FA]/70 dark:bg-[#07131E]/70 text-[11px] font-bold uppercase tracking-wider text-[#667085] dark:text-[#94A3B8]">
                <th className="py-4 px-6">Claim ID</th>
                <th className="py-4 px-6">User / Claimant</th>
                <th className="py-4 px-6">Prize Allocated</th>
                <th className="py-4 px-6">Type</th>
                <th className="py-4 px-6">Submitted Date</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D9E0E7] dark:divide-[#1E2E3E] text-sm">
              {filteredClaims.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-[#667085] dark:text-[#94A3B8]">
                    <div className="max-w-sm mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="font-heading font-bold text-base text-[#071A2B] dark:text-white">
                        No claim requests found
                      </p>
                      <p className="text-xs">
                        No operational claims matched the current query or filter criteria.
                      </p>
                      {isFiltersActive && (
                        <button
                          onClick={handleClearFilters}
                          className="px-4 py-2 rounded-xl text-xs font-bold bg-[#071A2B] text-white dark:bg-[#F2B705] dark:text-[#071A2B]"
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredClaims.map((claim) => (
                  <tr
                    key={claim.id}
                    className="hover:bg-[#F5F7FA]/60 dark:hover:bg-[#07131E]/40 transition-colors"
                  >
                    <td className="py-4 px-6 font-mono font-bold text-xs text-[#071A2B] dark:text-white">
                      {claim.id}
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-bold text-[#071A2B] dark:text-white">
                        {claim.userName}
                      </div>
                      <div className="text-xs text-[#667085] dark:text-[#94A3B8] font-mono">
                        {claim.userEmail}
                      </div>
                    </td>
                    <td className="py-4 px-6 font-semibold text-[#071A2B] dark:text-white">
                      {claim.prizeName}
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold ${
                          claim.type.toLowerCase().includes('vehicle')
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            : 'bg-[#00843D]/10 text-[#00843D] dark:text-[#10B981]'
                        }`}
                      >
                        {claim.type}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-mono text-xs text-[#667085] dark:text-[#94A3B8]">
                      {claim.submittedDate}
                    </td>
                    <td className="py-4 px-6">{renderStatusBadge(claim.status)}</td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => navigate(`/admin/claims/${claim.id}`)}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#071A2B] dark:bg-[#F2B705] text-white dark:text-[#071A2B] hover:opacity-90 transition-opacity shadow-2xs"
                      >
                        Review Claim
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* TABLET & MOBILE STACKED CARDS (< lg) */}
        <div className="lg:hidden space-y-4">
          {filteredClaims.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-white dark:bg-[#0B1A28] border border-[#D9E0E7] dark:border-[#1E2E3E] space-y-3">
              <p className="font-heading font-bold text-base text-[#071A2B] dark:text-white">
                No claim requests found
              </p>
              <p className="text-xs text-[#667085] dark:text-[#94A3B8]">
                No operational claims match your filters.
              </p>
              {isFiltersActive && (
                <button
                  onClick={handleClearFilters}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#071A2B] text-white dark:bg-[#F2B705] dark:text-[#071A2B]"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            filteredClaims.map((claim) => (
              <div
                key={claim.id}
                className="p-5 rounded-2xl bg-white dark:bg-[#0B1A28] border border-[#D9E0E7] dark:border-[#1E2E3E] shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#071A2B] dark:text-white px-2 py-0.5 rounded bg-[#F5F7FA] dark:bg-[#07131E] border border-[#D9E0E7] dark:border-[#1E2E3E]">
                    {claim.id}
                  </span>
                  {renderStatusBadge(claim.status)}
                </div>

                <div>
                  <h3 className="font-bold text-base text-[#071A2B] dark:text-white">
                    {claim.userName}
                  </h3>
                  <p className="text-xs text-[#667085] dark:text-[#94A3B8] font-mono">
                    {claim.userEmail}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#F5F7FA] dark:bg-[#07131E] text-xs space-y-1">
                  <div className="text-[#667085] dark:text-[#94A3B8]">Prize Allocated:</div>
                  <div className="font-bold text-[#071A2B] dark:text-white">{claim.prizeName}</div>
                  <div className="text-[11px]">
                    <span
                      className={`inline-block font-semibold ${
                        claim.type.toLowerCase().includes('vehicle')
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-[#00843D] dark:text-[#10B981]'
                      }`}
                    >
                      {claim.type}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#D9E0E7] dark:border-[#1E2E3E]">
                  <span className="text-xs text-[#667085] dark:text-[#94A3B8] font-mono">
                    {claim.submittedDate}
                  </span>
                  <button
                    onClick={() => navigate(`/admin/claims/${claim.id}`)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-[#071A2B] dark:bg-[#F2B705] text-white dark:text-[#071A2B]"
                  >
                    Review Claim
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* STATUTORY DISCLAIMER FOOTER */}
        <footer className="pt-8 border-t border-[#D9E0E7] dark:border-[#1E2E3E] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#667085] dark:text-[#94A3B8]">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-[#00843D]" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>POPIA Section 18 &amp; SARB Escrow Audit Ledger Compliant</span>
          </div>
          <div className="font-mono text-[11px]">
            Node: JHB-REG-04 &bull; SSL 256-bit Encrypted
          </div>
        </footer>
      </div>
    </AdminShell>
  );
}
