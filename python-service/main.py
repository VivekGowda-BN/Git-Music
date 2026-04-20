from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import json
import os
import librosa
import numpy as np
import io
import tempfile

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalyzeRequest(BaseModel):
    filepath: str

# Local Ollama endpoint
OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "mistral"

@app.post("/analyze-audio")
async def analyze_audio_file(file: UploadFile = File(...)):
    try:
        # Save to temporary file
        suffix = os.path.splitext(file.filename)[1] or ".webm"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(await file.read())
            tmp_path = tmp.name

        # Load audio (mono, 22050Hz)
        y, sr = librosa.load(tmp_path, sr=22050)
        os.unlink(tmp_path) 

        # --- 1. BPM (TEMPO) ---
        tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
        bpm = float(tempo[0]) if isinstance(tempo, (np.ndarray, list)) else float(tempo)
        if bpm > 0:
            while bpm < 60: bpm *= 2
            while bpm > 200: bpm /= 2
        bpm = int(round(bpm))

        # --- 2. CORE DSP FEATURE EXTRACTION ---
        # RMS Energy (Normalized)
        rms = librosa.feature.rms(y=y)
        energy = float(np.mean(rms))
        
        # Spectral Centroid (Brightness)
        centroid = librosa.feature.spectral_centroid(y=y, sr=sr)
        brightness = float(np.mean(centroid))
        
        # Spectral Bandwidth (Breadth)
        bandwidth = librosa.feature.spectral_bandwidth(y=y, sr=sr)
        mean_bandwidth = float(np.mean(bandwidth))
        
        # Zero Crossing Rate (Percussiveness)
        zcr = librosa.feature.zero_crossing_rate(y)
        mean_zcr = float(np.mean(zcr))
        
        # Spectral Contrast (Complexity)
        contrast = librosa.feature.spectral_contrast(y=y, sr=sr)
        mean_contrast = float(np.mean(contrast))

        # --- 3. KEY DETECTION (Template Matching) ---
        chroma = librosa.feature.chroma_stft(y=y, sr=sr)
        mean_chroma = np.mean(chroma, axis=1)
        keys = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
        major_prof = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88]
        minor_prof = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17]
        
        def get_best_key(chroma_data, profile):
            corrs = [np.corrcoef(chroma_data, np.roll(profile, i))[0, 1] for i in range(12)]
            return np.argmax(corrs), np.max(corrs)
        
        m_idx, m_val = get_best_key(mean_chroma, major_prof)
        n_idx, n_val = get_best_key(mean_chroma, minor_prof)
        
        if m_val >= n_val:
            detected_key = f"{keys[m_idx]} Major"
            is_major = True
        else:
            detected_key = f"{keys[n_idx]} Minor"
            is_major = False

        # --- 4. FREQUENCY RANGE (-50dB Threshold) ---
        S = np.abs(librosa.stft(y))
        S_db = librosa.amplitude_to_db(S, ref=np.max)
        avg_db = np.mean(S_db, axis=1)
        freq_bins = librosa.fft_frequencies(sr=sr)
        
        # Using a more sensitive -50dB threshold
        active_bins = np.where(avg_db > -50)[0]
        if len(active_bins) > 10: # Ensure we have enough signal
            lowest_f = max(20, int(freq_bins[active_bins[0]]))
            highest_f = min(16000, int(freq_bins[active_bins[-1]]))
        else:
            # Fallback based on brightness if thresholding fails
            lowest_f = max(20, int(brightness * 0.1))
            highest_f = min(16000, int(brightness * 2.5))

        # --- 5. MOOD DETECTION (Strict Heuristics - NO UNKNOWN) ---
        if energy > 0.15 and bpm > 110: mood = "Energetic"
        elif energy < 0.08 and bpm < 100: mood = "Calm"
        elif not is_major: mood = "Melancholic"
        elif is_major and energy > 0.1: mood = "Uplifting"
        else: mood = "Chill"

        # --- 6. INSTRUMENT DETECTION (Strict Heuristics - NO UNKNOWN) ---
        h_instruments = []
        if mean_zcr > 0.08 or energy > 0.15: h_instruments.append("Drums")
        if 800 < brightness < 3500:
            if mean_contrast > 22: h_instruments.append("Piano")
            else: h_instruments.append("Synth")
        if mean_contrast < 15 and 300 < brightness < 2000:
            h_instruments.append("Vocals")
        if 1500 < brightness < 4500 and mean_contrast > 18:
            if "Piano" not in h_instruments: h_instruments.append("Guitar")
            
        if not h_instruments: h_instruments = ["Synth"]
        instruments = list(set(h_instruments))[:3]

        # --- 7. GENRE ASSIST (Heuristic First) ---
        if bpm > 125 and energy > 0.12: genre = "EDM"
        elif bpm < 90 and energy < 0.08: genre = "Ambient"
        elif "Vocals" in instruments: genre = "Pop"
        elif "Drums" in instruments and brightness > 2000: genre = "Rock"
        else: genre = "Electronic"

        # --- 8. AI REFINEMENT (Strict Filter) ---
        try:
            feat_sum = {"bpm": bpm, "key": detected_key, "energy": round(energy, 2), "brightness": int(brightness)}
            prompt = f"Audio features: {json.dumps(feat_sum)}. Return JSON with keys 'mood', 'genre', 'instruments' (array). Do not use 'Unknown'."
            res = requests.post(OLLAMA_URL, json={"model": MODEL, "prompt": prompt, "stream": False, "format": "json"}, timeout=8)
            if res.status_code == 200:
                tags = json.loads(res.json().get("response", "{}"))
                
                # Only overwrite if AI returns a non-generic result
                ai_mood = tags.get("mood", "").capitalize()
                if ai_mood and ai_mood != "Unknown": mood = ai_mood
                
                ai_genre = tags.get("genre", "").capitalize()
                if ai_genre and ai_genre != "Unknown": genre = ai_genre
                
                ai_inst = [i.capitalize() for i in tags.get("instruments", []) if i.capitalize() != "Unknown"]
                if ai_inst: instruments = list(set(instruments + ai_inst))[:3]
        except: pass

        return {
            "bpm": bpm,
            "key": detected_key,
            "mood": mood,
            "genre": genre,
            "instruments": instruments,
            "energy": round(energy, 3),
            "frequency_range": {
                "low": lowest_f,
                "high": highest_f
            }
        }
    except Exception as e:
        print(f"Server Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
