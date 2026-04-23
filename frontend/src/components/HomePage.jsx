import React from 'react';
import { Link } from 'react-router-dom';
import { Mic, GitBranch, BarChart2, Music, ArrowRight, Zap, Layers, Activity } from 'lucide-react';

const features = [
  {
    icon: <Mic className="w-6 h-6 text-primary" />,
    title: 'Capture Ideas Instantly',
    desc: 'Record musical ideas directly in the browser. Never lose a melody again.',
  },
  {
    icon: <GitBranch className="w-6 h-6 text-accent" />,
    title: 'Version Control for Music',
    desc: 'Branch, iterate, and evolve your ideas — just like Git, but for sound.',
  },
  {
    icon: <BarChart2 className="w-6 h-6" style={{ color: '#a855f7' }} />,
    title: 'Deep Audio Analysis',
    desc: 'AI-powered BPM, key, mood, genre and instrument detection on every recording.',
  },
  {
    icon: <Activity className="w-6 h-6" style={{ color: '#22d3ee' }} />,
    title: 'Compare & Contrast',
    desc: 'Side-by-side waveform and metadata comparison across any two versions.',
  },
];

const stats = [
  { value: 'BPM', label: 'Tempo Detection' },
  { value: 'Key', label: 'Musical Key' },
  { value: 'Mood', label: 'Mood Analysis' },
  { value: 'Genre', label: 'Genre Tagging' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen pt-28 pb-20 px-4">
      {/* Hero */}
      <section className="text-center max-w-4xl mx-auto mb-24">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-8 tracking-widest uppercase">
          <Zap className="w-3 h-3" />
          Git for Musical Ideas
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tighter text-white leading-tight mb-6">
          Your music ideas,{' '}
          <span
            style={{
              background: 'linear-gradient(135deg, #FF2E63 0%, #FF6B9D 50%, #00D1FF 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            version controlled.
          </span>
        </h1>

        <p className="text-lg text-text-dim max-w-2xl mx-auto mb-10 leading-relaxed">
          Record spontaneous musical ideas, analyse them with AI, branch into new directions,
          and never lose a creative spark again.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 px-8 py-3.5 rounded-full font-bold text-sm text-white transition-all duration-300 hover:scale-105 hover:shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #FF2E63, #FF6B9D)',
              boxShadow: '0 0 24px rgba(255,46,99,0.35)',
            }}
          >
            Open Dashboard <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/analyse"
            className="flex items-center gap-2 px-8 py-3.5 rounded-full font-bold text-sm text-text-dim border border-white/10 bg-white/5 hover:bg-white/10 hover:text-white transition-all duration-300"
          >
            Analyse Audio <BarChart2 className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Animated stats bar */}
      <section className="max-w-3xl mx-auto mb-24">
        <div
          className="grid grid-cols-2 sm:grid-cols-4 gap-px rounded-2xl overflow-hidden"
          style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.04)' }}
        >
          {stats.map((s, i) => (
            <div
              key={i}
              className="flex flex-col items-center justify-center py-6 px-4 text-center"
              style={{ background: 'rgba(13,13,13,0.6)' }}
            >
              <span className="text-2xl font-black text-white mb-1">{s.value}</span>
              <span className="text-xs text-text-dim tracking-wide">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto mb-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-white mb-3">Everything you need</h2>
          <p className="text-text-dim text-sm">Built for musicians who think in ideas, not files.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {features.map((f, i) => (
            <div
              key={i}
              className="glass-panel rounded-2xl p-6 flex items-start gap-5 hover:border-white/10 transition-all duration-300 hover:scale-[1.02] cursor-default"
            >
              <div className="p-3 rounded-xl bg-white/5 flex-shrink-0">{f.icon}</div>
              <div>
                <h3 className="font-bold text-white mb-1">{f.title}</h3>
                <p className="text-sm text-text-dim leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="max-w-4xl mx-auto">
        <div
          className="rounded-3xl p-10 text-center relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(255,46,99,0.12) 0%, rgba(0,209,255,0.08) 100%)',
            border: '1px solid rgba(255,46,99,0.2)',
          }}
        >
          {/* Decorative blobs */}
          <div
            className="absolute -top-16 -left-16 w-48 h-48 rounded-full opacity-20 blur-3xl pointer-events-none"
            style={{ background: '#FF2E63' }}
          />
          <div
            className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full opacity-20 blur-3xl pointer-events-none"
            style={{ background: '#00D1FF' }}
          />

          <div className="relative z-10">
            <Layers className="w-10 h-10 mx-auto mb-4 text-primary" />
            <h2 className="text-3xl font-black text-white mb-3">Start recording now</h2>
            <p className="text-text-dim text-sm mb-8 max-w-md mx-auto">
              Head to the Dashboard to capture and branch your musical ideas.
            </p>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-bold text-sm text-white transition-all duration-300 hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #FF2E63, #FF6B9D)',
                boxShadow: '0 0 24px rgba(255,46,99,0.4)',
              }}
            >
              Go to Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
