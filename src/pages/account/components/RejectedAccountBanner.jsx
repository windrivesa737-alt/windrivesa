import React from 'react';
import { Link } from 'react-router-dom';

export default function RejectedAccountBanner() {
  return (
    <div
      id="rejected-account-banner"
      className="mb-8 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 rounded-2xl p-5 sm:p-6 shadow-sm transition-all"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 flex items-center justify-center shrink-0 border border-rose-300 dark:border-rose-800/50 mt-0.5">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-sora font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-200/80 dark:bg-rose-900/80 text-rose-900 dark:text-rose-100">
                STATUS: REJECTED
              </span>
            </div>
            <h3 className="text-base font-sora font-bold text-rose-950 dark:text-rose-100 mt-1">
              Account Review Update
            </h3>
            <p className="text-xs sm:text-sm text-rose-900/80 dark:text-rose-200/90 mt-1 leading-relaxed font-manrope">
              Your account is not currently approved. Please contact WinDriveSA support if you need assistance.
            </p>
          </div>
        </div>

        <div className="shrink-0 w-full sm:w-auto">
          <Link
            to="/support"
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 text-xs font-sora font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-colors shadow-sm"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}
