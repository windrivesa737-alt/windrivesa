import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AdminProtectedRoute({ children }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#071A2B] flex items-center justify-center font-manrope text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-white/20 border-t-[#F2B705] rounded-full animate-spin"></div>
          <span className="text-xs font-semibold text-slate-300 tracking-wider uppercase">
            Verifying Administrative Credentials…
          </span>
        </div>
      </div>
    );
  }

  // Not logged in -> redirect to /login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Logged in as standard USER, but not ADMIN -> Strictly denied access!
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
