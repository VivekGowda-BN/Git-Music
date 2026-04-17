import React from 'react';
import { Play, GitBranch, Tag } from 'lucide-react';

const API_URL = 'http://localhost:3000';

function VersionNode({ node, level, onSelectParent, isSelected, childrenNodes, allNodes }) {
  const handlePlay = () => {
    const audio = new Audio(`${API_URL}/audio/${node.filename}`);
    audio.play();
  };

  return (
    <div className="relative mb-8">
      <div 
        className={`relative z-10 flex items-start gap-5 p-5 rounded-2xl border transition-all duration-300 group ${
          isSelected 
            ? 'bg-primary/5 border-primary glow-primary shadow-[0_0_30px_rgba(255,46,99,0.1)]' 
            : 'bg-[#1A1A1A] border-border-dim hover:border-text-dim/30'
        }`}
      >
        <button 
          onClick={handlePlay}
          className="flex-shrink-0 bg-primary text-white p-4 rounded-xl transition-transform hover:scale-110 active:scale-95 shadow-lg shadow-primary/20"
        >
          <Play className="w-5 h-5 fill-white" />
        </button>

        <div className="flex-grow">
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <p className="font-mono text-[10px] text-text-dim uppercase tracking-widest">
                  ID: {node.id.substring(0, 8)}
                </p>
                <p className="text-[10px] text-text-dim/50 uppercase tracking-widest">
                  {new Date(node.created_at).toLocaleDateString()}
                </p>
              </div>
              <p className="text-base font-bold text-white leading-tight">
                {node.description || "Untitled Sketch"}
              </p>
            </div>
            <button 
              onClick={() => onSelectParent(node.id)}
              className={`flex items-center gap-2 text-xs px-4 py-2 rounded-lg transition-all font-bold uppercase tracking-wider ${
                isSelected 
                  ? 'bg-primary text-white' 
                  : 'bg-[#2A2A2A] text-text-dim hover:bg-primary/20 hover:text-primary'
              }`}
            >
              <GitBranch className="w-4 h-4" /> Branch
            </button>
          </div>

          {node.tags && (
            <div className="flex flex-wrap gap-2 mt-4">
              {Object.entries(node.tags).map(([key, value]) => {
                if (value === 'unknown' || value === 'idea' || key === 'error') return null;
                const colors = {
                  mood: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                  type: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                  energy: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                };
                return (
                  <span key={key} className={`flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold px-2.5 py-1 rounded-md border ${colors[key] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                    <Tag className="w-3 h-3" /> {value}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {childrenNodes.length > 0 && (
        <div className="mt-6 pl-10 border-l-2 border-border-dim ml-7 space-y-6">
          {childrenNodes.map(child => (
            <div key={child.id} className="relative">
              <div className="absolute -left-10 top-10 w-10 border-t-2 border-border-dim"></div>
              <VersionNode 
                node={child} 
                level={level + 1} 
                onSelectParent={onSelectParent}
                isSelected={isSelected === child.id}
                childrenNodes={allNodes.filter(n => n.parent_id === child.id)}
                allNodes={allNodes}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function VersionTree({ recordings, onSelectParent, selectedParentId }) {
  // Find roots (no parent or parent not in current filtered list)
  const roots = recordings.filter(r => !r.parent_id || !recordings.some(rec => rec.id === r.parent_id));

  if (recordings.length === 0) {
    return (
      <div className="text-center py-20 text-slate-500 border border-dashed border-slate-700 rounded-xl">
        <GitBranch className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No recordings yet.</p>
        <p className="text-sm mt-1">Start recording an idea to see the tree grow.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {roots.map(root => (
        <VersionNode 
          key={root.id} 
          node={root} 
          level={0} 
          onSelectParent={onSelectParent}
          isSelected={selectedParentId === root.id}
          childrenNodes={recordings.filter(n => n.parent_id === root.id)}
          allNodes={recordings}
        />
      ))}
    </div>
  );
}

export default VersionTree;
