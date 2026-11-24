import React from 'react';
import { GitBranch, Wrench } from 'lucide-react';
import PageContainer from './shell/PageContainer';

export default function ComparePage() {
  return (
    <PageContainer>
      <div className="min-h-[500px] flex flex-col items-center justify-center text-center">
        <div className="studio-card p-8 sm:p-12 max-w-xl w-full">
          <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-surface-utility border border-border-dim flex items-center justify-center text-accent">
            <GitBranch className="w-6 h-6 animate-pulse" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-mono font-medium mb-3">
            <Wrench className="w-3 h-3" />
            <span>In Development</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-main tracking-tight mb-2">
            Audio Comparison
          </h1>

          <p className="text-text-dim text-xs max-w-md mx-auto mb-6 leading-relaxed">
            Side-by-side waveform analysis and acoustic frequency diffing between recording takes will be introduced in an upcoming milestone.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="border border-dashed border-border-dim rounded-xl p-5 text-xs text-text-muted bg-surface-muted">
              Take A Placement
            </div>
            <div className="border border-dashed border-border-dim rounded-xl p-5 text-xs text-text-muted bg-surface-muted">
              Take B Placement
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
