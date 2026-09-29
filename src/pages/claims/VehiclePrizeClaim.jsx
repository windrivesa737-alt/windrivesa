import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { getUserReward } from '../../services/rewards';
import { resolveVehicleImage } from '../../services/vehicleImages';
import {
  createVehicleClaim,
  getClaimsForCurrentUser,
  updateClaimStatus,
  normalizeClaimStatus,
} from '../../services/claims';
import VehicleSummaryCard from './components/VehicleSummaryCard';
import VehicleDeliveryForm from './components/VehicleDeliveryForm';
import VehicleClaimLifecycleView from './components/VehicleClaimLifecycleView';
import LogisticsSupportModal from './components/LogisticsSupportModal';

export default function VehiclePrizeClaim() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { user: authUser, profile, loading: authLoading, logout } = useAuth();

  // Local state
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [realReward, setRealReward] = useState(null);
  const [realClaim, setRealClaim] = useState(null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Load user rewards and existing vehicle claim from Supabase
  useEffect(() => {
    let isMounted = true;

    async function loadVehicleData() {
      if (!authUser?.id) return;
      setIsDataLoading(true);
      setLoadError(null);

      try {
        const [rewardRes, claimsRes] = await Promise.all([
          getUserReward(authUser.id),
          getClaimsForCurrentUser(authUser.id),
        ]);

        if (!isMounted) return;

        if (rewardRes?.data) {
          setRealReward(rewardRes.data);
        }

        if (claimsRes?.data && Array.isArray(claimsRes.data)) {
          const vehC = claimsRes.data.find((c) =>
            (c.claim_type || c.type || '').toUpperCase().includes('VEHICLE')
          );
          if (vehC) {
            setRealClaim(vehC);
          }
        }
      } catch (err) {
        console.error('Error loading vehicle prize claim data:', err);
        if (isMounted) {
          setLoadError('Unable to load vehicle claim details. Please try again.');
        }
      } finally {
        if (isMounted) {
          setIsDataLoading(false);
        }
      }
    }

    if (authUser?.id) {
      loadVehicleData();
    }
    return () => {
      isMounted = false;
    };
  }, [authUser?.id]);

  // Derived user details from Auth context and profile
  const currentUser = {
    id: authUser?.id || '',
    fullName: profile?.full_name || authUser?.user_metadata?.full_name || 'WinDrive Member',
    memberId: profile?.member_number || (profile?.id ? `WD-${profile.id.slice(0, 5).toUpperCase()}` : 'WD-88349-ZA'),
    mobile: profile?.mobile_number || '',
    status: (profile?.account_status || 'PENDING_REVIEW').replace('_', ' '),
  };

  const userInitials = currentUser.fullName
    ? currentUser.fullName
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2)
    : 'WD';

  // Account verification status
  const isAccountPending = profile?.account_status === 'PENDING_REVIEW';

  // Construct structured vehicle reward representation from live Supabase record
  const hasVehicleModel = Boolean(
    realReward &&
    (realReward.vehicle_model || realReward.vehicleModel || realReward.model || realReward.vehicle_make || realReward.vehicleMake || realReward.make)
  );
  const vehicleReward = hasVehicleModel
    ? {
        id: realReward.id,
        allocationId: `WD-VK-${realReward.id?.slice(0, 5).toUpperCase() || 'ALLOC'}`,
        vehicle_make: realReward.vehicle_make || realReward.vehicleMake || realReward.make || '',
        vehicle_model: realReward.vehicle_model || realReward.vehicleModel || realReward.model || '',
        vehicle_year: realReward.vehicle_year || realReward.vehicleYear || realReward.year || '',
        vehicle_edition: 'Allocation Specification',
        vehicle_image: resolveVehicleImage(realReward),
        registration: 'Registered Vehicle',
        handover_hub: 'Gauteng Hub / Regional',
        review_window: '2–3 Business Days',
        review_type: 'Manual Compliance',
        audit_certificate: 'Compliant & Cleared',
        reward_status: realReward.status || 'ACTIVE',
        claim_status: realClaim ? normalizeClaimStatus(realClaim.status) : 'CLAIM AVAILABLE',
      }
    : null;

  const existingClaim = realClaim || null;
  const currentStatus = existingClaim?.status
    ? normalizeClaimStatus(existingClaim.status)
    : vehicleReward?.claim_status || 'CLAIM AVAILABLE';

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleLogout = async (e) => {
    if (e) e.preventDefault();
    await logout();
    navigate('/login', { replace: true });
  };

  const handleSubmitClaim = async (formData) => {
    setIsSubmitting(true);

    try {
      if (isEditing && existingClaim) {
        await updateClaimStatus(existingClaim.id, 'UNDER REVIEW', {
          note: 'Claimant updated physical delivery coordinates',
        });
        setIsEditing(false);
        showToast('Delivery details updated successfully.');
      } else {
        const res = await createVehicleClaim({
          profileId: currentUser.id,
          rewardId: vehicleReward?.id || vehicleReward?.allocationId,
          fullName: formData.fullName,
          mobileNumber: formData.mobileNumber ? `+27 ${formData.mobileNumber.replace(/^\+27\s*/, '')}` : '',
          deliveryAddress: formData.deliveryAddress,
          city: formData.city,
          province: formData.province,
          postalCode: formData.postalCode,
          preferredDeliveryContact: formData.preferredContact || 'Self',
          deliveryNotes: formData.deliveryNotes || '',
        });

        if (!res.success) {
          showToast(res.error || 'A claim for this prize is already in progress.');
          setIsSubmitting(false);
          return;
        }

        setRealClaim(res.claim || res.data);
        showToast('Vehicle prize claim submitted for compliance review.');
      }
    } catch (err) {
      showToast('An unexpected error occurred while processing your vehicle claim.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render auth loading state without blanking out or premature redirection
  if (authLoading || (isDataLoading && !realReward && !loadError)) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] dark:bg-[#071A2B] flex items-center justify-center font-manrope">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#071A2B]/20 dark:border-white/20 border-t-[#F2B705] rounded-full animate-spin"></div>
          <span className="text-xs font-semibold text-[#667085] dark:text-gray-400 tracking-wider uppercase font-sora">
            Loading Vehicle Claim Details…
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] dark:bg-[#071A2B] text-[#071A2B] dark:text-white flex flex-col md:flex-row font-manrope transition-colors duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#071A2B] dark:bg-white text-white dark:text-[#071A2B] px-4 py-3 rounded-lg shadow-xl border border-[#D9E3F1] dark:border-[#1B354F] flex items-center gap-3 text-sm font-manrope animate-slideDown">
          <svg className="w-5 h-5 text-[#00843D] dark:text-emerald-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Support Coordination Modal */}
      <LogisticsSupportModal
        isOpen={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
        allocationId={vehicleReward?.allocationId || 'WD-VK-55912'}
        onTicketSubmitted={(ticket) => {
          showToast(`Support Ticket ${ticket.ticketId || 'created'} registered.`);
        }}
      />

      {/* Desktop Sidebar (w-64, sticky) */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-[#081827] border-r border-[#D9E3F1] dark:border-[#1B354F] sticky top-0 h-screen z-30 shrink-0 select-none">
        <div className="p-6 flex items-center gap-3 border-b border-[#D9E3F1] dark:border-[#1B354F]">
          <div className="w-9 h-9 rounded-lg bg-[#071A2B] dark:bg-[#F2B705] flex items-center justify-center text-[#F2B705] dark:text-[#071A2B] font-sora font-extrabold text-base shadow-sm">
            W
          </div>
          <div>
            <span className="font-sora font-extrabold text-lg tracking-tight text-[#071A2B] dark:text-white block leading-none">
              WinDrive<span className="text-[#F2B705]">SA</span>
            </span>
            <span className="font-manrope text-[10px] text-[#667085] dark:text-slate-400 font-semibold tracking-wider uppercase">
              Member Portal
            </span>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 px-4 py-6 flex flex-col gap-1.5 overflow-y-auto">
          <Link
            to="/dashboard"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-[#667085] dark:text-slate-300 hover:bg-[#F5F7FA] dark:hover:bg-[#0B2238] hover:text-[#071A2B] dark:hover:text-white transition-colors"
          >
            <svg className="w-5 h-5 text-[#667085] dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            <span>Dashboard</span>
          </Link>

          <Link
            to="/rewards"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-[#667085] dark:text-slate-300 hover:bg-[#F5F7FA] dark:hover:bg-[#0B2238] hover:text-[#071A2B] dark:hover:text-white transition-colors"
          >
            <svg className="w-5 h-5 text-[#667085] dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
            </svg>
            <span>My Rewards</span>
          </Link>

          <Link
            to="/claims"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold bg-[#071A2B]/10 dark:bg-[#F2B705]/15 text-[#071A2B] dark:text-[#F2B705] border-l-4 border-[#071A2B] dark:border-[#F2B705]"
          >
            <svg className="w-5 h-5 text-[#071A2B] dark:text-[#F2B705]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Claim Requests</span>
          </Link>

          <Link
            to="/account"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-[#667085] dark:text-slate-300 hover:bg-[#F5F7FA] dark:hover:bg-[#0B2238] hover:text-[#071A2B] dark:hover:text-white transition-colors"
          >
            <svg className="w-5 h-5 text-[#667085] dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>Account</span>
          </Link>

          <Link
            to="/support"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-[#667085] dark:text-slate-300 hover:bg-[#F5F7FA] dark:hover:bg-[#0B2238] hover:text-[#071A2B] dark:hover:text-white transition-colors"
          >
            <svg className="w-5 h-5 text-[#667085] dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span>Support</span>
          </Link>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-[#D9E3F1] dark:border-[#1B354F] flex flex-col gap-3">
          <div className="flex items-center gap-3 p-2 bg-[#F5F7FA] dark:bg-[#0B2238] rounded-lg">
            <div className="w-9 h-9 rounded-full bg-[#071A2B] text-white dark:bg-[#F2B705] dark:text-[#071A2B] font-sora font-bold text-xs flex items-center justify-center">
              {userInitials}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-bold text-[#071A2B] dark:text-white truncate block">
                {currentUser.fullName}
              </span>
              <span className="text-[10px] text-[#667085] dark:text-slate-400 block font-mono">
                {currentUser.memberId}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg text-[#667085] dark:text-slate-400 hover:bg-[#F5F7FA] dark:hover:bg-[#0B2238] transition-colors"
              title="Toggle Theme"
            >
              {theme === 'dark' ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile / Tablet Header with Real Drawer */}
      <header className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-[#081827] border-b border-[#D9E3F1] dark:border-[#1B354F] sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#071A2B] dark:bg-[#F2B705] flex items-center justify-center text-[#F2B705] dark:text-[#071A2B] font-sora font-bold text-sm">
            W
          </div>
          <span className="font-sora font-extrabold text-base tracking-tight text-[#071A2B] dark:text-white">
            WinDrive<span className="text-[#F2B705]">SA</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-lg text-[#667085] dark:text-slate-400 hover:bg-[#F5F7FA] dark:hover:bg-[#0B2238]"
          >
            {theme === 'dark' ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
            className="p-2 rounded-lg text-[#071A2B] dark:text-white hover:bg-[#F5F7FA] dark:hover:bg-[#0B2238]"
            aria-label="Toggle navigation menu"
          >
            {isMobileDrawerOpen ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-black/60 backdrop-blur-sm">
          <div className="w-72 bg-white dark:bg-[#081827] h-full p-6 flex flex-col justify-between shadow-xl">
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#D9E3F1] dark:border-[#1B354F]">
                <span className="font-sora font-extrabold text-base text-[#071A2B] dark:text-white">
                  WinDrive<span className="text-[#F2B705]">SA</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="p-1 rounded text-[#667085]"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <nav className="flex flex-col gap-2">
                <Link
                  to="/dashboard"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="px-3 py-2 rounded-lg text-sm font-semibold text-[#667085] dark:text-slate-300 hover:bg-[#F5F7FA] dark:hover:bg-[#0B2238]"
                >
                  Dashboard
                </Link>
                <Link
                  to="/rewards"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="px-3 py-2 rounded-lg text-sm font-semibold text-[#667085] dark:text-slate-300 hover:bg-[#F5F7FA] dark:hover:bg-[#0B2238]"
                >
                  My Rewards
                </Link>
                <Link
                  to="/claims"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="px-3 py-2 rounded-lg text-sm font-semibold text-[#071A2B] dark:text-[#F2B705] bg-[#071A2B]/10 dark:bg-[#F2B705]/15"
                >
                  Claim Requests
                </Link>
                <Link
                  to="/account"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="px-3 py-2 rounded-lg text-sm font-semibold text-[#667085] dark:text-slate-300 hover:bg-[#F5F7FA] dark:hover:bg-[#0B2238]"
                >
                  Account
                </Link>
                <Link
                  to="/support"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="px-3 py-2 rounded-lg text-sm font-semibold text-[#667085] dark:text-slate-300 hover:bg-[#F5F7FA] dark:hover:bg-[#0B2238]"
                >
                  Support
                </Link>
              </nav>
            </div>

            <div className="pt-4 border-t border-[#D9E3F1] dark:border-[#1B354F]">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-2.5 px-3 rounded-lg text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 text-left flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Logout</span>
              </button>
            </div>
          </div>
          <div className="flex-1" onClick={() => setIsMobileDrawerOpen(false)} />
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full">
        {/* Navigation Breadcrumb */}
        <div>
          <Link
            to="/claims"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#667085] dark:text-slate-400 hover:text-[#071A2B] dark:hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to Claim Requests</span>
          </Link>
        </div>

        {/* Account Pending Review Warning */}
        {isAccountPending ? (
          <div className="bg-white dark:bg-[#0B2238] rounded-xl p-8 shadow-sm border border-[#D9E3F1] dark:border-[#1B354F] flex flex-col items-center text-center gap-4 max-w-2xl mx-auto">
            <div className="w-14 h-14 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="font-sora text-xl sm:text-2xl font-bold text-[#071A2B] dark:text-white">
              Account Verification Pending
            </h2>
            <p className="text-sm text-[#667085] dark:text-slate-300 leading-relaxed max-w-md">
              Your member account is currently undergoing mandatory compliance verification. Vehicle prize details and claim submissions will become accessible once your account has been approved and activated.
            </p>
            <Link
              to="/dashboard"
              className="mt-2 px-6 py-2.5 bg-[#071A2B] hover:bg-[#0e2740] dark:bg-[#F2B705] dark:hover:bg-[#dfa704] text-white dark:text-[#071A2B] font-sora text-sm rounded font-bold transition-colors"
            >
              Return to Dashboard
            </Link>
          </div>
        ) : !vehicleReward || vehicleReward.reward_status === 'NOT ASSIGNED' ? (
          /* Empty / Unavailable State (No vehicle prize assigned) */
          <div className="bg-white dark:bg-[#0B2238] rounded-xl p-8 shadow-sm border border-[#D9E3F1] dark:border-[#1B354F] flex flex-col items-center text-center gap-4 max-w-2xl mx-auto">
            <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 text-[#667085] dark:text-slate-400 flex items-center justify-center">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h2 className="font-sora text-xl sm:text-2xl font-bold text-[#071A2B] dark:text-white">
              No Vehicle Reward Assigned
            </h2>
            <p className="text-sm text-[#667085] dark:text-slate-300 leading-relaxed max-w-md">
              There is currently no vehicle prize reward allocated to your membership account. Check back after an administrator assigns your prize or review your active rewards.
            </p>
            <Link
              to="/dashboard"
              className="mt-2 px-6 py-2.5 bg-[#071A2B] hover:bg-[#0e2740] dark:bg-[#F2B705] dark:hover:bg-[#dfa704] text-white dark:text-[#071A2B] font-sora text-sm rounded font-bold transition-colors"
            >
              Return to Dashboard
            </Link>
          </div>
        ) : (
          /* Active Vehicle Claim Screen */
          <>
            {/* Page Heading */}
            <div className="flex flex-col gap-1">
              <h1 className="font-sora text-2xl sm:text-3xl text-[#071A2B] dark:text-white font-extrabold tracking-tight">
                Claim Your Vehicle Prize
              </h1>
              <p className="font-manrope text-sm text-[#667085] dark:text-slate-300">
                Submit your delivery details so your vehicle claim can be reviewed and processed.
              </p>
            </div>

            {/* 2-Column Responsive Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Vehicle Summary Card */}
              <div className="lg:col-span-5">
                <VehicleSummaryCard
                  vehicleReward={vehicleReward}
                  currentStatus={currentStatus}
                />
              </div>

              {/* Right Column: Dynamic Lifecycle State / Delivery Form */}
              <div className="lg:col-span-7">
                {currentStatus === 'CLAIM AVAILABLE' || isEditing ? (
                  <VehicleDeliveryForm
                    initialData={{
                      fullName: currentUser.fullName || '',
                      mobileNumber: currentUser.mobile || '',
                      deliveryAddress: existingClaim?.deliveryDetails?.deliveryAddress || existingClaim?.delivery_address || '',
                      city: existingClaim?.deliveryDetails?.city || existingClaim?.city || '',
                      province: existingClaim?.deliveryDetails?.province || existingClaim?.province || 'Gauteng',
                      postalCode: existingClaim?.deliveryDetails?.postalCode || existingClaim?.postal_code || '',
                      preferredContact: existingClaim?.deliveryDetails?.preferredContact || 'Self',
                    }}
                    onSubmit={handleSubmitClaim}
                    isSubmitting={isSubmitting}
                    submitButtonText={isEditing ? 'Update & Re-submit Claim' : 'Submit Vehicle Claim'}
                  />
                ) : (
                  <VehicleClaimLifecycleView
                    status={currentStatus}
                    claimData={existingClaim || {}}
                    vehicleReward={vehicleReward}
                    applicableCharge={null}
                    onOpenSupport={() => setIsSupportModalOpen(true)}
                    onEditDetails={() => setIsEditing(true)}
                  />
                )}
              </div>
            </div>

            {/* Bottom Contextual Support Section */}
            <div className="mt-4 p-5 sm:p-6 bg-white dark:bg-[#0B2238] rounded-xl border border-[#D9E3F1] dark:border-[#1B354F] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-center sm:text-left">
                <div className="w-10 h-10 rounded-full bg-[#EDF4FF] dark:bg-[#0D263E] text-[#071A2B] dark:text-[#F2B705] flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-sora text-sm font-bold text-[#071A2B] dark:text-white">
                    Need assistance with your vehicle prize handover?
                  </h4>
                  <p className="font-manrope text-xs text-[#667085] dark:text-slate-300">
                    Our compliance liaisons are available Monday–Friday, 08:00–17:00 SAST.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsSupportModalOpen(true)}
                  className="px-4 py-2 bg-[#071A2B] dark:bg-[#F2B705] text-white dark:text-[#071A2B] text-xs font-sora font-bold rounded hover:opacity-90 transition-opacity"
                >
                  Log Support Ticket
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
