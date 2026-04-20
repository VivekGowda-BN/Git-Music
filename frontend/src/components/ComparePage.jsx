import React from 'react';
import { GitBranch } from 'lucide-react';

function ComparePage() {
  return (
    <div className="pt-24 min-h-[600px] flex flex-col items-center justify-center text-center">
      <div className="glass-panel p-12 rounded-3xl max-w-2xl w-full">
        <GitBranch className="w-16 h-16 mx-auto mb-6 text-primary animate-pulse" />
        <h2 className="text-3xl font-bold mb-4 text-white">Audio Comparison</h2>
        <p className="text-text-dim mb-8">
          Select two recordings from your version tree to compare their wave patterns, tags, and AI analysis.
        </p>
        <div className="grid grid-cols-2 gap-6">
          <div className="border border-dashed border-border-dim rounded-2xl p-8 text-sm opacity-50">
            Drop first recording here
          </div>
          <div className="border border-dashed border-border-dim rounded-2xl p-8 text-sm opacity-50">
            Drop second recording here
          </div>
        </div>
      </div>
    </div>
  );
}

export default ComparePage;
