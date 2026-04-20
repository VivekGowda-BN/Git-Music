import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Recorder from './components/Recorder';
import VersionTree from './components/VersionTree';
import { Mic, GitBranch, User } from 'lucide-react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import AnalysePage from './components/AnalysePage';
import ComparePage from './components/ComparePage';

const API_URL = 'http://localhost:3000';

function Dashboard({ recordings, filteredRecordings, selectedParentId, setSelectedParentId, handleRecordingSaved, handleDelete }) {
  return (
    <main className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-10 pt-44">
      <div className="lg:col-span-1 space-y-6 md:space-y-8">
        <div className="glass-panel p-5 md:p-8 rounded-3xl">
          <h2 className="text-lg md:text-xl font-bold mb-6 flex items-center gap-3 text-white">
            <Mic className="w-5 h-5 md:w-6 md:h-6 text-primary" /> Record Idea
          </h2>

          {selectedParentId && (
            <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-xl flex items-center gap-3 text-sm animate-in fade-in slide-in-from-top-4">
              <GitBranch className="w-5 h-5 text-primary" />
              <span className="text-primary font-bold">
                Branching from: <span className="font-mono">{selectedParentId.substring(0, 8)}</span>
              </span>
              <button
                onClick={() => setSelectedParentId(null)}
                className="ml-auto text-text-dim hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
          )}

          <Recorder
            parentId={selectedParentId}
            onSaved={handleRecordingSaved}
          />
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="glass-panel p-8 rounded-3xl min-h-[600px]">
          <h2 className="text-xl font-bold mb-8 flex items-center gap-3">
            <GitBranch className="w-6 h-6 text-accent" /> Version Tree
          </h2>
          <VersionTree
            recordings={filteredRecordings}
            onSelectParent={setSelectedParentId}
            selectedParentId={selectedParentId}
            onDelete={handleDelete}
          />
        </div>
      </div>
    </main>
  );
}

function AppContent() {
  const [recordings, setRecordings] = useState([]);
  const [selectedParentId, setSelectedParentId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();

  const fetchRecordings = async () => {
    try {
      const res = await axios.get(`${API_URL}/versions`);
      setRecordings(res.data);
    } catch (err) {
      console.error('Failed to fetch recordings', err);
    }
  };

  useEffect(() => {
    fetchRecordings();
  }, []);

  const handleRecordingSaved = (newRecord) => {
    if (newRecord) {
      setRecordings(prev => [...prev, newRecord]);
    } else {
      fetchRecordings();
    }
    setSelectedParentId(null);
  };

  const handleDelete = async (id) => {
    console.log('[Frontend] Attempting to delete recording:', id);
    if (!window.confirm('Are you sure you want to delete this recording? This will also delete all its branches.')) return;
    try {
      await axios.delete(`${API_URL}/recordings/${id}`);
      console.log('[Frontend] Delete successful for ID:', id);
      setRecordings(prev => prev.filter(r => r.id !== id));
      // Also filter out any children if they were in the local state
      // (Though fetchRecordings might be safer, let's just filter for now)
      setRecordings(prev => prev.filter(r => r.id !== id && r.parent_id !== id));
    } catch (err) {
      console.error('[Frontend] Failed to delete recording', err);
      alert('Failed to delete recording: ' + (err.response?.data?.error || err.message));
    }
  };

  const filteredRecordings = recordings.filter(r => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const tagMatch = r.tags && (
      (r.tags.mood && r.tags.mood.toLowerCase().includes(query)) ||
      (r.tags.type && r.tags.type.toLowerCase().includes(query)) ||
      (r.tags.energy && r.tags.energy.toLowerCase().includes(query))
    );
    const descMatch = r.description && r.description.toLowerCase().includes(query);
    return tagMatch || descMatch;
  });

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

        {/* Right: Search + Profile */}
        <div className="flex items-center gap-3">
          <div className="relative group">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-full focus:outline-none focus:ring-1 focus:ring-primary/50 w-32 sm:w-48 text-xs transition-all duration-300 focus:w-40 sm:focus:w-64 focus:bg-white/10"
            />
          </div>
          <button className="w-9 h-9 rounded-full bg-white/5 border border-white/10 text-text-dim hover:bg-primary hover:text-white transition-all duration-300 flex items-center justify-center hover:scale-105 cursor-pointer">
            <User className="w-4 h-4" />
          </button>
        </div>
      </header>

      <Routes>
        <Route path="/" element={
          <Dashboard 
            recordings={recordings}
            filteredRecordings={filteredRecordings}
            selectedParentId={selectedParentId}
            setSelectedParentId={setSelectedParentId}
            handleRecordingSaved={handleRecordingSaved}
            handleDelete={handleDelete}
          />
        } />
        <Route path="/dashboard" element={
          <Dashboard 
            recordings={recordings}
            filteredRecordings={filteredRecordings}
            selectedParentId={selectedParentId}
            setSelectedParentId={setSelectedParentId}
            handleRecordingSaved={handleRecordingSaved}
            handleDelete={handleDelete}
          />
        } />
        <Route path="/analyse" element={<AnalysePage />} />
        <Route path="/compare" element={<ComparePage />} />
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
