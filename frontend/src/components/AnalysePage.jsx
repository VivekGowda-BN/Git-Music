import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import WaveSurfer from 'wavesurfer.js';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, Square, Upload, Activity, Music,
  Layers, ChevronLeft, Loader, CheckCircle,
  Zap, Play, Pause, Trash2, Plus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';


const API_URL = 'http://localhost:3000';

function AnalysePage() {
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [userProjects, setUserProjects] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const waveformRef = useRef(null);
  const wavesurferRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const fileInputRef = useRef(null);

  // Initialize WaveSurfer
  useEffect(() => {
    if (waveformRef.current && audioUrl) {
      console.log('[AnalysePage] Initializing WaveSurfer');
      try {
        if (wavesurferRef.current) {
          wavesurferRef.current.destroy();
        }

        wavesurferRef.current = WaveSurfer.create({
          container: waveformRef.current,
          waveColor: '#2A2A2A',
          progressColor: '#FF2E63',
          cursorColor: 'transparent',
          barWidth: 2,
          barRadius: 3,
          height: 80,
          normalize: true,
        });

        wavesurferRef.current.load(audioUrl);

        wavesurferRef.current.on('finish', () => setIsPlaying(false));
        wavesurferRef.current.on('play', () => setIsPlaying(true));
        wavesurferRef.current.on('pause', () => setIsPlaying(false));
      } catch (e) {
        console.error('[AnalysePage] WaveSurfer error:', e);
      }

      return () => {
        if (wavesurferRef.current) wavesurferRef.current.destroy();
      };
    }
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        setIsRecording(false);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setError(null);
      setResults(null);
      setSaveSuccess(false);
    } catch (err) {
      console.error('Recording error:', err);
      setError('Microphone access denied. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAudioBlob(file);
      setAudioUrl(URL.createObjectURL(file));
      setResults(null);
      setError(null);
      setSaveSuccess(false);
    }
  };

  const analyseAudio = async () => {
    if (!audioBlob) return;

    setIsAnalysing(true);
    setError(null);
    setSaveSuccess(false);

    const formData = new FormData();
    formData.append('audio', audioBlob, audioBlob.name || 'recording.webm');

    try {
      const res = await axios.post(`${API_URL}/analyze-audio`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResults(res.data);
    } catch (err) {
      console.error('Analysis error:', err);
      setError('Failed to analyze audio. Ensure Ollama and backend services are running.');
    } finally {
      setIsAnalysing(false);
    }
  };

  const handleSaveClick = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.get(`${API_URL}/my-projects`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserProjects(res.data);
      setShowProjectModal(true);
    } catch (err) {
      console.error('Failed to fetch projects', err);
      setError('Failed to load projects. Please try logging in again.');
    }
  };

  const saveToProject = async (projectId) => {
    setIsSaving(true);
    setError(null);

    try {
      const token = localStorage.getItem('access_token');
      await axios.post(`${API_URL}/versions`, {
        project_id: projectId,
        bpm: results.bpm,
        key: results.key,
        mood: results.mood,
        genre: results.genre,
        instruments: Array.isArray(results.instruments) ? results.instruments.join(', ') : results.instruments,
        freq_min: results.frequency_range?.low || 20,
        freq_max: results.frequency_range?.high || 20000,
        file_url: audioBlob.name || 'analyzed_audio.webm' // Temporary mock URL
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSaveSuccess(true);
      setShowProjectModal(false);
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      console.error('Save version error:', err);
      setError(err.response?.data?.error || 'Failed to save version.');
    } finally {
      setIsSaving(false);
    }
  };

  const togglePlay = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  };

  const clearAudio = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setResults(null);
    setSaveSuccess(false);
    if (wavesurferRef.current) wavesurferRef.current.destroy();
  };

  return (
    <div className="min-h-screen bg-background text-white pt-24 pb-20 px-4 sm:px-6 font-sans overflow-x-hidden relative">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-6 mb-8"
        >
          <button
            onClick={() => navigate('/')}
            className="w-10 h-10 flex items-center justify-center bg-surface border border-white/5 rounded-full hover:bg-primary/20 hover:text-primary transition-all text-text-dim"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Audio Analysis</h1>
            <p className="text-text-dim text-[10px] uppercase tracking-[0.3em] font-bold opacity-60">AI-Powered Musical Intelligence</p>
          </div>
        </motion.header>

        <main className="space-y-8">
          {/* Main Interface Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="navbar-glass p-8 rounded-[40px] border border-white/5"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* Left: Input Controls */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-primary" />
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Capture Source</h3>
                </div>

                <div className="flex gap-4">
                  {!isRecording ? (
                    <button
                      onClick={startRecording}
                      className="flex-1 h-16 flex items-center justify-center gap-3 bg-primary text-white rounded-2xl font-bold transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-primary/20"
                    >
                      <Mic className="w-5 h-5 fill-white/20" /> Record
                    </button>
                  ) : (
                    <button
                      onClick={stopRecording}
                      className="flex-1 h-16 flex items-center justify-center gap-3 bg-white text-black rounded-2xl font-bold transition-all recording-pulse"
                    >
                      <Square className="w-5 h-5 fill-black" /> Stop
                    </button>
                  )}

                  <button
                    onClick={() => fileInputRef.current.click()}
                    className="w-16 h-16 flex items-center justify-center bg-surface border border-white/10 rounded-2xl text-text-dim hover:text-white transition-all hover:bg-white/5"
                    title="Upload File"
                  >
                    <Upload className="w-6 h-6" />
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="audio/mp3,audio/wav,audio/webm"
                    className="hidden"
                  />
                </div>

                <p className="text-[10px] text-text-dim/60 leading-relaxed">
                  Capture a clean audio snippet or upload a .mp3 / .wav file for deep frequency and semantic analysis.
                </p>
              </div>

              {/* Right: Waveform Preview */}
              <div className="space-y-6 relative">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Music className="w-4 h-4 text-accent" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">Waveform Preview</h3>
                  </div>
                  {audioUrl && (
                    <button onClick={clearAudio} className="text-text-dim hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className={`relative h-24 bg-black/40 border border-white/5 rounded-3xl overflow-hidden flex items-center justify-center ${!audioUrl ? 'border-dashed opacity-50' : ''}`}>
                  {audioUrl ? (
                    <div ref={waveformRef} className="w-full px-6" />
                  ) : (
                    <span className="text-[10px] text-text-dim font-bold uppercase tracking-widest italic opacity-40">Waiting for input...</span>
                  )}

                  {audioUrl && (
                    <button
                      onClick={togglePlay}
                      className="absolute inset-0 m-auto w-10 h-10 flex items-center justify-center bg-white/10 backdrop-blur-md rounded-full border border-white/10 hover:bg-white/20 transition-all z-10"
                    >
                      {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Analysis Action */}
            <div className="mt-10 pt-8 border-t border-white/5">
              <button
                onClick={analyseAudio}
                disabled={!audioBlob || isAnalysing}
                className={`w-full h-16 rounded-2xl font-black uppercase tracking-[0.3em] text-xs transition-all flex items-center justify-center gap-4 shadow-2xl ${isAnalysing
                    ? 'bg-white/5 text-text-dim cursor-wait'
                    : audioBlob
                      ? 'bg-gradient-to-r from-primary to-[#FF5F7E] text-white hover:scale-[1.01] shadow-primary/30 active:scale-[0.99]'
                      : 'bg-white/5 text-text-dim opacity-40 cursor-not-allowed border border-white/5'
                  }`}
              >
                {isAnalysing ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Analyzing Audio Intelligence...</span>
                  </>
                ) : (
                  <>
                    <Zap className={`w-5 h-5 ${audioBlob ? 'fill-white' : ''}`} />
                    <span>Run Full Analysis</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>

          {/* Success Message */}
          <AnimatePresence>
            {saveSuccess && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-500 text-[11px] font-black uppercase tracking-widest flex items-center gap-3"
              >
                <CheckCircle className="w-5 h-5" />
                Version saved successfully! Redirecting...
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="p-5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-[11px] font-bold flex items-center gap-3"
              >
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results Grid & Save Button */}
          <AnimatePresence mode="wait">
            {results && (
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <ResultCard
                    label="Tempo"
                    value={`${results.bpm} BPM`}
                    sub={`Energy: ${Math.round((results.energy || 0) * 100)}%`}
                    Icon={Zap}
                    iconColor="text-primary"
                  />
                  <ResultCard
                    label="Musical Key"
                    value={results.key}
                    sub="Scale Harmony"
                    Icon={Music}
                    iconColor="text-accent"
                  />
                  <ResultCard
                    label="Mood"
                    value={results.mood || "Unknown"}
                    sub="Emotional Tone"
                    Icon={Activity}
                    iconColor="text-yellow-400"
                  />
                  <ResultCard
                    label="Genre"
                    value={results.genre || "Unknown"}
                    sub="Stylistic Profile"
                    Icon={Layers}
                    iconColor="text-emerald-400"
                  />
                  <ResultCard
                    label="Instruments"
                    value={Array.isArray(results.instruments) ? results.instruments.join(', ') : (results.instruments || "Unknown")}
                    sub="Spectral Signature"
                    Icon={Mic}
                    iconColor="text-orange-400"
                  />
                  <ResultCard
                    label="Freq Range"
                    value={results.frequency_range ? `${results.frequency_range.low} - ${results.frequency_range.high} Hz` : "20 - 20k Hz"}
                    sub="Spectral Width"
                    Icon={Zap}
                    iconColor="text-sky-400"
                  />
                </div>

                <button
                  onClick={handleSaveClick}
                  className="w-full h-20 bg-white/5 border border-white/10 hover:bg-white/10 rounded-[32px] font-black uppercase tracking-[0.4em] text-xs text-white transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-4 group"
                >
                  <CheckCircle className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
                  Save to Project Repository
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Project Selection Modal */}
      <AnimatePresence>
        {showProjectModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-xl bg-black/60">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-panel w-full max-w-md p-8 rounded-[40px] border border-white/10 shadow-2xl"
            >
              <h2 className="text-xl font-black mb-6 text-white uppercase tracking-tight flex items-center gap-3">
                <Plus className="w-6 h-6 text-primary" /> Select Repository
              </h2>
              
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {userProjects.length === 0 ? (
                  <div className="py-10 text-center opacity-40">
                    <p className="text-xs font-bold uppercase tracking-widest mb-4">No projects found</p>
                    <button 
                      onClick={() => navigate('/dashboard')}
                      className="text-[10px] font-black text-primary uppercase underline underline-offset-4"
                    >
                      Create one in Dashboard
                    </button>
                  </div>
                ) : (
                  userProjects.map(project => (
                    <button
                      key={project.id}
                      onClick={() => saveToProject(project.id)}
                      disabled={isSaving}
                      className="w-full p-5 bg-white/5 border border-white/5 rounded-3xl hover:bg-primary/10 hover:border-primary/30 transition-all text-left flex items-center justify-between group"
                    >
                      <div>
                        <div className="text-sm font-black text-white group-hover:text-primary transition-colors">{project.title}</div>
                        <div className="text-[9px] font-bold text-text-dim uppercase tracking-widest mt-1">ID: {project.id}</div>
                      </div>
                      <ChevronLeft className="w-4 h-4 rotate-180 opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0" />
                    </button>
                  ))
                )}
              </div>

              <button
                onClick={() => setShowProjectModal(false)}
                className="w-full mt-8 py-4 text-xs font-black text-text-dim uppercase tracking-widest hover:text-white transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ResultCard({ label, value, sub, Icon, iconColor }) {
  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      className="navbar-glass p-7 rounded-[32px] border border-white/5 hover:border-white/10 transition-all group"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center group-hover:bg-white/10 transition-all">
          <Icon className={iconColor} size={18} />
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] font-black uppercase tracking-widest text-text-dim leading-none">{label}</span>
          <span className="text-[8px] font-bold text-text-dim/40 uppercase mt-1">{sub}</span>
        </div>
      </div>
      <div className="text-xl font-black text-white tracking-tight">{value}</div>
    </motion.div>
  );
}

export default AnalysePage;
