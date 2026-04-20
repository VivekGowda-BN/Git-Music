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
MODEL = "llama3"

@app.post("/analyze-audio")
async def analyze_audio_file(file: UploadFile = File(...)):
    try:
        # Save to temporary file for librosa to load
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp:
            tmp.write(await file.read())
            tmp_path = tmp.name

        # Load audio
        y, sr = librosa.load(tmp_path)
        os.unlink(tmp_path) # Clean up

        # 1. BPM (Tempo)
        tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
        bpm = float(tempo[0]) if isinstance(tempo, (np.ndarray, list)) else float(tempo)

        # 2. KEY DETECTION
        chroma = librosa.feature.chroma_stft(y=y, sr=sr)
        key_index = chroma.mean(axis=1).argmax()
        keys = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
        detected_key = keys[key_index]

        # 3. GENRE (APPROXIMATE)
        genre = "Unknown"
        if bpm < 90: genre = "Lofi"
        elif 90 <= bpm <= 130: genre = "Pop"
        elif bpm > 130: genre = "EDM"

        # 4. INSTRUMENT (APPROXIMATE)
        spectral_centroid = librosa.feature.spectral_centroid(y=y, sr=sr)
        mean_centroid = np.mean(spectral_centroid)
        instrument = "Guitar/Synth" if mean_centroid > 2000 else "Bass/Drums"

        # 5. FREQUENCY ANALYSIS
        fft = np.abs(np.fft.fft(y))
        freqs = np.fft.fftfreq(len(fft), 1/sr)
        
        # Filter for positive frequencies
        pos_indices = np.where(freqs > 0)
        fft_pos = fft[pos_indices]
        freqs_pos = freqs[pos_indices]
        
        # Highest peak frequency
        highest_freq_val = float(freqs_pos[np.argmax(fft_pos)])
        
        # Lowest peak frequency (simple approach)
        lowest_freq_val = float(freqs_pos[np.where(fft_pos > np.max(fft_pos) * 0.1)[0][0]])

        return {
            "bpm": round(bpm, 2),
            "key": f"{detected_key} Major",
            "genre": genre,
            "instrument": instrument,
            "highest_frequency": {
                "value": round(highest_freq_val, 2),
                "time": 0.0 # Librosa FFT doesn't easily give time for a single peak without STFT
            },
            "lowest_frequency": {
                "value": round(lowest_freq_val, 2),
                "time": 0.0
            }
        }
    except Exception as e:
        print(f"Error analyzing audio: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze")
async def analyze_audio_tags(request: AnalyzeRequest):
    if not os.path.exists(request.filepath):
        raise HTTPException(status_code=404, detail="Audio file not found")
    
    prompt = """
    Analyze this musical idea. I have just recorded a new audio snippet.
    Generate fitting tags for this idea. 
    Return strictly JSON only, with the following keys:
    - "mood": string (e.g. happy, sad, intense, chill)
    - "type": string (e.g. melody, beat, vocal, bassline)
    - "energy": string (e.g. low, medium, high)
    
    Do not return any markdown formatting, just the raw JSON string.
    Example:
    {"mood": "chill", "type": "beat", "energy": "medium"}
    """

    payload = {
        "model": MODEL,
        "prompt": prompt,
        "stream": False,
        "format": "json"
    }

    try:
        response = requests.post(OLLAMA_URL, json=payload, timeout=30)
        response.raise_for_status()
        
        data = response.json()
        response_text = data.get("response", "{}")
        
        try:
            tags = json.loads(response_text)
            return tags
        except json.JSONDecodeError:
            return {"mood": "unknown", "type": "idea", "energy": "unknown"}
            
    except requests.exceptions.RequestException as e:
        print(f"Error calling Ollama: {e}")
        return {"mood": "unknown", "type": "idea", "energy": "unknown", "error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
