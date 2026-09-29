import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { register as authRegister } from '../../services/auth.js';

export default function Register() {
  const { theme, toggleTheme } = useTheme();

  // Controlled form state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
    termsAccepted: false,
  });

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [termsModal, setTermsModal] = useState(null); // 'terms' | 'privacy' | null

  // Evaluate password requirements
  const passwordEvaluation = useMemo(() => {
    const val = formData.password;
    const hasLength = val.length >= 8;
    const hasUpper = /[A-Z]/.test(val);
    const hasLower = /[a-z]/.test(val);
    const hasNumber = /[0-9]/.test(val);
    const score = [hasLength, hasUpper, hasLower, hasNumber].filter(Boolean).length;

    let strengthLabel = 'Too Weak';
    let strengthColor = 'text-gray-400';
    if (val.length > 0) {
      if (score <= 1) {
        strengthLabel = 'Weak';
        strengthColor = 'text-red-500';
      } else if (score === 2 || score === 3) {
        strengthLabel = 'Fair';
        strengthColor = 'text-amber-500';
      } else if (score === 4) {
        strengthLabel = 'Strong';
        strengthColor = 'text-[#00843D]';
      }
    }

    return {
      hasLength,
      hasUpper,
      hasLower,
      hasNumber,
      score,
      strengthLabel,
      strengthColor,
      isStrong: score === 4,
    };
  }, [formData.password]);

  // South African Mobile Number Validator
  const isValidSAMobile = (number) => {
    const cleaned = number.replace(/[\s\-\(\)]/g, '');
    // Matches 0[6-8][0-9]{8} OR (+27|27)[6-8][0-9]{8} OR [6-8][0-9]{8}
    const saRegex = /^(?:(?:\+?27)|0)?([6-8][0-9]{8})$/;
    return saRegex.test(cleaned);
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field-specific error as user types
    if (errors[field]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        delete updated.global;
        return updated;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // 1. Full Name
    const nameTrimmed = formData.fullName.trim();
    if (!nameTrimmed) {
      newErrors.fullName = 'Full name is required.';
    } else if (nameTrimmed.length < 3) {
      newErrors.fullName = 'Please enter your full name (minimum 3 characters).';
    }

    // 2. Email Address
    const emailTrimmed = formData.email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailTrimmed) {
      newErrors.email = 'Email address is required.';
    } else if (!emailRegex.test(emailTrimmed)) {
      newErrors.email = 'Please provide a valid email address.';
    }

    // 3. Mobile Number
    const mobileTrimmed = formData.mobile.trim();
    if (!mobileTrimmed) {
      newErrors.mobile = 'Mobile number is required.';
    } else if (!isValidSAMobile(mobileTrimmed)) {
      newErrors.mobile = 'Please enter a valid 10-digit South African mobile number (e.g. 082 123 4567).';
    }

    // 4. Password
    if (!formData.password) {
      newErrors.password = 'Password is required.';
    } else if (!passwordEvaluation.isStrong) {
      newErrors.password = 'Password must meet all 4 security criteria shown below.';
    }

    // 5. Confirm Password
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirm password is required.';
    } else if (formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = 'Passwords do not match. Please verify.';
    }

    // 6. Terms Agreement
    if (!formData.termsAccepted) {
      newErrors.terms = 'You must agree to the Terms & Conditions and Privacy Policy.';
    }

    if (Object.keys(newErrors).length > 0) {
      newErrors.global = "We couldn't create your account. Please check your details and try again.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const [emailConfirmationRequired, setEmailConfirmationRequired] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      // Scroll to error on mobile
      const errorBanner = document.getElementById('global-error');
      if (errorBanner) {
        errorBanner.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await authRegister({
        fullName: formData.fullName,
        email: formData.email,
        mobileNumber: formData.mobile,
        password: formData.password,
      });

      if (!result.success) {
        setErrors((prev) => ({
          ...prev,
          global: result.error || "We couldn't create your account. Please check your details and try again.",
        }));
        setIsSubmitting(false);
        const errorBanner = document.getElementById('global-error');
        if (errorBanner) {
          errorBanner.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }

      setRegisteredEmail(formData.email.trim().toLowerCase());
      if (result.requiresEmailConfirmation) {
        setEmailConfirmationRequired(true);
      }

      // Clear sensitive password values from active UI state
      setFormData((prev) => ({
        ...prev,
        password: '',
        confirmPassword: '',
      }));

      setIsSubmitting(false);
      setIsSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        global: 'An unexpected error occurred. Please try again later.',
      }));
      setIsSubmitting(false);
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className="bg-[#F5F7FA] dark:bg-[#040E18] text-[#17212B] dark:text-gray-100 transition-colors duration-300 min-h-screen antialiased flex flex-col font-manrope">
      {/* MAIN CONTAINER */}
      <main className="flex-1 flex flex-col lg:flex-row min-h-screen w-full">
        {/* LEFT VISUAL PANEL (56% width on desktop) */}
        <section
          className="relative w-full lg:w-[56%] min-h-[380px] lg:min-h-screen bg-[#071A2B] flex flex-col justify-between overflow-hidden"
          data-purpose="visual-hero-panel"
        >
          {/* Automotive Photography Background */}
          <div className="absolute inset-0 z-0">
            <img
              alt="Editorial commercial automotive photography of a premium modern dark metallic graphite double-cab 4x4 pickup truck on a scenic South African paved pass road leading toward majestic mountain ridges, cinematic late afternoon golden hour lighting"
              className="w-full h-full object-cover object-center select-none transform scale-[1.02] transition-transform duration-1000"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuD4HGO9fHg7k1hOCpSpTofQgI6hxAYifswpXYxFKwWi8AQgPlIcHX_pYTbxwcQZgwO160BitN5KFNtmYivPIfN1yMP_poEdZ6FO9ITNem2yJIx_EKfRA15IHOG3fQJExTv1W8Qq2hVNh0yYlJ8olYMOjeL_6Uup3eOhcLLElN89Dg5Yr37sUZfrtkvNsMGXLMPXILi5YMJMRKyDrCcDq1IkJtBXxr4tiJHrrEo9r8Ck0ac9HbNSGEZYBw"
            />
            {/* Cinematic Scrim Gradients */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#071A2B] via-[#071A2B]/60 to-[#071A2B]/30 mix-blend-multiply opacity-95 pointer-events-none"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-[#071A2B]/80 via-transparent to-transparent hidden lg:block pointer-events-none"></div>
          </div>

          {/* Scrim Content Overlay */}
          <div className="relative z-10 p-8 sm:p-12 lg:p-16 flex flex-col justify-between h-full min-h-[380px] lg:min-h-screen">
            {/* Top Eyebrow Area with Home Link */}
            <div className="flex items-center justify-between">
              <Link
                to="/"
                className="flex items-center gap-2 group focus:outline-none"
                title="Back to WinDriveSA Home"
              >
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#F2B705] group-hover:scale-125 transition-transform"></span>
                <span className="text-xs font-semibold uppercase tracking-[0.25em] text-white/90 group-hover:text-white transition-colors">
                  WINDRIVESA
                </span>
              </Link>
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-xs text-white/80 hover:text-white transition-colors px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 backdrop-blur-sm lg:hidden"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                <span>Home</span>
              </Link>
            </div>

            {/* Middle Lead Statement */}
            <div className="my-auto py-10 lg:py-0 max-w-xl">
              <p className="text-[#F2B705] text-xs font-bold tracking-widest uppercase mb-3">
                OFFICIAL REWARD ACCESS
              </p>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-[1.15] font-sora mb-4">
                Your Reward Journey Starts Here.
              </h1>
              <p className="text-base sm:text-lg text-gray-200 leading-relaxed font-normal">
                Create your account and we'll guide you through the next steps.
              </p>
            </div>

            {/* Bottom Brand Anchor & Compliance Badge */}
            <div className="pt-6 border-t border-white/15 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-col">
                <span className="text-[11px] font-bold tracking-[0.2em] text-gray-300 uppercase font-sora">
                  WIN BIG. DRIVE AWAY.
                </span>
                <span className="text-[11px] text-gray-400">Institutional Customer Rewards Platform</span>
              </div>
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-[#0D2438]/80 border border-[#00843D]/40 backdrop-blur-sm"
                data-purpose="security-pill"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#00843D] animate-pulse"></span>
                <span className="text-xs font-medium text-emerald-300 tracking-wide">
                  Secure Account Intake
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT FORM PANEL (44% width on desktop) */}
        <section
          className="w-full lg:w-[44%] bg-white dark:bg-[#071A2B] flex flex-col justify-between transition-colors duration-200"
          data-purpose="registration-column"
        >
          {/* Top Utility Bar: Logo & Theme Switcher */}
          <header className="px-6 sm:px-10 lg:px-12 pt-8 pb-4 flex items-center justify-between border-b border-gray-100 dark:border-white/5">
            {/* Brand Logo */}
            <Link
              to="/"
              className="h-10 sm:h-11 flex items-center focus:outline-none"
              title="WinDriveSA Home"
            >
              <img
                alt="WinDriveSA - Win Big. Drive Away."
                className="h-full w-auto object-contain"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDtC6tvoCPFSN7t3uH4NGlAkgzgRdFFQDQF13c2QzIwHjF2G_mAIPOjOTBoY-U6st_SAf0vexFyhTK-WJpTHngk76PNnaMCAi6rsnekPd7ftn51OL79qLlm64rUFYT4xvqeNVC9KxC6HHDsbXwlFOwVSzV_KVnislL7NXuc1mHWpziMF1yD4xDZPWRdtL13ew4kgnQ_Ns_rqE8Bh2bkzKNSoDTuXhC8bmZFzezpN-jc7w2YEb2h1WPN-9wa5aBADWWL-1o"
              />
            </Link>

            <div className="flex items-center gap-2">
              <Link
                to="/"
                className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-[#667085] hover:text-[#17212B] dark:text-gray-300 dark:hover:text-white px-2.5 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-[#0D2438] transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                <span>Back to Home</span>
              </Link>

              {/* Accessible Light/Dark Theme Switcher */}
              <button
                id="theme-toggle"
                type="button"
                aria-label={`Toggle theme (currently ${theme} mode)`}
                onClick={toggleTheme}
                className="p-2.5 rounded-md text-[#667085] hover:text-[#17212B] dark:text-gray-300 dark:hover:text-white bg-gray-100 dark:bg-[#0D2438] hover:bg-gray-200 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-[#F2B705]/80"
              >
                {theme === 'dark' ? (
                  <span className="material-symbols-outlined text-[18px] text-[#F2B705] block">
                    light_mode
                  </span>
                ) : (
                  <span className="material-symbols-outlined text-[18px] text-[#17212B] block">
                    dark_mode
                  </span>
                )}
              </button>
            </div>
          </header>

          {/* Form / Success Container */}
          <div className="px-6 sm:px-10 lg:px-12 py-8 flex-1 flex flex-col justify-center max-w-xl mx-auto w-full">
            {!isSubmitted ? (
              /* REGISTRATION FORM VIEW */
              <div className="w-full" id="form-view">
                {/* Content Header */}
                <div className="mb-7">
                  <span className="text-[11px] font-bold text-[#F2B705] tracking-widest uppercase block mb-1">
                    CREATE YOUR ACCOUNT
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-bold text-[#071A2B] dark:text-white tracking-tight font-sora">
                    Start Your WinDriveSA Journey
                  </h2>
                  <p className="text-sm text-[#667085] dark:text-gray-400 mt-2 leading-normal">
                    Create your account to begin the review process and access your personal reward dashboard once approved.
                  </p>
                </div>

                {/* Global Form Error Banner */}
                {errors.global && (
                  <div
                    id="global-error"
                    role="alert"
                    className="mb-6 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-md text-red-700 dark:text-red-300 text-sm flex items-start gap-3"
                  >
                    <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-[20px] shrink-0 mt-0.5">
                      error
                    </span>
                    <span id="global-error-text">{errors.global}</span>
                  </div>
                )}

                {/* Registration Form */}
                <form id="registration-form" onSubmit={handleSubmit} noValidate className="space-y-4 sm:space-y-4.5">
                  {/* 1. Full Name */}
                  <div>
                    <label
                      htmlFor="fullName"
                      className="block text-xs font-semibold text-[#17212B] dark:text-gray-200 uppercase tracking-wider mb-1.5"
                    >
                      Full Name <span className="text-red-600">*</span>
                    </label>
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      required
                      placeholder="Enter your full name"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      className={`w-full h-11 px-3.5 text-sm bg-white dark:bg-[#071A2B] border rounded-md text-[#17212B] dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                        errors.fullName
                          ? 'border-red-500 focus:ring-red-400'
                          : 'border-[#D9E0E7] dark:border-gray-700 focus:ring-[#F2B705]'
                      }`}
                    />
                    {errors.fullName && (
                      <p id="error-fullName" className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">
                        {errors.fullName}
                      </p>
                    )}
                  </div>

                  {/* 2. Email Address */}
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-xs font-semibold text-[#17212B] dark:text-gray-200 uppercase tracking-wider mb-1.5"
                    >
                      Email Address <span className="text-red-600">*</span>
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`w-full h-11 px-3.5 text-sm bg-white dark:bg-[#071A2B] border rounded-md text-[#17212B] dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                        errors.email
                          ? 'border-red-500 focus:ring-red-400'
                          : 'border-[#D9E0E7] dark:border-gray-700 focus:ring-[#F2B705]'
                      }`}
                    />
                    {errors.email && (
                      <p id="error-email" className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {/* 3. South African Mobile Number */}
                  <div>
                    <label
                      htmlFor="mobile"
                      className="block text-xs font-semibold text-[#17212B] dark:text-gray-200 uppercase tracking-wider mb-1.5"
                    >
                      Mobile Number <span className="text-red-600">*</span>
                    </label>
                    <div className="relative flex rounded-md">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-[#D9E0E7] dark:border-gray-700 bg-gray-50 dark:bg-[#040E18] text-[#17212B] dark:text-gray-300 text-xs font-semibold tracking-wider select-none">
                        🇿🇦 +27
                      </span>
                      <input
                        id="mobile"
                        name="mobile"
                        type="tel"
                        required
                        placeholder="e.g. 082 123 4567 or 82 123 4567"
                        value={formData.mobile}
                        onChange={(e) => handleInputChange('mobile', e.target.value)}
                        className={`flex-1 min-w-0 h-11 px-3.5 text-sm bg-white dark:bg-[#071A2B] border rounded-none rounded-r-md text-[#17212B] dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                          errors.mobile
                            ? 'border-red-500 focus:ring-red-400'
                            : 'border-[#D9E0E7] dark:border-gray-700 focus:ring-[#F2B705]'
                        }`}
                      />
                    </div>
                    <p className="text-[11px] text-[#667085] dark:text-gray-400 mt-1">
                      South African mobile number format (+27 / 0XX)
                    </p>
                    {errors.mobile && (
                      <p id="error-mobile" className="text-xs text-red-600 dark:text-red-400 mt-0.5 font-medium">
                        {errors.mobile}
                      </p>
                    )}
                  </div>

                  {/* 4. Password */}
                  <div>
                    <label
                      htmlFor="password"
                      className="block text-xs font-semibold text-[#17212B] dark:text-gray-200 uppercase tracking-wider mb-1.5"
                    >
                      Password <span className="text-red-600">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Create a password"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        className={`w-full h-11 pl-3.5 pr-11 text-sm bg-white dark:bg-[#071A2B] border rounded-md text-[#17212B] dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                          errors.password
                            ? 'border-red-500 focus:ring-red-400'
                            : 'border-[#D9E0E7] dark:border-gray-700 focus:ring-[#F2B705]'
                        }`}
                      />
                      <button
                        id="togglePassword"
                        type="button"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        onClick={() => setShowPassword(!showPassword)}
                        className={`absolute inset-y-0 right-0 pr-3.5 flex items-center transition-colors ${
                          showPassword
                            ? 'text-[#F2B705]'
                            : 'text-[#667085] hover:text-[#17212B] dark:hover:text-white'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[19px]">
                          {showPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>

                    {/* Password Strength Bar & Evaluation */}
                    <div className="mt-2" data-purpose="password-meter">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-[#667085] dark:text-gray-400 font-medium">Strength:</span>
                        <span id="strengthLabel" className={`font-bold ${passwordEvaluation.strengthColor}`}>
                          {passwordEvaluation.strengthLabel}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex gap-1">
                        <div
                          id="bar-1"
                          className={`h-full w-1/4 rounded-full transition-all duration-300 ${
                            formData.password.length === 0
                              ? 'bg-gray-300 dark:bg-gray-600'
                              : passwordEvaluation.score <= 1
                              ? 'bg-red-500'
                              : passwordEvaluation.score <= 3
                              ? 'bg-amber-500'
                              : 'bg-[#00843D]'
                          }`}
                        ></div>
                        <div
                          id="bar-2"
                          className={`h-full w-1/4 rounded-full transition-all duration-300 ${
                            formData.password.length === 0 || passwordEvaluation.score <= 1
                              ? 'bg-gray-300 dark:bg-gray-600'
                              : passwordEvaluation.score <= 3
                              ? 'bg-amber-500'
                              : 'bg-[#00843D]'
                          }`}
                        ></div>
                        <div
                          id="bar-3"
                          className={`h-full w-1/4 rounded-full transition-all duration-300 ${
                            passwordEvaluation.score >= 3
                              ? passwordEvaluation.score === 3
                                ? 'bg-amber-500'
                                : 'bg-[#00843D]'
                              : 'bg-gray-300 dark:bg-gray-600'
                          }`}
                        ></div>
                        <div
                          id="bar-4"
                          className={`h-full w-1/4 rounded-full transition-all duration-300 ${
                            passwordEvaluation.score === 4
                              ? 'bg-[#00843D]'
                              : 'bg-gray-300 dark:bg-gray-600'
                          }`}
                        ></div>
                      </div>

                      {/* Live Password Requirement Checklist */}
                      <div className="grid grid-cols-2 gap-1.5 mt-2.5 text-[11px]">
                        <div
                          id="req-length"
                          className={`flex items-center gap-1.5 transition-colors ${
                            passwordEvaluation.hasLength
                              ? 'text-[#00843D] font-semibold'
                              : 'text-[#667085] dark:text-gray-400'
                          }`}
                        >
                          <span className="indicator text-xs">
                            {passwordEvaluation.hasLength ? '●' : '○'}
                          </span>{' '}
                          At least 8 characters
                        </div>
                        <div
                          id="req-uppercase"
                          className={`flex items-center gap-1.5 transition-colors ${
                            passwordEvaluation.hasUpper
                              ? 'text-[#00843D] font-semibold'
                              : 'text-[#667085] dark:text-gray-400'
                          }`}
                        >
                          <span className="indicator text-xs">
                            {passwordEvaluation.hasUpper ? '●' : '○'}
                          </span>{' '}
                          One uppercase letter
                        </div>
                        <div
                          id="req-lowercase"
                          className={`flex items-center gap-1.5 transition-colors ${
                            passwordEvaluation.hasLower
                              ? 'text-[#00843D] font-semibold'
                              : 'text-[#667085] dark:text-gray-400'
                          }`}
                        >
                          <span className="indicator text-xs">
                            {passwordEvaluation.hasLower ? '●' : '○'}
                          </span>{' '}
                          One lowercase letter
                        </div>
                        <div
                          id="req-number"
                          className={`flex items-center gap-1.5 transition-colors ${
                            passwordEvaluation.hasNumber
                              ? 'text-[#00843D] font-semibold'
                              : 'text-[#667085] dark:text-gray-400'
                          }`}
                        >
                          <span className="indicator text-xs">
                            {passwordEvaluation.hasNumber ? '●' : '○'}
                          </span>{' '}
                          One number
                        </div>
                      </div>
                    </div>
                    {errors.password && (
                      <p id="error-password" className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">
                        {errors.password}
                      </p>
                    )}
                  </div>

                  {/* 5. Confirm Password */}
                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="block text-xs font-semibold text-[#17212B] dark:text-gray-200 uppercase tracking-wider mb-1.5"
                    >
                      Confirm Password <span className="text-red-600">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        placeholder="Re-enter your password"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        className={`w-full h-11 pl-3.5 pr-11 text-sm bg-white dark:bg-[#071A2B] border rounded-md text-[#17212B] dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                          errors.confirmPassword
                            ? 'border-red-500 focus:ring-red-400'
                            : 'border-[#D9E0E7] dark:border-gray-700 focus:ring-[#F2B705]'
                        }`}
                      />
                      <button
                        id="toggleConfirmPassword"
                        type="button"
                        aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className={`absolute inset-y-0 right-0 pr-3.5 flex items-center transition-colors ${
                          showConfirmPassword
                            ? 'text-[#F2B705]'
                            : 'text-[#667085] hover:text-[#17212B] dark:hover:text-white'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[19px]">
                          {showConfirmPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p id="error-confirmPassword" className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>

                  {/* 6. Terms & Conditions Agreement */}
                  <div className="pt-1">
                    <div className="flex items-start gap-2.5">
                      <input
                        id="termsCheck"
                        name="termsCheck"
                        type="checkbox"
                        required
                        checked={formData.termsAccepted}
                        onChange={(e) => handleInputChange('termsAccepted', e.target.checked)}
                        className="mt-1 w-4 h-4 rounded text-[#071A2B] dark:text-[#F2B705] border-[#D9E0E7] dark:border-gray-600 focus:ring-[#F2B705] cursor-pointer"
                      />
                      <label
                        htmlFor="termsCheck"
                        className="text-xs text-[#667085] dark:text-gray-300 leading-relaxed cursor-pointer select-none"
                      >
                        I agree to the{' '}
                        <button
                          type="button"
                          onClick={() => setTermsModal('terms')}
                          className="text-[#071A2B] dark:text-[#F2B705] underline font-semibold hover:opacity-80 inline"
                        >
                          Terms &amp; Conditions
                        </button>{' '}
                        and{' '}
                        <button
                          type="button"
                          onClick={() => setTermsModal('privacy')}
                          className="text-[#071A2B] dark:text-[#F2B705] underline font-semibold hover:opacity-80 inline"
                        >
                          Privacy Policy
                        </button>
                        .
                      </label>
                    </div>
                    {errors.terms && (
                      <p id="error-terms" className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">
                        {errors.terms}
                      </p>
                    )}
                  </div>

                  {/* 7. Primary Action Button */}
                  <div className="pt-2">
                    <button
                      id="btnSubmit"
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-[#071A2B] text-white hover:bg-[#0D2438] active:scale-[0.99] font-medium py-3.5 px-6 rounded-md transition-all flex items-center justify-center gap-2 text-[15px] border border-transparent shadow-sm dark:bg-[#F2B705] dark:text-[#071A2B] dark:hover:bg-[#e0a800] dark:font-semibold disabled:opacity-80 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <svg
                            id="btnSpinner"
                            className="animate-spin h-5 w-5 text-current"
                            fill="none"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span id="btnText">Creating Account…</span>
                        </>
                      ) : (
                        <span id="btnText">Create Account</span>
                      )}
                    </button>
                  </div>

                  {/* 8. Routing Back to Login */}
                  <div className="pt-3 text-center text-xs text-[#667085] dark:text-gray-400">
                    Already have an account?{' '}
                    <Link
                      id="link-login"
                      to="/login"
                      className="font-semibold text-[#071A2B] dark:text-[#F2B705] hover:underline ml-1"
                    >
                      Sign In
                    </Link>
                  </div>
                </form>
              </div>
            ) : (
              /* SUCCESS STATE (Account Created — Check Your Email & PENDING REVIEW) */
              <div className="w-full transition-all duration-300" id="success-view">
                <div className="text-center mb-6">
                  {/* Institutional Status Pill */}
                  <div
                    id="status-pending-pill"
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-[#F2B705]/40 text-amber-700 dark:text-[#F2B705] text-xs font-semibold tracking-wider uppercase mb-4"
                  >
                    <span className="w-2 h-2 rounded-full bg-[#F2B705] animate-ping"></span>
                    <span>PENDING REVIEW</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-[#071A2B] dark:text-white tracking-tight font-sora">
                    Check Your Email
                  </h2>
                  <p className="text-sm text-[#667085] dark:text-gray-300 mt-3 max-w-md mx-auto leading-relaxed">
                    We've created your WinDriveSA account. Please confirm your email address using the link we sent you. After confirmation, your account will remain under review until a WinDriveSA administrator approves it.
                  </p>
                  {registeredEmail && (
                    <div className="mt-3.5 inline-flex items-center gap-2 px-3 py-1.5 rounded bg-gray-100 dark:bg-[#0D2438] border border-[#D9E0E7] dark:border-white/10 text-xs text-[#071A2B] dark:text-gray-200">
                      <span className="material-symbols-outlined text-[16px] text-[#F2B705]">mail</span>
                      <span className="font-mono">{registeredEmail}</span>
                    </div>
                  )}
                </div>

                {/* Additional Informational Note */}
                <div
                  className="bg-gray-50 dark:bg-[#0D2438] border border-[#D9E0E7] dark:border-white/10 rounded-md p-4 sm:p-5 mb-6 text-left"
                  data-purpose="account-review-notice"
                >
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-[20px] text-[#F2B705] shrink-0 mt-0.5">
                      info
                    </span>
                    <p className="text-xs sm:text-sm text-[#17212B] dark:text-gray-300 leading-relaxed font-normal">
                      You'll be able to access your reward information after your account has been approved and a reward has been assigned.
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2.5">
                  <Link
                    id="success-login-btn"
                    to="/login"
                    className="w-full bg-[#071A2B] text-white hover:bg-[#0D2438] text-center font-medium py-3 px-5 rounded-md transition-all text-sm shadow-sm dark:bg-[#F2B705] dark:text-[#071A2B] dark:hover:bg-[#e0a800] dark:font-semibold"
                  >
                    Back to Sign In
                  </Link>
                  <Link
                    id="success-home-btn"
                    to="/"
                    className="w-full bg-transparent hover:bg-gray-100 dark:hover:bg-slate-800 text-[#667085] dark:text-gray-300 text-center font-medium py-2.5 px-5 rounded-md transition-all text-sm border border-[#D9E0E7] dark:border-gray-700"
                  >
                    Return Home
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Legal Footer */}
          <footer className="px-6 sm:px-10 lg:px-12 py-5 border-t border-gray-100 dark:border-white/5 flex flex-wrap items-center justify-between gap-3 text-[11px] text-[#667085] dark:text-gray-500">
            <div>
              © <span id="current-year">{currentYear}</span> WinDriveSA. All rights reserved.
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setTermsModal('terms')}
                className="hover:underline hover:text-[#17212B] dark:hover:text-gray-300"
              >
                Terms
              </button>
              <button
                type="button"
                onClick={() => setTermsModal('privacy')}
                className="hover:underline hover:text-[#17212B] dark:hover:text-gray-300"
              >
                Privacy Policy
              </button>
              <a
                className="hover:underline hover:text-[#17212B] dark:hover:text-gray-300"
                href="mailto:support@windrivesa.co.za"
              >
                Official Support
              </a>
            </div>
          </footer>
        </section>
      </main>

      {/* INFORMATIONAL MODAL FOR TERMS / PRIVACY */}
      {termsModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setTermsModal(null)}
        >
          <div
            className="bg-white dark:bg-[#071A2B] max-w-lg w-full rounded-xl p-6 sm:p-8 shadow-2xl border border-gray-200 dark:border-white/10 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-white/10 mb-4">
              <h3 className="font-sora text-lg font-bold text-[#071A2B] dark:text-white">
                {termsModal === 'terms' ? 'Terms & Conditions' : 'Privacy Policy & POPIA Statement'}
              </h3>
              <button
                type="button"
                onClick={() => setTermsModal(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-[#0D2438] transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="text-xs sm:text-sm text-[#667085] dark:text-gray-300 space-y-3 leading-relaxed">
              {termsModal === 'terms' ? (
                <>
                  <p>
                    <strong>1. Platform Purpose:</strong> WinDriveSA provides an institutional prize and vehicle allocation tracking service for eligible South African residents aged 18 and older.
                  </p>
                  <p>
                    <strong>2. Account Intake &amp; Governance:</strong> All registrations initiate as <em>Pending Review</em>. Accounts must pass compliance and ID verification before prize allocations are made visible or claimable.
                  </p>
                  <p>
                    <strong>3. Prize Claims:</strong> Verified rewards are subject to statutory South African documentation, valid driver licensing (for vehicle allocations), and institutional reserve confirmation.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    <strong>1. POPIA Compliance:</strong> In accordance with the Protection of Personal Information Act (POPIA), your personal information is collected solely for account authentication, audit compliance, and claim fulfillment.
                  </p>
                  <p>
                    <strong>2. Data Protection:</strong> Personal data, including mobile numbers and email addresses, is encrypted and never sold or traded with unauthorized third-party commercial brokers.
                  </p>
                  <p>
                    <strong>3. Access Rights:</strong> You retain the right to review, update, or request deactivation of your account records by contacting our support desk.
                  </p>
                </>
              )}
            </div>
            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-white/10 flex justify-end">
              <button
                type="button"
                onClick={() => setTermsModal(null)}
                className="px-5 py-2 bg-[#071A2B] dark:bg-[#F2B705] text-white dark:text-[#071A2B] text-xs font-semibold rounded-md hover:opacity-90 transition-opacity"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
