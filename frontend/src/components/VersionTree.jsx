import React, { useState } from 'react';
import { Play, GitBranch, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';

const API_URL = 'http://localhost:3000';

function VersionNode({ node, level, onSelectParent, isSelected, allNodes, expandedNodes, onToggleExpand, onDelete }) {
  const handlePlay = () => {
    const audio = new Audio(`${API_URL}/audio/${node.filename}`);
    audio.play();
  };

  const childrenNodes = allNodes.filter(n => n.parent_id === node.id);
  const isExpanded = !!expandedNodes[node.id];

  const formattedDate = new Date(node.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const formattedTime = new Date(node.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  return (
    <div className="relative mb-6 last:mb-0">
      <div
        className={`relative z-10 flex items-start gap-5 p-5 rounded-2xl border transition-all duration-300 group ${isSelected
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
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-base font-bold text-white leading-tight mb-1">
                {node.name || "Untitled Recording"}
              </p>
              <p className="text-[11px] text-text-dim font-medium">
                This was recorded on {formattedDate}, {formattedTime}
              </p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => onDelete(node.id)}
                className="flex items-center justify-center p-2 rounded-lg bg-[#2A2A2A] text-text-dim hover:bg-red-500/20 hover:text-red-500 transition-all"
                title="Delete Recording"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onSelectParent(node.id)}
                className={`flex items-center gap-2 text-[10px] px-3 py-2 rounded-lg transition-all font-bold uppercase tracking-wider ${isSelected
                    ? 'bg-primary text-white'
                    : 'bg-[#2A2A2A] text-text-dim hover:bg-primary/20 hover:text-primary'
                  }`}
              >
                <GitBranch className="w-3.5 h-3.5" /> Branch
              </button>
            </div>
          </div>

          {childrenNodes.length > 0 && (
            <button
              onClick={() => onToggleExpand(node.id)}
              className="mt-2 flex items-center gap-1.5 text-[10px] text-accent font-bold uppercase tracking-widest hover:opacity-80 transition-all"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {isExpanded ? 'Hide Branches' : `View Branches (${childrenNodes.length})`}
            </button>
          )}
        </div>
      </div>

      {isExpanded && childrenNodes.length > 0 && (
        <div className="mt-4 pl-10 border-l-2 border-border-dim ml-7 space-y-6 animate-in slide-in-from-top-2 duration-300">
          {childrenNodes.map(child => (
            <div key={child.id} className="relative">
              <div className="absolute -left-10 top-10 w-10 border-t-2 border-border-dim"></div>
              <VersionNode
                node={child}
                level={level + 1}
                onSelectParent={onSelectParent}
                isSelected={isSelected === child.id}
                allNodes={allNodes}
                expandedNodes={expandedNodes}
                onToggleExpand={onToggleExpand}
                onDelete={onDelete}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function VersionTree({ recordings, onSelectParent, selectedParentId, onDelete }) {
  const [expandedNodes, setExpandedNodes] = useState({});

  const toggleExpand = (nodeId) => {
    setExpandedNodes(prev => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }));
  };

  // Find roots (no parent or parent not in current filtered list)
  const roots = recordings.filter(r => !r.parent_id || !recordings.some(rec => rec.id === r.parent_id));

  if (recordings.length === 0) {
    return (
      <div className="text-center py-20 text-text-dim border border-dashed border-border-dim rounded-2xl">
        <GitBranch className="w-12 h-12 mx-auto mb-4 opacity-30" />
        <p className="font-bold">No recordings found.</p>
        <p className="text-sm mt-1 opacity-70">Start by recording your first idea.</p>
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
          allNodes={recordings}
          expandedNodes={expandedNodes}
          onToggleExpand={toggleExpand}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

export default VersionTree;
