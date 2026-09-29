import React from 'react';

/**
 * Standardized Claim Status Badge & Descriptions
 * Conforms strictly to WinDriveSA design system & accessibility standards
 */

export const CLAIM_STATUS_MAP = {
  'CLAIM AVAILABLE': {
    label: 'CLAIM AVAILABLE',
    explanation: 'Your assigned prize is available for claim submission.',
    badgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700',
    dotClass: 'bg-slate-500',
  },
  'SUBMITTED': {
    label: 'SUBMITTED',
    explanation: 'Your claim has been submitted and is awaiting review.',
    badgeClass: 'bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800',
    dotClass: 'bg-sky-500 animate-pulse',
  },
  'UNDER REVIEW': {
    label: 'UNDER REVIEW',
    explanation: 'Your claim is currently being reviewed.',
    badgeClass: 'bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800',
    dotClass: 'bg-sky-500 animate-pulse',
  },
  'APPROVED': {
    label: 'APPROVED',
    explanation: 'Your claim has been approved and is moving to the next stage.',
    badgeClass: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    dotClass: 'bg-emerald-600',
  },
  'REQUIREMENT PENDING': {
    label: 'REQUIREMENT PENDING',
    explanation: 'Additional configured requirements are pending.',
    badgeClass: 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800',
    dotClass: 'bg-amber-500',
  },
  'PROCESSING': {
    label: 'PROCESSING',
    explanation: 'Your claim is being processed.',
    badgeClass: 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    dotClass: 'bg-blue-600 animate-pulse',
  },
  'FULFILLED': {
    label: 'FULFILLED',
    explanation: 'Your claim has been marked as fulfilled.',
    badgeClass: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700',
    dotClass: 'bg-emerald-600',
    isFulfilled: true,
  },
  'REJECTED': {
    label: 'REJECTED',
    explanation: 'Your claim was not approved. Contact support if you need assistance.',
    badgeClass: 'bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    dotClass: 'bg-rose-600',
  },
  'MORE INFORMATION REQUIRED': {
    label: 'MORE INFORMATION REQUIRED',
    explanation: 'Additional information is needed before review can continue.',
    badgeClass: 'bg-orange-50 dark:bg-orange-950/50 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-800',
    dotClass: 'bg-orange-500 animate-pulse',
  },
};

export function getStatusConfig(rawStatus) {
  const normalized = (rawStatus || 'CLAIM AVAILABLE').trim().toUpperCase();
  return CLAIM_STATUS_MAP[normalized] || {
    label: normalized,
    explanation: 'Status update pending review.',
    badgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700',
    dotClass: 'bg-slate-500',
  };
}

export default function ClaimsStatusBadge({ status }) {
  const config = getStatusConfig(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${config.badgeClass}`}
      role="status"
      aria-label={`Claim status: ${config.label}`}
    >
      {config.isFulfilled ? (
        <svg className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      ) : (
        <span className={`w-2 h-2 rounded-full ${config.dotClass}`} aria-hidden="true" />
      )}
      <span>{config.label}</span>
    </span>
  );
}
