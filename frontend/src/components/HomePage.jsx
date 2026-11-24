import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Mic, GitBranch, BarChart2, Compass, ArrowRight, Layers, Sparkles,
  Play, Pause, Music, Sliders, Volume2, ShieldCheck, Share2, Award,
  Clock, Zap, CheckCircle2, ChevronRight, Activity, Terminal
} from 'lucide-react';
import PageContainer from './shell/PageContainer';

export default function HomePage() {
  const [isPlayingDemo, setIsPlayingDemo] = useState(false);

  const pillars = [
    {
      id: 'capture',
      badge: 'PILLAR 01',
      title: 'Signal-Level Audio Intake',
      subtitle: 'Capture spontaneous melodies before inspiration fades.',
      desc: 'One-click recording in your browser with real-time waveform rendering. Zero audio drivers to install, zero latency lag. Drop WAV, MP3, or AIFF takes directly onto the canvas for immediate signal inspection.',
      actionLink: '/capture',
      actionText: 'Launch Capture Studio',
      icon: <Mic className="w-5 h-5 text-primary" />,
      features: [
        'Browser-native Web Audio recording up to 48kHz',
        'Tactile WaveSurfer soundwave visualization with live scrubbing',
        'Automatic tempo (BPM) and musical key detection',
        'Guest-ready: record immediately without mandatory signup'
      ]
    },
    {
      id: 'branching',
      badge: 'PILLAR 02',
      title: 'Git-Like Take Versioning',
      subtitle: 'Layer vocals, guitars, and beats without destroying the master take.',
      desc: 'Music creation is messy and non-linear. SwarLab replaces messy desktop folders like "Track_Final_v4_edit.wav" with an elegant Git branch tree. Keep your root take pristine while branching experimental harmonies, basslines, and solos.',
      actionLink: '/dashboard',
      actionText: 'Explore Project Tree',
      icon: <GitBranch className="w-5 h-5 text-accent" />,
      features: [
        'Hierarchical structure: Project → Root Take → Layer Branches',
        'Audition instrument stems in isolation or blended in context',
        'Non-destructive commit history for acoustic iterations',
        'Fast branch switching without duplicating heavy project files'
      ]
    },
    {
      id: 'intelligence',
      badge: 'PILLAR 03',
      title: 'Acoustic AI & Social Hook Finder',
      subtitle: 'Identify key, tempo, and the viral 30-second climax.',
      desc: 'Instantly uncover the harmonic DNA of your recording. Our acoustic intelligence extracts BPM, scale mode, energy dynamics, and isolates the most impactful 15 to 30-second window calibrated for TikTok, Reels, and YouTube Shorts.',
      actionLink: '/capture',
      actionText: 'Inspect Track Acoustics',
      icon: <BarChart2 className="w-5 h-5 text-warning" />,
      features: [
        'Key & Scale mode inference (e.g. F# Minor, Dorian mode)',
        'Rhythmic tempo estimation with BPM stability scoring',
        'Smart Highlight Hook Detection for high-converting social teasers',
        'Transparent labeling with honest DSP verification status'
      ]
    },
    {
      id: 'opportunities',
      badge: 'PILLAR 04',
      title: 'Artist Opportunities & Gigs',
      subtitle: 'Connect your sound to real competitions, grants, and showcases.',
      desc: 'Don’t let your tracks stay trapped on a hard drive. Discover verified music production competitions, indie record label demo calls, grant programs, and festival slots with straightforward one-click application links.',
      actionLink: '/opportunities',
      actionText: 'Browse Live Opportunities',
      icon: <Compass className="w-5 h-5 text-success" />,
      features: [
        'Curated calls from Unstop, indie promoters, and arts foundations',
        'Filtered by category: Competitions, Gigs, Grants, and Collabs',
        'Clear deadline tracking, cash reward tags, and eligibility criteria',
        'Direct links to original event hosts with zero middleman fee'
      ]
    }
  ];

  return (
    <PageContainer>
      {/* =========================================================================
          1. HERO SECTION: PUNCH LINE & CORE ACTION DIRECTIVES
      ========================================================================= */}
      <section className="text-center max-w-4xl mx-auto mb-16 sm:mb-20 pt-6 sm:pt-12">
        {/* Eyebrow Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface border border-border-dim shadow-xs text-text-dim text-xs font-mono font-medium mb-6">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="tracking-wider uppercase">SwarLab Contemporary Music Lab</span>
          <span className="text-border-hover">|</span>
          <span className="text-text-muted">v0.9 Beta</span>
        </div>

        {/* Punch Line Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-text-main leading-[1.05] mb-6">
          Capture the melody.{' '}
          <span className="text-primary italic font-serif font-normal block sm:inline">
            Never lose the take.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-xl text-text-dim max-w-2xl mx-auto mb-9 leading-relaxed font-sans">
          The sound studio built like modern software. Record spontaneous audio in high-fidelity, analyze key and tempo with musical intelligence, and branch infinite instrument layers without duplicating files.
        </p>

        {/* CTA Button Duo */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-8">
          <Link
            to="/capture"
            className="w-full sm:w-auto btn-primary px-8 py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2.5 cursor-pointer shadow-md hover:shadow-lg transition-all min-h-[48px]"
          >
            <Mic className="w-4 h-4 text-white" />
            <span>Start Capturing Takes</span>
          </Link>
          <Link
            to="/dashboard"
            className="w-full sm:w-auto btn-secondary px-8 py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2.5 cursor-pointer shadow-xs min-h-[48px]"
          >
            <GitBranch className="w-4 h-4 text-text-dim" />
            <span>Open Studio Dashboard</span>
            <ArrowRight className="w-4 h-4 text-text-muted" />
          </Link>
        </div>

        {/* Micro Credibility Ribbon */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-text-muted font-mono">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-success" /> Completely Free
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-success" /> No Sign-Up to Record
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-success" /> Non-Destructive Git Model
          </span>
        </div>
      </section>

      {/* =========================================================================
          2. HARDWARE & CONSOLE HERO MOCKUP (TACTILE STUDIO INTERFACE)
      ========================================================================= */}
      <section className="max-w-5xl mx-auto mb-20 sm:mb-24" aria-label="Interactive Studio Deck">
        <div className="studio-card p-4 sm:p-7 bg-surface overflow-hidden relative border border-border-dim shadow-md">
          {/* Deck Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 mb-5 border-b border-border-dim gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-surface-muted border border-border-dim flex items-center justify-center text-primary">
                <Music className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-semibold text-text-muted uppercase tracking-wider">Active Session</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">LIVE ENGINE</span>
                </div>
                <h3 className="text-base font-bold text-text-main font-sans">Midnight Echoes — Take 03 (Acoustic Stem)</h3>
              </div>
            </div>

            {/* Quick Metrics Badges */}
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="px-2.5 py-1 rounded-md bg-surface-muted border border-border-dim text-text-main font-semibold">
                128 <span className="text-text-muted font-normal text-[10px]">BPM</span>
              </span>
              <span className="px-2.5 py-1 rounded-md bg-surface-muted border border-border-dim text-text-main font-semibold">
                G MINOR <span className="text-text-muted font-normal text-[10px]">KEY</span>
              </span>
              <span className="px-2.5 py-1 rounded-md bg-surface-muted border border-border-dim text-accent font-semibold">
                3 BRANCHES
              </span>
            </div>
          </div>

          {/* Interactive Waveform Display Deck */}
          <div className="p-4 sm:p-5 rounded-xl bg-surface-muted/60 border border-border-dim/80 mb-5">
            <div className="flex items-center justify-between text-xs font-mono text-text-dim mb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPlayingDemo(!isPlayingDemo)}
                  className="w-8 h-8 rounded-full bg-text-main text-white flex items-center justify-center hover:bg-black transition-transform active:scale-95 cursor-pointer"
                  aria-label={isPlayingDemo ? 'Pause preview' : 'Play preview'}
                >
                  {isPlayingDemo ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                </button>
                <span className="font-semibold text-text-main">Acoustic Signal Inspector</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-primary font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  REC READY
                </span>
                <span>00:14.2 / 01:48.0</span>
              </div>
            </div>

            {/* Tactile Waveform Bars with Social Highlight Window */}
            <div className="bg-white rounded-xl border border-border-dim/60 p-3 sm:p-4">
              <div className="flex flex-wrap items-center justify-between mb-3 px-2.5 py-1.5 rounded-lg bg-red-50/70 border border-red-200/60 text-[11px] font-mono text-primary gap-2">
                <div className="flex items-center gap-1.5 font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>SUGGESTED SOCIAL MOMENT (30s)</span>
                </div>
                <div className="flex items-center gap-3">
                  <span>WINDOW: 00:18 — 00:48</span>
                  <span className="font-bold bg-white px-2 py-0.5 rounded shadow-2xs border border-red-200">PEAK ENERGY 92%</span>
                </div>
              </div>

              <div className="h-20 sm:h-24 flex items-center gap-1 sm:gap-1.5 px-1">
                {[18, 25, 40, 65, 80, 50, 30, 45, 90, 75, 60, 40, 25, 35, 70, 95, 100, 85, 90, 60, 45, 80, 95, 70, 55, 30, 20, 35, 60, 85, 70, 45, 30, 50, 75, 90, 60, 35, 20, 15, 25, 45, 65, 40, 20].map((h, idx) => {
                  const inHighlight = idx >= 14 && idx <= 28;
                  return (
                    <div
                      key={idx}
                      style={{ height: `${h}%` }}
                      className={`flex-1 rounded-full transition-all duration-300 ${
                        inHighlight
                          ? 'bg-primary'
                          : isPlayingDemo
                          ? 'bg-accent/80'
                          : 'bg-text-dim/25 hover:bg-text-dim/60'
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Git-Tree Branch Hierarchy Preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl border border-border-dim bg-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <div>
                  <div className="text-xs font-semibold font-sans text-text-main">main (master take)</div>
                  <div className="text-[10px] font-mono text-text-muted">Acoustic Taylor 814ce</div>
                </div>
              </div>
              <span className="text-[11px] font-mono text-text-dim bg-surface-muted px-2 py-0.5 rounded">01:48</span>
            </div>

            <div className="p-3.5 rounded-xl border border-primary/40 bg-primary/5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <GitBranch className="w-4 h-4 text-primary" />
                <div>
                  <div className="text-xs font-semibold font-sans text-text-main">branch / vocal-harmonies</div>
                  <div className="text-[10px] font-mono text-primary font-medium">+ Falsetto Layer (Take 02)</div>
                </div>
              </div>
              <span className="text-[10px] font-mono text-primary font-bold bg-white px-2 py-0.5 rounded border border-primary/20">ACTIVE</span>
            </div>

            <div className="p-3.5 rounded-xl border border-border-dim bg-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <GitBranch className="w-4 h-4 text-accent" />
                <div>
                  <div className="text-xs font-semibold font-sans text-text-main">branch / sub-bass-808</div>
                  <div className="text-[10px] font-mono text-text-muted">Moog Sub 37 Stem</div>
                </div>
              </div>
              <span className="text-[11px] font-mono text-text-dim bg-surface-muted px-2 py-0.5 rounded">STAGED</span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. FEATURES SHOWCASE: THE FOUR CORE PILLARS ONE BY ONE
      ========================================================================= */}
      <section className="max-w-5xl mx-auto mb-20 sm:mb-24" aria-label="SwarLab Core Features">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface border border-border-dim text-xs font-mono font-medium text-text-dim mb-3">
            <Sliders className="w-3.5 h-3.5 text-accent" />
            <span>FULL STUDIO SUITE</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-text-main tracking-tight leading-tight">
            Designed for artists who think in takes, not nested folders.
          </h2>
          <p className="text-sm sm:text-base text-text-dim mt-3">
            Every feature in SwarLab exists to remove friction between hearing an idea in your head and committing it to a structured song.
          </p>
        </div>

        {/* Feature Pillars Detailed One by One */}
        <div className="space-y-12 sm:space-y-16">
          {pillars.map((pillar, index) => {
            const isReversed = index % 2 === 1;
            return (
              <div
                key={pillar.id}
                className={`studio-card p-6 sm:p-10 flex flex-col ${
                  isReversed ? 'lg:flex-row-reverse' : 'lg:flex-row'
                } items-center gap-8 sm:gap-12 bg-white`}
              >
                {/* Text Content */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-primary tracking-wider uppercase">
                      {pillar.badge}
                    </span>
                    <span className="text-border-dim">•</span>
                    <span className="text-xs font-mono text-text-muted">SwarLab Engine</span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-extrabold text-text-main tracking-tight font-sans">
                    {pillar.title}
                  </h3>

                  <p className="text-base text-text-main font-medium italic font-serif">
                    "{pillar.subtitle}"
                  </p>

                  <p className="text-sm text-text-dim leading-relaxed font-sans">
                    {pillar.desc}
                  </p>

                  {/* Bullet Checklist */}
                  <ul className="space-y-2 pt-2">
                    {pillar.features.map((item, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-text-dim">
                        <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Action Link */}
                  <div className="pt-3">
                    <Link
                      to={pillar.actionLink}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-hover group cursor-pointer"
                    >
                      <span>{pillar.actionText}</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>

                {/* Tactile Visual Representation / Graphic */}
                <div className="w-full lg:w-[45%] flex-shrink-0">
                  <div className="rounded-2xl p-6 bg-surface-muted border border-border-dim shadow-xs">
                    {pillar.id === 'capture' && (
                      <div className="space-y-4 font-mono text-xs">
                        <div className="flex items-center justify-between border-b border-border-dim pb-3">
                          <span className="text-text-muted">INPUT CHANNEL 01</span>
                          <span className="text-emerald-600 font-semibold flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> MIC IN [USB]
                          </span>
                        </div>
                        <div className="p-4 rounded-xl bg-white border border-border-dim text-center space-y-2">
                          <div className="w-12 h-12 rounded-full bg-red-50 text-primary mx-auto flex items-center justify-center">
                            <Mic className="w-6 h-6" />
                          </div>
                          <div className="font-bold text-sm text-text-main">Direct Audio Ingest</div>
                          <div className="text-[11px] text-text-muted font-sans">WAV, FLAC, MP3, AIFF up to 48kHz</div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div className="p-2.5 rounded-lg bg-white border border-border-dim">
                            <span className="text-text-muted block text-[10px]">SAMPLING</span>
                            <span className="font-bold text-text-main">48.0 kHz / 24-bit</span>
                          </div>
                          <div className="p-2.5 rounded-lg bg-white border border-border-dim">
                            <span className="text-text-muted block text-[10px]">LATENCY</span>
                            <span className="font-bold text-emerald-600">&lt; 4.2 ms</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {pillar.id === 'branching' && (
                      <div className="space-y-3 font-mono text-xs">
                        <div className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2">Version Tree Visualizer</div>
                        <div className="space-y-2">
                          <div className="p-2.5 rounded-lg bg-white border-l-4 border-l-emerald-500 border border-border-dim flex items-center justify-between">
                            <div>
                              <div className="font-bold text-text-main">commit #a1f8c</div>
                              <div className="text-[10px] text-text-muted font-sans">root: Acoustic Melody (Take 1)</div>
                            </div>
                            <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold">MASTER</span>
                          </div>
                          <div className="ml-5 pl-3 border-l-2 border-dashed border-border-dim space-y-2">
                            <div className="p-2.5 rounded-lg bg-white border-l-4 border-l-primary border border-border-dim flex items-center justify-between">
                              <div>
                                <div className="font-bold text-text-main">branch / vocal-take-02</div>
                                <div className="text-[10px] text-primary font-sans">+ Lead Chorus Harmonies</div>
                              </div>
                              <span className="text-[10px] bg-red-50 text-primary px-2 py-0.5 rounded font-bold">BRANCH</span>
                            </div>
                            <div className="p-2.5 rounded-lg bg-white border-l-4 border-l-accent border border-border-dim flex items-center justify-between">
                              <div>
                                <div className="font-bold text-text-main">branch / 808-percussion</div>
                                <div className="text-[10px] text-accent font-sans">+ Syncopated Trap Drums</div>
                              </div>
                              <span className="text-[10px] bg-indigo-50 text-accent px-2 py-0.5 rounded font-bold">BRANCH</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {pillar.id === 'intelligence' && (
                      <div className="space-y-3 font-mono text-xs">
                        <div className="flex items-center justify-between text-text-muted pb-2 border-b border-border-dim">
                          <span>ACOUSTIC DSP REPORT</span>
                          <span className="text-primary font-bold">CONFIDENCE 94%</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2.5">
                          <div className="p-3 rounded-lg bg-white border border-border-dim">
                            <span className="text-[10px] text-text-muted block">DETECTED TEMPO</span>
                            <span className="text-lg font-bold text-text-main">124 BPM</span>
                            <span className="text-[10px] text-emerald-600 block mt-0.5">Stable Rhythm</span>
                          </div>
                          <div className="p-3 rounded-lg bg-white border border-border-dim">
                            <span className="text-[10px] text-text-muted block">MUSICAL KEY</span>
                            <span className="text-lg font-bold text-primary">D Major</span>
                            <span className="text-[10px] text-text-muted block mt-0.5">Camelot 10D</span>
                          </div>
                        </div>
                        <div className="p-3 rounded-lg bg-white border border-border-dim">
                          <div className="flex items-center justify-between text-[11px] mb-1.5">
                            <span className="font-bold text-text-main">VIRAL SOCIAL CLIP</span>
                            <span className="text-primary font-bold">00:18 — 00:48</span>
                          </div>
                          <div className="w-full bg-surface-muted h-2 rounded-full overflow-hidden flex">
                            <div className="w-[30%] bg-border-dim" />
                            <div className="w-[45%] bg-primary" />
                            <div className="w-[25%] bg-border-dim" />
                          </div>
                        </div>
                      </div>
                    )}

                    {pillar.id === 'opportunities' && (
                      <div className="space-y-2.5 font-mono text-xs">
                        <div className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2">Live Industry Radar</div>
                        <div className="p-3 rounded-xl bg-white border border-border-dim space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 rounded text-[10px] bg-red-50 text-primary font-bold">COMPETITION</span>
                            <span className="text-[10px] text-text-muted">Unstop Partner</span>
                          </div>
                          <div className="font-bold text-text-main font-sans text-xs">National Beatmaker League 2026</div>
                          <div className="text-[11px] text-emerald-600 font-bold">$2,500 Prize + Studio Time</div>
                        </div>
                        <div className="p-3 rounded-xl bg-white border border-border-dim space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 rounded text-[10px] bg-blue-50 text-accent font-bold">LIVE GIG</span>
                            <span className="text-[10px] text-text-muted">Indie Stage</span>
                          </div>
                          <div className="font-bold text-text-main font-sans text-xs">Ambient & Electronic Showcase</div>
                          <div className="text-[11px] text-text-dim">Weekend slot • Open call</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* =========================================================================
          4. FOUR-STEP WORKFLOW: HOW AN ARTIST CREATES IN SWARLAB
      ========================================================================= */}
      <section className="max-w-5xl mx-auto mb-20 sm:mb-24" aria-label="Studio Workflow">
        <div className="text-center max-w-xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-text-main tracking-tight">
            How sound takes become songs
          </h2>
          <p className="text-text-dim text-xs sm:text-sm mt-1">
            Four simple steps from raw audio signal to structured song repository.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              step: '01',
              title: 'Record Take',
              desc: 'Tap record or drop an audio file into the browser. High-fidelity audio intake in milliseconds.',
              icon: <Mic className="w-5 h-5 text-primary" />
            },
            {
              step: '02',
              title: 'DSP Analysis',
              desc: 'Instant acoustic profiling: tempo BPM, musical scale key, frequency balance, and energy dynamics.',
              icon: <BarChart2 className="w-5 h-5 text-warning" />
            },
            {
              step: '03',
              title: 'Branch Layers',
              desc: 'Create Git-style branches for guitar solos, vocal harmonies, and drum tracks off your root take.',
              icon: <GitBranch className="w-5 h-5 text-accent" />
            },
            {
              step: '04',
              title: 'Export & Apply',
              desc: 'Share isolated stems, export the viral social highlight clip, and apply directly to industry gig calls.',
              icon: <Share2 className="w-5 h-5 text-success" />
            }
          ].map((item, idx) => (
            <div key={idx} className="studio-card p-6 bg-white flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-surface-muted border border-border-dim flex items-center justify-center">
                    {item.icon}
                  </div>
                  <span className="font-mono text-2xl font-extrabold text-border-hover/80">{item.step}</span>
                </div>
                <h3 className="text-base font-bold text-text-main mb-2 font-sans">{item.title}</h3>
                <p className="text-xs text-text-dim leading-relaxed font-sans">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =========================================================================
          5. BOTTOM CALL TO ACTION
      ========================================================================= */}
      <section className="max-w-4xl mx-auto mb-16 text-center">
        <div className="studio-card p-8 sm:p-14 bg-gradient-to-b from-white to-surface-muted border border-border-dim shadow-md">
          <div className="w-12 h-12 rounded-full bg-red-50 text-primary mx-auto flex items-center justify-center mb-5 border border-primary/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-text-main tracking-tight mb-4">
            Ready to build your music repository?
          </h2>
          <p className="text-sm sm:text-base text-text-dim max-w-lg mx-auto mb-8 leading-relaxed font-sans">
            Start capturing audio takes immediately for free. No credit card, no complex downloads, and no lost melodies.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/capture"
              className="w-full sm:w-auto btn-primary px-8 py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <Mic className="w-4 h-4" /> Start Capturing Now
            </Link>
            <Link
              to="/signup"
              className="w-full sm:w-auto btn-secondary px-8 py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer"
            >
              Create Free Account <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </PageContainer>
  );
}
