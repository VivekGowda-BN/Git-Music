import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Recorder from './components/Recorder';
import VersionTree from './components/VersionTree';
import { Mic, GitBranch, User, LogOut, Plus, Folder, Globe, Lock as LockIcon, ChevronRight, ChevronLeft, Calendar, Zap, Activity, Music, Layers } from 'lucide-react';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import AnalysePage from './components/AnalysePage';
import ComparePage from './components/ComparePage';
import HomePage from './components/HomePage';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';

const API_URL = 'http://localhost:3000';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('access_token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function Dashboard({ projects, onProjectCreated }) {
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Version tracking state
  const [selectedProject, setSelectedProject] = useState(null);
  const [versions, setVersions] = useState([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState(null);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjectTitle.trim()) {
      setError('Project title is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.post(`${API_URL}/projects`, 
        { title: newProjectTitle, is_public: isPublic ? 1 : 0 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setNewProjectTitle('');
      setIsPublic(false);
      onProjectCreated(response.data);
    } catch (err) {
      console.error('Failed to create project', err);
      setError(err.response?.data?.error || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const openProject = async (project) => {
    setSelectedProject(project);
    setLoadingVersions(true);
    setVersions([]);
    setSelectedVersion(null);

    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.get(`${API_URL}/projects/${project.id}/versions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVersions(res.data);
    } catch (err) {
      console.error('Failed to load versions', err);
    } finally {
      setLoadingVersions(false);
    }
  };

  const closeProject = () => {
    setSelectedProject(null);
    setSelectedVersion(null);
    setVersions([]);
  };

  if (selectedProject) {
    return (
      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-10 pt-28 animate-in fade-in duration-500">
        {/* Left Panel: Project Info */}
        <div className="lg:col-span-1 space-y-6 md:space-y-8">
          <div className="glass-panel p-6 rounded-3xl border border-white/10 shadow-xl">
            <button 
              onClick={closeProject}
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-dim hover:text-white transition-colors mb-8"
            >
              <ChevronLeft className="w-4 h-4" /> Back to Projects
            </button>
            
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/5 rounded-xl border border-white/10">
                {selectedProject.is_public ? <Globe className="w-4 h-4 text-green-400" /> : <LockIcon className="w-4 h-4 text-primary" />}
              </div>
              <span className="text-[9px] font-black text-text-dim uppercase tracking-widest">ID: {selectedProject.id}</span>
            </div>
            
            <h2 className="text-2xl font-black text-white tracking-tight leading-none mb-4">{selectedProject.title}</h2>
            
            <div className="flex items-center gap-2 text-text-dim/60 text-[10px] font-bold uppercase tracking-widest mb-6">
              <Calendar className="w-3 h-3" />
              Created {new Date(selectedProject.created_at).toLocaleDateString()}
            </div>

            <div className="p-4 bg-primary/10 border border-primary/20 rounded-2xl">
              <div className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Total Commits</div>
              <div className="text-2xl font-black text-white">{versions.length}</div>
            </div>
          </div>
        </div>

        {/* Right Panel: Versions List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-8 rounded-3xl min-h-[500px] border border-white/10 shadow-xl">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-black flex items-center gap-3 text-white uppercase tracking-tight">
                <GitBranch className="w-6 h-6 text-accent" /> Version History
              </h2>
            </div>

            {loadingVersions ? (
              <div className="py-20 flex flex-col items-center justify-center text-text-dim animate-pulse">
                <div className="w-8 h-8 border-4 border-white/10 border-t-primary rounded-full animate-spin mb-4"></div>
                <span className="text-[10px] font-black uppercase tracking-widest">Loading Repository...</span>
              </div>
            ) : versions.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center opacity-30 text-center">
                <GitBranch className="w-16 h-16 mb-4" />
                <p className="text-sm font-bold uppercase tracking-widest mb-2">No versions yet</p>
                <p className="text-[10px] text-text-dim/80">Go to the Analyse tab to commit your first audio idea.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {versions.map((v, index) => (
                  <div 
                    key={v.id}
                    onClick={() => setSelectedVersion(v)}
                    className="relative p-5 bg-white/5 border border-white/5 rounded-3xl hover:bg-white/10 hover:border-accent/30 transition-all duration-300 cursor-pointer group"
                  >
                    {/* Timeline dot connection concept */}
                    {index !== versions.length - 1 && (
                      <div className="absolute left-[38px] top-[100%] w-0.5 h-4 bg-white/10"></div>
                    )}
                    
                    <div className="flex items-start gap-5">
                      <div className="mt-1">
                        <div className="w-10 h-10 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center group-hover:bg-accent group-hover:text-black transition-all">
                          <GitBranch className="w-5 h-5" />
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="text-[10px] font-black text-accent uppercase tracking-widest mb-1">Commit #{v.id}</div>
                            <h3 className="text-lg font-black text-white">{v.genre || 'Unknown Genre'} · {v.mood || 'Unknown Mood'}</h3>
                          </div>
                          <span className="text-[9px] font-bold text-text-dim uppercase tracking-widest">
                            {new Date(v.created_at).toLocaleString()}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mt-3">
                          <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-black uppercase text-white/80 border border-white/10 flex items-center gap-1">
                            <Zap className="w-3 h-3 text-primary" /> {v.bpm} BPM
                          </span>
                          <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-black uppercase text-white/80 border border-white/10 flex items-center gap-1">
                            <Music className="w-3 h-3 text-accent" /> {v.key}
                          </span>
                          {v.instruments && (
                            <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-black uppercase text-white/80 border border-white/10 flex items-center gap-1">
                              <Layers className="w-3 h-3 text-emerald-400" /> {v.instruments.split(',')[0]}...
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Version Detail Modal */}
        {selectedVersion && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-xl bg-black/60">
            <div className="glass-panel w-full max-w-2xl p-8 rounded-[40px] border border-white/10 shadow-2xl relative">
              <button 
                onClick={() => setSelectedVersion(null)}
                className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center bg-white/5 rounded-full hover:bg-white/10 text-white transition-all"
              >
                ✕
              </button>
              
              <div className="flex items-center gap-3 mb-8">
                <GitBranch className="w-8 h-8 text-accent" />
                <div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-tight">Commit Metadata</h2>
                  <p className="text-[10px] font-black text-text-dim uppercase tracking-widest mt-1">ID: {selectedVersion.id} · {new Date(selectedVersion.created_at).toLocaleString()}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="text-[9px] font-black uppercase tracking-widest text-primary mb-2">Tempo</div>
                  <div className="text-xl font-black text-white">{selectedVersion.bpm} <span className="text-xs text-text-dim">BPM</span></div>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="text-[9px] font-black uppercase tracking-widest text-accent mb-2">Key</div>
                  <div className="text-xl font-black text-white">{selectedVersion.key}</div>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="text-[9px] font-black uppercase tracking-widest text-yellow-400 mb-2">Mood</div>
                  <div className="text-xl font-black text-white">{selectedVersion.mood}</div>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="text-[9px] font-black uppercase tracking-widest text-emerald-400 mb-2">Genre</div>
                  <div className="text-xl font-black text-white">{selectedVersion.genre}</div>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 col-span-2">
                  <div className="text-[9px] font-black uppercase tracking-widest text-sky-400 mb-2">Frequency Range</div>
                  <div className="text-xl font-black text-white">{selectedVersion.freq_min} - {selectedVersion.freq_max} <span className="text-xs text-text-dim">Hz</span></div>
                </div>
              </div>

              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <div className="text-[9px] font-black uppercase tracking-widest text-orange-400 mb-2">Detected Instruments</div>
                <div className="text-sm font-bold text-white leading-relaxed">{selectedVersion.instruments || 'None detected'}</div>
              </div>
            </div>
          </div>
        )}
      </main>
    );
  }

  // DEFAULT VIEW (Project List)
  return (
    <main className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-10 pt-28 animate-in fade-in duration-700">
      {/* Left: Project Creation */}
      <div className="lg:col-span-1 space-y-6 md:space-y-8">
        <div className="glass-panel p-5 md:p-8 rounded-3xl border border-white/10 shadow-xl">
          <h2 className="text-lg md:text-xl font-black mb-6 flex items-center gap-3 text-white uppercase tracking-tight">
            <Plus className="w-5 h-5 text-primary" /> New Project
          </h2>

          <form onSubmit={handleCreateProject} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-text-dim uppercase tracking-[0.2em] ml-1">Project Name</label>
              <input
                type="text"
                value={newProjectTitle}
                onChange={(e) => setNewProjectTitle(e.target.value)}
                placeholder="e.g. Summer Album 2026"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-white placeholder:text-text-dim/30"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl">
              <div className="flex items-center gap-3">
                {isPublic ? <Globe className="w-4 h-4 text-green-400" /> : <LockIcon className="w-4 h-4 text-primary" />}
                <span className="text-xs font-bold text-white">{isPublic ? 'Public' : 'Private'}</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            {error && <p className="text-red-400 text-[10px] font-bold uppercase tracking-wider ml-1">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-hover text-white font-black py-4 rounded-2xl transition-all duration-300 shadow-lg shadow-primary/20 flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </form>
        </div>
      </div>

      {/* Right: Project List */}
      <div className="lg:col-span-2">
        <div className="glass-panel p-8 rounded-3xl min-h-[500px] border border-white/10 shadow-xl">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-black flex items-center gap-3 text-white uppercase tracking-tight">
              <Folder className="w-6 h-6 text-accent" /> Your Projects
            </h2>
            <span className="bg-white/5 px-3 py-1 rounded-full text-[10px] font-black text-text-dim uppercase tracking-widest border border-white/10">
              {projects.length} Total
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-20 opacity-30">
                <Folder className="w-16 h-16 mb-4" />
                <p className="text-sm font-bold uppercase tracking-widest">No projects yet</p>
              </div>
            ) : (
              projects.map((project) => (
                <div 
                  key={project.id} 
                  onClick={() => openProject(project)}
                  className="group relative bg-white/5 border border-white/5 p-6 rounded-3xl hover:bg-white/10 hover:border-primary/30 transition-all duration-500 cursor-pointer overflow-hidden"
                >
                  {/* Subtle Background Glow */}
                  <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-500"></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2 bg-white/5 rounded-xl border border-white/10 group-hover:bg-primary/10 group-hover:border-primary/20 transition-all">
                        {project.is_public ? <Globe className="w-4 h-4 text-green-400" /> : <LockIcon className="w-4 h-4 text-primary" />}
                      </div>
                      <span className="text-[9px] font-black text-text-dim uppercase tracking-widest">
                        ID: {project.id}
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-white group-hover:text-primary transition-colors mb-1 truncate">
                      {project.title}
                    </h3>
                    <p className="text-[10px] text-text-dim font-bold uppercase tracking-widest mb-4">
                      Created: {new Date(project.created_at).toLocaleDateString()}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0">
                      Open Repository <ChevronRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function AppContent() {
  const [projects, setProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('access_token'));
  const location = useLocation();
  const navigate = useNavigate();

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.get(`${API_URL}/my-projects`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProjects(res.data);
    } catch (err) {
      console.error('Failed to fetch projects', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchProjects();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const handleStorageChange = () => {
      setIsAuthenticated(!!localStorage.getItem('access_token'));
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    setIsAuthenticated(!!localStorage.getItem('access_token'));
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_id');
    setIsAuthenticated(false);
    navigate('/login');
  };

  const handleProjectCreated = (newProject) => {
    setProjects(prev => [newProject, ...prev]);
  };

  return (
    <div className="min-h-screen bg-background text-text-main p-4 sm:p-6 md:p-8 max-w-6xl mx-auto font-sans overflow-x-hidden">
      <header className="fixed top-6 left-4 right-4 z-50 flex items-center justify-between px-6 py-3 navbar-glass rounded-full max-w-6xl mx-auto border border-white/5 shadow-2xl">
        {/* Left: Logo */}
        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity flex-shrink-0">
          <div className="bg-primary p-2 rounded-xl glow-primary">
            <Mic className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-black tracking-tighter text-white hidden sm:block">
            GIT<span className="text-primary">MUSIC</span>
          </h1>
        </Link>

        {/* Center: Nav Links */}
        <nav className="hidden md:flex items-center bg-white/5 p-1 rounded-full border border-white/5 gap-1">
          <Link 
            to="/" 
            className={`px-5 py-1.5 text-xs font-bold rounded-full transition-all duration-300 ${location.pathname === '/' ? 'nav-link-active' : 'text-text-dim hover:text-white hover:bg-white/5'}`}
          >
            Home
          </Link>
          <Link 
            to="/analyse" 
            className={`px-5 py-1.5 text-xs font-bold rounded-full transition-all duration-300 ${location.pathname === '/analyse' ? 'nav-link-active' : 'text-text-dim hover:text-white hover:bg-white/5'}`}
          >
            Analyse
          </Link>
          <Link 
            to="/compare" 
            className={`px-5 py-1.5 text-xs font-bold rounded-full transition-all duration-300 ${location.pathname === '/compare' ? 'nav-link-active' : 'text-text-dim hover:text-white hover:bg-white/5'}`}
          >
            Compare
          </Link>
          <Link 
            to="/dashboard" 
            className={`px-5 py-1.5 text-xs font-bold rounded-full transition-all duration-300 ${location.pathname === '/dashboard' ? 'nav-link-active' : 'text-text-dim hover:text-white hover:bg-white/5'}`}
          >
            Dashboard
          </Link>
        </nav>

        {/* Right: Search + Profile/Logout */}
        <div className="flex items-center gap-3">
          <div className="relative group">
            <input
              type="text"
              placeholder="Search Projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-full focus:outline-none focus:ring-1 focus:ring-primary/50 w-24 sm:w-48 text-xs transition-all duration-300 focus:w-32 sm:focus:w-64 focus:bg-white/10"
            />
          </div>
          
          {isAuthenticated ? (
            <button 
              onClick={handleLogout}
              title="Logout"
              className="w-9 h-9 rounded-full bg-white/5 border border-white/10 text-text-dim hover:bg-red-500 hover:text-white transition-all duration-300 flex items-center justify-center hover:scale-105 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          ) : (
            <Link 
              to="/login"
              title="Login"
              className="w-9 h-9 rounded-full bg-white/5 border border-white/10 text-text-dim hover:bg-primary hover:text-white transition-all duration-300 flex items-center justify-center hover:scale-105 cursor-pointer"
            >
              <User className="w-4 h-4" />
            </Link>
          )}
        </div>
      </header>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard 
              projects={projects.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()))}
              onProjectCreated={handleProjectCreated}
            />
          </ProtectedRoute>
        } />
        <Route path="/analyse" element={
          <ProtectedRoute>
            <AnalysePage />
          </ProtectedRoute>
        } />
        <Route path="/compare" element={
          <ProtectedRoute>
            <ComparePage />
          </ProtectedRoute>
        } />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
