import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AdminShell from '../../components/admin/AdminShell';
import { getFulfilledPrizeRecordById } from '../../services/mockWinners';

export default function AdminWinnerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const found = getFulfilledPrizeRecordById(id);
    setRecord(found);
    setLoading(false);
  }, [id]);

  if (loading) {
    return (
      <AdminShell
        activeKey="winners"
        breadcrumb="HQ Admin Console / Fulfilled Prize Records / Loading..."
      >
        <div className="py-16 text-center text-[#667085] dark:text-slate-400 font-mono text-xs">
          Loading fulfilled prize record...
        </div>
      </AdminShell>
    );
  }

  if (!record) {
    return (
      <AdminShell
        activeKey="winners"
        breadcrumb="HQ Admin Console / Fulfilled Prize Records / Record Not Found"
      >
        <div className="bg-white dark:bg-[#071A2B] p-8 rounded-xl border border-[#D9E0E7] dark:border-[#1B3754] text-center max-w-lg mx-auto my-12 space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#F5F7FA] dark:bg-[#0B253F] mx-auto flex items-center justify-center text-[#667085] dark:text-slate-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold font-sora text-[#071A2B] dark:text-white">
            Fulfilled Record Not Found
          </h2>
          <p className="text-xs text-[#667085] dark:text-slate-400">
            The requested fulfilled prize record (<span className="font-mono">{id}</span>) could not be located in the immutable operations ledger.
          </p>
          <button
            type="button"
            onClick={() => navigate('/admin/winners')}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-[#071A2B] text-white dark:bg-[#F2B705] dark:text-[#071A2B]"
          >
            <span>Back to Winners</span>
          </button>
        </div>
      </AdminShell>
    );
  }

  const isCash = record.prizeType === 'CASH';

  return (
    <AdminShell
      activeKey="winners"
      breadcrumb={`HQ Admin Console / Fulfilled Prize Records / ${record.id}`}
    >
      <div className="space-y-6">
        {/* =========================================================================
            TOP NAVIGATION & RECORD ACTION BAR
            ========================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-[#071A2B] p-4 rounded-xl border border-[#D9E0E7] dark:border-[#1B3754] shadow-xs">
          <Link
            to="/admin/winners"
            id="back-to-winners-link"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#071A2B] dark:text-[#F2B705] hover:underline"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Winners</span>
          </Link>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F5F7FA] dark:bg-white/10 text-[#667085] dark:text-slate-300 border border-[#D9E0E7] dark:border-[#1B3754]">
              RECORD ID: <strong className="text-[#071A2B] dark:text-white">{record.id}</strong>
            </span>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded bg-[#00843D]/10 text-[#00843D] dark:bg-emerald-950/40 dark:text-emerald-400 border border-[#00843D]/20 dark:border-emerald-800/40 uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00843D] dark:bg-emerald-400"></span>
              FULFILLED
            </span>
          </div>
        </div>

        {/* =========================================================================
            RECORD HEADER / BANNER
            ========================================================================= */}
        <div className="bg-white dark:bg-[#071A2B] p-5 sm:p-6 rounded-xl border border-[#D9E0E7] dark:border-[#1B3754] shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#D9E0E7] dark:border-[#1B3754]">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#667085] dark:text-slate-400 block mb-1">
                FULFILLED PRIZE RECORD
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold font-sora text-[#071A2B] dark:text-white tracking-tight">
                Fulfilled Prize Record
              </h1>
              <p className="text-xs text-[#667085] dark:text-slate-400 mt-1">
                Review the completed reward, claim, and fulfilment history.
              </p>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-[10px] font-mono text-[#667085] dark:text-slate-400 uppercase block">
                Final Fulfilment Date
              </span>
              <div className="text-sm font-bold font-mono text-[#071A2B] dark:text-white mt-0.5">
                {record.fulfilledTimestamp || record.fulfilledDate}
              </div>
            </div>
          </div>

          {/* Core Lifecycle Concept Separations (Account, Reward, Claim, Fulfilment) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-center">
            <div className="p-3 rounded-lg bg-[#F5F7FA] dark:bg-[#0B253F]/40 border border-[#D9E0E7] dark:border-[#1B3754]">
              <div className="text-[10px] font-mono text-[#667085] dark:text-slate-400 uppercase">
                Account Status
              </div>
              <div className="text-xs font-bold text-[#00843D] dark:text-emerald-400 mt-0.5">
                {record.accountStatus}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-[#F5F7FA] dark:bg-[#0B253F]/40 border border-[#D9E0E7] dark:border-[#1B3754]">
              <div className="text-[10px] font-mono text-[#667085] dark:text-slate-400 uppercase">
                Reward Status
              </div>
              <div className="text-xs font-bold text-[#071A2B] dark:text-white mt-0.5">
                {record.rewardStatus}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-[#F5F7FA] dark:bg-[#0B253F]/40 border border-[#D9E0E7] dark:border-[#1B3754]">
              <div className="text-[10px] font-mono text-[#667085] dark:text-slate-400 uppercase">
                Claim Status
              </div>
              <div className="text-xs font-bold text-[#00843D] dark:text-emerald-400 mt-0.5">
                {record.claimStatus}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-[#F5F7FA] dark:bg-[#0B253F]/40 border border-[#D9E0E7] dark:border-[#1B3754]">
              <div className="text-[10px] font-mono text-[#667085] dark:text-slate-400 uppercase">
                Prize Type
              </div>
              <div className="text-xs font-bold text-[#F2B705] dark:text-[#F2B705] mt-0.5 font-mono">
                {record.prizeType}
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            MAIN DETAIL GRID: 2 COLUMNS (8 cols / 4 cols)
            ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN: User Info, Prize Info, Claim Info (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* 1. USER INFORMATION */}
            <div className="bg-white dark:bg-[#071A2B] p-5 sm:p-6 rounded-xl border border-[#D9E0E7] dark:border-[#1B3754] shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-[#D9E0E7] dark:border-[#1B3754] mb-4">
                <h3 className="text-sm font-bold font-sora uppercase tracking-wider text-[#071A2B] dark:text-white flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#F2B705]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>1. User Information</span>
                </h3>
                <span className="text-[10px] font-mono text-[#667085] dark:text-slate-400">
                  REF: {record.userId}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 rounded-lg bg-[#F5F7FA] dark:bg-[#0B253F]/40 border border-[#D9E0E7] dark:border-[#1B3754]">
                  <span className="text-[10px] font-mono text-[#667085] dark:text-slate-400 uppercase block">
                    Full Name
                  </span>
                  <span className="font-bold text-sm text-[#071A2B] dark:text-white">
                    {record.userName}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-[#F5F7FA] dark:bg-[#0B253F]/40 border border-[#D9E0E7] dark:border-[#1B3754]">
                  <span className="text-[10px] font-mono text-[#667085] dark:text-slate-400 uppercase block">
                    Email Address
                  </span>
                  <span className="font-mono text-[#071A2B] dark:text-white break-all">
                    {record.userEmail}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-[#F5F7FA] dark:bg-[#0B253F]/40 border border-[#D9E0E7] dark:border-[#1B3754]">
                  <span className="text-[10px] font-mono text-[#667085] dark:text-slate-400 uppercase block">
                    Mobile Number
                  </span>
                  <span className="font-mono text-[#071A2B] dark:text-white">
                    {record.userPhone}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-[#F5F7FA] dark:bg-[#0B253F]/40 border border-[#D9E0E7] dark:border-[#1B3754]">
                  <span className="text-[10px] font-mono text-[#667085] dark:text-slate-400 uppercase block">
                    Account Status
                  </span>
                  <span className="font-bold text-[#00843D] dark:text-emerald-400">
                    {record.accountStatus}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-[#F5F7FA] dark:bg-[#0B253F]/40 border border-[#D9E0E7] dark:border-[#1B3754] sm:col-span-2">
                  <span className="text-[10px] font-mono text-[#667085] dark:text-slate-400 uppercase block">
                    Account Created Date
                  </span>
                  <span className="font-mono text-[#071A2B] dark:text-white">
                    {record.accountCreated}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. PRIZE INFORMATION */}
            <div className="bg-white dark:bg-[#071A2B] p-5 sm:p-6 rounded-xl border border-[#D9E0E7] dark:border-[#1B3754] shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-[#D9E0E7] dark:border-[#1B3754] mb-4">
                <h3 className="text-sm font-bold font-sora uppercase tracking-wider text-[#071A2B] dark:text-white flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#F2B705]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>2. Prize Information</span>
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#F5F7FA] dark:bg-white/10 text-[#071A2B] dark:text-white uppercase">
                  {isCash ? 'CASH PRIZE' : 'VEHICLE PRIZE'}
                </span>
              </div>

              {isCash ? (
                /* Cash Prize Details */
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-[#F5F7FA] dark:bg-[#0B253F]/40 border border-[#D9E0E7] dark:border-[#1B3754] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-mono text-[#667085] dark:text-slate-400 uppercase">
                        Cash Prize (Valuation)
                      </span>
                      <div className="text-2xl sm:text-3xl font-extrabold font-sora text-[#071A2B] dark:text-[#F2B705] mt-1">
                        {record.prizeAmount}
                      </div>
                      <div className="text-xs text-[#667085] dark:text-slate-400 mt-1">
                        Disbursed via South African Reserve Bank Fiduciary Escrow
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] font-mono text-[#667085] dark:text-slate-400 uppercase">
                        Currency
                      </span>
                      <div className="text-sm font-bold font-mono text-[#071A2B] dark:text-white mt-1">
                        {record.currency || 'ZAR'}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-lg bg-[#F5F7FA] dark:bg-[#0B253F]/40 border border-[#D9E0E7] dark:border-[#1B3754]">
                      <span className="text-[10px] font-mono text-[#667085] dark:text-slate-400 uppercase block">
                        Reward Status
                      </span>
                      <span className="font-bold text-[#00843D] dark:text-emerald-400">
                        {record.rewardStatus}
                      </span>
                    </div>
                    <div className="p-3 rounded-lg bg-[#F5F7FA] dark:bg-[#0B253F]/40 border border-[#D9E0E7] dark:border-[#1B3754]">
                      <span className="text-[10px] font-mono text-[#667085] dark:text-slate-400 uppercase block">
                        Prize Allocation Title
                      </span>
                      <span className="font-bold text-[#071A2B] dark:text-white">
                        {record.prizeTitle}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Vehicle Prize Details */
                <div className="space-y-4">
                  {/* Vehicle Image Container */}
                  <div className="relative rounded-xl overflow-hidden border border-[#D9E0E7] dark:border-[#1B3754] bg-[#071A2B] max-h-64">
                    {record.vehicleImage ? (
                      <img
                        src={record.vehicleImage}
                        alt={record.prizeTitle}
                        className="w-full h-56 object-cover object-center"
                      />
                    ) : (
                      <div className="w-full h-48 flex items-center justify-center text-[#667085] text-xs">
                        No vehicle image preview available
                      </div>
                    )}
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-[#071A2B] via-[#071A2B]/70 to-transparent p-4 text-white">
                      <div className="text-xs font-mono text-[#F2B705] uppercase tracking-wider">
                        {record.vehicleMake} • {record.vehicleYear}
                      </div>
                      <div className="text-lg font-bold font-sora">
                        {record.vehicleModel}
                      </div>
                    </div>
                  </div>

                  {/* Vehicle Spec Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-2.5 rounded-lg bg-[#F5F7FA] dark:bg-[#0B253F]/40 border border-[#D9E0E7] dark:border-[#1B3754]">
                      <span className="text-[10px] font-mono text-[#667085] dark:text-slate-400 uppercase block">
                        Vehicle Make
                      </span>
                      <span className="font-bold text-[#071A2B] dark:text-white">
                        {record.vehicleMake}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#F5F7FA] dark:bg-[#0B253F]/40 border border-[#D9E0E7] dark:border-[#1B3754]">
                      <span className="text-[10px] font-mono text-[#667085] dark:text-slate-400 uppercase block">
                        Vehicle Model
                      </span>
                      <span className="font-bold text-[#071A2B] dark:text-white truncate block" title={record.vehicleModel}>
                        {record.vehicleModel}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#F5F7FA] dark:bg-[#0B253F]/40 border border-[#D9E0E7] dark:border-[#1B3754]">
                      <span className="text-[10px] font-mono text-[#667085] dark:text-slate-400 uppercase block">
                        Vehicle Year
                      </span>
                      <span className="font-bold font-mono text-[#071A2B] dark:text-white">
                        {record.vehicleYear}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#F5F7FA] dark:bg-[#0B253F]/40 border border-[#D9E0E7] dark:border-[#1B3754]">
                      <span className="text-[10px] font-mono text-[#667085] dark:text-slate-400 uppercase block">
                        Reward Status
                      </span>
                      <span className="font-bold text-[#00843D] dark:text-emerald-400">
                        {record.rewardStatus}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 3. CLAIM INFORMATION */}
            <div className="bg-white dark:bg-[#071A2B] p-5 sm:p-6 rounded-xl border border-[#D9E0E7] dark:border-[#1B3754] shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-[#D9E0E7] dark:border-[#1B3754] mb-4">
                <h3 className="text-sm font-bold font-sora uppercase tracking-wider text-[#071A2B] dark:text-white flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#F2B705]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>3. Claim Information</span>
                </h3>
                <span className="text-[10px] font-mono text-[#667085] dark:text-slate-400">
                  CLAIM ID: {record.claimId}
                </span>
              </div>

              {/* Claim Dates & Status Row */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs mb-4">
                <div className="p-3 rounded-lg bg-[#F5F7FA] dark:bg-[#0B253F]/40 border border-[#D9E0E7] dark:border-[#1B3754]">
                  <span className="text-[10px] font-mono text-[#667085] dark:text-slate-400 uppercase block">
                    Claim Type
                  </span>
                  <span className="font-bold text-[#071A2B] dark:text-white">
                    {isCash ? 'Cash Prize Claim' : 'Vehicle Prize Claim'}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-[#F5F7FA] dark:bg-[#0B253F]/40 border border-[#D9E0E7] dark:border-[#1B3754]">
                  <span className="text-[10px] font-mono text-[#667085] dark:text-slate-400 uppercase block">
                    Claim Status
                  </span>
                  <span className="font-bold text-[#00843D] dark:text-emerald-400">
                    {record.claimStatus}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-[#F5F7FA] dark:bg-[#0B253F]/40 border border-[#D9E0E7] dark:border-[#1B3754] col-span-2 sm:col-span-1">
                  <span className="text-[10px] font-mono text-[#667085] dark:text-slate-400 uppercase block">
                    Fulfilled Date
                  </span>
                  <span className="font-mono text-[#071A2B] dark:text-white">
                    {record.fulfilledDate}
                  </span>
                </div>
              </div>

              {/* Specific Operational Settlement Data (Cash vs Vehicle) */}
              {isCash && record.bankDetails ? (
                /* Cash Operational Bank Details (Safe review only; no CVV, PIN, or password) */
                <div className="space-y-3">
                  <div className="text-xs text-[#667085] dark:text-slate-400">
                    Operational banking reconciliation particulars (Strictly read-only administrative verification; authentication credentials and PINs are strictly prohibited from this record):
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-lg bg-[#F5F7FA] dark:bg-[#0B253F]/40 border border-[#D9E0E7] dark:border-[#1B3754]">
                      <span className="text-[10px] font-mono text-[#667085] dark:text-slate-400 uppercase block">
                        Full Name
                      </span>
                      <span className="font-bold text-[#071A2B] dark:text-white">
                        {record.bankDetails.fullName}
                      </span>
                    </div>
                    <div className="p-3 rounded-lg bg-[#F5F7FA] dark:bg-[#0B253F]/40 border border-[#D9E0E7] dark:border-[#1B3754]">
                      <span className="text-[10px] font-mono text-[#667085] dark:text-slate-400 uppercase block">
                        Bank Name
                      </span>
                      <span className="font-bold text-[#071A2B] dark:text-white">
                        {record.bankDetails.bankName}
                      </span>
                    </div>
                    <div className="p-3 rounded-lg bg-[#F5F7FA] dark:bg-[#0B253F]/40 border border-[#D9E0E7] dark:border-[#1B3754]">
                      <span className="text-[10px] font-mono text-[#667085] dark:text-slate-400 uppercase block">
                        Account Number
                      </span>
                      <span className="font-mono font-bold text-[#071A2B] dark:text-white">
                        {record.bankDetails.accountNumber}
                      </span>
                    </div>
                    <div className="p-3 rounded-lg bg-[#F5F7FA] dark:bg-[#0B253F]/40 border border-[#D9E0E7] dark:border-[#1B3754]">
                      <span className="text-[10px] font-mono text-[#667085] dark:text-slate-400 uppercase block">
                        Account Type
                      </span>
                      <span className="font-mono text-[#071A2B] dark:text-white">
                        {record.bankDetails.accountType}
                      </span>
                    </div>
                    <div className="p-3 rounded-lg bg-[#F5F7FA] dark:bg-[#0B253F]/40 border border-[#D9E0E7] dark:border-[#1B3754] sm:col-span-2">
                      <span className="text-[10px] font-mono text-[#667085] dark:text-slate-400 uppercase block">
                        Branch Code
                      </span>
                      <span className="font-mono text-[#071A2B] dark:text-white">
                        {record.bankDetails.branchCode}
                      </span>
                    </div>
                  </div>
                  <div className="text-[11px] font-mono text-[#00843D] dark:text-emerald-400 flex items-center gap-1.5 p-2.5 rounded-lg bg-[#00843D]/10 border border-[#00843D]/20">
                    <span>✓</span>
                    <span>Disbursement verified and audited via SARB Institutional Banking Protocol</span>
                  </div>
                </div>
              ) : null}

              {!isCash && record.vehicleDetails ? (
                /* Vehicle Delivery & Logistics Information */
                <div className="space-y-3">
                  <div className="text-xs text-[#667085] dark:text-slate-400">
                    Registered delivery coordinates and physical handover record:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-lg bg-[#F5F7FA] dark:bg-[#0B253F]/40 border border-[#D9E0E7] dark:border-[#1B3754]">
                      <span className="text-[10px] font-mono text-[#667085] dark:text-slate-400 uppercase block">
                        Full Name
                      </span>
                      <span className="font-bold text-[#071A2B] dark:text-white">
                        {record.vehicleDetails.fullName}
                      </span>
                    </div>
                    <div className="p-3 rounded-lg bg-[#F5F7FA] dark:bg-[#0B253F]/40 border border-[#D9E0E7] dark:border-[#1B3754]">
                      <span className="text-[10px] font-mono text-[#667085] dark:text-slate-400 uppercase block">
                        Mobile Number
                      </span>
                      <span className="font-mono text-[#071A2B] dark:text-white">
                        {record.vehicleDetails.mobileNumber}
                      </span>
                    </div>
                    <div className="p-3 rounded-lg bg-[#F5F7FA] dark:bg-[#0B253F]/40 border border-[#D9E0E7] dark:border-[#1B3754] sm:col-span-2">
                      <span className="text-[10px] font-mono text-[#667085] dark:text-slate-400 uppercase block">
                        Delivery Address
                      </span>
                      <span className="font-semibold text-[#071A2B] dark:text-white">
                        {record.vehicleDetails.deliveryAddress}
                      </span>
                    </div>
                    <div className="p-3 rounded-lg bg-[#F5F7FA] dark:bg-[#0B253F]/40 border border-[#D9E0E7] dark:border-[#1B3754]">
                      <span className="text-[10px] font-mono text-[#667085] dark:text-slate-400 uppercase block">
                        City & Province
                      </span>
                      <span className="font-semibold text-[#071A2B] dark:text-white">
                        {record.vehicleDetails.city}, {record.vehicleDetails.province}
                      </span>
                    </div>
                    <div className="p-3 rounded-lg bg-[#F5F7FA] dark:bg-[#0B253F]/40 border border-[#D9E0E7] dark:border-[#1B3754]">
                      <span className="text-[10px] font-mono text-[#667085] dark:text-slate-400 uppercase block">
                        Postal Code
                      </span>
                      <span className="font-mono text-[#071A2B] dark:text-white">
                        {record.vehicleDetails.postalCode}
                      </span>
                    </div>
                    <div className="p-3 rounded-lg bg-[#F5F7FA] dark:bg-[#0B253F]/40 border border-[#D9E0E7] dark:border-[#1B3754] sm:col-span-2">
                      <span className="text-[10px] font-mono text-[#667085] dark:text-slate-400 uppercase block">
                        Preferred Delivery Contact
                      </span>
                      <span className="font-semibold text-[#071A2B] dark:text-white">
                        {record.vehicleDetails.preferredDeliveryContact}
                      </span>
                    </div>
                  </div>
                  <div className="text-[11px] font-mono text-[#00843D] dark:text-emerald-400 flex items-center gap-1.5 p-2.5 rounded-lg bg-[#00843D]/10 border border-[#00843D]/20">
                    <span>✓</span>
                    <span>NaTIS Registration, Licensing & Roadworthy Certificate Cleared</span>
                  </div>
                </div>
              ) : null}
            </div>

          </div>

          {/* RIGHT COLUMN: Chronological Timeline & Audit Context (4 cols) */}
          <div className="lg:col-span-4 space-y-6">

            {/* 4. FULFILMENT TIMELINE */}
            <div className="bg-white dark:bg-[#071A2B] p-5 rounded-xl border border-[#D9E0E7] dark:border-[#1B3754] shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-[#D9E0E7] dark:border-[#1B3754] mb-4">
                <h3 className="text-xs font-mono uppercase tracking-wider text-[#071A2B] dark:text-white font-bold flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#00843D] dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>4. Fulfilment Timeline</span>
                </h3>
                <span className="text-[10px] font-mono text-[#00843D] dark:text-emerald-400 font-bold">
                  {record.timeline?.length || 0} Stages
                </span>
              </div>

              {/* Chronological Timeline Steps */}
              <div className="relative pl-6 space-y-5 border-l-2 border-[#00843D]/40 dark:border-emerald-500/40 ml-2 text-xs">
                {record.timeline && record.timeline.map((step, idx) => {
                  const isLast = idx === record.timeline.length - 1;
                  return (
                    <div key={idx} className="relative">
                      {isLast ? (
                        <span className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-[#00843D] ring-4 ring-[#00843D]/20 text-white flex items-center justify-center text-[10px] font-bold">
                          ★
                        </span>
                      ) : (
                        <span className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-[#00843D] text-white flex items-center justify-center text-[10px]">
                          ✓
                        </span>
                      )}
                      <div className={`font-bold ${isLast ? 'text-[#00843D] dark:text-emerald-400' : 'text-[#071A2B] dark:text-white'}`}>
                        {step.stage}
                      </div>
                      <div className="text-[11px] text-[#667085] dark:text-slate-400 font-mono mt-0.5">
                        {step.timestamp}
                      </div>
                      {step.note && (
                        <div className="text-[10px] text-[#667085] dark:text-slate-400/80 mt-0.5">
                          {step.note}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 5. AUDIT CONTEXT */}
            <div className="bg-white dark:bg-[#071A2B] p-5 rounded-xl border border-[#D9E0E7] dark:border-[#1B3754] shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-[#D9E0E7] dark:border-[#1B3754] mb-4">
                <h3 className="text-xs font-mono uppercase tracking-wider text-[#071A2B] dark:text-white font-bold flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#F2B705]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>5. Audit Context</span>
                </h3>
                <span className="text-[10px] font-mono text-[#00843D] dark:text-emerald-400">
                  IMMUTABLE
                </span>
              </div>

              <div className="space-y-2.5 text-xs font-mono">
                <div className="p-2.5 rounded bg-[#F5F7FA] dark:bg-[#0B253F]/40 border border-[#D9E0E7] dark:border-[#1B3754]">
                  <span className="text-[10px] text-[#667085] dark:text-slate-400 block uppercase">
                    Record ID
                  </span>
                  <span className="font-bold text-[#071A2B] dark:text-white">
                    {record.auditContext?.recordId || record.id}
                  </span>
                </div>

                <div className="p-2.5 rounded bg-[#F5F7FA] dark:bg-[#0B253F]/40 border border-[#D9E0E7] dark:border-[#1B3754]">
                  <span className="text-[10px] text-[#667085] dark:text-slate-400 block uppercase">
                    Reward ID
                  </span>
                  <span className="font-bold text-[#071A2B] dark:text-white">
                    {record.auditContext?.rewardId || record.rewardId}
                  </span>
                </div>

                <div className="p-2.5 rounded bg-[#F5F7FA] dark:bg-[#0B253F]/40 border border-[#D9E0E7] dark:border-[#1B3754]">
                  <span className="text-[10px] text-[#667085] dark:text-slate-400 block uppercase">
                    Claim ID
                  </span>
                  <span className="font-bold text-[#071A2B] dark:text-white">
                    {record.auditContext?.claimId || record.claimId}
                  </span>
                </div>

                <div className="p-2.5 rounded bg-[#F5F7FA] dark:bg-[#0B253F]/40 border border-[#D9E0E7] dark:border-[#1B3754]">
                  <span className="text-[10px] text-[#667085] dark:text-slate-400 block uppercase">
                    Fulfilled Date
                  </span>
                  <span className="text-[#071A2B] dark:text-white">
                    {record.auditContext?.fulfilledDate || record.fulfilledDate}
                  </span>
                </div>

                <div className="p-2.5 rounded bg-[#F5F7FA] dark:bg-[#0B253F]/40 border border-[#D9E0E7] dark:border-[#1B3754]">
                  <span className="text-[10px] text-[#667085] dark:text-slate-400 block uppercase">
                    Last Updated
                  </span>
                  <span className="text-[#071A2B] dark:text-white">
                    {record.auditContext?.lastUpdated || record.lastUpdated}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </AdminShell>
  );
}
