import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AdminShell from '../../components/admin/AdminShell';
import {
  listUsers,
  updateUserAccountStatus,
  getUserMetrics,
} from '../../services/users';

export default function AdminUsers() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Load user data from real database service
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(() => getUserMetrics([]));

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'ALL');
  const [rewardFilter, setRewardFilter] = useState(searchParams.get('reward') || 'ALL');
  const [sortBy, setSortBy] = useState('NEWEST');

  // Row context menu tracking (by user ID)
  const [openMenuUserId, setOpenMenuUserId] = useState(null);

  // Confirmation Modals State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: null, // 'APPROVE' | 'REJECT' | 'ACTIVATE' | 'DEACTIVATE'
    user: null,
  });

  // Admin Feedback Toast State
  const [toast, setToast] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'success', // 'success' | 'amber' | 'rose'
  });

  // Auto-dismiss toast
  useEffect(() => {
    if (toast.visible) {
      const timer = setTimeout(() => {
        setToast((prev) => ({ ...prev, visible: false }));
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast.visible]);

  const showToast = (title, message, type = 'success') => {
    setToast({
      visible: true,
      title,
      message,
      type,
    });
  };

  // Close row dropdown when clicking outside
  useEffect(() => {
    const handleWindowClick = () => {
      if (openMenuUserId) setOpenMenuUserId(null);
    };
    window.addEventListener('click', handleWindowClick);
    return () => window.removeEventListener('click', handleWindowClick);
  }, [openMenuUserId]);

  // Sync users list from real Supabase service
  const refreshUserData = async () => {
    try {
      const { data } = await listUsers();
      const fresh = data || [];
      setUsers(fresh);
      setMetrics(getUserMetrics(fresh));
    } catch (err) {
      console.error('Failed to load user directory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUserData();
  }, []);

  // Filtered and Sorted Users
  const filteredUsers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return users
      .filter((u) => {
        // Search matches: Full Name, Email Address, Mobile Number, or ID
        const matchesQuery =
          !query ||
          u.name.toLowerCase().includes(query) ||
          u.email.toLowerCase().includes(query) ||
          u.phone.toLowerCase().includes(query) ||
          u.id.toLowerCase().includes(query);

        // Account Status Filter
        let matchesStatus = true;
        if (statusFilter !== 'ALL') {
          if (statusFilter === 'PENDING REVIEW') matchesStatus = u.status === 'PENDING REVIEW';
          else if (statusFilter === 'APPROVED') matchesStatus = u.status === 'APPROVED';
          else if (statusFilter === 'ACTIVE') matchesStatus = u.status === 'ACTIVE';
          else if (statusFilter === 'REJECTED') matchesStatus = u.status === 'REJECTED';
          else if (statusFilter === 'DEACTIVATED') {
            matchesStatus = u.status === 'DEACTIVATED' || u.status === 'INACTIVE';
          }
        }

        // Reward Status Filter
        let matchesReward = true;
        if (rewardFilter !== 'ALL') {
          if (rewardFilter === 'NOT ASSIGNED') matchesReward = u.rewardStatus === 'NOT ASSIGNED' || !u.rewardStatus;
          else if (rewardFilter === 'ASSIGNED') matchesReward = u.rewardStatus === 'ASSIGNED';
          else if (rewardFilter === 'ACTIVE') matchesReward = u.rewardStatus === 'ACTIVE';
          else if (rewardFilter === 'COMPLETED') matchesReward = u.rewardStatus === 'COMPLETED';
        }

        return matchesQuery && matchesStatus && matchesReward;
      })
      .sort((a, b) => {
        if (sortBy === 'AZ') {
          return a.name.localeCompare(b.name);
        }
        if (sortBy === 'OLDEST') {
          return new Date(a.createdDate) - new Date(b.createdDate);
        }
        if (sortBy === 'STATUS') {
          return a.status.localeCompare(b.status);
        }
        // Default: NEWEST
        return new Date(b.createdDate) - new Date(a.createdDate);
      });
  }, [users, searchTerm, statusFilter, rewardFilter, sortBy]);

  // Clear all filters handler
  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setRewardFilter('ALL');
    setSortBy('NEWEST');
    setSearchParams({});
    showToast('Filters Cleared', 'Displaying all registered user records.', 'neutral');
  };

  const isFilterActive = searchTerm.trim() !== '' || statusFilter !== 'ALL' || rewardFilter !== 'ALL';

  // Navigation handlers
  const handleCreateUser = () => {
    navigate('/admin/users/create');
  };

  const handleViewUser = (id, e) => {
    if (e) e.stopPropagation();
    navigate(`/admin/users/${id}`);
  };

  const handleViewRewards = (e) => {
    if (e) e.stopPropagation();
    navigate('/admin/rewards');
  };

  const handleViewClaims = (e) => {
    if (e) e.stopPropagation();
    navigate('/admin/claims');
  };

  // Confirmation modal triggers
  const promptApprove = (user, e) => {
    if (e) e.stopPropagation();
    setOpenMenuUserId(null);
    setConfirmModal({
      isOpen: true,
      type: 'APPROVE',
      user,
    });
  };

  const promptReject = (user, e) => {
    if (e) e.stopPropagation();
    setOpenMenuUserId(null);
    setConfirmModal({
      isOpen: true,
      type: 'REJECT',
      user,
    });
  };

  const promptActivate = (user, e) => {
    if (e) e.stopPropagation();
    setOpenMenuUserId(null);
    setConfirmModal({
      isOpen: true,
      type: 'ACTIVATE',
      user,
    });
  };

  const promptDeactivate = (user, e) => {
    if (e) e.stopPropagation();
    setOpenMenuUserId(null);
    setConfirmModal({
      isOpen: true,
      type: 'DEACTIVATE',
      user,
    });
  };

  const handleCloseConfirmModal = () => {
    setConfirmModal({ isOpen: false, type: null, user: null });
  };

  // Execution of status updates
  const handleExecuteStatusChange = async () => {
    const { type, user } = confirmModal;
    if (!user) return;

    let targetStatus = user.status;
    let successTitle = '';
    let successMsg = '';
    let toastType = 'success';

    if (type === 'APPROVE') {
      targetStatus = 'APPROVED';
      successTitle = 'User Approved';
      successMsg = `Account for ${user.name} (${user.id}) has been approved.`;
    } else if (type === 'REJECT') {
      targetStatus = 'REJECTED';
      successTitle = 'User Rejected';
      successMsg = `Account for ${user.name} has been marked as rejected.`;
      toastType = 'rose';
    } else if (type === 'ACTIVATE') {
      targetStatus = 'ACTIVE';
      successTitle = 'User Activated';
      successMsg = `Account for ${user.name} is now active.`;
    } else if (type === 'DEACTIVATE') {
      targetStatus = 'DEACTIVATED';
      successTitle = 'User Deactivated';
      successMsg = `Account for ${user.name} has been deactivated.`;
      toastType = 'amber';
    }

    const res = await updateUserAccountStatus(user.id, targetStatus);
    if (res.success) {
      await refreshUserData();
      showToast(successTitle, successMsg, toastType);
    } else {
      showToast('Error', res.error || 'Failed to update user status.', 'rose');
    }

    handleCloseConfirmModal();
  };

  // Initials generator
  const getInitials = (name) => {
    if (!name) return '??';
    return name
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  // Status Badge Component
  const renderAccountStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 uppercase tracking-wider font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00843D] animate-pulse"></span>
            ACTIVE
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-50 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800/40 uppercase tracking-wider font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-600"></span>
            APPROVED
          </span>
        );
      case 'PENDING REVIEW':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-700/50 uppercase tracking-wider font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F2B705]"></span>
            PENDING REVIEW
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40 uppercase tracking-wider font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
            REJECTED
          </span>
        );
      case 'DEACTIVATED':
      case 'INACTIVE':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 uppercase tracking-wider font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            DEACTIVATED
          </span>
        );
    }
  };

  // Reward Status Badge Component
  const renderRewardStatusBadge = (rewardStatus) => {
    if (rewardStatus === 'ASSIGNED' || rewardStatus === 'REWARD ASSIGNED') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 dark:bg-[#F2B705]/15 dark:text-[#F2B705] border border-amber-200 dark:border-[#F2B705]/30 uppercase tracking-wider font-mono">
          <svg className="w-3 h-3 text-[#F2B705]" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          ASSIGNED
        </span>
      );
    }
    if (rewardStatus === 'ACTIVE') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 uppercase tracking-wider font-mono">
          ACTIVE
        </span>
      );
    }
    if (rewardStatus === 'COMPLETED') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40 uppercase tracking-wider font-mono">
          COMPLETED
        </span>
      );
    }
    return (
      <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 dark:bg-slate-800/60 dark:text-slate-400 border border-slate-200 dark:border-slate-800 uppercase tracking-wider font-mono">
        NOT ASSIGNED
      </span>
    );
  };

  // Claims summary pill
  const renderClaimPill = (u) => {
    const hasVehicle = u.claimVehicle && u.claimVehicle !== 'None' && u.claimVehicle !== 'NO CLAIM';
    const hasCash = u.claimCash && u.claimCash !== 'None' && u.claimCash !== 'NO CLAIM';

    if (!hasVehicle && !hasCash) {
      return <span className="text-xs text-[#667085] dark:text-slate-400">None</span>;
    }

    return (
      <div className="flex flex-col gap-1">
        {hasVehicle && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#132A42] text-[#071A2B] dark:text-slate-200 border border-[#D9E0E7] dark:border-[#1B3754] font-mono">
            <span className="text-amber-500">Veh:</span> {u.claimVehicle}
          </span>
        )}
        {hasCash && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#132A42] text-[#071A2B] dark:text-slate-200 border border-[#D9E0E7] dark:border-[#1B3754] font-mono">
            <span className="text-emerald-600 dark:text-emerald-400">Cash:</span> {u.claimCash}
          </span>
        )}
      </div>
    );
  };

  return (
    <AdminShell
      activeKey="users"
      breadcrumb="HQ Admin Console / Operations / Users"
      toastState={toast}
      onCloseToast={() => setToast((prev) => ({ ...prev, visible: false }))}
    >
      <div className="space-y-6">
        
        {/* =========================================================================
            HEADING & PRIMARY ACTION
            ========================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#D9E0E7] dark:border-[#1B3754] pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider font-sora text-[#F2B705] bg-[#071A2B] dark:bg-[#132A42] px-2 py-0.5 rounded border border-[#F2B705]/20">
                User Management
              </span>
              <span className="text-xs text-[#667085] dark:text-slate-400 font-mono">• RSA Registry</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-sora text-[#071A2B] dark:text-white tracking-tight">
              Users
            </h1>
            <p className="text-xs sm:text-sm text-[#667085] dark:text-slate-300 max-w-2xl mt-1">
              Manage user accounts, review account status, and view assigned rewards and claim activity.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              id="admin-create-user-btn"
              onClick={handleCreateUser}
              className="px-4 py-2.5 bg-[#F2B705] hover:bg-[#d9a404] text-[#071A2B] font-bold font-sora text-xs sm:text-sm rounded-lg shadow-sm hover:shadow transition flex items-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#F2B705]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              <span>Create User</span>
            </button>
          </div>
        </div>

        {/* =========================================================================
            DATA-DRIVEN USER SUMMARY METRICS (Calculated dynamically, strictly no fake stats)
            ========================================================================= */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-xl bg-white dark:bg-[#0B253F] border border-[#D9E0E7] dark:border-[#1B3754] shadow-sm flex flex-col justify-between">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#667085] dark:text-slate-400 font-sora">
              Total Users
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-sora text-[#071A2B] dark:text-white mt-2">
              {metrics.total}
            </div>
            <div className="text-[11px] text-[#667085] dark:text-slate-400 mt-1 font-manrope">
              Audited national accounts
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-[#0B253F] border border-[#D9E0E7] dark:border-[#1B3754] shadow-sm flex flex-col justify-between">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#F2B705] font-sora flex items-center justify-between">
              <span>Pending Review</span>
              {metrics.pendingReview > 0 && (
                <span className="w-2 h-2 rounded-full bg-[#F2B705] animate-ping"></span>
              )}
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-sora text-[#F2B705] mt-2">
              {metrics.pendingReview}
            </div>
            <div className="text-[11px] text-[#667085] dark:text-slate-400 mt-1 font-manrope">
              Verification required
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-[#0B253F] border border-[#D9E0E7] dark:border-[#1B3754] shadow-sm flex flex-col justify-between">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#00843D] dark:text-emerald-400 font-sora">
              Approved / Active
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-sora text-[#00843D] dark:text-emerald-400 mt-2">
              {metrics.approvedOrActive}
            </div>
            <div className="text-[11px] text-[#667085] dark:text-slate-400 mt-1 font-manrope">
              Draw-eligible members
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-[#0B253F] border border-[#D9E0E7] dark:border-[#1B3754] shadow-sm flex flex-col justify-between">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#667085] dark:text-slate-400 font-sora">
              Rejected / Deactivated
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-sora text-slate-700 dark:text-slate-300 mt-2">
              {metrics.rejectedOrDeactivated}
            </div>
            <div className="text-[11px] text-[#667085] dark:text-slate-400 mt-1 font-manrope">
              Access suspended / denied
            </div>
          </div>
        </div>

        {/* =========================================================================
            SEARCH & FILTERS TOOLBAR
            ========================================================================= */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#0B253F] border border-[#D9E0E7] dark:border-[#1B3754] shadow-sm space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
            
            {/* Search Input: Name, Email, Phone */}
            <div className="sm:col-span-2 lg:col-span-5 relative">
              <label htmlFor="user-search-input" className="sr-only">
                Search Users
              </label>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#667085] dark:text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                id="user-search-input"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by full name, email, or mobile..."
                className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-lg bg-[#F5F7FA] dark:bg-[#071A2B] border border-[#D9E0E7] dark:border-[#1B3754] text-[#071A2B] dark:text-white placeholder-[#667085] focus:outline-none focus:ring-2 focus:ring-[#F2B705] focus:bg-white dark:focus:bg-[#071A2B] transition-colors"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  aria-label="Clear search"
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[#667085] hover:text-[#071A2B] dark:hover:text-white"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Account Status Filter */}
            <div className="lg:col-span-3">
              <label htmlFor="account-status-filter" className="sr-only">
                Account Status
              </label>
              <select
                id="account-status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg bg-[#F5F7FA] dark:bg-[#071A2B] border border-[#D9E0E7] dark:border-[#1B3754] text-[#071A2B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F2B705] cursor-pointer"
              >
                <option value="ALL">Account Status: All</option>
                <option value="PENDING REVIEW">Pending Review</option>
                <option value="APPROVED">Approved</option>
                <option value="ACTIVE">Active</option>
                <option value="REJECTED">Rejected</option>
                <option value="DEACTIVATED">Deactivated</option>
              </select>
            </div>

            {/* Reward Status Filter */}
            <div className="lg:col-span-2">
              <label htmlFor="reward-status-filter" className="sr-only">
                Reward Status
              </label>
              <select
                id="reward-status-filter"
                value={rewardFilter}
                onChange={(e) => setRewardFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg bg-[#F5F7FA] dark:bg-[#071A2B] border border-[#D9E0E7] dark:border-[#1B3754] text-[#071A2B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F2B705] cursor-pointer"
              >
                <option value="ALL">Reward: All</option>
                <option value="NOT ASSIGNED">Not Assigned</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="lg:col-span-2">
              <label htmlFor="sort-by-select" className="sr-only">
                Sort Order
              </label>
              <select
                id="sort-by-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg bg-[#F5F7FA] dark:bg-[#071A2B] border border-[#D9E0E7] dark:border-[#1B3754] text-[#071A2B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F2B705] cursor-pointer"
              >
                <option value="NEWEST">Sort: Newest</option>
                <option value="OLDEST">Sort: Oldest</option>
                <option value="AZ">Name: A–Z</option>
                <option value="STATUS">Status</option>
              </select>
            </div>
          </div>

          {/* Counter and Clear Filters bar */}
          <div className="flex items-center justify-between pt-2 border-t border-[#D9E0E7] dark:border-[#1B3754] text-xs text-[#667085] dark:text-slate-400">
            <div className="flex items-center gap-2">
              <span>
                Showing <strong className="text-[#071A2B] dark:text-white font-mono">{filteredUsers.length}</strong> of{' '}
                <strong className="text-[#071A2B] dark:text-white font-mono">{users.length}</strong> accounts
              </span>
              {isFilterActive && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 font-mono">
                  Filtered
                </span>
              )}
            </div>

            {isFilterActive && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-[#071A2B] dark:text-[#F2B705] hover:underline font-bold text-xs flex items-center gap-1 cursor-pointer focus:outline-none"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Clear Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* =========================================================================
            DESKTOP USERS TABLE (Hidden on tablet/mobile: md:block)
            Columns: User | Email | Mobile | Account Status | Reward Status | Claims | Created | Action
            ========================================================================= */}
        <div className="hidden md:block rounded-xl bg-white dark:bg-[#0B253F] border border-[#D9E0E7] dark:border-[#1B3754] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" id="admin-users-table">
              <thead>
                <tr className="border-b border-[#D9E0E7] dark:border-[#1B3754] bg-[#F5F7FA]/70 dark:bg-[#071A2B]/60 text-[11px] font-bold font-sora uppercase text-[#667085] dark:text-slate-400 tracking-wider">
                  <th scope="col" className="py-3 px-4">User</th>
                  <th scope="col" className="py-3 px-4">Email</th>
                  <th scope="col" className="py-3 px-4">Mobile</th>
                  <th scope="col" className="py-3 px-4">Account Status</th>
                  <th scope="col" className="py-3 px-4">Reward Status</th>
                  <th scope="col" className="py-3 px-4">Claims</th>
                  <th scope="col" className="py-3 px-4">Created</th>
                  <th scope="col" className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9E0E7] dark:divide-[#1B3754] text-xs font-manrope">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[#667085] dark:text-slate-400">
                      <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-[#071A2B] flex items-center justify-center text-slate-400 mb-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>
                        <span className="font-bold text-sm text-[#071A2B] dark:text-white font-sora">No Users Found</span>
                        <p className="text-xs text-[#667085] dark:text-slate-400 mt-1">
                          No registered user records match the search query or active filter settings.
                        </p>
                        <button
                          type="button"
                          onClick={handleClearFilters}
                          className="mt-3 px-3 py-1.5 text-xs font-bold rounded-lg bg-[#071A2B] text-white dark:bg-[#F2B705] dark:text-[#071A2B]"
                        >
                          Clear Filters
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr
                      key={u.id}
                      onClick={() => handleViewUser(u.id)}
                      className="hover:bg-[#F5F7FA]/70 dark:hover:bg-[#071A2B]/40 transition-colors cursor-pointer"
                    >
                      {/* User Column */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#071A2B] text-[#F2B705] dark:bg-[#F2B705] dark:text-[#071A2B] font-bold text-xs flex items-center justify-center font-sora shrink-0 shadow-sm">
                            {getInitials(u.name)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-[#071A2B] dark:text-white font-sora truncate">
                              {u.name}
                            </div>
                            <div className="text-[10px] text-[#667085] dark:text-slate-400 font-mono">
                              {u.id}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3 px-4">
                        <span className="text-slate-700 dark:text-slate-300 truncate max-w-[180px] block" title={u.email}>
                          {u.email}
                        </span>
                      </td>

                      {/* Mobile */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-mono text-slate-700 dark:text-slate-300">
                          {u.phone}
                        </span>
                      </td>

                      {/* Account Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {renderAccountStatusBadge(u.status)}
                      </td>

                      {/* Reward Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {renderRewardStatusBadge(u.rewardStatus)}
                      </td>

                      {/* Claims */}
                      <td className="py-3 px-4">
                        {renderClaimPill(u)}
                      </td>

                      {/* Created Date */}
                      <td className="py-3 px-4 text-[#667085] dark:text-slate-400 whitespace-nowrap font-mono text-[11px]">
                        {u.createdDate}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* Dedicated View action */}
                          <button
                            type="button"
                            onClick={(e) => handleViewUser(u.id, e)}
                            className="px-2.5 py-1 rounded bg-[#F5F7FA] dark:bg-[#071A2B] border border-[#D9E0E7] dark:border-[#1B3754] text-[#071A2B] dark:text-slate-200 hover:border-[#F2B705] font-semibold text-xs transition-colors"
                          >
                            View
                          </button>

                          {/* Quick pending review actions */}
                          {u.status === 'PENDING REVIEW' && (
                            <>
                              <button
                                type="button"
                                title="Approve User"
                                onClick={(e) => promptApprove(u, e)}
                                className="px-2 py-1 rounded bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 font-bold text-xs transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                title="Reject User"
                                onClick={(e) => promptReject(u, e)}
                                className="px-2 py-1 rounded bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 font-bold text-xs transition-colors"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {/* More dropdown button */}
                          <div className="relative inline-block text-left">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuUserId(openMenuUserId === u.id ? null : u.id);
                              }}
                              aria-label="More user actions"
                              className="p-1 rounded text-[#667085] hover:text-[#071A2B] dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#071A2B] transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                              </svg>
                            </button>

                            {openMenuUserId === u.id && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-0 mt-1 w-44 rounded-lg bg-white dark:bg-[#071A2B] border border-[#D9E0E7] dark:border-[#1B3754] shadow-xl z-30 py-1 text-xs text-left animate-fadeIn"
                              >
                                <button
                                  type="button"
                                  onClick={(e) => handleViewUser(u.id, e)}
                                  className="w-full px-3 py-1.5 hover:bg-[#F5F7FA] dark:hover:bg-[#0B253F] text-[#071A2B] dark:text-white flex items-center gap-2"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                  <span>View Profile</span>
                                </button>

                                {u.status === 'PENDING REVIEW' && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={(e) => promptApprove(u, e)}
                                      className="w-full px-3 py-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-2"
                                    >
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                      </svg>
                                      <span>Approve User</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => promptReject(u, e)}
                                      className="w-full px-3 py-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-400 font-semibold flex items-center gap-2"
                                    >
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                      <span>Reject User</span>
                                    </button>
                                  </>
                                )}

                                {(u.status === 'APPROVED' || u.status === 'ACTIVE') && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={(e) => handleViewRewards(e)}
                                      className="w-full px-3 py-1.5 hover:bg-[#F5F7FA] dark:hover:bg-[#0B253F] text-[#071A2B] dark:text-white flex items-center gap-2"
                                    >
                                      <svg className="w-3.5 h-3.5 text-[#F2B705]" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                      </svg>
                                      <span>View Rewards</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => handleViewClaims(e)}
                                      className="w-full px-3 py-1.5 hover:bg-[#F5F7FA] dark:hover:bg-[#0B253F] text-[#071A2B] dark:text-white flex items-center gap-2"
                                    >
                                      <svg className="w-3.5 h-3.5 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                                      </svg>
                                      <span>View Claims</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => promptDeactivate(u, e)}
                                      className="w-full px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-[#0B253F] text-slate-700 dark:text-slate-300 flex items-center gap-2"
                                    >
                                      <svg className="w-3.5 h-3.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                      </svg>
                                      <span>Deactivate User</span>
                                    </button>
                                  </>
                                )}

                                {(u.status === 'DEACTIVATED' || u.status === 'INACTIVE') && (
                                  <button
                                    type="button"
                                    onClick={(e) => promptActivate(u, e)}
                                    className="w-full px-3 py-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-2"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>Activate User</span>
                                  </button>
                                )}

                                {u.status === 'REJECTED' && (
                                  <button
                                    type="button"
                                    onClick={(e) => promptApprove(u, e)}
                                    className="w-full px-3 py-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-2"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span>Re-approve User</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* =========================================================================
            MOBILE RESPONSIVE USER CARDS (Shown on tablet/mobile: md:hidden)
            Stacked user records with clear typography and touch targets
            ========================================================================= */}
        <div className="md:hidden space-y-3" id="admin-mobile-user-cards">
          {filteredUsers.length === 0 ? (
            <div className="p-8 rounded-xl bg-white dark:bg-[#0B253F] border border-[#D9E0E7] dark:border-[#1B3754] text-center">
              <span className="font-bold text-sm text-[#071A2B] dark:text-white font-sora block">No Users Found</span>
              <p className="text-xs text-[#667085] dark:text-slate-400 mt-1">
                No user records match the active search or filter settings.
              </p>
              <button
                type="button"
                onClick={handleClearFilters}
                className="mt-3 px-3 py-1.5 text-xs font-bold rounded-lg bg-[#071A2B] text-white dark:bg-[#F2B705] dark:text-[#071A2B]"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            filteredUsers.map((u) => (
              <div
                key={u.id}
                className="p-4 rounded-xl bg-white dark:bg-[#0B253F] border border-[#D9E0E7] dark:border-[#1B3754] shadow-sm space-y-3"
              >
                {/* Card Header: Avatar + Name + ID + Account Status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-[#071A2B] text-[#F2B705] dark:bg-[#F2B705] dark:text-[#071A2B] font-bold text-xs flex items-center justify-center font-sora shrink-0">
                      {getInitials(u.name)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-sm font-sora text-[#071A2B] dark:text-white truncate">
                        {u.name}
                      </div>
                      <div className="text-[10px] text-[#667085] dark:text-slate-400 font-mono">
                        {u.id} • {u.createdDate}
                      </div>
                    </div>
                  </div>
                  <div>
                    {renderAccountStatusBadge(u.status)}
                  </div>
                </div>

                {/* Card Body: Contact & Reward details */}
                <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-[#D9E0E7] dark:border-[#1B3754]">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#667085] dark:text-slate-400 font-sora block mb-0.5">
                      Contact
                    </span>
                    <div className="text-slate-700 dark:text-slate-300 truncate font-medium">{u.email}</div>
                    <div className="text-[#667085] dark:text-slate-400 font-mono text-[11px]">{u.phone}</div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#667085] dark:text-slate-400 font-sora block mb-0.5">
                      Reward Status
                    </span>
                    <div>{renderRewardStatusBadge(u.rewardStatus)}</div>
                    {u.claimVehicle && u.claimVehicle !== 'None' && (
                      <div className="text-[10px] text-amber-600 dark:text-amber-400 font-mono mt-1 truncate">
                        Veh: {u.claimVehicle}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleViewUser(u.id)}
                    className="flex-1 py-2 rounded-lg bg-[#071A2B] text-white dark:bg-[#F2B705] dark:text-[#071A2B] font-bold font-sora text-xs text-center transition-colors"
                  >
                    View User
                  </button>

                  {u.status === 'PENDING REVIEW' ? (
                    <>
                      <button
                        type="button"
                        onClick={(e) => promptApprove(u, e)}
                        className="px-3 py-2 rounded-lg bg-emerald-600 text-white font-bold text-xs"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={(e) => promptReject(u, e)}
                        className="px-3 py-2 rounded-lg bg-rose-600 text-white font-bold text-xs"
                      >
                        Reject
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={(e) => handleViewRewards(e)}
                        className="px-2.5 py-2 rounded-lg bg-[#F5F7FA] dark:bg-[#071A2B] border border-[#D9E0E7] dark:border-[#1B3754] text-[#071A2B] dark:text-white font-semibold text-xs"
                      >
                        Rewards
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleViewClaims(e)}
                        className="px-2.5 py-2 rounded-lg bg-[#F5F7FA] dark:bg-[#071A2B] border border-[#D9E0E7] dark:border-[#1B3754] text-[#071A2B] dark:text-white font-semibold text-xs"
                      >
                        Claims
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* =========================================================================
            LEGAL / REGULATORY AUDIT NOTE (POPIA Section 18 Compliance)
            ========================================================================= */}
        <div className="p-3.5 rounded-lg bg-[#F5F7FA] dark:bg-[#071A2B] border border-[#D9E0E7] dark:border-[#1B3754] text-[11px] text-[#667085] dark:text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-[#F2B705] shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>
              POPIA Section 18 Compliance: Personal identifying records encrypted at rest under RSA National Treasury draw governance.
            </span>
          </div>
          <span className="font-mono text-[10px] uppercase font-bold text-[#667085] dark:text-slate-400">
            AUDITED SYSTEM ACCESS ONLY
          </span>
        </div>

      </div>

      {/* =========================================================================
          CONFIRMATION MODAL: APPROVE / REJECT / ACTIVATE / DEACTIVATE
          Neutral confirmation language, fully accessible, no fake reasons
          ========================================================================= */}
      {confirmModal.isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#071A2B]/70 backdrop-blur-xs animate-fadeIn"
        >
          <div className="w-full max-w-md rounded-xl bg-white dark:bg-[#0B253F] border border-[#D9E0E7] dark:border-[#1B3754] p-6 shadow-2xl space-y-4">
            
            {/* Header */}
            <div className="flex items-center gap-3">
              {confirmModal.type === 'APPROVE' ? (
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : confirmModal.type === 'REJECT' ? (
                <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              )}

              <div>
                <h3 id="confirm-modal-title" className="text-base font-bold font-sora text-[#071A2B] dark:text-white">
                  {confirmModal.type === 'APPROVE' && 'Approve User?'}
                  {confirmModal.type === 'REJECT' && 'Reject User?'}
                  {confirmModal.type === 'ACTIVATE' && 'Activate User?'}
                  {confirmModal.type === 'DEACTIVATE' && 'Deactivate User?'}
                </h3>
                <p className="text-xs text-[#667085] dark:text-slate-400 mt-0.5">
                  Account: {confirmModal.user?.name} ({confirmModal.user?.id})
                </p>
              </div>
            </div>

            {/* Description matching strict guidelines */}
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              {confirmModal.type === 'APPROVE' &&
                'This will approve the user’s account and allow reward assignment.'}
              {confirmModal.type === 'REJECT' &&
                'This will mark the user’s account as rejected.'}
              {confirmModal.type === 'ACTIVATE' &&
                'This will restore active draw participation and operational access for this user.'}
              {confirmModal.type === 'DEACTIVATE' &&
                'This will suspend account operations and prevent allocation participation until re-activated.'}
            </p>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#D9E0E7] dark:border-[#1B3754]">
              <button
                type="button"
                onClick={handleCloseConfirmModal}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#F5F7FA] dark:bg-[#071A2B] text-[#071A2B] dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#132A42] transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                id="confirm-action-submit-btn"
                onClick={handleExecuteStatusChange}
                className={`px-4 py-2 text-xs font-bold font-sora rounded-lg transition-colors cursor-pointer ${
                  confirmModal.type === 'APPROVE' || confirmModal.type === 'ACTIVATE'
                    ? 'bg-[#00843D] hover:bg-[#006830] text-white'
                    : confirmModal.type === 'REJECT'
                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                    : 'bg-[#071A2B] dark:bg-[#F2B705] text-white dark:text-[#071A2B] hover:opacity-90'
                }`}
              >
                {confirmModal.type === 'APPROVE' && 'Approve User'}
                {confirmModal.type === 'REJECT' && 'Reject User'}
                {confirmModal.type === 'ACTIVATE' && 'Activate User'}
                {confirmModal.type === 'DEACTIVATE' && 'Deactivate User'}
              </button>
            </div>

          </div>
        </div>
      )}
    </AdminShell>
  );
}
