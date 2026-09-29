import React from 'react';
import { Link } from 'react-router-dom';

export default function ClaimsSupportFooter({ onWhatsAppSupport, onContactSupport }) {
  return (
    <footer className="mt-12 pt-8 border-t border-brand-border dark:border-brand-border-dark">
      <div className="bg-white dark:bg-brand-navy border border-brand-border dark:border-brand-border-dark rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-bg dark:bg-brand-navy-light text-brand-navy dark:text-brand-gold flex items-center justify-center text-xl shrink-0 border border-brand-border dark:border-brand-border-dark/80">
            <svg className="w-6 h-6 text-brand-navy dark:text-brand-gold" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.516 0c.85.493 1.509 1.333 1.509 2.316V18" />
            </svg>
          </div>
          <div>
            <h3 className="font-sora font-bold text-base sm:text-lg text-brand-navy dark:text-white">
              Need Help With Your Claims?
            </h3>
            <p className="text-xs sm:text-sm text-brand-muted dark:text-brand-muted-dark mt-1 max-w-xl leading-relaxed">
              Have a question about your claim review or delivery status? Our dedicated South African support desk is available Monday to Friday, 08:00–17:00 SAST.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button
            type="button"
            id="claims-whatsapp-support-btn"
            onClick={onWhatsAppSupport}
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-brand-emerald dark:text-emerald-400 border border-brand-emerald/30 font-semibold text-xs hover:bg-brand-emerald hover:text-white dark:hover:bg-emerald-600 transition shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-emerald"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.969.584 1.942.895 3.036.895 3.18 0 5.767-2.587 5.768-5.766.001-3.18-2.586-5.767-5.768-5.767zm7.842 5.766c-.002 4.316-3.518 7.831-7.841 7.831-1.334 0-2.581-.355-3.676-.995l-4.148 1.088 1.107-4.043c-.722-1.15-1.124-2.482-1.123-3.881.002-4.315 3.518-7.831 7.842-7.831 4.315 0 7.839 3.516 7.839 7.831z" />
            </svg>
            <span>WhatsApp Support</span>
          </button>

          {onContactSupport ? (
            <button
              type="button"
              id="claims-contact-support-btn"
              onClick={() => onContactSupport('Claims Overview')}
              className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-navy dark:bg-white text-white dark:text-brand-navy font-sora font-semibold text-xs hover:opacity-90 transition shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
            >
              Contact Support
            </button>
          ) : (
            <Link
              to="/support"
              id="claims-contact-support-link"
              className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-navy dark:bg-white text-white dark:text-brand-navy font-sora font-semibold text-xs hover:opacity-90 transition shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
            >
              Contact Support
            </Link>
          )}
        </div>
      </div>

      {/* Compliance & Regulatory Strip */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-brand-muted dark:text-brand-muted-dark gap-2 pb-4">
        <p>© 2026 WinDriveSA (Pty) Ltd. All rights reserved. POPIA Compliant • Secure Logistics Escrow</p>
        <div className="flex items-center gap-3">
          <span>RSA IDENTITY ESCROW</span>
          <span aria-hidden="true">•</span>
          <span>REG NO: 2024/782194/07</span>
        </div>
      </div>
    </footer>
  );
}
