import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import {
  User, LogIn, Folder, GitBranch, Calendar, LogOut,
  Mic, ArrowRight, ShieldCheck, AlertCircle, Plus, ChevronRight
} from 'lucide-react';
import PageContainer from '../components/shell/PageContainer';
import { API_URL, fetchCurrentUser, getAuthHeaders, clearAuthSession, getAuthToken } from '../lib/api';

export default function ProfilePage() {
  const navigate = useNavigate();
  const token = getAuthToken();
  const isAuthenticated = !!token;

  // Profile data from GET /me
  const [user, setUser] = useState(null);

  // Projects data from GET /my-projects
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(isAuthenticated);
  const [projectsError, setProjectsError] = useState(null);

  useEffect(() => {
    let isCancelled = false;

    if (isAuthenticated) {
      fetchCurrentUser()
        .then((data) => {
          if (!isCancelled) {
            setUser(data);
          }
        })
        .catch((err) => {
          if (!isCancelled) {
            console.error('[User Load Error]', err);
          }
        });

      axios
        .get(`${API_URL}/my-projects`, { headers: getAuthHeaders() })
        .then((res) => {
          if (!isCancelled) {
            setProjects(res.data);
            setLoadingProjects(false);
          }
        })
        .catch((err) => {
          if (!isCancelled) {
            console.error('[Projects Load Error]', err);
            setProjectsError('Could not load user projects.');
            setLoadingProjects(false);
          }
        });
    }

    return () => {
      isCancelled = true;
    };
  }, [isAuthenticated]);

  const handleSignOut = () => {
    clearAuthSession();
    navigate('/');
  };

  const weeks = 20;
  const daysPerWeek = 7;

  return (
    <PageContainer>
      {/* 1. Profile Header */}
      <header className="studio-card p-6 sm:p-8 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            {/* Avatar Initials */}
            <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-surface-utility border border-border-dim flex items-center justify-center font-mono font-black text-xl text-accent shadow-xs flex-shrink-0">
              {isAuthenticated && user?.username
                ? user.username.slice(0, 2).toUpperCase()
                : <User className="w-7 h-7 text-text-dim" />}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-[11px] uppercase tracking-wider text-text-muted font-bold">
                  {isAuthenticated ? `Artist #USER-${user?.id || '...'}` : 'Guest Session'}
                </span>
                <span className={`w-2 h-2 rounded-full ${isAuthenticated ? 'bg-success' : 'bg-warning'}`} />
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-text-main tracking-tight">
                {isAuthenticated ? user?.username || 'Artist Profile' : 'Studio Guest'}
              </h1>

              <p className="text-xs text-text-dim mt-0.5">
                {isAuthenticated ? (
                  <span>{user?.email || 'No email attached'}</span>
                ) : (
                  'Anonymous session. Takes and audio files are held in local memory.'
                )}
              </p>

              {isAuthenticated && user?.created_at && (
                <div className="flex items-center gap-1.5 text-[11px] text-text-muted font-mono mt-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Header Action Trigger */}
          <div className="self-stretch sm:self-auto flex items-center gap-2">
            {!isAuthenticated ? (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Link
                  to="/login"
                  className="btn-secondary px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 flex-1 sm:flex-initial"
                >
                  <LogIn className="w-4 h-4" /> Sign In
                </Link>
                <Link
                  to="/signup"
                  className="btn-primary px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 flex-1 sm:flex-initial"
                >
                  Create Account
                </Link>
              </div>
            ) : (
              <button
                onClick={handleSignOut}
                className="btn-secondary px-4 py-2 rounded-xl text-xs font-semibold text-text-dim hover:text-red-600 hover:border-red-200 flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            )}
          </div>
        </div>

        {/* Guest Conversion Banner */}
        {!isAuthenticated && (
          <div className="mt-6 pt-5 border-t border-border-dim/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-text-dim">
            <p>
              An account is required to permanently store your projects, branch takes, and audio versions in SQLite storage.
            </p>
            <Link
              to="/signup"
              className="text-primary font-bold hover:underline flex items-center gap-1 whitespace-nowrap self-start sm:self-auto"
            >
              Register now <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </header>

      {/* Profile Actions Toolbar */}
      <section className="flex flex-wrap items-center gap-3 mb-6" aria-label="Quick Actions">
        <Link
          to="/capture"
          className="btn-primary px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs"
        >
          <Mic className="w-4 h-4" /> Start Capture Session
        </Link>
        <Link
          to="/dashboard"
          className="btn-secondary px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2"
        >
          <Folder className="w-4 h-4 text-text-dim" /> Open Dashboard
        </Link>
      </section>

      {/* 2. Recent Projects Section (Real Data from GET /my-projects) */}
      <section className="studio-card p-6 sm:p-8 mb-6" aria-label="Recent Projects">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-border-dim/60">
          <div>
            <h2 className="text-lg font-bold text-text-main tracking-tight">Recent Song Projects</h2>
            <p className="text-xs text-text-dim mt-0.5">Real projects loaded from your authenticated SQLite database.</p>
          </div>
          <Link
            to="/dashboard"
            className="text-xs font-semibold text-accent hover:underline flex items-center gap-1"
          >
            All Projects <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loadingProjects ? (
          <div className="py-8 text-center font-mono text-xs text-text-dim">Loading projects from API...</div>
        ) : projectsError ? (
          <div className="p-3.5 rounded-lg border border-red-200 bg-red-50 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {projectsError}
          </div>
        ) : !isAuthenticated ? (
          <div className="py-8 text-center border border-dashed border-border-dim rounded-xl p-6 text-xs text-text-dim">
            <Folder className="w-8 h-8 text-text-muted mx-auto mb-2 opacity-50" />
            <p className="font-semibold text-text-main mb-1">No local projects saved</p>
            <p className="text-text-muted mb-4">Sign in to sync your audio repositories across sessions.</p>
            <Link to="/login" className="btn-secondary px-4 py-1.5 rounded-lg text-xs font-semibold inline-block">
              Sign In to View Projects
            </Link>
          </div>
        ) : projects.length === 0 ? (
          /* Honest Empty State */
          <div className="py-8 text-center border border-dashed border-border-dim rounded-xl p-6 text-xs text-text-dim">
            <Folder className="w-8 h-8 text-text-muted mx-auto mb-2 opacity-50" />
            <p className="font-semibold text-text-main mb-1">No projects created yet</p>
            <p className="text-text-muted mb-4">Head over to the Capture tab to record your first idea and save it as a project.</p>
            <Link to="/capture" className="btn-primary px-4 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs">
              <Plus className="w-3.5 h-3.5" /> Create First Take
            </Link>
          </div>
        ) : (
          /* Real Project Cards */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {projects.slice(0, 6).map((proj) => (
              <div
                key={proj.id}
                onClick={() => navigate('/dashboard')}
                className="p-4 rounded-xl border border-border-dim bg-white hover:bg-surface-muted transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[10px] text-text-muted uppercase">ID #{proj.id}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-muted border border-border-dim text-text-dim">
                      {proj.is_public ? 'Public' : 'Private'}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-text-main truncate mb-1">{proj.title}</h3>
                </div>
                <div className="pt-3 border-t border-border-dim/50 mt-3 flex items-center justify-between text-[11px] text-text-muted font-mono">
                  <span>{new Date(proj.created_at).toLocaleDateString()}</span>
                  <span className="text-primary font-sans font-bold flex items-center gap-0.5 text-xs">
                    View <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3. Contribution Section (Clearly Labeled Preview) */}
      <section className="studio-card p-6 sm:p-8" aria-label="Activity Momentum Preview">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-border-dim/60">
          <div>
            <h2 className="text-lg font-bold text-text-main tracking-tight">Contribution activity preview</h2>
            <p className="text-xs text-text-dim mt-0.5">Visual representation of daily recordings, takes, and branch commits.</p>
          </div>
          <span className="text-[11px] font-mono uppercase text-warning px-2 py-0.5 rounded bg-amber-50 border border-amber-200">
            Preview Visualizer
          </span>
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-text-dim mb-4 leading-relaxed">
          Daily contribution tracking will be connected to the database activity log in a later phase. The grid below illustrates the visual rhythm of creation momentum:
        </p>

        {/* Heatmap Grid */}
        <div className="overflow-x-auto pb-2">
          <div className="inline-grid grid-flow-col gap-1.5" style={{ gridTemplateRows: `repeat(${daysPerWeek}, minmax(0, 1fr))` }}>
            {Array.from({ length: weeks * daysPerWeek }).map((_, idx) => {
              const seed = (idx * 5 + 7) % 13;
              let bg = '#FAF8F5';
              let border = '#D8D2C8';
              if (seed > 10) {
                bg = '#E85D4A';
                border = '#E85D4A';
              } else if (seed > 7) {
                bg = '#F29F93';
                border = '#E85D4A';
              } else if (seed > 4) {
                bg = '#FBE7E4';
                border = '#D8D2C8';
              }

              return (
                <div
                  key={idx}
                  className="w-3.5 h-3.5 rounded-[3px] transition-colors"
                  style={{ backgroundColor: bg, border: `1px solid ${border}` }}
                  title={`Day index ${idx}`}
                />
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 text-[11px] text-text-muted mt-3 font-mono">
          <span>Less</span>
          <div className="w-3 h-3 rounded-[2px] bg-[#FAF8F5] border border-border-dim" />
          <div className="w-3 h-3 rounded-[2px] bg-[#FBE7E4] border border-border-dim" />
          <div className="w-3 h-3 rounded-[2px] bg-[#F29F93]" />
          <div className="w-3 h-3 rounded-[2px] bg-primary" />
          <span>More</span>
        </div>
      </section>
    </PageContainer>
  );
}
