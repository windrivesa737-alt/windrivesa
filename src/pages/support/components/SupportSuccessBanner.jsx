import React from 'react';

export default function SupportSuccessBanner({ request, onDismiss }) {
  if (!request) return null;

  return (
    <section
      role="alert"
      aria-live="polite"
      className="mb-8 p-5 sm:p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 transition-all duration-300 shadow-sm"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#00843D] text-white flex items-center justify-center flex-shrink-0 shadow-sm">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="font-bold text-base text-emerald-950 dark:text-emerald-100 font-sora">
                Support Request Submitted
              </h3>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/80 dark:text-emerald-200 uppercase tracking-wider">
                {request.status || 'OPEN'}
              </span>
              <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300">
                Request #{request.ref}
              </span>
            </div>
            <p className="text-xs text-emerald-800 dark:text-emerald-300/90 mt-1 max-w-2xl leading-relaxed">
              Your request has been submitted to WinDriveSA support. We’ll review it and respond through the available support channel.
            </p>
            {request.subject && (
              <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 mt-1 truncate">
                Topic: <span className="font-medium text-emerald-900 dark:text-emerald-200">{request.subject}</span>
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#00843D] hover:bg-[#007033] text-white transition shadow-sm focus:outline-none focus:ring-2 focus:ring-[#00843D] flex-shrink-0 cursor-pointer"
        >
          Back to Support
        </button>
      </div>
    </section>
  );
}
