import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { updatePassword as authUpdatePassword, logout } from '../../services/auth.js';
import { supabase, isSupabaseConfigured } from '../../lib/supabase.js';

export default function ResetPassword() {
  const { theme, toggleTheme } = useTheme();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Internal application state: 'reset' | 'success' | 'expired'
  // Strictly driven by authentication / token verification, never by user-visible debug controls.
  const [appState, setAppState] = useState('reset');
  const tokenParam = searchParams.get('token') || searchParams.get('code') || '';

  // Controlled form state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [touchedConfirm, setTouchedConfirm] = useState(false);

  // Security status popover
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const statusPopoverRef = useRef(null);
  const statusButtonRef = useRef(null);

  // Validate token on mount or URL change
  useEffect(() => {
    // 1. Listen for Supabase PASSWORD_RECOVERY event
    let subscription = null;
    if (isSupabaseConfigured() && supabase) {
      const { data } = supabase.auth.onAuthStateChange((event) => {
        if (event === 'PASSWORD_RECOVERY') {
          setAppState('reset');
        }
      });
      subscription = data?.subscription;
    }

    // 2. Check URL hash for access_token or recovery type
    const hash = window.location.hash || '';
    const isRecoveryHash = hash.includes('type=recovery') || hash.includes('access_token=');

    if (tokenParam === 'expired' || tokenParam === 'invalid') {
      setAppState('expired');
    } else if (isRecoveryHash || tokenParam) {
      setAppState('reset');
    } else {
      setAppState('expired');
    }

    return () => {
      if (subscription?.unsubscribe) {
        subscription.unsubscribe();
      }
    };
  }, [tokenParam]);

  // Dismiss popover on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        isStatusOpen &&
        statusPopoverRef.current &&
        !statusPopoverRef.current.contains(e.target) &&
        statusButtonRef.current &&
        !statusButtonRef.current.contains(e.target)
      ) {
        setIsStatusOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isStatusOpen]);

  // Live Password Requirements Calculations
  const hasLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const isRequirementsMet = hasLength && hasUpper && hasLower && hasNumber;
  const isMismatch = touchedConfirm && confirmPassword.length > 0 && newPassword !== confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setFormError('');

    if (!newPassword) {
      setFormError('Password must contain at least 8 characters.');
      return;
    }

    if (!hasLength) {
      setFormError('Password must contain at least 8 characters.');
      return;
    }

    if (!hasUpper) {
      setFormError('Password must include an uppercase letter.');
      return;
    }

    if (!hasLower) {
      setFormError('Password must include a lowercase letter.');
      return;
    }

    if (!hasNumber) {
      setFormError('Password must include a number.');
      return;
    }

    if (!confirmPassword) {
      setFormError('Please confirm your new password.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isSupabaseConfigured() && supabase) {
        const response = await authUpdatePassword(newPassword);
        if (response.success) {
          setAppState('success');
          setNewPassword('');
          setConfirmPassword('');
          setFormError('');
          // Terminate recovery session cleanly under security governance
          await logout();
        } else {
          const errLower = (response.error || '').toLowerCase();
          if (errLower.includes('expired') || errLower.includes('invalid') || errLower.includes('not found')) {
            setAppState('expired');
          } else {
            setFormError(response.error || 'Something went wrong while resetting your password. Please try again.');
          }
        }
      } else {
        setFormError('Authentication service is unavailable. Please verify connectivity.');
      }
    } catch (err) {
      setFormError('Something went wrong while resetting your password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#F5F7FA] dark:bg-[#071A2B] text-[#17212B] dark:text-gray-100 font-manrope transition-colors duration-200">
      {/* AUTHENTICATION HEADER */}
      <header className="w-full bg-white dark:bg-[#0E1D2D] border-b border-[#D9E0E7] dark:border-[#223244] shrink-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 py-3.5 flex items-center justify-between">
          {/* Authentic WinDriveSA Master Logo */}
          <Link
            to="/login"
            aria-label="WinDriveSA Authentication"
            className="flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-[#F2B705] rounded py-1"
          >
            <img
              alt="WinDriveSA Logo"
              className="h-9 sm:h-11 w-auto object-contain"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuD2ZtRs2Ipwn88MUno1NRHwgf1ho2B-5BlkhyLeVAZtW8CwcAIbN2Hd724aBFxLJUuYpY03QypQa2vnV5Bsw-hkjo4iv0yqM9BJvk8ZdYvg3OXjDeaH1SfJVLGBJnB9QoDuYbPM9Qvl5IknWwTZRe278slhth7olFyOpUzjwYz7JCduEqYdqyWhN4U4Pwo2_kk58WgDCzL7y8rnd9uI4Ns4Dxn-y2iZghyg2ZlZJrna3k_e1UJtpZLieDMJntAXAzX4fnw"
            />
          </Link>

          {/* Right Actions: Token status indicator, Theme Toggle, Back to Sign In */}
          <div className="flex items-center gap-2.5 sm:gap-4">
            {/* Security Token Status Indicator Pill & Popover */}
            <div className="relative">
              <button
                ref={statusButtonRef}
                id="statusPillBtn"
                type="button"
                aria-expanded={isStatusOpen}
                aria-haspopup="dialog"
                aria-label="View security token status"
                onClick={() => setIsStatusOpen(!isStatusOpen)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-[#F2B705] cursor-pointer ${
                  appState === 'expired'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60 hover:bg-amber-100 dark:hover:bg-amber-900/50'
                    : 'bg-emerald-50 text-[#00843D] border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    appState === 'expired'
                      ? 'bg-amber-500'
                      : appState === 'reset'
                      ? 'bg-[#00843D] animate-pulse'
                      : 'bg-[#00843D]'
                  }`}
                />
                <span id="statusPillLabel">
                  {appState === 'expired'
                    ? 'LINK EXPIRED'
                    : appState === 'success'
                    ? 'PASSWORD UPDATED'
                    : 'TOKEN ACTIVE'}
                </span>
                <svg
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${isStatusOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
                </svg>
              </button>

              {/* Security Status Popover */}
              {isStatusOpen && (
                <div
                  ref={statusPopoverRef}
                  id="statusDetailsPopover"
                  role="dialog"
                  aria-label="Security Token Details"
                  className="absolute right-0 mt-2 w-72 sm:w-80 bg-white dark:bg-[#0E1D2D] border border-[#D9E0E7] dark:border-[#223244] rounded-xl shadow-xl p-4 z-50 text-left"
                >
                  <div className="flex items-start justify-between pb-2 border-b border-[#D9E0E7]/60 dark:border-[#223244]/60">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          appState === 'expired' ? 'bg-amber-500' : 'bg-[#00843D]'
                        }`}
                      />
                      <span className="text-xs font-bold tracking-wide uppercase font-sora text-[#071A2B] dark:text-white">
                        {appState === 'expired'
                          ? 'Token Expired'
                          : appState === 'success'
                          ? 'Credentials Secured'
                          : 'Token Verified'}
                      </span>
                    </div>
                    <button
                      type="button"
                      aria-label="Close details"
                      onClick={() => setIsStatusOpen(false)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded focus:outline-none focus:ring-1 focus:ring-[#F2B705]"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                      </svg>
                    </button>
                  </div>
                  <div className="py-2.5">
                    <p className="text-xs text-[#667085] dark:text-gray-300 leading-relaxed">
                      {appState === 'expired'
                        ? 'This single-use link has expired or has already been used. Please generate a fresh recovery link from the Forgot Password page.'
                        : appState === 'success'
                        ? 'Your credentials have been securely updated. All preceding sessions have been terminated under POPIA Section 18 governance.'
                        : 'Cryptographic authentication token is active and valid for 15 minutes. Complete password reconfiguration below.'}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-[#D9E0E7]/40 dark:border-[#223244]/40 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setIsStatusOpen(false)}
                      className="text-[11px] font-semibold text-[#F2B705] hover:underline cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Light / Dark Theme Toggle Button */}
            <button
              id="themeToggleBtn"
              type="button"
              aria-label={`Toggle theme (currently ${theme} mode)`}
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-[#D9E0E7] dark:border-[#223244] bg-gray-50 dark:bg-[#071A2B] hover:bg-gray-100 dark:hover:bg-[#17212B] text-[#17212B] dark:text-[#F2B705] transition-colors focus-visible:ring-2 focus-visible:ring-[#F2B705] cursor-pointer"
            >
              {theme === 'dark' ? (
                /* Sun Icon for Dark Mode */
                <svg className="w-4 h-4 text-[#F2B705]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              ) : (
                /* Moon Icon for Light Mode */
                <svg className="w-4 h-4 text-[#071A2B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              )}
            </button>

            {/* Back to Sign In Link */}
            <Link
              to="/login"
              id="headerSignInLink"
              className="text-xs font-semibold text-[#667085] dark:text-gray-300 hover:text-[#071A2B] dark:hover:text-white transition-colors hidden sm:inline-flex items-center gap-1.5 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M10 19l-7-7m0 0l7-7m-7 7h18" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
              </svg>
              <span>Back to Sign In</span>
            </Link>
          </div>
        </div>
      </header>

      {/* MAIN CARD CONTAINER (2-COL DESKTOP / FLUID MOBILE) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12 flex flex-col justify-center">
        <div className="w-full bg-white dark:bg-[#0E1D2D] border border-[#D9E0E7] dark:border-[#223244] rounded-2xl shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          
          {/* LEFT COLUMN: EDITORIAL AUTOMOTIVE VISUAL PANEL (lg:col-span-5) */}
          <section
            aria-label="WinDriveSA Brand Security Overview"
            className="lg:col-span-5 relative bg-[#071A2B] flex flex-col justify-between overflow-hidden min-h-[260px] sm:min-h-[320px] lg:min-h-[620px] p-6 sm:p-8 lg:p-10 select-none"
          >
            {/* Background Automotive Visual Asset */}
            <img
              alt="WinDriveSA High performance luxury vehicle"
              className="absolute inset-0 w-full h-full object-cover object-center opacity-40 mix-blend-luminosity transform scale-105"
              src="https://lh3.googleusercontent.com/aida/AEtjO1W-OF9JkVLGyLEhrQXYCyyXqqCucMmz08xaVEK_yYnnSwo_FYdpK9NbGOpMvHTvDuCcAeQPjL6_V4maaZAx7RjdvkapQ695tWGovdIdE8ZMJuHXTr3WUkAo2r_u_KZegfQNIMZaVBVrNI7cb6BXdCU0XUZfWmLbRaD2IPxRjy6Aw6Yt-dPkmE-B4JyuDxArIA99Apqgqs2PvER6ar-uU6IlJO2gV8VEtbh5j9gdxgjpQ07HsHqIaFooTX33"
            />
            {/* Deep Navy Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#071A2B] via-[#071A2B]/85 to-[#071A2B]/45" />

            {/* Top Cryptographic Security Badge */}
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-[#F2B705] uppercase tracking-wider">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
                <span>Cryptographic Security</span>
              </div>
            </div>

            {/* Editorial Copy & Institutional Trust Points */}
            <div className="relative z-10 mt-8 sm:mt-16 lg:mt-auto">
              <p className="text-xs font-bold tracking-widest text-[#F2B705] uppercase mb-2 font-sora">
                South African Automotive Allocation
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold font-sora text-white leading-tight">
                Your journey starts here.
              </h2>
              <p className="mt-3 text-sm text-gray-300 leading-relaxed max-w-sm">
                WinDriveSA safeguards your member allocations with institutional credential governance and protected authentication.
              </p>
              <div className="mt-6 pt-6 border-t border-white/15 space-y-2.5 text-xs text-gray-300">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#00843D] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
                  </svg>
                  <span>Single-use cryptographic recovery link</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#00843D] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
                  </svg>
                  <span>Instant termination of existing active sessions</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#00843D] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
                  </svg>
                  <span>POPIA Section 18 statutory personal data protection</span>
                </div>
              </div>
            </div>
          </section>

          {/* RIGHT COLUMN: DYNAMIC AUTH CONTENT CONTAINER (lg:col-span-7) */}
          <section className="lg:col-span-7 p-6 sm:p-10 lg:p-14 flex flex-col justify-center relative min-h-[460px]">
            <div className="w-full max-w-lg mx-auto" id="authContentContainer">
              
              {/* STATE 1: RESET PASSWORD FORM */}
              {appState === 'reset' && (
                <div className="space-y-6" id="state-reset-container">
                  {/* Eyebrow & Headings */}
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-bold tracking-wider uppercase text-[#F2B705] font-sora">
                        PASSWORD RECOVERY
                      </span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold font-sora text-[#071A2B] dark:text-white tracking-tight">
                      Create a New Password
                    </h1>
                    <p className="mt-2 text-sm text-[#667085] dark:text-gray-300">
                      Choose a new password for your WinDriveSA account.
                    </p>
                  </div>

                  {/* Human-readable Error Banner */}
                  {formError && (
                    <div
                      id="formErrorBanner"
                      role="alert"
                      className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-300 flex items-start gap-2.5"
                    >
                      <svg className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                      </svg>
                      <span id="formErrorText">{formError}</span>
                    </div>
                  )}

                  {/* Main Form */}
                  <form onSubmit={handleSubmit} className="space-y-5" noValidate id="reset-password-form">
                    {/* Field 1: New Password */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label
                          htmlFor="newPasswordInput"
                          className="block text-xs font-bold uppercase tracking-wider text-[#17212B] dark:text-gray-200"
                        >
                          New Password <span className="text-red-500">*</span>
                        </label>
                      </div>
                      <div className="relative">
                        <input
                          id="newPasswordInput"
                          name="newPassword"
                          type={showNewPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          value={newPassword}
                          onChange={(e) => {
                            setNewPassword(e.target.value);
                            if (formError) setFormError('');
                          }}
                          placeholder="Enter secure new password"
                          className="w-full px-4 py-3 text-sm rounded-xl border border-[#D9E0E7] dark:border-[#223244] bg-[#F5F7FA]/60 dark:bg-[#071A2B] text-[#071A2B] dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F2B705] focus:border-transparent transition-all pr-11"
                          required
                        />
                        <button
                          id="newPasswordToggleBtn"
                          type="button"
                          aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded text-gray-400 hover:text-[#071A2B] dark:hover:text-white focus:outline-none focus:ring-1 focus:ring-[#F2B705]"
                        >
                          {showNewPassword ? (
                            /* Eye Off Icon */
                            <svg className="w-4 h-4 text-[#F2B705]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                            </svg>
                          ) : (
                            /* Eye Icon */
                            <svg className="w-4 h-4 text-gray-400 hover:text-[#071A2B] dark:hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Live Password Requirements Checklist */}
                    <div className="p-3.5 rounded-xl bg-[#F5F7FA] dark:bg-[#071A2B]/70 border border-[#D9E0E7]/80 dark:border-[#223244]">
                      <p className="text-xs font-bold uppercase tracking-wider text-[#667085] dark:text-gray-400 mb-2.5 font-sora">
                        PASSWORD REQUIREMENTS
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                        <div
                          id="chkLength"
                          className={`flex items-center gap-2 transition-colors ${
                            hasLength
                              ? 'text-[#00843D] dark:text-emerald-400 font-semibold'
                              : 'text-[#667085] dark:text-gray-400'
                          }`}
                        >
                          <span
                            className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                              hasLength
                                ? 'bg-[#00843D] text-white'
                                : 'border border-gray-300 dark:border-gray-600'
                            }`}
                          >
                            {hasLength ? (
                              <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <span className="w-1.5 h-1.5 rounded-full bg-transparent" />
                            )}
                          </span>
                          <span>At least 8 characters</span>
                        </div>

                        <div
                          id="chkUpper"
                          className={`flex items-center gap-2 transition-colors ${
                            hasUpper
                              ? 'text-[#00843D] dark:text-emerald-400 font-semibold'
                              : 'text-[#667085] dark:text-gray-400'
                          }`}
                        >
                          <span
                            className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                              hasUpper
                                ? 'bg-[#00843D] text-white'
                                : 'border border-gray-300 dark:border-gray-600'
                            }`}
                          >
                            {hasUpper ? (
                              <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <span className="w-1.5 h-1.5 rounded-full bg-transparent" />
                            )}
                          </span>
                          <span>One uppercase letter</span>
                        </div>

                        <div
                          id="chkLower"
                          className={`flex items-center gap-2 transition-colors ${
                            hasLower
                              ? 'text-[#00843D] dark:text-emerald-400 font-semibold'
                              : 'text-[#667085] dark:text-gray-400'
                          }`}
                        >
                          <span
                            className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                              hasLower
                                ? 'bg-[#00843D] text-white'
                                : 'border border-gray-300 dark:border-gray-600'
                            }`}
                          >
                            {hasLower ? (
                              <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <span className="w-1.5 h-1.5 rounded-full bg-transparent" />
                            )}
                          </span>
                          <span>One lowercase letter</span>
                        </div>

                        <div
                          id="chkNumber"
                          className={`flex items-center gap-2 transition-colors ${
                            hasNumber
                              ? 'text-[#00843D] dark:text-emerald-400 font-semibold'
                              : 'text-[#667085] dark:text-gray-400'
                          }`}
                        >
                          <span
                            className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                              hasNumber
                                ? 'bg-[#00843D] text-white'
                                : 'border border-gray-300 dark:border-gray-600'
                            }`}
                          >
                            {hasNumber ? (
                              <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <span className="w-1.5 h-1.5 rounded-full bg-transparent" />
                            )}
                          </span>
                          <span>One number</span>
                        </div>
                      </div>
                    </div>

                    {/* Field 2: Confirm New Password */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label
                          htmlFor="confirmPasswordInput"
                          className="block text-xs font-bold uppercase tracking-wider text-[#17212B] dark:text-gray-200"
                        >
                          Confirm New Password <span className="text-red-500">*</span>
                        </label>
                        {isMismatch && (
                          <span id="mismatchAlert" className="text-xs font-semibold text-red-500">
                            Passwords do not match.
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          id="confirmPasswordInput"
                          name="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          value={confirmPassword}
                          onChange={(e) => {
                            setConfirmPassword(e.target.value);
                            setTouchedConfirm(true);
                            if (formError) setFormError('');
                          }}
                          placeholder="Re-type your new password"
                          className="w-full px-4 py-3 text-sm rounded-xl border border-[#D9E0E7] dark:border-[#223244] bg-[#F5F7FA]/60 dark:bg-[#071A2B] text-[#071A2B] dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F2B705] focus:border-transparent transition-all pr-11"
                          required
                        />
                        <button
                          id="confirmPasswordToggleBtn"
                          type="button"
                          aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded text-gray-400 hover:text-[#071A2B] dark:hover:text-white focus:outline-none focus:ring-1 focus:ring-[#F2B705]"
                        >
                          {showConfirmPassword ? (
                            /* Eye Off Icon */
                            <svg className="w-4 h-4 text-[#F2B705]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                            </svg>
                          ) : (
                            /* Eye Icon */
                            <svg className="w-4 h-4 text-gray-400 hover:text-[#071A2B] dark:hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Primary Submit Button */}
                    <div className="pt-2">
                      <button
                        id="submitResetBtn"
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3.5 px-6 rounded-xl bg-[#071A2B] dark:bg-[#F2B705] text-white dark:text-[#071A2B] font-sora font-bold text-sm hover:bg-[#17212B] dark:hover:bg-amber-400 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#071A2B]/15 dark:shadow-[#F2B705]/10 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#F2B705] disabled:opacity-75 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? (
                          <>
                            <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white dark:border-[#071A2B]/30 dark:border-t-[#071A2B] rounded-full animate-spin shrink-0" />
                            <span>Updating Password...</span>
                          </>
                        ) : (
                          <>
                            <span>Reset Password</span>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Secondary Navigation Links */}
                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-between text-xs text-[#667085] dark:text-gray-400 gap-2">
                      <div>
                        Remember your password?{' '}
                        <Link
                          to="/login"
                          className="font-bold text-[#071A2B] dark:text-white hover:text-[#F2B705] dark:hover:text-[#F2B705] underline underline-offset-2 cursor-pointer ml-1"
                        >
                          Sign In
                        </Link>
                      </div>
                      <div>
                        Need a new link?{' '}
                        <Link
                          to="/forgot-password"
                          className="font-semibold hover:underline cursor-pointer ml-1"
                        >
                          Forgot Password
                        </Link>
                      </div>
                    </div>
                  </form>
                </div>
              )}

              {/* STATE 2: SUCCESS STATE */}
              {appState === 'success' && (
                <div className="space-y-6 py-2" id="state-success-container">
                  {/* Eyebrow & Badge */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold tracking-wider uppercase text-[#F2B705] font-sora">
                        PASSWORD UPDATED
                      </span>
                    </div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-[#00843D] dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 mb-3">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>PASSWORD UPDATED</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold font-sora text-[#071A2B] dark:text-white tracking-tight">
                      Password Reset Successful
                    </h1>
                    <p className="mt-2 text-sm text-[#667085] dark:text-gray-300 leading-relaxed">
                      Your password has been updated successfully. You can now sign in to your WinDriveSA account.
                    </p>
                  </div>

                  {/* Reassurance Note Card */}
                  <div className="p-4 rounded-xl border border-[#D9E0E7] dark:border-[#223244] bg-[#F5F7FA] dark:bg-[#071A2B]/70 text-xs space-y-2.5 text-[#667085] dark:text-gray-300">
                    <div className="flex items-start gap-2.5">
                      <svg className="w-4 h-4 text-[#00843D] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <span className="font-semibold text-[#17212B] dark:text-gray-200">
                        All active sessions have been terminated under POPIA Section 18 governance.
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 pl-6.5">
                      Institutional protocol ensures no orphaned sessions remain open on secondary desktop or mobile devices.
                    </p>
                  </div>

                  {/* Primary Action: Sign In */}
                  <div className="space-y-3 pt-2">
                    <Link
                      to="/login"
                      id="btn-success-signin"
                      className="w-full py-3.5 px-6 rounded-xl bg-[#071A2B] dark:bg-[#F2B705] text-white dark:text-[#071A2B] font-sora font-bold text-sm hover:bg-[#17212B] dark:hover:bg-amber-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#071A2B]/15 text-center cursor-pointer"
                    >
                      <span>Sign In</span>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </Link>
                  </div>
                </div>
              )}

              {/* STATE 3: INVALID / EXPIRED LINK */}
              {appState === 'expired' && (
                <div className="space-y-6 py-2" id="state-expired-container">
                  {/* Eyebrow & Badge */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold tracking-wider uppercase text-[#F2B705] font-sora">
                        PASSWORD RECOVERY
                      </span>
                    </div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 mb-3">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span>LINK EXPIRED</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold font-sora text-[#071A2B] dark:text-white tracking-tight">
                      Reset Link Expired
                    </h1>
                    <p className="mt-2 text-sm text-[#667085] dark:text-gray-300 leading-relaxed">
                      This password reset link is no longer valid. Request a new reset link to continue.
                    </p>
                  </div>

                  {/* Advisory Guidance Card */}
                  <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 text-xs space-y-2 text-amber-900 dark:text-amber-200">
                    <p className="font-bold font-sora">Security Expiration Policies:</p>
                    <ul className="list-disc list-inside space-y-1 text-amber-800 dark:text-amber-300">
                      <li>Recovery tokens expire automatically 15 minutes after issuance.</li>
                      <li>Requesting a newer link invalidates all preceding tokens.</li>
                      <li>Single-use tokens cannot be reused once submitted.</li>
                    </ul>
                  </div>

                  {/* Primary & Secondary Actions */}
                  <div className="space-y-3 pt-2">
                    <Link
                      to="/forgot-password"
                      id="btn-request-new-link"
                      className="w-full py-3.5 px-6 rounded-xl bg-[#071A2B] dark:bg-[#F2B705] text-white dark:text-[#071A2B] font-sora font-bold text-sm hover:bg-[#17212B] dark:hover:bg-amber-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#071A2B]/15 text-center cursor-pointer"
                    >
                      <span>Request New Reset Link</span>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </Link>

                    <Link
                      to="/login"
                      id="btn-expired-signin"
                      className="w-full py-3 px-6 rounded-xl border border-[#D9E0E7] dark:border-[#223244] text-[#17212B] dark:text-gray-200 font-semibold text-xs hover:bg-gray-50 dark:hover:bg-white/5 transition-all text-center block cursor-pointer"
                    >
                      Back to Sign In
                    </Link>
                  </div>
                </div>
              )}

            </div>
          </section>
        </div>
      </main>

      {/* RESTRAINED AUTH FOOTER */}
      <footer className="w-full border-t border-[#D9E0E7] dark:border-[#223244] bg-white dark:bg-[#0E1D2D] py-5 px-4 sm:px-6 lg:px-8 shrink-0 z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#667085] dark:text-gray-400">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#071A2B] dark:text-white font-sora">WinDriveSA</span>
            <span className="text-gray-400">•</span>
            <span>“Win Big. Drive Away.”</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 justify-center">
            <Link to="/#terms" className="hover:underline hover:text-[#071A2B] dark:hover:text-white transition-colors">
              Terms &amp; Conditions
            </Link>
            <Link to="/#privacy" className="hover:underline hover:text-[#071A2B] dark:hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <span className="text-emerald-700 dark:text-emerald-400 font-medium inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00843D]" />
              POPIA Section 18 statutory personal data protection
            </span>
            <span className="text-gray-400 hidden lg:inline">© 2026 WinDriveSA (Pty) Ltd.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
