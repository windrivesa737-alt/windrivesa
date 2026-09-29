// WinDriveSA Claims Management Service Abstraction
// Central operational registry for reviewing and managing cash and vehicle prize claims
// Strictly separates Claim Status, Account Status, Reward Status, and Claim Requirement Status
// Never stores or displays sensitive credentials (passwords, PINs, CVVs, OTPs, online banking credentials)

const CLAIMS_STORAGE_KEY = 'windrive_admin_claims_list';
const REQUIREMENTS_STORAGE_KEY = 'windrive_claim_requirements_config';

// Configured statutory claim requirements (consistent with /admin/claim-requirements)
export const DEFAULT_CONFIGURED_REQUIREMENTS = {
  vehicle: {
    enabled: true,
    applicableCharge: 3500.0,
    currency: 'ZAR',
    description: 'Provincial logistics dispatch, pre-delivery vehicle inspection, and registered carrier coordination fee.',
    category: 'Logistics Administration',
  },
  cash: {
    enabled: false,
    applicableCharge: 0.0,
    currency: 'ZAR',
    description: '',
    category: 'Standard Settlement',
  },
};

// Initial authoritative claim registry dataset
export const INITIAL_CLAIMS_DATA = [
  {
    id: 'CLM-9821',
    userId: 'WD-RSA-9941',
    userName: 'Sipho Ndlovu',
    userEmail: 'sipho.ndlovu@vodamail.co.za',
    userPhone: '+27 82 555 1092',
    accountStatus: 'APPROVED',
    type: 'Vehicle Prize',
    prizeName: 'Toyota Hilux 2026',
    submittedDate: '2026-09-14 14:22',
    updatedAt: '2026-09-14 15:00',
    status: 'UNDER REVIEW',
    vehicleDetails: {
      vehicleMake: 'Toyota',
      vehicleModel: 'Hilux 2.8 GD-6 Legend 4x4',
      vehicleYear: 2026,
      vehicleImage: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80',
      deliveryAddress: '44 Impala Ridge Boulevard',
      city: 'Sandton',
      province: 'Gauteng',
      postalCode: '2196',
      preferredContact: 'Self (+27 82 555 1092)',
    },
    cashDetails: null,
    timeline: [
      { event: 'Claim Submitted', date: '2026-09-14 14:22', note: 'Claimant submitted physical delivery documentation' },
      { event: 'Under Review', date: '2026-09-14 15:00', note: 'Claim allocated to registrar queue for verification' },
    ],
  },
  {
    id: 'CLM-9820',
    userId: 'WD-RSA-9942',
    userName: 'Lerato Khumalo',
    userEmail: 'lerato.khumalo@gmail.com',
    userPhone: '+27 71 884 9901',
    accountStatus: 'APPROVED',
    type: 'Cash Prize',
    prizeName: 'R250,000',
    submittedDate: '2026-09-14 11:05',
    updatedAt: '2026-09-14 14:10',
    status: 'APPROVED',
    cashDetails: {
      amount: 250000,
      currency: 'ZAR',
      fullName: 'Lerato Khumalo',
      bankName: 'First National Bank (FNB)',
      accountNumber: '6289 •••• 4192',
      accountType: 'Private Wealth Cheque Account',
      branchCode: '250655',
    },
    vehicleDetails: null,
    timeline: [
      { event: 'Claim Submitted', date: '2026-09-14 11:05', note: 'Bank confirmation details provided' },
      { event: 'Under Review', date: '2026-09-14 11:30', note: 'FICA account title verification in progress' },
      { event: 'Approved', date: '2026-09-14 14:10', note: 'Account and identification verified by registrar' },
    ],
  },
  {
    id: 'CLM-9819',
    userId: 'WD-RSA-9946',
    userName: 'David van der Merwe',
    userEmail: 'd.vandermerwe@capefarm.co.za',
    userPhone: '+27 83 490 2211',
    accountStatus: 'APPROVED',
    type: 'Vehicle Prize',
    prizeName: 'Toyota Hilux 2026',
    submittedDate: '2026-09-13 16:40',
    updatedAt: '2026-09-14 10:00',
    status: 'REQUIREMENT PENDING',
    vehicleDetails: {
      vehicleMake: 'Toyota',
      vehicleModel: 'Hilux 2.8 GD-6 Legend 4x4',
      vehicleYear: 2026,
      vehicleImage: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80',
      deliveryAddress: 'Klipfontein Agricultural Estate',
      city: 'Paarl',
      province: 'Western Cape',
      postalCode: '7646',
      preferredContact: 'David (+27 83 490 2211)',
    },
    cashDetails: null,
    timeline: [
      { event: 'Claim Submitted', date: '2026-09-13 16:40', note: 'Claimant submitted physical delivery location' },
      { event: 'Under Review', date: '2026-09-13 17:15', note: 'Triage verification begun' },
      { event: 'Approved', date: '2026-09-14 09:30', note: 'Vehicle entitlement approved' },
      { event: 'Requirement Pending', date: '2026-09-14 10:00', note: 'Applicable charge requirement attached for logistics coordination' },
    ],
  },
  {
    id: 'CLM-9818',
    userId: 'WD-RSA-9948',
    userName: 'Nomvula Dlamini',
    userEmail: 'nomvula.d@telkomsa.net',
    userPhone: '+27 79 123 4488',
    accountStatus: 'ACTIVE',
    type: 'Cash Prize',
    prizeName: 'R500,000',
    submittedDate: '2026-09-12 09:15',
    updatedAt: '2026-09-13 08:30',
    status: 'PROCESSING',
    cashDetails: {
      amount: 500000,
      currency: 'ZAR',
      fullName: 'Nomvula Dlamini',
      bankName: 'Standard Bank South Africa',
      accountNumber: '1014 •••• 7730',
      accountType: 'Current Account',
      branchCode: '051001',
    },
    vehicleDetails: null,
    timeline: [
      { event: 'Claim Submitted', date: '2026-09-12 09:15', note: 'Claimant submitted bank details' },
      { event: 'Under Review', date: '2026-09-12 10:00', note: 'Triage inspection completed' },
      { event: 'Approved', date: '2026-09-12 14:00', note: 'Full compliance cleared' },
      { event: 'Processing', date: '2026-09-13 08:30', note: 'Batch EFT disbursement queued for bank execution' },
    ],
  },
  {
    id: 'CLM-9817',
    userId: 'WD-RSA-9947',
    userName: 'Johan Pretorius',
    userEmail: 'johan@pretoriuslaw.co.za',
    userPhone: '+27 82 771 9002',
    accountStatus: 'ACTIVE',
    type: 'Cash Prize',
    prizeName: 'R100,000',
    submittedDate: '2026-09-11 18:30',
    updatedAt: '2026-09-13 11:20',
    status: 'FULFILLED',
    cashDetails: {
      amount: 100000,
      currency: 'ZAR',
      fullName: 'Johan Pretorius',
      bankName: 'Investec Bank Ltd',
      accountNumber: '5001 •••• 8821',
      accountType: 'Private Client Checking',
      branchCode: '580105',
    },
    vehicleDetails: null,
    timeline: [
      { event: 'Claim Submitted', date: '2026-09-11 18:30', note: 'Claimant submitted bank details' },
      { event: 'Under Review', date: '2026-09-12 09:00', note: 'Compliance review started' },
      { event: 'Approved', date: '2026-09-12 11:15', note: 'Registrar signed off settlement' },
      { event: 'Processing', date: '2026-09-12 14:00', note: 'Disbursement file transmitted to bank' },
      { event: 'Fulfilled', date: '2026-09-13 11:20', note: 'Settlement confirmed via banking transaction reference' },
    ],
  },
  {
    id: 'CLM-9816',
    userId: 'WD-RSA-9949',
    userName: 'Bongani Sithole',
    userEmail: 'bsithole@umgeni.co.za',
    userPhone: '+27 73 990 1214',
    accountStatus: 'APPROVED',
    type: 'Vehicle Prize',
    prizeName: 'Toyota Hilux 2026',
    submittedDate: '2026-09-10 12:10',
    updatedAt: '2026-09-10 13:00',
    status: 'UNDER REVIEW',
    vehicleDetails: {
      vehicleMake: 'Toyota',
      vehicleModel: 'Hilux 2.8 GD-6 Legend 4x4',
      vehicleYear: 2026,
      vehicleImage: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80',
      deliveryAddress: '18 Marine Drive',
      city: 'Umhlanga Rocks',
      province: 'KwaZulu-Natal',
      postalCode: '4319',
      preferredContact: 'Bongani (+27 73 990 1214)',
    },
    cashDetails: null,
    timeline: [
      { event: 'Claim Submitted', date: '2026-09-10 12:10', note: 'Claimant submitted physical delivery address' },
      { event: 'Under Review', date: '2026-09-10 13:00', note: 'Assigned to KwaZulu-Natal regional fleet coordinator' },
    ],
  },
  {
    id: 'CLM-9815',
    userId: 'WD-RSA-9950',
    userName: 'Anesh Pillay',
    userEmail: 'apillay@natalnet.co.za',
    userPhone: '+27 84 332 9011',
    accountStatus: 'APPROVED',
    type: 'Cash Prize',
    prizeName: 'R50,000',
    submittedDate: '2026-09-09 15:45',
    updatedAt: '2026-09-10 10:00',
    status: 'MORE INFORMATION REQUIRED',
    cashDetails: {
      amount: 50000,
      currency: 'ZAR',
      fullName: 'Anesh Pillay',
      bankName: 'Nedbank Ltd',
      accountNumber: '1987 •••• 0042',
      accountType: 'Savings Account',
      branchCode: '198765',
    },
    vehicleDetails: null,
    timeline: [
      { event: 'Claim Submitted', date: '2026-09-09 15:45', note: 'Bank details submitted' },
      { event: 'Under Review', date: '2026-09-09 16:30', note: 'Discrepancy noted between account initials and identity record' },
      { event: 'More Information Required', date: '2026-09-10 10:00', note: 'Requested official bank confirmation letter from claimant' },
    ],
  },
  {
    id: 'CLM-9814',
    userId: 'WD-RSA-9951',
    userName: 'Fatima Bham',
    userEmail: 'fatima.bham@investec.co.za',
    userPhone: '+27 82 441 5567',
    accountStatus: 'ACTIVE',
    type: 'Cash Prize',
    prizeName: 'R1,000,000',
    submittedDate: '2026-09-08 08:50',
    updatedAt: '2026-09-08 15:00',
    status: 'APPROVED',
    cashDetails: {
      amount: 1000000,
      currency: 'ZAR',
      fullName: 'Fatima Bham',
      bankName: 'Absa Bank',
      accountNumber: '4081 •••• 9923',
      accountType: 'Cheque Account',
      branchCode: '632005',
    },
    vehicleDetails: null,
    timeline: [
      { event: 'Claim Submitted', date: '2026-09-08 08:50', note: 'Settlement coordinates submitted' },
      { event: 'Under Review', date: '2026-09-08 09:30', note: 'High-value prize clearance audit' },
      { event: 'Approved', date: '2026-09-08 15:00', note: 'Senior registrar and compliance officer approved' },
    ],
  },
];

/**
 * Format currency in South African Rand (ZAR)
 */
export function formatZAR(amount) {
  if (typeof amount !== 'number') return amount;
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Get configured claim requirement for a prize type (read from /admin/claim-requirements store or defaults)
 */
export function getConfiguredRequirement(claimType) {
  const isVehicle = claimType?.toLowerCase().includes('vehicle');
  try {
    const raw = localStorage.getItem(REQUIREMENTS_STORAGE_KEY);
    if (raw) {
      const config = JSON.parse(raw);
      if (isVehicle && config.vehicle) {
        return config.vehicle;
      } else if (!isVehicle && config.cash) {
        return config.cash;
      }
    }
  } catch (e) {
    console.error('Error reading claim requirements:', e);
  }
  return isVehicle ? DEFAULT_CONFIGURED_REQUIREMENTS.vehicle : DEFAULT_CONFIGURED_REQUIREMENTS.cash;
}

/**
 * Get all claim requests from persistence
 */
export function getAllClaims() {
  try {
    const raw = localStorage.getItem(CLAIMS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
    // Seed initial dataset
    localStorage.setItem(CLAIMS_STORAGE_KEY, JSON.stringify(INITIAL_CLAIMS_DATA));
    return INITIAL_CLAIMS_DATA;
  } catch (e) {
    console.error('Error fetching claims list:', e);
    return INITIAL_CLAIMS_DATA;
  }
}

/**
 * Get a specific claim request by ID
 */
export function getClaimById(id) {
  if (!id) return null;
  const claims = getAllClaims();
  return claims.find((c) => c.id.toLowerCase() === id.toLowerCase()) || null;
}

/**
 * Compute operational summary metrics from current dataset
 */
export function getClaimMetrics(claims = null) {
  const list = claims || getAllClaims();
  return {
    totalClaims: list.length,
    underReview: list.filter((c) => c.status === 'UNDER REVIEW').length,
    approved: list.filter((c) => c.status === 'APPROVED').length,
    requirementsPending: list.filter((c) => c.status === 'REQUIREMENT PENDING').length,
    processing: list.filter((c) => c.status === 'PROCESSING').length,
    fulfilled: list.filter((c) => c.status === 'FULFILLED').length,
  };
}

/**
 * Save updated claims list to storage
 */
function saveClaims(claims) {
  try {
    localStorage.setItem(CLAIMS_STORAGE_KEY, JSON.stringify(claims));
  } catch (e) {
    console.error('Error saving claims:', e);
  }
}

/**
 * Update claim status with operational audit logging
 */
export function updateClaimStatus(claimId, newStatus, operatorNote = '') {
  const claims = getAllClaims();
  const index = claims.findIndex((c) => c.id.toLowerCase() === claimId.toLowerCase());
  if (index === -1) {
    return { success: false, error: 'Claim record not found.' };
  }

  const claim = claims[index];
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 16).replace('T', ' ');

  // Create timeline event
  const timelineItem = {
    event: formatTimelineEventName(newStatus),
    date: dateStr,
    note: operatorNote || `Status mutated to ${newStatus} by registrar`,
  };

  const updatedClaim = {
    ...claim,
    status: newStatus,
    updatedAt: dateStr,
    timeline: [...(claim.timeline || []), timelineItem],
  };

  claims[index] = updatedClaim;
  saveClaims(claims);

  // Sync updated status to user's claim and reward record in localStorage
  try {
    if (claim.userId) {
      const userClaimsKey = `windrive_claims_${claim.userId}`;
      const rawUserClaims = localStorage.getItem(userClaimsKey);
      if (rawUserClaims) {
        const userClaims = JSON.parse(rawUserClaims);
        const isCash = claim.type?.toLowerCase().includes('cash');
        userClaims.forEach((uc) => {
          if (
            uc.id === claim.id ||
            uc.payoutReference === claim.id ||
            (isCash && uc.type === 'cash') ||
            (!isCash && uc.type === 'vehicle')
          ) {
            uc.status = newStatus;
          }
        });
        localStorage.setItem(userClaimsKey, JSON.stringify(userClaims));
      }

      const userRewardsKey = `windrive_rewards_${claim.userId}`;
      const rawUserRewards = localStorage.getItem(userRewardsKey);
      if (rawUserRewards) {
        const rewards = JSON.parse(rawUserRewards);
        const isCash = claim.type?.toLowerCase().includes('cash');
        if (isCash && rewards.cash) {
          rewards.cash.claim_status = newStatus;
        } else if (!isCash && rewards.vehicle) {
          rewards.vehicle.claim_status = newStatus;
        }
        localStorage.setItem(userRewardsKey, JSON.stringify(rewards));
      }
    }
  } catch (syncErr) {
    console.warn('Sync claim status to user state notice:', syncErr);
  }

  return { success: true, claim: updatedClaim };
}

function formatTimelineEventName(status) {
  switch (status) {
    case 'SUBMITTED':
      return 'Claim Submitted';
    case 'UNDER REVIEW':
      return 'Under Review';
    case 'APPROVED':
      return 'Approved';
    case 'REQUIREMENT PENDING':
      return 'Requirement Pending';
    case 'MORE INFORMATION REQUIRED':
      return 'More Information Required';
    case 'PROCESSING':
      return 'Processing';
    case 'FULFILLED':
      return 'Fulfilled';
    case 'REJECTED':
      return 'Rejected';
    default:
      return status;
  }
}
