import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from fastapi import FastAPI, HTTPException, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from agent.core.agent import process_message
from agent.core.tts import play_tts_audio
import httpx
import os

app = FastAPI(title="Orbit Agent API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str
    model: str
    provider: str = "local"
    api_key: str = ""

class ChatResponse(BaseModel):
    response: str

class DownloadRequest(BaseModel):
    model_name: str

@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        response_text = await process_message(
            request.message, 
            request.model, 
            request.provider, 
            request.api_key
        )
        
        # Play high-quality neural TTS in the background
        play_tts_audio(response_text)
        
        return ChatResponse(response=response_text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/models")
async def list_models():
    """Get list of downloaded models from local Ollama."""
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get("http://localhost:11434/api/tags")
            resp.raise_for_status()
            data = resp.json()
            models_info = []
            for m in data.get("models", []):
                size_gb = m.get("size", 0) / (1024**3)
                models_info.append({"name": m["name"], "size": f"{size_gb:.1f} GB"})
            return {"models": models_info}
    except Exception as e:
        return {"error": "Ollama not running or unavailable.", "details": str(e)}

@app.post("/api/models/download")
async def download_model(req: DownloadRequest):
    """Trigger a model download in Ollama."""
    # Since downloading blocks, we might just return success and let Ollama handle it in background, 
    # but for now we'll do a simple non-streaming request. In a real app this would stream progress.
    try:
        async with httpx.AsyncClient(timeout=300) as client:
            resp = await client.post("http://localhost:11434/api/pull", json={"name": req.model_name, "stream": False})
            resp.raise_for_status()
            return {"status": "Downloaded"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/transcribe")
async def transcribe(file: UploadFile = File(...), api_key: str = Form(None)):
    """Transcribe an audio file using Groq Whisper."""
    if not api_key:
        raise HTTPException(status_code=400, detail="Groq API Key is required for speech recognition.")
    
    try:
        from groq import Groq
        client = Groq(api_key=api_key)
        
        # Save temp file
        temp_file = f"temp_{file.filename}"
        with open(temp_file, "wb") as f:
            f.write(await file.read())
            
        with open(temp_file, "rb") as audio_file:
            transcription = client.audio.transcriptions.create(
                file=(file.filename, audio_file.read()),
                model="whisper-large-v3",
                response_format="text"
            )
            
        os.remove(temp_file)
        return {"text": transcription}
    except Exception as e:
        if os.path.exists(temp_file):
            os.remove(temp_file)
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("agent.api.main:app", host="127.0.0.1", port=8000, reload=True)
