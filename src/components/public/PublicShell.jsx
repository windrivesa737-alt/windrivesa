import React from 'react';
import PublicNavbar from './PublicNavbar';

export default function PublicShell({ children }) {
  return (
    <div className="min-h-screen bg-surface dark:bg-[#071A2B] font-body-md text-on-surface dark:text-white antialiased transition-colors duration-300 flex flex-col">
      <PublicNavbar />
      <div className="flex-1 w-full">
        {children}
      </div>
    </div>
  );
}
