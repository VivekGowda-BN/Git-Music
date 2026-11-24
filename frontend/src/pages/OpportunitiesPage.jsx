import React from 'react';
import { Compass, Sparkles, Filter, ExternalLink, Calendar } from 'lucide-react';
import PageContainer from '../components/shell/PageContainer';

export default function OpportunitiesPage() {
  const previewCategories = [
    { label: 'All Opportunities', count: 12 },
    { label: 'Competitions', count: 5 },
    { label: 'Live Gigs', count: 3 },
    { label: 'Production Grants', count: 2 },
    { label: 'Collabs', count: 2 },
  ];

  return (
    <PageContainer>
      {/* Header */}
      <header className="mb-8 border-b border-border-dim pb-6">
        <div className="font-mono text-xs uppercase tracking-wider text-text-dim font-medium mb-1">
          DISCOVERY / GIGS & CONTESTS
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-text-main tracking-tight">
          Music Opportunities
        </h1>
        <p className="text-xs sm:text-sm text-text-dim mt-1.5 max-w-xl leading-relaxed">
          Discover competitions, live gigs, and production grants to showcase your original music.
        </p>
      </header>

      {/* Honest Status Banner */}
      <div className="studio-card p-4 sm:p-5 mb-6 flex items-start sm:items-center gap-3.5 bg-surface-utility">
        <div className="w-8 h-8 rounded-lg bg-white border border-border-dim flex items-center justify-center text-accent flex-shrink-0">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-xs font-bold text-text-main">Opportunity discovery is being prepared.</h2>
          <p className="text-[11px] text-text-dim mt-0.5">
            Curated opportunities from platforms like Unstop and indie sound portals will be introduced in the next milestone. Below is a preview of the card layout.
          </p>
        </div>
      </div>

      {/* Filter Bar Preview */}
      <div className="flex flex-wrap items-center gap-2 mb-6" aria-label="Opportunity Categories">
        <div className="flex items-center gap-1.5 text-xs text-text-muted font-mono mr-1">
          <Filter className="w-3.5 h-3.5" />
          <span>Filter:</span>
        </div>
        {previewCategories.map((cat, idx) => (
          <button
            key={cat.label}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${idx === 0
                ? 'bg-text-main text-white font-semibold'
                : 'bg-white border border-border-dim text-text-dim hover:text-text-main hover:bg-surface-muted'
              }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Bento Preview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <article className="studio-card p-6 flex flex-col justify-between hover:border-text-dim/40 transition-all">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-mono font-bold uppercase">
                Competition
              </span>
              <span className="text-[10px] font-mono text-text-muted">Unstop Partner</span>
            </div>
            <h3 className="text-base font-bold text-text-main mb-1.5 leading-snug">
              National Beatmaker League 2026
            </h3>
            <p className="text-xs text-text-dim leading-relaxed mb-6">
              Submit your original 60-second instrumental track. Selected artists receive studio time and mastering support.
            </p>
          </div>
          <div className="pt-3 border-t border-border-dim/60 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-text-muted font-mono text-[11px]">
              <Calendar className="w-3.5 h-3.5" /> Apr 30, 2026
            </span>
            <span className="flex items-center gap-1 text-primary font-semibold text-xs">
              Preview <ExternalLink className="w-3 h-3" />
            </span>
          </div>
        </article>

        <article className="studio-card p-6 flex flex-col justify-between hover:border-text-dim/40 transition-all">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-accent text-[10px] font-mono font-bold uppercase">
                Live Gig
              </span>
              <span className="text-[10px] font-mono text-text-muted">Indie Stage</span>
            </div>
            <h3 className="text-base font-bold text-text-main mb-1.5 leading-snug">
              Ambient & Electronic Showcase
            </h3>
            <p className="text-xs text-text-dim leading-relaxed mb-6">
              Open call for experimental electronic and ambient solo artists for a weekend listening session series.
            </p>
          </div>
          <div className="pt-3 border-t border-border-dim/60 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-text-muted font-mono text-[11px]">
              <Calendar className="w-3.5 h-3.5" /> May 15, 2026
            </span>
            <span className="flex items-center gap-1 text-primary font-semibold text-xs">
              Preview <ExternalLink className="w-3 h-3" />
            </span>
          </div>
        </article>

        <article className="studio-card p-6 flex flex-col justify-between hover:border-text-dim/40 transition-all">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="px-2 py-0.5 rounded bg-purple-50 border border-purple-200 text-purple-700 text-[10px] font-mono font-bold uppercase">
                Grant
              </span>
              <span className="text-[10px] font-mono text-text-muted">Sound Foundation</span>
            </div>
            <h3 className="text-base font-bold text-text-main mb-1.5 leading-snug">
              Emerging Producer Micro-Grant
            </h3>
            <p className="text-xs text-text-dim leading-relaxed mb-6">
              Micro-funding for independent sound artists to complete home studio recordings and release EP projects.
            </p>
          </div>
          <div className="pt-3 border-t border-border-dim/60 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-text-muted font-mono text-[11px]">
              <Calendar className="w-3.5 h-3.5" /> Jun 01, 2026
            </span>
            <span className="flex items-center gap-1 text-primary font-semibold text-xs">
              Preview <ExternalLink className="w-3 h-3" />
            </span>
          </div>
        </article>
      </div>
    </PageContainer>
  );
}
