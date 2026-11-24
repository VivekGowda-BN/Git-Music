import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, LogOut } from 'lucide-react';
import { fetchCurrentUser, clearAuthSession, getAuthToken } from '../../lib/api';

export default function ProfileAuthPill({ onLogout }) {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const token = getAuthToken();

  useEffect(() => {
    let isCancelled = false;
    if (token) {
      fetchCurrentUser()
        .then((userData) => {
          if (!isCancelled) setUser(userData);
        })
        .catch(() => {
          if (!isCancelled) setUser(null);
        });
    }
    return () => {
      isCancelled = true;
    };
  }, [token]);

  const handleSignOut = () => {
    clearAuthSession();
    if (onLogout) onLogout();
    navigate('/');
  };

  if (!token) {
    return (
      <div className="flex items-center gap-2">
        <Link
          to="/login"
          className="px-3.5 py-1.5 text-xs font-semibold text-text-dim hover:text-text-main transition-colors focus-visible:outline-2 focus-visible:outline-primary rounded-lg"
        >
          Sign In
        </Link>
        <Link
          to="/signup"
          className="px-3.5 py-1.5 rounded-lg bg-text-main text-white text-xs font-semibold hover:bg-black transition-all focus-visible:outline-2 focus-visible:outline-primary"
        >
          Create Account
        </Link>
      </div>
    );
  }

  const initials = (user?.username || 'U').slice(0, 2).toUpperCase();

  return (
    <div className="flex items-center gap-2">
      <Link
        to="/profile"
        className="flex items-center gap-2 px-2.5 py-1 rounded-lg border border-border-dim bg-white hover:bg-surface-muted text-text-main text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-primary"
        title="View Profile"
        aria-label="View user profile"
      >
        <div className="w-5 h-5 rounded-full bg-surface-utility text-accent flex items-center justify-center font-mono font-bold text-[10px]">
          {initials}
        </div>
        <span className="hidden sm:inline font-medium text-xs text-text-main">{user?.username || 'Profile'}</span>
      </Link>
      <button
        onClick={handleSignOut}
        className="w-8 h-8 rounded-lg border border-border-dim bg-white hover:bg-red-50 text-text-dim hover:text-red-600 transition-colors flex items-center justify-center focus-visible:outline-2 focus-visible:outline-primary cursor-pointer"
        title="Sign Out"
        aria-label="Sign out of your account"
      >
        <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}
