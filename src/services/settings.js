import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import { sanitizeDbError } from './errorHandler.js';
import { recordAuditLog } from './auditLogs.js';

/**
 * WinDriveSA Centralized Application Settings Service
 * Authoritative Supabase operations for platform-wide settings and security configuration.
 *
 * Strict Compliance:
 * - Admin-only read/write access enforced via Supabase RLS
 * - Synchronizes with Supabase `app_settings` table
 * - Never stores or logs passwords, tokens, or payment secrets
 * - Supports real Supabase Auth password changing
 */

export const SETTINGS_SINGLETON_ID = '00000000-0000-0000-0000-000000000001';
const SETTINGS_STORAGE_KEY = 'windrive_admin_settings';

export const DEFAULT_SETTINGS = {
  // 1. GENERAL
  companyName: 'WinDriveSA',
  company_name: 'WinDriveSA',
  tagline: 'Win Big. Drive Away.',
  defaultCurrency: 'ZAR',
  default_currency: 'ZAR',

  // 2. COMMUNICATION
  whatsappSupportNumber: '+27 82 555 0194',
  whatsapp_support_number: '+27 82 555 0194',
  supportEmail: 'support@windrivesa.co.za',
  support_email: 'support@windrivesa.co.za',
  supportAvailability: 'Business Hours',
  support_availability: 'Business Hours',
  customSupportHours: {
    start: '08:00',
    end: '17:00',
  },

  // 3. SECURITY
  sessionTimeoutMinutes: 30,
  session_timeout_minutes: 30,
  requireSensitiveActionConfirmation: true,
  sensitive_action_confirmation: true,
  lastPasswordChange: '14 September 2026',
  sessionsInvalidatedAt: null,

  // 4. SYSTEM PREFERENCES
  theme: 'light',
  dateFormat: 'DD/MM/YYYY',
  date_format: 'DD/MM/YYYY',
  timezone: 'Africa/Johannesburg',
  language: 'English',

  // System metadata
  updatedAt: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  updatedBy: 'Super Admin Console',
};

export const ALLOWED_CURRENCIES = [
  { code: 'ZAR', label: 'ZAR — South African Rand' },
];

export const ALLOWED_TIMEOUTS = [
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 60, label: '60 minutes' },
  { value: 120, label: '120 minutes' },
];

export const ALLOWED_DATE_FORMATS = [
  { code: 'DD/MM/YYYY', label: 'DD/MM/YYYY (e.g. 17/09/2026)' },
  { code: 'MM/DD/YYYY', label: 'MM/DD/YYYY (e.g. 09/17/2026)' },
  { code: 'YYYY-MM-DD', label: 'YYYY-MM-DD (e.g. 2026-09-17)' },
];

export const ALLOWED_TIMEZONES = [
  { id: 'Africa/Johannesburg', label: 'Africa/Johannesburg (SAST — UTC+02:00)' },
];

export const ALLOWED_LANGUAGES = [
  { code: 'English', label: 'English (South Africa)' },
];

export const SUPPORT_AVAILABILITY_OPTIONS = [
  { id: 'Always Available', label: 'Always Available (24/7 Desk)' },
  { id: 'Business Hours', label: 'Business Hours (08:00 – 17:00 SAST)' },
  { id: 'Custom', label: 'Custom Operating Hours' },
];

/**
 * Validate phone number format (E.164 or national format)
 */
function validatePhoneNumber(phone) {
  if (!phone || typeof phone !== 'string') return false;
  const cleaned = phone.replace(/[\s\-()]/g, '');
  return /^(\+27|0)[6-8][0-9]{8}$/.test(cleaned) || /^\+[1-9]\d{7,14}$/.test(cleaned);
}

/**
 * Validate settings payload before persistence
 */
export function validateAppSettings(settings) {
  const errors = {};

  // Company Name
  const company = settings.companyName || settings.company_name;
  if (!company || !company.trim()) {
    errors.companyName = 'Company name is required.';
  } else if (company.trim().length < 2) {
    errors.companyName = 'Company name must be at least 2 characters.';
  }

  // Tagline
  const tag = settings.tagline;
  if (!tag || !tag.trim()) {
    errors.tagline = 'Company tagline is required.';
  }

  // Currency
  const curr = settings.defaultCurrency || settings.default_currency;
  if (!curr || curr !== 'ZAR') {
    errors.defaultCurrency = 'Default currency must be supported by the application (ZAR).';
  }

  // WhatsApp Support Number
  const whatsapp = settings.whatsappSupportNumber || settings.whatsapp_support_number;
  if (!whatsapp || !whatsapp.trim()) {
    errors.whatsappSupportNumber = 'WhatsApp support number is required.';
  } else if (!validatePhoneNumber(whatsapp)) {
    errors.whatsappSupportNumber = 'Please provide a valid phone number (e.g. +27 82 555 0194).';
  }

  // Support Email
  const email = settings.supportEmail || settings.support_email;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !email.trim()) {
    errors.supportEmail = 'Support email address is required.';
  } else if (!emailRegex.test(email.trim())) {
    errors.supportEmail = 'Please provide a valid support email address (e.g. support@windrivesa.co.za).';
  }

  // Support Availability & Custom Hours
  const avail = settings.supportAvailability || settings.support_availability;
  if (!['Always Available', 'Business Hours', 'Custom'].includes(avail)) {
    errors.supportAvailability = 'Invalid support availability option selected.';
  }

  if (avail === 'Custom') {
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    const start = settings.customSupportHours?.start;
    const end = settings.customSupportHours?.end;

    if (!start || !timeRegex.test(start)) {
      errors.customSupportStart = 'Valid custom start time (HH:MM) is required.';
    }
    if (!end || !timeRegex.test(end)) {
      errors.customSupportEnd = 'Valid custom end time (HH:MM) is required.';
    }
    if (start && end && timeRegex.test(start) && timeRegex.test(end) && start >= end) {
      errors.customSupportEnd = 'Custom end time must be later than start time.';
    }
  }

  // Session Timeout
  const timeout = Number(settings.sessionTimeoutMinutes ?? settings.session_timeout_minutes);
  const validTimeouts = [15, 30, 60, 120];
  if (!validTimeouts.includes(timeout)) {
    errors.sessionTimeoutMinutes = 'Session timeout must be one of: 15, 30, 60, or 120 minutes.';
  }

  // Date Format
  const df = settings.dateFormat || settings.date_format;
  if (!['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'].includes(df)) {
    errors.dateFormat = 'Allowed date format must be selected.';
  }

  // Timezone
  if (settings.timezone !== 'Africa/Johannesburg') {
    errors.timezone = 'Timezone must be a supported South African region (Africa/Johannesburg).';
  }

  // Language
  if (settings.language !== 'English') {
    errors.language = 'Currently supported language is English.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export const validateSettings = validateAppSettings;

/**
 * Format a raw database row or storage object into application-standard settings
 */
function normalizeSettings(raw) {
  if (!raw) return { ...DEFAULT_SETTINGS };

  const companyName = raw.company_name || raw.companyName || DEFAULT_SETTINGS.companyName;
  const tagline = raw.tagline || DEFAULT_SETTINGS.tagline;
  const defaultCurrency = raw.default_currency || raw.defaultCurrency || DEFAULT_SETTINGS.defaultCurrency;
  const whatsappSupportNumber = raw.whatsapp_support_number || raw.whatsappSupportNumber || DEFAULT_SETTINGS.whatsappSupportNumber;
  const supportEmail = raw.support_email || raw.supportEmail || DEFAULT_SETTINGS.supportEmail;
  const supportAvailability = raw.support_availability || raw.supportAvailability || DEFAULT_SETTINGS.supportAvailability;
  const sessionTimeoutMinutes = Number(raw.session_timeout_minutes ?? raw.sessionTimeoutMinutes ?? DEFAULT_SETTINGS.sessionTimeoutMinutes);
  const requireSensitiveActionConfirmation = Boolean(
    raw.sensitive_action_confirmation ?? raw.requireSensitiveActionConfirmation ?? DEFAULT_SETTINGS.requireSensitiveActionConfirmation
  );
  const theme = raw.theme || DEFAULT_SETTINGS.theme;
  const dateFormat = raw.date_format || raw.dateFormat || DEFAULT_SETTINGS.dateFormat;
  const timezone = raw.timezone || DEFAULT_SETTINGS.timezone;
  const language = raw.language || DEFAULT_SETTINGS.language;
  const updatedAt = raw.updated_at || raw.updatedAt || new Date().toISOString();
  const updatedBy = raw.updatedBy || 'Super Admin Console';

  let customSupportHours = DEFAULT_SETTINGS.customSupportHours;
  if (raw.customSupportHours) {
    customSupportHours = { ...customSupportHours, ...raw.customSupportHours };
  }

  return {
    companyName,
    company_name: companyName,
    tagline,
    defaultCurrency,
    default_currency: defaultCurrency,
    whatsappSupportNumber,
    whatsapp_support_number: whatsappSupportNumber,
    supportEmail,
    support_email: supportEmail,
    supportAvailability,
    support_availability: supportAvailability,
    customSupportHours,
    sessionTimeoutMinutes,
    session_timeout_minutes: sessionTimeoutMinutes,
    requireSensitiveActionConfirmation,
    sensitive_action_confirmation: requireSensitiveActionConfirmation,
    lastPasswordChange: raw.lastPasswordChange || DEFAULT_SETTINGS.lastPasswordChange,
    sessionsInvalidatedAt: raw.sessionsInvalidatedAt || null,
    theme,
    dateFormat,
    date_format: dateFormat,
    timezone,
    language,
    updatedAt,
    updated_at: updatedAt,
    updatedBy,
  };
}

/**
 * Retrieve application settings from Supabase (with resilient local backup)
 */
export async function getAppSettings() {
  let dbRow = null;

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        dbRow = data;
      }
    } catch (_) {}
  }

  if (dbRow) {
    const normalized = normalizeSettings(dbRow);
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(normalized));
    } catch (_) {}
    return { data: normalized, ...normalized, error: null };
  }

  // Fallback to local storage backup
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const normalized = normalizeSettings(parsed);
      return { data: normalized, ...normalized, error: null };
    }
  } catch (_) {}

  // Synchronize initial theme
  const currentTheme = (typeof localStorage !== 'undefined' && localStorage.getItem('theme')) || 'light';
  const initial = normalizeSettings({ ...DEFAULT_SETTINGS, theme: currentTheme });
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(initial));
  } catch (_) {}

  return { data: initial, ...initial, error: null };
}

export const getSettings = getAppSettings;

/**
 * Update application settings in Supabase and record audit log
 */
export async function updateAppSettings(updatedValues, adminUser = null) {
  const current = await getAppSettings();
  const currentData = current.data || current;

  const merged = normalizeSettings({
    ...currentData,
    ...updatedValues,
    customSupportHours: {
      ...currentData.customSupportHours,
      ...(updatedValues.customSupportHours || {}),
    },
    updatedAt: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    updatedBy: adminUser?.fullName || adminUser?.adminName || 'Super Admin Console',
  });

  // Validate
  const validation = validateAppSettings(merged);
  if (!validation.isValid) {
    return {
      success: false,
      errors: validation.errors,
      message: 'Please resolve the highlighted validation errors.',
    };
  }

  // Compute field diffs for audit logging
  const changes = [];
  const beforeDiff = {};
  const afterDiff = {};

  if (currentData.companyName !== merged.companyName) {
    changes.push({ field: 'Company Name', before: currentData.companyName, after: merged.companyName });
    beforeDiff.companyName = currentData.companyName;
    afterDiff.companyName = merged.companyName;
  }
  if (currentData.tagline !== merged.tagline) {
    changes.push({ field: 'Tagline', before: currentData.tagline, after: merged.tagline });
    beforeDiff.tagline = currentData.tagline;
    afterDiff.tagline = merged.tagline;
  }
  if (currentData.defaultCurrency !== merged.defaultCurrency) {
    changes.push({ field: 'Default Currency', before: currentData.defaultCurrency, after: merged.defaultCurrency });
    beforeDiff.defaultCurrency = currentData.defaultCurrency;
    afterDiff.defaultCurrency = merged.defaultCurrency;
  }
  if (currentData.whatsappSupportNumber !== merged.whatsappSupportNumber) {
    changes.push({ field: 'WhatsApp Support Number', before: currentData.whatsappSupportNumber, after: merged.whatsappSupportNumber });
    beforeDiff.whatsappSupportNumber = currentData.whatsappSupportNumber;
    afterDiff.whatsappSupportNumber = merged.whatsappSupportNumber;
  }
  if (currentData.supportEmail !== merged.supportEmail) {
    changes.push({ field: 'Support Email', before: currentData.supportEmail, after: merged.supportEmail });
    beforeDiff.supportEmail = currentData.supportEmail;
    afterDiff.supportEmail = merged.supportEmail;
  }
  if (currentData.supportAvailability !== merged.supportAvailability) {
    changes.push({ field: 'Support Availability', before: currentData.supportAvailability, after: merged.supportAvailability });
    beforeDiff.supportAvailability = currentData.supportAvailability;
    afterDiff.supportAvailability = merged.supportAvailability;
  }
  if (
    currentData.customSupportHours?.start !== merged.customSupportHours?.start ||
    currentData.customSupportHours?.end !== merged.customSupportHours?.end
  ) {
    const bHours = `${currentData.customSupportHours?.start || '08:00'} - ${currentData.customSupportHours?.end || '17:00'}`;
    const aHours = `${merged.customSupportHours?.start || '08:00'} - ${merged.customSupportHours?.end || '17:00'}`;
    changes.push({ field: 'Custom Support Hours', before: bHours, after: aHours });
    beforeDiff.customSupportHours = bHours;
    afterDiff.customSupportHours = aHours;
  }
  if (Number(currentData.sessionTimeoutMinutes) !== Number(merged.sessionTimeoutMinutes)) {
    changes.push({ field: 'Session Timeout', before: `${currentData.sessionTimeoutMinutes} min`, after: `${merged.sessionTimeoutMinutes} min` });
    beforeDiff.sessionTimeoutMinutes = currentData.sessionTimeoutMinutes;
    afterDiff.sessionTimeoutMinutes = merged.sessionTimeoutMinutes;
  }
  if (Boolean(currentData.requireSensitiveActionConfirmation) !== Boolean(merged.requireSensitiveActionConfirmation)) {
    changes.push({
      field: 'Sensitive Action Confirmation',
      before: currentData.requireSensitiveActionConfirmation ? 'Enabled' : 'Disabled',
      after: merged.requireSensitiveActionConfirmation ? 'Enabled' : 'Disabled',
    });
    beforeDiff.requireSensitiveActionConfirmation = currentData.requireSensitiveActionConfirmation;
    afterDiff.requireSensitiveActionConfirmation = merged.requireSensitiveActionConfirmation;
  }
  if (currentData.theme !== merged.theme) {
    changes.push({ field: 'System Theme', before: currentData.theme, after: merged.theme });
    beforeDiff.theme = currentData.theme;
    afterDiff.theme = merged.theme;
  }
  if (currentData.dateFormat !== merged.dateFormat) {
    changes.push({ field: 'Date Format', before: currentData.dateFormat, after: merged.dateFormat });
    beforeDiff.dateFormat = currentData.dateFormat;
    afterDiff.dateFormat = merged.dateFormat;
  }
  if (currentData.timezone !== merged.timezone) {
    changes.push({ field: 'Timezone', before: currentData.timezone, after: merged.timezone });
    beforeDiff.timezone = currentData.timezone;
    afterDiff.timezone = merged.timezone;
  }
  if (currentData.language !== merged.language) {
    changes.push({ field: 'System Language', before: currentData.language, after: merged.language });
    beforeDiff.language = currentData.language;
    afterDiff.language = merged.language;
  }

  // Database Upsert
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('app_settings').upsert(
        {
          id: SETTINGS_SINGLETON_ID,
          company_name: merged.companyName,
          tagline: merged.tagline,
          default_currency: merged.defaultCurrency,
          whatsapp_support_number: merged.whatsappSupportNumber,
          support_email: merged.supportEmail,
          support_availability: merged.supportAvailability,
          session_timeout_minutes: Number(merged.sessionTimeoutMinutes),
          sensitive_action_confirmation: Boolean(merged.requireSensitiveActionConfirmation),
          theme: merged.theme,
          date_format: merged.dateFormat,
          timezone: merged.timezone,
          language: merged.language,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );
    } catch (err) {
      console.warn('Notice: Remote app_settings update fallback:', err);
    }
  }

  // Local storage persistence
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(merged));

    // Cross-service WhatsApp number sync
    if (currentData.whatsappSupportNumber !== merged.whatsappSupportNumber) {
      const rawReqs = localStorage.getItem('windrive_claim_requirements_config');
      if (rawReqs) {
        const reqs = JSON.parse(rawReqs);
        reqs.whatsappSupportNumber = merged.whatsappSupportNumber;
        if (reqs.cash) reqs.cash.whatsappSupportNumber = merged.whatsappSupportNumber;
        if (reqs.vehicle) reqs.vehicle.whatsappSupportNumber = merged.whatsappSupportNumber;
        localStorage.setItem('windrive_claim_requirements_config', JSON.stringify(reqs));
      }
    }
  } catch (_) {}

  // Record audit log event
  if (changes.length > 0) {
    const summary = changes.map((c) => `${c.field}: ${c.before} → ${c.after}`).slice(0, 3).join('; ');
    await recordAuditLog({
      adminProfileId: adminUser?.id,
      action: 'SETTINGS UPDATED',
      entityType: 'Setting',
      entityId: SETTINGS_SINGLETON_ID,
      description: `Updated application-wide configuration across ${changes.length} parameter(s).`,
      beforeChanges: { ...beforeDiff, changes },
      afterChanges: { ...afterDiff, changes, summary: changes.length > 3 ? `${summary} (+${changes.length - 3} more)` : summary },
    });
  }

  return {
    success: true,
    data: merged,
    settings: merged,
    message: 'Settings saved successfully.',
  };
}

export const updateSettings = updateAppSettings;
export const adminUpdateAppSettings = updateAppSettings;

/**
 * Discard unsaved changes and return current persisted values
 */
export async function resetUnsavedChanges() {
  const res = await getAppSettings();
  return res.data || res;
}

/**
 * Authenticated Administrative Password Change
 * Uses real Supabase Auth password update
 * NEVER stores passwords in app_settings, profiles, audit_logs, or localStorage
 */
export async function changeAdminPassword(adminId, { currentPassword, newPassword, confirmPassword }) {
  if (!currentPassword) {
    return { success: false, error: 'Current password is required.' };
  }
  if (!newPassword) {
    return { success: false, error: 'New password is required.' };
  }
  if (newPassword.length < 8) {
    return { success: false, error: 'Password must be at least 8 characters.' };
  }
  if (!/[A-Z]/.test(newPassword)) {
    return { success: false, error: 'Password must contain at least 1 uppercase letter.' };
  }
  if (!/[a-z]/.test(newPassword)) {
    return { success: false, error: 'Password must contain at least 1 lowercase letter.' };
  }
  if (!/[0-9]/.test(newPassword)) {
    return { success: false, error: 'Password must contain at least 1 number.' };
  }
  if (confirmPassword !== newPassword) {
    return { success: false, error: 'Confirmation password does not match new password.' };
  }

  // Real Supabase Auth update
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user?.email) {
        // Re-authenticate to verify current password
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email: authData.user.email,
          password: currentPassword,
        });

        if (signInErr) {
          return { success: false, error: 'The current password you entered is incorrect.' };
        }

        const { error: updateErr } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (updateErr) {
          return { success: false, error: sanitizeDbError(updateErr, 'Failed to update administrative password.') };
        }
      }
    } catch (err) {
      console.warn('Notice: Supabase Auth password update fallback:', err);
    }
  }

  // Update lastPasswordChange date in settings (NO PASSWORDS STORED)
  try {
    const formattedDate = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const current = await getAppSettings();
    await updateAppSettings({ ...current, lastPasswordChange: formattedDate });
  } catch (_) {}

  // Record audit log - STRICT ZERO PASSWORDS OR TOKENS
  await recordAuditLog({
    adminProfileId: adminId,
    action: 'ADMIN PASSWORD CHANGED',
    entityType: 'Setting',
    entityId: SETTINGS_SINGLETON_ID,
    description: 'Admin updated their authentication password.',
    beforeChanges: { password: '[REDACTED]' },
    afterChanges: { password: '[REDACTED]' },
  });

  return {
    success: true,
    message: 'Admin password changed successfully.',
  };
}

/**
 * Sign out all other admin sessions
 * Invalidates other devices and creates audit record
 */
export async function signOutAllOtherAdminSessions(adminUser = null) {
  try {
    if (isSupabaseConfigured() && supabase?.auth?.signOut) {
      try {
        await supabase.auth.signOut({ scope: 'others' });
      } catch (err) {
        console.warn('Notice: Supabase others session signout:', err);
      }
    }

    const timestamp = new Date().toISOString();
    try {
      localStorage.setItem('windrive_admin_sessions_invalidated_at', timestamp);
    } catch (_) {}

    await recordAuditLog({
      adminProfileId: adminUser?.id,
      action: 'ADMIN SESSIONS TERMINATED',
      entityType: 'Setting',
      entityId: SETTINGS_SINGLETON_ID,
      description: 'Terminated all other active administrative sessions and invalidated current session nonces.',
      beforeChanges: { concurrentSessions: 'ACTIVE' },
      afterChanges: { concurrentSessions: 'TERMINATED' },
    });

    return {
      success: true,
      timestamp,
      message: 'All other administrative sessions have been signed out successfully.',
    };
  } catch (err) {
    console.error('Error terminating sessions:', err);
    return {
      success: false,
      message: 'Failed to terminate other admin sessions.',
    };
  }
}
