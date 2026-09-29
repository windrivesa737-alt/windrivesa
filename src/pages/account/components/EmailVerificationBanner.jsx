import React, { useState } from 'react';

export default function EmailVerificationBanner({
  pendingEmail,
  onResendVerification,
  onCancelEmailChange,
}) {
  const [resending, setResending] = useState(false);

  if (!pendingEmail) return null;

  const handleResend = async () => {
    setResending(true);
    await onResendVerification();
    setTimeout(() => setResending(false), 600);
  };

  return (
    <div
      id="email-verification-panel"
      className="mb-8 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-5 sm:p-6 shadow-sm transition-all"
    >
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 flex items-center justify-center shrink-0 border border-amber-300 dark:border-amber-700/50 mt-0.5">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-sora font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-200/80 dark:bg-amber-800/80 text-amber-900 dark:text-amber-100">
                VERIFICATION REQUIRED
              </span>
              <span className="text-xs text-amber-800 dark:text-amber-300 font-semibold font-mono">
                {pendingEmail}
              </span>
            </div>
            <h3 className="text-base font-sora font-bold text-amber-950 dark:text-amber-100 mt-1">
              Verify Your New Email
            </h3>
            <p className="text-xs sm:text-sm text-amber-900/80 dark:text-amber-200/90 mt-1 leading-relaxed font-manrope">
              We’ve sent a verification link to your new email address. Please verify it to complete the email change.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-stretch lg:self-center shrink-0 pt-2 lg:pt-0 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-sora font-bold rounded-xl bg-[#071A2B] hover:bg-[#17212B] dark:bg-[#F2B705] dark:hover:bg-[#dca604] text-white dark:text-[#071A2B] transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-60"
          >
            {resending ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5 text-white dark:text-[#071A2B]" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Sending...</span>
              </>
            ) : (
              'Resend Verification Email'
            )}
          </button>
          <button
            type="button"
            onClick={onCancelEmailChange}
            className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-semibold rounded-xl border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 hover:bg-amber-100/60 dark:hover:bg-amber-900/30 transition-colors"
          >
            Cancel Email Change
          </button>
        </div>
      </div>
    </div>
  );
}
