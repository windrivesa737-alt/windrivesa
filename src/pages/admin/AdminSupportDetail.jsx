import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AdminShell from '../../components/admin/AdminShell';
import { useAuth } from '../../context/AuthContext';
import {
  getSupportRequest,
  updateSupportStatus,
  reopenSupportRequest,
  sendAdminSupportReply,
  addInternalNote,
  getSupportConfig,
} from '../../services/support';

export default function AdminSupportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: authUser, profile } = useAuth();

  const adminUser = profile
    ? {
        id: profile.id,
        fullName: profile.full_name || 'Admin Officer',
        name: profile.full_name || 'Admin Officer',
        email: profile.email || authUser?.email || 'admin@windrivesa.co.za',
        role: profile.role || 'ADMIN',
      }
    : authUser
    ? {
        id: authUser.id,
        fullName: authUser.user_metadata?.full_name || 'Admin Officer',
        name: authUser.user_metadata?.full_name || 'Admin Officer',
        email: authUser.email,
        role: 'ADMIN',
      }
    : null;

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [supportConfig, setSupportConfig] = useState(null);

  // Form Composers State
  const [replyText, setReplyText] = useState('');
  const [noteText, setNoteText] = useState('');
  const [replySending, setReplySending] = useState(false);
  const [noteSending, setNoteSending] = useState(false);

  // Modal States
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [isReopenModalOpen, setIsReopenModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const loadTicket = async () => {
    setLoading(true);
    try {
      const data = await getSupportRequest(id);
      setTicket(data);
    } catch (err) {
      console.error('Error retrieving ticket dossier:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTicket();
    getSupportConfig().then((cfg) => setSupportConfig(cfg));
  }, [id]);

  if (loading) {
    return (
      <AdminShell activeKey="support" breadcrumb="HQ Admin Console / Participant Support Queue">
        <div className="flex items-center justify-center p-12 text-slate-500">
          Loading ticket dossier...
        </div>
      </AdminShell>
    );
  }

  if (!ticket) {
    return (
      <AdminShell activeKey="support" breadcrumb="HQ Admin Console / Participant Support Queue">
        <div className="flex flex-col items-center justify-center p-12 gap-4 text-center max-w-md mx-auto">
          <span className="material-symbols-outlined text-slate-400 text-4xl">search_off</span>
          <h2 className="text-lg font-bold font-sora text-[#071A2B] dark:text-[#EDF4FF]">
            Ticket Not Found
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            No support request was located for identifier <span className="font-mono font-bold">{id}</span>.
          </p>
          <button
            type="button"
            onClick={() => navigate('/admin/support')}
            className="px-4 py-2 rounded-md bg-[#071A2B] text-white dark:bg-[#F2B705] dark:text-[#071A2B] text-xs font-semibold"
          >
            Back to Support Queue
          </button>
        </div>
      </AdminShell>
    );
  }

  // Action Handlers
  const handleStatusChange = async (newStatus) => {
    const res = await updateSupportStatus({
      requestId: ticket.id,
      status: newStatus,
      adminProfileId: adminUser?.id,
      adminUser,
    });
    if (res.success && res.ticket) {
      setTicket(res.ticket);
      setToastMessage({
        type: 'success',
        text: `Support request status updated to ${newStatus}.`,
      });
    } else if (res.error) {
      setToastMessage({
        type: 'error',
        text: res.error,
      });
    }
  };

  const handleConfirmResolve = async () => {
    const res = await updateSupportStatus({
      requestId: ticket.id,
      status: 'RESOLVED',
      adminProfileId: adminUser?.id,
      adminUser,
    });
    if (res.success && res.ticket) {
      setTicket(res.ticket);
      setIsResolveModalOpen(false);
      setToastMessage({
        type: 'success',
        text: `Support ticket ${ticket.ticketNumber} marked as RESOLVED.`,
      });
    }
  };

  const handleConfirmReopen = async () => {
    const res = await reopenSupportRequest({
      requestId: ticket.id,
      adminProfileId: adminUser?.id,
      adminUser,
    });
    if (res.success && res.ticket) {
      setTicket(res.ticket);
      setIsReopenModalOpen(false);
      setToastMessage({
        type: 'success',
        text: `Support ticket ${ticket.ticketNumber} reopened successfully.`,
      });
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || replySending) return;
    setReplySending(true);

    const res = await sendAdminSupportReply({
      requestId: ticket.id,
      adminProfileId: adminUser?.id,
      message: replyText.trim(),
      adminUser,
    });
    if (res.success && res.ticket) {
      setTicket(res.ticket);
      setReplyText('');
      setToastMessage({
        type: 'success',
        text: 'Official dispatch transmitted to participant.',
      });
    } else if (res.error) {
      setToastMessage({
        type: 'error',
        text: res.error,
      });
    }
    setReplySending(false);
  };

  const handleAddInternalNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim() || noteSending) return;
    setNoteSending(true);

    const res = await addInternalNote({
      requestId: ticket.id,
      adminProfileId: adminUser?.id,
      note: noteText.trim(),
      adminUser,
    });
    if (res.success && res.ticket) {
      setTicket(res.ticket);
      setNoteText('');
      setToastMessage({
        type: 'success',
        text: 'Confidential internal note stamped in audit ledger.',
      });
    } else if (res.error) {
      setToastMessage({
        type: 'error',
        text: res.error,
      });
    }
    setNoteSending(false);
  };

  // Status Badge Helper
  const renderDetailStatusBadge = (status) => {
    switch (status) {
      case 'OPEN':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            OPEN
          </span>
        );
      case 'IN PROGRESS':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            IN PROGRESS
          </span>
        );
      case 'WAITING FOR USER':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
            WAITING FOR USER
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-[#00843D]/10 text-[#00843D] dark:text-emerald-400 border border-[#00843D]/20">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00843D]"></span>
            RESOLVED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-slate-100 dark:bg-slate-800 text-slate-600">
            {status}
          </span>
        );
    }
  };

  return (
    <AdminShell
      activeKey="support"
      breadcrumb={`HQ Admin Console / Support Dossier / ${ticket.ticketNumber}`}
      toastState={toastMessage}
      onCloseToast={() => setToastMessage(null)}
    >
      <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto" id="ticket-detail-container">
        
        {/* =========================================================================
            TOP BACK NAVIGATION & DOSSIER TOKEN
            ========================================================================= */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              id="btn-back-to-queue"
              onClick={() => navigate('/admin/support')}
              className="inline-flex items-center gap-2 text-xs font-bold font-sora text-[#071A2B] dark:text-[#EDF4FF] hover:text-[#00843D] dark:hover:text-[#F2B705] transition-colors focus:outline-none"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              <span>Back to Support Queue</span>
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                Dossier Access Token: {ticket.dossierAccessToken || 'WD-SUP-SEC-8902'}
              </span>
            </div>
          </div>

          {/* Header Dossier Title Bar */}
          <div
            id="ticket-header-card"
            className="bg-white dark:bg-[#0B1E30] p-5 sm:p-6 rounded-lg border border-[#D9E0E7] dark:border-[#1E344A] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-[#15273C] text-[#071A2B] dark:text-[#EDF4FF]">
                  {ticket.ticketNumber}
                </span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-slate-200 dark:bg-[#1E344A] text-[#071A2B] dark:text-[#EDF4FF]">
                  {ticket.category}
                </span>
                {renderDetailStatusBadge(ticket.status)}
              </div>
              <h1 className="text-xl sm:text-2xl font-bold font-sora tracking-tight text-[#071A2B] dark:text-[#EDF4FF]">
                {ticket.subject}
              </h1>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                <span>Created: {ticket.timestamp}</span>
                <span>•</span>
                <span>Assigned: {ticket.assignedAdmin || 'Admin Controller 04'}</span>
              </div>
            </div>

            {/* Dynamic Action Buttons */}
            <div className="flex flex-wrap items-center gap-2" id="detail-action-buttons">
              {ticket.status === 'OPEN' && (
                <>
                  <button
                    type="button"
                    id="btn-mark-in-progress"
                    onClick={() => handleStatusChange('IN PROGRESS')}
                    className="px-3.5 py-1.5 rounded-md bg-[#071A2B] hover:bg-slate-800 dark:bg-[#F2B705] dark:hover:bg-amber-400 text-white dark:text-[#071A2B] text-xs font-sora font-semibold transition-all shadow-xs"
                  >
                    Mark In Progress
                  </button>
                  <button
                    type="button"
                    id="btn-open-resolve-modal"
                    onClick={() => setIsResolveModalOpen(true)}
                    className="px-3.5 py-1.5 rounded-md bg-[#00843D] hover:bg-[#007034] text-white text-xs font-sora font-bold transition-all shadow-xs"
                  >
                    Resolve Request
                  </button>
                </>
              )}

              {ticket.status === 'IN PROGRESS' && (
                <>
                  <button
                    type="button"
                    id="btn-waiting-for-user"
                    onClick={() => handleStatusChange('WAITING FOR USER')}
                    className="px-3.5 py-1.5 rounded-md bg-purple-600 hover:bg-purple-700 text-white text-xs font-sora font-semibold transition-all shadow-xs"
                  >
                    Waiting for User
                  </button>
                  <button
                    type="button"
                    id="btn-open-resolve-modal"
                    onClick={() => setIsResolveModalOpen(true)}
                    className="px-3.5 py-1.5 rounded-md bg-[#00843D] hover:bg-[#007034] text-white text-xs font-sora font-bold transition-all shadow-xs"
                  >
                    Resolve Request
                  </button>
                </>
              )}

              {ticket.status === 'WAITING FOR USER' && (
                <>
                  <button
                    type="button"
                    id="btn-mark-in-progress"
                    onClick={() => handleStatusChange('IN PROGRESS')}
                    className="px-3.5 py-1.5 rounded-md bg-[#071A2B] hover:bg-slate-800 dark:bg-[#F2B705] dark:hover:bg-amber-400 text-white dark:text-[#071A2B] text-xs font-sora font-semibold transition-all shadow-xs"
                  >
                    Mark In Progress
                  </button>
                  <button
                    type="button"
                    id="btn-open-resolve-modal"
                    onClick={() => setIsResolveModalOpen(true)}
                    className="px-3.5 py-1.5 rounded-md bg-[#00843D] hover:bg-[#007034] text-white text-xs font-sora font-bold transition-all shadow-xs"
                  >
                    Resolve Request
                  </button>
                </>
              )}

              {ticket.status === 'RESOLVED' && (
                <button
                  type="button"
                  id="btn-open-reopen-modal"
                  onClick={() => setIsReopenModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-md bg-amber-600 hover:bg-amber-700 text-white text-xs font-sora font-bold transition-all shadow-xs"
                >
                  Reopen Request
                </button>
              )}
            </div>
          </div>
        </div>

        {/* =========================================================================
            TWO-COLUMN OPERATIONAL LAYOUT: CONVERSATION (LEFT) & CONTEXT (RIGHT)
            ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* =========================================================================
              LEFT COLUMN: Conversation Thread & Action Composers (8 Columns)
              ========================================================================= */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div
              id="ticket-thread-card"
              className="bg-white dark:bg-[#0B1E30] p-5 sm:p-6 rounded-lg border border-[#D9E0E7] dark:border-[#1E344A] shadow-xs flex flex-col gap-6"
            >
              <div className="flex items-center justify-between border-b border-[#D9E0E7] dark:border-[#1E344A] pb-3">
                <span className="text-xs font-bold uppercase tracking-wider font-sora text-[#071A2B] dark:text-[#EDF4FF]">
                  Regulatory Communications Thread
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-mono">
                  <span className="material-symbols-outlined text-[14px]">lock</span>
                  Encrypted Audit Log
                </span>
              </div>

              {/* Message History Container */}
              <div className="flex flex-col gap-4" id="thread-container">
                {ticket.messages && ticket.messages.length > 0 ? (
                  ticket.messages.map((msg) => {
                    if (msg.type === 'inbound') {
                      return (
                        <div
                          key={msg.id}
                          className="p-4 rounded-lg bg-slate-50 dark:bg-[#071524] border border-[#D9E0E7] dark:border-[#1E344A] flex flex-col gap-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-7 h-7 rounded-full bg-[#071A2B] dark:bg-[#F2B705] text-white dark:text-[#071A2B] flex items-center justify-center font-bold text-xs font-sora">
                                {msg.senderInitials || 'MD'}
                              </span>
                              <div className="flex flex-col">
                                <span className="font-bold text-xs text-[#071A2B] dark:text-[#EDF4FF]">
                                  {msg.senderName}
                                </span>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                                  Inbound Support Ticket
                                </span>
                              </div>
                            </div>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                              {msg.timestamp}
                            </span>
                          </div>
                          <div className="text-xs text-[#071A2B] dark:text-slate-200 leading-relaxed mt-1 font-normal">
                            "{msg.body}"
                          </div>
                        </div>
                      );
                    }

                    if (msg.type === 'internal_note') {
                      return (
                        <div
                          key={msg.id}
                          className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-700/40 flex flex-col gap-2"
                        >
                          <div className="flex items-center justify-between text-amber-900 dark:text-amber-300">
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-[18px]">lock_person</span>
                              <span className="text-xs font-bold uppercase tracking-wider font-sora">
                                Internal Confidential Note (Admin Only)
                              </span>
                            </div>
                            <span className="text-[11px] font-mono opacity-80">{msg.timestamp}</span>
                          </div>
                          <div className="text-xs text-amber-950 dark:text-amber-200 leading-relaxed font-medium">
                            "{msg.body}"
                          </div>
                          <div className="text-[10px] text-amber-800 dark:text-amber-400 font-bold uppercase tracking-wider">
                            {msg.authorNote || `Author: ${msg.senderName} • Level 4 Audit Stamp`}
                          </div>
                        </div>
                      );
                    }

                    if (msg.type === 'dispatch') {
                      return (
                        <div
                          key={msg.id}
                          className="p-4 rounded-lg bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 flex flex-col gap-2 ml-2 sm:ml-4"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-md bg-[#071A2B] text-[#F2B705] flex items-center justify-center font-bold text-xs font-sora">
                                {msg.senderInitials || 'AC'}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-xs text-[#071A2B] dark:text-[#EDF4FF]">
                                  {msg.senderName}
                                </span>
                                <span className="text-[10px] text-[#00843D] dark:text-emerald-400 font-semibold">
                                  {msg.badge || 'Official Dispatch'}
                                </span>
                              </div>
                            </div>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                              {msg.timestamp}
                            </span>
                          </div>
                          <div className="text-xs text-[#071A2B] dark:text-slate-200 leading-relaxed mt-1">
                            "{msg.body}"
                          </div>
                        </div>
                      );
                    }

                    return null;
                  })
                ) : (
                  <p className="text-xs text-slate-500 italic">No communication logs recorded.</p>
                )}
              </div>

              {/* Composers Section */}
              <div className="flex flex-col gap-5 pt-4 border-t border-[#D9E0E7] dark:border-[#1E344A]">
                
                {/* 1. Reply to User Composer */}
                <form onSubmit={handleSendReply} className="flex flex-col gap-2" id="reply-form">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-sora text-[#071A2B] dark:text-[#EDF4FF] flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[17px]">reply</span>
                      Reply to User
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      Direct email &amp; in-app notification to claimant
                    </span>
                  </div>
                  <textarea
                    id="reply-textarea"
                    rows={3}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Compose official response to user... (Strict compliance: Never request banking PINs, OTPs, or passwords)"
                    className="w-full p-3 text-xs rounded-md border border-[#D9E0E7] dark:border-[#1E344A] bg-white dark:bg-[#071524] text-[#071A2B] dark:text-[#EDF4FF] focus:outline-none focus:ring-1 focus:ring-[#071A2B] dark:focus:ring-[#F2B705]"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      POPIA Compliant Dispatch
                    </span>
                    <button
                      type="submit"
                      id="btn-send-reply"
                      disabled={replySending || !replyText.trim()}
                      className="px-4 py-2 rounded-md bg-[#071A2B] hover:bg-slate-800 dark:bg-[#F2B705] dark:hover:bg-amber-400 text-white dark:text-[#071A2B] font-sora font-semibold text-xs transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span>{replySending ? 'Dispatching...' : 'Send Official Reply'}</span>
                      <span className="material-symbols-outlined text-[16px]">send</span>
                    </button>
                  </div>
                </form>

                {/* 2. Add Internal Confidential Note Composer */}
                <form
                  onSubmit={handleAddInternalNote}
                  className="flex flex-col gap-2 pt-4 border-t border-dashed border-[#D9E0E7] dark:border-[#1E344A]"
                  id="internal-note-form"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-sora text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[17px]">lock</span>
                      Add Internal Note (Not visible to user)
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      Restricted to Level 4 Controllers
                    </span>
                  </div>
                  <textarea
                    id="internal-note-textarea"
                    rows={2}
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Record internal audit notes, verified Natis or banking cross-references..."
                    className="w-full p-3 text-xs rounded-md border border-amber-300 dark:border-amber-700/50 bg-amber-50/50 dark:bg-[#151D29] text-[#071A2B] dark:text-[#EDF4FF] focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      id="btn-add-internal-note"
                      disabled={noteSending || !noteText.trim()}
                      className="px-3 py-1.5 rounded-md bg-amber-600 hover:bg-amber-700 text-white font-sora font-semibold text-xs transition-all shadow-xs flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span>{noteSending ? 'Recording...' : 'Add Confidential Note'}</span>
                      <span className="material-symbols-outlined text-[15px]">add_circle</span>
                    </button>
                  </div>
                </form>

              </div>
            </div>
          </div>

          {/* =========================================================================
              RIGHT COLUMN: Claimant Context & Associated Claim (4 Columns)
              ========================================================================= */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* 1. User Context Dossier */}
            <div
              id="user-context-card"
              className="bg-white dark:bg-[#0B1E30] p-5 rounded-lg border border-[#D9E0E7] dark:border-[#1E344A] shadow-xs flex flex-col gap-4"
            >
              <div className="flex items-center justify-between border-b border-[#D9E0E7] dark:border-[#1E344A] pb-2.5">
                <span className="text-xs font-bold uppercase tracking-wider font-sora text-[#071A2B] dark:text-[#EDF4FF]">
                  Claimant Identity Dossier
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400">
                  {ticket.user.ficaStatus === 'MATCHED' ? 'VERIFIED' : 'PENDING REVIEW'}
                </span>
              </div>

              <div className="flex flex-col gap-3 text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Legal Identity</span>
                  <span className="font-bold text-[#071A2B] dark:text-[#EDF4FF] font-sora">
                    {ticket.user.name}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Verified Email</span>
                  <span className="font-mono text-[#071A2B] dark:text-[#EDF4FF]">
                    {ticket.user.email}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Mobile Telecom MSISDN</span>
                  <span className="font-mono text-[#071A2B] dark:text-[#EDF4FF]">
                    {ticket.user.msisdn || ticket.user.phone}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">National Registration Date</span>
                  <span className="font-mono text-[#071A2B] dark:text-[#EDF4FF]">
                    {ticket.user.registrationDate || '01 Sep 2026, 08:14 SAST'}
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-md bg-slate-50 dark:bg-[#071524] border border-[#D9E0E7] dark:border-[#1E344A] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-[#00843D]">fingerprint</span>
                  <span className="text-[11px] font-semibold text-[#071A2B] dark:text-[#EDF4FF]">
                    {ticket.user.ficaTier || 'FICA Tier 2 Verification'}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-[#00843D] dark:text-emerald-400">
                  {ticket.user.ficaStatus || 'MATCHED'}
                </span>
              </div>
            </div>

            {/* 2. Associated Claim / Related Reward Context */}
            {ticket.associatedClaim && ticket.associatedClaim.hasClaim && (
              <div
                id="related-claim-card"
                className="bg-white dark:bg-[#0B1E30] p-5 rounded-lg border border-[#D9E0E7] dark:border-[#1E344A] shadow-xs flex flex-col gap-4"
              >
                <div className="flex items-center justify-between border-b border-[#D9E0E7] dark:border-[#1E344A] pb-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider font-sora text-[#071A2B] dark:text-[#EDF4FF]">
                    Associated Claim
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-700 dark:text-blue-400">
                    {ticket.associatedClaim.status}
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="font-sora font-bold text-sm text-[#071A2B] dark:text-[#EDF4FF]">
                    {ticket.associatedClaim.title}
                  </span>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Ref: <span className="font-mono font-semibold">{ticket.associatedClaim.claimId}</span>
                  </div>

                  {ticket.associatedClaim.applicableCharge && (
                    <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between py-1 border-y border-dashed border-slate-200 dark:border-slate-800">
                      <span className="font-medium">Applicable Charge:</span>
                      <span className="font-mono font-bold text-amber-700 dark:text-amber-400">
                        {ticket.associatedClaim.applicableCharge}
                      </span>
                    </div>
                  )}

                  <div className="mt-2 p-3 rounded-md bg-slate-50 dark:bg-[#071524] border border-[#D9E0E7] dark:border-[#1E344A]">
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Guaranteed Institutional Value
                    </div>
                    <div className="text-lg font-bold font-sora text-[#071A2B] dark:text-[#EDF4FF] tabular-nums">
                      {ticket.associatedClaim.guaranteedValue}
                    </div>
                  </div>
                </div>

                <Link
                  id="link-view-claim-dossier"
                  to={ticket.associatedClaim.claimRouteId ? `/admin/claims/${ticket.associatedClaim.claimRouteId}` : '/admin/claims'}
                  className="w-full py-2 px-3 rounded-md bg-[#071A2B] hover:bg-slate-800 dark:bg-[#F2B705] dark:hover:bg-amber-400 text-white dark:text-[#071A2B] text-xs font-sora font-semibold text-center transition-all flex items-center justify-center gap-1 shadow-xs"
                >
                  <span>View Full Claim Dossier</span>
                  <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                </Link>
              </div>
            )}

            {/* 3. Direct WhatsApp Desk Card */}
            <div
              id="ticket-whatsapp-card"
              className="p-4 rounded-lg bg-[#071A2B] text-white border border-[#1E344A] flex flex-col gap-3 shadow-sm"
            >
              <div className="flex items-center gap-2 text-[#00843D]">
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  chat
                </span>
                <span className="font-sora text-xs font-bold tracking-wide text-white">
                  Direct WhatsApp Desk
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Support channel only. WinDriveSA never processes payments or requests banking credentials, PINs, or OTPs via WhatsApp.
              </p>
              {supportConfig?.isWhatsAppAvailable ? (
                <a
                  id="ticket-whatsapp-link"
                  href={`https://wa.me/${supportConfig.whatsappRawNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-[#00843D] hover:bg-[#007034] text-white font-sora text-xs font-bold transition-all shadow-xs"
                >
                  <span>Chat with Participant</span>
                  <span className="material-symbols-outlined text-[15px]">open_in_new</span>
                </a>
              ) : (
                <div className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-slate-800 text-slate-400 font-sora text-xs font-semibold">
                  <span>WhatsApp Desk Offline</span>
                </div>
              )}
            </div>

            {/* 4. POPIA & Statutory Notice Box */}
            <div
              id="ticket-popia-box"
              className="p-4 rounded-lg bg-[#071A2B] text-white border border-[#1E344A] flex flex-col gap-2 shadow-xs"
            >
              <div className="flex items-center gap-2 text-[#F2B705]">
                <span className="material-symbols-outlined text-[18px]">gavel</span>
                <span className="text-xs font-bold uppercase tracking-wide font-sora">
                  POPIA Section 18 Compliance
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                WinDriveSA Support is restricted to operational verification. Agents must strictly never collect, solicit, or log claimant full credit card numbers, ATM PIN codes, or one-time verification passwords (OTPs).
              </p>
            </div>

          </div>
        </div>

        {/* =========================================================================
            STATUTORY FOOTER
            ========================================================================= */}
        <footer
          id="detail-audit-footer"
          className="w-full mt-6 pt-6 border-t border-[#D9E0E7] dark:border-[#1E344A] flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400"
        >
          <div className="flex flex-col sm:flex-row items-center gap-2 text-center sm:text-left">
            <span className="font-bold text-[#071A2B] dark:text-[#EDF4FF] font-sora">
              WinDriveSA Customer Operations Desk
            </span>
            <span className="hidden sm:inline">•</span>
            <span>POPIA Section 18 &amp; SARB Escrow Audit Ledger Compliant</span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span>Node: JHB-FID-04</span>
            <span>•</span>
            <span className="text-[#00843D] dark:text-emerald-400 font-semibold">
              SSL 256-bit Encrypted
            </span>
          </div>
        </footer>

      </div>

      {/* =========================================================================
          RESOLUTION CONFIRMATION MODAL
          ========================================================================= */}
      {isResolveModalOpen && (
        <div
          id="resolve-modal"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white dark:bg-[#0B1E30] w-full max-w-md rounded-lg border border-[#D9E0E7] dark:border-[#1E344A] shadow-2xl p-6 flex flex-col gap-4">
            <div className="w-12 h-12 rounded-full bg-[#00843D]/10 text-[#00843D] flex items-center justify-center">
              <span className="material-symbols-outlined text-[28px]">verified</span>
            </div>
            <div>
              <h2 className="text-base font-bold font-sora text-[#071A2B] dark:text-[#EDF4FF]">
                Resolve Support Request?
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                This will officially flag ticket{' '}
                <span className="font-mono font-bold text-[#071A2B] dark:text-white">
                  {ticket.ticketNumber}
                </span>{' '}
                as RESOLVED. An audit notice will be transmitted to the claimant and archived in the institutional ledger.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                id="btn-cancel-resolve"
                onClick={() => setIsResolveModalOpen(false)}
                className="px-4 py-2 rounded-md text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-[#071A2B] dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-resolve"
                onClick={handleConfirmResolve}
                className="px-4 py-2 rounded-md bg-[#00843D] hover:bg-[#007034] text-white text-xs font-sora font-bold transition-all shadow-xs"
              >
                Confirm Resolution
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          REOPEN CONFIRMATION MODAL
          ========================================================================= */}
      {isReopenModalOpen && (
        <div
          id="reopen-modal"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white dark:bg-[#0B1E30] w-full max-w-md rounded-lg border border-[#D9E0E7] dark:border-[#1E344A] shadow-2xl p-6 flex flex-col gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[28px]">restart_alt</span>
            </div>
            <div>
              <h2 className="text-base font-bold font-sora text-[#071A2B] dark:text-[#EDF4FF]">
                Reopen Support Request?
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                This will move the request back into OPEN status and alert the Operations Desk for immediate first response follow-up.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                id="btn-cancel-reopen"
                onClick={() => setIsReopenModalOpen(false)}
                className="px-4 py-2 rounded-md text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-[#071A2B] dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-reopen"
                onClick={handleConfirmReopen}
                className="px-4 py-2 rounded-md bg-[#071A2B] hover:bg-slate-800 dark:bg-[#F2B705] dark:hover:bg-amber-400 text-white dark:text-[#071A2B] text-xs font-sora font-bold transition-all shadow-xs"
              >
                Reopen Request
              </button>
            </div>
          </div>
        </div>
      )}

    </AdminShell>
  );
}
