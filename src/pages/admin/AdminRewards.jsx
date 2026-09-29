import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminShell from '../../components/admin/AdminShell';
import {
  getRewards,
  getRewardMetrics,
  formatZAR,
  assignReward,
  updateReward,
  activateReward,
  deactivateReward,
  VEHICLE_SPECIMENS,
  DEFAULT_REWARD_VALUES,
} from '../../services/rewards';
import { resolveVehicleImage, WHITE_HILUX_SPECIMENS } from '../../services/vehicleImages';
import { listUsers } from '../../services/users';

export default function AdminRewards() {
  const navigate = useNavigate();

  // Primary Data State
  const [rewards, setRewards] = useState([]);
  const [metrics, setMetrics] = useState({
    total: 0,
    unassigned: 0,
    assigned: 0,
    active: 0,
    completed: 0,
    activeOrCompleted: 0,
  });
  const [users, setUsers] = useState([]);

  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [rewardStatusFilter, setRewardStatusFilter] = useState('ALL');
  const [accountStatusFilter, setAccountStatusFilter] = useState('ALL');
  const [rewardTypeFilter, setRewardTypeFilter] = useState('ALL');

  // Modal & Drawer States
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignStep, setAssignStep] = useState(1);
  const [assignFormData, setAssignFormData] = useState({
    userId: '',
    cashAmount: DEFAULT_REWARD_VALUES.cashAmount,
    currency: 'ZAR',
    vehicleMake: DEFAULT_REWARD_VALUES.vehicleMake,
    vehicleModel: DEFAULT_REWARD_VALUES.vehicleModel,
    vehicleYear: DEFAULT_REWARD_VALUES.vehicleYear,
    vehicleImage: VEHICLE_SPECIMENS[0].url,
  });
  const [assignError, setAssignError] = useState('');

  // Edit Modal State
  const [editingReward, setEditingReward] = useState(null);
  const [editFormData, setEditFormData] = useState({
    cashAmount: 250000,
    vehicleMake: 'Toyota',
    vehicleModel: '',
    vehicleYear: 2026,
    vehicleImage: '',
  });
  const [editError, setEditError] = useState('');

  // Confirmation Modals
  const [rewardToActivate, setRewardToActivate] = useState(null);
  const [rewardToDeactivate, setRewardToDeactivate] = useState(null);
  const [modalFeedback, setModalFeedback] = useState('');

  // Detail Drawer State
  const [detailReward, setDetailReward] = useState(null);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState('');

  // Refresh rewards and metrics from real Supabase database
  const loadData = async () => {
    try {
      const [rewardsRes, usersRes] = await Promise.all([
        getRewards(),
        listUsers(),
      ]);
      const data = rewardsRes?.data || [];
      const currentUsers = usersRes?.data || [];
      setRewards(data);
      setUsers(currentUsers);
      setMetrics(getRewardMetrics(data));
    } catch (err) {
      console.error('Failed to load rewards data:', err);
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

  // Reset all search and filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setRewardStatusFilter('ALL');
    setAccountStatusFilter('ALL');
    setRewardTypeFilter('ALL');
  };

  // Filter calculation
  const filteredRewards = rewards.filter((item) => {
    // 1. Search Query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      const matchName = item.userName?.toLowerCase().includes(q);
      const matchEmail = item.userEmail?.toLowerCase().includes(q);
      const matchRef = item.userId?.toLowerCase().includes(q) || item.id?.toLowerCase().includes(q);
      const matchMake = item.vehicleMake?.toLowerCase().includes(q);
      const matchModel = item.vehicleModel?.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchRef && !matchMake && !matchModel) {
        return false;
      }
    }

    // 2. Reward Status Filter
    if (rewardStatusFilter !== 'ALL') {
      const normalizedStatus = item.status?.replace(' ', '_').toUpperCase();
      const targetStatus = rewardStatusFilter.replace(' ', '_').toUpperCase();
      if (normalizedStatus !== targetStatus) {
        return false;
      }
    }

    // 3. Account Status Filter
    if (accountStatusFilter !== 'ALL') {
      const normalizedAccount = item.accountStatus?.toUpperCase();
      if (normalizedAccount !== accountStatusFilter.toUpperCase()) {
        return false;
      }
    }

    // 4. Reward Type Filter (Cash, Vehicle, Cash + Vehicle)
    if (rewardTypeFilter !== 'ALL') {
      const hasCash = Boolean(item.cashAmount && item.cashAmount > 0);
      const hasVehicle = Boolean(item.vehicleModel);

      if (rewardTypeFilter === 'CASH' && (!hasCash || hasVehicle)) {
        return false;
      }
      if (rewardTypeFilter === 'VEHICLE' && (!hasVehicle || hasCash)) {
        return false;
      }
      if (rewardTypeFilter === 'BOTH' && (!hasCash || !hasVehicle)) {
        return false;
      }
    }

    return true;
  });

  // Open Assign Wizard
  const handleOpenAssignModal = () => {
    setAssignStep(1);
    setAssignError('');
    // Pre-select first eligible approved user if available
    const eligible = users.filter((u) => u.status === 'APPROVED' || u.status === 'ACTIVE');
    setAssignFormData({
      userId: eligible.length > 0 ? eligible[0].id : '',
      cashAmount: DEFAULT_REWARD_VALUES.cashAmount,
      currency: 'ZAR',
      vehicleMake: DEFAULT_REWARD_VALUES.vehicleMake,
      vehicleModel: DEFAULT_REWARD_VALUES.vehicleModel,
      vehicleYear: DEFAULT_REWARD_VALUES.vehicleYear,
      vehicleImage: VEHICLE_SPECIMENS[0].url,
    });
    setIsAssignModalOpen(true);
  };

  const handleNextAssignStep = () => {
    setAssignError('');
    if (assignStep === 1) {
      if (!assignFormData.userId) {
        setAssignError('Please select a participant account to assign rewards.');
        return;
      }
      const selectedUser = users.find((u) => u.id === assignFormData.userId);
      if (selectedUser && selectedUser.status === 'PENDING REVIEW') {
        setAssignError('User approval required before activating a reward. Please approve this user account first.');
        return;
      }
      setAssignStep(2);
    } else if (assignStep === 2) {
      setAssignStep(3);
    } else if (assignStep === 3) {
      if (!assignFormData.cashAmount && !assignFormData.vehicleModel.trim()) {
        setAssignError('At least one prize component (Cash or Vehicle) must be configured.');
        return;
      }
      setAssignStep(4);
    }
  };

  const handlePrevAssignStep = () => {
    setAssignError('');
    setAssignStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmitAssign = async (e) => {
    if (e) e.preventDefault();
    setAssignError('');

    const res = await assignReward(assignFormData);
    if (res.success) {
      await loadData();
      setIsAssignModalOpen(false);
      showToast(`Reward successfully assigned to participant ${res.reward.userName}`);
    } else {
      setAssignError(res.error || 'Failed to assign reward.');
    }
  };

  // Edit Reward Handlers
  const handleOpenEdit = (reward) => {
    setEditingReward(reward);
    setEditError('');
    setEditFormData({
      cashAmount: reward.cashAmount || 250000,
      vehicleMake: reward.vehicleMake || 'Toyota',
      vehicleModel: reward.vehicleModel || 'Hilux 2.8 GD-6 Legend 4x4',
      vehicleYear: reward.vehicleYear || 2026,
      vehicleImage: reward.vehicleImage || VEHICLE_SPECIMENS[0].url,
    });
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    setEditError('');

    if (!editingReward) return;

    const res = await updateReward(editingReward.id, editFormData);
    if (res.success) {
      await loadData();
      setEditingReward(null);
      if (detailReward && detailReward.id === editingReward.id) {
        setDetailReward(res.reward);
      }
      showToast(`Reward details updated for ${res.reward.userName}`);
    } else {
      setEditError(res.error || 'Failed to update reward details.');
    }
  };

  // Activate Handlers
  const handleTriggerActivate = (reward) => {
    setModalFeedback('');
    setRewardToActivate(reward);
  };

  const handleConfirmActivate = async () => {
    if (!rewardToActivate) return;
    setModalFeedback('');

    const res = await activateReward(rewardToActivate.id);
    if (res.success) {
      await loadData();
      setRewardToActivate(null);
      if (detailReward && detailReward.id === rewardToActivate.id) {
        setDetailReward(res.reward);
      }
      showToast(`Reward successfully activated for ${res.reward.userName}`);
    } else {
      setModalFeedback(res.error || 'Failed to activate reward.');
    }
  };

  // Deactivate Handlers
  const handleTriggerDeactivate = (reward) => {
    setModalFeedback('');
    setRewardToDeactivate(reward);
  };

  const handleConfirmDeactivate = async () => {
    if (!rewardToDeactivate) return;
    setModalFeedback('');

    const res = await deactivateReward(rewardToDeactivate.id);
    if (res.success) {
      await loadData();
      setRewardToDeactivate(null);
      if (detailReward && detailReward.id === rewardToDeactivate.id) {
        setDetailReward(res.reward);
      }
      showToast(`Reward allocation deactivated for ${res.reward.userName}`);
    } else {
      setModalFeedback(res.error || 'Failed to deactivate reward.');
    }
  };

  // Badge styling helpers
  const getRewardStatusBadge = (status) => {
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
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 text-[11px] font-bold font-sora">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
        NOT ASSIGNED
      </span>
    );
  };

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

  const getClaimStatusPill = (status, label) => {
    if (!status || status === 'NOT STARTED' || status === 'None') {
      return (
        <span className="text-[10px] text-[#667085] dark:text-slate-400">
          {label}: None
        </span>
      );
    }
    let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    if (status === 'CLAIM AVAILABLE') {
      colorClasses = 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
    } else if (status === 'UNDER REVIEW' || status === 'SUBMITTED' || status === 'PROCESSING') {
      colorClasses = 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
    } else if (status === 'FULFILLED' || status === 'TRANSFERRED' || status === 'DELIVERED') {
      colorClasses = 'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800';
    } else if (status === 'REQUIREMENT PENDING') {
      colorClasses = 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800';
    }

    return (
      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${colorClasses}`}>
        {label}: {status}
      </span>
    );
  };

  const eligibleUsersForAssignment = users.filter(
    (u) => u.status === 'APPROVED' || u.status === 'ACTIVE'
  );

  return (
    <AdminShell
      activeKey="rewards"
      breadcrumb="HQ Admin Console / Operations / Rewards"
      toastState={toastMessage}
      onCloseToast={() => setToastMessage('')}
    >
      <div className="space-y-6">
        {/* 1. Header & Primary Action */}
        <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#D9E0E7] dark:border-[#1B3754]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#F2B705] font-sora">
                REWARD MANAGEMENT
              </span>
              <span className="text-[#667085] dark:text-slate-400 text-xs">•</span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#667085] dark:text-slate-400 font-sora">
                Direct Administrative Allocation
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-sora text-[#071A2B] dark:text-white tracking-tight">
              Rewards
            </h1>
            <p className="text-xs sm:text-sm text-[#667085] dark:text-slate-300 max-w-2xl leading-relaxed">
              Assign and manage the cash and vehicle rewards associated with approved user accounts.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleOpenAssignModal}
              className="px-4 py-2.5 rounded-lg bg-[#F2B705] hover:bg-[#d9a404] text-[#071A2B] font-bold text-xs sm:text-sm font-sora flex items-center gap-2 transition-all shadow-sm cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              <span>Assign Reward</span>
            </button>
          </div>
        </section>

        {/* 2. Operational Metrics Cards */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-white dark:bg-[#0B253F] border border-[#D9E0E7] dark:border-[#1B3754] shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#667085] dark:text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider font-sora">TOTAL REWARDS</span>
              <svg className="w-4 h-4 text-[#071A2B] dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2 1.5 3 3.5 3h9c2 0 3.5-1 3.5-3V7c0-2-1.5-3-3.5-3h-9C5.5 4 4 5 4 7z" />
              </svg>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-bold font-sora text-[#071A2B] dark:text-white">
                {metrics.total}
              </span>
              <span className="text-[11px] text-[#667085] dark:text-slate-400 font-medium">Accounts cataloged</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-[#071A2B] dark:bg-sky-500 h-full w-full"></div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-[#0B253F] border border-[#D9E0E7] dark:border-[#1B3754] shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#667085] dark:text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider font-sora">UNASSIGNED (APPROVED)</span>
              <svg className="w-4 h-4 text-[#F2B705]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-bold font-sora text-[#F2B705]">
                {metrics.unassigned}
              </span>
              <span className="text-[11px] text-[#F2B705] font-semibold">Awaiting reward</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-[#F2B705] h-full"
                style={{ width: `${metrics.total > 0 ? (metrics.unassigned / metrics.total) * 100 : 0}%` }}
              ></div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-[#0B253F] border border-[#D9E0E7] dark:border-[#1B3754] shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#667085] dark:text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider font-sora">ASSIGNED (PENDING)</span>
              <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
              </svg>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-bold font-sora text-[#071A2B] dark:text-white">
                {metrics.assigned}
              </span>
              <span className="text-[11px] text-[#667085] dark:text-slate-400 font-medium">Ready for activate</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-amber-500 h-full"
                style={{ width: `${metrics.total > 0 ? (metrics.assigned / metrics.total) * 100 : 0}%` }}
              ></div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-[#0B253F] border border-[#D9E0E7] dark:border-[#1B3754] shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#667085] dark:text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider font-sora">ACTIVE / COMPLETED</span>
              <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-bold font-sora text-emerald-600 dark:text-emerald-400">
                {metrics.activeOrCompleted}
              </span>
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">Live participant status</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-emerald-500 h-full"
                style={{ width: `${metrics.total > 0 ? (metrics.activeOrCompleted / metrics.total) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        </section>

        {/* 3. Search and Filters Toolbar */}
        <section className="p-4 rounded-xl bg-white dark:bg-[#0B253F] border border-[#D9E0E7] dark:border-[#1B3754] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#667085] dark:text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by participant name, email, or vehicle make/model..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-[#F5F7FA] dark:bg-[#071A2B] text-[#071A2B] dark:text-white rounded-lg border border-[#D9E0E7] dark:border-[#1B3754] focus:outline-none focus:ring-2 focus:ring-[#F2B705]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Reward Status Filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <label className="font-bold text-[#667085] dark:text-slate-300 uppercase tracking-wider text-[10px] font-sora">
                Reward:
              </label>
              <select
                value={rewardStatusFilter}
                onChange={(e) => setRewardStatusFilter(e.target.value)}
                className="py-1.5 px-2.5 text-xs bg-[#F5F7FA] dark:bg-[#071A2B] text-[#071A2B] dark:text-white rounded-lg border border-[#D9E0E7] dark:border-[#1B3754] font-medium focus:outline-none focus:ring-1 focus:ring-[#F2B705]"
              >
                <option value="ALL">All Rewards</option>
                <option value="NOT_ASSIGNED">Not Assigned</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>

            {/* Account Status Filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <label className="font-bold text-[#667085] dark:text-slate-300 uppercase tracking-wider text-[10px] font-sora">
                Account:
              </label>
              <select
                value={accountStatusFilter}
                onChange={(e) => setAccountStatusFilter(e.target.value)}
                className="py-1.5 px-2.5 text-xs bg-[#F5F7FA] dark:bg-[#071A2B] text-[#071A2B] dark:text-white rounded-lg border border-[#D9E0E7] dark:border-[#1B3754] font-medium focus:outline-none focus:ring-1 focus:ring-[#F2B705]"
              >
                <option value="ALL">All Statuses</option>
                <option value="APPROVED">Approved</option>
                <option value="ACTIVE">Active</option>
                <option value="PENDING REVIEW">Pending Review</option>
                <option value="REJECTED">Rejected</option>
                <option value="DEACTIVATED">Deactivated</option>
              </select>
            </div>

            {/* Reward Type Filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <label className="font-bold text-[#667085] dark:text-slate-300 uppercase tracking-wider text-[10px] font-sora">
                Type:
              </label>
              <select
                value={rewardTypeFilter}
                onChange={(e) => setRewardTypeFilter(e.target.value)}
                className="py-1.5 px-2.5 text-xs bg-[#F5F7FA] dark:bg-[#071A2B] text-[#071A2B] dark:text-white rounded-lg border border-[#D9E0E7] dark:border-[#1B3754] font-medium focus:outline-none focus:ring-1 focus:ring-[#F2B705]"
              >
                <option value="ALL">All Types</option>
                <option value="CASH">Cash Only</option>
                <option value="VEHICLE">Vehicle Only</option>
                <option value="BOTH">Cash + Vehicle</option>
              </select>
            </div>

            {/* Reset / Clear Filters */}
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-3 py-1.5 text-xs font-semibold text-[#667085] dark:text-slate-400 hover:text-[#071A2B] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#132A42] rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>Clear Filters</span>
            </button>
          </div>
        </section>

        {/* Counter Metadata */}
        <div className="flex items-center justify-between px-1 text-xs text-[#667085] dark:text-slate-400">
          <span className="font-medium">
            Showing {filteredRewards.length} of {rewards.length} allocation records
          </span>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Direct Allocation Ledger</span>
          </div>
        </div>

        {/* 4. Main Rewards Table — Desktop (>= 1024px) */}
        <div className="hidden lg:block bg-white dark:bg-[#0B253F] rounded-xl border border-[#D9E0E7] dark:border-[#1B3754] shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F5F7FA] dark:bg-[#071A2B] text-[#667085] dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider font-sora border-b border-[#D9E0E7] dark:border-[#1B3754]">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-3">Cash Prize</th>
                <th className="py-3 px-4">Vehicle</th>
                <th className="py-3 px-3">Reward Status</th>
                <th className="py-3 px-3">Account Status</th>
                <th className="py-3 px-3">Claims</th>
                <th className="py-3 px-3">Assigned</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D9E0E7] dark:divide-[#1B3754] text-xs text-[#071A2B] dark:text-white">
              {filteredRewards.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-[#132A42]/50 transition-colors">
                  {/* User */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#071A2B] text-[#F2B705] dark:bg-[#132A42] flex items-center justify-center font-bold text-xs shrink-0 font-sora">
                        {item.userName
                          ? item.userName
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .slice(0, 2)
                          : 'U'}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-[#071A2B] dark:text-white font-sora truncate">
                          {item.userName}
                        </span>
                        <div className="flex items-center gap-1.5 text-[11px] text-[#667085] dark:text-slate-400 truncate">
                          <span className="font-mono">{item.userId}</span>
                          <span>•</span>
                          <span className="truncate">{item.userEmail}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Cash Prize */}
                  <td className="py-3.5 px-3 font-semibold font-sora">
                    {item.cashAmount ? (
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                        {formatZAR(item.cashAmount)}
                      </span>
                    ) : (
                      <span className="text-[#667085] dark:text-slate-400">—</span>
                    )}
                  </td>

                  {/* Vehicle */}
                  <td className="py-3.5 px-4">
                    {item.vehicleModel ? (
                      <div className="flex items-center gap-2.5">
                        {resolveVehicleImage(item) ? (
                          <img
                            src={resolveVehicleImage(item)}
                            alt={`${item.vehicleMake || ''} ${item.vehicleModel}`}
                            className="w-10 h-8 object-cover rounded border border-[#D9E0E7] dark:border-[#1B3754] shrink-0"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-10 h-8 rounded bg-slate-100 dark:bg-slate-800 border border-[#D9E0E7] dark:border-[#1B3754] flex items-center justify-center text-[8px] text-[#667085] dark:text-slate-400 text-center px-0.5 leading-tight">
                            No image
                          </div>
                        )}
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-[#071A2B] dark:text-white font-sora truncate">
                            {item.vehicleMake ? `${item.vehicleMake} ` : ''}{item.vehicleModel}
                          </span>
                          <span className="text-[11px] text-[#667085] dark:text-slate-400">
                            {item.vehicleYear || '2026'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-[#667085] dark:text-slate-400">—</span>
                    )}
                  </td>

                  {/* Reward Status */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    {getRewardStatusBadge(item.status)}
                  </td>

                  {/* Account Status */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    {getAccountStatusBadge(item.accountStatus)}
                  </td>

                  {/* Claims */}
                  <td className="py-3.5 px-3">
                    <div className="flex flex-col gap-1">
                      {getClaimStatusPill(item.cashClaimStatus, 'Cash')}
                      {getClaimStatusPill(item.vehicleClaimStatus, 'Vehicle')}
                    </div>
                  </td>

                  {/* Assigned / Updated */}
                  <td className="py-3.5 px-3 text-[#667085] dark:text-slate-400 whitespace-nowrap text-[11px]">
                    {item.assignedAt || item.updatedAt || '—'}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* View details */}
                      <button
                        type="button"
                        onClick={() => setDetailReward(item)}
                        title="View Allocation Dossier"
                        className="p-1.5 rounded-lg text-[#667085] dark:text-slate-400 hover:text-[#071A2B] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1B3754] transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>

                      {/* Edit reward */}
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(item)}
                        title="Edit Reward Details"
                        className="p-1.5 rounded-lg text-[#667085] dark:text-slate-400 hover:text-[#071A2B] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1B3754] transition-colors"
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
                          className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] font-sora transition-colors"
                          title="Activate Reward for User"
                        >
                          Activate
                        </button>
                      ) : item.status === 'ACTIVE' ? (
                        <button
                          type="button"
                          onClick={() => handleTriggerDeactivate(item)}
                          className="px-2 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] font-sora transition-colors"
                          title="Deactivate Reward"
                        >
                          Deactivate
                        </button>
                      ) : null}

                      {/* View User */}
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/users/${item.userId}`)}
                        title="View User Profile"
                        className="px-2 py-1 rounded bg-[#F5F7FA] dark:bg-[#071A2B] text-[#071A2B] dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1B3754] font-semibold text-[11px] font-sora transition-colors"
                      >
                        User
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 4b. Responsive Card Deck — Mobile & Tablet (< 1024px) */}
        <div className="lg:hidden flex flex-col gap-3">
          {filteredRewards.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-xl bg-white dark:bg-[#0B253F] border border-[#D9E0E7] dark:border-[#1B3754] shadow-sm flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#071A2B] text-[#F2B705] dark:bg-[#132A42] flex items-center justify-center font-bold text-xs shrink-0 font-sora">
                    {item.userName
                      ? item.userName
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)
                      : 'U'}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#071A2B] dark:text-white font-sora">
                      {item.userName}
                    </h3>
                    <p className="text-[11px] text-[#667085] dark:text-slate-400">
                      {item.userId} • {item.userEmail}
                    </p>
                  </div>
                </div>
                <div>{getRewardStatusBadge(item.status)}</div>
              </div>

              {/* Allocations summary */}
              <div className="grid grid-cols-2 gap-2 p-3 rounded-lg bg-[#F5F7FA] dark:bg-[#071A2B] text-xs">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-[#667085] dark:text-slate-400 font-sora">
                    Cash Prize
                  </span>
                  <span className="font-bold font-sora text-emerald-700 dark:text-emerald-400">
                    {item.cashAmount ? formatZAR(item.cashAmount) : '—'}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-[#667085] dark:text-slate-400 font-sora">
                    Vehicle Prize
                  </span>
                  <span className="font-semibold text-[#071A2B] dark:text-white truncate block">
                    {item.vehicleModel ? `${item.vehicleMake || ''} ${item.vehicleModel}` : '—'}
                  </span>
                </div>
              </div>

              {/* Vehicle thumbnail if available */}
              {resolveVehicleImage(item) && (
                <div className="flex items-center gap-3 p-2 rounded-lg border border-[#D9E0E7] dark:border-[#1B3754]">
                  <img
                    src={resolveVehicleImage(item)}
                    alt="Vehicle"
                    className="w-16 h-11 object-cover rounded"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <div className="text-xs">
                    <span className="font-semibold block text-[#071A2B] dark:text-white">
                      {item.vehicleYear || '2026'} {item.vehicleMake} {item.vehicleModel}
                    </span>
                    <span className="text-[10px] text-[#667085] dark:text-slate-400">
                      Homologated Fleet Spec
                    </span>
                  </div>
                </div>
              )}

              {/* Claim Status and Account Status */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#D9E0E7] dark:border-[#1B3754]">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#667085] dark:text-slate-400 font-bold uppercase">
                    Account:
                  </span>
                  {getAccountStatusBadge(item.accountStatus)}
                </div>
                <div className="flex items-center gap-1.5">
                  {getClaimStatusPill(item.cashClaimStatus, 'Cash')}
                  {getClaimStatusPill(item.vehicleClaimStatus, 'Veh')}
                </div>
              </div>

              {/* Mobile Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#D9E0E7] dark:border-[#1B3754]">
                <button
                  type="button"
                  onClick={() => setDetailReward(item)}
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
                  View User
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* 5. Empty State */}
        {filteredRewards.length === 0 && (
          <div className="p-12 text-center bg-white dark:bg-[#0B253F] rounded-xl border border-[#D9E0E7] dark:border-[#1B3754] flex flex-col items-center justify-center gap-3 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[#667085] dark:text-slate-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-base font-bold font-sora text-[#071A2B] dark:text-white">
              No Allocation Records Found
            </h3>
            <p className="text-xs text-[#667085] dark:text-slate-400 max-w-sm">
              No participant rewards match your active keyword search or filters. Adjust your search criteria or reset filters.
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="mt-2 px-4 py-2 rounded-lg bg-[#071A2B] dark:bg-white text-white dark:text-[#071A2B] font-bold text-xs font-sora hover:opacity-90 transition-opacity cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Statutory Internal Footer */}
        <footer className="p-4 rounded-xl bg-white dark:bg-[#0B253F] border border-[#D9E0E7] dark:border-[#1B3754] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#667085] dark:text-slate-400">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>POPIA Section 18 Compliance &amp; National Treasury Allocation Governance</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <button
              type="button"
              onClick={() => navigate('/admin/audit-logs')}
              className="hover:underline text-left cursor-pointer"
            >
              Audit Ledger
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/claims')}
              className="hover:underline text-left cursor-pointer"
            >
              View Claims
            </button>
          </div>
        </footer>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: ASSIGN REWARD WIZARD (Multi-Step matching Stitch reference)      */}
      {/* ========================================================================= */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 bg-[#071A2B]/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0B253F] rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] border border-[#D9E0E7] dark:border-[#1B3754]">
            {/* Header */}
            <div className="px-6 py-4 bg-[#F5F7FA] dark:bg-[#071A2B] flex items-center justify-between border-b border-[#D9E0E7] dark:border-[#1B3754]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#F2B705] font-sora">
                  ALLOCATION WIZARD
                </span>
                <h2 className="text-base sm:text-lg font-bold font-sora text-[#071A2B] dark:text-white">
                  Assign Reward to Participant
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className="p-1 rounded-lg text-[#667085] dark:text-slate-400 hover:text-[#071A2B] dark:hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Step Indicator */}
            <div className="px-6 py-3 bg-[#EEF2F6] dark:bg-[#091E33] flex items-center justify-between text-xs font-semibold border-b border-[#D9E0E7] dark:border-[#1B3754]">
              <div className="flex items-center gap-2">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    assignStep === 1
                      ? 'bg-[#071A2B] dark:bg-white text-white dark:text-[#071A2B]'
                      : 'bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  1
                </span>
                <span className={assignStep === 1 ? 'text-[#071A2B] dark:text-white font-bold' : 'text-[#667085] dark:text-slate-400'}>
                  Select User
                </span>
              </div>
              <span className="text-[#667085] dark:text-slate-500">›</span>

              <div className="flex items-center gap-2">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    assignStep === 2
                      ? 'bg-[#071A2B] dark:bg-white text-white dark:text-[#071A2B]'
                      : 'bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  2
                </span>
                <span className={assignStep === 2 ? 'text-[#071A2B] dark:text-white font-bold' : 'text-[#667085] dark:text-slate-400'}>
                  Cash Prize
                </span>
              </div>
              <span className="text-[#667085] dark:text-slate-500">›</span>

              <div className="flex items-center gap-2">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    assignStep === 3
                      ? 'bg-[#071A2B] dark:bg-white text-white dark:text-[#071A2B]'
                      : 'bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  3
                </span>
                <span className={assignStep === 3 ? 'text-[#071A2B] dark:text-white font-bold' : 'text-[#667085] dark:text-slate-400'}>
                  Vehicle Prize
                </span>
              </div>
              <span className="text-[#667085] dark:text-slate-500">›</span>

              <div className="flex items-center gap-2">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    assignStep === 4
                      ? 'bg-[#071A2B] dark:bg-white text-white dark:text-[#071A2B]'
                      : 'bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  4
                </span>
                <span className={assignStep === 4 ? 'text-[#071A2B] dark:text-white font-bold' : 'text-[#667085] dark:text-slate-400'}>
                  Review
                </span>
              </div>
            </div>

            {/* Error Banner */}
            {assignError && (
              <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-semibold">
                {assignError}
              </div>
            )}

            {/* Body Steps */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {/* STEP 1: Select User */}
              {assignStep === 1 && (
                <div className="space-y-3">
                  <p className="text-xs text-[#667085] dark:text-slate-300">
                    Select an approved participant account currently eligible for reward allocation:
                  </p>
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {eligibleUsersForAssignment.map((u) => (
                      <label
                        key={u.id}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                          assignFormData.userId === u.id
                            ? 'border-[#F2B705] bg-amber-50/50 dark:bg-amber-950/20'
                            : 'border-[#D9E0E7] dark:border-[#1B3754] bg-[#F5F7FA] dark:bg-[#071A2B] hover:border-slate-400'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="assign-user"
                            checked={assignFormData.userId === u.id}
                            onChange={() => setAssignFormData({ ...assignFormData, userId: u.id })}
                            className="text-[#F2B705] focus:ring-[#F2B705]"
                          />
                          <div>
                            <span className="font-bold text-xs sm:text-sm text-[#071A2B] dark:text-white font-sora block">
                              {u.name}
                            </span>
                            <span className="text-[11px] text-[#667085] dark:text-slate-400">
                              {u.id} • {u.email}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getAccountStatusBadge(u.status)}
                          <span className="text-[10px] text-[#667085] dark:text-slate-400 font-mono">
                            {u.rewardStatus || 'NOT ASSIGNED'}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                  {eligibleUsersForAssignment.length === 0 && (
                    <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 text-xs">
                      No approved users available without an active reward. Please approve user accounts first in Users management.
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2: Cash Prize */}
              {assignStep === 2 && (
                <div className="space-y-4">
                  <p className="text-xs text-[#667085] dark:text-slate-300">
                    Configure the cash prize portion of this allocation (ZAR):
                  </p>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#071A2B] dark:text-white block font-sora">
                      Cash Amount (ZAR)
                    </label>
                    <div className="flex items-center rounded-lg bg-[#F5F7FA] dark:bg-[#071A2B] border border-[#D9E0E7] dark:border-[#1B3754] overflow-hidden">
                      <span className="px-3 py-2 text-xs font-bold text-[#667085] dark:text-slate-400 bg-[#EEF2F6] dark:bg-[#091E33] border-r border-[#D9E0E7] dark:border-[#1B3754]">
                        R
                      </span>
                      <input
                        type="number"
                        step="25000"
                        value={assignFormData.cashAmount || ''}
                        onChange={(e) =>
                          setAssignFormData({
                            ...assignFormData,
                            cashAmount: e.target.value ? Number(e.target.value) : 0,
                          })
                        }
                        className="w-full px-3 py-2 text-sm bg-transparent text-[#071A2B] dark:text-white font-bold font-sora focus:outline-none"
                      />
                      <span className="px-3 py-2 text-xs font-bold text-[#667085] dark:text-slate-400">
                        ZAR
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-[10px] text-[#667085] dark:text-slate-400 font-semibold uppercase">
                        Standard Tiers:
                      </span>
                      {[100000, 250000, 500000, 1000000].map((tier) => (
                        <button
                          key={tier}
                          type="button"
                          onClick={() => setAssignFormData({ ...assignFormData, cashAmount: tier })}
                          className={`px-2 py-0.5 rounded text-[11px] font-bold font-sora border transition-colors ${
                            assignFormData.cashAmount === tier
                              ? 'bg-[#071A2B] text-white border-[#071A2B] dark:bg-white dark:text-[#071A2B]'
                              : 'bg-white dark:bg-[#071A2B] text-[#667085] dark:text-slate-300 border-[#D9E0E7] dark:border-[#1B3754] hover:border-slate-400'
                          }`}
                        >
                          {formatZAR(tier)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-[#F5F7FA] dark:bg-[#071A2B] border border-[#D9E0E7] dark:border-[#1B3754] text-xs text-[#667085] dark:text-slate-400">
                    Disbursed directly via South African EFT following identity and claim requirement verification.
                  </div>
                </div>
              )}

              {/* STEP 3: Vehicle Prize */}
              {assignStep === 3 && (
                <div className="space-y-4">
                  <p className="text-xs text-[#667085] dark:text-slate-300">
                    Configure vehicle prize allocation parameters and select vehicle photography asset:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-[#071A2B] dark:text-white block mb-1 font-sora">
                        Make *
                      </label>
                      <input
                        type="text"
                        value={assignFormData.vehicleMake}
                        onChange={(e) => setAssignFormData({ ...assignFormData, vehicleMake: e.target.value })}
                        className="w-full px-3 py-2 text-xs sm:text-sm bg-[#F5F7FA] dark:bg-[#071A2B] text-[#071A2B] dark:text-white rounded-lg border border-[#D9E0E7] dark:border-[#1B3754] font-semibold focus:outline-none focus:ring-2 focus:ring-[#F2B705]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[#071A2B] dark:text-white block mb-1 font-sora">
                        Model *
                      </label>
                      <input
                        type="text"
                        value={assignFormData.vehicleModel}
                        onChange={(e) => setAssignFormData({ ...assignFormData, vehicleModel: e.target.value })}
                        className="w-full px-3 py-2 text-xs sm:text-sm bg-[#F5F7FA] dark:bg-[#071A2B] text-[#071A2B] dark:text-white rounded-lg border border-[#D9E0E7] dark:border-[#1B3754] font-semibold focus:outline-none focus:ring-2 focus:ring-[#F2B705]"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-[#071A2B] dark:text-white block mb-1 font-sora">
                        Model Year *
                      </label>
                      <input
                        type="number"
                        value={assignFormData.vehicleYear}
                        onChange={(e) => setAssignFormData({ ...assignFormData, vehicleYear: Number(e.target.value) })}
                        className="w-full px-3 py-2 text-xs sm:text-sm bg-[#F5F7FA] dark:bg-[#071A2B] text-[#071A2B] dark:text-white rounded-lg border border-[#D9E0E7] dark:border-[#1B3754] font-semibold focus:outline-none focus:ring-2 focus:ring-[#F2B705]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[#071A2B] dark:text-white block mb-1 font-sora">
                        Custom Image URL (Optional)
                      </label>
                      <input
                        type="url"
                        placeholder="https://..."
                        value={assignFormData.vehicleImage}
                        onChange={(e) => setAssignFormData({ ...assignFormData, vehicleImage: e.target.value })}
                        className="w-full px-3 py-2 text-xs sm:text-sm bg-[#F5F7FA] dark:bg-[#071A2B] text-[#071A2B] dark:text-white rounded-lg border border-[#D9E0E7] dark:border-[#1B3754] focus:outline-none focus:ring-2 focus:ring-[#F2B705]"
                      />
                    </div>
                  </div>

                  {/* Specimen selector */}
                  <div>
                    <label className="text-xs font-bold text-[#071A2B] dark:text-white block mb-2 font-sora">
                      Standard Vehicle Photography Specimens:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {VEHICLE_SPECIMENS.map((spec) => (
                        <div
                          key={spec.id}
                          onClick={() => setAssignFormData({ ...assignFormData, vehicleImage: spec.url })}
                          className={`p-1.5 rounded-xl border-2 cursor-pointer transition-all ${
                            assignFormData.vehicleImage === spec.url
                              ? 'border-[#F2B705] bg-amber-50/50 dark:bg-amber-950/20'
                              : 'border-[#D9E0E7] dark:border-[#1B3754] bg-[#F5F7FA] dark:bg-[#071A2B] hover:border-slate-400'
                          }`}
                        >
                          <img
                            src={spec.url}
                            alt={spec.label}
                            className="w-full h-20 object-cover rounded-lg"
                          />
                          <span className="block mt-1.5 text-[11px] font-bold text-[#071A2B] dark:text-white text-center font-sora">
                            {spec.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Selected Image Preview */}
                  {assignFormData.vehicleImage ? (
                    <div className="p-3 rounded-xl border border-[#D9E0E7] dark:border-[#1B3754] bg-[#F5F7FA] dark:bg-[#071A2B] space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[#667085] dark:text-slate-400 font-sora uppercase">
                          Selected Vehicle Image Preview
                        </span>
                        <span className="text-[10px] text-[#00843D] font-semibold">Active Selection</span>
                      </div>
                      <div className="relative w-full h-36 rounded-lg overflow-hidden bg-slate-900 border border-[#D9E0E7] dark:border-[#1B3754]">
                        <img
                          src={assignFormData.vehicleImage}
                          alt="Vehicle preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              {/* STEP 4: Review & Confirm */}
              {assignStep === 4 && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-[#F5F7FA] dark:bg-[#071A2B] border border-[#D9E0E7] dark:border-[#1B3754] space-y-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#F2B705] font-sora">
                      REWARD SPECIFICATION PREVIEW
                    </span>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#667085] dark:text-slate-400">Allocated Recipient:</span>
                      <span className="font-bold text-[#071A2B] dark:text-white font-sora">
                        {users.find((u) => u.id === assignFormData.userId)?.name} ({assignFormData.userId})
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#667085] dark:text-slate-400">Cash Component:</span>
                      <span className="font-bold font-sora text-emerald-700 dark:text-emerald-400">
                        {assignFormData.cashAmount ? `${formatZAR(assignFormData.cashAmount)} ZAR` : 'None'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#667085] dark:text-slate-400">Vehicle Component:</span>
                      <span className="font-bold text-[#071A2B] dark:text-white font-sora">
                        {assignFormData.vehicleModel
                          ? `${assignFormData.vehicleYear} ${assignFormData.vehicleMake} ${assignFormData.vehicleModel}`
                          : 'None'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#667085] dark:text-slate-400">Initial Reward State:</span>
                      <span className="font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/50 text-amber-900 dark:text-amber-300">
                        ASSIGNED (Pending Activation)
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-[#667085] dark:text-slate-400 leading-relaxed">
                    By assigning this reward, the specification is saved to the WinDriveSA verified allocation ledger.
                    The participant's account status remains separate and will require manual administrator activation
                    before claims can be submitted.
                  </p>
                </div>
              )}
            </div>

            {/* Footer buttons */}
            <div className="px-6 py-4 bg-[#F5F7FA] dark:bg-[#071A2B] flex items-center justify-between border-t border-[#D9E0E7] dark:border-[#1B3754]">
              {assignStep > 1 ? (
                <button
                  type="button"
                  onClick={handlePrevAssignStep}
                  className="px-4 py-2 text-xs font-bold font-sora text-[#667085] dark:text-slate-300 hover:text-[#071A2B] dark:hover:text-white transition-colors"
                >
                  Back
                </button>
              ) : (
                <div></div>
              )}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-200 dark:bg-slate-800 text-[#071A2B] dark:text-slate-300 hover:bg-slate-300 transition-colors"
                >
                  Cancel
                </button>
                {assignStep < 4 ? (
                  <button
                    type="button"
                    onClick={handleNextAssignStep}
                    className="px-5 py-2 text-xs font-bold font-sora rounded-lg bg-[#071A2B] dark:bg-white text-white dark:text-[#071A2B] hover:opacity-90 transition-opacity"
                  >
                    Next Step
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmitAssign}
                    className="px-5 py-2 text-xs font-bold font-sora rounded-lg bg-[#F2B705] hover:bg-[#d9a404] text-[#071A2B] transition-colors shadow-sm"
                  >
                    Confirm &amp; Assign Reward
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: EDIT REWARD DETAILS                                              */}
      {/* ========================================================================= */}
      {editingReward && (
        <div className="fixed inset-0 bg-[#071A2B]/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0B253F] rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col border border-[#D9E0E7] dark:border-[#1B3754]">
            <div className="px-6 py-4 bg-[#F5F7FA] dark:bg-[#071A2B] flex items-center justify-between border-b border-[#D9E0E7] dark:border-[#1B3754]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#F2B705] font-sora">
                  AUDIT SPECIFICATION
                </span>
                <h2 className="text-base sm:text-lg font-bold font-sora text-[#071A2B] dark:text-white">
                  Edit Reward Details
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setEditingReward(null)}
                className="p-1 rounded-lg text-[#667085] dark:text-slate-400 hover:text-[#071A2B] dark:hover:text-white"
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

            <form onSubmit={handleSubmitEdit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-[#071A2B] dark:text-white block mb-1 font-sora">
                  Participant (Read Only)
                </label>
                <input
                  type="text"
                  readOnly
                  value={`${editingReward.userName} (${editingReward.userId})`}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-100 dark:bg-[#071A2B]/60 text-[#667085] dark:text-slate-400 rounded-lg border border-[#D9E0E7] dark:border-[#1B3754] font-semibold cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#071A2B] dark:text-white block mb-1 font-sora">
                  Cash Prize Amount (ZAR)
                </label>
                <div className="flex items-center rounded-lg bg-[#F5F7FA] dark:bg-[#071A2B] border border-[#D9E0E7] dark:border-[#1B3754] overflow-hidden">
                  <span className="px-3 py-2 text-xs font-bold text-[#667085] dark:text-slate-400 bg-[#EEF2F6] dark:bg-[#091E33] border-r border-[#D9E0E7] dark:border-[#1B3754]">
                    R
                  </span>
                  <input
                    type="number"
                    step="25000"
                    value={editFormData.cashAmount || ''}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        cashAmount: e.target.value ? Number(e.target.value) : 0,
                      })
                    }
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-transparent text-[#071A2B] dark:text-white font-bold font-sora focus:outline-none"
                  />
                  <span className="px-3 py-2 text-xs font-bold text-[#667085] dark:text-slate-400">
                    ZAR
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#071A2B] dark:text-white block mb-1 font-sora">
                    Vehicle Make
                  </label>
                  <input
                    type="text"
                    value={editFormData.vehicleMake}
                    onChange={(e) => setEditFormData({ ...editFormData, vehicleMake: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-[#F5F7FA] dark:bg-[#071A2B] text-[#071A2B] dark:text-white rounded-lg border border-[#D9E0E7] dark:border-[#1B3754] font-semibold focus:outline-none focus:ring-2 focus:ring-[#F2B705]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#071A2B] dark:text-white block mb-1 font-sora">
                    Model Year
                  </label>
                  <input
                    type="number"
                    value={editFormData.vehicleYear}
                    onChange={(e) => setEditFormData({ ...editFormData, vehicleYear: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-[#F5F7FA] dark:bg-[#071A2B] text-[#071A2B] dark:text-white rounded-lg border border-[#D9E0E7] dark:border-[#1B3754] font-semibold focus:outline-none focus:ring-2 focus:ring-[#F2B705]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#071A2B] dark:text-white block mb-1 font-sora">
                  Vehicle Model
                </label>
                <input
                  type="text"
                  value={editFormData.vehicleModel}
                  onChange={(e) => setEditFormData({ ...editFormData, vehicleModel: e.target.value })}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-[#F5F7FA] dark:bg-[#071A2B] text-[#071A2B] dark:text-white rounded-lg border border-[#D9E0E7] dark:border-[#1B3754] font-semibold focus:outline-none focus:ring-2 focus:ring-[#F2B705]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#071A2B] dark:text-white block mb-1 font-sora">
                  Vehicle Image URL
                </label>
                <input
                  type="url"
                  value={editFormData.vehicleImage}
                  onChange={(e) => setEditFormData({ ...editFormData, vehicleImage: e.target.value })}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-[#F5F7FA] dark:bg-[#071A2B] text-[#071A2B] dark:text-white rounded-lg border border-[#D9E0E7] dark:border-[#1B3754] focus:outline-none focus:ring-2 focus:ring-[#F2B705]"
                />
              </div>

              {/* Standard White Hilux Specimens */}
              <div>
                <label className="text-xs font-bold text-[#071A2B] dark:text-white block mb-1.5 font-sora">
                  Standard White Toyota Hilux Specimens:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {WHITE_HILUX_SPECIMENS.map((spec) => (
                    <button
                      key={spec.id}
                      type="button"
                      onClick={() => setEditFormData({ ...editFormData, vehicleImage: spec.url })}
                      className={`p-1.5 rounded-lg border-2 text-left cursor-pointer transition-all flex items-center gap-2.5 ${
                        editFormData.vehicleImage === spec.url
                          ? 'border-[#F2B705] bg-amber-50/60 dark:bg-amber-950/30'
                          : 'border-[#D9E0E7] dark:border-[#1B3754] bg-[#F5F7FA] dark:bg-[#071A2B] hover:border-slate-400'
                      }`}
                    >
                      <img src={spec.url} alt={spec.shortLabel} className="w-12 h-9 object-cover rounded shrink-0" />
                      <div className="min-w-0">
                        <span className="block text-[11px] font-bold text-[#071A2B] dark:text-white truncate font-sora">
                          {spec.shortLabel}
                        </span>
                        <span className="block text-[9px] text-[#667085] dark:text-slate-400">
                          {spec.isPrimary ? 'White Showroom Spec' : 'White Front GR Spec'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected Image Preview */}
              {editFormData.vehicleImage ? (
                <div className="p-2.5 rounded-xl border border-[#D9E0E7] dark:border-[#1B3754] bg-[#F5F7FA] dark:bg-[#071A2B] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#667085] dark:text-slate-400 block font-sora uppercase">
                      Vehicle Image Preview
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditFormData({ ...editFormData, vehicleImage: '' })}
                      className="text-[10px] text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                    >
                      Clear Image
                    </button>
                  </div>
                  <div className="relative w-full h-32 rounded-lg overflow-hidden bg-slate-900 border border-[#D9E0E7] dark:border-[#1B3754]">
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
              ) : null}

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#D9E0E7] dark:border-[#1B3754]">
                <button
                  type="button"
                  onClick={() => setEditingReward(null)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-200 dark:bg-slate-800 text-[#071A2B] dark:text-slate-300 hover:bg-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold font-sora rounded-lg bg-[#071A2B] dark:bg-white text-white dark:text-[#071A2B] hover:opacity-90 transition-opacity"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ACTIVATE CONFIRMATION MODAL                                      */}
      {/* ========================================================================= */}
      {rewardToActivate && (
        <div className="fixed inset-0 bg-[#071A2B]/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0B253F] rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col p-6 gap-4 border border-[#D9E0E7] dark:border-[#1B3754]">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold font-sora text-[#071A2B] dark:text-white">
                Activate Reward?
              </h3>
              <p className="text-xs text-[#667085] dark:text-slate-300 leading-relaxed">
                This will make the assigned reward available to the approved user ({rewardToActivate.userName}).
                The participant will immediately be eligible to initiate claim requests in their account portal.
              </p>

              {rewardToActivate.accountStatus === 'PENDING REVIEW' && (
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300 text-xs font-semibold">
                  User approval required before activating a reward.
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
                onClick={() => setRewardToActivate(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-200 dark:bg-slate-800 text-[#071A2B] dark:text-slate-300 hover:bg-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmActivate}
                className="px-5 py-2 text-xs font-bold font-sora rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm"
              >
                Activate Reward
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: DEACTIVATE CONFIRMATION MODAL                                    */}
      {/* ========================================================================= */}
      {rewardToDeactivate && (
        <div className="fixed inset-0 bg-[#071A2B]/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0B253F] rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col p-6 gap-4 border border-[#D9E0E7] dark:border-[#1B3754]">
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold font-sora text-[#071A2B] dark:text-white">
                Deactivate Reward?
              </h3>
              <p className="text-xs text-[#667085] dark:text-slate-300 leading-relaxed">
                This will deactivate the current reward for {rewardToDeactivate.userName} while preserving the underlying allocation record for statutory audit governance. Participant portal claim requests will be frozen.
              </p>
              <p className="text-[11px] text-[#667085] dark:text-slate-400 italic">
                Note: Deactivation changes only the reward status. It does not modify the user's account status.
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
                onClick={() => setRewardToDeactivate(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-200 dark:bg-slate-800 text-[#071A2B] dark:text-slate-300 hover:bg-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeactivate}
                className="px-5 py-2 text-xs font-bold font-sora rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition-colors shadow-sm"
              >
                Deactivate Reward
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DRAWER: ALLOCATION DOSSIER (DETAIL VIEW)                                  */}
      {/* ========================================================================= */}
      {detailReward && (
        <div className="fixed inset-0 bg-[#071A2B]/60 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-md bg-white dark:bg-[#0B253F] h-full shadow-2xl flex flex-col overflow-y-auto border-l border-[#D9E0E7] dark:border-[#1B3754]">
            {/* Drawer Header */}
            <div className="p-6 bg-[#F5F7FA] dark:bg-[#071A2B] flex items-center justify-between border-b border-[#D9E0E7] dark:border-[#1B3754]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#F2B705] font-sora">
                  ALLOCATION DOSSIER
                </span>
                <h2 className="text-lg font-bold font-sora text-[#071A2B] dark:text-white">
                  {detailReward.userName}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setDetailReward(null)}
                className="p-1 rounded-lg text-[#667085] dark:text-slate-400 hover:text-[#071A2B] dark:hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-6 space-y-5 flex-1">
              {/* Account Identification */}
              <div className="p-4 rounded-xl bg-[#F5F7FA] dark:bg-[#071A2B] border border-[#D9E0E7] dark:border-[#1B3754] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#667085] dark:text-slate-400">Record ID:</span>
                  <span className="font-mono font-bold text-[#071A2B] dark:text-white">{detailReward.id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#667085] dark:text-slate-400">Participant ID:</span>
                  <span className="font-mono font-bold text-[#071A2B] dark:text-white">{detailReward.userId}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#667085] dark:text-slate-400">Email:</span>
                  <span className="font-semibold text-[#071A2B] dark:text-white truncate">{detailReward.userEmail}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#667085] dark:text-slate-400">Account Status:</span>
                  {getAccountStatusBadge(detailReward.accountStatus)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#667085] dark:text-slate-400">Reward Status:</span>
                  {getRewardStatusBadge(detailReward.status)}
                </div>
              </div>

              {/* Cash Component */}
              <div className="p-4 rounded-xl bg-[#F5F7FA] dark:bg-[#071A2B] border border-[#D9E0E7] dark:border-[#1B3754] space-y-2 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#F2B705] font-sora block">
                  CASH PRIZE ALLOCATION
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-[#667085] dark:text-slate-400">Amount:</span>
                  <span className="text-base font-bold font-sora text-emerald-700 dark:text-emerald-400">
                    {detailReward.cashAmount ? formatZAR(detailReward.cashAmount) : 'None'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#667085] dark:text-slate-400">Currency:</span>
                  <span className="font-bold text-[#071A2B] dark:text-white">ZAR (South African Rand)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#667085] dark:text-slate-400">Cash Claim Status:</span>
                  {getClaimStatusPill(detailReward.cashClaimStatus, 'Cash')}
                </div>
              </div>

              {/* Vehicle Component */}
              <div className="p-4 rounded-xl bg-[#F5F7FA] dark:bg-[#071A2B] border border-[#D9E0E7] dark:border-[#1B3754] space-y-3 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#F2B705] font-sora block">
                  VEHICLE PRIZE ALLOCATION
                </span>
                {detailReward.vehicleModel ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-[#667085] dark:text-slate-400">Allocation:</span>
                      <span className="font-bold text-[#071A2B] dark:text-white font-sora">
                        {detailReward.vehicleYear || 2026} {detailReward.vehicleMake} {detailReward.vehicleModel}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#667085] dark:text-slate-400">Vehicle Claim Status:</span>
                      {getClaimStatusPill(detailReward.vehicleClaimStatus, 'Vehicle')}
                    </div>

                    {resolveVehicleImage(detailReward) ? (
                      <div className="space-y-1">
                        <img
                          src={resolveVehicleImage(detailReward)}
                          alt="Vehicle"
                          className="w-full h-36 object-cover rounded-lg border border-[#D9E0E7] dark:border-[#1B3754]"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        <span className="text-[10px] text-[#667085] dark:text-slate-400 text-center block">
                          Official Model Homologation Image
                        </span>
                      </div>
                    ) : (
                      <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-800 text-center text-xs text-[#667085] dark:text-slate-400 italic">
                        Vehicle image not available
                      </div>
                    )}
                  </>
                ) : (
                  <span className="text-[#667085] dark:text-slate-400">No vehicle prize allocated.</span>
                )}
              </div>

              {/* Audit Timestamps */}
              <div className="text-[11px] text-[#667085] dark:text-slate-400 space-y-1 pt-2">
                <div>Assigned Date: {detailReward.assignedAt || '—'}</div>
                <div>Last Updated: {detailReward.updatedAt || '—'}</div>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 bg-[#F5F7FA] dark:bg-[#071A2B] flex items-center justify-between gap-3 border-t border-[#D9E0E7] dark:border-[#1B3754]">
              <button
                type="button"
                onClick={() => navigate(`/admin/users/${detailReward.userId}`)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-white dark:bg-[#132A42] border border-[#D9E0E7] dark:border-[#1B3754] text-[#071A2B] dark:text-white hover:bg-slate-100 transition-colors"
              >
                View User Profile
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin/claims')}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-white dark:bg-[#132A42] border border-[#D9E0E7] dark:border-[#1B3754] text-[#071A2B] dark:text-white hover:bg-slate-100 transition-colors"
              >
                View Claims
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
