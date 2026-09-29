import React from 'react';
import { Link } from 'react-router-dom';

export default function AccountInfoSidebar({ user }) {
  // Format createdAt date safely
  const formatCreatedDate = (dateStr) => {
    if (!dateStr) return '03 December 2025';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const status = user?.status || 'ACTIVE';

  const getStatusBadge = () => {
    switch (status) {
      case 'PENDING REVIEW':
        return {
          label: 'PENDING REVIEW',
          subLabel: 'Under Review',
          color: 'bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200 border-amber-300 dark:border-amber-700',
          dot: 'bg-amber-500 ring-amber-400/30',
        };
      case 'REJECTED':
        return {
          label: 'REJECTED',
          subLabel: 'Review Required',
          color: 'bg-rose-100 text-rose-900 dark:bg-rose-900/60 dark:text-rose-200 border-rose-300 dark:border-rose-700',
          dot: 'bg-rose-500 ring-rose-400/30',
        };
      case 'APPROVED':
        return {
          label: 'APPROVED',
          subLabel: 'Identity Verified',
          color: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700',
          dot: 'bg-[#00843D] ring-emerald-400/30',
        };
      case 'ACTIVE':
      default:
        return {
          label: 'ACTIVE',
          subLabel: 'In Good Standing',
          color: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700',
          dot: 'bg-[#00843D] ring-emerald-400/30',
        };
    }
  };

  const badgeInfo = getStatusBadge();

  return (
    <div className="space-y-6">
      {/* 1. Account Information Card (Read-Only) */}
      <section
        aria-labelledby="account-info-heading"
        className="bg-white dark:bg-[#0B2238] rounded-2xl border border-[#D9E0E7] dark:border-[#1B354F] p-6 shadow-sm transition-colors duration-200"
      >
        <h2
          id="account-info-heading"
          className="text-base font-sora font-bold text-[#071A2B] dark:text-white border-b border-[#D9E0E7] dark:border-[#1B354F] pb-3 mb-4 flex items-center justify-between"
        >
          <span>Account Information</span>
          <span className="text-[10px] uppercase tracking-wider font-semibold text-[#667085] dark:text-slate-400 px-2 py-0.5 rounded bg-[#F5F7FA] dark:bg-[#071A2B] border border-[#D9E0E7] dark:border-[#1B354F]">
            Verified Record
          </span>
        </h2>

        <div className="space-y-4 font-manrope">
          {/* Account Status */}
          <div className="p-3.5 rounded-xl bg-[#F5F7FA] dark:bg-[#071A2B] border border-[#D9E0E7]/80 dark:border-[#1B354F]">
            <span className="block text-[11px] font-sora font-bold uppercase tracking-wider text-[#667085] dark:text-slate-400 mb-1">
              Account Status
            </span>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${badgeInfo.dot} ring-4`}></span>
              <span className="font-sora font-bold text-sm text-[#071A2B] dark:text-white tracking-wide">
                {badgeInfo.label}
              </span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ml-auto border ${badgeInfo.color}`}>
                {badgeInfo.subLabel}
              </span>
            </div>
          </div>

          {/* Account Created Date */}
          <div className="p-3.5 rounded-xl bg-[#F5F7FA] dark:bg-[#071A2B] border border-[#D9E0E7]/80 dark:border-[#1B354F]">
            <span className="block text-[11px] font-sora font-bold uppercase tracking-wider text-[#667085] dark:text-slate-400 mb-1">
              Account Created
            </span>
            <div className="text-sm font-semibold text-[#071A2B] dark:text-white">
              {formatCreatedDate(user?.createdAt)}
            </div>
            <div className="text-[11px] text-[#667085] dark:text-slate-400 mt-0.5">
              Audited Member ID:{' '}
              <span className="font-mono font-medium text-[#17212B] dark:text-slate-300">
                {user?.memberId || 'WD-88349-ZA'}
              </span>
            </div>
          </div>

          {/* Verification Tier */}
          <div className="p-3.5 rounded-xl bg-[#F5F7FA] dark:bg-[#071A2B] border border-[#D9E0E7]/80 dark:border-[#1B354F]">
            <span className="block text-[11px] font-sora font-bold uppercase tracking-wider text-[#667085] dark:text-slate-400 mb-1">
              Verification Tier
            </span>
            <div className="text-sm font-semibold text-[#071A2B] dark:text-white flex items-center justify-between">
              <span>Tier 1 — RSA National Escrow</span>
              <span className="text-[#F2B705] font-bold">100%</span>
            </div>
            <p className="text-[11px] text-[#667085] dark:text-slate-400 mt-1 leading-relaxed">
              National identity document verified with South African citizen registries.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Security & Compliance Summary Card */}
      <div className="bg-gradient-to-br from-[#071A2B] to-[#17212B] text-white rounded-2xl p-6 shadow-md border border-[#1E3550]">
        <div className="flex items-center gap-2.5 mb-3">
          <span className="w-7 h-7 rounded-lg bg-[#F2B705] text-[#071A2B] flex items-center justify-center font-bold text-xs">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </span>
          <h3 className="font-sora font-bold text-sm text-[#F2B705]">Account Protection</h3>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed font-manrope">
          Your WinDriveSA account is protected with multi-layered credential auditing. Two-factor authentication (2FA) is automatically required for prize claims over R50,000 ZAR.
        </p>
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400 font-medium">
          <span>SARB Monitored</span>
          <span>•</span>
          <span>POPIA 2013</span>
        </div>
      </div>

      {/* 3. Assistance / Support Card */}
      <div className="bg-white dark:bg-[#0B2238] rounded-2xl border border-[#D9E0E7] dark:border-[#1B354F] p-5 text-center shadow-sm transition-colors duration-200">
        <h4 className="text-xs font-sora font-bold uppercase tracking-wider text-[#071A2B] dark:text-white">
          Need Profile Assistance?
        </h4>
        <p className="text-xs text-[#667085] dark:text-slate-400 mt-1 font-manrope">
          Have questions regarding identity book verification or banking re-registration?
        </p>
        <Link
          to="/support"
          className="mt-3.5 w-full inline-flex items-center justify-center py-2 px-3 rounded-xl border border-[#D9E0E7] dark:border-[#1B354F] text-xs font-semibold text-[#071A2B] dark:text-white hover:bg-[#F5F7FA] dark:hover:bg-[#071A2B] transition-colors"
        >
          Contact Account Support
        </Link>
      </div>
    </div>
  );
}
