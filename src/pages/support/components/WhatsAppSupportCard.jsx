import React from 'react';

export default function WhatsAppSupportCard({ config, user }) {
  const isAvailable = config && config.isWhatsAppAvailable && Boolean(config.whatsappRawNumber);

  const userName = user?.fullName ? ` (${user.fullName})` : '';
  const memberRef = user?.memberId ? ` [Member ID: ${user.memberId}]` : '';
  const prefillMessage = encodeURIComponent(
    `Hello WinDriveSA Support, I am an authenticated member${userName}${memberRef} requesting assistance with my account or claim.`
  );
  const whatsappUrl = `https://wa.me/${config?.whatsappRawNumber || ''}?text=${prefillMessage}`;

  return (
    <div className="bg-white dark:bg-[#0B2238] rounded-2xl p-6 sm:p-7 border border-[#D9E0E7] dark:border-[#1E3852] shadow-sm flex flex-col justify-between relative overflow-hidden h-full">
      {/* Subtle corner accent */}
      <div className="absolute top-0 right-0 w-28 h-28 bg-[#00843D]/5 dark:bg-[#00843D]/10 rounded-bl-full pointer-events-none" />

      <div>
        {/* Channel badge & Operating hours */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#00843D]/10 dark:bg-[#00843D]/20 text-[#00843D] dark:text-emerald-400 border border-[#00843D]/20">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00843D] animate-pulse" />
            OFFICIAL FAST-TRACK CHANNEL
          </span>
          <span className="text-[11px] font-medium text-[#667085] dark:text-gray-400">
            {config?.operatingHours || 'SAST Mon–Fri 08:00–17:00'}
          </span>
        </div>

        {/* Authentic WhatsApp Icon + Heading */}
        <div className="flex items-center gap-3.5 mb-3">
          <div className="w-11 h-11 rounded-xl bg-[#00843D] flex items-center justify-center text-white shadow-sm flex-shrink-0">
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12.031 2C6.496 2 2 6.5 2 12.038c0 1.954.557 3.784 1.523 5.335L2 22l4.805-1.488A9.99 9.99 0 0 0 12.031 22C17.566 22 22 17.5 22 12.038 22 6.5 17.566 2 12.031 2zm5.836 14.283c-.244.685-1.42 1.309-1.969 1.391-.527.082-1.21.117-3.649-.893-2.92-1.209-4.806-4.17-4.95-4.364-.145-.195-1.185-1.579-1.185-3.008 0-1.429.748-2.133 1.013-2.426.265-.292.578-.365.772-.365.195 0 .39.002.558.01.18.01.42-.068.656.498.244.585.834 2.035.908 2.18.073.146.122.317.024.512-.097.195-.146.317-.292.488-.146.17-.308.38-.44.511-.146.146-.299.305-.128.598.17.293.757 1.25 1.625 2.024 1.118.995 2.06 1.303 2.353 1.45.293.146.464.122.635-.073.17-.195.733-.854.928-1.147.195-.293.39-.244.659-.146.268.098 1.708.805 2.001.952.293.146.488.22.562.342.073.122.073.707-.171 1.392z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#071A2B] dark:text-white font-sora">
              Contact Support on WhatsApp
            </h2>
            <p className="text-xs text-[#667085] dark:text-gray-400">
              Dedicated regional coordinator assistance
            </p>
          </div>
        </div>

        {/* Copy description */}
        <p className="text-xs sm:text-sm text-[#667085] dark:text-gray-300 leading-relaxed mb-5">
          Contact WinDriveSA support through WhatsApp for assistance with your account, cash prize disbursement schedule, or vehicle handover logistics. Connect directly with a verified South African support officer.
        </p>

        {/* Institutional Guardrails Box */}
        <div className="mb-6 p-3.5 rounded-xl bg-[#F5F7FA] dark:bg-[#13283E] border border-[#D9E0E7] dark:border-[#1E3852] text-xs text-[#667085] dark:text-gray-300 space-y-2">
          <div className="flex items-center gap-2 font-bold text-[#071A2B] dark:text-gray-200">
            <svg className="w-4 h-4 text-[#F2B705] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span>Support Channel Protocol & Security</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            WhatsApp is an inquiry and logistics coordination channel only. WinDriveSA will <strong>never</strong> ask for passwords, OTPs, PINs, card CVVs, online banking credentials, or EFT security codes via chat. WhatsApp is NOT a payment channel.
          </p>
        </div>
      </div>

      {/* Action Button & Configured Number */}
      <div className="pt-2">
        {isAvailable ? (
          <>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl font-bold text-sm bg-[#00843D] hover:bg-[#007033] active:bg-[#005a29] text-white transition-all duration-150 shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-[#00843D] focus:ring-offset-2 cursor-pointer text-center"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12.031 2C6.496 2 2 6.5 2 12.038c0 1.954.557 3.784 1.523 5.335L2 22l4.805-1.488A9.99 9.99 0 0 0 12.031 22C17.566 22 22 17.5 22 12.038 22 6.5 17.566 2 12.031 2zm5.836 14.283c-.244.685-1.42 1.309-1.969 1.391-.527.082-1.21.117-3.649-.893-2.92-1.209-4.806-4.17-4.95-4.364-.145-.195-1.185-1.579-1.185-3.008 0-1.429.748-2.133 1.013-2.426.265-.292.578-.365.772-.365.195 0 .39.002.558.01.18.01.42-.068.656.498.244.585.834 2.035.908 2.18.073.146.122.317.024.512-.097.195-.146.317-.292.488-.146.17-.308.38-.44.511-.146.146-.299.305-.128.598.17.293.757 1.25 1.625 2.024 1.118.995 2.06 1.303 2.353 1.45.293.146.464.122.635-.073.17-.195.733-.854.928-1.147.195-.293.39-.244.659-.146.268.098 1.708.805 2.001.952.293.146.488.22.562.342.073.122.073.707-.171 1.392z" />
              </svg>
              <span>Contact Support on WhatsApp</span>
            </a>
            <p className="text-center text-[11px] text-[#667085] dark:text-gray-400 mt-2 font-mono">
              Configured Channel: {config.whatsappNumber} • RSA Regional Desk
            </p>
          </>
        ) : (
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-center">
            <p className="text-xs font-bold text-amber-900 dark:text-amber-200 mb-1">
              WhatsApp Support Unavailable
            </p>
            <p className="text-[11px] text-amber-800 dark:text-amber-300/90">
              Direct chat assistance is temporarily unconfigured. Please submit your inquiry through the authenticated support request form on the right.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
