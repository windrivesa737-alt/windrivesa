import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminShell from '../../components/admin/AdminShell';
import {
  assignReward,
  VEHICLE_SPECIMENS,
  DEFAULT_REWARD_VALUES,
  formatZAR,
} from '../../services/rewards';
import { listUsers } from '../../services/users';

export default function AdminRewardCreate() {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    userId: '',
    cashAmount: DEFAULT_REWARD_VALUES.cashAmount,
    currency: 'ZAR',
    vehicleMake: DEFAULT_REWARD_VALUES.vehicleMake,
    vehicleModel: DEFAULT_REWARD_VALUES.vehicleModel,
    vehicleYear: DEFAULT_REWARD_VALUES.vehicleYear,
    vehicleImage: VEHICLE_SPECIMENS[0].url,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadUsers() {
      try {
        const res = await listUsers();
        const allUsers = res?.data || [];
        const eligible = allUsers.filter((u) => u.status === 'APPROVED' || u.status === 'ACTIVE');
        setUsers(eligible);
        if (eligible.length > 0) {
          setFormData((prev) => ({ ...prev, userId: eligible[0].id }));
        }
      } catch (err) {
        console.error('Failed to load eligible users:', err);
      }
    }
    loadUsers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.userId) {
      setError('Please select an approved participant account.');
      return;
    }

    const selectedUser = users.find((u) => u.id === formData.userId);
    if (selectedUser && selectedUser.status === 'PENDING REVIEW') {
      setError('User approval required before activating a reward.');
      return;
    }

    if (!formData.cashAmount && !formData.vehicleModel.trim()) {
      setError('At least one reward component (Cash or Vehicle) must be configured.');
      return;
    }

    setIsSubmitting(true);
    const res = await assignReward(formData);
    if (res.success) {
      navigate('/admin/rewards');
    } else {
      setIsSubmitting(false);
      setError(res.error || 'Failed to assign reward.');
    }
  };

  return (
    <AdminShell
      activeKey="rewards"
      breadcrumb="HQ Admin Console / Operations / Rewards / Assign"
    >
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Back Link */}
        <div className="border-b border-[#D9E0E7] dark:border-[#1B3754] pb-4">
          <button
            type="button"
            onClick={() => navigate('/admin/rewards')}
            className="text-xs font-bold text-[#667085] dark:text-slate-400 hover:text-[#071A2B] dark:hover:text-white flex items-center gap-1.5 transition-colors mb-3"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Rewards Directory</span>
          </button>
          <h1 className="text-2xl font-bold font-sora text-[#071A2B] dark:text-white tracking-tight">
            Assign Reward
          </h1>
          <p className="text-xs text-[#667085] dark:text-slate-400 mt-1">
            Assign cash and vehicle rewards to an approved participant account.
          </p>
        </div>

        {/* Creation Form */}
        <div className="p-6 rounded-xl bg-white dark:bg-[#0B253F] border border-[#D9E0E7] dark:border-[#1B3754] shadow-sm">
          {error && (
            <div className="p-3 mb-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* User Selection */}
            <div>
              <label className="block text-xs font-bold text-[#071A2B] dark:text-slate-200 mb-1.5 font-sora">
                Select Approved Participant *
              </label>
              {users.length > 0 ? (
                <select
                  value={formData.userId}
                  onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-[#D9E0E7] dark:border-[#1B3754] bg-[#F5F7FA] dark:bg-[#071A2B] text-[#071A2B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F2B705]"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.id} • {u.email}) — {u.status}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-xs text-amber-800 dark:text-amber-300 p-3 bg-amber-50 dark:bg-amber-950/40 rounded-lg">
                  No approved participants found. Please approve accounts in the Users module before assigning rewards.
                </p>
              )}
            </div>

            {/* Cash Prize */}
            <div>
              <label className="block text-xs font-bold text-[#071A2B] dark:text-slate-200 mb-1.5 font-sora">
                Cash Prize Amount (ZAR)
              </label>
              <div className="flex items-center rounded-lg bg-[#F5F7FA] dark:bg-[#071A2B] border border-[#D9E0E7] dark:border-[#1B3754] overflow-hidden">
                <span className="px-3 py-2 text-xs font-bold text-[#667085] dark:text-slate-400 bg-slate-200 dark:bg-[#091E33] border-r border-[#D9E0E7] dark:border-[#1B3754]">
                  R
                </span>
                <input
                  type="number"
                  step="25000"
                  value={formData.cashAmount || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
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

            {/* Vehicle Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#071A2B] dark:text-slate-200 mb-1.5 font-sora">
                  Vehicle Make
                </label>
                <input
                  type="text"
                  value={formData.vehicleMake}
                  onChange={(e) => setFormData({ ...formData, vehicleMake: e.target.value })}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-[#D9E0E7] dark:border-[#1B3754] bg-[#F5F7FA] dark:bg-[#071A2B] text-[#071A2B] dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-[#F2B705]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#071A2B] dark:text-slate-200 mb-1.5 font-sora">
                  Model Year
                </label>
                <input
                  type="number"
                  value={formData.vehicleYear}
                  onChange={(e) => setFormData({ ...formData, vehicleYear: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-[#D9E0E7] dark:border-[#1B3754] bg-[#F5F7FA] dark:bg-[#071A2B] text-[#071A2B] dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-[#F2B705]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#071A2B] dark:text-slate-200 mb-1.5 font-sora">
                Vehicle Model
              </label>
              <input
                type="text"
                value={formData.vehicleModel}
                onChange={(e) => setFormData({ ...formData, vehicleModel: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-[#D9E0E7] dark:border-[#1B3754] bg-[#F5F7FA] dark:bg-[#071A2B] text-[#071A2B] dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-[#F2B705]"
              />
            </div>

            {/* Vehicle Specimen Selection */}
            <div>
              <label className="block text-xs font-bold text-[#071A2B] dark:text-slate-200 mb-2 font-sora">
                Vehicle Photography Specimen
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {VEHICLE_SPECIMENS.map((spec) => (
                  <div
                    key={spec.id}
                    onClick={() => setFormData({ ...formData, vehicleImage: spec.url })}
                    className={`p-2 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.vehicleImage === spec.url
                        ? 'border-[#F2B705] bg-amber-50/50 dark:bg-amber-950/20'
                        : 'border-[#D9E0E7] dark:border-[#1B3754] bg-[#F5F7FA] dark:bg-[#071A2B] hover:border-slate-400'
                    }`}
                  >
                    <img
                      src={spec.url}
                      alt={spec.label}
                      className="w-full h-20 object-cover rounded-lg"
                    />
                    <span className="block mt-1 text-[10px] font-bold text-[#071A2B] dark:text-white text-center font-sora">
                      {spec.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-[#D9E0E7] dark:border-[#1B3754] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate('/admin/rewards')}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#F5F7FA] dark:bg-[#071A2B] text-[#071A2B] dark:text-slate-300 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || users.length === 0}
                className="px-5 py-2 text-xs font-bold font-sora rounded-lg bg-[#F2B705] hover:bg-[#d9a404] text-[#071A2B] transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'Assigning Reward...' : 'Assign Reward'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminShell>
  );
}
