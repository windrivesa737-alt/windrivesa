import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] dark:bg-[#071A2B] flex items-center justify-center font-manrope">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#071A2B]/20 dark:border-white/20 border-t-[#F2B705] rounded-full animate-spin"></div>
          <span className="text-xs font-semibold text-[#667085] dark:text-gray-400 tracking-wider uppercase">
            Verifying Session…
          </span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
