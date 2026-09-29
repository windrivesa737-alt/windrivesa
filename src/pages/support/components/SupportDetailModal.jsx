import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { sendSupportMessage } from '../../../services/support';

function getStatusBadge(status) {
  const norm = (status || '').toUpperCase();
  if (norm === 'OPEN' || norm === 'SUBMITTED') {
    return 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800';
  }
  if (norm === 'IN PROGRESS' || norm === 'UNDER REVIEW') {
    return 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800';
  }
  if (norm === 'WAITING FOR USER') {
    return 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800';
  }
  if (norm === 'RESOLVED') {
    return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
  }
  return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700';
}

export default function SupportDetailModal({ request, onClose, onMessageSent, currentUserId }) {
  const [replyMessage, setReplyMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  if (!request) return null;

  const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim() || isSending) return;

    setIsSending(true);
    setSendError(null);

    const res = await sendSupportMessage({
      requestId: request.id,
      senderProfileId: currentUserId,
      message: replyMessage.trim(),
    });

    setIsSending(false);

    if (res.error) {
      setSendError(res.error.message || 'Unable to send message.');
    } else {
      setReplyMessage('');
      if (onMessageSent) {
        onMessageSent();
      }
    }
  };

  const isResolved = (request.status || '').toUpperCase() === 'RESOLVED';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="support-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-[#071A2B]/70 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-[#0B2238] rounded-2xl shadow-xl border border-[#D9E0E7] dark:border-[#1E3852] p-6 sm:p-7 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#D9E0E7] dark:border-[#1E3852]">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap mb-1">
              <span className="font-mono text-xs font-bold text-[#F2B705] dark:text-[#F2B705]">
                #{request.ref}
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(request.status)}`}>
                {request.status}
              </span>
              {request.category && (
                <span className="text-[11px] font-medium text-[#667085] dark:text-gray-400 bg-gray-100 dark:bg-[#13283E] px-2 py-0.5 rounded border border-gray-200 dark:border-[#1E3852]">
                  {request.category}
                </span>
              )}
            </div>
            <h2 id="support-modal-title" className="text-lg sm:text-xl font-bold text-[#071A2B] dark:text-white font-sora">
              {request.subject}
            </h2>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-[#667085] hover:text-[#071A2B] dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#13283E] transition cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Timestamps & Claim Context */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 py-3.5 border-b border-[#D9E0E7]/60 dark:border-[#1E3852]/60 text-xs">
          <div>
            <p className="text-[10px] uppercase font-bold text-[#667085] dark:text-gray-400 tracking-wider">Submitted</p>
            <p className="font-semibold text-[#071A2B] dark:text-gray-200 mt-0.5">{formatDate(request.createdAt)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-[#667085] dark:text-gray-400 tracking-wider">Last Activity</p>
            <p className="font-semibold text-[#071A2B] dark:text-gray-200 mt-0.5">{formatDate(request.updatedAt)}</p>
          </div>
          {request.relatedClaimType && (
            <div className="col-span-2 sm:col-span-1">
              <p className="text-[10px] uppercase font-bold text-[#667085] dark:text-gray-400 tracking-wider">Related Claim</p>
              <Link
                to={request.relatedClaimType === 'cash' ? '/claims/cash' : '/claims/vehicle'}
                className="inline-flex items-center gap-1 font-bold text-xs text-[#00843D] dark:text-emerald-400 hover:underline mt-0.5"
              >
                <span>View {request.relatedClaimType === 'cash' ? 'Cash Claim' : 'Vehicle Claim'}</span>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </Link>
            </div>
          )}
        </div>

        {/* Request Message Body & Conversation Thread */}
        <div className="py-4 space-y-4 max-h-[50vh] overflow-y-auto pr-1">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#071A2B] dark:text-gray-200 font-sora mb-1.5">
              Your Inquired Message
            </h3>
            <div className="p-4 rounded-xl bg-[#F5F7FA] dark:bg-[#13283E] border border-[#D9E0E7] dark:border-[#1E3852] text-xs sm:text-sm text-[#17212B] dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
              {request.message}
            </div>
          </div>

          {/* Official Responses if available */}
          {request.responses && request.responses.length > 0 ? (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#071A2B] dark:text-gray-200 font-sora mb-2 flex items-center gap-2">
                <span>Official Responses</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  {request.responses.length}
                </span>
              </h3>
              <div className="space-y-3">
                {request.responses.map((resp) => (
                  <div
                    key={resp.id}
                    className="p-4 rounded-xl bg-white dark:bg-[#071A2B] border-l-4 border-l-[#00843D] border border-[#D9E0E7] dark:border-[#1E3852] shadow-xs"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-[#071A2B] dark:text-white">
                          {resp.sender}
                        </span>
                        {resp.senderRole && (
                          <span className="text-[10px] text-[#667085] dark:text-gray-400">
                            • {resp.senderRole}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-[#667085] dark:text-gray-400 font-mono">
                        {formatDate(resp.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-[#17212B] dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                      {resp.message}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 flex items-start gap-2.5">
              <svg className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs text-blue-800 dark:text-blue-300">
                Your request is queued for review by the WinDriveSA verification and operations team. Updates will appear in this history log.
              </p>
            </div>
          )}

          {/* Follow-up Message Composer if not resolved */}
          {!isResolved && (
            <form onSubmit={handleSendMessage} className="mt-4 pt-4 border-t border-[#D9E0E7] dark:border-[#1E3852]">
              <label htmlFor="user-reply-input" className="block text-xs font-bold uppercase tracking-wider text-[#071A2B] dark:text-gray-200 font-sora mb-1.5">
                Send Follow-up Message
              </label>
              {sendError && (
                <div className="mb-2 p-2 rounded text-xs bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                  {sendError}
                </div>
              )}
              <div className="flex gap-2">
                <textarea
                  id="user-reply-input"
                  rows={2}
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type an additional clarification or message regarding this ticket..."
                  className="flex-1 p-2.5 text-xs rounded-xl border border-[#D9E0E7] dark:border-[#1E3852] bg-white dark:bg-[#071A2B] text-[#071A2B] dark:text-[#EDF4FF] focus:outline-none focus:ring-1 focus:ring-[#071A2B] dark:focus:ring-[#F2B705] resize-none"
                />
                <button
                  type="submit"
                  disabled={isSending || !replyMessage.trim()}
                  className="px-4 py-2 self-end rounded-xl text-xs font-bold bg-[#00843D] hover:bg-emerald-700 disabled:opacity-50 text-white transition flex items-center gap-1.5 cursor-pointer"
                >
                  {isSending ? (
                    <span>Sending...</span>
                  ) : (
                    <>
                      <span>Reply</span>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer actions */}
        <div className="pt-4 mt-2 border-t border-[#D9E0E7] dark:border-[#1E3852] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#071A2B] hover:bg-[#17212B] text-white dark:bg-[#13283E] dark:hover:bg-[#1B354F] dark:text-gray-100 transition cursor-pointer"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}
