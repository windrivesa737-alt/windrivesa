// WinDriveSA Support Service Abstraction
// Bridges seamlessly to centralized Supabase support service layer (src/services/support.js)

export {
  SUPPORT_CONFIG,
  getSupportConfig,
  getMySupportRequests as getUserSupportRequests,
  createSupportRequest,
  getMySupportRequest as getSupportRequestById,
  sendSupportMessage,
} from './support.js';
