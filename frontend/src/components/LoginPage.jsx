import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, LogIn, AlertCircle } from 'lucide-react';
import PageContainer from './shell/PageContainer';
import { API_URL, setAuthSession } from '../lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/login`, { email: email.trim(), password });
      setAuthSession(response.data.access_token, response.data.user_id);
      navigate('/profile');
    } catch (err) {
      console.error('[Login Error]', err);
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="studio-card p-8 sm:p-10 w-full max-w-md">
          <div className="text-center mb-6">
            <div className="w-10 h-10 rounded-xl bg-surface-utility border border-border-dim flex items-center justify-center text-primary mx-auto mb-3">
              <LogIn className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-text-main tracking-tight">Welcome Back</h1>
            <p className="text-xs text-text-dim mt-1">Sign in to your SwarLab studio workspace.</p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-lg border border-red-200 bg-red-50 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-main">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="artist@swarlab.io"
                  required
                  className="w-full bg-white border border-border-dim rounded-lg py-2.5 pl-10 pr-3 text-sm text-text-main placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-main">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-white border border-border-dim rounded-lg py-2.5 pl-10 pr-3 text-sm text-text-main placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-xs mt-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="spinner text-white" />
              ) : (
                <>
                  <span>Sign In</span>
                  <LogIn className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center pt-4 border-t border-border-dim">
            <p className="text-text-dim text-xs">
              Don't have an account?{' '}
              <Link to="/signup" className="text-primary font-semibold hover:underline ml-0.5">
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
