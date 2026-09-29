import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const { theme, toggleTheme } = useTheme();
  const { login, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Controlled form state (clean empty fields for production)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: false,
  });

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isEmailUnconfirmed, setIsEmailUnconfirmed] = useState(false);
  const [lifecycleState, setLifecycleState] = useState('default'); // 'default' | 'error' | 'pending' | 'rejected'
  const [isRefreshingStatus, setIsRefreshingStatus] = useState(false);

  // Email format validation
  const validateForm = () => {
    const newErrors = {};

    const emailTrimmed = formData.email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailTrimmed) {
      newErrors.email = 'Email address is required.';
    } else if (!emailRegex.test(emailTrimmed)) {
      newErrors.email = 'Please provide a valid email address.';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setAuthError('');
    setIsEmailUnconfirmed(false);
    if (errors[field]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setAuthError('');
    setIsEmailUnconfirmed(false);

    try {
      const result = await login({
        email: formData.email,
        password: formData.password,
      });

      setIsSubmitting(false);

      if (!result.success) {
        setAuthError(result.error || 'Unable to sign in. Please check your email address and password and try again.');
        if (result.isEmailUnconfirmed) {
          setIsEmailUnconfirmed(true);
        } else {
          setIsEmailUnconfirmed(false);
        }
        setLifecycleState('error');
        return;
      }

      const profile = result.profile;
      const role = (profile?.role || '').toUpperCase();
      const status = (profile?.account_status || 'PENDING_REVIEW').toUpperCase();

      // Handle Admin role redirection
      if (role === 'ADMIN') {
        const dest = location.state?.from?.pathname?.startsWith('/admin')
          ? location.state.from.pathname
          : '/admin';
        navigate(dest, { replace: true });
        return;
      }

      // Handle Constitutional Lifecycle Account States
      if (status === 'PENDING_REVIEW') {
        setLifecycleState('pending');
      } else if (status === 'REJECTED') {
        setLifecycleState('rejected');
      } else if (status === 'APPROVED' || status === 'ACTIVE') {
        const dest = location.state?.from?.pathname && !location.state.from.pathname.startsWith('/admin')
          ? location.state.from.pathname
          : '/dashboard';
        navigate(dest, { replace: true });
      } else if (status === 'DEACTIVATED') {
        setAuthError('Your account has been deactivated. Please contact WinDriveSA support for assistance.');
        setLifecycleState('error');
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      setIsSubmitting(false);
      setAuthError('Unable to sign in. Please check your email address and password and try again.');
      setLifecycleState('error');
    }
  };

  const handleCheckStatus = async () => {
    setIsRefreshingStatus(true);
    try {
      const latestProfile = await refreshProfile();
      if (latestProfile) {
        const status = (latestProfile.account_status || '').toUpperCase();
        if (status === 'APPROVED' || status === 'ACTIVE') {
          navigate('/dashboard', { replace: true });
          return;
        } else if (status === 'REJECTED') {
          setLifecycleState('rejected');
        }
      }
    } catch (_) {}
    setIsRefreshingStatus(false);
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className="bg-[#F5F7FA] dark:bg-[#071A2B] text-[#17212B] dark:text-gray-100 antialiased selection:bg-[#F2B705] selection:text-[#071A2B] flex flex-col justify-between min-h-screen transition-colors duration-300 font-manrope">
      {/* BEGIN: Main Content Grid */}
      <main className="flex-grow flex flex-col lg:flex-row w-full overflow-hidden">
        {/* BEGIN: Left Hero Visual Panel (58% desktop width) */}
        <section
          className="order-2 lg:order-1 relative lg:w-[58%] min-h-[380px] lg:min-h-full flex flex-col justify-between p-8 sm:p-12 lg:p-16 text-white overflow-hidden bg-[#071A2B]"
          data-purpose="automotive-showcase"
        >
          {/* Background Editorial Photography */}
          <div className="absolute inset-0 z-0">
            <img
              alt="Editorial commercial automotive photography of a modern luxury dark metallic charcoal pickup truck parked at dusk overlooking an expansive scenic mountain highway in South Africa"
              className="w-full h-full object-cover object-center transform scale-100 hover:scale-105 transition-transform duration-1000 ease-out select-none"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCZTpQD8Lq2xfLbJt6qB_N2gr72ONjJy5XPmH_b8uz7NjHEqXz7bZPBo5kF80E0iygfmWQQIBRVLtywugfRdOUcKBwCemBJEhNnE1sTa0znYFhZmjBcRo-gAz36iAx79YbRQfx0IAjehlWEulsxAo6G_xEv1NwoEYF00Q4LG7RIlHdo731oloXSnxy6buZRi_qXVzFIu0i5BALNc_IgLcy6Ee72hPsJrsBHWQ3qlBvJrELely4nZCmauA"
            />
            {/* Deep Navy Gradient Overlay for optimal constitutional contrast & readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#071A2B] via-[#071A2B]/70 to-[#071A2B]/35 mix-blend-multiply pointer-events-none"></div>
            <div className="absolute inset-0 bg-[#071A2B]/30 pointer-events-none"></div>
          </div>

          {/* Left Panel Top Eyebrow */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#071A2B]/80 backdrop-blur-md border border-white/15 text-xs tracking-wider uppercase font-semibold text-gray-200">
              <span className="w-2 h-2 rounded-full bg-[#F2B705]"></span>
              <span>Welcome Back</span>
            </div>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs text-white/80 hover:text-white transition-colors px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 backdrop-blur-sm lg:hidden"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span>Home</span>
            </Link>
          </div>

          {/* Left Panel Editorial Headline & Copy */}
          <div className="relative z-10 my-auto py-10 lg:py-0 max-w-xl">
            <h1 className="font-sora text-3xl sm:text-4xl xl:text-5xl font-extrabold tracking-tight leading-tight text-white mb-4">
              Your Reward Journey Continues.
            </h1>
            <p className="text-base sm:text-lg text-gray-300 font-normal leading-relaxed">
              Sign in to access your WinDriveSA account and view your current reward information and claim status.
            </p>
          </div>

          {/* Left Panel Footer: Institutional Credentials */}
          <div className="relative z-10 pt-6 border-t border-white/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="block text-xs uppercase tracking-widest text-[#F2B705] font-bold">
                Win Big. Drive Away.
              </span>
              <span className="text-xs text-gray-300 font-medium">Institutional Customer Rewards Platform</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-300 bg-[#071A2B]/60 px-3 py-1.5 rounded-md border border-white/10 backdrop-blur-sm">
              <svg aria-hidden="true" className="w-3.5 h-3.5 text-[#F2B705]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
              </svg>
              <span>Secure Member Access</span>
            </div>
          </div>
        </section>
        {/* END: Left Hero Visual Panel */}

        {/* BEGIN: Right Interactive Form Panel (42% desktop width) */}
        <section
          className="order-1 lg:order-2 lg:w-[42%] flex flex-col justify-between p-6 sm:p-10 lg:p-14 bg-white dark:bg-[#0D2438] relative z-10 transition-colors duration-300 min-h-full"
          data-purpose="auth-interface"
        >
          {/* Right Header: Approved Logo & Theme Toggle */}
          <header className="flex items-center justify-between pb-6 border-b border-[#D9E0E7] dark:border-[#1E354B]/60">
            {/* Logo: STRICTLY the approved image only, NO duplicate text beside it */}
            <Link
              to="/"
              aria-label="WinDriveSA Home"
              className="inline-block transition-opacity hover:opacity-95 focus:outline-none"
            >
              <img
                alt="WinDriveSA - Win Big. Drive Away."
                className="h-10 sm:h-11 w-auto object-contain"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDtC6tvoCPFSN7t3uH4NGlAkgzgRdFFQDQF13c2QzIwHjF2G_mAIPOjOTBoY-U6st_SAf0vexFyhTK-WJpTHngk76PNnaMCAi6rsnekPd7ftn51OL79qLlm64rUFYT4xvqeNVC9KxC6HHDsbXwlFOwVSzV_KVnislL7NXuc1mHWpziMF1yD4xDZPWRdtL13ew4kgnQ_Ns_rqE8Bh2bkzKNSoDTuXhC8bmZFzezpN-jc7w2YEb2h1WPN-9wa5aBADWWL-1o"
              />
            </Link>

            <div className="flex items-center gap-2">
              <Link
                to="/"
                className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-[#667085] hover:text-[#17212B] dark:text-gray-300 dark:hover:text-white px-2.5 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-[#071A2B] transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                <span>Back to Home</span>
              </Link>

              {/* Accessible Light/Dark Mode Switcher */}
              <button
                id="theme-toggle"
                type="button"
                aria-label={`Toggle theme (currently ${theme} mode)`}
                onClick={toggleTheme}
                className="p-2 rounded-lg text-gray-500 hover:text-[#071A2B] dark:text-gray-400 dark:hover:text-[#F2B705] bg-[#F5F7FA] dark:bg-[#071A2B]/80 border border-[#D9E0E7] dark:border-[#1E354B] transition-colors focus:outline-none focus:ring-2 focus:ring-[#F2B705]"
              >
                {theme === 'dark' ? (
                  /* Sun Icon */
                  <svg className="w-5 h-5 text-[#F2B705]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                  </svg>
                ) : (
                  /* Moon Icon */
                  <svg className="w-5 h-5 text-[#071A2B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                  </svg>
                )}
              </button>
            </div>
          </header>

          {/* Center Container for Form and Lifecycle States */}
          <div className="py-8 sm:py-10 max-w-md w-full mx-auto">
            {/* ============================================== */}
            {/* STATE A & B: STANDARD LOGIN & ERROR CONTAINER  */}
            {/* ============================================== */}
            {(lifecycleState === 'default' || lifecycleState === 'error') && (
              <div id="view-login-state" className="transition-opacity duration-200">
                {/* Heading Group */}
                <div className="mb-6">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#F2B705] mb-1.5 block font-manrope">
                    WELCOME BACK
                  </span>
                  <h2 className="font-sora text-2xl sm:text-3xl font-bold text-[#17212B] dark:text-white tracking-tight">
                    Sign In to Your Account
                  </h2>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                    Enter your details to continue to your WinDriveSA dashboard.
                  </p>
                </div>

                {/* State B Notification: Authentication Error Banner */}
                {(lifecycleState === 'error' || authError) && (
                  <div
                    id="auth-error-alert"
                    role="alert"
                    className={`mb-6 p-4 rounded-md border ${
                      isEmailUnconfirmed
                        ? 'border-amber-300 bg-amber-50 dark:bg-amber-950/40 dark:border-amber-800/60'
                        : 'border-red-300 bg-red-50 dark:bg-red-950/40 dark:border-red-800/60'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {isEmailUnconfirmed ? (
                        <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-[20px] shrink-0 mt-0.5">
                          mark_email_unread
                        </span>
                      ) : (
                        <svg className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                        </svg>
                      )}
                      <div>
                        <h4 className={`text-xs font-bold uppercase tracking-wider font-sora ${
                          isEmailUnconfirmed
                            ? 'text-amber-800 dark:text-amber-300'
                            : 'text-red-800 dark:text-red-300'
                        }`}>
                          {isEmailUnconfirmed ? 'Email Confirmation Required' : 'Authentication Failed'}
                        </h4>
                        <p className={`text-sm mt-0.5 font-normal ${
                          isEmailUnconfirmed
                            ? 'text-amber-900 dark:text-amber-200'
                            : 'text-red-700 dark:text-red-300/90'
                        }`}>
                          {authError || 'The email address or password is incorrect. Please try again.'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sign-In Form */}
                <form id="loginForm" onSubmit={handleSubmit} noValidate className="space-y-4 sm:space-y-5">
                  {/* Email Field */}
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-xs font-bold uppercase tracking-wider text-[#071A2B] dark:text-gray-200 mb-1.5"
                    >
                      EMAIL ADDRESS <span className="text-[#F2B705]">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        autoComplete="email"
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={`w-full px-4 py-3 rounded-md border bg-white dark:bg-[#071A2B]/60 text-[#17212B] dark:text-white placeholder-gray-400 text-sm focus:border-[#F2B705] focus:ring-1 focus:ring-[#F2B705] focus:outline-none transition-colors ${
                          errors.email
                            ? 'border-red-500 focus:ring-red-400'
                            : 'border-[#D9E0E7] dark:border-[#1E354B]'
                        }`}
                      />
                    </div>
                    {errors.email && (
                      <p id="error-email" className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Password Field */}
                  <div>
                    <label
                      htmlFor="password"
                      className="block text-xs font-bold uppercase tracking-wider text-[#071A2B] dark:text-gray-200 mb-1.5"
                    >
                      PASSWORD <span className="text-[#F2B705]">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        autoComplete="current-password"
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        className={`w-full pl-4 pr-12 py-3 rounded-md border bg-white dark:bg-[#071A2B]/60 text-[#17212B] dark:text-white placeholder-gray-400 text-sm focus:border-[#F2B705] focus:ring-1 focus:ring-[#F2B705] focus:outline-none transition-colors ${
                          errors.password
                            ? 'border-red-500 focus:ring-red-400'
                            : 'border-[#D9E0E7] dark:border-[#1E354B]'
                        }`}
                      />
                      {/* Interactive Show/Hide Toggle */}
                      <button
                        id="togglePasswordBtn"
                        type="button"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-[#071A2B] dark:hover:text-[#F2B705] transition-colors focus:outline-none"
                      >
                        {showPassword ? (
                          /* Eye Closed Icon */
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                          </svg>
                        ) : (
                          /* Eye Open Icon */
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                            <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                          </svg>
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p id="error-password" className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">
                        {errors.password}
                      </p>
                    )}
                  </div>

                  {/* Utility Row: Remember Device & Forgot Password */}
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600 dark:text-gray-300">
                      <input
                        id="remember"
                        name="remember"
                        type="checkbox"
                        checked={formData.remember}
                        onChange={(e) => handleInputChange('remember', e.target.checked)}
                        className="rounded border-[#D9E0E7] text-[#071A2B] focus:ring-[#F2B705] focus:ring-offset-0 dark:border-[#1E354B] dark:bg-[#071A2B]/80 cursor-pointer"
                      />
                      <span className="text-xs sm:text-sm font-medium select-none">Remember my device</span>
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-xs sm:text-sm font-semibold text-[#071A2B] dark:text-[#F2B705] hover:underline focus:outline-none transition-colors"
                    >
                      Forgot Password?
                    </Link>
                  </div>

                  {/* Primary Login Button */}
                  <div className="pt-2">
                    <button
                      id="submitBtn"
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full flex items-center justify-center py-3.5 px-6 rounded-md bg-[#071A2B] hover:bg-[#0c263f] text-white text-sm font-semibold tracking-wide border border-transparent hover:border-[#F2B705]/40 focus:ring-2 focus:ring-[#F2B705] focus:ring-offset-2 transition-all shadow-md active:scale-[0.99] dark:bg-[#F2B705] dark:text-[#071A2B] dark:hover:bg-[#e0a800] disabled:opacity-80 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2" id="btnSpinner">
                          <svg className="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" fill="currentColor"></path>
                          </svg>
                          <span id="btnText">Signing In...</span>
                        </span>
                      ) : (
                        <span id="btnText">Log In</span>
                      )}
                    </button>
                  </div>
                </form>

                {/* Account Switcher / Register Link */}
                <div className="mt-8 pt-6 border-t border-[#D9E0E7] dark:border-[#1E354B]/60 text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Don't have an account?{' '}
                    <Link
                      id="link-register"
                      to="/register"
                      className="font-bold text-[#071A2B] dark:text-[#F2B705] hover:underline ml-1"
                    >
                      Create Account
                    </Link>
                  </p>
                </div>
              </div>
            )}

            {/* ============================================== */}
            {/* STATE C: PENDING REVIEW ACCOUNT STATE          */}
            {/* ============================================== */}
            {lifecycleState === 'pending' && (
              <div id="view-pending-state" className="transition-opacity duration-200">
                <div className="p-6 sm:p-8 rounded-lg bg-amber-50/50 dark:bg-[#071A2B]/60 border border-amber-300 dark:border-amber-500/30">
                  {/* Warm Amber/Gold Status Badge */}
                  <div
                    id="badge-pending"
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 text-xs font-bold uppercase tracking-wider mb-4 border border-amber-300 dark:border-amber-700/50 font-manrope"
                  >
                    <span className="w-2 h-2 rounded-full bg-[#F2B705] animate-ping"></span>
                    <span>PENDING REVIEW</span>
                  </div>
                  <h3 className="font-sora text-xl sm:text-2xl font-bold text-[#17212B] dark:text-white mb-3">
                    Your Account Is Still Under Review
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-6 font-normal">
                    Your account has been submitted successfully and is currently being reviewed. Reward information will become available after approval and reward assignment.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      id="btn-refresh-status"
                      type="button"
                      disabled={isRefreshingStatus}
                      onClick={handleCheckStatus}
                      className="inline-flex justify-center items-center py-2.5 px-4 rounded-md bg-[#071A2B] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#0c263f] border border-[#F2B705]/30 transition-all dark:bg-[#F2B705] dark:text-[#071A2B] dark:hover:bg-[#e0a800]"
                    >
                      {isRefreshingStatus ? (
                        <>
                          <svg className="animate-spin h-3.5 w-3.5 mr-1.5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Checking...</span>
                        </>
                      ) : (
                        <span>Check Status Again</span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setLifecycleState('default')}
                      className="inline-flex justify-center items-center py-2.5 px-4 rounded-md bg-white dark:bg-[#0D2438] text-[#17212B] dark:text-gray-200 text-xs font-semibold uppercase tracking-wider border border-[#D9E0E7] dark:border-[#1E354B] hover:bg-gray-50 dark:hover:bg-[#071A2B] transition-all"
                    >
                      Back to Sign In
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================== */}
            {/* STATE D: REJECTED / NOT APPROVED ACCOUNT STATE */}
            {/* ============================================== */}
            {lifecycleState === 'rejected' && (
              <div id="view-rejected-state" className="transition-opacity duration-200">
                <div className="p-6 sm:p-8 rounded-lg bg-gray-50 dark:bg-[#071A2B]/60 border border-[#D9E0E7] dark:border-[#1E354B]">
                  {/* Neutral/Warning Status Badge */}
                  <div
                    id="badge-rejected"
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-300 text-xs font-bold uppercase tracking-wider mb-4 border border-gray-300 dark:border-gray-700 font-manrope"
                  >
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    <span>ACCOUNT NOT APPROVED</span>
                  </div>
                  <h3 className="font-sora text-xl sm:text-2xl font-bold text-[#17212B] dark:text-white mb-3">
                    Account Review Update
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-6 font-normal">
                    Your account is not currently approved. Please contact WinDriveSA support if you need assistance.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <a
                      id="btn-contact-support"
                      href="mailto:support@windrivesa.co.za"
                      className="inline-flex justify-center items-center py-2.5 px-4 rounded-md bg-[#071A2B] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#0c263f] transition-all dark:bg-[#F2B705] dark:text-[#071A2B] dark:hover:bg-[#e0a800]"
                    >
                      Contact Support
                    </a>
                    <button
                      type="button"
                      onClick={() => setLifecycleState('default')}
                      className="inline-flex justify-center items-center py-2.5 px-4 rounded-md bg-white dark:bg-[#0D2438] text-[#17212B] dark:text-gray-200 text-xs font-semibold uppercase tracking-wider border border-[#D9E0E7] dark:border-[#1E354B] hover:bg-gray-50 dark:hover:bg-[#071A2B] transition-all"
                    >
                      Back to Sign In
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Footer: Security, Legal & Encryption notice */}
          <footer className="pt-4 border-t border-[#D9E0E7]/60 dark:border-[#1E354B]/40 flex flex-wrap items-center justify-between text-xs text-gray-500 dark:text-gray-400 gap-2">
            <p>© {currentYear} WinDriveSA (Pty) Ltd. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Link to="/#terms" className="hover:text-[#071A2B] dark:hover:text-[#F2B705] transition-colors">
                Terms
              </Link>
              <span className="text-gray-300 dark:text-gray-700">•</span>
              <Link to="/#privacy" className="hover:text-[#071A2B] dark:hover:text-[#F2B705] transition-colors">
                Privacy
              </Link>
              <span className="text-gray-300 dark:text-gray-700">•</span>
              <span className="inline-flex items-center gap-1 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00843D]"></span>
                POPIA Compliant
              </span>
            </div>
          </footer>
        </section>
        {/* END: Right Interactive Form Panel */}
      </main>
      {/* END: Main Content Grid */}
    </div>
  );
}
