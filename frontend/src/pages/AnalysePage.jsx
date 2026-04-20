import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, Upload, Play, BarChart2, Activity, Music, Zap, Clock, Info, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:3000';

const AnalysePage = () => {
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);

  // Setup Visualizer
  const setupVisualizer = (stream) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);
    
    source.connect(analyser);
    analyser.fftSize = 256;
    
    audioContextRef.current = audioContext;
    analyserRef.current = analyser;
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);
      
      ctx.fillStyle = '#0D0D0D';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;
      
      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2;
        
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, '#FF2E63');
        gradient.addColorStop(1, '#00D1FF');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        
        x += barWidth + 1;
      }
    };
    
    draw();
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setupVisualizer(stream);
      
      const mediaRecorder = new MediaRecorder(stream);
      const chunks = [];
      
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setResults(null);
    } catch (err) {
      console.error('Recording error:', err);
      alert('Could not access microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      streamRef.current.getTracks().forEach(track => track.stop());
      cancelAnimationFrame(animationFrameRef.current);
      setIsRecording(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAudioBlob(file);
      setAudioUrl(URL.createObjectURL(file));
      setResults(null);
    }
  };

  const handleAnalyse = async () => {
    if (!audioBlob) return;
    
    setLoading(true);
    const formData = new FormData();
    formData.append('audio', audioBlob, 'analyse_audio.wav');
    
    try {
      const res = await axios.post(`${API_URL}/analyze-audio`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResults(res.data);
    } catch (err) {
      console.error('Analysis error:', err);
      alert('Failed to analyze audio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-white p-4 md:p-8 max-w-5xl mx-auto">
      <header className="flex items-center gap-4 mb-12">
        <button 
          onClick={() => navigate('/')}
          className="p-3 bg-surface border border-border-dim rounded-full hover:bg-primary transition-all hover:scale-110"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-black tracking-tight">Audio <span className="text-primary">Analysis</span></h1>
          <p className="text-text-dim text-xs uppercase tracking-widest font-bold opacity-60">Deep Signal Intelligence</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <section className="space-y-6">
          <div className="glass-panel p-8 rounded-3xl border border-white/5 space-y-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/20 rounded-xl text-primary">
                <Mic className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold">Capture Signal</h2>
            </div>

            <div className="flex gap-4">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  className="flex-1 bg-primary text-white py-4 rounded-2xl font-black flex items-center justify-center gap-3 glow-primary hover:scale-105 transition-all"
                >
                  <Mic className="w-5 h-5" /> RECORD
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="flex-1 bg-white text-black py-4 rounded-2xl font-black flex items-center justify-center gap-3 animate-pulse"
                >
                  <Square className="w-5 h-5 fill-black" /> STOP
                </button>
              )}
              
              <label className="flex-1 bg-surface border border-border-dim text-text-dim hover:text-white hover:border-text-dim rounded-2xl flex items-center justify-center gap-3 cursor-pointer transition-all">
                <Upload className="w-5 h-5" /> UPLOAD
                <input type="file" className="hidden" onChange={handleFileUpload} accept="audio/*" />
              </label>
            </div>

            <div className="h-40 bg-[#080808] rounded-2xl border border-white/5 overflow-hidden relative">
              <canvas ref={canvasRef} width="600" height="160" className="w-full h-full" />
              {!isRecording && !audioUrl && (
                <div className="absolute inset-0 flex items-center justify-center text-text-dim text-sm opacity-30">
                  <Activity className="w-6 h-6 mr-2" /> Waiting for signal...
                </div>
              )}
            </div>

            <button
              onClick={handleAnalyse}
              disabled={!audioBlob || loading}
              className="w-full py-5 rounded-2xl font-black tracking-widest bg-gradient-to-r from-primary to-accent text-white shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale"
            >
              {loading ? 'PROCESSING SIGNAL...' : 'RUN DEEP ANALYSIS'}
            </button>
          </div>
        </section>

        {/* Results Section */}
        <section className="space-y-6">
          <AnimatePresence mode="wait">
            {results ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-2 gap-4"
              >
                <ResultCard icon={<Zap />} label="Tempo" value={`${results.bpm} BPM`} delay={0.1} />
                <ResultCard icon={<Music />} label="Key" value={results.key} delay={0.2} />
                <ResultCard icon={<BarChart2 />} label="Genre" value={results.genre} delay={0.3} />
                <ResultCard icon={<Activity />} label="Instrument" value={results.instrument} delay={0.4} />
                <div className="col-span-2">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className="glass-panel p-6 rounded-3xl border border-white/5 bg-surface/30"
                  >
                    <div className="flex items-center gap-3 mb-4 text-text-dim text-xs font-bold uppercase tracking-widest">
                      <Activity className="w-4 h-4" /> Frequency Peaks
                    </div>
                    <div className="grid grid-cols-2 gap-8">
                      <div>
                        <p className="text-[10px] text-text-dim uppercase mb-1">Highest</p>
                        <p className="text-2xl font-black text-accent">{results.highest_frequency.value} <span className="text-xs">Hz</span></p>
                        <p className="text-[10px] opacity-50">at {results.highest_frequency.time}s</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-text-dim uppercase mb-1">Lowest</p>
                        <p className="text-2xl font-black text-primary">{results.lowest_frequency.value} <span className="text-xs">Hz</span></p>
                        <p className="text-[10px] opacity-50">at {results.lowest_frequency.time}s</p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-surface/20 rounded-3xl border border-dashed border-white/10 opacity-40">
                <Info className="w-12 h-12 mb-4" />
                <p className="font-bold text-lg">No Data Analyzed</p>
                <p className="text-sm">Record or upload audio to see technical insights</p>
              </div>
            )}
          </AnimatePresence>
        </section>
      </div>
    </div>
  );
};

const ResultCard = ({ icon, label, value, delay }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay }}
    className="glass-panel p-6 rounded-3xl border border-white/5 bg-surface/50 hover:bg-surface/80 transition-all group"
  >
    <div className="flex items-center gap-3 mb-3">
      <div className="text-primary group-hover:scale-110 transition-transform">{icon}</div>
      <p className="text-[10px] text-text-dim uppercase font-bold tracking-widest">{label}</p>
    </div>
    <p className="text-2xl font-black text-white">{value}</p>
  </motion.div>
);

export default AnalysePage;
