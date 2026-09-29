// WinDriveSA Mock Claim Requirements Service Abstraction
// Persistent administrative configuration for post-approval claim requirements
// Strictly separates Requirement Status from Account Status, Reward Status, and Claim Status
// Configures neutral "Applicable Charge" without processing payments or collecting banking credentials

const REQUIREMENTS_STORAGE_KEY = 'windrive_claim_requirements_config';

import { recordAuditLog } from './auditLogs.js';

export const DEFAULT_CLAIM_REQUIREMENTS = {
  cash: {
    id: 'req_cash_standard',
    claimType: 'Cash Prize',
    prize: 'Cash Prize (Standard: R250,000 ZAR)',
    applicableCharge: 0.0,
    currency: 'ZAR',
    description: 'Administrative verification and fiduciary settlement processing fee for institutional ZAR escrow transfer.',
    status: 'ENABLED',
    enabled: true,
    whatsappSupportNumber: '+27 (0) 11 884 9200',
    updatedAt: '2026-09-14 09:15',
  },
  vehicle: {
    id: 'req_vehicle_standard',
    claimType: 'Vehicle Prize',
    prize: 'Vehicle Prize (Standard: 2026 Toyota Hilux 2.8 GD-6)',
    applicableCharge: 3500.0,
    currency: 'ZAR',
    description: 'Provincial logistics dispatch, pre-delivery vehicle inspection, and registered carrier coordination fee.',
    status: 'ENABLED',
    enabled: true,
    whatsappSupportNumber: '+27 (0) 11 884 9200',
    updatedAt: '2026-09-14 10:30',
  },
  whatsappSupportNumber: '+27 (0) 11 884 9200',
};

/**
 * Format timestamp in South Africa Standard Time (SAST)
 */
export function formatSASTDate(date = new Date()) {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day} ${month} ${year}, ${hours}:${minutes}`;
}

/**
 * Format monetary amount into ZAR standard display (e.g., R3,500.00)
 */
export function formatZAR(amount, includeDecimals = true) {
  const num = typeof amount === 'number' ? amount : parseFloat(String(amount).replace(/[^0-9.-]/g, '')) || 0;
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: includeDecimals ? 2 : 0,
  }).format(num);
}

/**
 * Clean numeric input string into float
 */
export function parseNumericAmount(str) {
  if (typeof str === 'number') return Math.max(0, str);
  if (!str) return 0;
  const cleaned = String(str).replace(/[^0-9.]/g, '');
  const val = parseFloat(cleaned);
  return isNaN(val) ? 0 : Math.max(0, val);
}

/**
 * Retrieve current claim requirements from local storage
 */
export function getClaimRequirements() {
  try {
    const raw = localStorage.getItem(REQUIREMENTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        cash: {
          ...DEFAULT_CLAIM_REQUIREMENTS.cash,
          ...(parsed.cash || {}),
          enabled: parsed.cash?.status === 'ENABLED' || parsed.cash?.enabled === true,
          status: (parsed.cash?.status || (parsed.cash?.enabled ? 'ENABLED' : 'DISABLED')).toUpperCase(),
        },
        vehicle: {
          ...DEFAULT_CLAIM_REQUIREMENTS.vehicle,
          ...(parsed.vehicle || {}),
          enabled: parsed.vehicle?.status === 'ENABLED' || parsed.vehicle?.enabled === true,
          status: (parsed.vehicle?.status || (parsed.vehicle?.enabled ? 'ENABLED' : 'DISABLED')).toUpperCase(),
        },
        whatsappSupportNumber: parsed.whatsappSupportNumber || DEFAULT_CLAIM_REQUIREMENTS.whatsappSupportNumber,
      };
    }
  } catch (err) {
    console.error('Failed to load claim requirements from storage:', err);
  }

  // Save initial defaults
  saveFullRequirements(DEFAULT_CLAIM_REQUIREMENTS);
  return DEFAULT_CLAIM_REQUIREMENTS;
}

/**
 * Save complete requirements dataset to storage
 */
export function saveFullRequirements(fullConfig) {
  try {
    localStorage.setItem(REQUIREMENTS_STORAGE_KEY, JSON.stringify(fullConfig));
    return true;
  } catch (err) {
    console.error('Failed to persist claim requirements:', err);
    return false;
  }
}

/**
 * Save a specific category requirement ('cash' | 'vehicle')
 */
export function saveRequirement(category, updatedFields) {
  const current = getClaimRequirements();
  if (!current[category]) {
    return { success: false, error: `Invalid category: ${category}` };
  }

  const isEnabled = updatedFields.status === 'ENABLED' || updatedFields.enabled === true;
  const status = isEnabled ? 'ENABLED' : 'DISABLED';

  const updatedCategory = {
    ...current[category],
    ...updatedFields,
    status,
    enabled: isEnabled,
    currency: 'ZAR',
    updatedAt: formatSASTDate(new Date()),
  };

  const newConfig = {
    ...current,
    [category]: updatedCategory,
  };

  const saved = saveFullRequirements(newConfig);
  if (saved) {
    recordAuditLog({
      action: 'CLAIM REQUIREMENT UPDATED',
      entityType: 'Claim Requirement',
      entityId: updatedCategory.id || category,
      description: `Updated ${updatedCategory.claimType || category} claim requirement configuration. Status: ${status}, Applicable Charge: ${updatedCategory.applicableCharge} ${updatedCategory.currency}.`,
      beforeChanges: current[category],
      afterChanges: updatedCategory,
    }).catch(() => {});
  }
  return {
    success: saved,
    category: updatedCategory,
    error: saved ? null : 'Failed to write to persistent storage.',
  };
}

/**
 * Save WhatsApp Support Number
 */
export function saveWhatsAppSupportNumber(number) {
  const current = getClaimRequirements();
  const trimmed = (number || '').trim();

  const newConfig = {
    ...current,
    whatsappSupportNumber: trimmed,
    cash: {
      ...current.cash,
      whatsappSupportNumber: trimmed,
    },
    vehicle: {
      ...current.vehicle,
      whatsappSupportNumber: trimmed,
    },
  };

  const saved = saveFullRequirements(newConfig);
  if (saved) {
    recordAuditLog({
      action: 'CLAIM REQUIREMENT SUPPORT NUMBER UPDATED',
      entityType: 'Claim Requirement',
      entityId: 'SET-WHATSAPP-SUPPORT',
      description: `Updated claim requirement WhatsApp support contact to ${trimmed}.`,
      beforeChanges: { whatsappSupportNumber: current.whatsappSupportNumber },
      afterChanges: { whatsappSupportNumber: trimmed },
    }).catch(() => {});
  }
  return {
    success: saved,
    whatsappSupportNumber: trimmed,
    error: saved ? null : 'Failed to write to persistent storage.',
  };
}

/**
 * Validate requirement parameters
 */
export function validateRequirement(data) {
  const errors = {};

  if (!data.claimType || !data.claimType.trim()) {
    errors.claimType = 'Claim Type is required.';
  }

  if (!data.prize || !data.prize.trim()) {
    errors.prize = 'Applicable Prize is required.';
  }

  const amount = parseNumericAmount(data.applicableCharge);
  if (isNaN(amount) || amount < 0) {
    errors.applicableCharge = 'Applicable Charge must be a positive number or zero.';
  }

  if (data.currency && data.currency !== 'ZAR') {
    errors.currency = 'Currency must strictly be ZAR.';
  }

  const isEnabled = data.status === 'ENABLED' || data.enabled === true;
  if (isEnabled && (!data.description || !data.description.trim())) {
    errors.description = 'Description is required when requirement is enabled.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate phone number format
 */
export function validatePhoneNumber(phone) {
  if (!phone || !phone.trim()) return true; // Optional if not provided
  // Allow international/national formats with digits, +, (), spaces, dashes
  const digitsOnly = phone.replace(/[^0-9]/g, '');
  return digitsOnly.length >= 7 && digitsOnly.length <= 15;
}
