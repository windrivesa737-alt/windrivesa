import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { resetPassword as authResetPassword } from '../../services/auth.js';

export default function ForgotPassword() {
  const { theme, toggleTheme } = useTheme();

  // Controlled form state
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  // Email validation regex (standard RFC-compliant email pattern)
  const validateEmail = (value) => {
    const trimmed = value.trim();
    if (!trimmed) {
      return 'Email address is required.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      return 'Please enter a valid email address.';
    }
    return '';
  };

  const handleInputChange = (e) => {
    setEmail(e.target.value);
    if (error) {
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validateEmail(email);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await authResetPassword(email);
      setSubmittedEmail(email.trim());
      setIsSubmitting(false);
      setIsSubmitted(true);
    } catch (err) {
      // Even on failure, show uniform submitted response to prevent enumeration
      setSubmittedEmail(email.trim());
      setIsSubmitting(false);
      setIsSubmitted(true);
    }
  };

  const handleResetToForm = () => {
    setIsSubmitted(false);
    setEmail('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#071A2B] text-slate-800 dark:text-slate-100 flex flex-col transition-colors duration-200 overflow-x-hidden font-manrope">
      {/* Top Header for Mobile & Tablet (strictly visible below lg) */}
      <header className="flex lg:hidden items-center justify-between px-6 py-4 border-b border-[#D9E0E7] dark:border-[#1E3A56] bg-white dark:bg-[#071A2B] shrink-0">
        <Link
          to="/"
          aria-label="WinDriveSA Home"
          className="block focus:outline-none focus:ring-2 focus:ring-[#F2B705] rounded"
        >
          <img
            alt="WinDriveSA Logo"
            className="h-8 sm:h-9 w-auto object-contain"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuD4-0TkwB-qZrKLLYfY5NaCeoY3JSQ_iGyXdFFLFpQvvzU4sPDCIg367J8cnTvTxG7NuizfqyZweccTWZ3jhFwib79RXqVbTq1AMMbVdge5k3m6L4XO5dtX_NtHdZqDK8UwL6LbPU26jnioPYL6JeVvU2t2hzGDDvoF71qV1sFOnvZysXEoliqpEZqss04952TcyI-9iAFL59QmWUm6ClkV3o-kdK1UlExci11J8X8aGA6K_0A_oC9TXzRHsaGwxB9EMtA"
          />
        </Link>
        <button
          aria-label={`Toggle visual theme (currently ${theme} mode)`}
          className="p-2 rounded-lg border border-[#D9E0E7] dark:border-[#1E3A56] bg-slate-50 dark:bg-[#0D2438] text-slate-600 dark:text-slate-300 hover:text-[#071A2B] dark:hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#F2B705]"
          onClick={toggleTheme}
          type="button"
        >
          {theme === 'dark' ? (
            /* Sun Icon (for Dark Mode) */
            <svg className="w-4 h-4 text-[#F2B705]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
            </svg>
          ) : (
            /* Moon Icon (for Light Mode) */
            <svg className="w-4 h-4 text-[#071A2B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
            </svg>
          )}
        </button>
      </header>

      {/* BEGIN: Main Container */}
      <main className="flex-1 flex flex-col lg:flex-row w-full min-h-0">
        {/* BEGIN: Automotive Image Section */}
        {/* Mobile: Clean natural document flow above form (h-48 sm:h-56 md:h-64, w-full). Desktop: Full-height 58% visual hero */}
        <section
          aria-label="WinDriveSA Brand Overlook"
          className="relative w-full lg:w-[58%] h-48 sm:h-56 md:h-64 lg:h-auto lg:min-h-full overflow-hidden bg-[#071A2B] select-none shrink-0 flex flex-col justify-between"
        >
          {/* Automotive Photography */}
          <img
            alt="Ultra-high-resolution commercial editorial automotive photography of a luxury dark metallic graphite modern double-cab 4x4 pickup truck parked on an elevated scenic mountain pass overlook in South Africa"
            className="absolute inset-0 w-full h-full object-cover object-center transform scale-[1.02] filter saturate-[1.05]"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAf9P8__QEDYY4ssRBlbVkVzc7syCUtHlNz1eIH6lOc8_aeXkHb_RNIZlnsaL-T6W5aOOjXgO82_B-WMWg5IhzZM6BkSq7Yie2m4xhE8pxjLE8a__8jWuCpmsrCzSy5YHRArt2dxpNZfAeSCsA62GAP7CbW_utk6VXRi4hvGM_-dNugxXZiuRfIINmsNuus0KHGTYkRj6lkTmAMa97yIiqpS98NRRPPQM92iGHlLkzMDEt1Tsdk5uC6PA"
          />
          {/* Atmospheric Vignette Layer */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(180deg, rgba(7, 26, 43, 0.72) 0%, rgba(7, 26, 43, 0.18) 40%, rgba(7, 26, 43, 0.6) 75%, rgba(7, 26, 43, 0.95) 100%)',
            }}
          ></div>

          {/* Mobile Subtle Overlay Pill */}
          <div className="relative z-10 p-4 lg:p-12 block lg:hidden">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-900/70 border border-white/15 backdrop-blur-md text-[11px] font-semibold tracking-wider text-slate-200">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F2B705] shrink-0"></span>
              <span>ACCOUNT RECOVERY</span>
            </div>
          </div>

          {/* Desktop Top Overlay Content */}
          <div className="relative z-10 p-6 lg:p-12 hidden lg:block">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/70 border border-white/15 backdrop-blur-md text-xs font-semibold tracking-wider text-slate-200">
              <span className="w-2 h-2 rounded-full bg-[#F2B705] shrink-0"></span>
              <span>ACCOUNT RECOVERY</span>
            </div>
          </div>

          {/* Desktop Center & Bottom Editorial Content */}
          <div className="relative z-10 p-6 lg:p-12 mt-auto hidden lg:block">
            <div className="max-w-xl">
              <h2 className="font-sora text-2xl lg:text-[44px] font-extrabold text-white leading-tight lg:leading-[1.15] tracking-tight">
                Restore Your Account Access.
              </h2>
              <p className="mt-3 text-slate-300 text-sm lg:text-base leading-relaxed max-w-lg font-normal">
                Enter your verified email to receive secure instructions and resume your WinDriveSA reward journey.
              </p>
            </div>

            {/* Verified Institutional Credentials Strip */}
            <div className="mt-8 pt-6 border-t border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold tracking-widest text-[#F2B705] uppercase block">
                  WIN BIG. DRIVE AWAY.
                </span>
                <span className="text-[13px] text-slate-300 font-normal">
                  Institutional Customer Rewards Platform
                </span>
              </div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded bg-black/45 border border-white/15 text-slate-200 text-xs font-medium">
                <svg className="w-3.5 h-3.5 text-[#F2B705]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                </svg>
                <span>Encrypted Recovery Channel</span>
              </div>
            </div>
          </div>
        </section>
        {/* END: Left Visual Hero */}

        {/* BEGIN: Right Interactive Panel */}
        <section
          aria-label="Password Reset Area"
          className="w-full lg:w-[42%] flex flex-col justify-between bg-white dark:bg-[#071A2B] px-6 sm:px-12 lg:px-16 pt-6 pb-12 lg:py-10"
        >
          {/* Desktop-only Header: Logo & Theme Switcher */}
          <header className="hidden lg:flex items-center justify-between w-full pb-6 border-b border-[#D9E0E7] dark:border-[#1E3A56] shrink-0">
            {/* Logo Image Only */}
            <Link
              to="/"
              aria-label="WinDriveSA Home"
              className="block focus:outline-none focus:ring-2 focus:ring-[#F2B705] rounded"
            >
              <img
                alt="WinDriveSA Logo"
                className="h-9 sm:h-11 w-auto object-contain"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD2ZtRs2Ipwn88MUno1NRHwgf1ho2B-5BlkhyLeVAZtW8CwcAIbN2Hd724aBFxLJUuYpY03QypQa2vnV5Bsw-hkjo4iv0yqM9BJvk8ZdYvg3OXjDeaH1SfJVLGBJnB9QoDuYbPM9Qvl5IknWwTZRe278slhth7olFyOpUzjwYz7JCduEqYdqyWhN4U4Pwo2_kk58WgDCzL7y8rnd9uI4Ns4Dxn-y2iZghyg2ZlZJrna3k_e1UJtpZLieDMJntAXAzX4fnw"
              />
            </Link>

            {/* Dark/Light Mode Toggle Button */}
            <button
              aria-label={`Toggle visual theme (currently ${theme} mode)`}
              className="p-2.5 rounded-lg border border-[#D9E0E7] dark:border-[#1E3A56] bg-slate-50 dark:bg-[#0D2438] text-slate-600 dark:text-slate-300 hover:text-[#071A2B] dark:hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#F2B705]"
              onClick={toggleTheme}
              type="button"
            >
              {theme === 'dark' ? (
                /* Sun Icon (for Dark Mode) */
                <svg className="w-4 h-4 text-[#F2B705]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                </svg>
              ) : (
                /* Moon Icon (for Light Mode) */
                <svg className="w-4 h-4 text-[#071A2B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                </svg>
              )}
            </button>
          </header>

          {/* Center Container for Form or Success States */}
          <div className="lg:my-auto py-2 sm:py-6 lg:py-8 max-w-md w-full mx-auto">
            {!isSubmitted ? (
              /* DEFAULT FORM STATE */
              <div className="space-y-6" id="view-form-container">
                <div>
                  <span className="text-xs font-extrabold tracking-wider text-amber-500 dark:text-[#F2B705] uppercase block font-manrope">
                    PASSWORD RECOVERY
                  </span>
                  <h1 className="font-sora text-2xl sm:text-3xl font-extrabold text-[#071A2B] dark:text-white mt-1.5 tracking-tight">
                    Reset Your Password
                  </h1>
                  <p className="text-sm text-[#667085] dark:text-slate-400 mt-2 font-normal leading-relaxed">
                    Enter the email address linked to your account and we’ll send you a password reset link.
                  </p>
                </div>

                {/* Recovery Form */}
                <form className="space-y-4" id="recovery-form" noValidate onSubmit={handleSubmit}>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        className="block text-[11px] font-bold tracking-wider text-slate-700 dark:text-slate-200 uppercase"
                        htmlFor="email-field"
                      >
                        EMAIL ADDRESS <span className="text-amber-500">*</span>
                      </label>
                    </div>
                    <div className="relative">
                      <input
                        autoComplete="email"
                        className={`w-full px-3.5 py-3 rounded-lg border text-sm text-[#071A2B] dark:text-white bg-white dark:bg-[#0D2438] transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F2B705] focus:border-[#071A2B] dark:focus:border-[#F2B705] ${
                          error
                            ? 'border-rose-500 focus:ring-rose-400'
                            : 'border-[#D9E0E7] dark:border-[#1E3A56]'
                        }`}
                        id="email-field"
                        name="email"
                        placeholder="you@example.com"
                        required
                        type="email"
                        value={email}
                        onChange={handleInputChange}
                      />
                    </div>
                    {/* Inline Validation Error */}
                    {error && (
                      <p
                        className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1"
                        id="field-error-text"
                      >
                        <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                        </svg>
                        <span>{error}</span>
                      </p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    className="w-full py-3.5 px-5 rounded-lg bg-[#071A2B] dark:bg-[#F2B705] text-white dark:text-[#071A2B] font-semibold text-sm tracking-wide shadow-sm hover:bg-[#04101D] dark:hover:bg-amber-400 active:scale-[0.99] transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#071A2B] dark:focus:ring-[#F2B705] disabled:opacity-75 disabled:cursor-not-allowed"
                    id="submit-button"
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span
                          className="inline-block w-4 h-4 border-2 border-white/30 border-t-white dark:border-[#071A2B]/30 dark:border-t-[#071A2B] rounded-full animate-spin shrink-0"
                          id="btn-spinner"
                        ></span>
                        <span id="btn-text">Sending Reset Link...</span>
                      </>
                    ) : (
                      <span id="btn-text">Send Reset Link</span>
                    )}
                  </button>
                </form>

                {/* Navigation Dividers & Secondary Redirection Links */}
                <div className="pt-4 border-t border-[#D9E0E7] dark:border-[#1E3A56] space-y-3 text-center text-xs">
                  <p className="text-slate-600 dark:text-slate-400 font-normal">
                    Remember your password?{' '}
                    <Link
                      to="/login"
                      className="font-bold text-[#071A2B] dark:text-[#F2B705] hover:underline ml-1"
                    >
                      Back to Sign In
                    </Link>
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 font-normal">
                    Don't have an account?{' '}
                    <Link
                      to="/register"
                      className="font-bold text-[#071A2B] dark:text-[#F2B705] hover:underline ml-1"
                    >
                      Create Account
                    </Link>
                  </p>
                </div>
              </div>
            ) : (
              /* SUCCESS STATE */
              <div className="space-y-6" id="view-success-container">
                <div className="space-y-3">
                  {/* Approved Status Chip */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[#00843D] dark:text-emerald-300 text-xs font-bold tracking-wider uppercase font-manrope">
                    <span className="w-2 h-2 rounded-full bg-[#00843D]"></span>
                    <span>RESET LINK SENT</span>
                  </div>
                  <h1 className="font-sora text-2xl sm:text-3xl font-extrabold text-[#071A2B] dark:text-white tracking-tight">
                    Check Your Email
                  </h1>
                  <p className="text-sm text-[#667085] dark:text-slate-300 leading-relaxed font-normal">
                    If an account exists for{' '}
                    <span className="font-semibold text-[#071A2B] dark:text-white" id="confirmed-email-address">
                      {submittedEmail}
                    </span>
                    , we’ve sent instructions to reset your password.
                  </p>
                </div>

                {/* Security Callout Box */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0D2438] border border-[#D9E0E7] dark:border-[#1E3A56] space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#071A2B] dark:text-slate-100 uppercase tracking-wide">
                    <svg className="w-4 h-4 text-[#F2B705] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                    </svg>
                    <span>Security & Delivery Notice</span>
                  </div>
                  <p className="text-xs text-[#667085] dark:text-slate-300 leading-relaxed">
                    Please check your inbox and spam folder. For your privacy and security, the recovery link will automatically expire in{' '}
                    <strong className="font-semibold text-[#071A2B] dark:text-white">15 minutes</strong>.{' '}
                    <Link to="/reset-password" className="font-semibold text-[#071A2B] dark:text-[#F2B705] hover:underline">
                      Proceed to Reset Password &rarr;
                    </Link>
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3 pt-2">
                  <Link
                    to="/login"
                    className="w-full py-3.5 px-5 rounded-lg bg-[#071A2B] dark:bg-[#F2B705] text-white dark:text-[#071A2B] font-semibold text-sm tracking-wide shadow-sm hover:bg-[#04101D] dark:hover:bg-amber-400 transition-colors flex items-center justify-center text-center"
                  >
                    Back to Sign In
                  </Link>
                  <button
                    className="w-full py-2.5 px-4 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-[#071A2B] dark:hover:text-white transition-colors text-center cursor-pointer"
                    onClick={handleResetToForm}
                    type="button"
                  >
                    Try Another Email
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Legal Compliance & Protection Footer */}
          <footer className="pt-6 mt-6 lg:mt-0 border-t border-[#D9E0E7] dark:border-[#1E3A56] text-[11px] sm:text-xs text-[#667085] dark:text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
            <div>
              © 2026 WinDriveSA (Pty) Ltd. All rights reserved.
            </div>
            <div className="flex items-center space-x-3">
              <Link to="/#terms" className="hover:underline">
                Terms
              </Link>
              <span>•</span>
              <Link to="/#privacy" className="hover:underline">
                Privacy
              </Link>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00843D]"></span>
                POPIA Compliant
              </span>
            </div>
          </footer>
        </section>
        {/* END: Right Interactive Panel */}
      </main>
      {/* END: Main Container */}
    </div>
  );
}
