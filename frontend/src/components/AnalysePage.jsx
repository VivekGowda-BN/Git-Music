import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Mic, Square, Upload, Play, Pause, Loader, ChevronLeft, CheckCircle, Music, Activity, Layers } from 'lucide-react';
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
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const fileInputRef = useRef(null);

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
    } catch (err) {
      console.error('Recording error:', err);
      setError('Microphone access denied');
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
    }
  };

  const analyseAudio = async () => {
    if (!audioBlob) {
      setError('Please record or upload audio first');
      return;
    }

    setIsAnalysing(true);
    setError(null);

    const formData = new FormData();
    formData.append('audio', audioBlob, audioBlob.name || 'recording.webm');

    try {
      const res = await axios.post(`${API_URL}/analyze-audio`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResults(res.data);
    } catch (err) {
      console.error('Analysis error:', err);
      setError('Failed to analyze audio. Ensure backend services are running.');
    } finally {
      setIsAnalysing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-text-main p-4 sm:p-6 md:p-8 max-w-4xl mx-auto font-sans">
      <header className="flex items-center gap-4 mb-12">
        <button 
          onClick={() => navigate('/')}
          className="p-3 bg-surface border border-border-dim rounded-2xl hover:bg-primary/10 transition-all text-text-dim hover:text-primary"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-3xl font-black text-white">Audio Analysis</h1>
          <p className="text-text-dim text-sm uppercase tracking-widest">Identify BPM, Key, and Genre</p>
        </div>
      </header>

      <main className="space-y-8">
        <div className="glass-panel p-8 rounded-3xl space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Capture Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                <Activity className="w-4 h-4" /> Capture Audio
              </h3>
              <div className="flex gap-4">
                {!isRecording ? (
                  <button 
                    onClick={startRecording}
                    className="flex-1 flex items-center justify-center gap-3 bg-primary text-white py-4 rounded-2xl font-bold transition-all hover:scale-[1.02] shadow-lg shadow-primary/20"
                  >
                    <Mic className="w-5 h-5" /> Record
                  </button>
                ) : (
                  <button 
                    onClick={stopRecording}
                    className="flex-1 flex items-center justify-center gap-3 bg-white text-black py-4 rounded-2xl font-bold transition-all recording-pulse"
                  >
                    <Square className="w-5 h-5 fill-black" /> Stop
                  </button>
                )}
                <button 
                  onClick={() => fileInputRef.current.click()}
                  className="p-4 bg-surface border border-border-dim rounded-2xl text-text-dim hover:text-white transition-all"
                  title="Upload"
                >
                  <Upload className="w-6 h-6" />
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="audio/*" className="hidden" />
              </div>
            </div>

            {/* Playback Preview */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-accent flex items-center gap-2">
                <Music className="w-4 h-4" /> Preview
              </h3>
              {audioUrl ? (
                <div className="bg-[#0D0D0D] border border-border-dim p-4 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center text-accent">
                      <Music className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-medium text-white">Ready for analysis</span>
                  </div>
                  <audio src={audioUrl} controls className="h-8 max-w-[150px]" />
                </div>
              ) : (
                <div className="bg-[#0D0D0D]/50 border border-dashed border-border-dim p-4 rounded-2xl text-center text-text-dim text-sm italic">
                  No audio captured yet
                </div>
              )}
            </div>
          </div>

          {/* Analyse Button */}
          <button
            onClick={analyseAudio}
            disabled={!audioBlob || isAnalysing}
            className={`w-full h-14 rounded-2xl font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl ${
              isAnalysing 
                ? 'bg-surface text-text-dim cursor-not-allowed' 
                : audioBlob 
                  ? 'bg-gradient-to-r from-[#FF2E63] to-[#FF5F7E] text-white hover:scale-[1.01] shadow-primary/30' 
                  : 'bg-surface text-text-dim opacity-50 cursor-not-allowed'
            }`}
          >
            {isAnalysing ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>Analysing Frequency...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                <span>Run Analysis</span>
              </>
            )}
          </button>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-sm flex items-center gap-3">
              <Activity className="w-5 h-5" />
              {error}
            </div>
          )}
        </div>

        {/* Results Section */}
        {results && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ResultCard label="Tempo" value={`${results.bpm} BPM`} icon={<Activity className="text-primary" />} />
            <ResultCard label="Musical Key" value={results.key} icon={<Music className="text-accent" />} />
            <ResultCard label="Genre" value={results.genre} icon={<Layers className="text-emerald-400" />} />
            <ResultCard label="Instrument" value={results.instrument} icon={<Mic className="text-orange-400" />} />
            <ResultCard label="High Freq" value={`${results.highest_frequency.value} Hz`} icon={<Activity className="text-sky-400" />} />
            <ResultCard label="Low Freq" value={`${results.lowest_frequency.value} Hz`} icon={<Activity className="text-indigo-400" />} />
          </div>
        )}
      </main>
    </div>
  );
}

function ResultCard({ label, value, icon }) {
  return (
    <div className="glass-panel p-6 rounded-3xl border border-white/5 hover:border-white/10 transition-all group">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-white/5 rounded-xl group-hover:bg-white/10 transition-all">
          {icon}
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-text-dim">{label}</span>
      </div>
      <div className="text-2xl font-black text-white">{value}</div>
    </div>
  );
}

export default AnalysePage;
