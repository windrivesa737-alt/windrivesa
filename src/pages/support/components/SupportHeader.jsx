import React from 'react';
import { Link } from 'react-router-dom';

export default function SupportHeader() {
  return (
    <div className="mb-8">
      {/* Breadcrumbs Back Navigation */}
      <nav aria-label="Breadcrumbs" className="mb-4">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#667085] hover:text-[#071A2B] dark:text-gray-400 dark:hover:text-[#F2B705] transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back to Dashboard</span>
          <span className="text-gray-300 dark:text-gray-600">/</span>
          <span className="text-[#071A2B] dark:text-gray-200 font-semibold">Support Desk</span>
        </Link>
      </nav>

      {/* Eyebrow and Page Heading */}
      <span className="inline-block text-[11px] font-bold tracking-widest text-[#F2B705] uppercase mb-1 font-sora">
        SUPPORT
      </span>
      <h1 className="text-2xl sm:text-3xl font-extrabold text-[#071A2B] dark:text-white tracking-tight font-sora">
        How Can We Help?
      </h1>
      <p className="text-sm text-[#667085] dark:text-gray-300 mt-1 max-w-2xl">
        Need help with your account or claim? Contact WinDriveSA support or submit an authenticated request to our verified South African assistance team.
      </p>
    </div>
  );
}
