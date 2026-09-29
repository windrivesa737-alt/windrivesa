import React from 'react';
import { useNavigate } from 'react-router-dom';
import ClaimsStatusBadge, { getStatusConfig } from './ClaimsStatusBadge';
import { formatZAR } from '../../../services/claimRequirements';
import { resolveVehicleImage } from '../../../services/vehicleImages';

export default function VehicleClaimCard({ vehicleReward, existingClaim, applicableRequirement, onContactSupport }) {
  const navigate = useNavigate();

  // Derive active status
  const currentStatus = existingClaim?.status || vehicleReward?.claim_status || 'CLAIM AVAILABLE';
  const statusConfig = getStatusConfig(currentStatus);

  const make = vehicleReward?.vehicle_make || vehicleReward?.vehicleMake || existingClaim?.vehicleMake || '';
  const model = vehicleReward?.vehicle_model || vehicleReward?.vehicleModel || existingClaim?.vehicleModel || '';
  const year = vehicleReward?.vehicle_year || vehicleReward?.vehicleYear || existingClaim?.vehicleYear || '';
  const title = [year, make, model].filter(Boolean).join(' ') || 'Assigned Vehicle';
  const edition = vehicleReward?.vehicle_edition || 'National Fleet Allocation Specification';
  const allocationId = vehicleReward?.allocationId || existingClaim?.allocationId || (vehicleReward?.id ? `WD-VK-${vehicleReward.id.slice(0, 5).toUpperCase()}` : 'WD-VK-ALLOC');
  const vehicleImage = resolveVehicleImage(vehicleReward || existingClaim);

  // Format submission date if claim exists
  const formattedSubmissionDate = existingClaim?.submittedAt || existingClaim?.submitted_at || existingClaim?.createdAt
    ? new Date(existingClaim.submittedAt || existingClaim.submitted_at || existingClaim.createdAt).toLocaleDateString('en-ZA', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null;

  const isAvailable = currentStatus === 'CLAIM AVAILABLE';
  const isFulfilled = currentStatus === 'FULFILLED';
  const isRequirementPending = currentStatus === 'REQUIREMENT PENDING' || currentStatus === 'REQUIREMENT_PENDING';

  const handleAction = () => {
    navigate('/claims/vehicle');
  };

  return (
    <article
      id="vehicle-claim-card"
      className="bg-white dark:bg-brand-navy border border-brand-border dark:border-brand-border-dark rounded-2xl p-6 sm:p-7 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
    >
      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <span className="inline-block text-[11px] font-sora font-bold tracking-wider text-brand-muted dark:text-brand-muted-dark uppercase">
              VEHICLE PRIZE CLAIM
            </span>
            <h2 className="text-xl font-sora font-bold text-brand-navy dark:text-white mt-0.5">
              Assigned Vehicle Allocation
            </h2>
          </div>
          <div>
            <ClaimsStatusBadge status={currentStatus} />
          </div>
        </div>

        {/* High-Resolution Vehicle Visual Showcase or Neutral Placeholder */}
        <div className="my-4 rounded-xl overflow-hidden border border-brand-border dark:border-brand-border-dark relative group bg-brand-charcoal">
          {vehicleImage ? (
            <img
              src={vehicleImage}
              alt={title}
              className="w-full h-44 sm:h-52 object-cover object-center group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  const placeholder = parent.querySelector('.vehicle-placeholder-fallback');
                  if (placeholder) placeholder.classList.remove('hidden');
                }
              }}
            />
          ) : null}

          {/* Clean Neutral Vehicle Placeholder */}
          <div
            className={`vehicle-placeholder-fallback w-full h-44 sm:h-52 flex flex-col items-center justify-center bg-gradient-to-br from-[#0B2238] to-[#071A2B] text-slate-300 p-4 text-center ${
              vehicleImage ? 'hidden' : 'flex'
            }`}
          >
            <div className="w-14 h-14 rounded-2xl bg-[#F2B705]/10 border border-[#F2B705]/20 flex items-center justify-center text-[#F2B705] mb-2 shadow-xs">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 17a2 2 0 100-4 2 2 0 000 4zm10 0a2 2 0 100-4 2 2 0 000 4zM4 11h16M4 11V7a1 1 0 011-1h10l4 5v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-7z" />
              </svg>
            </div>
            <span className="text-xs font-sora font-bold text-white uppercase tracking-wider">
              {title}
            </span>
            <span className="text-[11px] text-[#98A2B3] mt-0.5">
              RSA Allocation Registry • Official Fleet Prize
            </span>
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/90 via-brand-navy/30 to-transparent pointer-events-none" />
          <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between pointer-events-none">
            <div>
              <span className="text-[10px] font-sora font-bold text-brand-gold uppercase tracking-wider bg-brand-navy/90 px-2 py-0.5 rounded backdrop-blur-sm">
                NATIONAL FLEET ALLOCATION
              </span>
              <h3 className="font-sora text-lg sm:text-xl font-bold text-white mt-1">
                {title}
              </h3>
              <p className="text-xs text-slate-200">{edition}</p>
            </div>
            <span className="text-[11px] font-mono text-slate-300 bg-brand-navy/80 px-2 py-1 rounded backdrop-blur-sm hidden sm:inline-block">
              {allocationId}
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
          <div id="vehicle-applicable-requirement" className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-brand-gold/50 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-sora font-bold text-brand-navy dark:text-brand-gold uppercase tracking-wider text-[11px]">
                APPLICABLE REQUIREMENT
              </span>
              <span className="font-mono font-bold text-brand-navy dark:text-white">
                {formatZAR(applicableRequirement.applicableCharge)} {applicableRequirement.currency || 'ZAR'}
              </span>
            </div>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              {applicableRequirement.description || 'Provincial logistics dispatch and handover coordination.'}
            </p>
            <div className="pt-1 flex items-center justify-between">
              <span className="text-[11px] text-brand-muted dark:text-slate-400">
                Contact WinDriveSA support for instructions
              </span>
              {applicableRequirement.supportWhatsapp ? (
                <a
                  href={`https://wa.me/${applicableRequirement.supportWhatsapp.replace(/\D+/g, '')}?text=${encodeURIComponent(`Hello WinDriveSA Support, I am inquiring regarding the applicable requirement for my approved Vehicle Prize Claim (${allocationId}).`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-brand-navy dark:text-brand-gold underline hover:no-underline"
                >
                  Contact WinDriveSA Support →
                </a>
              ) : onContactSupport ? (
                <button
                  type="button"
                  onClick={() => onContactSupport('Vehicle Claim Requirement')}
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
              id="vehicle-claim-action-btn"
              onClick={handleAction}
              className="w-full py-3 px-5 rounded-xl bg-brand-navy hover:bg-brand-navy-light text-white dark:bg-brand-gold dark:hover:bg-brand-gold-hover dark:text-brand-navy font-sora font-bold text-xs uppercase tracking-wider transition shadow-sm flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-brand-gold"
            >
              <span>Claim Vehicle Prize</span>
              <span aria-hidden="true">→</span>
            </button>
          ) : (
            <button
              type="button"
              id="vehicle-claim-view-btn"
              onClick={handleAction}
              className={`w-full py-3 px-5 rounded-xl font-sora font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-brand-gold ${
                isFulfilled
                  ? 'bg-brand-bg hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-brand-navy dark:text-white border border-brand-border dark:border-brand-border-dark'
                  : 'bg-brand-navy hover:bg-brand-navy-light text-white dark:bg-white dark:hover:bg-slate-100 dark:text-brand-navy shadow-sm'
              }`}
            >
              <span>{isFulfilled ? 'View Fulfilled Record' : isRequirementPending ? 'View Claim Details' : 'View Vehicle Claim'}</span>
              <span aria-hidden="true">→</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
