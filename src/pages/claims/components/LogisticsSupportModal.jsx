import React, { useState } from 'react';

export default function LogisticsSupportModal({ isOpen, onClose, allocationId, onTicketSubmitted }) {
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!ticketMessage.trim()) return;

    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSuccess(true);
      if (onTicketSubmitted) {
        onTicketSubmitted({
          allocationId,
          subject: ticketSubject || 'Vehicle Logistics Inquiry',
          message: ticketMessage,
          ticketId: `WD-TKT-${Date.now().toString().slice(-5)}`,
        });
      }
      setTimeout(() => {
        setSuccess(false);
        setTicketSubject('');
        setTicketMessage('');
        onClose();
      }, 1400);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#071A2B]/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-[#0B2238] rounded-2xl w-full max-w-lg shadow-2xl border border-[#D9E3F1] dark:border-[#1B354F] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#D9E3F1] dark:border-[#1B354F] flex items-center justify-between">
          <div>
            <span className="font-manrope text-[10px] uppercase font-bold text-[#785900] dark:text-[#F2B705] tracking-wider">
              Accredited Liaison
            </span>
            <h3 className="font-sora text-lg sm:text-xl font-bold text-[#071A2B] dark:text-white">
              Logistics Support Coordination
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#667085] hover:bg-[#F5F7FA] dark:hover:bg-slate-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 flex flex-col gap-4">
          <div className="p-3 bg-[#F5F7FA] dark:bg-[#081827] rounded-lg border border-[#D9E3F1] dark:border-[#1B354F] flex items-center justify-between text-xs">
            <span className="text-[#667085] dark:text-slate-400 font-manrope">Allocation Reference</span>
            <span className="font-mono font-bold text-[#071A2B] dark:text-white">{allocationId}</span>
          </div>

          {success ? (
            <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-[#00843D] dark:text-emerald-400 flex items-center justify-center">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h4 className="font-sora text-sm font-bold text-[#071A2B] dark:text-white">
                Support Ticket Logged
              </h4>
              <p className="text-xs text-[#667085] dark:text-slate-300">
                A logistics compliance representative will follow up via your registered mobile contact.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[#071A2B] dark:text-white font-manrope">
                  Inquiry Topic
                </label>
                <input
                  type="text"
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  placeholder="e.g. Flatbed Delivery Access / Handover Confirmation"
                  className="w-full h-10 px-3 bg-white dark:bg-[#0E1724] border border-[#D9E3F1] dark:border-[#1B354F] rounded text-sm text-[#071A2B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#071A2B] dark:focus:ring-[#F2B705]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[#071A2B] dark:text-white font-manrope">
                  Message / Question <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={ticketMessage}
                  onChange={(e) => setTicketMessage(e.target.value)}
                  placeholder="Please describe your question or delivery constraint..."
                  className="w-full p-3 bg-white dark:bg-[#0E1724] border border-[#D9E3F1] dark:border-[#1B354F] rounded text-sm text-[#071A2B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#071A2B] dark:focus:ring-[#F2B705]"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <a
                  href={`https://wa.me/27820000000?text=Hello%20WinDriveSA%20Logistics%2C%20I%20have%20an%20inquiry%20regarding%20claim%20${allocationId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-[#00843D] dark:text-emerald-400 font-bold hover:underline"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.699c.96.526 1.777.78 2.796.78 3.18 0 5.767-2.586 5.767-5.766.001-3.18-2.585-5.766-5.767-5.766zm3.391 8.211c-.141.399-.817.763-1.127.809-.304.045-.694.062-2.078-.517-1.656-.694-2.716-2.385-2.798-2.496-.083-.112-.669-.89-.669-1.698 0-.809.424-1.207.575-1.37.151-.164.33-.205.441-.205.111 0 .222.001.319.006.103.004.241-.039.377.288.141.339.481 1.176.523 1.261.042.086.07.186.014.298-.056.113-.085.183-.169.282-.085.099-.178.221-.254.298-.086.086-.176.18-.076.353.1.172.445.733.955 1.188.656.585 1.209.766 1.381.852.172.086.273.072.375-.044.103-.117.439-.512.557-.687.117-.175.234-.146.393-.087.159.058 1.009.475 1.182.562.173.086.288.13.33.203.042.073.042.424-.099.823z" />
                  </svg>
                  <span>Chat via WhatsApp</span>
                </a>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-[#071A2B] hover:bg-[#0e2740] dark:bg-[#F2B705] dark:hover:bg-[#dfa704] text-white dark:text-[#071A2B] font-sora text-xs rounded font-bold transition-all disabled:opacity-75 flex items-center gap-1.5"
                >
                  {submitting ? 'Submitting...' : 'Log Ticket'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
