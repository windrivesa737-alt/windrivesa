import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminShell from '../../components/admin/AdminShell';
import { createAdminUser } from '../../services/mockUsers';

export default function AdminUserCreate() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    status: 'APPROVED',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Please provide the full legal name.');
      return;
    }
    if (!formData.email.trim()) {
      setError('Please provide a valid email address.');
      return;
    }
    if (!formData.phone.trim()) {
      setError('Please provide a South African contact mobile number.');
      return;
    }

    setIsSubmitting(true);
    const res = createAdminUser({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      status: formData.status,
    });

    if (res.success) {
      navigate('/admin/users');
    } else {
      setIsSubmitting(false);
      setError(res.error || 'Failed to create user record.');
    }
  };

  return (
    <AdminShell
      activeKey="users"
      breadcrumb="HQ Admin Console / Operations / Users / Create"
    >
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Back Link */}
        <div className="border-b border-[#D9E0E7] dark:border-[#1B3754] pb-4">
          <button
            type="button"
            onClick={() => navigate('/admin/users')}
            className="text-xs font-bold text-[#667085] dark:text-slate-400 hover:text-[#071A2B] dark:hover:text-white flex items-center gap-1.5 transition-colors mb-3"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Users List</span>
          </button>
          <h1 className="text-2xl font-bold font-sora text-[#071A2B] dark:text-white tracking-tight">
            Create User Account
          </h1>
          <p className="text-xs text-[#667085] dark:text-slate-400 mt-1">
            Enroll a new participant into the WinDriveSA National Verification Registry.
          </p>
        </div>

        {/* Creation Form */}
        <div className="p-6 rounded-xl bg-white dark:bg-[#0B253F] border border-[#D9E0E7] dark:border-[#1B3754] shadow-sm">
          {error && (
            <div className="p-3 mb-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#071A2B] dark:text-slate-200 mb-1 font-sora">
                Full Legal Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Sipho Mokoena"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-[#D9E0E7] dark:border-[#1B3754] bg-[#F5F7FA] dark:bg-[#071A2B] text-[#071A2B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F2B705]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#071A2B] dark:text-slate-200 mb-1 font-sora">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g. sipho.m@domain.co.za"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-[#D9E0E7] dark:border-[#1B3754] bg-[#F5F7FA] dark:bg-[#071A2B] text-[#071A2B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F2B705]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#071A2B] dark:text-slate-200 mb-1 font-sora">
                Mobile Number (RSA +27) *
              </label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+27 82 000 0000"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-[#D9E0E7] dark:border-[#1B3754] bg-[#F5F7FA] dark:bg-[#071A2B] text-[#071A2B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F2B705]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#071A2B] dark:text-slate-200 mb-1 font-sora">
                Initial Account Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-[#D9E0E7] dark:border-[#1B3754] bg-[#F5F7FA] dark:bg-[#071A2B] text-[#071A2B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F2B705]"
              >
                <option value="APPROVED">Approved (Default verified participant)</option>
                <option value="PENDING REVIEW">Pending Review (Requires compliance check)</option>
                <option value="ACTIVE">Active (Draw-eligible member)</option>
              </select>
            </div>

            <div className="pt-4 border-t border-[#D9E0E7] dark:border-[#1B3754] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate('/admin/users')}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#F5F7FA] dark:bg-[#071A2B] text-[#071A2B] dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#132A42] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-bold font-sora rounded-lg bg-[#F2B705] hover:bg-[#d9a404] text-[#071A2B] transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'Enrolling User...' : 'Create User Account'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminShell>
  );
}
