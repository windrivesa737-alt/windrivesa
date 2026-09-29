import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AdminShell from '../../components/admin/AdminShell';
import {
  getClaimById,
  updateClaimStatus,
} from '../../services/claims';
import {
  getClaimById as mockGetClaimById,
} from '../../services/mockClaims';
import {
  resolveApplicableClaimRequirement,
  formatZAR,
} from '../../services/claimRequirements';
import { resolveVehicleImage } from '../../services/vehicleImages';

export default function AdminClaimDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [claim, setClaim] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applicableRequirement, setApplicableRequirement] = useState(null);
  const [activeModal, setActiveModal] = useState(null); // 'APPROVE' | 'REJECT' | 'MORE_INFO' | 'PROCESSING' | 'FULFILLED' | 'APPLICABLE_CHARGE' | null
  const [modalInput, setModalInput] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  // Load specific claim
  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    getClaimById(id).then((res) => {
      if (isMounted) {
        if (res?.data || res?.claim) {
          setClaim(res.data || res.claim);
        } else if (!import.meta.env.PROD) {
          const found = mockGetClaimById(id);
          setClaim(found || null);
        } else {
          setClaim(null);
        }
        setLoading(false);
      }
    }).catch(() => {
      if (isMounted) {
        if (!import.meta.env.PROD) {
          const found = mockGetClaimById(id);
          setClaim(found || null);
        } else {
          setClaim(null);
        }
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [id]);

  // Resolve applicable requirement for this specific claim using centralized service
  useEffect(() => {
    if (!claim) {
      setApplicableRequirement(null);
      return;
    }
    let isMounted = true;
    resolveApplicableClaimRequirement(claim, { ignoreStatus: true, profileId: claim?.profile_id || claim?.userId })
      .then((req) => {
        if (isMounted) {
          setApplicableRequirement(req || null);
        }
      })
      .catch(() => {
        if (isMounted) {
          setApplicableRequirement(null);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [claim]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Handle status transitions
  const executeStatusMutation = async (newStatus, note = '') => {
    if (!claim) return;
    try {
      const result = await updateClaimStatus(claim.id, newStatus, { note });
      if (result.success) {
        setClaim(result.claim);
        setActiveModal(null);
        setModalInput('');
        showToast(`Claim ${claim.id} updated to ${newStatus}`);
        const updatedReq = await resolveApplicableClaimRequirement(result.claim, {
          ignoreStatus: true,
          profileId: result.claim?.profile_id || claim?.profile_id || claim?.userId,
        });
        setApplicableRequirement(updatedReq);
      } else {
        showToast(result.error || 'Failed to update claim status');
      }
    } catch (err) {
      showToast('An unexpected error occurred while updating status');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'UNDER REVIEW':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Under Review
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#00843D]/10 text-[#00843D] dark:text-[#10B981] border border-[#00843D]/20">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00843D] dark:bg-[#10B981]"></span>
            Approved
          </span>
        );
      case 'REQUIREMENT PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            Requirement Pending
          </span>
        );
      case 'MORE INFORMATION REQUIRED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
            More Information Required
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
            Processing
          </span>
        );
      case 'FULFILLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
            ✓ Fulfilled
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
            × Rejected
          </span>
        );
      case 'SUBMITTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
            Submitted
          </span>
        );
      case 'CLAIM AVAILABLE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
            Available
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {status}
          </span>
        );
    }
  };

  // 7 standard lifecycle timeline stages
  const timelineStages = [
    { key: 'AVAILABLE', label: '1. Available' },
    { key: 'SUBMITTED', label: '2. Submitted' },
    { key: 'UNDER REVIEW', label: '3. Under Review' },
    { key: 'APPROVED', label: '4. Approved' },
    { key: 'REQUIREMENT PENDING', label: '5. Requirements' },
    { key: 'PROCESSING', label: '6. Processing' },
    { key: 'FULFILLED', label: '7. Fulfilled' },
  ];

  const getStageStatusClass = (stageKey) => {
    if (!claim) return '';
    const statusOrder = [
      'CLAIM AVAILABLE',
      'SUBMITTED',
      'UNDER REVIEW',
      'APPROVED',
      'REQUIREMENT PENDING',
      'PROCESSING',
      'FULFILLED',
    ];

    const currentNormalized = claim.status === 'MORE INFORMATION REQUIRED' ? 'UNDER REVIEW' : claim.status;
    const stageIndex = statusOrder.indexOf(stageKey === 'AVAILABLE' ? 'CLAIM AVAILABLE' : stageKey);
    const currentIndex = statusOrder.indexOf(currentNormalized);

    if (stageKey === 'AVAILABLE' ? claim.status === 'CLAIM AVAILABLE' : claim.status === stageKey) {
      // Exactly current
      return 'bg-[#071A2B] text-[#F2B705] dark:bg-[#F2B705] dark:text-[#071A2B] font-bold border-2 border-[#F2B705] shadow-xs';
    } else if (stageIndex !== -1 && currentIndex !== -1 && stageIndex < currentIndex) {
      // Completed past stage
      return 'bg-[#00843D]/10 text-[#00843D] dark:text-[#10B981] font-bold border border-[#00843D]/20';
    } else {
      // Future stage
      return 'bg-[#F5F7FA] dark:bg-[#07131E] text-[#667085] dark:text-[#94A3B8] font-medium border border-[#D9E0E7] dark:border-[#1E2E3E]';
    }
  };

  if (loading) {
    return (
      <AdminShell activeKey="claims" breadcrumb="HQ Admin Console / Claim Requests">
        <div className="p-12 text-center text-[#667085] dark:text-[#94A3B8]">
          <p className="font-mono text-sm">Loading claim dossier...</p>
        </div>
      </AdminShell>
    );
  }

  if (!claim) {
    return (
      <AdminShell activeKey="claims" breadcrumb="HQ Admin Console / Claim Requests / Not Found">
        <div className="p-10 max-w-lg mx-auto bg-white dark:bg-[#0B1A28] rounded-2xl border border-[#D9E0E7] dark:border-[#1E2E3E] shadow-sm text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center font-bold text-lg">
            !
          </div>
          <h2 className="text-xl font-heading font-bold text-[#071A2B] dark:text-white">
            Claim Record Not Found
          </h2>
          <p className="text-xs text-[#667085] dark:text-[#94A3B8]">
            No claim was found matching ID: <span className="font-mono font-bold">{id}</span>.
          </p>
          <div className="pt-2">
            <Link
              to="/admin/claims"
              className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold bg-[#071A2B] text-white dark:bg-[#F2B705] dark:text-[#071A2B]"
            >
              ← Back to Claims Queue
            </Link>
          </div>
        </div>
      </AdminShell>
    );
  }

  const isVehicle = (claim?.type || claim?.claim_type || '').toLowerCase().includes('vehicle');
  const requirementConfig = applicableRequirement || null;
  const hasConfiguredCharge = Boolean(requirementConfig && Number(requirementConfig.applicableCharge) > 0);
  const showApplicableChargeCard =
    hasConfiguredCharge &&
    ['APPROVED', 'REQUIREMENT PENDING', 'PROCESSING', 'FULFILLED'].includes(claim?.status);

  return (
    <AdminShell
      activeKey="claims"
      breadcrumb={`HQ Admin Console / Claims / ${claim.id}`}
      toastState={toastMessage ? { open: true, message: toastMessage, type: 'success' } : null}
      onCloseToast={() => setToastMessage(null)}
    >
      <div className="space-y-8 max-w-6xl mx-auto">
        {/* TOP BAR / NAVIGATION */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#D9E0E7] dark:border-[#1E2E3E]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin/claims')}
              className="p-2 rounded-xl border border-[#D9E0E7] dark:border-[#1E2E3E] bg-white dark:bg-[#0B1A28] text-[#071A2B] dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-2xs"
              title="Return to Claim Requests Queue"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-[#071A2B] dark:bg-[#F2B705] text-[#F2B705] dark:text-[#071A2B] font-mono text-xs font-bold">
                  {claim.id}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-md text-xs font-bold ${
                    isVehicle
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      : 'bg-[#00843D]/10 text-[#00843D] dark:text-[#10B981]'
                  }`}
                >
                  {claim.type}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-heading font-extrabold text-[#071A2B] dark:text-white mt-1">
                Claim Review Dossier
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {getStatusBadge(claim.status)}
            <Link
              to="/admin/claim-requirements"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#667085] dark:text-[#94A3B8] border border-[#D9E0E7] dark:border-[#1E2E3E] hover:text-[#071A2B] dark:hover:text-white"
            >
              View Requirement Rules
            </Link>
          </div>
        </div>

        {/* STATUTORY CLAIM LIFECYCLE TIMELINE PROGRESS */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#0B1A28] border border-[#D9E0E7] dark:border-[#1E2E3E] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#667085] dark:text-[#94A3B8]">
              Statutory Claim Lifecycle Timeline
            </h2>
            <span className="text-[11px] font-mono text-[#667085] dark:text-[#94A3B8]">
              Submitted: {claim.submittedDate} &bull; Updated: {claim.updatedAt || claim.submittedDate}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-center text-xs">
            {timelineStages.map((stage) => (
              <div
                key={stage.key}
                className={`p-2.5 rounded-xl transition-all ${getStageStatusClass(stage.key)}`}
              >
                {stage.label}
              </div>
            ))}
          </div>

          {/* Detailed recorded timeline history list */}
          {claim.timeline && claim.timeline.length > 0 && (
            <div className="pt-4 border-t border-[#D9E0E7] dark:border-[#1E2E3E] space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#667085] dark:text-[#94A3B8]">
                Audit Trail History
              </span>
              <div className="divide-y divide-[#D9E0E7] dark:divide-[#1E2E3E] text-xs">
                {claim.timeline.map((item, idx) => (
                  <div key={idx} className="py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#00843D] dark:bg-[#10B981]"></span>
                      <strong className="text-[#071A2B] dark:text-white font-semibold">{item.event}</strong>
                      <span className="text-[#667085] dark:text-[#94A3B8] text-[11px]">— {item.note}</span>
                    </div>
                    <span className="font-mono text-[11px] text-[#667085] dark:text-[#94A3B8]">
                      {item.date}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 2-COLUMN INFO GRID: CLAIMANT IDENTIFICATION & REWARD SETTLEMENT */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card A: Claimant Identification */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#0B1A28] border border-[#D9E0E7] dark:border-[#1E2E3E] shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#071A2B] dark:text-white flex items-center gap-2">
              <svg className="w-4 h-4 text-[#F2B705]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              Claimant Identification
            </h3>

            <div className="divide-y divide-[#D9E0E7] dark:divide-[#1E2E3E] text-xs">
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-[#667085] dark:text-[#94A3B8]">Full Legal Name:</span>
                <span className="font-bold text-[#071A2B] dark:text-white">{claim.userName}</span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-[#667085] dark:text-[#94A3B8]">Email Address:</span>
                <span className="font-mono text-[#071A2B] dark:text-white">{claim.userEmail}</span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-[#667085] dark:text-[#94A3B8]">Contact Number:</span>
                <span className="font-mono text-[#071A2B] dark:text-white">{claim.userPhone}</span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-[#667085] dark:text-[#94A3B8]">Participant ID:</span>
                <span className="font-mono text-[#071A2B] dark:text-white">{claim.userId || 'WD-RSA-9941'}</span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-[#667085] dark:text-[#94A3B8]">Account Status:</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#071A2B] text-white dark:bg-slate-800 dark:text-slate-200">
                  {claim.accountStatus || 'APPROVED'}
                </span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-[#667085] dark:text-[#94A3B8]">FICA Verification:</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#00843D]/10 text-[#00843D] dark:text-[#10B981]">
                  VERIFIED
                </span>
              </div>
            </div>
          </div>

          {/* Card B: Reward Settlement Record */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#0B1A28] border border-[#D9E0E7] dark:border-[#1E2E3E] shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#071A2B] dark:text-white flex items-center gap-2">
              <svg className="w-4 h-4 text-[#00843D]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
              </svg>
              Reward Settlement Record
            </h3>

            {isVehicle ? (
              <div className="divide-y divide-[#D9E0E7] dark:divide-[#1E2E3E] text-xs">
                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-[#667085] dark:text-[#94A3B8]">Vehicle Allocated:</span>
                  <span className="font-bold text-[#071A2B] dark:text-white">
                    {claim.prizeName || 'Toyota Hilux 2026'}
                  </span>
                </div>
                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-[#667085] dark:text-[#94A3B8]">Model Specification:</span>
                  <span className="font-semibold text-[#071A2B] dark:text-white">
                    {claim.vehicleDetails?.vehicleModel || claim.prizeName || 'Hilux 2.8 GD-6 Legend 4x4'}
                  </span>
                </div>
                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-[#667085] dark:text-[#94A3B8]">Model Year:</span>
                  <span className="font-mono text-[#071A2B] dark:text-white">
                    {claim.vehicleDetails?.vehicleYear || '2026'}
                  </span>
                </div>
                <div className="py-2.5 flex justify-between items-start">
                  <span className="text-[#667085] dark:text-[#94A3B8]">Delivery Address:</span>
                  <span className="text-right text-[#071A2B] dark:text-white max-w-xs font-semibold">
                    {claim.vehicleDetails?.deliveryAddress
                      ? `${claim.vehicleDetails.deliveryAddress}, ${claim.vehicleDetails.city || ''}, ${claim.vehicleDetails.province || ''} ${claim.vehicleDetails.postalCode || ''}`
                      : 'Delivery address on record'}
                  </span>
                </div>
                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-[#667085] dark:text-[#94A3B8]">Preferred Contact:</span>
                  <span className="text-[#071A2B] dark:text-white">
                    {claim.vehicleDetails?.preferredContact || claim.userPhone}
                  </span>
                </div>
                <div className="pt-3 flex items-center gap-3">
                  <img
                    src={resolveVehicleImage(claim.vehicleDetails || claim)}
                    alt={claim.prizeName || 'Toyota Hilux'}
                    className="w-20 h-14 object-cover rounded-lg border border-[#D9E0E7] dark:border-[#1E2E3E]"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/images/windrivesa-hilux-white-01.jpg';
                    }}
                  />
                  <div>
                    <span className="text-xs font-semibold text-[#071A2B] dark:text-white block">
                      Verified fleet asset allocation
                    </span>
                    <span className="text-[11px] text-[#667085] dark:text-[#94A3B8]">
                      WinDriveSA White Hilux Fleet Allocation
                    </span>
                  </div>
                </div>
              </div>
            ) : claim.cashDetails || !isVehicle ? (
              <div className="divide-y divide-[#D9E0E7] dark:divide-[#1E2E3E] text-xs">
                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-[#667085] dark:text-[#94A3B8]">Cash Disbursement:</span>
                  <span className="font-bold text-[#00843D] dark:text-[#10B981] font-mono text-sm">
                    {formatZAR(claim.cashDetails?.amount ?? claim.amount ?? (typeof claim.prizeName === 'string' && claim.prizeName.startsWith('R') ? claim.prizeName : 250000))} {claim.cashDetails?.currency || claim.currency || 'ZAR'}
                  </span>
                </div>
                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-[#667085] dark:text-[#94A3B8]">Account Holder:</span>
                  <span className="font-semibold text-[#071A2B] dark:text-white">
                    {claim.cashDetails?.fullName || claim.userName}
                  </span>
                </div>
                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-[#667085] dark:text-[#94A3B8]">Banking Institution:</span>
                  <span className="font-semibold text-[#071A2B] dark:text-white">
                    {claim.cashDetails?.bankName || 'Verified South African Bank'}
                  </span>
                </div>
                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-[#667085] dark:text-[#94A3B8]">Settlement Account:</span>
                  <span className="font-mono font-bold text-[#071A2B] dark:text-white">
                    {claim.cashDetails?.accountNumber || '•••• •••• ••••'}
                  </span>
                </div>
                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-[#667085] dark:text-[#94A3B8]">Account Type:</span>
                  <span className="text-[#071A2B] dark:text-white">
                    {claim.cashDetails?.accountType || 'Cheque / Current Account'}
                  </span>
                </div>
                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-[#667085] dark:text-[#94A3B8]">Universal Branch Code:</span>
                  <span className="font-mono text-[#071A2B] dark:text-white">
                    {claim.cashDetails?.branchCode || '250655'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-4 text-center text-xs text-[#667085] dark:text-[#94A3B8]">
                Settlement particulars pending claimant verification submission.
              </div>
            )}
          </div>
        </div>

        {/* APPLICABLE REQUIREMENT CARD (shown when configured and claim is approved) */}
        {showApplicableChargeCard ? (
          <div className="p-6 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <h3 className="text-sm font-bold text-[#071A2B] dark:text-white">
                  Applicable Requirement — {applicableRequirement.title || (isVehicle ? 'Vehicle Prize' : 'Cash Prize')}
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded bg-amber-500/10 uppercase">
                {applicableRequirement.status || 'ENABLED'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
              <div>
                <span className="text-[#667085] dark:text-[#94A3B8] block mb-1">Applicable Charge:</span>
                <div className="font-mono font-extrabold text-base text-[#071A2B] dark:text-white">
                  {formatZAR(applicableRequirement.applicableCharge)} {applicableRequirement.currency || 'ZAR'}
                </div>
              </div>
              <div>
                <span className="text-[#667085] dark:text-[#94A3B8] block mb-1">Requirement Basis / Description:</span>
                <p className="text-[#071A2B] dark:text-slate-200 leading-relaxed font-medium">
                  {applicableRequirement.description || 'Configured claim requirement for this prize context.'}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-amber-500/20 text-xs">
              <p className="text-[#667085] dark:text-[#94A3B8] text-[11px]">
                Configured requirement from claim_requirements table for {isVehicle ? 'VEHICLE' : 'CASH'} claims.
              </p>
              {applicableRequirement.supportWhatsapp && (
                <div className="flex items-center gap-2">
                  <a
                    href={`https://wa.me/${applicableRequirement.supportWhatsapp.replace(/\D+/g, '')}?text=${encodeURIComponent(`WinDriveSA Support Assistance for Claim ${claim.id}`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#00843D] text-white hover:bg-[#00843D]/90 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.969.54 1.777.83 2.796.83 3.183 0 5.767-2.587 5.767-5.766.001-3.187-2.575-5.817-5.767-5.817zm3.435 8.219c-.144.405-.837.774-1.17.824-.312.045-.694.062-2.18-.557-1.782-.74-2.883-2.545-2.971-2.663-.087-.118-.722-.962-.722-1.834 0-.872.456-1.3.618-1.476.162-.176.353-.22.47-.22.118 0 .235.001.338.006.109.005.253-.042.395.3.147.353.5 1.22.544 1.308.044.088.073.191.015.309-.059.117-.088.19-.176.294-.088.103-.185.23-.264.309-.088.088-.18.185-.078.36.103.176.458.756.983 1.224.675.602 1.244.788 1.42.876.176.088.279.074.382-.044.103-.118.441-.515.559-.691.118-.176.235-.147.397-.088.162.059 1.03.485 1.206.574.176.088.294.132.338.206.044.073.044.426-.1.831z" />
                    </svg>
                    WhatsApp Support Assistance
                  </a>
                </div>
              )}
            </div>
          </div>
        ) : (['APPROVED', 'REQUIREMENT PENDING'].includes(claim.status) ? (
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#07131E] border border-slate-200 dark:border-slate-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5">
                No Applicable Requirement Configured
              </span>
              <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                No enabled requirement from claim_requirements applies to this {isVehicle ? 'VEHICLE' : 'CASH'} claim.
              </p>
            </div>
            <Link
              to="/admin/claim-requirements"
              className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#071A2B] text-white dark:bg-[#F2B705] dark:text-[#071A2B] hover:opacity-90 transition-opacity shrink-0"
            >
              Configure in Claim Requirements →
            </Link>
          </div>
        ) : null)}

        {/* ADMIN REGISTRAR ACTION CONTROLLER */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#0B1A28] border border-[#D9E0E7] dark:border-[#1E2E3E] shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-[#071A2B] dark:text-white">
                Admin Registrar Actions
              </h3>
              <p className="text-xs text-[#667085] dark:text-[#94A3B8]">
                Current Operational State:{' '}
                <strong className="text-[#071A2B] dark:text-white">{claim.status}</strong>
              </p>
            </div>
            <div>{getStatusBadge(claim.status)}</div>
          </div>

          {/* Action buttons matching state machine rules */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {claim.status === 'UNDER REVIEW' && (
              <>
                <button
                  onClick={() => setActiveModal('APPROVE')}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#00843D] text-white hover:bg-[#00843D]/90 transition-colors shadow-2xs flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Approve Claim</span>
                </button>
                <button
                  onClick={() => setActiveModal('REJECT')}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 transition-colors flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Reject Claim</span>
                </button>
                <button
                  onClick={() => setActiveModal('MORE_INFO')}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white dark:bg-[#0B1A28] border border-[#D9E0E7] dark:border-[#1E2E3E] text-[#071A2B] dark:text-white hover:border-[#071A2B] dark:hover:border-white transition-colors"
                >
                  Request More Information
                </button>
              </>
            )}

            {claim.status === 'APPROVED' && (
              <>
                {hasConfiguredCharge ? (
                  <button
                    onClick={() => executeStatusMutation('REQUIREMENT PENDING', 'Attached applicable charge requirement')}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#071A2B] text-[#F2B705] dark:bg-[#F2B705] dark:text-[#071A2B] transition-colors shadow-2xs"
                  >
                    Move to Requirement Pending &rarr;
                  </button>
                ) : (
                  <button
                    onClick={() => setActiveModal('PROCESSING')}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#071A2B] dark:bg-[#F2B705] text-white dark:text-[#071A2B] transition-colors shadow-2xs"
                  >
                    Move to Processing &rarr;
                  </button>
                )}
                {hasConfiguredCharge && (
                  <button
                    onClick={() => setActiveModal('APPLICABLE_CHARGE')}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white dark:bg-[#0B1A28] border border-[#D9E0E7] dark:border-[#1E2E3E] text-[#071A2B] dark:text-white"
                  >
                    View Applicable Charge
                  </button>
                )}
              </>
            )}

            {claim.status === 'REQUIREMENT PENDING' && (
              <>
                <button
                  onClick={() => setActiveModal('PROCESSING')}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#00843D] text-white hover:bg-[#00843D]/90 transition-colors shadow-2xs"
                >
                  Requirements Cleared &bull; Move to Processing &rarr;
                </button>
                <button
                  onClick={() => setActiveModal('MORE_INFO')}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white dark:bg-[#0B1A28] border border-[#D9E0E7] dark:border-[#1E2E3E] text-[#071A2B] dark:text-white"
                >
                  Re-request Documentation
                </button>
              </>
            )}

            {claim.status === 'PROCESSING' && (
              <button
                onClick={() => setActiveModal('FULFILLED')}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#00843D] text-white hover:bg-[#00843D]/90 transition-colors shadow-2xs flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Mark Claim as Fulfilled</span>
              </button>
            )}

            {claim.status === 'FULFILLED' && (
              <div className="text-xs font-bold text-[#00843D] dark:text-[#10B981] flex items-center gap-2 py-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Disbursement finalized. Ledger immutable.</span>
              </div>
            )}

            {claim.status === 'MORE INFORMATION REQUIRED' && (
              <button
                onClick={() => executeStatusMutation('UNDER REVIEW', 'Claimant submitted requested additional documentation')}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#F2B705] text-[#071A2B] hover:opacity-95 transition-opacity"
              >
                Return to Under Review
              </button>
            )}

            {claim.status === 'REJECTED' && (
              <button
                onClick={() => executeStatusMutation('UNDER REVIEW', 'Reopened for administrative review')}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#F5F7FA] dark:bg-[#07131E] border border-[#D9E0E7] dark:border-[#1E2E3E] text-[#071A2B] dark:text-white"
              >
                Reopen for Review
              </button>
            )}

            {claim.status === 'SUBMITTED' && (
              <button
                onClick={() => executeStatusMutation('UNDER REVIEW', 'Triage completed; allocated to review queue')}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#071A2B] text-[#F2B705] dark:bg-[#F2B705] dark:text-[#071A2B]"
              >
                Begin Review &rarr;
              </button>
            )}

            {claim.status === 'CLAIM AVAILABLE' && (
              <span className="text-xs text-[#667085] dark:text-[#94A3B8] font-mono">
                Awaiting user initial submission via portal.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* CONFIRMATION / ACTION MODALS                             */}
      {/* ======================================================== */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-[#071A2B]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#0B1A28] rounded-2xl border border-[#D9E0E7] dark:border-[#1E2E3E] p-6 shadow-2xl space-y-4">
            {/* Modal: APPROVE */}
            {activeModal === 'APPROVE' && (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#00843D]/10 text-[#00843D] dark:text-[#10B981] flex items-center justify-center font-bold text-lg">
                    ✓
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-base text-[#071A2B] dark:text-white">
                      Approve Claim?
                    </h3>
                    <p className="text-xs text-[#667085] dark:text-[#94A3B8]">
                      Approving claim {claim.id} for {claim.userName}
                    </p>
                  </div>
                </div>

                <div className="text-xs text-[#667085] dark:text-[#94A3B8] space-y-2">
                  <p>
                    This will approve the claim and move it to the applicable next stage.
                  </p>
                  {hasConfiguredCharge && requirementConfig ? (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300">
                      An applicable charge requirement ({formatZAR(requirementConfig.applicableCharge)} {requirementConfig.currency || 'ZAR'}) is configured for this prize category.
                    </div>
                  ) : (
                    <p className="text-[#00843D] dark:text-[#10B981]">
                      No additional claim requirements configured.
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#D9E0E7] dark:border-[#1E2E3E]">
                  <button
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-[#667085] dark:text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() =>
                      executeStatusMutation(
                        'APPROVED',
                        hasConfiguredCharge
                          ? 'Approved by registrar. Applicable charge attached.'
                          : 'Approved by registrar. Ready for disbursement.'
                      )
                    }
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-[#00843D] text-white hover:bg-[#00843D]/90"
                  >
                    Approve Claim
                  </button>
                </div>
              </>
            )}

            {/* Modal: REJECT */}
            {activeModal === 'REJECT' && (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold text-lg">
                    ×
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-base text-[#071A2B] dark:text-white">
                      Reject Claim?
                    </h3>
                    <p className="text-xs text-[#667085] dark:text-[#94A3B8]">
                      Rejecting claim {claim.id}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#071A2B] dark:text-white">
                    Rejection Basis (Optional)
                  </label>
                  <textarea
                    rows="3"
                    value={modalInput}
                    onChange={(e) => setModalInput(e.target.value)}
                    placeholder="Enter neutral verification rationale (e.g. Account holder name mismatch)..."
                    className="w-full p-2.5 text-xs rounded-xl bg-[#F5F7FA] dark:bg-[#07131E] border border-[#D9E0E7] dark:border-[#1E2E3E] text-[#071A2B] dark:text-white focus:outline-none focus:border-rose-500"
                  ></textarea>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#D9E0E7] dark:border-[#1E2E3E]">
                  <button
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-[#667085] dark:text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => executeStatusMutation('REJECTED', modalInput || 'Rejected per verification review')}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700"
                  >
                    Confirm Rejection
                  </button>
                </div>
              </>
            )}

            {/* Modal: MORE INFORMATION */}
            {activeModal === 'MORE_INFO' && (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold text-lg">
                    ?
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-base text-[#071A2B] dark:text-white">
                      Request More Information?
                    </h3>
                    <p className="text-xs text-[#667085] dark:text-[#94A3B8]">
                      Request additional documentation from {claim.userName}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#071A2B] dark:text-white">
                    Information Required
                  </label>
                  <textarea
                    rows="3"
                    value={modalInput}
                    onChange={(e) => setModalInput(e.target.value)}
                    placeholder="Specify the documentation required (e.g. Please supply a bank confirmation letter)..."
                    className="w-full p-2.5 text-xs rounded-xl bg-[#F5F7FA] dark:bg-[#07131E] border border-[#D9E0E7] dark:border-[#1E2E3E] text-[#071A2B] dark:text-white focus:outline-none focus:border-[#071A2B] dark:focus:border-[#F2B705]"
                  ></textarea>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#D9E0E7] dark:border-[#1E2E3E]">
                  <button
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-[#667085] dark:text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() =>
                      executeStatusMutation(
                        'MORE INFORMATION REQUIRED',
                        modalInput || 'Additional verification documentation requested'
                      )
                    }
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-[#071A2B] dark:bg-[#F2B705] text-white dark:text-[#071A2B]"
                  >
                    Send Request
                  </button>
                </div>
              </>
            )}

            {/* Modal: PROCESSING */}
            {activeModal === 'PROCESSING' && (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold text-lg">
                    &rarr;
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-base text-[#071A2B] dark:text-white">
                      Move Claim to Processing?
                    </h3>
                    <p className="text-xs text-[#667085] dark:text-[#94A3B8]">
                      Transition claim {claim.id} to disbursement pipeline
                    </p>
                  </div>
                </div>

                <p className="text-xs text-[#667085] dark:text-[#94A3B8]">
                  This records the claim as actively queued for EFT transmission or vehicle fleet logistics delivery coordination.
                </p>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#D9E0E7] dark:border-[#1E2E3E]">
                  <button
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-[#667085] dark:text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() =>
                      executeStatusMutation('PROCESSING', 'Disbursement batch file transmission queued')
                    }
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-[#071A2B] dark:bg-[#F2B705] text-white dark:text-[#071A2B]"
                  >
                    Move to Processing
                  </button>
                </div>
              </>
            )}

            {/* Modal: FULFILLED */}
            {activeModal === 'FULFILLED' && (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#00843D]/10 text-[#00843D] dark:text-[#10B981] flex items-center justify-center font-bold text-lg">
                    ✓
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-base text-[#071A2B] dark:text-white">
                      Mark Claim as Fulfilled?
                    </h3>
                    <p className="text-xs text-[#667085] dark:text-[#94A3B8]">
                      This records the claim as fulfilled.
                    </p>
                  </div>
                </div>

                <p className="text-xs text-[#667085] dark:text-[#94A3B8]">
                  Confirming indicates that verified banking settlement or physical vehicle handover has been completed.
                </p>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#D9E0E7] dark:border-[#1E2E3E]">
                  <button
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-[#667085] dark:text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() =>
                      executeStatusMutation('FULFILLED', 'Settlement verified and finalized in audit ledger')
                    }
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-[#00843D] text-white hover:bg-[#00843D]/90"
                  >
                    Mark as Fulfilled
                  </button>
                </div>
              </>
            )}

            {/* Modal: APPLICABLE CHARGE NOTICE */}
            {activeModal === 'APPLICABLE_CHARGE' && (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-lg">
                    i
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-base text-[#071A2B] dark:text-white">
                      Applicable Charge Notice
                    </h3>
                    <p className="text-xs text-[#667085] dark:text-[#94A3B8]">
                      Fiduciary charge specification
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#F5F7FA] dark:bg-[#07131E] text-xs space-y-2 text-[#667085] dark:text-[#94A3B8]">
                  {requirementConfig ? (
                    <>
                      <p>
                        <strong className="text-[#071A2B] dark:text-white">Applicable Charge:</strong>{' '}
                        {formatZAR(requirementConfig.applicableCharge)} {requirementConfig.currency || 'ZAR'}
                      </p>
                      <p>
                        <strong className="text-[#071A2B] dark:text-white">Description:</strong>{' '}
                        {requirementConfig.description || 'Configured claim requirement for this prize context.'}
                      </p>
                    </>
                  ) : (
                    <p>No applicable charge requirement configured for this claim.</p>
                  )}
                  <p className="text-[11px] pt-1 text-slate-500">
                    Governed under SARB domestic escrow settlement guidelines.
                  </p>
                </div>

                <div className="flex items-center justify-end pt-3 border-t border-[#D9E0E7] dark:border-[#1E2E3E]">
                  <button
                    onClick={() => setActiveModal(null)}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-[#071A2B] dark:bg-[#F2B705] text-white dark:text-[#071A2B]"
                  >
                    Dismiss
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </AdminShell>
  );
}
