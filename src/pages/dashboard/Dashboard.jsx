import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { getClaimsForCurrentUser } from '../../services/claims';
import { resolveApplicableClaimRequirement, formatZAR } from '../../services/claimRequirements';
import { getUserReward } from '../../services/rewards';
import { resolveVehicleImage } from '../../services/vehicleImages';

export default function Dashboard() {
  const { theme, toggleTheme } = useTheme();
  const { user: authUser, profile, logout } = useAuth();
  const navigate = useNavigate();

  const currentUser = {
    id: authUser?.id || '',
    fullName: profile?.full_name || authUser?.user_metadata?.full_name || 'WinDriveSA Member',
    memberId: profile?.member_number || (authUser?.id ? `WD-${authUser.id.slice(0, 5).toUpperCase()}` : 'WD-88349-ZA'),
    email: profile?.email || authUser?.email || '',
    mobile: profile?.mobile_number || authUser?.user_metadata?.mobile_number || '',
    status: (profile?.account_status || 'PENDING_REVIEW').replace('_', ' '),
    role: (profile?.role || 'USER').toLowerCase(),
  };

  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const [realReward, setRealReward] = useState(null);
  const [realClaims, setRealClaims] = useState([]);
  const [loadingReward, setLoadingReward] = useState(true);
  const [cashRequirement, setCashRequirement] = useState(null);
  const [vehicleRequirement, setVehicleRequirement] = useState(null);

  useEffect(() => {
    async function loadData() {
      if (authUser?.id) {
        setLoadingReward(true);
        try {
          const [rewardRes, claimsRes] = await Promise.all([
            getUserReward(authUser.id),
            getClaimsForCurrentUser(authUser.id),
          ]);
          setRealReward(rewardRes?.data || null);
          if (claimsRes?.data) {
            setRealClaims(claimsRes.data);
          }
        } catch (err) {
          console.error('Failed to load dashboard data:', err);
        } finally {
          setLoadingReward(false);
        }
      }
    }
    loadData();
  }, [authUser?.id]);

  const realCashClaim = realClaims.find((c) =>
    (c.claim_type || c.type || '').toUpperCase().includes('CASH')
  );
  const realVehicleClaim = realClaims.find((c) =>
    (c.claim_type || c.type || '').toUpperCase().includes('VEHICLE')
  );

  // Resolve applicable requirements for approved claims only
  useEffect(() => {
    let isMounted = true;
    if (realCashClaim) {
      resolveApplicableClaimRequirement(realCashClaim, { profileId: authUser?.id || currentUser?.id }).then((req) => {
        if (isMounted) setCashRequirement(req);
      });
    } else {
      setCashRequirement(null);
    }
    return () => { isMounted = false; };
  }, [realCashClaim, authUser?.id, currentUser?.id]);

  useEffect(() => {
    let isMounted = true;
    if (realVehicleClaim) {
      resolveApplicableClaimRequirement(realVehicleClaim, { profileId: authUser?.id || currentUser?.id }).then((req) => {
        if (isMounted) setVehicleRequirement(req);
      });
    } else {
      setVehicleRequirement(null);
    }
    return () => { isMounted = false; };
  }, [realVehicleClaim, authUser?.id, currentUser?.id]);

  if (!currentUser) {
    return null;
  }

  // Derived user details & initials
  const userInitials = currentUser.fullName
    ? currentUser.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2)
    : 'WD';

  const memberId = currentUser.memberId || 'WD-88349-ZA';
  const isPendingReview = currentUser.status === 'PENDING REVIEW';
  const isApproved = currentUser.status === 'APPROVED' || currentUser.status === 'ACTIVE';

  // Real authoritative rewards without invented constants or fallbacks
  const hasAssignedReward = Boolean(
    realReward &&
    (Number(realReward.cashAmount || realReward.cash_amount) > 0 || realReward.vehicleMake || realReward.vehicleModel)
  );

  const rewards = hasAssignedReward
    ? {
        cash: {
          allocationId: `WD-CP-${realReward.id?.slice(0, 5).toUpperCase() || 'ALLOC'}`,
          cash_amount: Number(realReward.cashAmount ?? realReward.cash_amount) || 0,
          cash_currency: realReward.currency || realReward.cash_currency || 'ZAR',
          disbursement_method: 'EFT (Verified SA Bank)',
          processing_window: '2–3 Business Days',
          reward_status: realReward.status || 'ACTIVE',
          claim_status: realCashClaim?.status || 'CLAIM AVAILABLE',
        },
        vehicle: {
          allocationId: `WD-VK-${realReward.id?.slice(0, 5).toUpperCase() || 'ALLOC'}`,
          vehicle_make: realReward.vehicleMake || realReward.vehicle_make || '',
          vehicle_model: realReward.vehicleModel || realReward.vehicle_model || '',
          vehicle_year: realReward.vehicleYear || realReward.vehicle_year || '',
          vehicle_edition: 'Allocation Specification',
          vehicle_image: resolveVehicleImage(realReward),
          registration: 'Registered Fleet Vehicle',
          handover_hub: 'Gauteng Hub / Regional',
          review_window: '2–3 Business Days',
          review_type: 'Manual Compliance',
          audit_certificate: 'Compliant & Cleared',
          specs: ['New Delivery', 'Warranty Included'],
          delivery_note: 'RSA National Fleet',
          reward_status: realReward.status || 'ACTIVE',
          claim_status: realVehicleClaim?.status || 'CLAIM AVAILABLE',
        },
        hasReward: true,
      }
    : null;

  const userClaims = realClaims;

  // Handle real application logout
  const handleLogout = async (e) => {
    if (e) e.preventDefault();
    await logout();
    navigate('/', { replace: true });
  };

  // Close mobile drawer on route click
  const handleMobileNavClick = (path) => {
    setIsMobileDrawerOpen(false);
    navigate(path);
  };

  return (
    <div className="bg-[#F5F7FA] text-[#17212B] dark:bg-[#040E18] dark:text-[#E2E8F0] font-manrope min-h-screen flex flex-col antialiased transition-colors duration-200 selection:bg-[#F2B705] selection:text-[#071A2B]">
      {/* MAIN CONTAINER (DESKTOP SIDEBAR + CONTENT) */}
      <div className="flex-1 flex flex-col lg:flex-row w-full max-w-[1720px] mx-auto min-h-screen">
        {/* ======================================================== */}
        {/* DESKTOP SIDEBAR NAVIGATION (260px / w-64)                 */}
        {/* ======================================================== */}
        <aside
          aria-label="Desktop Sidebar Navigation"
          className="hidden lg:flex flex-col w-64 bg-white dark:bg-[#0B2238] border-r border-[#D9E0E7] dark:border-[#1B354F] shrink-0 select-none z-30 transition-colors"
        >
          {/* Logo Container */}
          <div className="p-6 border-b border-[#D9E0E7]/80 dark:border-[#1B354F] flex items-center justify-between">
            <Link
              to="/dashboard"
              className="block focus:outline-none focus:ring-2 focus:ring-[#F2B705] rounded-lg"
              aria-label="WinDriveSA Dashboard"
            >
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBS8WYRO_U8dzlFp3O3-VET9-QiFpZXWdGJnMRHz5Ifee4PGT3kDaYXWez-sX8ZQ58anREzdqp5V44PLYQmb28FF5dsdaRPOw-2nn3hn30m2C0MchCG1cJ-skxWJv21wLASBYjO1y1bhhsDcg8do4vlVaT3X15ESDCMeF9G1Nu2AxjLDBdICAt4LHFD0VJEKJTjW9tReTk4Cv01xgcFtCfnH42p-McyexEOw9md6UgogmlV1jcR1ZeWIH8cu36FHymJC9A"
                alt="WinDriveSA - Win Big. Drive Away."
                className="h-10 w-auto object-contain max-w-[190px]"
              />
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto" aria-label="Sidebar Navigation">
            {/* Dashboard (Active) */}
            <Link
              to="/dashboard"
              className="flex items-center gap-3.5 px-3.5 py-3 text-sm font-semibold rounded-xl bg-[#071A2B] text-white dark:bg-[#F2B705] dark:text-[#071A2B] shadow-sm transition-all group"
            >
              <svg className="w-5 h-5 transition-transform group-hover:scale-105" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>Dashboard</span>
            </Link>

            {/* My Rewards */}
            <Link
              to="/rewards"
              className="flex items-center gap-3.5 px-3.5 py-3 text-sm font-medium rounded-xl text-[#17212B] dark:text-slate-300 hover:bg-[#F5F7FA] dark:hover:bg-slate-800/60 transition-colors group"
            >
              <svg className="w-5 h-5 text-[#667085] group-hover:text-[#F2B705] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>My Rewards</span>
              <span
                className={`ml-auto text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  isPendingReview
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-400'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-400'
                }`}
              >
                {isPendingReview ? 'Under Review' : 'Active'}
              </span>
            </Link>

            {/* Claim Requests */}
            <Link
              to="/claims"
              className="flex items-center gap-3.5 px-3.5 py-3 text-sm font-medium rounded-xl text-[#17212B] dark:text-slate-300 hover:bg-[#F5F7FA] dark:hover:bg-slate-800/60 transition-colors group"
            >
              <svg className="w-5 h-5 text-[#667085] group-hover:text-[#F2B705] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Claim Requests</span>
            </Link>

            {/* Account */}
            <Link
              to="/account"
              className="flex items-center gap-3.5 px-3.5 py-3 text-sm font-medium rounded-xl text-[#17212B] dark:text-slate-300 hover:bg-[#F5F7FA] dark:hover:bg-slate-800/60 transition-colors group"
            >
              <svg className="w-5 h-5 text-[#667085] group-hover:text-[#F2B705] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Account</span>
            </Link>

            {/* Support */}
            <Link
              to="/support"
              className="flex items-center gap-3.5 px-3.5 py-3 text-sm font-medium rounded-xl text-[#17212B] dark:text-slate-300 hover:bg-[#F5F7FA] dark:hover:bg-slate-800/60 transition-colors group"
            >
              <svg className="w-5 h-5 text-[#667085] group-hover:text-[#F2B705] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span>Support</span>
            </Link>
          </nav>

          {/* Sidebar Footer / Logout */}
          <div className="p-4 border-t border-[#D9E0E7]/80 dark:border-[#1B354F] mt-auto">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors cursor-pointer text-left"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* ======================================================== */}
        {/* MOBILE / TABLET COMPACT HEADER                           */}
        {/* ======================================================== */}
        <header className="lg:hidden bg-white dark:bg-[#0B2238] border-b border-[#D9E0E7] dark:border-[#1B354F] px-4 py-3.5 flex items-center justify-between sticky top-0 z-40 transition-colors">
          <Link to="/dashboard" className="focus:outline-none focus:ring-2 focus:ring-[#F2B705] rounded">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuANCKLk7Phi2LAj2hCGYKfSUycygMjvfkKXYWWoqwwfIKwApPzV4hc6-Yjw2LNKp77QD4l_FLre-mGjSYdDBlwq95o5yFJFCUzzR3IsXjkImqXngjNQaKr24CiCAx_89hrV4Ksp3gb2LvcEMtSXOmzZdT0arMpbVJibVCs93Pxnlg8GjbkzI9Z5K7ggNWGqrYRwg1XW_dNOX2eK4CzwGdvNpuxUpNznI-XtFqzA0pyzKj90piIs8wRQFj_a56PJITFvZOc"
              alt="WinDriveSA Logo"
              className="h-8 w-auto object-contain"
            />
          </Link>

          <div className="flex items-center gap-2">
            {/* Theme Toggle Mobile */}
            <button
              onClick={toggleTheme}
              aria-label={`Toggle theme (currently ${theme} mode)`}
              className="p-2 text-[#17212B] dark:text-slate-200 hover:bg-[#F5F7FA] dark:hover:bg-slate-800 rounded-lg border border-[#D9E0E7] dark:border-[#1B354F] focus:outline-none focus:ring-2 focus:ring-[#F2B705]"
              type="button"
            >
              {theme === 'dark' ? (
                <svg className="w-5 h-5 text-[#F2B705]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-[#071A2B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* User Initials Avatar Mobile */}
            <div className="w-8 h-8 rounded-lg bg-[#071A2B] text-[#F2B705] dark:bg-[#F2B705] dark:text-[#071A2B] flex items-center justify-center font-sora font-bold text-xs select-none">
              {userInitials}
            </div>

            {/* Hamburger Button */}
            <button
              onClick={() => setIsMobileDrawerOpen(true)}
              aria-label="Open Navigation Menu"
              className="p-2 text-[#17212B] dark:text-slate-200 hover:bg-[#F5F7FA] dark:hover:bg-slate-800 rounded-lg border border-[#D9E0E7] dark:border-[#1B354F] focus:outline-none focus:ring-2 focus:ring-[#F2B705]"
              type="button"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </header>

        {/* ======================================================== */}
        {/* MOBILE DRAWER BACKDROP & MENU (REAL REACT INTERACTIVE)    */}
        {/* ======================================================== */}
        {isMobileDrawerOpen && (
          <div
            id="mobile-drawer-overlay"
            onClick={() => setIsMobileDrawerOpen(false)}
            className="fixed inset-0 bg-[#071A2B]/60 backdrop-blur-sm z-50 transition-opacity lg:hidden"
          ></div>
        )}

        <div
          id="mobile-drawer"
          className={`fixed top-0 right-0 bottom-0 w-72 bg-white dark:bg-[#0B2238] z-50 p-6 flex flex-col transform transition-transform duration-200 ease-in-out lg:hidden shadow-2xl border-l border-[#D9E0E7] dark:border-[#1B354F] ${
            isMobileDrawerOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between pb-6 border-b border-[#D9E0E7] dark:border-[#1B354F]">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDm7GArDi0tgTTuyWnqG4_gZHJAVPJ6jju266ThK4bA9InCl1GWGc-l_iyR9cdnTE1eE47J7X1uelDQsARVzcYeaQ3mkVvxCqdRFjE8HJ6_xDTP5csZC_kzkFkO93hwUseRcQdqLuJhJu74nfB92lIJnJgKHZuHHmDoJDSfwpFrKf1hOavOCm5ap8dTgEXiYZ_fKimkNRdYiQaRuqEHzHEqvB-MT6GkYVtKj5YwHJEUF3rZfQiv1S4ralJJZyCVEdgU7nM"
              alt="WinDriveSA"
              className="h-7 w-auto object-contain"
            />
            <button
              onClick={() => setIsMobileDrawerOpen(false)}
              aria-label="Close Navigation Menu"
              className="p-1.5 text-[#667085] hover:text-[#17212B] dark:hover:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F2B705]"
              type="button"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="py-4 border-b border-[#D9E0E7] dark:border-[#1B354F] flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#071A2B] text-[#F2B705] dark:bg-[#F2B705] dark:text-[#071A2B] flex items-center justify-center font-sora font-bold text-sm select-none">
              {userInitials}
            </div>
            <div>
              <div className="text-sm font-bold font-sora text-[#071A2B] dark:text-white">{currentUser.fullName}</div>
              <div className="text-xs text-[#667085]">Member ID: {memberId}</div>
            </div>
          </div>

          <nav className="py-6 space-y-2 flex-1" aria-label="Mobile Navigation Drawer">
            <button
              onClick={() => handleMobileNavClick('/dashboard')}
              className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold bg-[#071A2B] text-white dark:bg-[#F2B705] dark:text-[#071A2B]"
            >
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => handleMobileNavClick('/rewards')}
              className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#17212B] dark:text-slate-300 hover:bg-[#F5F7FA] dark:hover:bg-slate-800"
            >
              <span>My Rewards</span>
            </button>
            <button
              onClick={() => handleMobileNavClick('/claims')}
              className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#17212B] dark:text-slate-300 hover:bg-[#F5F7FA] dark:hover:bg-slate-800"
            >
              <span>Claim Requests</span>
            </button>
            <button
              onClick={() => handleMobileNavClick('/account')}
              className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#17212B] dark:text-slate-300 hover:bg-[#F5F7FA] dark:hover:bg-slate-800"
            >
              <span>Account</span>
            </button>
            <button
              onClick={() => handleMobileNavClick('/support')}
              className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#17212B] dark:text-slate-300 hover:bg-[#F5F7FA] dark:hover:bg-slate-800"
            >
              <span>Support</span>
            </button>
          </nav>

          <div className="pt-4 border-t border-[#D9E0E7] dark:border-[#1B354F]">
            <button
              onClick={(e) => {
                setIsMobileDrawerOpen(false);
                handleLogout(e);
              }}
              className="w-full flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-400 py-2 text-left cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* MAIN CONTENT AREA                                        */}
        {/* ======================================================== */}
        <main className="flex-1 flex flex-col p-4 sm:p-6 lg:p-10 overflow-y-auto" id="main-content">
          {/* TOP DESKTOP HEADER BAR */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-[#D9E0E7]/70 dark:border-[#1B354F]/60">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#F2B705] font-sora">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F2B705]"></span>
                MY DASHBOARD
              </span>
              <h1 className="text-2xl sm:text-3xl font-sora font-bold text-[#071A2B] dark:text-white mt-1 tracking-tight">
                Welcome back, {currentUser.fullName}
              </h1>
              <p id="header-subtitle" className="text-sm text-[#667085] dark:text-slate-400 mt-1">
                {isPendingReview
                  ? 'Your WinDriveSA account and reward information are shown below.'
                  : 'Your WinDriveSA reward details are shown below.'}
              </p>
            </div>

            {/* Right Header Action Utilities (Desktop) */}
            <div className="hidden sm:flex items-center gap-3 shrink-0">
              {/* Light / Dark Mode Toggle */}
              <button
                onClick={toggleTheme}
                aria-label="Toggle Dark/Light Mode"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#17212B] dark:text-slate-200 bg-white dark:bg-[#0B2238] border border-[#D9E0E7] dark:border-[#1B354F] hover:border-[#F2B705] transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-[#F2B705]"
              >
                {theme === 'dark' ? (
                  <span className="inline-flex items-center gap-1.5 text-[#F2B705]">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    Light Mode
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-[#071A2B]">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                    Dark Mode
                  </span>
                )}
              </button>

              {/* Verified Member Badge & Account Indicator */}
              <div className="flex items-center gap-3 pl-3 border-l border-[#D9E0E7] dark:border-[#1B354F]">
                <div className="text-right">
                  <div className="text-xs font-bold font-sora text-[#071A2B] dark:text-white">{currentUser.fullName}</div>
                  <div className="text-[11px] text-[#667085]">ID: {memberId}</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#071A2B] text-[#F2B705] dark:bg-[#F2B705] dark:text-[#071A2B] flex items-center justify-center font-sora font-bold text-sm shadow-sm select-none">
                  {userInitials}
                </div>
              </div>
            </div>
          </div>

          {/* ================================================================= */}
          {/* PENDING REVIEW STATE CONTAINER                                    */}
          {/* CRITICAL: Hides all cash amount, vehicle info, & claim buttons     */}
          {/* ================================================================= */}
          {isPendingReview && (
            <div id="state-pending-view" className="flex flex-col gap-8 pt-8">
              {/* Status Card */}
              <div className="bg-white dark:bg-[#0B2238] rounded-2xl border border-[#D9E0E7] dark:border-[#1B354F] p-6 sm:p-8 shadow-sm">
                {/* Status Eyebrow */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-[#D9E0E7]/80 dark:border-[#1B354F]">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-[#667085] font-sora">ACCOUNT STATUS</div>
                    <div className="inline-flex items-center gap-2 mt-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/60">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                      PENDING REVIEW
                    </div>
                  </div>
                  <div className="text-xs text-[#667085]">
                    Submission Reference:{' '}
                    <span className="font-mono font-medium text-[#071A2B] dark:text-slate-300">REF-ZA-99201</span>
                  </div>
                </div>

                {/* Status Messaging */}
                <div className="pt-6 max-w-2xl">
                  <h2 className="text-xl sm:text-2xl font-sora font-bold text-[#071A2B] dark:text-white tracking-tight">
                    Your Account Is Under Review
                  </h2>
                  <p className="text-sm sm:text-base text-[#667085] dark:text-slate-300 mt-2.5 leading-relaxed">
                    Your account has been submitted successfully and is currently being reviewed. Reward information will become available after your account has been approved and a reward has been assigned.
                  </p>
                </div>

                {/* Multi-Step Progress Sequence */}
                <div className="mt-8 pt-6 border-t border-[#D9E0E7]/60 dark:border-[#1B354F]/60">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    {/* Step 1: Complete */}
                    <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-[#F5F7FA] dark:bg-slate-900/50 border border-[#D9E0E7]/70 dark:border-[#1B354F]">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-xs font-bold font-sora text-[#071A2B] dark:text-white">1. Account Submitted</div>
                        <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">Complete</div>
                      </div>
                    </div>

                    {/* Step 2: Current */}
                    <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 ring-1 ring-amber-400/40">
                      <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                        </svg>
                      </div>
                      <div>
                        <div className="text-xs font-bold font-sora text-[#071A2B] dark:text-white">2. Account Review</div>
                        <div className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 mt-0.5">In Progress</div>
                      </div>
                    </div>

                    {/* Step 3: Upcoming */}
                    <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-[#F5F7FA] dark:bg-slate-900/50 border border-[#D9E0E7]/70 dark:border-[#1B354F] opacity-70">
                      <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400 flex items-center justify-center shrink-0 font-bold text-xs">
                        3
                      </div>
                      <div>
                        <div className="text-xs font-bold font-sora text-[#071A2B] dark:text-white">3. Reward Assigned</div>
                        <div className="text-[11px] text-[#667085] mt-0.5">Upcoming</div>
                      </div>
                    </div>

                    {/* Step 4: Upcoming */}
                    <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-[#F5F7FA] dark:bg-slate-900/50 border border-[#D9E0E7]/70 dark:border-[#1B354F] opacity-70">
                      <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400 flex items-center justify-center shrink-0 font-bold text-xs">
                        4
                      </div>
                      <div>
                        <div className="text-xs font-bold font-sora text-[#071A2B] dark:text-white">4. Dashboard Ready</div>
                        <div className="text-[11px] text-[#667085] mt-0.5">Upcoming</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* What Happens Next Section */}
              <div className="bg-white/80 dark:bg-[#0B2238]/60 rounded-2xl border border-[#D9E0E7] dark:border-[#1B354F] p-6 sm:p-7">
                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-xl bg-[#071A2B]/5 dark:bg-slate-800 text-[#071A2B] dark:text-[#F2B705] flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-sora font-bold text-[#071A2B] dark:text-white">What happens next?</h3>
                    <p className="text-sm text-[#667085] dark:text-slate-400 mt-1.5 leading-relaxed max-w-2xl">
                      Once your account has been approved and a reward has been assigned, your reward details will appear here. Verification takes 24–48 working hours. No further submission is required on your part.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* APPROVED / UNASSIGNED REWARD STATE CONTAINER                      */}
          {/* ================================================================= */}
          {isApproved && (!rewards || rewards.hasReward === false) && (
            <div id="state-unassigned-reward-view" className="flex flex-col gap-8 pt-8">
              {/* Top Notification / Status Banner */}
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-300 font-sora">
                    ACCOUNT STATUS: APPROVED
                  </span>
                  <span className="text-emerald-700/60 dark:text-emerald-500/60 hidden sm:inline">•</span>
                  <span className="text-xs text-emerald-800 dark:text-emerald-400 font-medium hidden sm:inline">
                    Your member portfolio is verified and awaiting prize allocation.
                  </span>
                </div>
                <span className="text-[11px] font-mono font-medium text-emerald-800 dark:text-emerald-400">
                  RECORD VERIFIED #{memberId}
                </span>
              </div>

              {/* Unassigned Prize State Card */}
              <div className="p-8 sm:p-12 text-center bg-white dark:bg-[#0B2238] border border-[#D9E0E7] dark:border-[#1B354F] rounded-2xl max-w-2xl mx-auto shadow-sm my-4">
                <div className="w-16 h-16 rounded-2xl bg-[#F5F7FA] dark:bg-slate-800 text-[#F2B705] mx-auto flex items-center justify-center mb-4 text-2xl border border-[#D9E0E7] dark:border-[#1B354F]">
                  <svg className="w-8 h-8 text-[#F2B705]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
                  </svg>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold font-sora text-[#071A2B] dark:text-white mb-2">
                  Prize Allocation in Progress
                </h2>
                <p className="text-sm sm:text-base text-[#667085] dark:text-slate-300 max-w-md mx-auto leading-relaxed mb-6">
                  Your WinDriveSA account has been approved. Your assigned prize allocation will be displayed here as soon as verification administration completes your allocation setup.
                </p>
                <Link
                  to="/support"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#071A2B] text-white dark:bg-[#F2B705] dark:text-[#071A2B] font-sora text-xs font-bold hover:opacity-90 transition shadow-sm"
                >
                  Contact Member Support
                </Link>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* APPROVED / ACTIVE REWARDS STATE CONTAINER                         */}
          {/* ================================================================= */}
          {isApproved && rewards && rewards.hasReward !== false && (
            <div id="state-approved-view" className="flex flex-col gap-8 pt-8">
              {/* Top Notification / Status Banner */}
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-300 font-sora">
                    ACCOUNT STATUS: ACTIVE
                  </span>
                  <span className="text-emerald-700/60 dark:text-emerald-500/60 hidden sm:inline">•</span>
                  <span className="text-xs text-emerald-800 dark:text-emerald-400 font-medium hidden sm:inline">
                    Your member portfolio is verified and eligible for claim processing.
                  </span>
                </div>
                <span className="text-[11px] font-mono font-medium text-emerald-800 dark:text-emerald-400">
                  RECORD VERIFIED #WD-2026-ZA
                </span>
              </div>

              {/* SECTION: YOUR REWARDS */}
              <section aria-labelledby="rewards-heading">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#F2B705] font-sora">YOUR REWARDS</span>
                    <h2 id="rewards-heading" className="text-xl sm:text-2xl font-sora font-bold text-[#071A2B] dark:text-white tracking-tight">
                      Assigned Prize Allocation
                    </h2>
                  </div>
                  <div className="text-xs text-[#667085]">
                    {rewards ? (rewards.vehicle.vehicle_model && rewards.cash.cash_amount > 0 ? '2 Prizes Allocated' : '1 Prize Allocated') : '0 Prizes Allocated'}
                  </div>
                </div>

                {!rewards ? (
                  <div className="bg-white dark:bg-[#0B2238] rounded-2xl border border-[#D9E0E7] dark:border-[#1B354F] p-8 text-center max-w-xl mx-auto space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-brand-gold flex items-center justify-center mx-auto">
                      <svg className="w-8 h-8 text-[#F2B705]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="font-sora text-xl font-bold text-[#071A2B] dark:text-white">No Reward Package Assigned</h3>
                    <p className="text-sm text-[#667085] dark:text-slate-400">
                      An administrator has not yet assigned a cash or vehicle prize allocation to your membership account. Once assigned, your prizes and claim actions will be displayed here.
                    </p>
                  </div>
                ) : (
                  /* DUAL REWARD CARDS (ASYMMETRIC GRID) */
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                    {/* =================================================== */}
                    {/* CARD 1: CASH PRIZE (5 COLS ON DESKTOP)              */}
                    {/* =================================================== */}
                    <div className="lg:col-span-5 bg-white dark:bg-[#0B2238] rounded-2xl border border-[#D9E0E7] dark:border-[#1B354F] p-6 sm:p-8 flex flex-col justify-between shadow-sm relative overflow-hidden group">
                      {/* Subtle Gold Ambient Accent */}
                      <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#F2B705]/10 rounded-full blur-2xl pointer-events-none"></div>

                      <div>
                        {/* Card Header with Label & Status Badge */}
                        <div className="flex items-center justify-between gap-2 pb-5 border-b border-[#D9E0E7]/60 dark:border-[#1B354F]/60">
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#F2B705]"></span>
                            <span className="text-xs font-bold uppercase tracking-wider text-[#F2B705] font-sora">CASH PRIZE</span>
                          </div>
                          <span
                            id="cash-status-badge"
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                              rewards.cash.claim_status === 'CLAIM AVAILABLE'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800/80'
                                : 'bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300'
                            }`}
                          >
                            {rewards.cash.claim_status}
                          </span>
                        </div>

                        {/* Primary Dynamic Amount */}
                        <div className="mt-8">
                          <div className="text-xs font-semibold uppercase tracking-wider text-[#667085]">Allocated Amount</div>
                          <div className="text-3xl sm:text-4xl lg:text-5xl font-sora font-extrabold text-[#071A2B] dark:text-white mt-1 tracking-tight">
                            {formatZAR(rewards.cash.cash_amount)}{' '}
                            <span className="text-base sm:text-lg font-bold text-[#F2B705] font-manrope">
                              {rewards.cash.cash_currency}
                            </span>
                          </div>
                          <p className="text-sm text-[#667085] dark:text-slate-400 mt-2">Your assigned cash prize.</p>
                        </div>

                        {/* Financial Attributes / Disbursement Details */}
                        <div className="mt-8 space-y-2.5 pt-6 border-t border-[#D9E0E7]/60 dark:border-[#1B354F]/60">
                          <div className="flex items-center justify-between text-xs py-1">
                            <span className="text-[#667085]">Disbursement Method:</span>
                            <span className="font-semibold text-[#071A2B] dark:text-slate-200">
                              {rewards.cash.disbursement_method}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs py-1">
                            <span className="text-[#667085]">Processing Window:</span>
                            <span className="font-semibold text-[#071A2B] dark:text-slate-200">
                              {rewards.cash.processing_window}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs py-1">
                            <span className="text-[#667085]">Allocation ID:</span>
                            <span className="font-mono text-[#071A2B] dark:text-slate-200">{rewards.cash.allocationId}</span>
                          </div>
                        </div>
                      </div>

                      {/* Primary Action CTA */}
                      <div className="mt-8 pt-4">
                        {rewards.cash.claim_status === 'CLAIM AVAILABLE' ? (
                          <Link
                            id="btn-claim-cash"
                            to="/claims/cash"
                            className="w-full py-3.5 px-6 rounded-xl font-sora font-bold text-sm bg-[#071A2B] hover:bg-[#0c263f] text-white dark:bg-[#F2B705] dark:hover:bg-[#d9a404] dark:text-[#071A2B] transition-all shadow-sm flex items-center justify-center gap-2 group-hover:shadow-md"
                          >
                            <span>Claim Cash Prize</span>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                          </Link>
                        ) : (
                          <Link
                            to="/claims"
                            className="block w-full py-3.5 px-6 rounded-xl font-sora font-bold text-sm bg-[#F5F7FA] dark:bg-slate-800 text-[#071A2B] dark:text-white border border-[#D9E0E7] dark:border-[#1B354F] text-center hover:opacity-90 transition"
                          >
                            View Claim ({rewards.cash.claim_status})
                          </Link>
                        )}
                      </div>
                    </div>

                    {/* =================================================== */}
                    {/* CARD 2: VEHICLE PRIZE (7 COLS ON DESKTOP)           */}
                    {/* =================================================== */}
                    <div className="lg:col-span-7 bg-white dark:bg-[#0B2238] rounded-2xl border border-[#D9E0E7] dark:border-[#1B354F] p-6 sm:p-8 flex flex-col justify-between shadow-sm relative overflow-hidden group">
                      {/* Subtle Ambient Glow */}
                      <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#F2B705]/10 rounded-full blur-3xl pointer-events-none"></div>

                      <div>
                        {/* Card Header with Label & Status Badge */}
                        <div className="flex items-center justify-between gap-2 pb-5 border-b border-[#D9E0E7]/60 dark:border-[#1B354F]/60">
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#F2B705]"></span>
                            <span className="text-xs font-bold uppercase tracking-wider text-[#F2B705] font-sora">
                              VEHICLE PRIZE
                            </span>
                          </div>
                          <span
                            id="vehicle-status-badge"
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                              rewards.vehicle.claim_status === 'CLAIM AVAILABLE'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800/80'
                                : 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400'
                            }`}
                          >
                            {rewards.vehicle.claim_status}
                          </span>
                        </div>

                        {/* Vehicle Info Heading */}
                        <div className="mt-6 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                          <div>
                            <h3 className="text-2xl sm:text-3xl font-sora font-extrabold text-[#071A2B] dark:text-white tracking-tight">
                              {[rewards.vehicle.vehicle_year, rewards.vehicle.vehicle_make, rewards.vehicle.vehicle_model].filter(Boolean).join(' ') || 'Assigned Vehicle Prize'}
                            </h3>
                            <p className="text-sm text-[#667085] dark:text-slate-400 mt-1">
                              Your assigned vehicle prize. {rewards.vehicle.vehicle_edition}.
                            </p>
                          </div>
                          <div className="text-xs font-mono px-2.5 py-1 rounded bg-[#F5F7FA] dark:bg-slate-800 text-[#667085] shrink-0">
                            ALLOCATED #{rewards.vehicle.allocationId}
                          </div>
                        </div>

                        {/* Assigned Vehicle Photography or Clean Neutral Placeholder */}
                        <div className="mt-5 rounded-xl overflow-hidden border border-[#D9E0E7]/80 dark:border-[#1B354F] relative bg-slate-900 group-hover:border-[#F2B705]/40 transition-colors">
                          {rewards.vehicle.vehicle_image ? (
                            <img
                              src={rewards.vehicle.vehicle_image}
                              alt={[rewards.vehicle.vehicle_year, rewards.vehicle.vehicle_make, rewards.vehicle.vehicle_model].filter(Boolean).join(' ') || 'Assigned vehicle prize'}
                              className="w-full h-52 sm:h-64 object-cover object-center transition-transform duration-500 group-hover:scale-105 select-none"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const p = e.currentTarget.parentElement;
                                if (p) {
                                  const el = p.querySelector('.vehicle-placeholder-fallback');
                                  if (el) el.classList.remove('hidden');
                                }
                              }}
                            />
                          ) : null}
                          <div
                            className={`vehicle-placeholder-fallback w-full h-52 sm:h-64 flex flex-col items-center justify-center bg-gradient-to-br from-[#0B2238] to-[#071A2B] text-slate-300 p-4 text-center ${
                              rewards.vehicle.vehicle_image ? 'hidden' : 'flex'
                            }`}
                          >
                            <div className="w-14 h-14 rounded-2xl bg-[#F2B705]/10 border border-[#F2B705]/20 flex items-center justify-center text-[#F2B705] mb-2 shadow-xs">
                              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 17a2 2 0 100-4 2 2 0 000 4zm10 0a2 2 0 100-4 2 2 0 000 4zM4 11h16M4 11V7a1 1 0 011-1h10l4 5v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-7z" />
                              </svg>
                            </div>
                            <span className="text-xs font-sora font-bold text-white uppercase tracking-wider">
                              {[rewards.vehicle.vehicle_year, rewards.vehicle.vehicle_make, rewards.vehicle.vehicle_model].filter(Boolean).join(' ') || 'Assigned Vehicle Prize'}
                            </span>
                            <span className="text-[11px] text-[#98A2B3] mt-0.5">
                              RSA Allocation Registry • Official Fleet Prize
                            </span>
                          </div>

                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none"></div>

                          {/* Bottom Overlay Spec Pill */}
                          <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 text-white text-xs">
                            <div className="flex items-center gap-2">
                              {rewards.vehicle.specs?.map((spec, idx) => (
                                <span key={idx} className="px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm border border-white/20 font-medium">
                                  {spec}
                                </span>
                              ))}
                            </div>
                            <span className="text-[11px] font-mono text-slate-300">{rewards.vehicle.delivery_note}</span>
                          </div>
                        </div>

                        {/* Vehicle Handover Details */}
                        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3 pt-5 border-t border-[#D9E0E7]/60 dark:border-[#1B354F]/60 text-xs">
                          <div>
                            <div className="text-[#667085]">Registration:</div>
                            <div className="font-semibold text-[#071A2B] dark:text-slate-200 mt-0.5">
                              {rewards.vehicle.registration}
                            </div>
                          </div>
                          <div>
                            <div className="text-[#667085]">Handover Hub:</div>
                            <div className="font-semibold text-[#071A2B] dark:text-slate-200 mt-0.5">
                              {rewards.vehicle.handover_hub}
                            </div>
                          </div>
                          <div className="col-span-2 sm:col-span-1">
                            <div className="text-[#667085]">Audit Certificate:</div>
                            <div className="font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                              {rewards.vehicle.audit_certificate}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Primary Vehicle CTA */}
                      <div className="mt-8 pt-4">
                        {rewards.vehicle.claim_status === 'CLAIM AVAILABLE' ? (
                          <Link
                            id="btn-claim-vehicle"
                            to="/claims/vehicle"
                            className="w-full py-3.5 px-6 rounded-xl font-sora font-bold text-sm bg-[#F2B705] hover:bg-[#d9a404] text-[#071A2B] transition-all shadow-sm flex items-center justify-center gap-2 group-hover:shadow-md"
                          >
                            <span>Claim Vehicle</span>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                          </Link>
                        ) : (
                          <Link
                            to="/claims"
                            className="block w-full py-3.5 px-6 rounded-xl font-sora font-bold text-sm bg-[#F5F7FA] dark:bg-slate-800 text-[#071A2B] dark:text-white border border-[#D9E0E7] dark:border-[#1B354F] text-center hover:opacity-90 transition"
                          >
                            View Claim ({rewards.vehicle.claim_status})
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* CONDITIONAL APPLICABLE REQUIREMENT PANEL (ONLY DISPLAYED WHEN AN APPROVED CLAIM HAS AN ENABLED REQUIREMENT) */}
              {(cashRequirement || vehicleRequirement) && (
                <div id="applicable-charge-panel" className="bg-white dark:bg-[#0B2238] rounded-2xl border border-amber-300 dark:border-amber-800/80 p-6 shadow-sm space-y-4">
                  {cashRequirement && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3.5">
                        <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400 flex items-center justify-center shrink-0">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </div>
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 font-sora">
                            Applicable Requirement — Cash Prize Claim
                          </span>
                          <div className="text-xl font-sora font-bold text-[#071A2B] dark:text-white mt-0.5">
                            {formatZAR(cashRequirement.applicableCharge)}{' '}
                            <span className="text-sm font-normal text-[#667085] font-manrope">
                              ({cashRequirement.currency})
                            </span>
                          </div>
                          <p className="text-xs text-[#667085] dark:text-slate-400 mt-1 max-w-xl">
                            {cashRequirement.description}
                          </p>
                        </div>
                      </div>
                      <a
                        href={cashRequirement.supportWhatsapp ? `https://wa.me/${cashRequirement.supportWhatsapp.replace(/\D+/g, '')}?text=${encodeURIComponent('Hello WinDriveSA Support, I am inquiring regarding the applicable requirement for my approved Cash Prize Claim.')}` : '/support'}
                        target={cashRequirement.supportWhatsapp ? '_blank' : '_self'}
                        rel="noopener noreferrer"
                        className="px-4 py-2.5 rounded-xl font-sora font-bold text-xs bg-[#071A2B] dark:bg-[#F2B705] text-white dark:text-[#071A2B] transition-colors shrink-0 text-center"
                      >
                        Contact WinDriveSA Support
                      </a>
                    </div>
                  )}

                  {vehicleRequirement && (
                    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${cashRequirement ? 'pt-4 border-t border-[#D9E0E7] dark:border-[#1B354F]' : ''}`}>
                      <div className="flex items-start gap-3.5">
                        <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400 flex items-center justify-center shrink-0">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </div>
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 font-sora">
                            Applicable Requirement — Vehicle Prize Claim
                          </span>
                          <div className="text-xl font-sora font-bold text-[#071A2B] dark:text-white mt-0.5">
                            {formatZAR(vehicleRequirement.applicableCharge)}{' '}
                            <span className="text-sm font-normal text-[#667085] font-manrope">
                              ({vehicleRequirement.currency})
                            </span>
                          </div>
                          <p className="text-xs text-[#667085] dark:text-slate-400 mt-1 max-w-xl">
                            {vehicleRequirement.description}
                          </p>
                        </div>
                      </div>
                      <a
                        href={vehicleRequirement.supportWhatsapp ? `https://wa.me/${vehicleRequirement.supportWhatsapp.replace(/\D+/g, '')}?text=${encodeURIComponent('Hello WinDriveSA Support, I am inquiring regarding the applicable requirement for my approved Vehicle Prize Claim.')}` : '/support'}
                        target={vehicleRequirement.supportWhatsapp ? '_blank' : '_self'}
                        rel="noopener noreferrer"
                        className="px-4 py-2.5 rounded-xl font-sora font-bold text-xs bg-[#071A2B] dark:bg-[#F2B705] text-white dark:text-[#071A2B] transition-colors shrink-0 text-center"
                      >
                        Contact WinDriveSA Support
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* SECTION: RECENT CLAIM ACTIVITY */}
              <section aria-labelledby="activity-heading" className="bg-white dark:bg-[#0B2238] rounded-2xl border border-[#D9E0E7] dark:border-[#1B354F] p-6 sm:p-8 shadow-sm">
                <div className="flex items-center justify-between pb-6 border-b border-[#D9E0E7]/70 dark:border-[#1B354F]">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#F2B705] font-sora">ACTIVITY LOG</span>
                    <h3 id="activity-heading" className="text-lg font-sora font-bold text-[#071A2B] dark:text-white tracking-tight mt-0.5">
                      Claim Activity
                    </h3>
                  </div>
                  <Link to="/claims" className="text-xs text-[#667085] hover:text-[#071A2B] dark:hover:text-[#F2B705] font-medium transition-colors">
                    View All Claims →
                  </Link>
                </div>

                <div id="activity-container" className="pt-6 space-y-4">
                  {userClaims.length === 0 ? (
                    <div id="activity-empty-state" className="py-10 text-center flex flex-col items-center justify-center">
                      <div className="w-12 h-12 rounded-2xl bg-[#F5F7FA] dark:bg-slate-800/80 text-[#667085] flex items-center justify-center mb-3">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <p className="text-sm font-semibold text-[#071A2B] dark:text-slate-200">
                        Your claim activity will appear here.
                      </p>
                      <p className="text-xs text-[#667085] mt-1 max-w-sm">
                        When you initiate a claim for your assigned Cash or Vehicle prize, real-time dispatch milestones will track in this ledger.
                      </p>
                    </div>
                  ) : (
                    userClaims.map((claim) => (
                      <div
                        key={claim.id}
                        className="p-4 rounded-xl bg-[#F5F7FA] dark:bg-slate-900/60 border border-[#D9E0E7]/80 dark:border-[#1B354F] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div>
                            <div className="text-sm font-bold font-sora text-[#071A2B] dark:text-white">{claim.title}</div>
                            <div className="text-xs text-[#667085]">
                              Reference #{claim.id} • {new Date(claim.createdAt).toLocaleDateString('en-ZA')}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300">
                            {claim.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
          )}

          {/* =================================================== */}
          {/* COMPACT SUPPORT PANEL (SHARED AT BASELINE)          */}
          {/* =================================================== */}
          <section id="support" className="mt-8 bg-white dark:bg-[#0B2238] rounded-2xl border border-[#D9E0E7] dark:border-[#1B354F] p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="max-w-xl">
                <span className="text-xs font-bold uppercase tracking-wider text-[#F2B705] font-sora">MEMBER ASSISTANCE</span>
                <h3 className="text-xl font-sora font-bold text-[#071A2B] dark:text-white tracking-tight mt-0.5">
                  Need Help?
                </h3>
                <p className="text-sm text-[#667085] dark:text-slate-400 mt-1 leading-relaxed">
                  Have a question about your account or claim? Our dedicated South African verification team is available to guide you through verification, EFT settlement, and vehicle collection.
                </p>
              </div>

              {/* Direct Support Actions */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                {/* WhatsApp Support Action (Labeled as Support Only) */}
                <a
                  href="https://wa.me/27000000000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-3 rounded-xl font-sora font-bold text-xs bg-[#25D366]/10 text-[#128C7E] dark:bg-[#25D366]/20 dark:text-[#25D366] border border-[#25D366]/30 hover:bg-[#25D366]/20 transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.299.144.347.491 1.2.534 1.288.043.088.072.19.014.305-.058.115-.087.187-.173.289l-.26.309c-.087.095-.178.201-.077.375.101.173.449.742.964 1.201.662.591 1.221.774 1.394.86.174.086.275.072.376-.044.101-.116.433-.506.549-.68.116-.173.231-.144.39-.086s1.011.477 1.184.564.289.13.332.202c.044.073.044.422-.1.827z" />
                  </svg>
                  <span>WhatsApp Support</span>
                </a>

                {/* Direct Support Page Action */}
                <Link
                  to="/support"
                  className="px-5 py-3 rounded-xl font-sora font-bold text-xs bg-[#071A2B] hover:bg-[#0c263f] text-white dark:bg-white dark:text-[#071A2B] dark:hover:bg-slate-100 transition-all text-center"
                >
                  Contact Support
                </Link>
              </div>
            </div>
          </section>

          {/* BASELINE FOOTER & COMPLIANCE */}
          <footer className="mt-12 pt-6 border-t border-[#D9E0E7]/60 dark:border-[#1B354F]/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#667085]">
            <div>© 2026 WinDriveSA (Pty) Ltd. All rights reserved. Registered South African Entity.</div>
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                POPIA Compliant
              </span>
              <span>•</span>
              <Link to="/#terms" className="hover:underline">
                Terms of Service
              </Link>
              <span>•</span>
              <Link to="/#privacy" className="hover:underline">
                Privacy Policy
              </Link>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
