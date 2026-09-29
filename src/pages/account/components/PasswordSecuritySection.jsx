import React from 'react';

export default function PasswordSecuritySection({
  lastPasswordChange = '14 January 2026',
  onOpenChangePassword,
}) {
  return (
    <section
      aria-labelledby="password-heading"
      className="bg-white dark:bg-[#0B2238] rounded-2xl border border-[#D9E0E7] dark:border-[#1B354F] p-6 sm:p-8 shadow-sm transition-colors duration-200"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2
            id="password-heading"
            className="text-lg sm:text-xl font-sora font-bold text-[#071A2B] dark:text-white"
          >
            Password & Security
          </h2>
          <p className="text-xs sm:text-sm text-[#667085] dark:text-slate-400 mt-0.5 font-manrope">
            Update your password to keep your account secure.
          </p>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 font-manrope">
            <span className="w-2 h-2 rounded-full bg-[#00843D] dark:bg-emerald-400"></span>
            <span>
              Last changed:{' '}
              <span className="font-semibold text-[#17212B] dark:text-slate-200">
                {lastPasswordChange}
              </span>
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenChangePassword}
          className="px-5 py-2.5 rounded-xl border border-[#D9E0E7] dark:border-[#1B354F] bg-[#F5F7FA] hover:bg-slate-200/70 dark:bg-[#071A2B] dark:hover:bg-slate-800 text-[#071A2B] dark:text-white font-sora font-semibold text-sm transition-colors shrink-0 flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4 text-[#F2B705]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Change Password
        </button>
      </div>
    </section>
  );
}
