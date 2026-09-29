import React from 'react';

export default function FlashNotification({ notification, onDismiss }) {
  if (!notification || !notification.message) return null;

  const { title, message, type = 'success' } = notification;

  let bgClasses = 'bg-emerald-50 border-emerald-300 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800/80 dark:text-emerald-200';
  let iconSvg = (
    <svg className="w-5 h-5 text-[#00843D] dark:text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
    </svg>
  );

  if (type === 'error') {
    bgClasses = 'bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-950/40 dark:border-rose-800/80 dark:text-rose-200';
    iconSvg = (
      <svg className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    );
  } else if (type === 'info') {
    bgClasses = 'bg-sky-50 border-sky-200 text-sky-900 dark:bg-sky-950/40 dark:border-sky-800/80 dark:text-sky-200';
    iconSvg = (
      <svg className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  } else if (type === 'neutral') {
    bgClasses = 'bg-slate-100 border-[#D9E0E7] text-[#17212B] dark:bg-slate-800/80 dark:border-slate-700 dark:text-slate-200';
    iconSvg = (
      <svg className="w-5 h-5 text-[#667085] dark:text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  }

  return (
    <div
      id="flash-notification-banner"
      role="alert"
      className={`mb-6 rounded-2xl p-4 border flex items-start justify-between gap-3 shadow-sm transition-all duration-200 ${bgClasses}`}
    >
      <div className="flex items-start gap-3 min-w-0">
        <div className="mt-0.5">{iconSvg}</div>
        <div className="min-w-0">
          {title && <h4 className="text-sm font-sora font-bold">{title}</h4>}
          <p className="text-xs mt-0.5 font-manrope leading-relaxed">{message}</p>
        </div>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="text-[#667085] hover:text-[#17212B] dark:hover:text-white p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors shrink-0"
          aria-label="Dismiss notification"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
