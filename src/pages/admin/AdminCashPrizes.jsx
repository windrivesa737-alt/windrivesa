import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminShell from '../../components/admin/AdminShell';
import {
  getAllCashPrizes,
  getCashPrizeMetrics,
  formatZAR,
  createCashPrize,
  updateCashPrize,
  activateCashPrize,
  deactivateCashPrize,
  DEFAULT_CASH_PRIZE_AMOUNT,
} from '../../services/rewards';
import { listUsers } from '../../services/users';

export default function AdminCashPrizes() {
  const navigate = useNavigate();

  // Primary Data State
  const [cashPrizes, setCashPrizes] = useState([]);
  const [metrics, setMetrics] = useState({
    totalAllocated: 0,
    totalCount: 0,
    activePool: 0,
    activeCount: 0,
    processingPool: 0,
    processingCount: 0,
    fulfilledPool: 0,
    fulfilledCount: 0,
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
    amount: DEFAULT_CASH_PRIZE_AMOUNT,
    currency: 'ZAR',
    status: 'ASSIGNED',
  });
  const [createError, setCreateError] = useState('');

  // Edit Modal State
  const [editingPrize, setEditingPrize] = useState(null);
  const [editAmount, setEditAmount] = useState(DEFAULT_CASH_PRIZE_AMOUNT);
  const [editError, setEditError] = useState('');

  // Confirmation Modals State
  const [prizeToActivate, setPrizeToActivate] = useState(null);
  const [prizeToDeactivate, setPrizeToDeactivate] = useState(null);
  const [modalFeedback, setModalFeedback] = useState('');

  // Dossier Drawer State
  const [detailPrize, setDetailPrize] = useState(null);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState('');

  // Load and sync data from real Supabase services
  const loadData = async () => {
    try {
      const [prizesRes, usersRes] = await Promise.all([
        getAllCashPrizes(),
        listUsers(),
      ]);
      const data = prizesRes?.data || [];
      const currentUsers = usersRes?.data || [];
      setCashPrizes(data);
      setUsers(currentUsers);
      setMetrics(getCashPrizeMetrics(data));
    } catch (err) {
      console.error('Failed to load cash prizes:', err);
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
  };

  // Filter calculation
  const filteredPrizes = cashPrizes.filter((item) => {
    // 1. Search Query (Full Name, Email Address, Cash Prize ID, or User ID)
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      const matchName = item.user?.toLowerCase().includes(q);
      const matchEmail = item.email?.toLowerCase().includes(q);
      const matchPrizeId = item.id?.toLowerCase().includes(q);
      const matchUserId = item.userId?.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchPrizeId && !matchUserId) {
        return false;
      }
    }

    // 2. Prize Status Filter
    if (prizeStatusFilter !== 'ALL') {
      const normStatus = item.status?.replace(' ', '_').toUpperCase();
      const targetStatus = prizeStatusFilter.replace(' ', '_').toUpperCase();
      if (normStatus !== targetStatus) {
        return false;
      }
    }

    // 3. Account Status Filter
    if (accountStatusFilter !== 'ALL') {
      const normAccount = item.accountStatus?.toUpperCase();
      if (normAccount !== accountStatusFilter.toUpperCase()) {
        return false;
      }
    }

    // 4. Claim Status Filter
    if (claimStatusFilter !== 'ALL') {
      const normClaim = item.claimStatus?.toUpperCase() || '';
      const targetClaim = claimStatusFilter.toUpperCase();
      if (targetClaim === 'NO CLAIM SUBMITTED') {
        if (normClaim !== 'NO CLAIM SUBMITTED' && normClaim !== 'NOT CLAIMED' && normClaim !== 'NONE' && normClaim !== 'NOT STARTED') {
          return false;
        }
      } else if (normClaim !== targetClaim) {
        return false;
      }
    }

    return true;
  });

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setCreateError('');
    const eligible = users.filter((u) => u.status === 'APPROVED' || u.status === 'ACTIVE');
    setCreateFormData({
      userId: eligible.length > 0 ? eligible[0].id : '',
      amount: DEFAULT_CASH_PRIZE_AMOUNT,
      currency: 'ZAR',
      status: 'ASSIGNED',
    });
    setIsCreateModalOpen(true);
  };

  // Submit Create Cash Prize
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateError('');

    if (!createFormData.userId) {
      setCreateError('Please select an approved recipient account.');
      return;
    }

    const selectedUser = users.find((u) => u.id === createFormData.userId);
    if (selectedUser && selectedUser.status === 'PENDING REVIEW') {
      setCreateError('User approval required before activating a cash prize.');
      return;
    }

    const num = Number(createFormData.amount);
    if (isNaN(num) || num <= 0) {
      setCreateError('Cash amount must be a valid positive monetary value.');
      return;
    }

    const res = await createCashPrize(createFormData);
    if (res.success) {
      await loadData();
      setIsCreateModalOpen(false);
      showToast(`Cash prize of ${formatZAR(num)} ZAR successfully assigned to ${res.cashPrize.user}`);
    } else {
      setCreateError(res.error || 'Failed to assign cash prize.');
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (prize) => {
    setEditingPrize(prize);
    setEditAmount(prize.amount || DEFAULT_CASH_PRIZE_AMOUNT);
    setEditError('');
  };

  // Submit Edit Cash Prize
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditError('');

    if (!editingPrize) return;

    const num = Number(editAmount);
    if (isNaN(num) || num <= 0) {
      setEditError('Cash amount must be a valid positive monetary value.');
      return;
    }

    const res = await updateCashPrize(editingPrize.id, { amount: num });
    if (res.success) {
      await loadData();
      setEditingPrize(null);
      if (detailPrize && detailPrize.id === editingPrize.id) {
        setDetailPrize(res.cashPrize);
      }
      showToast(`Cash prize amount updated to ${formatZAR(num)} ZAR for ${res.cashPrize.user}`);
    } else {
      setEditError(res.error || 'Failed to update cash prize.');
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

    const res = await activateCashPrize(prizeToActivate.id);
    if (res.success) {
      await loadData();
      setPrizeToActivate(null);
      if (detailPrize && detailPrize.id === prizeToActivate.id) {
        setDetailPrize(res.cashPrize);
      }
      showToast(`Cash prize activated for ${res.cashPrize.user}`);
    } else {
      setModalFeedback(res.error || 'Failed to activate cash prize.');
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

    const res = await deactivateCashPrize(prizeToDeactivate.id);
    if (res.success) {
      await loadData();
      setPrizeToDeactivate(null);
      if (detailPrize && detailPrize.id === prizeToDeactivate.id) {
        setDetailPrize(res.cashPrize);
      }
      showToast(`Cash prize deactivated for ${res.cashPrize.user}`);
    } else {
      setModalFeedback(res.error || 'Failed to deactivate cash prize.');
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
      activeKey="cash-prizes"
      breadcrumb="HQ Admin Console / Operations / Cash Prizes"
      toastState={toastMessage}
      onCloseToast={() => setToastMessage('')}
    >
      <div className="space-y-6">
        {/* 1. Header & Primary Action */}
        <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#D9E0E7] dark:border-[#1B3754]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-[#F2B705] bg-amber-100 dark:bg-[#0e273f] px-2.5 py-0.5 rounded font-sora border border-amber-300 dark:border-[#1d4168]">
                CASH PRIZE MANAGEMENT • RSA ESCROW DISBURSEMENT ENGINE
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-sora text-[#071A2B] dark:text-white tracking-tight">
              Cash Prizes
            </h1>
            <p className="text-xs sm:text-sm text-[#667085] dark:text-slate-300 max-w-2xl leading-relaxed">
              Create, assign, and manage cash prizes associated with approved user accounts.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="px-4 py-2.5 rounded-lg bg-[#F2B705] hover:bg-[#d9a404] text-[#071A2B] font-bold text-xs sm:text-sm font-sora flex items-center gap-2 transition-all shadow-sm cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              <span>Create Cash Prize</span>
            </button>
          </div>
        </section>

        {/* 2. Operational Metrics Cards (matching Stitch Screen 14) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Metric 1 */}
          <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#0B253F] border border-[#D9E0E7] dark:border-[#1B3754] shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#667085] dark:text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider font-sora">
                TOTAL CASH ALLOCATED
              </span>
              <svg className="w-5 h-5 text-[#071A2B] dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div className="my-2.5">
              <div className="text-2xl sm:text-3xl font-bold font-sora text-[#071A2B] dark:text-white tracking-tight">
                {formatZAR(metrics.totalAllocated)}
              </div>
              <span className="text-[10px] text-[#667085] dark:text-slate-400 uppercase font-semibold">
                SOUTH AFRICAN RAND (ZAR)
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#667085] dark:text-slate-300">
              <span className="inline-block w-2 h-2 rounded-full bg-[#F2B705]"></span>
              <span>{metrics.totalCount} cataloged allocations</span>
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
                {formatZAR(metrics.activePool)}
              </div>
              <span className="text-[10px] text-[#667085] dark:text-slate-400 uppercase font-semibold">
                READY FOR CLAIM
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#667085] dark:text-slate-300">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>{metrics.activeCount} accounts ready for claim</span>
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
                {formatZAR(metrics.processingPool)}
              </div>
              <span className="text-[10px] text-[#667085] dark:text-slate-400 uppercase font-semibold">
                VERIFICATION AUDIT GATE
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#667085] dark:text-slate-300">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-500"></span>
              <span>{metrics.processingCount} claims in verification audit</span>
            </div>
          </div>

          {/* Metric 4 */}
          <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#0B253F] border border-[#D9E0E7] dark:border-[#1B3754] shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#667085] dark:text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider font-sora">
                FULFILLED / COMPLETED
              </span>
              <svg className="w-5 h-5 text-slate-600 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="my-2.5">
              <div className="text-2xl sm:text-3xl font-bold font-sora text-[#071A2B] dark:text-white tracking-tight">
                {formatZAR(metrics.fulfilledPool)}
              </div>
              <span className="text-[10px] text-[#667085] dark:text-slate-400 uppercase font-semibold">
                SARB ESCROW CLEARED
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#667085] dark:text-slate-300">
              <span className="inline-block w-2 h-2 rounded-full bg-[#071A2B] dark:bg-slate-400"></span>
              <span>{metrics.fulfilledCount} settlements cleared via Escrow</span>
            </div>
          </div>
        </section>

        {/* 3. Search and Filters Toolbar */}
        <section className="p-4 rounded-xl bg-white dark:bg-[#0B253F] border border-[#D9E0E7] dark:border-[#1B3754] shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#667085] dark:text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by full name, email, or prize ID..."
                className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-[#F5F7FA] dark:bg-[#071A2B] text-[#071A2B] dark:text-white rounded-lg border border-[#D9E0E7] dark:border-[#1B3754] focus:outline-none focus:ring-2 focus:ring-[#F2B705]"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#667085] dark:text-slate-400 font-sora shrink-0 text-[10px]">
                PRIZE STATUS:
              </label>
              <select
                value={prizeStatusFilter}
                onChange={(e) => setPrizeStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-[#F5F7FA] dark:bg-[#071A2B] text-[#071A2B] dark:text-white rounded-lg border border-[#D9E0E7] dark:border-[#1B3754] font-medium focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="ASSIGNED">ASSIGNED</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="DEACTIVATED">DEACTIVATED</option>
                <option value="NOT ASSIGNED">NOT ASSIGNED</option>
              </select>
            </div>

            {/* Account Status Filter */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#667085] dark:text-slate-400 font-sora shrink-0 text-[10px]">
                ACCOUNT:
              </label>
              <select
                value={accountStatusFilter}
                onChange={(e) => setAccountStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-[#F5F7FA] dark:bg-[#071A2B] text-[#071A2B] dark:text-white rounded-lg border border-[#D9E0E7] dark:border-[#1B3754] font-medium focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Accounts</option>
                <option value="APPROVED">Approved</option>
                <option value="ACTIVE">Active</option>
                <option value="PENDING REVIEW">Pending Review</option>
                <option value="REJECTED">Rejected</option>
                <option value="DEACTIVATED">Deactivated</option>
              </select>
            </div>

            {/* Claim Status Filter */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#667085] dark:text-slate-400 font-sora shrink-0 text-[10px]">
                CLAIM:
              </label>
              <select
                value={claimStatusFilter}
                onChange={(e) => setClaimStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-[#F5F7FA] dark:bg-[#071A2B] text-[#071A2B] dark:text-white rounded-lg border border-[#D9E0E7] dark:border-[#1B3754] font-medium focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Claims</option>
                <option value="CLAIM AVAILABLE">CLAIM AVAILABLE</option>
                <option value="SUBMITTED">SUBMITTED</option>
                <option value="UNDER REVIEW">UNDER REVIEW</option>
                <option value="APPROVED">APPROVED</option>
                <option value="REQUIREMENT PENDING">REQUIREMENT PENDING</option>
                <option value="PROCESSING">PROCESSING</option>
                <option value="FULFILLED">FULFILLED</option>
                <option value="NO CLAIM SUBMITTED">No claim submitted</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-[#D9E0E7] dark:border-[#1B3754]">
            <span className="text-xs text-[#667085] dark:text-slate-400 font-medium">
              Showing {filteredPrizes.length} of {cashPrizes.length} records
            </span>
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-3 py-1.5 rounded-lg bg-[#F5F7FA] dark:bg-[#132A42] text-[#071A2B] dark:text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Reset</span>
            </button>
          </div>
        </section>

        {/* 4. Desktop Data Table (>= 768px) */}
        <div className="hidden md:block bg-white dark:bg-[#0B253F] rounded-xl border border-[#D9E0E7] dark:border-[#1B3754] shadow-sm overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-[#F5F7FA] dark:bg-[#071A2B] border-b border-[#D9E0E7] dark:border-[#1B3754] text-[#667085] dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider font-sora">
                  <th className="py-3 px-5">User</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4 text-right">Cash Prize</th>
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

                    {/* Cash Prize */}
                    <td className="py-3.5 px-4 text-right font-bold font-sora">
                      {item.amount ? (
                        <div className="flex flex-col items-end">
                          <span className="text-emerald-700 dark:text-emerald-400 text-sm">
                            {formatZAR(item.amount)}
                          </span>
                          <span className="text-[10px] text-[#667085] dark:text-slate-400 font-medium">
                            {item.currency || 'ZAR'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[#667085] dark:text-slate-400 font-normal">—</span>
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

                        {/* Edit Amount */}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          title="Edit Cash Amount"
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
                            title="Activate Cash Prize"
                          >
                            Activate
                          </button>
                        ) : item.status === 'ACTIVE' ? (
                          <button
                            type="button"
                            onClick={() => handleTriggerDeactivate(item)}
                            className="px-2 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] font-sora transition-colors cursor-pointer"
                            title="Deactivate Cash Prize"
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
                          title="View Claims"
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
        </div>

        {/* 4b. Responsive Card Deck (< 768px) */}
        <div className="md:hidden flex flex-col gap-3">
          {filteredPrizes.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-xl bg-white dark:bg-[#0B253F] border border-[#D9E0E7] dark:border-[#1B3754] shadow-sm flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#071A2B] text-[#F2B705] dark:bg-[#132A42] flex items-center justify-center font-bold text-xs shrink-0 font-sora">
                    {item.user
                      ? item.user
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)
                      : 'WD'}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#071A2B] dark:text-white font-sora">
                      {item.user}
                    </h3>
                    <p className="text-[11px] text-[#667085] dark:text-slate-400">
                      {item.userId} • {item.email}
                    </p>
                  </div>
                </div>
                <div>{getPrizeStatusBadge(item.status)}</div>
              </div>

              {/* Amount and Status Row */}
              <div className="p-3 rounded-lg bg-[#F5F7FA] dark:bg-[#071A2B] flex items-center justify-between text-xs">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-[#667085] dark:text-slate-400 font-sora">
                    Cash Prize Amount
                  </span>
                  <span className="text-base font-bold font-sora text-emerald-700 dark:text-emerald-400">
                    {item.amount ? `${formatZAR(item.amount)} ${item.currency || 'ZAR'}` : '—'}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[10px] uppercase font-bold text-[#667085] dark:text-slate-400 font-sora">
                    Claim Status
                  </span>
                  {getClaimStatusPill(item.claimStatus)}
                </div>
              </div>

              {/* Account and Dates */}
              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[#D9E0E7] dark:border-[#1B3754]">
                <div className="flex items-center gap-1.5">
                  <span className="text-[#667085] dark:text-slate-400">Account:</span>
                  {getAccountStatusBadge(item.accountStatus)}
                </div>
                <span className="text-[#667085] dark:text-slate-400">
                  Assigned: {item.assignedAt || '—'}
                </span>
              </div>

              {/* Mobile Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#D9E0E7] dark:border-[#1B3754]">
                <button
                  type="button"
                  onClick={() => setDetailPrize(item)}
                  className="px-2.5 py-1.5 rounded-lg bg-[#F5F7FA] dark:bg-[#071A2B] text-xs font-semibold text-[#071A2B] dark:text-slate-300"
                >
                  Dossier
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenEdit(item)}
                  className="px-2.5 py-1.5 rounded-lg bg-[#F5F7FA] dark:bg-[#071A2B] text-xs font-semibold text-[#071A2B] dark:text-slate-300"
                >
                  Edit
                </button>
                {item.status === 'ASSIGNED' ? (
                  <button
                    type="button"
                    onClick={() => handleTriggerActivate(item)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold font-sora"
                  >
                    Activate
                  </button>
                ) : item.status === 'ACTIVE' ? (
                  <button
                    type="button"
                    onClick={() => handleTriggerDeactivate(item)}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-bold font-sora"
                  >
                    Deactivate
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => navigate(`/admin/users/${item.userId}`)}
                  className="px-2.5 py-1.5 rounded-lg bg-[#F2B705] text-[#071A2B] text-xs font-bold font-sora"
                >
                  User
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* 5. Empty State */}
        {filteredPrizes.length === 0 && (
          <div className="p-12 text-center bg-white dark:bg-[#0B253F] rounded-xl border border-[#D9E0E7] dark:border-[#1B3754] flex flex-col items-center justify-center gap-3 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[#667085] dark:text-slate-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-base font-bold font-sora text-[#071A2B] dark:text-white">
              No Cash Prize Allocations Found
            </h3>
            <p className="text-xs text-[#667085] dark:text-slate-400 max-w-sm">
              No records match your active search or filters. You can reset filters or assign a new prize.
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="mt-2 px-4 py-2 rounded-lg bg-[#071A2B] dark:bg-white text-white dark:text-[#071A2B] font-bold text-xs font-sora hover:opacity-90 transition-opacity cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        )}

        {/* Statutory Governance Footer */}
        <footer className="p-4 rounded-xl bg-white dark:bg-[#0B253F] border border-[#D9E0E7] dark:border-[#1B3754] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#667085] dark:text-slate-400">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>POPIA Section 18 Compliance &amp; SARB Escrow Verification Enabled</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-[#667085] dark:text-slate-400 font-mono">
            <span>Ledger: 0x7F9B...88D2</span>
            <span>•</span>
            <button
              type="button"
              onClick={() => navigate('/admin/claim-requirements')}
              className="hover:underline text-left cursor-pointer font-sans"
            >
              Claim Requirements
            </button>
          </div>
        </footer>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: CREATE / ASSIGN CASH PRIZE                                       */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-[#071A2B]/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0B253F] rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col border border-[#D9E0E7] dark:border-[#1B3754]">
            {/* Header */}
            <div className="px-6 py-4 bg-[#F5F7FA] dark:bg-[#071A2B] flex items-center justify-between border-b border-[#D9E0E7] dark:border-[#1B3754]">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/50 text-[#F2B705] flex items-center justify-center font-bold">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                </span>
                <div>
                  <h3 className="font-bold text-base font-sora text-[#071A2B] dark:text-white">
                    Create Cash Prize
                  </h3>
                  <p className="text-xs text-[#667085] dark:text-slate-400">
                    Allocate statutory cash award to approved account
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded text-[#667085] hover:text-[#071A2B] dark:text-slate-400 dark:hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {createError && (
              <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-semibold">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              {/* Recipient selection */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#071A2B] dark:text-slate-200 block mb-1.5 font-sora">
                  Assign Recipient Account *
                </label>
                {users.length > 0 ? (
                  <select
                    value={createFormData.userId}
                    onChange={(e) => setCreateFormData({ ...createFormData, userId: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg bg-[#F5F7FA] dark:bg-[#071A2B] border border-[#D9E0E7] dark:border-[#1B3754] text-xs text-[#071A2B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F2B705]"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} — {u.id} ({u.status})
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-xs text-amber-800 dark:text-amber-300 p-3 bg-amber-50 dark:bg-amber-950/40 rounded-lg">
                    No participants available.
                  </p>
                )}
                {users.find((u) => u.id === createFormData.userId)?.status === 'PENDING REVIEW' && (
                  <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium">
                    User approval required before activating a cash prize.
                  </p>
                )}
              </div>

              {/* Cash Amount */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#071A2B] dark:text-slate-200 block mb-1.5 font-sora">
                  Cash Amount (ZAR) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm font-mono">
                    R
                  </span>
                  <input
                    type="number"
                    min="1000"
                    step="5000"
                    required
                    value={createFormData.amount || ''}
                    onChange={(e) =>
                      setCreateFormData({
                        ...createFormData,
                        amount: e.target.value ? Number(e.target.value) : 0,
                      })
                    }
                    className="w-full pl-8 pr-4 py-2 rounded-lg bg-[#F5F7FA] dark:bg-[#071A2B] border border-[#D9E0E7] dark:border-[#1B3754] text-sm font-bold text-[#071A2B] dark:text-white font-sora focus:outline-none focus:ring-2 focus:ring-[#F2B705]"
                  />
                </div>
                <span className="text-[11px] text-[#667085] dark:text-slate-400 mt-1 block">
                  Configurable default: R250,000 ZAR. Administrators can set any valid positive amount.
                </span>
              </div>

              {/* Currency & Initial Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[#071A2B] dark:text-slate-200 block mb-1 font-sora">
                    Currency
                  </label>
                  <input
                    type="text"
                    readOnly
                    value="ZAR - South African Rand"
                    className="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-[#071A2B]/60 border border-[#D9E0E7] dark:border-[#1B3754] text-xs font-semibold text-[#667085] dark:text-slate-400 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[#071A2B] dark:text-slate-200 block mb-1 font-sora">
                    Initial Status
                  </label>
                  <select
                    value={createFormData.status}
                    onChange={(e) => setCreateFormData({ ...createFormData, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#F5F7FA] dark:bg-[#071A2B] border border-[#D9E0E7] dark:border-[#1B3754] text-xs font-medium text-[#071A2B] dark:text-white focus:outline-none"
                  >
                    <option value="ASSIGNED">ASSIGNED</option>
                    <option value="ACTIVE">ACTIVE</option>
                  </select>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#F5F7FA] dark:bg-[#071A2B] border border-[#D9E0E7] dark:border-[#1B3754] text-xs text-[#667085] dark:text-slate-400 flex items-start gap-2">
                <svg className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>
                  WinDriveSA allows one active cash prize per participant. Assigned prize status is independent from the user account status.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#D9E0E7] dark:border-[#1B3754]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 text-[#071A2B] dark:text-slate-300 font-semibold text-xs hover:bg-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#F2B705] hover:bg-[#d9a404] text-[#071A2B] font-bold text-xs font-sora shadow-sm transition-colors cursor-pointer"
                >
                  Assign Cash Prize
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: EDIT CASH PRIZE AMOUNT                                           */}
      {/* ========================================================================= */}
      {editingPrize && (
        <div className="fixed inset-0 bg-[#071A2B]/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0B253F] rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-[#D9E0E7] dark:border-[#1B3754]">
            <div className="px-6 py-4 bg-[#F5F7FA] dark:bg-[#071A2B] flex items-center justify-between border-b border-[#D9E0E7] dark:border-[#1B3754]">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-[#071A2B] text-white dark:bg-white dark:text-[#071A2B] flex items-center justify-center font-bold">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </span>
                <div>
                  <h3 className="font-bold text-base font-sora text-[#071A2B] dark:text-white">
                    Edit Cash Prize
                  </h3>
                  <p className="text-xs text-[#667085] dark:text-slate-400">
                    Update prize disbursement amount (ZAR)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingPrize(null)}
                className="p-1 rounded text-[#667085] hover:text-[#071A2B] dark:text-slate-400 dark:hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {editError && (
              <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-semibold">
                {editError}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#667085] dark:text-slate-400 block mb-1 font-sora">
                  Assigned Recipient (Read Only)
                </label>
                <input
                  type="text"
                  readOnly
                  value={`${editingPrize.user} (${editingPrize.userId})`}
                  className="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-[#071A2B]/60 border border-[#D9E0E7] dark:border-[#1B3754] text-xs font-semibold text-[#667085] dark:text-slate-400 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#071A2B] dark:text-slate-200 block mb-1 font-sora">
                  Cash Amount (ZAR) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm font-mono">
                    R
                  </span>
                  <input
                    type="number"
                    min="1000"
                    step="5000"
                    required
                    value={editAmount || ''}
                    onChange={(e) => setEditAmount(e.target.value ? Number(e.target.value) : 0)}
                    className="w-full pl-8 pr-4 py-2 rounded-lg bg-[#F5F7FA] dark:bg-[#071A2B] border border-[#D9E0E7] dark:border-[#1B3754] text-sm font-bold text-[#071A2B] dark:text-white font-sora focus:outline-none focus:ring-2 focus:ring-[#F2B705]"
                  />
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#F5F7FA] dark:bg-[#071A2B] border border-[#D9E0E7] dark:border-[#1B3754] text-xs text-[#667085] dark:text-slate-400">
                Note: Editing changes only the cash prize amount. Account status, claim status, and vehicle rewards are not modified.
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#D9E0E7] dark:border-[#1B3754]">
                <button
                  type="button"
                  onClick={() => setEditingPrize(null)}
                  className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 text-[#071A2B] dark:text-slate-300 font-semibold text-xs hover:bg-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#071A2B] dark:bg-white text-white dark:text-[#071A2B] font-bold text-xs font-sora shadow-sm hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Save Modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ACTIVATE CONFIRMATION MODAL                                      */}
      {/* ========================================================================= */}
      {prizeToActivate && (
        <div className="fixed inset-0 bg-[#071A2B]/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0B253F] rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col p-6 gap-4 border border-[#D9E0E7] dark:border-[#1B3754]">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold font-sora text-[#071A2B] dark:text-white">
                Activate Cash Prize?
              </h3>
              <p className="text-xs text-[#667085] dark:text-slate-300 leading-relaxed">
                This will make the assigned cash prize ({formatZAR(prizeToActivate.amount)} ZAR) available to the approved user ({prizeToActivate.user}).
                The participant will immediately be eligible to initiate cash prize claims in their account portal.
              </p>

              {prizeToActivate.accountStatus === 'PENDING REVIEW' && (
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300 text-xs font-semibold">
                  User approval required before activating a cash prize.
                </div>
              )}

              {modalFeedback && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-300 text-xs font-semibold">
                  {modalFeedback}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#D9E0E7] dark:border-[#1B3754]">
              <button
                type="button"
                onClick={() => setPrizeToActivate(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-200 dark:bg-slate-800 text-[#071A2B] dark:text-slate-300 hover:bg-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmActivate}
                className="px-5 py-2 text-xs font-bold font-sora rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm cursor-pointer"
              >
                Activate Cash Prize
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: DEACTIVATE CONFIRMATION MODAL                                    */}
      {/* ========================================================================= */}
      {prizeToDeactivate && (
        <div className="fixed inset-0 bg-[#071A2B]/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0B253F] rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col p-6 gap-4 border border-[#D9E0E7] dark:border-[#1B3754]">
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold font-sora text-[#071A2B] dark:text-white">
                Deactivate Cash Prize?
              </h3>
              <p className="text-xs text-[#667085] dark:text-slate-300 leading-relaxed">
                This will deactivate the current cash prize for {prizeToDeactivate.user} ({formatZAR(prizeToDeactivate.amount)} ZAR) while preserving the underlying allocation record for statutory audit governance.
              </p>
              <p className="text-[11px] text-[#667085] dark:text-slate-400 italic">
                Note: Deactivation changes only the cash-prize status. It does not modify or deactivate the user account.
              </p>

              {modalFeedback && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-300 text-xs font-semibold">
                  {modalFeedback}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#D9E0E7] dark:border-[#1B3754]">
              <button
                type="button"
                onClick={() => setPrizeToDeactivate(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-200 dark:bg-slate-800 text-[#071A2B] dark:text-slate-300 hover:bg-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeactivate}
                className="px-5 py-2 text-xs font-bold font-sora rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition-colors shadow-sm cursor-pointer"
              >
                Deactivate Cash Prize
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DRAWER / MODAL 5: ALLOCATION DOSSIER DETAIL VIEW                          */}
      {/* ========================================================================= */}
      {detailPrize && (
        <div className="fixed inset-0 bg-[#071A2B]/60 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-md bg-white dark:bg-[#0B253F] h-full shadow-2xl flex flex-col overflow-y-auto border-l border-[#D9E0E7] dark:border-[#1B3754]">
            {/* Drawer Header */}
            <div className="p-6 bg-[#F5F7FA] dark:bg-[#071A2B] flex items-center justify-between border-b border-[#D9E0E7] dark:border-[#1B3754]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#F2B705] font-sora">
                  CASH PRIZE ALLOCATION DOSSIER
                </span>
                <h2 className="text-lg font-bold font-sora text-[#071A2B] dark:text-white">
                  {detailPrize.user}
                </h2>
                <p className="text-xs text-[#667085] dark:text-slate-400 font-mono">
                  {detailPrize.id} • {detailPrize.userId}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetailPrize(null)}
                className="p-1 rounded-lg text-[#667085] dark:text-slate-400 hover:text-[#071A2B] dark:hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Drawer Content */}
            <div className="p-6 space-y-5 flex-1">
              {/* Value and Status */}
              <div className="p-4 rounded-xl bg-[#F5F7FA] dark:bg-[#071A2B] border border-[#D9E0E7] dark:border-[#1B3754] flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#667085] dark:text-slate-400 font-sora block">
                    Disbursement Value
                  </span>
                  <span className="text-2xl font-bold font-sora text-emerald-700 dark:text-emerald-400">
                    {detailPrize.amount ? formatZAR(detailPrize.amount) : 'None'}
                  </span>
                  <span className="text-[10px] text-[#667085] dark:text-slate-400 block font-medium">
                    Currency: ZAR (South African Rand)
                  </span>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  {getPrizeStatusBadge(detailPrize.status)}
                  {getClaimStatusPill(detailPrize.claimStatus)}
                </div>
              </div>

              {/* Recipient Account Profile */}
              <div className="p-4 rounded-xl bg-[#F5F7FA] dark:bg-[#071A2B] border border-[#D9E0E7] dark:border-[#1B3754] space-y-2.5 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#F2B705] font-sora block">
                  PARTICIPANT IDENTIFICATION
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-[#667085] dark:text-slate-400">Full Name:</span>
                  <span className="font-bold text-[#071A2B] dark:text-white font-sora">{detailPrize.user}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#667085] dark:text-slate-400">User ID:</span>
                  <span className="font-mono font-semibold text-[#071A2B] dark:text-white">{detailPrize.userId}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#667085] dark:text-slate-400">Email Address:</span>
                  <span className="font-semibold text-[#071A2B] dark:text-white truncate max-w-[200px]">
                    {detailPrize.email}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#667085] dark:text-slate-400">Account Status:</span>
                  {getAccountStatusBadge(detailPrize.accountStatus)}
                </div>
              </div>

              {/* Audit & Claim Details */}
              <div className="p-4 rounded-xl bg-[#F5F7FA] dark:bg-[#071A2B] border border-[#D9E0E7] dark:border-[#1B3754] space-y-2.5 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#F2B705] font-sora block">
                  ESCROW AUDIT &amp; REQUIREMENTS
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-[#667085] dark:text-slate-400">Cash Claim State:</span>
                  <span className="font-semibold text-[#071A2B] dark:text-white">
                    {detailPrize.claimStatus || 'No claim submitted'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#667085] dark:text-slate-400">Assigned Date:</span>
                  <span className="font-mono text-[#071A2B] dark:text-white font-semibold">
                    {detailPrize.assignedAt || '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#667085] dark:text-slate-400">Last Ledger Update:</span>
                  <span className="font-mono text-[#071A2B] dark:text-white font-semibold">
                    {detailPrize.updatedAt || '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#667085] dark:text-slate-400">Requirements Gateway:</span>
                  <button
                    type="button"
                    onClick={() => navigate('/admin/claim-requirements')}
                    className="text-emerald-700 dark:text-emerald-400 font-semibold hover:underline"
                  >
                    View Claim Requirements
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-[#667085] dark:text-slate-400 leading-relaxed">
                Statutory Note: Banking details are securely collected during participant claim review and never displayed in this general prize directory.
              </p>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 bg-[#F5F7FA] dark:bg-[#071A2B] flex items-center justify-between gap-3 border-t border-[#D9E0E7] dark:border-[#1B3754]">
              <button
                type="button"
                onClick={() => navigate(`/admin/users/${detailPrize.userId}`)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-white dark:bg-[#132A42] border border-[#D9E0E7] dark:border-[#1B3754] text-[#071A2B] dark:text-white hover:bg-slate-100 transition-colors"
              >
                View User Profile
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin/claims')}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-white dark:bg-[#132A42] border border-[#D9E0E7] dark:border-[#1B3754] text-[#071A2B] dark:text-white hover:bg-slate-100 transition-colors"
              >
                View Claim Requests
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
