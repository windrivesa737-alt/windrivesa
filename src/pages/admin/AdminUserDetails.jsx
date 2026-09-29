import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AdminShell from '../../components/admin/AdminShell';
import {
  getProfileById,
  updateUserAccountStatus,
  updateUserProfile,
} from '../../services/users';

export default function AdminUserDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });

  // Modals & Feedback
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: null, // 'APPROVE' | 'REJECT' | 'ACTIVATE' | 'DEACTIVATE'
  });

  const [toast, setToast] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'success',
  });

  // Reload user when ID changes
  useEffect(() => {
    async function loadUser() {
      if (id) {
        setLoading(true);
        try {
          const res = await getProfileById(id);
          const u = res?.data || null;
          setUser(u);
          if (u) {
            setEditFormData({
              name: u.name || '',
              email: u.email || '',
              phone: u.phone !== 'N/A' ? u.phone : '',
            });
          }
        } catch (err) {
          console.error('Error fetching user profile:', err);
        } finally {
          setLoading(false);
        }
      }
    }
    loadUser();
  }, [id]);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast.visible) {
      const timer = setTimeout(() => {
        setToast((prev) => ({ ...prev, visible: false }));
      }, 3500);
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

  // Confirmation modal triggers
  const promptApprove = () => setConfirmModal({ isOpen: true, type: 'APPROVE' });
  const promptReject = () => setConfirmModal({ isOpen: true, type: 'REJECT' });
  const promptActivate = () => setConfirmModal({ isOpen: true, type: 'ACTIVATE' });
  const promptDeactivate = () => setConfirmModal({ isOpen: true, type: 'DEACTIVATE' });
  const handleCloseConfirmModal = () => setConfirmModal({ isOpen: false, type: null });

  // Execute status change
  const handleExecuteStatusChange = async () => {
    if (!user) return;
    const { type } = confirmModal;

    let targetStatus = user.status;
    let title = '';
    let message = '';
    let toastType = 'success';

    if (type === 'APPROVE') {
      targetStatus = 'APPROVED';
      title = 'User Approved';
      message = 'Account has been approved and reward assignment is now enabled.';
    } else if (type === 'REJECT') {
      targetStatus = 'REJECTED';
      title = 'User Rejected';
      message = 'Account has been marked as rejected.';
      toastType = 'rose';
    } else if (type === 'ACTIVATE') {
      targetStatus = 'ACTIVE';
      title = 'User Activated';
      message = 'Account is now active for participation.';
    } else if (type === 'DEACTIVATE') {
      targetStatus = 'DEACTIVATED';
      title = 'User Deactivated';
      message = 'Account has been deactivated.';
      toastType = 'amber';
    }

    const res = await updateUserAccountStatus(user.id, targetStatus);
    if (res.success) {
      setUser(res.user);
      showToast(title, message, toastType);
    } else {
      showToast('Error', res.error || 'Failed to update user status.', 'rose');
    }

    handleCloseConfirmModal();
  };

  // Save edited profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!user) return;

    if (!editFormData.name.trim()) {
      showToast('Validation Error', 'Full legal name is required.', 'amber');
      return;
    }
    if (!editFormData.email.trim()) {
      showToast('Validation Error', 'Email address is required.', 'amber');
      return;
    }

    const res = await updateUserProfile(user.id, editFormData);
    if (res.success) {
      setUser(res.user);
      setIsEditing(false);
      showToast('Profile Updated', 'User profile details successfully saved to national registry.', 'success');
    } else {
      showToast('Update Failed', res.error || 'Unable to save profile changes.', 'rose');
    }
  };

  // Render Account Status Badge
  const renderAccountBadge = (status) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 uppercase tracking-wider font-mono">
            <span className="w-2 h-2 rounded-full bg-[#00843D] animate-pulse"></span>
            ACTIVE
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-md bg-sky-50 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800/40 uppercase tracking-wider font-mono">
            <span className="w-2 h-2 rounded-full bg-sky-600"></span>
            APPROVED
          </span>
        );
      case 'PENDING REVIEW':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-md bg-amber-50 text-amber-900 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-700/50 uppercase tracking-wider font-mono">
            <span className="w-2 h-2 rounded-full bg-[#F2B705]"></span>
            PENDING REVIEW
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-md bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40 uppercase tracking-wider font-mono">
            <span className="w-2 h-2 rounded-full bg-rose-600"></span>
            REJECTED
          </span>
        );
      case 'DEACTIVATED':
      case 'INACTIVE':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 uppercase tracking-wider font-mono">
            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
            DEACTIVATED
          </span>
        );
    }
  };

  // Render Reward Badge
  const renderRewardBadge = (rewardStatus) => {
    if (rewardStatus === 'ASSIGNED' || rewardStatus === 'REWARD ASSIGNED') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-md bg-amber-50 text-amber-900 dark:bg-[#F2B705]/15 dark:text-[#F2B705] border border-amber-200 dark:border-[#F2B705]/30 uppercase tracking-wider font-mono">
          <svg className="w-3.5 h-3.5 text-[#F2B705]" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          ASSIGNED
        </span>
      );
    }
    if (rewardStatus === 'ACTIVE') {
      return (
        <span className="inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 uppercase tracking-wider font-mono">
          ACTIVE
        </span>
      );
    }
    if (rewardStatus === 'COMPLETED') {
      return (
        <span className="inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-md bg-purple-50 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40 uppercase tracking-wider font-mono">
          COMPLETED
        </span>
      );
    }
    return (
      <span className="inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-md bg-slate-100 text-slate-500 dark:bg-slate-800/60 dark:text-slate-400 border border-slate-200 dark:border-slate-800 uppercase tracking-wider font-mono">
        NOT ASSIGNED
      </span>
    );
  };

  if (!user) {
    return (
      <AdminShell
        activeKey="users"
        breadcrumb="HQ Admin Console / Operations / Users"
      >
        <div className="p-8 rounded-xl bg-white dark:bg-[#0B253F] border border-[#D9E0E7] dark:border-[#1B3754] text-center max-w-lg mx-auto my-12">
          <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/60 text-[#F2B705] mx-auto flex items-center justify-center mb-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold font-sora text-[#071A2B] dark:text-white mb-1">
            User Record Not Found
          </h2>
          <p className="text-xs text-[#667085] dark:text-slate-400 mb-6">
            The requested participant identifier <code className="font-mono font-bold text-[#071A2B] dark:text-slate-200">{id}</code> does not exist in the administrative user registry.
          </p>
          <button
            type="button"
            onClick={() => navigate('/admin/users')}
            className="px-4 py-2 bg-[#071A2B] text-white dark:bg-[#F2B705] dark:text-[#071A2B] font-bold text-xs rounded-lg font-sora shadow-sm"
          >
            ← Return to Users List
          </button>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      activeKey="users"
      breadcrumb={`HQ Admin Console / Operations / Users / ${user.id}`}
      toastState={toast}
      onCloseToast={() => setToast((prev) => ({ ...prev, visible: false }))}
    >
      <div className="space-y-6">

        {/* Back Link & Header */}
        <div className="flex flex-col gap-4 border-b border-[#D9E0E7] dark:border-[#1B3754] pb-5">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate('/admin/users')}
              className="text-xs font-bold text-[#667085] dark:text-slate-400 hover:text-[#071A2B] dark:hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Users</span>
            </button>

            <span className="font-mono text-xs text-[#667085] dark:text-slate-400">
              National Registry Record: {user.id}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#071A2B] text-[#F2B705] dark:bg-[#F2B705] dark:text-[#071A2B] font-bold text-lg font-sora flex items-center justify-center shrink-0 shadow-md">
                {getInitials(user.name)}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold font-sora text-[#071A2B] dark:text-white tracking-tight">
                    {user.name}
                  </h1>
                  {renderAccountBadge(user.status)}
                </div>
                <div className="text-xs text-[#667085] dark:text-slate-400 mt-1 flex flex-wrap items-center gap-2 font-manrope">
                  <span className="font-mono font-semibold">{user.id}</span>
                  <span>•</span>
                  <span>Registered: {user.createdDate}</span>
                </div>
              </div>
            </div>

            {/* Header Action Buttons based on account lifecycle */}
            <div className="flex items-center gap-2 flex-wrap">
              {user.status === 'PENDING REVIEW' ? (
                <>
                  <button
                    type="button"
                    onClick={promptApprove}
                    className="px-4 py-2 bg-[#00843D] hover:bg-[#006830] text-white font-bold font-sora text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Approve User</span>
                  </button>
                  <button
                    type="button"
                    onClick={promptReject}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold font-sora text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>Reject User</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setIsEditing(!isEditing)}
                    className="px-3 py-2 bg-white dark:bg-[#071A2B] border border-[#D9E0E7] dark:border-[#1B3754] text-[#071A2B] dark:text-white font-semibold text-xs rounded-lg hover:border-[#F2B705] transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    <span>{isEditing ? 'Cancel Edit' : 'Edit Profile'}</span>
                  </button>

                  {user.status === 'ACTIVE' || user.status === 'APPROVED' ? (
                    <button
                      type="button"
                      onClick={promptDeactivate}
                      className="px-3 py-2 bg-slate-100 dark:bg-[#132A42] text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-[#1b3b5c] font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <span>Deactivate</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={promptActivate}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold font-sora text-xs rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <span>Activate User</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* =========================================================================
            PROFILE SECTION (Full Name, Email, Mobile)
            ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Profile Card */}
          <div className="p-5 rounded-xl bg-white dark:bg-[#0B253F] border border-[#D9E0E7] dark:border-[#1B3754] shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#D9E0E7] dark:border-[#1B3754] pb-3">
              <h2 className="text-base font-bold font-sora text-[#071A2B] dark:text-white flex items-center gap-2">
                <svg className="w-4 h-4 text-[#F2B705]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>Profile Information</span>
              </h2>
              <span className="text-[10px] font-bold text-[#667085] dark:text-slate-400 uppercase font-mono">
                Encrypted Under POPIA
              </span>
            </div>

            {isEditing ? (
              <form onSubmit={handleSaveProfile} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-[#071A2B] dark:text-slate-300 mb-1">
                    Full Legal Name
                  </label>
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-[#D9E0E7] dark:border-[#1B3754] bg-[#F5F7FA] dark:bg-[#071A2B] text-[#071A2B] dark:text-white focus:ring-2 focus:ring-[#F2B705]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#071A2B] dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-[#D9E0E7] dark:border-[#1B3754] bg-[#F5F7FA] dark:bg-[#071A2B] text-[#071A2B] dark:text-white focus:ring-2 focus:ring-[#F2B705]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#071A2B] dark:text-slate-300 mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="text"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-[#D9E0E7] dark:border-[#1B3754] bg-[#F5F7FA] dark:bg-[#071A2B] text-[#071A2B] dark:text-white focus:ring-2 focus:ring-[#F2B705]"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-[#F2B705] text-[#071A2B] font-bold font-sora text-xs rounded-lg"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-[#071A2B] text-slate-700 dark:text-slate-300 text-xs rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[11px] font-bold text-[#667085] dark:text-slate-400 uppercase tracking-wider block">
                    Full Legal Name
                  </span>
                  <div className="text-sm font-bold font-sora text-[#071A2B] dark:text-white mt-0.5">
                    {user.name}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-[#667085] dark:text-slate-400 uppercase tracking-wider block">
                    Email Address
                  </span>
                  <div className="text-sm text-slate-700 dark:text-slate-200 mt-0.5 font-mono">
                    {user.email}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-[#667085] dark:text-slate-400 uppercase tracking-wider block">
                    Mobile Number
                  </span>
                  <div className="text-sm text-slate-700 dark:text-slate-200 mt-0.5 font-mono">
                    {user.phone}
                  </div>
                </div>

                <div className="pt-2 border-t border-[#D9E0E7] dark:border-[#1B3754] text-[11px] text-[#667085] dark:text-slate-400">
                  <span>Security: </span>
                  <strong className="text-emerald-700 dark:text-emerald-400">
                    No sensitive authentication credentials stored in UI layers.
                  </strong>
                </div>
              </div>
            )}
          </div>

          {/* Account Details Card */}
          <div className="p-5 rounded-xl bg-white dark:bg-[#0B253F] border border-[#D9E0E7] dark:border-[#1B3754] shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#D9E0E7] dark:border-[#1B3754] pb-3">
              <h2 className="text-base font-bold font-sora text-[#071A2B] dark:text-white flex items-center gap-2">
                <svg className="w-4 h-4 text-[#00843D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>Account Status & Lifecycle</span>
              </h2>
              <span className="text-[10px] font-bold text-[#667085] dark:text-slate-400 uppercase font-mono">
                Audit Record
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[11px] font-bold text-[#667085] dark:text-slate-400 uppercase tracking-wider block">
                  Current Account Status
                </span>
                <div className="mt-1">{renderAccountBadge(user.status)}</div>
              </div>

              <div>
                <span className="text-[11px] font-bold text-[#667085] dark:text-slate-400 uppercase tracking-wider block">
                  Account Created Date
                </span>
                <div className="text-sm text-slate-700 dark:text-slate-200 mt-0.5 font-mono">
                  {user.createdDate}
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold text-[#667085] dark:text-slate-400 uppercase tracking-wider block">
                  Participant Identifier
                </span>
                <div className="text-sm font-mono text-[#071A2B] dark:text-white font-bold mt-0.5">
                  {user.id}
                </div>
              </div>

              <div className="pt-2 border-t border-[#D9E0E7] dark:border-[#1B3754]">
                <div className="text-[11px] text-[#667085] dark:text-slate-400">
                  Status changes are committed to the audited administration activity log.
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* =========================================================================
            REWARD & CLAIM STATUS SECTION
            ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Reward Information Card */}
          <div className="p-5 rounded-xl bg-white dark:bg-[#0B253F] border border-[#D9E0E7] dark:border-[#1B3754] shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#D9E0E7] dark:border-[#1B3754] pb-3">
              <h2 className="text-base font-bold font-sora text-[#071A2B] dark:text-white flex items-center gap-2">
                <svg className="w-4 h-4 text-[#F2B705]" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span>Reward Information</span>
              </h2>
              <Link
                to="/admin/rewards"
                className="text-xs font-bold text-[#F2B705] hover:underline font-sora"
              >
                View Rewards →
              </Link>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[11px] font-bold text-[#667085] dark:text-slate-400 uppercase tracking-wider block">
                  Reward Status
                </span>
                <div className="mt-1">{renderRewardBadge(user.rewardStatus)}</div>
              </div>

              <div>
                <span className="text-[11px] font-bold text-[#667085] dark:text-slate-400 uppercase tracking-wider block">
                  Cash Prize
                </span>
                <div className="text-sm font-bold font-sora text-[#071A2B] dark:text-white mt-0.5">
                  {user.cashPrize || 'None Assigned'}
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold text-[#667085] dark:text-slate-400 uppercase tracking-wider block">
                  Vehicle Prize
                </span>
                <div className="text-sm font-bold font-sora text-[#071A2B] dark:text-white mt-0.5">
                  {user.vehiclePrize || 'None Assigned'}
                </div>
              </div>

              {user.vehicleImage && (
                <div className="mt-3 pt-3 border-t border-[#D9E0E7] dark:border-[#1B3754]">
                  <span className="text-[11px] font-bold text-[#667085] dark:text-slate-400 uppercase tracking-wider block mb-2">
                    Allocated Vehicle
                  </span>
                  <div className="relative rounded-lg overflow-hidden border border-[#D9E0E7] dark:border-[#1B3754] aspect-video max-w-sm">
                    <img
                      src={user.vehicleImage}
                      alt={user.vehiclePrize || 'Assigned vehicle'}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Claims Status Card */}
          <div className="p-5 rounded-xl bg-white dark:bg-[#0B253F] border border-[#D9E0E7] dark:border-[#1B3754] shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#D9E0E7] dark:border-[#1B3754] pb-3">
              <h2 className="text-base font-bold font-sora text-[#071A2B] dark:text-white flex items-center gap-2">
                <svg className="w-4 h-4 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                </svg>
                <span>Claims Activity</span>
              </h2>
              <Link
                to="/admin/claims"
                className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline font-sora"
              >
                View Claims →
              </Link>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 rounded-lg bg-[#F5F7FA] dark:bg-[#071A2B] border border-[#D9E0E7] dark:border-[#1B3754]">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#667085] dark:text-slate-400 uppercase tracking-wider">
                    Cash Claim Status
                  </span>
                  <span className="font-mono font-bold text-xs text-[#071A2B] dark:text-white">
                    {user.claimCash || 'None'}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#F5F7FA] dark:bg-[#071A2B] border border-[#D9E0E7] dark:border-[#1B3754]">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#667085] dark:text-slate-400 uppercase tracking-wider">
                    Vehicle Claim Status
                  </span>
                  <span className="font-mono font-bold text-xs text-[#071A2B] dark:text-white">
                    {user.claimVehicle || 'None'}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#071A2B]/60 border border-[#D9E0E7] dark:border-[#1B3754] text-[11px] text-[#667085] dark:text-slate-400">
                Claim progression is audited through the Claim Requests workflow. Users with verified status can fulfill claims subject to configured logistic and identity requirements.
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* =========================================================================
          CONFIRMATION MODALS (Neutral Language)
          ========================================================================= */}
      {confirmModal.isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#071A2B]/70 backdrop-blur-xs"
        >
          <div className="w-full max-w-md rounded-xl bg-white dark:bg-[#0B253F] border border-[#D9E0E7] dark:border-[#1B3754] p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold font-sora text-[#071A2B] dark:text-white">
              {confirmModal.type === 'APPROVE' && 'Approve User?'}
              {confirmModal.type === 'REJECT' && 'Reject User?'}
              {confirmModal.type === 'ACTIVATE' && 'Activate User?'}
              {confirmModal.type === 'DEACTIVATE' && 'Deactivate User?'}
            </h3>

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
                onClick={handleExecuteStatusChange}
                className={`px-4 py-2 text-xs font-bold font-sora rounded-lg transition-colors ${
                  confirmModal.type === 'APPROVE' || confirmModal.type === 'ACTIVATE'
                    ? 'bg-[#00843D] text-white'
                    : confirmModal.type === 'REJECT'
                    ? 'bg-rose-600 text-white'
                    : 'bg-[#071A2B] dark:bg-[#F2B705] text-white dark:text-[#071A2B]'
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
