import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminShell from '../../components/admin/AdminShell';
import {
  getAllVehiclePrizes,
  getVehiclePrizeMetrics,
  createVehiclePrize,
  updateVehiclePrize,
  activateVehiclePrize,
  deactivateVehiclePrize,
  isValidVehicleYear,
  DEFAULT_VEHICLE_MAKE,
  DEFAULT_VEHICLE_MODEL,
  DEFAULT_VEHICLE_YEAR,
} from '../../services/rewards';
import { resolveVehicleImage, WHITE_HILUX_SPECIMENS } from '../../services/vehicleImages';
import { listUsers } from '../../services/users';

export default function AdminVehiclePrizes() {
  const navigate = useNavigate();

  // Primary Data State
  const [vehiclePrizes, setVehiclePrizes] = useState([]);
  const [metrics, setMetrics] = useState({
    totalAllocated: 0,
    totalCount: 0,
    activePool: 0,
    processingPool: 0,
    fulfilledPool: 0,
  });
  const [users, setUsers] = useState([]);

  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [prizeStatusFilter, setPrizeStatusFilter] = useState('ALL');
  const [accountStatusFilter, setAccountStatusFilter] = useState('ALL');
  const [claimStatusFilter, setClaimStatusFilter] = useState('ALL');

  // Modals State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    userId: '',
    vehicleMake: DEFAULT_VEHICLE_MAKE,
    vehicleModel: DEFAULT_VEHICLE_MODEL,
    vehicleYear: DEFAULT_VEHICLE_YEAR,
    vehicleImage: '',
    status: 'ASSIGNED',
  });
  const [createError, setCreateError] = useState('');

  // Edit Modal State
  const [editingPrize, setEditingPrize] = useState(null);
  const [editFormData, setEditFormData] = useState({
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: DEFAULT_VEHICLE_YEAR,
    vehicleImage: '',
  });
  const [editError, setEditError] = useState('');

  // Confirmation Modals State
  const [prizeToActivate, setPrizeToActivate] = useState(null);
  const [prizeToDeactivate, setPrizeToDeactivate] = useState(null);
  const [modalFeedback, setModalFeedback] = useState('');

  // Dossier Drawer / Detail Modal State
  const [detailPrize, setDetailPrize] = useState(null);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState('');

  // Load and synchronize data from service layer
  const loadData = async () => {
    try {
      const [prizesRes, usersRes] = await Promise.all([
        getAllVehiclePrizes(),
        listUsers(),
      ]);
      const data = prizesRes?.data || [];
      const currentUsers = usersRes?.data || [];
      setVehiclePrizes(data);
      setUsers(currentUsers);
      setMetrics(getVehiclePrizeMetrics(data));
    } catch (err) {
      console.error('Failed to load vehicle prizes:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 4000);
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setPrizeStatusFilter('ALL');
    setAccountStatusFilter('ALL');
    setClaimStatusFilter('ALL');
    showToast('Filters cleared');
  };

  // Filter calculation
  const filteredPrizes = vehiclePrizes.filter((item) => {
    // 1. Search Query (Full Name, Email Address, Vehicle Prize ID, Vehicle Make, Vehicle Model, User ID)
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      const matchName = item.user?.toLowerCase().includes(q);
      const matchEmail = item.email?.toLowerCase().includes(q);
      const matchPrizeId = item.id?.toLowerCase().includes(q);
      const matchUserId = item.userId?.toLowerCase().includes(q);
      const matchMake = item.vehicleMake?.toLowerCase().includes(q);
      const matchModel = item.vehicleModel?.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchPrizeId && !matchUserId && !matchMake && !matchModel) {
        return false;
      }
    }

    // 2. Vehicle Prize Status Filter
    if (prizeStatusFilter !== 'ALL') {
      if (item.status !== prizeStatusFilter) {
        return false;
      }
    }

    // 3. Account Status Filter
    if (accountStatusFilter !== 'ALL') {
      if (item.accountStatus !== accountStatusFilter) {
        return false;
      }
    }

    // 4. Claim Status Filter
    if (claimStatusFilter !== 'ALL') {
      if (claimStatusFilter === 'No claim submitted') {
        const c = item.claimStatus;
        if (c && c !== 'No claim submitted' && c !== 'NOT CLAIMED' && c !== 'None') {
          return false;
        }
      } else if (item.claimStatus !== claimStatusFilter) {
        return false;
      }
    }

    return true;
  });

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setCreateError('');
    const eligible = users.filter((u) => u.status === 'APPROVED' || u.status === 'ACTIVE');
    const defaultUser = eligible.length > 0 ? eligible[0].id : (users[0]?.id || '');
    setCreateFormData({
      userId: defaultUser,
      vehicleMake: DEFAULT_VEHICLE_MAKE,
      vehicleModel: DEFAULT_VEHICLE_MODEL,
      vehicleYear: DEFAULT_VEHICLE_YEAR,
      vehicleImage: '',
      status: 'ASSIGNED',
    });
    setIsCreateModalOpen(true);
  };

  // Submit Create Vehicle Prize
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateError('');

    if (!createFormData.userId) {
      setCreateError('Please select a recipient participant account.');
      return;
    }

    const selectedUser = users.find((u) => u.id === createFormData.userId);
    if (selectedUser && selectedUser.status === 'PENDING REVIEW' && createFormData.status === 'ACTIVE') {
      setCreateError('User approval required before activating a vehicle prize.');
      return;
    }

    if (!createFormData.vehicleMake.trim()) {
      setCreateError('Vehicle Make is required.');
      return;
    }
    if (!createFormData.vehicleModel.trim()) {
      setCreateError('Vehicle Model is required.');
      return;
    }

    const yearNum = Number(createFormData.vehicleYear);
    if (!isValidVehicleYear(yearNum)) {
      setCreateError('Vehicle Year must be a reasonable four-digit year (1990 - 2035).');
      return;
    }

    const res = await createVehiclePrize({
      userId: createFormData.userId,
      vehicleMake: createFormData.vehicleMake.trim(),
      vehicleModel: createFormData.vehicleModel.trim(),
      vehicleYear: yearNum,
      vehicleImage: createFormData.vehicleImage.trim() || null,
      status: createFormData.status || 'ASSIGNED',
    });

    if (res.success) {
      await loadData();
      setIsCreateModalOpen(false);
      showToast(`Vehicle prize (${yearNum} ${createFormData.vehicleMake} ${createFormData.vehicleModel}) assigned to ${res.vehiclePrize.user}`);
    } else {
      setCreateError(res.error || 'Failed to assign vehicle prize.');
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (prize) => {
    setEditingPrize(prize);
    setEditFormData({
      vehicleMake: prize.vehicleMake || DEFAULT_VEHICLE_MAKE,
      vehicleModel: prize.vehicleModel || DEFAULT_VEHICLE_MODEL,
      vehicleYear: prize.vehicleYear || DEFAULT_VEHICLE_YEAR,
      vehicleImage: prize.vehicleImage || '',
    });
    setEditError('');
  };

  // Submit Edit Vehicle Prize
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditError('');

    if (!editingPrize) return;

    if (!editFormData.vehicleMake.trim()) {
      setEditError('Vehicle Make is required.');
      return;
    }
    if (!editFormData.vehicleModel.trim()) {
      setEditError('Vehicle Model is required.');
      return;
    }

    const yearNum = Number(editFormData.vehicleYear);
    if (!isValidVehicleYear(yearNum)) {
      setEditError('Vehicle Year must be a reasonable four-digit year (1990 - 2035).');
      return;
    }

    const res = await updateVehiclePrize(editingPrize.id, {
      vehicleMake: editFormData.vehicleMake.trim(),
      vehicleModel: editFormData.vehicleModel.trim(),
      vehicleYear: yearNum,
      vehicleImage: editFormData.vehicleImage.trim() || null,
    });

    if (res.success) {
      await loadData();
      setEditingPrize(null);
      if (detailPrize && detailPrize.id === editingPrize.id) {
        setDetailPrize(res.vehiclePrize);
      }
      showToast(`Vehicle prize updated: ${yearNum} ${editFormData.vehicleMake} ${editFormData.vehicleModel} for ${res.vehiclePrize.user}`);
    } else {
      setEditError(res.error || 'Failed to update vehicle prize.');
    }
  };

  // Trigger Activate
  const handleTriggerActivate = (prize) => {
    setModalFeedback('');
    setPrizeToActivate(prize);
  };

  const handleConfirmActivate = async () => {
    if (!prizeToActivate) return;
    setModalFeedback('');

    const res = await activateVehiclePrize(prizeToActivate.id);
    if (res.success) {
      await loadData();
      setPrizeToActivate(null);
      if (detailPrize && detailPrize.id === prizeToActivate.id) {
        setDetailPrize(res.vehiclePrize);
      }
      showToast(`Vehicle prize activated for ${res.vehiclePrize.user}`);
    } else {
      setModalFeedback(res.error || 'Failed to activate vehicle prize.');
    }
  };

  // Trigger Deactivate
  const handleTriggerDeactivate = (prize) => {
    setModalFeedback('');
    setPrizeToDeactivate(prize);
  };

  const handleConfirmDeactivate = async () => {
    if (!prizeToDeactivate) return;
    setModalFeedback('');

    const res = await deactivateVehiclePrize(prizeToDeactivate.id);
    if (res.success) {
      await loadData();
      setPrizeToDeactivate(null);
      if (detailPrize && detailPrize.id === prizeToDeactivate.id) {
        setDetailPrize(res.vehiclePrize);
      }
      showToast(`Vehicle prize deactivated for ${res.vehiclePrize.user}`);
    } else {
      setModalFeedback(res.error || 'Failed to deactivate vehicle prize.');
    }
  };

  // Prize Status Badge
  const getPrizeStatusBadge = (status) => {
    const s = status?.toUpperCase();
    if (s === 'ACTIVE') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold font-sora">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          ACTIVE
        </span>
      );
    }
    if (s === 'ASSIGNED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[11px] font-bold font-sora">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          ASSIGNED
        </span>
      );
    }
    if (s === 'COMPLETED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800 text-[11px] font-bold font-sora">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
          COMPLETED
        </span>
      );
    }
    if (s === 'DEACTIVATED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-[11px] font-bold font-sora">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
          DEACTIVATED
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 text-[11px] font-bold font-sora">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
        NOT ASSIGNED
      </span>
    );
  };

  // Account Status Badge
  const getAccountStatusBadge = (status) => {
    const s = status?.toUpperCase();
    if (s === 'ACTIVE' || s === 'APPROVED') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold font-sora bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300">
          {s}
        </span>
      );
    }
    if (s === 'PENDING REVIEW') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold font-sora bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300">
          PENDING REVIEW
        </span>
      );
    }
    if (s === 'REJECTED') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold font-sora bg-rose-100 dark:bg-rose-900/50 text-rose-800 dark:text-rose-300">
          REJECTED
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold font-sora bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400">
        {s || 'INACTIVE'}
      </span>
    );
  };

  // Claim Status Pill
  const getClaimStatusPill = (status) => {
    if (!status || status === 'No claim submitted' || status === 'NOT CLAIMED' || status === 'None' || status === 'NOT STARTED') {
      return (
        <span className="text-[11px] text-[#667085] dark:text-slate-400 font-medium">
          No claim submitted
        </span>
      );
    }

    const s = status.toUpperCase();
    let colorClass = 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';

    if (s === 'CLAIM AVAILABLE') {
      colorClass = 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
    } else if (s === 'UNDER REVIEW' || s === 'SUBMITTED' || s === 'PROCESSING') {
      colorClass = 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
    } else if (s === 'APPROVED') {
      colorClass = 'bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800';
    } else if (s === 'REQUIREMENT PENDING') {
      colorClass = 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800';
    } else if (s === 'FULFILLED') {
      colorClass = 'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800';
    }

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${colorClass}`}>
        {status}
      </span>
    );
  };

  const eligibleUsersForCreate = users.filter((u) => u.status === 'APPROVED' || u.status === 'ACTIVE');

  return (
    <AdminShell
      activeKey="vehicle-prizes"
      breadcrumb="HQ Admin Console / Operations / Vehicle Prizes"
      toastState={toastMessage}
      onCloseToast={() => setToastMessage('')}
    >
      <div className="space-y-6">
        {/* 1. Header & Primary Action */}
        <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#D9E0E7] dark:border-[#1B3754]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-[#F2B705] bg-amber-100 dark:bg-[#0e273f] px-2.5 py-0.5 rounded font-sora border border-amber-300 dark:border-[#1d4168]">
                VEHICLE PRIZE MANAGEMENT • FLEET ALLOCATION ENGINE
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-sora text-[#071A2B] dark:text-white tracking-tight">
              Vehicle Prizes
            </h1>
            <p className="text-xs sm:text-sm text-[#667085] dark:text-slate-300 max-w-2xl leading-relaxed">
              Create, assign, and manage vehicle prizes associated with approved user accounts.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => navigate('/admin/vehicle-prizes/create')}
              className="px-4 py-2.5 rounded-lg bg-[#F2B705] hover:bg-[#d9a404] text-[#071A2B] font-bold text-xs sm:text-sm font-sora flex items-center gap-2 transition-all shadow-sm cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              <span>Create Vehicle Prize</span>
            </button>
          </div>
        </section>

        {/* 2. Operational Metrics Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Metric 1 */}
          <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#0B253F] border border-[#D9E0E7] dark:border-[#1B3754] shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#667085] dark:text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider font-sora">
                TOTAL FLEET ALLOCATED
              </span>
              <svg className="w-5 h-5 text-[#071A2B] dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 17a2 2 0 100-4 2 2 0 000 4zm10 0a2 2 0 100-4 2 2 0 000 4zM4 11h16M4 11V7a1 1 0 011-1h10l4 5v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-7z" />
              </svg>
            </div>
            <div className="my-2.5">
              <div className="text-2xl sm:text-3xl font-bold font-sora text-[#071A2B] dark:text-white tracking-tight">
                {metrics.totalAllocated}
              </div>
              <span className="text-[10px] text-[#667085] dark:text-slate-400 uppercase font-semibold">
                VEHICLES CONFIGURED
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#667085] dark:text-slate-300">
              <span className="inline-block w-2 h-2 rounded-full bg-[#F2B705]"></span>
              <span>{metrics.totalCount} cataloged participants</span>
            </div>
          </div>

          {/* Metric 2 */}
          <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#0B253F] border border-[#D9E0E7] dark:border-[#1B3754] shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#667085] dark:text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider font-sora">ACTIVE POOL</span>
              <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="my-2.5">
              <div className="text-2xl sm:text-3xl font-bold font-sora text-emerald-700 dark:text-emerald-400 tracking-tight">
                {metrics.activePool}
              </div>
              <span className="text-[10px] text-[#667085] dark:text-slate-400 uppercase font-semibold">
                ACTIVE VEHICLE ALLOCATIONS
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#667085] dark:text-slate-300">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Available to approved participants</span>
            </div>
          </div>

          {/* Metric 3 */}
          <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#0B253F] border border-[#D9E0E7] dark:border-[#1B3754] shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#667085] dark:text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider font-sora">
                UNDER REVIEW / PROCESSING
              </span>
              <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="my-2.5">
              <div className="text-2xl sm:text-3xl font-bold font-sora text-[#071A2B] dark:text-white tracking-tight">
                {metrics.processingPool}
              </div>
              <span className="text-[10px] text-[#667085] dark:text-slate-400 uppercase font-semibold">
                VERIFICATION & LOGISTICS GATE
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#667085] dark:text-slate-300">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-500"></span>
              <span>Vehicle claims in verification audit</span>
            </div>
          </div>

          {/* Metric 4 */}
          <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#0B253F] border border-[#D9E0E7] dark:border-[#1B3754] shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#667085] dark:text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider font-sora">
                FULFILLED / DELIVERED
              </span>
              <svg className="w-5 h-5 text-slate-600 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="my-2.5">
              <div className="text-2xl sm:text-3xl font-bold font-sora text-[#071A2B] dark:text-white tracking-tight">
                {metrics.fulfilledPool}
              </div>
              <span className="text-[10px] text-[#667085] dark:text-slate-400 uppercase font-semibold">
                SETTLED DISBURSEMENTS
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#667085] dark:text-slate-300">
              <span className="inline-block w-2 h-2 rounded-full bg-slate-400"></span>
              <span>Completed vehicle settlements</span>
            </div>
          </div>
        </section>

        {/* 3. Search & Filter Bar */}
        <section className="p-4 rounded-xl bg-white dark:bg-[#0B253F] border border-[#D9E0E7] dark:border-[#1B3754] shadow-sm space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="relative">
              <label htmlFor="filter-search-input" className="sr-only">Search Vehicle Prizes</label>
              <input
                id="filter-search-input"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by participant, email, ID, make, model..."
                className="w-full h-10 pl-9 pr-3 rounded-lg border border-[#D9E0E7] dark:border-[#1B3754] bg-[#F5F7FA] dark:bg-[#071A2B] text-xs text-[#071A2B] dark:text-white placeholder-[#667085] dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
              />
              <svg className="w-4 h-4 text-[#667085] dark:text-slate-400 absolute left-3 top-3 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Prize Status Filter */}
            <div>
              <label htmlFor="filter-prize-status" className="sr-only">Vehicle Prize Status</label>
              <select
                id="filter-prize-status"
                value={prizeStatusFilter}
                onChange={(e) => setPrizeStatusFilter(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[#D9E0E7] dark:border-[#1B3754] bg-[#F5F7FA] dark:bg-[#071A2B] text-xs text-[#071A2B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
              >
                <option value="ALL">All Prize Statuses</option>
                <option value="NOT ASSIGNED">Not Assigned</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
                <option value="DEACTIVATED">Deactivated</option>
              </select>
            </div>

            {/* Account Status Filter */}
            <div>
              <label htmlFor="filter-account-status" className="sr-only">Account Status</label>
              <select
                id="filter-account-status"
                value={accountStatusFilter}
                onChange={(e) => setAccountStatusFilter(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[#D9E0E7] dark:border-[#1B3754] bg-[#F5F7FA] dark:bg-[#071A2B] text-xs text-[#071A2B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
              >
                <option value="ALL">All Account Statuses</option>
                <option value="PENDING REVIEW">Pending Review</option>
                <option value="APPROVED">Approved</option>
                <option value="ACTIVE">Active</option>
                <option value="REJECTED">Rejected</option>
                <option value="DEACTIVATED">Deactivated</option>
              </select>
            </div>

            {/* Claim Status Filter */}
            <div>
              <label htmlFor="filter-claim-status" className="sr-only">Claim Status</label>
              <select
                id="filter-claim-status"
                value={claimStatusFilter}
                onChange={(e) => setClaimStatusFilter(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[#D9E0E7] dark:border-[#1B3754] bg-[#F5F7FA] dark:bg-[#071A2B] text-xs text-[#071A2B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
              >
                <option value="ALL">All Claim Statuses</option>
                <option value="CLAIM AVAILABLE">Claim Available</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="UNDER REVIEW">Under Review</option>
                <option value="APPROVED">Approved</option>
                <option value="REQUIREMENT PENDING">Requirement Pending</option>
                <option value="PROCESSING">Processing</option>
                <option value="FULFILLED">Fulfilled</option>
                <option value="No claim submitted">No claim submitted</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-[#D9E0E7] dark:border-[#1B3754] text-xs text-[#667085] dark:text-slate-400">
            <div>
              Showing <span className="font-bold text-[#071A2B] dark:text-white">{filteredPrizes.length}</span> of {vehiclePrizes.length} vehicle prize records
            </div>

            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs text-[#667085] dark:text-slate-300 hover:text-[#071A2B] dark:hover:text-white font-semibold flex items-center gap-1 transition-colors cursor-pointer self-start sm:self-auto"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Clear Filters</span>
            </button>
          </div>
        </section>

        {/* 4. Desktop Data Table (>= 768px) */}
        <div className="hidden md:block bg-white dark:bg-[#0B253F] rounded-xl border border-[#D9E0E7] dark:border-[#1B3754] shadow-sm overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[860px]">
              <thead>
                <tr className="bg-[#F5F7FA] dark:bg-[#071A2B] border-b border-[#D9E0E7] dark:border-[#1B3754] text-[#667085] dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider font-sora">
                  <th className="py-3 px-5">User</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Vehicle</th>
                  <th className="py-3 px-3 text-center">Prize Status</th>
                  <th className="py-3 px-3 text-center">Account Status</th>
                  <th className="py-3 px-3 text-center">Claim Status</th>
                  <th className="py-3 px-3">Assigned</th>
                  <th className="py-3 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9E0E7] dark:divide-[#1B3754] text-xs text-[#071A2B] dark:text-white">
                {filteredPrizes.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-[#132A42]/50 transition-colors">
                    {/* User */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#071A2B] text-[#F2B705] dark:bg-[#132A42] flex items-center justify-center font-bold text-xs shrink-0 font-sora">
                          {item.user
                            ? item.user
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .slice(0, 2)
                            : 'WD'}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-[#071A2B] dark:text-white font-sora truncate">
                            {item.user}
                          </span>
                          <span className="text-[11px] text-[#667085] dark:text-slate-400 font-mono">
                            {item.userId}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="py-3.5 px-4 text-[#667085] dark:text-slate-300 truncate max-w-[180px]">
                      {item.email}
                    </td>

                    {/* Vehicle */}
                    <td className="py-3.5 px-4">
                      {item.vehicleMake && item.vehicleModel ? (
                        <div className="flex items-center gap-3">
                          {resolveVehicleImage(item) ? (
                            <img
                              src={resolveVehicleImage(item)}
                              alt={`${item.vehicleMake} ${item.vehicleModel} ${item.vehicleYear || ''}`}
                              className="w-14 h-10 object-cover rounded-md border border-slate-200 dark:border-slate-700 shrink-0 bg-slate-100 dark:bg-slate-800"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-14 h-10 rounded-md border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-center shrink-0 p-1 text-center">
                              <span className="text-[9px] text-[#667085] dark:text-slate-400 font-medium leading-tight">
                                No image
                              </span>
                            </div>
                          )}
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-[#071A2B] dark:text-white font-sora truncate text-xs sm:text-sm">
                              {item.vehicleMake} {item.vehicleModel}
                            </span>
                            <div className="flex items-center gap-2 text-[11px] text-[#667085] dark:text-slate-400">
                              <span className="font-semibold text-amber-700 dark:text-[#F2B705]">
                                {item.vehicleYear}
                              </span>
                              {!resolveVehicleImage(item) && (
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 italic">
                                  Vehicle image not available
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-[#667085] dark:text-slate-400 font-normal italic">
                          Vehicle not assigned
                        </span>
                      )}
                    </td>

                    {/* Prize Status */}
                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      {getPrizeStatusBadge(item.status)}
                    </td>

                    {/* Account Status */}
                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      {getAccountStatusBadge(item.accountStatus)}
                    </td>

                    {/* Claim Status */}
                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      {getClaimStatusPill(item.claimStatus)}
                    </td>

                    {/* Assigned */}
                    <td className="py-3.5 px-3 text-[#667085] dark:text-slate-400 whitespace-nowrap text-[11px]">
                      {item.assignedAt || '—'}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View Dossier */}
                        <button
                          type="button"
                          onClick={() => setDetailPrize(item)}
                          title="View Allocation Dossier"
                          className="p-1.5 rounded-lg text-[#667085] dark:text-slate-400 hover:text-[#071A2B] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1B3754] transition-colors cursor-pointer"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>

                        {/* Edit Vehicle */}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          title="Edit Vehicle Details"
                          className="p-1.5 rounded-lg text-[#667085] dark:text-slate-400 hover:text-[#071A2B] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1B3754] transition-colors cursor-pointer"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>

                        {/* Activate / Deactivate button */}
                        {item.status === 'ASSIGNED' ? (
                          <button
                            type="button"
                            onClick={() => handleTriggerActivate(item)}
                            className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] font-sora transition-colors cursor-pointer"
                            title="Activate Vehicle Prize"
                          >
                            Activate
                          </button>
                        ) : item.status === 'ACTIVE' ? (
                          <button
                            type="button"
                            onClick={() => handleTriggerDeactivate(item)}
                            className="px-2 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] font-sora transition-colors cursor-pointer"
                            title="Deactivate Vehicle Prize"
                          >
                            Deactivate
                          </button>
                        ) : null}

                        {/* View User */}
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/users/${item.userId}`)}
                          title="View Participant Profile"
                          className="px-2 py-1 rounded bg-[#F5F7FA] dark:bg-[#071A2B] text-[#071A2B] dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1B3754] font-semibold text-[11px] font-sora transition-colors cursor-pointer"
                        >
                          User
                        </button>

                        {/* View Claim */}
                        <button
                          type="button"
                          onClick={() => navigate('/admin/claims')}
                          title="View Claim Requests"
                          className="px-2 py-1 rounded bg-[#F5F7FA] dark:bg-[#071A2B] text-[#071A2B] dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1B3754] font-semibold text-[11px] font-sora transition-colors cursor-pointer"
                        >
                          Claim
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredPrizes.length === 0 && (
            <div className="py-12 px-4 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-3 text-slate-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 17a2 2 0 100-4 2 2 0 000 4zm10 0a2 2 0 100-4 2 2 0 000 4zM4 11h16M4 11V7a1 1 0 011-1h10l4 5v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-7z" />
                </svg>
              </div>
              <h3 className="text-sm font-bold font-sora text-[#071A2B] dark:text-white">
                No matching vehicle prize allocations found
              </h3>
              <p className="text-xs text-[#667085] dark:text-slate-400 mt-1">
                Try adjusting your search query or status filter parameters.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-3 px-3 py-1.5 rounded-lg bg-[#D4AF37] text-[#071A2B] text-xs font-bold font-sora hover:bg-[#E5C158] transition-colors cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>

        {/* 5. Mobile / Tablet Responsive Stacked Cards (< 768px) */}
        <div className="block md:hidden space-y-3">
          {filteredPrizes.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-xl bg-white dark:bg-[#0B253F] border border-[#D9E0E7] dark:border-[#1B3754] shadow-sm space-y-3"
            >
              {/* Header: User & Vehicle */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-[#071A2B] text-[#F2B705] dark:bg-[#132A42] flex items-center justify-center font-bold text-xs shrink-0 font-sora">
                    {item.user
                      ? item.user
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)
                      : 'WD'}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-[#071A2B] dark:text-white font-sora text-sm truncate">
                      {item.user}
                    </span>
                    <span className="text-[11px] text-[#667085] dark:text-slate-400 font-mono">
                      {item.userId}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  {getPrizeStatusBadge(item.status)}
                </div>
              </div>

              {/* Vehicle Presentation */}
              <div className="p-2.5 rounded-lg bg-[#F5F7FA] dark:bg-[#071A2B] border border-slate-200 dark:border-slate-800 flex items-center gap-3">
                {resolveVehicleImage(item) ? (
                  <img
                    src={resolveVehicleImage(item)}
                    alt={`${item.vehicleMake} ${item.vehicleModel} ${item.vehicleYear || ''}`}
                    className="w-16 h-12 object-cover rounded-md border border-slate-200 dark:border-slate-700 shrink-0 bg-slate-100 dark:bg-slate-800"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-16 h-12 rounded-md border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center shrink-0 p-1 text-center">
                    <span className="text-[9px] text-[#667085] dark:text-slate-400 font-medium leading-tight">
                      No image
                    </span>
                  </div>
                )}
                <div className="min-w-0 flex flex-col">
                  <span className="font-bold text-[#071A2B] dark:text-white font-sora text-xs truncate">
                    {item.vehicleMake && item.vehicleModel ? `${item.vehicleMake} ${item.vehicleModel}` : 'Vehicle not assigned'}
                  </span>
                  <div className="flex items-center gap-2 text-[11px] text-[#667085] dark:text-slate-400">
                    <span className="font-semibold text-amber-700 dark:text-[#F2B705]">
                      {item.vehicleYear || '—'}
                    </span>
                    {!resolveVehicleImage(item) && (
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 italic truncate">
                        Vehicle image not available
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Status details */}
              <div className="flex items-center justify-between py-2 border-y border-[#D9E0E7] dark:border-[#1B3754] text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-[#667085] dark:text-slate-400">Account:</span>
                  {getAccountStatusBadge(item.accountStatus)}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-[#667085] dark:text-slate-400">Claim:</span>
                  {getClaimStatusPill(item.claimStatus)}
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#667085] dark:text-slate-400">
                <span className="truncate max-w-[180px]">{item.email}</span>
                <span>Assigned: {item.assignedAt || '—'}</span>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-5 gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setDetailPrize(item)}
                  className="py-1.5 rounded-lg bg-[#F5F7FA] dark:bg-[#071A2B] text-[#071A2B] dark:text-white font-semibold text-[11px] font-sora flex items-center justify-center border border-slate-200 dark:border-slate-800"
                >
                  View
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenEdit(item)}
                  className="py-1.5 rounded-lg bg-[#F5F7FA] dark:bg-[#071A2B] text-[#071A2B] dark:text-white font-semibold text-[11px] font-sora flex items-center justify-center border border-slate-200 dark:border-slate-800"
                >
                  Edit
                </button>
                {item.status === 'ASSIGNED' ? (
                  <button
                    type="button"
                    onClick={() => handleTriggerActivate(item)}
                    className="py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-[11px] font-sora flex items-center justify-center"
                  >
                    Activate
                  </button>
                ) : item.status === 'ACTIVE' ? (
                  <button
                    type="button"
                    onClick={() => handleTriggerDeactivate(item)}
                    className="py-1.5 rounded-lg bg-amber-600 text-white font-bold text-[11px] font-sora flex items-center justify-center"
                  >
                    Deact
                  </button>
                ) : (
                  <div className="py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 text-center text-[10px] flex items-center justify-center">
                    —
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => navigate(`/admin/users/${item.userId}`)}
                  className="py-1.5 rounded-lg bg-[#F5F7FA] dark:bg-[#071A2B] text-[#071A2B] dark:text-white font-semibold text-[11px] font-sora flex items-center justify-center border border-slate-200 dark:border-slate-800"
                >
                  User
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/admin/claims')}
                  className="py-1.5 rounded-lg bg-[#F5F7FA] dark:bg-[#071A2B] text-[#071A2B] dark:text-white font-semibold text-[11px] font-sora flex items-center justify-center border border-slate-200 dark:border-slate-800"
                >
                  Claim
                </button>
              </div>
            </div>
          ))}

          {filteredPrizes.length === 0 && (
            <div className="py-8 px-4 text-center bg-white dark:bg-[#0B253F] rounded-xl border border-[#D9E0E7] dark:border-[#1B3754]">
              <p className="text-xs text-[#667085] dark:text-slate-400">
                No matching vehicle prize allocations found.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-2 text-xs text-[#D4AF37] font-bold"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>

        {/* ================= MODALS ================= */}

        {/* 1. View Dossier Modal */}
        {detailPrize && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-[#0C2238] rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#D9E0E7] dark:border-[#1B3754] space-y-5 max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between pb-3 border-b border-[#D9E0E7] dark:border-[#1B3754]">
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#F2B705] font-bold">
                    VEHICLE ALLOCATION RECORD • {detailPrize.id}
                  </span>
                  <h2 className="text-lg font-bold font-sora text-[#071A2B] dark:text-white">
                    {detailPrize.vehicleMake && detailPrize.vehicleModel
                      ? `${detailPrize.vehicleMake} ${detailPrize.vehicleModel}`
                      : 'Vehicle Prize Dossier'}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setDetailPrize(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Vehicle Image Presentation */}
              <div className="rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                {resolveVehicleImage(detailPrize) ? (
                  <img
                    src={resolveVehicleImage(detailPrize)}
                    alt={`${detailPrize.vehicleMake} ${detailPrize.vehicleModel} ${detailPrize.vehicleYear || ''}`}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="h-32 flex flex-col items-center justify-center p-4 text-center">
                    <svg className="w-8 h-8 text-slate-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Vehicle image not available
                    </span>
                  </div>
                )}
              </div>

              {/* Vehicle Details Grid */}
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs">
                <div>
                  <span className="text-[10px] uppercase text-slate-500 dark:text-slate-400 block font-semibold">Make</span>
                  <span className="font-bold text-[#071A2B] dark:text-white">{detailPrize.vehicleMake || '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-500 dark:text-slate-400 block font-semibold">Model</span>
                  <span className="font-bold text-[#071A2B] dark:text-white">{detailPrize.vehicleModel || '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-500 dark:text-slate-400 block font-semibold">Year</span>
                  <span className="font-bold text-amber-700 dark:text-[#F2B705]">{detailPrize.vehicleYear || '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-500 dark:text-slate-400 block font-semibold">Allocation ID</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">{detailPrize.id}</span>
                </div>
              </div>

              {/* User Details */}
              <div className="space-y-2 text-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block font-sora">
                  Participant Account
                </span>
                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#071A2B] dark:text-white block">{detailPrize.user}</span>
                    <span className="text-[11px] text-[#667085] dark:text-slate-400 font-mono">{detailPrize.userId} • {detailPrize.email}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setDetailPrize(null);
                      navigate(`/admin/users/${detailPrize.userId}`);
                    }}
                    className="px-2.5 py-1 text-xs font-semibold text-[#071A2B] bg-[#D4AF37] hover:bg-[#E5C158] rounded-md transition-colors cursor-pointer"
                  >
                    View User
                  </button>
                </div>
              </div>

              {/* Status Row */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase block mb-1">Prize Status</span>
                  {getPrizeStatusBadge(detailPrize.status)}
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase block mb-1">Account Status</span>
                  {getAccountStatusBadge(detailPrize.accountStatus)}
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase block mb-1">Claim Status</span>
                  {getClaimStatusPill(detailPrize.claimStatus)}
                </div>
              </div>

              {/* Timestamp details */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 border-t border-[#D9E0E7] dark:border-[#1B3754] pt-3">
                <span>Assigned: {detailPrize.assignedAt || '—'}</span>
                <span>Last Updated: {detailPrize.updatedAt || '—'} (SAST)</span>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-between gap-2 pt-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const p = detailPrize;
                      setDetailPrize(null);
                      handleOpenEdit(p);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-[#071A2B] dark:text-white font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Edit Vehicle
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDetailPrize(null);
                      navigate('/admin/claims');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-[#071A2B] dark:text-white font-semibold text-xs transition-colors cursor-pointer"
                  >
                    View Claims Area
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setDetailPrize(null)}
                  className="px-4 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-[#071A2B] dark:text-white font-semibold text-xs transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. Create Modal */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-[#0C2238] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#D9E0E7] dark:border-[#1B3754] space-y-4">
              <div className="flex items-start justify-between pb-3 border-b border-[#D9E0E7] dark:border-[#1B3754]">
                <div>
                  <h2 className="text-lg font-bold font-sora text-[#071A2B] dark:text-white">
                    Create Vehicle Prize
                  </h2>
                  <p className="text-xs text-[#667085] dark:text-slate-400">
                    Assign a fleet vehicle prize to an approved participant account.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {createError && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-semibold">
                  {createError}
                </div>
              )}

              <form onSubmit={handleCreateSubmit} className="space-y-4">
                {/* User */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-[#071A2B] dark:text-slate-200">
                    Recipient Participant Account <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={createFormData.userId}
                    onChange={(e) => setCreateFormData({ ...createFormData, userId: e.target.value })}
                    required
                    className="w-full h-9 px-3 rounded-lg border border-[#D9E0E7] dark:border-[#1B3754] bg-white dark:bg-[#071A2B] text-xs text-[#071A2B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                  >
                    <option value="">Select participant...</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.id}) — {u.status}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Make & Model */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-[#071A2B] dark:text-slate-200">
                      Vehicle Make <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={createFormData.vehicleMake}
                      onChange={(e) => setCreateFormData({ ...createFormData, vehicleMake: e.target.value })}
                      placeholder="e.g. Toyota"
                      required
                      className="w-full h-9 px-3 rounded-lg border border-[#D9E0E7] dark:border-[#1B3754] bg-white dark:bg-[#071A2B] text-xs text-[#071A2B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-[#071A2B] dark:text-slate-200">
                      Vehicle Model <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={createFormData.vehicleModel}
                      onChange={(e) => setCreateFormData({ ...createFormData, vehicleModel: e.target.value })}
                      placeholder="e.g. Hilux"
                      required
                      className="w-full h-9 px-3 rounded-lg border border-[#D9E0E7] dark:border-[#1B3754] bg-white dark:bg-[#071A2B] text-xs text-[#071A2B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                    />
                  </div>
                </div>

                {/* Year & Status */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-[#071A2B] dark:text-slate-200">
                      Vehicle Year <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1990"
                      max="2035"
                      value={createFormData.vehicleYear}
                      onChange={(e) => setCreateFormData({ ...createFormData, vehicleYear: e.target.value })}
                      required
                      className="w-full h-9 px-3 rounded-lg border border-[#D9E0E7] dark:border-[#1B3754] bg-white dark:bg-[#071A2B] text-xs text-[#071A2B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-[#071A2B] dark:text-slate-200">
                      Prize Status
                    </label>
                    <select
                      value={createFormData.status}
                      onChange={(e) => setCreateFormData({ ...createFormData, status: e.target.value })}
                      className="w-full h-9 px-3 rounded-lg border border-[#D9E0E7] dark:border-[#1B3754] bg-white dark:bg-[#071A2B] text-xs text-[#071A2B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                    >
                      <option value="ASSIGNED">ASSIGNED (Default)</option>
                      <option value="ACTIVE">ACTIVE</option>
                    </select>
                  </div>
                </div>

                {/* Image URL */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-[#071A2B] dark:text-slate-200">
                    Vehicle Image URL <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="url"
                    value={createFormData.vehicleImage}
                    onChange={(e) => setCreateFormData({ ...createFormData, vehicleImage: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full h-9 px-3 rounded-lg border border-[#D9E0E7] dark:border-[#1B3754] bg-white dark:bg-[#071A2B] text-xs text-[#071A2B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                  />
                  <span className="text-[10px] text-[#667085] dark:text-slate-400 block">
                    If no image is provided, "Vehicle image not available" will be displayed.
                  </span>
                </div>

                {/* Standard White Hilux Specimen Quick Select */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#071A2B] dark:text-slate-200">
                    Standard White Toyota Hilux Specimens:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {WHITE_HILUX_SPECIMENS.map((spec) => (
                      <button
                        key={spec.id}
                        type="button"
                        onClick={() => setCreateFormData({ ...createFormData, vehicleImage: spec.url })}
                        className={`p-1.5 rounded-lg border-2 text-left cursor-pointer transition-all flex items-center gap-2 ${
                          createFormData.vehicleImage === spec.url
                            ? 'border-[#D4AF37] bg-amber-50/60 dark:bg-amber-950/30'
                            : 'border-[#D9E0E7] dark:border-[#1B3754] bg-slate-50 dark:bg-[#071A2B] hover:border-slate-400'
                        }`}
                      >
                        <img src={spec.url} alt={spec.shortLabel} className="w-10 h-8 object-cover rounded shrink-0" />
                        <span className="text-[11px] font-semibold text-[#071A2B] dark:text-white truncate">
                          {spec.shortLabel}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preview */}
                {createFormData.vehicleImage && (
                  <div className="p-2 rounded-lg border border-[#D9E0E7] dark:border-[#1B3754] bg-slate-50 dark:bg-[#071A2B]">
                    <span className="text-[10px] font-semibold text-[#667085] dark:text-slate-400 block mb-1 uppercase">
                      Vehicle Image Preview
                    </span>
                    <div className="relative w-full h-24 rounded overflow-hidden bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <img
                        src={createFormData.vehicleImage}
                        alt="Vehicle preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#D9E0E7] dark:border-[#1B3754]">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-3 py-2 text-xs font-semibold text-[#475467] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-[#071A2B] bg-[#D4AF37] hover:bg-[#E5C158] rounded-lg transition-colors shadow-sm cursor-pointer"
                  >
                    Assign Vehicle Prize
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 3. Edit Modal */}
        {editingPrize && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-[#0C2238] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#D9E0E7] dark:border-[#1B3754] space-y-4">
              <div className="flex items-start justify-between pb-3 border-b border-[#D9E0E7] dark:border-[#1B3754]">
                <div>
                  <h2 className="text-lg font-bold font-sora text-[#071A2B] dark:text-white">
                    Edit Vehicle Prize
                  </h2>
                  <p className="text-xs text-[#667085] dark:text-slate-400">
                    Modify vehicle specifications for {editingPrize.user} ({editingPrize.userId}).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingPrize(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {editError && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-semibold">
                  {editError}
                </div>
              )}

              <form onSubmit={handleEditSubmit} className="space-y-4">
                {/* Make & Model */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-[#071A2B] dark:text-slate-200">
                      Vehicle Make <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editFormData.vehicleMake}
                      onChange={(e) => setEditFormData({ ...editFormData, vehicleMake: e.target.value })}
                      required
                      className="w-full h-9 px-3 rounded-lg border border-[#D9E0E7] dark:border-[#1B3754] bg-white dark:bg-[#071A2B] text-xs text-[#071A2B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-[#071A2B] dark:text-slate-200">
                      Vehicle Model <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editFormData.vehicleModel}
                      onChange={(e) => setEditFormData({ ...editFormData, vehicleModel: e.target.value })}
                      required
                      className="w-full h-9 px-3 rounded-lg border border-[#D9E0E7] dark:border-[#1B3754] bg-white dark:bg-[#071A2B] text-xs text-[#071A2B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                    />
                  </div>
                </div>

                {/* Year */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-[#071A2B] dark:text-slate-200">
                    Vehicle Year <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1990"
                    max="2035"
                    value={editFormData.vehicleYear}
                    onChange={(e) => setEditFormData({ ...editFormData, vehicleYear: e.target.value })}
                    required
                    className="w-full h-9 px-3 rounded-lg border border-[#D9E0E7] dark:border-[#1B3754] bg-white dark:bg-[#071A2B] text-xs text-[#071A2B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                  />
                </div>

                {/* Image URL */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-[#071A2B] dark:text-slate-200">
                    Vehicle Image URL <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="url"
                    value={editFormData.vehicleImage}
                    onChange={(e) => setEditFormData({ ...editFormData, vehicleImage: e.target.value })}
                    placeholder="https://..."
                    className="w-full h-9 px-3 rounded-lg border border-[#D9E0E7] dark:border-[#1B3754] bg-white dark:bg-[#071A2B] text-xs text-[#071A2B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                  />
                  <div className="flex items-center justify-between text-[11px] text-[#667085] dark:text-slate-400 pt-1">
                    <span>Clear input to remove image</span>
                    {editFormData.vehicleImage && (
                      <button
                        type="button"
                        onClick={() => setEditFormData({ ...editFormData, vehicleImage: '' })}
                        className="text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                      >
                        Remove Image
                      </button>
                    )}
                  </div>
                </div>

                {/* Standard White Hilux Specimen Quick Select */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#071A2B] dark:text-slate-200">
                    Standard White Toyota Hilux Specimens:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {WHITE_HILUX_SPECIMENS.map((spec) => (
                      <button
                        key={spec.id}
                        type="button"
                        onClick={() => setEditFormData({ ...editFormData, vehicleImage: spec.url })}
                        className={`p-1.5 rounded-lg border-2 text-left cursor-pointer transition-all flex items-center gap-2 ${
                          editFormData.vehicleImage === spec.url
                            ? 'border-[#D4AF37] bg-amber-50/60 dark:bg-amber-950/30'
                            : 'border-[#D9E0E7] dark:border-[#1B3754] bg-slate-50 dark:bg-[#071A2B] hover:border-slate-400'
                        }`}
                      >
                        <img src={spec.url} alt={spec.shortLabel} className="w-10 h-8 object-cover rounded shrink-0" />
                        <span className="text-[11px] font-semibold text-[#071A2B] dark:text-white truncate">
                          {spec.shortLabel}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preview */}
                {editFormData.vehicleImage && (
                  <div className="p-2 rounded-lg border border-[#D9E0E7] dark:border-[#1B3754] bg-slate-50 dark:bg-[#071A2B]">
                    <span className="text-[10px] font-semibold text-[#667085] dark:text-slate-400 block mb-1 uppercase">
                      Vehicle Image Preview
                    </span>
                    <div className="relative w-full h-24 rounded overflow-hidden bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <img
                        src={editFormData.vehicleImage}
                        alt="Vehicle preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#D9E0E7] dark:border-[#1B3754]">
                  <button
                    type="button"
                    onClick={() => setEditingPrize(null)}
                    className="px-3 py-2 text-xs font-semibold text-[#475467] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-[#071A2B] bg-[#D4AF37] hover:bg-[#E5C158] rounded-lg transition-colors shadow-sm cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 4. Activate Confirmation Modal */}
        {prizeToActivate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-[#0C2238] rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-[#D9E0E7] dark:border-[#1B3754] space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold font-sora text-[#071A2B] dark:text-white">
                    Activate Vehicle Prize?
                  </h3>
                  <p className="text-xs text-[#667085] dark:text-slate-400">
                    {prizeToActivate.user} ({prizeToActivate.userId})
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Activating this vehicle prize ({prizeToActivate.vehicleYear} {prizeToActivate.vehicleMake} {prizeToActivate.vehicleModel}) will make the vehicle prize available to the approved participant account.
              </p>

              {prizeToActivate.accountStatus === 'PENDING REVIEW' && (
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-semibold">
                  User approval required before activating a vehicle prize. Participant account is pending review.
                </div>
              )}

              {modalFeedback && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-semibold">
                  {modalFeedback}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#D9E0E7] dark:border-[#1B3754]">
                <button
                  type="button"
                  onClick={() => setPrizeToActivate(null)}
                  className="px-3 py-2 text-xs font-semibold text-[#475467] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmActivate}
                  disabled={prizeToActivate.accountStatus === 'PENDING REVIEW'}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors shadow-sm cursor-pointer"
                >
                  Activate Prize
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 5. Deactivate Confirmation Modal */}
        {prizeToDeactivate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-[#0C2238] rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-[#D9E0E7] dark:border-[#1B3754] space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold font-sora text-[#071A2B] dark:text-white">
                    Deactivate Vehicle Prize?
                  </h3>
                  <p className="text-xs text-[#667085] dark:text-slate-400">
                    {prizeToDeactivate.user} ({prizeToDeactivate.userId})
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Deactivating this prize will remove the vehicle prize from the active state. This changes only the vehicle-prize status and does not deactivate the user's account.
              </p>

              {modalFeedback && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-semibold">
                  {modalFeedback}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#D9E0E7] dark:border-[#1B3754]">
                <button
                  type="button"
                  onClick={() => setPrizeToDeactivate(null)}
                  className="px-3 py-2 text-xs font-semibold text-[#475467] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeactivate}
                  className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors shadow-sm cursor-pointer"
                >
                  Deactivate Prize
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
