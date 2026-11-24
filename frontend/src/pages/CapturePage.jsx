import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import WaveSurfer from 'wavesurfer.js';
import {
  Mic, Square, Upload, Play, Pause, RotateCcw, Trash2,
  Sparkles, CheckCircle2, AlertCircle, Folder, Lock, LogIn,
  Video, Music, ChevronRight, Activity, Info
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import PageContainer from '../components/shell/PageContainer';
import { API_URL, getAuthToken, getAuthHeaders } from '../lib/api';

export default function CapturePage() {
  const navigate = useNavigate();
  const token = getAuthToken();
  const isAuthenticated = !!token;

  // Media Mode
  const [mediaMode, setMediaMode] = useState('audio'); // 'audio' | 'video'

  // Recording & Audio State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isWaveformReady, setIsWaveformReady] = useState(false);

  // Analysis State
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [analysisError, setAnalysisError] = useState(null);

  // Save Modal State
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [userProjects, setUserProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [newProjectTitle, setNewProjectTitle] = useState('');

  // General Error / Mic permission error
  const [mediaError, setMediaError] = useState(null);

  // Refs
  const waveformRef = useRef(null);
  const wavesurferRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Initialize WaveSurfer
  useEffect(() => {
    if (audioUrl && waveformRef.current) {
      setIsWaveformReady(false);

      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
      }

      try {
        const ws = WaveSurfer.create({
          container: waveformRef.current,
          waveColor: '#D8D2C8',
          progressColor: '#E85D4A',
          cursorColor: '#101827',
          barWidth: 2,
          barGap: 3,
          barRadius: 2,
          height: 84,
          normalize: true,
        });

        ws.load(audioUrl);

        ws.on('ready', () => {
          setIsWaveformReady(true);
          setDuration(ws.getDuration());
        });

        ws.on('audioprocess', () => {
          setCurrentTime(ws.getCurrentTime());
        });

        ws.on('play', () => setIsPlaying(true));
        ws.on('pause', () => setIsPlaying(false));
        ws.on('finish', () => {
          setIsPlaying(false);
          setCurrentTime(0);
        });

        wavesurferRef.current = ws;
      } catch (err) {
        console.error('[WaveSurfer Error]', err);
      }

      return () => {
        if (wavesurferRef.current) {
          wavesurferRef.current.destroy();
          wavesurferRef.current = null;
        }
      };
    }
  }, [audioUrl]);

  // Clean up recording timer on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, []);

  // Format seconds into MM:SS.S
  const formatTime = (secs) => {
    if (isNaN(secs) || secs < 0) return '00:00.0';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${ms}`;
  };

  // Start Recording
  const startRecording = async () => {
    setMediaError(null);
    setAnalysisError(null);
    setAnalysisResults(null);
    setSaveSuccess(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (audioUrl) {
          URL.revokeObjectURL(audioUrl);
        }
        const newUrl = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(newUrl);
        setIsRecording(false);
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
        }
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordingSeconds(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 0.1);
      }, 100);
    } catch (err) {
      console.error('[Recording Error]', err);
      setMediaError('Microphone access was denied or not found. Please allow microphone permissions in your browser.');
      setIsRecording(false);
    }
  };

  // Stop Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
  };

  // Handle File Upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaError(null);
      setAnalysisError(null);
      setAnalysisResults(null);
      setSaveSuccess(false);

      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      const newUrl = URL.createObjectURL(file);
      setAudioBlob(file);
      setAudioUrl(newUrl);
    }
  };

  // Clear / Discard Audio
  const discardAudio = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.destroy();
      wavesurferRef.current = null;
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);
    setCurrentTime(0);
    setIsPlaying(false);
    setAnalysisResults(null);
    setAnalysisError(null);
    setSaveSuccess(false);
  };

  // Playback Controls
  const togglePlayPause = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  };

  const restartPlayback = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.seekTo(0);
      wavesurferRef.current.play();
    }
  };

  // Run Analysis
  const handleRunAnalysis = async () => {
    if (!audioBlob) return;

    setIsAnalysing(true);
    setAnalysisError(null);

    const formData = new FormData();
    formData.append('audio', audioBlob, audioBlob.name || 'take.webm');

    try {
      const res = await axios.post(`${API_URL}/analyze-audio`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setAnalysisResults(res.data);
    } catch (err) {
      console.error('[Analysis Error]', err);
      setAnalysisError('Audio analysis failed. Backend service or Ollama is offline.');
    } finally {
      setIsAnalysing(false);
    }
  };

  // Open Save Modal
  const openSaveModal = async () => {
    setShowSaveModal(true);
    setSaveError(null);
    setSaveSuccess(false);

    if (isAuthenticated) {
      setLoadingProjects(true);
      try {
        const res = await axios.get(`${API_URL}/my-projects`, {
          headers: getAuthHeaders(),
        });
        setUserProjects(res.data);
        if (res.data.length > 0) {
          setSelectedProjectId(String(res.data[0].id));
        }
      } catch (err) {
        console.error('[Projects Fetch Error]', err);
        setSaveError('Could not load your projects. Please try logging in again.');
      } finally {
        setLoadingProjects(false);
      }
    }
  };

  // Commit Version to Project
  const handleSaveVersion = async () => {
    if (!selectedProjectId && !newProjectTitle.trim()) {
      setSaveError('Please select an existing project or enter a new project title.');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      let targetProjectId = selectedProjectId;

      // If user provided a new project title, create it first
      if (newProjectTitle.trim()) {
        const projRes = await axios.post(
          `${API_URL}/projects`,
          { title: newProjectTitle.trim(), is_public: 0 },
          { headers: getAuthHeaders() }
        );
        targetProjectId = String(projRes.data.id);
      }

      // Save version
      await axios.post(
        `${API_URL}/versions`,
        {
          project_id: targetProjectId,
          bpm: analysisResults?.bpm || 120,
          key: analysisResults?.key || 'C Major',
          mood: analysisResults?.mood || 'Unspecified',
          genre: analysisResults?.genre || 'Instrumental',
          instruments: Array.isArray(analysisResults?.instruments)
            ? analysisResults.instruments.join(', ')
            : analysisResults?.instruments || 'Mix',
          freq_min: analysisResults?.frequency_range?.low || 20,
          freq_max: analysisResults?.frequency_range?.high || 20000,
          file_url: audioBlob?.name || 'capture_take.webm',
        },
        { headers: getAuthHeaders() }
      );

      setSaveSuccess(true);
      setTimeout(() => {
        setShowSaveModal(false);
        navigate('/dashboard');
      }, 1400);
    } catch (err) {
      console.error('[Save Version Error]', err);
      setSaveError(err.response?.data?.error || 'Failed to save version to project.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <PageContainer>
      {/* 1. Header (Editorial Studio Typography) */}
      <header className="mb-8 border-b border-border-dim pb-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="font-mono text-xs uppercase tracking-wider text-text-dim font-medium mb-1">
              CAPTURE / SESSION 01
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-text-main tracking-tight leading-tight">
              Make the idea tangible.
            </h1>
            <p className="text-sm text-text-dim mt-2 max-w-xl leading-relaxed">
              Record spontaneous sound directly or drop a track take. Inspect acoustic parameters and commit takes into your song repositories.
            </p>
          </div>

          {/* Honest Guest Mode Indicator */}
          <div className="self-start sm:self-auto flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border-dim bg-white text-xs font-mono">
            <span className={`w-2 h-2 rounded-full ${isAuthenticated ? 'bg-success' : 'bg-warning'}`} />
            <span className="text-text-main font-medium">
              {isAuthenticated ? 'Cloud Workspace' : 'Guest Session (Local)'}
            </span>
          </div>
        </div>
      </header>

      {/* Media Error Alert */}
      {mediaError && (
        <div className="mb-6 p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs flex items-start gap-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{mediaError}</span>
        </div>
      )}

      {/* 2. Capture Controls & Mode Selector */}
      <section className="studio-card p-5 sm:p-6 mb-6" aria-label="Recording Controls">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Mode Selector */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-surface-muted border border-border-dim/70 self-start">
            <button
              onClick={() => setMediaMode('audio')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${mediaMode === 'audio' ? 'bg-white text-text-main shadow-xs' : 'text-text-dim hover:text-text-main'
                }`}
            >
              <Music className="w-3.5 h-3.5" /> Audio Take
            </button>
            <button
              onClick={() => setMediaMode('video')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${mediaMode === 'video' ? 'bg-white text-text-main shadow-xs' : 'text-text-dim hover:text-text-main'
                }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>Video</span>
              <span className="text-[10px] font-mono uppercase text-warning px-1 rounded bg-amber-50 border border-amber-200">Soon</span>
            </button>
          </div>

          {/* Action Trigger Buttons */}
          <div className="flex items-center gap-3">
            {/* Record / Stop Button */}
            {!isRecording ? (
              <button
                onClick={startRecording}
                className="btn-primary px-5 py-2.5 rounded-xl text-sm flex items-center gap-2 cursor-pointer shadow-xs min-h-[44px]"
                aria-label="Start recording audio take"
              >
                <Mic className="w-4 h-4" /> Record Take
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="bg-recording text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 cursor-pointer shadow-md rec-pulse min-h-[44px]"
                aria-label="Stop recording audio take"
              >
                <Square className="w-4 h-4 fill-white" /> Stop ({formatTime(recordingSeconds)})
              </button>
            )}

            {/* Upload Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-secondary px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 cursor-pointer min-h-[44px]"
              aria-label="Upload audio file"
            >
              <Upload className="w-4 h-4 text-text-dim" /> Upload Audio
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="audio/mp3,audio/wav,audio/webm,audio/x-m4a,audio/mpeg"
              className="hidden"
            />
          </div>
        </div>

        {/* Video Mode Notice */}
        {mediaMode === 'video' && (
          <div className="mt-4 p-3 rounded-lg border border-border-dim bg-surface-utility text-xs text-text-dim flex items-center gap-2">
            <Info className="w-4 h-4 text-accent flex-shrink-0" />
            <span>Video performance capture and audio synchronization will be enabled in a future release. Currently recording in audio mode.</span>
          </div>
        )}
      </section>

      {/* 3. Waveform Area (Visual Focal Centerpiece) */}
      <section className="studio-card p-6 sm:p-8 mb-6" aria-label="Audio Waveform Inspection">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-border-dim/60">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            <span className="font-mono text-xs uppercase tracking-wider text-text-main font-semibold">
              Acoustic Waveform
            </span>
          </div>

          {/* Monospace Timers */}
          <div className="font-mono text-xs font-semibold text-text-dim tracking-tight">
            <span>{formatTime(currentTime)}</span>
            <span className="text-text-muted mx-1">/</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Waveform Viewport */}
        <div className="relative min-h-[100px] flex items-center justify-center bg-[#FAF8F5] rounded-xl border border-border-dim/80 p-4 overflow-hidden">
          {audioUrl ? (
            <div className="w-full">
              <div ref={waveformRef} className="w-full" />
              {!isWaveformReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-xs text-text-dim font-mono">
                  Loading waveform peaks...
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center text-text-dim">
              <div className="w-10 h-10 rounded-full border border-border-dim flex items-center justify-center text-text-muted mb-2">
                <Mic className="w-4 h-4" />
              </div>
              <p className="text-xs font-medium">Waiting for sound input.</p>
              <p className="text-[11px] text-text-muted mt-0.5">Click "Record Take" or upload an audio file to inspect the signal.</p>
            </div>
          )}
        </div>

        {/* Waveform Playback Controls */}
        {audioUrl && (
          <div className="mt-4 pt-4 border-t border-border-dim/60 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={togglePlayPause}
                className="btn-primary w-10 h-10 rounded-lg flex items-center justify-center cursor-pointer shadow-xs"
                title={isPlaying ? 'Pause' : 'Play'}
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
              </button>
              <button
                onClick={restartPlayback}
                className="btn-secondary w-10 h-10 rounded-lg flex items-center justify-center text-text-dim hover:text-text-main cursor-pointer"
                title="Restart playback"
                aria-label="Restart playback from beginning"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={discardAudio}
                className="btn-secondary w-10 h-10 rounded-lg flex items-center justify-center text-text-dim hover:text-red-600 hover:border-red-200 cursor-pointer"
                title="Discard take"
                aria-label="Discard current take"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Analysis & Save Triggers */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={handleRunAnalysis}
                disabled={isAnalysing}
                className="btn-secondary px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isAnalysing ? (
                  <>
                    <div className="spinner text-primary" />
                    <span>Analyzing Signal...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    <span>Run Analysis</span>
                  </>
                )}
              </button>

              <button
                onClick={openSaveModal}
                className="btn-primary px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Folder className="w-3.5 h-3.5" />
                <span>Save to Project</span>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 4. Analysis Results (Structured Editorial Layout) */}
      <section className="studio-card p-6 sm:p-8 mb-6" aria-label="Audio Intelligence Attributes">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-border-dim">
          <div>
            <h2 className="text-xl font-bold text-text-main tracking-tight">Audio Attributes</h2>
            <p className="text-xs text-text-dim mt-0.5">Musical metadata inferred from this recording session.</p>
          </div>

          {/* Honest Inference Badge */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>Inferred metadata — Audio DSP verification offline</span>
          </div>
        </div>

        {analysisError && (
          <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs flex items-center gap-2 mb-6">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{analysisError}</span>
          </div>
        )}

        {analysisResults ? (
          <div className="space-y-6">
            {/* Primary Attributes Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-surface-muted border border-border-dim/60">
              <div>
                <span className="text-[10px] font-mono uppercase text-text-muted font-bold block mb-1">Tempo</span>
                <span className="text-2xl font-black font-mono text-text-main">{analysisResults.bpm || 120}</span>
                <span className="text-[10px] font-mono text-text-dim ml-1">BPM</span>
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase text-text-muted font-bold block mb-1">Musical Key</span>
                <span className="text-2xl font-black font-mono text-primary">{analysisResults.key || 'C Major'}</span>
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase text-text-muted font-bold block mb-1">Frequency Band</span>
                <span className="text-sm font-bold font-mono text-text-main mt-1 block">
                  {analysisResults.frequency_range
                    ? `${analysisResults.frequency_range.low} – ${analysisResults.frequency_range.high} Hz`
                    : '20 – 20,000 Hz'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase text-text-muted font-bold block mb-1">Energy Ratio</span>
                <span className="text-sm font-bold font-mono text-accent mt-1 block">
                  {Math.round((analysisResults.energy || 0.6) * 100)}%
                </span>
              </div>
            </div>

            {/* Secondary Attributes List */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl border border-border-dim bg-white">
                <span className="text-[10px] font-mono uppercase text-text-muted block mb-1">Detected Mood</span>
                <span className="text-sm font-bold text-text-main">{analysisResults.mood || 'Unspecified'}</span>
              </div>
              <div className="p-4 rounded-xl border border-border-dim bg-white">
                <span className="text-[10px] font-mono uppercase text-text-muted block mb-1">Genre Profile</span>
                <span className="text-sm font-bold text-text-main">{analysisResults.genre || 'Instrumental'}</span>
              </div>
              <div className="p-4 rounded-xl border border-border-dim bg-white">
                <span className="text-[10px] font-mono uppercase text-text-muted block mb-1">Instrumentation</span>
                <span className="text-sm font-bold text-text-main">
                  {Array.isArray(analysisResults.instruments)
                    ? analysisResults.instruments.join(', ')
                    : analysisResults.instruments || 'Acoustic'}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center border border-dashed border-border-dim rounded-xl text-text-dim text-xs">
            {audioUrl ? 'Click "Run Analysis" above to evaluate musical attributes.' : 'Capture or upload audio to view metadata.'}
          </div>
        )}
      </section>

      {/* 5. Suggested Social Moment (Honest Labeling) */}
      <section className="studio-card p-6 sm:p-8 mb-6" aria-label="Suggested Social Highlight">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-border-dim/60">
          <div>
            <h2 className="text-lg font-bold text-text-main tracking-tight">Suggested social moment</h2>
            <p className="text-xs text-text-dim mt-0.5">Automated highlight section for social reels and teasers.</p>
          </div>
        </div>

        {/* Honest Notice */}
        <div className="p-5 rounded-xl border border-border-dim bg-surface-muted flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-text-dim">
          <div className="flex items-center gap-2.5">
            <Info className="w-4 h-4 text-text-muted flex-shrink-0" />
            <span>Best social moment is not available yet. Real signal peak detection will be introduced in a future audio DSP update.</span>
          </div>
          <span className="font-mono text-[11px] text-text-muted px-2 py-0.5 rounded bg-white border border-border-dim self-start sm:self-auto">
            Algorithm v0.1
          </span>
        </div>
      </section>

      {/* 6. Save To Project Dialog Modal */}
      {showSaveModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-label="Save Take to Project"
        >
          <div className="bg-white border border-border-dim rounded-2xl w-full max-w-md p-6 sm:p-8 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-border-dim mb-6">
              <h3 className="text-lg font-bold text-text-main">Save Take to Project</h3>
              <button
                onClick={() => setShowSaveModal(false)}
                className="w-7 h-7 rounded-md border border-border-dim text-text-dim hover:text-text-main flex items-center justify-center text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {saveSuccess && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Take saved successfully! Opening dashboard...
              </div>
            )}

            {saveError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> {saveError}
              </div>
            )}

            {!isAuthenticated ? (
              /* Guest Conversion State */
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-surface-utility border border-border-dim text-xs text-text-dim leading-relaxed">
                  <span className="font-bold text-text-main block mb-1">Account required for cloud persistence</span>
                  You are currently in guest mode. To save takes permanently across sessions, sign in or register your artist account.
                </div>
                <div className="flex flex-col gap-2 pt-2">
                  <Link
                    to="/login"
                    className="btn-primary w-full py-3 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <LogIn className="w-4 h-4" /> Sign In to Save
                  </Link>
                  <Link
                    to="/signup"
                    className="btn-secondary w-full py-2.5 rounded-xl text-xs text-center font-semibold"
                  >
                    Create Free Account
                  </Link>
                </div>
              </div>
            ) : (
              /* Authenticated User Save Flow */
              <div className="space-y-4">
                {loadingProjects ? (
                  <div className="py-6 text-center text-xs text-text-dim font-mono">Loading projects...</div>
                ) : userProjects.length > 0 ? (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-dim">Select Existing Project</label>
                    <select
                      value={selectedProjectId}
                      onChange={(e) => {
                        setSelectedProjectId(e.target.value);
                        setNewProjectTitle('');
                      }}
                      className="w-full p-2.5 rounded-xl border border-border-dim bg-white text-xs text-text-main focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                      {userProjects.map((proj) => (
                        <option key={proj.id} value={proj.id}>
                          {proj.title} (ID #{proj.id})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <p className="text-xs text-text-dim">No existing projects found. Create one below:</p>
                )}

                <div className="space-y-1.5 pt-2">
                  <label className="text-xs font-semibold text-text-dim">Or Create New Project</label>
                  <input
                    type="text"
                    placeholder="e.g. Acoustic Sessions Vol 1"
                    value={newProjectTitle}
                    onChange={(e) => {
                      setNewProjectTitle(e.target.value);
                      if (e.target.value) setSelectedProjectId('');
                    }}
                    className="w-full p-2.5 rounded-xl border border-border-dim bg-white text-xs text-text-main placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <button
                  onClick={handleSaveVersion}
                  disabled={isSaving || saveSuccess}
                  className="btn-primary w-full py-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-xs mt-4 disabled:opacity-50"
                >
                  {isSaving ? 'Saving Version...' : 'Commit Take to Project'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </PageContainer>
  );
}
