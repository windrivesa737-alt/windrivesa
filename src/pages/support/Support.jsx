import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { getUserRewards } from '../../services/rewardService';
import {
  getSupportConfig,
  getMySupportRequests,
  createSupportRequest,
} from '../../services/support';

import SupportHeader from './components/SupportHeader';
import WhatsAppSupportCard from './components/WhatsAppSupportCard';
import SupportRequestForm from './components/SupportRequestForm';
import SupportSuccessBanner from './components/SupportSuccessBanner';
import SupportRequestHistory from './components/SupportRequestHistory';
import SupportDetailModal from './components/SupportDetailModal';

export default function Support() {
  const { theme, toggleTheme } = useTheme();
  const { user: authUser, profile, logout } = useAuth();
  const navigate = useNavigate();
  const bannerRef = useRef(null);

  // Authenticated user session
  const currentUser = {
    id: authUser?.id || '',
    fullName: profile?.full_name || authUser?.user_metadata?.full_name || 'WinDriveSA Member',
    memberId: profile?.member_number || (authUser?.id ? `WD-${authUser.id.slice(0, 5).toUpperCase()}` : 'WD-88349-ZA'),
    email: profile?.email || authUser?.email || '',
    mobile: profile?.mobile_number || authUser?.user_metadata?.mobile_number || '',
    status: (profile?.account_status || 'PENDING_REVIEW').replace('_', ' '),
    role: (profile?.role || 'USER').toLowerCase(),
  };

  const [userRewards, setUserRewards] = useState(null);
  const [supportConfig, setSupportConfig] = useState(() => getSupportConfig());
  const [supportRequests, setSupportRequests] = useState([]);
  const [submittedRequest, setSubmittedRequest] = useState(null);
  const [selectedRequestForModal, setSelectedRequestForModal] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Route Protection & Data Initialization
  useEffect(() => {
    let isMounted = true;
    if (!authUser?.id) return;

    // Fetch user rewards for contextual claim selection
    const rewards = getUserRewards(currentUser);
    setUserRewards(rewards);

    // Fetch real institutional config
    getSupportConfig().then((cfg) => {
      if (isMounted && cfg) {
        setSupportConfig(cfg);
      }
    });

    // Fetch real support requests from Supabase
    getMySupportRequests(authUser.id).then(({ data }) => {
      if (isMounted) {
        setSupportRequests(data || []);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [authUser?.id]);

  const refreshUserRequests = async () => {
    if (!currentUser?.id) return;
    const { data } = await getMySupportRequests(currentUser.id);
    if (data) {
      setSupportRequests(data);
      if (selectedRequestForModal) {
        const updatedSelected = data.find((r) => r.id === selectedRequestForModal.id);
        if (updatedSelected) {
          setSelectedRequestForModal(updatedSelected);
        }
      }
    }
  };

  // ESC key handler for mobile drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsMobileDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!currentUser) {
    return null;
  }

  // Derived user initials
  const userInitials = currentUser.fullName
    ? currentUser.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2)
    : 'WD';

  // Handler: Submit Support Request
  const handleSubmitSupport = async (formData, resetCallback) => {
    setIsSubmitting(true);

    try {
      const result = await createSupportRequest(currentUser.id, formData);
      setIsSubmitting(false);

      if (result.success) {
        setSubmittedRequest(result.data || result.request);
        await refreshUserRequests();
        if (resetCallback) {
          resetCallback();
        }

        // Scroll to success banner smoothly
        setTimeout(() => {
          if (bannerRef.current) {
            bannerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 50);
      }
    } catch (err) {
      setIsSubmitting(false);
      console.error('Error submitting support inquiry:', err);
    }
  };

  // Handler: Dismiss Success Banner
  const handleDismissBanner = () => {
    setSubmittedRequest(null);
  };

  // Handler: Logout
  const handleLogout = async (e) => {
    if (e) e.preventDefault();
    await logout();
    navigate('/', { replace: true });
  };

  return (
    <div className="bg-[#F5F7FA] text-[#17212B] dark:bg-[#040E18] dark:text-[#E2E8F0] font-manrope min-h-screen flex flex-col antialiased transition-colors duration-200 selection:bg-[#F2B705] selection:text-[#071A2B]">

      {/* ======================================================== */}
      {/* TABLET / MOBILE HEADER BAR (< 1024px)                     */}
      {/* ======================================================== */}
      <header className="lg:hidden bg-white dark:bg-[#0B2238] border-b border-[#D9E0E7] dark:border-[#1B354F] sticky top-0 z-40 px-4 py-3 shadow-xs transition-colors">
        <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
          {/* Logo */}
          <Link
            to="/dashboard"
            className="flex items-center focus:outline-none focus:ring-2 focus:ring-[#F2B705] rounded-lg"
            aria-label="WinDriveSA Dashboard"
          >
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBS8WYRO_U8dzlFp3O3-VET9-QiFpZXWdGJnMRHz5Ifee4PGT3kDaYXWez-sX8ZQ58anREzdqp5V44PLYQmb28FF5dsdaRPOw-2nn3hn30m2C0MchCG1cJ-skxWJv21wLASBYjO1y1bhhsDcg8do4vlVaT3X15ESDCMeF9G1Nu2AxjLDBdICAt4LHFD0VJEKJTjW9tReTk4Cv01xgcFtCfnH42p-McyexEOw9md6UgogmlV1jcR1ZeWIH8cu36FHymJC9A"
              alt="WinDriveSA - Win Big. Drive Away."
              className="h-9 sm:h-10 w-auto object-contain"
            />
          </Link>

          {/* Upper-Right Group: Theme Toggle + Hamburger Menu */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              type="button"
              className="p-2.5 rounded-lg border border-[#D9E0E7] dark:border-[#1B354F] bg-[#F5F7FA] dark:bg-[#071A2B] text-[#17212B] dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
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

            {/* Hamburger Button */}
            <button
              onClick={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
              type="button"
              className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg border border-[#D9E0E7] dark:border-[#1B354F] bg-[#F5F7FA] dark:bg-[#071A2B] text-[#071A2B] dark:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 focus:ring-2 focus:ring-[#F2B705] transition-colors cursor-pointer"
              aria-label={isMobileDrawerOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileDrawerOpen}
            >
              {isMobileDrawerOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileDrawerOpen && (
          <div className="mt-3 pt-3 border-t border-[#D9E0E7] dark:border-[#1B354F] animate-fadeIn">
            {/* Member Status Badge */}
            <div className="mb-3 p-3 bg-[#F5F7FA] dark:bg-[#071A2B] rounded-xl border border-[#D9E0E7] dark:border-[#1B354F] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#071A2B] text-[#F2B705] font-sora font-bold text-sm flex items-center justify-center border border-[#F2B705]/40 shadow-xs">
                  {userInitials}
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#071A2B] dark:text-white">
                    {currentUser.fullName}
                  </div>
                  <div className="text-[11px] text-[#00843D] dark:text-emerald-400 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00843D] dark:bg-emerald-400"></span>
                    Verified RSA Citizen
                  </div>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-400 font-semibold rounded border border-emerald-300 dark:border-emerald-800">
                Tier 1
              </span>
            </div>

            <nav className="space-y-1 font-medium text-sm">
              <Link
                to="/dashboard"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[#17212B] dark:text-slate-300 hover:bg-[#F5F7FA] dark:hover:bg-[#071A2B] transition-colors"
              >
                <svg className="w-5 h-5 text-[#667085]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                Dashboard
              </Link>
              <Link
                to="/dashboard"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[#17212B] dark:text-slate-300 hover:bg-[#F5F7FA] dark:hover:bg-[#071A2B] transition-colors"
              >
                <svg className="w-5 h-5 text-[#667085]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
                My Rewards
              </Link>
              <Link
                to="/claims"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[#17212B] dark:text-slate-300 hover:bg-[#F5F7FA] dark:hover:bg-[#071A2B] transition-colors"
              >
                <svg className="w-5 h-5 text-[#667085]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Claim Requests
              </Link>
              <Link
                to="/account"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[#17212B] dark:text-slate-300 hover:bg-[#F5F7FA] dark:hover:bg-[#071A2B] transition-colors"
              >
                <svg className="w-5 h-5 text-[#667085]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Account
              </Link>
              {/* ACTIVE SUPPORT ROUTE */}
              <Link
                to="/support"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-[#071A2B] dark:bg-[#F2B705] text-white dark:text-[#071A2B] font-semibold shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-[#F2B705] dark:text-[#071A2B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span>Support</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-[#F2B705] dark:bg-[#071A2B]"></span>
              </Link>
            </nav>

            <div className="pt-3 mt-3 border-t border-[#D9E0E7] dark:border-[#1B354F]">
              <button
                onClick={handleLogout}
                type="button"
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ======================================================== */}
      {/* MAIN CONTAINER (DESKTOP SIDEBAR + MAIN CONTENT)          */}
      {/* ======================================================== */}
      <div className="flex-1 flex flex-col lg:flex-row w-full max-w-[1600px] mx-auto">

        {/* DESKTOP SIDEBAR (w-64) */}
        <aside
          aria-label="Desktop Sidebar Navigation"
          className="hidden lg:flex flex-col w-64 bg-white dark:bg-[#0B2238] border-r border-[#D9E0E7] dark:border-[#1B354F] py-6 px-4 shrink-0 transition-colors duration-200 select-none z-30"
        >
          {/* Brand Logo */}
          <div className="px-2 mb-7">
            <Link
              to="/dashboard"
              className="block focus:outline-none focus:ring-2 focus:ring-[#F2B705] rounded"
              aria-label="WinDriveSA Home"
            >
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBS8WYRO_U8dzlFp3O3-VET9-QiFpZXWdGJnMRHz5Ifee4PGT3kDaYXWez-sX8ZQ58anREzdqp5V44PLYQmb28FF5dsdaRPOw-2nn3hn30m2C0MchCG1cJ-skxWJv21wLASBYjO1y1bhhsDcg8do4vlVaT3X15ESDCMeF9G1Nu2AxjLDBdICAt4LHFD0VJEKJTjW9tReTk4Cv01xgcFtCfnH42p-McyexEOw9md6UgogmlV1jcR1ZeWIH8cu36FHymJC9A"
                alt="WinDriveSA - Win Big. Drive Away."
                className="h-10 w-auto object-contain"
              />
            </Link>
          </div>

          {/* Member Identity Micro-Badge */}
          <div className="mb-6 p-3.5 bg-[#F5F7FA] dark:bg-[#071A2B] rounded-xl border border-[#D9E0E7] dark:border-[#1B354F]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#071A2B] text-[#F2B705] font-sora font-bold text-sm flex items-center justify-center border border-[#F2B705]/40 shadow-xs shrink-0">
                {userInitials}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-[#071A2B] dark:text-white truncate">
                  {currentUser.fullName}
                </div>
                <div className="text-[11px] text-[#00843D] dark:text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00843D] dark:bg-emerald-400 shrink-0"></span>
                  <span className="truncate">RSA Citizen • Tier 1</span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5 font-medium text-sm flex-1" aria-label="Desktop Navigation Links">
            <Link
              to="/dashboard"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[#17212B] dark:text-slate-300 hover:bg-[#F5F7FA] dark:hover:bg-[#071A2B] transition-colors"
            >
              <svg className="w-5 h-5 text-[#667085]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              <span>Dashboard</span>
            </Link>

            <Link
              to="/dashboard"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[#17212B] dark:text-slate-300 hover:bg-[#F5F7FA] dark:hover:bg-[#071A2B] transition-colors"
            >
              <svg className="w-5 h-5 text-[#667085]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
              <span>My Rewards</span>
            </Link>

            <Link
              to="/claims"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[#17212B] dark:text-slate-300 hover:bg-[#F5F7FA] dark:hover:bg-[#071A2B] transition-colors"
            >
              <svg className="w-5 h-5 text-[#667085]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Claim Requests</span>
            </Link>

            <Link
              to="/account"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[#17212B] dark:text-slate-300 hover:bg-[#F5F7FA] dark:hover:bg-[#071A2B] transition-colors"
            >
              <svg className="w-5 h-5 text-[#667085]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Account</span>
            </Link>

            {/* ACTIVE ROUTE: SUPPORT */}
            <Link
              to="/support"
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#071A2B] dark:bg-[#F2B705] text-white dark:text-[#071A2B] font-semibold shadow-xs transition"
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-[#F2B705] dark:text-[#071A2B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span>Support</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-[#F2B705] dark:bg-[#071A2B]"></span>
            </Link>
          </nav>

          {/* Sidebar Footer: Theme Toggle & Sign Out */}
          <div className="pt-4 border-t border-[#D9E0E7] dark:border-[#1B354F] space-y-3">
            <button
              onClick={toggleTheme}
              type="button"
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-[#F5F7FA] dark:bg-[#071A2B] text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 text-xs font-medium transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                {theme === 'dark' ? (
                  <svg className="w-4 h-4 text-[#F2B705]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-[#071A2B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
                <span>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#667085] px-1.5 py-0.5 rounded bg-gray-200/60 dark:bg-gray-700/60">
                TOGGLE
              </span>
            </button>

            <button
              onClick={handleLogout}
              type="button"
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* ======================================================== */}
        {/* MAIN SCROLLABLE CONTENT AREA                             */}
        {/* ======================================================== */}
        <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 lg:py-8 max-w-6xl w-full mx-auto">
          {/* Support Page Header */}
          <SupportHeader />

          {/* Dynamic Success Banner (when a support ticket is submitted) */}
          <div ref={bannerRef}>
            <SupportSuccessBanner
              request={submittedRequest}
              onDismiss={handleDismissBanner}
            />
          </div>

          {/* Two-Column Support Grid: WhatsApp (5 cols) & Support Form (7 cols) */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mb-10">
            {/* WhatsApp Support Option */}
            <div className="lg:col-span-5 h-full">
              <WhatsAppSupportCard
                config={supportConfig}
                user={currentUser}
              />
            </div>

            {/* Authenticated Support Request Form */}
            <div className="lg:col-span-7">
              <SupportRequestForm
                onSubmit={handleSubmitSupport}
                isSubmitting={isSubmitting}
                userRewards={userRewards}
              />
            </div>
          </section>

          {/* Request History Section */}
          <SupportRequestHistory
            requests={supportRequests}
            onViewDetails={(req) => setSelectedRequestForModal(req)}
          />

          {/* Statutory RSA Escrow & POPIA Baseline Footer */}
          <footer className="pt-6 pb-4 border-t border-[#D9E0E7] dark:border-[#1E3852] text-xs text-[#667085] dark:text-gray-400 flex flex-col md:flex-row items-center justify-between gap-3">
            <p>© 2026 WinDriveSA (Pty) Ltd. All rights reserved. POPIA Compliant • Secure RSA Escrow.</p>
            <div className="flex items-center gap-4 text-[11px] font-mono">
              <span>SARB Monitored</span>
              <span>•</span>
              <span>REG NO: 2024/782194/07</span>
              <span>•</span>
              <span className="text-[#071A2B] dark:text-[#F2B705] font-bold">Support Desk</span>
            </div>
          </footer>
        </main>
      </div>

      {/* Support Detail Modal */}
      {selectedRequestForModal && (
        <SupportDetailModal
          request={selectedRequestForModal}
          currentUserId={currentUser?.id}
          onMessageSent={refreshUserRequests}
          onClose={() => setSelectedRequestForModal(null)}
        />
      )}
    </div>
  );
}
