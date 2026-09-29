// WinDriveSA Administration: Screen 21 — Admin Settings
// Centralized configuration management for authorized WinDriveSA administrators
// Covers General, Communication, Security, and System Preferences with audit logging

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AdminShell from '../../components/admin/AdminShell';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import {
  getAppSettings,
  updateAppSettings,
  resetUnsavedChanges,
  signOutAllOtherAdminSessions,
  changeAdminPassword,
  ALLOWED_CURRENCIES,
  ALLOWED_TIMEOUTS,
  ALLOWED_DATE_FORMATS,
  ALLOWED_TIMEZONES,
  ALLOWED_LANGUAGES,
  SUPPORT_AVAILABILITY_OPTIONS,
} from '../../services/settings';

export default function AdminSettings() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const { user: authUser, profile } = useAuth();

  const adminUser = profile
    ? {
        id: profile.id,
        fullName: profile.full_name || 'Admin',
        name: profile.full_name || 'Admin',
        email: profile.email || authUser?.email || 'admin@windrivesa.co.za',
        role: profile.role || 'ADMIN',
      }
    : authUser
    ? {
        id: authUser.id,
        fullName: authUser.user_metadata?.full_name || 'Admin',
        name: authUser.user_metadata?.full_name || 'Admin',
        email: authUser.email,
        role: 'ADMIN',
      }
    : null;

  const [savedSettings, setSavedSettings] = useState(null);
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Modals state
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [pendingNavigationPath, setPendingNavigationPath] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showSignoutSessionsModal, setShowSignoutSessionsModal] = useState(false);

  // Password Modal form state (isolated & sensitive)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswordFields, setShowPasswordFields] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Load initial settings and active admin
  useEffect(() => {
    let isMounted = true;
    async function initSettings() {
      const loaded = await getAppSettings();
      const current = loaded?.data || loaded;
      if (isMounted) {
        setSavedSettings(current);
        setForm({ ...current });
      }
    }
    initSettings();
    return () => {
      isMounted = false;
    };
  }, []);

  // Sync theme with ThemeContext
  useEffect(() => {
    if (form && form.theme !== theme) {
      setForm((prev) => (prev ? { ...prev, theme } : prev));
    }
  }, [theme]);

  // Dirty check comparing current form with saved baseline
  useEffect(() => {
    if (!form || !savedSettings) {
      setIsDirty(false);
      return;
    }

    const dirty =
      form.companyName !== savedSettings.companyName ||
      form.tagline !== savedSettings.tagline ||
      form.defaultCurrency !== savedSettings.defaultCurrency ||
      form.whatsappSupportNumber !== savedSettings.whatsappSupportNumber ||
      form.supportEmail !== savedSettings.supportEmail ||
      form.supportAvailability !== savedSettings.supportAvailability ||
      form.customSupportHours?.start !== savedSettings.customSupportHours?.start ||
      form.customSupportHours?.end !== savedSettings.customSupportHours?.end ||
      Number(form.sessionTimeoutMinutes) !== Number(savedSettings.sessionTimeoutMinutes) ||
      Boolean(form.requireSensitiveActionConfirmation) !==
        Boolean(savedSettings.requireSensitiveActionConfirmation) ||
      form.theme !== savedSettings.theme ||
      form.dateFormat !== savedSettings.dateFormat ||
      form.timezone !== savedSettings.timezone ||
      form.language !== savedSettings.language;

    setIsDirty(dirty);
  }, [form, savedSettings]);

  // Warn before browser unload if unsaved changes exist
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Intercept navigation link clicks when dirty
  useEffect(() => {
    const handleCaptureClick = (e) => {
      if (!isDirty) return;

      const anchor = e.target.closest('a');
      if (anchor && anchor.getAttribute('href') && !anchor.getAttribute('href').startsWith('#')) {
        const href = anchor.getAttribute('href');
        // If clicking within the same route, ignore
        if (href === location.pathname) return;

        // Otherwise prevent immediate navigation and prompt discard modal
        e.preventDefault();
        e.stopPropagation();
        setPendingNavigationPath(href);
        setShowDiscardModal(true);
      }
    };

    document.addEventListener('click', handleCaptureClick, true);
    return () => document.removeEventListener('click', handleCaptureClick, true);
  }, [isDirty, location.pathname]);

  // Field change handler
  const handleInputChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear field-level error on edit
    if (errors[field]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  const handleCustomHourChange = (boundary, value) => {
    setForm((prev) => ({
      ...prev,
      customSupportHours: {
        ...prev.customSupportHours,
        [boundary]: value,
      },
    }));
    if (errors.customSupportStart || errors.customSupportEnd) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy.customSupportStart;
        delete copy.customSupportEnd;
        return copy;
      });
    }
  };

  const handleThemeSelect = (newTheme) => {
    handleInputChange('theme', newTheme);
    setTheme(newTheme);
  };

  // Save Settings
  const handleSaveSettings = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);

    const result = await updateAppSettings(form, adminUser);
    setIsSaving(false);

    if (result && result.success) {
      const updated = result.settings || result.data;
      setSavedSettings({ ...updated });
      setForm({ ...updated });
      setIsDirty(false);
      setErrors({});
      setToastMessage({
        title: 'Settings Saved',
        text: 'Settings saved successfully.',
      });
      setTimeout(() => setToastMessage(null), 4000);
    } else {
      setErrors((result && result.errors) || {});
      setToastMessage({
        title: 'Validation Error',
        text: (result && result.message) || 'Please review highlighted configuration fields.',
      });
    }
  };

  // Cancel / Discard
  const handleCancelClick = async () => {
    if (isDirty) {
      setPendingNavigationPath(null); // Cancel within page
      setShowDiscardModal(true);
    } else {
      // Re-read saved settings
      const reset = await resetUnsavedChanges();
      setForm({ ...reset });
      setErrors({});
    }
  };

  const handleConfirmDiscard = async () => {
    setShowDiscardModal(false);
    const reset = await resetUnsavedChanges();
    setForm({ ...reset });
    setIsDirty(false);
    setErrors({});

    if (pendingNavigationPath) {
      navigate(pendingNavigationPath);
      setPendingNavigationPath(null);
    } else {
      setToastMessage({
        title: 'Changes Discarded',
        text: 'Unsaved configuration changes were discarded.',
      });
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  // Admin Password Change
  const handleOpenPasswordModal = () => {
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setPasswordErrors({});
    setShowPasswordFields({ current: false, new: false, confirm: false });
    setShowPasswordModal(true);
  };

  const handleClosePasswordModal = () => {
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setPasswordErrors({});
    setShowPasswordModal(false);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const errs = {};

    if (!passwordForm.currentPassword) {
      errs.currentPassword = 'Current password is required.';
    }

    if (!passwordForm.newPassword) {
      errs.newPassword = 'New password is required.';
    } else {
      const p = passwordForm.newPassword;
      if (p.length < 8) errs.newPassword = 'Password must be at least 8 characters.';
      else if (!/[A-Z]/.test(p)) errs.newPassword = 'Password must contain at least 1 uppercase letter.';
      else if (!/[a-z]/.test(p)) errs.newPassword = 'Password must contain at least 1 lowercase letter.';
      else if (!/[0-9]/.test(p)) errs.newPassword = 'Password must contain at least 1 number.';
    }

    if (!passwordForm.confirmPassword) {
      errs.confirmPassword = 'Confirmation password is required.';
    } else if (passwordForm.confirmPassword !== passwordForm.newPassword) {
      errs.confirmPassword = 'Confirmation password does not match new password.';
    }

    if (Object.keys(errs).length > 0) {
      setPasswordErrors(errs);
      return;
    }

    setIsUpdatingPassword(true);
    const adminId = adminUser?.id || 'usr_admin_001';
    const res = await changeAdminPassword(adminId, {
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
      confirmPassword: passwordForm.confirmPassword,
    });
    setIsUpdatingPassword(false);

    if (res && res.success) {
      handleClosePasswordModal();
      setToastMessage({
        title: 'Password Updated',
        text: 'Admin password changed successfully.',
      });
      setTimeout(() => setToastMessage(null), 4000);
    } else {
      setPasswordErrors({
        form: (res && res.error) || 'Failed to update administrative password.',
      });
    }
  };

  // Sign out all other admin sessions
  const handleConfirmSignoutSessions = async () => {
    const res = await signOutAllOtherAdminSessions(adminUser);
    setShowSignoutSessionsModal(false);
    if (res && res.success) {
      setToastMessage({
        title: 'Sessions Terminated',
        text: res.message,
      });
      setTimeout(() => setToastMessage(null), 4000);
    } else {
      setToastMessage({
        title: 'Action Failed',
        text: (res && res.message) || 'Could not terminate other sessions.',
      });
    }
  };

  if (!form) {
    return (
      <AdminShell activeKey="settings" breadcrumb="HQ Admin Console / Settings">
        <div className="p-12 text-center text-xs text-[#667085] dark:text-slate-400 font-manrope">
          Loading system settings...
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      activeKey="settings"
      breadcrumb="HQ Admin Console / Settings"
      toastState={toastMessage}
      onCloseToast={() => setToastMessage(null)}
    >
      <div className="space-y-6 pb-24">
        {/* =========================================================================
            PAGE HEADER
            ========================================================================= */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#D9E0E7] dark:border-[#1B3754] pb-5">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#667085] dark:text-slate-400 font-sora block mb-1">
              ADMINISTRATION
            </span>
            <h1 className="text-2xl font-extrabold text-[#071A2B] dark:text-white font-sora tracking-tight">
              Settings
            </h1>
            <p className="text-xs text-[#667085] dark:text-slate-400 mt-1 max-w-2xl font-manrope">
              Manage application-wide configuration and administrative preferences.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isDirty ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 font-sora">
                <span className="w-2 h-2 rounded-full bg-[#F2B705] animate-pulse" />
                <span>Unsaved Changes</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-sora">
                <span className="w-2 h-2 rounded-full bg-[#00843D]" />
                <span>Configuration Synchronized</span>
              </span>
            )}
          </div>
        </header>

        {/* =========================================================================
            SETTINGS FORM (4 CLEANLY SEPARATED SECTIONS)
            ========================================================================= */}
        <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* =========================================================================
              SECTION 1: GENERAL
              ========================================================================= */}
          <section
            aria-labelledby="general-heading"
            className="bg-white dark:bg-[#0B253F] rounded-xl border border-[#D9E0E7] dark:border-[#1B3754] p-5 sm:p-6 shadow-sm space-y-5"
          >
            <div className="border-b border-[#D9E0E7] dark:border-[#1B3754] pb-3.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#071A2B]/5 dark:bg-[#F2B705]/10 flex items-center justify-center text-[#071A2B] dark:text-[#F2B705]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <h2
                    id="general-heading"
                    className="text-sm font-bold text-[#071A2B] dark:text-white uppercase tracking-wider font-sora"
                  >
                    1. General
                  </h2>
                  <p className="text-xs text-[#667085] dark:text-slate-400 font-manrope">
                    Core institutional identity and default platform settlement currency.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Company Name */}
              <div>
                <label
                  htmlFor="setting-company-name"
                  className="block text-xs font-bold text-[#071A2B] dark:text-slate-200 font-sora mb-1"
                >
                  Company Name <span className="text-rose-600">*</span>
                </label>
                <input
                  id="setting-company-name"
                  type="text"
                  value={form.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  placeholder="e.g. WinDriveSA"
                  className={`w-full px-3.5 py-2.5 rounded-lg text-xs font-semibold bg-[#F5F7FA] dark:bg-[#071A2B] border text-[#071A2B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F2B705] font-sora transition-colors ${
                    errors.companyName
                      ? 'border-rose-500 bg-rose-50/20'
                      : 'border-[#D9E0E7] dark:border-[#1B3754]'
                  }`}
                />
                {errors.companyName && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 font-manrope">
                    {errors.companyName}
                  </p>
                )}
                <p className="text-[11px] text-[#667085] dark:text-slate-400 mt-1 font-manrope">
                  Authoritative administrative brand title displayed across platform interfaces.
                </p>
              </div>

              {/* Tagline */}
              <div>
                <label
                  htmlFor="setting-tagline"
                  className="block text-xs font-bold text-[#071A2B] dark:text-slate-200 font-sora mb-1"
                >
                  Tagline <span className="text-rose-600">*</span>
                </label>
                <input
                  id="setting-tagline"
                  type="text"
                  value={form.tagline}
                  onChange={(e) => handleInputChange('tagline', e.target.value)}
                  placeholder="e.g. Win Big. Drive Away."
                  className={`w-full px-3.5 py-2.5 rounded-lg text-xs font-semibold bg-[#F5F7FA] dark:bg-[#071A2B] border text-[#071A2B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F2B705] font-sora transition-colors ${
                    errors.tagline
                      ? 'border-rose-500 bg-rose-50/20'
                      : 'border-[#D9E0E7] dark:border-[#1B3754]'
                  }`}
                />
                {errors.tagline && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 font-manrope">
                    {errors.tagline}
                  </p>
                )}
                <p className="text-[11px] text-[#667085] dark:text-slate-400 mt-1 font-manrope">
                  Primary institutional slogan supporting the rewards platform.
                </p>
              </div>

              {/* Default Currency */}
              <div className="md:col-span-2">
                <label
                  htmlFor="setting-default-currency"
                  className="block text-xs font-bold text-[#071A2B] dark:text-slate-200 font-sora mb-1"
                >
                  Default Currency <span className="text-rose-600">*</span>
                </label>
                <select
                  id="setting-default-currency"
                  value={form.defaultCurrency}
                  onChange={(e) => handleInputChange('defaultCurrency', e.target.value)}
                  className="w-full sm:w-80 px-3.5 py-2.5 rounded-lg text-xs font-semibold bg-[#F5F7FA] dark:bg-[#071A2B] border border-[#D9E0E7] dark:border-[#1B3754] text-[#071A2B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F2B705] font-sora transition-colors"
                >
                  {ALLOWED_CURRENCIES.map((curr) => (
                    <option key={curr.code} value={curr.code}>
                      {curr.label}
                    </option>
                  ))}
                </select>
                {errors.defaultCurrency && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 font-manrope">
                    {errors.defaultCurrency}
                  </p>
                )}
                <p className="text-[11px] text-[#667085] dark:text-slate-400 mt-1 font-manrope">
                  Authoritative currency for all institutional prize allocations, FICA escrow verifications, and Applicable Charges.
                </p>
              </div>
            </div>
          </section>

          {/* =========================================================================
              SECTION 2: COMMUNICATION
              ========================================================================= */}
          <section
            aria-labelledby="communication-heading"
            className="bg-white dark:bg-[#0B253F] rounded-xl border border-[#D9E0E7] dark:border-[#1B3754] p-5 sm:p-6 shadow-sm space-y-5"
          >
            <div className="border-b border-[#D9E0E7] dark:border-[#1B3754] pb-3.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#071A2B]/5 dark:bg-[#F2B705]/10 flex items-center justify-center text-[#071A2B] dark:text-[#F2B705]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div>
                  <h2
                    id="communication-heading"
                    className="text-sm font-bold text-[#071A2B] dark:text-white uppercase tracking-wider font-sora"
                  >
                    2. Communication
                  </h2>
                  <p className="text-xs text-[#667085] dark:text-slate-400 font-manrope">
                    Institutional support channels, escalation contacts, and desk operating availability.
                  </p>
                </div>
              </div>
            </div>

            {/* Mandatory Support Callout */}
            <div className="p-3.5 rounded-lg bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-start gap-2.5">
              <svg className="w-4 h-4 text-[#F2B705] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-xs text-[#071A2B] dark:text-amber-200/90 font-manrope leading-relaxed">
                <span className="font-semibold">Compliance Note: </span>
                WhatsApp is provided as a support channel. Payment processing is not handled through WhatsApp.
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* WhatsApp Support Number */}
              <div>
                <label
                  htmlFor="setting-whatsapp-number"
                  className="block text-xs font-bold text-[#071A2B] dark:text-slate-200 font-sora mb-1"
                >
                  WhatsApp Support Number <span className="text-rose-600">*</span>
                </label>
                <input
                  id="setting-whatsapp-number"
                  type="text"
                  value={form.whatsappSupportNumber}
                  onChange={(e) => handleInputChange('whatsappSupportNumber', e.target.value)}
                  placeholder="e.g. +27 82 555 0194"
                  className={`w-full px-3.5 py-2.5 rounded-lg text-xs font-mono font-semibold bg-[#F5F7FA] dark:bg-[#071A2B] border text-[#071A2B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F2B705] transition-colors ${
                    errors.whatsappSupportNumber
                      ? 'border-rose-500 bg-rose-50/20'
                      : 'border-[#D9E0E7] dark:border-[#1B3754]'
                  }`}
                />
                {errors.whatsappSupportNumber && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 font-manrope">
                    {errors.whatsappSupportNumber}
                  </p>
                )}
                <p className="text-[11px] text-[#667085] dark:text-slate-400 mt-1 font-manrope">
                  Reused across member claim logistics coordination and support ticket desks.
                </p>
              </div>

              {/* Support Email */}
              <div>
                <label
                  htmlFor="setting-support-email"
                  className="block text-xs font-bold text-[#071A2B] dark:text-slate-200 font-sora mb-1"
                >
                  Support Email <span className="text-rose-600">*</span>
                </label>
                <input
                  id="setting-support-email"
                  type="email"
                  value={form.supportEmail}
                  onChange={(e) => handleInputChange('supportEmail', e.target.value)}
                  placeholder="e.g. support@windrivesa.co.za"
                  className={`w-full px-3.5 py-2.5 rounded-lg text-xs font-mono font-semibold bg-[#F5F7FA] dark:bg-[#071A2B] border text-[#071A2B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F2B705] transition-colors ${
                    errors.supportEmail
                      ? 'border-rose-500 bg-rose-50/20'
                      : 'border-[#D9E0E7] dark:border-[#1B3754]'
                  }`}
                />
                {errors.supportEmail && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 font-manrope">
                    {errors.supportEmail}
                  </p>
                )}
                <p className="text-[11px] text-[#667085] dark:text-slate-400 mt-1 font-manrope">
                  Official written escalation inbox for claims, FICA documentation, and member queries.
                </p>
              </div>

              {/* Support Availability */}
              <div className="md:col-span-2 space-y-3">
                <label className="block text-xs font-bold text-[#071A2B] dark:text-slate-200 font-sora">
                  Support Availability <span className="text-rose-600">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {SUPPORT_AVAILABILITY_OPTIONS.map((opt) => (
                    <label
                      key={opt.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        form.supportAvailability === opt.id
                          ? 'border-[#071A2B] dark:border-[#F2B705] bg-[#F5F7FA] dark:bg-[#071A2B]/70'
                          : 'border-[#D9E0E7] dark:border-[#1B3754] hover:bg-[#F5F7FA]/60 dark:hover:bg-[#071A2B]/40'
                      }`}
                    >
                      <input
                        type="radio"
                        name="supportAvailability"
                        value={opt.id}
                        checked={form.supportAvailability === opt.id}
                        onChange={() => handleInputChange('supportAvailability', opt.id)}
                        className="w-4 h-4 text-[#071A2B] dark:text-[#F2B705] focus:ring-[#F2B705] border-[#D9E0E7] dark:border-[#1B3754]"
                      />
                      <span className="text-xs font-semibold text-[#071A2B] dark:text-white font-sora">
                        {opt.label}
                      </span>
                    </label>
                  ))}
                </div>
                {errors.supportAvailability && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 font-manrope">
                    {errors.supportAvailability}
                  </p>
                )}

                {/* Custom Hours Fields (Conditional) */}
                {form.supportAvailability === 'Custom' && (
                  <div className="pt-2 p-4 rounded-lg bg-[#F5F7FA] dark:bg-[#071A2B]/50 border border-[#D9E0E7] dark:border-[#1B3754] space-y-3">
                    <span className="text-xs font-bold text-[#071A2B] dark:text-white font-sora block">
                      Custom Operating Hours (South Africa Standard Time — SAST)
                    </span>
                    <div className="flex flex-wrap items-center gap-3 text-xs">
                      <div>
                        <label
                          htmlFor="custom-support-start"
                          className="block text-[11px] font-semibold text-[#667085] dark:text-slate-400 font-sora mb-1"
                        >
                          Opening Time
                        </label>
                        <input
                          id="custom-support-start"
                          type="time"
                          value={form.customSupportHours?.start || '08:00'}
                          onChange={(e) => handleCustomHourChange('start', e.target.value)}
                          className={`px-3 py-2 rounded-lg text-xs font-mono font-semibold bg-white dark:bg-[#0B253F] border text-[#071A2B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F2B705] ${
                            errors.customSupportStart
                              ? 'border-rose-500'
                              : 'border-[#D9E0E7] dark:border-[#1B3754]'
                          }`}
                        />
                        {errors.customSupportStart && (
                          <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 font-manrope">
                            {errors.customSupportStart}
                          </p>
                        )}
                      </div>

                      <span className="text-[#667085] dark:text-slate-400 self-end pb-2 font-mono">to</span>

                      <div>
                        <label
                          htmlFor="custom-support-end"
                          className="block text-[11px] font-semibold text-[#667085] dark:text-slate-400 font-sora mb-1"
                        >
                          Closing Time
                        </label>
                        <input
                          id="custom-support-end"
                          type="time"
                          value={form.customSupportHours?.end || '17:00'}
                          onChange={(e) => handleCustomHourChange('end', e.target.value)}
                          className={`px-3 py-2 rounded-lg text-xs font-mono font-semibold bg-white dark:bg-[#0B253F] border text-[#071A2B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F2B705] ${
                            errors.customSupportEnd
                              ? 'border-rose-500'
                              : 'border-[#D9E0E7] dark:border-[#1B3754]'
                          }`}
                        />
                        {errors.customSupportEnd && (
                          <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 font-manrope">
                            {errors.customSupportEnd}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* =========================================================================
              SECTION 3: SECURITY
              ========================================================================= */}
          <section
            aria-labelledby="security-heading"
            className="bg-white dark:bg-[#0B253F] rounded-xl border border-[#D9E0E7] dark:border-[#1B3754] p-5 sm:p-6 shadow-sm space-y-5"
          >
            <div className="border-b border-[#D9E0E7] dark:border-[#1B3754] pb-3.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#071A2B]/5 dark:bg-[#F2B705]/10 flex items-center justify-center text-[#071A2B] dark:text-[#F2B705]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <h2
                    id="security-heading"
                    className="text-sm font-bold text-[#071A2B] dark:text-white uppercase tracking-wider font-sora"
                  >
                    3. Security
                  </h2>
                  <p className="text-xs text-[#667085] dark:text-slate-400 font-manrope">
                    Session lifecycle constraints, sensitive step confirmations, and administrator credential management.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              {/* Session Inactivity Timeout */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start pb-4 border-b border-[#D9E0E7]/60 dark:border-[#1B3754]/60">
                <div>
                  <label
                    htmlFor="setting-session-timeout"
                    className="block text-xs font-bold text-[#071A2B] dark:text-slate-200 font-sora"
                  >
                    Session Timeout
                  </label>
                  <p className="text-[11px] text-[#667085] dark:text-slate-400 mt-0.5 font-manrope">
                    Configures idle duration before an administrative session expires for security compliance.
                  </p>
                </div>
                <div>
                  <select
                    id="setting-session-timeout"
                    value={form.sessionTimeoutMinutes}
                    onChange={(e) => handleInputChange('sessionTimeoutMinutes', Number(e.target.value))}
                    className="w-full sm:w-64 px-3.5 py-2.5 rounded-lg text-xs font-semibold bg-[#F5F7FA] dark:bg-[#071A2B] border border-[#D9E0E7] dark:border-[#1B3754] text-[#071A2B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F2B705] font-sora transition-colors"
                  >
                    {ALLOWED_TIMEOUTS.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  {errors.sessionTimeoutMinutes && (
                    <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 font-manrope">
                      {errors.sessionTimeoutMinutes}
                    </p>
                  )}
                </div>
              </div>

              {/* Sensitive Action Confirmation Toggle */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-[#D9E0E7]/60 dark:border-[#1B3754]/60">
                <div>
                  <span className="block text-xs font-bold text-[#071A2B] dark:text-slate-200 font-sora">
                    Sensitive Action Confirmation
                  </span>
                  <p className="text-[11px] text-[#667085] dark:text-slate-400 mt-0.5 font-manrope">
                    Require confirmation for sensitive administrative actions (e.g. claim rejections, user status suspensions).
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={Boolean(form.requireSensitiveActionConfirmation)}
                    onChange={(e) =>
                      handleInputChange('requireSensitiveActionConfirmation', e.target.checked)
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#F2B705] rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-[#071A2B] dark:peer-checked:bg-[#F2B705] peer-checked:after:dark:bg-[#071A2B]"></div>
                  <span className="ml-3 text-xs font-semibold text-[#071A2B] dark:text-slate-200 font-sora">
                    {form.requireSensitiveActionConfirmation ? 'Enabled' : 'Disabled'}
                  </span>
                </label>
              </div>

              {/* Change Admin Password Action */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#D9E0E7]/60 dark:border-[#1B3754]/60">
                <div>
                  <span className="block text-xs font-bold text-[#071A2B] dark:text-slate-200 font-sora">
                    Administrator Authentication Credentials
                  </span>
                  <p className="text-[11px] text-[#667085] dark:text-slate-400 mt-0.5 font-manrope">
                    Update your administrative account password through the secure authentication protocol.
                  </p>
                  <p className="text-[10px] text-[#667085] dark:text-slate-400 font-mono mt-1">
                    Active Account: {adminUser?.email || 'admin@windrivesa.co.za'} • Last rotated: {form.lastPasswordChange}
                  </p>
                </div>
                <div>
                  <button
                    id="btn-change-admin-password"
                    type="button"
                    onClick={handleOpenPasswordModal}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-white dark:bg-[#071A2B] border border-[#D9E0E7] dark:border-[#1B3754] text-[#071A2B] dark:text-white hover:bg-[#F5F7FA] dark:hover:bg-[#132A42] transition-colors focus:outline-none focus:ring-2 focus:ring-[#F2B705] font-sora shadow-sm"
                  >
                    <svg className="w-3.5 h-3.5 text-[#071A2B] dark:text-[#F2B705]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    <span>Change Admin Password</span>
                  </button>
                </div>
              </div>

              {/* Restrained Danger Zone */}
              <div className="rounded-lg border border-rose-200 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/20 p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <span className="block text-xs font-bold text-rose-900 dark:text-rose-300 font-sora">
                      Restrained Security Control: Sign Out All Other Admin Sessions
                    </span>
                    <p className="text-[11px] text-rose-700 dark:text-rose-300/80 mt-0.5 font-manrope">
                      Invalidates concurrent administrative login tokens and active browser sessions on all other devices.
                    </p>
                  </div>
                  <div>
                    <button
                      id="btn-signout-other-sessions"
                      type="button"
                      onClick={() => setShowSignoutSessionsModal(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-rose-600 text-white hover:bg-rose-700 dark:bg-rose-700 dark:hover:bg-rose-600 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500 font-sora shadow-xs"
                    >
                      <span>Sign Out All Other Admin Sessions</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* =========================================================================
              SECTION 4: SYSTEM PREFERENCES
              ========================================================================= */}
          <section
            aria-labelledby="preferences-heading"
            className="bg-white dark:bg-[#0B253F] rounded-xl border border-[#D9E0E7] dark:border-[#1B3754] p-5 sm:p-6 shadow-sm space-y-5"
          >
            <div className="border-b border-[#D9E0E7] dark:border-[#1B3754] pb-3.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#071A2B]/5 dark:bg-[#F2B705]/10 flex items-center justify-center text-[#071A2B] dark:text-[#F2B705]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </div>
                <div>
                  <h2
                    id="preferences-heading"
                    className="text-sm font-bold text-[#071A2B] dark:text-white uppercase tracking-wider font-sora"
                  >
                    4. System Preferences
                  </h2>
                  <p className="text-xs text-[#667085] dark:text-slate-400 font-manrope">
                    Administrative display theme, date formats, regional timezone, and application language.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Theme Preference */}
              <div>
                <label className="block text-xs font-bold text-[#071A2B] dark:text-slate-200 font-sora mb-2">
                  Theme (Default: Light)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleThemeSelect('light')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-xs font-bold font-sora transition-colors ${
                      theme === 'light'
                        ? 'border-[#071A2B] bg-slate-100 text-[#071A2B] ring-2 ring-[#071A2B]/20'
                        : 'border-[#D9E0E7] dark:border-[#1B3754] text-[#667085] dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#071A2B]'
                    }`}
                  >
                    <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span>Light Mode</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleThemeSelect('dark')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-xs font-bold font-sora transition-colors ${
                      theme === 'dark'
                        ? 'border-[#F2B705] bg-[#071A2B] text-white ring-2 ring-[#F2B705]/40'
                        : 'border-[#D9E0E7] dark:border-[#1B3754] text-[#667085] dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#071A2B]'
                    }`}
                  >
                    <svg className="w-4 h-4 text-[#F2B705]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                    <span>Dark Mode</span>
                  </button>
                </div>
                <p className="text-[11px] text-[#667085] dark:text-slate-400 mt-2 font-manrope">
                  Integrates directly with the existing application theme system across the administrative shell.
                </p>
              </div>

              {/* Date Format */}
              <div>
                <label
                  htmlFor="setting-date-format"
                  className="block text-xs font-bold text-[#071A2B] dark:text-slate-200 font-sora mb-1"
                >
                  Date Format
                </label>
                <select
                  id="setting-date-format"
                  value={form.dateFormat}
                  onChange={(e) => handleInputChange('dateFormat', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg text-xs font-semibold bg-[#F5F7FA] dark:bg-[#071A2B] border border-[#D9E0E7] dark:border-[#1B3754] text-[#071A2B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F2B705] font-sora transition-colors"
                >
                  {ALLOWED_DATE_FORMATS.map((df) => (
                    <option key={df.code} value={df.code}>
                      {df.label}
                    </option>
                  ))}
                </select>
                {errors.dateFormat && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 font-manrope">
                    {errors.dateFormat}
                  </p>
                )}
                <p className="text-[11px] text-[#667085] dark:text-slate-400 mt-1 font-manrope">
                  Default format for administrative ledger exports and audit timestamps.
                </p>
              </div>

              {/* Timezone */}
              <div>
                <label
                  htmlFor="setting-timezone"
                  className="block text-xs font-bold text-[#071A2B] dark:text-slate-200 font-sora mb-1"
                >
                  Timezone (Default: Africa/Johannesburg)
                </label>
                <select
                  id="setting-timezone"
                  value={form.timezone}
                  onChange={(e) => handleInputChange('timezone', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg text-xs font-semibold bg-[#F5F7FA] dark:bg-[#071A2B] border border-[#D9E0E7] dark:border-[#1B3754] text-[#071A2B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F2B705] font-sora transition-colors"
                >
                  {ALLOWED_TIMEZONES.map((tz) => (
                    <option key={tz.id} value={tz.id}>
                      {tz.label}
                    </option>
                  ))}
                </select>
                {errors.timezone && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 font-manrope">
                    {errors.timezone}
                  </p>
                )}
                <p className="text-[11px] text-[#667085] dark:text-slate-400 mt-1 font-manrope">
                  South African Standard Time (SAST) serves as the authoritative operational clock for all prize claims.
                </p>
              </div>

              {/* Language */}
              <div>
                <label
                  htmlFor="setting-language"
                  className="block text-xs font-bold text-[#071A2B] dark:text-slate-200 font-sora mb-1"
                >
                  Language
                </label>
                <select
                  id="setting-language"
                  value={form.language}
                  onChange={(e) => handleInputChange('language', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg text-xs font-semibold bg-[#F5F7FA] dark:bg-[#071A2B] border border-[#D9E0E7] dark:border-[#1B3754] text-[#071A2B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F2B705] font-sora transition-colors"
                >
                  {ALLOWED_LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.label}
                    </option>
                  ))}
                </select>
                {errors.language && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 font-manrope">
                    {errors.language}
                  </p>
                )}
                <p className="text-[11px] text-[#667085] dark:text-slate-400 mt-1 font-manrope">
                  English is the authoritative operational and legal language for the WinDriveSA console.
                </p>
              </div>
            </div>
          </section>

          {/* =========================================================================
              BOTTOM STICKY ACTION BAR: SAVE CHANGES / CANCEL
              ========================================================================= */}
          <div className="sticky bottom-0 z-20 bg-white/95 dark:bg-[#0B253F]/95 backdrop-blur-sm border-t border-[#D9E0E7] dark:border-[#1B3754] -mx-4 sm:-mx-6 px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-2">
              {isDirty ? (
                <span className="text-xs font-semibold text-amber-800 dark:text-amber-300 font-manrope flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#F2B705] animate-pulse" />
                  <span>You have unsaved changes in settings.</span>
                </span>
              ) : (
                <span className="text-xs text-[#667085] dark:text-slate-400 font-manrope">
                  All configuration parameters are up to date.
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto">
              <button
                id="btn-cancel-settings"
                type="button"
                onClick={handleCancelClick}
                disabled={isSaving}
                className="px-4 py-2 text-xs font-semibold text-[#071A2B] dark:text-slate-200 bg-white dark:bg-[#071A2B] border border-[#D9E0E7] dark:border-[#1B3754] hover:bg-[#F5F7FA] dark:hover:bg-[#132A42] rounded-lg transition-colors font-sora focus:outline-none focus:ring-2 focus:ring-[#F2B705]"
              >
                Cancel
              </button>

              <button
                id="btn-save-settings"
                type="submit"
                disabled={isSaving || !isDirty}
                className={`inline-flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-lg transition-all font-sora focus:outline-none focus:ring-2 focus:ring-[#F2B705] shadow-sm ${
                  !isDirty
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                    : 'bg-[#071A2B] text-white hover:bg-[#0E2C48] dark:bg-[#F2B705] dark:text-[#071A2B] dark:hover:bg-[#FFC926]'
                }`}
              >
                {isSaving ? (
                  <>
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* =========================================================================
            MODAL: CHANGE ADMIN PASSWORD
            ========================================================================= */}
        {showPasswordModal && (
          <div
            className="fixed inset-0 z-50 bg-[#071A2B]/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="password-modal-title"
          >
            <div className="bg-white dark:bg-[#0B253F] border border-[#D9E0E7] dark:border-[#1B3754] rounded-2xl max-w-md w-full shadow-2xl p-6 space-y-5 my-8">
              <div className="flex items-start justify-between border-b border-[#D9E0E7] dark:border-[#1B3754] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#071A2B]/5 dark:bg-[#F2B705]/10 flex items-center justify-center text-[#071A2B] dark:text-[#F2B705]">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <h3 id="password-modal-title" className="text-base font-bold text-[#071A2B] dark:text-white font-sora">
                      Change Admin Password
                    </h3>
                    <p className="text-[11px] text-[#667085] dark:text-slate-400 font-manrope">
                      Account: {adminUser?.email || 'admin@windrivesa.co.za'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClosePasswordModal}
                  aria-label="Close dialog"
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {passwordErrors.form && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300 font-manrope">
                  {passwordErrors.form}
                </div>
              )}

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                {/* Current Password */}
                <div>
                  <label
                    htmlFor="current-password"
                    className="block text-xs font-bold text-[#071A2B] dark:text-slate-200 font-sora mb-1"
                  >
                    Current Password <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="current-password"
                      type={showPasswordFields.current ? 'text' : 'password'}
                      value={passwordForm.currentPassword}
                      onChange={(e) => {
                        setPasswordForm({ ...passwordForm, currentPassword: e.target.value });
                        if (passwordErrors.currentPassword) {
                          setPasswordErrors((prev) => ({ ...prev, currentPassword: null }));
                        }
                      }}
                      autoComplete="current-password"
                      className="w-full px-3.5 py-2.5 pr-10 rounded-lg text-xs bg-[#F5F7FA] dark:bg-[#071A2B] border border-[#D9E0E7] dark:border-[#1B3754] text-[#071A2B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F2B705] font-mono"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowPasswordFields({
                          ...showPasswordFields,
                          current: !showPasswordFields.current,
                        })
                      }
                      aria-label={showPasswordFields.current ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-2.5 text-[#667085] dark:text-slate-400 hover:text-[#071A2B] dark:hover:text-white transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {showPasswordFields.current ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        )}
                      </svg>
                    </button>
                  </div>
                  {passwordErrors.currentPassword && (
                    <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 font-manrope">
                      {passwordErrors.currentPassword}
                    </p>
                  )}
                </div>

                {/* New Password */}
                <div>
                  <label
                    htmlFor="new-password"
                    className="block text-xs font-bold text-[#071A2B] dark:text-slate-200 font-sora mb-1"
                  >
                    New Password <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="new-password"
                      type={showPasswordFields.new ? 'text' : 'password'}
                      value={passwordForm.newPassword}
                      onChange={(e) => {
                        setPasswordForm({ ...passwordForm, newPassword: e.target.value });
                        if (passwordErrors.newPassword) {
                          setPasswordErrors((prev) => ({ ...prev, newPassword: null }));
                        }
                      }}
                      autoComplete="new-password"
                      className="w-full px-3.5 py-2.5 pr-10 rounded-lg text-xs bg-[#F5F7FA] dark:bg-[#071A2B] border border-[#D9E0E7] dark:border-[#1B3754] text-[#071A2B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F2B705] font-mono"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowPasswordFields({
                          ...showPasswordFields,
                          new: !showPasswordFields.new,
                        })
                      }
                      aria-label={showPasswordFields.new ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-2.5 text-[#667085] dark:text-slate-400 hover:text-[#071A2B] dark:hover:text-white transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {showPasswordFields.new ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        )}
                      </svg>
                    </button>
                  </div>
                  {passwordErrors.newPassword && (
                    <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 font-manrope">
                      {passwordErrors.newPassword}
                    </p>
                  )}
                  <p className="text-[10px] text-[#667085] dark:text-slate-400 mt-1 font-manrope">
                    Requirements: Min 8 characters, with 1 uppercase, 1 lowercase, and 1 number.
                  </p>
                </div>

                {/* Confirm New Password */}
                <div>
                  <label
                    htmlFor="confirm-password"
                    className="block text-xs font-bold text-[#071A2B] dark:text-slate-200 font-sora mb-1"
                  >
                    Confirm New Password <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="confirm-password"
                      type={showPasswordFields.confirm ? 'text' : 'password'}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => {
                        setPasswordForm({ ...passwordForm, confirmPassword: e.target.value });
                        if (passwordErrors.confirmPassword) {
                          setPasswordErrors((prev) => ({ ...prev, confirmPassword: null }));
                        }
                      }}
                      autoComplete="new-password"
                      className="w-full px-3.5 py-2.5 pr-10 rounded-lg text-xs bg-[#F5F7FA] dark:bg-[#071A2B] border border-[#D9E0E7] dark:border-[#1B3754] text-[#071A2B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F2B705] font-mono"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowPasswordFields({
                          ...showPasswordFields,
                          confirm: !showPasswordFields.confirm,
                        })
                      }
                      aria-label={showPasswordFields.confirm ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-2.5 text-[#667085] dark:text-slate-400 hover:text-[#071A2B] dark:hover:text-white transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {showPasswordFields.confirm ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        )}
                      </svg>
                    </button>
                  </div>
                  {passwordErrors.confirmPassword && (
                    <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 font-manrope">
                      {passwordErrors.confirmPassword}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#D9E0E7] dark:border-[#1B3754]">
                  <button
                    id="btn-password-cancel"
                    type="button"
                    onClick={handleClosePasswordModal}
                    className="px-4 py-2 text-xs font-semibold text-[#667085] dark:text-slate-400 hover:text-[#071A2B] dark:hover:text-white rounded-lg border border-[#D9E0E7] dark:border-[#1B3754] transition-colors font-sora"
                  >
                    Cancel
                  </button>
                  <button
                    id="btn-password-submit"
                    type="submit"
                    disabled={isUpdatingPassword}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#071A2B] hover:bg-[#0E2C48] dark:bg-[#F2B705] dark:text-[#071A2B] dark:hover:bg-[#FFC926] rounded-lg transition-colors font-sora shadow-sm"
                  >
                    {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* =========================================================================
            MODAL: RESTRAINED DANGER ZONE - SIGNOUT ALL SESSIONS
            ========================================================================= */}
        {showSignoutSessionsModal && (
          <div
            className="fixed inset-0 z-50 bg-[#071A2B]/60 backdrop-blur-xs flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="signout-modal-title"
          >
            <div className="bg-white dark:bg-[#0B253F] border border-[#D9E0E7] dark:border-[#1B3754] rounded-2xl max-w-md w-full shadow-2xl p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 font-bold">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 id="signout-modal-title" className="text-base font-bold text-[#071A2B] dark:text-white font-sora">
                    Sign Out All Other Admin Sessions?
                  </h3>
                  <p className="text-xs text-[#667085] dark:text-slate-400 mt-1 leading-relaxed font-manrope">
                    This administrative action terminates any concurrent sessions active on other browsers or devices. Your current session will remain active.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#D9E0E7] dark:border-[#1B3754]">
                <button
                  id="btn-signout-cancel"
                  type="button"
                  onClick={() => setShowSignoutSessionsModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#667085] dark:text-slate-400 hover:text-[#071A2B] dark:hover:text-white rounded-lg border border-[#D9E0E7] dark:border-[#1B3754] transition-colors font-sora"
                >
                  Cancel
                </button>
                <button
                  id="btn-signout-confirm"
                  type="button"
                  onClick={handleConfirmSignoutSessions}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-colors font-sora"
                >
                  Terminate Other Sessions
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            MODAL: DISCARD UNSAVED CHANGES CONFIRMATION
            ========================================================================= */}
        {showDiscardModal && (
          <div
            className="fixed inset-0 z-50 bg-[#071A2B]/60 backdrop-blur-xs flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="discard-modal-title"
          >
            <div className="bg-white dark:bg-[#0B253F] border border-[#D9E0E7] dark:border-[#1B3754] rounded-2xl max-w-md w-full shadow-2xl p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 font-bold text-lg">
                  ?
                </div>
                <div>
                  <h3 id="discard-modal-title" className="text-base font-bold text-[#071A2B] dark:text-white font-sora">
                    Discard unsaved changes?
                  </h3>
                  <p className="text-xs text-[#667085] dark:text-slate-400 mt-1 leading-relaxed font-manrope">
                    You have made changes to the application settings. If you leave or cancel now, your adjustments will be discarded.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#D9E0E7] dark:border-[#1B3754]">
                <button
                  id="btn-discard-keep-editing"
                  type="button"
                  onClick={() => {
                    setShowDiscardModal(false);
                    setPendingNavigationPath(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-[#667085] dark:text-slate-400 hover:text-[#071A2B] dark:hover:text-white rounded-lg border border-[#D9E0E7] dark:border-[#1B3754] transition-colors font-sora"
                >
                  Keep Editing
                </button>
                <button
                  id="btn-discard-confirm"
                  type="button"
                  onClick={handleConfirmDiscard}
                  className="px-4 py-2 text-xs font-bold text-white bg-[#071A2B] dark:bg-[#F2B705] dark:text-[#071A2B] hover:bg-[#0E2C48] dark:hover:bg-[#FFC926] rounded-lg shadow-sm transition-colors font-sora"
                >
                  Discard Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
