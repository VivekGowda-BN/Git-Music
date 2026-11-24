import React, { useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import ProfileAuthPill from './ProfileAuthPill';
import MobileNav from './MobileNav';

export default function NavBar({ isAuthenticated, onLogout }) {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  const openMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(true);
  }, []);

  const navLinks = [
    { to: '/capture', label: 'Capture' },
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/opportunities', label: 'Opportunities' },
  ];

  return (
    <>
      <header className="fixed top-3 left-3 right-3 z-50 max-w-5xl mx-auto">
        <nav
          className="studio-navbar rounded-xl px-4 py-2.5 flex items-center justify-between"
          aria-label="Main Navigation"
        >
          {/* Left: SwarLab Wordmark */}
          <Link
            to="/"
            className="flex items-center gap-2 group focus-visible:outline-2 focus-visible:outline-primary rounded-lg pr-2"
            aria-label="SwarLab Home"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-primary" aria-hidden="true" />
            <span className="font-extrabold tracking-tight text-text-main text-base font-sans">
              SwarLab
            </span>
          </Link>

          {/* Center: Main Navigation */}
          <div className="hidden md:flex items-center gap-1 bg-[#F0EDE5] p-1 rounded-lg border border-border-dim/60">
            {navLinks.map(({ to, label }) => {
              const isActive = location.pathname === to || (to === '/capture' && location.pathname === '/analyse');
              return (
                <Link
                  key={to}
                  to={to}
                  className={`px-3.5 py-1 text-xs font-medium rounded-md transition-all duration-150 focus-visible:outline-2 focus-visible:outline-primary ${isActive
                      ? 'bg-text-main text-white shadow-xs font-semibold'
                      : 'text-text-dim hover:text-text-main hover:bg-white/60'
                    }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Right: Auth / Profile Pill + Mobile Hamburger */}
          <div className="flex items-center gap-2">
            <ProfileAuthPill isAuthenticated={isAuthenticated} onLogout={onLogout} />

            {/* Mobile Menu Button */}
            <button
              onClick={openMobileMenu}
              className="md:hidden w-8 h-8 rounded-lg border border-border-dim bg-white text-text-dim hover:text-text-main hover:bg-surface-muted flex items-center justify-center focus-visible:outline-2 focus-visible:outline-primary cursor-pointer"
              aria-label="Open navigation menu"
              aria-expanded={isMobileMenuOpen}
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </nav>
      </header>

      {/* Responsive Mobile Drawer */}
      <MobileNav
        isOpen={isMobileMenuOpen}
        onClose={closeMobileMenu}
        isAuthenticated={isAuthenticated}
        onLogout={onLogout}
      />
    </>
  );
}
