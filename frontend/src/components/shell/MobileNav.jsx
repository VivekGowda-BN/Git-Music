import React, { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Mic, GitBranch, Compass, User, LogIn, LogOut, X } from 'lucide-react';
import { clearAuthSession } from '../../lib/api';

export default function MobileNav({ isOpen, onClose, isAuthenticated, onLogout }) {
  const location = useLocation();
  const drawerRef = useRef(null);
  const prevPathnameRef = useRef(location.pathname);

  // Close only when pathname actually changes
  useEffect(() => {
    if (prevPathnameRef.current !== location.pathname) {
      prevPathnameRef.current = location.pathname;
      onClose();
    }
  }, [location.pathname, onClose]);

  // Handle Escape key to close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Trap body scroll while drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const navLinks = [
    { to: '/capture', label: 'Capture', icon: Mic },
    { to: '/dashboard', label: 'Dashboard', icon: GitBranch },
    { to: '/opportunities', label: 'Opportunities', icon: Compass },
    { to: '/profile', label: 'Profile', icon: User },
  ];

  const handleMobileLogout = () => {
    clearAuthSession();
    if (onLogout) onLogout();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] md:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Mobile Navigation"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div
        ref={drawerRef}
        className="fixed inset-y-0 right-0 w-72 max-w-[85vw] bg-white border-l border-border-dim p-6 shadow-xl flex flex-col justify-between overflow-y-auto"
      >
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-border-dim mb-6">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-primary" />
              <span className="font-extrabold text-text-main text-base">SwarLab</span>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg border border-border-dim text-text-dim hover:text-text-main flex items-center justify-center focus-visible:outline-2 focus-visible:outline-primary cursor-pointer"
              aria-label="Close navigation menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1" aria-label="Mobile navigation links">
            {navLinks.map((item) => {
              const isActive = location.pathname === item.to || (item.to === '/capture' && location.pathname === '/analyse');
              const ItemIcon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-text-main text-white font-semibold'
                      : 'text-text-dim hover:text-text-main hover:bg-surface-muted'
                  }`}
                >
                  <ItemIcon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer / Auth */}
        <div className="pt-4 border-t border-border-dim">
          {isAuthenticated ? (
            <button
              onClick={handleMobileLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 font-semibold text-xs transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          ) : (
            <div className="space-y-2">
              <Link
                to="/login"
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-border-dim bg-white text-text-main hover:bg-surface-muted font-semibold text-xs transition-all"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </Link>
              <Link
                to="/signup"
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-text-main text-white hover:bg-black font-semibold text-xs transition-all text-center"
              >
                Create Account
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
