import React from 'react';
import { Link } from 'react-router-dom';

export default function ClaimsPendingReview() {
  return (
    <section
      id="claims-pending-review-section"
      className="p-8 sm:p-12 text-center bg-white dark:bg-brand-navy border border-brand-border dark:border-brand-border-dark rounded-2xl max-w-2xl mx-auto shadow-sm my-6"
      aria-labelledby="pending-review-heading"
    >
      <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-brand-gold mx-auto flex items-center justify-center mb-5 border border-amber-200 dark:border-amber-900/60 shadow-inner">
        <svg
          className="w-8 h-8 text-amber-600 dark:text-brand-gold animate-pulse"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>

      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 mb-3">
        <span className="w-2 h-2 rounded-full bg-brand-gold animate-ping" aria-hidden="true" />
        <span>PENDING REVIEW</span>
      </div>

      <h2
        id="pending-review-heading"
        className="text-xl sm:text-2xl font-bold font-sora text-brand-navy dark:text-white mb-2"
      >
        Your Account Is Under Review
      </h2>

      <p className="text-sm sm:text-base text-brand-muted dark:text-brand-muted-dark max-w-md mx-auto leading-relaxed mb-6">
        Your claim information will become available after your account has been approved and a reward has been assigned.
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          to="/dashboard"
          id="pending-back-to-dashboard-btn"
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-brand-navy text-white dark:bg-brand-gold dark:text-brand-navy font-sora text-xs font-bold hover:opacity-90 transition shadow-sm inline-flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          <span>Back to Dashboard</span>
        </Link>
        <Link
          to="/support"
          id="pending-contact-support-btn"
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-brand-border dark:border-brand-border-dark text-xs font-semibold text-brand-charcoal dark:text-slate-200 hover:bg-brand-bg dark:hover:bg-slate-800 transition inline-flex items-center justify-center"
        >
          Contact Support
        </Link>
      </div>
    </section>
  );
}
