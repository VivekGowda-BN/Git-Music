import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Recorder from './components/Recorder';
import VersionTree from './components/VersionTree';
import { Mic, GitBranch } from 'lucide-react';

const API_URL = 'http://localhost:3000';

function App() {
  const [recordings, setRecordings] = useState([]);
  const [selectedParentId, setSelectedParentId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

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

  const handleRecordingSaved = () => {
    fetchRecordings();
    setSelectedParentId(null); // Reset selection
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
    <div className="min-h-screen bg-background text-text-main p-8 max-w-6xl mx-auto font-sans">
      <header className="flex items-center justify-between mb-12 border-b border-border-dim pb-8">
        <div className="flex items-center gap-5">
          <div className="bg-primary p-4 rounded-2xl glow-primary">
            <Mic className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-white">
              GIT<span className="text-primary">MUSIC</span>
            </h1>
            <p className="text-text-dim text-sm mt-1 font-medium uppercase tracking-widest">Version Control for Ideas</p>
          </div>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search tags or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-5 py-3 bg-surface border border-border-dim rounded-xl focus:outline-none focus:ring-2 focus:ring-primary w-80 text-sm transition-all focus:border-primary/50"
          />
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-1 space-y-8">
          <div className="glass-panel p-8 rounded-3xl">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
              <Mic className="w-6 h-6 text-primary" /> Record Idea
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
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
