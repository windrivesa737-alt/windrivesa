import React, { useState } from 'react';

export default function VehicleSummaryCard({ vehicleReward, currentStatus }) {
  const [imgFailed, setImgFailed] = useState(false);
  const {
    allocationId = 'WD-VK-ALLOC',
    vehicle_make = '',
    vehicle_model = '',
    vehicle_year = '',
    vehicle_edition = 'National Fleet Allocation Specification',
    vehicle_image = null,
    handover_hub = 'Gauteng Hub / Regional',
    review_window = '2–3 Business Days',
    review_type = 'Manual Compliance',
  } = vehicleReward || {};

  const vehicleTitle = [vehicle_year, vehicle_make, vehicle_model].filter(Boolean).join(' ') || 'Assigned Vehicle Prize';

  const getStatusBadge = () => {
    switch (currentStatus) {
      case 'SUBMITTED':
      case 'UNDER REVIEW':
        return {
          text: 'UNDER REVIEW',
          bg: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
          dot: 'bg-amber-500',
        };
      case 'APPROVED':
      case 'CLAIM APPROVED':
        return {
          text: 'APPROVED',
          bg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
          dot: 'bg-emerald-500',
        };
      case 'REQUIREMENT PENDING':
        return {
          text: 'REQUIREMENT PENDING',
          bg: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
          dot: 'bg-amber-500',
        };
      case 'PROCESSING':
        return {
          text: 'PROCESSING',
          bg: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30',
          dot: 'bg-blue-500',
        };
      case 'FULFILLED':
        return {
          text: 'FULFILLED',
          bg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
          dot: 'bg-emerald-500',
        };
      case 'MORE INFORMATION REQUIRED':
        return {
          text: 'INFO REQUIRED',
          bg: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
          dot: 'bg-amber-500',
        };
      case 'REJECTED':
        return {
          text: 'NOT APPROVED',
          bg: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30',
          dot: 'bg-red-500',
        };
      case 'CLAIM AVAILABLE':
      default:
        return {
          text: 'CLAIM AVAILABLE',
          bg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
          dot: 'bg-emerald-500',
        };
    }
  };

  const badge = getStatusBadge();

  return (
    <div className="bg-white dark:bg-[#0B2238] rounded-xl p-5 sm:p-6 shadow-sm border border-[#D9E3F1] dark:border-[#1B354F] flex flex-col gap-5 transition-colors">
      <div className="flex items-center justify-between">
        <span className="font-manrope text-[11px] uppercase tracking-wider text-[#667085] dark:text-slate-400 font-bold">
          Your Vehicle Prize
        </span>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badge.bg}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
          <span>{badge.text}</span>
        </span>
      </div>

      {/* Vehicle Hero Media */}
      <div className="relative w-full rounded-xl overflow-hidden bg-[#071A2B] shadow-inner">
        {vehicle_image && !imgFailed ? (
          <img
            alt={vehicleTitle}
            className="w-full h-52 sm:h-60 object-cover"
            src={vehicle_image}
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="w-full h-52 sm:h-60 flex flex-col items-center justify-center bg-gradient-to-br from-[#071A2B] via-[#0D263E] to-[#071A2B] text-slate-300 p-6 text-center">
            <svg className="w-16 h-16 text-[#F2B705] mb-2 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 17a2 2 0 100-4 2 2 0 000 4zm10 0a2 2 0 100-4 2 2 0 000 4zM4 11h16M4 11V7a1 1 0 011-1h10l4 5v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-7z" />
            </svg>
            <span className="font-sora font-bold text-sm text-white">
              {vehicleTitle}
            </span>
            <span className="text-xs text-slate-400 mt-1 font-manrope">
              Allocated Official Fleet Delivery
            </span>
          </div>
        )}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <span className="px-2 py-0.5 rounded bg-[#071A2B]/85 backdrop-blur-md text-white font-manrope text-[10px] tracking-wider uppercase font-bold">
            New Delivery
          </span>
          <span className="px-2 py-0.5 rounded bg-[#F2B705] text-[#071A2B] font-manrope text-[10px] tracking-wider uppercase font-bold">
            Warranty Included
          </span>
        </div>
        <div className="absolute bottom-3 right-3">
          <span className="px-2.5 py-1 rounded-full bg-white/95 dark:bg-[#071A2B]/95 backdrop-blur-md text-[#071A2B] dark:text-white font-manrope text-[10px] font-bold shadow-sm">
            RSA National Fleet
          </span>
        </div>
      </div>

      {/* Vehicle Details Title */}
      <div>
        <h2 className="font-sora text-xl sm:text-2xl text-[#071A2B] dark:text-white font-bold tracking-tight">
          {vehicleTitle}
        </h2>
        <p className="font-manrope text-sm text-[#667085] dark:text-slate-300 mt-0.5">
          {vehicle_edition}
        </p>
      </div>

      {/* Logistics Metadata Grid */}
      <div className="grid grid-cols-2 gap-3 p-3.5 bg-[#F5F7FA] dark:bg-[#081827] rounded-lg border border-[#D9E3F1] dark:border-[#1B354F]">
        <div>
          <span className="font-manrope text-[10px] uppercase text-[#667085] dark:text-slate-400 tracking-wider block font-bold">
            Allocation ID
          </span>
          <span className="font-sora text-xs sm:text-sm font-bold text-[#071A2B] dark:text-white font-mono">
            {allocationId}
          </span>
        </div>
        <div>
          <span className="font-manrope text-[10px] uppercase text-[#667085] dark:text-slate-400 tracking-wider block font-bold">
            Review Window
          </span>
          <span className="font-sora text-xs sm:text-sm font-bold text-[#071A2B] dark:text-white">
            {review_window}
          </span>
        </div>
        <div>
          <span className="font-manrope text-[10px] uppercase text-[#667085] dark:text-slate-400 tracking-wider block font-bold">
            Handover Hub
          </span>
          <span className="font-sora text-xs sm:text-sm font-bold text-[#071A2B] dark:text-white">
            {handover_hub}
          </span>
        </div>
        <div>
          <span className="font-manrope text-[10px] uppercase text-[#667085] dark:text-slate-400 tracking-wider block font-bold">
            Review Type
          </span>
          <span className="font-sora text-xs sm:text-sm font-bold text-[#071A2B] dark:text-white">
            {review_type}
          </span>
        </div>
      </div>

      {/* Important Notice */}
      <div className="p-4 bg-[#EDF4FF] dark:bg-[#0D263E] rounded-lg flex items-start gap-3 border border-[#D9E3F1] dark:border-[#1B354F]">
        <svg className="w-5 h-5 text-[#785900] dark:text-[#F2B705] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="font-manrope text-xs text-[#667085] dark:text-slate-300 leading-relaxed">
          <strong className="text-[#071A2B] dark:text-white">Important Notice:</strong> Submitting this form initiates manual claim and logistics review. Delivery is scheduled after compliance sign-off. WinDriveSA does not charge unannounced registration fees.
        </p>
      </div>

      {/* POPIA Section 18 */}
      <div className="flex items-center gap-2 text-[#667085] dark:text-slate-400 text-xs font-manrope">
        <svg className="w-4 h-4 text-[#00843D] dark:text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <span>POPIA Section 18: Delivery details used strictly for transport.</span>
      </div>
    </div>
  );
}
