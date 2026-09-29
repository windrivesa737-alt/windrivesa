// WinDriveSA Admin Fulfilled Prize Records (Winners Ledger) Service Abstraction
// Manages completed/fulfilled prize records for operational and audit purposes
// Strictly internal admin history - no competitions, leaderboards, public showcases, or betting
// Compatible with future Supabase database schema

import { recordAdminActivity } from './adminService';
import { getAllClaims } from './mockClaims';

const FULFILLED_RECORDS_STORAGE_KEY = 'windrive_fulfilled_prize_records';

// Baseline completed / fulfilled records strictly representing historical audit settlements
const INITIAL_FULFILLED_RECORDS = [
  {
    id: 'WD-FLM-881',
    rewardId: 'REW-101',
    claimId: 'CLM-9817',
    userId: 'WD-RSA-9941',
    userName: 'Michael Dlamini',
    userEmail: 'm.dlamini@telkomsa.net',
    userPhone: '+27 82 459 9012',
    accountStatus: 'APPROVED',
    accountCreated: '12 Jan 2026',
    prizeType: 'CASH',
    prizeTitle: 'Cash Prize — R250,000',
    prizeAmount: 'R250,000',
    amountValue: 250000,
    currency: 'ZAR',
    rewardStatus: 'COMPLETED',
    claimStatus: 'FULFILLED',
    fulfilledDate: '14 Sep 2026',
    fulfilledTimestamp: '14 Sep 2026, 11:20 SAST',
    lastUpdated: '14 Sep 2026, 11:20 SAST',
    bankDetails: {
      fullName: 'Michael Dlamini',
      bankName: 'Standard Bank of South Africa',
      accountNumber: '••••••••4891',
      accountType: 'Cheque / Current Account',
      branchCode: '051001 (Johannesburg Main)',
    },
    vehicleDetails: null,
    timeline: [
      { stage: 'Claim Submitted', timestamp: '01 Sep 2026, 09:00 SAST', note: 'Claimant self-service portal submission' },
      { stage: 'Under Review', timestamp: '02 Sep 2026, 14:15 SAST', note: 'Banking coordinates verified via account confirmation' },
      { stage: 'Approved', timestamp: '04 Sep 2026, 10:30 SAST', note: 'Admin Controller 04 approved disbursement dossier' },
      { stage: 'Requirement Completed', timestamp: '08 Sep 2026, 16:00 SAST', note: 'FICA compliance and account verification cleared' },
      { stage: 'Processing', timestamp: '11 Sep 2026, 11:00 SAST', note: 'Batch EFT disbursement queued with fiduciary bank' },
      { stage: 'Fulfilled', timestamp: '14 Sep 2026, 11:20 SAST', note: 'Disbursement settled and archived in immutable ledger' },
    ],
    auditContext: {
      recordId: 'WD-FLM-881',
      rewardId: 'REW-101',
      claimId: 'CLM-9817',
      fulfilledDate: '14 Sep 2026, 11:20 SAST',
      lastUpdated: '14 Sep 2026, 11:20 SAST',
      ledgerRef: '0x7F9B...88D2',
      auditor: 'Admin Controller 04',
    },
  },
  {
    id: 'WD-FLM-880',
    rewardId: 'REW-102',
    claimId: 'CLM-9812',
    userId: 'WD-RSA-9942',
    userName: 'Thandi Mokoena',
    userEmail: 'thandi.mokoena@vodamail.co.za',
    userPhone: '+27 83 912 3441',
    accountStatus: 'APPROVED',
    accountCreated: '18 Jan 2026',
    prizeType: 'VEHICLE',
    prizeTitle: '2026 Toyota Hilux 2.8 GD-6 Legend 4x4',
    prizeAmount: null,
    amountValue: null,
    currency: null,
    vehicleMake: 'Toyota',
    vehicleModel: 'Hilux 2.8 GD-6 Legend 4x4 Automatic',
    vehicleYear: 2026,
    vehicleImage: '/images/windrivesa-hilux-white-01.jpg',
    rewardStatus: 'COMPLETED',
    claimStatus: 'FULFILLED',
    fulfilledDate: '12 Sep 2026',
    fulfilledTimestamp: '12 Sep 2026, 15:45 SAST',
    lastUpdated: '12 Sep 2026, 15:45 SAST',
    bankDetails: null,
    vehicleDetails: {
      fullName: 'Thandi Mokoena',
      mobileNumber: '+27 83 912 3441',
      deliveryAddress: '42 Highlands Ridge Road, Waterkloof',
      city: 'Pretoria',
      province: 'Gauteng',
      postalCode: '0181',
      preferredDeliveryContact: 'Direct Mobile & WhatsApp',
    },
    timeline: [
      { stage: 'Claim Submitted', timestamp: '28 Aug 2026, 08:30 SAST', note: 'Claimant submitted preferred delivery coordinates' },
      { stage: 'Under Review', timestamp: '30 Aug 2026, 11:20 SAST', note: 'Identity and registration compliance audit' },
      { stage: 'Approved', timestamp: '02 Sep 2026, 09:15 SAST', note: 'Approved by Fleet Logistics Supervisor' },
      { stage: 'Requirement Completed', timestamp: '05 Sep 2026, 14:00 SAST', note: 'Licensing, NaTIS registration and roadworthy cleared' },
      { stage: 'Processing', timestamp: '08 Sep 2026, 10:00 SAST', note: 'Transporter dispatch scheduled for Gauteng depot' },
      { stage: 'Fulfilled', timestamp: '12 Sep 2026, 15:45 SAST', note: 'Physical vehicle handover signed and inspection logged' },
    ],
    auditContext: {
      recordId: 'WD-FLM-880',
      rewardId: 'REW-102',
      claimId: 'CLM-9812',
      fulfilledDate: '12 Sep 2026, 15:45 SAST',
      lastUpdated: '12 Sep 2026, 15:45 SAST',
      ledgerRef: '0x3E1C...229A',
      auditor: 'Admin Controller 02',
    },
  },
  {
    id: 'WD-FLM-879',
    rewardId: 'REW-103',
    claimId: 'CLM-9808',
    userId: 'WD-RSA-9943',
    userName: 'Sipho Ndlovu',
    userEmail: 'sipho.ndlovu@nashua.co.za',
    userPhone: '+27 71 882 1099',
    accountStatus: 'ACTIVE',
    accountCreated: '02 Feb 2026',
    prizeType: 'CASH',
    prizeTitle: 'Cash Prize — R250,000',
    prizeAmount: 'R250,000',
    amountValue: 250000,
    currency: 'ZAR',
    rewardStatus: 'COMPLETED',
    claimStatus: 'FULFILLED',
    fulfilledDate: '08 Sep 2026',
    fulfilledTimestamp: '08 Sep 2026, 09:40 SAST',
    lastUpdated: '08 Sep 2026, 09:40 SAST',
    bankDetails: {
      fullName: 'Sipho Ndlovu',
      bankName: 'First National Bank (FNB)',
      accountNumber: '••••••••7214',
      accountType: 'Private Clients Cheque',
      branchCode: '250655 (Sandton)',
    },
    vehicleDetails: null,
    timeline: [
      { stage: 'Claim Submitted', timestamp: '22 Aug 2026, 10:00 SAST', note: 'Claimant provided banking verification documents' },
      { stage: 'Under Review', timestamp: '24 Aug 2026, 16:30 SAST', note: 'FICA compliance review' },
      { stage: 'Approved', timestamp: '27 Aug 2026, 11:45 SAST', note: 'Registrar signed off on settlement terms' },
      { stage: 'Requirement Completed', timestamp: '30 Aug 2026, 13:00 SAST', note: 'Tax and compliance verification documented' },
      { stage: 'Processing', timestamp: '03 Sep 2026, 15:00 SAST', note: 'Disbursement file transmitted to treasury gateway' },
      { stage: 'Fulfilled', timestamp: '08 Sep 2026, 09:40 SAST', note: 'Funds cleared in client bank account' },
    ],
    auditContext: {
      recordId: 'WD-FLM-879',
      rewardId: 'REW-103',
      claimId: 'CLM-9808',
      fulfilledDate: '08 Sep 2026, 09:40 SAST',
      lastUpdated: '08 Sep 2026, 09:40 SAST',
      ledgerRef: '0x99AA...55B1',
      auditor: 'Admin Controller 04',
    },
  },
  {
    id: 'WD-FLM-878',
    rewardId: 'REW-104',
    claimId: 'CLM-9804',
    userId: 'WD-RSA-9944',
    userName: 'Naledi Khumalo',
    userEmail: 'naledi.k@investec.co.za',
    userPhone: '+27 82 301 7765',
    accountStatus: 'ACTIVE',
    accountCreated: '14 Feb 2026',
    prizeType: 'VEHICLE',
    prizeTitle: '2026 Ford Ranger 3.0 V6 Wildtrak',
    prizeAmount: null,
    amountValue: null,
    currency: null,
    vehicleMake: 'Ford',
    vehicleModel: 'Ranger 3.0 V6 Wildtrak 4WD Automatic',
    vehicleYear: 2026,
    vehicleImage: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
    rewardStatus: 'COMPLETED',
    claimStatus: 'FULFILLED',
    fulfilledDate: '01 Sep 2026',
    fulfilledTimestamp: '01 Sep 2026, 14:10 SAST',
    lastUpdated: '01 Sep 2026, 14:10 SAST',
    bankDetails: null,
    vehicleDetails: {
      fullName: 'Naledi Khumalo',
      mobileNumber: '+27 82 301 7765',
      deliveryAddress: '17 Umhlanga Rocks Drive, La Lucia',
      city: 'Durban',
      province: 'KwaZulu-Natal',
      postalCode: '4051',
      preferredDeliveryContact: 'Direct Phone Dispatch',
    },
    timeline: [
      { stage: 'Claim Submitted', timestamp: '15 Aug 2026, 11:00 SAST', note: 'Claimant provided handover address' },
      { stage: 'Under Review', timestamp: '18 Aug 2026, 15:00 SAST', note: 'Regional dealer liaison assigned in Durban' },
      { stage: 'Approved', timestamp: '20 Aug 2026, 10:15 SAST', note: 'Authorized by Vehicle Allocation Desk' },
      { stage: 'Requirement Completed', timestamp: '23 Aug 2026, 14:20 SAST', note: 'Transport insurance and registration certified' },
      { stage: 'Processing', timestamp: '26 Aug 2026, 09:30 SAST', note: 'PDI (Pre-Delivery Inspection) completed' },
      { stage: 'Fulfilled', timestamp: '01 Sep 2026, 14:10 SAST', note: 'Official keys and licensing dossier handed over' },
    ],
    auditContext: {
      recordId: 'WD-FLM-878',
      rewardId: 'REW-104',
      claimId: 'CLM-9804',
      fulfilledDate: '01 Sep 2026, 14:10 SAST',
      lastUpdated: '01 Sep 2026, 14:10 SAST',
      ledgerRef: '0x4D2E...7781',
      auditor: 'Admin Controller 01',
    },
  },
  {
    id: 'WD-FLM-877',
    rewardId: 'REW-105',
    claimId: 'CLM-9817',
    userId: 'WD-RSA-9947',
    userName: 'Johan Pretorius',
    userEmail: 'johan@pretoriuslaw.co.za',
    userPhone: '+27 82 771 9002',
    accountStatus: 'ACTIVE',
    accountCreated: '10 Jan 2026',
    prizeType: 'CASH',
    prizeTitle: 'Cash Prize — R100,000',
    prizeAmount: 'R100,000',
    amountValue: 100000,
    currency: 'ZAR',
    rewardStatus: 'COMPLETED',
    claimStatus: 'FULFILLED',
    fulfilledDate: '13 Sep 2026',
    fulfilledTimestamp: '13 Sep 2026, 11:20 SAST',
    lastUpdated: '13 Sep 2026, 11:20 SAST',
    bankDetails: {
      fullName: 'Johan Pretorius',
      bankName: 'Investec Bank Ltd',
      accountNumber: '••••••••8821',
      accountType: 'Private Client Checking',
      branchCode: '580105 (Grayston Drive)',
    },
    vehicleDetails: null,
    timeline: [
      { stage: 'Claim Submitted', timestamp: '11 Sep 2026, 18:30 SAST', note: 'Claimant submitted bank details' },
      { stage: 'Under Review', timestamp: '12 Sep 2026, 09:00 SAST', note: 'Compliance review started' },
      { stage: 'Approved', timestamp: '12 Sep 2026, 11:15 SAST', note: 'Registrar signed off settlement' },
      { stage: 'Requirement Completed', timestamp: '12 Sep 2026, 12:45 SAST', note: 'FICA legal entity check cleared' },
      { stage: 'Processing', timestamp: '12 Sep 2026, 14:00 SAST', note: 'Disbursement file transmitted to bank' },
      { stage: 'Fulfilled', timestamp: '13 Sep 2026, 11:20 SAST', note: 'Settlement confirmed via banking transaction reference' },
    ],
    auditContext: {
      recordId: 'WD-FLM-877',
      rewardId: 'REW-105',
      claimId: 'CLM-9817',
      fulfilledDate: '13 Sep 2026, 11:20 SAST',
      lastUpdated: '13 Sep 2026, 11:20 SAST',
      ledgerRef: '0x88BC...3321',
      auditor: 'Admin Controller 04',
    },
  },
];

/**
 * Initialize and get fulfilled records from localStorage
 */
export function getFulfilledPrizeRecords() {
  try {
    const raw = localStorage.getItem(FULFILLED_RECORDS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(FULFILLED_RECORDS_STORAGE_KEY, JSON.stringify(INITIAL_FULFILLED_RECORDS));
      return INITIAL_FULFILLED_RECORDS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_FULFILLED_RECORDS;
  } catch (e) {
    console.error('Error reading fulfilled prize records:', e);
    return INITIAL_FULFILLED_RECORDS;
  }
}

/**
 * Get a single fulfilled record by ID
 */
export function getFulfilledPrizeRecordById(recordId) {
  if (!recordId) return null;
  const records = getFulfilledPrizeRecords();
  return records.find((r) => r.id === recordId || r.id.toLowerCase() === recordId.toLowerCase()) || null;
}

/**
 * Search and filter fulfilled prize records
 */
export function searchFulfilledPrizeRecords(filters = {}) {
  const { search = '', prizeType = 'ALL', dateFilter = 'ALL', statusFilter = 'ALL' } = filters;
  const records = getFulfilledPrizeRecords();
  const q = search.trim().toLowerCase();

  return records.filter((rec) => {
    // Search filter: user name, email, or prize title
    const matchesSearch =
      !q ||
      rec.userName.toLowerCase().includes(q) ||
      rec.userEmail.toLowerCase().includes(q) ||
      rec.prizeTitle.toLowerCase().includes(q) ||
      rec.id.toLowerCase().includes(q);

    // Prize type filter: ALL, CASH, VEHICLE
    const matchesType =
      prizeType === 'ALL' ||
      rec.prizeType.toUpperCase() === prizeType.toUpperCase();

    // Fulfilment date filter: ALL, RECENT (September 2026), OLDER (August or earlier)
    let matchesDate = true;
    if (dateFilter === 'RECENT') {
      matchesDate = rec.fulfilledDate.includes('Sep 2026') || rec.fulfilledDate.includes('September 2026');
    } else if (dateFilter === 'OLDER') {
      matchesDate = !rec.fulfilledDate.includes('Sep 2026') && !rec.fulfilledDate.includes('September 2026');
    }

    // Reward status filter: ALL, COMPLETED
    const matchesStatus =
      statusFilter === 'ALL' ||
      rec.rewardStatus.toUpperCase() === statusFilter.toUpperCase();

    return matchesSearch && matchesType && matchesDate && matchesStatus;
  });
}

/**
 * Compute operational summary metrics from actual service data
 */
export function getFulfilledMetrics(recordsList) {
  const records = recordsList || getFulfilledPrizeRecords();
  const total = records.length;
  const cashCount = records.filter((r) => r.prizeType === 'CASH').length;
  const vehicleCount = records.filter((r) => r.prizeType === 'VEHICLE').length;
  
  // Find latest fulfilment by date
  let latestFulfilment = 'N/A';
  let latestRecord = null;
  if (records.length > 0) {
    // Records are ordered with latest first by convention
    latestRecord = records[0];
    latestFulfilment = latestRecord.fulfilledDate || 'N/A';
  }

  return {
    totalRecords: total,
    cashCount,
    vehicleCount,
    latestFulfilment,
    latestRecord,
  };
}

/**
 * Export fulfilled records as CSV for audit ledger review
 */
export function exportFulfilledRecordsCSV() {
  const records = getFulfilledPrizeRecords();
  if (records.length === 0) return '';

  const headers = [
    'Record ID',
    'User Name',
    'User Email',
    'Account Status',
    'Prize Title',
    'Prize Type',
    'Reward Status',
    'Claim Status',
    'Fulfilled Date',
    'Fulfilled Timestamp',
    'Bank/Delivery Details',
  ];

  const rows = records.map((r) => {
    const details =
      r.prizeType === 'CASH'
        ? `${r.bankDetails?.bankName || ''} - Acc: ${r.bankDetails?.accountNumber || ''}`
        : `${r.vehicleDetails?.deliveryAddress || ''}, ${r.vehicleDetails?.city || ''}`;

    return [
      `"${r.id}"`,
      `"${r.userName}"`,
      `"${r.userEmail}"`,
      `"${r.accountStatus}"`,
      `"${r.prizeTitle}"`,
      `"${r.prizeType}"`,
      `"${r.rewardStatus}"`,
      `"${r.claimStatus}"`,
      `"${r.fulfilledDate}"`,
      `"${r.fulfilledTimestamp}"`,
      `"${details.replace(/"/g, '""')}"`,
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  
  try {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `windrive_fulfilled_prize_records_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    recordAdminActivity('EXPORT_WINNERS_CSV', 'Exported fulfilled prize records CSV ledger');
    return true;
  } catch (e) {
    console.error('CSV export failed:', e);
    return false;
  }
}
