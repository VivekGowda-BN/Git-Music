import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import WaveSurfer from 'wavesurfer.js';
import { Mic, Square, Loader, CheckCircle, Play, Pause, Trash2, Upload } from 'lucide-react';

const API_URL = 'http://localhost:3000';

function Recorder({ parentId, onSaved }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const waveformRef = useRef(null);
  const wavesurferRef = useRef(null);
  const fileInputRef = useRef(null);

  // Initialize WaveSurfer
  useEffect(() => {
    if (audioUrl && waveformRef.current) {
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
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        setIsRecording(false);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setAudioUrl(null); 
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

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['audio/mpeg', 'audio/wav', 'audio/webm', 'audio/x-m4a', 'audio/mp3'];
      if (!validTypes.includes(file.type) && !file.name.endsWith('.mp3')) {
        alert('Invalid file type. Please upload MP3 or WAV.');
        return;
      }
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      if (!name) setName(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleSave = async () => {
    if (!audioUrl) return;
    
    setIsSaving(true);
    
    try {
      const response = await fetch(audioUrl);
      const audioBlob = await response.blob();
      
      const formData = new FormData();
      // Use recording.webm as default if it's from mic, otherwise use original if we had it (but blob is safer)
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('name', name || 'Untitled Recording');
      formData.append('message', message);
      formData.append('description', message); // Keep for legacy compatibility
      
      if (parentId) {
        formData.append('parent_id', parentId);
      }

      const endpoint = parentId ? '/branch' : '/record';

      const res = await axios.post(`${API_URL}${endpoint}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setName('');
      setMessage('');
      setAudioUrl(null);
      onSaved(res.data);
    } catch (error) {
      console.error('[Recorder] Failed to save recording:', error);
      alert('Failed to save recording. Is the backend running?');
    } finally {
      setIsSaving(true); // Wait, should be false. Fix in next edit or now.
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
    setName('');
    setMessage('');
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-4">
        <input 
          type="text"
          placeholder="Enter recording name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-[#0D0D0D] border border-border-dim rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-white transition-all"
        />
        <textarea
          placeholder="Add notes about this idea..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full bg-[#0D0D0D] border border-border-dim rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-white resize-none h-24 transition-all"
        />
      </div>
      
      {audioUrl && (
        <div className="bg-[#0D0D0D] border border-border-dim rounded-2xl p-4 animate-in fade-in zoom-in-95 duration-300 relative overflow-hidden box-border w-full">
          <div ref={waveformRef} className="w-full mb-4" />
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="bg-white/5 text-white hover:bg-white/10 p-4 rounded-xl transition-all flex items-center justify-center border border-white/10"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-white" />}
            </button>
            
            <div className="flex gap-3 flex-grow">
              <button
                onClick={discardRecording}
                className="p-4 bg-white/5 text-text-dim hover:bg-red-500/10 hover:text-red-500 border border-white/10 hover:border-red-500/30 rounded-xl transition-all flex items-center justify-center"
                title="Discard"
              >
                <Trash2 className="w-5 h-5" />
              </button>
              
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={`flex-grow h-[48px] rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg overflow-hidden box-border ${
                  isSaving 
                    ? 'bg-gradient-to-r from-[#ff2e63] to-[#ff5f7e] opacity-80 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-[#FF2E63] to-[#FF5F7E] hover:scale-[1.01] active:scale-[0.99] shadow-[0_8px_20px_-6px_rgba(255,46,99,0.5)]'
                } text-white`}
              >
                {isSaving ? (
                  <div className="flex items-center justify-center gap-2 text-sm font-medium whitespace-nowrap overflow-hidden">
                    <div className="spinner flex-shrink-0" />
                    <span className="truncate">Processing...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-sm font-black uppercase tracking-widest">
                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                    <span>Save</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {!audioUrl && (
        <div className="grid grid-cols-4 gap-3">
          <div className="col-span-3">
            {!isRecording ? (
              <button
                onClick={startRecording}
                className="w-full flex items-center justify-center gap-3 bg-primary text-white py-4 rounded-2xl font-black text-base transition-all hover:scale-[1.02] active:scale-[0.98] glow-primary"
              >
                <Mic className="w-5 h-5" /> START RECORDING
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="w-full flex items-center justify-center gap-3 bg-white text-black py-4 rounded-2xl font-black text-base transition-all recording-pulse"
              >
                <Square className="w-5 h-5 fill-black" /> STOP
              </button>
            )}
          </div>
          <div className="col-span-1">
            <button
              onClick={() => fileInputRef.current.click()}
              className="w-full h-full flex items-center justify-center bg-[#1A1A1A] border border-border-dim text-text-dim hover:text-white hover:border-text-dim/50 rounded-2xl transition-all"
              title="Upload Audio"
            >
              <Upload className="w-5 h-5" />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept="audio/*" 
              className="hidden" 
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default Recorder;
