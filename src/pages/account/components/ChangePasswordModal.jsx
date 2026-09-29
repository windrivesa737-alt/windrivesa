import React, { useState, useEffect } from 'react';

export default function ChangePasswordModal({ isOpen, onClose, onPasswordChangeSuccess }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Criteria validation checks
  const hasLen = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNum = /[0-9]/.test(newPassword);
  const allCriteriaMet = hasLen && hasUpper && hasLower && hasNum;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!currentPassword) {
      newErrors.currentPassword = 'Please enter your current password.';
    }

    if (!allCriteriaMet) {
      newErrors.newPassword = 'Password does not meet all security requirements.';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password.';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const result = await onPasswordChangeSuccess({
        currentPassword,
        newPassword,
      });

      if (!result.success) {
        setErrors({ general: result.error || 'Failed to update password.' });
      } else {
        // Reset form & close
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="password-modal"
      className="fixed inset-0 z-50 overflow-y-auto bg-[#071A2B]/80 backdrop-blur-sm flex items-center justify-center p-4 transition-all"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-password-title"
    >
      <div className="bg-white dark:bg-[#0B2238] w-full max-w-md rounded-2xl border border-[#D9E0E7] dark:border-[#1B354F] shadow-2xl p-6 sm:p-7 relative transition-colors duration-200">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-[#667085] hover:text-[#17212B] dark:hover:text-white hover:bg-[#F5F7FA] dark:hover:bg-[#071A2B] transition-colors"
          aria-label="Close password modal"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Modal Header */}
        <div className="mb-5">
          <div className="w-10 h-10 rounded-xl bg-[#F2B705]/15 text-[#F2B705] flex items-center justify-center mb-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 id="modal-password-title" className="text-lg font-sora font-bold text-[#071A2B] dark:text-white">
            Change Password
          </h3>
          <p className="text-xs text-[#667085] dark:text-slate-400 mt-1 font-manrope">
            Create a strong password with letters, numbers, and symbols to protect your account.
          </p>
        </div>

        {errors.general && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 font-medium font-manrope">
            {errors.general}
          </div>
        )}

        {/* Password Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Current Password */}
          <div>
            <label
              htmlFor="currentPassword"
              className="block text-xs font-bold font-sora uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1"
            >
              Current Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                id="currentPassword"
                name="currentPassword"
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  if (errors.currentPassword) setErrors((prev) => ({ ...prev, currentPassword: null }));
                }}
                required
                placeholder="••••••••••••"
                className={`w-full pl-3.5 pr-10 py-2 text-sm rounded-xl border ${
                  errors.currentPassword
                    ? 'border-rose-400 ring-1 ring-rose-400'
                    : 'border-[#D9E0E7] dark:border-[#1B354F]'
                } bg-white dark:bg-[#071A2B] text-[#17212B] dark:text-white placeholder-slate-400 focus:border-[#F2B705] focus:ring-2 focus:ring-[#F2B705]/20 transition-colors font-manrope`}
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-[#667085] hover:text-[#17212B] dark:hover:text-slate-300"
                tabIndex={-1}
              >
                {showCurrent ? 'Hide' : 'Show'}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="text-xs text-rose-500 font-medium mt-1 font-manrope">
                {errors.currentPassword}
              </p>
            )}
          </div>

          {/* New Password */}
          <div>
            <label
              htmlFor="newPassword"
              className="block text-xs font-bold font-sora uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1"
            >
              New Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                id="newPassword"
                name="newPassword"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (errors.newPassword) setErrors((prev) => ({ ...prev, newPassword: null }));
                }}
                required
                placeholder="••••••••••••"
                className={`w-full pl-3.5 pr-10 py-2 text-sm rounded-xl border ${
                  errors.newPassword
                    ? 'border-rose-400 ring-1 ring-rose-400'
                    : 'border-[#D9E0E7] dark:border-[#1B354F]'
                } bg-white dark:bg-[#071A2B] text-[#17212B] dark:text-white placeholder-slate-400 focus:border-[#F2B705] focus:ring-2 focus:ring-[#F2B705]/20 transition-colors font-manrope`}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-[#667085] hover:text-[#17212B] dark:hover:text-slate-300"
                tabIndex={-1}
              >
                {showNew ? 'Hide' : 'Show'}
              </button>
            </div>
            {errors.newPassword && (
              <p className="text-xs text-rose-500 font-medium mt-1 font-manrope">
                {errors.newPassword}
              </p>
            )}
          </div>

          {/* Live Requirements Checklist */}
          <div className="p-3 bg-[#F5F7FA] dark:bg-[#071A2B] rounded-xl border border-[#D9E0E7] dark:border-[#1B354F] text-[11px] space-y-1.5 font-manrope">
            <p className="font-sora font-semibold text-[#071A2B] dark:text-white mb-1">
              Password Requirements:
            </p>
            <div className={`flex items-center gap-1.5 ${hasLen ? 'text-[#00843D] dark:text-emerald-400 font-medium' : 'text-[#667085] dark:text-slate-400'}`}>
              <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${hasLen ? 'bg-[#00843D] dark:bg-emerald-500 text-white font-bold' : 'border border-slate-400'}`}>
                {hasLen ? '✓' : '○'}
              </span>
              <span>At least 8 characters</span>
            </div>
            <div className={`flex items-center gap-1.5 ${hasUpper ? 'text-[#00843D] dark:text-emerald-400 font-medium' : 'text-[#667085] dark:text-slate-400'}`}>
              <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${hasUpper ? 'bg-[#00843D] dark:bg-emerald-500 text-white font-bold' : 'border border-slate-400'}`}>
                {hasUpper ? '✓' : '○'}
              </span>
              <span>One uppercase letter</span>
            </div>
            <div className={`flex items-center gap-1.5 ${hasLower ? 'text-[#00843D] dark:text-emerald-400 font-medium' : 'text-[#667085] dark:text-slate-400'}`}>
              <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${hasLower ? 'bg-[#00843D] dark:bg-emerald-500 text-white font-bold' : 'border border-slate-400'}`}>
                {hasLower ? '✓' : '○'}
              </span>
              <span>One lowercase letter</span>
            </div>
            <div className={`flex items-center gap-1.5 ${hasNum ? 'text-[#00843D] dark:text-emerald-400 font-medium' : 'text-[#667085] dark:text-slate-400'}`}>
              <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${hasNum ? 'bg-[#00843D] dark:bg-emerald-500 text-white font-bold' : 'border border-slate-400'}`}>
                {hasNum ? '✓' : '○'}
              </span>
              <span>One number</span>
            </div>
          </div>

          {/* Confirm New Password */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-xs font-bold font-sora uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1"
            >
              Confirm New Password <span className="text-rose-500">*</span>
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: null }));
              }}
              required
              placeholder="••••••••••••"
              className={`w-full px-3.5 py-2 text-sm rounded-xl border ${
                errors.confirmPassword
                  ? 'border-rose-400 ring-1 ring-rose-400'
                  : 'border-[#D9E0E7] dark:border-[#1B354F]'
              } bg-white dark:bg-[#071A2B] text-[#17212B] dark:text-white placeholder-slate-400 focus:border-[#F2B705] focus:ring-2 focus:ring-[#F2B705]/20 transition-colors font-manrope`}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-rose-500 font-medium mt-1 font-manrope">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-[#D9E0E7] dark:border-[#1B354F] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-[#D9E0E7] dark:border-[#1B354F] text-slate-600 dark:text-slate-300 hover:bg-[#F5F7FA] dark:hover:bg-[#071A2B] transition-colors font-manrope"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="btn-update-password"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-sora font-bold rounded-xl bg-[#071A2B] hover:bg-[#17212B] dark:bg-[#F2B705] dark:hover:bg-[#dca604] text-white dark:text-[#071A2B] shadow transition-all flex items-center gap-1.5 disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Updating...</span>
                </>
              ) : (
                'Update Password'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
