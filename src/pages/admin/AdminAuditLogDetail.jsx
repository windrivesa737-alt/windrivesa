// WinDriveSA Administration: Audit Log Event Detail
// In-depth operational inspection for administrative events with performer details,
// affected entities, field changes, and audit timelines.

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import AdminShell from '../../components/admin/AdminShell';
import { getAuditLogById } from '../../services/auditLogs';

export default function AdminAuditLogDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [log, setLog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    async function loadRecord() {
      try {
        const record = await getAuditLogById(id);
        if (isMounted) setLog(record);
      } catch (err) {
        console.error('Error loading audit event detail:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadRecord();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleCopyId = () => {
    if (!log?.id) return;
    try {
      navigator.clipboard.writeText(log.id);
      setCopied(true);
      setToastMessage({
        title: 'Event ID Copied',
        text: `Audit Event ID ${log.id} copied to clipboard.`,
      });
      setTimeout(() => {
        setCopied(false);
        setToastMessage(null);
      }, 3000);
    } catch (e) {
      // Fallback
    }
  };

  const getActionBadgeColor = (action = '', category = '') => {
    if (action.includes('REJECT') || action.includes('DEACTIVAT') || action.includes('SUSPEND')) {
      return 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-900/50';
    }
    if (action.includes('APPROV') || action.includes('ACTIVAT')) {
      return 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900/50';
    }
    if (category === 'Rewards') {
      return 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-900/50';
    }
    if (category === 'Claims') {
      return 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900/50';
    }
    if (category === 'Claim Requirements') {
      return 'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-900/50';
    }
    return 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
  };

  return (
    <AdminShell
      activeKey="audit-logs"
      breadcrumb={`HQ Admin Console / Audit Logs / ${log ? log.id : 'Event Detail'}`}
      toastState={toastMessage}
      onCloseToast={() => setToastMessage(null)}
    >
      <div className="space-y-6 pb-12">
        {/* Navigation Breadcrumb back to list */}
        <div>
          <Link
            to="/admin/audit-logs"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#071A2B] dark:text-[#F2B705] hover:underline font-sora"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to Audit Logs</span>
          </Link>
        </div>

        {/* NOT FOUND STATE */}
        {!loading && !log ? (
          <div className="p-12 bg-white dark:bg-[#0B253F] rounded-xl border border-[#D9E0E7] dark:border-[#1B3754] text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-[#132A42] flex items-center justify-center text-[#667085] dark:text-slate-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-[#071A2B] dark:text-white font-sora">
              Audit event not found.
            </h1>
            <p className="text-xs text-[#667085] dark:text-slate-400 max-w-md mx-auto leading-relaxed font-manrope">
              The requested audit record may no longer be available or the event identifier ({id}) is invalid.
            </p>
            <div className="pt-2">
              <Link
                to="/admin/audit-logs"
                className="inline-flex items-center px-4 py-2 text-xs font-semibold rounded-lg bg-[#071A2B] text-white hover:bg-[#0E2C48] dark:bg-[#F2B705] dark:text-[#071A2B] dark:hover:bg-[#FFC926] transition-colors font-sora"
              >
                Back to Audit Logs
              </Link>
            </div>
          </div>
        ) : log ? (
          <>
            {/* =========================================================================
                PAGE HEADER
                ========================================================================= */}
            <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#D9E0E7] dark:border-[#1B3754] pb-5">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#667085] dark:text-slate-400 font-sora block mb-1">
                  ADMINISTRATION
                </span>
                <h1 className="text-2xl font-extrabold text-[#071A2B] dark:text-white font-sora tracking-tight">
                  Audit Event
                </h1>
                <p className="text-xs text-[#667085] dark:text-slate-400 mt-1 max-w-2xl font-manrope">
                  Review the details of this administrative event.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-[#0B253F] border border-[#D9E0E7] dark:border-[#1B3754] text-[#071A2B] dark:text-slate-200 hover:bg-[#F5F7FA] dark:hover:bg-[#132A42] transition-colors focus:outline-none focus:ring-2 focus:ring-[#F2B705] font-sora shadow-sm"
                >
                  <svg className="w-3.5 h-3.5 text-[#667085] dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>{copied ? 'Copied ID' : 'Copy Event ID'}</span>
                </button>
              </div>
            </header>

            {/* =========================================================================
                TOP TWO COLUMNS: EVENT INFORMATION & PERFORMER
                ========================================================================= */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* SECTION 1: EVENT INFORMATION */}
              <section
                aria-labelledby="event-info-heading"
                className="bg-white dark:bg-[#0B253F] rounded-xl border border-[#D9E0E7] dark:border-[#1B3754] p-5 shadow-sm space-y-4"
              >
                <div className="flex items-center justify-between border-b border-[#D9E0E7] dark:border-[#1B3754] pb-3">
                  <h2
                    id="event-info-heading"
                    className="text-xs font-bold text-[#071A2B] dark:text-white uppercase tracking-wider font-sora flex items-center gap-2"
                  >
                    <svg className="w-4 h-4 text-[#071A2B] dark:text-[#F2B705]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Event Information</span>
                  </h2>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border font-sora ${
                      log.status === 'FAILED'
                        ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400'
                    }`}
                  >
                    {log.status}
                  </span>
                </div>

                <dl className="grid grid-cols-2 gap-3.5 text-xs">
                  <div>
                    <dt className="text-[11px] font-semibold text-[#667085] dark:text-slate-400 font-sora uppercase tracking-wider">
                      Event ID
                    </dt>
                    <dd className="font-mono text-xs font-bold text-[#071A2B] dark:text-white mt-0.5">
                      {log.id}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-[11px] font-semibold text-[#667085] dark:text-slate-400 font-sora uppercase tracking-wider">
                      Date & Time (SAST)
                    </dt>
                    <dd className="font-mono text-xs text-[#071A2B] dark:text-slate-200 mt-0.5">
                      {log.timestamp}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-[11px] font-semibold text-[#667085] dark:text-slate-400 font-sora uppercase tracking-wider">
                      Action
                    </dt>
                    <dd className="mt-1">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border font-sora ${getActionBadgeColor(
                          log.action,
                          log.category
                        )}`}
                      >
                        {log.action}
                      </span>
                    </dd>
                  </div>

                  <div>
                    <dt className="text-[11px] font-semibold text-[#667085] dark:text-slate-400 font-sora uppercase tracking-wider">
                      Action Category
                    </dt>
                    <dd className="text-xs font-semibold text-[#071A2B] dark:text-white mt-1">
                      {log.category}
                    </dd>
                  </div>
                </dl>
              </section>

              {/* SECTION 2: PERFORMER */}
              <section
                aria-labelledby="performer-heading"
                className="bg-white dark:bg-[#0B253F] rounded-xl border border-[#D9E0E7] dark:border-[#1B3754] p-5 shadow-sm space-y-4"
              >
                <div className="flex items-center justify-between border-b border-[#D9E0E7] dark:border-[#1B3754] pb-3">
                  <h2
                    id="performer-heading"
                    className="text-xs font-bold text-[#071A2B] dark:text-white uppercase tracking-wider font-sora flex items-center gap-2"
                  >
                    <svg className="w-4 h-4 text-[#071A2B] dark:text-[#F2B705]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Performer</span>
                  </h2>
                  <span className="text-[11px] font-mono text-[#667085] dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                    Admin Officer
                  </span>
                </div>

                <dl className="grid grid-cols-2 gap-3.5 text-xs">
                  <div>
                    <dt className="text-[11px] font-semibold text-[#667085] dark:text-slate-400 font-sora uppercase tracking-wider">
                      Admin Name
                    </dt>
                    <dd className="text-xs font-bold text-[#071A2B] dark:text-white mt-0.5 font-sora">
                      {log.adminName}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-[11px] font-semibold text-[#667085] dark:text-slate-400 font-sora uppercase tracking-wider">
                      Admin ID
                    </dt>
                    <dd className="font-mono text-xs font-semibold text-[#071A2B] dark:text-slate-200 mt-0.5">
                      {log.adminId}
                    </dd>
                  </div>

                  <div className="col-span-2">
                    <dt className="text-[11px] font-semibold text-[#667085] dark:text-slate-400 font-sora uppercase tracking-wider">
                      Admin Email
                    </dt>
                    <dd className="font-mono text-xs text-[#071A2B] dark:text-slate-200 mt-0.5">
                      {log.adminEmail}
                    </dd>
                  </div>
                </dl>
              </section>
            </div>

            {/* =========================================================================
                SECTION 3: AFFECTED ENTITY & CONTEXTUAL NAVIGATION
                ========================================================================= */}
            <section
              aria-labelledby="affected-entity-heading"
              className="bg-white dark:bg-[#0B253F] rounded-xl border border-[#D9E0E7] dark:border-[#1B3754] p-5 shadow-sm space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#D9E0E7] dark:border-[#1B3754] pb-3">
                <h2
                  id="affected-entity-heading"
                  className="text-xs font-bold text-[#071A2B] dark:text-white uppercase tracking-wider font-sora flex items-center gap-2"
                >
                  <svg className="w-4 h-4 text-[#071A2B] dark:text-[#F2B705]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <span>Affected Entity</span>
                </h2>

                {/* Contextual navigation buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  {log.relatedUserId && (
                    <Link
                      to={`/admin/users/${log.relatedUserId}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-[#071A2B] text-white hover:bg-[#0E2C48] dark:bg-[#F2B705] dark:text-[#071A2B] dark:hover:bg-[#FFC926] transition-colors font-sora shadow-sm"
                    >
                      <span>View User ({log.relatedUserId})</span>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </Link>
                  )}

                  {log.relatedRewardId && (
                    <Link
                      to={`/admin/rewards/${log.relatedRewardId}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-white dark:bg-[#071A2B] border border-[#D9E0E7] dark:border-[#1B3754] text-[#071A2B] dark:text-white hover:bg-[#F5F7FA] dark:hover:bg-[#132A42] transition-colors font-sora shadow-sm"
                    >
                      <span>View Reward ({log.relatedRewardId})</span>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </Link>
                  )}

                  {log.relatedClaimId && (
                    <Link
                      to={`/admin/claims/${log.relatedClaimId}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-[#071A2B] text-white hover:bg-[#0E2C48] dark:bg-[#F2B705] dark:text-[#071A2B] dark:hover:bg-[#FFC926] transition-colors font-sora shadow-sm"
                    >
                      <span>View Claim ({log.relatedClaimId})</span>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </Link>
                  )}

                  {log.relatedSupportId && (
                    <Link
                      to={`/admin/support/${log.relatedSupportId}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-white dark:bg-[#071A2B] border border-[#D9E0E7] dark:border-[#1B3754] text-[#071A2B] dark:text-white hover:bg-[#F5F7FA] dark:hover:bg-[#132A42] transition-colors font-sora shadow-sm"
                    >
                      <span>View Support Request ({log.relatedSupportId})</span>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </Link>
                  )}

                  {/* Fallback to entity hub if specific ID not deep-linked */}
                  {!log.relatedUserId && !log.relatedRewardId && !log.relatedClaimId && !log.relatedSupportId && (
                    <>
                      {log.entityType === 'User' && (
                        <Link
                          to="/admin/users"
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-[#071A2B] border border-[#D9E0E7] dark:border-[#1B3754] text-[#071A2B] dark:text-white hover:bg-[#F5F7FA] font-sora"
                        >
                          <span>Open Users Hub</span>
                        </Link>
                      )}
                      {log.entityType === 'Reward' && (
                        <Link
                          to="/admin/rewards"
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-[#071A2B] border border-[#D9E0E7] dark:border-[#1B3754] text-[#071A2B] dark:text-white hover:bg-[#F5F7FA] font-sora"
                        >
                          <span>Open Rewards Hub</span>
                        </Link>
                      )}
                      {log.entityType === 'Claim' && (
                        <Link
                          to="/admin/claims"
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-[#071A2B] border border-[#D9E0E7] dark:border-[#1B3754] text-[#071A2B] dark:text-white hover:bg-[#F5F7FA] font-sora"
                        >
                          <span>Open Claims Hub</span>
                        </Link>
                      )}
                      {log.entityType === 'Claim Requirement' && (
                        <Link
                          to="/admin/claim-requirements"
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-[#071A2B] border border-[#D9E0E7] dark:border-[#1B3754] text-[#071A2B] dark:text-white hover:bg-[#F5F7FA] font-sora"
                        >
                          <span>Open Claim Requirements</span>
                        </Link>
                      )}
                      {log.entityType === 'Support Request' && (
                        <Link
                          to="/admin/support"
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-[#071A2B] border border-[#D9E0E7] dark:border-[#1B3754] text-[#071A2B] dark:text-white hover:bg-[#F5F7FA] font-sora"
                        >
                          <span>Open Support Queue</span>
                        </Link>
                      )}
                    </>
                  )}
                </div>
              </div>

              <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div>
                  <dt className="text-[11px] font-semibold text-[#667085] dark:text-slate-400 font-sora uppercase tracking-wider">
                    Entity Type
                  </dt>
                  <dd className="text-xs font-bold text-[#071A2B] dark:text-white mt-0.5">
                    {log.entityType}
                  </dd>
                </div>

                <div>
                  <dt className="text-[11px] font-semibold text-[#667085] dark:text-slate-400 font-sora uppercase tracking-wider">
                    Record ID
                  </dt>
                  <dd className="font-mono text-xs font-semibold text-[#071A2B] dark:text-slate-200 mt-0.5">
                    {log.entityId}
                  </dd>
                </div>

                <div className="sm:col-span-2">
                  <dt className="text-[11px] font-semibold text-[#667085] dark:text-slate-400 font-sora uppercase tracking-wider">
                    Record Identifier / Label
                  </dt>
                  <dd className="text-xs font-semibold text-[#071A2B] dark:text-white mt-0.5 font-sora">
                    {log.recordLabel}
                  </dd>
                </div>
              </dl>
            </section>

            {/* =========================================================================
                SECTION 4: EVENT DESCRIPTION
                ========================================================================= */}
            <section
              aria-labelledby="event-description-heading"
              className="bg-white dark:bg-[#0B253F] rounded-xl border border-[#D9E0E7] dark:border-[#1B3754] p-5 shadow-sm space-y-3"
            >
              <h2
                id="event-description-heading"
                className="text-xs font-bold text-[#071A2B] dark:text-white uppercase tracking-wider font-sora flex items-center gap-2"
              >
                <svg className="w-4 h-4 text-[#071A2B] dark:text-[#F2B705]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
                </svg>
                <span>Event Description</span>
              </h2>

              <p className="text-xs text-[#071A2B] dark:text-slate-200 leading-relaxed font-manrope bg-[#F5F7FA] dark:bg-[#071A2B]/40 p-3.5 rounded-lg border border-[#D9E0E7]/60 dark:border-[#1B3754]/60">
                {log.description}
              </p>
            </section>

            {/* =========================================================================
                SECTION 5: BEFORE / AFTER CHANGES
                ========================================================================= */}
            <section
              aria-labelledby="field-changes-heading"
              className="bg-white dark:bg-[#0B253F] rounded-xl border border-[#D9E0E7] dark:border-[#1B3754] p-5 shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#D9E0E7] dark:border-[#1B3754] pb-3">
                <h2
                  id="field-changes-heading"
                  className="text-xs font-bold text-[#071A2B] dark:text-white uppercase tracking-wider font-sora flex items-center gap-2"
                >
                  <svg className="w-4 h-4 text-[#071A2B] dark:text-[#F2B705]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  <span>Before / After Changes</span>
                </h2>
                {log.changes && log.changes.length > 0 && (
                  <span className="text-[11px] font-mono text-[#667085] dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                    {log.changes.length} {log.changes.length === 1 ? 'Field Change' : 'Field Changes'}
                  </span>
                )}
              </div>

              {!log.changes || log.changes.length === 0 ? (
                <div className="p-4 rounded-lg bg-[#F5F7FA] dark:bg-[#071A2B]/30 border border-[#D9E0E7] dark:border-[#1B3754] text-xs text-[#667085] dark:text-slate-400 font-manrope text-center">
                  No field-level changes were recorded for this event.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[#D9E0E7] dark:border-[#1B3754] bg-[#F5F7FA]/70 dark:bg-[#071A2B]/60 text-[#667085] dark:text-slate-400 font-sora font-semibold">
                        <th scope="col" className="py-2.5 px-3">Field</th>
                        <th scope="col" className="py-2.5 px-3">Before</th>
                        <th scope="col" className="py-2.5 px-3">After</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D9E0E7] dark:divide-[#1B3754] font-manrope">
                      {log.changes.map((change, idx) => (
                        <tr key={idx} className="hover:bg-[#F5F7FA]/50 dark:hover:bg-[#071A2B]/30 transition-colors">
                          <td className="py-2.5 px-3 font-semibold text-[#071A2B] dark:text-white font-sora">
                            {change.field}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-[#667085] dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/30">
                            {change.before || '—'}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] font-semibold text-[#00843D] dark:text-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20">
                            {change.after || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* =========================================================================
                SECTION 6: AUDIT TIMELINE
                ========================================================================= */}
            <section
              aria-labelledby="audit-timeline-heading"
              className="bg-white dark:bg-[#0B253F] rounded-xl border border-[#D9E0E7] dark:border-[#1B3754] p-5 shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#D9E0E7] dark:border-[#1B3754] pb-3">
                <h2
                  id="audit-timeline-heading"
                  className="text-xs font-bold text-[#071A2B] dark:text-white uppercase tracking-wider font-sora flex items-center gap-2"
                >
                  <svg className="w-4 h-4 text-[#071A2B] dark:text-[#F2B705]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Audit Timeline</span>
                </h2>
                <span className="text-[11px] font-mono text-[#667085] dark:text-slate-400">
                  Chronological Context
                </span>
              </div>

              {(!log.timeline || log.timeline.length === 0) ? (
                <div className="p-4 rounded-lg bg-[#F5F7FA] dark:bg-[#071A2B]/30 border border-[#D9E0E7] dark:border-[#1B3754] text-xs text-[#667085] dark:text-slate-400 font-manrope text-center">
                  No additional chronological milestones recorded for this event.
                </div>
              ) : (
                <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#D9E0E7] dark:before:bg-[#1B3754]">
                  {log.timeline.map((step, sIdx) => (
                    <div key={sIdx} className="relative">
                      {/* Timeline node dot */}
                      <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-[#071A2B] dark:bg-[#F2B705] ring-4 ring-white dark:ring-[#0B253F]" />
                      <div className="space-y-0.5">
                        <div className="flex flex-wrap items-baseline gap-2">
                          <span className="font-bold text-xs text-[#071A2B] dark:text-white font-sora">
                            {step.event}
                          </span>
                          <span className="font-mono text-[10px] text-[#667085] dark:text-slate-400">
                            {step.timestamp}
                          </span>
                        </div>
                        {step.note && (
                          <p className="text-xs text-[#667085] dark:text-slate-300 font-manrope">
                            {step.note}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        ) : null}
      </div>
    </AdminShell>
  );
}
