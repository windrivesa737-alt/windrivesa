import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { getUserReward, formatZAR } from '../../services/rewards';
import {
  createCashClaim,
  getClaimsForCurrentUser,
  normalizeClaimStatus,
} from '../../services/claims';

export default function CashPrizeClaim() {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { user: authUser, profile, loading: authLoading, logout } = useAuth();

  // Local component states
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [realReward, setRealReward] = useState(null);
  const [realClaim, setRealClaim] = useState(null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    accountHolder: '',
    bankName: '',
    accountNumber: '',
    accountType: '',
    branchCode: '',
  });

  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [submittedClaimData, setSubmittedClaimData] = useState(null);

  // Load real user reward and claims
  useEffect(() => {
    let isMounted = true;

    async function loadCashData() {
      if (!authUser?.id) return;
      setIsDataLoading(true);

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
          const cashC = claimsRes.data.find((c) =>
            (c.claim_type || c.type || '').toUpperCase().includes('CASH')
          );
          if (cashC) {
            setRealClaim(cashC);
          }
        }
      } catch (err) {
        console.error('Error loading cash claim data:', err);
      } finally {
        if (isMounted) {
          setIsDataLoading(false);
        }
      }
    }

    if (authUser?.id) {
      loadCashData();
      setFormData((prev) => ({
        ...prev,
        accountHolder: prev.accountHolder || profile?.full_name || authUser?.user_metadata?.full_name || '',
      }));
    }

    return () => {
      isMounted = false;
    };
  }, [authUser?.id, profile?.full_name, authUser?.user_metadata?.full_name]);

  // Derived user values
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

  const memberId = currentUser.memberId;

  // Account status check
  const isAccountPending = profile?.account_status === 'PENDING_REVIEW';

  // Reward and active claim query
  const rawCashAmount = Number(realReward?.cash_amount ?? realReward?.cashAmount ?? 0);
  const hasCashPrize = Boolean(realReward && rawCashAmount > 0);
  const cashReward = hasCashPrize
    ? {
        id: realReward.id,
        allocationId: `WD-CP-${realReward.id?.slice(0, 5).toUpperCase() || '77402'}`,
        cash_amount: rawCashAmount,
        cash_currency: realReward.cash_currency || realReward.currency || 'ZAR',
        disbursement_method: 'EFT (Verified SA Bank)',
        processing_window: '2–3 Business Days',
        reward_status: realReward.status || 'ACTIVE',
        claim_status: realClaim ? normalizeClaimStatus(realClaim.status) : 'CLAIM AVAILABLE',
      }
    : null;

  const existingCashClaim = realClaim || null;

  // Mask mobile number for confirmation privacy (e.g. +27 ••••••••89)
  const formatMaskedMobile = (mobile) => {
    if (!mobile) return '+27 ••••••••89';
    const clean = mobile.replace(/\s+/g, '');
    const last2 = clean.slice(-2);
    return `+27 ••••••••${last2}`;
  };

  // Form validation
  const validate = () => {
    const newErrors = {};

    if (!formData.accountHolder.trim()) {
      newErrors.accountHolder = 'This field is required. Please enter registered name.';
    }

    if (!formData.bankName) {
      newErrors.bankName = 'Please select an authorized South African financial institution.';
    }

    const cleanAccNum = formData.accountNumber.trim();
    if (!cleanAccNum || cleanAccNum.length < 8 || cleanAccNum.length > 11 || !/^\d+$/.test(cleanAccNum)) {
      newErrors.accountNumber = 'Enter a valid 8 to 11 digit account number.';
    }

    if (!formData.accountType) {
      newErrors.accountType = 'Please select an account type.';
    }

    const cleanBranch = formData.branchCode.trim();
    if (!cleanBranch || cleanBranch.length < 5 || cleanBranch.length > 6 || !/^\d+$/.test(cleanBranch)) {
      newErrors.branchCode = 'Enter a valid 6-digit universal branch code.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for field once user types
    if (errors[field]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await createCashClaim({
        profileId: currentUser.id,
        rewardId: cashReward?.id || cashReward?.allocationId,
        fullName: formData.accountHolder,
        bankName: formData.bankName,
        accountNumber: formData.accountNumber,
        accountType: formData.accountType,
        branchCode: formData.branchCode,
      });

      if (!res.success) {
        setSubmitError(res.error || 'A claim for this prize is already in progress.');
        setIsSubmitting(false);
        return;
      }

      setSubmittedClaimData(res.claim || res.data);
      setRealClaim(res.claim || res.data);
      setSubmissionSuccess(true);
    } catch (err) {
      setSubmitError('Unable to process your cash settlement claim at this time. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async (e) => {
    if (e) e.preventDefault();
    await logout();
    navigate('/login', { replace: true });
  };

  // Determine current display state:
  const isAlreadySubmitted = Boolean(existingCashClaim && !submissionSuccess);
  const isJustConfirmed = Boolean(submissionSuccess);

  // Authentication & Initial Loading Screen
  if (authLoading || (isDataLoading && !realReward)) {
    return (
      <div className="min-h-screen bg-[#F7F9FF] dark:bg-[#040E18] flex items-center justify-center font-manrope">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#0A1D2E]/20 dark:border-white/20 border-t-[#F2B705] rounded-full animate-spin"></div>
          <span className="text-xs font-semibold text-[#44474C] dark:text-gray-400 tracking-wider uppercase font-sora">
            Loading Cash Claim Details…
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F7F9FF] text-[#121C26] dark:bg-[#040E18] dark:text-[#E2E8F0] font-manrope min-h-screen flex flex-col antialiased transition-colors duration-200 selection:bg-[#F2B705] selection:text-[#071A2B]">
      {/* ======================================================== */}
      {/* MOBILE / TABLET COMPACT AUTHENTICATED HEADER             */}
      {/* ======================================================== */}
      <header className="lg:hidden bg-white dark:bg-[#0B2238] border-b border-[#D9E3F1] dark:border-[#1B354F] px-4 py-3.5 flex items-center justify-between sticky top-0 z-40 transition-colors shadow-sm">
        <Link to="/dashboard" className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#F2B705] rounded">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBFRQgchr4sBKzIBKD6fAkVfHFoQVYkRzTX3nqXV9KQAQ46bZBTriAHTm12vs6o9bbhBRDR_IyfPC4AukQcj-j3Y3GroVPxfXY365C1Grh6hyPOBEo__bmfFDg90EDCUyKoPZIKAbCRRbFIioWOIetaI5Nw-qpRNMsHBBlvcgLJ6eeEamYVcOdm-VtLc4R_7xgseVzpm5jA1-d6tsLBzet_QSKypzCUqrHL4jNXg_1ylOXQFeJGADJ9pVrGvLM_Jv5G0CQ"
            alt="WinDriveSA Logo"
            className="h-7 w-auto object-contain"
          />
          <span className="font-sora text-sm font-bold text-[#121C26] dark:text-white">WinDriveSA</span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Theme Toggle Mobile */}
          <button
            onClick={toggleTheme}
            aria-label={`Toggle theme (currently ${theme} mode)`}
            className="w-10 h-10 rounded-lg flex items-center justify-center text-[#44474C] dark:text-slate-300 hover:bg-[#EDF4FF] dark:hover:bg-slate-800 transition-colors border border-[#D9E3F1] dark:border-[#1B354F]"
            type="button"
          >
            {theme === 'dark' ? (
              <svg className="w-5 h-5 text-[#F2B705]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-[#121C26]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          {/* User Avatar */}
          <div className="w-8 h-8 rounded-lg bg-[#0A1D2E] text-[#F2B705] dark:bg-[#F2B705] dark:text-[#0A1D2E] flex items-center justify-center font-sora font-bold text-xs select-none">
            {userInitials}
          </div>

          {/* Hamburger Drawer Toggle */}
          <button
            onClick={() => setIsMobileDrawerOpen(true)}
            aria-label="Open navigation menu"
            className="w-10 h-10 rounded-lg flex items-center justify-center text-[#121C26] dark:text-slate-200 bg-[#EDF4FF] dark:bg-slate-800 hover:bg-[#DFE9F7] dark:hover:bg-slate-700 transition-colors"
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
          onClick={() => setIsMobileDrawerOpen(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
        ></div>
      )}

      <div
        className={`fixed top-0 right-0 bottom-0 w-72 max-w-[85vw] bg-white dark:bg-[#0B2238] shadow-2xl z-50 p-6 flex flex-col justify-between transform transition-transform duration-200 ease-in-out lg:hidden border-l border-[#D9E3F1] dark:border-[#1B354F] ${
          isMobileDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#D9E3F1] dark:border-[#1B354F]">
            <div className="flex items-center gap-2">
              <img
                alt="WinDriveSA Logo"
                className="h-6 w-auto object-contain"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBpFp3jqR2PRzsM1meOeBUtHY0GbheA-lmRnxzSsHU2gqZobUmaON0N3TrEQhpWwrpuo6EYI4Cm_VExhBBMBQAWyDmU1WprFg0TfV0oyhWhXuOtW_0HqHJTJtzbF_n-84LEkEgIlkJw-5QgW_UcL7Domu9lh2c-4W_xb9oCE1OoyH2fvIlBjwNEdqwJRLV28KJ5bTHR4jN4l43tOzCte1T_VAy-HifFlHpHwvmMEI9WYd8pQqWDhVdWWwOU1_IxnOZHwg8"
              />
              <span className="font-sora text-sm font-bold text-[#121C26] dark:text-white">WinDriveSA</span>
            </div>
            <button
              aria-label="Close navigation menu"
              className="w-9 h-9 rounded-lg flex items-center justify-center text-[#44474C] dark:text-slate-300 hover:bg-[#EDF4FF] dark:hover:bg-slate-800 transition-colors"
              onClick={() => setIsMobileDrawerOpen(false)}
              type="button"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-3 p-3 bg-[#EDF4FF] dark:bg-slate-900/60 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-[#0A1D2E] text-[#F2B705] dark:bg-[#F2B705] dark:text-[#0A1D2E] font-sora flex items-center justify-center font-bold text-sm">
              {userInitials}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-sora text-sm text-[#121C26] dark:text-white font-semibold truncate">
                {currentUser.fullName}
              </span>
              <span className="text-[11px] text-[#44474C] dark:text-slate-400 uppercase font-semibold">
                Tier 1 RSA Citizen
              </span>
            </div>
          </div>

          <nav className="flex flex-col gap-1.5" aria-label="Mobile Navigation Drawer">
            <Link
              to="/dashboard"
              onClick={() => setIsMobileDrawerOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#44474C] dark:text-slate-300 hover:text-[#121C26] hover:bg-[#EDF4FF] dark:hover:bg-slate-800 transition-colors text-sm"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>Dashboard</span>
            </Link>

            <Link
              to="/rewards"
              onClick={() => setIsMobileDrawerOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#44474C] dark:text-slate-300 hover:text-[#121C26] hover:bg-[#EDF4FF] dark:hover:bg-slate-800 transition-colors text-sm"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>My Rewards</span>
            </Link>

            <Link
              to="/claims"
              onClick={() => setIsMobileDrawerOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#0A1D2E] text-white dark:bg-[#F2B705] dark:text-[#0A1D2E] font-sora text-sm shadow-sm font-semibold"
            >
              <svg className="w-5 h-5 text-[#F2B705] dark:text-[#0A1D2E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Claim Requests</span>
            </Link>

            <Link
              to="/account"
              onClick={() => setIsMobileDrawerOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#44474C] dark:text-slate-300 hover:text-[#121C26] hover:bg-[#EDF4FF] dark:hover:bg-slate-800 transition-colors text-sm"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Account</span>
            </Link>

            <Link
              to="/support"
              onClick={() => setIsMobileDrawerOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#44474C] dark:text-slate-300 hover:text-[#121C26] hover:bg-[#EDF4FF] dark:hover:bg-slate-800 transition-colors text-sm"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span>Support</span>
            </Link>
          </nav>
        </div>

        <div className="flex flex-col gap-3 pt-6 border-t border-[#D9E3F1] dark:border-[#1B354F]">
          <div className="p-2.5 bg-[#EDF4FF] dark:bg-slate-900/60 rounded-lg flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-bold uppercase tracking-wider">
              POPIA Verified RSA
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors text-sm text-left cursor-pointer"
            type="button"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MAIN PORTAL SHELL (SIDEBAR + CONTENT WORKSPACE)          */}
      {/* ======================================================== */}
      <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row px-4 sm:px-6 lg:px-10 py-8 gap-8 flex-1">
        {/* ======================================================== */}
        {/* AUTHENTICATED DESKTOP SIDEBAR                            */}
        {/* ======================================================== */}
        <aside
          aria-label="Authenticated Navigation Sidebar"
          className="hidden lg:flex w-64 shrink-0 flex-col gap-6 self-start sticky top-6 select-none"
        >
          <div className="bg-white dark:bg-[#0B2238] p-6 rounded-2xl shadow-sm flex flex-col justify-between min-h-[640px] border border-[#D9E3F1]/80 dark:border-[#1B354F]">
            <div className="flex flex-col gap-6">
              {/* Logo Section */}
              <div className="flex items-center gap-3 pb-4 border-b border-[#D9E3F1] dark:border-[#1B354F]">
                <img
                  alt="WinDriveSA Logo"
                  className="h-8 w-auto object-contain"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAlLGQoZxgwaJcjA0zlC_6qjJUCb7dYYil3pptVHpNC8Zy9V92RTUmZOPiJLjL9oih1EMQPUS5J5tS5jd-HDAztznKzs7ONHl3R3q6IFsj5jOSgck0t9QuT_4FfaBFz0YNBaBFlhDnnvuUoesRbRcEuBrsvNPGmZzza2SoDHwBnlIwxcP5_FjArsvLPcpkufFv5lDD3kS3B9sAVCot0XabUT81wEss08FJZkpTXa0VEI-PWitQBPokxBzqUJfXg5oDMQb8"
                />
                <div className="flex flex-col">
                  <span className="font-sora text-sm font-bold text-[#121C26] dark:text-white tracking-tight">WinDriveSA</span>
                  <span className="text-[10px] text-[#785900] dark:text-[#F2B705] font-bold uppercase tracking-wider">
                    Institutional
                  </span>
                </div>
              </div>

              {/* User Member Card */}
              <div className="flex items-center gap-3 p-3 bg-[#EDF4FF] dark:bg-slate-900/60 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-[#0A1D2E] text-[#F2B705] dark:bg-[#F2B705] dark:text-[#0A1D2E] font-sora flex items-center justify-center font-bold text-sm shadow-sm">
                  {userInitials}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-sora text-sm text-[#121C26] dark:text-white font-semibold truncate">
                    {currentUser.fullName}
                  </span>
                  <span className="text-[11px] text-[#44474C] dark:text-slate-400 uppercase tracking-wider">
                    RSA Citizen • Tier 1
                  </span>
                </div>
              </div>

              {/* Navigation Items */}
              <nav aria-label="Authenticated Navigation" className="flex flex-col gap-1.5">
                <Link
                  to="/dashboard"
                  className="flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-[#44474C] dark:text-slate-300 hover:text-[#121C26] hover:bg-[#EDF4FF] dark:hover:bg-slate-800/60 transition-colors text-sm font-medium"
                >
                  <svg className="w-5 h-5 text-[#74777D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span>Dashboard</span>
                </Link>

                <Link
                  to="/rewards"
                  className="flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-[#44474C] dark:text-slate-300 hover:text-[#121C26] hover:bg-[#EDF4FF] dark:hover:bg-slate-800/60 transition-colors text-sm font-medium"
                >
                  <svg className="w-5 h-5 text-[#74777D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>My Rewards</span>
                </Link>

                {/* Claim Requests (Active) */}
                <Link
                  to="/claims"
                  className="flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl bg-[#0A1D2E] text-white dark:bg-[#F2B705] dark:text-[#0A1D2E] font-sora text-sm shadow-sm font-semibold"
                >
                  <svg className="w-5 h-5 text-[#F2B705] dark:text-[#0A1D2E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Claim Requests</span>
                </Link>

                <Link
                  to="/account"
                  className="flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-[#44474C] dark:text-slate-300 hover:text-[#121C26] hover:bg-[#EDF4FF] dark:hover:bg-slate-800/60 transition-colors text-sm font-medium"
                >
                  <svg className="w-5 h-5 text-[#74777D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Account</span>
                </Link>

                <Link
                  to="/support"
                  className="flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-[#44474C] dark:text-slate-300 hover:text-[#121C26] hover:bg-[#EDF4FF] dark:hover:bg-slate-800/60 transition-colors text-sm font-medium"
                >
                  <svg className="w-5 h-5 text-[#74777D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span>Support</span>
                </Link>
              </nav>
            </div>

            {/* Sidebar Bottom Badging & Logout */}
            <div className="flex flex-col gap-3 pt-6 border-t border-[#D9E3F1] dark:border-[#1B354F]">
              <div className="p-3 bg-[#EDF4FF] dark:bg-slate-900/60 rounded-xl flex items-center gap-2.5">
                <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <div className="flex flex-col">
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-bold uppercase tracking-wider">
                    POPIA Verified
                  </span>
                  <span className="text-[11px] text-[#44474C] dark:text-slate-400">RSA Identity Guard</span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-sm font-medium text-left cursor-pointer"
                type="button"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </aside>

        {/* ======================================================== */}
        {/* MAIN DYNAMIC CONTENT WORKSPACE                           */}
        {/* ======================================================== */}
        <main className="flex-1 flex flex-col gap-6 min-w-0" id="main-content">
          {/* Back Action and Breadcrumbs Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#44474C] dark:text-slate-300 hover:text-[#121C26] dark:hover:text-white transition-colors group"
            >
              <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Dashboard</span>
            </Link>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              {/* Theme Toggle Desktop */}
              <button
                onClick={toggleTheme}
                aria-label="Toggle Dark/Light Mode"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#121C26] dark:text-slate-200 bg-white dark:bg-[#0B2238] border border-[#D9E3F1] dark:border-[#1B354F] hover:border-[#F2B705] transition-colors shadow-sm focus:outline-none"
              >
                {theme === 'dark' ? (
                  <span className="inline-flex items-center gap-1.5 text-[#F2B705]">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    Light
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-[#121C26]">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                    Dark
                  </span>
                )}
              </button>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#DFE9F7] dark:bg-slate-800 text-[#121C26] dark:text-slate-200 text-[11px] font-bold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Institutional Escrow Active
              </span>
            </div>
          </div>

          {/* Page Title & Identification */}
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-bold text-[#785900] dark:text-[#F2B705] tracking-widest uppercase font-sora">
              CASH PRIZE CLAIM
            </span>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-sora font-bold text-[#121C26] dark:text-white tracking-tight">
              Claim Your Cash Prize
            </h1>
            <p className="text-sm sm:text-base text-[#44474C] dark:text-slate-400 max-w-2xl">
              Submit verified South African bank details so your allocated cash disbursement can proceed through institutional compliance.
            </p>
          </div>

          {/* Conditional Content: Pending Approval, No Reward Allocated, or Claim Form/Status */}
          {isAccountPending ? (
            <div className="bg-white dark:bg-[#0B2238] rounded-xl p-8 shadow-sm border border-[#D9E3F1] dark:border-[#1B354F] flex flex-col items-center text-center gap-4 max-w-2xl mx-auto">
              <div className="w-14 h-14 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="font-sora text-xl sm:text-2xl font-bold text-[#121C26] dark:text-white">
                Account Verification Pending
              </h2>
              <p className="text-sm text-[#44474C] dark:text-slate-300 leading-relaxed max-w-md">
                Your member account is currently undergoing mandatory compliance verification. Cash prize details and claim submissions will become accessible once your account has been approved and activated.
              </p>
              <Link
                to="/dashboard"
                className="mt-2 px-6 py-2.5 bg-[#071A2B] hover:bg-[#0e2740] dark:bg-[#F2B705] dark:hover:bg-[#dfa704] text-white dark:text-[#071A2B] font-sora text-sm rounded font-bold transition-colors"
              >
                Return to Dashboard
              </Link>
            </div>
          ) : !cashReward || cashReward.reward_status === 'NOT ASSIGNED' ? (
            <div className="bg-white dark:bg-[#0B2238] rounded-xl p-8 shadow-sm border border-[#D9E3F1] dark:border-[#1B354F] flex flex-col items-center text-center gap-4 max-w-2xl mx-auto">
              <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 text-[#667085] dark:text-slate-400 flex items-center justify-center">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="font-sora text-xl sm:text-2xl font-bold text-[#121C26] dark:text-white">
                No Cash Reward Assigned
              </h2>
              <p className="text-sm text-[#44474C] dark:text-slate-300 leading-relaxed max-w-md">
                There is currently no cash reward allocated to your membership account. Check back after an administrator assigns your prize or review your active rewards.
              </p>
              <Link
                to="/dashboard"
                className="mt-2 px-6 py-2.5 bg-[#071A2B] hover:bg-[#0e2740] dark:bg-[#F2B705] dark:hover:bg-[#dfa704] text-white dark:text-[#071A2B] font-sora text-sm rounded font-bold transition-colors"
              >
                Return to Dashboard
              </Link>
            </div>
          ) : (
            <>
          {/* ================================================================= */}
          {/* STATE 1: ACTIVE CLAIM FORM VIEW (DEFAULT / FORM STATE)            */}
          {/* ================================================================= */}
          {!isJustConfirmed && !isAlreadySubmitted && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start" id="state-claim-form">
              {/* LEFT COLUMN: Restrained Financial Claim Summary (5 Cols) */}
              <section aria-label="Prize Allocation Summary" className="lg:col-span-5 flex flex-col gap-6">
                <div className="bg-white dark:bg-[#0B2238] p-6 sm:p-7 rounded-2xl shadow-sm flex flex-col gap-6 border border-[#D9E3F1]/80 dark:border-[#1B354F]">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#44474C] dark:text-slate-400 uppercase tracking-wider font-sora">
                      YOUR CASH PRIZE
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/80 text-[11px] font-bold uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Claim Available
                    </span>
                  </div>

                  {/* Grand Value Display */}
                  <div className="flex flex-col bg-[#EDF4FF] dark:bg-slate-900/60 p-5 rounded-xl border border-[#D9E3F1]/60 dark:border-[#1B354F]/60">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#44474C] dark:text-slate-400">
                      Allocated Net Pay
                    </span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-3xl sm:text-4xl font-sora font-bold text-[#121C26] dark:text-white tabular-nums tracking-tight">
                        {formatZAR(cashReward.cash_amount)}
                      </span>
                      <span className="text-sm sm:text-base font-sora font-bold text-[#785900] dark:text-[#F2B705]">
                        {cashReward.cash_currency}
                      </span>
                    </div>
                    <p className="text-xs text-[#44474C] dark:text-slate-400 mt-1">
                      Assigned cash prize • Full institutional guarantee
                    </p>
                  </div>

                  {/* Verification Metadata Ledger */}
                  <div className="flex flex-col divide-y divide-[#D9E3F1] dark:divide-[#1B354F] text-xs">
                    <div className="py-3 flex items-center justify-between">
                      <span className="text-[#44474C] dark:text-slate-400">Allocation ID</span>
                      <span className="font-mono font-semibold text-[#121C26] dark:text-slate-200">
                        {cashReward.allocationId}
                      </span>
                    </div>
                    <div className="py-3 flex items-center justify-between">
                      <span className="text-[#44474C] dark:text-slate-400">Disbursement Method</span>
                      <span className="font-semibold text-[#121C26] dark:text-slate-200">
                        {cashReward.disbursement_method}
                      </span>
                    </div>
                    <div className="py-3 flex items-center justify-between">
                      <span className="text-[#44474C] dark:text-slate-400">Review Window</span>
                      <span className="font-semibold text-[#121C26] dark:text-slate-200">
                        {cashReward.processing_window}
                      </span>
                    </div>
                    <div className="py-3 flex items-center justify-between">
                      <span className="text-[#44474C] dark:text-slate-400">Review Type</span>
                      <span className="font-semibold text-[#121C26] dark:text-slate-200">
                        Manual Compliance Audit
                      </span>
                    </div>
                  </div>

                  {/* Disclaimer Notice Box */}
                  <div className="p-4 rounded-xl bg-[#EDF4FF] dark:bg-slate-900/60 border border-[#D9E3F1]/70 dark:border-[#1B354F] flex items-start gap-3">
                    <svg className="w-5 h-5 text-[#785900] dark:text-[#F2B705] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-semibold font-sora text-[#121C26] dark:text-white">
                        Important Notice
                      </span>
                      <p className="text-[12px] leading-relaxed text-[#44474C] dark:text-slate-400">
                        Submitting this form initiates a manual claim review. Funds are not disbursed immediately upon form submission. WinDriveSA does not charge processing fees on cash payouts.
                      </p>
                    </div>
                  </div>

                  <p className="text-[11px] text-[#44474C] dark:text-slate-400 text-center leading-normal">
                    POPIA Section 18 Compliant: Only provide bank account information required for your cash prize claim.
                  </p>
                </div>
              </section>

              {/* RIGHT COLUMN: Bank Details Form (7 Cols) */}
              <section aria-label="Bank Account Submission" className="lg:col-span-7 flex flex-col">
                <div className="bg-white dark:bg-[#0B2238] p-6 sm:p-8 rounded-2xl shadow-sm flex flex-col gap-6 border border-[#D9E3F1]/80 dark:border-[#1B354F]">
                  <div className="flex flex-col gap-1 pb-4 border-b border-[#D9E3F1]/70 dark:border-[#1B354F]">
                    <h2 className="text-xl font-sora font-bold text-[#121C26] dark:text-white">
                      Bank Details
                    </h2>
                    <p className="text-xs sm:text-sm text-[#44474C] dark:text-slate-400">
                      Enter the verified South African bank account details that must be used for your prize EFT release.
                    </p>
                  </div>

                  <form className="flex flex-col gap-5" id="claim-form" noValidate onSubmit={handleFormSubmit}>
                    {/* 1. Account Holder Name */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs sm:text-sm font-semibold text-[#121C26] dark:text-slate-200 flex items-center justify-between" htmlFor="account-holder">
                        <span>
                          Account Holder Name <span className="text-red-500">*</span>
                        </span>
                        <span className="text-[11px] text-[#74777D] font-normal">Must match ID</span>
                      </label>
                      <div className="relative">
                        <input
                          id="account-holder"
                          name="account-holder"
                          type="text"
                          required
                          value={formData.accountHolder}
                          onChange={(e) => handleChange('accountHolder', e.target.value)}
                          placeholder="e.g., Nkosana Mthembu"
                          className={`w-full h-11 px-3.5 rounded-xl bg-white dark:bg-slate-900 text-[#121C26] dark:text-white text-sm border focus:outline-none transition-all shadow-sm ${
                            errors.accountHolder
                              ? 'border-red-500 focus:ring-2 focus:ring-red-500/30'
                              : 'border-[#D9E3F1] dark:border-[#1B354F] focus:border-[#F2B705] focus:ring-2 focus:ring-[#F2B705]/20'
                          }`}
                        />
                      </div>
                      {errors.accountHolder && (
                        <span className="text-[12px] text-red-500 flex items-center gap-1 mt-0.5">
                          <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {errors.accountHolder}
                        </span>
                      )}
                      <span className="text-[12px] text-[#74777D] dark:text-slate-400">
                        Enter the full legal name registered on the bank account.
                      </span>
                    </div>

                    {/* 2. Bank Name */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs sm:text-sm font-semibold text-[#121C26] dark:text-slate-200" htmlFor="bank-name">
                        Bank Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          id="bank-name"
                          name="bank-name"
                          required
                          value={formData.bankName}
                          onChange={(e) => handleChange('bankName', e.target.value)}
                          className={`w-full h-11 px-3.5 rounded-xl bg-white dark:bg-slate-900 text-[#121C26] dark:text-white text-sm border focus:outline-none transition-all appearance-none cursor-pointer shadow-sm pr-10 ${
                            errors.bankName
                              ? 'border-red-500 focus:ring-2 focus:ring-red-500/30'
                              : 'border-[#D9E3F1] dark:border-[#1B354F] focus:border-[#F2B705] focus:ring-2 focus:ring-[#F2B705]/20'
                          }`}
                        >
                          <option value="">Select your registered bank...</option>
                          <option value="Standard Bank">Standard Bank South Africa</option>
                          <option value="First National Bank (FNB)">First National Bank (FNB)</option>
                          <option value="ABSA Bank">ABSA Bank</option>
                          <option value="Nedbank">Nedbank</option>
                          <option value="Capitec Bank">Capitec Bank</option>
                          <option value="Investec">Investec Bank</option>
                          <option value="African Bank">African Bank</option>
                          <option value="Discovery Bank">Discovery Bank</option>
                          <option value="TymeBank">TymeBank</option>
                        </select>
                        <svg className="w-5 h-5 absolute right-3 top-3 text-[#74777D] pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                      {errors.bankName && (
                        <span className="text-[12px] text-red-500 flex items-center gap-1 mt-0.5">
                          <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {errors.bankName}
                        </span>
                      )}
                      <span className="text-[12px] text-[#74777D] dark:text-slate-400">
                        Licensed commercial banking institutions registered under SARB.
                      </span>
                    </div>

                    {/* Two Column Grid: Account Number & Account Type */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {/* 3. Account Number */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs sm:text-sm font-semibold text-[#121C26] dark:text-slate-200" htmlFor="account-number">
                          Account Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="account-number"
                          name="account-number"
                          type="text"
                          inputMode="numeric"
                          autoComplete="off"
                          required
                          value={formData.accountNumber}
                          onChange={(e) => handleChange('accountNumber', e.target.value.replace(/\D/g, ''))}
                          placeholder="e.g., 1029384756"
                          className={`w-full h-11 px-3.5 rounded-xl bg-white dark:bg-slate-900 text-[#121C26] dark:text-white text-sm border focus:outline-none transition-all tabular-nums shadow-sm ${
                            errors.accountNumber
                              ? 'border-red-500 focus:ring-2 focus:ring-red-500/30'
                              : 'border-[#D9E3F1] dark:border-[#1B354F] focus:border-[#F2B705] focus:ring-2 focus:ring-[#F2B705]/20'
                          }`}
                        />
                        {errors.accountNumber && (
                          <span className="text-[12px] text-red-500 flex items-center gap-1 mt-0.5">
                            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {errors.accountNumber}
                          </span>
                        )}
                        <span className="text-[12px] text-[#74777D] dark:text-slate-400">
                          Must be 8–11 digits. Encrypted transmission.
                        </span>
                      </div>

                      {/* 4. Account Type */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs sm:text-sm font-semibold text-[#121C26] dark:text-slate-200" htmlFor="account-type">
                          Account Type <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <select
                            id="account-type"
                            name="account-type"
                            required
                            value={formData.accountType}
                            onChange={(e) => handleChange('accountType', e.target.value)}
                            className={`w-full h-11 px-3.5 rounded-xl bg-white dark:bg-slate-900 text-[#121C26] dark:text-white text-sm border focus:outline-none transition-all appearance-none cursor-pointer shadow-sm pr-10 ${
                              errors.accountType
                                ? 'border-red-500 focus:ring-2 focus:ring-red-500/30'
                                : 'border-[#D9E3F1] dark:border-[#1B354F] focus:border-[#F2B705] focus:ring-2 focus:ring-[#F2B705]/20'
                            }`}
                          >
                            <option value="">Select account type...</option>
                            <option value="Cheque / Current">Cheque / Current Account</option>
                            <option value="Savings">Savings Account</option>
                            <option value="Transmission">Transmission Account</option>
                          </select>
                          <svg className="w-5 h-5 absolute right-3 top-3 text-[#74777D] pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                        {errors.accountType && (
                          <span className="text-[12px] text-red-500 flex items-center gap-1 mt-0.5">
                            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {errors.accountType}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 5. Branch Code */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs sm:text-sm font-semibold text-[#121C26] dark:text-slate-200 flex items-center justify-between" htmlFor="branch-code">
                        <span>
                          Branch Code <span className="text-red-500">*</span>
                        </span>
                        <span className="text-[12px] text-[#785900] dark:text-[#F2B705] font-medium">
                          Universal codes accepted
                        </span>
                      </label>
                      <div className="relative">
                        <input
                          id="branch-code"
                          name="branch-code"
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          required
                          value={formData.branchCode}
                          onChange={(e) => handleChange('branchCode', e.target.value.replace(/\D/g, ''))}
                          placeholder="e.g., 250655"
                          className={`w-full h-11 px-3.5 rounded-xl bg-white dark:bg-slate-900 text-[#121C26] dark:text-white text-sm border focus:outline-none transition-all tabular-nums shadow-sm ${
                            errors.branchCode
                              ? 'border-red-500 focus:ring-2 focus:ring-red-500/30'
                              : 'border-[#D9E3F1] dark:border-[#1B354F] focus:border-[#F2B705] focus:ring-2 focus:ring-[#F2B705]/20'
                          }`}
                        />
                      </div>
                      {errors.branchCode && (
                        <span className="text-[12px] text-red-500 flex items-center gap-1 mt-0.5">
                          <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {errors.branchCode}
                        </span>
                      )}
                      <span className="text-[12px] text-[#74777D] dark:text-slate-400">
                        Enter the 6-digit branch code designated by your banking provider.
                      </span>
                    </div>

                    {/* Submission Checklist Notice Box */}
                    <div className="p-4 rounded-xl bg-[#EDF4FF] dark:bg-slate-900/60 border border-[#D9E3F1]/70 dark:border-[#1B354F] flex flex-col gap-2 mt-2">
                      <div className="flex items-center gap-2 text-[#121C26] dark:text-white font-sora text-xs sm:text-sm font-semibold">
                        <svg className="w-4 h-4 text-[#785900] dark:text-[#F2B705]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Before you submit your claim</span>
                      </div>
                      <p className="text-xs text-[#44474C] dark:text-slate-400 leading-relaxed">
                        Please verify that these details are strictly registered under your legal identity. Your claim will be immediately dispatched for manual compliance audit upon submission.
                      </p>
                    </div>

                    {/* Server/Validation error notice */}
                    {submitError && (
                      <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
                        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{submitError}</span>
                      </div>
                    )}

                    {/* Action Controls */}
                    <div className="flex flex-col-reverse sm:flex-row items-center gap-4 pt-4">
                      <Link
                        to="/dashboard"
                        className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#EDF4FF] dark:bg-slate-800 text-[#121C26] dark:text-white font-sora text-sm font-semibold text-center hover:bg-[#DFE9F7] dark:hover:bg-slate-700 transition-colors"
                      >
                        Cancel
                      </Link>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        id="submit-claim-btn"
                        className="w-full sm:flex-1 py-3 px-6 rounded-xl bg-[#0A1D2E] text-white dark:bg-[#F2B705] dark:text-[#0A1D2E] font-sora text-sm font-semibold hover:bg-[#122b42] dark:hover:bg-[#d9a404] transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg relative overflow-hidden group disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {isSubmitting ? (
                          <>
                            <span className="w-4 h-4 rounded-full border-2 border-white dark:border-[#0A1D2E] border-t-transparent animate-spin"></span>
                            <span>Encrypting & Dispatching...</span>
                          </>
                        ) : (
                          <>
                            <span>Submit Cash Claim</span>
                            <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                          </>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#F2B705] opacity-80"></div>
                      </button>
                    </div>
                  </form>
                </div>
              </section>
            </div>
          )}

          {/* ================================================================= */}
          {/* STATE 2: CONFIRMATION SUCCESS VIEW (JUST SUBMITTED)               */}
          {/* ================================================================= */}
          {isJustConfirmed && (
            <div className="flex flex-col gap-8" id="state-claim-confirmation">
              <div className="bg-white dark:bg-[#0B2238] p-6 sm:p-10 rounded-2xl shadow-sm flex flex-col gap-8 max-w-4xl mx-auto w-full border border-[#D9E3F1]/80 dark:border-[#1B354F]">
                {/* Header Status Ribbon */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 bg-[#EDF4FF]/50 dark:bg-slate-900/60 p-6 rounded-xl border border-[#D9E3F1]/60 dark:border-[#1B354F]">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex flex-col">
                      <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400 uppercase font-bold tracking-wider font-sora">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                        UNDER COMPLIANCE REVIEW
                      </span>
                      <h2 className="text-xl sm:text-2xl font-sora font-bold text-[#121C26] dark:text-white">
                        Cash Claim Submitted
                      </h2>
                    </div>
                  </div>

                  <div className="flex flex-col sm:items-end">
                    <span className="text-[11px] text-[#74777D] dark:text-slate-400 uppercase font-semibold">
                      Payout Reference
                    </span>
                    <span className="font-mono text-sm font-bold text-[#121C26] dark:text-white">
                      {submittedClaimData?.payoutReference || cashReward.allocationId}
                    </span>
                  </div>
                </div>

                {/* Description and Recipient Summary */}
                <div className="flex flex-col gap-2.5">
                  <p className="text-base sm:text-lg text-[#121C26] dark:text-white leading-relaxed">
                    Your claim for <strong className="font-sora font-bold">{formatZAR(cashReward.cash_amount)} {cashReward.cash_currency}</strong> has been successfully registered and routed to our South African legal settlement division.
                  </p>
                  <p className="text-xs sm:text-sm text-[#44474C] dark:text-slate-400 leading-relaxed">
                    No further action or payments are required from you. You will receive real-time SMS notifications via registered mobile ({formatMaskedMobile(currentUser.mobile)}) at each milestone of the transfer audit.
                  </p>
                </div>

                {/* 5-Step Lifecycle Progression Component */}
                <div className="flex flex-col gap-4 py-2">
                  <span className="text-[11px] font-bold text-[#74777D] dark:text-slate-400 uppercase tracking-wider font-sora">
                    Claim Verification Lifecycle
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    {/* Step 1: Submitted (Complete) */}
                    <div className="flex md:flex-col items-center md:items-start gap-3 p-3.5 rounded-xl bg-[#EDF4FF] dark:bg-slate-900/60 border border-[#D9E3F1]/70 dark:border-[#1B354F]">
                      <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 font-bold">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-sora text-xs font-semibold text-[#121C26] dark:text-white">1. Submitted</span>
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                          Logged {submittedClaimData?.timestampFormatted || 'Just now'}
                        </span>
                      </div>
                    </div>

                    {/* Step 2: Under Review (Current) */}
                    <div className="flex md:flex-col items-center md:items-start gap-3 p-3.5 rounded-xl bg-[#0A1D2E] text-white dark:bg-[#F2B705] dark:text-[#0A1D2E] shadow-sm">
                      <div className="w-7 h-7 rounded-full bg-[#F2B705] text-[#0A1D2E] dark:bg-[#0A1D2E] dark:text-[#F2B705] flex items-center justify-center shrink-0 font-bold">
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                        </svg>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-sora text-xs font-semibold">2. Under Review</span>
                        <span className="text-[11px] text-[#F2B705] dark:text-[#0A1D2E] font-semibold opacity-90">
                          Active In-Progress
                        </span>
                      </div>
                    </div>

                    {/* Step 3: Approved (Upcoming) */}
                    <div className="flex md:flex-col items-center md:items-start gap-3 p-3.5 rounded-xl bg-[#F7F9FF] dark:bg-slate-900/40 border border-[#D9E3F1]/70 dark:border-[#1B354F] opacity-60">
                      <div className="w-7 h-7 rounded-full bg-[#DFE9F7] text-[#74777D] dark:bg-slate-800 dark:text-slate-400 flex items-center justify-center shrink-0 text-xs font-bold font-sora">
                        3
                      </div>
                      <div className="flex flex-col">
                        <span className="font-sora text-xs font-medium text-[#74777D] dark:text-slate-300">3. Approved</span>
                        <span className="text-[11px] text-[#74777D] dark:text-slate-400">Pending Audit</span>
                      </div>
                    </div>

                    {/* Step 4: Processing (Upcoming) */}
                    <div className="flex md:flex-col items-center md:items-start gap-3 p-3.5 rounded-xl bg-[#F7F9FF] dark:bg-slate-900/40 border border-[#D9E3F1]/70 dark:border-[#1B354F] opacity-60">
                      <div className="w-7 h-7 rounded-full bg-[#DFE9F7] text-[#74777D] dark:bg-slate-800 dark:text-slate-400 flex items-center justify-center shrink-0 text-xs font-bold font-sora">
                        4
                      </div>
                      <div className="flex flex-col">
                        <span className="font-sora text-xs font-medium text-[#74777D] dark:text-slate-300">4. Processing</span>
                        <span className="text-[11px] text-[#74777D] dark:text-slate-400">SARB Clearance</span>
                      </div>
                    </div>

                    {/* Step 5: Fulfilled (Upcoming) */}
                    <div className="flex md:flex-col items-center md:items-start gap-3 p-3.5 rounded-xl bg-[#F7F9FF] dark:bg-slate-900/40 border border-[#D9E3F1]/70 dark:border-[#1B354F] opacity-60">
                      <div className="w-7 h-7 rounded-full bg-[#DFE9F7] text-[#74777D] dark:bg-slate-800 dark:text-slate-400 flex items-center justify-center shrink-0 text-xs font-bold font-sora">
                        5
                      </div>
                      <div className="flex flex-col">
                        <span className="font-sora text-xs font-medium text-[#74777D] dark:text-slate-300">5. Fulfilled</span>
                        <span className="text-[11px] text-[#74777D] dark:text-slate-400">Direct EFT Paid</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 border-t border-[#D9E3F1] dark:border-[#1B354F]">
                  <Link
                    to="/dashboard"
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#0A1D2E] text-white dark:bg-[#F2B705] dark:text-[#0A1D2E] font-sora text-sm font-semibold hover:bg-[#122b42] dark:hover:bg-[#d9a404] text-center transition-colors shadow-sm"
                  >
                    Back to Dashboard
                  </Link>

                  <Link
                    to="/claims"
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#EDF4FF] dark:bg-slate-800 text-[#121C26] dark:text-white font-sora text-sm font-semibold hover:bg-[#DFE9F7] dark:hover:bg-slate-700 text-center transition-colors"
                  >
                    View All Claims
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* STATE 3: ALREADY SUBMITTED VIEW (PREVENTS DUPLICATE SUBMISSION)   */}
          {/* ================================================================= */}
          {isAlreadySubmitted && (
            <div className="flex flex-col gap-8" id="state-already-submitted">
              <div className="bg-white dark:bg-[#0B2238] p-6 sm:p-8 rounded-2xl shadow-sm flex flex-col gap-6 max-w-3xl mx-auto w-full border border-[#D9E3F1]/80 dark:border-[#1B354F]">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#D9E3F1] dark:border-[#1B354F]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-sora font-bold text-[#121C26] dark:text-white">
                      Cash Claim Already Submitted
                    </h2>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-900/60 text-[11px] font-bold uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                    UNDER REVIEW
                  </span>
                </div>

                <p className="text-sm sm:text-base text-[#44474C] dark:text-slate-300 leading-relaxed">
                  Your cash prize claim for <strong className="text-[#121C26] dark:text-white font-bold">{formatZAR(cashReward.cash_amount)} {cashReward.cash_currency}</strong> is currently being reviewed by our compliance team. You do not need to re-submit your bank details.
                </p>

                {/* Masked Bank Account Snapshot */}
                <div className="p-5 rounded-xl bg-[#EDF4FF] dark:bg-slate-900/60 border border-[#D9E3F1]/70 dark:border-[#1B354F] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-[#DFE9F7] dark:bg-slate-800 flex items-center justify-center text-[#44474C] dark:text-slate-300 shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-sora font-semibold text-[#121C26] dark:text-white">
                        {existingCashClaim.bankDetails?.bankName || 'Standard Bank'} {existingCashClaim.bankDetails?.maskedAccountNumber || '••••••4892'}
                      </span>
                      <span className="text-xs text-[#74777D] dark:text-slate-400">
                        {existingCashClaim.bankDetails?.accountHolder || currentUser.fullName} • Universal Code {existingCashClaim.bankDetails?.branchCode || '250655'}
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/80 uppercase tracking-wider">
                    DETAILS LOCKED
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-[#D9E3F1] dark:border-[#1B354F]">
                  <Link
                    to="/dashboard"
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#0A1D2E] text-white dark:bg-[#F2B705] dark:text-[#0A1D2E] font-sora text-sm font-semibold hover:bg-[#122b42] dark:hover:bg-[#d9a404] text-center transition-colors"
                  >
                    Back to Dashboard
                  </Link>

                  <Link
                    to="/claims"
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#EDF4FF] dark:bg-slate-800 text-[#121C26] dark:text-white font-sora text-sm font-semibold hover:bg-[#DFE9F7] dark:hover:bg-slate-700 text-center transition-colors"
                  >
                    View All Claims
                  </Link>
                </div>
              </div>
            </div>
          )}
          </>
          )}
        </main>
      </div>

      {/* Compliant Legal Sub-Footer */}
      <footer className="w-full bg-[#EDF4FF] dark:bg-[#0B2238] border-t border-[#D9E3F1] dark:border-[#1B354F] py-6 px-4 sm:px-6 lg:px-10 text-[#74777D] dark:text-slate-400 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left text-xs">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>
              © 2026 WinDriveSA (Pty) Ltd. All rights reserved. • POPIA Compliant •{' '}
              <Link to="/#terms" className="hover:underline">Terms of Service</Link> •{' '}
              <Link to="/#privacy" className="hover:underline">Privacy Policy</Link>
            </span>
          </div>

          <div className="flex items-center gap-3 uppercase tracking-wider font-semibold text-[11px]">
            <span>SARB Monitored EFT</span>
            <span>•</span>
            <span>Secure SA Gateway</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
