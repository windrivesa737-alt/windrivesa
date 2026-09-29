import React, { useState, useEffect } from 'react';

export default function PersonalInfoForm({
  user,
  pendingEmail,
  onSaveProfile,
}) {
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [mobileNumber, setMobileNumber] = useState(user?.mobile || '');
  const [emailAddress, setEmailAddress] = useState(pendingEmail || user?.email || '');

  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // Sync state if user or pendingEmail changes
  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      // Format mobile number cleanly for display if it has +27
      const mobile = user.mobile || '';
      if (mobile.startsWith('+27')) {
        setMobileNumber('0' + mobile.substring(3));
      } else {
        setMobileNumber(mobile);
      }
      setEmailAddress(pendingEmail || user.email || '');
    }
  }, [user, pendingEmail]);

  const validate = () => {
    const newErrors = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Please enter your full name as it appears on your ID.';
    }

    const cleanMobile = mobileNumber.replace(/[^0-9]/g, '');
    if (!cleanMobile || cleanMobile.length < 9 || cleanMobile.length > 11) {
      newErrors.mobileNumber = 'Please enter a valid South African mobile number.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailAddress.trim() || !emailRegex.test(emailAddress.trim())) {
      newErrors.emailAddress = 'Please enter a valid email address.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSaving(true);
    try {
      // Normalize mobile to +27 format for storage
      const digits = mobileNumber.replace(/[^0-9]/g, '');
      const formattedMobile = digits.startsWith('0')
        ? `+27${digits.substring(1)}`
        : digits.startsWith('27')
        ? `+${digits}`
        : `+27${digits}`;

      await onSaveProfile({
        fullName: fullName.trim(),
        mobile: formattedMobile,
        email: emailAddress.trim().toLowerCase(),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const isEmailPending = Boolean(pendingEmail);

  return (
    <section
      aria-labelledby="personal-info-heading"
      className="bg-white dark:bg-[#0B2238] rounded-2xl border border-[#D9E0E7] dark:border-[#1B354F] p-6 sm:p-8 shadow-sm transition-colors duration-200"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#D9E0E7] dark:border-[#1B354F] pb-4 mb-6 gap-2">
        <div>
          <h2
            id="personal-info-heading"
            className="text-lg sm:text-xl font-sora font-bold text-[#071A2B] dark:text-white"
          >
            Personal Information
          </h2>
          <p className="text-xs sm:text-sm text-[#667085] dark:text-slate-400 mt-0.5 font-manrope">
            Update your contact credentials used for verified reward dispatch and identity audit.
          </p>
        </div>
        <span className="self-start sm:self-auto text-[11px] px-2.5 py-1 rounded-full bg-emerald-50 text-[#00843D] dark:bg-emerald-950/40 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800 shrink-0">
          POPIA Compliant
        </span>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {/* Full Name */}
        <div>
          <label
            htmlFor="fullName"
            className="block text-xs font-bold font-sora uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
          >
            Full Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: null }));
            }}
            required
            className={`w-full px-4 py-2.5 text-sm rounded-xl border ${
              errors.fullName
                ? 'border-rose-400 ring-1 ring-rose-400'
                : 'border-[#D9E0E7] dark:border-[#1B354F]'
            } bg-white dark:bg-[#071A2B] text-[#17212B] dark:text-white placeholder-slate-400 focus:border-[#F2B705] focus:ring-2 focus:ring-[#F2B705]/20 transition-colors font-manrope`}
            aria-describedby="fullName-helper"
          />
          <p id="fullName-helper" className="text-[11px] text-[#667085] dark:text-slate-400 mt-1 font-manrope">
            Must match your verified South African ID book or Smart Card.
          </p>
          {errors.fullName && (
            <p className="text-xs text-rose-500 font-medium mt-1 font-manrope">{errors.fullName}</p>
          )}
        </div>

        {/* Mobile Number */}
        <div>
          <label
            htmlFor="mobileNumber"
            className="block text-xs font-bold font-sora uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
          >
            Mobile Number <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-xs font-semibold text-slate-500 dark:text-slate-400 border-r border-[#D9E0E7] dark:border-[#1B354F] pr-2.5 my-2">
              🇿🇦 +27
            </div>
            <input
              type="tel"
              id="mobileNumber"
              name="mobileNumber"
              value={mobileNumber}
              onChange={(e) => {
                setMobileNumber(e.target.value);
                if (errors.mobileNumber) setErrors((prev) => ({ ...prev, mobileNumber: null }));
              }}
              required
              placeholder="082 123 4567"
              className={`w-full pl-24 pr-4 py-2.5 text-sm rounded-xl border ${
                errors.mobileNumber
                  ? 'border-rose-400 ring-1 ring-rose-400'
                  : 'border-[#D9E0E7] dark:border-[#1B354F]'
              } bg-white dark:bg-[#071A2B] text-[#17212B] dark:text-white placeholder-slate-400 focus:border-[#F2B705] focus:ring-2 focus:ring-[#F2B705]/20 transition-colors font-mono`}
              aria-describedby="mobileNumber-helper"
            />
          </div>
          <p id="mobileNumber-helper" className="text-[11px] text-[#667085] dark:text-slate-400 mt-1 font-manrope">
            Used for SMS one-time pins (OTP) and courier delivery dispatch.
          </p>
          {errors.mobileNumber && (
            <p className="text-xs text-rose-500 font-medium mt-1 font-manrope">{errors.mobileNumber}</p>
          )}
        </div>

        {/* Email Address */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="emailAddress"
              className="block text-xs font-bold font-sora uppercase tracking-wider text-slate-700 dark:text-slate-300"
            >
              Email Address <span className="text-rose-500">*</span>
            </label>
            {!isEmailPending ? (
              <span
                id="email-badge-verified"
                className="text-[10px] font-semibold text-[#00843D] dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 flex items-center gap-1 font-manrope"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Verified
              </span>
            ) : (
              <span
                id="email-badge-pending"
                className="text-[10px] font-semibold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/50 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-700/60 flex items-center gap-1 font-manrope"
              >
                <svg className="w-3 h-3 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Pending Verification
              </span>
            )}
          </div>
          <input
            type="email"
            id="emailAddress"
            name="emailAddress"
            value={emailAddress}
            onChange={(e) => {
              setEmailAddress(e.target.value);
              if (errors.emailAddress) setErrors((prev) => ({ ...prev, emailAddress: null }));
            }}
            required
            className={`w-full px-4 py-2.5 text-sm rounded-xl border ${
              errors.emailAddress
                ? 'border-rose-400 ring-1 ring-rose-400'
                : 'border-[#D9E0E7] dark:border-[#1B354F]'
            } bg-white dark:bg-[#071A2B] text-[#17212B] dark:text-white placeholder-slate-400 focus:border-[#F2B705] focus:ring-2 focus:ring-[#F2B705]/20 transition-colors font-manrope`}
            aria-describedby="emailAddress-helper"
          />
          <p id="emailAddress-helper" className="text-[11px] text-[#667085] dark:text-slate-400 mt-1 font-manrope">
            Changing your email address requires email re-verification before taking full effect.
          </p>
          {errors.emailAddress && (
            <p className="text-xs text-rose-500 font-medium mt-1 font-manrope">{errors.emailAddress}</p>
          )}
        </div>

        {/* Form Action Bar */}
        <div className="pt-4 border-t border-[#D9E0E7] dark:border-[#1B354F] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-[#667085] dark:text-slate-400 order-2 sm:order-1 font-manrope">
            All personal data is encrypted in accordance with POPIA Section 18.
          </p>
          <button
            type="submit"
            id="btn-save-profile"
            disabled={isSaving}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#071A2B] hover:bg-[#17212B] dark:bg-[#F2B705] dark:hover:bg-[#dca604] text-white dark:text-[#071A2B] font-sora font-semibold text-sm shadow transition-all flex items-center justify-center gap-2 order-1 sm:order-2 disabled:opacity-60"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white dark:text-[#071A2B]" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </form>
    </section>
  );
}
