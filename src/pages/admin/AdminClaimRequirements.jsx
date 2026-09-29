import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AdminShell from '../../components/admin/AdminShell';
import { useAuth } from '../../context/AuthContext';
import {
  adminGetUserRequirements,
  adminUpsertRequirement,
  formatZAR,
  formatSASTDate,
  parseNumericAmount,
  validateRequirement,
  validatePhoneNumber,
} from '../../services/claimRequirements';
import { listUsers } from '../../services/users';
import { getAppSettings, updateAppSettings } from '../../services/settings';

export default function AdminClaimRequirements() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user: authUser, profile: adminProfile } = useAuth();

  const adminUser = useMemo(() => {
    return {
      id: adminProfile?.id || authUser?.id || 'admin_user',
      email: adminProfile?.email || authUser?.email || 'admin@windrivesa.co.za',
      fullName: adminProfile?.full_name || 'Admin Officer',
    };
  }, [adminProfile, authUser]);

  // User Selection State
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userSearch, setUserSearch] = useState('');
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const userSelectorRef = useRef(null);

  // Requirement State for Selected User
  const [loadingRequirements, setLoadingRequirements] = useState(false);
  const [userRequirementsSummary, setUserRequirementsSummary] = useState({
    cash: null,
    vehicle: null,
  });

  // Active Tab: 'cash' | 'vehicle'
  const [activeTab, setActiveTab] = useState('cash');

  // Form states per requirement type
  const [cashForm, setCashForm] = useState({
    claimType: 'Cash Prize',
    title: 'Cash Prize Settlement',
    applicableCharge: '0.00',
    currency: 'ZAR',
    description: '',
    status: 'ENABLED',
    updatedAt: '',
  });

  const [vehicleForm, setVehicleForm] = useState({
    claimType: 'Vehicle Prize',
    title: 'Vehicle Prize Delivery',
    applicableCharge: '0.00',
    currency: 'ZAR',
    description: '',
    status: 'ENABLED',
    updatedAt: '',
  });

  const [whatsappNumber, setWhatsappNumber] = useState('+27 82 555 0194');

  // Dirty tracking
  const [isCashDirty, setIsCashDirty] = useState(false);
  const [isVehicleDirty, setIsVehicleDirty] = useState(false);
  const [isSupportDirty, setIsSupportDirty] = useState(false);

  // Validation errors
  const [cashErrors, setCashErrors] = useState({});
  const [vehicleErrors, setVehicleErrors] = useState({});
  const [supportError, setSupportError] = useState(null);

  // Live preview tab: 'cash' | 'vehicle'
  const [previewTab, setPreviewTab] = useState('cash');

  // Modals & toasts
  const [disableModalTarget, setDisableModalTarget] = useState(null); // 'cash' | 'vehicle' | null
  const [unsavedModalTarget, setUnsavedModalTarget] = useState(null); // callback / user object / path
  const [toast, setToast] = useState(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (userSelectorRef.current && !userSelectorRef.current.contains(e.target)) {
        setIsUserDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 1. Initial Load: Fetch users and support configuration
  useEffect(() => {
    let isMounted = true;
    async function init() {
      setLoadingUsers(true);
      try {
        const [usersRes, settingsRes] = await Promise.all([
          listUsers({ limit: 150, sortBy: 'created_at', sortOrder: 'desc' }),
          getAppSettings().catch(() => null),
        ]);

        if (!isMounted) return;

        const loadedUsers = usersRes?.data || [];
        setUsers(loadedUsers);

        if (settingsRes?.data?.whatsapp_support_number || settingsRes?.whatsapp_support_number) {
          setWhatsappNumber(settingsRes?.data?.whatsapp_support_number || settingsRes?.whatsapp_support_number);
        }

        // Auto-select user based on URL search query or first available user
        const targetUserId = searchParams.get('userId');
        const match = targetUserId
          ? loadedUsers.find((u) => u.id === targetUserId)
          : loadedUsers[0] || null;

        if (match) {
          setSelectedUser(match);
        }
      } catch (err) {
        console.error('Error initializing claim requirements users:', err);
      } finally {
        if (isMounted) setLoadingUsers(false);
      }
    }
    init();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Load requirements whenever selectedUser changes
  useEffect(() => {
    if (!selectedUser?.id) return;
    loadUserRequirements(selectedUser.id);
  }, [selectedUser?.id]);

  const loadUserRequirements = async (userId) => {
    setLoadingRequirements(true);
    try {
      const res = await adminGetUserRequirements(userId);
      const reqData = res?.data || { cash: null, vehicle: null };

      setUserRequirementsSummary({
        cash: reqData.cash,
        vehicle: reqData.vehicle,
      });

      // Populate Cash Form
      if (reqData.cash) {
        setCashForm({
          claimType: 'Cash Prize',
          title: reqData.cash.title || reqData.cash.prize || 'Cash Prize Settlement',
          applicableCharge: String(reqData.cash.applicableCharge ?? reqData.cash.applicable_charge ?? 0),
          currency: reqData.cash.currency || 'ZAR',
          description: reqData.cash.description || '',
          status: reqData.cash.status || 'ENABLED',
          updatedAt: reqData.cash.updatedAt || '',
        });
      } else {
        setCashForm({
          claimType: 'Cash Prize',
          title: 'Cash Prize Settlement',
          applicableCharge: '0.00',
          currency: 'ZAR',
          description: 'Administrative verification and fiduciary settlement processing for institutional ZAR escrow disbursement.',
          status: 'ENABLED',
          updatedAt: '',
        });
      }

      // Populate Vehicle Form
      if (reqData.vehicle) {
        setVehicleForm({
          claimType: 'Vehicle Prize',
          title: reqData.vehicle.title || reqData.vehicle.prize || 'Vehicle Prize Delivery',
          applicableCharge: String(reqData.vehicle.applicableCharge ?? reqData.vehicle.applicable_charge ?? 0),
          currency: reqData.vehicle.currency || 'ZAR',
          description: reqData.vehicle.description || '',
          status: reqData.vehicle.status || 'ENABLED',
          updatedAt: reqData.vehicle.updatedAt || '',
        });
      } else {
        setVehicleForm({
          claimType: 'Vehicle Prize',
          title: 'Vehicle Prize Delivery',
          applicableCharge: '0.00',
          currency: 'ZAR',
          description: 'Provincial logistics transport dispatch, pre-delivery inspection registration, and cross-provincial title transfer processing.',
          status: 'ENABLED',
          updatedAt: '',
        });
      }

      setIsCashDirty(false);
      setIsVehicleDirty(false);
      setCashErrors({});
      setVehicleErrors({});
    } catch (err) {
      console.error('Error loading user requirements:', err);
    } finally {
      setLoadingRequirements(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ open: true, message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const hasAnyUnsavedChanges = useMemo(() => {
    return isCashDirty || isVehicleDirty || isSupportDirty;
  }, [isCashDirty, isVehicleDirty, isSupportDirty]);

  // Filtered users for search dropdown
  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      const name = (u.fullName || u.name || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      const member = (u.memberId || u.member_number || '').toLowerCase();
      const phone = (u.mobile || u.phone || '').toLowerCase();
      return name.includes(q) || email.includes(q) || member.includes(q) || phone.includes(q);
    });
  }, [users, userSearch]);

  // Handle User Switching with Unsaved Changes Guard
  const handleSelectUser = (user) => {
    if (user.id === selectedUser?.id) {
      setIsUserDropdownOpen(false);
      return;
    }

    if (hasAnyUnsavedChanges) {
      setUnsavedModalTarget(user);
    } else {
      setSelectedUser(user);
      setIsUserDropdownOpen(false);
      setSearchParams({ userId: user.id });
    }
  };

  // Toggle status for Cash or Vehicle
  const handleToggleStatusClick = (category) => {
    const currentForm = category === 'cash' ? cashForm : vehicleForm;
    const isCurrentlyEnabled = currentForm.status === 'ENABLED';

    if (isCurrentlyEnabled) {
      setDisableModalTarget(category);
    } else {
      if (category === 'cash') {
        setCashForm((prev) => ({ ...prev, status: 'ENABLED' }));
        setIsCashDirty(true);
      } else {
        setVehicleForm((prev) => ({ ...prev, status: 'ENABLED' }));
        setIsVehicleDirty(true);
      }
      showToast(`${category === 'cash' ? 'Cash' : 'Vehicle'} requirement set to ENABLED.`);
    }
  };

  // Confirm disable from modal
  const handleConfirmDisable = () => {
    if (!disableModalTarget) return;
    const category = disableModalTarget;

    if (category === 'cash') {
      setCashForm((prev) => ({ ...prev, status: 'DISABLED' }));
      setIsCashDirty(true);
    } else {
      setVehicleForm((prev) => ({ ...prev, status: 'DISABLED' }));
      setIsVehicleDirty(true);
    }

    setDisableModalTarget(null);
    showToast(`Status set to DISABLED for ${category === 'cash' ? 'Cash' : 'Vehicle'} claim requirement.`);
  };

  // Save Cash Requirement
  const handleSaveCash = async (e) => {
    if (e) e.preventDefault();
    if (!selectedUser) {
      showToast('Please select a participant first.', 'error');
      return;
    }

    const validation = validateRequirement(cashForm);
    if (!validation.isValid) {
      setCashErrors(validation.errors);
      return;
    }
    setCashErrors({});

    const numericCharge = parseNumericAmount(cashForm.applicableCharge);
    try {
      const result = await adminUpsertRequirement({
        profileId: selectedUser.id,
        claimType: 'CASH',
        title: cashForm.title,
        applicableCharge: numericCharge,
        currency: 'ZAR',
        description: cashForm.description,
        status: cashForm.status,
        supportWhatsapp: whatsappNumber,
        adminUser,
        targetUserName: selectedUser.fullName || selectedUser.name || 'Participant',
      });

      if (result.success) {
        await loadUserRequirements(selectedUser.id);
        setIsCashDirty(false);
        showToast(`Cash requirement for ${selectedUser.fullName || 'user'} saved successfully.`);
      } else {
        showToast(result.error || 'Failed to save cash requirement', 'error');
      }
    } catch (err) {
      showToast('Error saving cash requirement to Supabase', 'error');
    }
  };

  // Save Vehicle Requirement
  const handleSaveVehicle = async (e) => {
    if (e) e.preventDefault();
    if (!selectedUser) {
      showToast('Please select a participant first.', 'error');
      return;
    }

    const validation = validateRequirement(vehicleForm);
    if (!validation.isValid) {
      setVehicleErrors(validation.errors);
      return;
    }
    setVehicleErrors({});

    const numericCharge = parseNumericAmount(vehicleForm.applicableCharge);
    try {
      const result = await adminUpsertRequirement({
        profileId: selectedUser.id,
        claimType: 'VEHICLE',
        title: vehicleForm.title,
        applicableCharge: numericCharge,
        currency: 'ZAR',
        description: vehicleForm.description,
        status: vehicleForm.status,
        supportWhatsapp: whatsappNumber,
        adminUser,
        targetUserName: selectedUser.fullName || selectedUser.name || 'Participant',
      });

      if (result.success) {
        await loadUserRequirements(selectedUser.id);
        setIsVehicleDirty(false);
        showToast(`Vehicle requirement for ${selectedUser.fullName || 'user'} saved successfully.`);
      } else {
        showToast(result.error || 'Failed to save vehicle requirement', 'error');
      }
    } catch (err) {
      showToast('Error saving vehicle requirement to Supabase', 'error');
    }
  };

  // Reset form to saved database baseline
  const handleResetCurrentTab = () => {
    if (activeTab === 'cash') {
      const existing = userRequirementsSummary.cash;
      if (existing) {
        setCashForm({
          claimType: 'Cash Prize',
          title: existing.title || existing.prize || 'Cash Prize Settlement',
          applicableCharge: String(existing.applicableCharge ?? 0),
          currency: 'ZAR',
          description: existing.description || '',
          status: existing.status || 'ENABLED',
          updatedAt: existing.updatedAt || '',
        });
      } else {
        setCashForm({
          claimType: 'Cash Prize',
          title: 'Cash Prize Settlement',
          applicableCharge: '0.00',
          currency: 'ZAR',
          description: '',
          status: 'ENABLED',
          updatedAt: '',
        });
      }
      setIsCashDirty(false);
      setCashErrors({});
    } else {
      const existing = userRequirementsSummary.vehicle;
      if (existing) {
        setVehicleForm({
          claimType: 'Vehicle Prize',
          title: existing.title || existing.prize || 'Vehicle Prize Delivery',
          applicableCharge: String(existing.applicableCharge ?? 0),
          currency: 'ZAR',
          description: existing.description || '',
          status: existing.status || 'ENABLED',
          updatedAt: existing.updatedAt || '',
        });
      } else {
        setVehicleForm({
          claimType: 'Vehicle Prize',
          title: 'Vehicle Prize Delivery',
          applicableCharge: '0.00',
          currency: 'ZAR',
          description: '',
          status: 'ENABLED',
          updatedAt: '',
        });
      }
      setIsVehicleDirty(false);
      setVehicleErrors({});
    }
  };

  // Save Support Contact Number
  const handleSaveSupportNumber = async (e) => {
    if (e) e.preventDefault();
    if (!validatePhoneNumber(whatsappNumber).valid) {
      setSupportError('Please provide a valid phone number (e.g. +27 82 555 0194).');
      return;
    }
    setSupportError(null);

    try {
      await updateAppSettings({
        whatsapp_support_number: whatsappNumber,
      });
      setIsSupportDirty(false);
      showToast('WhatsApp Support Contact updated successfully.');
    } catch (err) {
      showToast('Failed to save support number to Supabase', 'error');
    }
  };

  // Confirm leave or switch from Unsaved modal
  const handleConfirmLeave = () => {
    if (unsavedModalTarget && typeof unsavedModalTarget === 'object') {
      setSelectedUser(unsavedModalTarget);
      setIsCashDirty(false);
      setIsVehicleDirty(false);
      setIsSupportDirty(false);
      setIsUserDropdownOpen(false);
      setSearchParams({ userId: unsavedModalTarget.id });
    } else if (typeof unsavedModalTarget === 'string' && unsavedModalTarget.startsWith('/')) {
      navigate(unsavedModalTarget);
    }
    setUnsavedModalTarget(null);
  };

  // Active preview data based on selected tab and user
  const activePreviewData = useMemo(() => {
    const isCash = previewTab === 'cash';
    const form = isCash ? cashForm : vehicleForm;
    const chargeNum = parseNumericAmount(form.applicableCharge);
    return {
      type: isCash ? 'Cash Prize Claim (Approved)' : 'Vehicle Prize Claim (Approved)',
      categoryName: isCash ? 'Cash Prize' : 'Vehicle Prize',
      status: form.status,
      isEnabled: form.status === 'ENABLED',
      chargeDisplay: formatZAR(chargeNum),
      description: form.description || 'No description configured.',
      whatsapp: whatsappNumber,
      userName: selectedUser?.fullName || selectedUser?.name || 'Participant',
    };
  }, [previewTab, cashForm, vehicleForm, whatsappNumber, selectedUser]);

  const whatsappUrl = useMemo(() => {
    const digits = (whatsappNumber || '').replace(/[^0-9]/g, '');
    const cleanDigits = digits.startsWith('0') ? '27' + digits.slice(1) : digits;
    const text = encodeURIComponent(`Hello WinDriveSA Support, inquiry regarding approved claim requirement for ${activePreviewData.userName}.`);
    return `https://wa.me/${cleanDigits}?text=${text}`;
  }, [whatsappNumber, activePreviewData.userName]);

  return (
    <AdminShell
      activeKey="claim-requirements"
      breadcrumb="HQ Admin Console / Claim Requirements"
      toastState={toast}
      onCloseToast={() => setToast(null)}
    >
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* ======================================================== */}
        {/* SECTION 1: HEADER & OPERATIONAL STATUS                   */}
        {/* ======================================================== */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#D9E0E7] dark:border-[#1E2E3E]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#00843D] dark:text-[#F2B705]">
                User-Specific Claim Configuration Desk
              </span>
              <span className="text-xs text-slate-400">&bull;</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-[#00843D]/10 text-[#00843D] dark:text-[#10B981] border border-[#00843D]/20">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00843D] dark:bg-[#10B981] animate-pulse"></span>
                Individualized Mode Active
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-[#071A2B] dark:text-white tracking-tight mt-1">
              User Claim Requirements
            </h1>
            <p className="text-xs sm:text-sm text-[#667085] dark:text-[#94A3B8] mt-1 max-w-2xl leading-relaxed">
              Select an individual participant to configure their independent Cash and Vehicle prize claim requirements.
            </p>
          </div>

          {selectedUser && (
            <div className="flex items-center gap-2 font-mono text-xs">
              <div className="bg-white dark:bg-[#0B1A28] border border-[#D9E0E7] dark:border-[#1E2E3E] rounded-xl px-3 py-2 text-center shadow-2xs">
                <div className="text-[#667085] dark:text-[#94A3B8] text-[10px] uppercase font-bold tracking-wider">
                  Cash Req
                </div>
                <div
                  className={`font-bold mt-0.5 ${
                    cashForm.status === 'ENABLED'
                      ? 'text-[#00843D] dark:text-[#10B981]'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {cashForm.status} • {formatZAR(parseNumericAmount(cashForm.applicableCharge))}
                </div>
              </div>

              <div className="bg-white dark:bg-[#0B1A28] border border-[#D9E0E7] dark:border-[#1E2E3E] rounded-xl px-3 py-2 text-center shadow-2xs">
                <div className="text-[#667085] dark:text-[#94A3B8] text-[10px] uppercase font-bold tracking-wider">
                  Vehicle Req
                </div>
                <div
                  className={`font-bold mt-0.5 ${
                    vehicleForm.status === 'ENABLED'
                      ? 'text-[#00843D] dark:text-[#10B981]'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {vehicleForm.status} • {formatZAR(parseNumericAmount(vehicleForm.applicableCharge))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* SECTION 2: PARTICIPANT SELECTOR                          */}
        {/* ======================================================== */}
        <section className="bg-white dark:bg-[#0B1A28] border border-[#D9E0E7] dark:border-[#1E2E3E] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#D9E0E7] dark:border-[#1E2E3E]">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#071A2B] dark:bg-[#F2B705] text-white dark:text-[#071A2B] text-xs font-bold flex items-center justify-center">
                1
              </span>
              <h2 className="text-base font-heading font-bold text-[#071A2B] dark:text-white">
                Select Participant
              </h2>
            </div>
            <span className="text-xs text-[#667085] dark:text-[#94A3B8]">
              {users.length} registered participant{users.length === 1 ? '' : 's'} available
            </span>
          </div>

          <div ref={userSelectorRef} className="relative">
            {/* Search Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={userSearch}
                onFocus={() => setIsUserDropdownOpen(true)}
                onChange={(e) => {
                  setUserSearch(e.target.value);
                  setIsUserDropdownOpen(true);
                }}
                placeholder="Search participant by name, email, member ID, or phone..."
                className="w-full pl-9 pr-10 py-2.5 text-xs sm:text-sm rounded-xl border border-[#D9E0E7] dark:border-[#1E2E3E] bg-[#F5F7FA] dark:bg-[#07131E] text-[#071A2B] dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#00843D] transition-colors"
              />
              {userSearch && (
                <button
                  type="button"
                  onClick={() => setUserSearch('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Dropdown Menu */}
            {isUserDropdownOpen && (
              <div className="absolute z-30 mt-2 w-full max-h-72 overflow-y-auto rounded-xl border border-[#D9E0E7] dark:border-[#1E2E3E] bg-white dark:bg-[#0B1A28] shadow-xl divide-y divide-[#D9E0E7] dark:divide-[#1E2E3E]">
                {loadingUsers ? (
                  <div className="p-4 text-center text-xs text-[#667085] dark:text-[#94A3B8]">
                    Loading participants...
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="p-4 text-center text-xs text-[#667085] dark:text-[#94A3B8]">
                    No participants found matching &ldquo;{userSearch}&rdquo;
                  </div>
                ) : (
                  filteredUsers.map((u) => {
                    const isSelected = selectedUser?.id === u.id;
                    const memberNumber = u.memberId || u.member_number || `WD-${u.id?.slice(0, 5)?.toUpperCase()}`;
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => handleSelectUser(u)}
                        className={`w-full text-left px-4 py-3 flex items-center justify-between gap-3 text-xs hover:bg-[#F5F7FA] dark:hover:bg-[#07131E] transition-colors ${
                          isSelected ? 'bg-[#00843D]/5 dark:bg-[#00843D]/10 font-bold' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-[#071A2B] text-white flex items-center justify-center font-bold text-xs shrink-0">
                            {(u.fullName || u.name || 'P')[0]?.toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-heading text-sm text-[#071A2B] dark:text-white truncate">
                              {u.fullName || u.name || 'Participant'}
                            </div>
                            <div className="text-[11px] text-[#667085] dark:text-[#94A3B8] font-mono truncate">
                              {u.email} &bull; {memberNumber}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {(u.accountStatus || u.account_status || 'ACTIVE').replace(/_/g, ' ')}
                          </span>
                          {isSelected && (
                            <span className="text-[#00843D] dark:text-[#10B981] font-bold text-sm">
                              ✓
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Selected User Hero Banner */}
          {selectedUser ? (
            <div className="p-4 rounded-xl bg-[#F5F7FA] dark:bg-[#07131E] border border-[#D9E0E7] dark:border-[#1E2E3E] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-[#071A2B] text-[#F2B705] flex items-center justify-center font-heading font-extrabold text-lg shrink-0 shadow-2xs">
                  {(selectedUser.fullName || selectedUser.name || 'P')[0]?.toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#00843D] dark:text-[#10B981]">
                      Active Configuration Target
                    </span>
                    <span className="inline-flex px-2 py-0.2 rounded-full text-[10px] font-mono font-bold bg-[#00843D]/10 text-[#00843D] dark:text-[#10B981]">
                      {(selectedUser.accountStatus || selectedUser.account_status || 'ACTIVE').replace(/_/g, ' ')}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-heading font-bold text-[#071A2B] dark:text-white mt-0.5">
                    {selectedUser.fullName || selectedUser.name || 'Participant'}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#667085] dark:text-[#94A3B8] font-mono mt-0.5">
                    <span>Email: <strong className="text-[#071A2B] dark:text-gray-200">{selectedUser.email}</strong></span>
                    <span>&bull;</span>
                    <span>Member ID: <strong className="text-[#071A2B] dark:text-gray-200">{selectedUser.memberId || selectedUser.member_number || 'WD-HQ-001'}</strong></span>
                    {selectedUser.mobile && (
                      <>
                        <span>&bull;</span>
                        <span>Mobile: <strong className="text-[#071A2B] dark:text-gray-200">{selectedUser.mobile}</strong></span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => setIsUserDropdownOpen(true)}
                  className="px-3 py-1.5 text-xs font-semibold text-[#071A2B] dark:text-white bg-white dark:bg-[#0B1A28] border border-[#D9E0E7] dark:border-[#1E2E3E] rounded-xl hover:bg-slate-50 transition-colors shadow-2xs"
                >
                  Change Participant
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-brand-gold/40 text-center space-y-2">
              <p className="text-sm font-bold text-[#071A2B] dark:text-[#F2B705]">
                No Participant Selected
              </p>
              <p className="text-xs text-[#667085] dark:text-slate-300">
                Please search and select a participant above to configure their individual Cash and Vehicle claim requirements.
              </p>
            </div>
          )}
        </section>

        {/* ======================================================== */}
        {/* SECTION 3: REQUIREMENT CONFIGURATION TABS                 */}
        {/* ======================================================== */}
        {selectedUser && (
          <section className="bg-white dark:bg-[#0B1A28] border border-[#D9E0E7] dark:border-[#1E2E3E] rounded-2xl shadow-2xs overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-[#D9E0E7] dark:border-[#1E2E3E] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#071A2B] dark:bg-[#F2B705] text-white dark:text-[#071A2B] text-xs font-bold flex items-center justify-center">
                  2
                </span>
                <div>
                  <h2 className="text-base font-heading font-bold text-[#071A2B] dark:text-white">
                    Configure Requirements for {selectedUser.fullName || selectedUser.name || 'Participant'}
                  </h2>
                  <p className="text-xs text-[#667085] dark:text-[#94A3B8]">
                    Configure Cash and Vehicle requirements independently. These settings apply strictly to this user.
                  </p>
                </div>
              </div>

              {/* Requirement Tabs */}
              <div className="flex items-center bg-[#F5F7FA] dark:bg-[#07131E] p-1 rounded-xl border border-[#D9E0E7] dark:border-[#1E2E3E]">
                <button
                  type="button"
                  onClick={() => setActiveTab('cash')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                    activeTab === 'cash'
                      ? 'bg-white dark:bg-[#0B1A28] text-[#071A2B] dark:text-white shadow-2xs'
                      : 'text-[#667085] dark:text-[#94A3B8] hover:text-[#071A2B]'
                  }`}
                >
                  <span>Cash Requirement</span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      cashForm.status === 'ENABLED' ? 'bg-[#00843D]' : 'bg-slate-400'
                    }`}
                  ></span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('vehicle')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                    activeTab === 'vehicle'
                      ? 'bg-white dark:bg-[#0B1A28] text-[#071A2B] dark:text-white shadow-2xs'
                      : 'text-[#667085] dark:text-[#94A3B8] hover:text-[#071A2B]'
                  }`}
                >
                  <span>Vehicle Requirement</span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      vehicleForm.status === 'ENABLED' ? 'bg-[#00843D]' : 'bg-slate-400'
                    }`}
                  ></span>
                </button>
              </div>
            </div>

            {loadingRequirements ? (
              <div className="p-12 text-center text-[#667085] dark:text-[#94A3B8]">
                <p className="font-mono text-sm">Loading user requirements from Supabase...</p>
              </div>
            ) : activeTab === 'cash' ? (
              /* CASH REQUIREMENT FORM */
              <form onSubmit={handleSaveCash} className="p-5 sm:p-7 space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-[#D9E0E7] dark:border-[#1E2E3E]">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#00843D] dark:text-[#10B981]">
                      Target: Cash Claims
                    </span>
                    <h3 className="text-lg font-heading font-bold text-[#071A2B] dark:text-white">
                      Cash Prize Claim Requirement
                    </h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[#667085] dark:text-[#94A3B8]">Status:</span>
                    <button
                      type="button"
                      onClick={() => handleToggleStatusClick('cash')}
                      className={`px-3 py-1 rounded-full text-xs font-mono font-bold transition-all border ${
                        cashForm.status === 'ENABLED'
                          ? 'bg-[#00843D]/10 text-[#00843D] border-[#00843D]/30 hover:bg-[#00843D]/20'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {cashForm.status} (Click to toggle)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Requirement Title */}
                  <div>
                    <label className="block text-xs font-bold text-[#071A2B] dark:text-gray-200 mb-1.5">
                      Requirement Title
                    </label>
                    <input
                      type="text"
                      value={cashForm.title}
                      onChange={(e) => {
                        setCashForm((prev) => ({ ...prev, title: e.target.value }));
                        setIsCashDirty(true);
                      }}
                      placeholder="e.g. Cash Prize Settlement"
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#D9E0E7] dark:border-[#1E2E3E] bg-[#F5F7FA] dark:bg-[#07131E] text-[#071A2B] dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#00843D]"
                    />
                  </div>

                  {/* Applicable Charge & Currency */}
                  <div>
                    <label className="block text-xs font-bold text-[#071A2B] dark:text-gray-200 mb-1.5">
                      Applicable Charge (ZAR)
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none font-mono font-bold text-xs text-slate-500">
                        R
                      </span>
                      <input
                        type="text"
                        value={cashForm.applicableCharge}
                        onChange={(e) => {
                          setCashForm((prev) => ({ ...prev, applicableCharge: e.target.value }));
                          setIsCashDirty(true);
                        }}
                        placeholder="0.00"
                        className="w-full pl-8 pr-16 py-2 text-xs sm:text-sm font-mono rounded-xl border border-[#D9E0E7] dark:border-[#1E2E3E] bg-[#F5F7FA] dark:bg-[#07131E] text-[#071A2B] dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#00843D]"
                      />
                      <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none font-mono text-xs text-slate-400">
                        ZAR
                      </span>
                    </div>
                    {cashErrors.applicableCharge && (
                      <p className="text-rose-600 text-[11px] mt-1 font-medium">{cashErrors.applicableCharge}</p>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-[#071A2B] dark:text-gray-200 mb-1.5">
                    Requirement Description & Basis
                  </label>
                  <textarea
                    rows={4}
                    value={cashForm.description}
                    onChange={(e) => {
                      setCashForm((prev) => ({ ...prev, description: e.target.value }));
                      setIsCashDirty(true);
                    }}
                    placeholder="Provide clear administrative and fiduciary explanation for this user's cash claim requirement..."
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#D9E0E7] dark:border-[#1E2E3E] bg-[#F5F7FA] dark:bg-[#07131E] text-[#071A2B] dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#00843D] leading-relaxed"
                  />
                  {cashErrors.description && (
                    <p className="text-rose-600 text-[11px] mt-1 font-medium">{cashErrors.description}</p>
                  )}
                  <p className="text-[11px] text-[#667085] dark:text-[#94A3B8] mt-1">
                    This message will be presented to {selectedUser.fullName || 'the participant'} after their cash claim is approved.
                  </p>
                </div>

                {/* Footer Controls */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#D9E0E7] dark:border-[#1E2E3E]">
                  <div className="text-xs text-[#667085] dark:text-[#94A3B8] font-mono">
                    {cashForm.updatedAt ? `Last saved: ${cashForm.updatedAt}` : 'No previous saved record for this user'}
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    {isCashDirty && (
                      <button
                        type="button"
                        onClick={handleResetCurrentTab}
                        className="px-4 py-2 text-xs font-semibold text-[#667085] dark:text-[#94A3B8] hover:text-[#071A2B] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors border border-[#D9E0E7] dark:border-[#1E2E3E]"
                      >
                        Reset Changes
                      </button>
                    )}
                    <button
                      type="submit"
                      className="px-5 py-2 text-xs font-bold text-white bg-[#00843D] hover:bg-[#00843D]/90 rounded-xl shadow-2xs transition-colors"
                    >
                      Save Cash Requirement for {selectedUser.fullName?.split(' ')[0] || 'User'}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              /* VEHICLE REQUIREMENT FORM */
              <form onSubmit={handleSaveVehicle} className="p-5 sm:p-7 space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-[#D9E0E7] dark:border-[#1E2E3E]">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#00843D] dark:text-[#10B981]">
                      Target: Vehicle Claims
                    </span>
                    <h3 className="text-lg font-heading font-bold text-[#071A2B] dark:text-white">
                      Vehicle Prize Claim Requirement
                    </h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[#667085] dark:text-[#94A3B8]">Status:</span>
                    <button
                      type="button"
                      onClick={() => handleToggleStatusClick('vehicle')}
                      className={`px-3 py-1 rounded-full text-xs font-mono font-bold transition-all border ${
                        vehicleForm.status === 'ENABLED'
                          ? 'bg-[#00843D]/10 text-[#00843D] border-[#00843D]/30 hover:bg-[#00843D]/20'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {vehicleForm.status} (Click to toggle)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Requirement Title */}
                  <div>
                    <label className="block text-xs font-bold text-[#071A2B] dark:text-gray-200 mb-1.5">
                      Requirement Title
                    </label>
                    <input
                      type="text"
                      value={vehicleForm.title}
                      onChange={(e) => {
                        setVehicleForm((prev) => ({ ...prev, title: e.target.value }));
                        setIsVehicleDirty(true);
                      }}
                      placeholder="e.g. 2026 Toyota Hilux Logistics Delivery"
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#D9E0E7] dark:border-[#1E2E3E] bg-[#F5F7FA] dark:bg-[#07131E] text-[#071A2B] dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#00843D]"
                    />
                  </div>

                  {/* Applicable Charge & Currency */}
                  <div>
                    <label className="block text-xs font-bold text-[#071A2B] dark:text-gray-200 mb-1.5">
                      Applicable Charge (ZAR)
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none font-mono font-bold text-xs text-slate-500">
                        R
                      </span>
                      <input
                        type="text"
                        value={vehicleForm.applicableCharge}
                        onChange={(e) => {
                          setVehicleForm((prev) => ({ ...prev, applicableCharge: e.target.value }));
                          setIsVehicleDirty(true);
                        }}
                        placeholder="0.00"
                        className="w-full pl-8 pr-16 py-2 text-xs sm:text-sm font-mono rounded-xl border border-[#D9E0E7] dark:border-[#1E2E3E] bg-[#F5F7FA] dark:bg-[#07131E] text-[#071A2B] dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#00843D]"
                      />
                      <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none font-mono text-xs text-slate-400">
                        ZAR
                      </span>
                    </div>
                    {vehicleErrors.applicableCharge && (
                      <p className="text-rose-600 text-[11px] mt-1 font-medium">{vehicleErrors.applicableCharge}</p>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-[#071A2B] dark:text-gray-200 mb-1.5">
                    Requirement Description & Basis
                  </label>
                  <textarea
                    rows={4}
                    value={vehicleForm.description}
                    onChange={(e) => {
                      setVehicleForm((prev) => ({ ...prev, description: e.target.value }));
                      setIsVehicleDirty(true);
                    }}
                    placeholder="Provide clear administrative, carrier transport, and handover explanation for this user's vehicle claim..."
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#D9E0E7] dark:border-[#1E2E3E] bg-[#F5F7FA] dark:bg-[#07131E] text-[#071A2B] dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#00843D] leading-relaxed"
                  />
                  {vehicleErrors.description && (
                    <p className="text-rose-600 text-[11px] mt-1 font-medium">{vehicleErrors.description}</p>
                  )}
                  <p className="text-[11px] text-[#667085] dark:text-[#94A3B8] mt-1">
                    This message will be presented to {selectedUser.fullName || 'the participant'} after their vehicle claim is approved.
                  </p>
                </div>

                {/* Footer Controls */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#D9E0E7] dark:border-[#1E2E3E]">
                  <div className="text-xs text-[#667085] dark:text-[#94A3B8] font-mono">
                    {vehicleForm.updatedAt ? `Last saved: ${vehicleForm.updatedAt}` : 'No previous saved record for this user'}
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    {isVehicleDirty && (
                      <button
                        type="button"
                        onClick={handleResetCurrentTab}
                        className="px-4 py-2 text-xs font-semibold text-[#667085] dark:text-[#94A3B8] hover:text-[#071A2B] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors border border-[#D9E0E7] dark:border-[#1E2E3E]"
                      >
                        Reset Changes
                      </button>
                    )}
                    <button
                      type="submit"
                      className="px-5 py-2 text-xs font-bold text-white bg-[#00843D] hover:bg-[#00843D]/90 rounded-xl shadow-2xs transition-colors"
                    >
                      Save Vehicle Requirement for {selectedUser.fullName?.split(' ')[0] || 'User'}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </section>
        )}

        {/* ======================================================== */}
        {/* SECTION 4: LIVE CLAIMANT PREVIEW                         */}
        {/* ======================================================== */}
        {selectedUser && (
          <section className="bg-white dark:bg-[#0B1A28] border border-[#D9E0E7] dark:border-[#1E2E3E] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#D9E0E7] dark:border-[#1E2E3E]">
              <div>
                <h3 className="text-sm font-heading font-bold text-[#071A2B] dark:text-white flex items-center gap-2">
                  <span>Claimant UI Preview: {selectedUser.fullName || 'Participant'}</span>
                </h3>
                <p className="text-xs text-[#667085] dark:text-[#94A3B8]">
                  Live simulated preview of the requirement banner rendered in this participant&apos;s dashboard upon claim approval.
                </p>
              </div>

              {/* Preview Toggle Tabs */}
              <div className="flex items-center bg-[#F5F7FA] dark:bg-[#07131E] p-1 rounded-xl border border-[#D9E0E7] dark:border-[#1E2E3E]">
                <button
                  type="button"
                  onClick={() => setPreviewTab('cash')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    previewTab === 'cash'
                      ? 'bg-white dark:bg-[#0B1A28] text-[#071A2B] dark:text-white shadow-2xs'
                      : 'text-[#667085] dark:text-[#94A3B8]'
                  }`}
                >
                  Cash Preview
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('vehicle')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    previewTab === 'vehicle'
                      ? 'bg-white dark:bg-[#0B1A28] text-[#071A2B] dark:text-white shadow-2xs'
                      : 'text-[#667085] dark:text-[#94A3B8]'
                  }`}
                >
                  Vehicle Preview
                </button>
              </div>
            </div>

            {/* Simulated Claimant Card */}
            <div>
              {activePreviewData.isEnabled ? (
                <div className="p-4 sm:p-5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-brand-gold/60 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-heading font-bold text-[#071A2B] dark:text-[#F2B705] uppercase tracking-wider text-[11px]">
                      APPLICABLE REQUIREMENT &bull; {activePreviewData.categoryName.toUpperCase()}
                    </span>
                    <span className="font-mono font-bold text-sm text-[#071A2B] dark:text-white">
                      {activePreviewData.chargeDisplay} ZAR
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    {activePreviewData.description}
                  </p>

                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-brand-gold/30 text-[11px]">
                    <span className="text-slate-600 dark:text-slate-400">
                      Contact WinDriveSA support for settlement & delivery coordination:
                    </span>
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold text-[#00843D] dark:text-[#F2B705] hover:underline"
                    >
                      Contact WinDriveSA Support ({whatsappNumber}) →
                    </a>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-xl bg-[#F5F7FA] dark:bg-[#07131E] border border-[#D9E0E7] dark:border-[#1E2E3E] text-center space-y-1">
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    Requirement Disabled for this category
                  </p>
                  <p className="text-[11px] text-[#667085] dark:text-[#94A3B8]">
                    No applicable requirement section will be rendered to {selectedUser.fullName || 'this participant'}.
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ======================================================== */}
        {/* SECTION 5: INSTITUTIONAL SUPPORT CONTACT CONFIGURATION    */}
        {/* ======================================================== */}
        <section className="bg-white dark:bg-[#0B1A28] border border-[#D9E0E7] dark:border-[#1E2E3E] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#D9E0E7] dark:border-[#1E2E3E]">
            <span className="w-6 h-6 rounded-full bg-[#071A2B] dark:bg-[#F2B705] text-white dark:text-[#071A2B] text-xs font-bold flex items-center justify-center">
              3
            </span>
            <div>
              <h2 className="text-base font-heading font-bold text-[#071A2B] dark:text-white">
                Institutional Support Contact
              </h2>
              <p className="text-xs text-[#667085] dark:text-[#94A3B8]">
                Centralized official WhatsApp line provided to claimants inquiring about requirements.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveSupportNumber} className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="w-full sm:max-w-xs">
              <input
                type="text"
                value={whatsappNumber}
                onChange={(e) => {
                  setWhatsappNumber(e.target.value);
                  setIsSupportDirty(true);
                }}
                placeholder="+27 82 555 0194"
                className="w-full px-3 py-2 text-xs sm:text-sm font-mono rounded-xl border border-[#D9E0E7] dark:border-[#1E2E3E] bg-[#F5F7FA] dark:bg-[#07131E] text-[#071A2B] dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#00843D]"
              />
              {supportError && (
                <p className="text-rose-600 text-[11px] mt-1 font-medium">{supportError}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={!isSupportDirty}
              className={`px-4 py-2 text-xs font-bold rounded-xl shadow-2xs transition-colors ${
                isSupportDirty
                  ? 'bg-[#071A2B] dark:bg-[#F2B705] text-white dark:text-[#071A2B] hover:opacity-90'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
              }`}
            >
              Update Support Contact
            </button>
          </form>
        </section>
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: DISABLE CONFIRMATION MODAL                      */}
      {/* ======================================================== */}
      {disableModalTarget && (
        <div className="fixed inset-0 z-50 bg-[#071A2B]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0B1A28] border border-[#D9E0E7] dark:border-[#1E2E3E] rounded-2xl max-w-md w-full shadow-2xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 font-bold text-lg">
                !
              </div>
              <div>
                <h3 className="text-base font-heading font-bold text-[#071A2B] dark:text-white">
                  Disable Requirement for {selectedUser?.fullName || 'User'}?
                </h3>
                <p className="text-xs text-[#667085] dark:text-[#94A3B8] mt-1 leading-relaxed">
                  This will stop this requirement from being presented to this participant when their{' '}
                  <strong className="text-[#071A2B] dark:text-white">
                    {disableModalTarget === 'cash' ? 'Cash Prize Claim' : 'Vehicle Prize Claim'}
                  </strong>{' '}
                  reaches approval.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#D9E0E7] dark:border-[#1E2E3E]">
              <button
                type="button"
                onClick={() => setDisableModalTarget(null)}
                className="px-4 py-2 text-xs font-semibold text-[#667085] dark:text-[#94A3B8] hover:text-[#071A2B] dark:hover:text-white rounded-xl border border-[#D9E0E7] dark:border-[#1E2E3E] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDisable}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-2xs transition-colors"
              >
                Disable Requirement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: UNSAVED CHANGES MODAL                           */}
      {/* ======================================================== */}
      {unsavedModalTarget && (
        <div className="fixed inset-0 z-50 bg-[#071A2B]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0B1A28] border border-[#D9E0E7] dark:border-[#1E2E3E] rounded-2xl max-w-md w-full shadow-2xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 font-bold text-lg">
                ?
              </div>
              <div>
                <h3 className="text-base font-heading font-bold text-[#071A2B] dark:text-white">
                  Unsaved Changes Detected
                </h3>
                <p className="text-xs text-[#667085] dark:text-[#94A3B8] mt-1 leading-relaxed">
                  You have unsaved requirement changes for {selectedUser?.fullName || 'the current participant'}. Are you sure you want to switch participants without saving?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#D9E0E7] dark:border-[#1E2E3E]">
              <button
                type="button"
                onClick={() => setUnsavedModalTarget(null)}
                className="px-4 py-2 text-xs font-semibold text-[#667085] dark:text-[#94A3B8] hover:text-[#071A2B] dark:hover:text-white rounded-xl border border-[#D9E0E7] dark:border-[#1E2E3E] transition-colors"
              >
                Stay & Save
              </button>
              <button
                type="button"
                onClick={handleConfirmLeave}
                className="px-4 py-2 text-xs font-bold text-white bg-[#071A2B] dark:bg-[#F2B705] dark:text-[#071A2B] rounded-xl shadow-2xs transition-colors"
              >
                Discard & Switch
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
