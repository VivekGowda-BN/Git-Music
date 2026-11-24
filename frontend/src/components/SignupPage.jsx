import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';
import PageContainer from './shell/PageContainer';
import { API_URL, setAuthSession } from '../lib/api';

export default function SignupPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    // Input Validation
    if (!username.trim() || !email.trim() || !password.trim()) {
      setError('All fields are required.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      // 1. Call POST /signup
      await axios.post(`${API_URL}/signup`, {
        username: username.trim(),
        email: email.trim(),
        password: password,
      });

      setSuccess(true);

      // 2. Automatically log in with the same credentials
      const loginRes = await axios.post(`${API_URL}/login`, {
        email: email.trim(),
        password: password,
      });

      // 3. Store tokens and trigger reactive auth update
      setAuthSession(loginRes.data.access_token, loginRes.data.user_id);

      // 4. Redirect immediately to /profile
      setTimeout(() => {
        navigate('/profile');
      }, 700);
    } catch (err) {
      console.error('[Signup Error]', err);
      setError(err.response?.data?.error || 'Registration failed. Please verify your details.');
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="studio-card p-8 sm:p-10 w-full max-w-md">
          <div className="text-center mb-6">
            <div className="w-10 h-10 rounded-xl bg-surface-utility border border-border-dim flex items-center justify-center text-accent mx-auto mb-3">
              <UserPlus className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-text-main tracking-tight">Create Studio Account</h1>
            <p className="text-xs text-text-dim mt-1">Permanent project cloud sync and take versioning.</p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-lg border border-red-200 bg-red-50 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-5 p-3.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>Account created. Authenticating and opening profile...</span>
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-main">Artist / Username</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. solobeat"
                  required
                  className="w-full bg-white border border-border-dim rounded-lg py-2.5 pl-10 pr-3 text-sm text-text-main placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

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
              disabled={loading || success}
              className="btn-primary w-full py-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-xs mt-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="spinner text-white" />
              ) : (
                <>
                  <span>Create Account & Enter</span>
                  <UserPlus className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center pt-4 border-t border-border-dim">
            <p className="text-text-dim text-xs">
              Already have an account?{' '}
              <Link to="/login" className="text-accent font-semibold hover:underline ml-0.5">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
