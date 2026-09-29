import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminShell from '../../components/admin/AdminShell';
import {
  createCashPrize,
  DEFAULT_CASH_PRIZE_AMOUNT,
  formatZAR,
} from '../../services/rewards';
import { listUsers } from '../../services/users';

export default function AdminCashPrizeCreate() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [amount, setAmount] = useState(DEFAULT_CASH_PRIZE_AMOUNT);
  const [status, setStatus] = useState('ASSIGNED');
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    async function loadUsers() {
      try {
        const res = await listUsers();
        const list = res?.data || [];
        setUsers(list);
        const eligible = list.filter((u) => u.status === 'APPROVED' || u.status === 'ACTIVE');
        if (eligible.length > 0) {
          setSelectedUserId(eligible[0].id);
        } else if (list.length > 0) {
          setSelectedUserId(list[0].id);
        }
      } catch (err) {
        console.error('Failed to load users:', err);
      }
    }
    loadUsers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedUserId) {
      setError('Please select a recipient participant account.');
      return;
    }

    const selectedUser = users.find((u) => u.id === selectedUserId);
    if (selectedUser && selectedUser.status === 'PENDING REVIEW') {
      setError('User approval required before activating a cash prize.');
      return;
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Cash amount must be a valid positive monetary value.');
      return;
    }

    const res = await createCashPrize({
      userId: selectedUserId,
      amount: numAmount,
      currency: 'ZAR',
      status: status || 'ASSIGNED',
    });

    if (res.success) {
      navigate('/admin/cash-prizes');
    } else {
      setError(res.error || 'Failed to assign cash prize.');
    }
  };

  const selectedUser = users.find((u) => u.id === selectedUserId);

  return (
    <AdminShell
      activeKey="cash-prizes"
      breadcrumb="HQ Admin Console / Operations / Cash Prizes / Create"
      toastState={toastMessage}
      onCloseToast={() => setToastMessage('')}
    >
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#D9E0E7] dark:border-[#1B3754]">
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => navigate('/admin/cash-prizes')}
              className="text-xs text-[#667085] dark:text-slate-400 hover:text-[#071A2B] dark:hover:text-white flex items-center gap-1 mb-1 transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back to Cash Prizes</span>
            </button>
            <h1 className="text-2xl font-bold font-sora text-[#071A2B] dark:text-white">
              Create Cash Prize
            </h1>
            <p className="text-xs text-[#667085] dark:text-slate-400">
              Allocate statutory cash award to an approved participant account.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Form Container */}
        <form
          onSubmit={handleSubmit}
          className="p-6 rounded-xl bg-white dark:bg-[#0B253F] border border-[#D9E0E7] dark:border-[#1B3754] shadow-sm space-y-5"
        >
          {/* User Selection */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#071A2B] dark:text-slate-200 block mb-1.5 font-sora">
              Recipient Account *
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-[#F5F7FA] dark:bg-[#071A2B] border border-[#D9E0E7] dark:border-[#1B3754] text-xs text-[#071A2B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F2B705]"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} — {u.id} ({u.status})
                </option>
              ))}
            </select>
            {selectedUser && (
              <div className="mt-2 p-2.5 rounded-lg bg-[#F5F7FA] dark:bg-[#071A2B] border border-[#D9E0E7] dark:border-[#1B3754] flex items-center justify-between text-xs">
                <span className="text-[#667085] dark:text-slate-400">
                  Account Status: <strong className="text-[#071A2B] dark:text-white">{selectedUser.status}</strong>
                </span>
                <span className="text-[#667085] dark:text-slate-400 font-mono text-[11px]">
                  {selectedUser.email}
                </span>
              </div>
            )}
            {selectedUser?.status === 'PENDING REVIEW' && (
              <p className="mt-2 text-xs text-amber-600 dark:text-amber-400 font-medium">
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
                value={amount || ''}
                onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : 0)}
                className="w-full pl-8 pr-4 py-2 rounded-lg bg-[#F5F7FA] dark:bg-[#071A2B] border border-[#D9E0E7] dark:border-[#1B3754] text-sm font-bold text-[#071A2B] dark:text-white font-sora focus:outline-none focus:ring-2 focus:ring-[#F2B705]"
              />
            </div>
            <span className="text-[11px] text-[#667085] dark:text-slate-400 mt-1 block">
              Default allocation: R250,000 ZAR. You may set any positive monetary amount.
            </span>
          </div>

          {/* Currency & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#071A2B] dark:text-slate-200 block mb-1.5 font-sora">
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
              <label className="text-xs font-bold uppercase tracking-wider text-[#071A2B] dark:text-slate-200 block mb-1.5 font-sora">
                Initial Prize Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#F5F7FA] dark:bg-[#071A2B] border border-[#D9E0E7] dark:border-[#1B3754] text-xs font-medium text-[#071A2B] dark:text-white focus:outline-none"
              >
                <option value="ASSIGNED">ASSIGNED</option>
                <option value="ACTIVE">ACTIVE</option>
              </select>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#F5F7FA] dark:bg-[#071A2B] border border-[#D9E0E7] dark:border-[#1B3754] text-xs text-[#667085] dark:text-slate-400">
            Note: WinDriveSA allows one active cash prize per participant account. After assignment, the prize status is set to ASSIGNED and is independent of the user's account and reward statuses.
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#D9E0E7] dark:border-[#1B3754]">
            <button
              type="button"
              onClick={() => navigate('/admin/cash-prizes')}
              className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 text-[#071A2B] dark:text-slate-300 font-semibold text-xs hover:bg-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-[#F2B705] hover:bg-[#d9a404] text-[#071A2B] font-bold text-xs font-sora shadow-sm transition-colors cursor-pointer"
            >
              Confirm &amp; Assign Cash Prize
            </button>
          </div>
        </form>
      </div>
    </AdminShell>
  );
}
