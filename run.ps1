# Start Python Agent
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd d:\Codes\orbit; .\venv\Scripts\activate; uvicorn agent.api.main:app --host 127.0.0.1 --port 8000 --reload"

# Start Electron App
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd d:\Codes\orbit\apps\desktop; npm run dev"
