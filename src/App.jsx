import React, { useEffect } from 'react';
import { Route, Routes, useLocation, useNavigate, Navigate, Link } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminProtectedRoute from './components/auth/AdminProtectedRoute';
import Homepage from './pages/public/Homepage';
import Register from './pages/auth/Register';
import Login from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import Dashboard from './pages/dashboard/Dashboard';
import CashPrizeClaim from './pages/claims/CashPrizeClaim';
import VehiclePrizeClaim from './pages/claims/VehiclePrizeClaim';
import ClaimRequests from './pages/claims/ClaimRequests';
import Account from './pages/account/Account';
import Support from './pages/support/Support';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminUserDetails from './pages/admin/AdminUserDetails';
import AdminUserCreate from './pages/admin/AdminUserCreate';
import AdminRewards from './pages/admin/AdminRewards';
import AdminRewardCreate from './pages/admin/AdminRewardCreate';
import AdminCashPrizes from './pages/admin/AdminCashPrizes';
import AdminCashPrizeCreate from './pages/admin/AdminCashPrizeCreate';
import AdminVehiclePrizes from './pages/admin/AdminVehiclePrizes';
import AdminVehiclePrizeCreate from './pages/admin/AdminVehiclePrizeCreate';
import AdminClaims from './pages/admin/AdminClaims';
import AdminClaimDetail from './pages/admin/AdminClaimDetail';
import AdminClaimRequirements from './pages/admin/AdminClaimRequirements';
import AdminWinners from './pages/admin/AdminWinners';
import AdminWinnerDetail from './pages/admin/AdminWinnerDetail';
import AdminSupport from './pages/admin/AdminSupport';
import AdminSupportDetail from './pages/admin/AdminSupportDetail';
import AdminAuditLogs from './pages/admin/AdminAuditLogs';
import AdminAuditLogDetail from './pages/admin/AdminAuditLogDetail';
import AdminSettings from './pages/admin/AdminSettings';

function NotFound() {
  return (
    <main className="min-h-screen bg-[#F5F7FA] dark:bg-[#071A2B] flex flex-col items-center justify-center p-6 text-center font-manrope transition-colors">
      <div className="max-w-md w-full bg-white dark:bg-[#0B2238] rounded-2xl p-8 sm:p-10 shadow-lg border border-[#D9E3F1] dark:border-[#1B354F] flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-[#F2B705]/10 border border-[#F2B705]/20 flex items-center justify-center text-[#F2B705] font-sora font-extrabold text-2xl mb-5 shadow-xs">
          404
        </div>
        <span className="text-xs font-sora font-bold tracking-widest text-[#F2B705] uppercase mb-1">
          WINDRIVESA
        </span>
        <h1 className="font-sora text-2xl sm:text-3xl font-bold text-[#071A2B] dark:text-white mb-2">
          Page Not Found
        </h1>
        <p className="text-sm text-[#667085] dark:text-slate-300 leading-relaxed mb-6">
          The requested screen or resource could not be found. Please check the address or return to the platform.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
          <Link
            to="/"
            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-[#071A2B] dark:bg-[#F2B705] text-white dark:text-[#071A2B] font-sora text-sm font-bold shadow-md hover:bg-[#0e2740] dark:hover:bg-[#dfa704] transition-all text-center"
          >
            Go Home
          </Link>
          <Link
            to="/login"
            className="w-full sm:flex-1 py-3 px-4 rounded-xl border border-[#D9E3F1] dark:border-[#1B354F] text-[#071A2B] dark:text-slate-200 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-slate-800 transition-all text-center"
          >
            Sign In
          </Link>
        </div>
      </div>
      <p className="mt-8 text-xs text-[#98A2B3] dark:text-slate-400 font-manrope">
        Official WinDriveSA Verification Platform &bull; RSA Allocation Registry
      </p>
    </main>
  );
}

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();

  // Support hash-based navigation if window.location.hash is set (e.g. /#/admin)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash && window.location.hash.startsWith('#/')) {
      const target = window.location.hash.slice(1);
      if (target && target !== location.pathname) {
        navigate(target, { replace: true });
      }
    }
  }, [location.pathname, navigate]);

  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          {/* PUBLIC */}
          <Route path="/" element={<Homepage />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* AUTHENTICATED USER */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/rewards" element={<ProtectedRoute><Navigate to="/dashboard" replace /></ProtectedRoute>} />
          <Route path="/claims" element={<ProtectedRoute><ClaimRequests /></ProtectedRoute>} />
          <Route path="/claims/cash" element={<ProtectedRoute><CashPrizeClaim /></ProtectedRoute>} />
          <Route path="/claims/vehicle" element={<ProtectedRoute><VehiclePrizeClaim /></ProtectedRoute>} />
          <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
          <Route path="/support" element={<ProtectedRoute><Support /></ProtectedRoute>} />

          {/* ADMIN */}
          <Route path="/admin" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
          <Route path="/admin/" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
          <Route path="/admin/users" element={<AdminProtectedRoute><AdminUsers /></AdminProtectedRoute>} />
          <Route path="/admin/users/create" element={<AdminProtectedRoute><AdminUserCreate /></AdminProtectedRoute>} />
          <Route path="/admin/users/:id" element={<AdminProtectedRoute><AdminUserDetails /></AdminProtectedRoute>} />
          <Route path="/admin/rewards" element={<AdminProtectedRoute><AdminRewards /></AdminProtectedRoute>} />
          <Route path="/admin/rewards/create" element={<AdminProtectedRoute><AdminRewardCreate /></AdminProtectedRoute>} />
          <Route path="/admin/cash-prizes" element={<AdminProtectedRoute><AdminCashPrizes /></AdminProtectedRoute>} />
          <Route path="/admin/cash-prizes/create" element={<AdminProtectedRoute><AdminCashPrizeCreate /></AdminProtectedRoute>} />
          <Route path="/admin/vehicle-prizes" element={<AdminProtectedRoute><AdminVehiclePrizes /></AdminProtectedRoute>} />
          <Route path="/admin/vehicle-prizes/create" element={<AdminProtectedRoute><AdminVehiclePrizeCreate /></AdminProtectedRoute>} />
          <Route path="/admin/claims" element={<AdminProtectedRoute><AdminClaims /></AdminProtectedRoute>} />
          <Route path="/admin/claims/:id" element={<AdminProtectedRoute><AdminClaimDetail /></AdminProtectedRoute>} />
          <Route path="/admin/claim-requirements" element={<AdminProtectedRoute><AdminClaimRequirements /></AdminProtectedRoute>} />
          <Route path="/admin/winners" element={<AdminProtectedRoute><AdminWinners /></AdminProtectedRoute>} />
          <Route path="/admin/winners/:id" element={<AdminProtectedRoute><AdminWinnerDetail /></AdminProtectedRoute>} />
          <Route path="/admin/support" element={<AdminProtectedRoute><AdminSupport /></AdminProtectedRoute>} />
          <Route path="/admin/support/:id" element={<AdminProtectedRoute><AdminSupportDetail /></AdminProtectedRoute>} />
          <Route path="/admin/audit-logs" element={<AdminProtectedRoute><AdminAuditLogs /></AdminProtectedRoute>} />
          <Route path="/admin/audit-logs/:id" element={<AdminProtectedRoute><AdminAuditLogDetail /></AdminProtectedRoute>} />
          <Route path="/admin/settings" element={<AdminProtectedRoute><AdminSettings /></AdminProtectedRoute>} />

          {/* 404 NOT FOUND (Do not make "/" the fallback for every unknown route) */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}

