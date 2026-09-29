import React from 'react';
import { Link } from 'react-router-dom';

export default function ClaimsEmptyState() {
  return (
    <section
      id="claims-empty-state-section"
      className="p-8 sm:p-12 text-center bg-white dark:bg-brand-navy border border-brand-border dark:border-brand-border-dark rounded-2xl max-w-2xl mx-auto shadow-sm my-6"
      aria-labelledby="empty-claims-heading"
    >
      <div className="w-16 h-16 rounded-2xl bg-brand-bg dark:bg-brand-navy-light text-brand-gold mx-auto flex items-center justify-center mb-4 text-2xl border border-brand-border dark:border-brand-border-dark/80">
        <svg
          className="w-8 h-8 text-brand-gold"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"
          />
        </svg>
      </div>

      <h2
        id="empty-claims-heading"
        className="text-xl sm:text-2xl font-bold font-sora text-brand-navy dark:text-white mb-2"
      >
        Prize Not Yet Assigned
      </h2>

      <p className="text-sm sm:text-base text-brand-muted dark:text-brand-muted-dark max-w-md mx-auto leading-relaxed mb-6">
        Your reward information will appear here once a prize has been assigned to your account.
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          to="/dashboard"
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-brand-navy text-white dark:bg-brand-gold dark:text-brand-navy font-sora text-xs font-bold hover:opacity-90 transition shadow-sm inline-flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          <span>Back to Dashboard</span>
        </Link>
        <Link
          to="/support"
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-brand-border dark:border-brand-border-dark text-xs font-semibold text-brand-charcoal dark:text-slate-200 hover:bg-brand-bg dark:hover:bg-slate-800 transition inline-flex items-center justify-center"
        >
          Contact Support
        </Link>
      </div>
    </section>
  );
}
