import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase.js';

// Clean admin navigation configuration strictly matching WinDriveSA admin architecture
export const ADMIN_NAV_ITEMS = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    route: '/admin',
    icon: (
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    key: 'users',
    label: 'Users',
    route: '/admin/users',
    icon: (
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    key: 'rewards',
    label: 'Rewards',
    route: '/admin/rewards',
    icon: (
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    key: 'cash-prizes',
    label: 'Cash Prizes',
    route: '/admin/cash-prizes',
    icon: (
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    key: 'vehicle-prizes',
    label: 'Vehicle Prizes',
    route: '/admin/vehicle-prizes',
    icon: (
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 17a2 2 0 100-4 2 2 0 000 4zm10 0a2 2 0 100-4 2 2 0 000 4zM4 11h16M4 11V7a1 1 0 011-1h10l4 5v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-7z" />
      </svg>
    ),
  },
  {
    key: 'claims',
    label: 'Claim Requests',
    route: '/admin/claims',
    icon: (
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    key: 'claim-requirements',
    label: 'Claim Requirements',
    route: '/admin/claim-requirements',
    icon: (
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
      </svg>
    ),
  },
  {
    key: 'winners',
    label: 'Winners',
    route: '/admin/winners',
    icon: (
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
  },
  {
    key: 'support',
    label: 'Support',
    route: '/admin/support',
    icon: (
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    key: 'audit-logs',
    label: 'Audit Logs',
    route: '/admin/audit-logs',
    icon: (
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    key: 'settings',
    label: 'Settings',
    route: '/admin/settings',
    icon: (
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export default function AdminShell({
  children,
  activeKey = 'dashboard',
  breadcrumb = 'HQ Admin Console / Operations Overview',
  toastState,
  onCloseToast,
}) {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const { user: authUser, profile, logout } = useAuth();
  const navigate = useNavigate();

  const DEFAULT_ADMIN = {
    id: 'usr_admin_001',
    fullName: 'Super Admin Console',
    memberId: 'WD-HQ-001',
    email: 'admin@windrivesa.co.za',
    mobile: '+27820000001',
    role: 'admin',
    status: 'ACTIVE',
  };

  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  const [adminUser, setAdminUser] = useState(() => {
    if (profile && profile.role === 'ADMIN') {
      return {
        id: profile.id,
        fullName: profile.full_name || 'Super Admin Console',
        memberId: profile.member_number || 'WD-HQ-001',
        email: profile.email || authUser?.email || 'admin@windrivesa.co.za',
        mobile: profile.mobile_number || '+27820000001',
        role: 'admin',
        status: profile.account_status || 'ACTIVE',
      };
    }
    return DEFAULT_ADMIN;
  });
  const mobileDrawerRef = useRef(null);

  // Sync admin user if session updates
  useEffect(() => {
    if (profile && profile.role === 'ADMIN') {
      setAdminUser({
        id: profile.id,
        fullName: profile.full_name || 'Super Admin Console',
        memberId: profile.member_number || 'WD-HQ-001',
        email: profile.email || authUser?.email || 'admin@windrivesa.co.za',
        mobile: profile.mobile_number || '+27820000001',
        role: 'admin',
        status: profile.account_status || 'ACTIVE',
      });
    }
  }, [profile, authUser]);

  // Handle ESC key to close mobile drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isAdminMenuOpen) {
        setIsAdminMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAdminMenuOpen]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isAdminMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isAdminMenuOpen]);

  const handleAdminLogout = async (e) => {
    if (e) e.preventDefault();
    await logout();
    navigate('/login', { replace: true });
  };

  const handleNavClick = (route) => {
    setIsAdminMenuOpen(false);
    navigate(route);
  };

  const currentAdmin = adminUser || DEFAULT_ADMIN;

  const [sidebarCounts, setSidebarCounts] = useState({
    users: 0,
    claims: 0,
    requirements: 0,
    support: 0,
  });

  useEffect(() => {
    let isMounted = true;
    async function fetchSidebarCounts() {
      if (!isSupabaseConfigured() || !supabase) return;
      try {
        const [
          { count: pendingUsers },
          { count: claimsCount },
          { count: reqsCount },
          { count: openSupport },
        ] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('account_status', 'PENDING_REVIEW'),
          supabase.from('claims').select('*', { count: 'exact', head: true }).in('status', ['SUBMITTED', 'UNDER_REVIEW', 'REQUIREMENT_PENDING', 'PROCESSING']),
          supabase.from('claim_requirements').select('*', { count: 'exact', head: true }).eq('is_active', true),
          supabase.from('support_requests').select('*', { count: 'exact', head: true }).eq('status', 'OPEN'),
        ]);

        if (isMounted) {
          setSidebarCounts({
            users: typeof pendingUsers === 'number' ? pendingUsers : 0,
            claims: typeof claimsCount === 'number' ? claimsCount : 0,
            requirements: typeof reqsCount === 'number' ? reqsCount : 0,
            support: typeof openSupport === 'number' ? openSupport : 0,
          });
        }
      } catch (err) {
        console.debug('Error fetching sidebar counts:', err);
      }
    }

    fetchSidebarCounts();
    return () => {
      isMounted = false;
    };
  }, [location.pathname]);

  const getItemBadge = (key) => {
    if (key === 'users' && sidebarCounts.users > 0) {
      return { badge: String(sidebarCounts.users), color: 'amber' };
    }
    if (key === 'claims' && sidebarCounts.claims > 0) {
      return { badge: String(sidebarCounts.claims), color: 'gold' };
    }
    if (key === 'claim-requirements' && sidebarCounts.requirements > 0) {
      return { badge: String(sidebarCounts.requirements), color: 'emerald' };
    }
    if (key === 'support' && sidebarCounts.support > 0) {
      return { badge: `${sidebarCounts.support} OPEN`, color: 'gold' };
    }
    return null;
  };

  const renderBadge = (badge, badgeColor) => {
    if (!badge) return null;
    let colorClasses = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300';
    if (badgeColor === 'amber') {
      colorClasses = 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300';
    } else if (badgeColor === 'gold') {
      colorClasses = 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 font-bold';
    } else if (badgeColor === 'emerald') {
      colorClasses = 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-300';
    } else if (badgeColor === 'purple') {
      colorClasses = 'bg-purple-100 dark:bg-purple-950/80 text-purple-900 dark:text-purple-300';
    }
    return (
      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${colorClasses}`}>
        {badge}
      </span>
    );
  };

  return (
    <div className="bg-[#F5F7FA] dark:bg-[#071A2B] text-[#17212B] dark:text-[#E2E8F0] font-manrope min-h-screen flex flex-col antialiased transition-colors duration-200 selection:bg-[#F2B705] selection:text-[#071A2B]">
      
      {/* =========================================================================
          TABLET / MOBILE COMPACT HEADER (Strictly participates in normal document flow)
          ========================================================================= */}
      <header
        id="admin-mobile-header"
        className="md:hidden w-full bg-white dark:bg-[#071A2B] border-b border-[#D9E0E7] dark:border-[#1B3754] px-4 py-3 sticky top-0 z-40 transition-colors"
      >
        <div className="flex items-center justify-between">
          {/* Logo & Admin Chip */}
          <Link
            to="/admin"
            className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#F2B705] rounded p-0.5"
            aria-label="WinDriveSA Admin Console"
          >
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCvZp8PSQmsGnVn1BhYLec2NQUtFJ1cWu7SF0YqzzGC_pMA_8D13ytzypvxy2JXPXpc_mG416uJeEZJLT4vI29Z1LZKHEPCCufRaKaR3Sa4k3fhltPKGMIocvvaBLUEdkTYm5nSOC966m-Zyy-_xQjG5mxbCrowiQYK8ftGjN_boskqZJz31Dx0R_YsKnS58fkHljS3csSgCUUrQUh_3MrSEwCxTopvVMB0i6tWyokciCWuCo4hXSDFiTHEpphDb23g7yI"
              alt="WinDriveSA Logo"
              className="h-7 w-auto object-contain"
            />
            <span className="text-[10px] font-bold font-sora tracking-widest text-[#F2B705] bg-[#071A2B] dark:bg-[#132A42] px-1.5 py-0.5 rounded border border-[#F2B705]/30">
              ADMIN
            </span>
          </Link>

          {/* Right Controls: Theme Toggle + Stateful Hamburger */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="admin-mobile-theme-toggle"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="p-2 rounded-lg text-[#667085] hover:text-[#071A2B] dark:text-slate-400 dark:hover:text-white bg-[#F5F7FA] dark:bg-[#0B253F] border border-[#D9E0E7] dark:border-[#1B3754] transition-colors focus:outline-none focus:ring-2 focus:ring-[#F2B705]"
            >
              {theme === 'dark' ? (
                <svg className="w-4 h-4 text-[#F2B705]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 9H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-[#071A2B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* Stateful Hamburger Button */}
            <button
              type="button"
              id="admin-mobile-menu-btn"
              onClick={() => setIsAdminMenuOpen(!isAdminMenuOpen)}
              aria-expanded={isAdminMenuOpen}
              aria-label="Toggle Admin Navigation Menu"
              className="p-2 rounded-lg text-[#071A2B] dark:text-white bg-[#F5F7FA] dark:bg-[#0B253F] border border-[#D9E0E7] dark:border-[#1B3754] focus:outline-none focus:ring-2 focus:ring-[#F2B705] transition-colors"
            >
              {isAdminMenuOpen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* =========================================================================
            MOBILE DRAWER (Participates in normal document flow below the compact header)
            ========================================================================= */}
        {isAdminMenuOpen && (
          <div
            id="admin-mobile-drawer"
            ref={mobileDrawerRef}
            className="pt-3 pb-2 border-t border-[#D9E0E7] dark:border-[#1B3754] mt-3 space-y-3 animate-fadeIn"
          >
            {/* Admin Profile Details */}
            <div className="flex items-center gap-3 p-3 bg-[#F5F7FA] dark:bg-[#0B253F] rounded-lg border border-[#D9E0E7] dark:border-[#1B3754]">
              <div className="w-8 h-8 rounded bg-[#071A2B] text-[#F2B705] dark:bg-[#F2B705] dark:text-[#071A2B] font-bold text-xs flex items-center justify-center font-sora">
                SA
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold font-sora text-[#071A2B] dark:text-white truncate">
                  {adminUser.fullName || 'Super Admin Console'}
                </div>
                <div className="text-[10px] text-[#667085] dark:text-slate-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00843D]"></span>
                  <span>HQ Operations • SecOps</span>
                </div>
              </div>
            </div>

            {/* Nav list */}
            <nav aria-label="Mobile Admin Routes" className="space-y-1">
              {ADMIN_NAV_ITEMS.map((item) => {
                const isActive = item.key === activeKey;
                const badgeData = getItemBadge(item.key);
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleNavClick(item.route)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors text-left ${
                      isActive
                        ? 'bg-[#071A2B] text-white dark:bg-[#F2B705] dark:text-[#071A2B] font-semibold'
                        : 'text-[#071A2B] dark:text-slate-300 hover:bg-[#F5F7FA] dark:hover:bg-[#0B253F]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                    {badgeData && renderBadge(badgeData.badge, badgeData.color)}
                  </button>
                );
              })}
            </nav>

            {/* Drawer Logout */}
            <div className="pt-2 border-t border-[#D9E0E7] dark:border-[#1B3754]">
              <button
                type="button"
                onClick={handleAdminLogout}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Sign Out Admin</span>
                </div>
                <span className="text-[10px] font-mono">End Session</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* =========================================================================
          MAIN APPLICATION LAYOUT: DESKTOP SIDEBAR + SCROLLABLE MAIN CONTENT
          ========================================================================= */}
      <div className="flex-1 flex flex-col md:flex-row w-full min-h-screen">
        
        {/* =========================================================================
            DESKTOP SIDEBAR (Left column, full height sticky, strictly isolated from public navbar)
            ========================================================================= */}
        <aside
          id="admin-desktop-sidebar"
          aria-label="Admin Navigation Sidebar"
          className="hidden md:flex flex-col w-64 shrink-0 bg-white dark:bg-[#071A2B] border-r border-[#D9E0E7] dark:border-[#1B3754] h-screen sticky top-0 z-30 transition-colors select-none"
        >
          {/* Logo & Admin Brand Identifier */}
          <div className="p-4 border-b border-[#D9E0E7] dark:border-[#1B3754] flex items-center justify-between">
            <Link
              to="/admin"
              className="flex items-center gap-2.5 focus:outline-none focus:ring-2 focus:ring-[#F2B705] rounded-lg p-1"
              aria-label="WinDriveSA Admin Console"
            >
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCvZp8PSQmsGnVn1BhYLec2NQUtFJ1cWu7SF0YqzzGC_pMA_8D13ytzypvxy2JXPXpc_mG416uJeEZJLT4vI29Z1LZKHEPCCufRaKaR3Sa4k3fhltPKGMIocvvaBLUEdkTYm5nSOC966m-Zyy-_xQjG5mxbCrowiQYK8ftGjN_boskqZJz31Dx0R_YsKnS58fkHljS3csSgCUUrQUh_3MrSEwCxTopvVMB0i6tWyokciCWuCo4hXSDFiTHEpphDb23g7yI"
                alt="WinDriveSA Logo"
                className="h-8 w-auto object-contain"
              />
              <span className="text-[10px] font-bold font-sora tracking-widest text-[#F2B705] bg-[#071A2B] dark:bg-[#132A42] px-1.5 py-0.5 rounded border border-[#F2B705]/30">
                ADMIN
              </span>
            </Link>
          </div>

          {/* Admin Identity Card */}
          <div className="px-4 py-3 border-b border-[#D9E0E7] dark:border-[#1B3754] bg-[#F5F7FA]/70 dark:bg-[#0B253F]/40">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#071A2B] text-[#F2B705] dark:bg-[#F2B705] dark:text-[#071A2B] font-bold text-xs flex items-center justify-center font-sora shadow-sm shrink-0">
                SA
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold font-sora text-[#071A2B] dark:text-white truncate">
                  {adminUser.fullName || 'Super Admin Console'}
                </div>
                <div className="text-[11px] text-[#667085] dark:text-slate-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#00843D]"></span>
                  <span>HQ Operations • SecOps</span>
                </div>
              </div>
            </div>
          </div>

          {/* Primary Navigation Links */}
          <nav
            aria-label="Sidebar Admin Routes"
            className="flex-1 overflow-y-auto px-3 py-3 space-y-1 scrollbar-thin"
          >
            <div className="text-[10px] font-bold font-sora uppercase tracking-wider text-[#667085] dark:text-slate-400 px-3 py-1 mb-1">
              Operations
            </div>

            {ADMIN_NAV_ITEMS.map((item) => {
              const isActive = item.key === activeKey;
              const badgeData = getItemBadge(item.key);
              return (
                <Link
                  key={item.key}
                  id={`nav-${item.key}`}
                  to={item.route}
                  className={`group flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-[#F2B705] ${
                    isActive
                      ? 'bg-[#071A2B] text-white shadow-sm dark:bg-[#F2B705] dark:text-[#071A2B] font-semibold'
                      : 'text-[#071A2B] dark:text-slate-300 hover:bg-[#F5F7FA] dark:hover:bg-[#0B253F]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={isActive ? 'text-inherit' : 'text-[#667085] dark:text-slate-400 group-hover:text-inherit'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {badgeData && renderBadge(badgeData.badge, badgeData.color)}
                </Link>
              );
            })}
          </nav>

          {/* Sidebar Footer Controls: Theme Toggle & Admin Session Logout */}
          <div className="p-3 border-t border-[#D9E0E7] dark:border-[#1B3754] space-y-2 bg-[#F5F7FA]/40 dark:bg-[#0B253F]/20">
            {/* Theme Toggle Button */}
            <button
              type="button"
              id="admin-desktop-theme-toggle"
              onClick={toggleTheme}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg border border-[#D9E0E7] dark:border-[#1B3754] bg-white dark:bg-[#071A2B] text-[#071A2B] dark:text-slate-200 hover:border-[#F2B705] transition-colors focus:outline-none focus:ring-2 focus:ring-[#F2B705]"
            >
              <div className="flex items-center gap-2.5">
                {theme === 'dark' ? (
                  <svg className="w-4 h-4 text-[#F2B705]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 9H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-[#071A2B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
                <span>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
              </div>
              <span className="text-[10px] font-mono text-[#667085] dark:text-slate-400">
                {theme === 'dark' ? 'Night Ops' : 'Standard'}
              </span>
            </button>

            {/* Admin Logout Button */}
            <button
              type="button"
              id="admin-desktop-logout-btn"
              onClick={handleAdminLogout}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Sign Out Admin</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">#WD-HQ-001</span>
            </button>
          </div>
        </aside>

        {/* =========================================================================
            MAIN VIEWPORT AREA (Contains operational context bar, content, and footer)
            ========================================================================= */}
        <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
          
          {/* Operational Context Sub-Header Bar */}
          <div className="hidden sm:flex items-center justify-between px-4 sm:px-8 py-3 bg-white dark:bg-[#071A2B] border-b border-[#D9E0E7] dark:border-[#1B3754] text-xs transition-colors">
            <div className="flex items-center gap-2 text-[#667085] dark:text-slate-400 font-mono">
              <span>{breadcrumb}</span>
            </div>
            <div className="flex items-center gap-4 text-[#667085] dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#00843D] animate-pulse"></span>
                <span className="font-semibold text-[#071A2B] dark:text-slate-200">System Status: Operational</span>
              </div>
              <span className="text-[#D9E0E7] dark:text-slate-700">|</span>
              <span className="font-mono text-[11px]">Time: SAST (UTC+2)</span>
            </div>
          </div>

          {/* Main Content Area */}
          <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full">
            {children}
          </main>

          {/* =========================================================================
              ADMIN FOOTER (Strictly internal compliance)
              ========================================================================= */}
          <footer className="mt-auto border-t border-[#D9E0E7] dark:border-[#1B3754] bg-white dark:bg-[#071A2B] px-4 sm:px-8 py-4 text-xs text-[#667085] dark:text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3 transition-colors">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#071A2B] dark:text-slate-300 font-sora">WinDriveSA (Pty) Ltd.</span>
              <span>•</span>
              <span>Internal Administration & Operations Console</span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-[11px]">
              <span>POPIA Section 18 Compliant</span>
              <span>•</span>
              <span>RSA Reg: 2024/782194/07</span>
              <span>•</span>
              <span className="text-[#F2B705] font-semibold">Strictly Confidential</span>
            </div>
          </footer>

        </div>

      </div>

      {/* =========================================================================
          ADMIN TOAST NOTIFICATION
          Provides realistic feedback for administrator operations (Export, Refresh, Filter)
          ========================================================================= */}
      {toastState && toastState.visible && (
        <aside
          id="admin-toast"
          aria-live="polite"
          role="status"
          className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-[#071A2B] text-white p-4 rounded-xl shadow-2xl border border-[#F2B705]/40 flex items-start gap-3 transform transition-all duration-300 ease-out"
        >
          <div className="w-8 h-8 rounded-lg bg-[#F2B705] text-[#071A2B] flex items-center justify-center shrink-0 font-bold">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h4 id="toast-title" className="text-xs font-bold font-sora text-[#F2B705]">
              {toastState.title}
            </h4>
            <p id="toast-message" className="text-xs text-slate-300 mt-0.5 leading-relaxed">
              {toastState.message}
            </p>
          </div>
          <button
            type="button"
            onClick={onCloseToast}
            aria-label="Dismiss Notification"
            className="text-slate-400 hover:text-white transition-colors p-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </aside>
      )}

    </div>
  );
}
