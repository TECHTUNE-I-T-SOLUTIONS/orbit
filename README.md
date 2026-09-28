# Orbit AI Companion

Orbit is a powerful, sci-fi themed, fully-local and cloud-capable desktop AI companion. Built with an Electron + React (Vite) frontend and a Python (FastAPI + LangChain/Tooling) backend, Orbit seamlessly interacts with your operating system, opens apps, controls your desktop, and speaks back to you with high-quality neural voices.

## Features
- **Local & Cloud AI**: Supports local Ollama models and cloud providers like OpenAI, Groq, xAI (Grok), and Gemini.
- **Desktop Control**: Can physically interact with your computer (press hotkeys, type text, open apps, kill processes) using PyAutoGUI and PowerShell.
- **Neural Voice Synthesis**: Integrates `edge-tts` to provide ultra-realistic cinematic AI voices locally.
- **Sci-Fi Aesthetic**: Stunning matrix and holographic UI with native interactive sound effects and a background ambient processing scanner.
- **Speech Recognition**: Voice dictation directly from your microphone using the Web Speech API.

## Project Structure
- `/apps/desktop` - Electron + React Vite frontend app
- `/agent` - Python FastAPI backend and AI tool registry

## Getting Started
1. Start the Python Agent: Activate the virtual environment in `/venv` and run `uvicorn agent.api.main:app`.
2. Start the Frontend: Run `npm install` and `npm run dev` in `/apps/desktop`.
3. Enjoy your new companion!
