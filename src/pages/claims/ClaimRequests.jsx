import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { getUserReward } from '../../services/rewards';
import { resolveVehicleImage } from '../../services/vehicleImages';
import { getClaimsForCurrentUser } from '../../services/claims';
import { resolveApplicableClaimRequirement } from '../../services/claimRequirements';

import CashClaimCard from './components/CashClaimCard';
import VehicleClaimCard from './components/VehicleClaimCard';
import ClaimsPendingReview from './components/ClaimsPendingReview';
import ClaimsEmptyState from './components/ClaimsEmptyState';
import ClaimsSupportFooter from './components/ClaimsSupportFooter';

export default function ClaimRequests() {
  const { theme, toggleTheme } = useTheme();
  const { user: authUser, profile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [supportModal, setSupportModal] = useState({ open: false, context: '' });
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
  const [realClaims, setRealClaims] = useState([]);
  const [realReward, setRealReward] = useState(null);
  const [loadingReward, setLoadingReward] = useState(true);
  const [cashRequirement, setCashRequirement] = useState(null);
  const [vehicleRequirement, setVehicleRequirement] = useState(null);

  const currentUser = {
    id: authUser?.id || '',
    fullName: profile?.full_name || authUser?.user_metadata?.full_name || 'WinDriveSA Member',
    memberId: profile?.member_number || (authUser?.id ? `WD-${authUser.id.slice(0, 5).toUpperCase()}` : 'WD-88349-ZA'),
    email: profile?.email || authUser?.email || '',
    mobile: profile?.mobile_number || authUser?.user_metadata?.mobile_number || '',
    status: (profile?.account_status || 'PENDING_REVIEW').replace('_', ' '),
    role: (profile?.role || 'USER').toLowerCase(),
  };

  // Load real claims and assigned reward for authenticated user from Supabase
  useEffect(() => {
    if (!authUser?.id) return;

    // 1. Fetch claims
    getClaimsForCurrentUser(authUser.id).then((res) => {
      if (res?.data) {
        setRealClaims(res.data);
      }
    }).catch(() => {});

    // 2. Fetch authoritative assigned reward
    setLoadingReward(true);
    getUserReward(authUser.id).then((res) => {
      setRealReward(res?.data || null);
    }).catch(() => {
      setRealReward(null);
    }).finally(() => {
      setLoadingReward(false);
    });
  }, [authUser?.id]);

  const realCashClaim = realClaims.find((c) => (c.claim_type || c.type || '').toUpperCase().includes('CASH'));
  const realVehicleClaim = realClaims.find((c) => (c.claim_type || c.type || '').toUpperCase().includes('VEHICLE'));
  const existingCashClaim = realCashClaim || null;
  const existingVehicleClaim = realVehicleClaim || null;

  // Resolve applicable claim requirements specifically per approved claim
  useEffect(() => {
    let isMounted = true;
    if (existingCashClaim) {
      resolveApplicableClaimRequirement(existingCashClaim, { profileId: authUser?.id }).then((req) => {
        if (isMounted) setCashRequirement(req);
      });
    } else {
      setCashRequirement(null);
    }
    return () => { isMounted = false; };
  }, [existingCashClaim, authUser?.id]);

  useEffect(() => {
    let isMounted = true;
    if (existingVehicleClaim) {
      resolveApplicableClaimRequirement(existingVehicleClaim, { profileId: authUser?.id }).then((req) => {
        if (isMounted) setVehicleRequirement(req);
      });
    } else {
      setVehicleRequirement(null);
    }
    return () => { isMounted = false; };
  }, [existingVehicleClaim, authUser?.id]);

  // ESC key listener to close modals and mobile menu
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsMobileDrawerOpen(false);
        setSupportModal({ open: false, context: '' });
        setWhatsAppModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!currentUser) {
    return null;
  }

  const isPendingReview = currentUser.status === 'PENDING REVIEW' || currentUser.status === 'REJECTED';
  const hasAssignedReward = Boolean(
    realReward &&
    (Number(realReward.cashAmount || realReward.cash_amount) > 0 || realReward.vehicleMake || realReward.vehicleModel)
  );

  const cashRewardData = realReward ? {
    id: realReward.id,
    allocationId: `WD-CP-${realReward.id?.slice(0, 5).toUpperCase() || 'ALLOC'}`,
    cash_amount: Number(realReward.cashAmount ?? realReward.cash_amount) || 0,
    cashAmount: Number(realReward.cashAmount ?? realReward.cash_amount) || 0,
    cash_currency: realReward.currency || realReward.cash_currency || 'ZAR',
    currency: realReward.currency || realReward.cash_currency || 'ZAR',
    reward_status: realReward.status || 'ACTIVE',
    claim_status: existingCashClaim?.status || 'CLAIM AVAILABLE',
  } : null;

  const vehicleRewardData = realReward ? {
    id: realReward.id,
    allocationId: `WD-VK-${realReward.id?.slice(0, 5).toUpperCase() || 'ALLOC'}`,
    vehicle_make: realReward.vehicleMake || realReward.vehicle_make || '',
    vehicleMake: realReward.vehicleMake || realReward.vehicle_make || '',
    vehicle_model: realReward.vehicleModel || realReward.vehicle_model || '',
    vehicleModel: realReward.vehicleModel || realReward.vehicle_model || '',
    vehicle_year: realReward.vehicleYear || realReward.vehicle_year || 2026,
    vehicleYear: realReward.vehicleYear || realReward.vehicle_year || 2026,
    vehicle_image: resolveVehicleImage(realReward),
    vehicleImage: resolveVehicleImage(realReward),
    vehicle_edition: 'Allocation Specification',
    reward_status: realReward.status || 'ACTIVE',
    claim_status: existingVehicleClaim?.status || 'CLAIM AVAILABLE',
  } : null;

  // User initials for sidebar avatar badge
  const userInitials = currentUser.fullName
    ? currentUser.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2)
    : 'WD';

  const handleLogout = async (e) => {
    if (e) e.preventDefault();
    await logout();
    navigate('/login', { replace: true });
  };

  const handleOpenSupport = (context = 'Claim Requests') => {
    setSupportModal({ open: true, context });
  };

  const handleOpenWhatsApp = () => {
    setWhatsAppModalOpen(true);
  };

  return (
    <div className="bg-brand-bg dark:bg-brand-navy-dark text-brand-charcoal dark:text-slate-100 min-h-screen flex flex-col transition-colors duration-200">
      <div className="flex-1 flex flex-col lg:flex-row w-full max-w-[1600px] mx-auto">
        {/* =============================================================== */}
        {/* DESKTOP AUTHENTICATED SIDEBAR (Fixed 256px on Desktop)          */}
        {/* =============================================================== */}
        <aside
          id="authenticated-sidebar"
          aria-label="User Sidebar Navigation"
          className="hidden lg:flex flex-col w-64 shrink-0 bg-white dark:bg-brand-navy border-r border-brand-border dark:border-brand-border-dark min-h-[calc(100vh)] p-6 justify-between transition-colors sticky top-0 h-screen overflow-y-auto"
        >
          <div className="space-y-6">
            {/* Official Brand Logo */}
            <div className="pt-1">
              <Link to="/dashboard" className="block focus:outline-none focus:ring-2 focus:ring-brand-gold rounded">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBBFwZ_eBXkCNCqPIZ3XvRb3-p1f-NNBT50dpniNQUeH3SwUPSzkJ2SFImTK_b-BfIH_4GArSPOOC7Vux1LAOVDTqXyyaNeMAPfH3YoHs5nYpS46UQB7Ji4P8DjcZknLEhqnnW8wukU9rdxmTvxQIZZ3q93pVz8UYwrpG1hsIN-8CMZNrSMZ6sU_BF-ADjCAG3bb1KNNhRe0yjx534BFfYa3WZNkatGrhia4fNMvzoxrtk9_n2FvsACwoHYyTWGmBl5do4"
                  alt="WinDriveSA Logo"
                  className="h-11 w-auto object-contain"
                />
              </Link>
            </div>

            {/* Verified Member Identity Card */}
            <div className="bg-brand-bg dark:bg-brand-navy-light/60 p-3.5 rounded-xl border border-brand-border dark:border-brand-border-dark/80 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-brand-navy dark:bg-brand-charcoal text-brand-gold font-sora font-bold flex items-center justify-center text-sm shadow-inner shrink-0">
                {userInitials}
              </div>
              <div className="min-w-0">
                <div className="font-sora text-xs font-semibold text-brand-navy dark:text-white truncate">
                  {currentUser.fullName || 'Verified Member'}
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-brand-muted dark:text-brand-muted-dark">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isPendingReview ? 'bg-amber-500' : 'bg-brand-emerald'
                    }`}
                  />
                  <span className="truncate">
                    {currentUser.memberId ? `${currentUser.memberId}` : 'RSA Citizen • Tier 1'}
                  </span>
                </div>
              </div>
            </div>

            {/* Authenticated Primary Navigation */}
            <nav className="space-y-1.5" aria-label="Authenticated Navigation">
              <Link
                to="/dashboard"
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-brand-muted dark:text-brand-muted-dark hover:bg-brand-bg dark:hover:bg-slate-800 hover:text-brand-navy dark:hover:text-white transition"
              >
                <svg className="w-5 h-5 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                </svg>
                <span>Dashboard</span>
              </Link>

              <Link
                to="/rewards"
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-brand-muted dark:text-brand-muted-dark hover:bg-brand-bg dark:hover:bg-slate-800 hover:text-brand-navy dark:hover:text-white transition"
              >
                <svg className="w-5 h-5 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.496m5.008 0A2.25 2.25 0 0016.75 12V8.25m-7.254 2.25A2.25 2.25 0 017.25 8.25V6m0 0V4.5A2.25 2.25 0 019.5 2.25h5A2.25 2.25 0 0116.75 4.5V6" />
                </svg>
                <span>My Rewards</span>
              </Link>

              {/* ACTIVE NAVIGATION ITEM: Claim Requests */}
              <Link
                to="/claims"
                className="flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-semibold bg-brand-navy text-white dark:bg-brand-gold dark:text-brand-navy shadow-sm transition"
              >
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-brand-gold dark:text-brand-navy" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.25V3.75A1.125 1.125 0 0013.125 2.625H4.875A1.125 1.125 0 003.75 3.75v10.5" />
                  </svg>
                  <span>Claim Requests</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-brand-gold dark:bg-brand-navy" />
              </Link>

              <Link
                to="/account"
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-brand-muted dark:text-brand-muted-dark hover:bg-brand-bg dark:hover:bg-slate-800 hover:text-brand-navy dark:hover:text-white transition"
              >
                <svg className="w-5 h-5 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                <span>Account</span>
              </Link>

              <Link
                to="/support"
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-brand-muted dark:text-brand-muted-dark hover:bg-brand-bg dark:hover:bg-slate-800 hover:text-brand-navy dark:hover:text-white transition"
              >
                <svg className="w-5 h-5 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                </svg>
                <span>Support</span>
              </Link>
            </nav>
          </div>

          {/* Sidebar Footer / Controls */}
          <div className="space-y-4 pt-4 border-t border-brand-border dark:border-brand-border-dark">
            {/* Desktop Theme Toggle */}
            <div className="flex items-center justify-between px-3.5 py-2 rounded-lg bg-brand-bg dark:bg-brand-navy-light/60">
              <span className="text-xs font-medium text-brand-muted dark:text-brand-muted-dark flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                </svg>
                <span>Theme</span>
              </span>
              <button
                type="button"
                onClick={toggleTheme}
                aria-label="Toggle Light and Dark mode"
                className="p-1.5 rounded-md hover:bg-white dark:hover:bg-slate-700 text-brand-charcoal dark:text-brand-gold transition shadow-sm"
              >
                {theme === 'dark' ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                )}
              </button>
            </div>

            {/* Logout Button */}
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
            >
              <svg className="w-5 h-5 text-slate-400 group-hover:text-red-600" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* =============================================================== */}
        {/* TABLET / MOBILE COMPACT AUTHENTICATED HEADER                    */}
        {/* =============================================================== */}
        <div className="lg:hidden flex flex-col w-full">
          <header className="flex items-center justify-between px-4 py-3.5 bg-white dark:bg-brand-navy border-b border-brand-border dark:border-brand-border-dark sticky top-0 z-40">
            {/* WinDriveSA Logo */}
            <Link to="/dashboard" className="flex items-center focus:outline-none focus:ring-2 focus:ring-brand-gold rounded">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBNEZqqYK27X8P9DzWs6hWq4RaY-WfaTMVHJ4s5NGa_hNu9swrru_m-P1HVBu1kpjwYgjWTQZpmeBA4L0bD39CBHoVTn-DhjUYKJithWdbuiB6ire_WAVgPaql-hFd7obVb33yRUEhWLtQBNT56a3YiOtcr9gb49iHGO4LlIDKfdBJmpLH8QilViK_RNpaBJdYy6ytuF6Hk3jDE8Z_EgfX-0hwW30CKpS8iKOrmlCukN48v1LbjePy6nnnsqV0uxLlBFUY"
                alt="WinDriveSA Logo"
                className="h-8 w-auto object-contain"
              />
            </Link>

            {/* Controls: Theme Toggle + Hamburger */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleTheme}
                aria-label="Toggle Theme"
                className="w-10 h-10 rounded-lg flex items-center justify-center bg-brand-bg dark:bg-brand-navy-light text-brand-charcoal dark:text-brand-gold border border-brand-border dark:border-brand-border-dark transition"
              >
                {theme === 'dark' ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                )}
              </button>

              {/* Functional Hamburger Button */}
              <button
                type="button"
                id="mobile-menu-toggle-btn"
                onClick={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
                aria-label={isMobileDrawerOpen ? 'Close navigation menu' : 'Open navigation menu'}
                aria-expanded={isMobileDrawerOpen}
                className="w-11 h-11 rounded-lg flex items-center justify-center bg-brand-bg dark:bg-brand-navy-light text-brand-navy dark:text-white border border-brand-border dark:border-brand-border-dark focus:outline-none focus:ring-2 focus:ring-brand-gold transition"
              >
                {isMobileDrawerOpen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                  </svg>
                )}
              </button>
            </div>
          </header>

          {/* Mobile Navigation Drawer */}
          {isMobileDrawerOpen && (
            <div
              id="mobile-nav-drawer"
              className="bg-white dark:bg-brand-navy border-b border-brand-border dark:border-brand-border-dark p-4 shadow-xl space-y-3 z-30 transition-all"
            >
              <div className="flex items-center gap-3 p-3 rounded-lg bg-brand-bg dark:bg-slate-800">
                <div className="w-9 h-9 rounded bg-brand-navy dark:bg-brand-charcoal text-brand-gold font-sora font-bold flex items-center justify-center text-xs">
                  {userInitials}
                </div>
                <div>
                  <div className="font-sora text-xs font-semibold text-brand-navy dark:text-white">
                    {currentUser.fullName || 'Verified Member'}
                  </div>
                  <div className="text-[11px] text-brand-emerald font-medium">
                    {currentUser.memberId || 'RSA Citizen • Tier 1 Verified'}
                  </div>
                </div>
              </div>

              <nav className="space-y-1" aria-label="Mobile Authenticated Navigation">
                <Link
                  to="/dashboard"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="block px-3 py-2.5 rounded-md text-sm font-medium text-brand-charcoal dark:text-slate-200 hover:bg-brand-bg dark:hover:bg-slate-800"
                >
                  Dashboard
                </Link>
                <Link
                  to="/rewards"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="block px-3 py-2.5 rounded-md text-sm font-medium text-brand-charcoal dark:text-slate-200 hover:bg-brand-bg dark:hover:bg-slate-800"
                >
                  My Rewards
                </Link>
                <Link
                  to="/claims"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="block px-3 py-2.5 rounded-md text-sm font-bold bg-brand-navy text-brand-gold dark:bg-brand-gold dark:text-brand-navy"
                >
                  Claim Requests (Active)
                </Link>
                <Link
                  to="/account"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="block px-3 py-2.5 rounded-md text-sm font-medium text-brand-charcoal dark:text-slate-200 hover:bg-brand-bg dark:hover:bg-slate-800"
                >
                  Account
                </Link>
                <Link
                  to="/support"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="block px-3 py-2.5 rounded-md text-sm font-medium text-brand-charcoal dark:text-slate-200 hover:bg-brand-bg dark:hover:bg-slate-800"
                >
                  Support
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileDrawerOpen(false);
                    handleLogout();
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  Sign Out
                </button>
              </nav>
            </div>
          )}
        </div>

        {/* =============================================================== */}
        {/* MAIN APPLICATION CONTENT AREA                                   */}
        {/* =============================================================== */}
        <main className="flex-1 p-4 sm:p-6 lg:p-10 max-w-6xl mx-auto w-full flex flex-col justify-between">
          <div>
            {/* Back to Dashboard Breadcrumb Action */}
            <div className="mb-5">
              <Link
                to="/dashboard"
                id="back-to-dashboard-breadcrumb"
                className="inline-flex items-center gap-2 text-xs font-semibold text-brand-muted dark:text-brand-muted-dark hover:text-brand-navy dark:hover:text-brand-gold transition py-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
                <span>Back to Dashboard</span>
              </Link>
            </div>

            {/* PAGE HEADER */}
            <header className="mb-8">
              <span className="inline-block text-[11px] font-sora font-bold uppercase tracking-wider text-brand-navy dark:text-brand-gold mb-1">
                CLAIM REQUESTS
              </span>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-brand-navy dark:text-white font-sora tracking-tight">
                Your Claim Requests
              </h1>
              <p className="text-sm sm:text-base text-brand-muted dark:text-brand-muted-dark mt-2 max-w-2xl">
                Track the progress of your cash and vehicle prize claims in one place.
              </p>
            </header>

            {/* If Account is in PENDING REVIEW state: show dedicated verification hold screen */}
            {isPendingReview ? (
              <ClaimsPendingReview />
            ) : (!hasAssignedReward && !loadingReward) ? (
              /* If no reward record is assigned yet: show empty state */
              <ClaimsEmptyState />
            ) : (
              /* Normal Approved / Active Account View */
              <>
                {/* CLAIM OVERVIEW SUMMARY STRIP (MY CLAIMS) */}
                <section
                  aria-label="Claims Overview Summary"
                  className="mb-8 p-4 sm:p-5 bg-white dark:bg-brand-navy border border-brand-border dark:border-brand-border-dark rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-brand-bg dark:bg-brand-navy-light text-brand-navy dark:text-brand-gold flex items-center justify-center font-sora font-bold text-sm">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-[11px] font-sora uppercase font-bold text-brand-muted dark:text-brand-muted-dark tracking-wider">
                        MY CLAIMS
                      </div>
                      <div className="text-sm font-semibold text-brand-navy dark:text-white">
                        Active Allocation Categories: Cash & Vehicle
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-brand-navy dark:text-slate-200 bg-brand-bg dark:bg-brand-navy-light px-3 py-1.5 rounded-lg border border-brand-border dark:border-brand-border-dark">
                    <span className="w-2 h-2 rounded-full bg-brand-emerald" aria-hidden="true" />
                    <span>RSA Allocation Escrow Verified</span>
                  </div>
                </section>

                {/* ============================================================= */}
                {/* DYNAMIC CONTENT: TWO BALANCED PRIMARY CLAIM CARDS             */}
                {/* ============================================================= */}
                <div id="claims-grid" className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                  {/* CARD 1: Cash Prize Claim */}
                  <CashClaimCard
                    cashReward={cashRewardData}
                    existingClaim={existingCashClaim}
                    applicableRequirement={cashRequirement}
                    onContactSupport={handleOpenSupport}
                  />

                  {/* CARD 2: Vehicle Prize Claim */}
                  <VehicleClaimCard
                    vehicleReward={vehicleRewardData}
                    existingClaim={existingVehicleClaim}
                    applicableRequirement={vehicleRequirement}
                    onContactSupport={handleOpenSupport}
                  />
                </div>
              </>
            )}
          </div>

          {/* RESTRAINED SUPPORT & AUDIT PANEL */}
          <ClaimsSupportFooter
            onWhatsAppSupport={handleOpenWhatsApp}
            onContactSupport={handleOpenSupport}
          />
        </main>
      </div>

      {/* =============================================================== */}
      {/* WHATSAPP SUPPORT MODAL (Institutional safety advisory)          */}
      {/* =============================================================== */}
      {whatsAppModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="whatsapp-modal-title"
          className="fixed inset-0 bg-brand-navy/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <div className="bg-white dark:bg-brand-navy border border-brand-border dark:border-brand-border-dark rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-brand-emerald flex items-center justify-center">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.969.584 1.942.895 3.036.895 3.18 0 5.767-2.587 5.768-5.766.001-3.18-2.586-5.767-5.768-5.767zm7.842 5.766c-.002 4.316-3.518 7.831-7.841 7.831-1.334 0-2.581-.355-3.676-.995l-4.148 1.088 1.107-4.043c-.722-1.15-1.124-2.482-1.123-3.881.002-4.315 3.518-7.831 7.842-7.831 4.315 0 7.839 3.516 7.839 7.831z" />
                  </svg>
                </div>
                <div>
                  <h3 id="whatsapp-modal-title" className="font-sora text-base font-bold text-brand-navy dark:text-white">
                    WinDriveSA WhatsApp Support Desk
                  </h3>
                  <p className="text-xs text-brand-muted dark:text-brand-muted-dark">
                    Official South African Member Logistics Line
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setWhatsAppModalOpen(false)}
                aria-label="Close WhatsApp Modal"
                className="p-1 rounded-lg text-slate-400 hover:text-brand-navy dark:hover:text-white hover:bg-brand-bg dark:hover:bg-slate-800 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 rounded-xl bg-brand-bg dark:bg-brand-navy-light/60 border border-brand-border dark:border-brand-border-dark text-xs space-y-2">
              <div className="font-semibold text-brand-navy dark:text-white flex items-center justify-between">
                <span>Direct WhatsApp Number:</span>
                <span className="font-mono text-brand-emerald font-bold">+27 82 555 0194</span>
              </div>
              <div className="text-slate-600 dark:text-slate-300">
                Operating Hours: Monday – Friday, 08:00 – 17:00 SAST (Excluding RSA Public Holidays)
              </div>
            </div>

            {/* Crucial Security Notice */}
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
              <svg className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <div>
                <strong>Security Advisory:</strong> WinDriveSA representatives will NEVER request your banking passwords, card PIN, CVV, OTP codes, or full confidential credentials over WhatsApp or phone.
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setWhatsAppModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-brand-muted hover:text-brand-navy dark:hover:text-white transition"
              >
                Close
              </button>
              <a
                href="https://wa.me/27825550194?text=Hello%20WinDriveSA%20Support,%20I%20have%20an%20inquiry%20regarding%20my%20claim%20request."
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-xl bg-brand-emerald hover:bg-emerald-600 text-white font-sora font-semibold text-xs transition shadow-sm inline-flex items-center gap-2"
              >
                <span>Continue to WhatsApp</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* =============================================================== */}
      {/* DIRECT SUPPORT TICKET MODAL                                     */}
      {/* =============================================================== */}
      {supportModal.open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="support-ticket-title"
          className="fixed inset-0 bg-brand-navy/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <div className="bg-white dark:bg-brand-navy border border-brand-border dark:border-brand-border-dark rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between">
              <div>
                <h3 id="support-ticket-title" className="font-sora text-base font-bold text-brand-navy dark:text-white">
                  Member Support Inquiry
                </h3>
                <p className="text-xs text-brand-muted dark:text-brand-muted-dark mt-0.5">
                  Context: {supportModal.context}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSupportModal({ open: false, context: '' })}
                className="p-1 rounded-lg text-slate-400 hover:text-brand-navy dark:hover:text-white hover:bg-brand-bg dark:hover:bg-slate-800 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-xs text-brand-charcoal dark:text-slate-300 leading-relaxed">
              Our South African Member Support Team is available to assist you with inquiries regarding your claim review, delivery logistics, or account verification.
            </p>

            <div className="flex flex-col gap-2 pt-2">
              <Link
                to="/support"
                onClick={() => setSupportModal({ open: false, context: '' })}
                className="w-full py-2.5 px-4 rounded-xl bg-brand-navy text-white dark:bg-brand-gold dark:text-brand-navy font-sora font-semibold text-xs text-center hover:opacity-90 transition shadow-sm"
              >
                Open Support Desk Page
              </Link>
              <button
                type="button"
                onClick={() => {
                  setSupportModal({ open: false, context: '' });
                  handleOpenWhatsApp();
                }}
                className="w-full py-2.5 px-4 rounded-xl border border-brand-emerald/40 text-brand-emerald hover:bg-emerald-50 dark:hover:bg-emerald-950/30 font-semibold text-xs text-center transition"
              >
                Contact via WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
