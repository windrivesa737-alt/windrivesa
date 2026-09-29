import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminShell from '../../components/admin/AdminShell';
import {
  createVehiclePrize,
  DEFAULT_VEHICLE_MAKE,
  DEFAULT_VEHICLE_MODEL,
  DEFAULT_VEHICLE_YEAR,
} from '../../services/rewards';
import { WHITE_HILUX_SPECIMENS } from '../../services/vehicleImages';
import { listUsers } from '../../services/users';

export default function AdminVehiclePrizeCreate() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [vehicleMake, setVehicleMake] = useState(DEFAULT_VEHICLE_MAKE);
  const [vehicleModel, setVehicleModel] = useState(DEFAULT_VEHICLE_MODEL);
  const [vehicleYear, setVehicleYear] = useState(DEFAULT_VEHICLE_YEAR);
  const [vehicleImage, setVehicleImage] = useState('');
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
    if (selectedUser && selectedUser.status === 'PENDING REVIEW' && status === 'ACTIVE') {
      setError('User approval required before activating a vehicle prize.');
      return;
    }

    if (!vehicleMake.trim()) {
      setError('Vehicle Make is required.');
      return;
    }

    if (!vehicleModel.trim()) {
      setError('Vehicle Model is required.');
      return;
    }

    const numYear = Number(vehicleYear);
    if (isNaN(numYear) || numYear < 1990 || numYear > 2035) {
      setError('Vehicle Year must be a reasonable four-digit year (1990 - 2035).');
      return;
    }

    const res = await createVehiclePrize({
      userId: selectedUserId,
      vehicleMake: vehicleMake.trim(),
      vehicleModel: vehicleModel.trim(),
      vehicleYear: numYear,
      vehicleImage: vehicleImage.trim() || null,
      status: status || 'ASSIGNED',
    });

    if (res.success) {
      navigate('/admin/vehicle-prizes');
    } else {
      setError(res.error || 'Failed to assign vehicle prize.');
    }
  };

  const selectedUser = users.find((u) => u.id === selectedUserId);

  return (
    <AdminShell
      activeKey="vehicle-prizes"
      breadcrumb="HQ Admin Console / Operations / Vehicle Prizes / Create"
      toastState={toastMessage}
      onCloseToast={() => setToastMessage('')}
    >
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#D9E0E7] dark:border-[#1B3754]">
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => navigate('/admin/vehicle-prizes')}
              className="text-xs text-[#667085] dark:text-slate-400 hover:text-[#071A2B] dark:hover:text-white flex items-center gap-1 mb-1 transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back to Vehicle Prizes</span>
            </button>
            <h1 className="text-2xl font-bold font-sora text-[#071A2B] dark:text-white">
              Create Vehicle Prize
            </h1>
            <p className="text-xs text-[#667085] dark:text-slate-400">
              Allocate a fleet vehicle prize to an approved participant account.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white dark:bg-[#0C2238] rounded-xl border border-[#D9E0E7] dark:border-[#1B3754] p-6 shadow-sm space-y-5">
          {/* User Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#071A2B] dark:text-slate-200">
              Recipient Participant Account <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              required
              className="w-full h-10 px-3 rounded-lg border border-[#D9E0E7] dark:border-[#1B3754] bg-white dark:bg-[#071A2B] text-xs text-[#071A2B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
            >
              <option value="">Select participant...</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.id}) — Account: {u.status}
                </option>
              ))}
            </select>
            {selectedUser && (
              <div className="flex items-center gap-2 pt-1 text-[11px] text-[#667085] dark:text-slate-400">
                <span>Account Status:</span>
                <span
                  className={`font-semibold px-2 py-0.5 rounded text-[10px] ${
                    selectedUser.status === 'APPROVED' || selectedUser.status === 'ACTIVE'
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                      : selectedUser.status === 'PENDING REVIEW'
                      ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                      : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                  }`}
                >
                  {selectedUser.status}
                </span>
                {selectedUser.status === 'PENDING REVIEW' && (
                  <span className="text-amber-600 dark:text-amber-400">
                    (User approval required before activating prize)
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Vehicle Make & Model */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#071A2B] dark:text-slate-200">
                Vehicle Make <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={vehicleMake}
                onChange={(e) => setVehicleMake(e.target.value)}
                placeholder="e.g. Toyota"
                required
                className="w-full h-10 px-3 rounded-lg border border-[#D9E0E7] dark:border-[#1B3754] bg-white dark:bg-[#071A2B] text-xs text-[#071A2B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#071A2B] dark:text-slate-200">
                Vehicle Model <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={vehicleModel}
                onChange={(e) => setVehicleModel(e.target.value)}
                placeholder="e.g. Hilux"
                required
                className="w-full h-10 px-3 rounded-lg border border-[#D9E0E7] dark:border-[#1B3754] bg-white dark:bg-[#071A2B] text-xs text-[#071A2B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
              />
            </div>
          </div>

          {/* Vehicle Year & Initial Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#071A2B] dark:text-slate-200">
                Vehicle Year <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1990"
                max="2035"
                value={vehicleYear}
                onChange={(e) => setVehicleYear(e.target.value)}
                required
                className="w-full h-10 px-3 rounded-lg border border-[#D9E0E7] dark:border-[#1B3754] bg-white dark:bg-[#071A2B] text-xs text-[#071A2B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#071A2B] dark:text-slate-200">
                Initial Prize Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[#D9E0E7] dark:border-[#1B3754] bg-white dark:bg-[#071A2B] text-xs text-[#071A2B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
              >
                <option value="ASSIGNED">ASSIGNED (Default)</option>
                <option value="ACTIVE" disabled={selectedUser?.status === 'PENDING REVIEW'}>
                  ACTIVE {selectedUser?.status === 'PENDING REVIEW' ? '(User Pending Review)' : ''}
                </option>
              </select>
            </div>
          </div>

          {/* Vehicle Image URL & Preview */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-[#071A2B] dark:text-slate-200">
              Vehicle Image URL <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="url"
              value={vehicleImage}
              onChange={(e) => setVehicleImage(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full h-10 px-3 rounded-lg border border-[#D9E0E7] dark:border-[#1B3754] bg-white dark:bg-[#071A2B] text-xs text-[#071A2B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
            />
            <p className="text-[11px] text-[#667085] dark:text-slate-400">
              Leave blank to keep without an image. If no image exists, "Vehicle image not available" will be displayed.
            </p>

            {/* Standard White Hilux Specimen Quick Select */}
            <div className="space-y-1.5 pt-1">
              <label className="block text-xs font-semibold text-[#071A2B] dark:text-slate-200">
                Standard White Toyota Hilux Specimens:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {WHITE_HILUX_SPECIMENS.map((spec) => (
                  <button
                    key={spec.id}
                    type="button"
                    onClick={() => setVehicleImage(spec.url)}
                    className={`p-1.5 rounded-lg border-2 text-left cursor-pointer transition-all flex items-center gap-2 ${
                      vehicleImage === spec.url
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

            {/* Restrained Thumbnail Preview */}
            <div className="mt-3 p-3 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center gap-3">
              <div className="w-20 h-14 rounded-md overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                {vehicleImage.trim() ? (
                  <img
                    src={vehicleImage.trim()}
                    alt={`${vehicleMake} ${vehicleModel} ${vehicleYear}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <span className="text-[9px] text-center text-slate-400 p-1">No Image</span>
                )}
              </div>
              <div className="text-xs">
                <span className="font-bold text-[#071A2B] dark:text-white block">
                  {vehicleMake || 'Make'} {vehicleModel || 'Model'} {vehicleYear || 'Year'}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {vehicleImage.trim() ? 'Configured image preview' : 'Vehicle image not available'}
                </span>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#D9E0E7] dark:border-[#1B3754]">
            <button
              type="button"
              onClick={() => navigate('/admin/vehicle-prizes')}
              className="px-4 py-2 text-xs font-semibold text-[#475467] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-[#071A2B] bg-[#D4AF37] hover:bg-[#E5C158] active:bg-[#B89628] rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              Assign Vehicle Prize
            </button>
          </div>
        </form>
      </div>
    </AdminShell>
  );
}
