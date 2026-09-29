import React from 'react';

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

function formatDate(isoOrString) {
  if (!isoOrString) return 'N/A';
  try {
    const d = new Date(isoOrString);
    if (isNaN(d.getTime())) return isoOrString;
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return isoOrString;
  }
}

export default function SupportRequestHistory({ requests, onViewDetails }) {
  const count = requests?.length || 0;

  return (
    <section className="bg-white dark:bg-[#0B2238] rounded-2xl p-6 sm:p-7 border border-[#D9E0E7] dark:border-[#1E3852] shadow-sm mb-12">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5 pb-4 border-b border-[#D9E0E7]/60 dark:border-[#1E3852]/60">
        <div>
          <h2 className="text-lg font-bold text-[#071A2B] dark:text-white font-sora">
            Your Support Requests
          </h2>
          <p className="text-xs text-[#667085] dark:text-gray-400">
            Track the progress and review history of all submitted support inquiries.
          </p>
        </div>
        <div className="self-start sm:self-center px-3 py-1 rounded-full text-xs font-bold bg-[#F5F7FA] dark:bg-[#13283E] text-[#071A2B] dark:text-gray-200 border border-[#D9E0E7] dark:border-[#1E3852]">
          {count === 0 ? '0 Requests' : `${count} ${count === 1 ? 'Request' : 'Total Requests'}`}
        </div>
      </div>

      {count === 0 ? (
        /* Empty State */
        <div className="py-12 px-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#F5F7FA] dark:bg-[#13283E] border border-[#D9E0E7] dark:border-[#1E3852] flex items-center justify-center text-[#667085] dark:text-gray-400 mx-auto mb-3.5 shadow-xs">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h3 className="font-bold text-base text-[#071A2B] dark:text-white font-sora mb-1">
            No Support Requests
          </h3>
          <p className="text-xs text-[#667085] dark:text-gray-400 max-w-sm mx-auto leading-relaxed">
            You haven’t submitted any support requests yet. If you require help with your account, cash disbursement, or vehicle prize handover, feel free to use the form above or message us on WhatsApp.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#D9E0E7] dark:border-[#1E3852] text-[11px] font-bold uppercase tracking-wider text-[#667085] dark:text-gray-400 bg-gray-50/50 dark:bg-[#13283E]/40">
                  <th scope="col" className="py-3 px-4">Reference</th>
                  <th scope="col" className="py-3 px-4">Subject</th>
                  <th scope="col" className="py-3 px-4">Category</th>
                  <th scope="col" className="py-3 px-4">Submitted Date</th>
                  <th scope="col" className="py-3 px-4">Status</th>
                  <th scope="col" className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9E0E7]/60 dark:divide-[#1E3852]/60">
                {requests.map((req) => (
                  <tr
                    key={req.id || req.ref}
                    className="hover:bg-gray-50/70 dark:hover:bg-[#13283E]/50 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-xs text-[#071A2B] dark:text-[#F2B705] whitespace-nowrap">
                      #{req.ref}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-semibold text-[#071A2B] dark:text-gray-100 max-w-[280px] truncate">
                      {req.subject}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[#667085] dark:text-gray-300 whitespace-nowrap">
                      {req.category || 'General'}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[#667085] dark:text-gray-400 whitespace-nowrap">
                      {formatDate(req.createdAt)}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border ${getStatusBadge(req.status)}`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onViewDetails(req)}
                        className="text-xs font-semibold text-[#071A2B] dark:text-[#F2B705] hover:underline cursor-pointer focus:outline-none"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="md:hidden space-y-3">
            {requests.map((req) => (
              <div
                key={req.id || req.ref}
                className="p-4 rounded-xl bg-[#F5F7FA] dark:bg-[#13283E] border border-[#D9E0E7] dark:border-[#1E3852] space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold text-[#071A2B] dark:text-[#F2B705]">
                    #{req.ref}
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border ${getStatusBadge(req.status)}`}>
                    {req.status}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-[#071A2B] dark:text-white leading-snug">
                  {req.subject}
                </h4>
                <div className="flex items-center justify-between text-[11px] text-[#667085] dark:text-gray-400 pt-1 border-t border-[#D9E0E7]/60 dark:border-[#1E3852]/60">
                  <span>{formatDate(req.createdAt)}</span>
                  <button
                    type="button"
                    onClick={() => onViewDetails(req)}
                    className="font-bold text-[#071A2B] dark:text-[#F2B705] hover:underline cursor-pointer"
                  >
                    View Details →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
