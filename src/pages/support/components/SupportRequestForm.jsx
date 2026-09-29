import React, { useState } from 'react';

const CATEGORIES = [
  'General Support',
  'Account',
  'Cash Prize',
  'Vehicle Prize',
  'Claim',
];

export default function SupportRequestForm({ onSubmit, isSubmitting, userRewards }) {
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('General Support');
  const [message, setMessage] = useState('');
  const [relatedClaim, setRelatedClaim] = useState('none');
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validate = () => {
    const errs = {};
    if (!subject.trim()) {
      errs.subject = 'Please enter a subject for your support request.';
    } else if (subject.trim().length < 4) {
      errs.subject = 'Subject must be at least 4 characters.';
    }

    if (!message.trim()) {
      errs.message = 'Please describe your question or issue in detail.';
    } else if (message.trim().length < 10) {
      errs.message = 'Please provide more details (at least 10 characters).';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validate();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched({ subject: true, message: true });

    if (!validate()) {
      return;
    }

    let relatedClaimId = null;
    let relatedClaimType = null;
    if (relatedClaim === 'cash') {
      relatedClaimType = 'cash';
      relatedClaimId = userRewards?.cash?.allocationId || 'WD-CP-77402';
    } else if (relatedClaim === 'vehicle') {
      relatedClaimType = 'vehicle';
      relatedClaimId = userRewards?.vehicle?.allocationId || 'WD-VK-55912';
    }

    onSubmit({
      subject: subject.trim(),
      category,
      message: message.trim(),
      relatedClaimId,
      relatedClaimType,
    }, () => {
      // Reset on success
      setSubject('');
      setMessage('');
      setCategory('General Support');
      setRelatedClaim('none');
      setTouched({});
      setErrors({});
    });
  };

  return (
    <div className="bg-white dark:bg-[#0B2238] rounded-2xl p-6 sm:p-7 border border-[#D9E0E7] dark:border-[#1E3852] shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold text-[#071A2B] dark:text-white font-sora">
          Send a Support Request
        </h2>
        <span className="text-[11px] font-semibold text-[#667085] dark:text-gray-300 bg-gray-100 dark:bg-[#13283E] px-2.5 py-0.5 rounded-full border border-gray-200 dark:border-[#1E3852]">
          Ticket System
        </span>
      </div>
      <p className="text-xs sm:text-sm text-[#667085] dark:text-gray-300 mb-6">
        Submit an authenticated inquiry to our operations desk. Your request will be reviewed by our verified compliance team.
      </p>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Category & Optional Related Claim row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Category Selector */}
          <div>
            <label
              htmlFor="support-category"
              className="block text-xs font-bold uppercase tracking-wider text-[#071A2B] dark:text-gray-200 font-sora mb-1.5"
            >
              Category <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                id="support-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-4 py-2.5 rounded-xl border border-[#D9E0E7] dark:border-[#1E3852] bg-white dark:bg-[#13283E] text-[#071A2B] dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#F2B705] focus:border-transparent transition cursor-pointer appearance-none pr-10"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="bg-white dark:bg-[#13283E] text-[#071A2B] dark:text-white">
                    {cat}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#667085] dark:text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Related Claim Context (Optional) */}
          <div>
            <label
              htmlFor="support-related-claim"
              className="block text-xs font-bold uppercase tracking-wider text-[#071A2B] dark:text-gray-200 font-sora mb-1.5"
            >
              Related Claim <span className="text-xs font-normal text-[#667085] dark:text-gray-400">(Optional)</span>
            </label>
            <div className="relative">
              <select
                id="support-related-claim"
                value={relatedClaim}
                onChange={(e) => setRelatedClaim(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-4 py-2.5 rounded-xl border border-[#D9E0E7] dark:border-[#1E3852] bg-white dark:bg-[#13283E] text-[#071A2B] dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#F2B705] focus:border-transparent transition cursor-pointer appearance-none pr-10"
              >
                <option value="none">None / General Account Inquiry</option>
                <option value="cash">Cash Prize Claim (EFT Settlement)</option>
                <option value="vehicle">Vehicle Prize Claim (Fleet Allocation)</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#667085] dark:text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Subject Field */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="support-subject"
              className="block text-xs font-bold uppercase tracking-wider text-[#071A2B] dark:text-gray-200 font-sora"
            >
              Subject <span className="text-red-500">*</span>
            </label>
            <span className="text-[11px] text-[#667085] dark:text-gray-400">Specify inquiry topic</span>
          </div>
          <input
            type="text"
            id="support-subject"
            name="subject"
            value={subject}
            onChange={(e) => {
              setSubject(e.target.value);
              if (touched.subject) {
                if (!e.target.value.trim()) {
                  setErrors((prev) => ({ ...prev, subject: 'Please enter a subject for your support request.' }));
                } else {
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.subject;
                    return next;
                  });
                }
              }
            }}
            onBlur={() => handleBlur('subject')}
            disabled={isSubmitting}
            placeholder="What do you need help with?"
            className={`w-full px-4 py-2.5 rounded-xl border ${
              touched.subject && errors.subject
                ? 'border-red-500 ring-1 ring-red-500 bg-red-50/10'
                : 'border-[#D9E0E7] dark:border-[#1E3852]'
            } bg-white dark:bg-[#13283E] text-[#071A2B] dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#F2B705] focus:border-transparent transition`}
          />
          {touched.subject && errors.subject && (
            <p className="text-xs font-semibold text-red-500 mt-1.5 flex items-center gap-1">
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>{errors.subject}</span>
            </p>
          )}
        </div>

        {/* Message Field */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="support-message"
              className="block text-xs font-bold uppercase tracking-wider text-[#071A2B] dark:text-gray-200 font-sora"
            >
              Message <span className="text-red-500">*</span>
            </label>
            <span className="text-[11px] text-[#667085] dark:text-gray-400">Provide complete details</span>
          </div>
          <textarea
            id="support-message"
            name="message"
            rows="4"
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              if (touched.message) {
                if (!e.target.value.trim()) {
                  setErrors((prev) => ({ ...prev, message: 'Please describe your question or issue in detail.' }));
                } else {
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.message;
                    return next;
                  });
                }
              }
            }}
            onBlur={() => handleBlur('message')}
            disabled={isSubmitting}
            placeholder="Describe your question or issue in detail. If related to vehicle delivery or bank release, mention relevant dates or locations."
            className={`w-full px-4 py-2.5 rounded-xl border ${
              touched.message && errors.message
                ? 'border-red-500 ring-1 ring-red-500 bg-red-50/10'
                : 'border-[#D9E0E7] dark:border-[#1E3852]'
            } bg-white dark:bg-[#13283E] text-[#071A2B] dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#F2B705] focus:border-transparent transition`}
          />
          {touched.message && errors.message && (
            <p className="text-xs font-semibold text-red-500 mt-1.5 flex items-center gap-1">
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>{errors.message}</span>
            </p>
          )}
        </div>

        {/* Institutional / Audit Security Notice */}
        <div className="flex items-start gap-2 text-[11px] text-[#667085] dark:text-gray-400 py-1">
          <svg className="w-4 h-4 text-[#00843D] dark:text-emerald-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span>Submissions are logged under POPIA Section 18 for member verification integrity. Never send confidential PINs or OTPs.</span>
        </div>

        {/* Submit Action Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl font-bold text-sm bg-[#071A2B] hover:bg-[#17212B] text-white dark:bg-[#F2B705] dark:hover:bg-[#d9a200] dark:text-[#071A2B] transition duration-150 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#F2B705] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Submitting Request...</span>
              </>
            ) : (
              <>
                <span>Submit Support Request</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
