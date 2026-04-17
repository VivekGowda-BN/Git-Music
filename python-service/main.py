from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import json
import os

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

@app.post("/analyze")
async def analyze_audio(request: AnalyzeRequest):
    if not os.path.exists(request.filepath):
        raise HTTPException(status_code=404, detail="Audio file not found")
    
    # We could process the audio here using librosa or pydub, but for now
    # we'll use a generic prompt indicating we received an audio file
    # and want to extract mood, type, and energy. If we had transcription,
    # we'd pass it here.
    
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
        # Return fallback tags if Ollama is not running
        return {"mood": "unknown", "type": "idea", "energy": "unknown", "error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
