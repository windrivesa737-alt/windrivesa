import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function VehicleClaimLifecycleView({
  status = 'UNDER REVIEW',
  claimData = {},
  vehicleReward = {},
  applicableCharge = null,
  onOpenSupport,
  onEditDetails,
}) {
  const navigate = useNavigate();

  const deliveryDetails = claimData.deliveryDetails || {};
  const recipientName = deliveryDetails.fullName || 'Recipient';
  const mobileNumber = deliveryDetails.mobileNumber || '+27 ••••••••89';
  const physicalAddress = deliveryDetails.deliveryAddress
    ? `${deliveryDetails.deliveryAddress}, ${deliveryDetails.city || ''}, ${deliveryDetails.province || ''}`
    : 'Registered South African Delivery Address';

  const vehicleName = `${vehicleReward.vehicle_year || 2026} ${vehicleReward.vehicle_make || 'Toyota'} ${vehicleReward.vehicle_model || 'Hilux'}`;
  const allocationId = vehicleReward.allocationId || claimData.allocationId || 'WD-VK-55912';

  // Render 5-step status sequence timeline based on current step
  const renderTimeline = (activeStepIndex) => {
    const steps = [
      { num: 1, title: 'Claim Submitted', sub: 'Complete' },
      { num: 2, title: 'Under Review', sub: '24–48h' },
      { num: 3, title: 'Claim Approved', sub: 'Authorized' },
      { num: 4, title: 'Processing', sub: 'In Transit' },
      { num: 5, title: 'Fulfilled', sub: 'Finalized' },
    ];

    return (
      <div className="py-2">
        <span className="font-manrope text-[11px] uppercase tracking-wider text-[#667085] dark:text-slate-400 font-bold block mb-3">
          Status Sequence Timeline
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
          {steps.map((step, idx) => {
            const isCompleted = idx < activeStepIndex;
            const isCurrent = idx === activeStepIndex;

            if (isCompleted) {
              return (
                <div
                  key={step.num}
                  className="p-3 bg-emerald-500/15 dark:bg-emerald-950/40 rounded-lg border border-emerald-500/30 flex flex-col gap-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-manrope text-[10px] font-bold text-[#00843D] dark:text-emerald-400">
                      STEP {step.num}
                    </span>
                    <svg className="w-4 h-4 text-[#00843D] dark:text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="font-sora text-xs font-bold text-[#071A2B] dark:text-white">
                    {step.title}
                  </span>
                  <span className="text-[11px] text-[#667085] dark:text-slate-400">Complete</span>
                </div>
              );
            }

            if (isCurrent) {
              const currentBg =
                status === 'PROCESSING'
                  ? 'bg-blue-500/20 border-blue-500/40 text-blue-700 dark:text-blue-300'
                  : status === 'APPROVED' || status === 'FULFILLED'
                  ? 'bg-emerald-500/25 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                  : 'bg-amber-500/20 border-amber-500/40 text-amber-600 dark:text-amber-300';

              const pulseDot =
                status === 'PROCESSING'
                  ? 'bg-blue-500'
                  : status === 'APPROVED' || status === 'FULFILLED'
                  ? 'bg-emerald-500'
                  : 'bg-amber-500';

              return (
                <div
                  key={step.num}
                  className={`p-3 rounded-lg border shadow-sm flex flex-col gap-1 ${currentBg}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-manrope text-[10px] font-bold">
                      STEP {step.num}
                    </span>
                    <span className={`w-2 h-2 rounded-full ${pulseDot} animate-pulse`}></span>
                  </div>
                  <span className="font-sora text-xs font-bold text-[#071A2B] dark:text-white">
                    {step.title}
                  </span>
                  <span className="text-[11px] font-semibold">
                    {status === 'FULFILLED' ? 'Finalized' : 'Current'}
                  </span>
                </div>
              );
            }

            return (
              <div
                key={step.num}
                className="p-3 bg-[#F5F7FA] dark:bg-[#081827] rounded-lg border border-[#D9E3F1] dark:border-[#1B354F] flex flex-col gap-1 opacity-60"
              >
                <div className="flex items-center justify-between">
                  <span className="font-manrope text-[10px] font-bold text-[#667085] dark:text-slate-400">
                    STEP {step.num}
                  </span>
                  <svg className="w-4 h-4 text-[#667085] dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <span className="font-sora text-xs font-bold text-[#071A2B] dark:text-white">
                  {step.title}
                </span>
                <span className="text-[11px] text-[#667085] dark:text-slate-400">Upcoming</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // 1. UNDER REVIEW / SUBMITTED STATE
  if (status === 'UNDER REVIEW' || status === 'SUBMITTED') {
    return (
      <div className="bg-white dark:bg-[#0B2238] rounded-xl p-6 sm:p-8 shadow-sm border border-[#D9E3F1] dark:border-[#1B354F] flex flex-col gap-6 transition-colors">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="font-sora text-xl sm:text-2xl text-[#071A2B] dark:text-white font-bold tracking-tight">
                Vehicle Claim Submitted
              </h2>
              <p className="font-manrope text-sm text-[#667085] dark:text-slate-300">
                Your vehicle prize claim has been submitted successfully and is now under review.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 font-manrope text-xs rounded-full font-bold">
            UNDER REVIEW
          </span>
        </div>

        {/* Submitted delivery summary preview */}
        <div className="p-4 bg-[#F5F7FA] dark:bg-[#081827] rounded-xl flex flex-col gap-3 border border-[#D9E3F1] dark:border-[#1B354F]">
          <span className="font-manrope text-[10px] uppercase text-[#667085] dark:text-slate-400 font-bold tracking-wider">
            Submitted Delivery Summary
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-xs text-[#667085] dark:text-slate-400 block">Recipient Name</span>
              <span className="font-bold text-[#071A2B] dark:text-white">{recipientName}</span>
            </div>
            <div>
              <span className="text-xs text-[#667085] dark:text-slate-400 block">Mobile Number</span>
              <span className="font-bold text-[#071A2B] dark:text-white">{mobileNumber}</span>
            </div>
            <div className="sm:col-span-2">
              <span className="text-xs text-[#667085] dark:text-slate-400 block">Physical Destination</span>
              <span className="font-bold text-[#071A2B] dark:text-white">{physicalAddress}</span>
            </div>
          </div>
        </div>

        {/* 5-step Timeline (Step 2 is current) */}
        {renderTimeline(1)}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="w-full sm:w-auto px-5 py-2.5 rounded text-center text-sm font-semibold text-[#667085] dark:text-slate-400 hover:bg-[#F5F7FA] dark:hover:bg-slate-800 transition-colors"
          >
            Back to Dashboard
          </button>
          <button
            type="button"
            onClick={() => navigate('/claims')}
            className="w-full sm:w-auto px-6 py-2.5 bg-[#071A2B] hover:bg-[#0e2740] dark:bg-[#F2B705] dark:hover:bg-[#dfa704] text-white dark:text-[#071A2B] font-sora text-sm rounded font-bold transition-colors"
          >
            View All Claims
          </button>
        </div>
      </div>
    );
  }

  // 2. APPROVED STATE
  if (status === 'APPROVED') {
    return (
      <div className="bg-white dark:bg-[#0B2238] rounded-xl p-6 sm:p-8 shadow-sm border border-[#D9E3F1] dark:border-[#1B354F] flex flex-col gap-6 transition-colors">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/15 text-[#00843D] dark:text-emerald-400 flex items-center justify-center shrink-0">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="font-sora text-xl sm:text-2xl text-[#071A2B] dark:text-white font-bold tracking-tight">
                Vehicle Claim Approved
              </h2>
              <p className="font-manrope text-sm text-[#667085] dark:text-slate-300">
                Your vehicle prize claim has been approved. Logistics coordination and vehicle preparation have been authorized.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-manrope text-xs rounded-full font-bold">
            APPROVED
          </span>
        </div>

        {/* Next Steps Alert */}
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-start gap-3">
          <svg className="w-5 h-5 text-[#00843D] dark:text-emerald-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <div>
            <span className="font-bold text-[#071A2B] dark:text-white text-sm block">
              Logistics Allocation in Progress
            </span>
            <p className="text-xs text-[#667085] dark:text-slate-300 mt-0.5">
              Carrier dispatch and roadworthy title preparation are underway for handover in {vehicleReward.handover_hub || 'Gauteng Hub'}.
            </p>
          </div>
        </div>

        {/* Timeline (Step 3 is current) */}
        {renderTimeline(2)}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="w-full sm:w-auto px-5 py-2.5 rounded text-center text-sm font-semibold text-[#667085] dark:text-slate-400 hover:bg-[#F5F7FA] dark:hover:bg-slate-800 transition-colors"
          >
            Back to Dashboard
          </button>
          <button
            type="button"
            onClick={() => navigate('/claims')}
            className="w-full sm:w-auto px-6 py-2.5 bg-[#071A2B] hover:bg-[#0e2740] dark:bg-[#F2B705] dark:hover:bg-[#dfa704] text-white dark:text-[#071A2B] font-sora text-sm rounded font-bold transition-colors"
          >
            View Claim Status
          </button>
        </div>
      </div>
    );
  }

  // 3. REQUIREMENT PENDING STATE (Displays configured Applicable Charge only when configured by admin)
  if (status === 'REQUIREMENT PENDING') {
    const chargeAmount = applicableCharge?.amount || 1850;
    const chargeTitle = applicableCharge?.title || 'Flatbed Transport & Title Transfer';
    const chargeCategory = applicableCharge?.category || 'Logistics Administration';
    const chargeDescription =
      applicableCharge?.description ||
      'Administrative transit registration, pre-delivery inspection documentation, and cross-provincial escrow release sign-off.';
    const chargeAssurance =
      applicableCharge?.assurance ||
      'Institutional Assurance: This is an administrative logistics coordination requirement strictly governed by courier transport standards. WinDriveSA does NOT charge unannounced statutory taxes or hidden prize fees.';

    return (
      <div className="bg-white dark:bg-[#0B2238] rounded-xl p-6 sm:p-8 shadow-sm border border-[#D9E3F1] dark:border-[#1B354F] flex flex-col gap-6 transition-colors">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h2 className="font-sora text-xl sm:text-2xl text-[#071A2B] dark:text-white font-bold tracking-tight">
                Requirement Pending
              </h2>
              <p className="font-manrope text-sm text-[#667085] dark:text-slate-300">
                Your vehicle claim has been approved. Please review the applicable requirement before fulfilment can continue.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 font-manrope text-xs rounded-full font-bold">
            REQUIREMENT PENDING
          </span>
        </div>

        {/* APPLICABLE CHARGE PANEL */}
        <div className="p-6 bg-[#F5F7FA] dark:bg-[#081827] rounded-xl border border-[#D9E3F1] dark:border-[#1B354F] flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D9E3F1] dark:border-[#1B354F] pb-4">
            <div>
              <span className="font-manrope text-xs uppercase text-[#785900] dark:text-[#F2B705] font-bold">
                {chargeCategory}
              </span>
              <h3 className="font-sora text-base sm:text-lg text-[#071A2B] dark:text-white font-bold">
                {chargeTitle}
              </h3>
            </div>
            <div className="text-left sm:text-right">
              <span className="font-manrope text-[11px] text-[#667085] dark:text-slate-400 uppercase font-bold block">
                APPLICABLE CHARGE
              </span>
              <span className="font-sora text-2xl sm:text-3xl text-[#071A2B] dark:text-white font-bold">
                R {chargeAmount.toLocaleString('en-ZA')}{' '}
                <span className="text-sm font-normal text-[#667085] dark:text-slate-400">ZAR</span>
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 text-sm">
            <p className="text-[#667085] dark:text-slate-300 leading-relaxed text-xs sm:text-sm">
              {chargeDescription}
            </p>
            <div className="p-3 bg-white dark:bg-[#0E1724] rounded-lg border border-[#D9E3F1] dark:border-[#1B354F] flex items-start gap-2.5">
              <svg className="w-4 h-4 text-[#00843D] dark:text-emerald-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <p className="text-xs text-[#667085] dark:text-slate-400 leading-tight">
                {chargeAssurance}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="w-full sm:w-auto px-5 py-2.5 rounded text-center text-sm font-semibold text-[#667085] dark:text-slate-400 hover:bg-[#F5F7FA] dark:hover:bg-slate-800 transition-colors"
          >
            Back to Dashboard
          </button>
          <a
            href={`https://wa.me/27820000000?text=Hello%20WinDriveSA%2C%20I%20am%20inquiring%20about%20logistics%20requirement%20for%20claim%20${allocationId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-5 py-2.5 bg-[#00843D] hover:bg-[#007033] text-white font-sora text-sm rounded font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.699c.96.526 1.777.78 2.796.78 3.18 0 5.767-2.586 5.767-5.766.001-3.18-2.585-5.766-5.767-5.766zm3.391 8.211c-.141.399-.817.763-1.127.809-.304.045-.694.062-2.078-.517-1.656-.694-2.716-2.385-2.798-2.496-.083-.112-.669-.89-.669-1.698 0-.809.424-1.207.575-1.37.151-.164.33-.205.441-.205.111 0 .222.001.319.006.103.004.241-.039.377.288.141.339.481 1.176.523 1.261.042.086.07.186.014.298-.056.113-.085.183-.169.282-.085.099-.178.221-.254.298-.086.086-.176.18-.076.353.1.172.445.733.955 1.188.656.585 1.209.766 1.381.852.172.086.273.072.375-.044.103-.117.439-.512.557-.687.117-.175.234-.146.393-.087.159.058 1.009.475 1.182.562.173.086.288.13.33.203.042.073.042.424-.099.823z" />
            </svg>
            <span>WhatsApp Support</span>
          </a>
          <button
            type="button"
            onClick={onOpenSupport}
            className="w-full sm:w-auto px-5 py-2.5 bg-[#071A2B] hover:bg-[#0e2740] dark:bg-[#F2B705] dark:hover:bg-[#dfa704] text-white dark:text-[#071A2B] font-sora text-sm rounded font-bold transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span>Contact Support</span>
          </button>
        </div>
      </div>
    );
  }

  // 4. PROCESSING STATE
  if (status === 'PROCESSING') {
    return (
      <div className="bg-white dark:bg-[#0B2238] rounded-xl p-6 sm:p-8 shadow-sm border border-[#D9E3F1] dark:border-[#1B354F] flex flex-col gap-6 transition-colors">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <div>
              <h2 className="font-sora text-xl sm:text-2xl text-[#071A2B] dark:text-white font-bold tracking-tight">
                Vehicle Claim Processing
              </h2>
              <p className="font-manrope text-sm text-[#667085] dark:text-slate-300">
                Your approved vehicle claim is currently being processed. Flatbed carrier dispatch and regional handover scheduling are actively underway.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30 font-manrope text-xs rounded-full font-bold">
            PROCESSING
          </span>
        </div>

        {/* Logistics Tracker Card */}
        <div className="p-5 bg-[#F5F7FA] dark:bg-[#081827] rounded-xl border border-[#D9E3F1] dark:border-[#1B354F] flex flex-col gap-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="font-manrope text-xs uppercase text-[#071A2B] dark:text-white font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
              Carrier Dispatch Active
            </span>
            <span className="text-xs font-semibold text-[#667085] dark:text-slate-400">
              Regional Fleet Carrier #ZA-4402
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-[10px] text-[#667085] dark:text-slate-400 uppercase font-bold block">
                Regional Dispatch Hub
              </span>
              <span className="font-bold text-[#071A2B] dark:text-white">
                {vehicleReward.handover_hub || 'Gauteng Hub / Regional'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[#667085] dark:text-slate-400 uppercase font-bold block">
                Estimated Arrival
              </span>
              <span className="font-bold text-[#071A2B] dark:text-white">
                Within 48 Hours
              </span>
            </div>
          </div>
        </div>

        {/* Timeline (Step 4 is current) */}
        {renderTimeline(3)}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="w-full sm:w-auto px-5 py-2.5 rounded text-center text-sm font-semibold text-[#667085] dark:text-slate-400 hover:bg-[#F5F7FA] dark:hover:bg-slate-800 transition-colors"
          >
            Back to Dashboard
          </button>
          <button
            type="button"
            onClick={() => navigate('/claims')}
            className="w-full sm:w-auto px-6 py-2.5 bg-[#071A2B] hover:bg-[#0e2740] dark:bg-[#F2B705] dark:hover:bg-[#dfa704] text-white dark:text-[#071A2B] font-sora text-sm rounded font-bold transition-colors"
          >
            View Claim Status
          </button>
        </div>
      </div>
    );
  }

  // 5. FULFILLED STATE
  if (status === 'FULFILLED') {
    return (
      <div className="bg-white dark:bg-[#0B2238] rounded-xl p-6 sm:p-8 shadow-sm border border-[#D9E3F1] dark:border-[#1B354F] flex flex-col gap-6 transition-colors">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-[#00843D] dark:text-emerald-400 flex items-center justify-center shrink-0">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <div>
              <h2 className="font-sora text-xl sm:text-2xl text-[#071A2B] dark:text-white font-bold tracking-tight">
                Vehicle Claim Fulfilled
              </h2>
              <p className="font-manrope text-sm text-[#667085] dark:text-slate-300">
                Your vehicle claim has been fulfilled. Handover of your {vehicleName} has been finalized with verified audit sign-off.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-manrope text-xs rounded-full font-bold">
            FULFILLED
          </span>
        </div>

        {/* Verified handover badge */}
        <div className="p-5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between flex-wrap gap-4">
          <div>
            <span className="font-manrope text-[10px] uppercase font-bold text-[#00843D] dark:text-emerald-400 tracking-wider">
              OFFICIAL HANDOVER CERTIFIED
            </span>
            <p className="font-sora text-base sm:text-lg text-[#071A2B] dark:text-white font-bold">
              {vehicleName}
            </p>
            <p className="font-manrope text-xs text-[#667085] dark:text-slate-300">
              Registered to: {recipientName}
            </p>
          </div>
          <div className="text-right">
            <span className="font-manrope text-[10px] uppercase text-[#667085] dark:text-slate-400">
              Allocation ID
            </span>
            <p className="font-sora text-sm font-bold font-mono text-[#00843D] dark:text-emerald-400">
              {allocationId}
            </p>
          </div>
        </div>

        {/* Timeline: Steps 1-5 ALL Complete */}
        {renderTimeline(4)}

        {/* Action */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="w-full sm:w-auto px-6 py-2.5 bg-[#071A2B] hover:bg-[#0e2740] dark:bg-[#F2B705] dark:hover:bg-[#dfa704] text-white dark:text-[#071A2B] font-sora text-sm rounded font-bold transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // 6. MORE INFORMATION REQUIRED STATE
  if (status === 'MORE INFORMATION REQUIRED') {
    return (
      <div className="bg-white dark:bg-[#0B2238] rounded-xl p-6 sm:p-8 shadow-sm border border-[#D9E3F1] dark:border-[#1B354F] flex flex-col gap-6 transition-colors">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="font-sora text-xl sm:text-2xl text-[#071A2B] dark:text-white font-bold tracking-tight">
                Additional Information Required
              </h2>
              <p className="font-manrope text-sm text-[#667085] dark:text-slate-300">
                Our logistics compliance team requires clarification regarding your delivery details before vehicle dispatch can proceed.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 font-manrope text-xs rounded-full font-bold">
            INFO REQUIRED
          </span>
        </div>

        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="text-xs text-[#667085] dark:text-slate-300 leading-relaxed">
            <strong className="text-[#071A2B] dark:text-white block font-semibold mb-0.5">Note from Logistics Team:</strong>
            Please confirm your precise street address or designated handover recipient contact details. You can update this below.
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="w-full sm:w-auto px-5 py-2.5 rounded text-center text-sm font-semibold text-[#667085] dark:text-slate-400 hover:bg-[#F5F7FA] dark:hover:bg-slate-800 transition-colors"
          >
            Back to Dashboard
          </button>
          <button
            type="button"
            onClick={onEditDetails}
            className="w-full sm:w-auto px-6 py-2.5 bg-[#071A2B] hover:bg-[#0e2740] dark:bg-[#F2B705] dark:hover:bg-[#dfa704] text-white dark:text-[#071A2B] font-sora text-sm rounded font-bold transition-colors"
          >
            Update Delivery Details
          </button>
        </div>
      </div>
    );
  }

  // 7. REJECTED STATE
  return (
    <div className="bg-white dark:bg-[#0B2238] rounded-xl p-6 sm:p-8 shadow-sm border border-[#D9E3F1] dark:border-[#1B354F] flex flex-col gap-6 transition-colors">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <div>
            <h2 className="font-sora text-xl sm:text-2xl text-[#071A2B] dark:text-white font-bold tracking-tight">
              Claim Not Approved
            </h2>
            <p className="font-manrope text-sm text-[#667085] dark:text-slate-300">
              This vehicle prize claim could not be approved at this time. Please contact user support for assistance.
            </p>
          </div>
        </div>
        <span className="px-3 py-1 bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/30 font-manrope text-xs rounded-full font-bold">
          NOT APPROVED
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="w-full sm:w-auto px-5 py-2.5 rounded text-center text-sm font-semibold text-[#667085] dark:text-slate-400 hover:bg-[#F5F7FA] dark:hover:bg-slate-800 transition-colors"
        >
          Back to Dashboard
        </button>
        <button
          type="button"
          onClick={onOpenSupport}
          className="w-full sm:w-auto px-6 py-2.5 bg-[#071A2B] hover:bg-[#0e2740] dark:bg-[#F2B705] dark:hover:bg-[#dfa704] text-white dark:text-[#071A2B] font-sora text-sm rounded font-bold transition-colors"
        >
          Contact Support
        </button>
      </div>
    </div>
  );
}
