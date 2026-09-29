import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

export default function PublicNavbar() {
  const { theme, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  const navLinks = [
    { id: 'home', label: 'Home', href: '#home' },
    { id: 'prizes', label: 'Prizes', href: '#prizes' },
    { id: 'how-it-works', label: 'How It Works', href: '#how-it-works' },
    { id: 'about', label: 'About', href: '#about' },
    { id: 'faqs', label: 'FAQs', href: '#faqs' },
    { id: 'contact', label: 'Contact', href: '#contact' },
  ];

  // Active section tracker via IntersectionObserver
  useEffect(() => {
    const sectionIds = ['home', 'prizes', 'how-it-works', 'about', 'faqs', 'contact'];
    const observedElements = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    if (observedElements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        root: null,
        rootMargin: '-20% 0px -60% 0px',
        threshold: 0,
      }
    );

    observedElements.forEach((el) => observer.observe(el));

    return () => {
      observedElements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  // Handle Escape key to close mobile menu
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [isMobileMenuOpen]);

  const scrollToSection = (e, targetId) => {
    e.preventDefault();
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setActiveSection(targetId);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Sticky public navbar in normal document flow */}
      <header
        id="public-header"
        className="sticky top-0 z-40 w-full bg-surface/90 dark:bg-[#071A2B]/90 backdrop-blur-xl border-b border-surface-container-highest/60 dark:border-white/10 shadow-[0_1px_8px_rgba(0,0,0,0.04)] transition-colors duration-300"
      >
        <div className="h-20 max-w-7xl mx-auto px-6 lg:px-margin flex items-center justify-between gap-space-md">
          {/* Logo Section */}
          <a
            id="brand-logo-link"
            aria-label="WinDriveSA Home"
            className="flex items-center shrink-0 focus:outline-none focus:ring-2 focus:ring-secondary-container rounded p-1"
            href="#home"
            onClick={(e) => scrollToSection(e, 'home')}
          >
            <img
              id="brand-logo-img"
              alt="WinDriveSA Logo"
              className="h-10 sm:h-11 w-auto object-contain transition-transform hover:scale-[1.02]"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCvZp8PSQmsGnVn1BhYLec2NQUtFJ1cWu7SF0YqzzGC_pMA_8D13ytzypvxy2JXPXpc_mG416uJeEZJLT4vI29Z1LZKHEPCCufRaKaR3Sa4k3fhltPKGMIocvvaBLUEdkTYm5nSOC966m-Zyy-_xQjG5mxbCrowiQYK8ftGjN_boskqZJz31Dx0R_YsKnS58fkHljS3csSgCUUrQUh_3MrSEwCxTopvVMB0i6tWyokciCWuCo4hXSDFiTHEpphDb23g7yI"
            />
          </a>

          {/* Desktop Nav Links (Hidden below 1024px) */}
          <nav
            id="desktop-nav"
            aria-label="Main Navigation"
            className="hidden lg:flex items-center gap-1.5"
          >
            {navLinks.map((link) => {
              const isActive = activeSection === link.id;
              return (
                <a
                  key={link.id}
                  id={`nav-link-${link.id}`}
                  className={`nav-link px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'active bg-[#e4effd]/90 text-[#121c26] dark:bg-[#132E47] dark:text-[#F2B705] font-semibold'
                      : 'text-on-surface-variant dark:text-[#AAB7C4] hover:text-on-surface dark:hover:text-white'
                  }`}
                  data-nav={link.id}
                  href={link.href}
                  onClick={(e) => scrollToSection(e, link.id)}
                >
                  {link.label}
                </a>
              );
            })}
          </nav>

          {/* Right Header Actions: [Theme Toggle] [Log In] [Create Account] [Hamburger] */}
          <div id="header-actions" className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Theme Toggle Button */}
            <button
              id="theme-toggle"
              type="button"
              aria-label={`Toggle theme (currently ${theme} mode)`}
              onClick={toggleTheme}
              className="w-10 h-10 rounded-lg flex items-center justify-center text-on-surface-variant dark:text-[#AAB7C4] hover:text-on-surface dark:hover:text-white hover:bg-surface-container dark:hover:bg-[#132E47] transition-all border border-surface-container-highest/60 dark:border-white/10"
            >
              {theme === 'dark' ? (
                <span className="material-symbols-outlined text-[20px] text-[#F2B705]">
                  light_mode
                </span>
              ) : (
                <span className="material-symbols-outlined text-[20px] text-on-surface">
                  dark_mode
                </span>
              )}
            </button>

            {/* Desktop Log In Button */}
            <Link
              id="desktop-login-btn"
              to="/login"
              className="hidden sm:inline-flex px-3.5 py-2 font-body-sm text-sm font-semibold text-on-surface-variant dark:text-[#AAB7C4] hover:text-on-surface dark:hover:text-white transition-colors"
            >
              Log In
            </Link>

            {/* Desktop Create Account Button */}
            <Link
              id="desktop-create-account-btn"
              to="/register"
              className="hidden sm:inline-flex px-4 py-2 bg-primary-container dark:bg-[#132E47] text-on-primary text-body-sm font-semibold rounded-lg hover:bg-inverse-surface dark:hover:bg-primary-container transition-all items-center gap-2 shadow-sm border border-transparent dark:border-white/15"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-secondary-container inline-block"></span>
              <span>Create Account</span>
            </Link>

            {/* Mobile / Tablet Hamburger Toggle Button */}
            <button
              id="mobile-menu-btn"
              type="button"
              aria-controls="mobile-drawer"
              aria-expanded={isMobileMenuOpen}
              aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open mobile navigation menu'}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden w-10 h-10 rounded-lg flex items-center justify-center text-on-surface dark:text-white hover:bg-surface-container dark:hover:bg-[#132E47] border border-surface-container-highest/60 dark:border-white/10 transition-colors"
            >
              <span className="material-symbols-outlined text-[22px]">
                {isMobileMenuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE / TABLET SLIDE-IN NAVIGATION DRAWER */}
      {/* Backdrop */}
      <div
        id="drawer-backdrop"
        aria-hidden="true"
        onClick={() => setIsMobileMenuOpen(false)}
        className={`fixed inset-0 bg-black/60 z-50 backdrop-blur-sm transition-opacity duration-300 ${
          isMobileMenuOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Slide-out Drawer */}
      <aside
        id="mobile-drawer"
        role="dialog"
        aria-label="Mobile Navigation"
        aria-modal="true"
        className={`fixed top-0 right-0 h-full w-full max-w-xs sm:max-w-sm bg-surface dark:bg-[#071A2B] z-50 shadow-2xl transition-transform duration-300 ease-in-out flex flex-col justify-between p-6 border-l border-surface-container-highest dark:border-white/10 ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div>
          {/* Drawer Top Header */}
          <div className="flex items-center justify-between pb-6 border-b border-surface-container-highest dark:border-white/10">
            <img
              id="drawer-brand-logo"
              alt="WinDriveSA"
              className="h-8 w-auto object-contain"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuADmKv8SfzSnbxKCXUyZjkccRufeRyxuUVzHsTWuS21TDBN7hZLF5Q6uo81tqPgwbJa5FbV2DO4NdOfJD1_Zv_EGvXK3m8PeFrdgJiRSCBd_8ijvGJbgXtksK08jC1KjvJXCw0QbLQIf5X1im23hHTO8q4ZtKUCeVwNnZ_-z4N8WywOHT5g2ZQzr55M2zBBASfMTeY9BupZHs5hZfJJ2dLxcye3wh-6BZORjLeUATFRnvRXP7n0_qheFQX--aWu5jqF2sM"
            />
            <button
              id="close-drawer-btn"
              type="button"
              aria-label="Close navigation menu"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-on-surface-variant dark:text-[#AAB7C4] hover:bg-surface-container dark:hover:bg-[#132E47] transition-colors"
            >
              <span className="material-symbols-outlined text-[24px]">close</span>
            </button>
          </div>

          {/* Drawer Nav Links */}
          <nav id="mobile-nav-links" aria-label="Mobile Menu Links" className="flex flex-col gap-2 mt-6">
            {navLinks.map((link) => {
              const isActive = activeSection === link.id;
              return (
                <a
                  key={link.id}
                  id={`mobile-nav-${link.id}`}
                  href={link.href}
                  onClick={(e) => scrollToSection(e, link.id)}
                  className={`mobile-nav-link px-4 py-2.5 rounded-lg font-headline-sm text-sm font-semibold transition-colors flex items-center justify-between ${
                    isActive
                      ? 'bg-surface-container dark:bg-[#132E47] text-on-surface dark:text-[#F2B705]'
                      : 'text-on-surface dark:text-white hover:bg-surface-container dark:hover:bg-[#0D2438]'
                  }`}
                >
                  <span>{link.label}</span>
                  <span className="material-symbols-outlined text-[18px] text-secondary-container">
                    chevron_right
                  </span>
                </a>
              );
            })}
          </nav>
        </div>

        {/* Mobile Drawer Actions & Appearance Status */}
        <div className="pt-6 border-t border-surface-container-highest dark:border-white/10 flex flex-col gap-3">
          <div className="flex items-center justify-between px-2 py-1 text-xs text-on-surface-variant dark:text-[#AAB7C4]">
            <span>Current Appearance</span>
            <button
              id="drawer-theme-toggle"
              type="button"
              onClick={toggleTheme}
              className="flex items-center gap-1.5 font-semibold text-secondary dark:text-secondary-container uppercase tracking-wider text-[11px] hover:underline"
            >
              <span className="material-symbols-outlined text-[14px]">
                {theme === 'dark' ? 'dark_mode' : 'light_mode'}
              </span>
              <span>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
            </button>
          </div>

          <Link
            id="drawer-login-btn"
            to="/login"
            onClick={() => setIsMobileMenuOpen(false)}
            className="w-full py-3 text-center rounded-lg bg-surface-container dark:bg-[#0D2438] text-on-surface dark:text-white font-semibold text-sm border border-surface-container-highest/60 dark:border-white/10 hover:bg-surface-container-high transition-colors"
          >
            Log In
          </Link>

          <Link
            id="drawer-register-btn"
            to="/register"
            onClick={() => setIsMobileMenuOpen(false)}
            className="w-full py-3 text-center rounded-lg bg-primary-container dark:bg-secondary-container text-on-primary dark:text-[#071A2B] font-bold text-sm shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2"
          >
            <span>Create Account</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
