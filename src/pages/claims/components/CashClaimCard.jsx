import React from 'react';
import { useNavigate } from 'react-router-dom';
import ClaimsStatusBadge, { getStatusConfig } from './ClaimsStatusBadge';
import { formatZAR } from '../../../services/claimRequirements';

export default function CashClaimCard({ cashReward, existingClaim, applicableRequirement, onContactSupport }) {
  const navigate = useNavigate();

  // Derive active status: existingClaim status overrides initial reward claim status
  const currentStatus = existingClaim?.status || cashReward?.claim_status || 'CLAIM AVAILABLE';
  const statusConfig = getStatusConfig(currentStatus);

  // Exact database value formatted as ZAR, no hardcoded fallback
  const amount = cashReward?.cash_amount ?? cashReward?.cashAmount ?? 0;
  const currency = cashReward?.cash_currency || cashReward?.currency || 'ZAR';
  const allocationId = cashReward?.allocationId || existingClaim?.payoutReference || (cashReward?.id ? `WD-CP-${cashReward.id.slice(0, 5).toUpperCase()}` : 'WD-CP-ALLOC');

  // Format submission date if claim exists
  const formattedSubmissionDate = existingClaim?.createdAt || existingClaim?.submitted_at
    ? new Date(existingClaim.createdAt || existingClaim.submitted_at).toLocaleDateString('en-ZA', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null;

  const isAvailable = currentStatus === 'CLAIM AVAILABLE';
  const isFulfilled = currentStatus === 'FULFILLED';
  const isRequirementPending = currentStatus === 'REQUIREMENT PENDING' || currentStatus === 'REQUIREMENT_PENDING';

  const handleAction = () => {
    navigate('/claims/cash');
  };

  return (
    <article
      id="cash-claim-card"
      className="bg-white dark:bg-brand-navy border border-brand-border dark:border-brand-border-dark rounded-2xl p-6 sm:p-7 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
    >
      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <span className="inline-block text-[11px] font-sora font-bold tracking-wider text-brand-muted dark:text-brand-muted-dark uppercase">
              CASH PRIZE CLAIM
            </span>
            <h2 className="text-xl font-sora font-bold text-brand-navy dark:text-white mt-0.5">
              Assigned Cash Allocation
            </h2>
          </div>
          <div>
            <ClaimsStatusBadge status={currentStatus} />
          </div>
        </div>

        {/* Financial Reward Display Box */}
        <div className="my-5 p-5 bg-brand-bg dark:bg-brand-navy-light/70 rounded-xl border border-brand-border dark:border-brand-border-dark">
          <div className="text-xs font-medium text-brand-muted dark:text-brand-muted-dark">
            Assigned Cash Prize
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-sora text-3xl sm:text-4xl font-extrabold text-brand-navy dark:text-white tracking-tight tabular-nums">
              {formatZAR(amount)}
            </span>
            <span className="text-sm font-bold text-brand-gold uppercase tracking-wider font-sora">
              {currency}
            </span>
          </div>
          <div className="mt-2.5 flex items-center gap-2 text-xs text-brand-muted dark:text-brand-muted-dark">
            <svg
              className="w-4 h-4 text-brand-emerald shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              Allocation ID: <strong className="font-mono text-brand-charcoal dark:text-slate-200">{allocationId}</strong> • Verified RSA EFT
            </span>
          </div>
        </div>

        {/* Status and Explanation Panel */}
        <div className="space-y-2 mb-6">
          <div className="text-xs uppercase font-bold tracking-wider text-brand-muted dark:text-brand-muted-dark">
            Current Status
          </div>
          <p className="text-sm font-medium text-brand-charcoal dark:text-slate-200 leading-relaxed">
            {statusConfig.explanation}
          </p>
          {formattedSubmissionDate && (
            <div className="text-xs text-brand-muted dark:text-brand-muted-dark pt-1">
              Submitted: <span className="font-semibold text-brand-charcoal dark:text-slate-300">{formattedSubmissionDate}</span>
            </div>
          )}
        </div>

        {/* Conditional Requirement Section - Only rendered when an approved claim has a matching enabled requirement */}
        {applicableRequirement && (
          <div id="cash-applicable-requirement" className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-brand-gold/50 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-sora font-bold text-brand-navy dark:text-brand-gold uppercase tracking-wider text-[11px]">
                APPLICABLE REQUIREMENT
              </span>
              <span className="font-mono font-bold text-brand-navy dark:text-white">
                {formatZAR(applicableRequirement.applicableCharge)} {applicableRequirement.currency || 'ZAR'}
              </span>
            </div>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              {applicableRequirement.description || 'Administrative processing and verification requirement.'}
            </p>
            <div className="pt-1 flex items-center justify-between">
              <span className="text-[11px] text-brand-muted dark:text-slate-400">
                Contact WinDriveSA support for instructions
              </span>
              {applicableRequirement.supportWhatsapp ? (
                <a
                  href={`https://wa.me/${applicableRequirement.supportWhatsapp.replace(/\D+/g, '')}?text=${encodeURIComponent(`Hello WinDriveSA Support, I am inquiring regarding the applicable requirement for my approved Cash Prize Claim (${allocationId}).`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-brand-navy dark:text-brand-gold underline hover:no-underline"
                >
                  Contact WinDriveSA Support →
                </a>
              ) : onContactSupport ? (
                <button
                  type="button"
                  onClick={() => onContactSupport('Cash Claim Requirement')}
                  className="font-semibold text-brand-navy dark:text-brand-gold underline hover:no-underline"
                >
                  Contact WinDriveSA Support →
                </button>
              ) : null}
            </div>
          </div>
        )}
      </div>

      {/* Card Bottom Actions */}
      <div className="pt-4 border-t border-brand-border dark:border-brand-border-dark flex items-center justify-between gap-3">
        <div className="w-full">
          {isAvailable ? (
            <button
              type="button"
              id="cash-claim-action-btn"
              onClick={handleAction}
              className="w-full py-3 px-5 rounded-xl bg-brand-navy hover:bg-brand-navy-light text-white dark:bg-brand-gold dark:hover:bg-brand-gold-hover dark:text-brand-navy font-sora font-bold text-xs uppercase tracking-wider transition shadow-sm flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-brand-gold"
            >
              <span>Claim Cash Prize</span>
              <span aria-hidden="true">→</span>
            </button>
          ) : (
            <button
              type="button"
              id="cash-claim-view-btn"
              onClick={handleAction}
              className={`w-full py-3 px-5 rounded-xl font-sora font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-brand-gold ${
                isFulfilled
                  ? 'bg-brand-bg hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-brand-navy dark:text-white border border-brand-border dark:border-brand-border-dark'
                  : 'bg-brand-navy hover:bg-brand-navy-light text-white dark:bg-white dark:hover:bg-slate-100 dark:text-brand-navy shadow-sm'
              }`}
            >
              <span>{isFulfilled ? 'View Fulfilled Record' : isRequirementPending ? 'View Claim Details' : 'View Cash Claim'}</span>
              <span aria-hidden="true">→</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
