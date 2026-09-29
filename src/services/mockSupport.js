// WinDriveSA Support Service Bridge
// Directs legacy references cleanly to the authoritative Supabase support service

export {
  getSupportRequests,
  getSupportMetrics,
  getSupportRequest as getSupportRequestById,
  updateSupportStatus as updateSupportRequestStatus,
  sendAdminSupportReply as sendSupportReply,
  addInternalNote,
  reopenSupportRequest,
  getSupportConfig,
} from './support.js';
