import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import WaveSurfer from 'wavesurfer.js';
import { Mic, Square, Loader, CheckCircle, Play, Pause, Trash2 } from 'lucide-react';

const API_URL = 'http://localhost:3000';

function Recorder({ parentId, onSaved }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [description, setDescription] = useState('');
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const waveformRef = useRef(null);
  const wavesurferRef = useRef(null);

  // Initialize WaveSurfer
  useEffect(() => {
    if (audioUrl && waveformRef.current) {
      console.log('[Recorder] Initializing WaveSurfer for:', audioUrl);
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
      }

      wavesurferRef.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: '#4A4A4A',
        progressColor: '#FF2E63',
        cursorColor: '#00D1FF',
        barWidth: 2,
        barRadius: 3,
        responsive: true,
        height: 60,
        normalize: true,
      });

      wavesurferRef.current.load(audioUrl);

      wavesurferRef.current.on('play', () => setIsPlaying(true));
      wavesurferRef.current.on('pause', () => setIsPlaying(false));
      wavesurferRef.current.on('finish', () => setIsPlaying(false));

      return () => {
        if (wavesurferRef.current) {
          wavesurferRef.current.destroy();
        }
      };
    }
  }, [audioUrl]);

  const startRecording = async () => {
    console.log('[Recorder] Starting recording...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        console.log('[Recorder] Recording stopped, processing chunks...');
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        setIsRecording(false);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setAudioUrl(null); // Clear previous
    } catch (err) {
      console.error('[Recorder] Error accessing microphone:', err);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleSave = async () => {
    if (!audioUrl) return;
    
    console.log('[Recorder] Saving recording to backend...');
    setIsSaving(true);
    
    try {
      const response = await fetch(audioUrl);
      const audioBlob = await response.blob();
      
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('description', description);
      
      if (parentId) {
        formData.append('parent_id', parentId);
      }

      const endpoint = parentId ? '/branch' : '/record';

      console.log(`[Recorder] Sending POST to ${API_URL}${endpoint}`);
      const res = await axios.post(`${API_URL}${endpoint}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      console.log('[Recorder] Save successful:', res.data);
      setDescription('');
      setAudioUrl(null);
      onSaved();
    } catch (error) {
      console.error('[Recorder] Failed to save recording:', error);
      alert('Failed to save recording. Is the backend running?');
    } finally {
      setIsSaving(false);
    }
  };

  const togglePlay = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  };

  const discardRecording = () => {
    setAudioUrl(null);
    setDescription('');
  };

  return (
    <div className="flex flex-col gap-6">
      <textarea
        placeholder="What's this idea about? (e.g. Gritty bassline, Vocal melody...)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full bg-[#0D0D0D] border border-border-dim rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-white resize-none h-32 transition-all"
      />
      
      {audioUrl && (
        <div className="bg-[#0D0D0D] border border-border-dim rounded-2xl p-4 animate-in fade-in zoom-in-95 duration-300">
          <div ref={waveformRef} className="w-full mb-4" />
          <div className="flex items-center justify-between">
            <button
              onClick={togglePlay}
              className="bg-accent/10 text-accent hover:bg-accent hover:text-white p-3 rounded-xl transition-all"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
            <div className="flex gap-2">
              <button
                onClick={discardRecording}
                className="bg-border-dim/50 text-text-dim hover:bg-red-500/20 hover:text-red-500 p-3 rounded-xl transition-all"
              >
                <Trash2 className="w-5 h-5" />
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-primary text-white py-3 px-8 rounded-xl font-bold hover:bg-primary/90 transition-all flex items-center gap-2 disabled:opacity-50 glow-primary"
              >
                {isSaving ? <Loader className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                {isSaving ? 'Processing...' : 'Save & Analyze'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-center">
        {!audioUrl && !isRecording && (
          <button
            onClick={startRecording}
            className="w-full flex items-center justify-center gap-3 bg-primary text-white py-5 px-6 rounded-2xl font-black text-lg transition-all hover:scale-[1.02] active:scale-[0.98] glow-primary"
          >
            <Mic className="w-6 h-6" /> START RECORDING
          </button>
        )}

        {isRecording && (
          <button
            onClick={stopRecording}
            className="w-full flex items-center justify-center gap-3 bg-white text-black py-5 px-6 rounded-2xl font-black text-lg transition-all recording-pulse"
          >
            <Square className="w-6 h-6 fill-black" /> STOP RECORDING
          </button>
        )}
      </div>
    </div>
  );
}

export default Recorder;
