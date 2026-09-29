import React from 'react';
import { Link } from 'react-router-dom';

export default function AccountHeader() {
  return (
    <div className="mb-8" id="account-page-header">
      {/* Breadcrumb & Back Action */}
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 text-xs text-[#667085] dark:text-slate-400">
        <Link
          to="/dashboard"
          className="hover:text-[#071A2B] dark:hover:text-[#F2B705] transition-colors flex items-center gap-1 font-medium"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>
        <span>/</span>
        <span className="text-[#17212B] dark:text-slate-200 font-semibold">Account Settings</span>
      </nav>

      {/* Page Title & Context */}
      <div>
        <p className="text-[11px] font-sora font-bold uppercase tracking-wider text-[#F2B705]">
          ACCOUNT
        </p>
        <h1 className="text-2xl sm:text-3xl font-sora font-extrabold text-[#071A2B] dark:text-white mt-1 tracking-tight">
          Account & Profile
        </h1>
        <p className="text-sm sm:text-base text-[#667085] dark:text-slate-400 mt-1.5 max-w-2xl font-manrope">
          Manage your personal information and account settings.
        </p>
      </div>
    </div>
  );
}
